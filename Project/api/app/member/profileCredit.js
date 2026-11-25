// Points and Quality Score for completed profiles, settled on the server.
//
// Until Nov 2026 both were paid from the browser: the Profiles page called PUT /api/v1/rewards for each completed
// profile and then wrote a new qualityScore with PUT /api/v1/me. The QA check found (BUG-06) header Points and the
// Reward balance staying at 0 while the Profiles page counted 390 points, and (BUG-07) the Quality Score going up by 2
// for one completed profile: two screens (and the page's own effect after a save) each ran the read-add-write in the
// browser, so the same profile was counted twice, and a payment the browser never made was never made at all.
//
// settleProfiles(req) runs on every read of the member's points (GET /me/points, /rewards, the engagement ledger):
//   - every profile that is 100% complete and has no Reward yet gets one (key "profile:<slug>", unique per member,
//     so two requests at once still pay once). A profile completed as a survey is paid by its response instead.
//   - every completed profile adds 1 to the Quality Score once. The profile's slug is added to User.qualityCredited
//     in the same atomic update that raises the score, so the score can never go up twice for one profile.
import mongoose from "mongoose";
import { Reward, Response, Profile, User, Answers } from "../model/index.js";
import profileController from "../controller/Profile.js";
import { withRequest } from "../utils/requestContext.js";
import { registerReconciler } from "../engagement/ledger.js";

export const DEFAULT_PROFILE_POINTS = 50;
const QUALITY_MAX = 200;
const QUALITY_DEFAULT = 100;
const slugOf = (s) => String(s ?? "").trim().toLowerCase();
const oid = (id) => new mongoose.Types.ObjectId(String(id));

async function completedSlugs(req) {
    const status = await withRequest(req, async () => {
        profileController.request = req;
        return profileController.status();
    });
    const map = status && !Array.isArray(status) ? status : {};
    return Object.entries(map).filter(([, v]) => Number(v) >= 100).map(([k]) => slugOf(k)).filter(Boolean);
}

async function payProfiles(uid, origin, done, actor) {
    const keys = done.map((s) => `profile:${s}`);
    const [have, responses, profiles] = await Promise.all([
        Reward.find({ user: uid, origin, key: { $in: keys } }).select("key").lean(),
        Response.find({ user: uid, origin, status: "complete", "survey.slug": { $in: done } }).select("survey.slug").lean(),
        Profile.find({ slug: { $in: done }, origin, isDeleted: { $ne: true } }).select("slug name points").lean(),
    ]);
    const paid = new Set(have.map((r) => r.key));
    const asSurvey = new Set(responses.map((r) => slugOf(r?.survey?.slug)));
    let n = 0;
    for (const slug of done) {
        const key = `profile:${slug}`;
        if (paid.has(key) || asSurvey.has(slug)) continue;
        const p = profiles.find((x) => slugOf(x.slug) === slug);
        const points = Number.isInteger(p?.points) ? p.points : DEFAULT_PROFILE_POINTS;
        const name = String(p?.name || slug).trim();
        const filter = { user: uid, key, origin };
        try {
            const r = await Reward.updateOne(filter, {
                $setOnInsert: {
                    ...filter, category: "profile", name, points,
                    remarks: `Profile completed: ${name} [profile:${slug}]`,
                    isActive: true, isDeleted: false,
                    created: { By: actor, From: "server" },
                },
            }, { upsert: true });
            if (r.upsertedCount) n += 1;
        } catch (e) {
            if (e?.code !== 11000) throw e; // paid by a parallel request
        }
    }
    return n;
}

// The browser used to keep the counted items in the answer "quality-credited". Those are carried over once, without
// raising the score again, so nothing counted before is counted a second time.
async function seedCredited(uid, origin) {
    const u = await User.findOne({ _id: uid, origin }).select("+qualityCredited").lean();
    if (!u) return null;
    if (Array.isArray(u.qualityCredited)) return u.qualityCredited;
    const a = await Answers.findOne({ user: String(uid), question: "quality-credited", origin }).select("+answer").lean();
    const legacy = [...new Set([].concat(a?.answer ?? []).map(slugOf).filter(Boolean))];
    await User.updateOne({ _id: uid, origin, qualityCredited: { $exists: false } }, { $set: { qualityCredited: legacy } });
    const again = await User.findOne({ _id: uid, origin }).select("+qualityCredited").lean();
    return again?.qualityCredited || legacy;
}

async function creditQuality(uid, origin, keys) {
    const counted = await seedCredited(uid, origin);
    if (!counted) return 0;
    let n = 0;
    for (const k of keys.filter((x) => !counted.includes(x))) {
        // one atomic update per item: the filter only matches while the item is not counted yet
        const r = await User.updateOne(
            { _id: uid, origin, qualityCredited: { $ne: k } },
            [{
                $set: {
                    qualityScore: { $min: [QUALITY_MAX, { $add: [{ $ifNull: ["$qualityScore", QUALITY_DEFAULT] }, 1] }] },
                    qualityCredited: { $concatArrays: [{ $ifNull: ["$qualityCredited", []] }, [k]] },
                },
            }],
        );
        if (r.modifiedCount) n += 1;
    }
    return n;
}

// Quality items: each completed profile once (key = its slug) and each other completed survey once
// (key = "survey:<slug>"). A profile answered as a survey card is the same item as the profile: the browser used to
// count it as both "<slug>" and "survey:<slug>", which was one of the ways a single completion added 2.
async function qualityKeys(uid, origin, done) {
    const [responses, profiles] = await Promise.all([
        Response.find({ user: uid, origin, status: "complete", isDeleted: { $ne: true } }).select("survey.slug").lean(),
        Profile.find({ origin, isDeleted: { $ne: true } }).select("slug").lean(),
    ]);
    const profileSlugs = new Set(profiles.map((p) => slugOf(p.slug)));
    const keys = new Set(done);
    for (const r of responses) {
        const s = slugOf(r?.survey?.slug);
        if (!s) continue;
        keys.add(profileSlugs.has(s) ? s : `survey:${s}`);
    }
    return [...keys];
}

// one run at a time per member, and not again within a few seconds (several screens read the points together)
const recent = new Map();
const SETTLE_MS = 3000;

export async function settleProfiles(req, { force = false } = {}) {
    if (!req?.user?._id || !req.origin) return { paid: 0, quality: 0 };
    const k = `${req.origin}:${req.user._id}`;
    const r = recent.get(k);
    if (r && (r.pending || (!force && Date.now() - r.at < SETTLE_MS))) return r.pending || r.result;
    const pending = (async () => {
        try {
            const done = await completedSlugs(req);
            const uid = oid(req.user._id);
            const paid = done.length ? await payProfiles(uid, req.origin, done, req.user._id) : 0;
            const quality = await creditQuality(uid, req.origin, await qualityKeys(uid, req.origin, done));
            return { paid, quality };
        } catch (e) {
            console.error("settleProfiles failed:", e.message);
            return { paid: 0, quality: 0 };
        }
    })();
    recent.set(k, { pending, at: Date.now() });
    const result = await pending;
    recent.set(k, { result, at: Date.now() });
    if (recent.size > 5000) for (const [key, v] of recent) if (Date.now() - v.at > SETTLE_MS) recent.delete(key);
    return result;
}

// The same, for a member the server knows only by id (the engagement ledger's reconcilers get (user, origin)).
export const settleProfilesFor = (user, origin) => settleProfiles({ user: { _id: String(user._id) }, origin, headers: {} });
registerReconciler(settleProfilesFor);

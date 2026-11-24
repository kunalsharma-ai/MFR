// Phase 4: referral tiers, live status per referral and the opt-in leaderboard.
//
// A referral is a member whose User.referredBy is the referrer's id (set at sign-up from the ?ref= link, as today).
// Its live status: joined -> verified (email) -> first survey finished. It "counts" toward tier bonuses once the first
// survey is finished on or after config.referrals.from. Bonuses are Reward entries (category "referral", key
// referral:tier:<count>), paid once each by a reconciler. Teens get neither tiers nor the leaderboard.
// Other members are only ever shown by first name and last initial; email addresses are never returned.
import mongoose from "mongoose";
import { User, Response, Invites, MemberPreference } from "../model/index.js";
import { config } from "./config.js";
import { grant, registerReconciler } from "./ledger.js";
import { isOn, scopeOf } from "./switches.js";
import { memberType } from "./http.js";
import { monthKey } from "./time.js";

const oid = (id) => new mongoose.Types.ObjectId(String(id));
const shortName = (u) => [u?.name?.first, u?.name?.last ? `${String(u.name.last).slice(0, 1)}.` : ""].filter(Boolean).join(" ").trim() || "Member";
const tierList = () => [...(config().referrals?.tiers || [])].filter((t) => t.count > 0).sort((a, b) => a.count - b.count);
export const tiersOn = (user) => (config().referrals?.audiences || []).includes(memberType(user));

// first finished survey per user, for a set of users
async function firstSurveys(userIds) {
    if (!userIds.length) return new Map();
    const rows = await Response.aggregate([
        { $match: { user: { $in: userIds.map(oid) }, status: "complete", isDeleted: false } },
        { $group: { _id: "$user", first: { $min: "$updatedAt" } } },
    ]);
    return new Map(rows.map((r) => [String(r._id), r.first]));
}

export async function referralsOf(user, origin) {
    const people = await User.find({ referredBy: String(user._id), origin, isDeleted: { $ne: true } }).select("name isVerified createdAt").sort({ createdAt: -1 }).limit(500).lean();
    const firsts = await firstSurveys(people.map((p) => p._id));
    const from = new Date(config().referrals?.from || 0);
    return people.map((p) => {
        const first = firsts.get(String(p._id)) || null;
        const verified = p?.isVerified?.email === "verified";
        return {
            id: String(p._id),
            name: shortName(p),
            joinedAt: p.createdAt,
            verified,
            firstSurveyAt: first,
            stage: first ? "first_survey" : verified ? "verified" : "joined",
            counts: Boolean(first && new Date(first) >= from),
        };
    });
}

export async function referralView(user, origin) {
    const list = await referralsOf(user, origin);
    // an invite is switched off (isActive false) when that address registers, so these are the ones still waiting
    const invites = await Invites.find({ invitedBy: String(user._id), origin, isActive: true, isDeleted: false }).select("email createdAt").sort({ createdAt: -1 }).limit(500).lean();
    const pending = invites.map((i) => ({ email: i.email, invitedAt: i.createdAt }));
    const counted = list.filter((x) => x.counts).length;
    const on = tiersOn(user);
    const tiers = on ? tierList() : [];
    const next = tiers.find((t) => t.count > counted) || null;
    return {
        counts: {
            invited: pending.length,
            joined: list.length,
            verified: list.filter((x) => x.verified).length,
            firstSurvey: list.filter((x) => x.stage === "first_survey").length,
            counted,
        },
        referrals: list,
        invited: pending,
        tiers: tiers.map((t) => ({ ...t, reached: counted >= t.count })),
        next: next ? { ...next, left: next.count - counted } : null,
        from: config().referrals?.from || null,
        tiersOn: on && tiers.length > 0,
        leaderboard: on && Boolean(config().referrals?.leaderboard?.enabled),
    };
}

registerReconciler(async (user, origin) => {
    if (!tiersOn(user)) return;
    if (!(await isOn(origin, "bonuses", scopeOf(user)))) return; // the brand's bonuses switch
    const tiers = tierList();
    if (!tiers.length) return;
    const counted = (await referralsOf(user, origin)).filter((x) => x.counts).length;
    for (const t of tiers) {
        if (counted >= t.count && t.points > 0) {
            await grant(user, origin, { category: "referral", key: `referral:tier:${t.count}`, name: `${t.count} friends joined`, points: t.points, remarks: `Referral bonus: ${t.count} friends finished their first survey` });
        }
    }
});

// ---- leaderboard: this month's counted referrals, opted-in adult members only ------------------------------------
const cache = new Map(); // origin:month -> {at, rows}
export async function leaderboard(user, origin, now = new Date()) {
    const lb = config().referrals?.leaderboard;
    if (!lb?.enabled || !tiersOn(user)) return null;
    const month = monthKey(now, "UTC");
    const key = `${origin}:${month}`;
    let hit = cache.get(key);
    if (!hit || Date.now() - hit.at > 5 * 60 * 1000) {
        const prefs = await MemberPreference.find({ origin, "leaderboard.optIn": true }).select("user").lean();
        const ids = prefs.map((p) => String(p.user));
        let rows = [];
        if (ids.length) {
            const refs = await User.find({ referredBy: { $in: ids }, origin, isDeleted: { $ne: true } }).select("_id referredBy").lean();
            const firsts = await firstSurveys(refs.map((r) => r._id));
            const from = new Date(config().referrals?.from || 0);
            const n = new Map();
            for (const r of refs) {
                const f = firsts.get(String(r._id));
                if (f && new Date(f) >= from && monthKey(f, "UTC") === month) n.set(r.referredBy, (n.get(r.referredBy) || 0) + 1);
            }
            const top = [...n.entries()].sort((a, b) => b[1] - a[1]);
            const users = await User.find({ _id: { $in: top.map(([id]) => oid(id)) }, isDeleted: { $ne: true } }).select("name category").lean();
            const byId = new Map(users.map((u) => [String(u._id), u]));
            rows = top.filter(([id]) => byId.has(id) && tiersOn(byId.get(id))).map(([id, count]) => ({ id, name: shortName(byId.get(id)), count }));
        }
        hit = { at: Date.now(), rows };
        cache.set(key, hit);
    }
    const pref = await MemberPreference.findOne({ user: oid(user._id), origin }).select("leaderboard").lean();
    const optedIn = Boolean(pref?.leaderboard?.optIn);
    let rank = 0, prev = null;
    const ranked = hit.rows.map((r, i) => { if (r.count !== prev) { rank = i + 1; prev = r.count; } return { ...r, rank }; });
    const me = ranked.find((r) => r.id === String(user._id)) || null;
    return {
        month,
        optedIn,
        top: ranked.slice(0, lb.size || 10).map((r) => ({ rank: r.rank, name: r.name, count: r.count, me: r.id === String(user._id) })),
        me: optedIn ? (me ? { rank: me.rank, count: me.count } : { rank: null, count: 0 }) : null,
    };
}
export const _clearLeaderboardCache = () => cache.clear();

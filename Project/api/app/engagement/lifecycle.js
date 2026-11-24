// v6 sign-up funnel reminders (mailer/lifecycle/case*.liquid), including Profile v4.1's every-2-days profile reminder.
//
//   case 1  registered, password never set                    -> "Set my password"         (transactional)
//   case 2  password set, terms not accepted                  -> "Accept and activate"     (transactional)
//   case 3  terms accepted, no profile complete yet            -> "Start my first profile"  (unsubscribe link)
//   case 4  some profiles complete, some still open            -> "Collect my next capsule" (unsubscribe link)
//
// Rules (same as Profile v4.1): OFF unless config.emails.lifecycle.enabled; at most one email every intervalHours;
// none while the member has been active in the last intervalHours; at most `max` in total; never for Teen Panel
// members (they have their own guardian-led emails, and these talk about money); the state is re-checked at send
// time, so a member who has moved on is never told they have not.
import mongoose from "mongoose";
import { User, Answers, Response, Reward, Profile, OTP, MemberPreference } from "../model/index.js";
import profileController from "../controller/Profile.js";
import otpController from "../controller/OTP.js";
import { config } from "./config.js";
import { isOn, onAnywhere } from "./switches.js";
import { memberType } from "./http.js";
import { send, unsubscribeLink, siteUrl } from "./mail.js";

const HOUR = 3600 * 1000;
// what the API really pays per completed profile (Kunal, 23 Nov 2026: keep 50 for now; v4.1 designs say 100)
export { DEFAULT_PROFILE_POINTS as POINTS_PER_PROFILE } from "../controller/Reward.js";
import { DEFAULT_PROFILE_POINTS as POINTS_PER_PROFILE } from "../controller/Reward.js";
export const CORE_SLUGS = ["basic", "educational", "professional", "financial"]; // same as web profiles/ps/profileRules.js
// Profile v4.1 arcade ranks (adults): Rookie, Player, Pro, Champion, Legend at 0 / 8 / 17 / 26 / 37 profiles
export const RANKS = [["Rookie", 0], ["Player", 8], ["Pro", 17], ["Champion", 26], ["Legend", 37]];

export const SUBJECTS = {
    "case1-password": (m) => `${m.first_name || "Your"}, your account is registered but not yet usable`,
    "case2-terms": (m) => `${m.first_name || "Your"}, one item is still outstanding on your account`,
    "case3-noprofiles": (m) => `${m.first_name ? `${m.first_name}, your` : "Your"} account is active — but matching cannot see you yet`,
    "case4-partial": (m, p) => `${m.first_name || "You"}, you are a ${p.rank} now — ${p.points} points banked`,
};

export function rankOf(done, total) {
    // the v4.1 thresholds are for 37 profiles; scale them for another total
    const scale = total > 0 ? total / 37 : 1;
    let i = 0;
    RANKS.forEach(([, at], k) => { if (done >= Math.round(at * scale)) i = k; });
    const next = RANKS[i + 1];
    return { rank: RANKS[i][0], index: i, next: next ? next[0] : null, toNext: next ? Math.max(0, Math.round(next[1] * scale) - done) : 0 };
}

const usd = (pts) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(pts * config().points.usdPerPoint);

// p.* merge fields for case 4 (see mailer/lifecycle/make-case4-dynamic.py)
export function progressFields(done, total, doneSlugs = []) {
    const left = Math.max(0, total - done);
    const points = done * POINTS_PER_PROFILE;
    const perDollar = Math.round(1 / config().points.usdPerPoint); // 1,000
    const toDollar = perDollar - (points % perDollar);
    const r = rankOf(done, total);
    const pct = Math.round(((points % perDollar) / perDollar) * 100);
    const n = (x) => new Intl.NumberFormat("en-US").format(x);
    return {
        per_profile: POINTS_PER_PROFILE,
        done, total, left, points: n(points),
        rank: r.rank, rank_index: r.index, next_rank: r.next, to_next_rank: r.toNext,
        core_done: CORE_SLUGS.every((s) => doneSlugs.includes(s)),
        to_dollar_points: n(toDollar), to_dollar_profiles: Math.ceil(toDollar / POINTS_PER_PROFILE),
        dollar_pct: pct, dollar_rest_pct: 100 - pct,
        left_points: n(left * POINTS_PER_PROFILE), left_usd: usd(left * POINTS_PER_PROFILE),
    };
}

// profiles complete for this member, out of the profiles of their category
export async function profileProgress(user, origin = user.origin) {
    profileController.request = { user: { _id: String(user._id), category: user.category }, origin };
    const status = (await profileController.status()) || {};
    const mine = await Profile.find({ origin, category: user.category, isActive: true, isDeleted: false }).select("slug").lean();
    const slugs = mine.map((p) => p.slug);
    const done = slugs.filter((s) => Number(status?.[s]) >= 100);
    return { done: done.length, total: slugs.length, doneSlugs: done };
}

async function lastActivity(user) {
    const u = new mongoose.Types.ObjectId(String(user._id));
    const [a, r, w] = await Promise.all([
        Answers.findOne({ user: u }).sort({ updatedAt: -1 }).select("updatedAt").lean(),
        Response.findOne({ user: u }).sort({ updatedAt: -1 }).select("updatedAt").lean(),
        Reward.findOne({ user: u }).sort({ createdAt: -1 }).select("createdAt").lean(),
    ]);
    return Math.max(new Date(user.updatedAt || 0).getTime(), new Date(a?.updatedAt || 0).getTime(), new Date(r?.updatedAt || 0).getTime(), new Date(w?.createdAt || 0).getTime());
}

const hasTerms = (u) => Array.isArray(u.terms) && u.terms.length > 0;

// Which case applies to this member right now (null = nothing to remind them of).
export async function caseOf(user) {
    if (memberType(user) === "teen") return null;
    const withPw = await User.findById(user._id).select("+password").lean();
    if (!withPw?.password) return { id: "case1-password" };
    if (!hasTerms(user)) return { id: "case2-terms" };
    const prog = await profileProgress(user, user.origin || withPw.origin);
    if (!prog.total) return null;
    if (prog.done === 0) return { id: "case3-noprofiles", prog };
    if (prog.done < prog.total) return { id: "case4-partial", prog };
    return null;
}

const consentPath = (category) => (String(category).startsWith("b2b") ? "/auth/consent/b2b" : "/auth/consent/consumer");

async function setPasswordLink(user) {
    // reuse the member's live code, or issue a fresh 24h one (the same code the registration email carries)
    const existing = await OTP.findOne({ user: user._id, channel: "email", origin: user.origin }).lean();
    if (existing && existing.expiresAt && new Date(existing.expiresAt) < new Date()) await OTP.deleteOne({ _id: existing._id });
    const otp = await otpController.generate(user._id, "email", user.origin, 24 * HOUR);
    return `${siteUrl(user.origin)}/set-password?user=${user._id}&code=${otp.code}`;
}

export async function payloadFor(user, c) {
    const site = siteUrl(user.origin);
    const utm = (k) => `utm_source=email&utm_medium=${k}`;
    const member = { first_name: user?.name?.first || "", email: user.mail, member_id: user.respondentID || String(user._id) };
    const data = {
        member,
        links: {
            profiles: `${site}/member/profiles?${utm(c.id)}`,
            account: `${site}/member/myaccount?${utm(c.id)}`,
            accept_terms: `${site}${consentPath(user.category)}?${utm(c.id)}`,
        },
        preferences_url: `${site}/member/settings`,
    };
    if (c.id === "case1-password") data.links.set_password = await setPasswordLink(user);
    if (c.id === "case3-noprofiles" || c.id === "case4-partial") data.unsubscribe_url = unsubscribeLink(user.origin, String(user._id), "lifecycle");
    if (c.id === "case3-noprofiles") {
        const total = c.prog.total;
        data.p = { total, per_profile: POINTS_PER_PROFILE, total_points: new Intl.NumberFormat("en-US").format(total * POINTS_PER_PROFILE), total_usd: usd(total * POINTS_PER_PROFILE), player_at: Math.round(8 * (total / 37)) || 1 };
    }
    if (c.id === "case4-partial") {
        data.p = progressFields(c.prog.done, c.prog.total, c.prog.doneSlugs);
        data.profile = { completed_count: c.prog.done, total_count: c.prog.total, percent_complete: Math.round((c.prog.done / c.prog.total) * 100) };
    }
    return data;
}

export async function runLifecycle({ dryRun = false, origin, now = new Date(), force = false } = {}) {
    const c = config().emails.lifecycle;
    const enabled = origin ? await isOn(origin, "email_lifecycle") : await onAnywhere("email_lifecycle");
    const report = { enabled, considered: 0, sent: 0, byCase: {}, skipped: {}, dryRun };
    if (!enabled && !force) return report;
    const skip = (why) => { report.skipped[why] = (report.skipped[why] || 0) + 1; };
    const q = { isActive: true, isDeleted: false, registrationStatus: { $in: ["active", null] }, createdAt: { $lte: new Date(now - c.startAfterHours * HOUR) } };
    if (origin) q.origin = origin;
    const cursor = User.find(q).select("name mail category timezone origin terms respondentID updatedAt createdAt").lean().cursor();
    for await (const user of cursor) {
        if (report.sent >= c.maxPerRun) break;
        report.considered += 1;
        if (memberType(user) === "teen") { skip("teen"); continue; }
        if (!force && !(await isOn(user.origin, "email_lifecycle"))) { skip("switched_off"); continue; }
        const prefs = await MemberPreference.findOne({ user: user._id, origin: user.origin }).lean();
        const st = prefs?.lifecycle || {};
        if ((st.count || 0) >= c.max) { skip("max_reached"); continue; }
        if (st.lastAt && now - new Date(st.lastAt) < c.intervalHours * HOUR) { skip("too_soon"); continue; }
        if (now - (await lastActivity(user)) < c.intervalHours * HOUR) { skip("active_recently"); continue; }
        const which = await caseOf(user);
        if (!which) { skip("nothing_to_do"); continue; }
        const marketing = which.id === "case3-noprofiles" || which.id === "case4-partial";
        if (marketing && (prefs?.notifications?.email === false || prefs?.notifications?.lifecycle === false)) { skip("opted_out"); continue; }
        report.byCase[which.id] = (report.byCase[which.id] || 0) + 1;
        if (dryRun) { report.sent += 1; continue; }
        const data = await payloadFor(user, which);
        const ok = await send({
            origin: user.origin,
            to: user.mail,
            category: "lifecycle",
            template: which.id,
            subject: SUBJECTS[which.id](data.member, data.p),
            data,
        });
        if (!ok) { skip("send_failed"); continue; }
        await MemberPreference.updateOne(
            { user: user._id, origin: user.origin },
            { $set: { "lifecycle.lastAt": now, "lifecycle.lastCase": which.id }, $inc: { "lifecycle.count": 1 }, $setOnInsert: { user: user._id, origin: user.origin } },
            { upsert: true }
        );
        report.sent += 1;
    }
    return report;
}

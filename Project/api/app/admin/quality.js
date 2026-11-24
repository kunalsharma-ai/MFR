// Quality (spec module 9) and referral fraud review (module 10), one brand at a time.
//
// The score is User.qualityScore (0-200, default 100). Every change an admin makes is logged as a QualityEvent with
// the rule, delta, before and after. Tiers come from engagement config and are shown read-only here.
// Referral fraud: MFR keeps no sign-up IP or device fingerprint, so the view groups what it does keep: members who
// share one payout destination, and referrers whose referrals mostly never verify or finish a survey.
import mongoose from "mongoose";
import { User, QualityEvent, Redemption, Response } from "../model/index.js";
import { tiers, tierOf, SCALE } from "../engagement/quality.js";
import { AdminError } from "./http.js";

const oid = (v) => new mongoose.Types.ObjectId(String(v));
const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v || ""));
const DEFAULT = 100;
const shortName = (u) => [u?.name?.first, u?.name?.last ? `${String(u.name.last)[0]}.` : ""].filter(Boolean).join(" ") || "Member";
export const RULES = ["speeding", "straightlining", "open_end_quality", "attention_check", "client_rejection", "duplicate_account", "manual_review", "restore"];

export function tierList() {
    return { scale: SCALE, default: DEFAULT, tiers: tiers() };
}

/** Members at or below a score, lowest first, with how many responses were rejected. */
export async function review(origin, { below = 60, category, page = 1 } = {}) {
    const max = Number(below);
    if (!Number.isFinite(max) || max < 0 || max > SCALE) throw new AdminError("invalid_value", `below is 0 to ${SCALE}`);
    const q = { origin, isDeleted: { $ne: true }, qualityScore: { $lte: max } };
    if (category) q.category = String(category).toLowerCase();
    const p = Math.max(1, Number(page) || 1);
    const [rows, total] = await Promise.all([
        User.find(q).select("name category qualityScore memberStatus").sort({ qualityScore: 1 }).skip((p - 1) * 100).limit(100).lean(),
        User.countDocuments(q),
    ]);
    const ids = rows.map((u) => u._id);
    const [rejected, last] = await Promise.all([
        Response.aggregate([{ $match: { origin, user: { $in: ids }, status: "rejected" } }, { $group: { _id: "$user", n: { $sum: 1 } } }]),
        QualityEvent.aggregate([{ $match: { origin, user: { $in: ids } } }, { $sort: { createdAt: -1 } }, { $group: { _id: "$user", rule: { $first: "$rule" }, at: { $first: "$createdAt" } } }]),
    ]);
    const rj = new Map(rejected.map((r) => [String(r._id), r.n]));
    const ev = new Map(last.map((r) => [String(r._id), r]));
    return {
        total, page: p,
        rows: rows.map((u) => ({ member: String(u._id), name: shortName(u), category: u.category, score: u.qualityScore, tier: tierOf(u.qualityScore).tier?.key || null, status: u.memberStatus || "active", rejectedResponses: rj.get(String(u._id)) || 0, lastRule: ev.get(String(u._id))?.rule || null, lastChangeAt: ev.get(String(u._id))?.at || null })),
    };
}

/** Change a member's score by a rule. The change and who made it go to QualityEvent. */
export async function changeScore(origin, memberId, { rule, delta, note, survey } = {}, actor) {
    if (!isId(memberId)) throw new AdminError("not_found", "Member not found", 404);
    if (!RULES.includes(rule)) throw new AdminError("invalid_value", `rule is one of ${RULES.join(", ")}`);
    const d = Number(delta);
    if (!Number.isInteger(d) || d === 0 || Math.abs(d) > SCALE) throw new AdminError("invalid_value", `delta is a whole number from -${SCALE} to ${SCALE}, not 0`);
    if (!note || String(note).trim().length < 5) throw new AdminError("reason_required", "A note is required");
    const u = await User.findOne({ _id: oid(memberId), origin, isDeleted: { $ne: true } }).select("qualityScore").lean();
    if (!u) throw new AdminError("not_found", "Member not found", 404);
    const from = Number.isFinite(Number(u.qualityScore)) && u.qualityScore !== null ? Number(u.qualityScore) : DEFAULT;
    const to = Math.max(0, Math.min(SCALE, from + d));
    // only write if nobody changed it in between
    const guard = u.qualityScore == null ? { $in: [null] } : from;
    const r = await User.updateOne({ _id: u._id, origin, qualityScore: guard }, { $set: { qualityScore: to } });
    if (!r.matchedCount) throw new AdminError("conflict", "The score changed meanwhile; reload and try again", 409);
    await QualityEvent.create({ origin, user: u._id, rule, delta: to - from, from, to, note: String(note).trim().slice(0, 500), survey: survey ? String(survey).slice(0, 80) : undefined, actor });
    return { before: { score: from }, after: { score: to }, tier: tierOf(to).tier?.key || null };
}

export async function history(origin, memberId) {
    if (!isId(memberId)) throw new AdminError("not_found", "Member not found", 404);
    const rows = await QualityEvent.find({ origin, user: oid(memberId) }).sort({ createdAt: -1 }).limit(200).lean();
    return rows.map((e) => ({ id: String(e._id), rule: e.rule, delta: e.delta, from: e.from, to: e.to, note: e.note || "", survey: e.survey || null, actor: e.actor, at: e.createdAt }));
}

/** Referral and payout patterns worth a look. Nothing here changes data. */
export async function referralFraud(origin, { minReferrals = 5 } = {}) {
    const min = Math.max(2, Math.min(1000, Number(minReferrals) || 5));
    const [byReferrer, sharedPayout] = await Promise.all([
        User.aggregate([
            { $match: { origin, isDeleted: { $ne: true }, referredBy: { $nin: [null, ""] } } },
            { $group: { _id: "$referredBy", referrals: { $sum: 1 }, verified: { $sum: { $cond: [{ $eq: ["$isVerified.email", "verified"] }, 1, 0] } }, ids: { $push: "$_id" } } },
            { $match: { referrals: { $gte: min } } },
            { $sort: { referrals: -1 } }, { $limit: 200 },
        ]),
        Redemption.aggregate([
            { $match: { origin, "payout.destination": { $nin: [null, ""] } } },
            { $group: { _id: { m: "$payout.method", d: { $toLower: "$payout.destination" } }, members: { $addToSet: "$user" }, masked: { $first: "$payout.masked" }, points: { $sum: "$points" } } },
            { $match: { "members.1": { $exists: true } } },
            { $sort: { points: -1 } }, { $limit: 200 },
        ]),
    ]);
    const finished = byReferrer.length ? await Response.aggregate([
        { $match: { origin, status: "complete", user: { $in: byReferrer.flatMap((r) => r.ids) } } },
        { $group: { _id: "$user" } },
    ]) : [];
    const done = new Set(finished.map((r) => String(r._id)));
    const refIds = byReferrer.map((r) => r._id).filter(isId);
    const names = new Map((await User.find({ _id: { $in: refIds.map(oid) }, origin }).select("name").lean()).map((u) => [String(u._id), shortName(u)]));
    return {
        signals: ["shared_payout", "referrals_without_activity"],
        notTracked: ["signup_ip", "device"],
        referrers: byReferrer.map((r) => {
            const active = r.ids.filter((i) => done.has(String(i))).length;
            return { member: r._id, name: names.get(String(r._id)) || null, referrals: r.referrals, verified: r.verified, finishedASurvey: active, inactiveShare: Math.round(((r.referrals - active) / r.referrals) * 100) };
        }),
        // the destination itself is never returned, only the masked form the member already sees
        sharedPayouts: sharedPayout.map((g) => ({ method: g._id.m, masked: g.masked || "•••", members: g.members.map(String), points: g.points })),
    };
}

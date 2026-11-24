// Phase 4: quality score tiers, breakdown, monthly trend, "score up" celebration and the surveys a higher score opens.
//
// The score itself is User.qualityScore (0-200, set by the quality team as today). Nothing here changes it. The
// breakdown shows the member's real figures for the things the Quality page already tells them help (finishing
// surveys, completing profiles, a verified email, being active); it does not claim to be the formula.
import mongoose from "mongoose";
import { User, Response, Survey, QualitySnapshot, MemberPreference } from "../model/index.js";
import { config } from "./config.js";
import { monthKey, dayKey, addDays } from "./time.js";
import { activeDays } from "./streak.js";
import { profileProgress } from "./lifecycle.js";

const oid = (id) => new mongoose.Types.ObjectId(String(id));
export const SCALE = 200;
const DEFAULT_SCORE = 100;

export function tiers() {
    return [...(config().quality?.tiers || [])].sort((a, b) => a.min - b.min);
}
export function tierOf(score) {
    const list = tiers();
    let i = 0;
    list.forEach((t, k) => { if (score >= t.min) i = k; });
    const tier = list[i] || null;
    const next = list[i + 1] || null;
    return { tier, index: i, next, toNext: next ? Math.max(0, next.min - score) : 0 };
}

async function scoreOf(user) {
    const u = await User.findById(user._id).select("qualityScore").lean();
    const s = Number(u?.qualityScore);
    return Number.isFinite(s) ? s : DEFAULT_SCORE;
}

// keeps one row per month: the first and the latest score seen in it
export async function snapshot(user, origin, score, now = new Date()) {
    const month = monthKey(now, user.timezone);
    const filter = { user: oid(user._id), month, origin };
    try {
        await QualitySnapshot.updateOne(filter, { $set: { score }, $setOnInsert: { ...filter, first: score, isActive: true, isDeleted: false } }, { upsert: true });
    } catch (e) { if (e?.code !== 11000) throw e; }
}

async function breakdown(user, origin) {
    const u = oid(user._id);
    const [rows, profiles, days, fresh] = await Promise.all([
        Response.aggregate([{ $match: { user: u, origin, isDeleted: false } }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
        profileProgress(user, origin).catch(() => null),
        activeDays(user, origin, 31),
        User.findById(user._id).select("isVerified").lean(),
    ]);
    const by = Object.fromEntries(rows.map((r) => [r._id || "invited", r.n]));
    const complete = by.complete || 0;
    const dropout = by.dropout || 0;
    const screened = (by.terminate || 0) + (by.overquota || 0);
    const started = complete + dropout + screened;
    const today = dayKey(new Date(), user.timezone);
    const from = addDays(today, -29);
    const active30 = [...days].filter((d) => d >= from && d <= today).length;
    const verified = fresh?.isVerified?.email === "verified";
    const factors = [
        { key: "finish", value: started ? Math.round((complete / Math.max(1, complete + dropout)) * 100) : null, unit: "%", detail: { complete, dropout }, good: dropout === 0 || complete / Math.max(1, complete + dropout) >= 0.8 },
        { key: "profiles", value: profiles ? profiles.done : null, of: profiles?.total ?? null, good: profiles ? profiles.done >= profiles.total : false },
        { key: "verified", value: verified, good: verified },
        { key: "active", value: active30, of: 30, good: active30 >= 8 },
    ];
    const tips = [];
    if (dropout > 0) tips.push({ key: "finish", href: "/member/surveys" });
    if (profiles && profiles.done < profiles.total) tips.push({ key: "profiles", href: "/member/profiles", left: profiles.total - profiles.done });
    if (!verified) tips.push({ key: "verified", href: "/member/myaccount" });
    if (active30 < 8) tips.push({ key: "active", href: "/member/dashboard" });
    tips.push({ key: "honest" });
    return { factors, tips, screened };
}

// active surveys in the member's category that need a higher score than theirs, grouped by the tier that opens them
async function locked(user, origin, score) {
    const list = await Survey.find({ origin, isActive: true, isDeleted: false, status: "active", category: user.category, minQualityScore: { $gt: score } }).select("minQualityScore").lean();
    const by = new Map();
    for (const s of list) {
        const t = tierOf(s.minQualityScore).tier;
        const k = t?.key || "higher";
        const cur = by.get(k) || { tier: k, label: t?.label || "", min: s.minQualityScore, surveys: 0 };
        cur.surveys += 1;
        cur.min = Math.min(cur.min, s.minQualityScore);
        by.set(k, cur);
    }
    return [...by.values()].sort((a, b) => a.min - b.min);
}

export async function qualityView(user, origin) {
    const score = await scoreOf(user);
    await snapshot(user, origin, score);
    const [b, history, pref, more] = await Promise.all([
        breakdown(user, origin),
        QualitySnapshot.find({ user: oid(user._id), origin }).sort({ month: -1 }).limit(12).lean(),
        MemberPreference.findOne({ user: oid(user._id), origin }).select("quality").lean(),
        locked(user, origin, score),
    ]);
    const t = tierOf(score);
    const seen = pref?.quality?.seenScore;
    let celebrate = null;
    if (seen == null) {
        await markSeen(user, origin, score); // first visit: nothing to celebrate yet
    } else if (score > seen) {
        const was = tierOf(seen);
        celebrate = { from: seen, to: score, tierUp: was.index < t.index ? t.tier : null };
    }
    return {
        score, scale: SCALE,
        tier: t.tier, next: t.next, toNext: t.toNext,
        tiers: tiers(),
        factors: b.factors, tips: b.tips,
        history: history.reverse().map((h) => ({ month: h.month, score: h.score })),
        unlocks: more,
        celebrate,
    };
}

export async function markSeen(user, origin, score) {
    const s = score ?? (await scoreOf(user));
    await MemberPreference.updateOne(
        { user: oid(user._id), origin },
        { $set: { "quality.seenScore": s, "quality.seenAt": new Date() }, $setOnInsert: { user: oid(user._id), origin, isActive: true, isDeleted: false } },
        { upsert: true }
    ).catch((e) => { if (e?.code !== 11000) throw e; });
    return { seenScore: s };
}

// Phase 7: My Account extras, the privacy centre, Web Push and the Teen guardian tab.
//
//  - account summary: profile strength, anniversary badges, lifetime stats, identity and payout details in one place
//  - privacy: download my data (JSON), ask for my account to be deleted (the team reviews and does it by hand)
//  - push: subscribe / unsubscribe a browser; pushTo() sends only when config.push is set up AND the `web-push`
//    package is installed, never in quiet hours, and only to members who switched push on
//  - guardian tab: who the Teen's parent or guardian is (masked) and what they can see and approve
import mongoose from "mongoose";
import {
    User, Answers, Response, Reward, Redemption, MemberPreference, StreakDay, TaskEntry, DataRequest, PushSubscription,
    TeenRegistration, TeenGuardian, Invites, PointsHold, QualitySnapshot, ExpertVerification,
} from "../model/index.js";
import { config } from "./config.js";
import { isOn } from "./switches.js";
import { ledger } from "./ledger.js";
import { streakOf } from "./streak.js";
import { profileProgress } from "./lifecycle.js";
import { inQuietHours } from "./time.js";
import { fail, isTeen, memberType } from "./http.js";
import { prefsOf } from "./points.routes.js";

const oid = (id) => new mongoose.Types.ObjectId(String(id));
const mask = (m = "") => String(m).replace(/^(.)(.*)(@.*)$/, (x, a, b, c) => `${a}${"•".repeat(Math.min(6, b.length))}${c}`);

// ---- My Account ------------------------------------------------------------------------------------------------------
export const ANNIVERSARIES = [1, 2, 3, 5, 10];
export function anniversary(createdAt, now = new Date()) {
    const c = new Date(createdAt);
    let years = now.getUTCFullYear() - c.getUTCFullYear();
    const before = now.getUTCMonth() < c.getUTCMonth() || (now.getUTCMonth() === c.getUTCMonth() && now.getUTCDate() < c.getUTCDate());
    if (before) years -= 1;
    years = Math.max(0, years);
    const next = new Date(Date.UTC(c.getUTCFullYear() + years + 1, c.getUTCMonth(), c.getUTCDate()));
    return {
        since: c, years,
        badges: ANNIVERSARIES.map((y) => ({ years: y, earned: years >= y })),
        nextAt: next, daysToNext: Math.ceil((next - now) / 86400000),
    };
}

export async function summary(user, origin) {
    const u = await User.findById(user._id).select("name mail phone address isVerified createdAt category timezone respondentID dob gender").lean();
    const [led, streak, prof, surveys, referrals, payouts] = await Promise.all([
        ledger(user, origin), streakOf(user, origin), profileProgress(user, origin).catch(() => null),
        Response.countDocuments({ user: oid(user._id), origin, status: "complete", isDeleted: false }),
        User.countDocuments({ referredBy: String(user._id), origin, isDeleted: { $ne: true } }),
        Redemption.find({ user: oid(user._id), origin, "payout.method": { $in: ["upi", "paypal"] } }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);
    const teen = isTeen(user);
    const a0 = u?.address?.[0] || {};
    // profile strength: each item is something the member can see and fix
    const items = [
        { key: "email", done: u?.isVerified?.email === "verified", href: "/member/myaccount" },
        { key: "phone", done: Boolean(u?.phone && String(u.phone).replace(/\D/g, "").length >= 7), href: "/member/myaccount" },
        { key: "location", done: Boolean(a0.country && (a0.city || a0.state)), href: "/member/myaccount" },
        { key: "profiles", done: prof ? prof.total > 0 && prof.done >= prof.total : false, progress: prof ? { done: prof.done, total: prof.total } : null, href: "/member/profiles" },
        { key: "survey", done: surveys > 0, href: "/member/surveys" },
    ];
    const weights = { email: 20, phone: 15, location: 15, profiles: 35, survey: 15 };
    let strength = 0;
    for (const i of items) {
        if (i.key === "profiles" && i.progress?.total) strength += Math.round((weights.profiles * i.progress.done) / i.progress.total);
        else if (i.done) strength += weights[i.key];
    }
    // last payout destination of each kind, masked (we keep none on file outside of reward requests)
    const seen = new Set();
    const methods = [];
    for (const r of payouts) {
        const k = r.payout?.method;
        if (!k || seen.has(k)) continue;
        seen.add(k);
        methods.push({ method: k, masked: r.payout?.masked || "", lastUsed: r.createdAt });
    }
    return {
        strength: Math.min(100, strength),
        items,
        anniversary: anniversary(u?.createdAt || new Date()),
        stats: {
            pointsEarned: led.balances.earned,
            pointsAvailable: led.balances.available,
            surveys,
            profiles: prof?.done ?? null,
            bestStreak: streak.best,
            referrals: teen ? null : referrals,
        },
        identity: {
            name: [u?.name?.first, u?.name?.last].filter(Boolean).join(" "),
            email: u?.mail || "",
            emailVerified: u?.isVerified?.email === "verified",
            phone: u?.phone || "",
            country: a0.country || "", city: a0.city || "",
            memberId: u?.respondentID || null,
            type: memberType(user),
        },
        payout: teen ? null : { methods, note: methods.length ? null : "none_yet" },
    };
}

// ---- privacy centre --------------------------------------------------------------------------------------------------
// Everything we hold about the member that they gave us or did, as JSON. Secrets (password, codes, tokens, internal
// notes) are left out.
export async function exportData(user, origin) {
    const u = oid(user._id);
    const [me, answers, responses, rewards, redemptions, prefs, streaks, entries, invites, holds, quality, expert, requests] = await Promise.all([
        User.findById(user._id).select("-password -otp -resetToken -__v").lean(),
        Answers.find({ user: String(user._id), origin }).select("+answer question createdAt updatedAt").lean(),
        Response.find({ user: u, origin }).select("survey status points loi createdAt updatedAt").lean(),
        Reward.find({ user: u, origin }).select("category key name points createdAt").lean(),
        Redemption.find({ user: u, origin }).select("reference item points status payout.method payout.masked createdAt fulfilledAt").lean(),
        MemberPreference.findOne({ user: u, origin }).lean(),
        StreakDay.find({ user: u, origin }).select("day sources").lean(),
        TaskEntry.find({ user: u, origin }).select("task choice text status createdAt").lean(),
        Invites.find({ invitedBy: String(user._id), origin }).select("email createdAt").lean(),
        PointsHold.find({ user: u, origin }).select("source reason memberNote expectedBy releasedAt outcome createdAt").lean(),
        QualitySnapshot.find({ user: u, origin }).select("month score").lean(),
        ExpertVerification.findOne({ user: u, origin }).select("status linkedin workDomain jobTitle createdAt decidedAt").lean(),
        DataRequest.find({ user: u, origin }).select("kind status reason createdAt").lean(),
    ]);
    const strip = (o) => { if (!o) return o; const x = { ...o }; for (const k of ["password", "otp", "code", "token", "hash", "adminNote", "__v"]) delete x[k]; return x; };
    return {
        exportedAt: new Date(),
        account: strip(me),
        profileAnswers: answers.map((a) => ({ question: a.question, answer: a.answer, updatedAt: a.updatedAt })),
        surveys: responses,
        rewardsAndBonuses: rewards,
        rewardRequests: redemptions,
        preferences: prefs ? { survey: prefs.survey, notifications: prefs.notifications, leaderboard: prefs.leaderboard, goal: prefs.goal } : null,
        activeDays: streaks.map((s) => s.day),
        pollsAndTasks: entries,
        invitationsSent: invites,
        pointsOnHold: holds,
        qualityScoreHistory: quality,
        expertVerification: expert,
        dataRequests: requests,
    };
}

export async function requestDelete(user, origin, reason) {
    try {
        const r = await DataRequest.create({ user: user._id, kind: "delete", reason: reason ? String(reason).slice(0, 500) : undefined, origin, history: [{ status: "requested", by: "member" }] });
        return view(r.toObject());
    } catch (e) {
        if (e?.code === 11000) fail("already", "We already have your request and are looking at it.", 409);
        throw e;
    }
}
export async function cancelDelete(user, origin) {
    const r = await DataRequest.findOneAndUpdate({ user: oid(user._id), origin, kind: "delete", open: true, status: "requested" }, { $set: { status: "cancelled", open: false }, $push: { history: { status: "cancelled", by: "member" } } }, { new: true }).lean();
    if (!r) fail("not_found", "There's no request waiting to cancel.", 404);
    return view(r);
}
export async function myRequests(user, origin) {
    return (await DataRequest.find({ user: oid(user._id), origin }).sort({ createdAt: -1 }).limit(10).lean()).map(view);
}
const view = (r) => ({ id: String(r._id), kind: r.kind, days: r.days ?? null, status: r.status, reason: r.reason || "", note: r.note || "", at: r.createdAt });

const NEXT = { requested: ["approved", "rejected"], approved: ["done", "rejected"] };
export async function adminDecide(admin, origin, id, b = {}) {
    const r = await DataRequest.findOne({ _id: id, origin });
    if (!r) fail("not_found", "No such request.", 404);
    if (!(NEXT[r.status] || []).includes(b.status)) fail("bad_state", `A ${r.status} request can't become ${b.status || "that"}.`, 409);
    r.status = b.status;
    if (["rejected", "done"].includes(b.status)) r.open = false;
    if (b.note !== undefined) r.note = String(b.note).slice(0, 300);
    if (b.adminNote !== undefined) r.adminNote = String(b.adminNote).slice(0, 1000);
    r.history.push({ status: b.status, by: `admin:${admin._id}` });
    await r.save();
    return view(r.toObject());
}

// ---- Web Push ----------------------------------------------------------------------------------------------------------
// push needs the VAPID keys in the config and the brand's "push" switch on
export const pushReady = async (origin) => Boolean(config().push?.vapidPublicKey && config().push?.vapidPrivateKey && (await isOn(origin, "push")));
export async function subscribe(user, origin, sub = {}, ua = "") {
    if (!(await pushReady(origin))) fail("closed", "Push notifications aren't switched on yet.", 409);
    const endpoint = String(sub.endpoint || "");
    if (!/^https:\/\/[^\s]{10,1000}$/.test(endpoint)) fail("validation", "That push subscription isn't valid.", 422);
    const keys = { p256dh: String(sub.keys?.p256dh || "").slice(0, 200), auth: String(sub.keys?.auth || "").slice(0, 100) };
    if (!keys.p256dh || !keys.auth) fail("validation", "That push subscription isn't valid.", 422);
    await PushSubscription.updateOne({ endpoint }, { $set: { user: oid(user._id), keys, ua: String(ua).slice(0, 300), origin, failures: 0, isActive: true, isDeleted: false } }, { upsert: true });
    return { subscribed: true };
}
export async function unsubscribe(user, origin, endpoint) {
    await PushSubscription.deleteOne({ endpoint: String(endpoint || ""), user: oid(user._id) });
    return { subscribed: false };
}

let webpush = null;
async function lib() {
    if (webpush !== null) return webpush;
    try {
        const pkg = "web-push"; // optional: only installed when push is switched on
        webpush = (await import(pkg)).default;
        const c = config().push;
        webpush.setVapidDetails(c.subject, c.vapidPublicKey, c.vapidPrivateKey);
    } catch (e) { webpush = false; }
    return webpush;
}
// {title, body, url}. Returns how many browsers it reached. Never throws.
export async function pushTo(userId, origin, payload) {
    try {
        if (!(await pushReady(origin))) return 0;
        const u = await User.findById(userId).select("timezone").lean();
        const p = await prefsOf({ _id: userId }, origin);
        if (!p?.notifications?.push || inQuietHours(p.notifications.quietHours, u?.timezone)) return 0;
        const w = await lib();
        if (!w) return 0;
        const subs = await PushSubscription.find({ user: oid(userId), origin }).lean();
        let ok = 0;
        for (const s of subs) {
            try {
                await w.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload), { TTL: 3600 });
                ok += 1;
                await PushSubscription.updateOne({ _id: s._id }, { $set: { lastOkAt: new Date(), failures: 0 } });
            } catch (e) {
                if (e?.statusCode === 404 || e?.statusCode === 410) await PushSubscription.deleteOne({ _id: s._id });
                else await PushSubscription.updateOne({ _id: s._id }, { $inc: { failures: 1 } });
            }
        }
        return ok;
    } catch (e) {
        console.error("push failed:", e.message);
        return 0;
    }
}

// ---- Teen guardian tab -------------------------------------------------------------------------------------------------
export async function guardianInfo(user, origin) {
    if (!isTeen(user)) fail("forbidden", "This is for Teen Panel members.", 403);
    const reg = await TeenRegistration.findOne({ teen: oid(user._id), origin }).sort({ createdAt: -1 }).lean();
    if (!reg) return { found: false };
    const g = await TeenGuardian.findById(reg.guardian).lean();
    return {
        found: Boolean(g),
        relation: g?.relation || null,
        firstName: g?.name?.first || "",
        email: g ? mask(g.email) : "",
        status: reg.status,
        decidedAt: reg.decision?.at || null,
        rewardsNeedOk: true,
        rewardsOpen: await isOn(origin, "teen_redemptions", { segment: "teen" }),
    };
}

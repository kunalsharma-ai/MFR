// Member engagement in the MADP console: everything a member sees in their own member area (survey records, points,
// streak, referrals, alerts, payout method), for one member of one brand (req.adminOrigin). Another brand's member is
// "not found". MADP checks the admin's permissions, asks for the reason and writes the audit entry.
//
// Reads never change anything: no ledger reconcile (that could grant points), no quality snapshot. Writes are the two a
// member can make themselves (alert settings) or that protect them (clear a payout method after a suspected takeover).
import mongoose from "mongoose";
import { User, Response, Redemption, TaskEntry, PushSubscription, Invites } from "../model/index.js";
import { entries as ledgerEntries, balances } from "../engagement/ledger.js";
import { streakOf } from "../engagement/streak.js";
import { referralsOf, tiersOn } from "../engagement/referrals.js";
import { prefsOf, sanitizePrefs, savePrefs } from "../engagement/points.routes.js";
import { profileProgress } from "../engagement/lifecycle.js";
import { isOn, scopeOf } from "../engagement/switches.js";
import { memberType } from "../engagement/http.js";
import { AdminError } from "./http.js";

export const RESPONSE_PAGE = 25;
const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v || ""));
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const isTeen = (u) => String(u.category || "").includes("minor");

function reasonOf(reason) {
    const r = String(reason || "").trim();
    if (r.length < 5) throw new AdminError("reason_required", "A reason is required");
    return r.slice(0, 500);
}

async function load(origin, id) {
    if (!isId(id)) throw new AdminError("not_found", "Member not found", 404);
    const u = await User.findOne({ _id: oid(id), origin, isDeleted: { $ne: true } })
        .select("+role name category timezone origin createdAt lastActivityAt paymentMethod.method memberStatus")
        .lean();
    if (!u || (u.role && u.role !== "respondent")) throw new AdminError("not_found", "Member not found", 404);
    return u;
}

/** Response row as the console shows it: no telemetry, no free text. */
export function responseRow(r) {
    return {
        id: String(r._id),
        survey: r.survey?.name || r.survey?.slug || null,
        slug: r.survey?.slug || null,
        status: r.status || "invited",
        points: r.points || 0,
        loi: r.loi || null,
        source: r.source || null,
        startedAt: r.timeline?.start || null,
        endedAt: r.timeline?.end || null,
        rating: r.rating ?? null,
    };
}

/** Everything on the member's dashboard, for the console's member engagement tab. */
export async function overview(origin, id) {
    const u = await load(origin, id);
    const teen = isTeen(u);
    const user = { _id: u._id, category: u.category, timezone: u.timezone, origin };
    const [list, streak, byStatus, lastResponse, prefs, people, pendingInvites, tasks, devices, payouts, prof, whatsapp] = await Promise.all([
        ledgerEntries(user, origin),
        streakOf(user, origin),
        Response.aggregate([
            { $match: { user: oid(id), origin, isDeleted: { $ne: true } } },
            { $group: { _id: "$status", n: { $sum: 1 }, points: { $sum: "$points" } } },
        ]),
        Response.findOne({ user: oid(id), origin, isDeleted: { $ne: true } }).sort({ updatedAt: -1 }).select("updatedAt").lean(),
        prefsOf(user, origin),
        teen ? [] : referralsOf(user, origin),
        teen ? 0 : Invites.countDocuments({ invitedBy: String(id), origin, isActive: true, isDeleted: false }),
        TaskEntry.aggregate([{ $match: { user: oid(id), origin } }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
        PushSubscription.countDocuments({ user: oid(id), origin }),
        teen ? [] : Redemption.find({ user: oid(id), origin, "payout.method": { $exists: true } }).sort({ createdAt: -1 }).limit(20).select("payout createdAt").lean(),
        profileProgress(user, origin).catch(() => null),
        isOn(origin, "whatsapp", scopeOf(user)).catch(() => false),
    ]);
    const surveys = Object.fromEntries(byStatus.map((s) => [s._id || "invited", s.n]));
    const ended = ["complete", "terminate", "quota_full", "quotafull"].reduce((a, k) => a + (surveys[k] || 0), 0);
    const seen = new Set();
    const methods = [];
    for (const r of payouts) {
        const k = r.payout?.method;
        if (!k || seen.has(k)) continue;
        seen.add(k);
        methods.push({ method: k, masked: r.payout?.masked || "", lastUsed: r.createdAt });
    }
    return {
        member: { id: String(u._id), type: memberType(u), teen, status: u.memberStatus || "active", joinedAt: u.createdAt, lastActivityAt: u.lastActivityAt || lastResponse?.updatedAt || null },
        surveys: {
            byStatus: surveys,
            completeRate: ended ? (surveys.complete || 0) / ended : null,
            points: byStatus.find((s) => s._id === "complete")?.points || 0,
        },
        points: balances(list),
        streak: { current: streak.current, best: streak.best, todayDone: streak.todayDone, since: streak.since || null, next: streak.next, strip: streak.strip },
        profiles: prof ? { done: prof.done, total: prof.total } : null,
        referrals: teen
            ? null
            : {
                tiersOn: tiersOn(u),
                invitedWaiting: pendingInvites,
                joined: people.length,
                verified: people.filter((p) => p.verified).length,
                firstSurvey: people.filter((p) => p.stage === "first_survey").length,
                counted: people.filter((p) => p.counts).length,
                people: people.slice(0, 50).map((p) => ({ id: p.id, name: p.name, joinedAt: p.joinedAt, stage: p.stage, counts: p.counts })),
            },
        tasks: Object.fromEntries(tasks.map((t) => [t._id || "submitted", t.n])),
        alerts: {
            notifications: prefs.notifications,
            survey: prefs.survey,
            leaderboard: prefs.leaderboard,
            pushDevices: devices,
            whatsappAvailable: Boolean(whatsapp),
        },
        payout: teen ? null : { current: u.paymentMethod?.method || null, used: methods },
    };
}

/** The member's survey records, newest first. Filter by status. */
export async function responses(origin, id, q = {}) {
    await load(origin, id);
    const f = { user: oid(id), origin, isDeleted: { $ne: true } };
    const status = String(q.status || "").trim().toLowerCase();
    if (/^[a-z_]{1,40}$/.test(status)) f.status = status;
    const page = Math.max(1, Math.min(10000, Number(q.page) || 1));
    const [total, rows] = await Promise.all([
        Response.countDocuments(f),
        Response.find(f).sort({ "timeline.start": -1, _id: -1 }).skip((page - 1) * RESPONSE_PAGE).limit(RESPONSE_PAGE)
            .select("survey timeline status loi source points rating").lean(),
    ]);
    return { total, page, size: RESPONSE_PAGE, items: rows.map(responseRow) };
}

/**
 * Change the member's alert settings, as they could themselves: e-mail, push, WhatsApp (only while the brand's
 * WhatsApp switch is on), quiet hours, invites per week. Teens' settings are changed from the Teen module.
 */
export async function setAlerts(origin, id, body = {}) {
    reasonOf(body.reason);
    const u = await load(origin, id);
    if (isTeen(u)) throw new AdminError("teen_member", "Teen accounts are changed from the Teen module.", 409);
    const user = { _id: u._id, category: u.category, origin };
    const current = await prefsOf(user, origin);
    const patch = sanitizePrefs({ notifications: body.notifications, survey: body.survey }, current, { whatsapp: await isOn(origin, "whatsapp", scopeOf(user)), sms: await isOn(origin, "sms", scopeOf(user)) });
    if (!Object.keys(patch).length) throw new AdminError("bad_request", "Nothing to change");
    const p = await savePrefs(user, origin, patch);
    return { notifications: p.notifications, survey: p.survey };
}

/**
 * Clear the saved payout method, for example after a suspected account takeover. The member chooses a new one at their
 * next reward request. Rewards already requested keep the destination they were requested with.
 */
export async function clearPayout(origin, id, body = {}) {
    reasonOf(body.reason);
    const u = await load(origin, id);
    if (isTeen(u)) throw new AdminError("teen_member", "Teen accounts have no payout method.", 409);
    const was = u.paymentMethod?.method || null;
    if (!was) return { cleared: false, was: null };
    await User.updateOne({ _id: u._id, origin }, { $set: { paymentMethod: { method: "", details: {} } } });
    return { cleared: true, was };
}

// Teen turning 18 (super admin spec module 13, approved by Kunal on 24 Nov 2026). Guardian consent ends at 18, so the
// member agrees to adult terms in their own name before anything else happens:
//   1. 30 days before the 18th birthday: an e-mail to the teen, copied to the guardian (switch email_turning18).
//   2. From the birthday: adultMove.stage = "turning_adult". Surveys, redemptions and guardian links pause, and the
//      member API answers 403 adult_terms_required until the move screen is done.
//   3. The member accepts Consumer or Business Professional terms and the privacy notice (POST /api/v1/teen/adult).
//   4. The move: points, level history and the member's own answers are kept; the parent-answered profile answers and
//      the guardian's details are deleted, guardian links stop, rewards waiting for the guardian are cancelled, and the
//      guardian is told their consent has ended (same switch).
//   5. Not accepted within 60 days: the account is closed, unspent points lapse (a ledger line), and a delete request
//      is opened for the team, who delete the teen data under the retention rule. Nothing is deleted here at close.
// Support can "move now" (the member agreed by another channel) or "close" from the MADP console, each with a reason.
import mongoose from "mongoose";
import { User, TeenRegistration, TeenGuardian, GuardianLink, Redemption, SegmentChange, Answers, PointsAdjustment, DataRequest } from "../model/index.js";
import { isOn } from "../engagement/switches.js";
import { entries, balances } from "../engagement/ledger.js";
import { PARENT_PROFILE_KEYS } from "./service.js";
import * as M from "./mail.js";

export const TEEN = "b2c-minor";
export const ADULT_SEGMENTS = ["b2c", "b2b"];
export const GRACE_DAYS = 60;
export const NOTICE_DAYS = 30;
export const ADULT_TERMS_VERSION = "ADULT-2026.11";
const DAY = 86400000;
const oid = (v) => new mongoose.Types.ObjectId(String(v));

export class AdultError extends Error {
    constructor(code, message, status = 400) { super(message); this.code = code; this.status = status; }
}
const fail = (code, message, status) => { throw new AdultError(code, message, status); };

export function eighteenth(dob) {
    const d = new Date(dob);
    if (isNaN(d)) return null;
    return new Date(Date.UTC(d.getUTCFullYear() + 18, d.getUTCMonth(), d.getUTCDate()));
}
/** The day the member turns 18 in their own time zone has begun (falls back to UTC). */
export function isEighteen(dob, timezone, now = new Date()) {
    const t = eighteenth(dob);
    if (!t) return false;
    let today = now.toISOString().slice(0, 10);
    try { if (timezone) today = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now); } catch { /* unknown zone: UTC */ }
    return today >= t.toISOString().slice(0, 10);
}
export const paused = (u) => u?.adultMove?.stage === "turning_adult";

async function latestReg(user, origin) {
    return TeenRegistration.findOne({ teen: user._id, origin }).sort({ createdAt: -1 });
}
async function guardianOf(reg) {
    return reg?.guardian ? TeenGuardian.findById(reg.guardian).lean() : null;
}

/** Step 2: start the move for one member who has turned 18. Idempotent. */
export async function startMove(user, origin, now = new Date()) {
    const r = await User.updateOne(
        { _id: user._id, origin, category: TEEN, "adultMove.stage": { $exists: false } },
        { $set: { "adultMove.stage": "turning_adult", "adultMove.since": now, "adultMove.deadline": new Date(now.getTime() + GRACE_DAYS * DAY) } }
    );
    if (r.modifiedCount) await GuardianLink.updateMany({ teen: user._id, origin, revokedAt: null }, { $set: { revokedAt: now } });
    return r.modifiedCount > 0;
}

/** Steps 3 and 4. `by` is "member" or "madp:<admin id>". */
export async function completeMove(userId, origin, { segment, by = "member", reason = "" } = {}) {
    if (!ADULT_SEGMENTS.includes(segment)) fail("bad_segment", "Choose Consumer or Business Professional.");
    const u = await User.findOne({ _id: oid(userId), origin }).select("category dob timezone name mail adultMove").lean();
    if (!u) fail("not_found", "Not found", 404);
    if (u.category !== TEEN) fail("not_teen", "This account is already an adult account.", 409);
    if (!isEighteen(u.dob, u.timezone)) fail("not_18", "The move happens once the member turns 18.", 409);
    const now = new Date();
    // only from the teen category that was read, so a double click moves the member once
    const moved = await User.updateOne(
        { _id: u._id, origin, category: TEEN },
        {
            $set: { category: segment, "adultMove.stage": "moved", "adultMove.acceptedAt": now, "adultMove.segment": segment, "adultMove.termsVersion": ADULT_TERMS_VERSION, "adultMove.by": by, "adultMove.since": u.adultMove?.since || now },
            $unset: { parent: "" },
            $addToSet: { terms: { $each: ["terms", "privacy"] } },
        }
    );
    if (!moved.modifiedCount) fail("conflict", "The account was already moved.", 409);
    await SegmentChange.create({ origin, user: u._id, from: TEEN, to: segment, reason: `turned 18${reason ? `: ${reason}` : ", accepted adult terms"}`.slice(0, 500), actor: by });
    await GuardianLink.updateMany({ teen: u._id, origin, revokedAt: null }, { $set: { revokedAt: now } });
    const cancelled = await Redemption.updateMany(
        { user: u._id, origin, status: "guardian_pending" },
        { $set: { status: "cancelled", open: false, note: "Cancelled when your account moved to an adult account. Your points are back." }, $push: { history: { status: "cancelled", by, at: now } } }
    );
    // parent-answered profile data (Your home, Work and income), stored under the lower-case key (older: upper case)
    const keys = PARENT_PROFILE_KEYS.flatMap((k) => [k, k.toLowerCase(), `${k}__other`, `${k.toLowerCase()}__other`]);
    const answers = await Answers.deleteMany({ user: String(u._id), origin, question: { $in: keys } });

    // the guardian: tell them (switch), then delete their details unless they are still guardian of another teen
    const reg = await latestReg(u, origin);
    const g = await guardianOf(reg);
    let guardianDeleted = false, guardianNotified = false;
    if (g) {
        if (reg && (await isOn(origin, "email_turning18"))) {
            guardianNotified = await M.send(reg, "guardian-consent-ended", "guardian", g.email, { teen: { firstName: u.name?.first }, guardian: { firstName: g.name?.first } }, origin);
        }
        const others = await TeenRegistration.countDocuments({ guardian: g._id, teen: { $ne: u._id }, status: { $nin: ["cancelled", "rejected"] } });
        if (!others) { await TeenGuardian.deleteOne({ _id: g._id }); guardianDeleted = true; }
        if (reg) { reg.history.push({ status: reg.status, at: now, by: "system", note: `turned 18, moved to ${segment}` }); await reg.save(); }
    }
    return { moved: true, segment, rewardRequestsCancelled: cancelled.modifiedCount, parentAnswersDeleted: answers.deletedCount, guardianDeleted, guardianNotified };
}

/** Step 5, or support's "close". Points lapse; a delete request goes to the team. */
export async function closeAccount(userId, origin, { by = "system", reason = "" } = {}) {
    const u = await User.findOne({ _id: oid(userId), origin }).select("category adultMove").lean();
    if (!u) fail("not_found", "Not found", 404);
    if (u.category !== TEEN || u.adultMove?.stage !== "turning_adult") fail("bad_state", "Only an account waiting to accept adult terms can be closed here.", 409);
    const now = new Date();
    const r = await User.updateOne(
        { _id: u._id, origin, "adultMove.stage": "turning_adult" },
        { $set: { "adultMove.stage": "closed", "adultMove.closedAt": now, "adultMove.by": by, memberStatus: "closed", statusReason: "Turned 18 and did not accept the adult terms", statusChangedAt: now, isActive: false } }
    );
    if (!r.modifiedCount) fail("conflict", "Already closed.", 409);
    const { available } = balances(await entries({ _id: u._id, category: TEEN }, origin));
    if (available > 0) {
        await PointsAdjustment.create({ origin, user: u._id, points: -available, reasonCode: "lapsed", note: "Unspent points lapsed: adult terms not accepted within 60 days of turning 18", status: "applied", requestedBy: by, decidedBy: by, decidedAt: now });
    }
    await GuardianLink.updateMany({ teen: u._id, origin, revokedAt: null }, { $set: { revokedAt: now } });
    const open = await DataRequest.findOne({ user: u._id, origin, open: true }).lean();
    if (!open) {
        await DataRequest.create({ origin, user: u._id, kind: "delete", status: "requested", reason: `Teen turned 18, adult terms not accepted${reason ? `: ${reason}` : ""}`.slice(0, 500), note: "Your account was closed because the adult terms were not accepted.", history: [{ status: "requested", by }] });
    }
    return { closed: true, pointsLapsed: available, deleteRequestOpened: !open };
}

/** The daily job: notices, starts and closes. dryRun reports what it would do. */
export async function sweepAdult({ now = new Date(), dryRun = false } = {}) {
    const report = { noticed: 0, started: 0, closed: 0, noticeSkippedSwitchOff: 0 };
    // 1. 30-day notice: 18th birthday within NOTICE_DAYS, not yet noticed, not yet started
    const limit = new Date(now.getTime() + NOTICE_DAYS * DAY); limit.setUTCFullYear(limit.getUTCFullYear() - 18);
    const soon = await User.find({ category: TEEN, isDeleted: { $ne: true }, dob: { $lte: limit }, "adultMove.notifiedAt": { $exists: false }, "adultMove.stage": { $exists: false } }).select("origin dob timezone name mail").limit(1000).lean();
    for (const u of soon) {
        if (isEighteen(u.dob, u.timezone, now)) continue;
        if (!(await isOn(u.origin, "email_turning18"))) { report.noticeSkippedSwitchOff += 1; continue; }
        report.noticed += 1;
        if (dryRun) continue;
        const reg = await latestReg(u, u.origin);
        if (!reg) continue;
        const g = await guardianOf(reg);
        const data = { teen: { firstName: u.name?.first }, turns18: eighteenth(u.dob).toISOString().slice(0, 10) };
        const ok = await M.send(reg, "teen-turning-18", "teen", u.mail, data, u.origin);
        if (g?.email) await M.send(reg, "teen-turning-18", "guardian", g.email, data, u.origin);
        await reg.save();
        if (ok) await User.updateOne({ _id: u._id }, { $set: { "adultMove.notifiedAt": now } });
    }
    // 2. birthday reached: start the move
    const adultLimit = new Date(now.getTime() + DAY); adultLimit.setUTCFullYear(adultLimit.getUTCFullYear() - 18);
    const due = await User.find({ category: TEEN, isDeleted: { $ne: true }, dob: { $lte: adultLimit }, "adultMove.stage": { $exists: false } }).select("origin dob timezone").limit(1000).lean();
    for (const u of due) {
        if (!isEighteen(u.dob, u.timezone, now)) continue;
        report.started += 1;
        if (!dryRun) await startMove(u, u.origin, now);
    }
    // 5. deadline passed: close
    const late = await User.find({ category: TEEN, "adultMove.stage": "turning_adult", "adultMove.deadline": { $lte: now } }).select("origin").limit(1000).lean();
    for (const u of late) {
        report.closed += 1;
        if (!dryRun) await closeAccount(u._id, u.origin, { by: "system" });
    }
    return report;
}

/** What the member's move screen shows. */
export function view(u) {
    const m = u?.adultMove || {};
    return { stage: m.stage || null, since: m.since || null, deadline: m.deadline || null, segments: ADULT_SEGMENTS, termsVersion: ADULT_TERMS_VERSION };
}

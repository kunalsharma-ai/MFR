// Member actions in the MADP console (Members module): e-mail a password reset link, send the welcome e-mail again,
// and log in as the member. One brand at a time (req.adminOrigin); another brand's member is "not found". MADP checks
// the admin's permissions, asks for the reason and writes the audit entry.
//
// E-mail: nothing goes out unless the email_admin_actions switch is on for the brand (off by default, and the brand's
// kill switch turns it off too). While it is off, the answer says what would be sent (template, masked address, brand).
// The console never sees or sets a password: the reset is the member's own forgot-password link, an e-mailed code that
// a member gets 5 wrong guesses at (controller/OTP.js).
//
// Log in as member: a one-use ticket, opened on the member site within REDEEM_MINUTES, gives a member session that
// ends SESSION_MINUTES after the ticket was issued. The session token is marked as an admin session (claim adm), and
// the member API refuses what an admin session may not do (utils/adminSession.js). Teens and panel admins are refused.
import crypto from "node:crypto";
import mongoose from "mongoose";
import { User, AdminSession, OTP } from "../model/index.js";
import { OTP as otpController } from "../controller/index.js";
import { isOn } from "../engagement/switches.js";
import { welcomeMessage, resetMessage, sendNow } from "../engagement/transactional.js";
import { siteUrl } from "../engagement/mail.js";
import { lockedFor, fail, norm } from "../utils/throttle.js";
import { maskEmail } from "./mask.js";
import { AdminError } from "./http.js";

export const SESSION_MINUTES = 15;
export const REDEEM_MINUTES = 2;
export const SWITCH = "email_admin_actions";
const RESET_VALID_MS = 24 * 60 * 60 * 1000; // the same as the member's own forgot-password link
const MIN = 60 * 1000;

const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v || ""));
const isTeen = (u) => String(u.category || "").includes("minor");
const statusOf = (u) => u.memberStatus || "active";
export const hashTicket = (t) => crypto.createHash("sha256").update(String(t)).digest("hex");

function reasonOf(reason) {
    const r = String(reason || "").trim();
    if (r.length < 5) throw new AdminError("reason_required", "A reason is required");
    return r.slice(0, 500);
}

async function load(origin, id, { password = false } = {}) {
    if (!isId(id)) throw new AdminError("not_found", "Member not found", 404);
    const q = User.findOne({ _id: new mongoose.Types.ObjectId(String(id)), origin, isDeleted: { $ne: true } }).select(password ? "+role +password" : "+role");
    const u = await q.lean();
    if (!u) throw new AdminError("not_found", "Member not found", 404);
    return u;
}

function mustBeOpen(u, what) {
    if (isTeen(u)) throw new AdminError("teen_member", `Teen accounts can't be ${what} from here. Use the Teen module.`, 409);
    if (["suspended", "banned", "closed"].includes(statusOf(u))) throw new AdminError("not_active", `This member is ${statusOf(u)}`, 409);
    if (!u.mail) throw new AdminError("no_email", "This member has no e-mail address", 409);
}

const preview = (m) => ({ template: `${m.category}/${m.template}`, to: maskEmail(m.to), brand: m.origin, subject: m.subject });

/** E-mail the member's own forgot-password link. Dry unless the switch is on. */
export async function resetPassword(origin, id, reason) {
    reasonOf(reason);
    const u = await load(origin, id);
    mustBeOpen(u, "reset");
    const wouldSend = preview(resetMessage(u, origin, null));
    if (!(await isOn(origin, SWITCH))) return { sent: false, switch: SWITCH, wouldSend };
    // the same limit as the member's own form: 3 reset e-mails an hour to one address
    const key = `reset:${origin}:${norm(u.mail)}`;
    const wait = await lockedFor(key);
    if (wait) throw new AdminError("too_many", `Three reset e-mails went to this member in the last hour. Try again in ${wait} minutes.`, 429);
    await fail(key, { max: 3, windowMin: 60, lockMin: 60 });
    // a lapsed code would make a dead link
    await OTP.deleteMany({ user: u._id, channel: "email", origin, expiresAt: { $lt: new Date() } });
    const otp = await otpController.generate(u._id, "email", origin, RESET_VALID_MS);
    const sent = await sendNow(resetMessage(u, origin, otp));
    return { sent, switch: SWITCH, wouldSend };
}

/** Send the "account active" welcome again. Only for members who have set a password. Dry unless the switch is on. */
export async function resendWelcome(origin, id, reason) {
    reasonOf(reason);
    const u = await load(origin, id, { password: true });
    mustBeOpen(u, "sent the adult welcome");
    if (!u.password) throw new AdminError("no_password", "This member hasn't set a password yet. Send a password reset link instead.", 409);
    const m = welcomeMessage(u, origin);
    const wouldSend = preview(m);
    if (!(await isOn(origin, SWITCH))) return { sent: false, switch: SWITCH, wouldSend };
    const key = `welcome:${origin}:${String(u._id)}`;
    const wait = await lockedFor(key);
    if (wait) throw new AdminError("too_many", `The welcome e-mail went to this member three times in the last day. Try again in ${wait} minutes.`, 429);
    await fail(key, { max: 3, windowMin: 24 * 60, lockMin: 24 * 60 });
    const sent = await sendNow(m);
    return { sent, switch: SWITCH, wouldSend };
}

/** A one-use ticket for "log in as member". The link is shown to the admin once and never stored. */
export async function loginAs(origin, id, reason, actor) {
    const why = reasonOf(reason);
    const u = await load(origin, id);
    if (isTeen(u)) throw new AdminError("teen_member", "Admins can't sign in as a teen member", 409);
    if (["administrator", "admin", "superadmin", "root"].includes(String(u.role || "").toLowerCase()))
        throw new AdminError("admin_member", "This account is a panel admin. Admins can't sign in as another admin.", 409);
    if (["suspended", "banned", "closed"].includes(statusOf(u))) throw new AdminError("not_active", `This member is ${statusOf(u)}`, 409);
    const ticket = crypto.randomBytes(32).toString("base64url");
    const now = Date.now();
    const s = await AdminSession.create({
        origin, user: u._id, actor: String(actor || ""), reason: why, hash: hashTicket(ticket),
        redeemBy: new Date(now + REDEEM_MINUTES * MIN), expiresAt: new Date(now + SESSION_MINUTES * MIN),
    });
    return {
        sessionId: String(s._id),
        url: `${siteUrl(origin)}/api/v1/user/admin-session?ticket=${ticket}`,
        redeemBy: s.redeemBy,
        expiresAt: s.expiresAt,
        refused: ["password", "e-mail address", "guardian details", "payout details", "redeeming rewards and spending points", "invitations to friends", "account deletion"],
    };
}

/** The member's admin sessions, newest first (no tickets). */
export async function sessions(origin, id) {
    const u = await load(origin, id);
    const rows = await AdminSession.find({ origin, user: u._id }).sort({ createdAt: -1 }).limit(20).lean();
    const now = new Date();
    return {
        items: rows.map((r) => ({
            id: String(r._id), actor: r.actor, reason: r.reason, issuedAt: r.createdAt, usedAt: r.usedAt || null,
            expiresAt: r.expiresAt, endedAt: r.endedAt || null,
            state: r.endedAt ? "ended" : r.expiresAt <= now ? "expired" : r.usedAt ? "open" : r.redeemBy <= now ? "unused" : "waiting",
        })),
    };
}

/** End an admin session early (or cancel a ticket nobody has opened yet). */
export async function endSession(origin, id, sessionId, actor) {
    const u = await load(origin, id);
    if (!isId(sessionId)) throw new AdminError("not_found", "Session not found", 404);
    const r = await AdminSession.findOneAndUpdate(
        { _id: sessionId, origin, user: u._id, endedAt: null },
        { $set: { endedAt: new Date(), endedBy: String(actor || "") } },
        { new: true },
    ).lean();
    if (!r) throw new AdminError("not_found", "No open session with that id", 404);
    return { id: String(r._id), endedAt: r.endedAt };
}

/** Member site side: swap a ticket for its session, once. Returns null when the ticket is unknown, used or late. */
export async function redeem(origin, ticket) {
    if (typeof ticket !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(ticket)) return null;
    const now = new Date();
    const s = await AdminSession.findOneAndUpdate(
        { hash: hashTicket(ticket), origin, usedAt: null, endedAt: null, redeemBy: { $gt: now } },
        { $set: { usedAt: now } },
        { new: true },
    ).lean();
    if (!s) return null;
    const u = await User.findOne({ _id: s.user, origin, isDeleted: { $ne: true } }).select("+role").lean();
    if (!u || isTeen(u) || ["suspended", "banned", "closed"].includes(statusOf(u)) || ["administrator", "admin", "superadmin", "root"].includes(String(u.role || "").toLowerCase())) {
        await AdminSession.updateOne({ _id: s._id }, { $set: { endedAt: now, endedBy: "system" } });
        return null;
    }
    return { session: s, user: u };
}

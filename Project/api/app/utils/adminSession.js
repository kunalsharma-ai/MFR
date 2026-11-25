// Member sessions opened by an admin with "log in as member" (admin/memberactions.js). The token carries
// adm: { sid, by }; sid names the AdminSession row, which must still be open on every request.
//
// What an admin session can't do, whatever the route says (the member's own session can):
//   - change the password, the e-mail address or the guardian's details
//   - change payout details (paymentMethod, on any route)
//   - redeem rewards or spend points (redemptions and their cancelling, draw tickets, prize machine plays)
//   - e-mail a friend an invitation in the member's name
//   - answer profile questions or surveys for the member, claim points, or download the member's full data
//   - on MyHealthOpinions, read any answers (special-category health data)
//   - ask for the account to be deleted
//   - use any admin-only route, even when the member is also a panel admin
import { AdminSession } from "../model/index.js";

const BLOCKED = [
    ["PATCH", /^\/api\/v1\/me\/?$/], // password change
    ["*", /^\/api\/v1\/me\/change-email/],
    ["*", /^\/api\/v1\/change-email/],
    ["*", /^\/api\/v1\/forgot-password/],
    ["PATCH", /^\/api\/v1\/me\/payment-method/],
    ["PATCH", /^\/api\/v1\/me\/parent-details/],
    ["PATCH", /^\/api\/v1\/user\/?$/], // set a password with an e-mailed code
    ["POST", /^\/api\/v1\/engagement\/rewards\/redeem/],
    ["POST", /^\/api\/v1\/engagement\/rewards\/redemptions\/[^/]+\/cancel/],
    ["POST", /^\/api\/v1\/me\/invite/], // e-mails a friend in the member's name
    ["POST", /^\/api\/v1\/engagement\/draws\/[^/]+\/enter/],
    ["POST", /^\/api\/v1\/engagement\/prize-machine\/play/],
    ["POST", /^\/api\/v1\/engagement\/privacy\/delete\/?$/],
    ["*", /^\/api\/v1\/teen\/password/],
    // no answering or survey taking on the member's behalf, no points for it, and no full data download
    ["PATCH", /^\/api\/v1\/me\/answer/],
    ["PATCH", /^\/api\/v1\/me\/profile/],
    ["PUT", /^\/api\/v1\/me\/survey/],
    ["PATCH", /^\/api\/v1\/me\/survey/],
    ["PUT", /^\/api\/v1\/rewards\/?$/],
    ["GET", /^\/api\/v1\/engagement\/privacy\/export/],
];
// MyHealthOpinions answers are special-category health data: an admin session there reads no answers at all.
const HEALTH_BLOCKED = [
    ["POST", /^\/api\/v1\/me\/?$/], // the member's answers to the questions named in the body
    ["*", /^\/api\/v1\/profile\/[^/]+/],
    ["POST", /^\/api\/v1\/profile\/?$/],
    ["*", /^\/api\/v1\/user\/[^/]+\/profile-data/],
    ["*", /^\/api\/v1\/answers/],
];
export const isHealthBrand = (origin) => String(origin || "").toLowerCase().includes("myhealthopinions");

// Express matches routes without regard to case and decodes nothing here, so compare a lower-cased path with
// repeated slashes folded.
const pathOf = (req) => { let p = String(req.originalUrl || req.url || "").split("?")[0]; try { p = decodeURIComponent(p); } catch { /* keep raw */ } return p.toLowerCase().replace(/\/{2,}/g, "/"); };

/** Why this request is refused in an admin session, or null when it may go ahead. */
export function refused(req) {
    const p = pathOf(req);
    const m = String(req.method || "GET").toUpperCase();
    const hit = (list) => list.some(([method, re]) => (method === "*" || method === m) && re.test(p));
    if (hit(BLOCKED)) return "This can't be done while an admin is signed in as the member.";
    if (isHealthBrand(req.origin) && hit(HEALTH_BLOCKED)) return "Health answers are not shown while an admin is signed in as the member.";
    const b = req.body;
    if (b && typeof b === "object" && ["paymentMethod", "password", "newPassword"].some((k) => Object.prototype.hasOwnProperty.call(b, k)) && m !== "GET")
        return "Payout details and the password can't be changed while an admin is signed in as the member.";
    return null;
}

/** The open AdminSession for these token claims, or null when it has ended, expired or belongs elsewhere. */
export async function openSession(claims, origin) {
    const sid = String(claims?.adm?.sid || "");
    if (!/^[a-f0-9]{24}$/i.test(sid)) return null;
    const s = await AdminSession.findOne({ _id: sid, origin }).lean();
    if (!s || !s.usedAt || s.endedAt || new Date(s.expiresAt) <= new Date() || String(s.user) !== String(claims._id)) return null;
    return { id: String(s._id), actor: s.actor, expiresAt: s.expiresAt };
}

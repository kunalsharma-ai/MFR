// The member's own sign-ins (issue #112). See model/MemberSession.js.
//   start(req, user, method)  a row for a new log in; returns the sid to put in the token
//   check(claims, origin)     null when the token's session has ended (the request is refused), else the row
//   list / end / endOthers    Settings > Privacy & security > Sessions
import crypto from "node:crypto";
import mongoose from "mongoose";
import { MemberSession } from "../model/index.js";
import { clientIp } from "./security.js";

export const SESSION_DAYS = 7; // the login token's own lifetime (utils/token.js default "7d")
const TOUCH_MS = 5 * 60 * 1000; // lastSeenAt is written at most every 5 minutes
const oid = (id) => new mongoose.Types.ObjectId(String(id));
const key = () => process.env.SIGNUP_FINGERPRINT_SECRET || `fingerprint:${process.env.JWT_SECRET || ""}`;

/** "Chrome · Windows" from the user-agent (the same short label the Settings page used for this device). */
export function deviceLabel(ua = "") {
    const s = String(ua);
    const b = /Edg\//.test(s) ? "Edge" : /OPR\//.test(s) ? "Opera" : /SamsungBrowser\//.test(s) ? "Samsung Internet" : /Firefox\//.test(s) ? "Firefox"
        : /Chrome\//.test(s) ? "Chrome" : /Safari\//.test(s) ? "Safari" : "";
    const o = /Windows/.test(s) ? "Windows" : /Android/.test(s) ? "Android" : /iPhone|iPad/.test(s) ? "iOS" : /Mac OS/.test(s) ? "macOS" : /Linux/.test(s) ? "Linux" : "";
    return [b, o].filter(Boolean).join(" · ") || "Browser";
}

export async function start(req, user, method = "password") {
    const ip = clientIp(req).replace(/^::ffff:/i, "");
    const now = new Date();
    const row = await MemberSession.create({
        origin: req.origin, user: oid(user._id), method,
        device: deviceLabel(req.headers?.["user-agent"]),
        ipHash: ip ? crypto.createHmac("sha256", key()).update(`ip:${ip}`).digest("hex") : undefined,
        lastSeenAt: now, expiresAt: new Date(now.getTime() + SESSION_DAYS * 864e5),
    });
    return String(row._id);
}

/** The open session a token names, or null when it was signed out (or is not this member's). */
export async function check(claims, origin) {
    if (!claims?.sid || !mongoose.isValidObjectId(claims.sid)) return null;
    const s = await MemberSession.findOne({ _id: claims.sid, user: oid(claims._id), origin }).select("endedAt lastSeenAt expiresAt").lean();
    if (!s || s.endedAt || new Date(s.expiresAt) <= new Date()) return null;
    if (!s.lastSeenAt || Date.now() - new Date(s.lastSeenAt).getTime() > TOUCH_MS)
        MemberSession.updateOne({ _id: s._id }, { $set: { lastSeenAt: new Date() } }).catch(() => {});
    return s;
}

export async function list(userId, origin, currentSid) {
    const rows = await MemberSession.find({ user: oid(userId), origin, endedAt: null, expiresAt: { $gt: new Date() } })
        .sort({ lastSeenAt: -1 }).limit(50).select("device method lastSeenAt createdAt expiresAt").lean();
    return rows.map((r) => ({
        id: String(r._id), device: r.device || "Browser", method: r.method || "password",
        signedInAt: r.createdAt, lastSeenAt: r.lastSeenAt || r.createdAt, current: String(r._id) === String(currentSid || ""),
    }));
}

export async function end(userId, origin, sid, by = "member") {
    if (!mongoose.isValidObjectId(sid)) return 0;
    const r = await MemberSession.updateOne({ _id: sid, user: oid(userId), origin, endedAt: null }, { $set: { endedAt: new Date(), endedBy: by } });
    return r.modifiedCount;
}

/** Signs out every other device (all of them when currentSid is empty). */
export async function endOthers(userId, origin, currentSid, by = "member") {
    const q = { user: oid(userId), origin, endedAt: null };
    if (currentSid && mongoose.isValidObjectId(currentSid)) q._id = { $ne: oid(currentSid) };
    const r = await MemberSession.updateMany(q, { $set: { endedAt: new Date(), endedBy: by } });
    return r.modifiedCount;
}

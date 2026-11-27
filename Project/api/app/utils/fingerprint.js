// Sign-up fingerprint for duplicate and fraud checks (Kunal's approval, 26 Nov 2026). Only one-way keyed hashes are
// kept, never the raw IP address or device details, and they are hidden from every normal read (select: false).
//
//   ipHash      HMAC-SHA256 of the sign-up IP address (x-real-ip from the gateway, else the socket address)
//   deviceHash  HMAC-SHA256 of the x-device-id header when the app sends one, else of user-agent + accept-language
//
// The key is SIGNUP_FINGERPRINT_SECRET, falling back to a key derived from JWT_SECRET. The hashes only mean
// "same as another member's" inside one panel backend; they can't be turned back into an address.
import crypto from "node:crypto";
import { clientIp } from "./security.js";

const key = () => process.env.SIGNUP_FINGERPRINT_SECRET || `fingerprint:${process.env.JWT_SECRET || ""}`;
const mac = (kind, v) => crypto.createHmac("sha256", key()).update(`${kind}:${v}`).digest("hex");

/** The IP address the way the gateway sends it, with an IPv4-mapped IPv6 prefix removed. */
export const signupIp = (req) => clientIp(req).replace(/^::ffff:/i, "");

export function fingerprint(req) {
    const ip = signupIp(req);
    const device = String(req.headers["x-device-id"] || "").trim().slice(0, 200);
    const ua = String(req.headers["user-agent"] || "").trim().slice(0, 500);
    const lang = String(req.headers["accept-language"] || "").trim().slice(0, 100);
    return {
        ipHash: ip ? mac("ip", ip) : null,
        deviceHash: device ? mac("device-id", device) : ua ? mac("ua", `${ua}|${lang}`) : null,
        at: new Date(),
    };
}

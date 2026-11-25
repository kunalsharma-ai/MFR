// Panel admin API (/api/v1/admin): callable only by the MADP super admin console.
//
// MADP signs every request with a shared secret (HMAC-SHA256) and names the brand and the admin:
//   x-madp-timestamp   unix seconds; requests older or newer than 5 minutes are refused (replay protection)
//   x-madp-origin      the brand's hostname, e.g. www.myfrequentrewards.com. Every query is filtered on it. It is
//                      never taken from the request's own Host header, and must be one of MADP_ADMIN_API_ORIGINS.
//   x-madp-actor       the MADP admin id (for this backend's own log; MADP keeps the audit trail)
//   x-madp-nonce       32 to 64 hex characters, new for every request
//   x-madp-signature   hex HMAC-SHA256 of `${timestamp}\n${nonce}\n${method}\n${path+query}\n${origin}\n${actor}\n${sha256(body)}`
// With no MADP_ADMIN_API_SECRETS set the whole API answers 404, so it is off until it is configured.
//
// Each signed request is accepted once: its nonce is remembered for twice the timestamp window, and the same signed
// request sent again answers 409 "replayed". Someone who copies a signed request off the wire can't run it again.
// MADP signs every call afresh with a new nonce, so its own retries still work.
import crypto from "node:crypto";
import mongoose from "mongoose";

const WINDOW_SECONDS = 300;

const usedSchema = new mongoose.Schema({ _id: String, at: { type: Date, default: Date.now } }, { collection: "AdminApiReplay", versionKey: false });
usedSchema.index({ at: 1 }, { expireAfterSeconds: WINDOW_SECONDS * 2 });
const Used = mongoose.models.AdminApiReplay || mongoose.model("AdminApiReplay", usedSchema);

/** true the first time a nonce is seen, false after that */
async function firstUse(key) {
    try {
        await Used.create({ _id: key });
        return true;
    } catch (e) {
        if (e?.code === 11000) return false;
        throw e;
    }
}

const list = (v) => String(v || "").split(",").map((s) => s.trim()).filter(Boolean);
export const secrets = () => list(process.env.MADP_ADMIN_API_SECRETS);
export const allowedOrigins = () => list(process.env.MADP_ADMIN_API_ORIGINS).map((s) => s.toLowerCase());

export function canonical({ timestamp, nonce, method, path, origin, actor, body }) {
    const bodyHash = crypto.createHash("sha256").update(body || "").digest("hex");
    return `${timestamp}\n${nonce}\n${String(method).toUpperCase()}\n${path}\n${origin}\n${actor}\n${bodyHash}`;
}
export function sign(secret, parts) {
    return crypto.createHmac("sha256", secret).update(canonical(parts)).digest("hex");
}

const deny = (res, status, message) => res.status(status).json({ status: "error", code: "admin_auth", message });

export async function requireMadp(req, res, next) {
    const keys = secrets();
    if (!keys.length) return res.status(404).json({ status: "error", message: "Not found" });
    const timestamp = String(req.headers["x-madp-timestamp"] || "");
    const origin = String(req.headers["x-madp-origin"] || "").toLowerCase();
    const actor = String(req.headers["x-madp-actor"] || "");
    const nonce = String(req.headers["x-madp-nonce"] || "").toLowerCase();
    const signature = String(req.headers["x-madp-signature"] || "");
    if (!/^\d{10}$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > WINDOW_SECONDS)
        return deny(res, 401, "Stale or missing timestamp");
    if (!/^[0-9a-f]{32,64}$/.test(nonce)) return deny(res, 401, "Missing nonce");
    if (!/^[0-9a-f-]{36}$/i.test(actor)) return deny(res, 401, "Missing actor");
    if (!/^[0-9a-f]{64}$/.test(signature)) return deny(res, 401, "Missing signature");
    const body = req.rawBody ? req.rawBody.toString("utf8") : "";
    const parts = { timestamp, nonce, method: req.method, path: req.originalUrl, origin, actor, body };
    const given = Buffer.from(signature, "hex");
    const ok = keys.some((k) => {
        const want = Buffer.from(sign(k, parts), "hex");
        return want.length === given.length && crypto.timingSafeEqual(want, given);
    });
    if (!ok) return deny(res, 401, "Bad signature");
    // The brand: required, and only a configured one. Every handler filters on req.adminOrigin.
    if (!origin || !allowedOrigins().includes(origin)) return deny(res, 403, "Unknown or missing brand origin");
    try {
        if (!(await firstUse(nonce))) return deny(res, 409, "This signed request was already used (replayed)");
    } catch (e) {
        return deny(res, 503, "Could not check the request. Please try again.");
    }
    req.adminOrigin = origin;
    req.adminActor = actor;
    return next();
}

// Panel admin API (/api/admin/v1): callable only by the MADP super admin console.
//
// MADP signs every request with a shared secret (HMAC-SHA256) and names the brand and the admin:
//   x-madp-timestamp   unix seconds; requests older or newer than 5 minutes are refused (replay protection)
//   x-madp-origin      the brand's hostname, e.g. www.myfrequentrewards.com. Every query is filtered on it. It is
//                      never taken from the request's own Host header, and must be one of MADP_ADMIN_API_ORIGINS.
//   x-madp-actor       the MADP admin id (for this backend's own log; MADP keeps the audit trail)
//   x-madp-signature   hex HMAC-SHA256 of `${timestamp}\n${method}\n${path+query}\n${origin}\n${actor}\n${sha256(body)}`
// With no MADP_ADMIN_API_SECRETS set the whole API answers 404, so it is off until it is configured.
import crypto from "node:crypto";

const WINDOW_SECONDS = 300;

const list = (v) => String(v || "").split(",").map((s) => s.trim()).filter(Boolean);
export const secrets = () => list(process.env.MADP_ADMIN_API_SECRETS);
export const allowedOrigins = () => list(process.env.MADP_ADMIN_API_ORIGINS).map((s) => s.toLowerCase());

export function canonical({ timestamp, method, path, origin, actor, body }) {
    const bodyHash = crypto.createHash("sha256").update(body || "").digest("hex");
    return `${timestamp}\n${String(method).toUpperCase()}\n${path}\n${origin}\n${actor}\n${bodyHash}`;
}
export function sign(secret, parts) {
    return crypto.createHmac("sha256", secret).update(canonical(parts)).digest("hex");
}

const deny = (res, status, message) => res.status(status).json({ status: "error", code: "admin_auth", message });

export function requireMadp(req, res, next) {
    const keys = secrets();
    if (!keys.length) return res.status(404).json({ status: "error", message: "Not found" });
    const timestamp = String(req.headers["x-madp-timestamp"] || "");
    const origin = String(req.headers["x-madp-origin"] || "").toLowerCase();
    const actor = String(req.headers["x-madp-actor"] || "");
    const signature = String(req.headers["x-madp-signature"] || "");
    if (!/^\d{10}$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > WINDOW_SECONDS)
        return deny(res, 401, "Stale or missing timestamp");
    if (!/^[0-9a-f-]{36}$/i.test(actor)) return deny(res, 401, "Missing actor");
    if (!/^[0-9a-f]{64}$/.test(signature)) return deny(res, 401, "Missing signature");
    const body = req.rawBody ? req.rawBody.toString("utf8") : "";
    const parts = { timestamp, method: req.method, path: req.originalUrl, origin, actor, body };
    const given = Buffer.from(signature, "hex");
    const ok = keys.some((k) => {
        const want = Buffer.from(sign(k, parts), "hex");
        return want.length === given.length && crypto.timingSafeEqual(want, given);
    });
    if (!ok) return deny(res, 401, "Bad signature");
    // The brand: required, and only a configured one. Every handler filters on req.adminOrigin.
    if (!origin || !allowedOrigins().includes(origin)) return deny(res, 403, "Unknown or missing brand origin");
    req.adminOrigin = origin;
    req.adminActor = actor;
    return next();
}

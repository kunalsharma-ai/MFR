// Small helpers shared by the engagement routes.
import rateLimit from "express-rate-limit";
import { fsLogger } from "../utils/index.js";
import { requireAdmin } from "../utils/access.js";

export class EngagementError extends Error {
    constructor(code, message, status = 400, extra) {
        super(message || code);
        this.code = code;
        this.status = status;
        this.extra = extra;
    }
}
export const fail = (code, message, status = 400, extra) => { throw new EngagementError(code, message, status, extra); };

export const handle = (fn) => async (req, res) => {
    try {
        const data = await fn(req, res);
        if (res.headersSent) return undefined;
        res.set("Cache-Control", "no-store");
        return res.json({ status: "success", message: "", data });
    } catch (e) {
        if (e instanceof EngagementError) {
            return res.status(e.status).json({ status: "error", code: e.code, message: e.message, ...(e.extra || {}) });
        }
        fsLogger.Log("engagement route error", { path: req.path, error: e && e.message });
        console.log(e);
        return res.status(500).json({ status: "error", code: "server", message: "Something went wrong on our side. Please try again in a moment." });
    }
};

export const limit = (max, minutes) => rateLimit({
    windowMs: minutes * 60 * 1000, max, standardHeaders: true, legacyHeaders: false,
    keyGenerator: (req) => String(req.user?._id || req.headers["x-real-ip"] || String(req.headers["x-forwarded-for"] || "").split(",")[0] || req.ip || "").trim(),
    validate: false,
    handler: (req, res) => res.status(429).json({ status: "error", code: "too_soon", message: "Too many requests. Please wait a moment and try again." }),
});

export { requireAdmin };

// Category values: b2c / consumer (Consumer), b2b (Professional), b2c-minor and old "minor" (Teen).
export function memberType(user) {
    const c = String(user?.category || "").trim().toLowerCase();
    if (c.includes("minor")) return "teen";
    if (c.startsWith("b2b") || c === "professional") return "professional";
    return "consumer";
}
export const isTeen = (user) => memberType(user) === "teen";

// whitelist copy of plain values (no Mongo operators or dotted keys)
export function clean(v, depth = 0) {
    if (depth > 4) return undefined;
    if (Array.isArray(v)) return v.slice(0, 100).map((x) => clean(x, depth + 1));
    if (v && typeof v === "object") {
        const o = {};
        for (const [k, x] of Object.entries(v)) if (!k.startsWith("$") && !k.includes(".")) o[k] = clean(x, depth + 1);
        return o;
    }
    return typeof v === "string" ? v.slice(0, 2000) : v;
}

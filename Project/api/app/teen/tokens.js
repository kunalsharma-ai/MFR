// Secure, single-purpose, time-limited links for the Teen registration.
// A link carries 32 random bytes (base64url, 43 characters). The database keeps only their SHA-256, so a leaked
// database dump cannot be turned into working links, and guessing one is not feasible.
import crypto from "crypto";
import { TeenToken } from "../model/index.js";

export const TTL = {
    guardian: 7 * 24 * 3600 * 1000,   // the parent's YES/NO + onboarding + consent link
    password: 72 * 3600 * 1000,       // the teen's create-password link
    status: 60 * 24 * 3600 * 1000,    // the teen's "where is my registration" link
    verify: 60 * 24 * 3600 * 1000,    // the "confirm my email" part of the teen's first email
};
const hash = (t) => crypto.createHash("sha256").update(String(t)).digest("hex");
const looksLikeToken = (t) => /^[A-Za-z0-9_-]{40,64}$/.test(String(t || ""));

export async function issue(registration, purpose, origin, { revokeOthers = true } = {}) {
    if (revokeOthers) {
        await TeenToken.updateMany({ registration, purpose, usedAt: null, revokedAt: null }, { $set: { revokedAt: new Date() } });
    }
    const token = crypto.randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + TTL[purpose]);
    await TeenToken.create({ hash: hash(token), purpose, registration, expiresAt, origin });
    return { token, expiresAt };
}

// -> { ok: true, doc } | { ok: false, reason: 'invalid' | 'expired' | 'used' | 'revoked' }
export async function check(token, purpose, origin) {
    if (!looksLikeToken(token)) return { ok: false, reason: "invalid" };
    const doc = await TeenToken.findOne({ hash: hash(token), purpose, origin });
    if (!doc) return { ok: false, reason: "invalid" };
    if (doc.usedAt) return { ok: false, reason: "used", doc };
    if (doc.revokedAt) return { ok: false, reason: "revoked", doc };
    if (doc.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired", doc };
    return { ok: true, doc };
}

export async function consume(doc) {
    // atomic: two clicks at the same moment cannot both use it
    const r = await TeenToken.updateOne({ _id: doc._id, usedAt: null }, { $set: { usedAt: new Date() } });
    return r.modifiedCount === 1;
}

export async function revokeAll(registration, purpose) {
    const q = { registration, usedAt: null, revokedAt: null };
    if (purpose) q.purpose = purpose;
    await TeenToken.updateMany(q, { $set: { revokedAt: new Date() } });
}

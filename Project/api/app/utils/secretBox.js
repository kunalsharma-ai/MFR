// Encrypts small secrets kept in the database (message provider keys set from the MADP console) with AES-256-GCM.
// Key: CHANNEL_SECRETS_KEY (any long random string), else one derived from JWT_SECRET. Changing the key makes saved
// provider keys unreadable: they must then be entered again in the console.
import crypto from "node:crypto";

const key = () => crypto.createHash("sha256").update(process.env.CHANNEL_SECRETS_KEY || `channels:${process.env.JWT_SECRET || ""}`).digest();

export function seal(obj) {
    const iv = crypto.randomBytes(12);
    const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
    const body = Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final()]);
    return `v1.${iv.toString("base64url")}.${c.getAuthTag().toString("base64url")}.${body.toString("base64url")}`;
}

export function open(sealed) {
    try {
        const [v, iv, tag, body] = String(sealed || "").split(".");
        if (v !== "v1") return null;
        const d = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
        d.setAuthTag(Buffer.from(tag, "base64url"));
        return JSON.parse(Buffer.concat([d.update(Buffer.from(body, "base64url")), d.final()]).toString("utf8"));
    } catch {
        return null;
    }
}

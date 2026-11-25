// Member engagement emails: templates are mailer/engagement/<template>.liquid, rendered by the existing
// email-template service (category "engagement") and sent by the existing email service, like every other MFR email.
// ENGAGEMENT_MAIL_OUTBOX=/some/dir (development/testing only) writes the email as JSON instead of sending it.
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getMailer, sendMail, fsLogger, mailOk } from "../utils/index.js";

export const siteUrl = (origin) => (process.env.PUBLIC_SITE_URL || `https://${origin}`).replace(/\/$/, "");
const SUPPORT = { email: "support@myfrequentrewards.com", phone: "+91 81300 15743" };

// One-click unsubscribe links: an HMAC of (member, list), so no token needs storing.
const secret = () => process.env.ENGAGEMENT_LINK_SECRET || process.env.JWT_SECRET || "mfr";
export const unsubscribeSig = (userId, list) => crypto.createHmac("sha256", secret()).update(`${userId}:${list}`).digest("base64url").slice(0, 32);
export const checkUnsubscribe = (userId, list, sig) => {
    const want = unsubscribeSig(userId, list);
    return typeof sig === "string" && sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want));
};
export const unsubscribeLink = (origin, userId, list) =>
    `${siteUrl(origin)}/api/v1/engagement-public/unsubscribe?u=${userId}&l=${list}&s=${unsubscribeSig(userId, list)}`;

// category = the mailer/<category>/ folder the template lives in (default: engagement)
export async function send({ origin, to, template, subject, data, category = "engagement" }) {
    const payload = { ...data, template, subject, site: siteUrl(origin), support: SUPPORT, year: new Date().getFullYear() };
    try {
        if (process.env.ENGAGEMENT_MAIL_OUTBOX) {
            fs.mkdirSync(process.env.ENGAGEMENT_MAIL_OUTBOX, { recursive: true });
            const f = path.join(process.env.ENGAGEMENT_MAIL_OUTBOX, `${Date.now()}-${crypto.randomBytes(3).toString("hex")}-${category}-${template}.json`);
            fs.writeFileSync(f, JSON.stringify({ to, subject, category, data: payload }, null, 2));
            return true;
        }
        const mailer = await getMailer(category, template, payload);
        const r = await sendMail({ origin, "content-type": "application/json" }, to, subject, mailer.data);
        const ok = mailOk(r, mailer);
        if (!ok) fsLogger.Log("engagement mail not sent", { template, status: r?.status });
        return ok;
    } catch (e) {
        fsLogger.Log("engagement mail failed", { template, error: e.message });
        return false;
    }
}

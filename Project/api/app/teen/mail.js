// Teen registration emails. Templates are mailer/teen/<template>.liquid, rendered by the existing email-template
// service (getMailer) and sent by the existing email service (sendMail) - the same pipes as every other MFR email.
//
// Each send is written to the registration's `emails` log (template, recipient role, time, ok) so the same email
// is never sent twice for one event and support can see what the family received.
// TEEN_MAIL_OUTBOX=/some/dir (development/testing only) writes the email data there as JSON instead of sending.
import fs from "fs";
import path from "path";
import { getMailer, sendMail, fsLogger } from "../utils/index.js";

export const SUBJECTS = {
    "teen-registered": "You're in the queue! Your parent or guardian has your invite",
    "guardian-invite": "Your teen has asked to join the MyFrequentRewards Teen Panel. Yes or no?",
    "guardian-approved": "Thank you. Next: two short steps for your teen's registration",
    "guardian-declined": "We've recorded your decision",
    "teen-declined": "An update on your Teen Panel registration",
    "guardian-complete": "All done. Your teen can now create their password",
    "teen-password": "Your parent said yes! Create your password",
    "teen-active": "Your Teen Panel account is live",
    "teen-reminder": "Still waiting for your parent or guardian",
    "guardian-reminder": "Reminder: your teen's Teen Panel request is waiting for you",
    "link-renewed": "Here is your new link",
    "link-expired": "Your Teen Panel link has expired",
    "teen-turning-18": "You're turning 18: your account is moving to an adult account",
    "guardian-consent-ended": "Your consent has ended: your teen now has an adult account",
};

const siteUrl = (origin) => (process.env.PUBLIC_SITE_URL || `https://${origin}`).replace(/\/$/, "");
export const linkTo = (origin, p, token) => `${siteUrl(origin)}${p}${token ? `${p.includes("?") ? "&" : "?"}t=${encodeURIComponent(token)}` : ""}`;

export async function send(reg, template, to, address, data, origin) {
    const subject = SUBJECTS[template] || "MyFrequentRewards";
    const payload = {
        ...data,
        template,
        subject,
        reference: reg.reference,
        site: siteUrl(origin),
        support: { email: "support@myfrequentrewards.com", phone: "+91 81300 15743" },
        year: new Date().getFullYear(),
    };
    let ok = false;
    try {
        if (process.env.TEEN_MAIL_OUTBOX) {
            fs.mkdirSync(process.env.TEEN_MAIL_OUTBOX, { recursive: true });
            const f = path.join(process.env.TEEN_MAIL_OUTBOX, `${Date.now()}-${reg.reference}-${template}.json`);
            fs.writeFileSync(f, JSON.stringify({ to: address, role: to, subject, data: payload }, null, 2));
            ok = true;
        } else {
            const mailer = await getMailer("teen", template, payload);
            const r = await sendMail({ origin, "content-type": "application/json" }, address, subject, mailer.data);
            ok = !(r && r.status === "error");
        }
    } catch (e) {
        fsLogger.Log("teen mail failed", { template, reference: reg.reference, error: e.message });
        ok = false;
    }
    reg.emails.push({ template, to, at: new Date(), ok });
    return ok;
}
export const sentBefore = (reg, template, to) => (reg.emails || []).some((m) => m.template === template && m.to === to && m.ok);

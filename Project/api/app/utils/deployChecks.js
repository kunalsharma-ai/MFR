// Start-up checks for settings that, when missing on a server, break sign-up quietly (sign-up QA report, Nov 2026).
// Each problem is written to the console and the log as one line starting "DEPLOY CHECK FAILED", so it shows up at
// the top of the container log instead of as a member's "I never got the email" days later.
//   - SOCIAL_JWT_SECRET: without it (or shorter than 32 characters) Google / Facebook sign-in sends everyone back to sign-up.
//   - the email service must have a mail account for every public host name (MAIL_ORIGINS, comma separated; default
//     myfrequentrewards.com and www.myfrequentrewards.com). It answers GET /health?origin=<host> with 200 or 503.
//   - the email-template service's host name must resolve (EMAIL_TEMPLATE_URL, else email-template / api-email-template).
import dns from "node:dns/promises";
import { fsLogger } from "./index.js";
import { candidates, withService } from "./serviceHosts.js";

const say = (msg, extra) => {
    console.error(`DEPLOY CHECK FAILED: ${msg}`);
    fsLogger.Log(`DEPLOY CHECK FAILED: ${msg}`, extra || {});
};

export function checkSocialKey(env = process.env) {
    const k = env.SOCIAL_JWT_SECRET;
    if (!k || k.length < 32) {
        say("SOCIAL_JWT_SECRET is missing or shorter than 32 characters, so social sign-in (Google, Facebook) is off.");
        return false;
    }
    return true;
}

export async function checkMailAccounts(env = process.env) {
    const origins = String(env.MAIL_ORIGINS || "myfrequentrewards.com,www.myfrequentrewards.com")
        .split(",").map((s) => s.trim()).filter(Boolean);
    const missing = [];
    for (const origin of origins) {
        try {
            const r = await withService("email", {}, (api) => api.get(`/health?origin=${encodeURIComponent(origin)}`, { origin }), env);
            if (r.status === 404) { say("the email service has no /health check (an older build); redeploy it from main."); return null; }
            if (r.status !== 200) missing.push(origin);
        } catch (e) {
            say(`the email service can't be reached (${e.message}); no email will be sent.`);
            return null;
        }
    }
    if (missing.length) say(`the email service has no mail account for ${missing.join(", ")}; emails from those sites are not sent. Add config/<host>.json for each one on the email server.`, { missing });
    return missing.length === 0;
}

// issue #92: the template service's host name must resolve, or every email fails with "getaddrinfo EAI_AGAIN ..."
export async function checkTemplateHost(env = process.env) {
    const tried = candidates("template", env);
    for (const u of tried) {
        try { await dns.lookup(new URL(u).hostname); return true; } catch { /* next */ }
    }
    say(`the email-template service can't be found (tried ${tried.join(", ")}); no email will be sent. Set EMAIL_TEMPLATE_URL to its address.`);
    return false;
}

// issue #98: the Teen Panel emails are built from mailer/teen/*.liquid. A template service built before the Teen Panel
// (or without the mailer/teen folder) answers an error for them, so neither the parent's invite nor the teen's email
// can go out. Building one teen template at start-up (nothing is sent) shows that in the log straight away.
export async function checkTeenTemplates(env = process.env) {
    const sample = {
        template: "guardian-invite", subject: "check", reference: "TP-CHECK", site: "https://www.myfrequentrewards.com",
        support: { email: "support@myfrequentrewards.com" }, year: new Date().getFullYear(),
        teen: { firstName: "Check", age: 15 }, guardian: { firstName: "Check", relation: "mother", relationLabel: "Mother" },
        links: { yes: "https://www.myfrequentrewards.com/teen/parent", no: "https://www.myfrequentrewards.com/teen/parent", review: "https://www.myfrequentrewards.com/teen/parent" },
        expires: new Date().toISOString(),
    };
    try {
        const r = await withService("template", {}, (api) => api.post("/api/v1/mailer/teen/guardian-invite", sample), env);
        const html = r?.data;
        const bad = typeof r?.status === "number" && (r.status < 200 || r.status >= 300);
        if (bad || !html || (typeof html === "object" && (html.error || html.status === "error"))) {
            say(`the email-template service can't build the Teen Panel emails (mailer/teen/guardian-invite answered ${r?.status}); no parent invite or teen email will be sent. Redeploy it with the mailer/teen templates.`);
            return false;
        }
        return true;
    } catch (e) {
        return null; // not reachable: checkTemplateHost already reports that
    }
}

export function runDeployChecks(env = process.env) {
    checkSocialKey(env);
    // the email service may start a little after the API
    setTimeout(() => {
        checkTemplateHost(env).catch(() => {});
        checkMailAccounts(env).catch(() => {});
        checkTeenTemplates(env).catch(() => {});
    }, 20_000).unref();
}

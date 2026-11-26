import { withService } from "./serviceHosts.js";

// Builds an email from the email-template service. Never throws: when the service can't be reached the answer is
// { status: 0, data: { error } }, so mailOk() reports "not sent" and the caller carries on (Nov 2026: a missing
// template service turned a successful registration into an error page, and the retry said "already registered").
async function getMailer(category, type, data,headers) {
    try {
        // host: EMAIL_TEMPLATE_URL, else email-template:8080, else api-email-template:8080 (utils/serviceHosts.js)
        return await withService("template", headers, (api) => api.post(`/api/v1/mailer/${category}/${type}`, data));
    } catch (e) {
        console.error(`email template ${category}/${type} unavailable:`, e.message);
        return { status: 0, data: { error: e.message } };
    }
}
export default getMailer;

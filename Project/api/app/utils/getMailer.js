import {API} from "./index.js";

// Builds an email from the email-template service. Never throws: when the service can't be reached the answer is
// { status: 0, data: { error } }, so mailOk() reports "not sent" and the caller carries on (Nov 2026: a missing
// template service turned a successful registration into an error page, and the retry said "already registered").
async function getMailer(category, type, data,headers) {
    const mailerAPI = new API({
        baseURL: `http://email-template:8080`,
        headers
    })
    try {
        return await mailerAPI.post(`/api/v1/mailer/${category}/${type}`, data);
    } catch (e) {
        console.error(`email template ${category}/${type} unavailable:`, e.message);
        return { status: 0, data: { error: e.message } };
    }
}
export default getMailer;

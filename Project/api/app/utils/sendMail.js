import { API } from "./index.js";

// Sends through the email service. Never throws, and never sends an empty email: when the template could not be
// built (getMailer answered with an error) or the service can't be reached, the answer is { status: 0, data: { error } }
// and mailOk() reports "not sent".
async function sendMail(headers, to, subject, content, cc = null, bcc = null, attachments = null) {
    const empty = content == null || content === "" || (typeof content === "object" && !Array.isArray(content) && (content.error || content.status === "error"));
    if (empty) return { status: 0, data: { error: "no email content (the email template was not built)" } };
    const emailAPI = new API({
        baseURL: `http://email:3000`,
        headers
    })
    try {
        return await emailAPI.post(`/email`, {
            to,
            subject,
            content,
            cc,
            bcc,
            attachments
        });
    } catch (e) {
        console.error("email service unavailable:", e.message);
        return { status: 0, data: { error: e.message } };
    }
}
export default sendMail;

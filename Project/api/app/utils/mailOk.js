// Did the email service really send it? Its client (utils/API.js) resolves with { status: <HTTP code>, data } and never
// throws on an error answer, so "no exception" is not "sent". Before this check a 405 from the email service (no mail
// account set up for the site's host name) counted as sent, and sign-ups said "check your inbox" when nothing went.
export default function mailOk(r, mailer) {
    if (mailer && (typeof mailer.status === "number" && (mailer.status < 200 || mailer.status >= 300))) return false;
    if (!r) return false;
    if (typeof r.status === "number" && (r.status < 200 || r.status >= 300)) return false;
    const d = r.data;
    if (d && typeof d === "object" && (d.status === "error" || d.error)) return false;
    return true;
}

// Personal data leaves this API masked unless the unmask endpoint is called (MADP checks pii.view and logs a reason).
export function maskEmail(v) {
    if (!v) return "";
    const [u, d] = String(v).split("@");
    return d ? `${u.slice(0, 1)}***@${d}` : "***";
}
export function maskPhone(v) {
    if (!v) return "";
    const s = String(v);
    return s.length <= 4 ? "***" : `${s.slice(0, 3)}***${s.slice(-2)}`;
}
// Year only; age bands are enough for screening and targeting.
export const birthYear = (dob) => (dob ? new Date(dob).getUTCFullYear() : null);
// Age in whole years on `now` (UTC), from the stored date of birth; null when there is none or it is not a past date.
export function ageYears(dob, now = new Date()) {
    if (!dob) return null;
    const d = new Date(dob);
    if (Number.isNaN(d.getTime()) || d > now) return null;
    let a = now.getUTCFullYear() - d.getUTCFullYear();
    if (now.getUTCMonth() < d.getUTCMonth() || (now.getUTCMonth() === d.getUTCMonth() && now.getUTCDate() < d.getUTCDate())) a -= 1;
    return a;
}

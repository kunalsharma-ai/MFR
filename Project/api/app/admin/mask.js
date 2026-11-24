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

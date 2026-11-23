// Day arithmetic in the member's own time zone (User.timezone, e.g. "Asia/Kolkata"). Days are "YYYY-MM-DD" strings.
const fmtCache = new Map();
function formatter(tz) {
    const key = tz || "UTC";
    if (!fmtCache.has(key)) {
        let f;
        try { f = new Intl.DateTimeFormat("en-CA", { timeZone: key, year: "numeric", month: "2-digit", day: "2-digit" }); }
        catch (e) { f = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit" }); }
        fmtCache.set(key, f);
    }
    return fmtCache.get(key);
}
export function dayKey(date = new Date(), tz) {
    return formatter(tz).format(new Date(date)); // en-CA gives YYYY-MM-DD
}
export function addDays(day, n) {
    const d = new Date(`${day}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
}
export function daysBetween(a, b) {
    return Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);
}
export function monthKey(date = new Date(), tz) {
    return dayKey(date, tz).slice(0, 7);
}
// minutes since midnight in the member's zone, for quiet hours
export function minutesNow(tz, now = new Date()) {
    let parts;
    try { parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz || "UTC", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now); }
    catch (e) { parts = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now); }
    const h = Number(parts.find((p) => p.type === "hour")?.value || 0);
    const m = Number(parts.find((p) => p.type === "minute")?.value || 0);
    return h * 60 + m;
}
export function inQuietHours(q, tz, now = new Date()) {
    if (!q?.enabled) return false;
    const toMin = (s) => { const [h, m] = String(s || "0:0").split(":").map(Number); return (h || 0) * 60 + (m || 0); };
    const s = toMin(q.start), e = toMin(q.end), n = minutesNow(tz, now);
    if (s === e) return false;
    return s < e ? n >= s && n < e : n >= s || n < e; // a window that crosses midnight
}

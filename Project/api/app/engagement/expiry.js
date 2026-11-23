// Points expiry REMINDERS only. There is no expiry today (config.expiry.enabled = false, DECISION: Kunal), and this
// code never deducts anything: it works out which points *would* lapse under the configured rule and emails a
// reminder before the date. Oldest points are treated as spent first. Teens are never included.
import { User, MemberPreference } from "../model/index.js";
import { config } from "./config.js";
import { entries } from "./ledger.js";
import { memberType } from "./http.js";
import { send, unsubscribeLink, siteUrl } from "./mail.js";

const DAY = 86400000;
export function atRisk(list, { months, now = new Date() }) {
    const earned = list.filter((e) => e.points > 0 && e.status === "cleared" && e.at).sort((a, b) => a.at - b.at);
    let spent = list.filter((e) => e.points < 0).reduce((n, e) => n - e.points, 0);
    const out = [];
    for (const e of earned) {
        let left = e.points;
        const use = Math.min(left, spent);
        left -= use; spent -= use;
        if (left <= 0) continue;
        const expires = new Date(e.at); expires.setMonth(expires.getMonth() + months);
        out.push({ points: left, expires });
    }
    // group by expiry day, soonest first
    const by = new Map();
    for (const x of out) { const k = x.expires.toISOString().slice(0, 10); by.set(k, (by.get(k) || 0) + x.points); }
    return [...by.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, points]) => ({ date, points, daysLeft: Math.ceil((new Date(`${date}T00:00:00Z`) - now) / DAY) }));
}

export async function runExpiryReminders({ dryRun = false, origin, now = new Date(), force = false } = {}) {
    const c = config().expiry;
    const report = { enabled: Boolean(c.enabled), sent: 0, dryRun };
    if (!c.enabled && !force) return report;
    const q = { isActive: true, isDeleted: false, registrationStatus: { $in: ["active", null] } };
    if (origin) q.origin = origin;
    for await (const u of User.find(q).select("name mail category timezone origin").lean().cursor()) {
        if (memberType(u) === "teen") continue;
        u._id = String(u._id);
        const prefs = await MemberPreference.findOne({ user: u._id, origin: u.origin }).lean();
        if (prefs?.notifications?.email === false || prefs?.notifications?.expiryReminders === false) continue;
        const list = await entries(u, u.origin, { now });
        const due = atRisk(list, { months: c.months, now }).find((x) => x.daysLeft > 0 && c.remindDaysBefore.some((d) => x.daysLeft <= d));
        if (!due) continue;
        const window = c.remindDaysBefore.filter((d) => due.daysLeft <= d).sort((a, b) => a - b)[0];
        const key = `${due.date}:${window}`;
        if ((prefs?.expiryReminders || []).some((r) => r.key === key)) continue;
        if (dryRun) { report.sent += 1; continue; }
        const available = list.reduce((n, e) => n + (e.status === "cleared" || e.points < 0 ? e.points : 0), 0);
        const ok = await send({
            origin: u.origin, to: u.mail, template: "expiry-reminder",
            subject: `${due.points} of your points expire on ${due.date}`,
            data: {
                member: { firstName: u?.name?.first || "there" },
                expiring: { points: due.points, date: due.date },
                balance: { available },
                money: new Intl.NumberFormat("en-US", { style: "currency", currency: config().points.currency }).format(available * config().points.usdPerPoint),
                links: { rewards: `${siteUrl(u.origin)}/member/rewards`, unsubscribe: unsubscribeLink(u.origin, u._id, "expiry") },
            },
        });
        if (ok) {
            await MemberPreference.updateOne({ user: u._id, origin: u.origin }, { $push: { expiryReminders: { key, at: now } }, $setOnInsert: { user: u._id, origin: u.origin } }, { upsert: true });
            report.sent += 1;
        }
    }
    return report;
}

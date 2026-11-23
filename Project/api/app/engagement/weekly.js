// Weekly points recap. Switched off unless config.weeklySummary.enabled (DECISION: Kunal).
// It is a recap only: profile reminders are sent by the profile studio every 2 days and are not repeated here.
// Skipped for: members who switched it off or switched email off, members with nothing new this week, inactive or
// not-yet-active accounts (e.g. a Teen waiting for guardian consent), and anyone already sent one in the last 6 days.
import { User, MemberPreference } from "../model/index.js";
import { config } from "./config.js";
import * as L from "./ledger.js";
import { streakOf } from "./streak.js";
import { memberType } from "./http.js";
import { send, unsubscribeLink, siteUrl } from "./mail.js";

const SIX_DAYS = 6 * 86400000;
const usd = (pts) => new Intl.NumberFormat("en-US", { style: "currency", currency: config().points.currency || "USD" }).format(pts * config().points.usdPerPoint);

export async function weeklyFor(user, origin, { now = new Date() } = {}) {
    const { entries, balances } = await L.ledger(user, origin, { now });
    const since = new Date(now.getTime() - 7 * 86400000);
    const week = entries.filter((e) => e.points > 0 && e.at && e.at >= since);
    const streak = await streakOf(user, origin);
    const type = memberType(user);
    return {
        member: { firstName: user?.name?.first || "there", type },
        week: { points: week.reduce((n, e) => n + e.points, 0), surveys: week.filter((e) => e.type === "survey").length, from: since.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) },
        balance: { available: balances.available, pending: balances.pending, onHold: balances.onHold },
        money: type === "teen" ? null : usd(balances.available),
        streak: { current: streak.current, best: streak.best, next: streak.next },
    };
}

export async function runWeekly({ dryRun = false, origin, now = new Date(), force = false } = {}) {
    const c = config().weeklySummary;
    const report = { enabled: Boolean(c.enabled), considered: 0, sent: 0, skipped: {}, dryRun };
    if (!c.enabled && !force) return report;
    const skip = (why) => { report.skipped[why] = (report.skipped[why] || 0) + 1; };
    const q = { isActive: true, isDeleted: false, registrationStatus: { $in: ["active", null] } };
    if (origin) q.origin = origin;
    const cursor = User.find(q).select("name mail category timezone origin registrationStatus").lean().cursor();
    for await (const user of cursor) {
        if (report.sent >= c.maxPerRun) break;
        report.considered += 1;
        user._id = String(user._id);
        const prefs = await MemberPreference.findOne({ user: user._id, origin: user.origin }).lean();
        const n = prefs?.notifications || {};
        if (n.email === false || n.weeklySummary === false) { skip("opted_out"); continue; }
        if (prefs?.lastWeeklySummaryAt && now - new Date(prefs.lastWeeklySummaryAt) < SIX_DAYS) { skip("recent"); continue; }
        const data = await weeklyFor(user, user.origin, { now });
        if (data.week.points <= 0) { skip("nothing_new"); continue; }
        if (dryRun) { report.sent += 1; continue; }
        const ok = await send({
            origin: user.origin,
            to: user.mail,
            template: "weekly-summary",
            subject: `Your week: +${data.week.points} points`,
            data: { ...data, links: { activity: `${siteUrl(user.origin)}/member/activity`, rewards: `${siteUrl(user.origin)}/member/rewards`, unsubscribe: unsubscribeLink(user.origin, user._id, "weekly") } },
        });
        if (!ok) { skip("send_failed"); continue; }
        await MemberPreference.updateOne(
            { user: user._id, origin: user.origin },
            { $set: { lastWeeklySummaryAt: now }, $setOnInsert: { user: user._id, origin: user.origin } },
            { upsert: true }
        );
        report.sent += 1;
    }
    return report;
}

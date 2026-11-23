// Daily streaks. A streak day is a day (in the member's time zone) with at least one counted activity:
//   - a StreakDay row (daily poll answered, Teen creative task done...), written by record()
//   - a survey completed (Response complete, its updatedAt)
//   - a profile paid (Reward category "profile")
// The survey/profile days are read from the existing records, so a member's past activity counts from day one.
import mongoose from "mongoose";
import { StreakDay, Response, Reward } from "../model/index.js";
import { config } from "./config.js";
import { dayKey, addDays, daysBetween } from "./time.js";
import { grant, registerReconciler } from "./ledger.js";

const oid = (id) => new mongoose.Types.ObjectId(String(id));

export async function record(user, origin, source, when = new Date()) {
    const day = dayKey(when, user.timezone);
    await StreakDay.updateOne(
        { user: oid(user._id), day, origin },
        { $setOnInsert: { user: oid(user._id), day, origin, isActive: true, isDeleted: false }, $addToSet: { sources: String(source) } },
        { upsert: true }
    ).catch((e) => { if (e?.code !== 11000) throw e; });
    return day;
}

export async function activeDays(user, origin, sinceDays = 400) {
    const since = new Date(Date.now() - sinceDays * 86400000);
    const u = oid(user._id);
    const [rows, responses, profiles] = await Promise.all([
        StreakDay.find({ user: u, origin, createdAt: { $gte: since } }).select("day").lean(),
        Response.find({ user: u, origin, status: "complete", updatedAt: { $gte: since } }).select("updatedAt").lean(),
        Reward.find({ user: u, origin, category: "profile", createdAt: { $gte: since } }).select("createdAt").lean(),
    ]);
    const set = new Set(rows.map((r) => r.day));
    for (const r of responses) set.add(dayKey(r.updatedAt, user.timezone));
    for (const r of profiles) set.add(dayKey(r.createdAt, user.timezone));
    return set;
}

// Pure: works out the streak from a set of days. A streak is still alive today if yesterday was active.
export function computeStreak(days, today) {
    const sorted = [...days].filter((d) => d <= today).sort();
    let best = 0, run = 0, prev = null, start = null, bestStart = null;
    const runs = [];
    for (const d of sorted) {
        if (prev && daysBetween(prev, d) === 1) run += 1;
        else { if (prev) runs.push({ start, end: prev, length: run }); run = 1; start = d; }
        if (run > best) { best = run; bestStart = start; }
        prev = d;
    }
    if (prev) runs.push({ start, end: prev, length: run });
    const last = runs[runs.length - 1];
    const alive = last && (last.end === today || last.end === addDays(today, -1));
    return {
        current: alive ? last.length : 0,
        currentStart: alive ? last.start : null,
        best,
        bestStart,
        todayDone: days.has(today),
        runs,
    };
}

export function nextBonus(current) {
    const b = [...config().streak.bonuses].sort((a, b) => a.days - b.days).find((x) => x.days > current);
    return b ? { days: b.days, points: b.points, daysLeft: b.days - current } : null;
}

export async function streakOf(user, origin) {
    const today = dayKey(new Date(), user.timezone);
    const s = computeStreak(await activeDays(user, origin), today);
    // last 28 days for the calendar strip, oldest first
    const days = await activeDays(user, origin, 30);
    const strip = Array.from({ length: 28 }, (_, i) => { const d = addDays(today, i - 27); return { day: d, active: days.has(d) }; });
    return { current: s.current, best: s.best, todayDone: s.todayDone, since: s.currentStart, next: nextBonus(s.current), strip };
}

// streak bonuses: once per streak run per milestone (key streak:<days>:<run start day>)
registerReconciler(async (user, origin) => {
    const bonuses = config().streak.bonuses || [];
    if (!bonuses.length) return;
    const today = dayKey(new Date(), user.timezone);
    const { runs } = computeStreak(await activeDays(user, origin), today);
    const from = String(config().streak.bonusFrom || "0000-00-00").slice(0, 10);
    for (const r of runs) {
        // only the part of the run on/after bonusFrom counts
        const start = r.start < from ? from : r.start;
        if (start > r.end) continue;
        const length = daysBetween(start, r.end) + 1;
        for (const b of bonuses) {
            if (length >= b.days && b.points > 0) {
                await grant(user, origin, {
                    category: "streak",
                    key: `streak:${b.days}:${start}`,
                    name: `${b.days}-day streak`,
                    points: b.points,
                    remarks: `Streak bonus: ${b.days} days in a row from ${start}`,
                });
            }
        }
    }
});

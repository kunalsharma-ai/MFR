// Member engagement settings (Nov 2026).
//
// Every number that costs money, every third-party provider and every feature with a legal question is decided here,
// not in the code that uses it. The values below are PLACEHOLDERS agreed for development only. Each one marked
// "DECISION" is waiting for Kunal (see /mnt/project-files/member-engagement/PLAN.md), and stays switched off or at a
// harmless value until he chooses.
//
// Override without a code change: point ENGAGEMENT_CONFIG at a JSON file. It is deep-merged over these defaults, e.g.
//   { "dailyPoll": { "points": 10 }, "drawEnabled": false }
import fs from "fs";

export const DEFAULTS = {
    // ---- points and money -------------------------------------------------------------------------------------------
    points: {
        // 1,000 points = 1 USD, the same rate the profile studio (v4.1) and /me/points already use
        usdPerPoint: 0.001,
        currency: "USD",
        // smallest redemption, in points (today's payout threshold)
        minRedemption: 15000,
        // days a new entry stays "pending" before it can be spent. 0 = cleared at once, which is how it works today.
        // Only entries created on or after holdFrom are ever pending: points already earned are never moved back.
        holdDays: 0,
        holdFrom: "2026-12-01T00:00:00Z",
    },

    // ---- streaks and daily poll (DECISION: points values) -----------------------------------------------------------
    streak: {
        // a "streak day" is a day on which the member answered the daily poll, finished a survey or profile, or (Teens)
        // did a creative task, in their own time zone
        bonuses: [
            { days: 7, points: 10 },
            { days: 30, points: 50 },
        ],
        // bonuses are paid only for streak days on or after this date, so switching the feature on does not pay out
        // for past activity
        bonusFrom: "2026-12-01",
    },
    dailyPoll: { enabled: true, points: 5 },

    // ---- weekly summary email (DECISION: switch on) ----------------------------------------------------------------
    // It never repeats the profile reminders the profile studio sends every 2 days; it is only a points/streak recap.
    weeklySummary: { enabled: false, weekday: 1 /* Monday */, maxPerRun: 5000 },

    // ---- points expiry (DECISION: there is no expiry today) ---------------------------------------------------------
    // When enabled, points earned more than `months` ago and not spent would lapse. Only the reminder email is built;
    // nothing is ever deducted by this code.
    expiry: { enabled: false, months: 12, remindDaysBefore: [30, 7] },
};

function deepMerge(a, b) {
    if (Array.isArray(b) || typeof b !== "object" || b === null) return b === undefined ? a : b;
    const out = { ...(a || {}) };
    for (const [k, v] of Object.entries(b)) out[k] = deepMerge(a?.[k], v);
    return out;
}

let cached = null;
export function config() {
    if (cached) return cached;
    let over = {};
    const file = process.env.ENGAGEMENT_CONFIG;
    if (file) {
        try { over = JSON.parse(fs.readFileSync(file, "utf-8")); } catch (e) { console.error("ENGAGEMENT_CONFIG unreadable:", e.message); }
    }
    cached = deepMerge(DEFAULTS, over);
    return cached;
}
// tests only
export function setConfig(over = {}) { cached = deepMerge(DEFAULTS, over); return cached; }

// What the member area may see (no internal switches).
export function publicConfig(memberType) {
    const c = config();
    return {
        usdPerPoint: memberType === "teen" ? null : c.points.usdPerPoint, // Teens never see money values
        currency: c.points.currency,
        minRedemption: c.points.minRedemption,
        holdDays: c.points.holdDays,
        streakBonuses: c.streak.bonuses,
        dailyPoll: { enabled: c.dailyPoll.enabled, points: c.dailyPoll.points },
    };
}

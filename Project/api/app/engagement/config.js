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

    // ---- rewards: catalogue, redemptions, offers (DECISION: providers, values) --------------------------------------
    rewards: {
        // Members can browse the catalogue and set goals now. Requests to redeem stay closed until a payout route is
        // chosen; with "manual" the team pays each approved request by hand from the admin queue.
        redemptionsEnabled: false,
        payoutProvider: "manual", // DECISION: "manual" | a gift-card vendor / UPI / PayPal payouts provider
        // INR per USD for showing UPI amounts. DECISION: fixed rate or a live one from the provider.
        inrPerUsd: 83,
        // shown when the database has no catalogue yet. Placeholders: no real brands until vendors are chosen.
        defaultCatalogue: [
            { key: "giftcard-15", kind: "giftcard", title: "E-gift card", subtitle: "Vendor to be confirmed", points: 15000, value: 15, audience: ["consumer", "professional"] },
            { key: "giftcard-25", kind: "giftcard", title: "E-gift card", subtitle: "Vendor to be confirmed", points: 25000, value: 25, audience: ["consumer", "professional"] },
            { key: "upi-15", kind: "upi", title: "UPI payout", subtitle: "To your UPI ID (India)", points: 15000, value: 15, audience: ["consumer", "professional"], countries: ["in"] },
            { key: "paypal-15", kind: "paypal", title: "PayPal payout", subtitle: "To your PayPal email", points: 15000, value: 15, audience: ["consumer", "professional"] },
            { key: "paypal-50", kind: "paypal", title: "PayPal payout", subtitle: "To your PayPal email", points: 50000, value: 50, audience: ["professional"] },
            { key: "charity-15", kind: "charity", title: "Donate to charity", subtitle: "Charity partner to be confirmed", points: 15000, value: 15, audience: ["consumer", "professional"] },
            // Teens: learning rewards, every one approved by the parent or guardian. No cash.
            { key: "learn-course", kind: "learning", title: "Skill course voucher", subtitle: "Online course of your choice", points: 6000, value: 6, audience: ["teen"] },
            { key: "learn-study", kind: "learning", title: "Study voucher", subtitle: "Books and study material", points: 8000, value: 8, audience: ["teen"] },
            { key: "learn-gaming", kind: "learning", title: "Gaming gift card", subtitle: "Needs your guardian's OK", points: 10000, value: 10, audience: ["teen"] },
            { key: "learn-streaming", kind: "learning", title: "Streaming gift card", subtitle: "Needs your guardian's OK", points: 10000, value: 10, audience: ["teen"] },
        ],
    },
    // limited-time bonus offers are created by admins (BonusOffer). The weekend multiplier is a standing offer.
    // DECISION: 1 = off. 2 would double survey points earned on Saturdays and Sundays (member's time zone).
    bonus: { weekendMultiplier: 1, weekendFrom: "2026-12-01", audiences: ["consumer", "professional"] },

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

    // ---- emails (v6 designs, mailer/lifecycle + mailer/register|birthday|survey|newuser) ----------------------------
    // Every automatic email below is OFF until Kunal switches it on. They go through the same email-template + email
    // services as every other MFR email; nothing new is added on the provider side.
    emails: {
        // The four sign-up funnel reminders (v6 lifecycle cases 1-4), including the every-2-days profile reminder
        // from Profile v4.1. Rules match v4.1: at most one every intervalHours, no email while the member is active
        // (lastActivity inside intervalHours), at most `max` in total, one-click unsubscribe on the marketing ones.
        lifecycle: { enabled: false, intervalHours: 48, max: 15, maxPerRun: 5000, startAfterHours: 24 },
        // "Account active" after the member sets their password (register/welcome.liquid)
        welcome: false,
        // birthday greeting, sent once a year on the member's birthday in their time zone (birthday/birthday.liquid)
        birthday: false,
        // a new survey invitation was created for the member (survey/newsurvey.liquid). Respects the member's
        // "new survey" and invites-per-week settings.
        newSurvey: false,
        // tell the team about each new registration (newuser/newuser.liquid). `to` = list of team addresses.
        newUser: { enabled: false, to: [] },
    },

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

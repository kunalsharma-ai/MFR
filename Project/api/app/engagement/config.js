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

    // ---- monthly challenges (DECISION: points values) ---------------------------------------------------------------
    // Shown every month unless an admin schedules other challenges (Task kind "challenge") for that month. Progress is
    // counted from what the member really did that month. Bonuses are paid only for months from `from` onward.
    challenges: {
        enabled: true,
        from: "2026-12",
        monthly: [
            { key: "surveys-5", title: "Finish 5 surveys this month", metric: "surveys", target: 5, points: 50, audience: ["consumer", "professional"] },
            { key: "polls-10", title: "Answer 10 daily polls", metric: "polls", target: 10, points: 20 },
            { key: "active-12", title: "Be active on 12 days", metric: "active_days", target: 12, points: 30 },
            { key: "profiles-3", title: "Complete 3 profiles", metric: "profiles", target: 3, points: 25 },
        ],
    },

    // ---- quality score tiers (DECISION: bands) ----------------------------------------------------------------------
    // User.qualityScore runs 0-200 (new members start at 100). The bands below are placeholders.
    quality: {
        tiers: [
            { key: "bronze", label: "Bronze", min: 0 },
            { key: "silver", label: "Silver", min: 90 },
            { key: "gold", label: "Gold", min: 120 },
            { key: "platinum", label: "Platinum", min: 160 },
        ],
    },

    // ---- referral tiers (DECISION: thresholds and points) -----------------------------------------------------------
    // A referral counts once the person who joined with the member's link finishes their first survey. Only first
    // surveys finished on or after `from` count toward tier bonuses, so past referrals never pay out by surprise.
    // Teen Panel members don't get tiers or the leaderboard (no pressure to recruit).
    referrals: {
        tiers: [
            { count: 3, points: 300 },
            { count: 10, points: 1500 },
            { count: 25, points: 5000 },
        ],
        from: "2026-12-01",
        audiences: ["consumer", "professional"],
        // monthly board of members who opted in (first name + initial only)
        leaderboard: { enabled: true, size: 10 },
    },

    // ---- Professionals ----------------------------------------------------------------------------------------------
    professional: {
        // The profile questions (Question.name) whose answers give the member's industry and seniority. DECISION:
        // set these to the real question names in the Professional profile; until then nothing is matched.
        industryQuestion: "industry",
        seniorityQuestion: "seniority",
        // Expertise score 0-100 (DECISION: weights). Each part is the member's real figure; the weights add up to 100.
        expertise: {
            weights: { profiles: 30, surveys: 30, quality: 25, verified: 15 },
            surveysForFull: 20, // finished Professional surveys that give the full "surveys" part
        },
        // Who the statements and payout receipts are from. DECISION: company name and address as they should appear.
        // Left empty, the documents say the details will be added and never invent them. No tax wording is added.
        issuer: { name: "", address: "", email: "" },
    },

    // ---- Teen Panel: levels, badges, seasons, learning rewards (no cash anywhere) -------------------------------------
    teen: {
        // learning rewards need a parent or guardian's YES by email for every request. DECISION: switch on once
        // the vouchers are chosen.
        redemptionsEnabled: false,
        guardianLinkDays: { reward: 7, view: 90 },
        // levels by points earned in total (points never go down when spent, so a level is never lost)
        levels: [
            { level: 1, name: "Explorer", min: 0 },
            { level: 2, name: "Thinker", min: 500 },
            { level: 3, name: "Creator", min: 1500 },
            { level: 4, name: "Trailblazer", min: 3500 },
            { level: 5, name: "Visionary", min: 7000 },
        ],
        // seasons: points earned between the dates fill the season track; stages are badges only
        seasons: [
            { key: "2026-winter", title: "Winter season", starts: "2026-12-01", ends: "2027-02-28", stages: [100, 300, 600, 1000] },
            { key: "2027-spring", title: "Spring season", starts: "2027-03-01", ends: "2027-05-31", stages: [100, 300, 600, 1000] },
        ],
    },

    // ---- push and WhatsApp (DECISION: providers) ---------------------------------------------------------------------
    // Web Push needs a VAPID key pair (npx web-push generate-vapid-keys) and the `web-push` package installed. Until
    // both are there, members can't switch push on and nothing is sent. Quiet hours are respected.
    push: { enabled: false, vapidPublicKey: "", vapidPrivateKey: "", subject: "mailto:support@myfrequentrewards.com" },
    // WhatsApp needs a business provider (DECISION). Until then the setting is shown as "coming soon" and nothing is sent.
    whatsapp: { enabled: false, provider: null },

    // ---- monthly points prize draw (OFF: Kunal chose "build it, keep it off for legal", 23 Nov 2026) ----------------
    // Even when enabled, a draw is only offered in the countries listed on the draw itself, and never to Teens.
    draw: { enabled: false },

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
// `on`: the brand's switches that matter here ({ draw, push, whatsapp, hold }), read by the caller from engagement/switches.js
export function publicConfig(memberType, on = {}) {
    const c = config();
    return {
        usdPerPoint: memberType === "teen" ? null : c.points.usdPerPoint, // Teens never see money values
        currency: c.points.currency,
        minRedemption: c.points.minRedemption,
        holdDays: on.hold ? on.hold.days : 0,
        streakBonuses: c.streak.bonuses,
        dailyPoll: { enabled: c.dailyPoll.enabled, points: c.dailyPoll.points },
        drawEnabled: memberType !== "teen" && Boolean(on.draw),
        push: { enabled: Boolean(on.push && c.push?.vapidPublicKey), publicKey: on.push ? c.push.vapidPublicKey || null : null },
        whatsapp: { enabled: Boolean(on.whatsapp) },
        sms: { enabled: Boolean(on.sms) },
    };
}

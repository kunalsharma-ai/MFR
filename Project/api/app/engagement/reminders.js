// Auto reminders (Kunal, 26 Nov 2026): the brand's admins set, per case, on/off, every how many days, and at most how
// many reminders, from MADP's Auto reminders screen. A job checks every member and sends the first case that applies.
// Plain rules, no AI. Nothing goes out unless the brand's "email_reminders" switch is on; a dry run only counts.
//
//   sign-up      password      registered, password never set           (lifecycle case 1, transactional)
//                terms         password set, terms not accepted          (lifecycle case 2, transactional)
//   profile      no_profiles   terms accepted, no profile complete yet   (lifecycle case 3)
//                partial       some profiles complete, some still open   (lifecycle case 4)
//   surveys      surveys       open surveys waiting in their bucket (an invitation to a live survey, not answered)
//                first_survey  joined over 7 days ago, never finished a survey, nothing waiting
//   rewards      redeem        enough cleared points to redeem, while redemptions are open on the brand
//                streak        a daily streak of 2+ days that breaks if they do nothing today
//
// Rules: never teens (they have their own guardian-led reminders); only active, not suspended or closed members; at
// most one reminder of any kind per member every minGapDays; for each case at most `max` reminders, `everyDays`
// apart, counted again from zero once the case is over; none while the member was active in the last day (except
// the streak one); members who turned off e-mails get only the two account (sign-up) ones; the state is checked
// again just before sending. Once a brand saves these settings, the old fixed sign-up reminder timing stops for it.
//
// Channels: every reminder shows in the member's dashboard bell and goes to their registered e-mail (unless they turned
// e-mails off; the two account ones always go); browser push, WhatsApp and SMS too when the member chose them and the
// brand switched them on (engagement/channels.js). The e-mails use the brand's own logo and colours (mailer/reminders).
import mongoose from "mongoose";
import { User, Response, Survey, MemberPreference, ReminderSetting, MemberNotice } from "../model/index.js";
import { config } from "./config.js";
import { isOn } from "./switches.js";
import { memberType } from "./http.js";
import { send, unsubscribeLink, siteUrl } from "./mail.js";
import { brandOf } from "./brands.js";
import { deliver, e164 } from "./channels.js";
import { pushTo } from "./account.js";
import { caseOf, payloadFor, lastActivity } from "./lifecycle.js";
import { entries, balances } from "./ledger.js";
import { streakOf } from "./streak.js";

const DAY = 86_400_000;
const oid = (v) => new mongoose.Types.ObjectId(String(v));

export const CASES = [
    { key: "password", group: "signup", label: "Signed up but never set a password", kind: "account", lifecycle: "case1-password", def: { enabled: false, everyDays: 2, max: 5 } },
    { key: "terms", group: "signup", label: "Set a password but did not accept the terms", kind: "account", lifecycle: "case2-terms", def: { enabled: false, everyDays: 2, max: 5 } },
    { key: "no_profiles", group: "profile", label: "Has not filled in any profile yet", kind: "marketing", lifecycle: "case3-noprofiles", def: { enabled: false, everyDays: 3, max: 8 } },
    { key: "partial", group: "profile", label: "Some profiles still open", kind: "marketing", lifecycle: "case4-partial", def: { enabled: false, everyDays: 7, max: 8 } },
    { key: "surveys", group: "surveys", label: "Surveys waiting in their bucket", kind: "marketing", def: { enabled: false, everyDays: 3, max: 10 } },
    { key: "first_survey", group: "surveys", label: "Joined but never finished a survey", kind: "marketing", def: { enabled: false, everyDays: 10, max: 4 } },
    { key: "redeem", group: "rewards", label: "Has enough points to redeem", kind: "marketing", def: { enabled: false, everyDays: 15, max: 4 } },
    { key: "streak", group: "rewards", label: "Daily streak about to break", kind: "marketing", def: { enabled: false, everyDays: 3, max: 10 } },
];
const BY_KEY = new Map(CASES.map((c) => [c.key, c]));
const FROM_LIFECYCLE = new Map(CASES.filter((c) => c.lifecycle).map((c) => [c.lifecycle, c.key]));
export const LIMITS = { everyDays: [1, 90], max: [1, 50], minGapDays: [1, 30] };
const FIRST_SURVEY_AFTER_DAYS = 7;
const WAITING_INVITE_DAYS = 30; // an invitation older than this no longer counts as waiting

/** The brand's settings: every case with its saved values (or the defaults), and whether the brand saved any. */
export async function settings(origin) {
    const row = await ReminderSetting.findOne({ origin }).lean();
    const saved = row?.cases || {};
    return {
        saved: Boolean(row),
        minGapDays: row?.minGapDays ?? 2,
        updatedAt: row?.updatedAt || null,
        updatedBy: row?.updatedBy || null,
        cases: CASES.map((c) => ({ key: c.key, group: c.group, label: c.label, kind: c.kind, ...c.def, ...(saved[c.key] || {}) })),
    };
}

/** True when the brand's reminders are managed here (so the old fixed sign-up reminders stand down). */
export const managed = async (origin) => Boolean(await ReminderSetting.exists({ origin }));

const inRange = (v, [lo, hi]) => Number.isInteger(v) && v >= lo && v <= hi;

/** Saves the brand's settings. Unknown cases or values out of range are refused, nothing is half saved. */
export async function save(origin, body = {}, actor) {
    const errors = [];
    const cases = {};
    const current = await settings(origin);
    for (const [key, v] of Object.entries(body.cases || {})) {
        if (!BY_KEY.has(key)) { errors.push(`Unknown reminder: ${key}`); continue; }
        const was = current.cases.find((c) => c.key === key);
        const next = { enabled: v?.enabled ?? was.enabled, everyDays: v?.everyDays ?? was.everyDays, max: v?.max ?? was.max };
        if (typeof next.enabled !== "boolean") errors.push(`${key}: enabled is true or false`);
        if (!inRange(next.everyDays, LIMITS.everyDays)) errors.push(`${key}: every ${LIMITS.everyDays.join(" to ")} days`);
        if (!inRange(next.max, LIMITS.max)) errors.push(`${key}: at most ${LIMITS.max.join(" to ")} reminders`);
        cases[key] = next;
    }
    const minGapDays = body.minGapDays ?? current.minGapDays;
    if (!inRange(minGapDays, LIMITS.minGapDays)) errors.push(`minGapDays is ${LIMITS.minGapDays.join(" to ")}`);
    const reason = String(body.reason || "").trim().slice(0, 500);
    if (errors.length) return { ok: false, errors };
    const all = Object.fromEntries(current.cases.map((c) => [c.key, cases[c.key] || { enabled: c.enabled, everyDays: c.everyDays, max: c.max }]));
    await ReminderSetting.updateOne(
        { origin },
        {
            $set: { cases: all, minGapDays, updatedBy: actor || null, reason },
            $push: { history: { $each: [{ cases: all, minGapDays, by: actor || null, reason, at: new Date() }], $slice: -50 } },
            $setOnInsert: { origin },
        },
        { upsert: true },
    );
    return { ok: true, settings: await settings(origin) };
}

// ---- which case applies ------------------------------------------------------------------------------------------

async function waitingSurveys(user, origin, now) {
    const invites = await Response.find({ origin, user: oid(user._id), status: "invited", isDeleted: { $ne: true }, createdAt: { $gte: new Date(now - WAITING_INVITE_DAYS * DAY) } })
        .select("survey.slug").lean();
    const slugs = [...new Set(invites.map((r) => r.survey?.slug).filter(Boolean))];
    if (!slugs.length) return [];
    return Survey.find({ origin, slug: { $in: slugs }, status: "active", $or: [{ "active.to": null }, { "active.to": { $exists: false } }, { "active.to": { $gt: now } }] })
        .select("slug name points loi").sort({ points: -1 }).limit(5).lean();
}

/** Every case that applies to this member now, in priority order, with what the e-mail needs. */
export async function casesFor(user, origin, now = new Date()) {
    const out = [];
    const life = await caseOf(user);
    if (life) {
        out.push({ key: FROM_LIFECYCLE.get(life.id), life });
        // without a password or the terms they can't take surveys yet: nothing else applies
        if (life.id === "case1-password" || life.id === "case2-terms") return out;
    }
    const waiting = await waitingSurveys(user, origin, now);
    if (waiting.length) out.push({ key: "surveys", surveys: waiting });
    else if (now - new Date(user.createdAt || now) >= FIRST_SURVEY_AFTER_DAYS * DAY
        && !(await Response.exists({ origin, user: oid(user._id), status: "complete", isDeleted: { $ne: true } })))
        out.push({ key: "first_survey" });
    if (await isOn(origin, "redemptions")) {
        const available = balances(await entries(user, origin, { now })).available;
        if (available >= config().points.minRedemption) out.push({ key: "redeem", available });
    }
    const s = await streakOf(user, origin);
    if (s.current >= 2 && !s.todayDone) out.push({ key: "streak", streak: s.current, next: s.next });
    return out;
}

// ---- sending -----------------------------------------------------------------------------------------------------

const money = (points) => new Intl.NumberFormat("en-US", { style: "currency", currency: config().points.currency }).format(points * config().points.usdPerPoint);
const fmt = (n) => new Intl.NumberFormat("en-US").format(n);

/** What one reminder says, for every channel: the e-mail template and its data, and a short text for the rest. */
async function message(user, hit) {
    const site = siteUrl(user.origin);
    const utm = `utm_source=reminder&utm_medium=${hit.key}`;
    const first = user?.name?.first || "there";
    const brand = brandOf(user.origin);
    const links = {
        surveys: `${site}/member/surveys?${utm}`, rewards: `${site}/member/rewards?${utm}`, dashboard: `${site}/member/dashboard?${utm}`,
        profiles: `${site}/member/profiles?${utm}`,
        ...(BY_KEY.get(hit.key).kind === "marketing" ? { unsubscribe: unsubscribeLink(user.origin, String(user._id), "lifecycle") } : {}),
    };
    let extra = {};
    if (hit.life) {
        const d = await payloadFor(user, hit.life);
        Object.assign(links, { set_password: d.links.set_password, accept_terms: d.links.accept_terms, profiles: d.links.profiles });
        if (hit.key === "partial") extra = { done: d.profile.completed_count, total: d.profile.total_count, percent: d.profile.percent_complete };
    }
    const n = hit.surveys?.length || 0;
    const M = {
        password: { template: "password", subject: `${first}, set your password to finish joining ${brand.name}`, title: "Set your password", text: `Your ${brand.name} account is waiting. Set your password to finish joining.`, link: links.set_password, cta: "Set my password" },
        terms: { template: "terms", subject: `${first}, one last step on your ${brand.name} account`, title: "Accept the member terms", text: "One last step: please review and accept the member terms to activate your account.", link: links.accept_terms, cta: "Review and accept" },
        no_profiles: { template: "profile-start", subject: `${first}, tell us a little about yourself`, title: "Start your profile", text: "A few quick profile questions bring you surveys that fit you.", link: links.profiles, cta: "Start my profile" },
        partial: { template: "profile-next", subject: `${first}, your profile is ${extra.percent ?? 0}% complete`, title: `Your profile is ${extra.percent ?? 0}% complete`, text: "Finish the rest of your profile to be invited to more surveys.", link: links.profiles, cta: "Continue my profile" },
        surveys: { template: "surveys", subject: `${first}, ${n === 1 ? "a survey is" : `${n} surveys are`} waiting for you`, title: `${n === 1 ? "A survey is" : `${n} surveys are`} waiting`, text: `${n === 1 ? "A survey picked for you is" : `${n} surveys picked for you are`} open now.`, link: links.surveys, cta: "Take a survey" },
        first_survey: { template: "first-survey", subject: `${first}, ready for your first survey?`, title: "Ready for your first survey?", text: "Your first survey is where your points begin.", link: links.surveys, cta: "See my surveys" },
        redeem: { template: "redeem", subject: `${first}, you have earned a reward`, title: "You can redeem your points", text: `You have ${fmt(hit.available || 0)} points ready to use. Pick a reward whenever you like.`, link: links.rewards, cta: "Choose my reward" },
        streak: { template: "streak", subject: `${first}, keep your ${hit.streak}-day streak going`, title: `Keep your ${hit.streak}-day streak`, text: `You have been active ${hit.streak} days in a row. A quick visit today keeps it going.`, link: links.dashboard, cta: "Keep my streak" },
    }[hit.key];
    const data = {
        brand, member: { firstName: first }, links, preferences_url: `${site}/member/settings`, ...extra,
        surveys: (hit.surveys || []).map((x) => ({ name: x.name, points: fmt(x.points ?? 0), minutes: x.loi ?? null })),
        points: hit.available != null ? fmt(hit.available) : undefined, money: hit.available != null ? money(hit.available) : undefined,
        streak: hit.streak, next: hit.next ? { days: hit.next.days, points: fmt(hit.next.points), daysLeft: hit.next.daysLeft } : null,
    };
    return { ...M, data, first, brand };
}

/**
 * Sends one reminder on every channel the member can get: the dashboard notice always; e-mail to the registered
 * address unless they turned e-mails off (the two account reminders always go); browser push, WhatsApp and SMS when
 * the member chose them and the brand switched them on. True when at least one channel got it.
 */
async function deliverReminder(user, hit, prefs, out) {
    const m = await message(user, hit);
    const marketing = BY_KEY.get(hit.key).kind === "marketing";
    const n = prefs?.notifications || {};
    const got = [];
    await MemberNotice.create({ origin: user.origin, user: user._id, kind: hit.key, title: m.title, body: m.text, cta: m.link, ctaLabel: m.cta });
    got.push("dashboard");
    if (!(marketing && n.email === false)) {
        const ok = await send({ origin: user.origin, to: user.mail, category: "reminders", template: m.template, subject: m.subject, data: m.data });
        if (ok) got.push("email");
    }
    if (n.push) {
        if (await pushTo(user._id, user.origin, { title: m.title, body: m.text, url: m.link })) got.push("push");
    }
    const short = `${m.brand.name}: Hi ${m.first}, ${m.text} ${m.link}`;
    for (const ch of ["whatsapp", "sms"]) {
        if (!n[ch]) continue;
        if (!(await isOn(user.origin, ch))) { out(`${ch}_switched_off`); continue; }
        const r = await deliver(user.origin, ch, hit.key, e164(user.phone, user.address?.[0]?.country), { name: m.first, link: m.link, text: short });
        if (r.ok) got.push(ch);
        else out(`${ch}_${r.why}`);
    }
    return got;
}

/**
 * Checks every member of the brand (or every brand that saved settings) and sends at most one reminder each. Dry run:
 * counts only, sends and records nothing. `limit` caps how many members are checked (for a quick preview).
 */
export async function runReminders({ dryRun = false, origin, now = new Date(), limit } = {}) {
    const brands = origin ? [origin] : (await ReminderSetting.find({}).select("origin").lean()).map((r) => r.origin);
    const report = { dryRun, brands: {}, checked: 0, due: 0, sent: 0, byCase: {}, channels: {}, skipped: {} };
    for (const brand of brands) {
        const set = await settings(brand);
        const switchOn = await isOn(brand, "email_reminders");
        const b = (report.brands[brand] = { switchOn, checked: 0, due: 0, sent: 0, byCase: {}, channels: {}, skipped: {} });
        if (!switchOn && !dryRun) continue;
        const rules = new Map(set.cases.filter((c) => c.enabled).map((c) => [c.key, c]));
        if (!rules.size) continue;
        const skip = (why) => { b.skipped[why] = (b.skipped[why] || 0) + 1; report.skipped[why] = (report.skipped[why] || 0) + 1; };
        const q = { origin: brand, isActive: true, isDeleted: false, registrationStatus: { $in: ["active", null] }, memberStatus: { $in: ["active", null] }, category: { $not: /minor/ } };
        const cursor = User.find(q).select("name mail phone category timezone origin terms respondentID updatedAt createdAt address").lean().cursor();
        for await (const user of cursor) {
            if (limit && b.checked >= limit) break;
            b.checked += 1; report.checked += 1;
            if (memberType(user) === "teen") { skip("teen"); continue; }
            const prefs = await MemberPreference.findOne({ user: user._id, origin: brand }).lean();
            const st = prefs?.reminders || {};
            const hits = await casesFor(user, brand, now);
            // a case that is over starts again from zero next time
            const over = Object.keys(st).filter((k) => (st[k]?.count || 0) > 0 && !hits.some((h) => h.key === k));
            if (over.length && !dryRun)
                await MemberPreference.updateOne({ user: user._id, origin: brand }, { $unset: Object.fromEntries(over.map((k) => [`reminders.${k}`, ""])) });
            if (!hits.length) { skip("nothing_to_do"); continue; }
            if (prefs?.lastReminderAt && now - new Date(prefs.lastReminderAt) < set.minGapDays * DAY) { skip("min_gap"); continue; }
            const recentlyActive = now - (await lastActivity(user)) < DAY;
            let pick = null, why = "not_enabled";
            for (const h of hits) {
                const r = rules.get(h.key);
                if (!r) continue;
                const c = BY_KEY.get(h.key);
                const s = st[h.key] || {};
                // "Stop these reminders" stops the marketing ones on every channel; e-mails off only skips the e-mail
                if (c.kind === "marketing" && prefs?.notifications?.lifecycle === false) { why = "opted_out"; continue; }
                if (h.key === "surveys" && prefs?.notifications?.newSurvey === false) { why = "opted_out"; continue; }
                if ((s.count || 0) >= r.max) { why = "max_reached"; continue; }
                if (s.lastAt && now - new Date(s.lastAt) < r.everyDays * DAY) { why = "too_soon"; continue; }
                if (recentlyActive && h.key !== "streak") { why = "active_recently"; continue; }
                pick = h; break;
            }
            if (!pick) { skip(why); continue; }
            b.due += 1; report.due += 1;
            b.byCase[pick.key] = (b.byCase[pick.key] || 0) + 1;
            report.byCase[pick.key] = (report.byCase[pick.key] || 0) + 1;
            if (dryRun) continue;
            const got = await deliverReminder(user, pick, prefs, skip);
            for (const ch of got) { b.channels[ch] = (b.channels[ch] || 0) + 1; report.channels[ch] = (report.channels[ch] || 0) + 1; }
            await MemberPreference.updateOne(
                { user: user._id, origin: brand },
                { $set: { [`reminders.${pick.key}.lastAt`]: now, lastReminderAt: now }, $inc: { [`reminders.${pick.key}.count`]: 1 }, $setOnInsert: { user: user._id, origin: brand } },
                { upsert: true },
            );
            b.sent += 1; report.sent += 1;
        }
    }
    return report;
}

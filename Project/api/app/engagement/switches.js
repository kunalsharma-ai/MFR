// Per-brand feature switches (super admin spec, step 4). The engagement config gives each feature a default for every
// brand; a FeatureSwitch row set from the MADP console overrides it. A row can be for the whole brand, or narrowed to
// one segment (consumer, professional, teen), one country, or both. The brand's kill switch, when on, turns every
// switch below off at once, whatever the rows say.
//
// Which row applies to a member (most specific first):
//   segment + country  >  segment  >  country  >  whole brand  >  config default
// A country row matches the member's country when it is equal to it or a prefix of it (the same rule as the reward
// catalogue and the draws), and the longest match wins.
//
// Some switches also carry a number (points_hold: days, weekend_multiplier: the multiplier). The number applies only
// while the switch is on; with no number set the default number is used.
//
// Every caller asks at the moment it is about to act, so a change applies within CACHE_MS everywhere.
import { FeatureSwitch } from "../model/index.js";
import { config } from "./config.js";
import { memberType } from "./http.js";

export const KILL = "kill";
export const SEGMENTS = ["consumer", "professional", "teen"];
export const COUNTRY = /^[a-z][a-z .'-]{1,59}$/;

// group: money (pays or spends points for value), legal (needs legal clearance), email (sends to members or the team)
// effect: what members notice when the switch is on (the console shows it next to the switch)
export const SWITCHES = [
    { key: "redemptions", group: "money", label: "Reward redemptions", def: (c) => c.rewards?.redemptionsEnabled,
        effect: "Adult members can spend cleared points on rewards. When off, the rewards page says redemptions open soon and points keep adding up." },
    { key: "teen_redemptions", group: "money", label: "Teen learning rewards (guardian approves each)", def: (c) => c.teen?.redemptionsEnabled,
        effect: "Teen Panel members can ask for learning rewards. Each request waits for their guardian's YES by e-mail. No cash, ever." },
    { key: "points_hold", group: "money", label: "Hold new points before they can be spent", def: (c) => Number(c.points?.holdDays) > 0,
        value: { unit: "days", min: 1, max: 90, step: 1, def: (c) => Number(c.points?.holdDays) || 30 },
        effect: "Points earned after the switch goes on show as pending for the set number of days before they can be spent. Points already earned are never moved back." },
    { key: "points_expiry", group: "money", label: "Points expiry", def: (c) => c.expiry?.enabled,
        effect: "Turns on points expiry reminders (together with the expiry e-mail switch). Nothing ever deducts points today: there is no expiry job." },
    { key: "weekend_multiplier", group: "money", label: "Weekend survey points multiplier", def: (c) => Number(c.bonus?.weekendMultiplier) > 1,
        value: { unit: "x", min: 1.1, max: 5, step: 0.1, def: (c) => (Number(c.bonus?.weekendMultiplier) > 1 ? Number(c.bonus.weekendMultiplier) : 2) },
        effect: "Surveys finished on a Saturday or Sunday (member's time zone) after the switch goes on earn extra points: the multiplier minus one, as a bonus entry. Adult members only." },
    { key: "bonuses", group: "money", label: "Streak, challenge and referral bonuses", def: () => true,
        effect: "Pays the streak bonuses, monthly challenge points and referral tier bonuses set in the engagement config (they pay today). When off, none are added; turning it back on adds the ones members earned meanwhile." },
    { key: "draw", group: "legal", label: "Monthly points prize draw", def: (c) => c.draw?.enabled,
        effect: "Adult members in the draw's countries can buy tickets with points. Teens never see draws." },
    { key: "prize_machines", group: "legal", label: "Prize machines", def: () => false,
        effect: "Members see their segment's prize machine (claw, lift or spiral) on the hub and can play it up to its daily limit. Teen prizes are never points or money." },
    { key: "email_welcome", group: "email", label: "Account active e-mail", def: (c) => c.emails?.welcome,
        effect: "New members get the account active e-mail." },
    { key: "email_new_user", group: "email", label: "New registration e-mail to the team", def: (c) => c.emails?.newUser?.enabled,
        effect: "The team gets an e-mail for each new registration. Nothing goes to members." },
    { key: "email_new_survey", group: "email", label: "New survey invitation e-mail", def: (c) => c.emails?.newSurvey,
        effect: "Members who kept survey e-mails on are e-mailed when a survey opens for them." },
    { key: "email_birthday", group: "email", label: "Birthday e-mail", def: (c) => c.emails?.birthday,
        effect: "Members get a birthday e-mail on the day." },
    { key: "email_lifecycle", group: "email", label: "Sign-up reminder e-mails", def: (c) => c.emails?.lifecycle?.enabled,
        effect: "Members who have not finished signing up get reminder e-mails." },
    { key: "email_reminders", group: "email", label: "Auto reminder e-mails (set from MADP: surveys waiting, rewards, streak, sign-up steps)", def: () => false,
        effect: "Members get the reminders switched on in MADP's Auto reminders screen, at the days set there. When off, MADP can still preview who would get one; nothing is sent." },
    { key: "email_weekly", group: "email", label: "Weekly points summary e-mail", def: (c) => c.weeklySummary?.enabled,
        effect: "Members who kept it on get a weekly points summary." },
    { key: "email_expiry", group: "email", label: "Points expiry reminder e-mail", def: (c) => c.expiry?.enabled,
        effect: "Members are reminded before points would expire. Needs the points expiry switch on as well." },
    { key: "email_turning18", group: "email", label: "Turning 18 e-mails (30-day notice, guardian's consent ended)", def: () => false,
        effect: "Teen members get a notice 30 days before they turn 18, and the guardian is told when their consent ends." },
    { key: "email_admin_actions", group: "email", label: "Console e-mails to one member (password reset link, welcome again)", def: () => false,
        effect: "Admins can e-mail one member a password reset link or the welcome e-mail again from the MADP console. When off, the console shows what would be sent and nothing goes out." },
    { key: "push", group: "email", label: "Browser push notifications", def: (c) => c.push?.enabled,
        effect: "Members can allow browser notifications and get them." },
    { key: "whatsapp", group: "email", label: "WhatsApp messages", def: (c) => c.whatsapp?.enabled,
        effect: "Members can choose WhatsApp messages in their notification settings. No provider is connected yet, so nothing is sent." },
    { key: "sms", group: "email", label: "SMS messages", def: () => false,
        effect: "Members can choose SMS in their notification settings. No SMS provider is connected yet, so nothing is sent." },
];
const BY_KEY = new Map(SWITCHES.map((s) => [s.key, s]));
export const isKey = (k) => k === KILL || BY_KEY.has(k);
export const spec = (k) => BY_KEY.get(k) || null;

const norm = (v) => (v == null || v === "" ? null : String(v).trim().toLowerCase());
const CACHE_MS = 10_000;
const cache = new Map(); // origin -> { at, rows: Map(key -> row[]) }
async function rowsFor(origin) {
    const hit = cache.get(origin);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.rows;
    const list = await FeatureSwitch.find({ origin }).lean();
    const rows = new Map();
    for (const r of list) {
        if (!rows.has(r.key)) rows.set(r.key, []);
        rows.get(r.key).push({ ...r, segment: norm(r.segment), country: norm(r.country) });
    }
    cache.set(origin, { at: Date.now(), rows });
    return rows;
}
export const forget = (origin) => (origin ? cache.delete(origin) : cache.clear());

const defaultOf = (key) => Boolean(BY_KEY.get(key)?.def(config()));
const defaultValueOf = (key) => (BY_KEY.get(key)?.value ? Number(BY_KEY.get(key).value.def(config())) : null);
const brandRow = (list) => (list || []).find((r) => !r.segment && !r.country) || null;

/** The member's scope for switch lookups: their segment and their country. */
export function scopeOf(user) {
    return { segment: user ? memberType(user) : null, country: norm(user?.address?.[0]?.country) };
}

// the row that applies to this scope, or null (then the default applies)
function pick(list, { segment, country } = {}) {
    if (!list?.length) return null;
    const s = norm(segment), c = norm(country);
    const countryMatch = (r) => r.country && c && (c === r.country || c.startsWith(r.country));
    const best = (rows) => rows.sort((a, b) => b.country.length - a.country.length)[0] || null;
    if (s && c) { const r = best(list.filter((r) => r.segment === s && countryMatch(r))); if (r) return r; }
    if (s) { const r = list.find((r) => r.segment === s && !r.country); if (r) return r; }
    if (c) { const r = best(list.filter((r) => !r.segment && countryMatch(r))); if (r) return r; }
    return brandRow(list);
}

/**
 * What is in force for this brand and scope: { on, value, since, from }.
 *   from: "kill" | "segment+country" | "segment" | "country" | "brand" | "default"
 *   since: when the applying row last went from off to on (null for a default), so callers never pay for the past
 */
export async function resolve(origin, key, scope = {}) {
    const s = BY_KEY.get(key);
    if (!s || !origin) return { on: false, value: null, since: null, from: "unknown" };
    const rows = await rowsFor(origin);
    if (brandRow(rows.get(KILL))?.on) return { on: false, value: null, since: null, from: "kill" };
    const r = pick(rows.get(key), scope);
    const on = r ? Boolean(r.on) : defaultOf(key);
    const value = !s.value || !on ? null : r && r.value != null ? Number(r.value) : defaultValueOf(key);
    const from = !r ? "default" : r.segment && r.country ? "segment+country" : r.segment ? "segment" : r.country ? "country" : "brand";
    return { on, value, since: r && on ? r.since || null : null, from };
}

/** Whether the feature is on for this brand now (and, if given, for this segment and country). Unknown keys are off. */
export async function isOn(origin, key, scope = {}) {
    return (await resolve(origin, key, scope)).on;
}

/** For jobs that run over every brand: true when the feature could be on for at least one brand. */
export async function onAnywhere(key) {
    if (defaultOf(key)) return true;
    return Boolean(await FeatureSwitch.exists({ key, on: true }));
}

const rowView = (r) => ({
    segment: r.segment || null, country: r.country || null, on: Boolean(r.on), value: r.value ?? null,
    reason: r.reason || null, changedBy: r.changedBy || null, changedAt: r.updatedAt || null, since: r.since || null,
});

/**
 * The brand's switch board: each switch, its default, the whole-brand row, the narrower rows and what is in force.
 * With a scope ({segment, country}), `effective` and `value` are what a member in that scope gets.
 */
export async function board(origin, scope = {}) {
    forget(origin);
    const rows = await rowsFor(origin);
    const killed = Boolean(brandRow(rows.get(KILL))?.on);
    const view = (key, extra) => {
        const r = brandRow(rows.get(key));
        return { key, ...extra, set: r ? Boolean(r.on) : null, reason: r?.reason || null, changedBy: r?.changedBy || null, changedAt: r?.updatedAt || null };
    };
    const items = [];
    for (const s of SWITCHES) {
        const now = await resolve(origin, s.key, scope);
        const r = brandRow(rows.get(s.key));
        items.push(view(s.key, {
            group: s.group, label: s.label, effect: s.effect,
            default: defaultOf(s.key),
            effective: now.on, from: now.from,
            valued: s.value ? { unit: s.value.unit, min: s.value.min, max: s.value.max, step: s.value.step, default: defaultValueOf(s.key) } : null,
            setValue: r?.value ?? null, value: now.value,
            overrides: (rows.get(s.key) || []).filter((x) => x.segment || x.country).map(rowView)
                .sort((a, b) => `${a.segment || ""}|${a.country || ""}`.localeCompare(`${b.segment || ""}|${b.country || ""}`)),
        }));
    }
    return {
        killed,
        scope: { segment: norm(scope.segment), country: norm(scope.country) },
        segments: SEGMENTS,
        kill: view(KILL, { group: "kill", label: "Stop everything on this brand", effect: "Every switch on this brand is off at once, whatever its own setting. Each switch keeps its setting for when the kill is lifted.", default: false, effective: killed }),
        switches: items,
    };
}

/**
 * Set one switch for a brand, or for one segment and/or country of it. The caller (MADP) has already checked it is a
 * Super Admin and asked for a reason. on === null removes a narrower row (the wider setting applies again).
 */
export async function set(origin, key, on, reason, actor, { segment = null, country = null, value } = {}) {
    const where = { origin, key, segment: norm(segment), country: norm(country) };
    const prev = await FeatureSwitch.findOne(where).lean();
    const before = prev ? { on: Boolean(prev.on), value: prev.value ?? null } : null;
    if (on === null) {
        if (prev) await FeatureSwitch.deleteOne({ _id: prev._id });
        forget(origin);
        return { key, segment: where.segment, country: where.country, before, on: null, value: null };
    }
    const $set = { on, reason, changedBy: actor, isActive: true, isDeleted: false };
    if (value !== undefined) $set.value = value;
    // `since` marks when it went on, so hold days and multipliers never reach back before that moment
    if (on && !(prev && prev.on)) $set.since = new Date();
    const nextValue = value !== undefined ? value : prev?.value ?? null;
    await FeatureSwitch.updateOne(
        where,
        { $set, $push: { history: { $each: [{ on, value: nextValue, reason, by: actor, at: new Date() }], $slice: -50 } } },
        { upsert: true }
    );
    forget(origin);
    return { key, segment: where.segment, country: where.country, before, on, value: nextValue };
}

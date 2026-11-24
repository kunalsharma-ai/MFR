// Per-brand feature switches (super admin spec, step 4). The engagement config gives each feature a default for every
// brand; a FeatureSwitch row set from the MADP console overrides it for one brand. The brand's kill switch, when on,
// turns every switch below off at once, whatever the rows say.
//
// Every caller asks isOn(origin, key) at the moment it is about to act, so a change applies within CACHE_MS everywhere.
import { FeatureSwitch } from "../model/index.js";
import { config } from "./config.js";

export const KILL = "kill";
// group: money (pays or spends points for value), legal (needs legal clearance), email (sends to members or the team)
export const SWITCHES = [
    { key: "redemptions", group: "money", label: "Reward redemptions", def: (c) => c.rewards?.redemptionsEnabled },
    { key: "teen_redemptions", group: "money", label: "Teen learning rewards (guardian approves each)", def: (c) => c.teen?.redemptionsEnabled },
    { key: "draw", group: "legal", label: "Monthly points prize draw", def: (c) => c.draw?.enabled },
    { key: "email_welcome", group: "email", label: "Account active e-mail", def: (c) => c.emails?.welcome },
    { key: "email_new_user", group: "email", label: "New registration e-mail to the team", def: (c) => c.emails?.newUser?.enabled },
    { key: "email_new_survey", group: "email", label: "New survey invitation e-mail", def: (c) => c.emails?.newSurvey },
    { key: "email_birthday", group: "email", label: "Birthday e-mail", def: (c) => c.emails?.birthday },
    { key: "email_lifecycle", group: "email", label: "Sign-up reminder e-mails", def: (c) => c.emails?.lifecycle?.enabled },
    { key: "email_weekly", group: "email", label: "Weekly points summary e-mail", def: (c) => c.weeklySummary?.enabled },
    { key: "email_expiry", group: "email", label: "Points expiry reminder e-mail", def: (c) => c.expiry?.enabled },
    { key: "email_turning18", group: "email", label: "Turning 18 e-mails (30-day notice, guardian's consent ended)", def: () => false },
    { key: "push", group: "email", label: "Browser push notifications", def: (c) => c.push?.enabled },
];
const BY_KEY = new Map(SWITCHES.map((s) => [s.key, s]));
export const isKey = (k) => k === KILL || BY_KEY.has(k);

const CACHE_MS = 10_000;
const cache = new Map(); // origin -> { at, rows: Map(key -> row) }
async function rowsFor(origin) {
    const hit = cache.get(origin);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.rows;
    const list = await FeatureSwitch.find({ origin }).lean();
    const rows = new Map(list.map((r) => [r.key, r]));
    cache.set(origin, { at: Date.now(), rows });
    return rows;
}
export const forget = (origin) => (origin ? cache.delete(origin) : cache.clear());

const defaultOf = (key) => Boolean(BY_KEY.get(key)?.def(config()));

/** Whether the feature is on for this brand now. Unknown keys are off. */
export async function isOn(origin, key) {
    if (!BY_KEY.has(key) || !origin) return false;
    const rows = await rowsFor(origin);
    if (rows.get(KILL)?.on) return false;
    const r = rows.get(key);
    return r ? Boolean(r.on) : defaultOf(key);
}

/** For jobs that run over every brand: true when the feature could be on for at least one brand. */
export async function onAnywhere(key) {
    if (defaultOf(key)) return true;
    return Boolean(await FeatureSwitch.exists({ key, on: true }));
}

/** The brand's switch board: each switch, its default, its current row and what is in force. */
export async function board(origin) {
    forget(origin);
    const rows = await rowsFor(origin);
    const killed = Boolean(rows.get(KILL)?.on);
    const view = (key, extra) => {
        const r = rows.get(key);
        return { key, ...extra, set: r ? Boolean(r.on) : null, reason: r?.reason || null, changedBy: r?.changedBy || null, changedAt: r?.updatedAt || null };
    };
    return {
        killed,
        kill: view(KILL, { group: "kill", label: "Stop everything on this brand", default: false, effective: killed }),
        switches: SWITCHES.map((s) => view(s.key, { group: s.group, label: s.label, default: defaultOf(s.key), effective: killed ? false : rows.has(s.key) ? Boolean(rows.get(s.key).on) : defaultOf(s.key) })),
    };
}

/** Set one switch for a brand. The caller (MADP) has already checked it is a Super Admin and asked for a reason. */
export async function set(origin, key, on, reason, actor) {
    const prev = await FeatureSwitch.findOne({ origin, key }).lean();
    await FeatureSwitch.updateOne(
        { origin, key },
        { $set: { on, reason, changedBy: actor, isActive: true, isDeleted: false }, $push: { history: { $each: [{ on, reason, by: actor, at: new Date() }], $slice: -50 } } },
        { upsert: true }
    );
    forget(origin);
    return { key, before: prev ? Boolean(prev.on) : null, on };
}

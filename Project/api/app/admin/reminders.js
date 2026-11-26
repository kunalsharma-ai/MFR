// Auto reminders and message channels for the MADP console (one brand at a time, req.adminOrigin).
//   GET  /reminders                 the settings for every case, the switches and the channel set-up
//   PUT  /reminders                 save cases { key: { enabled, everyDays, max } } and minGapDays
//   POST /reminders/preview         dry run: who would get which reminder now (counts only, nothing sent or saved)
//   GET  /channels                  WhatsApp and SMS providers (keys never returned, only their last 4 characters)
//   PUT  /channels/:channel         set up or change a provider
//   POST /channels/:channel/check   ask the provider whether the keys work (sends nothing)
//   POST /channels/:channel/remove  remove a provider
import * as R from "../engagement/reminders.js";
import * as C from "../engagement/channels.js";
import { isOn } from "../engagement/switches.js";
import { AdminError } from "./http.js";

const SWITCHES = ["email_reminders", "push", "whatsapp", "sms"];

export async function get(origin) {
    const switches = Object.fromEntries(await Promise.all(SWITCHES.map(async (k) => [k, await isOn(origin, k)])));
    return { ...(await R.settings(origin)), limits: R.LIMITS, switches, channels: (await C.list(origin)).channels };
}

export async function save(origin, body = {}, actor) {
    const r = await R.save(origin, body, actor);
    if (!r.ok) throw new AdminError("invalid_value", r.errors.join("; "));
    return r.settings;
}

export async function preview(origin, body = {}) {
    const limit = Math.min(Math.max(Number(body.limit) || 2000, 1), 20000);
    const r = await R.runReminders({ dryRun: true, origin, limit });
    const b = r.brands[origin] || { checked: 0, due: 0, byCase: {}, skipped: {} };
    return { checked: b.checked, due: b.due, byCase: b.byCase, skipped: b.skipped, limited: b.checked >= limit, switchOn: b.switchOn ?? false };
}

export const channels = (origin) => C.list(origin);
export const saveChannel = (origin, channel, body, actor) => C.save(origin, channel, body, actor);
export const checkChannel = (origin, channel) => C.check(origin, channel);
export const removeChannel = (origin, channel) => C.remove(origin, channel);

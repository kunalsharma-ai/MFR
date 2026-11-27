// WhatsApp and SMS for the Auto reminders, with providers a brand's admin sets up in the MADP console. Each brand has
// at most one provider per channel. Keys are encrypted and only the last 4 characters are ever shown again.
//
//   sms        twilio        Account SID + auth token, a sender number. Plain text.
//              msg91         Auth key; India DLT needs a Flow template id per reminder (variables: name, link).
//   whatsapp   twilio        Account SID + auth token, a WhatsApp sender. With a Content template SID per reminder
//                            it sends that template (variables 1 = first name, 2 = link); without one, plain text,
//                            which WhatsApp only delivers inside a 24-hour customer window.
//              meta          WhatsApp Cloud API: access token + phone number id, an approved template per reminder
//                            (body variables: first name, link).
//
// Nothing is sent unless the brand's "whatsapp" / "sms" switch is on and the member chose that channel. "Check
// connection" only asks the provider whether the keys are valid; it sends nothing.
// CHANNEL_TWILIO_BASE, CHANNEL_META_BASE, CHANNEL_MSG91_BASE change the provider hosts (tests only).
import { ChannelProvider } from "../model/index.js";
import { seal, open } from "../utils/secretBox.js";
import { AdminError } from "../admin/http.js";

const TWILIO = () => process.env.CHANNEL_TWILIO_BASE || "https://api.twilio.com";
const META = () => process.env.CHANNEL_META_BASE || "https://graph.facebook.com/v21.0";
const MSG91 = () => process.env.CHANNEL_MSG91_BASE || "https://control.msg91.com";
const TIMEOUT = 10_000;

export const PROVIDERS = {
    sms: {
        twilio: { label: "Twilio SMS", fields: [{ key: "accountSid", label: "Account SID" }, { key: "authToken", label: "Auth token", secret: true }], sender: "Sender number (+countrycode)", templates: false },
        msg91: { label: "MSG91 (India, DLT)", fields: [{ key: "authKey", label: "Auth key", secret: true }], sender: "Sender ID (6 letters)", templates: "Flow template id" },
    },
    whatsapp: {
        twilio: { label: "Twilio WhatsApp", fields: [{ key: "accountSid", label: "Account SID" }, { key: "authToken", label: "Auth token", secret: true }], sender: "WhatsApp sender (+countrycode)", templates: "Content template SID (optional)" },
        meta: { label: "WhatsApp Cloud API (Meta)", fields: [{ key: "phoneNumberId", label: "Phone number id" }, { key: "accessToken", label: "Access token", secret: true }], sender: "Business number shown to members", templates: "Approved template name" },
    },
};
export const CHANNELS = Object.keys(PROVIDERS);

const hint = (provider, creds, channel) => {
    const main = PROVIDERS[channel][provider].fields.find((f) => f.secret)?.key;
    const v = String(creds?.[main] || "");
    return v.length >= 8 ? v.slice(-4) : "";
};
const view = (r) =>
    r && {
        channel: r.channel, provider: r.provider, providerLabel: PROVIDERS[r.channel]?.[r.provider]?.label || r.provider,
        keyHint: r.keyHint || "", sender: r.sender || "", templates: r.templates || {}, language: r.language || "en",
        checkedAt: r.checkedAt || null, checkOk: r.checkOk ?? null, checkMessage: r.checkMessage || "", updatedAt: r.updatedAt, updatedBy: r.updatedBy || null,
    };

export async function list(origin) {
    const rows = await ChannelProvider.find({ origin }).lean();
    return {
        providers: PROVIDERS,
        channels: CHANNELS.map((c) => ({ channel: c, setup: view(rows.find((r) => r.channel === c)) || null })),
    };
}

const TEMPLATE_KEY = /^[a-z_]{2,30}$/;
const TEMPLATE_VAL = /^[\w.:\-]{1,120}$/;

/** Saves a brand's provider. Credentials can be left out to keep the saved ones (same provider only). */
export async function save(origin, channel, body = {}, actor) {
    if (!CHANNELS.includes(channel)) throw new AdminError("not_found", "No such channel", 404);
    const p = PROVIDERS[channel][body.provider];
    if (!p) throw new AdminError("invalid_value", `provider is ${Object.keys(PROVIDERS[channel]).join(" or ")}`);
    const old = await ChannelProvider.findOne({ origin, channel }).select("+secret").lean();
    let creds = old && old.provider === body.provider ? open(old.secret) || {} : {};
    if (body.credentials && typeof body.credentials === "object") {
        for (const f of p.fields) {
            const v = body.credentials[f.key];
            if (v === undefined || v === "") continue;
            if (typeof v !== "string" || v.length > 500 || /\s/.test(v.trim())) throw new AdminError("invalid_value", `${f.label} is not valid`);
            creds[f.key] = v.trim();
        }
    }
    const missing = p.fields.filter((f) => !creds[f.key]).map((f) => f.label);
    if (missing.length) throw new AdminError("invalid_value", `Missing: ${missing.join(", ")}`);
    const sender = String(body.sender ?? old?.sender ?? "").trim().slice(0, 60);
    const templates = {};
    for (const [k, v] of Object.entries(body.templates ?? old?.templates ?? {})) {
        if (v === "" || v == null) continue;
        if (!TEMPLATE_KEY.test(k) || !TEMPLATE_VAL.test(String(v))) throw new AdminError("invalid_value", `Template for ${k} is not valid`);
        templates[k] = String(v);
    }
    const language = /^[a-z]{2}(_[A-Z]{2})?$/.test(String(body.language || "")) ? body.language : old?.language || "en";
    await ChannelProvider.updateOne(
        { origin, channel },
        { $set: { provider: body.provider, secret: seal(creds), keyHint: hint(body.provider, creds, channel), sender, templates, language, updatedBy: actor || null, checkedAt: null, checkOk: null, checkMessage: "" }, $setOnInsert: { origin, channel } },
        { upsert: true },
    );
    return view(await ChannelProvider.findOne({ origin, channel }).lean());
}

export async function remove(origin, channel) {
    const r = await ChannelProvider.deleteOne({ origin, channel });
    return { removed: r.deletedCount > 0 };
}

async function call(url, init) {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT) });
    let body = null;
    try { body = await res.json(); } catch { /* not json */ }
    return { ok: res.ok, status: res.status, body };
}
const basic = (c) => `Basic ${Buffer.from(`${c.accountSid}:${c.authToken}`).toString("base64")}`;

async function loadWithCreds(origin, channel) {
    const row = await ChannelProvider.findOne({ origin, channel }).select("+secret").lean();
    if (!row) return null;
    return { row, creds: open(row.secret) };
}

/** Asks the provider whether the saved keys work. Sends no message. */
export async function check(origin, channel) {
    const x = await loadWithCreds(origin, channel);
    if (!x) throw new AdminError("not_found", "Set up a provider first", 404);
    const { row, creds } = x;
    let ok = false, message = "";
    try {
        if (!creds) message = "The saved keys can't be read any more (the server key changed). Enter them again.";
        else if (row.provider === "twilio") {
            const r = await call(`${TWILIO()}/2010-04-01/Accounts/${encodeURIComponent(creds.accountSid)}.json`, { headers: { authorization: basic(creds) } });
            ok = r.ok; message = r.ok ? `Connected to Twilio account ${r.body?.friendly_name || ""}`.trim() : `Twilio said ${r.status}: ${r.body?.message || "check the SID and token"}`;
        } else if (row.provider === "meta") {
            const r = await call(`${META()}/${encodeURIComponent(creds.phoneNumberId)}?fields=display_phone_number,verified_name`, { headers: { authorization: `Bearer ${creds.accessToken}` } });
            ok = r.ok; message = r.ok ? `Connected to ${r.body?.verified_name || "WhatsApp"} ${r.body?.display_phone_number || ""}`.trim() : `Meta said ${r.status}: ${r.body?.error?.message || "check the token and phone number id"}`;
        } else if (row.provider === "msg91") {
            ok = Boolean(creds.authKey);
            message = "MSG91 keys are saved. MSG91 has no key check, so the first reminder will show whether they work.";
        }
    } catch (e) {
        message = `Could not reach the provider: ${e.message}`;
    }
    await ChannelProvider.updateOne({ _id: row._id }, { $set: { checkedAt: new Date(), checkOk: ok, checkMessage: message.slice(0, 300) } });
    return { ok, message };
}

/** International number with +, from the stored phone and the member's country (Indian 10-digit numbers get +91). */
export function e164(phone, country) {
    const plus = String(phone || "").trim().startsWith("+");
    let d = String(phone || "").replace(/\D/g, "");
    if (!plus) d = d.replace(/^0+/, ""); // a national trunk 0
    if (!d) return null;
    if (d.length === 10 && (!country || String(country).toLowerCase() === "in")) d = `91${d}`;
    return d.length >= 11 && d.length <= 15 ? `+${d}` : null;
}

/**
 * Sends one reminder over WhatsApp or SMS. `vars` = { name, link, text }. Returns { ok, why } and never throws, so a
 * provider problem never stops the other channels.
 */
export async function deliver(origin, channel, caseKey, to, vars) {
    try {
        const x = await loadWithCreds(origin, channel);
        if (!x) return { ok: false, why: "no_provider" };
        const { row, creds } = x;
        if (!creds) return { ok: false, why: "keys_unreadable" };
        if (!to) return { ok: false, why: "no_phone" };
        const tpl = row.templates?.[caseKey];
        if (row.provider === "twilio") {
            const wa = channel === "whatsapp";
            const form = new URLSearchParams({ To: wa ? `whatsapp:${to}` : to, From: wa ? `whatsapp:${row.sender}` : row.sender });
            if (wa && tpl) { form.set("ContentSid", tpl); form.set("ContentVariables", JSON.stringify({ 1: vars.name, 2: vars.link })); }
            else form.set("Body", vars.text);
            const r = await call(`${TWILIO()}/2010-04-01/Accounts/${encodeURIComponent(creds.accountSid)}/Messages.json`, { method: "POST", headers: { authorization: basic(creds), "content-type": "application/x-www-form-urlencoded" }, body: form.toString() });
            return r.ok ? { ok: true } : { ok: false, why: `provider_${r.status}` };
        }
        if (row.provider === "meta") {
            if (!tpl) return { ok: false, why: "no_template" };
            const r = await call(`${META()}/${encodeURIComponent(creds.phoneNumberId)}/messages`, {
                method: "POST",
                headers: { authorization: `Bearer ${creds.accessToken}`, "content-type": "application/json" },
                body: JSON.stringify({
                    messaging_product: "whatsapp", to: to.replace(/^\+/, ""), type: "template",
                    template: { name: tpl, language: { code: row.language || "en" }, components: [{ type: "body", parameters: [{ type: "text", text: vars.name }, { type: "text", text: vars.link }] }] },
                }),
            });
            return r.ok ? { ok: true } : { ok: false, why: `provider_${r.status}` };
        }
        if (row.provider === "msg91") {
            if (!tpl) return { ok: false, why: "no_template" };
            const r = await call(`${MSG91()}/api/v5/flow`, {
                method: "POST",
                headers: { authkey: creds.authKey, "content-type": "application/json", accept: "application/json" },
                body: JSON.stringify({ template_id: tpl, short_url: "0", recipients: [{ mobiles: to.replace(/^\+/, ""), name: vars.name, link: vars.link }] }),
            });
            return r.ok && r.body?.type !== "error" ? { ok: true } : { ok: false, why: `provider_${r.status}` };
        }
        return { ok: false, why: "unknown_provider" };
    } catch (e) {
        return { ok: false, why: "provider_unreachable" };
    }
}

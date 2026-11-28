// Auto reminders and message channels (Kunal, 26 Nov 2026). Real routes and MongoDB; e-mails go to an outbox folder
// and WhatsApp / SMS to a stand-in provider, so nothing leaves the machine.
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_reminders node --test --test-force-exit tests/reminders.test.mjs
import test from "node:test";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const SECRET = "test-admin-secret-0123456789abcdef";
const MFR = "www.myfrequentrewards.com";
const T2O = "www.turn2opinion.com";
process.env.MADP_ADMIN_API_SECRETS = SECRET;
process.env.MADP_ADMIN_API_ORIGINS = `${MFR},${T2O}`;
const OUTBOX = fs.mkdtempSync(path.join(os.tmpdir(), "mfr-reminders-"));
process.env.ENGAGEMENT_MAIL_OUTBOX = OUTBOX;

// stand-in Twilio: remembers what it was asked
const calls = [];
const fake = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
        calls.push({ method: req.method, url: req.url, auth: req.headers.authorization, body });
        res.setHeader("content-type", "application/json");
        if (req.headers.authorization !== `Basic ${Buffer.from("AC123:tok-secret-9876").toString("base64")}`) { res.statusCode = 401; return res.end(JSON.stringify({ message: "Authenticate" })); }
        res.end(JSON.stringify(req.method === "GET" ? { friendly_name: "Test account" } : { sid: "SM1" }));
    });
});
await new Promise((r) => fake.listen(0, "127.0.0.1", r));
process.env.CHANNEL_TWILIO_BASE = `http://127.0.0.1:${fake.address().port}`;

const { default: mongoose } = await import("mongoose");
const { default: express } = await import("express");
const { default: appRoute } = await import("../app/routes/index.js");
const { setOrigin } = await import("../app/utils/index.js");
const { sign } = await import("../app/admin/auth.js");
const { runReminders } = await import("../app/engagement/reminders.js");
const { runLifecycle } = await import("../app/engagement/lifecycle.js");
const { inbox } = await import("../app/admin/messages.js");
const { forget } = await import("../app/engagement/switches.js");
const { e164 } = await import("../app/engagement/channels.js");

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_reminders");
await mongoose.connection.db.dropDatabase();
// build the unique indexes before the first request (the "409 already exists" checks rely on them; dropping the
// database while the models' start-up index build runs could leave one missing for a moment)
const IndexModels = await import("../app/model/index.js");
await Promise.all(Object.values(IndexModels).map((m) => m.init?.().then(() => m.createIndexes()).catch(() => {})));
await Promise.all(mongoose.modelNames().map((n) => mongoose.model(n).init()));
const db = mongoose.connection.db;
const app = express();
app.use([express.json({ type: (req) => !req.url.startsWith("/api/v1/admin/") && /json/i.test(req.headers["content-type"] || "") }), setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;
const ACTOR = "11111111-2222-4333-8444-555555555555";
async function admin(method, p, body, origin = MFR) {
    const raw = body ? JSON.stringify(body) : "";
    const ts = String(Math.floor(Date.now() / 1000));
    const nonce = crypto.randomBytes(16).toString("hex");
    const res = await fetch(`${BASE}${p}`, { method, body: raw || undefined, headers: { "content-type": "application/json", "x-madp-timestamp": ts, "x-madp-origin": origin, "x-madp-actor": ACTOR, "x-madp-nonce": nonce, "x-madp-signature": sign(SECRET, { nonce, timestamp: ts, method, path: p, origin, actor: ACTOR, body: raw }) } });
    return { status: res.status, json: await res.json().catch(() => ({})) };
}
const V1 = "/api/v1/admin";
const DAY = 864e5;
const ago = (d) => new Date(Date.now() - d * DAY);
const dayKey = (d) => d.toISOString().slice(0, 10);
const base = (o = MFR) => ({ origin: o, isActive: true, isDeleted: false, updatedAt: ago(5) });
async function member(first, extra = {}, o = MFR) {
    const { insertedId } = await db.collection("User").insertOne({
        ...base(o), createdAt: ago(10), name: { first, last: "Demo" }, mail: `${first.toLowerCase()}@example.invalid`, phone: "9876543210",
        category: "b2c", memberStatus: "active", registrationStatus: "active", password: "hash", terms: ["terms"], address: [{ country: "in" }], ...extra,
    });
    return insertedId;
}
const ids = {};
ids.nopw = await member("Nopw", { password: undefined, terms: [] });
await db.collection("User").updateOne({ _id: ids.nopw }, { $unset: { password: "" } });
ids.noterms = await member("Noterms", { terms: [] });
ids.waiting = await member("Waiting");
ids.first = await member("First");
ids.teen = await member("Teen", { category: "b2c-minor" });
ids.streak = await member("Streak");
ids.optout = await member("Optout");
ids.sms = await member("Smsfan");
await db.collection("Survey").insertOne({ ...base(), createdAt: ago(3), slug: "phones-2026", name: "Phones 2026", status: "active", points: 500, loi: 10 });
await db.collection("Survey").insertOne({ ...base(), createdAt: ago(3), slug: "old-closed", name: "Old", status: "closed", points: 100 });
for (const who of ["waiting", "optout", "sms", "teen"])
    await db.collection("Response").insertOne({ ...base(), createdAt: ago(2), user: ids[who], status: "invited", survey: { slug: "phones-2026", name: "Phones 2026" } });
await db.collection("Response").insertOne({ ...base(), createdAt: ago(2), user: ids.first, status: "invited", survey: { slug: "old-closed", name: "Old" } });
for (const d of [1, 2, 3]) await db.collection("StreakDay").insertOne({ ...base(), createdAt: ago(d), user: ids.streak, day: dayKey(ago(d)), sources: ["poll"] });
// the streak member already finished a survey, so "first survey" doesn't apply to them
await db.collection("Response").insertOne({ ...base(), createdAt: ago(9), updatedAt: ago(9), user: ids.streak, status: "complete", survey: { slug: "x", name: "X" }, points: 10 });
await db.collection("MemberPreference").insertMany([
    { ...base(), createdAt: ago(5), user: ids.optout, notifications: { email: false } },
    { ...base(), createdAt: ago(5), user: ids.sms, notifications: { email: true, sms: true } },
]);
const outbox = () => fs.readdirSync(OUTBOX).map((f) => JSON.parse(fs.readFileSync(path.join(OUTBOX, f), "utf8")));
const clearOutbox = () => fs.readdirSync(OUTBOX).forEach((f) => fs.unlinkSync(path.join(OUTBOX, f)));
async function switchOn(key, on = true, o = MFR) {
    await db.collection("FeatureSwitch").updateOne({ origin: o, key, segment: null, country: null }, { $set: { on, isActive: true, isDeleted: false } }, { upsert: true });
    forget();
}

test("settings start all off, are validated, and are saved per brand", async () => {
    const g = await admin("GET", `${V1}/reminders`);
    assert.equal(g.status, 200, JSON.stringify(g.json));
    assert.equal(g.json.data.saved, false);
    assert.deepEqual(g.json.data.cases.map((c) => c.key), ["password", "terms", "no_profiles", "partial", "surveys", "first_survey", "redeem", "streak"]);
    assert.ok(g.json.data.cases.every((c) => c.enabled === false));
    assert.equal(g.json.data.switches.email_reminders, false);
    const bad = await admin("PUT", `${V1}/reminders`, { cases: { surveys: { everyDays: 0 }, nope: { enabled: true } } });
    assert.equal(bad.status, 400);
    assert.match(bad.json.message, /Unknown reminder: nope/);
    assert.match(bad.json.message, /surveys: every 1 to 90 days/);
    const all = Object.fromEntries(g.json.data.cases.map((c) => [c.key, { enabled: true }]));
    all.surveys = { enabled: true, everyDays: 3, max: 2 };
    const ok = await admin("PUT", `${V1}/reminders`, { cases: all, minGapDays: 1, reason: "Turn reminders on for testing" });
    assert.equal(ok.status, 200, JSON.stringify(ok.json));
    assert.equal(ok.json.data.saved, true);
    assert.deepEqual(ok.json.data.cases.find((c) => c.key === "surveys"), { key: "surveys", group: "surveys", label: "Surveys waiting in their bucket", kind: "marketing", enabled: true, everyDays: 3, max: 2 });
    assert.equal((await admin("GET", `${V1}/reminders`, null, T2O)).json.data.saved, false, "another brand is untouched");
});

test("preview counts who would get which reminder, and sends and saves nothing", async () => {
    const p = await admin("POST", `${V1}/reminders/preview`, {});
    assert.equal(p.status, 200, JSON.stringify(p.json));
    assert.deepEqual(p.json.data.byCase, { password: 1, terms: 1, surveys: 3, first_survey: 1, streak: 1 });
    assert.equal(p.json.data.switchOn, false);
    assert.equal(outbox().length, 0);
    assert.equal(await db.collection("MemberNotice").countDocuments(), 0);
});

test("nothing is sent while the brand's switch is off; the old fixed sign-up reminders stand down for this brand", async () => {
    const r = await runReminders({});
    assert.equal(r.sent, 0);
    const life = await runLifecycle({ force: true, origin: MFR });
    assert.equal(life.sent, 0);
    assert.ok(life.skipped.managed_by_auto_reminders >= 1);
});

test("with the switch on: one reminder each, on e-mail (brand logo) and the dashboard, opted-out e-mail respected", async () => {
    await switchOn("email_reminders");
    const r = await runReminders({});
    assert.equal(r.sent, 7, JSON.stringify(r));
    assert.equal(r.channels.dashboard, 7);
    assert.equal(r.channels.email, 6, "the member who turned e-mails off gets the dashboard notice only");
    const mails = outbox();
    assert.deepEqual(mails.map((m) => m.data.template).sort(), ["first-survey", "password", "streak", "surveys", "surveys", "terms"]);
    assert.ok(mails.every((m) => m.category === "reminders" && m.data.brand.name === "MyFrequentRewards" && /mfr-mark\.png$/.test(m.data.brand.logo)));
    const s = mails.find((m) => m.data.template === "surveys");
    assert.equal(s.data.surveys[0].name, "Phones 2026");
    assert.match(s.data.links.unsubscribe, /unsubscribe/);
    assert.equal(mails.find((m) => m.data.template === "password").data.links.unsubscribe, undefined, "account reminders have no unsubscribe link");
    assert.match(mails.find((m) => m.data.template === "password").data.links.set_password, /set-password\?user=/);
    assert.ok(!mails.some((m) => m.to === "teen@example.invalid"), "never teens");
    const notices = await inbox({ _id: ids.optout }, MFR);
    assert.equal(notices.length, 1);
    assert.equal(notices[0].kind, "surveys");
    assert.match(notices[0].cta, /member\/surveys/);
    // SMS was chosen by one member but the brand's sms switch is off
    assert.equal(r.skipped.sms_switched_off, 1);
});

test("the gap between reminders, and the per-case maximum, are kept; a finished case starts again from zero", async () => {
    clearOutbox();
    assert.equal((await runReminders({})).sent, 0, "min gap of 1 day");
    let r = await runReminders({ now: new Date(Date.now() + 2 * DAY) });
    assert.equal(r.byCase.surveys ?? 0, 0, "surveys only every 3 days");
    r = await runReminders({ now: new Date(Date.now() + 4 * DAY) });
    assert.equal(r.byCase.surveys, 3);
    r = await runReminders({ now: new Date(Date.now() + 8 * DAY) });
    assert.equal(r.byCase.surveys ?? 0, 0, "max 2 surveys reminders");
    // the waiting member answers: the case is over and its count is cleared
    await db.collection("Response").updateOne({ user: ids.waiting, status: "invited" }, { $set: { status: "complete", updatedAt: new Date() } });
    await runReminders({ now: new Date(Date.now() + 9 * DAY) });
    const pref = await db.collection("MemberPreference").findOne({ user: ids.waiting });
    assert.equal(pref.reminders?.surveys, undefined);
});

test("WhatsApp / SMS providers: keys are encrypted and never shown, the check sends nothing, chosen members get SMS", async () => {
    const bad = await admin("PUT", `${V1}/channels/sms`, { provider: "twilio", credentials: { accountSid: "AC123" } });
    assert.equal(bad.status, 400);
    assert.match(bad.json.message, /Missing: Auth token/);
    const put = await admin("PUT", `${V1}/channels/sms`, { provider: "twilio", credentials: { accountSid: "AC123", authToken: "tok-secret-9876" }, sender: "+15550001111" });
    assert.equal(put.status, 200, JSON.stringify(put.json));
    assert.equal(put.json.data.keyHint, "9876");
    const raw = await db.collection("ChannelProvider").findOne({ origin: MFR, channel: "sms" });
    assert.ok(!JSON.stringify(raw).includes("tok-secret-9876"), "stored encrypted");
    const list = await admin("GET", `${V1}/channels`);
    assert.ok(!JSON.stringify(list.json).includes("tok-secret"), "never returned");
    const chk = await admin("POST", `${V1}/channels/sms/check`);
    assert.equal(chk.json.data.ok, true, JSON.stringify(chk.json));
    assert.ok(calls.every((c) => c.method === "GET"), "the check sent no message");
    // saving again without the token keeps it
    assert.equal((await admin("PUT", `${V1}/channels/sms`, { provider: "twilio", sender: "+15550002222" })).json.data.keyHint, "9876");

    await switchOn("sms");
    await db.collection("MemberPreference").updateOne({ user: ids.sms }, { $unset: { reminders: "", lastReminderAt: "" } });
    calls.length = 0;
    const r = await runReminders({ now: new Date(Date.now() + 30 * DAY) });
    assert.equal(r.channels.sms, 1, JSON.stringify(r));
    const sms = calls.find((c) => c.method === "POST");
    const form = new URLSearchParams(sms.body);
    assert.equal(form.get("To"), "+919876543210");
    assert.equal(form.get("From"), "+15550002222");
    assert.match(form.get("Body"), /^MyFrequentRewards: Hi Smsfan, .*member\/surveys/);
    assert.equal((await admin("POST", `${V1}/channels/sms/remove`)).json.data.removed, true);
    assert.equal(e164("09876543210", "in"), "+919876543210");
    assert.equal(e164("12345", "in"), null);
    assert.equal(e164("+44 7700 900123", "gb"), "+447700900123");
});

test.after(async () => {
    server.close();
    fake.close();
    await mongoose.disconnect();
    fs.rmSync(OUTBOX, { recursive: true, force: true });
});

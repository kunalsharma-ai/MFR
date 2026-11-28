// Panel admin API, super admin spec step 4c: switches per segment and country, the switches that carry a number (points
// hold days, weekend multiplier), the new money/legal switches, and prize machines (one per segment).
//
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_admin_step4c node --test --test-force-exit tests/admin.step4c.test.mjs
import test from "node:test";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import dns from "node:dns";

dns.resolveMx = (domain, cb) => cb(null, [{ exchange: `mx.${domain}`, priority: 10 }]);
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const SECRET = "test-admin-secret-0123456789abcdef";
const MHO = "www.myhealthopinions.com";
process.env.MADP_ADMIN_API_SECRETS = SECRET;

const { default: mongoose } = await import("mongoose");
const { default: express } = await import("express");
const { default: cookieParser } = await import("cookie-parser");
const { default: appRoute } = await import("../app/routes/index.js");
const { setOrigin } = await import("../app/utils/index.js");
const { generate } = await import("../app/utils/token.js");
const { sign } = await import("../app/admin/auth.js");
const S = await import("../app/engagement/switches.js");
const { setConfig } = await import("../app/engagement/config.js");
const { runExpiryReminders } = await import("../app/engagement/expiry.js");
const { pick } = await import("../app/engagement/prizes.js");
const Models = await import("../app/model/index.js");

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_admin_step4c");
await mongoose.connection.db.dropDatabase();
// build the unique indexes before the first request (the "409 already exists" checks rely on them; dropping the
// database while the models' start-up index build runs could leave one missing for a moment)
const IndexModels = await import("../app/model/index.js");
await Promise.all(Object.values(IndexModels).map((m) => m.init?.().then(() => m.createIndexes()).catch(() => {})));
await Models.FeatureSwitch.syncIndexes();
await Models.PrizePlay.syncIndexes();
// holds count only entries after holdFrom (and after the switch went on); move holdFrom into the past for the test
setConfig({ points: { holdFrom: "2020-01-01T00:00:00Z" } });
const app = express();
app.use([express.json({ type: (req) => !req.url.startsWith("/api/v1/admin/") && /json/i.test(req.headers["content-type"] || "") }), cookieParser(), setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;
const MFR = `127.0.0.1:${server.address().port}`;
process.env.MADP_ADMIN_API_ORIGINS = `${MFR},${MHO}`;
const ALICE = "11111111-2222-4333-8444-555555555555";
const V1 = "/api/v1/admin";

async function admin(method, path, body, { origin = MFR } = {}) {
    const raw = body ? JSON.stringify(body) : "";
    const ts = String(Math.floor(Date.now() / 1000));
    const nonce = crypto.randomBytes(16).toString("hex");
    const res = await fetch(`${BASE}${path}`, { method, body: raw || undefined, headers: { "content-type": "application/json", "x-madp-timestamp": ts, "x-madp-origin": origin, "x-madp-actor": ALICE, "x-madp-nonce": nonce, "x-madp-signature": sign(SECRET, { nonce, timestamp: ts, method, path, origin, actor: ALICE, body: raw }) } });
    return { status: res.status, json: await res.json().catch(() => ({})) };
}
async function asMember(id, method, path, body) {
    const res = await fetch(`${BASE}${path}`, { method, body: body ? JSON.stringify(body) : undefined, headers: { "content-type": "application/json", authorization: `Bearer ${generate({ _id: id, origin: MFR })}` } });
    return { status: res.status, json: await res.json().catch(() => ({})) };
}
const db = mongoose.connection.db;
const base = (origin) => ({ origin, isActive: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date() });
async function member(origin, first, extra = {}) {
    const { insertedId } = await db.collection("User").insertOne({
        ...base(origin), name: { first, last: "Demo" }, mail: `${first.toLowerCase()}@example.invalid`, dob: new Date("1990-05-01"),
        category: "b2c", isVerified: { email: "verified" }, address: [{ country: "india" }], memberStatus: "active", ...extra,
    });
    return insertedId;
}
const yearsAgo = (y) => { const d = new Date(); d.setUTCFullYear(d.getUTCFullYear() - y); return d; };
const asha = await member(MFR, "Asha"); // consumer, India
const priya = await member(MFR, "Priya", { category: "b2b" }); // professional, India
const sam = await member(MFR, "Sam", { address: [{ country: "us" }] }); // consumer, US
const tara = await member(MFR, "Tara", { category: "b2c-minor", dob: yearsAgo(15), registrationStatus: "active" }); // teen, India
await member(MHO, "Mo");
const put = (key, body) => admin("PUT", `${V1}/switches/${key}`, body);

test("switches resolve segment+country > segment > country > brand > default, and the kill switch still wins", async () => {
    assert.equal((await put("redemptions", { on: true, reason: "Open for the demo" })).status, 200);
    assert.equal((await put("redemptions", { on: false, segment: "professional", reason: "Pros wait for UPI" })).status, 200);
    assert.equal((await put("redemptions", { on: false, country: "us", reason: "US payouts not agreed" })).status, 200);
    assert.equal((await put("redemptions", { on: true, segment: "consumer", country: "us", reason: "US consumer gift cards agreed" })).status, 200);
    const is = (segment, country) => S.isOn(MFR, "redemptions", { segment, country });
    assert.equal(await is("consumer", "india"), true, "brand row");
    assert.equal(await is("professional", "india"), false, "segment row");
    assert.equal(await is("teen", "us"), false, "country row");
    assert.equal(await is("consumer", "us"), true, "segment+country beats country");
    assert.equal(await is("professional", "us"), false, "segment beats country");
    assert.equal(await S.isOn(MFR, "redemptions"), true, "with no scope: the whole-brand row");
    assert.equal(await S.isOn(MHO, "redemptions", { segment: "consumer" }), false, "MHO is untouched");

    // what members see follows their own scope
    assert.equal((await asMember(asha, "GET", "/api/v1/engagement/rewards")).json.data?.open ?? (await asMember(asha, "GET", "/api/v1/engagement/rewards")).json.open, true);
    const pro = await asMember(priya, "POST", "/api/v1/engagement/rewards/redeem", { item: "paypal-50", paypal: "priya@example.invalid" });
    assert.equal(pro.json.code, "closed", "professional redemptions are off");

    // the board shows the whole-brand row, the narrower rows and what a scope gets
    const b = await admin("GET", `${V1}/switches?segment=consumer&country=us`);
    const red = b.json.data.switches.find((s) => s.key === "redemptions");
    assert.equal(red.set, true);
    assert.equal(red.effective, true);
    assert.equal(red.from, "segment+country");
    assert.equal(red.overrides.length, 3);
    assert.ok(red.effect.length > 20, "each switch says what changes for members");
    assert.ok(b.json.data.switches.every((s) => s.effect), "every switch has effect text");

    // removing a narrower row lets the wider one apply again
    assert.equal((await put("redemptions", { on: null, segment: "consumer", country: "us", reason: "Back to the US rule" })).status, 200);
    assert.equal(await is("consumer", "us"), false);
    assert.equal((await put("redemptions", { on: null, reason: "can't remove the brand row" })).json.code, "invalid_value");

    // bad scopes and the kill switch
    assert.equal((await put("redemptions", { on: true, segment: "alien", reason: "bad segment" })).json.code, "invalid_segment");
    assert.equal((await put("redemptions", { on: true, country: "<script>", reason: "bad country" })).json.code, "invalid_country");
    assert.equal((await put("kill", { on: true, segment: "teen", reason: "kill one segment" })).json.code, "invalid_scope");
    await put("kill", { on: true, reason: "Incident drill" });
    assert.equal(await is("consumer", "india"), false, "kill wins over every row");
    assert.equal((await S.resolve(MFR, "redemptions", { segment: "consumer" })).from, "kill");
    await put("kill", { on: false, reason: "Drill over" });
    assert.equal(await is("consumer", "india"), true);
});

test("switches with a number: points hold days apply only to points earned after it went on", async () => {
    assert.equal((await put("redemptions", { on: true, value: 3, reason: "no number here" })).json.code, "invalid_value");
    assert.equal((await put("points_hold", { on: true, value: 400, reason: "too many days" })).json.code, "invalid_value");
    assert.equal((await put("weekend_multiplier", { on: true, value: 9, reason: "too big" })).json.code, "invalid_value");
    // a reward from before the hold, then the hold, then a new reward
    await db.collection("Reward").insertOne({ ...base(MFR), createdAt: new Date(Date.now() - 3600_000), user: asha, key: "poll:old", category: "poll", name: "Old poll", points: 5 });
    const on = await put("points_hold", { on: true, value: 7, segment: "consumer", reason: "Fraud review window for consumers" });
    assert.equal(on.status, 200, JSON.stringify(on.json));
    assert.equal(on.json.data.value, 7);
    await new Promise((r) => setTimeout(r, 20));
    await db.collection("Reward").insertOne({ ...base(MFR), user: asha, key: "poll:new", category: "poll", name: "New poll", points: 5 });
    const led = await asMember(asha, "GET", "/api/v1/engagement/ledger");
    const items = led.json.data?.items || led.json.data?.entries || led.json.items || led.json.entries;
    assert.ok(Array.isArray(items), JSON.stringify(led.json).slice(0, 300));
    assert.equal(items.find((e) => e.name === "Old poll").status, "cleared", "points already earned are never moved back");
    const fresh = items.find((e) => e.name === "New poll");
    assert.equal(fresh.status, "pending");
    assert.ok(new Date(fresh.clearsAt) - Date.now() > 6.9 * 86400000);
    // professionals have no hold
    assert.equal((await S.resolve(MFR, "points_hold", { segment: "professional" })).on, false);
    const cfg = await asMember(asha, "GET", "/api/v1/engagement/config");
    assert.equal((cfg.json.data || cfg.json).holdDays, 7);
    const b = await admin("GET", `${V1}/switches?segment=consumer`);
    const hold = b.json.data.switches.find((s) => s.key === "points_hold");
    assert.deepEqual([hold.valued.unit, hold.value], ["days", 7]);
});

test("points expiry reminders need both switches; WhatsApp can't be chosen while its switch is off", async () => {
    await put("email_expiry", { on: true, reason: "Reminder copy approved" });
    assert.equal((await runExpiryReminders({ origin: MFR, dryRun: true })).enabled, false, "points_expiry is still off");
    const p1 = await asMember(asha, "PUT", "/api/v1/engagement/preferences", { notifications: { whatsapp: true } });
    assert.equal((p1.json.data || p1.json).notifications.whatsapp, false);
    await put("whatsapp", { on: true, country: "india", reason: "WhatsApp opt-in screen ready in India" });
    const p2 = await asMember(asha, "PUT", "/api/v1/engagement/preferences", { notifications: { whatsapp: true } });
    assert.equal((p2.json.data || p2.json).notifications.whatsapp, true);
    const p3 = await asMember(sam, "PUT", "/api/v1/engagement/preferences", { notifications: { whatsapp: true } });
    assert.equal((p3.json.data || p3.json).notifications.whatsapp, false, "not in the US");
});

test("prize machines: one per segment, teen prizes are never points, members see them only when the legal switch is on", async () => {
    const list = await admin("GET", `${V1}/prize-machines`);
    assert.equal(list.status, 200, JSON.stringify(list.json));
    assert.deepEqual(list.json.data.machines.map((m) => [m.segment, m.skin, m.exists]), [["consumer", "claw", false], ["professional", "lift", false], ["teen", "spiral", false]]);
    assert.equal(list.json.data.switchOn, false);

    const prizes = [{ label: "50 points", kind: "points", points: 50, weight: 1 }, { label: "Try again", kind: "nothing", weight: 0 }];
    assert.equal((await admin("PUT", `${V1}/prize-machines/consumer`, { title: "Daily claw", prizes })).json.code, "reason_required");
    assert.equal((await admin("PUT", `${V1}/prize-machines/consumer`, { title: "Daily claw", prizes, status: "live", reason: "First machine" })).json.code, "invalid_value", "live needs a country");
    assert.equal((await admin("PUT", `${V1}/prize-machines/teen`, { title: "Spiral", prizes, reason: "Teen machine" })).json.code, "teen_prize");
    assert.equal((await admin("PUT", `${V1}/prize-machines/consumer`, { title: "Daily claw", prizes: [{ label: "Big", kind: "points", points: 50000, weight: 1 }], reason: "too big" })).json.code, "invalid_value");
    const c = await admin("PUT", `${V1}/prize-machines/consumer`, { title: "Daily claw", prizes, status: "live", countries: ["india"], dailyPlays: 2, reason: "First machine, India only" });
    assert.equal(c.status, 200, JSON.stringify(c.json));
    assert.equal(c.json.data.machine.pointsPerPlay, 50);
    assert.deepEqual(c.json.data.machine.prizes.map((p) => p.chance), [100, 0]);
    const t = await admin("PUT", `${V1}/prize-machines/teen`, { title: "Spiral of badges", prizes: [{ label: "Explorer badge", kind: "badge", weight: 1 }], status: "live", countries: ["india"], reason: "Badges only for teens" });
    assert.equal(t.status, 200, JSON.stringify(t.json));

    // the switch is off: nobody sees a machine or can play
    assert.equal((await asMember(asha, "GET", "/api/v1/engagement/prize-machine")).json.data?.machine ?? null, null);
    assert.equal((await asMember(asha, "POST", "/api/v1/engagement/prize-machine/play")).json.code, "closed");

    await put("prize_machines", { on: true, reason: "Legal cleared India for the demo" });
    const v = await asMember(asha, "GET", "/api/v1/engagement/prize-machine");
    const m = v.json.data?.machine ?? v.json.machine;
    assert.equal(m.skin, "claw");
    assert.equal(m.playsLeft, 2);
    assert.equal((await asMember(sam, "GET", "/api/v1/engagement/prize-machine")).json.data?.machine ?? null, null, "US is not in the machine's countries");
    assert.equal((await asMember(priya, "GET", "/api/v1/engagement/prize-machine")).json.data?.machine ?? null, null, "no professional machine");

    const before = await asMember(asha, "GET", "/api/v1/engagement/summary");
    const p1 = await asMember(asha, "POST", "/api/v1/engagement/prize-machine/play");
    assert.equal(p1.status, 200, JSON.stringify(p1.json));
    assert.deepEqual([(p1.json.data || p1.json).prize.points, (p1.json.data || p1.json).playsLeft], [50, 1]);
    const after = await asMember(asha, "GET", "/api/v1/engagement/summary");
    assert.equal((after.json.data || after.json).balances.earned - (before.json.data || before.json).balances.earned, 50, "the win is a ledger entry");
    await asMember(asha, "POST", "/api/v1/engagement/prize-machine/play");
    assert.equal((await asMember(asha, "POST", "/api/v1/engagement/prize-machine/play")).json.code, "limit", "daily limit");

    // teens play the spiral and never win points
    const tp = await asMember(tara, "POST", "/api/v1/engagement/prize-machine/play");
    assert.equal(tp.status, 200, JSON.stringify(tp.json));
    assert.deepEqual([(tp.json.data || tp.json).prize.kind, (tp.json.data || tp.json).prize.points], ["badge", 0]);

    // switched off for teens only
    await put("prize_machines", { on: false, segment: "teen", reason: "Pause teen machine" });
    assert.equal((await asMember(tara, "POST", "/api/v1/engagement/prize-machine/play")).json.code, "closed");

    const plays = await admin("GET", `${V1}/prize-machines/consumer/plays`);
    assert.equal(plays.json.data.items.length, 2);
    assert.equal((await admin("GET", `${V1}/prize-machines`, null, { origin: MHO })).json.data.machines.every((x) => !x.exists), true, "MHO has none");
    assert.equal((await admin("GET", `${V1}/prize-machines/alien/plays`)).status, 404);
});

test("pick follows the weights", () => {
    const prizes = [{ key: "a", weight: 1 }, { key: "b", weight: 3 }, { key: "z", weight: 0 }];
    assert.equal(pick(prizes, () => 0).key, "a");
    assert.equal(pick(prizes, () => 999).key, "a");
    assert.equal(pick(prizes, () => 1000).key, "b");
    assert.equal(pick(prizes, () => 3999).key, "b");
    assert.equal(pick([{ key: "z", weight: 0 }]), null);
});

test.after(async () => { server.close(); await mongoose.disconnect(); });

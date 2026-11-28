// Panel admin API, super admin spec step 4: feature switches (and that the member side obeys them), rewards
// (catalogue, redemption queue, draws, offers), engagement, the Teen Panel turning-18 path and data requests.
//
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_admin_step4 node --test --test-force-exit tests/admin.step4.test.mjs
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
const { isOn, forget } = await import("../app/engagement/switches.js");

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_admin_step4");
await mongoose.connection.db.dropDatabase();
// build the unique indexes before the first request (the "409 already exists" checks rely on them; dropping the
// database while the models' start-up index build runs could leave one missing for a moment)
const IndexModels = await import("../app/model/index.js");
await Promise.all(Object.values(IndexModels).map((m) => m.init?.().then(() => m.createIndexes()).catch(() => {})));
const app = express();
app.use([express.json({ type: (req) => !req.url.startsWith("/api/v1/admin/") && /json/i.test(req.headers["content-type"] || "") }), cookieParser(), setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;
const MFR = `127.0.0.1:${server.address().port}`;
process.env.MADP_ADMIN_API_ORIGINS = `${MFR},${MHO}`;
const ALICE = "11111111-2222-4333-8444-555555555555";
const BOB = "66666666-7777-4888-9999-000000000000";
const V1 = "/api/v1/admin";

async function admin(method, path, body, { origin = MFR, actor = ALICE } = {}) {
    const raw = body ? JSON.stringify(body) : "";
    const ts = String(Math.floor(Date.now() / 1000));
    const nonce = crypto.randomBytes(16).toString("hex");
    const res = await fetch(`${BASE}${path}`, { method, body: raw || undefined, headers: { "content-type": "application/json", "x-madp-timestamp": ts, "x-madp-origin": origin, "x-madp-actor": actor, "x-madp-nonce": nonce, "x-madp-signature": sign(SECRET, { nonce, timestamp: ts, method, path, origin, actor, body: raw }) } });
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
        category: "b2c", isVerified: { email: "verified" }, address: [{ country: "us" }], memberStatus: "active", ...extra,
    });
    return insertedId;
}
const asha = await member(MFR, "Asha");
// a completed survey gives Asha 20,000 points to spend
await db.collection("Response").insertOne({ ...base(MFR), user: asha, status: "complete", points: 20000, survey: { name: "Grocery", slug: "grocery" } });
const yearsAgo = (y, days = 0) => { const d = new Date(); d.setUTCFullYear(d.getUTCFullYear() - y); d.setUTCDate(d.getUTCDate() + days); return d; };
const tia = await member(MFR, "Tia", { category: "b2c-minor", dob: yearsAgo(18, -3) });   // turned 18 three days ago
const tom = await member(MFR, "Tom", { category: "b2c-minor", dob: yearsAgo(18, 10) });   // turns 18 in ten days
await member(MHO, "Mo");

test("switches: all off by default, a reason is required, the kill switch stops everything, brands are apart", async () => {
    const b = await admin("GET", `${V1}/switches`);
    assert.equal(b.status, 200, JSON.stringify(b.json));
    // everything starts off, except the streak, challenge and referral bonuses that pay today (step 4c switch)
    assert.deepEqual(b.json.data.switches.filter((s) => s.effective).map((s) => s.key), ["bonuses"], "everything else starts off");
    assert.equal((await admin("PUT", `${V1}/switches/redemptions`, { on: true })).json.code, "reason_required");
    assert.equal((await admin("PUT", `${V1}/switches/nope`, { on: true, reason: "testing it" })).status, 404);

    // closed for the member while off
    assert.equal((await asMember(asha, "POST", "/api/v1/engagement/rewards/redeem", { item: "paypal-15", paypal: "asha@example.invalid" })).json.code, "closed");
    const on = await admin("PUT", `${V1}/switches/redemptions`, { on: true, reason: "Payout route agreed for the demo" });
    assert.equal(on.json.data.on, true);
    assert.equal(await isOn(MFR, "redemptions"), true);
    forget();
    assert.equal(await isOn(MHO, "redemptions"), false, "another brand is not affected");

    await admin("PUT", `${V1}/switches/kill`, { on: true, reason: "Incident drill" });
    assert.equal(await isOn(MFR, "redemptions"), false, "the kill switch wins");
    const k = await admin("GET", `${V1}/switches`);
    assert.equal(k.json.data.killed, true);
    assert.equal(k.json.data.switches.find((s) => s.key === "redemptions").set, true, "the switch keeps its own setting under the kill");
    await admin("PUT", `${V1}/switches/kill`, { on: false, reason: "Drill over" });
    assert.equal(await isOn(MFR, "redemptions"), true);
});

test("rewards: catalogue teen guardrail, a redemption goes requested to approved to fulfilled, reject returns points", async () => {
    assert.equal((await admin("POST", `${V1}/rewards/catalogue`, { key: "cash-10", kind: "paypal", title: "PayPal", points: 15000 })).json.code, "teen_guardrail");
    const it = await admin("POST", `${V1}/rewards/catalogue`, { key: "paypal-15", kind: "paypal", title: "PayPal payout", points: 15000, value: 15, audience: ["consumer", "professional"] });
    assert.equal(it.status, 200, JSON.stringify(it.json));
    assert.equal((await admin("POST", `${V1}/rewards/catalogue`, { key: "paypal-15", kind: "paypal", title: "Again", points: 1, audience: ["consumer"] })).status, 409);

    const red = await asMember(asha, "POST", "/api/v1/engagement/rewards/redeem", { item: "paypal-15", paypal: "asha.paypal@example.invalid" });
    assert.equal(red.status, 200, JSON.stringify(red.json));
    const q = await admin("GET", `${V1}/redemptions?status=open`);
    assert.equal(q.json.data.items.length, 1);
    const r = q.json.data.items[0];
    assert.ok(!JSON.stringify(q.json).includes("asha.paypal@"), "the payout address never leaves unmasked");
    assert.ok(r.member.email.includes("***"));
    const id = r.id;
    assert.equal((await admin("POST", `${V1}/redemptions/${id}/decision`, { status: "fulfilled", reason: "paid by hand" })).status, 409, "approve first");
    assert.equal((await admin("POST", `${V1}/redemptions/${id}/decision`, { status: "approved" })).json.code, "reason_required");
    assert.equal((await admin("POST", `${V1}/redemptions/${id}/decision`, { status: "approved", reason: "Checked the ledger" })).json.data.after, "approved");

    // with the switch off, money can't move, but a rejection still can
    await admin("PUT", `${V1}/switches/redemptions`, { on: false, reason: "Pausing payouts" });
    assert.equal((await admin("POST", `${V1}/redemptions/${id}/decision`, { status: "fulfilled", reason: "paid by hand" })).json.code, "switch_off");
    await admin("PUT", `${V1}/switches/redemptions`, { on: true, reason: "Payouts back on" });
    const f = await admin("POST", `${V1}/redemptions/${id}/decision`, { status: "fulfilled", reason: "Paid via PayPal by hand", providerRef: "PP-DEMO-1" });
    assert.equal(f.json.data.after, "fulfilled");
    const d = await admin("GET", `${V1}/redemptions/${id}`);
    assert.deepEqual(d.json.data.history.map((h) => h.status), ["requested", "approved", "fulfilled"]);
    assert.equal((await admin("GET", `${V1}/redemptions/${id}`, null, { origin: MHO })).status, 404);
});

test("draws need the legal switch to run; offers are capped", async () => {
    const closes = new Date(Date.now() - 1000).toISOString();
    assert.equal((await admin("POST", `${V1}/draws`, { month: "2026-11", title: "November draw", prize: "A demo prize", ticketPoints: 100, closesAt: closes })).json.code, "invalid_value", "rules link is required");
    const d = await admin("POST", `${V1}/draws`, { month: "2026-11", title: "November draw", prize: "A demo prize", ticketPoints: 100, closesAt: closes, rulesUrl: "https://example.invalid/rules", countries: ["us"] });
    assert.equal(d.status, 200, JSON.stringify(d.json));
    assert.equal((await admin("POST", `${V1}/draws/${d.json.data.id}/run`)).json.code, "switch_off");
    await admin("PUT", `${V1}/switches/draw`, { on: true, reason: "Legal cleared the US for the demo" });
    const run = await admin("POST", `${V1}/draws/${d.json.data.id}/run`);
    assert.equal(run.json.data.status, "drawn");
    assert.equal((await admin("POST", `${V1}/offers`, { title: "Double", multiplier: 2, startsAt: "2026-12-01", endsAt: "2027-02-01" })).json.code, "invalid_value");
    const o = await admin("POST", `${V1}/offers`, { title: "Double weekend", multiplier: 2, startsAt: "2026-12-05", endsAt: "2026-12-07" });
    assert.equal(o.status, 200);
    assert.equal((await admin("POST", `${V1}/offers/${o.json.data.id}/end`)).json.data.active, false);
});

test("engagement: tasks with teen copy rules, ideas moderated before anyone sees them, stories and streak counts", async () => {
    assert.equal((await admin("POST", `${V1}/engagement/tasks`, { kind: "idea", title: "Win cash for ideas", audience: ["teen"], points: 20 })).json.code, "teen_guardrail");
    const t = await admin("POST", `${V1}/engagement/tasks`, { kind: "idea", title: "Design a better school bag", audience: ["teen"], points: 20 });
    assert.equal(t.status, 200, JSON.stringify(t.json));
    await db.collection("TaskEntry").insertOne({ ...base(MFR), task: new mongoose.Types.ObjectId(t.json.data.id), user: tom, text: "Solar panels on the flap", status: "submitted" });
    const q = await admin("GET", `${V1}/engagement/ideas`);
    assert.equal(q.json.data.length, 1);
    assert.equal(q.json.data[0].by, "Tom D.");
    assert.equal((await admin("POST", `${V1}/engagement/ideas/${q.json.data[0].id}`, { status: "approved" })).json.data.status, "approved");
    assert.equal((await admin("PUT", `${V1}/engagement/tasks/${t.json.data.id}`, { points: 50 })).json.code, "answered");

    assert.equal((await admin("POST", `${V1}/engagement/stories`, { type: "insight", title: "What buyers want", sampleSize: 12 })).json.code, "small_sample");
    const s = await admin("POST", `${V1}/engagement/stories`, { type: "story", title: "Your answers changed a cereal box", summary: "Less sugar, clearer labels.", audience: ["consumer"] });
    assert.equal(s.json.data.published, false);
    assert.equal((await admin("PUT", `${V1}/engagement/stories/${s.json.data.id}`, { published: true })).json.data.published, true);

    const today = new Date().toISOString().slice(0, 10);
    await db.collection("StreakDay").insertOne({ ...base(MFR), user: asha, day: today, sources: ["poll"] });
    const st = await admin("GET", `${V1}/engagement/streaks`);
    assert.equal(st.json.data.currentStreaks["1-6"], 1);
    assert.equal((await admin("GET", `${V1}/engagement/tasks`, null, { origin: MHO })).json.data.length, 0);
});

test("teens: turning-18 list, dry run first, the move keeps answers, stops guardian links and cancels guardian-pending rewards", async () => {
    const l = await admin("GET", `${V1}/teens?turning18=30`);
    assert.equal(l.status, 200, JSON.stringify(l.json));
    assert.deepEqual(l.json.data.items.map((x) => x.name).sort(), ["Tia D.", "Tom D."]);
    assert.equal(l.json.data.due, 1);
    assert.equal((await admin("POST", `${V1}/teens/${tom}/graduate?dryRun=0`, { reason: "Turned 18" })).json.code, "not_18");

    await db.collection("GuardianLink").insertOne({ ...base(MFR), hash: "h1", purpose: "view", teen: tia, expiresAt: new Date(Date.now() + 86400000) });
    await db.collection("Redemption").insertOne({ ...base(MFR), user: tia, reference: "R-TIA-1", item: { key: "learn-course", kind: "learning", title: "Course" }, points: 6000, status: "guardian_pending", open: true, history: [] });
    const dry = await admin("POST", `${V1}/teens/${tia}/graduate`, {});
    assert.deepEqual([dry.json.data.dryRun, dry.json.data.guardianLinksToStop, dry.json.data.rewardRequestsToCancel], [true, 1, 1]);
    assert.equal((await db.collection("User").findOne({ _id: tia })).category, "b2c-minor", "a dry run changes nothing");
    assert.equal((await admin("POST", `${V1}/teens/${tia}/graduate?dryRun=0`, {})).json.code, "reason_required");
    const go = await admin("POST", `${V1}/teens/${tia}/graduate?dryRun=0`, { reason: "18th birthday passed, confirmed DOB" });
    assert.equal(go.json.data.dryRun, false);
    assert.equal((await db.collection("User").findOne({ _id: tia })).category, "b2c");
    assert.ok((await db.collection("GuardianLink").findOne({ teen: tia })).revokedAt);
    assert.equal((await db.collection("Redemption").findOne({ reference: "R-TIA-1" })).status, "cancelled");
    assert.equal((await db.collection("SegmentChange").countDocuments({ user: tia, to: "b2c" })), 1);
    assert.equal((await admin("POST", `${V1}/teens/${tia}/graduate?dryRun=0`, { reason: "again please" })).json.code, "not_teen");
});

test("data requests: listed masked, blocked while a reward is open, nothing deleted", async () => {
    const { insertedId } = await db.collection("DataRequest").insertOne({ ...base(MFR), user: asha, kind: "delete", status: "requested", open: true, reason: "Leaving", history: [{ status: "requested", by: "member", at: new Date() }] });
    await db.collection("Redemption").insertOne({ ...base(MFR), user: asha, reference: "R-ASHA-2", item: { key: "paypal-15", kind: "paypal" }, points: 15000, status: "requested", open: true, history: [] });
    const l = await admin("GET", `${V1}/data-requests`);
    assert.equal(l.json.data.items.length, 1);
    assert.ok(l.json.data.items[0].member.email.includes("***"));
    const id = String(insertedId);
    assert.equal((await admin("GET", `${V1}/data-requests/${id}`)).json.data.blockers.openRewards, 1);
    assert.equal((await admin("POST", `${V1}/data-requests/${id}/decision`, { status: "approved", reason: "Checked with the member" })).json.code, "blocked");
    await db.collection("Redemption").updateOne({ reference: "R-ASHA-2" }, { $set: { open: false, status: "rejected" } });
    assert.equal((await admin("POST", `${V1}/data-requests/${id}/decision`, { status: "approved", reason: "Checked with the member" })).json.data.after, "approved");
    assert.equal((await admin("POST", `${V1}/data-requests/${id}/decision`, { status: "done", reason: "Deleted by hand per runbook" }, { actor: BOB })).json.data.after, "done");
    assert.ok(await db.collection("User").findOne({ _id: asha }), "the code deletes nothing");
    assert.equal((await admin("GET", `${V1}/data-requests`, null, { origin: MHO })).json.data.items.length, 0);
});

test.after(async () => { server.close(); await mongoose.disconnect(); });

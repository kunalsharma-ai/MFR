// Panel admin API, super admin spec step 5: reports. Aggregate counts per brand only; MHO data never shows on MFR.
//
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_admin_reports node --test --test-force-exit tests/admin.reports.test.mjs
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
const { sign } = await import("../app/admin/auth.js");

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_admin_reports");
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
const V1 = "/api/v1/admin";

async function admin(method, path, body, { origin = MFR } = {}) {
    const raw = body ? JSON.stringify(body) : "";
    const ts = String(Math.floor(Date.now() / 1000));
    const nonce = crypto.randomBytes(16).toString("hex");
    const res = await fetch(`${BASE}${path}`, { method, body: raw || undefined, headers: { "content-type": "application/json", "x-madp-timestamp": ts, "x-madp-origin": origin, "x-madp-actor": ALICE, "x-madp-nonce": nonce, "x-madp-signature": sign(SECRET, { nonce, timestamp: ts, method, path, origin, actor: ALICE, body: raw }) } });
    return { status: res.status, json: await res.json().catch(() => ({})) };
}
const db = mongoose.connection.db;
const ago = (d) => new Date(Date.now() - d * 86400000);
const base = (origin, d = 1) => ({ origin, isActive: true, isDeleted: false, createdAt: ago(d), updatedAt: ago(d) });
async function member(origin, first, extra = {}) {
    const { insertedId } = await db.collection("User").insertOne({ ...base(origin, extra.days ?? 3), name: { first, last: "Demo" }, mail: `${first.toLowerCase()}@example.invalid`, category: "b2c", isVerified: { email: "verified" }, address: [{ country: "india" }], memberStatus: "active", lastActivityAt: ago(1), qualityScore: 100, terms: ["terms"], ...extra });
    return insertedId;
}
const asha = await member(MFR, "Asha");
const ravi = await member(MFR, "Ravi", { category: "b2b", qualityScore: 40, address: [{ country: "us" }], referredBy: "MFR-1" });
const tina = await member(MFR, "Tina", { category: "b2c-minor", isVerified: { email: "unverified" }, terms: [] });
await member(MHO, "Mo", { category: "patient" });
await db.collection("Response").insertMany([
    { ...base(MFR), user: asha, status: "complete", points: 500, survey: { slug: "grocery", name: "Grocery" } },
    { ...base(MFR), user: ravi, status: "terminate", points: 0, survey: { slug: "grocery", name: "Grocery" } },
    { ...base(MFR), user: tina, status: "invited", survey: { slug: "grocery", name: "Grocery" } },
    { ...base(MHO), user: asha, status: "complete", points: 900, survey: { slug: "health", name: "Health" } },
]);
await db.collection("Survey").insertOne({ ...base(MFR), slug: "grocery", name: "Grocery", loi: 12, status: "live" });
await db.collection("Reward").insertMany([
    { ...base(MFR), user: asha, key: "profile:about-you", category: "profile", name: "About you", points: 50 },
    { ...base(MFR), user: asha, key: "challenge:x", category: "challenge", name: "Challenge", points: 20 },
]);
await db.collection("Redemption").insertMany([
    { ...base(MFR, 5), user: asha, reference: "R1", points: 200, status: "fulfilled", fulfilledAt: ago(3), payout: { method: "paypal" }, item: { kind: "paypal" } },
    { ...base(MFR, 2), user: asha, reference: "R2", points: 100, status: "rejected", payout: { method: "paypal" }, item: { kind: "paypal" } },
]);
await db.collection("TeenRegistration").insertOne({ ...base(MFR), reference: "TR-1", status: "guardian_approved", teen: tina, history: [{ status: "pending_guardian_approval", at: ago(2), by: "system" }, { status: "guardian_approved", at: ago(1), by: "guardian" }] });
await db.collection("SupportTicket").insertOne({ ...base(MFR, 2), ticketNo: "T-1", category: "payments", status: "resolved" });
await db.collection("SupportComment").insertOne({ ...base(MFR, 1), ticketNo: "T-1", type: "reply", author: { kind: "agent", name: "Agent" } });
await db.collection("StreakDay").insertOne({ ...base(MFR), user: asha, day: ago(1).toISOString().slice(0, 10) });
await db.collection("Profile").insertOne({ isActive: true, isDeleted: false, origin: MFR, slug: "about-you", name: "About you", category: ["b2c"], pages: [["q1", "q2"]] });
await db.collection("Answer").insertMany([{ origin: MFR, user: String(asha), question: "q1", answer: "a" }, { origin: MFR, user: String(asha), question: "q2", answer: "b" }, { origin: MFR, user: String(ravi), question: "q1", answer: "a" }]);

const report = async (name, q = "", origin = MFR) => (await admin("GET", `${V1}/reports/${name}${q}`, null, { origin })).json;

test("every report runs for each brand and never shows another brand's data", async () => {
    const list = (await admin("GET", `${V1}/reports`)).json.data.reports;
    assert.equal(list.length, 11);
    for (const name of list) {
        const r = await report(name);
        assert.equal(r.status, "success", `${name}: ${JSON.stringify(r)}`);
        assert.ok(Array.isArray(r.data.rows), name);
        const text = JSON.stringify(r.data);
        assert.ok(!/@example\.invalid|Asha|Ravi|Tina/.test(text), `${name} holds no personal data`);
        const m = await report(name, "", MHO);
        assert.equal(m.status, "success", name);
    }
    assert.equal((await report("nope")).code, "not_found");
    assert.equal((await report("panel_health", "?from=2026-13-01")).code, "invalid_value");
});

test("the numbers are right and per brand", async () => {
    const health = (await report("panel_health")).data.rows;
    assert.equal(health.reduce((s, r) => s + r.total, 0), 3, "MHO's member is not counted");
    assert.equal(health.find((r) => r.segment === "b2b").segmentLabel, "Business Professional");
    assert.equal((await report("panel_health", "", MHO)).data.rows[0].segmentLabel, "Patient");
    const funnel = (await report("signup_funnel")).data.rows;
    const b2c = funnel.find((r) => r.segment === "b2c");
    assert.deepEqual([b2c.registered, b2c.verifiedEmail, b2c.firstProfile, b2c.firstSurvey], [1, 1, 1, 1]);
    assert.equal(funnel.find((r) => r.segment === "b2b").source, "referral");
    const teen = (await report("teen_pipeline")).data.rows;
    assert.equal(teen.length, 11);
    assert.equal(teen.find((r) => r.status === "guardian_approved").medianGuardianReplyHours, 24);
    const surveys = (await report("survey_performance")).data.rows;
    assert.deepEqual(surveys.map((s) => [s.survey, s.invites, s.starts, s.completes, s.screenOuts, s.incidence, s.loi]), [["grocery", 3, 2, 1, 1, 50, 12]]);
    const prof = (await report("profile_completion")).data.rows[0];
    assert.deepEqual([prof.started, prof.finished, prof.dropOffQuestion], [2, 1, "q2"]);
    const pts = (await report("points_liability")).data.rows.find((r) => r.segment === "b2c");
    assert.deepEqual([pts.issued, pts.redeemed, pts.unspentAtMonthEnd], [570, 200, 370]);
    const red = (await report("redemptions")).data.rows[0];
    assert.deepEqual([red.requested, red.paid, red.rejected, red.avgDaysToPay], [2, 1, 1, 2]);
    const q = (await report("quality")).data.rows;
    assert.equal(q.find((r) => r.segment === "b2b").flaggedBelow60, 1);
    assert.equal((await report("referrals")).data.rows[0].joins, 1);
    const sup = (await report("support")).data.rows[0];
    assert.deepEqual([sup.topic, sup.resolved, sup.avgFirstReplyHours], ["payments", 1, 24]);
    const eng = (await report("engagement")).data.rows.find((r) => r.segment === "b2c");
    assert.deepEqual([eng.membersWithStreakDays, eng.challengesDone], [1, 1]);
});

test.after(async () => { server.close(); await mongoose.disconnect(); });

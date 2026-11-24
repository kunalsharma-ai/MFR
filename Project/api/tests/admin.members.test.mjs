// Panel admin API (/api/admin/v1), Members module (super admin spec step 2). Requests are signed the way MADP signs.
//
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_admin_test node --test --test-force-exit tests/admin.members.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import dns from "node:dns";

dns.resolveMx = (domain, cb) => cb(null, [{ exchange: `mx.${domain}`, priority: 10 }]);
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const SECRET = "test-admin-secret-0123456789abcdef";
const MFR = "www.myfrequentrewards.com";
const MHO = "www.myhealthopinions.com";
process.env.MADP_ADMIN_API_SECRETS = `old-secret-not-used,${SECRET}`;
process.env.MADP_ADMIN_API_ORIGINS = `${MFR},${MHO}`;

const { default: mongoose } = await import("mongoose");
const { default: express } = await import("express");
const { default: cookieParser } = await import("cookie-parser");
const { default: appRoute } = await import("../app/routes/index.js");
const { setOrigin } = await import("../app/utils/index.js");
const { generate } = await import("../app/utils/token.js");
const { sign } = await import("../app/admin/auth.js");

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_admin_test");
await mongoose.connection.db.dropDatabase();

const app = express();
app.use([express.json({ type: (req) => !req.url.startsWith("/api/admin/") && /json/i.test(req.headers["content-type"] || "") }), cookieParser(), setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;
const HOST = `127.0.0.1:${server.address().port}`;
const ACTOR = "11111111-2222-4333-8444-555555555555";

async function admin(method, path, body, { origin = MFR, secret = SECRET, ts = Math.floor(Date.now() / 1000), actor = ACTOR } = {}) {
    const raw = body ? JSON.stringify(body) : "";
    const headers = {
        "content-type": "application/json",
        "x-madp-timestamp": String(ts),
        "x-madp-origin": origin,
        "x-madp-actor": actor,
        "x-madp-signature": sign(secret, { timestamp: String(ts), method, path, origin, actor, body: raw }),
    };
    const res = await fetch(`${BASE}${path}`, { method, headers, body: raw || undefined });
    let json = {};
    try { json = await res.json(); } catch { /* empty */ }
    return { status: res.status, json };
}

const db = mongoose.connection.db;
const now = new Date();
const monthsAgo = (m) => { const d = new Date(now); d.setUTCMonth(d.getUTCMonth() - m); return d; };
const base = (origin) => ({ origin, isActive: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date() });
async function member(origin, first, mail, extra = {}) {
    const { insertedId } = await db.collection("User").insertOne({
        ...base(origin), name: { first, last: "Demo" }, mail, phone: "+15550001234", dob: new Date("1990-05-01"), gender: "Female",
        timezone: "America/New_York", category: "b2c", isVerified: { email: "verified" }, address: [{ tag: "home", country: "us", city: "boston" }],
        paymentMethod: { method: "paypal", details: { email: mail } }, ...extra,
    });
    return String(insertedId);
}
await db.collection("Category").insertMany([{ ...base(MFR), name: "b2c" }, { ...base(MFR), name: "b2b" }]);
const asha = await member(MFR, "Asha", "asha@example.invalid");
const ben = await member(MFR, "Ben", "ben@example.invalid", { createdAt: monthsAgo(9) });
const cleo = await member(MFR, "Cleo", "cleo@example.invalid", { createdAt: monthsAgo(9) });
const teen = await member(MFR, "Tia", "tia@example.invalid", { category: "b2c minor" });
const mhoOnly = await member(MHO, "Mo", "mo@example.invalid");
// Cleo answered a survey three months ago, so only Ben is inactive for six months.
await db.collection("Response").insertOne({ ...base(MFR), user: new mongoose.Types.ObjectId(cleo), survey: { slug: "s1" }, status: "complete", updatedAt: monthsAgo(3) });

test("the API is closed without a valid MADP signature", async () => {
    const path = "/api/admin/v1/members";
    assert.equal((await fetch(`${BASE}${path}`)).status, 401);
    assert.equal((await admin("GET", path, null, { secret: "wrong" })).status, 401);
    assert.equal((await admin("GET", path, null, { ts: Math.floor(Date.now() / 1000) - 3600 })).status, 401);
    assert.equal((await admin("GET", path, null, { origin: "evil.example.com" })).status, 403);
    // A member token is not an admin credential.
    const res = await fetch(`${BASE}${path}`, { headers: { authorization: `Bearer ${generate({ _id: asha, origin: HOST })}` } });
    assert.equal(res.status, 401);
    // Tampering with the signed path (a different query) is refused.
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = sign(SECRET, { timestamp: ts, method: "GET", path, origin: MFR, actor: ACTOR, body: "" });
    const tampered = await fetch(`${BASE}${path}?status=banned`, { headers: { "x-madp-timestamp": ts, "x-madp-origin": MFR, "x-madp-actor": ACTOR, "x-madp-signature": sig } });
    assert.equal(tampered.status, 401);
});

test("search is per brand and masks personal data", async () => {
    const r = await admin("GET", "/api/admin/v1/members");
    assert.equal(r.status, 200);
    assert.equal(r.json.data.total, 4);
    assert.ok(!r.json.data.items.some((m) => m.id === mhoOnly), "MHO member must not show on MFR");
    const a = r.json.data.items.find((m) => m.id === asha);
    assert.equal(a.email, "a***@example.invalid");
    assert.ok(!JSON.stringify(r.json).includes("asha@example.invalid"));
    assert.ok(!JSON.stringify(r.json).includes("1990-05-01"));
    assert.equal(a.birthYear, 1990);
    assert.equal((await admin("GET", "/api/admin/v1/members?q=asha@example.invalid")).json.data.total, 1);
    assert.equal((await admin("GET", "/api/admin/v1/members?q=Ben")).json.data.items[0].id, ben);
    assert.equal((await admin("GET", "/api/admin/v1/members?segment=teen")).json.data.items[0].id, teen);
    const adults = (await admin("GET", "/api/admin/v1/members?noTeens=1")).json.data;
    assert.equal(adults.total, 3);
    assert.ok(!adults.items.some((m) => m.id === teen));
    // MHO sees only its own member.
    const m = await admin("GET", "/api/admin/v1/members", null, { origin: MHO });
    assert.deepEqual(m.json.data.items.map((x) => x.id), [mhoOnly]);
    // And a member id from another brand is "not found".
    assert.equal((await admin("GET", `/api/admin/v1/members/${mhoOnly}`)).status, 404);
});

test("member page and unmask", async () => {
    const d = await admin("GET", `/api/admin/v1/members/${asha}`);
    assert.equal(d.status, 200);
    assert.equal(d.json.data.fullName, "Asha Demo");
    assert.equal(d.json.data.status, "active");
    assert.ok(d.json.data.points);
    const u = await admin("POST", `/api/admin/v1/members/${asha}/unmask`, { fields: ["email", "phone", "nope"] });
    assert.deepEqual(u.json.data.fields, ["email", "phone"]);
    assert.equal(u.json.data.values.email, "asha@example.invalid");
    assert.equal((await admin("POST", `/api/admin/v1/members/${asha}/unmask`, { fields: [] })).status, 400);
});

test("edits only allowed fields and returns before and after", async () => {
    const r = await admin("PUT", `/api/admin/v1/members/${asha}`, { "name.first": "Ashaa", gender: "Female" });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.data.before, { "name.first": "Asha" });
    assert.deepEqual(r.json.data.after, { "name.first": "Ashaa" });
    assert.equal((await admin("PUT", `/api/admin/v1/members/${asha}`, { mail: "x@example.invalid" })).json.code, "field_not_editable");
    assert.equal((await admin("PUT", `/api/admin/v1/members/${asha}`, { gender: "Robot" })).json.code, "invalid_value");
    assert.equal((await admin("PUT", `/api/admin/v1/members/${asha}`, { category: "b2b" })).json.code, "field_not_editable");
});

test("suspend blocks the member API and sign-in; reactivate lets them back", async () => {
    const token = generate({ _id: asha, origin: HOST });
    // The member was made under the MFR brand; give them a copy under the test host to call the member API.
    const local = await member(HOST, "Lia", "lia@example.invalid");
    await db.collection("User").updateOne({ _id: new mongoose.Types.ObjectId(local) }, { $set: { origin: HOST } });
    const ltoken = generate({ _id: local, origin: HOST });
    const me = () => fetch(`${BASE}/api/v1/me`, { headers: { authorization: `Bearer ${ltoken}` } });
    assert.notEqual((await me()).status, 403);
    process.env.MADP_ADMIN_API_ORIGINS = `${MFR},${MHO},${HOST}`;
    assert.equal((await admin("POST", `/api/admin/v1/members/${local}/status`, { action: "suspend" }, { origin: HOST })).json.code, "reason_required");
    const s = await admin("POST", `/api/admin/v1/members/${local}/status`, { action: "suspend", reason: "Duplicate account check" }, { origin: HOST });
    assert.deepEqual(s.json.data, { before: { status: "active" }, after: { status: "suspended" } });
    assert.equal((await me()).status, 403);
    assert.equal((await admin("POST", `/api/admin/v1/members/${local}/status`, { action: "archive", reason: "Not allowed from suspended" }, { origin: HOST })).status, 409);
    await admin("POST", `/api/admin/v1/members/${local}/status`, { action: "reactivate", reason: "Checked, all fine" }, { origin: HOST });
    assert.notEqual((await me()).status, 403);
    process.env.MADP_ADMIN_API_ORIGINS = `${MFR},${MHO}`;
    assert.ok(token);
});

test("segment change keeps answers, logs who and why, and refuses teens", async () => {
    const r = await admin("POST", `/api/admin/v1/members/${asha}/segment`, { category: "b2b", reason: "Works as a buyer" });
    assert.deepEqual(r.json.data, { before: { category: "b2c" }, after: { category: "b2b" } });
    const log = await db.collection("SegmentChange").findOne({ user: new mongoose.Types.ObjectId(asha) });
    assert.equal(log.actor, ACTOR);
    assert.equal(log.origin, MFR);
    assert.equal((await admin("POST", `/api/admin/v1/members/${asha}/segment`, { category: "nope", reason: "Works as a buyer" })).json.code, "unknown_segment");
    assert.equal((await admin("POST", `/api/admin/v1/members/${teen}/segment`, { category: "b2b", reason: "Should be refused" })).status, 409);
    assert.equal((await admin("POST", `/api/admin/v1/members/${asha}/segment`, { category: "b2c minor", reason: "Should be refused" })).json.code, "bad_segment");
});

test("six-month check: dry run changes nothing, real run archives, restore brings back", async () => {
    const dry = await admin("POST", "/api/admin/v1/members/archive-run", { months: 6 });
    assert.equal(dry.json.data.dryRun, true);
    assert.deepEqual(dry.json.data.sample, [ben]);
    assert.equal((await db.collection("User").findOne({ _id: new mongoose.Types.ObjectId(ben) })).memberStatus, undefined);
    const run = await admin("POST", "/api/admin/v1/members/archive-run", { months: 6, dryRun: false });
    assert.equal(run.json.data.archived, 1);
    const b = await db.collection("User").findOne({ _id: new mongoose.Types.ObjectId(ben) });
    assert.equal(b.memberStatus, "archived");
    assert.ok(b.archivedAt);
    assert.equal((await db.collection("User").findOne({ _id: new mongoose.Types.ObjectId(cleo) })).memberStatus, undefined);
    // MHO's members are not touched by an MFR run.
    assert.equal((await db.collection("User").findOne({ _id: new mongoose.Types.ObjectId(mhoOnly) })).memberStatus, undefined);
    assert.equal((await admin("GET", "/api/admin/v1/members?status=archived")).json.data.total, 1);
    const back = await admin("POST", "/api/admin/v1/members/restore", { ids: [ben, cleo], reason: "Came back by e-mail" });
    assert.deepEqual(back.json.data, { asked: 2, restored: 1 });
    assert.equal((await db.collection("User").findOne({ _id: new mongoose.Types.ObjectId(ben) })).memberStatus, "active");
});

test.after(async () => {
    server.close();
    await mongoose.disconnect();
});

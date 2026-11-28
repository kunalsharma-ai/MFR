// Marketing e-mail consent ("Send me news and offers"), Kunal's option 1 (24 Nov 2026): an explicit opt-in at sign-up
// and in profile settings, stored with a timestamp. Unticked by default, no backfill, teens can't opt in, an admin can
// only record a withdrawal, and MADP reads it from the admin member list and detail.
//
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_marketing node --test --test-force-exit tests/marketing.optin.test.mjs
// Needs ports 8080 and 3000 free (stub mail services for the registration path).
import test from "node:test";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import dns from "node:dns";
import http from "node:http";

dns.resolveMx = (domain, cb) => cb(null, [{ exchange: `mx.${domain}`, priority: 10 }]);
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const SECRET = "test-admin-secret-0123456789abcdef";
process.env.MADP_ADMIN_API_SECRETS = SECRET;

const { default: mongoose } = await import("mongoose");
const { default: express } = await import("express");
const { default: cookieParser } = await import("cookie-parser");
const { default: appRoute } = await import("../app/routes/index.js");
const { setOrigin } = await import("../app/utils/index.js");
const { generate } = await import("../app/utils/token.js");
const { sign } = await import("../app/admin/auth.js");
const Models = await import("../app/model/index.js");

const stub = (port) => new Promise((r) => {
    const s = http.createServer((req, res) => { req.resume(); req.on("end", () => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ data: "<html/>" })); }); });
    s.listen(port, "127.0.0.1", () => r(s));
});
const stubs = await Promise.all([stub(8080), stub(3000)]);
await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_marketing");
await mongoose.connection.db.dropDatabase();
// build the unique indexes before the first request (the "409 already exists" checks rely on them; dropping the
// database while the models' start-up index build runs could leave one missing for a moment)
const IndexModels = await import("../app/model/index.js");
await Promise.all(Object.values(IndexModels).map((m) => m.init?.().then(() => m.createIndexes()).catch(() => {})));
await Promise.all(Object.values(Models).map((m) => m.syncIndexes?.().catch(() => {})));
const app = express();
app.use([express.json({ type: (req) => !req.url.startsWith("/api/v1/admin/") && /json/i.test(req.headers["content-type"] || "") }), cookieParser(), setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;
const MFR = `127.0.0.1:${server.address().port}`;
process.env.MADP_ADMIN_API_ORIGINS = MFR;
const V1 = "/api/v1/admin";
const ALICE = "11111111-2222-4333-8444-555555555555";
let ipN = 1;

async function call(method, path, body, token) {
    const headers = { "content-type": "application/json", "x-real-ip": `10.1.0.${ipN++ % 250}` };
    if (token) headers.authorization = `Bearer ${token}`;
    const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, json: await res.json().catch(() => ({})) };
}
async function admin(method, path, body) {
    const raw = body ? JSON.stringify(body) : "";
    const ts = String(Math.floor(Date.now() / 1000));
    const nonce = crypto.randomBytes(16).toString("hex");
    const res = await fetch(`${BASE}${path}`, { method, body: raw || undefined, headers: { "content-type": "application/json", "x-madp-timestamp": ts, "x-madp-origin": MFR, "x-madp-actor": ALICE, "x-madp-nonce": nonce, "x-madp-signature": sign(SECRET, { nonce, timestamp: ts, method, path, origin: MFR, actor: ALICE, body: raw }) } });
    return { status: res.status, json: await res.json().catch(() => ({})) };
}
const db = mongoose.connection.db;
const iso = (years) => { const d = new Date(); d.setUTCFullYear(d.getUTCFullYear() - years); return d.toISOString().slice(0, 10); };
const reg = (first, extra = {}) => ({ category: "b2c", name: { first, last: "Demo" }, gender: "Female", dob: iso(30), mail: `${first.toLowerCase()}@example.invalid`, phone: `9198765${String(ipN).padStart(5, "0")}`, timezone: "UTC", address: [{ tag: "home", country: "in" }], ...extra });
const userBy = (first) => Models.User.findOne({ mail: `${first.toLowerCase()}@example.invalid` }).lean();
const token = (u) => generate({ _id: String(u._id), origin: MFR });

test("sign-up: only a real tick opts in, an untouched box records nothing, and a string is not a tick", async () => {
    assert.equal((await call("PUT", "/api/v1/user", reg("Ines", { marketingOptIn: true }))).json.status, "success");
    assert.equal((await call("PUT", "/api/v1/user", reg("Nora", { marketingOptIn: false }))).json.status, "success");
    assert.equal((await call("PUT", "/api/v1/user", reg("Una"))).json.status, "success");
    assert.equal((await call("PUT", "/api/v1/user", reg("Sam", { marketingOptIn: "true" }))).json.status, "success");
    const ines = await userBy("Ines");
    assert.equal(ines.marketingOptIn.granted, true);
    assert.equal(ines.marketingOptIn.source, "signup");
    assert.equal(ines.marketingOptIn.wording, "news-offers-v1");
    assert.ok(ines.marketingOptIn.at instanceof Date);
    assert.equal(ines.marketingOptInHistory.length, 1);
    assert.equal((await userBy("Nora")).marketingOptIn.granted, false);
    assert.equal((await userBy("Una")).marketingOptIn?.granted, undefined, "never asked stays unset");
    assert.equal((await userBy("Sam")).marketingOptIn?.granted, undefined, "only a JSON true counts");
});

test("profile settings: the member sees and changes it, with a timestamp and history", async () => {
    const una = await userBy("Una");
    const g = await call("GET", "/api/v1/engagement/marketing", null, token(una));
    assert.equal(g.status, 200, JSON.stringify(g.json));
    assert.deepEqual({ granted: g.json.data.granted, asked: g.json.data.asked, teen: g.json.data.teen }, { granted: false, asked: false, teen: false });
    assert.equal((await call("PUT", "/api/v1/engagement/marketing", { optIn: "yes" }, token(una))).status, 400);
    const on = await call("PUT", "/api/v1/engagement/marketing", { optIn: true }, token(una));
    assert.equal(on.json.data.granted, true);
    assert.equal(on.json.data.source, "profile");
    const off = await call("PUT", "/api/v1/engagement/marketing", { optIn: false }, token(una));
    assert.equal(off.json.data.granted, false);
    const after = await userBy("Una");
    assert.deepEqual(after.marketingOptInHistory.map((h) => [h.granted, h.source, h.by]), [[true, "profile", "member"], [false, "profile", "member"]]);
});

test("T2O consent kit: adding or removing the 'marketing' term records the opt-in, other terms don't", async () => {
    await call("PUT", "/api/v1/user", reg("Tara"));
    const tara = await userBy("Tara");
    assert.equal((await call("PUT", "/api/v1/me", { terms: ["terms", "privacy", "age"] }, token(tara))).json.status, "success");
    assert.equal((await userBy("Tara")).marketingOptIn?.granted, undefined, "no marketing term, nothing recorded");
    await call("PUT", "/api/v1/me", { terms: ["terms", "privacy", "age", "marketing"] }, token(tara));
    let u = await userBy("Tara");
    assert.equal(u.marketingOptIn.granted, true);
    assert.equal(u.marketingOptIn.source, "profile");
    await call("PUT", "/api/v1/me", { terms: ["terms", "privacy", "age", "marketing", "analytics"] }, token(tara));
    assert.equal((await userBy("Tara")).marketingOptInHistory.length, 1, "unchanged marketing term, no new record");
    await call("PUT", "/api/v1/me", { terms: ["terms", "privacy", "age"] }, token(tara));
    u = await userBy("Tara");
    assert.equal(u.marketingOptIn.granted, false);
    assert.equal(u.marketingOptInHistory.length, 2);
});

test("teens can't opt in, but can always say no", async () => {
    const { insertedId } = await db.collection("User").insertOne({ origin: MFR, isActive: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date(), name: { first: "Tia", last: "Demo" }, mail: "tia@example.invalid", dob: new Date(iso(15)), category: "b2c-minor", memberStatus: "active", registrationStatus: "active" });
    const t = token({ _id: insertedId });
    const g = await call("GET", "/api/v1/engagement/marketing", null, t);
    assert.equal(g.json.data.teen, true);
    const r = await call("PUT", "/api/v1/engagement/marketing", { optIn: true }, t);
    assert.equal(r.status, 403);
    assert.equal(r.json.code, "teen_not_allowed");
    assert.equal((await call("PUT", "/api/v1/engagement/marketing", { optIn: false }, t)).json.data.granted, false);
    // the consent kit can't sneak it in either: the term is dropped for a teen
    await call("PUT", "/api/v1/me", { terms: ["terms", "marketing"] }, t);
    const teen = await Models.User.findById(insertedId).lean();
    assert.deepEqual(teen.terms, ["terms"]);
    assert.equal(teen.marketingOptIn.granted, false);
});

test("the generic user update can't set it, from the member or an admin route", async () => {
    const nora = await userBy("Nora");
    await call("PUT", `/api/v1/user/${nora._id}`, { marketingOptIn: { granted: true, at: new Date(), source: "admin" } }, token(nora));
    assert.equal((await userBy("Nora")).marketingOptIn.granted, false);
});

test("MADP: list filter, list row, detail with history, and an admin can only record a withdrawal", async () => {
    const list = await admin("GET", `${V1}/members?marketing=granted`);
    assert.equal(list.status, 200, JSON.stringify(list.json));
    assert.deepEqual(list.json.data.items.map((m) => m.name), ["Ines D."]);
    assert.equal(list.json.data.items[0].marketingOptIn.granted, true);
    const unset = await admin("GET", `${V1}/members?marketing=unset`);
    assert.deepEqual(unset.json.data.items.map((m) => m.name).sort(), ["Sam D."]);  // Tara and Una changed theirs

    const ines = await userBy("Ines");
    assert.equal((await admin("POST", `${V1}/members/${ines._id}/marketing-opt-out`, {})).json.code, "reason_required");
    const out = await admin("POST", `${V1}/members/${ines._id}/marketing-opt-out`, { reason: "Asked by e-mail to stop offers" });
    assert.equal(out.status, 200, JSON.stringify(out.json));
    assert.equal(out.json.data.granted, false);
    assert.equal(out.json.data.source, "admin");
    const d = await admin("GET", `${V1}/members/${ines._id}`);
    assert.equal(d.json.data.marketingOptIn.granted, false);
    assert.deepEqual(d.json.data.marketingOptInHistory.map((h) => [h.granted, h.source, h.by]), [[false, "admin", `madp:${ALICE}`], [true, "signup", "member"]]);
    // there is no route that opts a member in from the admin side
    assert.equal((await admin("POST", `${V1}/members/${ines._id}/marketing-opt-in`, { reason: "x" })).status, 404);
    assert.equal((await admin("PUT", `${V1}/members/${ines._id}`, { marketingOptIn: { granted: true } })).json.code, "field_not_editable");
});

test.after(async () => { server.close(); stubs.forEach((s) => s.close()); await mongoose.disconnect(); });

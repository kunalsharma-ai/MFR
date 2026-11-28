// The About You lock on the server (Kunal, 27 Nov 2026): no survey and no other profile opens until the member's
// About You profiles are complete, whatever the screen does. Real routes and MongoDB.
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_aboutyou node --test --test-force-exit tests/aboutyou.lock.test.mjs
import test from "node:test";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import dns from "node:dns";

dns.resolveMx = (domain, cb) => cb(null, [{ exchange: `mx.${domain}`, priority: 10 }]);

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const SECRET = "test-admin-secret-0123456789abcdef";
process.env.MADP_ADMIN_API_SECRETS = SECRET;

const { default: mongoose } = await import("mongoose");
const { default: express } = await import("express");
const { default: cookieParser } = await import("cookie-parser");
const { default: appRoute } = await import("../app/routes/index.js");
const { setOrigin, Token } = await import("../app/utils/index.js");
const { sign } = await import("../app/admin/auth.js");
const Models = await import("../app/model/index.js");
const A = await import("../app/member/aboutYou.js");

await mongoose.connect(process.env.MONGO_URL || `mongodb://127.0.0.1:27017/mfr_aboutyou_${Date.now()}`);
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
const ORIGIN = `127.0.0.1:${server.address().port}`;
process.env.MADP_ADMIN_API_ORIGINS = ORIGIN;
test.after(async () => {
    server.close();
    await mongoose.connection.db.dropDatabase().catch(() => {});
    await mongoose.disconnect();
    setTimeout(() => process.exit(), 500).unref();
});

const ACTOR = "11111111-2222-4333-8444-555555555555";
async function admin(method, p, body) {
    const raw = body ? JSON.stringify(body) : "";
    const ts = String(Math.floor(Date.now() / 1000));
    const nonce = crypto.randomBytes(16).toString("hex");
    const res = await fetch(`${BASE}${p}`, { method, body: raw || undefined, headers: { "content-type": "application/json", "x-madp-timestamp": ts, "x-madp-origin": ORIGIN, "x-madp-actor": ACTOR, "x-madp-nonce": nonce, "x-madp-signature": sign(SECRET, { nonce, timestamp: ts, method, path: p, origin: ORIGIN, actor: ACTOR, body: raw }) } });
    return { status: res.status, json: await res.json().catch(() => ({})) };
}
let ip = 0;
async function call(method, url, body, token) {
    const headers = { "content-type": "application/json", "x-real-ip": `10.7.0.${(ip++ % 250) + 1}` };
    if (token) headers.authorization = `Bearer ${token}`;
    const res = await fetch(`${BASE}${url}`, { method, headers, body: body ? JSON.stringify(body) : undefined, redirect: "manual" });
    const text = await res.text();
    let json = {};
    try { json = JSON.parse(text); } catch { /* not json */ }
    return { status: res.status, json, text };
}
let n = 0;
async function member(category = "b2c", role) {
    n += 1;
    const u = await Models.User.create({
        name: { first: `Demo${n}`, last: "Member" }, gender: "Female", dob: new Date("1990-01-01"),
        mail: `demo-${n}-${Date.now()}@example.com`, timezone: "Asia/Kolkata", category, origin: ORIGIN,
    });
    if (role) await Models.User.updateOne({ _id: u._id }, { $set: { role } });
    return { id: String(u._id), token: Token.generate({ _id: String(u._id), origin: ORIGIN }) };
}

// T2O's four About You profiles plus one topic profile, for Consumers; one profile for Professionals
const PROFILES = [["basic", 1], ["educational", 2], ["finance", 3], ["health", 4], ["shopping", 5]];
for (const [slug, order] of PROFILES) {
    await Models.Question.create({ name: `q-${slug}`, label: slug, type: "radio", category: ["b2c"], origin: ORIGIN });
    await Models.Profile.create({ name: slug, slug, category: "b2c", pages: [[`Page ${slug}`, `q-${slug}`]], points: 10, sortOrder: order, origin: ORIGIN });
}
await Models.Question.create({ name: "q-pro-basic", label: "pro", type: "radio", category: ["b2b"], origin: ORIGIN });
await Models.Profile.create({ name: "Pro basic", slug: "pro-basic", category: "b2b", pages: [["Page", "q-pro-basic"]], points: 10, origin: ORIGIN });
for (const category of ["b2c", "b2b"])
    await Models.Survey.create({ slug: "phones-2026", name: `Phones ${category}`, category, source: "internal", status: "active", points: 100, loi: 10, link: "https://surveys.example.invalid/phones?rid=", pages: [["Page", "q-phone"]], origin: ORIGIN });

const fill = (m, slugs) => call("PATCH", "/api/v1/me/profile", Object.fromEntries(slugs.map((s) => [`q-${s}`, "a"])), m.token);

test("default list: the four About You profiles; surveys and other profiles stay locked until they are done", async () => {
    const m = await member();
    const s = await call("GET", "/api/v1/me/about-you", null, m.token);
    assert.equal(s.status, 200, s.text);
    assert.equal(s.json.data.source, "default");
    assert.equal(s.json.data.complete, false);
    assert.deepEqual(s.json.data.required.map((p) => p.slug), ["basic", "educational", "finance", "health"]);
    assert.deepEqual(s.json.data.locked, ["shopping"]);

    // a direct survey link: the survey does not open and no response is started
    const open = await call("PUT", "/api/v1/me/survey", { slug: "phones-2026" }, m.token);
    assert.equal(open.status, 403, open.text);
    assert.equal(open.json.code, "about_you");
    assert.deepEqual(open.json.data.missing, ["basic", "educational", "finance", "health"]);
    assert.equal(await Models.Response.countDocuments({ user: m.id }), 0);
    // a locked profile does not open or save
    assert.equal((await call("PUT", "/api/v1/me/survey", { slug: "shopping" }, m.token)).status, 403);
    assert.equal((await fill(m, ["shopping"])).status, 403);
    assert.equal((await call("PATCH", "/api/v1/me/answer", { "q-shopping": "a" }, m.token)).status, 403);
    assert.equal(await Models.Answers.countDocuments({ user: m.id, question: "q-shopping" }), 0);
    // About You profiles and questions in no profile (settings) are never blocked
    assert.equal((await fill(m, ["basic", "educational"])).json.status, "success");
    assert.equal((await call("PATCH", "/api/v1/me/answer", { "payment-method": "paypal" }, m.token)).json.status, "success");
    // half done is still locked
    assert.equal((await call("PUT", "/api/v1/me/survey", { slug: "phones-2026" }, m.token)).status, 403);

    assert.equal((await fill(m, ["finance", "health"])).json.status, "success");
    const after = await call("GET", "/api/v1/me/about-you", null, m.token);
    assert.equal(after.json.data.complete, true);
    assert.deepEqual(after.json.data.locked, []);
    const ok = await call("PUT", "/api/v1/me/survey", { slug: "phones-2026" }, m.token);
    assert.equal(ok.json.status, "success", ok.text);
    assert.ok(ok.json.data.respID);
    assert.equal((await fill(m, ["shopping"])).json.status, "success");
});

test("a survey started before the lock cannot save answers while About You is open", async () => {
    const m = await member();
    const r = await Models.Response.create({ user: m.id, survey: { name: "Phones", slug: "phones-2026" }, status: "dropout", source: "internal", points: 100, origin: ORIGIN });
    const save = await call("PATCH", "/api/v1/me/survey", { respID: String(r._id), "q-phone": "x" }, m.token);
    assert.equal(save.status, 403, save.text);
    assert.equal((await Models.Response.findById(r._id)).status, "dropout");
    // nor someone else's response
    const other = await member();
    assert.equal((await call("PATCH", "/api/v1/me/survey", { respID: String(r._id) }, other.token)).status, 404);
});

test("the survey entry link is not handed out by the open survey routes", async () => {
    const visitor = await call("GET", "/api/v1/survey");
    assert.equal(visitor.json.status, "success");
    assert.ok(visitor.json.data.length >= 1);
    assert.ok(visitor.json.data.every((s) => !("link" in s)));
    const m = await member();
    const list = await call("POST", "/api/v1/survey", { slug: "phones-2026" }, m.token);
    assert.ok(list.json.data.every((s) => !("link" in s)));
    const one = await call("GET", `/api/v1/survey/${visitor.json.data[0]._id}`, null, m.token);
    assert.equal(one.json.status, "success");
    assert.ok(!("link" in one.json.data));
    const boss = await member("b2c", "admin");
    const adminView = await call("GET", "/api/v1/survey", null, boss.token);
    assert.ok(adminView.json.data.every((s) => s.link));
});

test("the MADP console sets the list per brand and per category, with a reason", async () => {
    const g = await admin("GET", "/api/v1/admin/about-you");
    assert.equal(g.status, 200, JSON.stringify(g.json));
    assert.equal(g.json.data.saved, false);
    assert.deepEqual(g.json.data.groups, A.DEFAULT_GROUPS);
    const b2c = g.json.data.categories.find((c) => c.category === "b2c");
    assert.deepEqual(b2c.aboutYou.map((p) => p.slug), ["basic", "educational", "finance", "health"]);
    assert.equal(b2c.locked, 1);
    // the default list falls back to the first two profiles for a category that has fewer than two of them
    assert.deepEqual(g.json.data.categories.find((c) => c.category === "b2b").aboutYou.map((p) => p.slug), ["pro-basic"]);

    assert.equal((await admin("PUT", "/api/v1/admin/about-you", { groups: [["basic"]] })).json.code, "reason_required");
    assert.equal((await admin("PUT", "/api/v1/admin/about-you", { groups: [["basic"], ["basic"]], reason: "Only basic first" })).json.code, "invalid_value");
    assert.equal((await admin("PUT", "/api/v1/admin/about-you", { groups: [["Bad slug!"]], reason: "Only basic first" })).json.code, "invalid_value");
    assert.equal((await admin("PUT", "/api/v1/admin/about-you", { groups: [], reason: "Only basic first" })).json.code, "invalid_value");

    const put = await admin("PUT", "/api/v1/admin/about-you", { groups: [["basic"]], byCategory: { B2B: [] }, reason: "MFR: only Basic first" });
    assert.equal(put.status, 200, JSON.stringify(put.json));
    assert.equal(put.json.data.saved, true);
    assert.deepEqual(put.json.data.groups, [["basic"]]);
    assert.deepEqual(put.json.data.byCategory, { b2b: [] });
    assert.equal(put.json.data.history[0].reason, "MFR: only Basic first");
    assert.equal(put.json.data.history[0].by, ACTOR);
    assert.deepEqual(put.json.data.categories.find((c) => c.category === "b2b").aboutYou, []);

    // a Consumer now only needs Basic; a Professional needs nothing
    const c = await member("b2c");
    assert.equal((await call("PUT", "/api/v1/me/survey", { slug: "phones-2026" }, c.token)).status, 403);
    await fill(c, ["basic"]);
    assert.equal((await call("PUT", "/api/v1/me/survey", { slug: "phones-2026" }, c.token)).json.status, "success");
    const p = await member("b2b");
    const pv = await call("GET", "/api/v1/me/about-you", null, p.token);
    assert.equal(pv.json.data.source, "category");
    assert.equal(pv.json.data.complete, true);
    assert.equal((await call("PUT", "/api/v1/me/survey", { slug: "phones-2026" }, p.token)).json.status, "success");

    // back to the default list
    const back = await admin("PUT", "/api/v1/admin/about-you", { groups: null, byCategory: {}, reason: "Back to the four" });
    assert.equal(back.json.data.saved, false);
    assert.deepEqual(back.json.data.groups, A.DEFAULT_GROUPS);
    assert.equal(back.json.data.history.length, 2);
    const again = await member("b2c");
    assert.equal((await call("GET", "/api/v1/me/about-you", null, again.token)).json.data.source, "default");
});

test("discovery declares the capability", async () => {
    const d = await admin("GET", "/api/v1/contract");
    assert.equal(d.json.data.version, "1.1.0");
    assert.ok(d.json.data.capabilities.includes("admin.about_you"));
});

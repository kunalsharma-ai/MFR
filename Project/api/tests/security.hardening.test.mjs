// Hardening against attackers and bots (Kunal, 24 Nov 2026: "no hacker or AI bot can hack this portal").
// Each test below failed before the fix it names.
//
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_security_hardening node --test --test-force-exit tests/security.hardening.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import dns from "node:dns";
import http from "node:http";

dns.resolveMx = (domain, cb) => cb(null, [{ exchange: `mx.${domain}`, priority: 10 }]);
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const SECRET = "hardening-test-secret-0123456789abcdef";
process.env.MADP_ADMIN_API_SECRETS = SECRET;
process.env.MADP_ADMIN_API_ORIGINS = "www.myfrequentrewards.com,www.turn2opinion.com,www.myhealthopinions.com";
delete process.env.SOCIAL_JWT_SECRET;

const { default: mongoose } = await import("mongoose");
const { default: express } = await import("express");
const { default: cookieParser } = await import("cookie-parser");
const { default: jwt } = await import("jsonwebtoken");
const { default: appRoute } = await import("../app/routes/index.js");
const { setOrigin, Token } = await import("../app/utils/index.js");
const { sign } = await import("../app/admin/auth.js");
const { clean } = await import("../app/utils/security.js");
const { User: UserModel } = await import("../app/model/index.js");

await mongoose.connect(process.env.MONGO_URL || `mongodb://127.0.0.1:27017/mfr_security_hardening_${Date.now()}`);
await mongoose.connection.db.dropDatabase();
await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes?.().catch(() => {})));
const app = express();
// as in server.js: the admin API parses its own bodies (the signature covers the raw bytes)
app.use([express.json({ type: (req) => !req.url.startsWith("/api/v1/admin/") && /json/i.test(req.headers["content-type"] || "") }), cookieParser(), setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const PORT = server.address().port;
const T2O = "www.turn2opinion.com", MFR = "www.myfrequentrewards.com", MHO = "www.myhealthopinions.com";
const db = mongoose.connection.db;

let ipN = 0;
/** a request to one brand (the Host header), from a new address each time unless one is given */
function call(host, method, path, body, { token, ip, headers = {} } = {}) {
    return new Promise((resolve, reject) => {
        const raw = body === undefined ? "" : typeof body === "string" ? body : JSON.stringify(body);
        const req = http.request({ host: "127.0.0.1", port: PORT, method, path, headers: { host, "content-type": "application/json", "content-length": Buffer.byteLength(raw), "x-real-ip": ip || `10.1.${Math.floor(++ipN / 250)}.${ipN % 250}`, ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers } }, (res) => {
            let text = "";
            res.on("data", (c) => { text += c; });
            res.on("end", () => { let json = {}; try { json = JSON.parse(text); } catch { /* not JSON */ } resolve({ status: res.statusCode, json, text, headers: res.headers }); });
        });
        req.on("error", reject);
        req.end(raw);
    });
}
const base = (origin) => ({ origin, isActive: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date() });
let n = 0;
async function person(origin, { role = "respondent", password } = {}) {
    n += 1;
    const doc = { ...base(origin), name: { first: `Person${n}`, last: "Test" }, mail: `person${n}@example.invalid`, role, category: "b2c", dob: new Date("1990-01-01"), gender: "Female", isVerified: { email: "verified" }, memberStatus: "active" };
    const { insertedId } = await db.collection("User").insertOne(doc);
    if (password) { const u = await UserModel.findById(insertedId); await UserModel.updateOne({ _id: insertedId }, { password: await hash(u, password) }); }
    return { id: String(insertedId), mail: doc.mail, origin, token: Token.generate({ _id: String(insertedId), origin }) };
}
async function hash(u, password) {
    const { default: bcrypt } = await import("bcryptjs");
    return bcrypt.hash(password, 10);
}

const member = await person(MFR);
const admin = await person(MFR, { role: "administrator" });
const t2oMember = await person(T2O);

test("question, category and option changes need an admin", async () => {
    const { insertedId: q } = await db.collection("Question").insertOne({ ...base(MFR), name: "q_lock", label: "Locked?", type: "radio", category: ["b2c"] });
    const { insertedId: c } = await db.collection("Category").insertOne({ ...base(MFR), name: "cat_lock", label: "Cat" });
    const { insertedId: o } = await db.collection("Option").insertOne({ ...base(MFR), question: "q_lock", value: "1", label: "One" });
    const writes = [
        ["PUT", "/api/v1/question", { name: "q_new", label: "New", type: "radio" }],
        ["PUT", `/api/v1/question/${q}`, { label: "Hacked" }],
        ["PATCH", `/api/v1/question/${q}`, {}],
        ["DELETE", `/api/v1/question/${q}`],
        ["PUT", "/api/v1/category", { name: "evil", label: "Evil" }],
        ["PUT", `/api/v1/category/${c}`, { label: "Hacked" }],
        ["DELETE", `/api/v1/category/${c}`],
        ["PUT", "/api/v1/option/q_lock", { value: "9", label: "Evil" }],
        ["PUT", `/api/v1/option/q_lock/${o}`, { label: "Hacked" }],
        ["DELETE", `/api/v1/option/q_lock/${o}`],
    ];
    for (const [method, path, body] of writes) {
        assert.equal((await call(MFR, method, path, body)).status, 401, `${method} ${path} without sign-in`);
        assert.equal((await call(MFR, method, path, body, { token: member.token })).status, 403, `${method} ${path} as a member`);
    }
    assert.equal((await db.collection("Question").findOne({ _id: q })).label, "Locked?");
    assert.equal((await db.collection("Category").findOne({ _id: c })).label, "Cat");
    assert.equal((await db.collection("Option").findOne({ _id: o })).label, "One");
    const ok = await call(MFR, "PUT", `/api/v1/question/${q}`, { label: "Fixed by admin" }, { token: admin.token });
    assert.equal(ok.status, 200, ok.text.slice(0, 200));
    assert.equal((await db.collection("Question").findOne({ _id: q })).label, "Fixed by admin");
    // reading stays public
    assert.equal((await call(MFR, "GET", "/api/v1/question")).status, 200);
});

test("projects and e-mail batches are admin tools", async () => {
    assert.equal((await call(MFR, "GET", "/api/v1/project-dev")).status, 401);
    assert.equal((await call(MFR, "PUT", "/api/v1/project-dev", { project: "x", name: "Evil" })).status, 401);
    assert.equal((await call(MFR, "GET", "/api/v1/project", undefined, { token: member.token })).status, 403);
    assert.equal((await call(MFR, "PUT", "/api/v1/batch", { name: "spam", emails: ["a@example.invalid"], scheduledAt: new Date() }, { token: member.token })).status, 403);
    assert.equal(await db.collection("Batch").countDocuments({}), 0);
    assert.equal((await call(MFR, "GET", "/api/v1/feasibility")).status, 401, "member count is not public");
    assert.equal((await call(MFR, "POST", "/api/v1/feasibility", {})).status, 200, "the feasibility check itself still works");
});

test("sign-in: 10 wrong passwords lock the account for 15 minutes, whatever address the bot uses", async () => {
    const p = await person(MFR, { password: "Right-Password-1" });
    for (let i = 0; i < 10; i += 1) {
        const r = await call(MFR, "POST", "/api/v1/user/login", { mail: p.mail, password: `wrong-${i}` });
        assert.match(r.json.message || "", /invalid/i, r.text.slice(0, 200));
    }
    const locked = await call(MFR, "POST", "/api/v1/user/login", { mail: p.mail, password: "Right-Password-1" });
    assert.match(locked.json.message || "", /too many wrong attempts/i, locked.text.slice(0, 200));
    // the same e-mail on another brand is another account
    const other = await call(T2O, "POST", "/api/v1/user/login", { mail: p.mail, password: "x" });
    assert.doesNotMatch(other.json.message || "", /too many/i);
});

test("sign-in accepts only text, never a database filter", async () => {
    await person(MFR, { password: "Right-Password-1" });
    for (const body of [{ mail: { $ne: null }, password: "x" }, { mail: { $gt: "" }, password: { $ne: null } }, { mail: { $regex: "^person" }, password: "Right-Password-1" }]) {
        const r = await call(MFR, "POST", "/api/v1/user/login", body);
        assert.notEqual(r.status, 302, JSON.stringify(body));
        assert.ok(!r.headers["set-cookie"], `no session for ${JSON.stringify(body)}`);
    }
});

test("an emailed code allows 5 wrong guesses, then it is gone", async () => {
    const p = await person(MFR);
    await db.collection("OTP").insertOne({ ...base(MFR), user: new mongoose.Types.ObjectId(p.id), channel: "email", code: "123456", expiresAt: new Date(Date.now() + 864e5) });
    for (let i = 0; i < 5; i += 1) {
        const r = await call(MFR, "PATCH", "/api/v1/user", { userID: p.id, emailOTP: String(200000 + i), password: "New-Pass-123", confirmPassword: "New-Pass-123" });
        assert.match(r.json.message || "", /expired/i);
    }
    const right = await call(MFR, "PATCH", "/api/v1/user", { userID: p.id, emailOTP: "123456", password: "New-Pass-123", confirmPassword: "New-Pass-123" });
    assert.match(right.json.message || "", /expired/i, "the right code no longer works after 5 wrong ones");
    assert.equal(await db.collection("OTP").countDocuments({ user: new mongoose.Types.ObjectId(p.id) }), 0);
    // a filter instead of a member id matches nobody
    await db.collection("OTP").insertOne({ ...base(MFR), user: new mongoose.Types.ObjectId(p.id), channel: "email", code: "654321", expiresAt: new Date(Date.now() + 864e5) });
    const filter = await call(MFR, "PATCH", "/api/v1/user", { userID: { $ne: null }, emailOTP: "654321", password: "New-Pass-123", confirmPassword: "New-Pass-123" });
    assert.match(filter.json.message || "", /expired/i);
    const u = await db.collection("User").findOne({ _id: new mongoose.Types.ObjectId(p.id) });
    assert.ok(!u.password, "no password was set");
});

test("new codes come from a cryptographic random source", async () => {
    const { default: OTP } = await import("../app/model/OTP.js");
    const src = OTP.schema.methods.generateOTP.toString();
    assert.match(src, /crypto\.randomInt/);
    assert.doesNotMatch(src, /Math\.random/);
});

test("forgot-password sends at most 3 e-mails an hour to one address", async () => {
    for (let i = 0; i < 5; i += 1) await call(MFR, "POST", "/api/v1/forgot-password", { user: "flood@example.invalid" });
    const row = await db.collection("AuthThrottle").findOne({ _id: `reset:${MFR}:flood@example.invalid` });
    assert.ok(row?.lockedUntil > new Date(), "locked after 3");
});

test("change of e-mail: an expired code and a sign-in token are refused", async () => {
    const p = await person(MFR);
    await db.collection("OTP").insertOne({ ...base(MFR), user: new mongoose.Types.ObjectId(p.id), channel: "email", code: "111111", expiresAt: new Date(Date.now() - 1000) });
    const link = Token.generate({ user: p.id, otp: "111111", email: "taken.over@example.invalid" }, "24h");
    const r = await call(MFR, "PATCH", "/api/v1/change-email", { token: link });
    assert.match(r.json.message || "", /expired/i, r.text.slice(0, 200));
    assert.equal((await db.collection("User").findOne({ _id: new mongoose.Types.ObjectId(p.id) })).mail, p.mail);
    const signin = await call(MFR, "PATCH", "/api/v1/change-email", { token: p.token });
    assert.match(signin.json.message || "", /not valid/i);
});

test("social sign-on: the key that used to be in the code no longer signs anyone in", async () => {
    const OLD = "8e2a8ad9aa0f57a3f8dd7ddda64da43745ee88dec1877a12bc639894937ac600b70721aa431ce6c778bc640b04fbfaecf8fdc68bfa989fb138bff5bfde2f647c";
    const forged = jwt.sign({ email: member.mail }, OLD);
    const r = await call(MFR, "GET", `/api/v1/auth/socials?token=${forged}`);
    assert.equal(r.status, 302);
    assert.match(r.headers.location, /signup=1/);
    assert.ok(!String(r.headers["set-cookie"] || "").includes("authorization"), "no session cookie");
    // with a configured key: an old or "none" token is refused
    process.env.SOCIAL_JWT_SECRET = "s".repeat(40);
    const none = jwt.sign({ email: member.mail }, null, { algorithm: "none" });
    const stale = jwt.sign({ email: member.mail, iat: Math.floor(Date.now() / 1000) - 3600 }, process.env.SOCIAL_JWT_SECRET);
    for (const t of [none, stale, forged]) {
        const x = await call(MFR, "GET", `/api/v1/auth/socials?token=${t}`);
        assert.ok(!String(x.headers["set-cookie"] || "").includes("authorization"));
    }
    const good = await call(MFR, "GET", `/api/v1/auth/socials?token=${jwt.sign({ email: member.mail }, process.env.SOCIAL_JWT_SECRET)}`);
    assert.ok(String(good.headers["set-cookie"] || "").includes("authorization"), "a fresh token from the real key works");
    delete process.env.SOCIAL_JWT_SECRET;
});

test("sign-in tokens: only HS256, and a bad token is not echoed back", async () => {
    const none = jwt.sign({ _id: member.id, origin: MFR }, null, { algorithm: "none" });
    assert.equal((await call(MFR, "GET", "/api/v1/me", undefined, { token: none })).status, 401);
    const r = await call(MFR, "GET", "/api/v1/me", undefined, { token: jwt.sign({ origin: MFR }, process.env.JWT_SECRET) });
    assert.equal(r.status, 401);
    assert.ok(!("user" in r.json) && !("info" in r.json));
});

test("an admin of one brand can't read or change a member of another brand by id", async () => {
    const r = await call(MFR, "GET", `/api/v1/user/${t2oMember.id}`, undefined, { token: admin.token });
    assert.ok(!r.text.includes(t2oMember.mail), r.text.slice(0, 200));
    await call(MFR, "PUT", `/api/v1/user/${t2oMember.id}`, { timezone: "Hacked/Zone" }, { token: admin.token });
    assert.notEqual((await db.collection("User").findOne({ _id: new mongoose.Types.ObjectId(t2oMember.id) })).timezone, "Hacked/Zone");
});

test("requests for different brands at the same moment never see each other's data", async () => {
    for (const [origin, tag] of [[T2O, "zzt2ozz"], [MFR, "zzmfrzz"], [MHO, "zzmhozz"]]) {
        await db.collection("Question").insertOne({ ...base(origin), name: "same_name", label: `Label ${tag}`, type: "radio", category: ["b2c"] });
        await db.collection("Option").insertMany(Array.from({ length: 3 }, (_, i) => ({ ...base(origin), question: "same_name", value: `v${i}`, label: `Option ${tag}` })));
    }
    const tags = { [T2O]: "zzt2ozz", [MFR]: "zzmfrzz", [MHO]: "zzmhozz" };
    const calls = [];
    for (let i = 0; i < 90; i += 1) { const host = [T2O, MFR, MHO][i % 3]; calls.push(call(host, "GET", "/api/v1/question").then((r) => [host, r])); }
    for (const [host, r] of await Promise.all(calls)) {
        for (const [o, tag] of Object.entries(tags)) if (o !== host) assert.ok(!r.text.includes(tag), `${host} saw ${o}'s questions`);
    }
});

test("code-running and update operators are dropped from anything the browser sends", () => {
    const out = clean({ name: { $in: ["a"] }, $where: "sleep(5000)", x: { $expr: { $function: {} }, $regex: "^a" }, list: [{ $gt: 1, $where: "1" }], __proto__: { admin: true }, ok: { $set: { role: "admin" } } });
    assert.deepEqual(out, { name: { $in: ["a"] }, x: {}, list: [{ $gt: 1 }], ok: {} });
});

test("browser security headers and no caching on API answers", async () => {
    const r = await call(MFR, "GET", "/api/v1/question");
    assert.equal(r.headers["x-content-type-options"], "nosniff");
    assert.equal(r.headers["x-frame-options"], "DENY");
    assert.equal(r.headers["cache-control"], "no-store");
    assert.match(r.headers["strict-transport-security"] || "", /max-age=31536000/);
});

// --- the signed admin API ---
function signed(method, path, body, { nonce = crypto.randomBytes(16).toString("hex"), ts = String(Math.floor(Date.now() / 1000)), origin = MFR } = {}) {
    const raw = body ? JSON.stringify(body) : "";
    const actor = "11111111-2222-3333-4444-555555555555";
    return { method, path, raw, headers: { "x-madp-timestamp": ts, "x-madp-nonce": nonce, "x-madp-origin": origin, "x-madp-actor": actor, "x-madp-signature": sign(SECRET, { timestamp: ts, nonce, method, path, origin, actor, body: raw }) } };
}
const send = (s) => call("panel-api.internal", s.method, s.path, s.raw || undefined, { headers: s.headers });

test("admin API: a signed request works once; sent again it is refused as a replay", async () => {
    const s = signed("GET", "/api/v1/admin/members?q=zz");
    assert.equal((await send(s)).status, 200);
    const again = await send(s);
    assert.equal(again.status, 409);
    assert.match(again.json.message, /replayed/);
    const w = signed("POST", "/api/v1/admin/members/restore", { ids: [], reason: "replay test" });
    assert.notEqual((await send(w)).status, 409);
    assert.equal((await send(w)).status, 409);
});

test("admin API lives under /api/v1/admin only: the old /api/admin/v1 path is gone, and unsigned calls are refused", async () => {
    const old = signed("GET", "/api/admin/v1/members");
    assert.equal((await send(old)).status, 404);
    assert.equal((await call("panel-api.internal", "GET", "/api/v1/admin/members")).status, 401);
});

test("admin API: a request without a nonce, or with the nonce changed, is refused", async () => {
    const s = signed("GET", "/api/v1/admin/members");
    const { "x-madp-nonce": _drop, ...noNonce } = s.headers;
    assert.equal((await call("panel-api.internal", "GET", s.path, undefined, { headers: noNonce })).status, 401);
    const changed = { ...s.headers, "x-madp-nonce": crypto.randomBytes(16).toString("hex") };
    assert.equal((await call("panel-api.internal", "GET", s.path, undefined, { headers: changed })).status, 401);
});

test.after(async () => { server.close(); await mongoose.disconnect(); });

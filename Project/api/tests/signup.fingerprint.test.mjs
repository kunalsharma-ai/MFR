// Sign-up fingerprint (Kunal, 26 Nov 2026): the panel keeps only one-way hashes of the sign-up IP and device, and the
// admin duplicates list groups accounts that share them ("same IP", "same device") for the MADP fraud alert.
// The raw IP, user-agent and device id are never stored or returned.
//
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_fingerprint node --test --test-force-exit tests/signup.fingerprint.test.mjs
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
const { sign } = await import("../app/admin/auth.js");
const Models = await import("../app/model/index.js");

const stub = (port) => new Promise((r) => {
    const s = http.createServer((req, res) => { req.resume(); req.on("end", () => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ data: "<html/>" })); }); });
    s.listen(port, "127.0.0.1", () => r(s));
});
const stubs = await Promise.all([stub(8080), stub(3000)]);
await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_fingerprint");
await mongoose.connection.db.dropDatabase();
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

async function signup(first, headers) {
    const res = await fetch(`${BASE}/api/v1/user`, { method: "PUT", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(reg(first)) });
    ipN++;
    return (await res.json()).status;
}
const raw = (first) => db.collection("User").findOne({ mail: `${first.toLowerCase()}@example.invalid` });
const UA = "Mozilla/5.0 (Linux; Android 14) Chrome/131";

test("sign-up keeps only one-way hashes of the IP and device, hidden from normal reads", async () => {
    assert.equal(await signup("Ivy", { "x-real-ip": "203.0.113.7", "user-agent": UA, "accept-language": "en-IN" }), "success");
    const u = await raw("Ivy");
    assert.match(u.signupFingerprint.ipHash, /^[a-f0-9]{64}$/);
    assert.match(u.signupFingerprint.deviceHash, /^[a-f0-9]{64}$/);
    assert.ok(u.signupFingerprint.at instanceof Date);
    const all = JSON.stringify(u);
    assert.ok(!all.includes("203.0.113.7") && !all.includes("Android"), "the raw IP and user-agent are never stored");
    assert.equal((await userBy("Ivy")).signupFingerprint, undefined, "select: false keeps it out of normal reads");
});

test("the same IP or device gives the same hash, a different one doesn't; x-device-id wins over the browser", async () => {
    await signup("Ida", { "x-real-ip": "::ffff:203.0.113.7", "user-agent": "Other/1.0" });
    await signup("Dev", { "x-real-ip": "198.51.100.1", "user-agent": UA, "accept-language": "en-IN" });
    await signup("App1", { "x-real-ip": "198.51.100.2", "x-device-id": "device-abc" });
    await signup("App2", { "x-real-ip": "198.51.100.3", "x-device-id": "device-abc", "user-agent": UA, "accept-language": "en-IN" });
    const [ivy, ida, dev, a1, a2] = await Promise.all(["Ivy", "Ida", "Dev", "App1", "App2"].map(raw));
    assert.equal(ida.signupFingerprint.ipHash, ivy.signupFingerprint.ipHash, "IPv4-mapped address counts as the same IP");
    assert.notEqual(ida.signupFingerprint.deviceHash, ivy.signupFingerprint.deviceHash);
    assert.equal(dev.signupFingerprint.deviceHash, ivy.signupFingerprint.deviceHash, "same browser");
    assert.notEqual(dev.signupFingerprint.ipHash, ivy.signupFingerprint.ipHash);
    assert.equal(a1.signupFingerprint.deviceHash, a2.signupFingerprint.deviceHash, "same app device id");
    assert.notEqual(a2.signupFingerprint.deviceHash, ivy.signupFingerprint.deviceHash, "the device id is used, not the browser");
});

test("admin duplicates: by=ip and by=device group those accounts, masked, without the hash", async () => {
    const ip = await admin("GET", `${V1}/members/duplicates?by=ip`);
    assert.equal(ip.status, 200, JSON.stringify(ip.json));
    assert.equal(ip.json.data.reason, "Signed up from the same IP address");
    assert.equal(ip.json.data.groups, 1);
    assert.equal(ip.json.data.items[0].members.length, 2);
    const dev = await admin("GET", `${V1}/members/duplicates?by=device`);
    assert.equal(dev.json.data.groups, 2, "Ivy+Dev (browser) and App1+App2 (device id)");
    const body = JSON.stringify([ip.json, dev.json]);
    assert.ok(!/[a-f0-9]{64}/.test(body), "no hash in the reply");
    assert.ok(!body.includes("ivy@example.invalid"), "e-mails are masked");
    assert.equal((await admin("GET", `${V1}/members/duplicates?by=x`)).status, 400);
});

test("teens never match, and older accounts without a fingerprint never match each other", async () => {
    await db.collection("User").insertMany([
        { origin: MFR, isDeleted: false, name: { first: "Old", last: "One" }, mail: "old1@example.invalid", category: "b2c", memberStatus: "active" },
        { origin: MFR, isDeleted: false, name: { first: "Old", last: "Two" }, mail: "old2@example.invalid", category: "b2c", memberStatus: "active" },
        { origin: MFR, isDeleted: false, name: { first: "Tia", last: "Teen" }, mail: "tia@example.invalid", category: "b2c-minor", memberStatus: "active", signupFingerprint: (await raw("Ivy")).signupFingerprint },
    ]);
    const ip = await admin("GET", `${V1}/members/duplicates?by=ip`);
    assert.equal(ip.json.data.groups, 1);
    assert.equal(ip.json.data.items[0].members.length, 2, "the teen with the same IP is left out");
});

test.after(async () => {
    server.close();
    stubs.forEach((s) => s.close());
    await mongoose.disconnect();
});

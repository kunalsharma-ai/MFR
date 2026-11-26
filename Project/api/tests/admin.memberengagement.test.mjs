// Panel admin API: member engagement (survey records, points, streak, referrals, alerts, payout method), per brand.
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_admin_member_engagement node --test --test-force-exit tests/admin.memberengagement.test.mjs
import test from "node:test";
import crypto from "node:crypto";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import dns from "node:dns";

dns.resolveMx = (domain, cb) => cb(null, [{ exchange: `mx.${domain}`, priority: 10 }]);
const SECRET = "test-admin-secret-0123456789abcdef";
const MFR = "www.myfrequentrewards.com";
const T2O = "www.turn2opinion.com";
const MHO = "www.myhealthopinions.com";
const OUTBOX = fs.mkdtempSync(path.join(os.tmpdir(), "member-engagement-outbox-"));
process.env.MADP_ADMIN_API_SECRETS = SECRET;
process.env.MADP_ADMIN_API_ORIGINS = `${MFR},${T2O},${MHO}`;
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.ENGAGEMENT_MAIL_OUTBOX = OUTBOX;

const { default: mongoose } = await import("mongoose");
const { default: express } = await import("express");
const { default: cookieParser } = await import("cookie-parser");
const { default: appRoute } = await import("../app/routes/index.js");
const { setOrigin, Token } = await import("../app/utils/index.js");
const { sign } = await import("../app/admin/auth.js");
const { forget } = await import("../app/engagement/switches.js");
const Models = await import("../app/model/index.js");

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_admin_member_engagement");
await mongoose.connection.db.dropDatabase();
await Promise.all(Object.values(Models).map((m) => m.syncIndexes?.().catch(() => {})));
const app = express();
app.use([express.json({ type: (req) => !req.url.startsWith("/api/v1/admin/") && /json/i.test(req.headers["content-type"] || "") }), cookieParser(), setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const PORT = server.address().port;
const ALICE = "11111111-2222-4333-8444-555555555555";

// A request with a chosen Host header, which is how the member API knows the brand.
function raw(method, url, { host = MFR, body, headers = {} } = {}) {
    const data = body ? JSON.stringify(body) : "";
    return new Promise((resolve, reject) => {
        const req = http.request({ host: "127.0.0.1", port: PORT, method, path: url, headers: { host, "content-type": "application/json", "content-length": Buffer.byteLength(data), "x-real-ip": `10.2.0.${Math.floor(Math.random() * 250) + 1}`, ...headers } }, (res) => {
            let s = "";
            res.on("data", (c) => (s += c));
            res.on("end", () => { let json = {}; try { json = JSON.parse(s); } catch { /* redirect */ } resolve({ status: res.statusCode, json, headers: res.headers }); });
        });
        req.on("error", reject);
        req.end(data);
    });
}
async function admin(method, p, body, { origin = MFR, actor = ALICE } = {}) {
    const b = body ? JSON.stringify(body) : "";
    const ts = String(Math.floor(Date.now() / 1000));
    const nonce = crypto.randomBytes(16).toString("hex");
    const r = await raw(method, p, { body, headers: { "x-madp-timestamp": ts, "x-madp-origin": origin, "x-madp-actor": actor, "x-madp-nonce": nonce, "x-madp-signature": sign(SECRET, { nonce, timestamp: ts, method, path: p, origin, actor, body: b }) } });
    return r;
}
let n = 0;
async function member(origin, over = {}) {
    n += 1;
    const u = await Models.User.create({ name: { first: `M${n}`, last: "Test" }, gender: "Female", dob: new Date("1990-01-01"), mail: `m${n}@example.com`, timezone: "Asia/Kolkata", category: over.category || "b2c", origin });
    const set = { ...(over.role ? { role: over.role } : {}), ...(over.status ? { memberStatus: over.status } : {}) };
    if (over.password !== false) await Models.User.findById(u._id).then((x) => x.setPassword("Secret#123"));
    if (Object.keys(set).length) await Models.User.updateOne({ _id: u._id }, { $set: set });
    return String(u._id);
}

const day = (n) => new Date(Date.now() - n * 86400000);

test("engagement shows survey records, points, streak, referrals, alerts and payout without changing anything", async () => {
    const id = await member(MFR);
    await Models.Response.create({ user: id, survey: { slug: "coffee", name: "Coffee habits" }, status: "complete", points: 400, loi: 12, timeline: { start: day(3), end: day(3) }, telemetry: [{ key: "ip", value: "1.2.3.4" }], origin: MFR });
    await Models.Response.create({ user: id, survey: { slug: "cars", name: "Cars" }, status: "terminate", points: 0, timeline: { start: day(2), end: day(2) }, origin: MFR });
    await Models.Response.create({ user: id, survey: { slug: "tea", name: "Tea" }, status: "invited", origin: MFR });
    for (const n of [1, 0]) await Models.StreakDay.create({ user: id, day: day(n).toISOString().slice(0, 10), sources: ["survey"], origin: MFR });
    const friend = await member(MFR);
    await Models.User.updateOne({ _id: friend }, { $set: { referredBy: id } });
    await Models.Invites.create({ invitedBy: id, email: "waiting@example.com", origin: MFR });
    await Models.User.updateOne({ _id: id }, { $set: { paymentMethod: { method: "upi", details: { vpa: "x@upi" } } } });
    const ledgerBefore = await Models.Reward.countDocuments({ user: id });

    const r = await admin("GET", `/api/v1/admin/members/${id}/engagement`);
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const e = r.json.data;
    assert.deepEqual(e.surveys.byStatus, { complete: 1, terminate: 1, invited: 1 });
    assert.equal(e.surveys.completeRate, 0.5);
    assert.equal(e.surveys.points, 400);
    assert.ok(e.streak.current >= 1);
    assert.equal(e.referrals.joined, 1);
    assert.equal(e.referrals.invitedWaiting, 1);
    assert.equal(e.alerts.notifications.email, true);
    assert.equal(e.payout.current, "upi");
    assert.equal(JSON.stringify(e).includes("x@upi"), false, "payout details never leave the panel");
    assert.equal(await Models.Reward.countDocuments({ user: id }), ledgerBefore, "a read grants nothing");

    const list = await admin("GET", `/api/v1/admin/members/${id}/responses?status=complete`);
    assert.equal(list.status, 200);
    assert.equal(list.json.data.total, 1);
    assert.equal(list.json.data.items[0].survey, "Coffee habits");
    assert.equal(list.json.data.items[0].loi, 12);
    assert.equal(JSON.stringify(list.json.data).includes("1.2.3.4"), false, "no telemetry");
});

test("alerts change like the member's own settings, need a reason, and WhatsApp stays off while its switch is off", async () => {
    const id = await member(MFR);
    assert.equal((await admin("PUT", `/api/v1/admin/members/${id}/alerts`, { notifications: { email: false } })).json.code, "reason_required");
    const r = await admin("PUT", `/api/v1/admin/members/${id}/alerts`, { reason: "Member asked by phone", notifications: { email: false, whatsapp: true, quietHours: { enabled: true, start: "21:00", end: "07:30" } }, survey: { invitesPerWeek: 3 } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.data.notifications.email, false);
    assert.equal(r.json.data.notifications.whatsapp, false);
    assert.equal(r.json.data.notifications.quietHours.start, "21:00");
    assert.equal(r.json.data.survey.invitesPerWeek, 3);
    const saved = await Models.MemberPreference.findOne({ user: id, origin: MFR }).lean();
    assert.equal(saved.notifications.email, false);
});

test("clearing the payout method needs a reason and keeps nothing; teens and other brands are refused", async () => {
    const id = await member(MFR);
    await Models.User.updateOne({ _id: id }, { $set: { paymentMethod: { method: "paypal", details: { email: "p@example.com" } } } });
    assert.equal((await admin("POST", `/api/v1/admin/members/${id}/payout/clear`, {})).json.code, "reason_required");
    const r = await admin("POST", `/api/v1/admin/members/${id}/payout/clear`, { reason: "Suspected takeover, ticket 4411" });
    assert.deepEqual(r.json.data, { cleared: true, was: "paypal" });
    const u = await Models.User.findById(id).select("paymentMethod").lean();
    assert.equal(u.paymentMethod.method, "");
    assert.deepEqual(u.paymentMethod.details || {}, {});
    assert.deepEqual((await admin("POST", `/api/v1/admin/members/${id}/payout/clear`, { reason: "again, nothing left" })).json.data, { cleared: false, was: null });

    const teen = await member(MFR, { category: "minor b2c" });
    assert.equal((await admin("POST", `/api/v1/admin/members/${teen}/payout/clear`, { reason: "should be refused" })).json.code, "teen_member");
    assert.equal((await admin("PUT", `/api/v1/admin/members/${teen}/alerts`, { reason: "should be refused", notifications: { email: false } })).json.code, "teen_member");
    const t = await admin("GET", `/api/v1/admin/members/${teen}/engagement`);
    assert.equal(t.status, 200);
    assert.equal(t.json.data.referrals, null);
    assert.equal(t.json.data.payout, null);

    for (const p of [`/api/v1/admin/members/${id}/engagement`, `/api/v1/admin/members/${id}/responses`]) {
        assert.equal((await admin("GET", p, undefined, { origin: T2O })).status, 404, p);
    }
    assert.equal((await admin("GET", "/api/v1/admin/members/not-an-id/engagement")).status, 404);
});

test.after(async () => {
    server.close();
    await mongoose.disconnect();
    setTimeout(() => process.exit(), 500).unref();
});

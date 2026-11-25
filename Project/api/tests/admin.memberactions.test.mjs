// Panel admin API: member actions (password reset link, welcome again, log in as member), for two brands.
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_admin_memberactions node --test --test-force-exit tests/admin.memberactions.test.mjs
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
const OUTBOX = fs.mkdtempSync(path.join(os.tmpdir(), "member-actions-outbox-"));
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

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_admin_memberactions");
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
const mails = () => fs.readdirSync(OUTBOX);
async function switchOn(origin, on) {
    await Models.FeatureSwitch.deleteMany({ origin, key: "email_admin_actions" });
    if (on) await Models.FeatureSwitch.create({ origin, key: "email_admin_actions", on: true, reason: "test", actor: ALICE });
    forget(origin);
}
const ticketOf = (url) => new URL(url).searchParams.get("ticket");
const cookieOf = (r) => String(r.headers["set-cookie"]?.[0] || "").split(";")[0].replace(/^authorization=/, "");

test("reset and welcome send nothing while the switch is off, and say what would be sent", async () => {
    const id = await member(MFR);
    const before = mails().length;
    const r = await admin("POST", `/api/v1/admin/members/${id}/reset-password`, { reason: "Member phoned support" });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.deepEqual(r.json.data, { sent: false, switch: "email_admin_actions", wouldSend: { template: "register/forgot-password", to: r.json.data.wouldSend.to, brand: MFR, subject: "MyFrequentRewards: Forgot Password" } });
    assert.match(r.json.data.wouldSend.to, /\*/, "the address is masked");
    const w = await admin("POST", `/api/v1/admin/members/${id}/resend-welcome`, { reason: "Member phoned support" });
    assert.equal(w.json.data.sent, false);
    assert.equal(w.json.data.wouldSend.template, "register/welcome");
    assert.equal(mails().length, before, "no e-mail");
    assert.equal(await Models.OTP.countDocuments({ user: id }), 0, "no reset code is made while off");
    const t = await member(T2O);
    const tw = await admin("POST", `/api/v1/admin/members/${t}/resend-welcome`, { reason: "Member phoned support" }, { origin: T2O });
    assert.equal(tw.json.data.wouldSend.subject, "Your Turn2Opinion account is active");
});

test("with the switch on, reset e-mails the member's own link (never a password), three an hour at most", async () => {
    await switchOn(MFR, true);
    const id = await member(MFR);
    const before = mails().length;
    for (let i = 0; i < 3; i++) {
        const r = await admin("POST", `/api/v1/admin/members/${id}/reset-password`, { reason: "Member asked by e-mail" });
        assert.equal(r.status, 200, JSON.stringify(r.json));
        assert.equal(r.json.data.sent, true);
        assert.equal(JSON.stringify(r.json).includes("password\":"), false);
    }
    assert.equal(mails().length, before + 3);
    const mail = JSON.parse(fs.readFileSync(path.join(OUTBOX, mails().sort().at(-1)), "utf-8"));
    assert.equal(mail.category, "register");
    assert.equal(mail.data.template, "forgot-password");
    assert.ok(mail.data.otp?.code, "the e-mail carries the code for the normal set-password link");
    assert.equal((await admin("POST", `/api/v1/admin/members/${id}/reset-password`, { reason: "Member asked by e-mail" })).status, 429);
    const w = await admin("POST", `/api/v1/admin/members/${id}/resend-welcome`, { reason: "Lost the first one" });
    assert.equal(w.json.data.sent, true);
    const noPw = await member(MFR, { password: false });
    assert.equal((await admin("POST", `/api/v1/admin/members/${noPw}/resend-welcome`, { reason: "Lost the first one" })).json.code, "no_password");
    // the brand's kill switch stops it too
    await Models.FeatureSwitch.create({ origin: MFR, key: "kill", on: true, reason: "test", actor: ALICE });
    forget(MFR);
    const other = await member(MFR);
    assert.equal((await admin("POST", `/api/v1/admin/members/${other}/reset-password`, { reason: "Member asked by e-mail" })).json.data.sent, false);
    await Models.FeatureSwitch.deleteMany({ origin: MFR, key: "kill" });
    await switchOn(MFR, false);
});

test("needs a reason, refuses teens and closed accounts, and another brand's member is not found", async () => {
    const id = await member(MFR);
    assert.equal((await admin("POST", `/api/v1/admin/members/${id}/reset-password`, {})).json.code, "reason_required");
    assert.equal((await admin("POST", `/api/v1/admin/members/${id}/login-as`, { reason: "x" })).json.code, "reason_required");
    const teen = await member(MFR, { category: "b2c-minor" });
    for (const a of ["reset-password", "resend-welcome", "login-as"]) {
        const r = await admin("POST", `/api/v1/admin/members/${teen}/${a}`, { reason: "Checking the account" });
        assert.equal(r.status, 409);
        assert.equal(r.json.code, "teen_member");
    }
    const banned = await member(MFR, { status: "banned" });
    assert.equal((await admin("POST", `/api/v1/admin/members/${banned}/login-as`, { reason: "Checking the account" })).json.code, "not_active");
    const boss = await member(MFR, { role: "administrator" });
    assert.equal((await admin("POST", `/api/v1/admin/members/${boss}/login-as`, { reason: "Checking the account" })).json.code, "admin_member");
    for (const a of ["reset-password", "resend-welcome", "login-as"])
        assert.equal((await admin("POST", `/api/v1/admin/members/${id}/${a}`, { reason: "Checking the account" }, { origin: T2O })).status, 404);
    assert.equal((await admin("GET", `/api/v1/admin/members/${id}/admin-sessions`, null, { origin: T2O })).status, 404);
});

test("log in as member: a one-use ticket gives a 15-minute admin session that can't touch the password, e-mail, payouts or rewards", async () => {
    const id = await member(MFR);
    const r = await admin("POST", `/api/v1/admin/members/${id}/login-as`, { reason: "Member says the dashboard is empty" });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const { url, sessionId, expiresAt, redeemBy } = r.json.data;
    assert.ok(url.startsWith(`https://${MFR}/api/v1/user/admin-session?ticket=`));
    assert.ok(new Date(expiresAt) - Date.now() <= 15 * 60 * 1000 + 1000);
    assert.ok(new Date(redeemBy) < new Date(expiresAt));
    const row = await Models.AdminSession.findById(sessionId).lean();
    assert.notEqual(row.hash, ticketOf(url), "only a hash of the ticket is kept");
    assert.equal(row.actor, ALICE);

    // the ticket is for MFR's site only, and works once
    assert.equal((await raw("GET", `/api/v1/user/admin-session?ticket=${ticketOf(url)}`, { host: T2O })).status, 410);
    const ok = await raw("GET", `/api/v1/user/admin-session?ticket=${ticketOf(url)}`);
    assert.equal(ok.status, 302);
    assert.equal(ok.headers.location, "/member/dashboard");
    assert.equal(ok.headers["referrer-policy"], "no-referrer");
    assert.match(ok.headers["set-cookie"][0], /HttpOnly/i);
    assert.equal((await raw("GET", `/api/v1/user/admin-session?ticket=${ticketOf(url)}`)).status, 410, "one use");
    const token = decodeURIComponent(cookieOf(ok)).replace(/^Bearer /, "");
    const claims = Token.verify(token);
    assert.deepEqual(claims.adm, { sid: sessionId, by: ALICE });
    assert.ok(claims.exp - claims.iat <= 15 * 60, "the token lasts at most 15 minutes");
    const auth = { authorization: `Bearer ${token}` };

    // reading the member's own account works
    assert.equal((await raw("GET", "/api/v1/me", { headers: auth })).status, 200);
    // what an admin session may not do
    const refused = [
        ["PATCH", "/api/v1/me", { oldPassword: "Secret#123", newPassword: "Other#123", cnfPassword: "Other#123" }],
        ["PATCH", "/api/v1/ME/", { oldPassword: "Secret#123", newPassword: "Other#123", cnfPassword: "Other#123" }],
        ["PATCH", "/api/v1/me/change-email", { email: "new@example.com" }],
        ["PATCH", "/api/v1/me/payment-method", { paymentMethod: { upi: "x@y" } }],
        ["PUT", "/api/v1/me", { paymentMethod: { upi: "x@y" } }],
        ["PUT", `/api/v1/user/${id}`, { paymentMethod: { upi: "x@y" } }],
        ["POST", "/api/v1/engagement/rewards/redeem", { item: "amazon-100" }],
        ["POST", "/api/v1/engagement/draws/0123456789abcdef01234567/enter", { tickets: 1 }],
        ["POST", "/api/v1/engagement/prize-machine/play", {}],
        ["POST", "/api/v1/engagement/privacy/delete", { reason: "x" }],
        ["POST", "/api/v1/me/invite", { emails: ["friend@example.com"] }],
    ];
    for (const [method, p, body] of refused) {
        const x = await raw(method, p, { body, headers: auth });
        assert.equal(x.status, 403, `${method} ${p}: ${JSON.stringify(x.json)}`);
        assert.equal(x.json.code, "admin_session", `${method} ${p}`);
    }
    const u = await Models.User.findById(id);
    assert.equal(await u.verifyPassword("Secret#123"), true, "password unchanged");
    assert.equal(u.toObject().paymentMethod?.upi, undefined, "no payout details set");

    // MADP can see and end it; the token stops working at once
    const list = await admin("GET", `/api/v1/admin/members/${id}/admin-sessions`);
    assert.equal(list.json.data.items[0].state, "open");
    assert.equal(JSON.stringify(list.json).includes(ticketOf(url)), false);
    assert.equal((await admin("POST", `/api/v1/admin/members/${id}/admin-sessions/${sessionId}/end`)).status, 200);
    const after = await raw("GET", "/api/v1/me", { headers: auth });
    assert.equal(after.status, 401);
    assert.equal(after.json.code, "admin_session_ended");
});

test("an admin session never counts as a panel admin, and a late ticket is refused", async () => {
    // a member who is not an admin now, but the session is checked fresh on every request anyway
    const id = await member(MFR);
    const r = await admin("POST", `/api/v1/admin/members/${id}/login-as`, { reason: "Checking the reward page" });
    const ok = await raw("GET", `/api/v1/user/admin-session?ticket=${ticketOf(r.json.data.url)}`);
    const token = decodeURIComponent(cookieOf(ok)).replace(/^Bearer /, "");
    // the member is made an admin later: the admin session still can't use admin routes
    await Models.User.updateOne({ _id: id }, { $set: { role: "administrator" } });
    const other = await member(MFR);
    assert.equal((await raw("GET", "/api/v1/user", { headers: { authorization: `Bearer ${token}` } })).status, 403);
    assert.equal((await raw("GET", `/api/v1/user/${other}`, { headers: { authorization: `Bearer ${token}` } })).status, 403);

    const late = await member(MFR);
    const t = await admin("POST", `/api/v1/admin/members/${late}/login-as`, { reason: "Checking the reward page" });
    await Models.AdminSession.updateOne({ _id: t.json.data.sessionId }, { $set: { redeemBy: new Date(Date.now() - 1000) } });
    assert.equal((await raw("GET", `/api/v1/user/admin-session?ticket=${ticketOf(t.json.data.url)}`)).status, 410);
    // a forged token naming a session that was never opened
    const forged = Token.generate({ _id: late, origin: MFR, adm: { sid: t.json.data.sessionId, by: ALICE } }, 600);
    assert.equal((await raw("GET", "/api/v1/me", { headers: { authorization: `Bearer ${forged}` } })).status, 401);
    // the member's own session is not limited
    const own = Token.generate({ _id: late, origin: MFR });
    assert.equal((await raw("PATCH", "/api/v1/me/payment-method", { body: { paymentMethod: { upi: "me@bank" } }, headers: { authorization: `Bearer ${own}` } })).json.code, undefined);
});

test("the member site is told about an admin session so it can show the banner, and the banner can end it", async () => {
    const id = await member(MFR);
    const own = Token.generate({ _id: id, origin: MFR });
    const mine = await raw("GET", "/api/v1/me", { headers: { authorization: `Bearer ${own}` } });
    assert.equal(mine.status, 200);
    assert.equal(mine.json.data.adminSession, null, "the member's own session shows no banner");
    assert.equal((await raw("POST", "/api/v1/me/admin-session/end", { body: {}, headers: { authorization: `Bearer ${own}` } })).status, 400);

    const r = await admin("POST", `/api/v1/admin/members/${id}/login-as`, { reason: "Member says the dashboard is empty" });
    const ok = await raw("GET", `/api/v1/user/admin-session?ticket=${ticketOf(r.json.data.url)}`);
    const auth = { authorization: decodeURIComponent(cookieOf(ok)) };
    const me = await raw("GET", "/api/v1/me", { headers: auth });
    assert.equal(me.status, 200);
    assert.equal(new Date(me.json.data.adminSession.expiresAt).toISOString(), new Date(r.json.data.expiresAt).toISOString());
    assert.equal(me.json.data.adminSession.actor, undefined, "the admin's id is not shown to the member");
    const end = await raw("POST", "/api/v1/me/admin-session/end", { body: {}, headers: auth });
    assert.equal(end.status, 200);
    assert.match(String(end.headers["set-cookie"]?.[0]), /authorization=;/);
    assert.ok((await Models.AdminSession.findById(r.json.data.sessionId).lean()).endedAt);
    assert.equal((await raw("GET", "/api/v1/me", { headers: auth })).json.code, "admin_session_ended");
});

test("the old Login As User route is gone: an admin gets 410 and no token, others still 401 or 403", async () => {
    const id = await member(MFR);
    const adminId = await member(MFR, { role: "administrator" });
    const asAdmin = { authorization: `Bearer ${Token.generate({ _id: adminId, origin: MFR })}` };
    const r = await raw("POST", "/api/v1/user/autologin", { body: { _id: id }, headers: asAdmin });
    assert.equal(r.status, 410);
    assert.equal(r.json.code, "moved_to_madp");
    assert.equal(r.json.token, undefined);
    assert.equal((await raw("POST", "/api/v1/user/autologin", { body: { _id: id } })).status, 401);
    const asMember = { authorization: `Bearer ${Token.generate({ _id: id, origin: MFR })}` };
    assert.equal((await raw("POST", "/api/v1/user/autologin", { body: { _id: adminId }, headers: asMember })).status, 403);
});

test("on MyHealthOpinions an admin session reads no answers; on every brand it can't answer or take surveys for the member", async () => {
    const open = async (origin) => {
        const id = await member(origin);
        const r = await admin("POST", `/api/v1/admin/members/${id}/login-as`, { reason: "Member can't see their surveys" }, { origin });
        assert.equal(r.status, 200, JSON.stringify(r.json));
        const ok = await raw("GET", `/api/v1/user/admin-session?ticket=${ticketOf(r.json.data.url)}`, { host: origin });
        assert.equal(ok.status, 302);
        return { id, auth: { authorization: `Bearer ${decodeURIComponent(cookieOf(ok)).replace(/^Bearer /, "")}` } };
    };
    const h = await open(MHO);
    for (const [method, p, body] of [["POST", "/api/v1/me", { questions: ["q_condition"] }], ["GET", "/api/v1/profile/health-basics"], ["POST", `/api/v1/user/${h.id}/profile-data`, { questions: ["q_condition"] }]]) {
        const x = await raw(method, p, { host: MHO, body, headers: h.auth });
        assert.equal(x.status, 403, `${method} ${p}`);
        assert.equal(x.json.code, "admin_session");
    }
    assert.equal((await raw("GET", "/api/v1/me", { host: MHO, headers: h.auth })).status, 200, "the account itself still opens");
    for (const origin of [MFR, T2O, MHO]) {
        const s = await open(origin);
        for (const [method, p, body] of [["PATCH", "/api/v1/me/profile", { q_city: "Delhi" }], ["PATCH", "/api/v1/me/answer", { q_city: "Delhi" }], ["PUT", "/api/v1/rewards", { remarks: "[profile:basic]" }], ["GET", "/api/v1/engagement/privacy/export"]]) {
            const x = await raw(method, p, { host: origin, body, headers: s.auth });
            assert.equal(x.status, 403, `${origin} ${method} ${p}`);
        }
    }
    // on MFR the member's answers stay readable in an admin session
    const m = await open(MFR);
    assert.notEqual((await raw("POST", "/api/v1/me", { body: { questions: ["q_city"] }, headers: m.auth })).json.code, "admin_session");
});

test.after(async () => {
    server.close();
    await mongoose.disconnect();
    setTimeout(() => process.exit(), 500).unref();
});

// End-to-end API test: the whole Teen journey and the member-API access rules, against a real MongoDB.
//
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_test node --test tests/teen.api.test.mjs
//
// Needs: a MongoDB, the API's node_modules, the dataBank readable at /src/app/dataBank (or app/dataBank), and the
// hostnames email-template + email resolving to 127.0.0.1 (stub mail services are started on :8080 and :3000).
// The User model checks MX records, so dns.resolveMx is replaced before the models load.
import test from "node:test";
import assert from "node:assert/strict";
import dns from "node:dns";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

dns.resolveMx = (domain, cb) => cb(null, [{ exchange: `mx.${domain}`, priority: 10 }]);
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const OUTBOX = fs.mkdtempSync(path.join(os.tmpdir(), "teen-outbox-"));
process.env.TEEN_MAIL_OUTBOX = OUTBOX;
process.env.PUBLIC_SITE_URL = "https://www.myfrequentrewards.com";
process.env.TEEN_JOB_KEY = "job-key";

const { default: mongoose } = await import("mongoose");
const { default: express } = await import("express");
const { default: cookieParser } = await import("cookie-parser");
const { default: appRoute } = await import("../app/routes/index.js");
const { setOrigin } = await import("../app/utils/index.js");
const Models = await import("../app/model/index.js");

// stub email-template (:8080) and email (:3000) services for the adult registration path
const sent = [];
const stub = (port, fn) => new Promise((r) => {
    const s = http.createServer((req, res) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { fn(b); res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ data: "<html/>" })); }); });
    s.listen(port, "127.0.0.1", () => r(s));
});
const stubs = await Promise.all([stub(8080, () => {}), stub(3000, (b) => sent.push(JSON.parse(b || "{}")))]);

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_teen_test");
await mongoose.connection.db.dropDatabase();
await Promise.all(Object.values(Models).map((m) => m.syncIndexes?.().catch(() => {})));

const app = express();
app.set("trust proxy", false);
app.use([express.json(), cookieParser(), setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;
const ORIGIN = `127.0.0.1:${server.address().port}`; // req.origin = Host header

let ipN = 1;
async function call(method, url, body, { token, cookie, ip } = {}) {
    const headers = { "content-type": "application/json", "x-real-ip": ip || `10.0.0.${ipN++ % 250}` };
    if (token) headers.authorization = `Bearer ${token}`;
    if (cookie) headers.cookie = cookie;
    const res = await fetch(`${BASE}${url}`, { method, headers, body: body ? JSON.stringify(body) : undefined, redirect: "manual" });
    let json = {};
    try { json = await res.json(); } catch { /* redirect */ }
    return { status: res.status, json, headers: res.headers };
}
const outbox = () => fs.readdirSync(OUTBOX).sort().map((f) => JSON.parse(fs.readFileSync(path.join(OUTBOX, f), "utf-8")));
const lastMail = (template) => outbox().filter((m) => m.data.template === template).pop();
const tokenFrom = (url) => new URL(url).searchParams.get("t");

const iso = (yearsAgo, extraDays = 0) => {
    const d = new Date(); d.setUTCFullYear(d.getUTCFullYear() - yearsAgo); d.setUTCDate(d.getUTCDate() - extraDays);
    return d.toISOString().slice(0, 10);
};
const { TEEN_CONSENT, GUARDIAN_CONSENT } = await import("../app/teen/content.js");
const allTicked = Object.fromEntries(TEEN_CONSENT.items.map((s) => [s.id, true]));
const teenBody = (over = {}) => ({
    idempotencyKey: `key-${Math.random().toString(36).slice(2)}-${Date.now()}`,
    timezone: "Asia/Kolkata",
    language: "en",
    teen: {
        firstName: "Aarav", middleName: "", lastName: "Sharma", dob: iso(15, 3), email: "aarav.teen@example.com",
        phone: { country: "IN", number: "9876543210" }, gender: "Male",
        location: { country: "IN", stateCode: "DL", city: "New Delhi", zip: "110085" },
        ...(over.teen || {}),
    },
    guardian: { relation: "mother", firstName: "Priya", lastName: "Sharma", dob: "1984-06-12", email: "priya.parent@example.com", ...(over.guardian || {}) },
    consent: { version: TEEN_CONSENT.version, accepted: { ...allTicked, ...(over.accepted || {}) } },
    ...(over.root || {}),
});
const onboarding = {
    "parent-first-name": "Priya", "parent-middle-name": "", "parent-last-name": "Sharma", "parent-gender": "Female", "parent-dob": "1984-06-12",
    P01: "IN", P02: "DL", P03: "mother", "parent-marital": "Married", P04: "yes", P11: "1", P06: "en", P07: ["email"],
    P08: "priya.parent@example.com", P12: "yes",
};

test.after(async () => {
    await mongoose.disconnect();
    server.close();
    stubs.forEach((s) => s.close());
    setTimeout(() => process.exit(process.exitCode || 0), 200).unref();
});

// ---------------------------------------------------------------------------------------------------------------------
test("age routing is enforced by the server", async () => {
    assert.equal((await call("POST", "/api/v1/teen/age-check", { dob: iso(12, -1) })).json.data.route, "blocked"); // 12, 13th birthday tomorrow
    assert.equal((await call("POST", "/api/v1/teen/age-check", { dob: iso(13) })).json.data.route, "teen");
    assert.equal((await call("POST", "/api/v1/teen/age-check", { dob: iso(18) })).json.data.route, "adult");
    assert.equal((await call("POST", "/api/v1/teen/age-check", { dob: "2099-01-01" })).json.data.route, "invalid");

    const under = await call("POST", "/api/v1/teen/register", teenBody({ teen: { dob: iso(12, -2), email: "kid@example.com" } }));
    assert.equal(under.status, 403);
    assert.equal(under.json.code, "under_13");
    assert.equal(await Models.User.countDocuments({ mail: "kid@example.com" }), 0, "nothing stored for under-13s");

    const adultViaTeen = await call("POST", "/api/v1/teen/register", teenBody({ teen: { dob: iso(19), email: "adult@example.com" } }));
    assert.equal(adultViaTeen.json.code, "adult");

    // the Consumer/Professional registration refuses minors (no bypass through the normal route)
    const adultBody = { category: "b2c", name: { first: "Rohan", last: "Mehta" }, gender: "Male", mail: "rohan@example.com", phone: "919876543211", timezone: "UTC", address: [{ tag: "home", country: "in" }] };
    const teenViaAdult = await call("PUT", "/api/v1/user", { ...adultBody, dob: iso(15) });
    assert.equal(teenViaAdult.json.status, "error");
    assert.match(teenViaAdult.json.message, /Teen registration/);
    const kidViaAdult = await call("PUT", "/api/v1/user", { ...adultBody, dob: iso(10) });
    assert.match(kidViaAdult.json.message, /under 13/);
    assert.equal(await Models.User.countDocuments({ mail: "rohan@example.com" }), 0);
});

test("adult registration still works, and no longer returns the emailed code or accepts a role", async () => {
    const r = await call("PUT", "/api/v1/user", { category: "b2c", name: { first: "Rohan", last: "Mehta" }, gender: "Male", dob: iso(30), mail: "rohan@example.com", phone: "919876543211", timezone: "UTC", address: [{ tag: "home", country: "in" }], role: "root", registrationStatus: "x" });
    assert.equal(r.json.status, "success", JSON.stringify(r.json));
    assert.ok(r.json.data.user);
    assert.equal(r.json.data.code, undefined);
    const u = await Models.User.findOne({ mail: "rohan@example.com" }).select("+role").lean();
    assert.equal(u.role, "respondent");
    assert.equal(u.registrationStatus, "active");
});

let regRef, statusToken, guardianToken;
test("validation: friendly field codes, nothing stored", async () => {
    const bad = await call("POST", "/api/v1/teen/register", teenBody({ teen: { firstName: "", email: "nope" }, guardian: { email: "aarav.teen@example.com" }, accepted: { terms: false } }));
    assert.equal(bad.status, 422);
    assert.equal(bad.json.fields.firstName, "first_name");
    assert.equal(bad.json.fields.email, "email");
    assert.equal(bad.json.fields["consent.terms"], "consent_required");
    const lg = await call("POST", "/api/v1/teen/register", teenBody({ guardian: { relation: "legal_guardian" } }));
    assert.equal(lg.json.fields["guardian.gender"], "gender");
    assert.equal(await Models.TeenRegistration.countDocuments(), 0);
});

test("teen registers once, even when the button is pressed twice", async () => {
    const body = teenBody();
    const [a, b] = await Promise.all([call("POST", "/api/v1/teen/register", body), call("POST", "/api/v1/teen/register", body)]);
    assert.equal(a.json.status, "success", JSON.stringify(a.json));
    assert.equal(b.json.status, "success", JSON.stringify(b.json));
    assert.equal(a.json.data.reference, b.json.data.reference);
    assert.equal(await Models.TeenRegistration.countDocuments(), 1);
    assert.equal(a.json.data.status, "pending_guardian_approval");
    assert.match(a.json.data.guardianEmail, /^pr•+@example\.com$/);
    regRef = a.json.data.reference;
    statusToken = a.json.data.statusToken || b.json.data.statusToken;

    const invite = lastMail("guardian-invite");
    assert.equal(invite.to, "priya.parent@example.com");
    assert.ok(invite.data.links.yes.includes("&d=yes"));
    guardianToken = tokenFrom(invite.data.links.review);
    assert.equal(guardianToken.length, 43);
    assert.equal(lastMail("teen-registered").to, "aarav.teen@example.com");
    assert.ok(!JSON.stringify(lastMail("teen-registered")).includes("priya.parent@example.com"), "teen email masks the parent address");

    // the guardian lives in its own collection; the teen record holds no guardian contact details
    const teenUser = await Models.User.findOne({ mail: "aarav.teen@example.com" }).lean();
    assert.equal(teenUser.parent.email, undefined);
    assert.equal(teenUser.category, "b2c-minor");
    const tc = await Models.TeenConsent.findOne({ party: "teen" }).lean();
    assert.equal(tc.version, TEEN_CONSENT.version);
    assert.equal(tc.statements.length, TEEN_CONSENT.items.length);
    assert.ok(tc.statements.every((s) => s.accepted && s.text));
    // only a hash of the link is stored
    assert.equal(await Models.TeenToken.countDocuments({ hash: guardianToken }), 0);
});

test("duplicate email is refused", async () => {
    const r = await call("POST", "/api/v1/teen/register", teenBody());
    assert.equal(r.json.code, "pending_exists");
});

test("pending teen cannot log in or skip ahead", async () => {
    const login = await call("POST", "/api/v1/user/login", { mail: "aarav.teen@example.com", password: "whatever1" });
    assert.equal(login.json.status, "error");
    assert.match(login.json.message, /hasn't finished/);
    // consent before YES / onboarding is refused
    const early = await call("POST", `/api/v1/teen/guardian/${guardianToken}/consent`, { version: GUARDIAN_CONSENT.version, selections: { participation: true, privacy: true, contact: true } });
    assert.equal(early.json.code, "bad_state");
    const fake = await call("GET", `/api/v1/teen/guardian/${"A".repeat(43)}`);
    assert.equal(fake.status, 404);
    assert.equal(fake.json.code, "link_invalid");
});

test("status page and resend", async () => {
    const s = await call("GET", `/api/v1/teen/status/${statusToken}`);
    assert.equal(s.json.data.status, "pending_guardian_approval");
    assert.equal(s.json.data.reference, regRef);
    assert.ok(!JSON.stringify(s.json).includes("priya.parent@example.com"));
    const tooSoon = await call("POST", "/api/v1/teen/resend", { statusToken });
    assert.equal(tooSoon.json.code, "too_soon");
    const unknown = await call("POST", "/api/v1/teen/resend", { mail: "nobody@example.com" });
    assert.equal(unknown.json.status, "success", "same answer for unknown addresses");
});

test("guardian: view, YES, onboarding, consent", async () => {
    const v = await call("GET", `/api/v1/teen/guardian/${guardianToken}`);
    assert.equal(v.json.status, "success", JSON.stringify(v.json));
    assert.equal(v.json.data.teen.firstName, "Aarav");
    assert.equal(v.json.data.guardian.relation, "mother");
    assert.equal(v.json.data.headers, undefined);

    const noConfirm = await call("POST", `/api/v1/teen/guardian/${guardianToken}/decision`, { decision: "yes" });
    assert.equal(noConfirm.json.code, "confirm_required");
    const yes = await call("POST", `/api/v1/teen/guardian/${guardianToken}/decision`, { decision: "yes", confirm: true });
    assert.equal(yes.json.data.status, "guardian_approved");
    assert.ok(lastMail("guardian-approved"));

    const draft = await call("PUT", `/api/v1/teen/guardian/${guardianToken}/onboarding`, { answers: { P01: "IN", evil: "x" } });
    assert.equal(draft.json.data.status, "pending_onboarding");
    const missing = await call("PUT", `/api/v1/teen/guardian/${guardianToken}/onboarding`, { answers: { P01: "IN" }, submit: true });
    assert.equal(missing.status, 422);
    assert.equal(missing.json.fields.P04, "required");
    const smsNoPhone = await call("PUT", `/api/v1/teen/guardian/${guardianToken}/onboarding`, { answers: { ...onboarding, P07: ["email", "sms"] }, submit: true });
    assert.equal(smsNoPhone.json.fields.P09, "required", "mobile becomes required when SMS is chosen");
    const ok = await call("PUT", `/api/v1/teen/guardian/${guardianToken}/onboarding`, { answers: onboarding, submit: true });
    assert.equal(ok.json.data.status, "pending_consent", JSON.stringify(ok.json));
    const g = await Models.TeenGuardian.findOne({ email: "priya.parent@example.com" }).select("+onboarding.answers").lean();
    assert.equal(g.onboarding.answers.evil, undefined, "unknown keys are dropped");

    const missingReq = await call("POST", `/api/v1/teen/guardian/${guardianToken}/consent`, { version: GUARDIAN_CONSENT.version, selections: { participation: true, privacy: true } });
    assert.equal(missingReq.json.fields.contact, "consent_required");
    const wrongVer = await call("POST", `/api/v1/teen/guardian/${guardianToken}/consent`, { version: "OLD", selections: { participation: true, privacy: true, contact: true } });
    assert.equal(wrongVer.json.fields.version, "consent_version");
    const body = { version: GUARDIAN_CONSENT.version, selections: { participation: true, privacy: true, contact: true, studyContact: false, recording: false, sensitive: true }, sectionsRead: [1, 4, 9] };
    const [c1, c2] = await Promise.all([
        call("POST", `/api/v1/teen/guardian/${guardianToken}/consent`, body),
        call("POST", `/api/v1/teen/guardian/${guardianToken}/consent`, body),
    ]);
    const okOnes = [c1, c2].filter((r) => r.json.status === "success");
    assert.equal(okOnes.length, 1, "a double submit records consent once");
    assert.equal(okOnes[0].json.data.status, "pending_password");
    assert.equal(await Models.TeenConsent.countDocuments({ party: "guardian" }), 1);
    const gc = await Models.TeenConsent.findOne({ party: "guardian" }).lean();
    assert.equal(gc.version, GUARDIAN_CONSENT.version);
    assert.equal(gc.statements.find((s) => s.id === "sensitive").accepted, true);
    assert.equal(gc.statements.find((s) => s.id === "recording").accepted, false);
    assert.ok(lastMail("guardian-complete"));

    // the link is spent
    const after = await call("GET", `/api/v1/teen/guardian/${guardianToken}`);
    assert.equal(after.status, 410);
});

test("teen creates a password, logs in, sees only their own profile", async () => {
    const mail = lastMail("teen-password");
    assert.equal(mail.to, "aarav.teen@example.com");
    const pwToken = tokenFrom(mail.data.links.password);
    const view = await call("GET", `/api/v1/teen/password/${pwToken}`);
    assert.equal(view.json.data.firstName, "Aarav");
    const weak = await call("POST", `/api/v1/teen/password/${pwToken}`, { password: "aaaaaaaa", confirm: "aaaaaaaa" });
    assert.equal(weak.json.fields.password, "pw_mix");
    const set = await call("POST", `/api/v1/teen/password/${pwToken}`, { password: "Blue-Kite-42", confirm: "Blue-Kite-42" });
    assert.equal(set.json.data.status, "active", JSON.stringify(set.json));
    const again = await call("POST", `/api/v1/teen/password/${pwToken}`, { password: "Blue-Kite-43", confirm: "Blue-Kite-43" });
    assert.equal(again.status, 410);
    assert.ok(lastMail("teen-active"));

    const login = await call("POST", "/api/v1/user/login", { mail: "aarav.teen@example.com", password: "Blue-Kite-42" });
    assert.equal(login.status, 302);
    const cookie = login.headers.get("set-cookie").split(";")[0];

    const me = await call("GET", "/api/v1/teen/me", null, { cookie });
    assert.equal(me.json.data.teen.firstName, "Aarav");
    assert.equal(me.json.data.answers.D02, "IN", "registration answers are already in the profile");
    assert.equal(me.json.data.answers.D06, "Male");
    assert.equal(me.json.data.guardian.emailMasked.includes("@example.com"), true);
    assert.equal(JSON.stringify(me.json).includes("priya.parent@example.com"), false);
    assert.equal(me.json.data.welcomeDone, false);

    const locked = await call("PUT", "/api/v1/teen/me/answers", { answers: { D02: "US" } }, { cookie });
    assert.equal(locked.json.fields.D02, "locked");
    const badOpt = await call("PUT", "/api/v1/teen/me/answers", { answers: { D04: "moon" } }, { cookie });
    assert.equal(badOpt.json.fields.D04, "unknown_option");
    const save = await call("PUT", "/api/v1/teen/me/answers", { answers: { D04: "city", D05: "en", D08: "upper", D09: "ft", H01: "both", T01: ["phone", "laptop"] }, welcomeDone: true }, { cookie });
    assert.equal(save.json.data.saved, 6);
    const me2 = await call("GET", "/api/v1/teen/me", null, { cookie });
    assert.deepEqual(me2.json.data.answers.T01, ["phone", "laptop"]);
    assert.equal(me2.json.data.welcomeDone, true);
});

test("guardian says NO: confirmed decline, reasons optional, nothing activated", async () => {
    const r = await call("POST", "/api/v1/teen/register", teenBody({ teen: { email: "zoya.teen@example.com", firstName: "Zoya", gender: "Female" }, guardian: { relation: "legal_guardian", gender: "Prefer not to say", email: "guardian.z@example.com", firstName: "Imran" } }));
    assert.equal(r.json.status, "success", JSON.stringify(r.json));
    const tok = tokenFrom(lastMail("guardian-invite").data.links.no);
    const no = await call("POST", `/api/v1/teen/guardian/${tok}/decision`, { decision: "no", confirm: true, reasons: ["privacy", "other"], comment: "Not right now, thanks." });
    assert.equal(no.json.data.status, "rejected");
    assert.ok(lastMail("guardian-declined"));
    assert.equal(lastMail("teen-declined").to, "zoya.teen@example.com");
    const reg = await Models.TeenRegistration.findOne({ reference: r.json.data.reference }).select("+decision.comment").lean();
    assert.deepEqual(reg.decision.reasons, ["privacy", "other"]);
    assert.equal(reg.decision.comment, "Not right now, thanks.");
    assert.equal(await Models.TeenToken.countDocuments({ registration: reg._id, usedAt: null, revokedAt: null, purpose: { $ne: "status" } }), 0);
    const login = await call("POST", "/api/v1/user/login", { mail: "zoya.teen@example.com", password: "x" });
    assert.equal(login.json.status, "error");
    const yesAfter = await call("POST", `/api/v1/teen/guardian/${tok}/decision`, { decision: "yes", confirm: true });
    assert.equal(yesAfter.status, 410);
    // a decline without any reason is also fine
    const r2 = await call("POST", "/api/v1/teen/register", teenBody({ teen: { email: "kabir.teen@example.com", firstName: "Kabir" }, guardian: { email: "dad.k@example.com", relation: "father", firstName: "Vikram" } }));
    const tok2 = tokenFrom(lastMail("guardian-invite").data.links.no);
    assert.equal((await call("POST", `/api/v1/teen/guardian/${tok2}/decision`, { decision: "no", confirm: true })).json.data.status, "rejected", JSON.stringify(r2.json));
});

test("authority gate: 'not sure' goes to manual review, 'no' cancels", async () => {
    await call("POST", "/api/v1/teen/register", teenBody({ teen: { email: "meera.teen@example.com", firstName: "Meera", gender: "Female" }, guardian: { email: "aunt.m@example.com", relation: "legal_guardian", gender: "Female", firstName: "Asha" } }));
    const tok = tokenFrom(lastMail("guardian-invite").data.links.yes);
    await call("POST", `/api/v1/teen/guardian/${tok}/decision`, { decision: "yes", confirm: true });
    const r = await call("PUT", `/api/v1/teen/guardian/${tok}/onboarding`, { answers: { ...onboarding, P03: "guardian", P04: "unsure", P08: "aunt.m@example.com" }, submit: true });
    assert.equal(r.json.data.status, "manual_review");
    assert.equal(r.json.data.stop, "manual_review");
});

test("expiry and renewal", async () => {
    await call("POST", "/api/v1/teen/register", teenBody({ teen: { email: "ishaan.teen@example.com", firstName: "Ishaan" }, guardian: { email: "mum.i@example.com", firstName: "Neha" } }));
    const reg = await Models.TeenRegistration.findOne({ teen: (await Models.User.findOne({ mail: "ishaan.teen@example.com" }))._id });
    const tok = tokenFrom(lastMail("guardian-invite").data.links.review);
    await Models.TeenRegistration.updateOne({ _id: reg._id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    await Models.TeenToken.updateMany({ registration: reg._id, purpose: "guardian" }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    const sweepDenied = await call("POST", "/api/v1/teen/jobs/sweep", {});
    assert.equal(sweepDenied.status, 403);
    const sw = await fetch(`${BASE}/api/v1/teen/jobs/sweep`, { method: "POST", headers: { "x-job-key": "job-key", "content-type": "application/json" }, body: "{}" }).then((x) => x.json());
    assert.equal(sw.data.expired >= 1, true);
    assert.equal((await Models.TeenRegistration.findById(reg._id)).status, "expired");
    assert.ok(lastMail("link-expired"));
    const old = await call("GET", `/api/v1/teen/guardian/${tok}`);
    assert.equal(old.json.code, "link_expired");
    assert.equal(old.json.canRenew, true);
    await Models.TeenRegistration.updateOne({ _id: reg._id }, { $set: { emails: [] } });
    const ren = await call("POST", `/api/v1/teen/guardian/${tok}/renew`, {});
    assert.equal(ren.json.status, "success", JSON.stringify(ren.json));
    assert.equal((await Models.TeenRegistration.findById(reg._id)).status, "pending_guardian_approval");
    const fresh = tokenFrom(lastMail("link-renewed").data.links.action);
    assert.equal((await call("GET", `/api/v1/teen/guardian/${fresh}`)).json.status, "success");
});

// ---------------------------------------------------------------------------------------------------------------------
test("member API lock-down", async () => {
    const teen = await Models.User.findOne({ mail: "aarav.teen@example.com" }).lean();
    const rohan = await Models.User.findOne({ mail: "rohan@example.com" });
    await rohan.setPassword("Rohan-Pass-1");

    // visitors
    assert.equal((await call("GET", "/api/v1/user")).status, 401);
    assert.equal((await call("POST", "/api/v1/user", {})).status, 401);
    assert.equal((await call("GET", `/api/v1/user/${teen._id}`)).status, 401);
    assert.equal((await call("PUT", `/api/v1/user/${teen._id}`, { name: { first: "Hacked" } })).status, 401);
    assert.equal((await call("DELETE", `/api/v1/user/${teen._id}`)).status, 401);
    assert.equal((await call("GET", "/api/v1/user/summarize")).status, 401);
    assert.equal((await call("POST", "/api/v1/user/autologin", { _id: teen._id })).status, 401);
    const leak = await call("PATCH", `/api/v1/user/${teen._id}`, { action: "anything" });
    assert.equal(leak.json.data, undefined, "PATCH /:id never returns the record");
    assert.equal((await call("POST", "/api/v1/user/teen", {})).status, 410);
    assert.equal((await call("PUT", `/api/v1/user/parent-consent/${teen._id}`, {})).status, 410);

    // a member
    const login = await call("POST", "/api/v1/user/login", { mail: "rohan@example.com", password: "Rohan-Pass-1" });
    const cookie = login.headers.get("set-cookie").split(";")[0];
    assert.equal((await call("GET", "/api/v1/user", null, { cookie })).status, 403);
    assert.equal((await call("GET", `/api/v1/user/${teen._id}`, null, { cookie })).status, 403);
    assert.equal((await call("PUT", `/api/v1/user/${teen._id}`, { terms: [] }, { cookie })).status, 403);
    const own = await call("GET", `/api/v1/user/${rohan._id}`, null, { cookie });
    assert.equal(own.json.data.mail, "rohan@example.com");
    assert.equal(own.json.data.role, undefined);
    const ownTerms = await call("PUT", `/api/v1/user/${rohan._id}`, { terms: ["consumer-terms"], role: "root", category: "b2c-minor" }, { cookie });
    assert.equal(ownTerms.json.status, "success");
    const after = await Models.User.findById(rohan._id).select("+role").lean();
    assert.deepEqual(after.terms, ["consumer-terms"]);
    assert.equal(after.role, "respondent", "a member cannot make themselves admin");
    assert.equal(after.category, "b2c");
    const refs = await call("POST", "/api/v1/user", { mail: "aarav.teen@example.com" }, { cookie });
    assert.equal(refs.json.status, "success");
    assert.deepEqual(refs.json.data, [], "members see only their own referrals");
    assert.equal((await call("POST", "/api/v1/user/autologin", { _id: teen._id }, { cookie })).status, 403);

    // an admin
    await Models.User.updateOne({ _id: rohan._id }, { $set: { role: "administrator" } });
    const list = await call("POST", "/api/v1/user", { isActive: { $in: [true, false] } }, { cookie });
    assert.equal(list.json.status, "success");
    assert.ok(list.json.data.length >= 2);
    assert.ok(!JSON.stringify(list.json).includes("priya.parent@example.com"), "guardian details are not in member records");
    const injected = await call("POST", "/api/v1/user", { $where: "sleep(1000)" }, { cookie });
    assert.equal(injected.json.status, "success");
    assert.equal((await call("GET", `/api/v1/user/${teen._id}`, null, { cookie })).json.data.mail, "aarav.teen@example.com");
    assert.equal((await call("GET", "/api/v1/user/summarize", null, { cookie })).json.status, "success");
    const adminEdit = await call("PUT", `/api/v1/user/${teen._id}`, { registrationStatus: "active", isActive: true }, { cookie });
    assert.equal(adminEdit.json.status, "success");
    assert.equal((await Models.User.findById(teen._id).lean()).registrationStatus, "active");

    // teen endpoints need the teen's own login
    assert.equal((await call("GET", "/api/v1/teen/me", null, { cookie })).json.code, "not_teen");
    assert.equal((await call("GET", "/api/v1/teen/me")).status, 401);
});

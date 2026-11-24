// Panel admin API, super admin spec step 4b: the Teen Panel registration pipeline (all eleven statuses; approve a
// manual review, cancel, renew an expired invitation, each with a reason).
//
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_admin_step4b node --test --test-force-exit tests/admin.step4b.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import dns from "node:dns";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

dns.resolveMx = (domain, cb) => cb(null, [{ exchange: `mx.${domain}`, priority: 10 }]);
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const OUTBOX = fs.mkdtempSync(path.join(os.tmpdir(), "step4b-outbox-"));
process.env.TEEN_MAIL_OUTBOX = OUTBOX;
process.env.PUBLIC_SITE_URL = "https://www.myfrequentrewards.com";
const SECRET = "test-admin-secret-0123456789abcdef";
const MHO = "www.myhealthopinions.com";
process.env.MADP_ADMIN_API_SECRETS = SECRET;

const { default: mongoose } = await import("mongoose");
const { default: express } = await import("express");
const { default: cookieParser } = await import("cookie-parser");
const { default: appRoute } = await import("../app/routes/index.js");
const { setOrigin } = await import("../app/utils/index.js");
const { sign } = await import("../app/admin/auth.js");
const { generate } = await import("../app/utils/token.js");
const Adult = await import("../app/teen/adult.js");
const { forget } = await import("../app/engagement/switches.js");
const Models = await import("../app/model/index.js");

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_admin_step4b");
await mongoose.connection.db.dropDatabase();
const app = express();
app.use([express.json({ type: (req) => !req.url.startsWith("/api/admin/") && /json/i.test(req.headers["content-type"] || "") }), cookieParser(), setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;
const MFR = `127.0.0.1:${server.address().port}`;
process.env.MADP_ADMIN_API_ORIGINS = `${MFR},${MHO}`;
const ALICE = "11111111-2222-4333-8444-555555555555";
const V1 = "/api/admin/v1";

async function admin(method, p, body, { origin = MFR } = {}) {
    const raw = body ? JSON.stringify(body) : "";
    const ts = String(Math.floor(Date.now() / 1000));
    const res = await fetch(`${BASE}${p}`, { method, body: raw || undefined, headers: { "content-type": "application/json", "x-madp-timestamp": ts, "x-madp-origin": origin, "x-madp-actor": ALICE, "x-madp-signature": sign(SECRET, { timestamp: ts, method, path: p, origin, actor: ALICE, body: raw }) } });
    return { status: res.status, json: await res.json().catch(() => ({})) };
}
const yearsAgo = (y) => { const d = new Date(); d.setUTCFullYear(d.getUTCFullYear() - y); return d; };
let n = 0;
async function registration(origin, status, first) {
    n += 1;
    const db = mongoose.connection.db;
    const { insertedId } = await db.collection("User").insertOne({ origin, isActive: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date(), name: { first, last: "Demo" }, mail: `${first.toLowerCase()}@example.invalid`, dob: yearsAgo(15), gender: "Female", category: "b2c-minor", registrationStatus: status });
    const teen = { _id: insertedId };
    const guardian = await Models.TeenGuardian.create({ origin, relation: "mother", email: `parent.${first.toLowerCase()}@example.invalid`, name: { first: "Parent", last: "Demo" } });
    return Models.TeenRegistration.create({ origin, reference: `TR-TEST-${String(n).padStart(4, "0")}`, idempotencyKey: `k${n}`, status, teen: teen._id, guardian: guardian._id, history: [{ status, at: new Date(), by: "system" }] });
}
const review = await registration(MFR, "manual_review", "Riya");
const expired = await registration(MFR, "expired", "Esha");
const pending = await registration(MFR, "pending_guardian_approval", "Pia");
const done = await registration(MFR, "active", "Ana");
await registration(MHO, "manual_review", "Mona");

test("pipeline: counts every one of the eleven statuses for this brand only, lists open ones, masks the guardian", async () => {
    const r = await admin("GET", `${V1}/teens/registrations`);
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const { counts, items } = r.json.data;
    assert.equal(Object.keys(counts).length, 11);
    assert.equal(counts.manual_review, 1, "MHO's registration is not counted on MFR");
    assert.equal(counts.active, 1);
    assert.deepEqual(items.map((i) => i.reference).sort(), [review.reference, expired.reference, pending.reference].sort(), "finished ones are left out by default");
    const riya = items.find((i) => i.reference === review.reference);
    assert.equal(riya.teen, "Riya D.");
    assert.equal(riya.guardian.email, "pa•••@example.invalid");
    assert.deepEqual(riya.actions, ["approve", "cancel"]);
    assert.deepEqual(items.find((i) => i.reference === expired.reference).actions, ["renew", "cancel"]);
    const onlyActive = await admin("GET", `${V1}/teens/registrations?status=active`);
    assert.deepEqual(onlyActive.json.data.items.map((i) => i.reference), [done.reference]);
});

test("approve a manual review: needs a reason, moves to pending consent, logged as support with the MADP actor", async () => {
    assert.equal((await admin("POST", `${V1}/teens/registrations/${review._id}/approve`, {})).json.code, "reason_required");
    const r = await admin("POST", `${V1}/teens/registrations/${review._id}/approve`, { reason: "Spoke to the mother; she is the legal guardian" });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.data.status, "pending_consent");
    const reg = await Models.TeenRegistration.findById(review._id).lean();
    const last = reg.history[reg.history.length - 1];
    assert.equal(last.by, "support");
    assert.match(last.note, new RegExp(`madp:${ALICE}`));
    assert.equal((await Models.User.findById(reg.teen).lean()).registrationStatus, "pending_consent");
    // a second approve is refused: it is no longer in manual review
    assert.equal((await admin("POST", `${V1}/teens/registrations/${review._id}/approve`, { reason: "again" })).status, 409);
});

test("renew an expired invitation: back to waiting for the guardian, with a fresh invitation e-mail (outbox only)", async () => {
    assert.equal((await admin("POST", `${V1}/teens/registrations/${pending._id}/renew`, { reason: "not expired" })).status, 409);
    const r = await admin("POST", `${V1}/teens/registrations/${expired._id}/renew`, { reason: "Parent asked for a new link" });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.data.status, "pending_guardian_approval");
    const reg = await Models.TeenRegistration.findById(expired._id).lean();
    assert.ok(reg.expiresAt > new Date());
    assert.ok(fs.readdirSync(OUTBOX).some((f) => f.includes(expired.reference) && f.includes("guardian-invite")));
});

test("cancel: stops the registration, deactivates the teen; finished ones and other brands can't be touched", async () => {
    const r = await admin("POST", `${V1}/teens/registrations/${pending._id}/cancel`, { reason: "Duplicate sign-up" });
    assert.equal(r.json.data.status, "cancelled");
    const teen = await Models.User.findById(pending.teen).select("+isActive").lean();
    assert.equal(teen.isActive, false);
    assert.equal(teen.registrationStatus, "cancelled");
    assert.equal((await admin("POST", `${V1}/teens/registrations/${done._id}/cancel`, { reason: "x" })).status, 409);
    const mona = await Models.TeenRegistration.findOne({ origin: MHO }).lean();
    assert.equal((await admin("POST", `${V1}/teens/registrations/${mona._id}/approve`, { reason: "wrong brand" })).status, 404);
});

// ---- turning 18 ----------------------------------------------------------------------------------------------------
const daysFrom18 = (days) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + days); d.setUTCFullYear(d.getUTCFullYear() - 18); return d; };
async function teenWithGuardian(first, dob, extra = {}) {
    const db = mongoose.connection.db;
    const { insertedId } = await db.collection("User").insertOne({ origin: MFR, isActive: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date(), name: { first, last: "Demo" }, mail: `${first.toLowerCase()}@example.invalid`, dob, timezone: "UTC", gender: "Female", category: "b2c-minor", registrationStatus: "active", memberStatus: "active", parent: { email: `parent.${first.toLowerCase()}@example.invalid`, relation: "mother" }, ...extra });
    const g = await Models.TeenGuardian.create({ origin: MFR, relation: "mother", email: `parent.${first.toLowerCase()}@example.invalid`, name: { first: "Parent", last: "Demo" } });
    n += 1;
    await Models.TeenRegistration.create({ origin: MFR, reference: `TR-ADLT-${String(n).padStart(4, "0")}`, idempotencyKey: `a${n}`, status: "active", teen: insertedId, guardian: g._id, history: [] });
    await db.collection("GuardianLink").insertOne({ origin: MFR, teen: insertedId, hash: `h-${first}`, purpose: "redemption", expiresAt: new Date(Date.now() + 864e5), revokedAt: null, createdAt: new Date() });
    // one answer the teen gave, one the parent gave (Your home / Work and income)
    const parentKey = (await import("../app/teen/service.js")).PARENT_PROFILE_KEYS[0].toLowerCase();
    await db.collection("Answer").insertMany([
        { origin: MFR, user: String(insertedId), question: "d01", answer: ["x"], isActive: true, isDeleted: false },
        { origin: MFR, user: String(insertedId), question: parentKey, answer: ["y"], isActive: true, isDeleted: false },
    ]);
    await db.collection("Response").insertOne({ origin: MFR, user: insertedId, status: "complete", points: 3000, survey: { name: "Snacks", slug: "snacks" }, createdAt: new Date(Date.now() - 90 * 864e5), updatedAt: new Date(Date.now() - 90 * 864e5), isActive: true, isDeleted: false });
    return insertedId;
}
const member = async (method, p, id, body) => {
    const res = await fetch(`${BASE}${p}`, { method, headers: { "content-type": "application/json", authorization: `Bearer ${generate({ _id: String(id), origin: MFR })}`, "x-real-ip": `10.9.0.${n}` }, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, json: await res.json().catch(() => ({})) };
};

test("turning 18: the 30-day notice waits for its switch; on the birthday the account pauses and guardian links stop", async () => {
    const soon = await teenWithGuardian("Sona", daysFrom18(10));
    const today = await teenWithGuardian("Bela", daysFrom18(-1));
    const dry = await Adult.sweepAdult({ dryRun: true });
    assert.equal(dry.noticed, 0);
    assert.ok(dry.noticeSkippedSwitchOff >= 1, "no notice while the e-mail switch is off");
    assert.ok(dry.started >= 1);
    assert.equal((await Models.User.findById(today).lean()).adultMove?.stage, undefined, "a dry run changes nothing");

    await admin("PUT", `${V1}/switches/email_turning18`, { on: true, reason: "Testing the notice" });
    forget();
    const r = await Adult.sweepAdult();
    assert.ok(r.noticed >= 1);
    assert.ok(fs.readdirSync(OUTBOX).some((f) => f.includes("teen-turning-18")));
    assert.ok((await Models.User.findById(soon).lean()).adultMove.notifiedAt);
    const bela = await Models.User.findById(today).lean();
    assert.equal(bela.adultMove.stage, "turning_adult");
    assert.ok(bela.adultMove.deadline > new Date(Date.now() + 59 * 864e5));
    assert.equal(await Models.GuardianLink.countDocuments({ teen: today, revokedAt: null }), 0);

    // paused: the member API answers adult_terms_required, except the move screen and reading their account
    const blocked = await member("GET", "/api/v1/engagement/rewards", today);
    assert.equal(blocked.status, 403);
    assert.equal(blocked.json.code, "adult_terms_required");
    assert.equal((await member("GET", "/api/v1/me", today)).status, 200);
    const v = await member("GET", "/api/v1/teen/adult", today);
    assert.equal(v.json.data.stage, "turning_adult");

    // the waiting list in the console
    const waiting = await admin("GET", `${V1}/teens?stage=turning_adult`);
    assert.deepEqual(waiting.json.data.items.map((i) => i.name), ["Bela D."]);
    await admin("PUT", `${V1}/switches/email_turning18`, { on: false, reason: "Back off after the test" });
    forget();
});

test("turning 18: the member accepts adult terms; answers and points stay, parent data and guardian details go", async () => {
    const bela = await Models.User.findOne({ mail: "bela@example.invalid" }).lean();
    assert.equal((await member("POST", "/api/v1/teen/adult", bela._id, { segment: "b2b" })).json.code, "terms_required");
    assert.equal((await member("POST", "/api/v1/teen/adult", bela._id, { segment: "kid", acceptTerms: true, acceptPrivacy: true })).json.code, "bad_segment");
    const ok = await member("POST", "/api/v1/teen/adult", bela._id, { segment: "b2b", acceptTerms: true, acceptPrivacy: true });
    assert.equal(ok.status, 200, JSON.stringify(ok.json));
    assert.equal(ok.json.data.parentAnswersDeleted, 1);
    assert.equal(ok.json.data.guardianDeleted, true);
    const after = await Models.User.findById(bela._id).lean();
    assert.equal(after.category, "b2b");
    assert.equal(after.adultMove.stage, "moved");
    assert.equal(after.parent, undefined, "guardian details on the member record are gone");
    assert.deepEqual((await Models.Answers.find({ user: String(bela._id) }).lean()).map((a) => a.question), ["d01"]);
    assert.equal(await Models.Response.countDocuments({ user: bela._id }), 1, "points history kept");
    assert.equal(await Models.SegmentChange.countDocuments({ user: bela._id, to: "b2b" }), 1);
    // unpaused, and a second accept is refused
    assert.notEqual((await member("GET", "/api/v1/engagement/rewards", bela._id)).json.code, "adult_terms_required");
    assert.equal((await member("POST", "/api/v1/teen/adult", bela._id, { segment: "b2c", acceptTerms: true, acceptPrivacy: true })).status, 409);
});

test("turning 18: support can close a waiting account (points lapse, a delete request opens) or move one now", async () => {
    const cleo = await teenWithGuardian("Cleo", daysFrom18(-5));
    const dan = await teenWithGuardian("Dina", daysFrom18(-5));
    await Adult.sweepAdult();
    assert.equal((await admin("POST", `${V1}/teens/${cleo}/close`, {})).json.code, "reason_required");
    const c = await admin("POST", `${V1}/teens/${cleo}/close`, { reason: "No reply after three calls" });
    assert.equal(c.status, 200, JSON.stringify(c.json));
    assert.equal(c.json.data.pointsLapsed, 3000);
    const closed = await Models.User.findById(cleo).lean();
    assert.equal(closed.memberStatus, "closed");
    assert.equal(await Models.DataRequest.countDocuments({ user: cleo, open: true }), 1);
    assert.equal((await member("GET", "/api/v1/me", cleo)).status, 403, "a closed account can't sign in");
    assert.equal((await admin("POST", `${V1}/teens/${cleo}/close`, { reason: "again please" })).status, 409);

    const dry = await admin("POST", `${V1}/teens/${dan}/graduate`, { segment: "b2c" });
    assert.equal(dry.json.data.dryRun, true);
    const real = await admin("POST", `${V1}/teens/${dan}/graduate?dryRun=0`, { segment: "b2c", reason: "Accepted the adult terms by phone" });
    assert.equal(real.status, 200, JSON.stringify(real.json));
    assert.equal((await Models.User.findById(dan).lean()).adultMove.by, `madp:${ALICE}`);
});

test("turning 18: 60 days without accepting closes the account automatically", async () => {
    const eva = await teenWithGuardian("Eva", daysFrom18(-70));
    await Adult.sweepAdult({ now: new Date(Date.now() - 65 * 864e5) }); // the move started 65 days ago
    assert.equal((await Models.User.findById(eva).lean()).adultMove.stage, "turning_adult");
    const r = await Adult.sweepAdult();
    assert.ok(r.closed >= 1);
    assert.equal((await Models.User.findById(eva).lean()).adultMove.stage, "closed");
});

test.after(async () => { server.close(); await mongoose.disconnect(); });

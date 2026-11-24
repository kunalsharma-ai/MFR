// Panel admin API, super admin spec step 3a: segments, audiences, surveys and invitations, points with four eyes,
// quality score changes and the referral fraud view. Requests are signed the way MADP signs.
//
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_admin_step3 node --test --test-force-exit tests/admin.step3.test.mjs
import test from "node:test";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import dns from "node:dns";

dns.resolveMx = (domain, cb) => cb(null, [{ exchange: `mx.${domain}`, priority: 10 }]);
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const SECRET = "test-admin-secret-0123456789abcdef";
const MFR = "www.myfrequentrewards.com";
const MHO = "www.myhealthopinions.com";
process.env.MADP_ADMIN_API_SECRETS = SECRET;
process.env.MADP_ADMIN_API_ORIGINS = `${MFR},${MHO}`;

const { default: mongoose } = await import("mongoose");
const { default: express } = await import("express");
const { default: appRoute } = await import("../app/routes/index.js");
const { setOrigin } = await import("../app/utils/index.js");
const { sign } = await import("../app/admin/auth.js");
const { entries, balances } = await import("../app/engagement/ledger.js");

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_admin_step3");
await mongoose.connection.db.dropDatabase();
const app = express();
app.use([express.json({ type: (req) => !req.url.startsWith("/api/admin/") && /json/i.test(req.headers["content-type"] || "") }), setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;
const ALICE = "11111111-2222-4333-8444-555555555555";
const BOB = "66666666-2222-4333-8444-555555555555";
async function admin(method, path, body, { origin = MFR, actor = ALICE } = {}) {
    const raw = body ? JSON.stringify(body) : "";
    const ts = String(Math.floor(Date.now() / 1000));
    const nonce = crypto.randomBytes(16).toString("hex");
    const res = await fetch(`${BASE}${path}`, { method, body: raw || undefined, headers: { "content-type": "application/json", "x-madp-timestamp": ts, "x-madp-origin": origin, "x-madp-actor": actor, "x-madp-nonce": nonce, "x-madp-signature": sign(SECRET, { nonce, timestamp: ts, method, path, origin, actor, body: raw }) } });
    return { status: res.status, json: await res.json().catch(() => ({})) };
}
const V1 = "/api/admin/v1";
const db = mongoose.connection.db;
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const base = (origin) => ({ origin, isActive: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date() });
async function member(origin, first, extra = {}) {
    const { insertedId } = await db.collection("User").insertOne({
        ...base(origin), name: { first, last: "Demo" }, mail: `${first.toLowerCase()}@example.invalid`, dob: new Date("1990-05-01"),
        timezone: "America/New_York", category: "b2c", isVerified: { email: "verified" }, address: [{ tag: "home", country: "us" }], ...extra,
    });
    return String(insertedId);
}
await db.collection("Category").insertMany([{ ...base(MFR), name: "b2c" }, { ...base(MFR), name: "b2c-minor" }, { ...base(MHO), name: "b2c" }]);
const asha = await member(MFR, "Asha", { qualityScore: 150 });
const ben = await member(MFR, "Ben", { qualityScore: 40, address: [{ country: "gb" }] });
const cleo = await member(MFR, "Cleo"); // no score yet: counts as 100
await member(MFR, "Dan", { memberStatus: "archived" });
await member(MFR, "Tia", { category: "b2c-minor", dob: new Date("2011-03-01") });
await member(MHO, "Mo");
await db.collection("Answer").insertMany([
    { ...base(MFR), user: asha, question: "q_pets", answer: ["dog"] },
    { ...base(MFR), user: cleo, question: "q_pets", answer: ["cat"] },
]);

test("segments: settings are saved per brand and sign-up follows them", async () => {
    const list = await admin("GET", `${V1}/segments`);
    assert.equal(list.status, 200);
    assert.deepEqual(list.json.data.map((s) => s.name).sort(), ["b2c", "b2c-minor"]);
    assert.equal(list.json.data.find((s) => s.name === "b2c").members.active, 3);
    assert.equal((await admin("PUT", `${V1}/segments/b2c-minor`, { minAge: 12 })).json.code, "invalid_value", "teens are 13+");
    const up = await admin("PUT", `${V1}/segments/b2c`, { signupOpen: false, countries: ["US", "ca"], minAge: 21 });
    assert.equal(up.status, 200, JSON.stringify(up.json));
    assert.deepEqual(up.json.data.after, { signupOpen: false, countries: ["us", "ca"], minAge: 21 });
    const { default: users } = await import("../app/controller/User.js");
    const signup = (extra) => users.checkSegmentRules({ origin: MFR, category: "b2c", address: [{ country: "us" }], dob: "1990-01-01", ...extra });
    await assert.rejects(signup({}), /closed/);
    await admin("PUT", `${V1}/segments/b2c`, { signupOpen: true });
    await assert.rejects(signup({ address: [{ country: "fr" }] }), /country/);
    await assert.rejects(signup({ dob: new Date(Date.now() - 19 * 365.25 * 864e5).toISOString() }), /at least 21/);
    await signup({});
    await users.checkSegmentRules({ origin: MHO, category: "b2c", address: [{ country: "fr" }] }); // MHO has no settings
    const mho = await admin("GET", `${V1}/segments`, null, { origin: MHO });
    assert.equal(mho.json.data[0].settings.signupOpen, true, "MHO's b2c is not touched");
    await admin("PUT", `${V1}/segments/b2c`, { signupOpen: true, countries: [], minAge: 18 });
});

test("audiences: counts only active members of this brand and save with their last count", async () => {
    const all = await admin("POST", `${V1}/audiences/count`, { filter: {} });
    assert.equal(all.json.data.count, 4, "archived Dan and MHO's Mo are left out");
    const us = await admin("POST", `${V1}/audiences/count`, { filter: { categories: ["b2c"], countries: ["us"], qualityMin: 90 } });
    assert.equal(us.json.data.count, 2, "Asha (150) and Cleo (default 100)");
    const pets = await admin("POST", `${V1}/audiences/count`, { filter: { answers: [{ question: "q_pets", values: ["dog"] }] } });
    assert.equal(pets.json.data.count, 1);
    const saved = await admin("POST", `${V1}/audiences`, { name: "US good quality", filter: { countries: ["us"], qualityMin: 90 } });
    assert.equal(saved.status, 200);
    assert.equal(saved.json.data.count, 3, "no segment condition, so Tia (teen, default 100) counts too");
    assert.equal((await admin("POST", `${V1}/audiences`, { name: "US good quality", filter: {} })).status, 409);
    assert.equal((await admin("GET", `${V1}/audiences`, null, { origin: MHO })).json.data.length, 0);
});

let surveyId;
test("surveys: create, go live, feasibility, invite without e-mail, reconcile", async () => {
    const bad = await admin("POST", `${V1}/surveys`, { name: "X", slug: "Bad Slug", category: "b2c", source: "demo", points: 10, loi: 5 });
    assert.equal(bad.json.code, "invalid_value");
    const c = await admin("POST", `${V1}/surveys`, { name: "Pet food study", slug: "pet-food", category: "b2c", source: "demo", points: 120, loi: 10, minQualityScore: 90 });
    assert.equal(c.status, 200, JSON.stringify(c.json));
    surveyId = c.json.data.id;
    assert.equal((await admin("POST", `${V1}/surveys/${surveyId}/status`, { status: "active" })).json.code, "invalid_value", "needs a link");
    await admin("PUT", `${V1}/surveys/${surveyId}`, { link: "https://survey.example.invalid/s/pet-food" });
    const feas = await admin("POST", `${V1}/surveys/${surveyId}/feasibility`, {});
    assert.equal(feas.json.data.eligible, 2, "Ben is below the minimum score, Tia is in another segment");
    assert.equal((await admin("POST", `${V1}/surveys/${surveyId}/invite?dryRun=0`, {})).status, 409, "a draft can't invite");
    assert.equal((await admin("POST", `${V1}/surveys/${surveyId}/status`, { status: "active" })).status, 200);
    const dry = await admin("POST", `${V1}/surveys/${surveyId}/invite`, {});
    assert.deepEqual(dry.json.data, { dryRun: true, wouldInvite: 2, emailSent: false });
    const live = await admin("POST", `${V1}/surveys/${surveyId}/invite?dryRun=0`, {});
    assert.deepEqual(live.json.data, { dryRun: false, invited: 2, emailSent: false });
    const again = await admin("POST", `${V1}/surveys/${surveyId}/invite?dryRun=0`, {});
    assert.equal(again.json.data.invited, 0, "nobody is invited twice");
    assert.equal((await admin("PUT", `${V1}/surveys/${surveyId}`, { slug: "pet-food-2" })).json.code, "in_use");

    const resp = await admin("GET", `${V1}/surveys/${surveyId}/responses`);
    assert.equal(resp.json.data.total, 2);
    const ashaResp = resp.json.data.rows.find((r) => r.member === asha).id;
    const cleoResp = resp.json.data.rows.find((r) => r.member === cleo).id;
    assert.equal((await admin("POST", `${V1}/surveys/${surveyId}/reconcile`, { approve: [ashaResp] })).json.code, "reason_required");
    const rec = await admin("POST", `${V1}/surveys/${surveyId}/reconcile`, { approve: [ashaResp, cleoResp], reason: "Client final list" });
    assert.deepEqual(rec.json.data, { approved: 2, rejected: 0, skipped: 0 });
    const u = await db.collection("User").findOne({ _id: oid(asha) });
    assert.equal(balances(await entries(u, MFR)).available, 120);
    const rej = await admin("POST", `${V1}/surveys/${surveyId}/reconcile`, { reject: [cleoResp], reason: "Client rejected: speeding" });
    assert.equal(rej.json.data.rejected, 1);
    const cu = await db.collection("User").findOne({ _id: oid(cleo) });
    assert.equal(balances(await entries(cu, MFR)).available, 0, "a rejected complete leaves the ledger");
    assert.equal((await admin("GET", `${V1}/surveys/${surveyId}`, null, { origin: MHO })).status, 404, "other brands can't see it");
});

test("points: small adjustments apply, large ones wait for a second admin, no negative balances", async () => {
    const small = await admin("POST", `${V1}/members/${asha}/points`, { points: 30, reasonCode: "goodwill", note: "Sorry for the broken link" });
    assert.equal(small.status, 200, JSON.stringify(small.json));
    assert.deepEqual([small.json.data.before.available, small.json.data.after.available], [120, 150]);
    const neg = await admin("POST", `${V1}/members/${asha}/points`, { points: -1000, reasonCode: "fraud_reversal", note: "Duplicate account" });
    assert.equal(neg.json.code, "insufficient");
    const big = await admin("POST", `${V1}/members/${asha}/points`, { points: 60000, reasonCode: "migration", note: "Carried over from the old panel", needsApproval: true });
    assert.equal(big.json.data.adjustment.status, "pending");
    const id = big.json.data.adjustment.id;
    assert.equal((await admin("POST", `${V1}/points/approvals/${id}`, { decision: "approve" })).json.code, "four_eyes");
    assert.equal((await admin("POST", `${V1}/points/approvals/${id}`, { decision: "approve" }, { origin: MHO, actor: BOB })).status, 404, "brand-scoped");
    const ok = await admin("POST", `${V1}/points/approvals/${id}`, { decision: "approve", note: "Checked the export" }, { actor: BOB });
    assert.deepEqual(ok.json.data.after, { status: "applied" });
    const u = await db.collection("User").findOne({ _id: oid(asha) });
    assert.equal(balances(await entries(u, MFR)).available, 60150);
    assert.equal((await admin("GET", `${V1}/points/approvals`)).json.data.length, 0);
});

test("quality: score changes are logged and the review list is lowest first", async () => {
    const tiers = await admin("GET", `${V1}/quality/tiers`);
    assert.equal(tiers.json.data.scale, 200);
    const ch = await admin("POST", `${V1}/members/${cleo}/quality`, { rule: "speeding", delta: -50, note: "Finished in 2 minutes", survey: "pet-food" });
    assert.deepEqual([ch.json.data.before.score, ch.json.data.after.score], [100, 50]);
    const floor = await admin("POST", `${V1}/members/${ben}/quality`, { rule: "straightlining", delta: -100, note: "Same answer on every grid" });
    assert.equal(floor.json.data.after.score, 0, "never below 0");
    const hist = await admin("GET", `${V1}/members/${cleo}/quality`);
    assert.equal(hist.json.data[0].actor, ALICE);
    const rev = await admin("GET", `${V1}/quality/review?below=60`);
    assert.deepEqual(rev.json.data.rows.map((r) => r.name), ["Ben D.", "Cleo D."]);
    assert.equal(rev.json.data.rows[1].rejectedResponses, 1);
    assert.equal((await admin("GET", `${V1}/quality/review?below=60`, null, { origin: MHO })).json.data.total, 0);
});

test("referral fraud: shared payouts and referrers whose referrals never take part", async () => {
    const ids = [];
    for (let i = 0; i < 5; i++) ids.push(await member(MFR, `Ref${i}`, { referredBy: ben, isVerified: { email: "pending" } }));
    await db.collection("Redemption").insertMany([
        { ...base(MFR), user: oid(ids[0]), reference: "R-1", points: 500, status: "fulfilled", open: false, payout: { method: "paypal", destination: "same@example.invalid", masked: "s•••@example.invalid" } },
        { ...base(MFR), user: oid(ids[1]), reference: "R-2", points: 500, status: "fulfilled", open: false, payout: { method: "paypal", destination: "SAME@example.invalid", masked: "s•••@example.invalid" } },
    ]);
    const f = await admin("GET", `${V1}/referrals/fraud`);
    assert.equal(f.status, 200, JSON.stringify(f.json));
    assert.equal(f.json.data.referrers[0].member, ben);
    assert.equal(f.json.data.referrers[0].inactiveShare, 100);
    assert.equal(f.json.data.sharedPayouts.length, 1);
    assert.equal(f.json.data.sharedPayouts[0].members.length, 2);
    assert.ok(!JSON.stringify(f.json).includes("same@example.invalid"), "the payout destination is never returned");
    assert.deepEqual(f.json.data.notTracked, ["signup_ip", "device"]);
});

test.after(async () => { server.close(); await mongoose.disconnect(); });

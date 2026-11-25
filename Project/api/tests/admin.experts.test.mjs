// Panel admin API: the expert verification queue for Professionals (verify or decline by hand, per brand).
//
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_admin_experts node --test --test-force-exit tests/admin.experts.test.mjs
import test from "node:test";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import dns from "node:dns";

dns.resolveMx = (domain, cb) => cb(null, [{ exchange: `mx.${domain}`, priority: 10 }]);
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const SECRET = "test-admin-secret-0123456789abcdef";
const MFR = "www.myfrequentrewards.com", MHO = "www.myhealthopinions.com";
process.env.MADP_ADMIN_API_SECRETS = SECRET;
process.env.MADP_ADMIN_API_ORIGINS = `${MFR},${MHO}`;

const { default: mongoose } = await import("mongoose");
const { default: express } = await import("express");
const { default: cookieParser } = await import("cookie-parser");
const { default: appRoute } = await import("../app/routes/index.js");
const { setOrigin } = await import("../app/utils/index.js");
const { sign } = await import("../app/admin/auth.js");
const P = await import("../app/engagement/pro.js");

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_admin_experts");
await mongoose.connection.db.dropDatabase();
const app = express();
app.use([express.json({ type: (req) => !req.url.startsWith("/api/v1/admin/") && /json/i.test(req.headers["content-type"] || "") }), cookieParser(), setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;
const ALICE = "11111111-2222-4333-8444-555555555555";
const V1 = "/api/v1/admin";
async function admin(method, path, body, origin = MFR) {
    const raw = body ? JSON.stringify(body) : "";
    const ts = String(Math.floor(Date.now() / 1000));
    const nonce = crypto.randomBytes(16).toString("hex");
    const res = await fetch(`${BASE}${path}`, { method, body: raw || undefined, headers: { "content-type": "application/json", "x-madp-timestamp": ts, "x-madp-origin": origin, "x-madp-actor": ALICE, "x-madp-nonce": nonce, "x-madp-signature": sign(SECRET, { nonce, timestamp: ts, method, path, origin, actor: ALICE, body: raw }) } });
    return { status: res.status, json: await res.json().catch(() => ({})) };
}
const db = mongoose.connection.db;
const base = (origin, d = 1) => ({ origin, isActive: true, isDeleted: false, createdAt: new Date(Date.now() - d * 864e5), updatedAt: new Date() });
async function member(origin, first, category) {
    return (await db.collection("User").insertOne({ ...base(origin, 30), name: { first, last: "Demo" }, mail: `${first.toLowerCase()}@example.invalid`, category, qualityScore: 120, memberStatus: "active" })).insertedId;
}
const priya = await member(MFR, "Priya", "b2b");
const ravi = await member(MFR, "Ravi", "b2b");
const asha = await member(MFR, "Asha", "b2c");
const arjun = await member(MHO, "Arjun", "healthcare professional");
for (const [i, u] of [priya, ravi].entries()) await P.requestVerification({ _id: u, category: "b2b" }, MFR, { linkedin: `https://www.linkedin.com/in/demo-${i}`, workEmail: `person${i}@acme-demo.example`, jobTitle: "Buyer" });
await P.requestVerification({ _id: arjun, category: "healthcare professional" }, MHO, { workEmail: "arjun@clinic-demo.example" });
// a consumer's request can only exist from old data; it can be declined, never verified
await db.collection("ExpertVerification").insertOne({ ...base(MFR, 2), user: asha, status: "requested", workDomain: "shop.example", history: [] });
await db.collection("Response").insertMany([{ ...base(MFR), user: priya, status: "complete", survey: { slug: "s1" } }, { ...base(MFR), user: priya, status: "complete", survey: { slug: "s2" } }]);

test("the queue lists the brand's waiting requests, oldest first, with the work e-mail masked", async () => {
    const r = await admin("GET", `${V1}/experts`);
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const d = r.json.data;
    assert.equal(d.total, 3, "MHO's request is not listed");
    assert.deepEqual(d.counts, { requested: 3, verified: 0, declined: 0 });
    assert.equal(d.items[0].member.name, "Asha D.", "oldest first");
    const p = d.items.find((x) => x.member.id === String(priya));
    assert.deepEqual([p.workDomain, p.linkedin, p.member.segment], ["acme-demo.example", "https://www.linkedin.com/in/demo-0", "professional"]);
    assert.ok(p.workEmail.includes("***") && !JSON.stringify(d).includes("person0@"), "the full work e-mail never leaves the panel");
    assert.equal((await admin("GET", `${V1}/experts?status=nope`)).json.code, "invalid_value");
    assert.equal((await admin("GET", `${V1}/experts`, null, MHO)).json.data.total, 1);
});

test("verify, decline with a note, one decision only, and the member sees the badge", async () => {
    const items = (await admin("GET", `${V1}/experts`)).json.data.items;
    const id = (u) => items.find((x) => x.member.id === String(u)).id;
    const one = (await admin("GET", `${V1}/experts/${id(priya)}`)).json.data;
    assert.deepEqual([one.completedSurveys, one.verifiedAtSameDomain], [2, 0]);

    const ok = await admin("POST", `${V1}/experts/${id(priya)}/decision`, { decision: "verified", adminNote: "LinkedIn matches the job title" });
    assert.equal(ok.status, 200, JSON.stringify(ok.json));
    assert.deepEqual([ok.json.data.before.status, ok.json.data.after.status], ["requested", "verified"]);
    assert.equal((await admin("POST", `${V1}/experts/${id(priya)}/decision`, { decision: "declined", note: "Changed my mind" })).status, 409, "only a waiting request can be decided");
    const badge = await P.expertise({ _id: priya, category: "b2b" }, MFR);
    assert.equal(badge.badge, true);
    assert.equal((await admin("GET", `${V1}/experts/${id(ravi)}`)).json.data.verifiedAtSameDomain, 1, "a colleague at the same domain is already verified");

    assert.equal((await admin("POST", `${V1}/experts/${id(ravi)}/decision`, { decision: "declined" })).json.code, "reason_required");
    const no = await admin("POST", `${V1}/experts/${id(ravi)}/decision`, { decision: "declined", note: "We couldn't match the LinkedIn profile to you." });
    assert.equal(no.json.data.after.status, "declined");
    const doc = await db.collection("ExpertVerification").findOne({ user: ravi });
    assert.deepEqual([doc.note, doc.history.at(-1).by], ["We couldn't match the LinkedIn profile to you.", `madp:${ALICE}`]);

    assert.equal((await admin("POST", `${V1}/experts/${id(asha)}/decision`, { decision: "verified" })).status, 409, "only Professionals can be verified");
    assert.deepEqual((await admin("GET", `${V1}/experts?status=all`)).json.data.counts, { requested: 1, verified: 1, declined: 1 });
});

test("another brand's request is not found", async () => {
    const mho = (await admin("GET", `${V1}/experts`, null, MHO)).json.data.items[0].id;
    assert.equal((await admin("GET", `${V1}/experts/${mho}`)).status, 404);
    assert.equal((await admin("POST", `${V1}/experts/${mho}/decision`, { decision: "verified" })).status, 404);
    assert.equal((await db.collection("ExpertVerification").findOne({ user: arjun })).status, "requested");
    const ok = await admin("POST", `${V1}/experts/${mho}/decision`, { decision: "verified" }, MHO);
    assert.equal(ok.json.data.after.status, "verified", "MHO's healthcare professionals can be verified on MHO");
});

test.after(async () => { server.close(); await mongoose.disconnect(); });

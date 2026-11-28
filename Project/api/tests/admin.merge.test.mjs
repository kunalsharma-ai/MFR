// Duplicate member accounts: find, dry run, merge, undo. Real routes, real MongoDB.
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_admin_merge_test node --test --test-force-exit tests/admin.merge.test.mjs
import test from "node:test";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import dns from "node:dns";

dns.resolveMx = (domain, cb) => cb(null, [{ exchange: `mx.${domain}`, priority: 10 }]);
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const SECRET = "test-admin-secret-0123456789abcdef";
const MFR = "www.myfrequentrewards.com";
const T2O = "www.turn2opinion.com";
process.env.MADP_ADMIN_API_SECRETS = SECRET;
process.env.MADP_ADMIN_API_ORIGINS = `${MFR},${T2O}`;

const { default: mongoose } = await import("mongoose");
const { default: express } = await import("express");
const { default: appRoute } = await import("../app/routes/index.js");
const { setOrigin } = await import("../app/utils/index.js");
const { sign } = await import("../app/admin/auth.js");
const { normEmail } = await import("../app/admin/merge.js");

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_admin_merge_test");
await mongoose.connection.db.dropDatabase();
// build the unique indexes before the first request (the "409 already exists" checks rely on them; dropping the
// database while the models' start-up index build runs could leave one missing for a moment)
const IndexModels = await import("../app/model/index.js");
await Promise.all(Object.values(IndexModels).map((m) => m.init?.().then(() => m.createIndexes()).catch(() => {})));
await Promise.all(mongoose.modelNames().map((n) => mongoose.model(n).init())); // unique indexes decide clashes
const db = mongoose.connection.db;
const app = express();
app.use([express.json({ type: (req) => !req.url.startsWith("/api/v1/admin/") && /json/i.test(req.headers["content-type"] || "") }), setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;
const ACTOR = "11111111-2222-4333-8444-555555555555";
async function admin(method, path, body, origin = MFR) {
    const raw = body ? JSON.stringify(body) : "";
    const ts = String(Math.floor(Date.now() / 1000));
    const nonce = crypto.randomBytes(16).toString("hex");
    const res = await fetch(`${BASE}${path}`, {
        method, body: raw || undefined,
        headers: { "content-type": "application/json", "x-madp-timestamp": ts, "x-madp-origin": origin, "x-madp-actor": ACTOR, "x-madp-nonce": nonce, "x-madp-signature": sign(SECRET, { nonce, timestamp: ts, method, path, origin, actor: ACTOR, body: raw }) },
    });
    return { status: res.status, json: await res.json().catch(() => ({})) };
}
const base = (origin = MFR) => ({ origin, isActive: true, isDeleted: false, createdAt: new Date(Date.now() - 864e5 * 30), updatedAt: new Date(Date.now() - 864e5 * 30) });
async function person(mail, extra = {}, origin = MFR) {
    const { insertedId } = await db.collection("User").insertOne({ ...base(origin), name: { first: "Jane", last: "Doe" }, mail, dob: new Date("1990-01-01"), gender: "Female", category: "b2c", memberStatus: "active", isVerified: { email: "verified" }, ...extra });
    return insertedId;
}
const keep = await person("jane.doe@gmail.com");
const dup = await person("JaneDoe+panel@gmail.com");
await person("jane.doe+teen@gmail.com", { category: "b2c-minor", dob: new Date("2012-01-01") });
const ref = await person("friend@example.invalid", { referredBy: String(dup), name: { first: "Ann", last: "Friend" }, dob: new Date("1985-05-05") });
await db.collection("Reward").insertMany([
    { ...base(), user: keep, key: "signup", category: "signup", name: "Welcome", points: 50 },
    { ...base(), user: dup, key: "signup", category: "signup", name: "Welcome", points: 50 },
    { ...base(), user: dup, key: "bonus-x", category: "bonus", name: "Bonus", points: 100 },
]);
await db.collection("Response").insertOne({ ...base(), user: dup, status: "complete", survey: { slug: "s1", name: "S1" }, points: 200 });
await db.collection("Answer").insertMany([
    { ...base(), user: String(keep), question: "q1", answer: ["keep"] },
    { ...base(), user: String(dup), question: "q1", answer: ["dup"] },
    { ...base(), user: String(dup), question: "q2", answer: ["only-dup"] },
]);
await db.collection("SupportTicket").insertOne({ ...base(), ticketNo: "T-1", subject: "Help", created: { By: dup } });

test("e-mail normalising: case, dots and +tags (Gmail), and nothing else", () => {
    assert.equal(normEmail("JaneDoe+panel@GoogleMail.com"), "janedoe@gmail.com");
    assert.equal(normEmail("jane.doe@gmail.com"), "janedoe@gmail.com");
    assert.equal(normEmail("jane.doe@example.invalid"), "jane.doe@example.invalid");
});

test("likely duplicates are grouped, masked, and never include teens or the matching value", async () => {
    const r = await admin("GET", "/api/v1/admin/members/duplicates?by=email");
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.data.groups, 1);
    const ids = r.json.data.items[0].members.map((m) => m.id).sort();
    assert.deepEqual(ids, [String(keep), String(dup)].sort());
    assert.ok(!JSON.stringify(r.json).includes("janedoe@gmail.com") && !JSON.stringify(r.json).includes("jane.doe@gmail.com"));
    assert.equal((await admin("GET", "/api/v1/admin/members/duplicates?by=name_dob")).json.data.groups, 1);
    assert.equal((await admin("GET", "/api/v1/admin/members/duplicates?by=email", null, T2O)).json.data.groups, 0, "another brand sees none");
    assert.equal((await admin("GET", "/api/v1/admin/members/duplicates?by=x")).status, 400);
});

test("dry run: what moves, what stays, points, and nothing changes", async () => {
    const r = await admin("POST", "/api/v1/admin/members/merge", { keep: String(keep), duplicate: String(dup) });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const d = r.json.data;
    assert.equal(d.dryRun, true);
    assert.deepEqual(d.blockers, []);
    assert.deepEqual(d.collections.Reward, { move: 1, stay: 1 }, "the same signup reward is never counted twice");
    assert.deepEqual(d.collections.Answer, { move: 1, stay: 1 }, "the kept account's answer wins");
    assert.deepEqual(d.collections.Response, { move: 1, stay: 0 });
    assert.deepEqual(d.collections.SupportTicket, { move: 1, stay: 0 });
    assert.equal(d.referrals, 1);
    assert.equal(d.points.keep.earned, 50);
    assert.equal(d.points.duplicate.earned, 350);
    assert.equal((await db.collection("User").findOne({ _id: dup })).memberStatus, "active");
    assert.equal(await db.collection("Reward").countDocuments({ user: keep }), 1);
});

test("merge: needs a reason, moves the history, closes the duplicate, and can't run twice", async () => {
    assert.equal((await admin("POST", "/api/v1/admin/members/merge?dryRun=0", { keep: String(keep), duplicate: String(dup) })).json.code, "reason_required");
    const r = await admin("POST", "/api/v1/admin/members/merge?dryRun=0", { keep: String(keep), duplicate: String(dup), reason: "Same person, two sign-ups" });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const d = r.json.data;
    assert.equal(d.points.keepAfter.earned, 350, "50 signup + 100 bonus + 200 survey; the duplicate signup stays behind");
    const u = await db.collection("User").findOne({ _id: dup });
    assert.equal(u.memberStatus, "closed");
    assert.equal(String(u.mergedInto), String(keep));
    assert.deepEqual((await db.collection("Answer").findOne({ user: String(keep), question: "q1" })).answer, ["keep"]);
    assert.ok(await db.collection("Answer").findOne({ user: String(keep), question: "q2" }));
    assert.equal(String((await db.collection("SupportTicket").findOne({ ticketNo: "T-1" })).created.By), String(keep));
    assert.equal((await db.collection("User").findOne({ _id: ref })).referredBy, String(keep));
    const again = await admin("POST", "/api/v1/admin/members/merge?dryRun=0", { keep: String(keep), duplicate: String(dup), reason: "Same person, two sign-ups" });
    assert.equal(again.status, 409);
    assert.equal(again.json.code, "already_closed");
    const list = await admin("GET", `/api/v1/admin/members/merges?member=${dup}`);
    assert.equal(list.json.data.length, 1);
    assert.equal(list.json.data[0].moved.Reward, 1);
});

test("undo puts every moved row back and reopens the duplicate, once", async () => {
    const [m] = (await admin("GET", "/api/v1/admin/members/merges")).json.data;
    assert.equal((await admin("POST", `/api/v1/admin/members/merges/${m.id}/undo`, {})).json.code, "reason_required");
    const r = await admin("POST", `/api/v1/admin/members/merges/${m.id}/undo`, { reason: "Merged the wrong pair" });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal((await db.collection("User").findOne({ _id: dup })).memberStatus, "active");
    assert.equal(await db.collection("Reward").countDocuments({ user: dup }), 2);
    assert.equal(await db.collection("Reward").countDocuments({ user: keep }), 1);
    assert.equal(await db.collection("Answer").countDocuments({ user: String(dup) }), 2);
    assert.equal((await db.collection("User").findOne({ _id: ref })).referredBy, String(dup));
    assert.equal((await admin("POST", `/api/v1/admin/members/merges/${m.id}/undo`, { reason: "Merged the wrong pair" })).json.code, "already_undone");
});

test("blockers: teen accounts, an open redemption, the same account, another brand", async () => {
    const teen = await db.collection("User").findOne({ category: "b2c-minor" });
    const t = await admin("POST", "/api/v1/admin/members/merge", { keep: String(keep), duplicate: String(teen._id) });
    assert.equal(t.json.data.blockers[0].code, "teen_account");
    assert.equal((await admin("POST", "/api/v1/admin/members/merge?dryRun=0", { keep: String(keep), duplicate: String(teen._id), reason: "Same person" })).json.code, "teen_account");
    await db.collection("Redemption").insertOne({ ...base(), user: dup, open: true, points: 100, status: "requested" });
    assert.equal((await admin("POST", "/api/v1/admin/members/merge?dryRun=0", { keep: String(keep), duplicate: String(dup), reason: "Same person" })).json.code, "open_redemption");
    assert.equal((await admin("POST", "/api/v1/admin/members/merge", { keep: String(keep), duplicate: String(keep) })).status, 400);
    const other = await person("other@example.invalid", {}, T2O);
    assert.equal((await admin("POST", "/api/v1/admin/members/merge", { keep: String(keep), duplicate: String(other) })).status, 404, "an account of another brand is not found");
});

test.after(async () => { server.close(); await db.dropDatabase(); await mongoose.disconnect(); });

// Member-route lock-down from the super admin spec (24 Nov 2026), "Security fixes to finish before the console goes live":
//   PATCH /survey/response had no auth; /survey PUT and /survey/:id PUT and DELETE had no auth; /me/change-category
//   was open to members; /profile writes and /answers were not locked down; forgot-password said whether an account
//   exists.
//
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_security_test node --test --test-force-exit tests/security.fixes.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import dns from "node:dns";

dns.resolveMx = (domain, cb) => cb(null, [{ exchange: `mx.${domain}`, priority: 10 }]);
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const { default: mongoose } = await import("mongoose");
const { default: express } = await import("express");
const { default: cookieParser } = await import("cookie-parser");
const { default: appRoute } = await import("../app/routes/index.js");
const { setOrigin } = await import("../app/utils/index.js");
const { generate } = await import("../app/utils/token.js");

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_security_test");
await mongoose.connection.db.dropDatabase();
// build the unique indexes before the first request (the "409 already exists" checks rely on them; dropping the
// database while the models' start-up index build runs could leave one missing for a moment)
const IndexModels = await import("../app/model/index.js");
await Promise.all(Object.values(IndexModels).map((m) => m.init?.().then(() => m.createIndexes()).catch(() => {})));

const app = express();
app.use([express.json(), cookieParser(), setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;
const ORIGIN = `127.0.0.1:${server.address().port}`;

const db = mongoose.connection.db;
const base = { origin: ORIGIN, isActive: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date() };
async function member(first, mail, role = "respondent") {
    const { insertedId } = await db.collection("User").insertOne({ ...base, name: { first, last: "Test" }, fullName: `${first} Test`, mail, role, category: "b2c", isVerified: { email: "verified" } });
    return { id: insertedId, token: generate({ _id: String(insertedId), origin: ORIGIN }) };
}
async function call(method, url, body, token) {
    const headers = { "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    const res = await fetch(`${BASE}${url}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    let json = {};
    try { json = await res.json(); } catch { /* empty */ }
    return { status: res.status, json };
}

const asha = await member("Asha", "asha@example.invalid");
const ben = await member("Ben", "ben@example.invalid");
const admin = await member("Root", "root@example.invalid", "administrator");
const { insertedId: surveyId } = await db.collection("Survey").insertOne({ ...base, name: "Demo survey", slug: "demo-survey", points: 100 });
async function response(user, slug = "demo-survey", status = "invited") {
    const { insertedId } = await db.collection("Response").insertOne({ ...base, user: user.id, survey: { _id: surveyId, slug }, status, points: 100 });
    return String(insertedId);
}

test("PATCH /survey/response needs the member who owns the response", async () => {
    const sid = await response(asha);
    assert.equal((await call("PATCH", "/api/v1/survey/response", { sid, status: "complete" })).status, 401);
    const other = await call("PATCH", "/api/v1/survey/response", { sid, status: "complete" }, ben.token);
    assert.equal(other.json.status, "error");
    assert.equal((await db.collection("Response").findOne({ _id: new mongoose.Types.ObjectId(sid) })).status, "invited");
    const own = await call("PATCH", "/api/v1/survey/response", { sid, status: "complete" }, asha.token);
    assert.equal(own.json.status, "success");
    assert.equal(own.json.data.status, "complete");
    // A closed response can't be moved again, and only end statuses are accepted.
    await call("PATCH", "/api/v1/survey/response", { sid, status: "terminate" }, asha.token);
    assert.equal((await db.collection("Response").findOne({ _id: new mongoose.Types.ObjectId(sid) })).status, "complete");
    const sid2 = await response(asha, "second-survey");
    await call("PATCH", "/api/v1/survey/response", { sid: sid2, status: "approved" }, asha.token);
    assert.equal((await db.collection("Response").findOne({ _id: new mongoose.Types.ObjectId(sid2) })).status, "invited");
});

test("creating, editing and deleting surveys is for admins", async () => {
    assert.equal((await call("PUT", "/api/v1/survey", { name: "X", slug: "x" })).status, 401);
    assert.equal((await call("PUT", "/api/v1/survey", { name: "X", slug: "x" }, asha.token)).status, 403);
    assert.equal((await call("PUT", `/api/v1/survey/${surveyId}`, { points: 99999 })).status, 401);
    assert.equal((await call("PUT", `/api/v1/survey/${surveyId}`, { points: 99999 }, asha.token)).status, 403);
    assert.equal((await call("DELETE", `/api/v1/survey/${surveyId}`)).status, 401);
    assert.equal((await call("DELETE", `/api/v1/survey/${surveyId}`, null, asha.token)).status, 403);
    assert.equal((await call("GET", "/api/v1/survey/responses/demo-survey", null, asha.token)).status, 403);
    assert.equal((await db.collection("Survey").findOne({ _id: surveyId })).points, 100);
    const ok = await call("GET", "/api/v1/survey/responses/demo-survey", null, admin.token);
    assert.equal(ok.json.status, "success");
});

test("a member can't change their own segment", async () => {
    const r = await call("PATCH", "/api/v1/me/change-category", { category: "b2c-minor" }, asha.token);
    assert.equal(r.status, 403);
    assert.equal((await db.collection("User").findOne({ _id: asha.id })).category, "b2c");
});

test("profiles can only be changed by admins, and all members' answers only read by admins", async () => {
    const { insertedId: pid } = await db.collection("Profiles").insertOne({ ...base, name: "Your home", slug: "your-home" });
    assert.equal((await call("DELETE", `/api/v1/profile/${pid}`)).status, 401);
    assert.equal((await call("DELETE", `/api/v1/profile/${pid}`, null, asha.token)).status, 403);
    assert.equal((await call("PUT", `/api/v1/profile/${pid}`, { name: "Hacked" }, asha.token)).status, 403);
    assert.equal((await call("PUT", "/api/v1/profile", { name: "New", slug: "new" }, asha.token)).status, 403);
    assert.equal((await call("GET", "/api/v1/answers")).status, 401);
    assert.equal((await call("GET", "/api/v1/answers", null, asha.token)).status, 403);
    assert.equal((await call("GET", "/api/v1/answers", null, admin.token)).json.status, "success");
});

test("forgot-password gives the same answer for unknown e-mails", async () => {
    const unknown = await call("POST", "/api/v1/forgot-password", { user: "nobody@example.invalid" });
    assert.equal(unknown.json.status, "success");
    assert.match(unknown.json.message, /If this e-mail is registered/);
    assert.equal((await db.collection("OTP").countDocuments({})), 0, "nothing is created for an unknown e-mail");
});

test.after(async () => {
    server.close();
    await mongoose.disconnect();
});

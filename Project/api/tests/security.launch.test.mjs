// Launch blockers found on 25 Nov 2026: any signed-in member could edit or delete any survey response
// (PUT/DELETE /api/v1/response/:id), which can set a response to complete with any points; and the old
// PATCH /api/v1/me/parent-details wrote the whole request body onto the member (role included).
//
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_security_launch node --test --test-force-exit tests/security.launch.test.mjs
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

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_security_launch");
await mongoose.connection.db.dropDatabase();

const app = express();
app.use([express.json(), cookieParser(), setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;
const ORIGIN = `127.0.0.1:${server.address().port}`;

const db = mongoose.connection.db;
const base = { origin: ORIGIN, isActive: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date() };
async function member(first, mail, role = "respondent", category = "b2c") {
    const { insertedId } = await db.collection("User").insertOne({ ...base, name: { first, last: "Test" }, fullName: `${first} Test`, mail, role, category, isVerified: { email: "verified" } });
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
const { insertedId: rid } = await db.collection("Response").insertOne({ ...base, user: asha.id, survey: { _id: surveyId, slug: "demo-survey" }, status: "invited", points: 100 });
const rowOf = () => db.collection("Response").findOne({ _id: rid });

test("members cannot edit or delete survey responses, even their own", async () => {
    assert.equal((await call("PUT", `/api/v1/response/${rid}`, { status: "complete", points: 999999 }, asha.token)).status, 403);
    assert.equal((await call("PUT", `/api/v1/response/${rid}`, { status: "complete", points: 999999 }, ben.token)).status, 403);
    assert.equal((await call("DELETE", `/api/v1/response/${rid}`, null, ben.token)).status, 403);
    const row = await rowOf();
    assert.equal(row.status, "invited");
    assert.equal(row.points, 100);
});

test("a member reads only their own response; admins read and change any", async () => {
    assert.equal((await call("GET", `/api/v1/response/${rid}`, null, asha.token)).json.status, "success");
    assert.equal((await call("GET", `/api/v1/response/${rid}`, null, ben.token)).json.status, "error");
    assert.equal((await call("GET", `/api/v1/response/${rid}`, null, admin.token)).json.status, "success");
    assert.equal((await call("PUT", `/api/v1/response/${rid}`, { status: "terminate" }, admin.token)).json.status, "success");
    assert.equal((await rowOf()).status, "terminate");
});

test("parent-details takes only guardian details, only from a teen without them", async () => {
    // an adult member can't use it to change their category or role
    const adult = await call("PATCH", "/api/v1/me/parent-details", { role: "administrator", category: "minor", parent: { email: "p@example.invalid" } }, ben.token);
    assert.equal(adult.json.status, "error");
    let u = await db.collection("User").findOne({ _id: ben.id });
    assert.equal(u.role, "respondent");
    assert.equal(u.category, "b2c");
    // a teen gets the guardian details saved, and nothing else from the body
    const teen = await member("Tara", "tara@example.invalid", "respondent", "b2c-minor");
    await call("PATCH", "/api/v1/me/parent-details", { role: "administrator", qualityScore: 200, parent: { relation: "mother", name: { first: "Mira", last: "Test" }, email: "Mira@Example.invalid" } }, teen.token);
    u = await db.collection("User").findOne({ _id: teen.id });
    assert.equal(u.role, "respondent");
    assert.notEqual(u.qualityScore, 200);
    assert.equal(u.category, "b2c-minor");
    assert.equal(u.parent?.email, "mira@example.invalid");
    // and can't replace them once they are on file
    await call("PATCH", "/api/v1/me/parent-details", { parent: { email: "other@example.invalid" } }, teen.token);
    assert.equal((await db.collection("User").findOne({ _id: teen.id })).parent.email, "mira@example.invalid");
});

test.after(async () => { server.close(); await mongoose.disconnect(); });

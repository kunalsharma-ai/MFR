// "Delete or Deactivate Account" page (POST /api/v1/auth/delete) and the survey star rating (PUT /api/v1/survey/response),
// two routes the member site called that did not exist (26 Nov 2026).
//
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_account_test node --test --test-force-exit tests/account.actions.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import dns from "node:dns";

dns.resolveMx = (domain, cb) => cb(null, [{ exchange: `mx.${domain}`, priority: 10 }]);
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const { default: mongoose } = await import("mongoose");
const { default: express } = await import("express");
const { default: cookieParser } = await import("cookie-parser");
const { default: bcrypt } = await import("bcryptjs");
const { default: appRoute } = await import("../app/routes/index.js");
const { setOrigin } = await import("../app/utils/index.js");
const { generate } = await import("../app/utils/token.js");
const { parseAction } = await import("../app/member/accountActions.js");

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_account_test");
await mongoose.connection.db.dropDatabase();

const app = express();
app.use([express.json(), cookieParser(), setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;
const ORIGIN = `127.0.0.1:${server.address().port}`;
const db = mongoose.connection.db;
const base = { origin: ORIGIN, isActive: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date() };
const PASSWORD = "Correct-Horse-9";
async function member(first, mail) {
    const { insertedId } = await db.collection("User").insertOne({ ...base, name: { first, last: "Test" }, mail, role: "respondent", category: "b2c", isVerified: { email: "verified" }, password: await bcrypt.hash(PASSWORD, 4) });
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
const requests = (user) => db.collection("DataRequest").find({ user: user.id }).toArray();

test("the page's action codes", () => {
    assert.deepEqual(parseAction(30), { kind: "deactivate", days: 30 });
    assert.deepEqual(parseAction("90"), { kind: "deactivate", days: 90 });
    assert.deepEqual(parseAction(-1), { kind: "hold", days: null });
    assert.deepEqual(parseAction("Delete"), { kind: "delete", days: null });
    assert.equal(parseAction(45), null);
    assert.equal(parseAction("drop"), null);
});

test("POST /auth/delete needs a session and the member's own password", async () => {
    assert.equal((await call("POST", "/api/v1/auth/delete", { action: 30, password: PASSWORD })).status, 401);
    const wrong = await call("POST", "/api/v1/auth/delete", { id: String(asha.id), action: 30, password: "nope" }, asha.token);
    assert.equal(wrong.status, 401);
    assert.match(wrong.json.message, /password/i);
    const other = await call("POST", "/api/v1/auth/delete", { id: String(ben.id), action: 30, password: PASSWORD }, asha.token);
    assert.equal(other.status, 403);
    const bad = await call("POST", "/api/v1/auth/delete", { id: String(asha.id), action: 45, password: PASSWORD }, asha.token);
    assert.equal(bad.status, 400);
    assert.equal((await requests(asha)).length, 0);
});

test("a deactivation and a deletion are filed for support, once each, and nothing on the account changes", async () => {
    const d = await call("POST", "/api/v1/auth/delete", { id: String(asha.id), action: 60, password: PASSWORD }, asha.token);
    assert.equal(d.status, 200);
    assert.equal(d.json.status, "success");
    assert.ok(d.json.data.requestId);
    const again = await call("POST", "/api/v1/auth/delete", { id: String(asha.id), action: 60, password: PASSWORD }, asha.token);
    assert.equal(again.status, 409);
    const del = await call("POST", "/api/v1/auth/delete", { id: String(asha.id), action: "Delete", password: PASSWORD }, asha.token);
    assert.equal(del.status, 200);
    const rows = await requests(asha);
    assert.deepEqual(rows.map((r) => [r.kind, r.days ?? null, r.status]).sort(), [["deactivate", 60, "requested"], ["delete", null, "requested"]]);
    const u = await db.collection("User").findOne({ _id: asha.id });
    assert.equal(u.memberStatus ?? "active", "active");
    assert.equal(u.isDeleted, false);
});

test("PUT /survey/response saves the owner's rating of an ended survey only", async () => {
    const { insertedId } = await db.collection("Response").insertOne({ ...base, user: asha.id, survey: { slug: "demo" }, status: "complete", points: 10 });
    const { insertedId: open } = await db.collection("Response").insertOne({ ...base, user: asha.id, survey: { slug: "demo-2" }, status: "invited", points: 10 });
    const sid = String(insertedId);
    assert.equal((await call("PUT", "/api/v1/survey/response", { sid, rating: 4 })).status, 401);
    assert.equal((await call("PUT", "/api/v1/survey/response", { sid, rating: 4 }, ben.token)).json.status, "error");
    assert.equal((await call("PUT", "/api/v1/survey/response", { sid, rating: 9 }, asha.token)).json.status, "error");
    assert.equal((await call("PUT", "/api/v1/survey/response", { sid: String(open), rating: 4 }, asha.token)).json.status, "error");
    const ok = await call("PUT", "/api/v1/survey/response", { sid, rating: 4 }, asha.token);
    assert.equal(ok.json.status, "success");
    const r = await db.collection("Response").findOne({ _id: insertedId });
    assert.equal(r.rating, 4);
    assert.equal(r.status, "complete");
    assert.equal((await db.collection("Response").findOne({ _id: open })).rating, undefined);
});

test.after(async () => { server.close(); await mongoose.disconnect(); });

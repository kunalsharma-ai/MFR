// Support tickets access rules (Nov 2026): a member reads and replies to their own tickets only; admins see all.
//
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_support_test node --test tests/support.access.test.mjs
//
// Needs a MongoDB and the hostnames email-template + email resolving to 127.0.0.1 (stubs run on :8080 and :3000).
import test from "node:test";
import assert from "node:assert/strict";
import dns from "node:dns";
import http from "node:http";

dns.resolveMx = (domain, cb) => cb(null, [{ exchange: `mx.${domain}`, priority: 10 }]);
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const { default: mongoose } = await import("mongoose");
const { default: express } = await import("express");
const { default: cookieParser } = await import("cookie-parser");
const { default: appRoute } = await import("../app/routes/index.js");
const { setOrigin } = await import("../app/utils/index.js");
const { generate } = await import("../app/utils/token.js");

const sent = [];
const stub = (port, fn) => new Promise((r) => {
    const s = http.createServer((req, res) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { fn(b); res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ data: "<html/>" })); }); });
    s.listen(port, "127.0.0.1", () => r(s));
});
const stubs = await Promise.all([stub(8080, () => {}), stub(3000, (b) => sent.push(JSON.parse(b || "{}")))]);

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_support_test");
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
    return { id: String(insertedId), token: generate({ _id: String(insertedId), origin: ORIGIN }) };
}
async function ticket(no, email) {
    const { insertedId } = await db.collection("SupportTicket").insertOne({ ...base, ticketNo: no, subject: `Ticket ${no}`, description: "<p>x</p>", status: "new", issueRaisedBy: { name: email, email } });
    return String(insertedId);
}
async function call(method, url, body, token) {
    const res = await fetch(`${BASE}${url}`, { method, headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
    let json = {};
    try { json = await res.json(); } catch { /* empty */ }
    return { status: res.status, json };
}

// ticket numbers come from the idconfig record the deployment already has
await db.collection("idconfig").insertOne({ ...base, module: "support-ticket", limit: 100000, prefix: "MFR-", suffix: "", sequence: 1, minLength: 4 });
const asha = await member("Asha", "asha@example.com");
const ben = await member("Ben", "ben@example.com");
const admin = await member("Root", "root@example.com", "administrator");
const aT = await ticket("T-A1", "asha@example.com");
const bT = await ticket("T-B1", "ben@example.com");

test("a member lists only their own tickets", async () => {
    const all = await call("GET", "/api/v1/support", null, asha.token);
    assert.deepEqual(all.json.data.map((t) => t.ticketNo), ["T-A1"]);
    const filtered = await call("POST", "/api/v1/support", { "issueRaisedBy.email": "ben@example.com" }, asha.token);
    assert.deepEqual(filtered.json.data.map((t) => t.ticketNo), ["T-A1"], "the filter is narrowed to the member's own email");
    const tricky = await call("POST", "/api/v1/support", { $or: [{ ticketNo: "T-B1" }, { ticketNo: "T-A1" }] }, asha.token);
    assert.deepEqual(tricky.json.data.map((t) => t.ticketNo), ["T-A1"]);
    const mine = await call("GET", "/api/v1/support/mine", null, asha.token);
    assert.deepEqual(mine.json.data.map((t) => t.ticketNo), ["T-A1"]);
    const adminList = await call("GET", "/api/v1/support", null, admin.token);
    assert.deepEqual(adminList.json.data.map((t) => t.ticketNo).sort(), ["T-A1", "T-B1"]);
});

test("a member can't read, reply to or delete another member's ticket", async () => {
    assert.equal((await call("GET", `/api/v1/support/${bT}`, null, asha.token)).json.status, "error");
    assert.equal((await call("GET", `/api/v1/support/${bT}/reply`, null, asha.token)).json.status, "error");
    assert.equal((await call("PUT", `/api/v1/support/${bT}/reply`, { message: "hi" }, asha.token)).json.status, "error");
    assert.equal((await call("DELETE", `/api/v1/support/${bT}`, null, asha.token)).json.status, "error");
    assert.equal((await call("DELETE", `/api/v1/support/${aT}`, null, asha.token)).json.status, "error", "members can't delete tickets");
    assert.ok(await db.collection("SupportTicket").findOne({ ticketNo: "T-B1", isActive: true }));
});

test("a member reads and replies to their own ticket but can't change its status", async () => {
    const own = await call("GET", `/api/v1/support/${aT}`, null, asha.token);
    assert.equal(own.json.data.ticketNo, "T-A1");
    const r = await call("PUT", `/api/v1/support/${aT}/reply`, { message: "<p>Any news?</p>", status: "closed" }, asha.token);
    assert.equal(r.json.status, "success");
    assert.equal((await db.collection("SupportTicket").findOne({ ticketNo: "T-A1" })).status, "new");
    const conv = await call("GET", `/api/v1/support/${aT}/reply`, null, asha.token);
    assert.equal(conv.json.data.length, 1);
});

test("only an admin opens a ticket for someone else; admins keep full access", async () => {
    const spoof = await call("PUT", "/api/v1/support", { subject: "S", description: "d", user: "ben@example.com" }, asha.token);
    assert.equal(spoof.json.status, "success");
    assert.equal(spoof.json.data.issueRaisedBy.email, "asha@example.com", "the 'user' field is ignored for members");
    const onBehalf = await call("PUT", "/api/v1/support", { subject: "S2", description: "d", user: "ben@example.com" }, admin.token);
    assert.equal(onBehalf.json.data.issueRaisedBy.email, "ben@example.com");
    assert.equal((await call("GET", `/api/v1/support/${bT}`, null, admin.token)).json.data.ticketNo, "T-B1");
    const reply = await call("PUT", `/api/v1/support/${bT}/reply`, { message: "<p>Done</p>", status: "closed" }, admin.token);
    assert.equal(reply.json.status, "success");
    assert.equal((await db.collection("SupportTicket").findOne({ ticketNo: "T-B1" })).status, "closed");
    assert.equal((await call("DELETE", `/api/v1/support/${bT}`, null, admin.token)).json.status, "success");
});

test.after(async () => {
    server.close();
    stubs.forEach((s) => s.close());
    await mongoose.disconnect();
});

// Panel admin API, super admin spec step 3b: ticket desk, portal messages and help centre entries, and the member
// side of each (GET /api/v1/alerts, GET /api/v1/help, the member's ticket conversation).
//
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_admin_step3b node --test --test-force-exit tests/admin.step3b.test.mjs
import test from "node:test";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import dns from "node:dns";

dns.resolveMx = (domain, cb) => cb(null, [{ exchange: `mx.${domain}`, priority: 10 }]);
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const SECRET = "test-admin-secret-0123456789abcdef";
const MHO = "www.myhealthopinions.com";
process.env.MADP_ADMIN_API_SECRETS = SECRET;

const { default: mongoose } = await import("mongoose");
const { default: express } = await import("express");
const { default: cookieParser } = await import("cookie-parser");
const { default: appRoute } = await import("../app/routes/index.js");
const { setOrigin } = await import("../app/utils/index.js");
const { generate } = await import("../app/utils/token.js");
const { sign } = await import("../app/admin/auth.js");

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_admin_step3b");
await mongoose.connection.db.dropDatabase();
const app = express();
app.use([express.json({ type: (req) => !req.url.startsWith("/api/admin/") && /json/i.test(req.headers["content-type"] || "") }), cookieParser(), setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;
// the member API takes the brand from the Host header, so the test host plays MFR
const MFR = `127.0.0.1:${server.address().port}`;
process.env.MADP_ADMIN_API_ORIGINS = `${MFR},${MHO}`;
const ALICE = "11111111-2222-4333-8444-555555555555";
const V1 = "/api/admin/v1";

async function admin(method, path, body, { origin = MFR, actor = ALICE } = {}) {
    const raw = body ? JSON.stringify(body) : "";
    const ts = String(Math.floor(Date.now() / 1000));
    const nonce = crypto.randomBytes(16).toString("hex");
    const res = await fetch(`${BASE}${path}`, { method, body: raw || undefined, headers: { "content-type": "application/json", "x-madp-timestamp": ts, "x-madp-origin": origin, "x-madp-actor": actor, "x-madp-nonce": nonce, "x-madp-signature": sign(SECRET, { nonce, timestamp: ts, method, path, origin, actor, body: raw }) } });
    return { status: res.status, json: await res.json().catch(() => ({})) };
}
async function asMember(id, method, path, body) {
    const res = await fetch(`${BASE}${path}`, { method, body: body ? JSON.stringify(body) : undefined, headers: { "content-type": "application/json", authorization: `Bearer ${generate({ _id: id, origin: MFR })}` } });
    return { status: res.status, json: await res.json().catch(() => ({})) };
}
const db = mongoose.connection.db;
const base = (origin) => ({ origin, isActive: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date() });
async function member(origin, first, extra = {}) {
    const { insertedId } = await db.collection("User").insertOne({
        ...base(origin), name: { first, last: "Demo" }, mail: `${first.toLowerCase()}@example.invalid`, dob: new Date("1990-05-01"),
        category: "b2c", isVerified: { email: "verified" }, address: [{ country: "us" }], memberStatus: "active", ...extra,
    });
    return String(insertedId);
}
const asha = await member(MFR, "Asha");
const ben = await member(MFR, "Ben", { category: "b2b" });
const tia = await member(MFR, "Tia", { category: "b2c-minor", dob: new Date("2011-03-01") });
await member(MHO, "Mo");

test("tickets: list, reply without e-mail, internal note the member never sees, status and assignment", async () => {
    await db.collection("SupportTicket").insertMany([
        { ...base(MFR), ticketNo: "MFR-T-1", subject: "Points missing", description: "I finished the grocery survey", status: "new", priority: "normal", issueRaisedBy: { name: "Asha Demo", email: "asha@example.invalid" } },
        { ...base(MFR), ticketNo: "MFR-T-2", subject: "Teen question", description: "Help", status: "new", issueRaisedBy: { name: "Tia Demo", email: "tia@example.invalid" } },
        { ...base(MHO), ticketNo: "MHO-T-1", subject: "Other brand", status: "new", issueRaisedBy: { name: "Mo", email: "mo@example.invalid" } },
    ]);
    const l = await admin("GET", `${V1}/tickets?status=open_all`);
    assert.equal(l.status, 200, JSON.stringify(l.json));
    assert.equal(l.json.data.total, 2, "MHO's ticket is not listed");
    assert.ok(l.json.data.items.every((t) => t.from.email.includes("***")), "e-mails are masked");
    const noTeens = await admin("GET", `${V1}/tickets?noTeens=1`);
    assert.deepEqual(noTeens.json.data.items.map((t) => t.no), ["MFR-T-1"]);
    const id = l.json.data.items.find((t) => t.no === "MFR-T-1").id;

    const note = await admin("POST", `${V1}/tickets/${id}/reply`, { message: "Checked the ledger: response is a dropout", internal: true, agentName: "Ravi (support)" });
    assert.deepEqual([note.json.data.internal, note.json.data.emailSent, note.json.data.status], [true, false, "new"]);
    const rep = await admin("POST", `${V1}/tickets/${id}/reply`, { message: "We have asked the client to confirm your complete.", agentName: "Ravi (support)" });
    assert.equal(rep.json.data.status, "pending", "a reply to a new ticket moves it to pending");
    assert.equal(rep.json.data.emailSent, false);
    await admin("PUT", `${V1}/tickets/${id}`, { priority: "high", assignedTo: "ravi@example.invalid" });
    assert.equal((await admin("PUT", `${V1}/tickets/${id}`, { priority: "panic" })).json.code, "invalid_value");
    const d = await admin("GET", `${V1}/tickets/${id}`);
    assert.deepEqual(d.json.data.conversation.map((c) => c.type), ["note", "reply"]);
    assert.ok(d.json.data.history.length >= 3);
    assert.equal(d.json.data.priority, "high");

    // the member's conversation shows the reply, never the note
    const mine = await asMember(asha, "GET", `/api/v1/support/${id}/reply`);
    const texts = JSON.stringify(mine.json);
    assert.ok(texts.includes("asked the client"), texts);
    assert.ok(!texts.includes("Checked the ledger"), "internal note leaked");
    assert.equal((await admin("GET", `${V1}/tickets/${id}`, null, { origin: MHO })).status, 404);
});

test("messages: draft, preview, send to an audience, teens only when named, read, withdraw", async () => {
    const c = await admin("POST", `${V1}/messages`, { title: "New surveys this week", body: "Three new studies are waiting for you.", cta: "/member/surveys", ctaLabel: "See surveys" });
    assert.equal(c.status, 200, JSON.stringify(c.json));
    assert.equal((await admin("POST", `${V1}/messages`, { title: "Bad", body: "x", cta: "https://evil.example" })).json.code, "invalid_value");
    const id = c.json.data.id;
    const pv = await admin("POST", `${V1}/messages/${id}/preview`, {});
    assert.deepEqual([pv.json.data.recipients, pv.json.data.teens], [2, 0], "Asha and Ben; Tia (teen) is left out");
    const s = await admin("POST", `${V1}/messages/${id}/send`, {});
    assert.deepEqual([s.json.data.recipients, s.json.data.emailSent], [2, false]);
    assert.equal((await admin("POST", `${V1}/messages/${id}/send`, {})).status, 409, "never twice");
    assert.equal((await admin("PUT", `${V1}/messages/${id}`, { title: "Changed" })).status, 409);

    const inbox = await asMember(asha, "GET", "/api/v1/alerts");
    assert.equal(inbox.json.data.length, 1);
    assert.equal(inbox.json.data[0].title, "New surveys this week");
    assert.equal((await asMember(tia, "GET", "/api/v1/alerts")).json.data.length, 0);
    await asMember(asha, "POST", `/api/v1/alerts/${id}/read`);
    assert.equal((await admin("GET", `${V1}/messages/${id}`)).json.data.read, 1);

    const t = await admin("POST", `${V1}/messages`, { title: "Teen Zone news", body: "A new badge is out.", filter: { categories: ["b2c-minor"] } });
    const tp = await admin("POST", `${V1}/messages/${t.json.data.id}/preview`, {});
    assert.deepEqual([tp.json.data.recipients, tp.json.data.teens], [1, 1]);

    await admin("POST", `${V1}/messages/${id}/withdraw`);
    assert.equal((await asMember(asha, "GET", "/api/v1/alerts")).json.data.length, 0, "a withdrawn message leaves the inbox");
    assert.equal((await admin("GET", `${V1}/messages`, null, { origin: MHO })).json.data.length, 0);
});

test("help: entries are drafts until published, filtered by member type, and teen copy has no money", async () => {
    const bad = await admin("POST", `${V1}/help`, { slug: "paypal-time", topic: "rewards", title: "When does PayPal arrive?", body: ["Usually within 5 days."] });
    assert.equal(bad.json.code, "teen_guardrail", "an entry for everyone can't talk money");
    const ok = await admin("POST", `${V1}/help`, { slug: "paypal-time", topic: "rewards", title: "When does PayPal arrive?", body: ["Usually within 5 days.", { note: "Check your spam folder." }], types: ["consumer", "professional"], keywords: ["payout"] });
    assert.equal(ok.status, 200, JSON.stringify(ok.json));
    assert.equal((await asMember(asha, "GET", "/api/v1/help")).json.data.length, 0, "a draft isn't shown");
    await admin("POST", `${V1}/help/${ok.json.data.id}/status`, { status: "published" });
    const a = await asMember(asha, "GET", "/api/v1/help");
    assert.equal(a.json.data[0].q, "When does PayPal arrive?");
    assert.equal(a.json.data[0].kw, "payout");
    assert.equal((await asMember(tia, "GET", "/api/v1/help")).json.data.length, 0, "teens don't get it");
    assert.equal((await admin("POST", `${V1}/help`, { slug: "paypal-time", topic: "rewards", title: "Again", body: ["x y"], types: ["consumer"] })).status, 409);
});

test.after(async () => { server.close(); await mongoose.disconnect(); });

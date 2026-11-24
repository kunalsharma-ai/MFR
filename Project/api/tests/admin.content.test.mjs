// Content and legal pages editor (super admin console) against a real MongoDB.
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_admin_content_test node --test --test-force-exit tests/admin.content.test.mjs
import test from "node:test";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import dns from "node:dns";
import http from "node:http";

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

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_admin_content_test");
await mongoose.connection.db.dropDatabase();
const app = express();
app.use([express.json({ type: (req) => !req.url.startsWith("/api/admin/") && /json/i.test(req.headers["content-type"] || "") }), setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;
const ALICE = "11111111-2222-4333-8444-555555555555";
const BOB = "66666666-7777-4888-9999-aaaaaaaaaaaa";
async function admin(method, path, body, { origin = MFR, actor = ALICE } = {}) {
    const raw = body ? JSON.stringify(body) : "";
    const ts = String(Math.floor(Date.now() / 1000));
    const nonce = crypto.randomBytes(16).toString("hex");
    const res = await fetch(`${BASE}${path}`, {
        method, body: raw || undefined,
        headers: { "content-type": "application/json", "x-madp-timestamp": ts, "x-madp-origin": origin, "x-madp-actor": actor, "x-madp-nonce": nonce, "x-madp-signature": sign(SECRET, { nonce, timestamp: ts, method, path, origin, actor, body: raw }) },
    });
    return { status: res.status, json: await res.json().catch(() => ({})) };
}
// fetch() drops a custom Host header, and Host is the brand
const site = (path, host = MFR) => new Promise((resolve, reject) => {
    http.get({ host: "127.0.0.1", port: server.address().port, path, headers: { host, "x-real-ip": "10.9.0.1" } }, (res) => {
        let t = ""; res.on("data", (c) => { t += c; });
        res.on("end", () => { let json = {}; try { json = JSON.parse(t); } catch { /* not JSON */ } resolve({ status: res.statusCode, json }); });
    }).on("error", reject);
});
const body = ["We keep your answers private.", { h2: "Who we are" }, { ul: ["One", "Two"] }, { table: { head: ["Cookie", "Why"], rows: [["sid", "Signs you in"]] } }, "Write to privacy@example.invalid or see https://www.myfrequentrewards.com/privacy"];

test("only blocks are stored: HTML-looking objects and unknown shapes are refused", async () => {
    for (const bad of [[{ html: "<script>alert(1)</script>" }], [{ h2: "x", ul: ["y"] }], [], "text", [{ table: { head: ["a", "b"], rows: [["only one"]] } }], [{ ul: [{ $gt: "" }] }]]) {
        const r = await admin("POST", "/api/admin/v1/content", { key: "about-us", title: "About", body: bad });
        assert.equal(r.status, 400, JSON.stringify(bad));
        assert.equal(r.json.code, "invalid_value");
    }
    assert.equal((await admin("POST", "/api/admin/v1/content", { key: "Bad Key!", title: "About", body })).status, 400);
});

test("a legal page needs four eyes; the site shows only what is published", async () => {
    const made = await admin("POST", "/api/admin/v1/content", { key: "privacy", kind: "page", title: "Privacy policy", body });
    assert.equal(made.status, 200, JSON.stringify(made.json));
    const id = made.json.data.id;
    assert.equal(made.json.data.after.kind, "legal", "privacy is always legal, whatever kind is sent");
    assert.equal((await site("/api/v1/content/privacy")).status, 404, "nothing is published yet");

    const early = await admin("POST", `/api/admin/v1/content/${id}/publish`, null, { actor: BOB });
    assert.equal(early.json.code, "bad_transition", "legal pages are published from review");
    assert.equal((await admin("POST", `/api/admin/v1/content/${id}/review`)).status, 200);
    const self = await admin("POST", `/api/admin/v1/content/${id}/publish`);
    assert.equal(self.json.code, "four_eyes", "the admin who asked for review can't publish");
    const ok = await admin("POST", `/api/admin/v1/content/${id}/publish`, null, { actor: BOB });
    assert.equal(ok.status, 200, JSON.stringify(ok.json));
    assert.deepEqual(ok.json.data.after, { version: 1, state: "published" });

    const pub = await site("/api/v1/content/privacy");
    assert.equal(pub.status, 200);
    assert.equal(pub.json.data.title, "Privacy policy");
    assert.equal(pub.json.data.version, 1);
    assert.deepEqual(pub.json.data.body, body);
    assert.equal((await site("/api/v1/content/privacy", T2O)).status, 404, "another brand never sees it");
    assert.equal((await site("/api/v1/content/privacy?lang=hi")).json.data.lang, "en", "falls back to English");

    // editing a draft in review sends it back to editing; the live copy is untouched until the next publish
    assert.equal((await admin("PUT", `/api/admin/v1/content/${id}`, { title: "Privacy policy (2027)" }, { actor: BOB })).status, 200);
    assert.equal((await admin("POST", `/api/admin/v1/content/${id}/review`)).status, 200);
    assert.equal((await admin("POST", `/api/admin/v1/content/${id}/publish`, null, { actor: BOB })).json.code, "four_eyes", "the last editor can't publish either");
    await admin("PUT", `/api/admin/v1/content/${id}`, { body: ["Shorter."] });
    assert.equal((await admin("GET", `/api/admin/v1/content/${id}`)).json.data.draft.state, "editing");
    assert.equal((await site("/api/v1/content/privacy")).json.data.title, "Privacy policy");
    await admin("POST", `/api/admin/v1/content/${id}/review`, null, { actor: BOB });
    await admin("PUT", `/api/admin/v1/content/${id}`, { body: ["Shorter."] }, { actor: BOB });
    await admin("POST", `/api/admin/v1/content/${id}/review`, null, { actor: BOB });
    assert.equal((await admin("POST", `/api/admin/v1/content/${id}/publish`)).status, 200);
    assert.deepEqual((await site("/api/v1/content/privacy")).json.data.body, ["Shorter."]);

    const revs = await admin("GET", `/api/admin/v1/content/${id}/revisions`);
    assert.deepEqual(revs.json.data.map((r) => [r.version, r.publishedBy]), [[2, ALICE], [1, BOB]]);
    const v1 = await admin("GET", `/api/admin/v1/content/${id}/revisions/1`);
    assert.deepEqual(v1.json.data.body, body);
    assert.equal((await admin("POST", `/api/admin/v1/content/${id}/revisions/1/restore`)).status, 200);
    assert.deepEqual((await admin("GET", `/api/admin/v1/content/${id}`)).json.data.draft.body, body, "restore puts the old text in the draft");
    assert.equal((await admin("POST", `/api/admin/v1/content/${id}/revisions/x/restore`)).status, 404);
    assert.equal((await admin("POST", `/api/admin/v1/content/${id}/discard`)).status, 200);
    assert.equal((await admin("GET", `/api/admin/v1/content/${id}`)).json.data.draft, null);
});

test("a plain page publishes straight away; list filters; duplicates and other brands", async () => {
    const r = await admin("POST", "/api/admin/v1/content", { key: "who-we-are", title: "Who we are", body: ["Hello."] });
    assert.equal(r.json.data.after.kind, "page");
    assert.equal((await admin("POST", `/api/admin/v1/content/${r.json.data.id}/publish`)).status, 200);
    assert.equal((await site("/api/v1/content/who-we-are")).json.data.title, "Who we are");
    assert.equal((await admin("POST", "/api/admin/v1/content", { key: "who-we-are", title: "Again", body: ["x"] })).json.code, "duplicate");
    const hi = await admin("POST", "/api/admin/v1/content", { key: "who-we-are", lang: "hi", title: "हम कौन हैं", body: ["नमस्ते"] });
    assert.equal(hi.status, 200);

    assert.deepEqual((await admin("GET", "/api/admin/v1/content?kind=legal")).json.data.map((p) => p.key), ["privacy"]);
    assert.equal((await admin("GET", "/api/admin/v1/content?state=unpublished")).json.data.length, 1);
    assert.equal((await admin("GET", "/api/admin/v1/content?lang=hi")).json.data[0].draft.state, "editing");
    assert.equal((await admin("GET", "/api/admin/v1/content", null, { origin: T2O })).json.data.length, 0);
    assert.equal((await admin("GET", `/api/admin/v1/content/${r.json.data.id}`, null, { origin: T2O })).status, 404, "an id from another brand is not found");
    const unsigned = await fetch(`${BASE}/api/admin/v1/content`);
    assert.equal(unsigned.status, 401);
});

test.after(async () => { server.close(); await mongoose.connection.db.dropDatabase(); await mongoose.disconnect(); });

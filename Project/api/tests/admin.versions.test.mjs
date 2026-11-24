// Panel admin API: question bank versions (draft, review, published) and translations.
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_admin_versions node --test --test-force-exit tests/admin.versions.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import dns from "node:dns";

dns.resolveMx = (domain, cb) => cb(null, [{ exchange: `mx.${domain}`, priority: 10 }]);
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

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_admin_versions");
await mongoose.connection.db.dropDatabase();
const app = express();
app.use([setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;
const ALICE = "11111111-2222-4333-8444-555555555555";
const BOB = "66666666-2222-4333-8444-555555555555";
async function admin(method, path, body, { origin = MFR, actor = ALICE } = {}) {
    const raw = body ? JSON.stringify(body) : "";
    const ts = String(Math.floor(Date.now() / 1000));
    const res = await fetch(`${BASE}${path}`, { method, body: raw || undefined, headers: { "content-type": "application/json", "x-madp-timestamp": ts, "x-madp-origin": origin, "x-madp-actor": actor, "x-madp-signature": sign(SECRET, { timestamp: ts, method, path, origin, actor, body: raw }) } });
    return { status: res.status, json: await res.json().catch(() => ({})) };
}
const bank = {
    Question: [
        { name: "q_city", label: "Which city do you live in?", type: "radio", category: ["b2c"] },
        { name: "q_pets", label: "Do you have pets?", type: "radio", category: ["b2c"] },
    ],
    Option: [
        { question: "q_pets", value: "dog", label: "Dog" },
        { question: "q_pets", value: "cat", label: "Cat" },
    ],
    Profile: [{ slug: "basic", name: "Basic", category: "b2c", pages: [["Basic", "q_city", "q_pets"]] }],
};

test("versions: draft, review, publish by a second admin; the next draft shows the diff", async () => {
    assert.equal((await admin("POST", "/api/admin/v1/qb/import?dryRun=0", bank)).status, 200);
    const d1 = await admin("POST", "/api/admin/v1/qb/versions", { note: "First release" });
    assert.equal(d1.status, 200, JSON.stringify(d1.json));
    assert.equal(d1.json.data.number, 1);
    assert.equal(d1.json.data.diff.questions.added, 2);
    assert.equal((await admin("POST", "/api/admin/v1/qb/versions", {})).status, 409, "one open version at a time");
    assert.equal((await admin("POST", "/api/admin/v1/qb/versions/1/publish")).status, 409, "must be reviewed first");
    await admin("POST", "/api/admin/v1/qb/versions/1/review");
    const self = await admin("POST", "/api/admin/v1/qb/versions/1/publish");
    assert.equal(self.json.code, "four_eyes");
    const pub = await admin("POST", "/api/admin/v1/qb/versions/1/publish", null, { actor: BOB });
    assert.deepEqual(pub.json.data.after, { status: "published" });

    await admin("PUT", "/api/admin/v1/questions/q_city", { label: "Which city or town do you live in?" });
    await admin("POST", "/api/admin/v1/questions", { name: "q_car", label: "Do you drive?", type: "radio", category: ["b2c"] });
    const d2 = (await admin("POST", "/api/admin/v1/qb/versions", { note: "Wording" })).json.data;
    assert.equal(d2.number, 2);
    assert.equal(d2.diff.from, 1);
    assert.equal(d2.diff.questions.added, 1);
    assert.equal(d2.diff.questions.changed, 1);
    const list = (await admin("GET", "/api/admin/v1/qb/versions")).json.data;
    assert.deepEqual(list.map((v) => [v.number, v.status]), [[2, "draft"], [1, "published"]]);
    const v1 = (await admin("GET", "/api/admin/v1/qb/versions/1")).json.data;
    assert.equal(v1.Question.find((q) => q.name === "q_city").label, "Which city do you live in?", "a version keeps its own snapshot");
    await admin("POST", "/api/admin/v1/qb/versions/2/discard");
    assert.equal((await admin("POST", "/api/admin/v1/qb/versions/2/review")).status, 409);
    // Versions are per brand.
    assert.deepEqual((await admin("GET", "/api/admin/v1/qb/versions", null, { origin: T2O })).json.data, []);
});

test("translations: set per language, missing report, kept in export and import", async () => {
    const before = (await admin("GET", "/api/admin/v1/qb/translations/missing?lang=hi")).json.data;
    assert.equal(before.questions, 3);
    assert.equal(before.missing, 3);
    const r = await admin("PUT", "/api/admin/v1/questions/q_pets/translations", { lang: "hi", label: "क्या आपके पास पालतू जानवर हैं?", options: { dog: "कुत्ता", cat: "बिल्ली" } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.data.optionsSet, 2);
    const after = (await admin("GET", "/api/admin/v1/qb/translations/missing?lang=hi")).json.data;
    assert.equal(after.missing, 2);
    assert.ok(!after.items.some((x) => x.name === "q_pets"));
    assert.equal((await admin("PUT", "/api/admin/v1/questions/q_pets/translations", { lang: "en", label: "x" })).status, 400);
    const ex = (await admin("GET", "/api/admin/v1/qb/export")).json.data;
    assert.equal(ex.Question.find((q) => q.name === "q_pets").translations.hi.label, "क्या आपके पास पालतू जानवर हैं?");
    assert.equal(ex.Option.find((o) => o.value === "dog").translations.hi, "कुत्ता");
    const again = (await admin("POST", "/api/admin/v1/qb/import", ex)).json.data;
    assert.equal(again.questions.changes + again.options.changes, 0);
});

test.after(async () => { server.close(); await mongoose.disconnect(); });

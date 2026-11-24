// Panel admin API (/api/admin/v1): question bank and profiles (super admin spec modules 3 and 4).
// Uses the Teen Panel bank (scripts/teen-bank-2026-11/bank.json) as the import file.
//
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_admin_qb_test node --test --test-force-exit tests/admin.qb.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import dns from "node:dns";
import fs from "node:fs";

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
const { teenBlocked } = await import("../app/admin/qb.js");

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_admin_qb_test");
await mongoose.connection.db.dropDatabase();
const app = express();
app.use([express.json({ type: (req) => !req.url.startsWith("/api/admin/") && /json/i.test(req.headers["content-type"] || "") }), setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;
const ACTOR = "11111111-2222-4333-8444-555555555555";
async function admin(method, path, body, origin = MFR) {
    const raw = body ? JSON.stringify(body) : "";
    const ts = String(Math.floor(Date.now() / 1000));
    const res = await fetch(`${BASE}${path}`, {
        method, body: raw || undefined,
        headers: { "content-type": "application/json", "x-madp-timestamp": ts, "x-madp-origin": origin, "x-madp-actor": ACTOR, "x-madp-signature": sign(SECRET, { timestamp: ts, method, path, origin, actor: ACTOR, body: raw }) },
    });
    return { status: res.status, json: await res.json().catch(() => ({})) };
}
const db = mongoose.connection.db;

// The teen bank in today's export shape (Profile / Question / Option).
const bank = JSON.parse(fs.readFileSync(new URL("../scripts/teen-bank-2026-11/bank.json", import.meta.url), "utf8"));
const file = { Profile: [], Question: [], Option: [] };
const seenQ = new Set();
for (const p of bank.profiles) {
    file.Profile.push({ slug: p.slug, name: p.name, category: bank.category, icon: p.icon, sortOrder: p.sortOrder, pages: [[p.name, ...p.questions.map((q) => q.name)]] });
    for (const q of p.questions) {
        if (seenQ.has(q.name)) continue;
        seenQ.add(q.name);
        file.Question.push({ name: q.name, label: q.label, type: q.type, category: [bank.category], parent: q.parent || "", isRequired: q.isRequired });
        for (const o of q.options || []) file.Option.push({ question: q.name, label: o.label, value: o.value, sortOrder: o.sortOrder, isExclusive: o.isExclusive, parentValue: o.parentValue });
    }
}

test("teen guardrail keywords: the real teen bank passes, blocked subjects are caught", () => {
    for (const q of file.Question) assert.equal(teenBlocked(q), null, q.name);
    for (const label of ["Do you smoke cigarettes?", "How often do you drink alcohol?", "Which vape brands do you know?", "Do you have a health condition?", "Which make-up brands do you use?", "Which vehicle does your family own?"])
        assert.ok(teenBlocked({ name: "x", label }), label);
    assert.ok(teenBlocked({ name: "x", label: "Neutral wording", topic: "alcohol" }));
});

test("import: dry run reports adds and counts and writes nothing; apply writes; second run is a no-op", async () => {
    const dry = await admin("POST", "/api/admin/v1/qb/import", file);
    assert.equal(dry.status, 200, JSON.stringify(dry.json));
    const r = dry.json.data;
    assert.equal(r.dryRun, true);
    assert.equal(r.ok, true, JSON.stringify(r.errors));
    assert.equal(r.counts.byCategory["b2c-minor"], file.Question.length);
    assert.equal(r.questions.adds, file.Question.length);
    assert.equal(r.profiles.adds, 23);
    assert.equal(r.questions.duplicates, 0);
    assert.equal(await db.collection("Question").countDocuments(), 0);

    const run = await admin("POST", "/api/admin/v1/qb/import?dryRun=0", file);
    assert.equal(run.status, 200, JSON.stringify(run.json));
    assert.equal(await db.collection("Question").countDocuments({ origin: MFR }), file.Question.length);
    assert.equal(await db.collection("Profile").countDocuments({ origin: MFR }), 23);
    assert.equal(await db.collection("Question").countDocuments({ origin: T2O }), 0, "import is for one brand only");

    const again = await admin("POST", "/api/admin/v1/qb/import", file);
    assert.equal(again.json.data.questions.adds, 0);
    assert.equal(again.json.data.questions.changes, 0);
    assert.equal(again.json.data.options.adds, 0);
    assert.equal(again.json.data.profiles.unchanged, 23);
});

test("export has the same rows and counts as the import, and round-trips", async () => {
    const ex = await admin("GET", "/api/admin/v1/qb/export");
    assert.equal(ex.json.data.Question.length, file.Question.length);
    assert.equal(ex.json.data.Option.length, file.Option.length);
    assert.equal(ex.json.data.Profile.length, 23);
    assert.equal(ex.json.data.counts.byCategory["b2c-minor"], file.Question.length);
    assert.ok(!("origin" in ex.json.data.Question[0]) && !("_id" in ex.json.data.Question[0]));
    const back = await admin("POST", "/api/admin/v1/qb/import", ex.json.data);
    assert.equal(back.json.data.questions.adds + back.json.data.questions.changes, 0);
    assert.equal(back.json.data.options.adds + back.json.data.options.changes, 0);
});

test("import refuses duplicates, broken references and teen-blocked questions", async () => {
    const bad = structuredClone(file);
    bad.Question.push({ ...bad.Question[0] });
    bad.Question.push({ name: "teen_alcohol", label: "How often do you drink alcohol?", type: "radio", category: ["b2c-minor"] });
    bad.Profile[0].pages[0].push("no_such_question");
    const r = (await admin("POST", "/api/admin/v1/qb/import", bad)).json.data;
    assert.equal(r.ok, false);
    assert.equal(r.questions.duplicates, 1);
    assert.ok(r.teenRefused.some((x) => x.startsWith("teen_alcohol")));
    assert.ok(r.errors.some((e) => e.includes("no_such_question")));
    assert.equal((await admin("POST", "/api/admin/v1/qb/import?dryRun=0", bad)).status, 409);
    assert.equal(await db.collection("Question").countDocuments({ name: "teen_alcohol" }), 0);
});

test("teen guardrails on the editor: no blocked question in a teen profile, refused on the server", async () => {
    assert.equal((await admin("POST", "/api/admin/v1/questions", { name: "smoke_freq", label: "How often do you smoke?", type: "radio", category: ["b2c-minor"] })).status, 422);
    const adult = await admin("POST", "/api/admin/v1/questions", { name: "smoke_freq", label: "How often do you smoke?", type: "radio", category: ["b2c"] });
    assert.equal(adult.status, 200, JSON.stringify(adult.json));
    const teen = (await admin("GET", "/api/admin/v1/profiles?category=b2c-minor")).json.data[0];
    const put = await admin("PUT", `/api/admin/v1/profiles/${teen.id}`, { pages: [["The basics", "d06", "smoke_freq"]] });
    assert.equal(put.status, 422);
    assert.equal(put.json.code, "teen_guardrail");
    // A teen question can't be reworded into a blocked one either.
    assert.equal((await admin("PUT", "/api/admin/v1/questions/d06", { label: "Do you drink beer?" })).status, 422);
    assert.equal((await admin("PUT", "/api/admin/v1/questions/smoke_freq", { category: ["b2c", "b2c-minor"] })).status, 422);
});

test("question and options editor return before and after; options are retired, not removed", async () => {
    const r = await admin("PUT", "/api/admin/v1/questions/smoke_freq", { adminLabel: "Smoking frequency", isRequired: false });
    assert.deepEqual(r.json.data.after, { adminLabel: "Smoking frequency", isRequired: false });
    assert.equal((await admin("PUT", "/api/admin/v1/questions/smoke_freq", { type: "banana" })).status, 400);
    const o1 = await admin("PUT", "/api/admin/v1/questions/smoke_freq/options", { options: [{ value: "daily", label: "Daily" }, { value: "never", label: "Never", isExclusive: true }] });
    assert.equal(o1.json.data.added, 2);
    const o2 = await admin("PUT", "/api/admin/v1/questions/smoke_freq/options", { options: [{ value: "never", label: "Never", isExclusive: true }, { value: "weekly", label: "Weekly", countries: ["IN", "us", "bad1"] }] });
    assert.equal(o2.json.data.retired, 1);
    const daily = await db.collection("Option").findOne({ question: "smoke_freq", value: "daily" });
    assert.equal(daily.isDeleted, true);
    const q = (await admin("GET", "/api/admin/v1/questions/smoke_freq")).json.data;
    assert.deepEqual(q.options.map((o) => o.value), ["never", "weekly"]);
    assert.deepEqual(q.options[1].countries, ["in", "us"]);
    assert.equal((await admin("PUT", "/api/admin/v1/questions/smoke_freq/options", { options: [{ value: "a", label: "A" }, { value: "a", label: "A2" }] })).status, 400);
    assert.equal((await admin("POST", "/api/admin/v1/questions", { name: "smoke_freq", label: "Again", type: "radio", category: ["b2c"] })).status, 409);
});

test("show-when rules checker finds rules pointing at missing questions or options", async () => {
    const before = (await admin("GET", "/api/admin/v1/qb/rules/check")).json.data.broken;
    await admin("POST", "/api/admin/v1/questions", { name: "smoke_brand", label: "Which brand?", type: "radio", category: ["b2c"], parent: "smoke_freq" });
    await admin("PUT", "/api/admin/v1/questions/smoke_brand/options", { options: [{ value: "x", label: "X", parentValue: ["daily", "weekly"] }] });
    await db.collection("Question").insertOne({ name: "orphan_child", label: "Orphan", type: "radio", category: ["b2c"], parent: "gone_parent", origin: MFR, isDeleted: false });
    const r = (await admin("GET", "/api/admin/v1/qb/rules/check")).json.data;
    assert.equal(r.broken, before + 2);
    const sb = r.rules.find((x) => x.question === "smoke_brand");
    assert.deepEqual(sb.values, ["daily"]); // "daily" was retired above; "weekly" is still offered
    assert.ok(r.rules.find((x) => x.question === "orphan_child" && x.problem.includes("does not exist")));
});

test("profiles: order, on/off, points; points are paid from the profile setting", async () => {
    const list = (await admin("GET", "/api/admin/v1/profiles?category=b2c-minor")).json.data;
    assert.equal(list.length, 23);
    const p = list[1];
    const r = await admin("PUT", `/api/admin/v1/profiles/${p.id}`, { sortOrder: 99, isActive: false, points: 80, estimatedMinutes: 4 });
    assert.deepEqual(r.json.data.after, { sortOrder: 99, isActive: false, points: 80, estimatedMinutes: 4 });
    assert.equal((await admin("PUT", `/api/admin/v1/profiles/${p.id}`, { points: -5 })).status, 400);
    const after = (await admin("GET", "/api/admin/v1/profiles?category=b2c-minor")).json.data;
    assert.equal(after.at(-1).id, p.id);
    assert.equal(after.at(-1).isActive, false);
    // Another brand can't see or change it.
    assert.equal((await admin("PUT", `/api/admin/v1/profiles/${p.id}`, { points: 1 }, T2O)).status, 404);
});

test("completion report: started, finished and the drop-off question", async () => {
    const prof = (await admin("GET", "/api/admin/v1/profiles?category=b2c-minor")).json.data.find((x) => x.slug === "teen-basic");
    const pdoc = await db.collection("Profile").findOne({ slug: "teen-basic", origin: MFR });
    const asked = pdoc.pages[0].slice(1);
    const mk = async (n) => String((await db.collection("User").insertOne({ origin: MFR, category: "b2c-minor", name: { first: `T${n}` }, mail: `t${n}@example.invalid`, isDeleted: false })).insertedId);
    const [a, b, c] = [await mk(1), await mk(2), await mk(3)];
    await mk(4); // never started
    const ans = (user, qs) => db.collection("Answer").insertMany(qs.map((q) => ({ origin: MFR, user, question: q, answer: ["x"], isDeleted: false })));
    await ans(a, asked);
    await ans(b, asked.slice(0, 1));
    await ans(c, asked.slice(0, 1));
    const r = (await admin("GET", "/api/admin/v1/profiles/completion?category=b2c-minor")).json.data.profiles.find((x) => x.slug === prof.slug);
    assert.equal(r.members, 4);
    assert.equal(r.started, 3);
    assert.equal(r.finished, 1);
    assert.deepEqual(r.dropOff, { question: asked[1], members: 2 });
});

test.after(async () => { server.close(); await mongoose.disconnect(); });

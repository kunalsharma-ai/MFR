// Panel admin API, super admin spec step 6: T2O, MFR and MHO on one backend, and no brand ever sees another's data.
//
// Every brand gets the same DEMO data, each tagged with its own marker. Then every GET route is called as every brand,
// and every write route is tried with another brand's ids. A marker or id of another brand in a response is a leak.
//
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_admin_crossbrand node --test --test-force-exit tests/admin.crossbrand.test.mjs
import test from "node:test";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import dns from "node:dns";

dns.resolveMx = (domain, cb) => cb(null, [{ exchange: `mx.${domain}`, priority: 10 }]);
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const SECRET = "test-admin-secret-0123456789abcdef";
process.env.MADP_ADMIN_API_SECRETS = SECRET;

const { default: mongoose } = await import("mongoose");
const { default: express } = await import("express");
const { default: cookieParser } = await import("cookie-parser");
const { default: appRoute } = await import("../app/routes/index.js");
const { setOrigin } = await import("../app/utils/index.js");
const { sign } = await import("../app/admin/auth.js");
const Models = await import("../app/model/index.js");

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_admin_crossbrand");
await mongoose.connection.db.dropDatabase();
const app = express();
app.use([express.json({ type: (req) => !req.url.startsWith("/api/admin/") && /json/i.test(req.headers["content-type"] || "") }), cookieParser(), setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;
const BRANDS = { t2o: "www.turn2opinion.com", mfr: "www.myfrequentrewards.com", mho: "www.myhealthopinions.com" };
process.env.MADP_ADMIN_API_ORIGINS = Object.values(BRANDS).join(",");
const ALICE = "11111111-2222-4333-8444-555555555555";
const V1 = "/api/admin/v1";

async function admin(method, path, body, origin) {
    const raw = body ? JSON.stringify(body) : "";
    const ts = String(Math.floor(Date.now() / 1000));
    const nonce = crypto.randomBytes(16).toString("hex");
    const res = await fetch(`${BASE}${path}`, { method, body: raw || undefined, headers: { "content-type": "application/json", "x-madp-timestamp": ts, "x-madp-origin": origin, "x-madp-actor": ALICE, "x-madp-nonce": nonce, "x-madp-signature": sign(SECRET, { nonce, timestamp: ts, method, path, origin, actor: ALICE, body: raw }) } });
    const text = await res.text();
    let json = {};
    try { json = JSON.parse(text); } catch { /* not JSON */ }
    return { status: res.status, json, text };
}
const db = mongoose.connection.db;
const ago = (d) => new Date(Date.now() - d * 86400000);
const yearsAgo = (y) => { const d = new Date(); d.setUTCFullYear(d.getUTCFullYear() - y); return d; };
const base = (origin, d = 1) => ({ origin, isActive: true, isDeleted: false, createdAt: ago(d), updatedAt: ago(d) });
const ok = (r, what) => { assert.ok(r.status < 300 && r.json.status === "success", `${what}: ${r.status} ${r.text.slice(0, 300)}`); return r.json.data; };

/** The same DEMO data for one brand. Every text field the console shows carries the brand's marker. */
async function seed(code) {
    const origin = BRANDS[code];
    const tag = `zz${code}zz`;
    const ids = {};
    const member = async (first, extra = {}) => (await db.collection("User").insertOne({ ...base(origin, 3), name: { first: `${first}${tag}`, last: "Demo" }, mail: `${first.toLowerCase()}.${code}@example.invalid`, category: "b2c", isVerified: { email: "verified" }, address: [{ country: "india" }], memberStatus: "active", lastActivityAt: ago(1), qualityScore: 100, terms: ["terms"], ...extra })).insertedId;
    ids.member = await member("Asha");
    ids.low = await member("Ravi", { category: "b2b", qualityScore: 40, referredBy: `REF-${code}` });
    ids.teen = await member("Tina", { category: "b2c-minor", dob: yearsAgo(15) });
    ids.question = `q_${code}`;
    ok(await admin("POST", `${V1}/questions`, { name: ids.question, label: `Question ${tag}`, type: "radio", category: ["b2c"], options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] }, origin), "question");
    ids.profile = (await db.collection("Profile").insertOne({ isActive: true, isDeleted: false, origin, slug: `about-${code}`, name: `About you ${tag}`, category: ["b2c"], pages: [[ids.question]] })).insertedId;
    await db.collection("Answer").insertOne({ origin, user: String(ids.member), question: ids.question, answer: "yes" });
    ids.survey = ok(await admin("POST", `${V1}/surveys`, { name: `Survey ${tag}`, slug: `survey-${code}`, category: "b2c", source: "demo", points: 100, loi: 10 }, origin), "survey").id;
    ids.response = (await db.collection("Response").insertOne({ ...base(origin), user: ids.member, status: "complete", points: 100, survey: { _id: new mongoose.Types.ObjectId(ids.survey), slug: `survey-${code}`, name: `Survey ${tag}` } })).insertedId;
    ids.audience = ok(await admin("POST", `${V1}/audiences`, { name: `Audience ${tag}`, filter: { countries: ["india"] } }, origin), "audience").id;
    ids.adjustment = ok(await admin("POST", `${V1}/members/${ids.member}/points`, { points: 60000, reasonCode: "migration", note: `Carried over ${tag}`, needsApproval: true }, origin), "points").adjustment.id;
    ids.hold = ok(await admin("POST", `${V1}/points/holds`, { member: String(ids.member), source: "survey", entry: String(ids.response), reason: `Checking ${tag}` }, origin), "hold").id;
    ids.ticket = (await db.collection("SupportTicket").insertOne({ ...base(origin), ticketNo: `T-${code}`, subject: `Ticket ${tag}`, description: "Help", category: "payments", status: "new", issueRaisedBy: { name: "Asha Demo", email: `asha.${code}@example.invalid` } })).insertedId;
    ids.message = ok(await admin("POST", `${V1}/messages`, { title: `Message ${tag}`, body: "Three new studies are waiting for you." }, origin), "message").id;
    ids.help = ok(await admin("POST", `${V1}/help`, { slug: `help-${code}`, topic: "rewards", title: `Help ${tag}`, body: ["Usually within 5 days."], types: ["consumer"] }, origin), "help").id;
    ids.item = `item-${code}`;
    ok(await admin("POST", `${V1}/rewards/catalogue`, { key: ids.item, kind: "paypal", title: `Reward ${tag}`, points: 15000, value: 15, audience: ["consumer"] }, origin), "catalogue");
    ids.redemption = (await db.collection("Redemption").insertOne({ ...base(origin), user: ids.member, reference: `R-${code}`, item: { key: ids.item, kind: "paypal", title: `Reward ${tag}` }, points: 15000, status: "requested", open: true, history: [] })).insertedId;
    ids.draw = ok(await admin("POST", `${V1}/draws`, { month: "2026-12", title: `Draw ${tag}`, prize: "A demo prize", ticketPoints: 100, closesAt: new Date(Date.now() + 20 * 86400000).toISOString(), rulesUrl: "https://example.invalid/rules", countries: ["india"] }, origin), "draw").id;
    const soon = (d) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
    ids.offer = ok(await admin("POST", `${V1}/offers`, { title: `Offer ${tag}`, multiplier: 2, startsAt: soon(10), endsAt: soon(12) }, origin), "offer").id;
    ok(await admin("PUT", `${V1}/prize-machines/consumer`, { title: `Machine ${tag}`, prizes: [{ label: `Prize ${tag}`, kind: "points", points: 50, weight: 1 }], reason: "First machine for the test" }, origin), "prize machine");
    ids.task = ok(await admin("POST", `${V1}/engagement/tasks`, { kind: "idea", title: `Task ${tag}`, audience: ["teen"], points: 20 }, origin), "task").id;
    ids.idea = (await db.collection("TaskEntry").insertOne({ ...base(origin), task: new mongoose.Types.ObjectId(ids.task), user: ids.teen, text: `Idea ${tag}`, status: "submitted" })).insertedId;
    ids.story = ok(await admin("POST", `${V1}/engagement/stories`, { type: "story", title: `Story ${tag}`, summary: "Less sugar, clearer labels.", audience: ["consumer"] }, origin), "story").id;
    await db.collection("StreakDay").insertOne({ ...base(origin), user: ids.member, day: ago(1).toISOString().slice(0, 10) });
    const guardian = await Models.TeenGuardian.create({ origin, relation: "mother", email: `parent.${code}@example.invalid`, name: { first: `Parent${tag}`, last: "Demo" } });
    ids.registration = (await Models.TeenRegistration.create({ origin, reference: `TR-${code}`, idempotencyKey: `k-${code}`, status: "manual_review", teen: ids.teen, guardian: guardian._id, history: [{ status: "manual_review", at: new Date(), by: "system" }] }))._id;
    ids.dataRequest = (await db.collection("DataRequest").insertOne({ ...base(origin), user: ids.member, kind: "delete", status: "requested", open: true, reason: `Leaving ${tag}`, history: [{ status: "requested", by: "member", at: new Date() }] })).insertedId;
    ids.expert = (await db.collection("ExpertVerification").insertOne({ ...base(origin), user: ids.low, status: "requested", linkedin: `https://www.linkedin.com/in/ravi-${code}`, workDomain: `${code}-demo.example`, jobTitle: `Buyer ${tag}`, history: [] })).insertedId;
    for (const k of Object.keys(ids)) ids[k] = String(ids[k]);
    return { code, origin, tag, ids };
}

const brands = [];
for (const code of Object.keys(BRANDS)) brands.push(await seed(code));
const others = (b) => brands.filter((x) => x !== b);
// Ids that a leak would show. Question names and item keys are the same kind of key in every brand, so only
// database ids and markers count.
const leakOf = (b, text) => {
    for (const o of others(b)) {
        if (text.includes(o.tag)) return `${o.code} marker`;
        for (const [k, v] of Object.entries(o.ids)) if (/^[0-9a-f]{24}$/.test(v) && text.includes(v)) return `${o.code} ${k} id`;
        if (text.includes(`@example.invalid`) && text.includes(`.${o.code}@`)) return `${o.code} e-mail`;
    }
    return null;
};

const LISTS = (b) => [
    "/members", "/members?q=asha", `/members/${b.ids.member}`, `/members/${b.ids.member}/ledger`, `/members/${b.ids.member}/quality`,
    "/qb/export", "/qb/rules/check", "/questions", `/questions/${b.ids.question}`, "/qb/versions", "/qb/translations/missing?lang=hi",
    "/profiles", "/profiles/completion", "/segments", "/audiences",
    "/surveys", `/surveys/${b.ids.survey}`, `/surveys/${b.ids.survey}/responses`,
    "/points/approvals?status=all", "/points/holds", "/quality/tiers", "/quality/review", "/referrals/fraud", "/experts?status=all", `/experts/${b.ids.expert}`,
    "/tickets?status=open_all", `/tickets/${b.ids.ticket}`, "/messages", `/messages/${b.ids.message}`, "/help", `/help/${b.ids.help}`,
    "/switches", "/rewards/catalogue", "/redemptions", `/redemptions/${b.ids.redemption}`, "/draws", "/offers",
    "/prize-machines", "/prize-machines/consumer/plays",
    "/engagement/tasks", "/engagement/ideas", "/engagement/stories", "/engagement/streaks",
    "/teens/registrations", "/teens", `/teens/${b.ids.teen}`, "/data-requests", `/data-requests/${b.ids.dataRequest}`,
    "/reports", ...["panel_health", "signup_funnel", "teen_pipeline", "profile_completion", "survey_performance", "points_liability", "redemptions", "quality", "referrals", "support", "engagement"].map((n) => `/reports/${n}`),
];

test("every GET route answers for every brand and never shows another brand's data", async () => {
    const own = new Set();
    for (const b of brands) {
        for (const p of LISTS(b)) {
            const r = await admin("GET", `${V1}${p}`, null, b.origin);
            assert.ok(r.status < 300, `${b.code} GET ${p}: ${r.status} ${r.text.slice(0, 300)}`);
            const leak = leakOf(b, r.text);
            assert.equal(leak, null, `${b.code} GET ${p} shows ${leak}`);
            if (r.text.includes(b.tag) || Object.values(b.ids).some((v) => /^[0-9a-f]{24}$/.test(v) && r.text.includes(v))) own.add(`${b.code} ${p.split("?")[0].replace(/[0-9a-f]{24}/, ":id").replace(/q_[a-z0-9]+/, ":name")}`);
        }
    }
    // The seed must reach the screens, or the test proves nothing: each brand sees its own data on the main lists.
    for (const b of brands)
        for (const p of ["/members", "/questions", "/profiles", "/surveys", "/audiences", "/points/approvals", "/points/holds", "/quality/review", "/experts", "/tickets", "/messages", "/help", "/rewards/catalogue", "/redemptions", "/draws", "/offers", "/prize-machines", "/engagement/tasks", "/engagement/ideas", "/engagement/stories", "/teens/registrations", "/data-requests"])
            assert.ok(own.has(`${b.code} ${p}`), `${b.code} sees its own data on ${p}`);
});

test("another brand's id is not found, for reads and for every write", async () => {
    const [t2o, mfr, mho] = brands;
    for (const [me, them] of [[mfr, mho], [mho, t2o], [t2o, mfr]]) {
        const x = them.ids;
        const reads = [`/members/${x.member}`, `/members/${x.member}/ledger`, `/members/${x.member}/quality`, `/questions/${x.question}`, `/surveys/${x.survey}`, `/surveys/${x.survey}/responses`, `/tickets/${x.ticket}`, `/messages/${x.message}`, `/help/${x.help}`, `/redemptions/${x.redemption}`, `/teens/${x.teen}`, `/data-requests/${x.dataRequest}`, `/experts/${x.expert}`];
        for (const p of reads) {
            const r = await admin("GET", `${V1}${p}`, null, me.origin);
            assert.equal(r.status, 404, `${me.code} GET ${them.code}'s ${p}: ${r.status} ${r.text.slice(0, 200)}`);
        }
        const reason = "Cross-brand test, must be refused";
        const writes = [
            ["PUT", `/members/${x.member}`, { name: { first: "Changed" }, reason }],
            ["POST", `/members/${x.member}/status`, { action: "suspend", reason }],
            ["POST", `/members/${x.member}/segment`, { category: "b2b", reason }],
            ["POST", `/members/${x.member}/marketing-opt-out`, { reason }],
            ["POST", `/members/${x.member}/unmask`, { fields: ["mail"] }],
            ["POST", `/members/${x.member}/points`, { points: 10, reasonCode: "goodwill", note: reason }],
            ["POST", `/members/${x.member}/quality`, { score: 10, reason }],
            ["PUT", `/questions/${x.question}`, { label: "Changed" }],
            ["PUT", `/questions/${x.question}/options`, { options: [{ value: "a", label: "A" }] }],
            ["PUT", `/questions/${x.question}/translations`, { lang: "hi", label: "Changed" }],
            ["PUT", `/profiles/${x.profile}`, { name: "Changed" }],
            ["PUT", `/audiences/${x.audience}`, { name: "Changed", filter: {} }],
            ["POST", `/audiences/${x.audience}/count`, {}],
            ["PUT", `/surveys/${x.survey}`, { name: "Changed" }],
            ["POST", `/surveys/${x.survey}/status`, { status: "live" }],
            ["POST", `/surveys/${x.survey}/feasibility`, {}],
            ["POST", `/surveys/${x.survey}/invite`, {}],
            ["POST", `/surveys/${x.survey}/reconcile`, { completes: [] }],
            ["POST", `/points/approvals/${x.adjustment}`, { decision: "approve", note: reason }],
            ["POST", "/points/holds", { member: x.member, source: "survey", entry: x.response, reason }],
            ["POST", `/points/holds/${x.hold}/release`, {}],
            ["POST", `/tickets/${x.ticket}/reply`, { message: reason, internal: true }],
            ["POST", `/tickets/${x.ticket}/status`, { status: "resolved" }],
            ["PUT", `/tickets/${x.ticket}`, { priority: "high" }],
            ["PUT", `/messages/${x.message}`, { title: "Changed" }],
            ["POST", `/messages/${x.message}/preview`, {}],
            ["POST", `/messages/${x.message}/send`, {}],
            ["POST", `/messages/${x.message}/withdraw`, {}],
            ["PUT", `/help/${x.help}`, { title: "Changed" }],
            ["POST", `/help/${x.help}/status`, { status: "published" }],
            ["PUT", `/rewards/catalogue/${x.item}`, { title: "Changed" }],
            ["POST", `/redemptions/${x.redemption}/decision`, { decision: "reject", note: reason }],
            ["POST", `/draws/${x.draw}/run`, {}],
            ["POST", `/draws/${x.draw}/cancel`, {}],
            ["POST", `/offers/${x.offer}/end`, {}],
            ["PUT", `/engagement/tasks/${x.task}`, { title: "Changed" }],
            ["POST", `/engagement/ideas/${x.idea}`, { status: "approved" }],
            ["PUT", `/engagement/stories/${x.story}`, { title: "Changed" }],
            ["POST", `/teens/registrations/${x.registration}/approve`, { reason }],
            ["POST", `/teens/registrations/${x.registration}/cancel`, { reason }],
            ["POST", `/teens/${x.teen}/revoke-links`, { reason }],
            ["POST", `/teens/${x.teen}/graduate?dryRun=0`, { reason }],
            ["POST", `/teens/${x.teen}/close`, { reason }],
            ["POST", `/data-requests/${x.dataRequest}/decision`, { decision: "reject", note: reason }],
            ["POST", `/experts/${x.expert}/decision`, { decision: "verified" }],
        ];
        for (const [method, p, body] of writes) {
            const r = await admin(method, `${V1}${p}`, body, me.origin);
            assert.ok(r.status >= 400 && r.json.status !== "success", `${me.code} ${method} ${them.code}'s ${p} was not refused: ${r.status} ${r.text.slice(0, 200)}`);
            const leak = leakOf(me, r.text);
            assert.equal(leak, null, `${me.code} ${method} ${p} error shows ${leak}`);
        }
        // A bulk restore with their id restores nothing.
        await db.collection("User").updateOne({ _id: new mongoose.Types.ObjectId(x.low) }, { $set: { memberStatus: "archived" } });
        assert.equal(ok(await admin("POST", `${V1}/members/restore`, { ids: [x.low], reason }, me.origin), "restore").restored, 0);
        assert.equal((await db.collection("User").findOne({ _id: new mongoose.Types.ObjectId(x.low) })).memberStatus, "archived");
        await db.collection("User").updateOne({ _id: new mongoose.Types.ObjectId(x.low) }, { $set: { memberStatus: "active" } });
        // Nothing of theirs changed.
        const m = await db.collection("User").findOne({ _id: new mongoose.Types.ObjectId(x.member) });
        assert.deepEqual([m.name.first.endsWith(them.tag), m.category, m.memberStatus], [true, "b2c", "active"]);
        const s = await db.collection("Survey").findOne({ _id: new mongoose.Types.ObjectId(x.survey) });
        assert.ok(s.name.endsWith(them.tag));
        assert.equal((await db.collection("PointsAdjustment").findOne({ _id: new mongoose.Types.ObjectId(x.adjustment) })).status, "pending");
        assert.equal((await db.collection("Redemption").findOne({ _id: new mongoose.Types.ObjectId(x.redemption) })).status, "requested");
        assert.equal((await db.collection("TeenRegistration").findOne({ _id: new mongoose.Types.ObjectId(x.registration) })).status, "manual_review");
        assert.equal((await db.collection("ExpertVerification").findOne({ _id: new mongoose.Types.ObjectId(x.expert) })).status, "requested");
        assert.equal((await db.collection("DataRequest").findOne({ _id: new mongoose.Types.ObjectId(x.dataRequest) })).status, "requested");
        assert.equal((await db.collection("PointsHold").findOne({ _id: new mongoose.Types.ObjectId(x.hold) })).releasedAt ?? null, null);
    }
});

test("switches, segments and archive runs stay inside the brand", async () => {
    const [t2o, mfr, mho] = brands;
    ok(await admin("PUT", `${V1}/switches/bonuses`, { on: false, reason: "Cross-brand test on MHO only" }, mho.origin), "switch");
    const on = async (b) => (await admin("GET", `${V1}/switches`, null, b.origin)).json.data.switches.find((s) => s.key === "bonuses").effective;
    assert.deepEqual([await on(t2o), await on(mfr), await on(mho)], [true, true, false]);
    const run = ok(await admin("POST", `${V1}/members/archive-run`, { months: 1, dryRun: true }, t2o.origin), "archive dry run");
    assert.equal(leakOf(t2o, JSON.stringify(run)), null);
    const count = ok(await admin("POST", `${V1}/audiences/count`, { filter: {} }, mfr.origin), "count");
    assert.equal(count.total ?? count.count, 3, "only MFR's three members are counted");
    const imp = await admin("POST", `${V1}/qb/import?dryRun=1`, { Question: [], Option: [], Profile: [] }, t2o.origin);
    assert.equal(leakOf(t2o, imp.text), null);
});

test("a brand that is not on the allow list is refused", async () => {
    const r = await admin("GET", `${V1}/members`, null, "www.example.invalid");
    assert.equal(r.status, 403);
});

test.after(async () => { server.close(); await mongoose.disconnect(); });

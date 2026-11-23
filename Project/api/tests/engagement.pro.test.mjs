// Phase 5: Professionals. Premium studies by industry/seniority, expertise + verification, statements, receipts.
import test from "node:test";
import assert from "node:assert/strict";
import { start, Models } from "./helpers/harness.mjs";
import { setConfig } from "../app/engagement/config.js";

const H = await start("mfr_eng_pro_test");
test.after(() => H.stop());
const { Answers, Survey, Response, Reward, Redemption, Story } = Models;
const PRO = { category: "b2b" };
const answer = (m, question, value) => Answers.create({ user: m.id, question, answer: [value], origin: H.ORIGIN });
const survey = (over) => Survey.create({ slug: `p-${Math.random().toString(36).slice(2)}`, name: "Study", loi: 15, points: 2000, category: "b2b", status: "active", source: "internal", origin: H.ORIGIN, ...over });

test("only Professionals can use /pro/*", async () => {
    const c = await H.member();
    for (const p of ["/pro/studies", "/pro/expertise", "/pro/statements"]) assert.equal((await H.call("GET", `/api/v1/engagement${p}`, null, c.token)).status, 403);
    const t = await H.member({ category: "b2c-minor", dob: new Date("2011-01-01") });
    assert.equal((await H.call("GET", "/api/v1/engagement/pro/studies", null, t.token)).status, 403);
});

test("premium studies: matched on industry + seniority answers; state from the member's invitation", async () => {
    setConfig({});
    const m = await H.member(PRO);
    await answer(m, "industry", "Fintech");
    await answer(m, "seniority", "Director");
    const fit = await survey({ name: "Fintech leaders", premium: { enabled: true, industries: ["fintech"], seniority: ["director", "vp"] } });
    const any = await survey({ name: "Any pro", premium: { enabled: true } });
    await survey({ name: "Healthcare", premium: { enabled: true, industries: ["healthcare"] } });
    await survey({ name: "Ordinary" });
    await Response.create({ user: m.id, survey: { slug: fit.slug, name: fit.name }, status: "invited", points: 2000, origin: H.ORIGIN });
    const r = (await H.call("GET", "/api/v1/engagement/pro/studies", null, m.token)).json.data;
    assert.deepEqual(r.facts, { industry: "fintech", seniority: "director", missing: false });
    assert.deepEqual(r.studies.map((s) => [s.name, s.state]), [["Fintech leaders", "open"], ["Any pro", "matched"]]);
    void any;

    // no answers: only studies open to everyone
    const n = await H.member(PRO);
    const r2 = (await H.call("GET", "/api/v1/engagement/pro/studies", null, n.token)).json.data;
    assert.equal(r2.facts.missing, true);
    assert.deepEqual(r2.studies.map((s) => s.name), ["Any pro"]);
});

test("premium bulk invite only reaches members whose answers fit", async () => {
    const { default: surveyController } = await import("../app/controller/Survey.js");
    const yes = await H.member({ category: "b2b-gate" });
    const no = await H.member({ category: "b2b-gate" });
    await answer(yes, "industry", "Retail");
    await answer(no, "industry", "Energy");
    const s = await survey({ category: "b2b-gate", premium: { enabled: true, industries: ["retail"] } });
    surveyController.request = { origin: H.ORIGIN, user: yes.user };
    await surveyController.bulkInvite(String(s._id), {});
    assert.deepEqual((await Response.find({ "survey.slug": s.slug }).lean()).map((r) => String(r.user)), [yes.id]);
});

test("expertise score from real parts; verification request, checks, admin decision, badge", async () => {
    setConfig({});
    const m = await H.member(PRO);
    for (let i = 0; i < 10; i++) await Response.create({ user: m.id, survey: { slug: `e${i}`, name: "E" }, status: "complete", points: 10, origin: H.ORIGIN });
    const a = (await H.call("GET", "/api/v1/engagement/pro/expertise", null, m.token)).json.data;
    const part = (k) => a.parts.find((p) => p.key === k).points;
    assert.equal(part("surveys"), 15);     // 10 of 20 x 30
    assert.equal(part("quality"), 13);     // 100/200 x 25, rounded
    assert.equal(part("verified"), 0);
    assert.equal(a.badge, false);

    const bad = await H.call("POST", "/api/v1/engagement/pro/verification", { workEmail: "me@gmail.com" }, m.token);
    assert.equal(bad.status, 422);
    assert.equal((await H.call("POST", "/api/v1/engagement/pro/verification", { linkedin: "https://example.com/me" }, m.token)).status, 422);
    const ok = await H.call("POST", "/api/v1/engagement/pro/verification", { linkedin: "https://www.linkedin.com/in/jane-doe", workEmail: "jane@acme.io", jobTitle: "Head of Data" }, m.token);
    assert.equal(ok.status, 200);
    assert.equal((await H.call("POST", "/api/v1/engagement/pro/verification", { linkedin: "https://www.linkedin.com/in/jane-doe" }, m.token)).status, 409);
    const mine = (await H.call("GET", "/api/v1/engagement/pro/expertise", null, m.token)).json.data.verification;
    assert.equal(mine.status, "requested");
    assert.equal(mine.workDomain, "acme.io");
    assert.ok(!("workEmail" in mine));

    const admin = await H.member({ role: "administrator" });
    const list = (await H.call("GET", "/api/v1/engagement/admin/verifications?status=requested", null, admin.token)).json.data;
    const v = list.find((x) => String(x.user._id) === m.id);
    assert.equal(v.workEmail, "jane@acme.io");
    assert.equal((await H.call("POST", `/api/v1/engagement/admin/verifications/${v._id}`, { status: "verified" }, m.token)).status, 403);
    assert.equal((await H.call("POST", `/api/v1/engagement/admin/verifications/${v._id}`, { status: "verified" }, admin.token)).status, 200);
    const after = (await H.call("GET", "/api/v1/engagement/pro/expertise", null, m.token)).json.data;
    assert.equal(after.badge, true);
    assert.equal(after.parts.find((p) => p.key === "verified").points, 15);
});

test("statements: monthly totals, a printable month, receipts only for rewards that were sent", async () => {
    setConfig({});
    const m = await H.member({ ...PRO, first: "Rita" });
    await Reward.create({ user: m.id, category: "profile", key: "profile:pro", name: "Pro profile", points: 3000, origin: H.ORIGIN });
    await Response.create({ user: m.id, survey: { slug: "st1", name: "Big <study>" }, status: "complete", points: 15000, origin: H.ORIGIN });
    const r = await Redemption.create({ user: m.id, reference: "MFR-TEST1", item: { key: "paypal-15", kind: "paypal", title: "PayPal payout", value: 15, currency: "USD" }, points: 15000, status: "approved", payout: { method: "paypal", masked: "r•••@x.com" }, origin: H.ORIGIN });
    const s = (await H.call("GET", "/api/v1/engagement/pro/statements", null, m.token)).json.data;
    assert.equal(s.length, 1);
    assert.equal(s[0].earned, 18000);
    assert.equal(s[0].spent, 15000);
    assert.equal(s[0].earnedValue, 18);
    const month = s[0].month;
    const page = await H.call("GET", `/api/v1/engagement/pro/statements/${month}.html`, null, m.token);
    assert.equal(page.status, 200);
    assert.match(page.headers.get("content-type"), /html/);
    assert.match(page.text, /Earnings statement/);
    assert.match(page.text, /Big &lt;study&gt;/);          // escaped
    assert.match(page.text, /Company details will be added here/); // no invented issuer

    assert.equal((await H.call("GET", `/api/v1/engagement/pro/receipts/${r._id}.html`, null, m.token)).status, 404);
    await Redemption.updateOne({ _id: r._id }, { $set: { status: "fulfilled", fulfilledAt: new Date() } });
    const rc = await H.call("GET", `/api/v1/engagement/pro/receipts/${r._id}.html`, null, m.token);
    assert.equal(rc.status, 200);
    assert.match(rc.text, /MFR-TEST1/);
    const other = await H.member(PRO);
    assert.equal((await H.call("GET", `/api/v1/engagement/pro/receipts/${r._id}.html`, null, other.token)).status, 404);
});

test("insight reports follow the member's industry answer", async () => {
    await Story.create({ type: "insight", title: "Retail 2026", industries: ["retail"], publishedAt: new Date(), origin: H.ORIGIN });
    await Story.create({ type: "insight", title: "All sectors", publishedAt: new Date(), origin: H.ORIGIN });
    const m = await H.member(PRO);
    await answer(m, "industry", "Retail");
    const titles = (await H.call("GET", "/api/v1/engagement/stories?type=insight", null, m.token)).json.data.map((x) => x.title).sort();
    assert.deepEqual(titles, ["All sectors", "Retail 2026"]);
    const n = await H.member(PRO);
    assert.deepEqual((await H.call("GET", "/api/v1/engagement/stories?type=insight", null, n.token)).json.data.map((x) => x.title), ["All sectors"]);
});

// Fixes from the 25 Nov 2026 sign-up QA report: points and Quality Score settled on the server (BUG-06, BUG-07),
// the Terms the member accepted read back for Settings (BUG-05), and "did the email service really send it" (BUG-03).
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_signup_qa_test node --test --test-force-exit tests/signup.qa.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { start, Models } from "./helpers/harness.mjs";
import mailOk from "../app/utils/mailOk.js";

const H = await start("mfr_signup_qa_test");
const { User, Reward, Profile, Question, Answers, Category, Response } = Models;
test.after(() => H.stop());

async function completeProfile(m, slug, names) {
    await Profile.create({ name: slug, slug, category: "b2c", pages: [names], origin: H.ORIGIN });
    for (const n of names) {
        await Question.create({ name: n, label: n, type: "radio", category: ["b2c"], origin: H.ORIGIN });
        await Answers.create({ user: m.id, question: n, answer: ["yes"], origin: H.ORIGIN });
    }
}

test("a completed profile is paid once and adds exactly +1 Quality Score, even when screens ask at the same time", async () => {
    const m = await H.member();
    await completeProfile(m, "travel-tourism", ["tt1", "tt2"]);
    const before = (await User.findById(m.id).lean()).qualityScore;
    // the header, sidebar, Profiles page and the quality call all at once
    const calls = await Promise.all([
        H.call("GET", "/api/v1/me/points", null, m.token),
        H.call("GET", "/api/v1/me/points", null, m.token),
        H.call("POST", "/api/v1/me/quality/settle", {}, m.token),
        H.call("POST", "/api/v1/me/quality/settle", {}, m.token),
        H.call("POST", "/api/v1/rewards", {}, m.token),
        H.call("GET", "/api/v1/engagement/ledger", null, m.token),
    ]);
    calls.forEach((c) => assert.equal(c.status, 200, c.text));
    assert.equal(await Reward.countDocuments({ user: m.id, key: "profile:travel-tourism" }), 1);
    const after = (await User.findById(m.id).lean()).qualityScore;
    assert.equal(after - before, 1, "one completed profile = +1");

    const pts = await H.call("GET", "/api/v1/me/points", null, m.token);
    assert.equal(pts.json.data.totalPoints, 50, "the header balance is the paid profile");
    assert.equal(pts.json.data.profilePoints, 50);
    assert.deepEqual(pts.json.data.profileRewards, [{ profile: "travel-tourism", points: 50 }]);
    // asking again changes nothing
    await H.call("POST", "/api/v1/me/quality/settle", {}, m.token);
    assert.equal((await User.findById(m.id).lean()).qualityScore, after);
});

test("a profile taken as a survey card is one quality item, not two", async () => {
    const m = await H.member();
    await completeProfile(m, "pets", ["pe1"]);
    await Response.create({ user: m.id, survey: { name: "Pets", slug: "pets" }, status: "complete", points: 80, origin: H.ORIGIN });
    await Response.create({ user: m.id, survey: { name: "Coffee", slug: "coffee" }, status: "complete", points: 100, origin: H.ORIGIN });
    const r = await H.call("POST", "/api/v1/me/quality/settle", {}, m.token);
    assert.equal(r.json.data.added, 2, "pets (profile and its survey card) + coffee");
    assert.equal(await Reward.countDocuments({ user: m.id }), 0, "a profile completed as a survey is paid by its response");
});

test("items the browser already counted (answer quality-credited) are not counted again", async () => {
    const m = await H.member();
    await completeProfile(m, "home", ["ho1"]);
    await Answers.create({ user: m.id, question: "quality-credited", answer: ["home"], origin: H.ORIGIN });
    const before = (await User.findById(m.id).lean()).qualityScore;
    const r = await H.call("POST", "/api/v1/me/quality/settle", {}, m.token);
    assert.equal(r.json.data.added, 0);
    assert.equal((await User.findById(m.id).lean()).qualityScore, before);
});

test("the browser can no longer set its own Quality Score", async () => {
    const m = await H.member();
    const before = (await User.findById(m.id).lean()).qualityScore;
    await H.call("PUT", "/api/v1/me", { qualityScore: before + 3, timezone: "UTC" }, m.token);
    assert.equal((await User.findById(m.id).lean()).qualityScore, before);
});

test("Settings > Terms: the sign-up box and the member terms read back with their dates", async () => {
    await Category.create({ name: "b2c", terms: [{ name: "terms", body: "<p>I accept the <b>Terms of Use</b></p>", isRequired: true }, { name: "marketing", body: "News", isRequired: false }], origin: H.ORIGIN });
    const m = await H.member({ extra: { termsAcceptance: { signupAt: new Date("2026-11-25T10:00:00Z") } } });
    let r = await H.call("GET", "/api/v1/me/terms", null, m.token);
    assert.equal(r.status, 200, r.text);
    const signup = r.json.data.items.find((i) => i.id === "signup");
    assert.equal(signup.accepted, true);
    assert.equal(signup.at, "2026-11-25T10:00:00.000Z");
    assert.equal(r.json.data.items.find((i) => i.id === "terms").accepted, false);

    // the consent page saves the accepted names; the server dates them
    const put = await H.call("PUT", `/api/v1/user/${m.id}`, { terms: ["terms"] }, m.token);
    assert.equal(put.status, 200, put.text);
    r = await H.call("GET", "/api/v1/me/terms", null, m.token);
    const t = r.json.data.items.find((i) => i.id === "terms");
    assert.equal(t.accepted, true);
    assert.ok(t.at, "accepted with a date");
    assert.equal(t.title, "I accept the Terms of Use");
    assert.equal(r.json.data.items.find((i) => i.id === "marketing").accepted, false);
});

test("teen verify-email link: an unknown link is refused", async () => {
    const r = await H.call("POST", `/api/v1/teen/verify-email/${"x".repeat(43)}`, {});
    assert.equal(r.status, 404);
});

test("mailOk: an email service error answer is not 'sent'", () => {
    assert.equal(mailOk({ status: 200, data: { message: "message sent" } }), true);
    assert.equal(mailOk({ status: 405, data: { headers: {} } }), false, "no mail account for the host name");
    assert.equal(mailOk({ status: 200, data: { status: "error", message: "Unable to send email." } }), false);
    assert.equal(mailOk({ status: 200, data: {} }, { status: 404, data: "not found" }), false, "the template was not found");
    assert.equal(mailOk(null), false);
});

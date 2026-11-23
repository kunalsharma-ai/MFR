// Emails: v6 lifecycle reminders (cases 1-4) and the new welcome / new-survey / birthday / new-user triggers.
import test from "node:test";
import assert from "node:assert/strict";
import { start, Models, mongoose, outbox } from "./helpers/harness.mjs";
import { setConfig } from "../app/engagement/config.js";
import { runLifecycle, caseOf, progressFields, rankOf } from "../app/engagement/lifecycle.js";
import { runBirthdays, newSurvey } from "../app/engagement/transactional.js";

const H = await start("mfr_eng_emails_test");
test.after(() => H.stop());
const old = (h) => new Date(Date.now() - h * 3600 * 1000);
const db = () => mongoose.connection.db;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const mails = (template, since = 0) => outbox().slice(since).filter((m) => m.data.template === template);

// two profiles for b2c, one question each
await db().collection("Profile").insertMany([
    { slug: "basic", name: "basic", category: "b2c", pages: [["q_basic"]], isActive: true, isDeleted: false, origin: H.ORIGIN },
    { slug: "travel", name: "travel", category: "b2c", pages: [["q_travel"]], isActive: true, isDeleted: false, origin: H.ORIGIN },
]);
await db().collection("Question").insertMany([{ name: "q_basic", parent: null }, { name: "q_travel", parent: null }]);

async function adult({ password = true, terms = true, answered = [] } = {}) {
    const m = await H.member();
    const set = { createdAt: old(72), updatedAt: old(72) };
    if (password) set.password = "$2a$10$abcdefghijklmnopqrstuuJr8mJ8b7h0bYgS2rK0bKkq2dQW8w1lK";
    if (terms) set.terms = ["consumer-terms-v1"];
    await Models.User.collection.updateOne({ _id: m.user._id }, { $set: set });
    for (const q of answered) await db().collection("Answer").insertOne({ user: m.id, question: q, answer: ["x"], updatedAt: old(72), createdAt: old(72) });
    const user = await Models.User.findById(m.user._id).lean();
    return { ...m, user };
}

test("progress figures and ranks (Profile v4.1)", () => {
    assert.equal(rankOf(0, 37).rank, "Rookie");
    assert.equal(rankOf(8, 37).rank, "Player");
    assert.equal(rankOf(37, 37).next, null);
    const p = progressFields(9, 37, ["basic"]); // 50 points per profile (what the API pays today)
    assert.equal(p.per_profile, 50);
    assert.equal(p.points, "450");
    assert.equal(p.to_dollar_points, "550");
    assert.equal(p.to_dollar_profiles, 11);
    assert.equal(p.left_usd, "$1.40");
    assert.equal(p.core_done, false);
});

test("which reminder applies", async () => {
    assert.equal((await caseOf((await adult({ password: false })).user)).id, "case1-password");
    assert.equal((await caseOf((await adult({ terms: false })).user)).id, "case2-terms");
    assert.equal((await caseOf((await adult()).user)).id, "case3-noprofiles");
    assert.equal((await caseOf((await adult({ answered: ["q_basic"] })).user)).id, "case4-partial");
    assert.equal(await caseOf((await adult({ answered: ["q_basic", "q_travel"] })).user), null);
    const teen = await H.member({ category: "b2c-minor", dob: new Date("2011-01-01") });
    assert.equal(await caseOf(teen.user.toObject()), null);
});

test("lifecycle run: off by default; then 48h spacing, max, unsubscribe, real figures", async () => {
    setConfig({});
    assert.equal((await runLifecycle({ origin: H.ORIGIN })).sent, 0);

    setConfig({ emails: { lifecycle: { enabled: true, max: 2 } } });
    const before = outbox().length;
    const r = await runLifecycle({ origin: H.ORIGIN });
    assert.ok(r.sent >= 4, JSON.stringify(r));
    const c4 = mails("case4-partial", before)[0];
    assert.equal(c4.category, "lifecycle");
    assert.equal(c4.data.p.done, 1);
    assert.equal(c4.data.p.total, 2);
    assert.match(c4.data.unsubscribe_url, /l=lifecycle/);
    const c3 = mails("case3-noprofiles", before)[0];
    assert.equal(c3.data.p.total, 2);
    assert.equal(c3.data.p.per_profile, 50);
    const c1 = mails("case1-password", before)[0];
    assert.match(c1.data.links.set_password, /\/set-password\?user=.*&code=\d{6}/);
    assert.equal(c1.data.unsubscribe_url, undefined, "case 1 is transactional");

    // nothing again within 48h
    const again = await runLifecycle({ origin: H.ORIGIN });
    assert.equal(again.sent, 0);
    // 49 hours later: sent again, then the max of 2 stops it
    const later = new Date(Date.now() + 49 * 3600 * 1000);
    assert.ok((await runLifecycle({ origin: H.ORIGIN, now: later })).sent >= 4);
    const muchLater = new Date(Date.now() + 99 * 3600 * 1000);
    const third = await runLifecycle({ origin: H.ORIGIN, now: muchLater });
    assert.equal(third.sent, 0);
    assert.ok(third.skipped.max_reached >= 4);

    // a member active in the last 48h is left alone; an unsubscribed member gets no case 3/4
    setConfig({ emails: { lifecycle: { enabled: true } } });
    const quiet = await adult();
    await Models.MemberPreference.create({ user: quiet.id, origin: H.ORIGIN, notifications: { lifecycle: false } });
    const b2 = outbox().length;
    await runLifecycle({ origin: H.ORIGIN, now: new Date(Date.now() + 200 * 3600 * 1000) });
    const to = outbox().slice(b2).map((m) => m.to);
    assert.ok(!to.includes(quiet.user.mail), "unsubscribed member gets no profile reminder");
    const b3 = outbox().length;
    const fresh = await adult();
    await db().collection("Answer").insertOne({ user: fresh.id, question: "zzz", answer: ["x"], updatedAt: new Date() });
    await runLifecycle({ origin: H.ORIGIN });
    assert.ok(!outbox().slice(b3).map((m) => m.to).includes(fresh.user.mail), "recently active member is not emailed");
    setConfig({});
});

test("welcome after set-password, only when switched on", async () => {
    setConfig({ emails: { welcome: true } });
    const m = await adult({ password: false });
    const otp = await Models.OTP.create({ user: m.user._id, channel: "email", origin: H.ORIGIN, code: "654321", expiresAt: new Date(Date.now() + 3600e3) }).catch(() => null);
    const before = outbox().length;
    const r = await H.call("PATCH", "/api/v1/user", { userID: m.id, emailOTP: "654321", password: "Str0ng!pass", confirmPassword: "Str0ng!pass" });
    if (otp) {
        assert.equal(r.status, 200, JSON.stringify(r.json));
        await wait(300);
        const w = mails("welcome", before);
        assert.equal(w.length, 1);
        assert.equal(w[0].category, "register");
    }
    setConfig({});
});

test("new survey email: off by default, respects opt-out and weekly cap", async () => {
    const a = await adult(), b = await adult(), c = await adult();
    await Models.MemberPreference.create({ user: b.id, origin: H.ORIGIN, notifications: { newSurvey: false } });
    await Models.MemberPreference.create({ user: c.id, origin: H.ORIGIN, survey: { invitesPerWeek: 0 } });
    const survey = { name: "Coffee", slug: "coffee", points: 250, loi: 10 };
    let before = outbox().length;
    setConfig({});
    newSurvey([a.id], survey, H.ORIGIN);
    await wait(300);
    assert.equal(mails("newsurvey", before).length, 0);
    setConfig({ emails: { newSurvey: true } });
    newSurvey([a.id, b.id, c.id], survey, H.ORIGIN);
    await wait(600);
    const sent = mails("newsurvey", before);
    assert.deepEqual(sent.map((m) => m.to), [a.user.mail]);
    assert.match(sent[0].data.unsubscribe_url, /l=newsurvey/);
    setConfig({});
});

test("birthday: once a year, in the member's time zone", async () => {
    setConfig({ emails: { birthday: true } });
    const today = new Date();
    const m = await H.member({ dob: new Date(Date.UTC(1990, today.getUTCMonth(), today.getUTCDate())), timezone: "UTC" });
    const before = outbox().length;
    await runBirthdays({ origin: H.ORIGIN });
    await runBirthdays({ origin: H.ORIGIN });
    const sent = mails("birthday", before).filter((x) => x.to === m.user.mail);
    assert.equal(sent.length, 1);
    setConfig({});
});

// Phase 7: My Account summary, privacy centre (export, delete request), push (off), guardian tab, prefs kept.
import test from "node:test";
import assert from "node:assert/strict";
import { start, Models } from "./helpers/harness.mjs";
import { setConfig } from "../app/engagement/config.js";
import { anniversary } from "../app/engagement/account.js";

const H = await start("mfr_eng_account_test");
test.after(() => H.stop());
const { User, Response, Reward, Answers, TeenGuardian, TeenRegistration, MemberPreference } = Models;

test("anniversary maths", () => {
    const a = anniversary(new Date("2023-11-24T00:00:00Z"), new Date("2026-11-23T12:00:00Z"));
    assert.equal(a.years, 2);
    assert.deepEqual(a.badges.filter((b) => b.earned).map((b) => b.years), [1, 2]);
    assert.equal(a.daysToNext, 1);
});

test("account summary: strength from real items, lifetime stats, identity; no payout block for Teens", async () => {
    setConfig({});
    const m = await H.member();
    await User.updateOne({ _id: m.id }, { $set: { "isVerified.email": "verified", phone: "+919800000000", address: [{ tag: "home", country: "india", city: "pune" }] } });
    await Response.create({ user: m.id, survey: { slug: "a1", name: "A" }, status: "complete", points: 100, origin: H.ORIGIN });
    await Reward.create({ user: m.id, category: "profile", key: "profile:x", name: "X", points: 50, origin: H.ORIGIN });
    const s = (await H.call("GET", "/api/v1/engagement/account/summary", null, m.token)).json.data;
    assert.deepEqual(s.items.filter((i) => i.done).map((i) => i.key).sort(), ["email", "location", "phone", "survey"]);
    assert.equal(s.strength, 65); // no profiles exist in this database, so the profiles part is 0
    assert.equal(s.stats.pointsEarned, 150);
    assert.equal(s.stats.surveys, 1);
    assert.equal(s.identity.emailVerified, true);
    assert.equal(s.payout.note, "none_yet");
    const t = await H.member({ category: "b2c-minor", dob: new Date("2011-01-01") });
    const ts = (await H.call("GET", "/api/v1/engagement/account/summary", null, t.token)).json.data;
    assert.equal(ts.payout, null);
    assert.equal(ts.stats.referrals, null);
});

test("privacy: export is a JSON download without secrets; one open delete request; cancel; admin decides", async () => {
    const m = await H.member();
    await Answers.create({ user: m.id, question: "industry", answer: ["Retail"], origin: H.ORIGIN });
    const ex = await H.call("GET", "/api/v1/engagement/privacy/export", null, m.token);
    assert.equal(ex.status, 200);
    assert.match(ex.headers.get("content-disposition"), /attachment; filename="myfrequentrewards-my-data-/);
    const d = JSON.parse(ex.text);
    assert.equal(d.account._id, m.id);
    assert.ok(!("password" in d.account));
    assert.deepEqual(d.profileAnswers.map((a) => a.question), ["industry"]);

    const r = await H.call("POST", "/api/v1/engagement/privacy/delete", { reason: "Too many emails" }, m.token);
    assert.equal(r.status, 200);
    assert.equal(r.json.data.status, "requested");
    assert.equal((await H.call("POST", "/api/v1/engagement/privacy/delete", {}, m.token)).status, 409);
    assert.equal((await H.call("POST", "/api/v1/engagement/privacy/delete/cancel", {}, m.token)).json.data.status, "cancelled");
    const r2 = await H.call("POST", "/api/v1/engagement/privacy/delete", {}, m.token);
    assert.equal(r2.status, 200);

    const admin = await H.member({ role: "administrator" });
    assert.equal((await H.call("POST", `/api/v1/engagement/admin/data-requests/${r2.json.data.id}`, { status: "done" }, admin.token)).status, 409); // approve first
    assert.equal((await H.call("POST", `/api/v1/engagement/admin/data-requests/${r2.json.data.id}`, { status: "approved" }, m.token)).status, 403);
    assert.equal((await H.call("POST", `/api/v1/engagement/admin/data-requests/${r2.json.data.id}`, { status: "approved", note: "We'll finish within 30 days" }, admin.token)).json.data.status, "approved");
    const mine = (await H.call("GET", "/api/v1/engagement/privacy/requests", null, m.token)).json.data;
    assert.equal(mine[0].note, "We'll finish within 30 days");
    assert.ok(await User.exists({ _id: m.id })); // nothing is deleted by the code
});

test("push: off by default (subscribe refused, config says off); WhatsApp off", async () => {
    setConfig({});
    const m = await H.member();
    const c = (await H.call("GET", "/api/v1/engagement/config", null, m.token)).json.data;
    assert.deepEqual(c.push, { enabled: false, publicKey: null });
    assert.deepEqual(c.whatsapp, { enabled: false });
    const s = await H.call("POST", "/api/v1/engagement/push/subscribe", { subscription: { endpoint: "https://push.example.com/abc123456789", keys: { p256dh: "x", auth: "y" } } }, m.token);
    assert.equal(s.status, 409);
    setConfig({ push: { enabled: true, vapidPublicKey: "BPUB", vapidPrivateKey: "priv" } });
    assert.equal((await H.call("POST", "/api/v1/engagement/push/subscribe", { subscription: { endpoint: "http://insecure", keys: {} } }, m.token)).status, 422);
    assert.equal((await H.call("POST", "/api/v1/engagement/push/subscribe", { subscription: { endpoint: "https://push.example.com/abc123456789", keys: { p256dh: "x", auth: "y" } } }, m.token)).status, 200);
    setConfig({});
});

test("saving notification settings keeps an opt-out made from an email link", async () => {
    const m = await H.member();
    await MemberPreference.create({ user: m.id, origin: H.ORIGIN, notifications: { lifecycle: false, birthday: false } });
    await H.call("PUT", "/api/v1/engagement/preferences", { notifications: { weeklySummary: false } }, m.token);
    const p = await MemberPreference.findOne({ user: m.id }).lean();
    assert.equal(p.notifications.lifecycle, false);
    assert.equal(p.notifications.birthday, false);
    assert.equal(p.notifications.weeklySummary, false);
});

test("guardian tab: Teens only, guardian shown masked", async () => {
    const t = await H.member({ category: "b2c-minor", dob: new Date("2011-01-01") });
    const g = await TeenGuardian.create({ relation: "father", name: { first: "Raj" }, email: "raj.parent@example.com", origin: H.ORIGIN });
    await TeenRegistration.create({ reference: "TR-G1", idempotencyKey: `g-${Date.now()}`, status: "active", teen: t.id, guardian: g._id, origin: H.ORIGIN });
    const r = (await H.call("GET", "/api/v1/engagement/teen/guardian", null, t.token)).json.data;
    assert.deepEqual([r.found, r.relation, r.firstName, r.status], [true, "father", "Raj", "active"]);
    assert.match(r.email, /^r•+@example\.com$/);
    const adult = await H.member();
    assert.equal((await H.call("GET", "/api/v1/engagement/teen/guardian", null, adult.token)).status, 403);
});

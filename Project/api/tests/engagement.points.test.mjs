// Phase 1: ledger, pending / on hold, filters, CSV, streaks, preferences, weekly recap, unsubscribe.
import test from "node:test";
import assert from "node:assert/strict";
import { start, Models, outbox } from "./helpers/harness.mjs";
import { setConfig } from "../app/engagement/config.js";
import { computeStreak } from "../app/engagement/streak.js";
import { runWeekly } from "../app/engagement/weekly.js";
import { unsubscribeSig } from "../app/engagement/mail.js";

const H = await start("mfr_eng_points_test");
const { Response, Reward, PointsHold, MemberPreference } = Models;
const daysAgo = (n) => new Date(Date.now() - n * 86400000);

test.after(() => H.stop());

test("streak maths: runs, alive yesterday, broken", () => {
    const s = computeStreak(new Set(["2026-11-20", "2026-11-21", "2026-11-22"]), "2026-11-23");
    assert.equal(s.current, 3);
    assert.equal(s.todayDone, false);
    assert.equal(computeStreak(new Set(["2026-11-20"]), "2026-11-23").current, 0);
    assert.equal(computeStreak(new Set(["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-23"]), "2026-11-23").best, 3);
});

test("ledger: existing points unchanged, filters, CSV, holds", async () => {
    setConfig({});
    const m = await H.member();
    const r1 = await Response.create({ user: m.id, survey: { name: "Coffee habits", slug: "coffee" }, status: "complete", points: 400, origin: H.ORIGIN });
    await Response.create({ user: m.id, survey: { name: "Dropped", slug: "dropped" }, status: "dropout", points: 999, origin: H.ORIGIN });
    await Reward.create({ user: m.id, category: "profile", key: "profile:travel", name: "Travel", points: 100, origin: H.ORIGIN });

    const all = await H.call("GET", "/api/v1/engagement/ledger", null, m.token);
    assert.equal(all.status, 200);
    assert.equal(all.json.data.total, 2);
    assert.equal(all.json.data.balances.earned, 500);
    assert.equal(all.json.data.balances.available, 500);
    // same total as the existing /me/points
    const old = await H.call("GET", "/api/v1/me/points", null, m.token);
    assert.equal(old.json.data.totalPoints, 500);

    const onlyProfiles = await H.call("GET", "/api/v1/engagement/ledger?type=profile", null, m.token);
    assert.deepEqual(onlyProfiles.json.data.items.map((e) => e.type), ["profile"]);

    const csv = await H.call("GET", "/api/v1/engagement/ledger.csv", null, m.token);
    assert.match(csv.headers.get("content-type"), /text\/csv/);
    assert.match(csv.text, /Coffee habits/);

    // admin puts the survey on hold: not spendable, shown as on hold
    const admin = await H.member({ role: "administrator" });
    const nope = await H.call("POST", "/api/v1/engagement/admin/holds", { user: m.id, source: "survey", entry: String(r1._id) }, m.token);
    assert.equal(nope.status, 403);
    const hold = await H.call("POST", "/api/v1/engagement/admin/holds", { user: m.id, source: "survey", entry: String(r1._id), reason: "speeder" }, admin.token);
    assert.equal(hold.status, 200);
    const s = await H.call("GET", "/api/v1/engagement/summary", null, m.token);
    assert.equal(s.json.data.balances.onHold, 400);
    assert.equal(s.json.data.balances.available, 100);
    assert.equal(s.json.data.onHold[0].note, "Being checked by our quality team");
    assert.ok(!JSON.stringify(s.json).includes("speeder"), "the internal reason is never shown to the member");
    await H.call("POST", `/api/v1/engagement/admin/holds/${hold.json.data._id}/release`, {}, admin.token);
    const s2 = await H.call("GET", "/api/v1/engagement/summary", null, m.token);
    assert.equal(s2.json.data.balances.available, 500);
    // the response itself was never touched
    assert.equal((await Response.findById(r1._id).lean()).points, 400);
});

test("pending: only new entries after holdFrom, with a clearing date", async () => {
    setConfig({ points: { holdDays: 10, holdFrom: daysAgo(5).toISOString() } });
    const m = await H.member();
    await Reward.create({ user: m.id, category: "profile", key: "profile:old", name: "Old", points: 100, origin: H.ORIGIN, createdAt: daysAgo(30) });
    await Reward.create({ user: m.id, category: "profile", key: "profile:new", name: "New", points: 100, origin: H.ORIGIN });
    const s = await H.call("GET", "/api/v1/engagement/summary", null, m.token);
    assert.equal(s.json.data.balances.cleared, 100);
    assert.equal(s.json.data.balances.pending, 100);
    assert.equal(s.json.data.clearing.length, 1);
    setConfig({});
});

test("streak bonuses: paid once, only from bonusFrom", async () => {
    setConfig({ streak: { bonuses: [{ days: 3, points: 10 }], bonusFrom: daysAgo(10).toISOString().slice(0, 10) } });
    const m = await H.member({ timezone: "UTC" });
    for (const n of [2, 1, 0]) await Models.StreakDay.create({ user: m.id, day: daysAgo(n).toISOString().slice(0, 10), sources: ["poll"], origin: H.ORIGIN });
    // an old run before bonusFrom pays nothing
    for (const n of [40, 39, 38, 37]) await Models.StreakDay.create({ user: m.id, day: daysAgo(n).toISOString().slice(0, 10), sources: ["poll"], origin: H.ORIGIN, createdAt: daysAgo(n) });
    const a = await H.call("GET", "/api/v1/engagement/summary", null, m.token);
    assert.equal(a.json.data.streak.current, 3);
    await H.call("GET", "/api/v1/engagement/summary", null, m.token);
    const bonus = await Reward.find({ user: m.id, category: "streak" }).lean();
    assert.equal(bonus.length, 1);
    assert.equal(bonus[0].points, 10);
    setConfig({});
});

test("preferences: whitelist, quiet hours validated", async () => {
    const m = await H.member();
    const g = await H.call("GET", "/api/v1/engagement/preferences", null, m.token);
    assert.equal(g.json.data.notifications.email, true);
    const p = await H.call("PUT", "/api/v1/engagement/preferences", {
        notifications: { push: true, quietHours: { enabled: true, start: "23:00", end: "99:99" } },
        survey: { topics: ["Travel", "travel", "Food"], invitesPerWeek: 500, bestTimes: ["evening", "bogus"] },
        lastWeeklySummaryAt: "2020-01-01", user: "someone-else",
    }, m.token);
    assert.equal(p.status, 200);
    assert.equal(p.json.data.notifications.push, true);
    assert.equal(p.json.data.notifications.quietHours.end, "08:00");
    assert.deepEqual(p.json.data.survey.topics, ["travel", "food"]);
    assert.equal(p.json.data.survey.invitesPerWeek, 50);
    assert.deepEqual(p.json.data.survey.bestTimes, ["evening"]);
    const row = await MemberPreference.findOne({ user: m.id }).lean();
    assert.equal(row.lastWeeklySummaryAt, undefined);
});

test("weekly recap: off by default, sends when on, respects opt-out, unsubscribe link works", async () => {
    setConfig({});
    const off = await runWeekly({ origin: H.ORIGIN });
    assert.equal(off.sent, 0);
    assert.equal(off.enabled, false);

    setConfig({ weeklySummary: { enabled: true, maxPerRun: 100 } });
    const m = await H.member();
    await Reward.create({ user: m.id, category: "profile", key: "profile:food", name: "Food", points: 100, origin: H.ORIGIN });
    const teen = await H.member({ category: "b2c-minor", dob: new Date("2011-01-01") });
    await Reward.create({ user: teen.id, category: "profile", key: "profile:food", name: "Food", points: 100, origin: H.ORIGIN });
    const before = outbox().length;
    const r = await runWeekly({ origin: H.ORIGIN });
    assert.ok(r.sent >= 2);
    const mails = outbox().slice(before).filter((x) => x.data.template === "weekly-summary");
    const forTeen = mails.find((x) => x.to === teen.user.mail);
    assert.equal(forTeen.data.money, null, "Teens never see money values");
    // a second run in the same week sends nothing
    const again = await runWeekly({ origin: H.ORIGIN });
    assert.equal(again.sent, 0);

    const bad = await H.call("GET", `/api/v1/engagement-public/unsubscribe?u=${m.id}&l=weekly&s=nope`);
    assert.equal(bad.status, 400);
    const ok = await H.call("GET", `/api/v1/engagement-public/unsubscribe?u=${m.id}&l=weekly&s=${unsubscribeSig(m.id, "weekly")}`);
    assert.equal(ok.status, 200);
    const pref = await MemberPreference.findOne({ user: m.id }).lean();
    assert.equal(pref.notifications.weeklySummary, false);
    setConfig({});
});

test("every engagement route needs a signed-in member", async () => {
    const r = await H.call("GET", "/api/v1/engagement/summary");
    assert.equal(r.status, 401);
});

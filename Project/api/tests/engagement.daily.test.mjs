// Phase 3: daily poll, monthly challenges, prize draw (off by default, never for Teens), stories.
import test from "node:test";
import assert from "node:assert/strict";
import { start, Models } from "./helpers/harness.mjs";
import { setConfig } from "../app/engagement/config.js";

const H = await start("mfr_eng_daily_test");
test.after(() => H.stop());
const { Reward, Response, PrizeDraw } = Models;
const TEEN = { category: "b2c-minor", dob: new Date("2011-01-01") };
const india = { extra: { address: [{ tag: "home", country: "India" }] } };
const summary = async (m) => (await H.call("GET", "/api/v1/engagement/summary", null, m.token)).json.data;
const available = async (m) => (await H.call("GET", "/api/v1/engagement/ledger", null, m.token)).json.data.balances.available;

test("daily poll: one answer a day, pays points, counts as a streak day, results only after answering", async () => {
    setConfig({});
    const m = await H.member();
    const t = await H.call("GET", "/api/v1/engagement/today", null, m.token);
    assert.equal(t.status, 200);
    const p = t.json.data.poll;
    assert.ok(p.question && p.options.length >= 2);
    assert.equal(p.answered, false);
    assert.equal(p.results, null);

    const bad = await H.call("POST", `/api/v1/engagement/poll/${p.id}`, { choice: "zzz" }, m.token);
    assert.equal(bad.status, 422);
    const ok = await H.call("POST", `/api/v1/engagement/poll/${p.id}`, { choice: p.options[0].key }, m.token);
    assert.equal(ok.status, 200);
    assert.equal(ok.json.data.results.total, 1);
    assert.equal(ok.json.data.results.options[0].pct, 100);
    const again = await H.call("POST", `/api/v1/engagement/poll/${p.id}`, { choice: p.options[1].key }, m.token);
    assert.equal(again.status, 409);

    const rewards = await Reward.find({ user: m.id, category: "poll" }).lean();
    assert.equal(rewards.length, 1);
    assert.equal(rewards[0].points, 5);
    const s = await H.call("GET", "/api/v1/engagement/streak", null, m.token);
    assert.equal(s.json.data.todayDone, true);

    // a second member sees the same poll and the shared results after answering
    const m2 = await H.member();
    const p2 = (await H.call("GET", "/api/v1/engagement/today", null, m2.token)).json.data.poll;
    assert.equal(p2.id, p.id);
    const r2 = await H.call("POST", `/api/v1/engagement/poll/${p.id}`, { choice: p.options[1].key }, m2.token);
    assert.equal(r2.json.data.results.total, 2);
});

test("daily poll: Teens get their own poll; switched off means no poll and no points", async () => {
    setConfig({});
    const adult = (await H.call("GET", "/api/v1/engagement/today", null, (await H.member()).token)).json.data.poll;
    const teen = await H.member(TEEN);
    const tp = (await H.call("GET", "/api/v1/engagement/today", null, teen.token)).json.data.poll;
    assert.notEqual(tp.id, adult.id);

    setConfig({ dailyPoll: { enabled: false } });
    const m = await H.member();
    assert.equal((await H.call("GET", "/api/v1/engagement/today", null, m.token)).json.data.poll, null);
    assert.equal((await H.call("POST", `/api/v1/engagement/poll/${tp.id}`, { choice: "x" }, m.token)).status, 409);
    setConfig({});
});

test("challenges: progress from real activity; bonus paid once, only for months on or after `from`", async () => {
    setConfig({}); // from 2026-12: November progress shows but doesn't pay
    const m = await H.member();
    for (let i = 0; i < 5; i++) await Response.create({ user: m.id, survey: { slug: `s${i}`, name: `S${i}` }, status: "complete", points: 100, origin: H.ORIGIN });
    const c = await H.call("GET", "/api/v1/engagement/challenges", null, m.token);
    const five = c.json.data.items.find((x) => x.key === "surveys-5");
    assert.equal(five.progress, 5);
    assert.equal(five.done, true);
    const now = new Date().toISOString().slice(0, 7);
    if (now < "2026-12") {
        assert.equal(five.pays, false);
        assert.equal(await Reward.countDocuments({ user: m.id, category: "challenge" }), 0);
    }

    setConfig({ challenges: { from: "2000-01" } });
    await H.call("GET", "/api/v1/engagement/challenges", null, m.token);
    await H.call("GET", "/api/v1/engagement/today", null, m.token);
    const paid = await Reward.find({ user: m.id, category: "challenge" }).lean();
    assert.equal(paid.length, 1);
    assert.equal(paid[0].points, 50);
    // survey points are untouched: 5 x 100 + 50
    assert.equal(await available(m), 550);

    // Teens don't get the surveys challenge (adult-only) but do get the others
    const teen = await H.member(TEEN);
    const tc = (await H.call("GET", "/api/v1/engagement/challenges", null, teen.token)).json.data.items;
    assert.ok(!tc.some((x) => x.key === "surveys-5"));
    assert.ok(tc.some((x) => x.key === "polls-10"));
    setConfig({});
});

test("prize draw: off by default, then country-gated, never for Teens; tickets cost points; cancel gives them back", async () => {
    setConfig({});
    const admin = await H.member({ role: "administrator" });
    const closesAt = new Date(Date.now() + 86400000).toISOString();
    const made = await H.call("POST", "/api/v1/engagement/admin/draws", { month: "2026-12", title: "December draw", prize: "Prize to be confirmed", ticketPoints: 100, maxTicketsPerMember: 3, countries: ["india"], closesAt }, admin.token);
    assert.equal(made.status, 200);
    const id = made.json.data._id;

    const m = await H.member(india);
    await Reward.create({ user: m.id, category: "profile", key: "profile:x", name: "X", points: 1000, origin: H.ORIGIN });
    assert.equal((await H.call("GET", "/api/v1/engagement/today", null, m.token)).json.data.draw, null);
    assert.equal((await H.call("POST", `/api/v1/engagement/draws/${id}/enter`, { tickets: 1 }, m.token)).status, 409);

    setConfig({ draw: { enabled: true } });
    const d = (await H.call("GET", "/api/v1/engagement/today", null, m.token)).json.data.draw;
    assert.equal(d.id, id);
    const e = await H.call("POST", `/api/v1/engagement/draws/${id}/enter`, { tickets: 2 }, m.token);
    assert.equal(e.status, 200);
    assert.equal(e.json.data.myTickets, 2);
    assert.equal(await available(m), 800);
    const over = await H.call("POST", `/api/v1/engagement/draws/${id}/enter`, { tickets: 2 }, m.token);
    assert.equal(over.status, 409);
    assert.equal(over.json.code, "limit");

    // another country, and a Teen in India, are never offered it
    const uk = await H.member({ extra: { address: [{ tag: "home", country: "United Kingdom" }] } });
    assert.equal((await H.call("GET", "/api/v1/engagement/today", null, uk.token)).json.data.draw, null);
    const teen = await H.member({ ...TEEN, ...india });
    assert.equal((await H.call("GET", "/api/v1/engagement/today", null, teen.token)).json.data.draw, null);
    assert.equal((await H.call("POST", `/api/v1/engagement/draws/${id}/enter`, { tickets: 1 }, teen.token)).status, 409);

    // can't run before it closes; cancel returns the tickets' points
    assert.equal((await H.call("POST", `/api/v1/engagement/admin/draws/${id}/run`, null, admin.token)).status, 409);
    assert.equal((await H.call("POST", `/api/v1/engagement/admin/draws/${id}/cancel`, null, m.token)).status, 403);
    assert.equal((await H.call("POST", `/api/v1/engagement/admin/draws/${id}/cancel`, null, admin.token)).status, 200);
    assert.equal(await available(m), 1000);
    setConfig({});
});

test("prize draw: run picks winners from ticket holders after closing and keeps the seed", async () => {
    setConfig({ draw: { enabled: true } });
    const admin = await H.member({ role: "administrator" });
    const made = await H.call("POST", "/api/v1/engagement/admin/draws", { month: "2027-01", title: "January draw", prize: "Prize", ticketPoints: 10, countries: ["india"], winners: 1, closesAt: new Date(Date.now() + 60000).toISOString() }, admin.token);
    const id = made.json.data._id;
    const a = await H.member(india);
    await Reward.create({ user: a.id, category: "profile", key: "profile:y", name: "Y", points: 100, origin: H.ORIGIN });
    assert.equal((await H.call("POST", `/api/v1/engagement/draws/${id}/enter`, { tickets: 1 }, a.token)).status, 200);
    await PrizeDraw.updateOne({ _id: id }, { $set: { closesAt: new Date(Date.now() - 1000) } });
    const r = await H.call("POST", `/api/v1/engagement/admin/draws/${id}/run`, null, admin.token);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.data.winners, [a.id]);
    const saved = await PrizeDraw.findById(id).select("+seed").lean();
    assert.equal(saved.status, "drawn");
    assert.ok(saved.seed.length === 64);
    assert.equal((await H.call("POST", `/api/v1/engagement/admin/draws/${id}/run`, null, admin.token)).status, 409);
    setConfig({});
});

test("stories: only published ones, by audience; insights only for Professionals", async () => {
    const admin = await H.member({ role: "administrator" });
    await H.call("POST", "/api/v1/engagement/admin/stories", { type: "story", title: "Draft", summary: "not yet" }, admin.token);
    const pub = await H.call("POST", "/api/v1/engagement/admin/stories", { type: "story", title: "Packaging changed", summary: "Because of your answers", stats: [{ label: "Members asked", value: "1,200" }], published: true }, admin.token);
    assert.equal(pub.status, 200);
    await H.call("POST", "/api/v1/engagement/admin/stories", { type: "story", title: "Teens only", audience: ["teen"], published: true }, admin.token);
    await H.call("POST", "/api/v1/engagement/admin/stories", { type: "insight", title: "Fintech 2026", sampleSize: 400, published: true }, admin.token);
    const m = await H.member();
    const s = (await H.call("GET", "/api/v1/engagement/stories", null, m.token)).json.data;
    assert.deepEqual(s.map((x) => x.title), ["Packaging changed"]);
    assert.deepEqual((await H.call("GET", "/api/v1/engagement/stories?type=insight", null, m.token)).json.data, []);
    const pro = await H.member({ category: "b2b" });
    assert.equal((await H.call("GET", "/api/v1/engagement/stories?type=insight", null, pro.token)).json.data[0].title, "Fintech 2026");
    assert.equal((await H.call("POST", "/api/v1/engagement/admin/stories", { type: "story", title: "x" }, m.token)).status, 403);
    assert.equal((await H.call("GET", "/api/v1/engagement/today", null, m.token)).json.data.story.title, "Packaging changed");
    void summary;
});

// Phase 2: catalogue, goals, redemptions (closed by default, no double spend, points back on reject), offers, expiry.
import test from "node:test";
import assert from "node:assert/strict";
import { start, Models } from "./helpers/harness.mjs";
import { setConfig } from "../app/engagement/config.js";
import { atRisk } from "../app/engagement/expiry.js";

const H = await start("mfr_eng_rewards_test");
test.after(() => H.stop());
const { Reward, Response, Redemption } = Models;
const rich = async (points = 20000, over) => {
    const m = await H.member(over);
    await Reward.create({ user: m.id, category: "profile", key: "profile:big", name: "Big", points, origin: H.ORIGIN });
    return m;
};

test("catalogue: placeholders by audience, affordability, Teens see no money", async () => {
    setConfig({});
    const m = await rich(16000);
    const r = await H.call("GET", "/api/v1/engagement/rewards", null, m.token);
    assert.equal(r.status, 200);
    assert.equal(r.json.data.placeholder, true);
    assert.equal(r.json.data.open, false);
    const gc = r.json.data.items.find((x) => x.key === "giftcard-15");
    assert.equal(gc.affordable, true);
    assert.equal(r.json.data.items.find((x) => x.key === "giftcard-25").left, 9000);
    assert.ok(!r.json.data.items.some((x) => x.kind === "learning"));

    const teen = await rich(7000, { category: "b2c-minor", dob: new Date("2011-01-01") });
    const t = await H.call("GET", "/api/v1/engagement/rewards", null, teen.token);
    assert.ok(t.json.data.items.every((x) => x.kind === "learning" && x.value === null && x.needsGuardian));
    assert.equal(t.json.data.usdPerPoint, null);
});

test("goal: set, progress, clear", async () => {
    const m = await rich(5000);
    const g = await H.call("PUT", "/api/v1/engagement/rewards/goal", { item: "paypal-15" }, m.token);
    assert.equal(g.status, 200);
    const r = await H.call("GET", "/api/v1/engagement/rewards", null, m.token);
    assert.equal(r.json.data.goal.pct, 33);
    assert.equal(r.json.data.goal.left, 10000);
    const bad = await H.call("PUT", "/api/v1/engagement/rewards/goal", { item: "nope" }, m.token);
    assert.equal(bad.status, 404);
    await H.call("PUT", "/api/v1/engagement/rewards/goal", { item: null }, m.token);
    assert.equal((await H.call("GET", "/api/v1/engagement/rewards", null, m.token)).json.data.goal, null);
});

test("redeem: closed by default; when open, checks balance, blocks double spend, points come back on reject", async () => {
    setConfig({});
    const m = await rich(20000);
    const closed = await H.call("POST", "/api/v1/engagement/rewards/redeem", { item: "giftcard-15" }, m.token);
    assert.equal(closed.status, 409);
    assert.equal(closed.json.code, "closed");

    setConfig({ rewards: { redemptionsEnabled: true } });
    const badUpi = await H.call("POST", "/api/v1/engagement/rewards/redeem", { item: "paypal-15", paypal: "not-an-email" }, m.token);
    assert.equal(badUpi.status, 422);
    const [a, b] = await Promise.all([
        H.call("POST", "/api/v1/engagement/rewards/redeem", { item: "paypal-15", paypal: "me@example.com" }, m.token),
        H.call("POST", "/api/v1/engagement/rewards/redeem", { item: "paypal-15", paypal: "me@example.com" }, m.token),
    ]);
    assert.deepEqual([a.status, b.status].sort(), [200, 409]);
    const ok = a.status === 200 ? a : b;
    assert.equal(ok.json.data.payout.masked, "m•@example.com");
    assert.ok(!JSON.stringify(ok.json).includes("me@example.com"), "full destination never goes back to the browser");

    let s = await H.call("GET", "/api/v1/engagement/summary", null, m.token);
    assert.equal(s.json.data.balances.available, 5000);
    const old = await H.call("GET", "/api/v1/me/points", null, m.token);
    assert.equal(old.json.data.totalPoints, 5000);
    assert.equal(old.json.data.redeemPoints, 15000);

    const poor = await rich(1000);
    const np = await H.call("POST", "/api/v1/engagement/rewards/redeem", { item: "giftcard-15" }, poor.token);
    assert.equal(np.json.code, "not_enough");

    // admin rejects: the points come back
    const admin = await H.member({ role: "administrator" });
    const q = await H.call("GET", "/api/v1/engagement/admin/redemptions?status=requested", null, admin.token);
    const mineQ = q.json.data.find((x) => x.member?.mail === m.user.mail);
    assert.equal(mineQ.payout.destination, "me@example.com", "the team sees where to pay");
    const nope = await H.call("POST", `/api/v1/engagement/admin/redemptions/${mineQ.id}`, { status: "rejected" }, m.token);
    assert.equal(nope.status, 403);
    const rej = await H.call("POST", `/api/v1/engagement/admin/redemptions/${mineQ.id}`, { status: "rejected", note: "PayPal account not found" }, admin.token);
    assert.equal(rej.status, 200);
    s = await H.call("GET", "/api/v1/engagement/summary", null, m.token);
    assert.equal(s.json.data.balances.available, 20000);
    // and a new request is possible again
    const again = await H.call("POST", "/api/v1/engagement/rewards/redeem", { item: "giftcard-15" }, m.token);
    assert.equal(again.status, 200);
    const cancel = await H.call("POST", `/api/v1/engagement/rewards/redemptions/${again.json.data.id}/cancel`, {}, m.token);
    assert.equal(cancel.json.data.status, "cancelled");
    setConfig({});
});

test("teens cannot redeem until the guardian flow is on", async () => {
    setConfig({ rewards: { redemptionsEnabled: true } });
    const teen = await rich(20000, { category: "b2c-minor", dob: new Date("2011-01-01") });
    const r = await H.call("POST", "/api/v1/engagement/rewards/redeem", { item: "learn-course" }, teen.token);
    assert.equal(r.status, 409);
    setConfig({});
});

test("bonus offers + weekend multiplier pay a separate bonus once; survey points untouched", async () => {
    const admin = await H.member({ role: "administrator" });
    const m = await H.member({ timezone: "UTC" });
    const now = Date.now();
    const offer = await H.call("POST", "/api/v1/engagement/admin/offers", { title: "Double week", multiplier: 2, startsAt: new Date(now - 86400000), endsAt: new Date(now + 86400000) }, admin.token);
    assert.equal(offer.status, 200);
    const resp = await Response.create({ user: m.id, survey: { name: "Coffee", slug: "coffee-x" }, status: "complete", points: 300, origin: H.ORIGIN });
    await H.call("GET", "/api/v1/engagement/summary", null, m.token);
    const s = await H.call("GET", "/api/v1/engagement/summary", null, m.token);
    assert.equal(s.json.data.balances.earned, 600);
    assert.equal((await Reward.find({ user: m.id, category: "bonus" })).length, 1);
    assert.equal((await Response.findById(resp._id).lean()).points, 300);
    const r = await H.call("GET", "/api/v1/engagement/rewards", null, m.token);
    assert.equal(r.json.data.offers[0].multiplier, 2);
    await H.call("DELETE", `/api/v1/engagement/admin/offers/${offer.json.data._id}`, null, admin.token);
});

test("expiry maths: oldest spent first, never deducts", () => {
    const d = (s) => new Date(s);
    const list = [
        { points: 1000, status: "cleared", at: d("2025-01-10") },
        { points: 500, status: "cleared", at: d("2025-06-10") },
        { points: -800, status: "spent", at: d("2025-07-01") },
    ];
    const r = atRisk(list, { months: 12, now: d("2025-12-20") });
    assert.deepEqual(r.map((x) => [x.date, x.points]), [["2026-01-10", 200], ["2026-06-10", 500]]);
});

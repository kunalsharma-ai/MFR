// Phase 4: quality tiers, breakdown, trend, celebration, survey gating; referral status, tiers, leaderboard.
import test from "node:test";
import assert from "node:assert/strict";
import { start, Models } from "./helpers/harness.mjs";
import { setConfig } from "../app/engagement/config.js";
import { _clearLeaderboardCache } from "../app/engagement/referrals.js";

const H = await start("mfr_eng_quality_test");
test.after(() => H.stop());
const { User, Response, Reward, Survey } = Models;
const TEEN = { category: "b2c-minor", dob: new Date("2011-01-01") };
const q = async (m) => (await H.call("GET", "/api/v1/engagement/quality", null, m.token)).json.data;

test("quality: tier from the real score, next tier, trend row, celebration once when it goes up", async () => {
    setConfig({});
    const m = await H.member();
    const a = await q(m);
    assert.equal(a.score, 100);
    assert.equal(a.tier.key, "silver");
    assert.equal(a.next.key, "gold");
    assert.equal(a.toNext, 20);
    assert.equal(a.history.length, 1);
    assert.equal(a.celebrate, null); // first look: nothing to celebrate

    await User.updateOne({ _id: m.id }, { $set: { qualityScore: 125 } });
    const b = await q(m);
    assert.equal(b.tier.key, "gold");
    assert.deepEqual({ from: b.celebrate.from, to: b.celebrate.to, tier: b.celebrate.tierUp.key }, { from: 100, to: 125, tier: "gold" });
    assert.equal(b.history.length, 1);
    assert.equal(b.history[0].score, 125);
    await H.call("POST", "/api/v1/engagement/quality/seen", null, m.token);
    assert.equal((await q(m)).celebrate, null);

    // a drop is never "celebrated"
    await User.updateOne({ _id: m.id }, { $set: { qualityScore: 80 } });
    const c = await q(m);
    assert.equal(c.celebrate, null);
    assert.equal(c.tier.key, "bronze");
});

test("quality: breakdown uses real figures; tips follow them; surveys a higher tier opens", async () => {
    const m = await H.member();
    for (let i = 0; i < 3; i++) await Response.create({ user: m.id, survey: { slug: `q${i}`, name: "Q" }, status: "complete", points: 10, origin: H.ORIGIN });
    await Response.create({ user: m.id, survey: { slug: "qd", name: "Q" }, status: "dropout", origin: H.ORIGIN });
    await Survey.create({ slug: `gold-only-${Date.now()}`, name: "Gold only", loi: 10, points: 100, category: "b2c", status: "active", source: "internal", minQualityScore: 165, origin: H.ORIGIN });
    const r = await q(m);
    const finish = r.factors.find((f) => f.key === "finish");
    assert.equal(finish.value, 75);
    assert.deepEqual(finish.detail, { complete: 3, dropout: 1 });
    assert.ok(r.tips.some((t) => t.key === "finish"));
    assert.ok(r.tips.some((t) => t.key === "verified"));
    assert.deepEqual(r.unlocks.map((u) => [u.tier, u.surveys]), [["platinum", 1]]);
});

test("survey gating: bulk invites skip members below minQualityScore; unset invites everyone as before", async () => {
    const { default: surveyController } = await import("../app/controller/Survey.js");
    const low = await H.member({ category: "gate" });
    const high = await H.member({ category: "gate" });
    await User.updateOne({ _id: low.id }, { $set: { qualityScore: 60 } });
    await User.updateOne({ _id: high.id }, { $set: { qualityScore: 150 } });
    const gated = await Survey.create({ slug: `gated-${Date.now()}`, name: "Gated", loi: 5, points: 50, category: "gate", status: "active", source: "internal", minQualityScore: 120, origin: H.ORIGIN });
    const open = await Survey.create({ slug: `open-${Date.now()}`, name: "Open", loi: 5, points: 50, category: "gate", status: "active", source: "internal", origin: H.ORIGIN });
    surveyController.request = { origin: H.ORIGIN, user: high.user };
    await surveyController.bulkInvite(String(gated._id), {});
    await surveyController.bulkInvite(String(open._id), {});
    const got = async (s) => (await Response.find({ "survey.slug": s.slug }).lean()).map((r) => String(r.user)).sort();
    assert.deepEqual(await got(gated), [high.id]);
    assert.deepEqual(await got(open), [low.id, high.id].sort());
});

test("referrals: live status per referral; tiers count first surveys from `from`; paid once; not for Teens", async () => {
    setConfig({ referrals: { from: "2000-01-01" } });
    const a = await H.member();
    const kids = [];
    for (let i = 0; i < 4; i++) kids.push(await H.member({ extra: { referredBy: a.id } }));
    await User.updateOne({ _id: kids[0].id }, { $set: { "isVerified.email": "verified" } });
    for (const k of kids.slice(1)) await Response.create({ user: k.id, survey: { slug: "first", name: "First" }, status: "complete", points: 10, origin: H.ORIGIN });
    const r = (await H.call("GET", "/api/v1/engagement/referrals", null, a.token)).json.data;
    assert.equal(r.counts.joined, 4);
    assert.equal(r.counts.firstSurvey, 3);
    assert.equal(r.counts.counted, 3);
    assert.equal(r.referrals.filter((x) => x.stage === "verified").length, 1);
    assert.ok(r.referrals.every((x) => !("mail" in x) && /^Member\d+ T\.$/.test(x.name)));
    assert.equal(r.next.count, 10);
    assert.equal(r.next.left, 7);
    await H.call("GET", "/api/v1/engagement/referrals", null, a.token);
    const paid = await Reward.find({ user: a.id, category: "referral" }).lean();
    assert.equal(paid.length, 1);
    assert.equal(paid[0].points, 300);

    // default `from` (Dec 2026): today's first surveys only count from then
    setConfig({});
    if (new Date() < new Date("2026-12-01")) {
        const r2 = (await H.call("GET", "/api/v1/engagement/referrals", null, a.token)).json.data;
        assert.equal(r2.counts.counted, 0);
    }

    // Teen referrer: status yes, tiers and bonus no
    setConfig({ referrals: { from: "2000-01-01" } });
    const t = await H.member(TEEN);
    for (let i = 0; i < 3; i++) {
        const k = await H.member({ extra: { referredBy: t.id } });
        await Response.create({ user: k.id, survey: { slug: "first", name: "First" }, status: "complete", points: 10, origin: H.ORIGIN });
    }
    const tr = (await H.call("GET", "/api/v1/engagement/referrals", null, t.token)).json.data;
    assert.equal(tr.counts.firstSurvey, 3);
    assert.equal(tr.tiersOn, false);
    assert.deepEqual(tr.tiers, []);
    assert.equal(tr.leaderboard, false);
    assert.equal(await Reward.countDocuments({ user: t.id, category: "referral" }), 0);
    setConfig({});
});

test("leaderboard: only opted-in members, first name + initial, my rank", async () => {
    setConfig({ referrals: { from: "2000-01-01" } });
    _clearLeaderboardCache();
    const a = await H.member({ first: "Asha" });
    const b = await H.member({ first: "Ben" });
    for (const [who, n] of [[a, 2], [b, 3]]) {
        for (let i = 0; i < n; i++) {
            const k = await H.member({ extra: { referredBy: who.id } });
            await Response.create({ user: k.id, survey: { slug: "lb", name: "LB" }, status: "complete", points: 10, origin: H.ORIGIN });
        }
    }
    const pref = await H.call("PUT", "/api/v1/engagement/preferences", { leaderboard: { optIn: true } }, a.token);
    assert.equal(pref.status, 200);
    const lb = (await H.call("GET", "/api/v1/engagement/referrals/leaderboard", null, a.token)).json.data;
    assert.equal(lb.optedIn, true);
    const names = lb.top.map((x) => x.name);
    assert.ok(names.includes("Asha T."));
    assert.ok(!names.includes("Ben T.")); // not opted in
    assert.equal(lb.me.count, 2);
    assert.ok(lb.me.rank >= 1);
    const lbB = (await H.call("GET", "/api/v1/engagement/referrals/leaderboard", null, b.token)).json.data;
    assert.equal(lbB.optedIn, false);
    assert.equal(lbB.me, null);
    const teen = await H.member(TEEN);
    assert.equal((await H.call("GET", "/api/v1/engagement/referrals/leaderboard", null, teen.token)).json.data, null);
    setConfig({});
});

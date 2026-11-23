// Phase 6: Teen levels/badges/seasons (points only), creative tasks, guardian YES/NO on learning rewards, guardian view.
import test from "node:test";
import assert from "node:assert/strict";
import { start, Models, outbox } from "./helpers/harness.mjs";
import { setConfig } from "../app/engagement/config.js";

const H = await start("mfr_eng_teens_test");
test.after(() => H.stop());
const { Reward, Response, TeenGuardian, TeenRegistration, Redemption } = Models;
const TEEN = { category: "b2c-minor", dob: new Date("2011-01-01") };
let n = 0;
async function teenWithGuardian(points = 0) {
    const t = await H.member({ ...TEEN, first: "Mia" });
    const g = await TeenGuardian.create({ relation: "mother", name: { first: "Ana" }, email: `ana${++n}@example.com`, origin: H.ORIGIN });
    await TeenRegistration.create({ reference: `TR-T${n}`, idempotencyKey: `k${n}-${Date.now()}`, status: "active", teen: t.id, guardian: g._id, origin: H.ORIGIN });
    if (points) await Reward.create({ user: t.id, category: "profile", key: `profile:t${n}`, name: "Profile", points, origin: H.ORIGIN });
    return { ...t, guardian: g };
}
const tokenFrom = (url, key) => new URL(url).searchParams.get(key);
const lastMail = (template) => outbox().filter((m) => m.data.template === template).pop();

test("teen-only routes", async () => {
    const c = await H.member();
    assert.equal((await H.call("GET", "/api/v1/engagement/teen/progress", null, c.token)).status, 403);
    assert.equal((await H.call("GET", "/api/v1/engagement/teen/tasks", null, c.token)).status, 403);
});

test("progress: level from points earned, badges from real activity, no money anywhere", async () => {
    setConfig({});
    const t = await teenWithGuardian(1600);
    await Response.create({ user: t.id, survey: { slug: "ts1", name: "Teen survey" }, status: "complete", points: 100, origin: H.ORIGIN });
    const p = (await H.call("GET", "/api/v1/engagement/teen/progress", null, t.token)).json.data;
    assert.equal(p.points.earned, 1700);
    assert.equal(p.level.name, "Creator");
    assert.equal(p.level.next.name, "Trailblazer");
    assert.equal(p.level.next.left, 1800);
    assert.equal(p.badges.find((b) => b.key === "first-survey").earned, true);
    assert.equal(p.badges.find((b) => b.key === "surveys-10").progress, 1);
    assert.ok(p.season && p.season.stages.length === 4);
    assert.ok(!JSON.stringify(p).match(/usd|\$|value/i));
});

test("creative tasks: design vote pays once with results after voting; ideas wait for a moderator", async () => {
    setConfig({});
    const admin = await H.member({ role: "administrator" });
    const dv = await H.call("POST", "/api/v1/engagement/admin/tasks", { kind: "design_vote", title: "Pick the new badge", audience: ["teen"], points: 15, options: [{ key: "a", label: "Rocket" }, { key: "b", label: "Star" }] }, admin.token);
    assert.equal(dv.status, 200);
    const idea = await H.call("POST", "/api/v1/engagement/admin/tasks", { kind: "idea", title: "Idea contest", question: "What should we ask teens about?", audience: ["teen"], points: 25 }, admin.token);
    assert.equal(idea.status, 200);
    const t = await teenWithGuardian();
    const list = (await H.call("GET", "/api/v1/engagement/teen/tasks", null, t.token)).json.data;
    assert.deepEqual(list.map((x) => x.kind).sort(), ["design_vote", "idea"]);

    const v = await H.call("POST", `/api/v1/engagement/teen/tasks/${dv.json.data._id}`, { choice: "b" }, t.token);
    assert.equal(v.status, 200);
    assert.equal(v.json.data.results.total, 1);
    assert.equal((await H.call("POST", `/api/v1/engagement/teen/tasks/${dv.json.data._id}`, { choice: "a" }, t.token)).status, 409);
    assert.equal(await Reward.countDocuments({ user: t.id, category: "task" }), 1);

    assert.equal((await H.call("POST", `/api/v1/engagement/teen/tasks/${idea.json.data._id}`, { text: "Ask about school apps at https://x.io" }, t.token)).status, 422);
    const sub = await H.call("POST", `/api/v1/engagement/teen/tasks/${idea.json.data._id}`, { text: "Ask teens which study apps they actually use" }, t.token);
    assert.equal(sub.json.data.status, "submitted");
    assert.equal(await Reward.countDocuments({ user: t.id, category: "task" }), 1); // not paid yet
    let shown = (await H.call("GET", "/api/v1/engagement/teen/tasks", null, t.token)).json.data.find((x) => x.kind === "idea");
    assert.deepEqual(shown.ideas, []);

    const q = (await H.call("GET", "/api/v1/engagement/admin/ideas", null, admin.token)).json.data;
    assert.equal(q.length, 1);
    assert.equal((await H.call("POST", `/api/v1/engagement/admin/ideas/${q[0].id}`, { status: "approved" }, admin.token)).status, 200);
    assert.equal(await Reward.countDocuments({ user: t.id, category: "task" }), 2);
    shown = (await H.call("GET", "/api/v1/engagement/teen/tasks", null, t.token)).json.data.find((x) => x.kind === "idea");
    assert.deepEqual(shown.ideas, ["Ask teens which study apps they actually use"]);
    const s = (await H.call("GET", "/api/v1/engagement/streak", null, t.token)).json.data;
    assert.equal(s.todayDone, true);
});

test("learning reward: closed by default; when on, the guardian is emailed and decides YES or NO once", async () => {
    setConfig({});
    const t = await teenWithGuardian(20000);
    assert.equal((await H.call("POST", "/api/v1/engagement/rewards/redeem", { item: "learn-course" }, t.token)).status, 409);

    setConfig({ teen: { redemptionsEnabled: true } }); // independent of the adult switch
    const r = await H.call("POST", "/api/v1/engagement/rewards/redeem", { item: "learn-course" }, t.token);
    assert.equal(r.status, 200);
    assert.equal(r.json.data.status, "guardian_pending");
    await new Promise((ok) => setTimeout(ok, 300));
    const mail = lastMail("guardian-reward");
    assert.equal(mail.to, t.guardian.email);
    assert.ok(!JSON.stringify(mail.data).match(/"value"|usd/i));
    const token = tokenFrom(mail.data.links.yes, "reward");
    assert.equal(new URL(mail.data.links.yes).searchParams.get("d"), "yes");

    const page = (await H.call("GET", `/api/v1/engagement-public/guardian/reward?t=${token}`)).json.data;
    assert.equal(page.ok, true);
    assert.equal(page.teen.firstName, "Mia");
    assert.equal(page.reward.title, "Skill course voucher");
    assert.equal((await H.call("POST", "/api/v1/engagement-public/guardian/reward", { t: token, decision: "maybe" })).status, 422);
    const yes = await H.call("POST", "/api/v1/engagement-public/guardian/reward", { t: token, decision: "yes" });
    assert.equal(yes.json.data.status, "approved");
    assert.equal((await H.call("POST", "/api/v1/engagement-public/guardian/reward", { t: token, decision: "no" })).status, 410);
    const used = (await H.call("GET", `/api/v1/engagement-public/guardian/reward?t=${token}`)).json.data;
    assert.deepEqual([used.ok, used.reason, used.status], [false, "used", "approved"]);

    // NO gives the points back
    await Redemption.updateOne({ user: t.id, status: "approved" }, { $set: { status: "fulfilled", open: false } });
    const before = (await H.call("GET", "/api/v1/engagement/ledger", null, t.token)).json.data.balances.available;
    await H.call("POST", "/api/v1/engagement/rewards/redeem", { item: "learn-study" }, t.token);
    await new Promise((ok) => setTimeout(ok, 300));
    const t2 = tokenFrom(lastMail("guardian-reward").data.links.no, "reward");
    const no = await H.call("POST", "/api/v1/engagement-public/guardian/reward", { t: t2, decision: "no" });
    assert.equal(no.json.data.status, "rejected");
    assert.equal((await H.call("GET", "/api/v1/engagement/ledger", null, t.token)).json.data.balances.available, before);
    assert.equal((await H.call("GET", "/api/v1/engagement-public/guardian/reward?t=nope")).json.data.reason, "invalid");
    setConfig({});
});

test("guardian view: the teen sends it; read-only points, level, badges, activity; a new link replaces the old", async () => {
    setConfig({});
    const t = await teenWithGuardian(600);
    const s = await H.call("POST", "/api/v1/engagement/teen/guardian-view", null, t.token);
    assert.equal(s.status, 200);
    assert.match(s.json.data.to, /^a•+@example\.com$/);
    const token = tokenFrom(lastMail("guardian-view").data.links.view, "view");
    const v = (await H.call("GET", `/api/v1/engagement-public/guardian/view?t=${token}`)).json.data;
    assert.equal(v.ok, true);
    assert.equal(v.teen.firstName, "Mia");
    assert.equal(v.points.earned, 600);
    assert.equal(v.level.name, "Thinker");
    assert.equal(v.activity.length, 1);
    await H.call("POST", "/api/v1/engagement/teen/guardian-view", null, t.token);
    assert.equal((await H.call("GET", `/api/v1/engagement-public/guardian/view?t=${token}`)).json.data.reason, "revoked");

    const lone = await H.member(TEEN); // no active registration
    assert.equal((await H.call("POST", "/api/v1/engagement/teen/guardian-view", null, lone.token)).status, 409);
});

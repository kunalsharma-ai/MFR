// Phase 6: Teen Panel. Levels, badges and seasons (points and badges only, never money), creative tasks (design
// votes, polls, idea contests), the guardian's YES/NO on each learning reward, and a read-only guardian view.
//
// The guardian is the parent or legal guardian from the Teen registration (PR #15: TeenRegistration.guardian, who
// said YES and gave consent). Emails go to that address only.
import crypto from "crypto";
import mongoose from "mongoose";
import { Task, TaskEntry, User, Redemption, TeenRegistration, TeenGuardian, GuardianLink } from "../model/index.js";
import { config } from "./config.js";
import { ledger, grant } from "./ledger.js";
import { record, streakOf } from "./streak.js";
import { onTeenRequest, view as redemptionView } from "./rewards.js";
import { send, siteUrl } from "./mail.js";
import { fail, isTeen } from "./http.js";

const oid = (id) => new mongoose.Types.ObjectId(String(id));
const hash = (t) => crypto.createHash("sha256").update(String(t)).digest("hex");
const looksLikeToken = (t) => /^[A-Za-z0-9_-]{40,64}$/.test(String(t || ""));
export function requireTeen(user) { if (!isTeen(user)) fail("forbidden", "This is for Teen Panel members.", 403); }

// ---- levels, badges, seasons -----------------------------------------------------------------------------------------
export function levelOf(earned) {
    const list = [...(config().teen.levels || [])].sort((a, b) => a.min - b.min);
    let i = 0;
    list.forEach((l, k) => { if (earned >= l.min) i = k; });
    const cur = list[i], next = list[i + 1] || null;
    const span = next ? next.min - cur.min : 1;
    return { ...cur, next: next ? { level: next.level, name: next.name, min: next.min, left: next.min - earned } : null, pct: next ? Math.round(((earned - cur.min) / span) * 100) : 100 };
}

export function currentSeason(now = new Date()) {
    const d = now.toISOString().slice(0, 10);
    const list = config().teen.seasons || [];
    return list.find((s) => d >= s.starts && d <= s.ends) || list.filter((s) => s.starts > d).sort((a, b) => a.starts.localeCompare(b.starts))[0] || null;
}

function badgesFrom({ entries, streak, taskCounts }) {
    const surveys = entries.filter((e) => e.type === "survey" && e.points >= 0).length;
    const profiles = entries.filter((e) => e.type === "profile").length;
    const polls = entries.filter((e) => e.type === "poll").length;
    const B = (key, earned, progress, target) => ({ key, earned, progress: Math.min(progress, target), target });
    return [
        B("first-survey", surveys >= 1, surveys, 1),
        B("surveys-10", surveys >= 10, surveys, 10),
        B("profiles-5", profiles >= 5, profiles, 5),
        B("streak-7", streak.best >= 7, streak.best, 7),
        B("streak-30", streak.best >= 30, streak.best, 30),
        B("polls-10", polls >= 10, polls, 10),
        B("design-voter", taskCounts.design_vote >= 3, taskCounts.design_vote, 3),
        B("idea-maker", taskCounts.ideaApproved >= 1, taskCounts.ideaApproved, 1),
    ];
}

async function taskCounts(user, origin) {
    const list = await TaskEntry.find({ user: oid(user._id), origin }).populate({ path: "task", select: "kind" }).select("task status").lean();
    return {
        design_vote: list.filter((e) => e.task?.kind === "design_vote").length,
        idea: list.filter((e) => e.task?.kind === "idea").length,
        ideaApproved: list.filter((e) => e.task?.kind === "idea" && e.status === "approved").length,
    };
}

export async function progress(user, origin, now = new Date()) {
    const led = await ledger(user, origin);
    const [streak, tc] = await Promise.all([streakOf(user, origin), taskCounts(user, origin)]);
    const earned = led.balances.earned;
    const s = currentSeason(now);
    let season = null;
    if (s) {
        const from = new Date(`${s.starts}T00:00:00Z`), to = new Date(`${s.ends}T23:59:59Z`);
        const pts = led.entries.filter((e) => e.points > 0 && e.at && e.at >= from && e.at <= to).reduce((a, e) => a + e.points, 0);
        const stages = [...(s.stages || [])].sort((a, b) => a - b);
        season = {
            key: s.key, title: s.title, starts: s.starts, ends: s.ends, points: pts, started: now >= from,
            stages: stages.map((n, i) => ({ stage: i + 1, points: n, reached: pts >= n })),
            next: stages.find((n) => n > pts) ?? null,
        };
    }
    return {
        points: { earned, available: led.balances.available }, // points only: Teens never see money
        level: levelOf(earned),
        badges: badgesFrom({ entries: led.entries, streak, taskCounts: tc }),
        season,
        streak: { current: streak.current, best: streak.best },
    };
}

// ---- creative tasks ------------------------------------------------------------------------------------------------
const CREATIVE = ["design_vote", "idea", "poll"];
const openNow = (t, now = Date.now()) => (!t.startsAt || new Date(t.startsAt).getTime() <= now) && (!t.endsAt || new Date(t.endsAt).getTime() > now);

async function voteResults(task) {
    const rows = await TaskEntry.aggregate([{ $match: { task: oid(task._id), status: "approved" } }, { $group: { _id: "$choice", n: { $sum: 1 } } }]);
    const total = rows.reduce((s, r) => s + r.n, 0);
    const by = new Map(rows.map((r) => [r._id, r.n]));
    return { total, options: (task.options || []).map((o) => ({ key: o.key, pct: total ? Math.round(((by.get(o.key) || 0) * 100) / total) : 0 })) };
}

export async function tasks(user, origin) {
    requireTeen(user);
    const list = (await Task.find({ origin, kind: { $in: CREATIVE }, isActive: true, isDeleted: false, day: { $exists: false }, builtIn: { $exists: false }, audience: "teen" }).sort({ endsAt: 1, createdAt: -1 }).limit(50).lean())
        .filter((t) => openNow(t));
    const mine = await TaskEntry.find({ user: oid(user._id), origin, task: { $in: list.map((t) => t._id) } }).lean();
    const by = new Map(mine.map((e) => [String(e.task), e]));
    const out = [];
    for (const t of list) {
        const e = by.get(String(t._id));
        const item = {
            id: String(t._id), kind: t.kind, title: t.title, question: t.question || "", description: t.description || "",
            options: (t.options || []).map((o) => ({ key: o.key, label: o.label, image: o.image })),
            points: t.points || 0, endsAt: t.endsAt || null, season: t.season || null,
            done: Boolean(e), choice: e?.choice || null, status: e?.status || null,
        };
        if (e && t.kind !== "idea") item.results = await voteResults(t);
        if (t.kind === "idea") {
            // approved ideas only, never with a name
            item.ideas = (await TaskEntry.find({ task: t._id, status: "approved" }).sort({ updatedAt: -1 }).limit(10).select("text").lean()).map((x) => x.text);
        }
        out.push(item);
    }
    return out;
}

const BLOCK = /(https?:\/\/|www\.|@[a-z0-9]|\b\d{7,}\b)/i; // no links, handles or phone numbers in ideas
export async function answerTask(user, origin, id, body = {}) {
    requireTeen(user);
    if (!mongoose.isValidObjectId(id)) fail("bad_request", "That id isn't valid.");
    const t = await Task.findOne({ _id: id, origin, kind: { $in: CREATIVE }, audience: "teen", isActive: true, isDeleted: false }).lean();
    if (!t || !openNow(t)) fail("closed", "This activity has closed.", 409);
    const doc = { task: t._id, user: user._id, origin };
    if (t.kind === "idea") {
        const text = String(body.text || "").replace(/\s+/g, " ").trim();
        if (text.length < 10 || text.length > 500) fail("validation", "Write your idea in 10 to 500 characters.", 422);
        if (BLOCK.test(text)) fail("validation", "Please leave out links, usernames and phone numbers.", 422);
        Object.assign(doc, { text, status: "submitted" });
    } else {
        if (!(t.options || []).some((o) => o.key === body.choice)) fail("validation", "Pick one of the options.", 422);
        Object.assign(doc, { choice: body.choice, status: "approved" });
    }
    try { await TaskEntry.create(doc); } catch (e) { if (e?.code === 11000) fail("already", "You've already taken part in this one.", 409); throw e; }
    // votes pay at once; ideas pay when a moderator approves them
    if (t.kind !== "idea" && t.points > 0) await grant(user, origin, { category: "task", key: `task:${t._id}`, name: t.title, points: t.points, remarks: `Teen ${t.kind}` });
    await record(user, origin, `task:${t.kind}`);
    return { id: String(t._id), done: true, status: doc.status, results: t.kind === "idea" ? null : await voteResults(t) };
}

export async function moderateIdea(admin, origin, entryId, status) {
    if (!["approved", "rejected"].includes(status)) fail("validation", "status must be approved or rejected.", 422);
    const e = await TaskEntry.findOneAndUpdate({ _id: entryId, origin, status: "submitted" }, { $set: { status } }, { new: true }).populate("task").lean();
    if (!e) fail("conflict", "Only a waiting idea can be moderated.", 409);
    if (status === "approved" && e.task?.points > 0) {
        await grant({ _id: e.user }, origin, { category: "task", key: `task:${e.task._id}`, name: e.task.title, points: e.task.points, remarks: "Teen idea approved" });
    }
    return { id: String(e._id), status: e.status };
}

// ---- guardian links --------------------------------------------------------------------------------------------------
async function guardianOf(teenId, origin) {
    const reg = await TeenRegistration.findOne({ teen: oid(teenId), origin, status: "active" }).sort({ createdAt: -1 }).lean();
    if (!reg) return null;
    const g = await TeenGuardian.findById(reg.guardian).lean();
    return g ? { reg, guardian: g } : null;
}

async function issue(purpose, teen, guardian, origin, extra = {}) {
    const days = config().teen.guardianLinkDays?.[purpose] || 7;
    if (purpose === "view") await GuardianLink.updateMany({ teen: oid(teen._id), purpose, revokedAt: null }, { $set: { revokedAt: new Date() } });
    const token = crypto.randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + days * 86400000);
    await GuardianLink.create({ hash: hash(token), purpose, teen: oid(teen._id), guardian: guardian?._id, origin, expiresAt, ...extra });
    return { token, expiresAt };
}
async function checkLink(token, purpose, origin) {
    if (!looksLikeToken(token)) return { ok: false, reason: "invalid" };
    const doc = await GuardianLink.findOne({ hash: hash(token), purpose, origin }).lean();
    if (!doc) return { ok: false, reason: "invalid" };
    if (doc.revokedAt) return { ok: false, reason: "revoked" };
    if (doc.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
    if (purpose === "reward" && doc.usedAt) return { ok: false, reason: "used", doc };
    return { ok: true, doc };
}
const linkTo = (origin, mode, token) => `${siteUrl(origin)}/auth/guardian?${mode}=${encodeURIComponent(token)}`;
const firstName = (u) => u?.name?.first || "your teen";

export async function askGuardian(user, origin, r) {
    const found = await guardianOf(user._id, origin);
    if (!found) return false; // no active registration: the request stays waiting and support can see it
    const teen = await User.findById(user._id).select("name").lean();
    const { token, expiresAt } = await issue("reward", user, found.guardian, origin, { redemption: r._id });
    const view = await issue("view", user, found.guardian, origin);
    return send({
        origin, to: found.guardian.email, template: "guardian-reward", subject: `${firstName(teen)} would like a learning reward. Yes or no?`,
        data: {
            guardian: { firstName: found.guardian.name?.first || "" }, teen: { firstName: firstName(teen) },
            reward: { title: r.item?.title, subtitle: r.item?.subtitle || "", points: r.points, reference: r.reference },
            links: { yes: `${linkTo(origin, "reward", token)}&d=yes`, no: `${linkTo(origin, "reward", token)}&d=no`, view: linkTo(origin, "view", view.token) }, expires: expiresAt,
        },
    });
}
onTeenRequest(askGuardian);

export async function sendViewLink(user, origin) {
    requireTeen(user);
    const found = await guardianOf(user._id, origin);
    if (!found) fail("no_guardian", "We couldn't find your parent or guardian's details. Please contact support.", 409);
    const teen = await User.findById(user._id).select("name").lean();
    const { token, expiresAt } = await issue("view", user, found.guardian, origin);
    await send({
        origin, to: found.guardian.email, template: "guardian-view", subject: `See ${firstName(teen)}'s Teen Panel activity`,
        data: { guardian: { firstName: found.guardian.name?.first || "" }, teen: { firstName: firstName(teen) }, links: { view: linkTo(origin, "view", token) }, expires: expiresAt },
    });
    const m = String(found.guardian.email);
    return { sent: true, to: m.replace(/^(.)(.*)(@.*)$/, (x, a, b, c) => `${a}${"•".repeat(Math.min(6, b.length))}${c}`) };
}

// public (no sign-in): the page behind the guardian's link
export async function rewardRequest(token, origin) {
    const c = await checkLink(token, "reward", origin);
    if (!c.ok) {
        if (c.reason === "used" && c.doc) {
            const r = await Redemption.findById(c.doc.redemption).lean();
            return { ok: false, reason: "used", status: r?.status || null };
        }
        return { ok: false, reason: c.reason };
    }
    const r = await Redemption.findOne({ _id: c.doc.redemption, origin }).lean();
    const teen = await User.findById(c.doc.teen).select("name").lean();
    if (!r) return { ok: false, reason: "invalid" };
    return {
        ok: true, teen: { firstName: firstName(teen) },
        reward: { title: r.item?.title, subtitle: r.item?.subtitle || "", points: r.points, reference: r.reference, requestedAt: r.createdAt },
        status: r.status, expiresAt: c.doc.expiresAt,
    };
}

export async function decideReward(token, origin, decision) {
    if (!["yes", "no"].includes(decision)) fail("validation", "Choose yes or no.", 422);
    const c = await checkLink(token, "reward", origin);
    if (!c.ok) fail(c.reason, c.reason === "used" ? "This decision has already been made." : "This link is no longer valid.", c.reason === "invalid" ? 404 : 410);
    const used = await GuardianLink.updateOne({ _id: c.doc._id, usedAt: null }, { $set: { usedAt: new Date() } });
    if (used.modifiedCount !== 1) fail("used", "This decision has already been made.", 410);
    const to = decision === "yes" ? "approved" : "rejected";
    const r = await Redemption.findOneAndUpdate(
        { _id: c.doc.redemption, origin, status: "guardian_pending" },
        { $set: { status: to, guardian: { decision, at: new Date() }, ...(to === "rejected" ? { open: false, note: "Your parent or guardian said no this time. Your points are back." } : {}) }, $push: { history: { status: to, by: "guardian", at: new Date() } } },
        { new: true }
    ).lean();
    if (!r) fail("bad_state", "This request was cancelled or already decided.", 409);
    return { status: r.status };
}

export async function guardianView(token, origin) {
    const c = await checkLink(token, "view", origin);
    if (!c.ok) return { ok: false, reason: c.reason };
    const u = await User.findById(c.doc.teen).select("name timezone category origin").lean();
    if (!u || !isTeen(u)) return { ok: false, reason: "invalid" };
    const p = await progress(u, origin);
    const led = await ledger(u, origin);
    const reqs = (await Redemption.find({ user: u._id, origin }).sort({ createdAt: -1 }).limit(20).lean()).map(redemptionView)
        .map((r) => ({ reference: r.reference, title: r.item?.title, points: r.points, status: r.status, at: r.createdAt }));
    return {
        ok: true, teen: { firstName: firstName(u) }, expiresAt: c.doc.expiresAt,
        ...p,
        activity: led.entries.slice(0, 30).map((e) => ({ at: e.at, type: e.type, name: e.name, points: e.points, status: e.status })),
        rewards: reqs,
    };
}

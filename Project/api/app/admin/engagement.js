// Engagement (super admin spec module 8): daily polls, Teen creative tasks, monthly challenges, idea moderation,
// "your opinion mattered" stories and streak figures. Streak and poll figures are counts only, never members.
import mongoose from "mongoose";
import { Task, TaskEntry, Story, StreakDay, User } from "../model/index.js";
import { METRICS } from "../engagement/daily.js";
import { moderateIdea } from "../engagement/teens.js";
import { AdminError } from "./http.js";

const oid = (v) => new mongoose.Types.ObjectId(String(v));
const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v || ""));
const AUD = ["consumer", "professional", "teen"];
const KINDS = ["poll", "design_vote", "idea", "challenge"];
const str = (v, n) => (v === undefined || v === null ? undefined : String(v).trim().slice(0, n));
const drop = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
const aud = (a) => (Array.isArray(a) ? a : []).filter((x) => AUD.includes(x));
// Teen copy never talks money (same rule as the help centre)
const MONEY = /(\$|€|£|₹|\busd\b|\binr\b|\bcash\b|paypal|\bupi\b|gift ?card|payout|money)/i;
const teensSee = (audience) => !audience?.length || audience.includes("teen");

// ---- tasks -------------------------------------------------------------------------------------------------------------
const taskView = (t, c) => ({
    id: String(t._id), kind: t.kind, title: t.title, question: t.question || "", description: t.description || "",
    options: t.options || [], audience: t.audience || [], day: t.day || null, month: t.month || null, season: t.season || null,
    startsAt: t.startsAt || null, endsAt: t.endsAt || null, points: t.points || 0, goal: t.goal?.metric ? t.goal : null,
    active: t.isActive !== false, entries: c?.n || 0, waiting: c?.waiting || 0,
});
function taskBody(x = {}) {
    const out = drop({
        kind: x.kind, title: str(x.title, 120), question: str(x.question, 300), description: str(x.description, 1000),
        day: x.day, month: x.month, season: str(x.season, 40),
        points: x.points === undefined ? undefined : Number(x.points),
        audience: x.audience === undefined ? undefined : aud(x.audience),
        startsAt: x.startsAt ? new Date(x.startsAt) : undefined, endsAt: x.endsAt ? new Date(x.endsAt) : undefined,
    });
    if (out.kind !== undefined && !KINDS.includes(out.kind)) throw new AdminError("invalid_value", `kind is one of ${KINDS.join(", ")}`);
    if (out.points !== undefined && !(Number.isInteger(out.points) && out.points >= 0 && out.points <= 1000)) throw new AdminError("invalid_value", "points is a whole number from 0 to 1000");
    if (out.day !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(out.day)) throw new AdminError("invalid_value", "day is YYYY-MM-DD");
    if (out.month !== undefined && !/^\d{4}-\d{2}$/.test(out.month)) throw new AdminError("invalid_value", "month is YYYY-MM");
    if (x.options !== undefined) {
        out.options = (Array.isArray(x.options) ? x.options : []).slice(0, 8).map((o, i) => ({
            key: String(o?.key || i + 1).toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30) || String(i + 1),
            label: str(o?.label, 120) || "", ...(o?.image ? { image: str(o.image, 500) } : {}),
        }));
    }
    if (x.goal !== undefined) out.goal = { metric: x.goal?.metric, target: Number(x.goal?.target) };
    return out;
}
function checkTask(t) {
    if (!t.kind || !t.title) throw new AdminError("invalid_value", "kind and title are required");
    if (["poll", "design_vote"].includes(t.kind) && !(t.options?.length >= 2)) throw new AdminError("invalid_value", "A poll or design vote needs at least 2 options");
    if (t.kind === "poll" && !t.day && !(t.audience || []).includes("teen")) throw new AdminError("invalid_value", "A daily poll needs a day");
    if (["design_vote", "idea"].includes(t.kind) && JSON.stringify(t.audience || []) !== '["teen"]') throw new AdminError("invalid_value", "Design votes and ideas are Teen Panel tasks (audience teen)");
    if (t.kind === "challenge" && (!t.month || !METRICS.includes(t.goal?.metric) || !(Number.isInteger(t.goal?.target) && t.goal.target > 0)))
        throw new AdminError("invalid_value", `A challenge needs a month and a goal (metric one of ${METRICS.join(", ")}, whole target above 0)`);
    if (teensSee(t.audience) && MONEY.test([t.title, t.question, t.description, ...(t.options || []).map((o) => o.label)].join(" ")))
        throw new AdminError("teen_guardrail", "Teens can see this task, so it can't mention money, cash or payouts", 422);
}

export async function listTasks(origin, q = {}) {
    const f = { origin, isDeleted: false, builtIn: { $exists: false } };
    if (q.kind) f.kind = String(q.kind);
    const rows = await Task.find(f).select("+isActive").sort({ createdAt: -1 }).limit(200).lean();
    const counts = await TaskEntry.aggregate([
        { $match: { origin, task: { $in: rows.map((t) => t._id) } } },
        { $group: { _id: "$task", n: { $sum: 1 }, waiting: { $sum: { $cond: [{ $eq: ["$status", "submitted"] }, 1, 0] } } } },
    ]);
    const by = new Map(counts.map((c) => [String(c._id), c]));
    return rows.map((t) => taskView(t, by.get(String(t._id))));
}
export async function createTask(origin, body = {}) {
    const b = taskBody(body);
    checkTask(b);
    return taskView((await Task.create({ ...b, origin })).toObject());
}
export async function updateTask(origin, id, body = {}) {
    if (!isId(id)) throw new AdminError("not_found", "Not found", 404);
    const cur = await Task.findOne({ _id: oid(id), origin, isDeleted: false }).select("+isActive").lean();
    if (!cur) throw new AdminError("not_found", "Not found", 404);
    const b = taskBody(body);
    delete b.kind;
    if (body.active !== undefined) b.isActive = Boolean(body.active);
    // once anyone has answered, the options and points stay as they were (answers and points refer to them)
    if ((b.options || b.points !== undefined) && (await TaskEntry.exists({ task: cur._id, origin })))
        throw new AdminError("answered", "Members have already answered this task; its options and points can't change", 409);
    checkTask({ ...cur, ...b });
    const t = await Task.findOneAndUpdate({ _id: cur._id, origin }, { $set: b }, { new: true }).select("+isActive").lean();
    return taskView(t);
}

// ideas waiting for a moderator. The text is the teen's own words: shown to the moderator, never to other members
// until approved. The author is a first name and initial only.
export async function ideaQueue(origin, q = {}) {
    const rows = await TaskEntry.find({ origin, status: q.status === "all" ? { $in: ["submitted", "approved", "rejected"] } : "submitted", text: { $exists: true } })
        .sort({ createdAt: 1 }).limit(200).populate({ path: "task", select: "title kind points" }).lean();
    const users = await User.find({ _id: { $in: rows.map((r) => r.user) }, origin }).select("name").lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));
    return rows.filter((r) => r.task?.kind === "idea").map((r) => {
        const u = byId.get(String(r.user));
        return { id: String(r._id), task: { id: String(r.task._id), title: r.task.title, points: r.task.points || 0 }, text: r.text, status: r.status, by: u ? `${u.name?.first || ""} ${u.name?.last ? `${String(u.name.last)[0]}.` : ""}`.trim() : "", at: r.createdAt };
    });
}
export async function moderate(origin, id, status) {
    if (!isId(id)) throw new AdminError("not_found", "Not found", 404);
    return moderateIdea(null, origin, oid(id), status).catch((e) => { throw new AdminError(e.code || "conflict", e.message, e.status || 409); });
}

// ---- stories -----------------------------------------------------------------------------------------------------------
const storyView = (s) => ({
    id: String(s._id), type: s.type, title: s.title, summary: s.summary || "", body: s.body || "", image: s.image || "", brand: s.brand || "",
    stats: s.stats || [], audience: s.audience || [], industries: s.industries || [], sampleSize: s.sampleSize ?? null, fileUrl: s.fileUrl || "",
    published: Boolean(s.publishedAt), publishedAt: s.publishedAt || null, active: s.isActive !== false,
});
function storyBody(x = {}) {
    const out = drop({
        type: x.type, title: str(x.title, 140), summary: str(x.summary, 400), body: str(x.body, 8000), image: str(x.image, 500),
        brand: str(x.brand, 80), fileUrl: str(x.fileUrl, 500),
        audience: x.audience === undefined ? undefined : aud(x.audience),
        industries: x.industries === undefined ? undefined : (Array.isArray(x.industries) ? x.industries : []).map((s) => String(s).toLowerCase().slice(0, 60)),
        sampleSize: x.sampleSize === undefined ? undefined : Number(x.sampleSize),
    });
    if (out.type !== undefined && !["story", "insight"].includes(out.type)) throw new AdminError("invalid_value", "type is story or insight");
    if (out.sampleSize !== undefined && !(Number.isInteger(out.sampleSize) && out.sampleSize >= 0)) throw new AdminError("invalid_value", "sampleSize is a whole number");
    if (x.stats !== undefined) out.stats = (Array.isArray(x.stats) ? x.stats : []).slice(0, 6).map((s) => ({ label: str(s?.label, 80) || "", value: str(s?.value, 40) || "" }));
    return out;
}
// an insight is built from aggregates: it needs a sample size, and a small one could point at individuals
const MIN_SAMPLE = 30;
function checkStory(s) {
    if (!s.type || !s.title) throw new AdminError("invalid_value", "type and title are required");
    if (s.type === "insight" && !(s.sampleSize >= MIN_SAMPLE)) throw new AdminError("small_sample", `An insight needs at least ${MIN_SAMPLE} respondents behind it`, 422);
    if (teensSee(s.audience) && MONEY.test([s.title, s.summary, s.body].join(" "))) throw new AdminError("teen_guardrail", "Teens can see this story, so it can't mention money, cash or payouts", 422);
}
export async function listStories(origin, q = {}) {
    const f = { origin, isDeleted: false };
    if (q.type) f.type = String(q.type);
    return (await Story.find(f).select("+isActive").sort({ createdAt: -1 }).limit(200).lean()).map(storyView);
}
export async function createStory(origin, body = {}) {
    const b = storyBody(body);
    checkStory(b);
    return storyView((await Story.create({ ...b, origin, publishedAt: null })).toObject());
}
export async function updateStory(origin, id, body = {}) {
    if (!isId(id)) throw new AdminError("not_found", "Not found", 404);
    const cur = await Story.findOne({ _id: oid(id), origin, isDeleted: false }).select("+isActive").lean();
    if (!cur) throw new AdminError("not_found", "Not found", 404);
    const b = storyBody(body);
    delete b.type;
    if (body.active !== undefined) b.isActive = Boolean(body.active);
    if (body.published !== undefined) b.publishedAt = body.published ? cur.publishedAt || new Date() : null;
    checkStory({ ...cur, ...b });
    return storyView(await Story.findOneAndUpdate({ _id: cur._id, origin }, { $set: b }, { new: true }).select("+isActive").lean());
}

// ---- streaks: how many members were active on each of the last `days` days, and current streak lengths -----------------
export async function streakStats(origin, { days = 30 } = {}) {
    const n = Math.min(90, Math.max(7, Number(days) || 30));
    const from = new Date(Date.now() - (n - 1) * 86400000).toISOString().slice(0, 10);
    const perDay = await StreakDay.aggregate([{ $match: { origin, day: { $gte: from } } }, { $group: { _id: "$day", members: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
    // current streak = consecutive days ending today or yesterday (UTC days; close enough for a brand-wide figure)
    const recent = await StreakDay.aggregate([{ $match: { origin, day: { $gte: from } } }, { $group: { _id: "$user", days: { $addToSet: "$day" } } }]);
    const today = new Date().toISOString().slice(0, 10);
    const yday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const buckets = { "1-6": 0, "7-29": 0, "30+": 0 };
    for (const r of recent) {
        const set = new Set(r.days);
        let d = set.has(today) ? today : set.has(yday) ? yday : null;
        let len = 0;
        while (d && set.has(d)) { len += 1; d = new Date(new Date(`${d}T00:00:00Z`).getTime() - 86400000).toISOString().slice(0, 10); }
        if (len >= 30) buckets["30+"] += 1; else if (len >= 7) buckets["7-29"] += 1; else if (len >= 1) buckets["1-6"] += 1;
    }
    return { days: n, perDay: perDay.map((d) => ({ day: d._id, members: d.members })), currentStreaks: buckets };
}

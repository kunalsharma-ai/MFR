// Phase 3: daily poll and monthly challenges.
//
// Daily poll: one quick question a day, worth config.dailyPoll.points, which also counts as a streak day. Admins can
// schedule a poll for a day (Task kind "poll" with `day`); otherwise the day's poll comes from the built-in rotation
// below, saved as a Task the first time anyone opens it so that votes can be counted.
//
// Monthly challenges: config.challenges.monthly (or the admin's Task kind "challenge" for that month). Progress is read
// from the member's real activity in the month, in their own time zone. A reconciler pays the bonus once per
// challenge per month (Reward key challenge:<month>:<key>).
import mongoose from "mongoose";
import { Task, TaskEntry, Response, Reward, StreakDay } from "../model/index.js";
import { config } from "./config.js";
import { grant, registerReconciler } from "./ledger.js";
import { record } from "./streak.js";
import { dayKey, monthKey, daysBetween } from "./time.js";
import { memberType, fail } from "./http.js";

const oid = (id) => new mongoose.Types.ObjectId(String(id));

// Opinion questions only: nothing personal or sensitive, so a poll never needs consent wording of its own.
const yesNo = [{ key: "yes", label: "Yes" }, { key: "no", label: "No" }, { key: "unsure", label: "Not sure" }];
export const BUILT_IN = {
    adult: [
        { key: "a-shop", question: "Where do you do most of your shopping?", options: [{ key: "online", label: "Online" }, { key: "store", label: "In stores" }, { key: "both", label: "About the same" }] },
        { key: "a-coffee", question: "Coffee or tea?", options: [{ key: "coffee", label: "Coffee" }, { key: "tea", label: "Tea" }, { key: "neither", label: "Neither" }] },
        { key: "a-reviews", question: "Do you read reviews before you buy something new?", options: [{ key: "always", label: "Always" }, { key: "sometimes", label: "Sometimes" }, { key: "never", label: "Never" }] },
        { key: "a-news", question: "Where do you get most of your news?", options: [{ key: "social", label: "Social media" }, { key: "sites", label: "News sites or apps" }, { key: "tv", label: "TV or radio" }, { key: "people", label: "Friends and family" }] },
        { key: "a-ai", question: "Have you used an AI assistant in the last week?", options: yesNo },
        { key: "a-weekend", question: "How do you like to spend a free weekend?", options: [{ key: "out", label: "Out and about" }, { key: "home", label: "At home" }, { key: "travel", label: "Travelling" }] },
        { key: "a-pay", question: "How do you usually pay in shops?", options: [{ key: "card", label: "Card" }, { key: "phone", label: "Phone or UPI" }, { key: "cash", label: "Cash" }] },
        { key: "a-eco", question: "Would you pay a little more for a greener product?", options: yesNo },
        { key: "a-stream", question: "How many streaming services do you use?", options: [{ key: "0", label: "None" }, { key: "1", label: "One" }, { key: "2-3", label: "Two or three" }, { key: "4", label: "Four or more" }] },
        { key: "a-work", question: "Where would you rather work?", options: [{ key: "office", label: "Office" }, { key: "home", label: "Home" }, { key: "mix", label: "A mix" }] },
    ],
    teen: [
        { key: "t-learn", question: "How do you like to learn something new?", options: [{ key: "video", label: "Videos" }, { key: "reading", label: "Reading" }, { key: "doing", label: "Trying it myself" }, { key: "friends", label: "From friends" }] },
        { key: "t-music", question: "What do you listen to most?", options: [{ key: "pop", label: "Pop" }, { key: "hiphop", label: "Hip-hop" }, { key: "rock", label: "Rock" }, { key: "other", label: "Something else" }] },
        { key: "t-games", question: "Phone games or console games?", options: [{ key: "phone", label: "Phone" }, { key: "console", label: "Console or PC" }, { key: "neither", label: "Neither" }] },
        { key: "t-sport", question: "Do you play a sport outside school?", options: yesNo },
        { key: "t-power", question: "Pick a superpower", options: [{ key: "fly", label: "Flying" }, { key: "time", label: "Time travel" }, { key: "invisible", label: "Invisibility" }, { key: "mind", label: "Mind reading" }] },
        { key: "t-snack", question: "Sweet or savoury snacks?", options: [{ key: "sweet", label: "Sweet" }, { key: "savoury", label: "Savoury" }, { key: "both", label: "Both" }] },
        { key: "t-future", question: "Which job sounds most fun?", options: [{ key: "creator", label: "Creator" }, { key: "science", label: "Scientist" }, { key: "design", label: "Designer" }, { key: "sport", label: "Athlete" }] },
        { key: "t-weekend", question: "Best way to spend a Saturday?", options: [{ key: "friends", label: "With friends" }, { key: "outside", label: "Outdoors" }, { key: "home", label: "Chilling at home" }] },
    ],
};
const groupOf = (type) => (type === "teen" ? "teen" : "adult");

// The day's poll for this member: a scheduled one if there is one for their audience, else the rotation's.
export async function pollFor(user, origin, now = new Date()) {
    const type = memberType(user);
    const day = dayKey(now, user.timezone);
    const scheduled = await Task.findOne({
        origin, kind: "poll", day, isActive: true, isDeleted: false, builtIn: { $exists: false },
        $or: [{ audience: { $size: 0 } }, { audience: type }],
    }).lean();
    if (scheduled) return scheduled;
    const list = BUILT_IN[groupOf(type)];
    const b = list[Math.abs(daysBetween("2026-01-01", day)) % list.length];
    const key = `${groupOf(type)}:${b.key}`;
    const filter = { origin, builtIn: key, day };
    try {
        await Task.updateOne(filter, {
            $setOnInsert: { ...filter, kind: "poll", title: "Daily poll", question: b.question, options: b.options, audience: groupOf(type) === "teen" ? ["teen"] : ["consumer", "professional"], points: config().dailyPoll.points, isActive: true, isDeleted: false },
        }, { upsert: true });
    } catch (e) { if (e?.code !== 11000) throw e; }
    return Task.findOne(filter).lean();
}

async function results(task) {
    const rows = await TaskEntry.aggregate([{ $match: { task: oid(task._id), status: "approved" } }, { $group: { _id: "$choice", n: { $sum: 1 } } }]);
    const total = rows.reduce((s, r) => s + r.n, 0);
    const by = new Map(rows.map((r) => [r._id, r.n]));
    return { total, options: (task.options || []).map((o) => ({ key: o.key, label: o.label, votes: by.get(o.key) || 0, pct: total ? Math.round(((by.get(o.key) || 0) * 100) / total) : 0 })) };
}

function pollView(task, mine, res) {
    return {
        id: String(task._id),
        question: task.question || task.title,
        options: (task.options || []).map((o) => ({ key: o.key, label: o.label, image: o.image })),
        points: config().dailyPoll.points,
        answered: Boolean(mine),
        choice: mine?.choice || null,
        // results are shown only after answering, so they don't steer the answer
        results: mine ? res : null,
    };
}

export async function todayPoll(user, origin) {
    if (!config().dailyPoll.enabled) return null;
    const task = await pollFor(user, origin);
    const mine = await TaskEntry.findOne({ task: task._id, user: oid(user._id), origin }).lean();
    return pollView(task, mine, mine ? await results(task) : null);
}

export async function answerPoll(user, origin, id, choice) {
    if (!config().dailyPoll.enabled) fail("closed", "The daily poll is switched off.", 409);
    const task = await pollFor(user, origin);
    if (String(task._id) !== String(id)) fail("expired", "That poll has closed. Here is today's.", 409);
    if (!(task.options || []).some((o) => o.key === choice)) fail("validation", "Pick one of the answers.", 422);
    try {
        await TaskEntry.create({ task: task._id, user: user._id, choice, status: "approved", origin });
    } catch (e) {
        if (e?.code === 11000) fail("already", "You've already answered today's poll.", 409);
        throw e;
    }
    const points = Math.max(0, Number(config().dailyPoll.points) || 0);
    if (points > 0) {
        await grant(user, origin, { category: "poll", key: `poll:${task._id}`, name: "Daily poll", points, remarks: task.question });
    }
    await record(user, origin, "poll");
    const mine = { choice };
    return pollView(task, mine, await results(task));
}

// ---- challenges ----------------------------------------------------------------------------------------------------
export const METRICS = ["surveys", "profiles", "polls", "active_days", "tasks"];

async function challengesOf(user, origin, month) {
    const c = config().challenges;
    if (!c?.enabled) return [];
    const type = memberType(user);
    const scheduled = await Task.find({ origin, kind: "challenge", month, isActive: true, isDeleted: false }).lean();
    const list = scheduled.length
        ? scheduled.map((t) => ({ key: String(t._id), title: t.title, description: t.description, metric: t.goal?.metric, target: t.goal?.target, points: t.points, audience: t.audience }))
        : (c.monthly || []);
    return list.filter((x) => METRICS.includes(x.metric) && x.target > 0 && (!x.audience?.length || x.audience.includes(type)));
}

// what the member did in `month` (their time zone). A wide UTC window is read, then each record is placed by day.
export async function monthActivity(user, origin, month) {
    const u = oid(user._id);
    const start = new Date(`${month}-01T00:00:00Z`);
    const from = new Date(start.getTime() - 86400000);
    const to = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 2));
    const inMonth = (d) => d && monthKey(d, user.timezone) === month;
    const [responses, profiles, entries, streakDays] = await Promise.all([
        Response.find({ user: u, origin, status: "complete", isActive: true, isDeleted: false, updatedAt: { $gte: from, $lt: to } }).select("updatedAt").lean(),
        Reward.find({ user: u, origin, category: "profile", isActive: true, isDeleted: false, createdAt: { $gte: from, $lt: to } }).select("createdAt").lean(),
        TaskEntry.find({ user: u, origin, createdAt: { $gte: from, $lt: to } }).populate({ path: "task", select: "kind" }).select("createdAt task").lean(),
        StreakDay.find({ user: u, origin, day: { $regex: `^${month}-` } }).select("day").lean(),
    ]);
    const days = new Set(streakDays.map((d) => d.day));
    for (const r of responses) if (inMonth(r.updatedAt)) days.add(dayKey(r.updatedAt, user.timezone));
    for (const r of profiles) if (inMonth(r.createdAt)) days.add(dayKey(r.createdAt, user.timezone));
    const es = entries.filter((e) => inMonth(e.createdAt));
    return {
        surveys: responses.filter((r) => inMonth(r.updatedAt)).length,
        profiles: profiles.filter((r) => inMonth(r.createdAt)).length,
        polls: es.filter((e) => e.task?.kind === "poll").length,
        tasks: es.filter((e) => e.task && e.task.kind !== "poll").length,
        active_days: [...days].filter((d) => d.startsWith(`${month}-`)).length,
    };
}

export async function challenges(user, origin, now = new Date()) {
    const month = monthKey(now, user.timezone);
    const list = await challengesOf(user, origin, month);
    if (!list.length) return { month, items: [] };
    const act = await monthActivity(user, origin, month);
    const paid = new Set((await Reward.find({ user: oid(user._id), origin, category: "challenge", key: { $regex: `^challenge:${month}:` } }).select("key").lean()).map((r) => r.key));
    const from = String(config().challenges.from || "0000-00");
    return {
        month,
        bonusesFrom: from,
        items: list.map((x) => {
            const progress = Math.min(x.target, act[x.metric] || 0);
            return {
                key: x.key, title: x.title, description: x.description || "", metric: x.metric, target: x.target, points: x.points,
                progress, done: progress >= x.target, paid: paid.has(`challenge:${month}:${String(x.key).toLowerCase()}`),
                pays: month >= from,
            };
        }),
    };
}

registerReconciler(async (user, origin) => {
    const c = config().challenges;
    if (!c?.enabled) return;
    // this month, and last month in case the target was reached in its final hours and nothing was read since
    const now = new Date();
    const cur = monthKey(now, user.timezone);
    const [y, m] = cur.split("-").map(Number);
    for (const when of [now, new Date(Date.UTC(y, m - 2, 15))]) {
        const { month, items } = await challenges(user, origin, when);
        for (const x of items) {
            if (x.done && x.pays && !x.paid && x.points > 0) {
                await grant(user, origin, { category: "challenge", key: `challenge:${month}:${x.key}`, name: x.title, points: x.points, remarks: `Monthly challenge ${month}` });
            }
        }
    }
});

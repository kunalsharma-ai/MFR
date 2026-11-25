// Reports and dashboards (super admin spec, step 5). Every report is aggregate counts for one brand (origin): no names,
// e-mails or other personal data, and never added across brands. MADP turns these into tables, applies its small-cell
// rule and exports them to CSV and Excel.
//
//   GET /api/v1/admin/reports/:name?from=YYYY-MM-DD&to=YYYY-MM-DD
//
// Segments are reported by the member's category as stored (b2c, b2b, b2c-minor on T2O and MFR; healthcare
// professional, patient, care giver on MHO) with a readable label.
import { User, Response, Survey, Reward, Redemption, PointsHold, TeenRegistration, SupportTicket, SupportComment, Task, TaskEntry, StreakDay, Profile, Answers } from "../model/index.js";
import { tiers, tierOf } from "../engagement/quality.js";
import { STATUS } from "../teen/rules.js";
import { AdminError } from "./http.js";

const DAY = 86400000;
const LABELS = {
    b2c: "Consumer", consumer: "Consumer", b2b: "Business Professional", professional: "Business Professional",
    "b2c-minor": "Teen", minor: "Teen", "healthcare professional": "Healthcare Professional", patient: "Patient",
    "care giver": "Caregiver", caregiver: "Caregiver", "minor patient": "Teen patient",
};
export const segmentLabel = (c) => LABELS[String(c || "").toLowerCase()] || (c ? String(c) : "Unknown");
const seg = { $toLower: { $ifNull: ["$category", ""] } };
const live = (origin) => ({ origin, isDeleted: { $ne: true } });

/** from/to (YYYY-MM-DD, UTC days, `to` inclusive). Defaults to the last 30 days. */
export function period({ from, to } = {}, now = new Date()) {
    const re = /^\d{4}-\d{2}-\d{2}$/;
    if ((from && !re.test(from)) || (to && !re.test(to))) throw new AdminError("invalid_value", "from and to are YYYY-MM-DD");
    const end = to ? new Date(Date.parse(`${to}T00:00:00Z`) + DAY) : now;
    const start = from ? new Date(`${from}T00:00:00Z`) : new Date(end.getTime() - 30 * DAY);
    if (!(start < end)) throw new AdminError("invalid_value", "from must be before to");
    if (end - start > 731 * DAY) throw new AdminError("invalid_value", "A period is at most two years");
    return { start, end, from: start.toISOString().slice(0, 10), to: new Date(end.getTime() - 1).toISOString().slice(0, 10) };
}
const month = (field) => ({ $dateToString: { format: "%Y-%m", date: field } });
const round = (n, d = 1) => (Number.isFinite(n) ? Math.round(n * 10 ** d) / 10 ** d : null);

// ---- the reports ---------------------------------------------------------------------------------------------------
const REPORTS = {
    /** Total, active in 30 days, new sign-ups in the period, archived: by segment and country. */
    async panel_health(origin, p) {
        const since30 = new Date(Date.now() - 30 * DAY);
        const rows = await User.aggregate([
            { $match: live(origin) },
            { $group: {
                _id: { segment: seg, country: { $toLower: { $ifNull: [{ $arrayElemAt: ["$address.country", 0] }, ""] } } },
                total: { $sum: 1 },
                active30: { $sum: { $cond: [{ $gte: ["$lastActivityAt", since30] }, 1, 0] } },
                newInPeriod: { $sum: { $cond: [{ $and: [{ $gte: ["$createdAt", p.start] }, { $lt: ["$createdAt", p.end] }] }, 1, 0] } },
                archived: { $sum: { $cond: [{ $eq: ["$memberStatus", "archived"] }, 1, 0] } },
            } },
            { $sort: { total: -1 } }, { $limit: 500 },
        ]);
        return rows.map((r) => ({ segment: r._id.segment, segmentLabel: segmentLabel(r._id.segment), country: r._id.country || null, total: r.total, active30: r.active30, newInPeriod: r.newInPeriod, archived: r.archived }));
    },

    /** Members registered in the period, and how many reached each step. */
    async signup_funnel(origin, p) {
        const rows = await User.aggregate([
            { $match: { ...live(origin), createdAt: { $gte: p.start, $lt: p.end } } },
            { $lookup: { from: "Reward", let: { u: "$_id" }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$user", "$$u"] }, { $eq: ["$origin", origin] }, { $eq: ["$category", "profile"] }] } } }, { $limit: 1 }, { $project: { _id: 1 } }], as: "prof" } },
            { $lookup: { from: "Response", let: { u: "$_id" }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$user", "$$u"] }, { $eq: ["$origin", origin] }, { $eq: ["$status", "complete"] }] } } }, { $limit: 1 }, { $project: { _id: 1 } }], as: "done" } },
            { $group: {
                _id: { segment: seg, source: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ["$referredBy", ""] } }, 0] }, "referral", "direct"] } },
                registered: { $sum: 1 },
                verifiedEmail: { $sum: { $cond: [{ $eq: ["$isVerified.email", "verified"] }, 1, 0] } },
                consent: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ["$terms", []] } }, 0] }, 1, 0] } },
                firstProfile: { $sum: { $cond: [{ $gt: [{ $size: "$prof" }, 0] }, 1, 0] } },
                firstSurvey: { $sum: { $cond: [{ $gt: [{ $size: "$done" }, 0] }, 1, 0] } },
            } },
            { $sort: { registered: -1 } },
        ]);
        return rows.map((r) => ({ segment: r._id.segment, segmentLabel: segmentLabel(r._id.segment), source: r._id.source, registered: r.registered, verifiedEmail: r.verifiedEmail, consent: r.consent, firstProfile: r.firstProfile, firstSurvey: r.firstSurvey }));
    },

    /** Teen registrations at each status, guardian reply time and expired links (registrations started in the period). */
    async teen_pipeline(origin, p) {
        const regs = await TeenRegistration.find({ origin, createdAt: { $gte: p.start, $lt: p.end } }).select("status history createdAt").lean();
        const all = await TeenRegistration.aggregate([{ $match: { origin } }, { $group: { _id: "$status", n: { $sum: 1 } } }]);
        const now = new Map(all.map((a) => [a._id, a.n]));
        const inPeriod = new Map();
        const replyHours = [];
        for (const r of regs) {
            inPeriod.set(r.status, (inPeriod.get(r.status) || 0) + 1);
            const asked = (r.history || []).find((h) => h.status === "pending_guardian_approval");
            const answered = (r.history || []).find((h) => ["guardian_approved", "rejected"].includes(h.status) && h.by !== "system");
            if (asked && answered) replyHours.push((new Date(answered.at) - new Date(asked.at)) / 3600000);
        }
        replyHours.sort((a, b) => a - b);
        const median = replyHours.length ? replyHours[Math.floor(replyHours.length / 2)] : null;
        return Object.values(STATUS).map((s) => ({
            status: s, now: now.get(s) || 0, startedInPeriod: inPeriod.get(s) || 0,
            ...(s === "guardian_approved" ? { medianGuardianReplyHours: round(median), guardianReplies: replyHours.length } : {}),
        }));
    },

    /** Per profile: members who answered at least one question, members who finished, and the biggest drop-off question. */
    async profile_completion(origin) {
        const profiles = await Profile.find({ origin, isActive: true, isDeleted: false }).select("slug name category pages").lean();
        const out = [];
        for (const pr of profiles.slice(0, 120)) {
            const names = (pr.pages || []).flat().filter(Boolean);
            if (!names.length) continue;
            const per = await Answers.aggregate([
                { $match: { origin, question: { $in: names } } },
                { $group: { _id: "$question", users: { $addToSet: "$user" } } },
                { $project: { n: { $size: "$users" }, users: 1 } },
            ]);
            const count = new Map(per.map((x) => [x._id, x.n]));
            const started = new Set(per.flatMap((x) => x.users.map(String))).size;
            const finished = await Reward.countDocuments({ origin, category: "profile", key: `profile:${String(pr.slug || "").toLowerCase()}` });
            let drop = null, worst = 0;
            for (let i = 1; i < names.length; i += 1) {
                const d = (count.get(names[i - 1]) || 0) - (count.get(names[i]) || 0);
                if (d > worst) { worst = d; drop = names[i]; }
            }
            out.push({ profile: pr.slug, name: pr.name, segment: Array.isArray(pr.category) ? pr.category.join(", ") : pr.category || null, questions: names.length, started, finished, completionRate: started ? round((finished / started) * 100) : null, dropOffQuestion: drop, dropOffMembers: worst || 0 });
        }
        return out.sort((a, b) => b.started - a.started);
    },

    /** Per survey with activity in the period: invites, starts, completes, screen-outs, over quota, incidence, LOI. */
    async survey_performance(origin, p) {
        const rows = await Response.aggregate([
            { $match: { origin, isDeleted: { $ne: true }, updatedAt: { $gte: p.start, $lt: p.end } } },
            { $group: {
                _id: { $toLower: { $ifNull: ["$survey.slug", ""] } }, name: { $first: "$survey.name" },
                invites: { $sum: 1 },
                starts: { $sum: { $cond: [{ $in: ["$status", ["invited", null, ""]] }, 0, 1] } },
                completes: { $sum: { $cond: [{ $eq: ["$status", "complete"] }, 1, 0] } },
                screenOuts: { $sum: { $cond: [{ $eq: ["$status", "terminate"] }, 1, 0] } },
                overQuota: { $sum: { $cond: [{ $eq: ["$status", "overquota"] }, 1, 0] } },
                points: { $sum: { $cond: [{ $eq: ["$status", "complete"] }, { $ifNull: ["$points", 0] }, 0] } },
            } },
            { $sort: { invites: -1 } }, { $limit: 500 },
        ]);
        const surveys = await Survey.find({ origin, slug: { $in: rows.map((r) => r._id) } }).select("slug loi status").lean();
        const by = new Map(surveys.map((s) => [String(s.slug).toLowerCase(), s]));
        return rows.map((r) => ({
            survey: r._id || null, name: r.name || null, status: by.get(r._id)?.status || null,
            invites: r.invites, starts: r.starts, completes: r.completes, screenOuts: r.screenOuts, overQuota: r.overQuota,
            incidence: r.completes + r.screenOuts ? round((r.completes / (r.completes + r.screenOuts)) * 100) : null,
            loi: by.get(r._id)?.loi ?? null, pointsPaid: r.points,
        }));
    },

    /** Points issued, redeemed and unspent by segment and month; held entries now. MADP values them at the brand rate. */
    async points_liability(origin, p) {
        const userSeg = { from: "User", localField: "user", foreignField: "_id", as: "u" };
        const segOf = { $toLower: { $ifNull: [{ $arrayElemAt: ["$u.category", 0] }, ""] } };
        const [earnedSurveys, earnedRewards, redeemed, held] = await Promise.all([
            Response.aggregate([{ $match: { origin, status: "complete", createdAt: { $lt: p.end } } }, { $lookup: userSeg }, { $group: { _id: { s: segOf, m: month("$createdAt") }, points: { $sum: { $ifNull: ["$points", 0] } } } }]),
            Reward.aggregate([{ $match: { origin, isDeleted: { $ne: true }, createdAt: { $lt: p.end } } }, { $lookup: userSeg }, { $group: { _id: { s: segOf, m: month("$createdAt") }, points: { $sum: { $ifNull: ["$points", 0] } } } }]),
            Redemption.aggregate([{ $match: { origin, status: { $ne: "rejected" }, createdAt: { $lt: p.end } } }, { $lookup: userSeg }, { $group: { _id: { s: segOf, m: month("$createdAt") }, points: { $sum: "$points" } } }]),
            PointsHold.aggregate([{ $match: { origin, releasedAt: null, isActive: true, isDeleted: false } }, { $lookup: userSeg }, { $group: { _id: segOf, entries: { $sum: 1 } } }]),
        ]);
        const key = (s, m) => `${s}|${m}`;
        const rows = new Map();
        const add = (list, field) => { for (const r of list) { const k = key(r._id.s, r._id.m); const row = rows.get(k) || { segment: r._id.s, month: r._id.m, issued: 0, redeemed: 0 }; row[field] += r.points; rows.set(k, row); } };
        add(earnedSurveys, "issued"); add(earnedRewards, "issued"); add(redeemed, "redeemed");
        const heldBy = new Map(held.map((h) => [h._id, h.entries]));
        const fromMonth = p.from.slice(0, 7);
        // running unspent per segment, then keep the months in the period
        const out = [];
        const running = new Map();
        for (const r of [...rows.values()].sort((a, b) => a.month.localeCompare(b.month))) {
            const u = (running.get(r.segment) || 0) + r.issued - r.redeemed;
            running.set(r.segment, u);
            if (r.month >= fromMonth) out.push({ segment: r.segment, segmentLabel: segmentLabel(r.segment), month: r.month, issued: r.issued, redeemed: r.redeemed, unspentAtMonthEnd: u, entriesOnHoldNow: heldBy.get(r.segment) || 0 });
        }
        return out.sort((a, b) => a.segment.localeCompare(b.segment) || a.month.localeCompare(b.month));
    },

    /** Redemptions requested in the period by payout method and country: outcomes and days to pay. */
    async redemptions(origin, p) {
        const rows = await Redemption.aggregate([
            { $match: { origin, createdAt: { $gte: p.start, $lt: p.end } } },
            { $lookup: { from: "User", localField: "user", foreignField: "_id", as: "u" } },
            { $group: {
                _id: { method: { $ifNull: ["$payout.method", "$item.kind"] }, country: { $toLower: { $ifNull: [{ $arrayElemAt: [{ $arrayElemAt: ["$u.address.country", 0] }, 0] }, ""] } } },
                requested: { $sum: 1 },
                approved: { $sum: { $cond: [{ $in: ["$status", ["approved", "fulfilled"]] }, 1, 0] } },
                paid: { $sum: { $cond: [{ $eq: ["$status", "fulfilled"] }, 1, 0] } },
                rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
                waiting: { $sum: { $cond: [{ $in: ["$status", ["requested", "guardian_pending"]] }, 1, 0] } },
                points: { $sum: "$points" },
                daysToPay: { $avg: { $cond: [{ $and: [{ $eq: ["$status", "fulfilled"] }, { $ne: ["$fulfilledAt", null] }] }, { $divide: [{ $subtract: ["$fulfilledAt", "$createdAt"] }, DAY] }, null] } },
            } },
            { $sort: { requested: -1 } },
        ]);
        return rows.map((r) => ({ method: r._id.method || null, country: r._id.country || null, requested: r.requested, approved: r.approved, paid: r.paid, rejected: r.rejected, waiting: r.waiting, points: r.points, avgDaysToPay: round(r.daysToPay) }));
    },

    /** Score spread, tier counts and members flagged (below 60), by segment and country. */
    async quality(origin) {
        const rows = await User.aggregate([
            { $match: live(origin) },
            { $project: { s: seg, c: { $toLower: { $ifNull: [{ $arrayElemAt: ["$address.country", 0] }, ""] } }, q: { $ifNull: ["$qualityScore", 100] } } },
            { $group: { _id: { s: "$s", c: "$c", b: { $min: [3, { $floor: { $divide: ["$q", 50] } }] } }, n: { $sum: 1 }, flagged: { $sum: { $cond: [{ $lt: ["$q", 60] }, 1, 0] } }, scores: { $push: "$q" } } },
        ]);
        const t = tiers();
        const out = new Map();
        for (const r of rows) {
            const k = `${r._id.s}|${r._id.c}`;
            const row = out.get(k) || { segment: r._id.s, segmentLabel: segmentLabel(r._id.s), country: r._id.c || null, members: 0, score0to49: 0, score50to99: 0, score100to149: 0, score150to200: 0, flaggedBelow60: 0, ...Object.fromEntries(t.map((x) => [`tier_${x.key}`, 0])) };
            row.members += r.n;
            row[["score0to49", "score50to99", "score100to149", "score150to200"][r._id.b]] += r.n;
            row.flaggedBelow60 += r.flagged;
            for (const q of r.scores) { const k2 = tierOf(q).tier?.key; if (k2) row[`tier_${k2}`] += 1; }
            out.set(k, row);
        }
        return [...out.values()].sort((a, b) => b.members - a.members).slice(0, 500);
    },

    /** Members who joined from a referral, by month: joins, verified, first surveys; plus suspected fraud now. */
    async referrals(origin, p) {
        const rows = await User.aggregate([
            { $match: { ...live(origin), referredBy: { $nin: [null, ""] }, createdAt: { $gte: p.start, $lt: p.end } } },
            { $lookup: { from: "Response", let: { u: "$_id" }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$user", "$$u"] }, { $eq: ["$status", "complete"] }] } } }, { $limit: 1 }, { $project: { _id: 1 } }], as: "done" } },
            { $group: { _id: month("$createdAt"), joins: { $sum: 1 }, verified: { $sum: { $cond: [{ $eq: ["$isVerified.email", "verified"] }, 1, 0] } }, firstSurvey: { $sum: { $cond: [{ $gt: [{ $size: "$done" }, 0] }, 1, 0] } }, referrers: { $addToSet: "$referredBy" } } },
            { $sort: { _id: 1 } },
        ]);
        // a referrer with 5+ sign-ups of whom under half verified their e-mail is "suspected" (same rule as the fraud view)
        const sus = await User.aggregate([
            { $match: { ...live(origin), referredBy: { $nin: [null, ""] } } },
            { $group: { _id: "$referredBy", n: { $sum: 1 }, v: { $sum: { $cond: [{ $eq: ["$isVerified.email", "verified"] }, 1, 0] } } } },
            { $match: { n: { $gte: 5 }, $expr: { $lt: [{ $multiply: ["$v", 2] }, "$n"] } } },
            { $count: "n" },
        ]);
        const suspected = sus[0]?.n || 0;
        return rows.map((r) => ({ month: r._id, joins: r.joins, verifiedEmail: r.verified, firstSurvey: r.firstSurvey, referrers: r.referrers.length, suspectedReferrersNow: suspected }));
    },

    /** Tickets opened in the period by topic and agent: open, resolved and first reply time. */
    async support(origin, p) {
        const tickets = await SupportTicket.find({ origin, createdAt: { $gte: p.start, $lt: p.end } }).select("ticketNo category status assignedTo createdAt").lean();
        const first = await SupportComment.aggregate([
            { $match: { origin, ticketNo: { $in: tickets.map((t) => t.ticketNo).filter(Boolean) }, "author.kind": "agent", type: { $ne: "note" } } },
            { $group: { _id: "$ticketNo", at: { $min: "$createdAt" } } },
        ]);
        const firstAt = new Map(first.map((f) => [f._id, f.at]));
        const out = new Map();
        for (const t of tickets) {
            const topic = t.category || "general";
            const agent = t.assignedTo?.name || (typeof t.assignedTo === "string" ? t.assignedTo : null) || "unassigned";
            const k = `${topic}|${agent}`;
            const row = out.get(k) || { topic, agent, opened: 0, open: 0, resolved: 0, replied: 0, hours: [] };
            row.opened += 1;
            if (["resolved", "closed"].includes(t.status)) row.resolved += 1; else row.open += 1;
            const f = firstAt.get(t.ticketNo);
            if (f) { row.replied += 1; row.hours.push((new Date(f) - new Date(t.createdAt)) / 3600000); }
            out.set(k, row);
        }
        return [...out.values()].map(({ hours, ...r }) => ({ ...r, avgFirstReplyHours: hours.length ? round(hours.reduce((a, b) => a + b, 0) / hours.length) : null })).sort((a, b) => b.opened - a.opened);
    },

    /** Daily poll answers, members with streak days, challenges done: by segment and month. */
    async engagement(origin, p) {
        const userSeg = { from: "User", localField: "user", foreignField: "_id", as: "u" };
        const segOf = { $toLower: { $ifNull: [{ $arrayElemAt: ["$u.category", 0] }, ""] } };
        const polls = await Task.find({ origin, kind: "poll" }).select("_id").lean();
        const [answers, streaks, challenges] = await Promise.all([
            TaskEntry.aggregate([{ $match: { origin, task: { $in: polls.map((x) => x._id) }, createdAt: { $gte: p.start, $lt: p.end } } }, { $lookup: userSeg }, { $group: { _id: { s: segOf, m: month("$createdAt") }, n: { $sum: 1 } } }]),
            StreakDay.aggregate([{ $match: { origin, day: { $gte: p.from, $lte: p.to } } }, { $lookup: userSeg }, { $group: { _id: { s: segOf, m: { $substrCP: ["$day", 0, 7] } }, users: { $addToSet: "$user" }, days: { $sum: 1 } } }]),
            Reward.aggregate([{ $match: { origin, category: "challenge", createdAt: { $gte: p.start, $lt: p.end } } }, { $lookup: userSeg }, { $group: { _id: { s: segOf, m: month("$createdAt") }, n: { $sum: 1 }, points: { $sum: "$points" } } }]),
        ]);
        const rows = new Map();
        const get = (s, m) => { const k = `${s}|${m}`; if (!rows.has(k)) rows.set(k, { segment: s, segmentLabel: segmentLabel(s), month: m, pollAnswers: 0, membersWithStreakDays: 0, streakDays: 0, challengesDone: 0, challengePoints: 0 }); return rows.get(k); };
        for (const a of answers) get(a._id.s, a._id.m).pollAnswers = a.n;
        for (const s of streaks) { const r = get(s._id.s, s._id.m); r.membersWithStreakDays = s.users.length; r.streakDays = s.days; }
        for (const c of challenges) { const r = get(c._id.s, c._id.m); r.challengesDone = c.n; r.challengePoints = c.points; }
        return [...rows.values()].sort((a, b) => a.segment.localeCompare(b.segment) || a.month.localeCompare(b.month));
    },
};
export const NAMES = Object.keys(REPORTS);

export async function run(origin, name, query = {}) {
    const fn = REPORTS[name];
    if (!fn) throw new AdminError("not_found", "No such report", 404);
    const p = period(query);
    const rows = await fn(origin, p);
    return { report: name, origin, from: p.from, to: p.to, generatedAt: new Date(), rows };
}

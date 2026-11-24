// Surveys and invitations (super admin spec module 5), one brand at a time.
//
// Status: draft -> active (live) -> paused <-> active -> closed. "active" is the value the member pages already read.
// Invitations create Response rows with status "invited", exactly like the old bulk invite, but never send an email:
// e-mail stays behind the email switch (step 4). Reconciliation moves started responses to complete (approve) or
// takes back a complete (reject, status "rejected"), which the ledger follows because it reads complete responses.
import mongoose from "mongoose";
import { Survey, Response, User } from "../model/index.js";
import { premiumEligibleIds } from "../engagement/pro.js";
import { query as audienceQuery, audienceFilter } from "./audiences.js";
import { AdminError } from "./http.js";

const oid = (v) => new mongoose.Types.ObjectId(String(v));
const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v || ""));
const low = (s) => String(s ?? "").trim().toLowerCase();
export const STATUSES = ["draft", "active", "paused", "closed"];
const MOVES = { draft: ["active", "closed"], active: ["paused", "closed"], paused: ["active", "closed"], closed: [] };

const view = (s, counts) => ({
    id: String(s._id), slug: s.slug, name: s.name, category: s.category, source: s.source, status: s.status,
    points: s.points ?? 0, loi: s.loi, summary: s.summary || "", description: s.description || "", link: s.link || "",
    activeFrom: s.active?.from || null, activeTo: s.active?.to || null, minQualityScore: s.minQualityScore ?? null,
    premium: s.premium?.enabled ? { enabled: true, industries: s.premium.industries || [], seniority: s.premium.seniority || [] } : { enabled: false, industries: [], seniority: [] },
    autoInvite: Boolean(s.autoInvite), batchSize: s.batchSize ?? null, createdAt: s.createdAt, updatedAt: s.updatedAt,
    ...(counts ? { counts } : {}),
});

async function statusCounts(origin, slugs) {
    const rows = await Response.aggregate([
        { $match: { origin, "survey.slug": { $in: slugs }, isDeleted: { $ne: true } } },
        { $group: { _id: { s: "$survey.slug", st: "$status" }, n: { $sum: 1 } } },
    ]);
    const out = {};
    for (const r of rows) (out[r._id.s] ||= {})[r._id.st || "invited"] = r.n;
    return out;
}

async function find(origin, id) {
    if (!isId(id)) throw new AdminError("not_found", "Survey not found", 404);
    const s = await Survey.findOne({ _id: oid(id), origin, isDeleted: { $ne: true } }).lean();
    if (!s) throw new AdminError("not_found", "Survey not found", 404);
    return s;
}

export async function listSurveys(origin, { status, category, q } = {}) {
    const query = { origin, isDeleted: { $ne: true } };
    if (status && STATUSES.includes(status)) query.status = status;
    if (category) query.category = low(category);
    if (q) query.name = { $regex: String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 80), $options: "i" };
    const rows = await Survey.find(query).sort({ createdAt: -1 }).limit(500).lean();
    const counts = await statusCounts(origin, rows.map((s) => s.slug));
    return rows.map((s) => view(s, counts[s.slug] || {}));
}

export async function getSurvey(origin, id) {
    const s = await find(origin, id);
    return view(s, (await statusCounts(origin, [s.slug]))[s.slug] || {});
}

function clean(b, existing) {
    const out = {};
    const str = (k, max, req) => {
        if (b[k] === undefined) { if (req && !existing) throw new AdminError("invalid_value", `${k} is required`); return; }
        const v = String(b[k] ?? "").trim();
        if (req && !v) throw new AdminError("invalid_value", `${k} is required`);
        if (v.length > max) throw new AdminError("invalid_value", `${k} is at most ${max} characters`);
        out[k] = v;
    };
    str("name", 200, true); str("summary", 500); str("description", 5000);
    if (b.slug !== undefined || !existing) {
        const slug = low(b.slug);
        if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(slug)) throw new AdminError("invalid_value", "slug is 2 to 80 lower-case letters, digits or dashes");
        out.slug = slug;
    }
    for (const k of ["category", "source"]) if (b[k] !== undefined || !existing) {
        const v = low(b[k]);
        if (!v) throw new AdminError("invalid_value", `${k} is required`);
        out[k] = v;
    }
    if (b.points !== undefined || !existing) {
        const n = Number(b.points);
        if (!Number.isInteger(n) || n < 0 || n > 100000) throw new AdminError("invalid_value", "points is 0 to 100000");
        out.points = n;
    }
    if (b.loi !== undefined || !existing) {
        const n = Number(b.loi);
        if (!Number.isInteger(n) || n < 1 || n > 180) throw new AdminError("invalid_value", "loi is 1 to 180 minutes");
        out.loi = n;
    }
    if (b.link !== undefined) {
        const v = String(b.link || "").trim();
        if (v && !/^https:\/\/[^\s]+$/.test(v)) throw new AdminError("invalid_value", "link is an https URL");
        out.link = v;
    }
    for (const [k, path] of [["activeFrom", "active.from"], ["activeTo", "active.to"]]) if (b[k] !== undefined) {
        if (b[k] === null || b[k] === "") { out[path] = null; continue; }
        const d = new Date(b[k]);
        if (isNaN(d)) throw new AdminError("invalid_value", `${k} is a date`);
        out[path] = d;
    }
    if (b.minQualityScore !== undefined) {
        if (b.minQualityScore === null || b.minQualityScore === "") out.minQualityScore = null;
        else { const n = Number(b.minQualityScore); if (!Number.isFinite(n) || n < 0 || n > 200) throw new AdminError("invalid_value", "minQualityScore is 0 to 200"); out.minQualityScore = n; }
    }
    if (b.premium !== undefined) {
        const p = b.premium || {};
        const l = (v) => (Array.isArray(v) ? v.map(low).filter(Boolean).slice(0, 50) : []);
        out.premium = { enabled: Boolean(p.enabled), industries: l(p.industries), seniority: l(p.seniority) };
    }
    if (b.autoInvite !== undefined) out.autoInvite = Boolean(b.autoInvite);
    if (b.batchSize !== undefined) {
        if (b.batchSize === null || b.batchSize === "") out.batchSize = null;
        else { const n = Number(b.batchSize); if (!Number.isInteger(n) || n < 1 || n > 1_000_000) throw new AdminError("invalid_value", "batchSize is 1 to 1000000"); out.batchSize = n; }
    }
    return out;
}

export async function createSurvey(origin, b = {}) {
    const doc = clean(b, null);
    try {
        const s = await Survey.create({ origin, ...Object.fromEntries(Object.entries(doc).filter(([k]) => !k.includes("."))), active: { from: doc["active.from"] || undefined, to: doc["active.to"] || undefined }, status: "draft" });
        return { id: String(s._id), before: null, after: view(s.toObject()) };
    } catch (e) {
        if (e?.code === 11000) throw new AdminError("duplicate", "A survey with that name or slug exists in this segment", 409);
        throw e;
    }
}

export async function updateSurvey(origin, id, b = {}) {
    const s = await find(origin, id);
    if (s.status === "closed") throw new AdminError("bad_transition", "A closed survey can't be edited", 409);
    const set = clean(b, s);
    // the slug ties responses to the survey; it can't change once anyone was invited
    if (set.slug && set.slug !== s.slug && (await Response.exists({ origin, "survey.slug": s.slug }))) throw new AdminError("in_use", "Members were already invited, so the slug can't change", 409);
    const before = Object.fromEntries(Object.keys(set).map((k) => [k, k.startsWith("active.") ? s.active?.[k.slice(7)] ?? null : s[k] ?? null]));
    try {
        await Survey.updateOne({ _id: s._id, origin }, { $set: set });
    } catch (e) {
        if (e?.code === 11000) throw new AdminError("duplicate", "A survey with that name or slug exists in this segment", 409);
        throw e;
    }
    return { before, after: set };
}

export async function setStatus(origin, id, status) {
    const s = await find(origin, id);
    if (!STATUSES.includes(status)) throw new AdminError("invalid_value", `status is one of ${STATUSES.join(", ")}`);
    if (!(MOVES[s.status] || MOVES.draft).includes(status)) throw new AdminError("bad_transition", `A ${s.status} survey can't become ${status}`, 409);
    if (status === "active" && !s.link) throw new AdminError("invalid_value", "Add the survey link before it goes live");
    await Survey.updateOne({ _id: s._id, origin }, { $set: { status } });
    return { before: { status: s.status }, after: { status } };
}

/** The members a survey (or a saved audience narrowing it) would invite, before anyone is invited. */
async function targets(origin, s, { audienceId, filter } = {}) {
    const f = audienceId ? await audienceFilter(origin, audienceId) : (filter || {});
    const { q } = await audienceQuery(origin, { ...f, categories: [s.category] });
    // teens are only ever invited to surveys of the teen segment, which the category condition already ensures
    if (s.minQualityScore != null) {
        const min = s.minQualityScore;
        q.$and = [...(q.$and || []), min <= 100 ? { $or: [{ qualityScore: { $gte: min } }, { qualityScore: null }] } : { qualityScore: { $gte: min } }];
    }
    const premiumIds = await premiumEligibleIds(s, origin);
    if (premiumIds) q.$and = [...(q.$and || []), { _id: { $in: premiumIds.filter(isId).map(oid) } }];
    return q;
}

export async function feasibility(origin, id, b = {}) {
    const s = await find(origin, id);
    const q = await targets(origin, s, b);
    const [eligible, already] = await Promise.all([
        User.countDocuments(q),
        Response.countDocuments({ origin, "survey.slug": s.slug }),
    ]);
    const invitedIds = await Response.distinct("user", { origin, "survey.slug": s.slug });
    const fresh = await User.countDocuments({ ...q, _id: { ...(q._id || {}), $nin: invitedIds } });
    return { survey: s.slug, eligible, alreadyInvited: already, wouldInvite: Math.min(fresh, s.batchSize || fresh) };
}

/** Invite eligible members who aren't invited yet. No e-mail is sent. dryRun only counts. */
export async function invite(origin, id, b = {}, { dryRun = true } = {}) {
    const s = await find(origin, id);
    if (s.status === "closed") throw new AdminError("bad_transition", "A closed survey can't invite", 409);
    if (!dryRun && s.status !== "active") throw new AdminError("bad_transition", "Only a live survey can invite; this one is " + s.status, 409);
    const q = await targets(origin, s, b);
    const invitedIds = await Response.distinct("user", { origin, "survey.slug": s.slug });
    const limit = Math.min(Number(b.limit) > 0 ? Number(b.limit) : Infinity, s.batchSize || Infinity, 50_000);
    const users = await User.find({ ...q, _id: { ...(q._id || {}), $nin: invitedIds } }).select("_id").limit(Number.isFinite(limit) ? limit : 50_000).lean();
    if (dryRun) return { dryRun: true, wouldInvite: users.length, emailSent: false };
    const docs = users.map((u) => ({ origin, user: u._id, survey: { name: s.name, slug: s.slug }, status: "invited", source: s.source, points: s.points ?? 0 }));
    let created = docs.length;
    try {
        if (docs.length) await Response.insertMany(docs, { ordered: false });
    } catch (e) {
        created = e?.insertedDocs?.length ?? e?.result?.insertedCount ?? 0;
    }
    return { dryRun: false, invited: created, emailSent: false };
}

const RESPONSE_STATUSES = ["invited", "dropout", "complete", "terminate", "overquota", "rejected"];
export async function responses(origin, id, { status, page = 1 } = {}) {
    const s = await find(origin, id);
    const q = { origin, "survey.slug": s.slug, isDeleted: { $ne: true } };
    if (status && RESPONSE_STATUSES.includes(status)) q.status = status;
    const p = Math.max(1, Number(page) || 1);
    const [rows, total] = await Promise.all([
        Response.find(q).sort({ updatedAt: -1 }).skip((p - 1) * 100).limit(100).lean(),
        Response.countDocuments(q),
    ]);
    const users = await User.find({ _id: { $in: rows.map((r) => r.user) }, origin }).select("name category").lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));
    return {
        total, page: p,
        rows: rows.map((r) => {
            const u = byId.get(String(r.user));
            return { id: String(r._id), member: String(r.user), memberName: u ? [u.name?.first, u.name?.last ? `${String(u.name.last)[0]}.` : ""].filter(Boolean).join(" ") : null, status: r.status, points: r.points, loi: r.loi, startedAt: r.timeline?.start || null, endedAt: r.timeline?.end || null, updatedAt: r.updatedAt };
        }),
    };
}

/**
 * Reconcile responses against the client's final list. approve: a started (dropout) or invited response becomes
 * complete and pays the survey's points. reject: a complete becomes "rejected" and its points leave the ledger.
 */
export async function reconcile(origin, id, { approve = [], reject = [], reason } = {}) {
    const s = await find(origin, id);
    if (!reason || String(reason).trim().length < 5) throw new AdminError("reason_required", "A reason is required");
    const ids = (v) => (Array.isArray(v) ? [...new Set(v.map(String))].slice(0, 10000) : []);
    const a = ids(approve), r = ids(reject);
    if (!a.length && !r.length) throw new AdminError("invalid_value", "Give response ids to approve or reject");
    if (a.some((x) => r.includes(x))) throw new AdminError("invalid_value", "A response can't be approved and rejected");
    if ([...a, ...r].some((x) => !isId(x))) throw new AdminError("invalid_value", "Response ids are 24 hex characters");
    const base = { origin, "survey.slug": s.slug };
    const [ap, rj] = await Promise.all([
        a.length ? Response.updateMany({ ...base, _id: { $in: a.map(oid) }, status: { $in: ["dropout", "invited"] } }, { $set: { status: "complete", points: s.points ?? 0, "timeline.end": new Date() } }) : { modifiedCount: 0 },
        r.length ? Response.updateMany({ ...base, _id: { $in: r.map(oid) }, status: "complete" }, { $set: { status: "rejected" } }) : { modifiedCount: 0 },
    ]);
    return { approved: ap.modifiedCount, rejected: rj.modifiedCount, skipped: a.length + r.length - ap.modifiedCount - rj.modifiedCount };
}

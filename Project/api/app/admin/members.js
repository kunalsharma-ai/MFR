// Members module of the super admin console (spec module 1), for one brand at a time (req.adminOrigin).
import mongoose from "mongoose";
import { User, Response, Answers, Redemption, SupportTicket, TeenRegistration, Category, SegmentChange } from "../model/index.js";
import { entries as ledgerEntries, balances } from "../engagement/ledger.js";
import { memberType } from "../engagement/http.js";
import { maskEmail, maskPhone, birthYear } from "./mask.js";
import { AdminError } from "./http.js";

export const PAGE_SIZE = 50;
export const STATUSES = ["active", "suspended", "banned", "archived"];
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v || ""));
const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const statusOf = (u) => u.memberStatus || "active";

/** List row: no unmasked personal data. */
export function row(u) {
    const a0 = u.address?.[0] || {};
    return {
        id: String(u._id),
        memberId: u.respondentID || null,
        name: [u.name?.first, u.name?.last ? `${String(u.name.last).slice(0, 1)}.` : ""].filter(Boolean).join(" "),
        email: maskEmail(u.mail),
        phone: maskPhone(u.phone),
        category: u.category,
        segment: memberType(u),
        status: statusOf(u),
        country: a0.country || null,
        birthYear: birthYear(u.dob),
        qualityScore: u.qualityScore ?? 100,
        emailVerified: u.isVerified?.email || "unverified",
        phoneVerified: u.isVerified?.phone || "unverified",
        registrationStatus: u.registrationStatus || "active",
        signedUpAt: u.createdAt,
        lastActivityAt: u.lastActivityAt || null,
        profileCheckedAt: u.profileCheckedAt || null,
        archivedAt: u.archivedAt || null,
    };
}

/** Search (spec: email, phone, member ID, name, country, segment, status, sign-up date, quality, activity). */
export async function search(origin, q = {}) {
    const f = { origin, isDeleted: { $ne: true } };
    const term = String(q.q || "").trim().slice(0, 100);
    if (term) {
        if (isId(term)) f._id = oid(term);
        else if (term.includes("@")) f.mail = term.toLowerCase();
        else if (/^\+?\d[\d\s-]{5,}$/.test(term)) f.phone = { $regex: `${escape(term.replace(/[\s-]/g, "").replace(/^\+/, ""))}$` };
        else {
            const r = { $regex: `^${escape(term)}`, $options: "i" };
            f.$or = [{ respondentID: term }, { "name.first": r }, { "name.last": r }];
        }
    }
    if (q.category) f.category = String(q.category);
    if (q.segment === "teen") f.category = { $regex: "minor" };
    // Admins without teen.read (checked in MADP) never get teen rows, and teens don't count in their totals.
    if (q.noTeens) f.$and = [...(f.$and || []), { category: { $not: /minor/ } }];
    if (q.status) f.memberStatus = q.status === "active" ? { $in: [null, "active"] } : String(q.status);
    if (q.country) f["address.0.country"] = String(q.country).toLowerCase();
    if (q.from || q.to) f.createdAt = { ...(q.from ? { $gte: new Date(q.from) } : {}), ...(q.to ? { $lte: new Date(q.to) } : {}) };
    if (q.qualityMin != null || q.qualityMax != null)
        f.qualityScore = { ...(q.qualityMin != null ? { $gte: Number(q.qualityMin) } : {}), ...(q.qualityMax != null ? { $lte: Number(q.qualityMax) } : {}) };
    if (q.inactiveSince) f.$and = [...(f.$and || []), { $or: [{ lastActivityAt: null }, { lastActivityAt: { $lt: new Date(q.inactiveSince) } }] }];
    if (q.dueBefore) f.$and = [...(f.$and || []), { $or: [{ profileCheckedAt: null, createdAt: { $lt: new Date(q.dueBefore) } }, { profileCheckedAt: { $lt: new Date(q.dueBefore) } }] }];
    const page = Math.max(1, Math.min(10000, Number(q.page) || 1));
    const [items, total] = await Promise.all([
        User.find(f).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
        User.countDocuments(f),
    ]);
    return { items: items.map(row), total, page, pageSize: PAGE_SIZE };
}

async function load(origin, id) {
    if (!isId(id)) throw new AdminError("not_found", "Member not found", 404);
    const u = await User.findOne({ _id: oid(id), origin, isDeleted: { $ne: true } }).lean();
    if (!u) throw new AdminError("not_found", "Member not found", 404);
    return u;
}

/** Member page, overview tab plus the counts for the other tabs. Points come from the ledger. */
export async function detail(origin, id) {
    const u = await load(origin, id);
    const user = { _id: u._id, category: u.category };
    const [list, surveys, answers, redemptions, tickets, teen, segmentChanges] = await Promise.all([
        ledgerEntries(user, origin).catch(() => []),
        Response.aggregate([{ $match: { user: u._id, origin, isDeleted: { $ne: true } } }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
        Answers.countDocuments({ user: u._id, origin, isDeleted: { $ne: true } }),
        Redemption.countDocuments({ user: u._id, origin }),
        u.mail ? SupportTicket.countDocuments({ origin, "issueRaisedBy.email": u.mail, isDeleted: { $ne: true } }) : 0,
        memberType(u) === "teen" ? TeenRegistration.findOne({ origin, user: u._id }).select("status reference createdAt updatedAt").lean() : null,
        SegmentChange.find({ origin, user: u._id }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);
    const a0 = u.address?.[0] || {};
    return {
        ...row(u),
        fullName: [u.name?.first, u.name?.middle, u.name?.last].filter(Boolean).join(" "),
        gender: u.gender,
        timezone: u.timezone,
        city: a0.city || null,
        state: a0.state || null,
        statusReason: u.statusReason || null,
        statusChangedAt: u.statusChangedAt || null,
        terms: u.terms || [],
        consent: u.consent || {},
        guardian: u.parent?.email ? { email: maskEmail(u.parent.email), relation: u.parent.relation || null, consent: u.parent.consent ?? null, consentVersion: u.parent.consentVersion || null, consentAt: u.parent.consentAt || null } : null,
        teen: teen ? { status: teen.status, reference: teen.reference, since: teen.updatedAt } : null,
        points: balances(list),
        counts: {
            surveys: Object.fromEntries(surveys.map((s) => [s._id || "unknown", s.n])),
            answers,
            redemptions,
            tickets,
            ledgerEntries: list.length,
        },
        segmentChanges: segmentChanges.map((c) => ({ from: c.from, to: c.to, reason: c.reason, actor: c.actor, at: c.createdAt })),
    };
}

/** Ledger tab: every point movement, newest first. */
export async function ledger(origin, id) {
    const u = await load(origin, id);
    const list = await ledgerEntries({ _id: u._id, category: u.category }, origin);
    return { entries: list.slice(0, 500), balances: balances(list) };
}

const EDITABLE = {
    "name.first": (v) => typeof v === "string" && v.trim().length >= 1 && v.length <= 80,
    "name.middle": (v) => typeof v === "string" && v.length <= 80,
    "name.last": (v) => typeof v === "string" && v.length <= 80,
    gender: (v) => ["Male", "Female", "Other"].includes(v),
    timezone: (v) => typeof v === "string" && /^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)*$/.test(v),
    "isVerified.email": (v) => ["unverified", "verified", "rejected"].includes(v),
    "isVerified.phone": (v) => ["unverified", "verified", "rejected"].includes(v),
    "isVerified.video": (v) => ["unverified", "verified", "rejected"].includes(v),
    "isVerified.inPersonVisit": (v) => ["unverified", "verified", "rejected"].includes(v),
};

/** Edit allowed fields only; returns old and new values for MADP's audit entry. */
export async function update(origin, id, patch = {}) {
    const u = await load(origin, id);
    const set = {};
    const before = {};
    for (const [k, v] of Object.entries(patch)) {
        if (!EDITABLE[k]) throw new AdminError("field_not_editable", `${k} cannot be edited here`);
        if (!EDITABLE[k](v)) throw new AdminError("invalid_value", `Invalid value for ${k}`);
        const old = k.split(".").reduce((o, p) => (o == null ? o : o[p]), u);
        if (old !== v) {
            set[k] = typeof v === "string" ? v.trim() : v;
            before[k] = old ?? null;
        }
    }
    if (Object.keys(set).length) await User.updateOne({ _id: u._id, origin }, { $set: set });
    return { before, after: set };
}

const MOVES = {
    suspend: { from: ["active"], to: "suspended" },
    ban: { from: ["active", "suspended", "archived"], to: "banned" },
    reactivate: { from: ["suspended", "banned"], to: "active" },
    archive: { from: ["active"], to: "archived" },
    restore: { from: ["archived"], to: "active" },
};
export const ACTIONS = Object.keys(MOVES);

/** Suspend, ban, reactivate, archive or restore. Suspended and banned members cannot sign in or use the member API. */
export async function setStatus(origin, id, action, reason) {
    const move = MOVES[action];
    if (!move) throw new AdminError("bad_action", "Unknown action");
    if (!reason || String(reason).trim().length < 5) throw new AdminError("reason_required", "A reason is required");
    const u = await load(origin, id);
    const from = statusOf(u);
    if (!move.from.includes(from)) throw new AdminError("bad_transition", `Cannot ${action} a member who is ${from}`, 409);
    const now = new Date();
    await User.updateOne(
        { _id: u._id, origin },
        { $set: { memberStatus: move.to, statusReason: String(reason).trim().slice(0, 500), statusChangedAt: now, ...(move.to === "archived" ? { archivedAt: now } : {}), ...(from === "archived" ? { archivedAt: null } : {}) } },
    );
    return { before: { status: from }, after: { status: move.to } };
}

/**
 * Segment change between adult segments (Consumer and Business Professional, or MHO's adult segments). Answers are
 * kept. A teen's move to an adult account follows the teen module, never this route.
 */
export async function changeSegment(origin, id, category, reason, actor) {
    if (!reason || String(reason).trim().length < 5) throw new AdminError("reason_required", "A reason is required");
    const to = String(category || "").trim().toLowerCase();
    if (!to || to.includes("minor")) throw new AdminError("bad_segment", "Teen accounts are managed in the Teen module");
    const u = await load(origin, id);
    if (String(u.category).includes("minor")) throw new AdminError("teen_member", "A teen's move to an adult account follows the turning-18 path", 409);
    const known = await Category.countDocuments({ origin, name: to, isDeleted: { $ne: true } });
    if (!known) throw new AdminError("unknown_segment", `No category ${to} on this brand`);
    if (u.category === to) return { before: { category: to }, after: { category: to } };
    await User.updateOne({ _id: u._id, origin }, { $set: { category: to } });
    await SegmentChange.create({ origin, user: u._id, from: u.category, to, reason: String(reason).trim().slice(0, 500), actor });
    return { before: { category: u.category }, after: { category: to } };
}

const UNMASKABLE = ["email", "phone", "dob", "address", "payment", "guardianEmail"];
/** Full values of the fields asked for. MADP checks pii.view, asks for a reason and writes the audit entry. */
export async function unmask(origin, id, fields = []) {
    const want = [...new Set(fields)].filter((f) => UNMASKABLE.includes(f));
    if (!want.length) throw new AdminError("no_fields", `Ask for one of: ${UNMASKABLE.join(", ")}`);
    const u = await load(origin, id);
    const out = {};
    if (want.includes("email")) out.email = u.mail || null;
    if (want.includes("phone")) out.phone = u.phone || null;
    if (want.includes("dob")) out.dob = u.dob || null;
    if (want.includes("address")) out.address = u.address || [];
    if (want.includes("payment")) out.payment = u.paymentMethod || null;
    if (want.includes("guardianEmail")) out.guardianEmail = u.parent?.email || null;
    return { fields: want, values: out };
}

/**
 * Six-month activity check (decided by Kunal, 24 Nov 2026). Works out each member's last activity (sign-up, survey,
 * profile answer, redemption), stores it, and archives active members with none in `months`. Dry run by default.
 * Archived members keep points and answers; they get no invitations and do not count in panel size.
 */
export async function archiveRun(origin, { months = 6, dryRun = true, now = new Date() } = {}) {
    const m = Math.max(1, Math.min(60, Number(months) || 6));
    const cutoff = new Date(now);
    cutoff.setUTCMonth(cutoff.getUTCMonth() - m);
    const last = new Map();
    const bump = (rows) => {
        for (const r of rows) {
            const k = String(r._id);
            if (r.at && (!last.has(k) || last.get(k) < r.at)) last.set(k, r.at);
        }
    };
    const group = (Model, extra = {}) =>
        Model.aggregate([{ $match: { origin, ...extra } }, { $group: { _id: "$user", at: { $max: "$updatedAt" } } }]);
    bump(await group(Response, { status: { $nin: ["invited", ""] } }));
    bump(await group(Answers));
    bump(await group(Redemption));
    const members = await User.find({ origin, isDeleted: { $ne: true } }).select("createdAt lastActivityAt memberStatus").lean();
    const toArchive = [];
    const ops = [];
    for (const u of members) {
        const at = [u.createdAt, u.lastActivityAt, last.get(String(u._id))].filter(Boolean).map((d) => new Date(d)).sort((a, b) => b - a)[0] || null;
        if (at && (!u.lastActivityAt || new Date(u.lastActivityAt) < at)) ops.push({ updateOne: { filter: { _id: u._id, origin }, update: { $set: { lastActivityAt: at } } } });
        if (statusOf(u) === "active" && at && at < cutoff) toArchive.push(String(u._id));
    }
    if (!dryRun) {
        if (ops.length) await User.bulkWrite(ops, { ordered: false });
        if (toArchive.length)
            await User.updateMany(
                { _id: { $in: toArchive.map(oid) }, origin, memberStatus: { $in: [null, "active"] } },
                { $set: { memberStatus: "archived", archivedAt: now, statusChangedAt: now, statusReason: `No activity in ${m} months` } },
            );
    }
    return { dryRun: Boolean(dryRun), months: m, cutoff, checked: members.length, activityUpdated: ops.length, archived: toArchive.length, sample: toArchive.slice(0, 20) };
}

/** Bulk restore of archived members (spec: Members module bulk restore). */
export async function bulkRestore(origin, ids = [], reason) {
    if (!reason || String(reason).trim().length < 5) throw new AdminError("reason_required", "A reason is required");
    const valid = [...new Set(ids)].filter(isId).slice(0, 1000);
    const r = await User.updateMany(
        { _id: { $in: valid.map(oid) }, origin, memberStatus: "archived" },
        { $set: { memberStatus: "active", archivedAt: null, statusChangedAt: new Date(), statusReason: String(reason).trim().slice(0, 500), lastActivityAt: new Date() } },
    );
    return { asked: valid.length, restored: r.modifiedCount };
}

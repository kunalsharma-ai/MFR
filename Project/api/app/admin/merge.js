// Duplicate member accounts (super admin console, members module). One brand at a time (req.adminOrigin).
//
//   duplicates(by)   likely duplicates: same e-mail ignoring case, dots and +tags (Gmail style), same phone, same
//                    name and date of birth, or the same sign-up IP or device (one-way hashes, never shown). Rows are masked like the member list.
//   merge()          dry run by default. Moves the duplicate's history (survey responses, rewards, points
//                    adjustments and holds, redemptions, quality, answers, tickets, referrals, ...) to the kept account
//                    and closes the duplicate. Where the kept account already has the matching row (the same reward
//                    key, the same survey, the same profile answer), the kept account's row wins and the duplicate's
//                    stays with the closed account, so nothing is ever counted twice.
//   undo()           puts every moved row back and reopens the duplicate with its old status.
//
// Teen accounts are never merged here (guardian consent is per account), and a duplicate with an open redemption or
// data request must be settled first.
import mongoose from "mongoose";
import { User, MemberMerge } from "../model/index.js";
import { entries as ledgerEntries, balances } from "../engagement/ledger.js";
import { row } from "./members.js";
import { AdminError } from "./http.js";

const oid = (v) => new mongoose.Types.ObjectId(String(v));
const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v || ""));
const isTeen = (u) => String(u?.category || "").includes("minor");
const db = () => mongoose.connection.db;

// collection -> the field that points at the member, and how it is stored
const OWNED = [
    ...["Response", "Reward", "PointsAdjustment", "PointsHold", "Redemption", "QualityEvent", "QualitySnapshot", "SegmentChange",
        "MessageReceipt", "DrawEntry", "PrizePlay", "StreakDay", "TaskEntry", "PushSubscription", "DataRequest", "ExpertVerification",
        "MemberPreference"].map((name) => ({ name, field: "user", as: "id" })),
    { name: "Answer", field: "user", as: "string" },
    { name: "SupportTicket", field: "created.By", as: "id" },
];
const ref = (c, id) => (c.as === "string" ? String(id) : oid(id));
const get = (doc, path) => path.split(".").reduce((v, k) => (v == null ? v : v[k]), doc);

// unique indexes that include the member field: the other keys (and a simple partial filter) decide a clash
const uniqueCache = new Map();
async function uniques(c) {
    if (uniqueCache.has(c.name)) return uniqueCache.get(c.name);
    let list = [];
    try {
        list = (await db().collection(c.name).indexes())
            .filter((i) => i.unique && c.field in i.key)
            .map((i) => ({ others: Object.keys(i.key).filter((k) => k !== c.field), partial: i.partialFilterExpression || null }));
    } catch { /* collection doesn't exist yet */ }
    uniqueCache.set(c.name, list);
    return list;
}
const matchesPartial = (doc, partial) => !partial || Object.entries(partial).every(([k, v]) => (v && typeof v === "object" ? true : get(doc, k) === v));

/** The duplicate's rows in one collection, split into those that can move and those the kept account already has. */
async function plan(c, origin, keep, dup) {
    const col = db().collection(c.name);
    const rows = await col.find({ origin, [c.field]: ref(c, dup) }).toArray();
    const idx = await uniques(c);
    const move = [], stay = [];
    for (const d of rows) {
        let clash = false;
        for (const u of idx) {
            if (!matchesPartial(d, u.partial)) continue;
            const q = { [c.field]: ref(c, keep), ...(u.partial || {}) };
            for (const k of u.others) q[k] = get(d, k) ?? null;
            if (await col.findOne(q, { projection: { _id: 1 } })) { clash = true; break; }
        }
        (clash ? stay : move).push(d._id);
    }
    return { move, stay };
}

async function load(origin, id, what) {
    if (!isId(id)) throw new AdminError("not_found", `${what} not found`, 404);
    const u = await User.findOne({ _id: oid(id), origin, isDeleted: { $ne: true } }).lean();
    if (!u) throw new AdminError("not_found", `${what} not found`, 404);
    return u;
}
async function points(u, origin) {
    const b = balances(await ledgerEntries(u, origin));
    return { earned: b.earned, available: b.available, pending: b.pending, onHold: b.onHold, spent: b.spent };
}

// ---- finding duplicates ------------------------------------------------------------------------------------------
export function normEmail(mail) {
    const m = String(mail || "").trim().toLowerCase();
    const at = m.lastIndexOf("@");
    if (at < 1) return m;
    let [local, domain] = [m.slice(0, at), m.slice(at + 1)];
    local = local.split("+")[0];
    if (domain === "gmail.com" || domain === "googlemail.com") { local = local.replace(/\./g, ""); domain = "gmail.com"; }
    return `${local}@${domain}`;
}
const normPhone = (p) => String(p || "").replace(/\D/g, "").slice(-10);
const normName = (u) => `${String(u.name?.first || "").trim().toLowerCase()} ${String(u.name?.last || "").trim().toLowerCase()}|${u.dob ? new Date(u.dob).toISOString().slice(0, 10) : ""}`;
const BY = {
    email: { why: "Same e-mail address, ignoring capitals, dots and +tags", key: (u) => (u.mail ? normEmail(u.mail) : null) },
    phone: { why: "Same phone number (last 10 digits)", key: (u) => { const p = normPhone(u.phone); return p.length >= 8 ? p : null; } },
    name_dob: { why: "Same name and date of birth", key: (u) => (u.name?.first && u.dob ? normName(u) : null) },
    // one-way hashes saved at sign-up (utils/fingerprint.js); accounts from before that have none and never match
    ip: { why: "Signed up from the same IP address", key: (u) => u.signupFingerprint?.ipHash || null },
    device: { why: "Signed up from the same device", key: (u) => u.signupFingerprint?.deviceHash || null },
};

/** Groups of likely duplicates. The matching value itself is never returned, only masked member rows. */
export async function duplicates(origin, { by = "email", limit = 50 } = {}) {
    const rule = BY[by];
    if (!rule) throw new AdminError("invalid_value", "by is email, phone, name_dob, ip or device");
    const max = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const groups = new Map();
    const cursor = User.collection.find(
        { origin, isDeleted: { $ne: true }, memberStatus: { $nin: ["closed"] }, category: { $not: /minor/ } },
        { projection: { mail: 1, phone: 1, name: 1, dob: 1, signupFingerprint: 1 } },
    );
    for await (const u of cursor) {
        const k = rule.key(u);
        if (!k) continue;
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(u._id);
    }
    const found = [...groups.values()].filter((ids) => ids.length > 1);
    const out = [];
    for (const ids of found.slice(0, max)) {
        const users = await User.find({ _id: { $in: ids }, origin }).select("+mail +phone").sort({ createdAt: 1 }).lean();
        out.push({ reason: rule.why, members: users.map(row) });
    }
    return { by, reason: rule.why, groups: out.length, more: found.length > max, items: out };
}

// ---- merging -----------------------------------------------------------------------------------------------------
async function prepare(origin, keepId, dupId) {
    if (String(keepId) === String(dupId)) throw new AdminError("invalid_value", "Choose two different accounts");
    const [keep, dup] = await Promise.all([load(origin, keepId, "Kept account"), load(origin, dupId, "Duplicate account")]);
    const blockers = [], warnings = [];
    if (isTeen(keep) || isTeen(dup)) blockers.push({ code: "teen_account", message: "Teen accounts are never merged here. Each has its own guardian consent." });
    if (dup.memberStatus === "closed") blockers.push({ code: "already_closed", message: "The duplicate is already closed" + (dup.mergedInto ? " (merged before)" : "") });
    if (keep.memberStatus === "closed") blockers.push({ code: "keep_closed", message: "The account to keep is closed" });
    const open = async (name, extra = {}) => db().collection(name).countDocuments({ origin, user: dup._id, open: true, ...extra });
    if (await open("Redemption")) blockers.push({ code: "open_redemption", message: "The duplicate has a redemption in progress. Settle it first." });
    if (await open("DataRequest")) blockers.push({ code: "open_data_request", message: "The duplicate has an open data request. Close it first." });
    if (String(keep.category || "") !== String(dup.category || "")) warnings.push(`The accounts are in different segments (${keep.category} and ${dup.category}). The kept account's segment stays.`);
    const collections = {};
    for (const c of OWNED) {
        const p = await plan(c, origin, keep._id, dup._id);
        if (p.move.length || p.stay.length) collections[c.name] = p;
    }
    const referrals = await User.collection.find({ origin, referredBy: String(dup._id), _id: { $ne: keep._id } }, { projection: { _id: 1 } }).toArray();
    return { keep, dup, blockers, warnings, collections, referrals: referrals.map((r) => r._id) };
}
const counts = (collections) => Object.fromEntries(Object.entries(collections).map(([k, v]) => [k, { move: v.move.length, stay: v.stay.length }]));

/**
 * Dry run unless dryRun is false. The reply has both accounts (masked), what moves and what stays per collection,
 * points before (and after, when applied), blockers and warnings. Applying needs a reason and no blockers.
 */
export async function merge(origin, { keep: keepId, duplicate: dupId, reason } = {}, { dryRun = true, actor } = {}) {
    const p = await prepare(origin, keepId, dupId);
    const report = {
        dryRun,
        keep: row(p.keep), duplicate: row(p.dup),
        blockers: p.blockers, warnings: p.warnings,
        collections: counts(p.collections), referrals: p.referrals.length,
        points: { keep: await points(p.keep, origin), duplicate: await points(p.dup, origin) },
    };
    if (dryRun) return report;
    if (p.blockers.length) throw new AdminError(p.blockers[0].code, p.blockers[0].message, 409);
    const why = String(reason || "").trim();
    if (why.length < 5) throw new AdminError("reason_required", "A reason is required");

    // close the duplicate first (conditional on its status), so a second merge of the same account can't run too
    const closed = await User.collection.updateOne(
        { _id: p.dup._id, origin, memberStatus: p.dup.memberStatus ?? null },
        { $set: { memberStatus: "closed", statusReason: `Merged into ${p.keep._id}: ${why}`.slice(0, 500), statusChangedAt: new Date(), mergedInto: p.keep._id, mergedAt: new Date() } },
    );
    if (!closed.matchedCount) throw new AdminError("conflict", "The duplicate changed just now. Reload and try again.", 409);

    const moved = {}, stayed = {};
    for (const c of OWNED) {
        const plan0 = p.collections[c.name];
        if (!plan0) continue;
        const col = db().collection(c.name);
        moved[c.name] = [];
        stayed[c.name] = plan0.stay.length;
        for (const id of plan0.move) {
            try {
                const r = await col.updateOne({ _id: id, origin, [c.field]: ref(c, p.dup._id) }, { $set: { [c.field]: ref(c, p.keep._id) } });
                if (r.modifiedCount) moved[c.name].push(id);
            } catch (e) {
                if (e?.code !== 11000) throw e; // the kept account got the same row in the meantime: it stays
                stayed[c.name] += 1;
            }
        }
    }
    if (p.referrals.length) await User.collection.updateMany({ _id: { $in: p.referrals }, origin, referredBy: String(p.dup._id) }, { $set: { referredBy: String(p.keep._id) } });
    await db().collection("OTP").deleteMany({ origin, user: p.dup._id }); // no codes left for a closed account
    const rec = await MemberMerge.create({
        origin, keep: p.keep._id, duplicate: p.dup._id, reason: why, actor,
        previousStatus: p.dup.memberStatus ?? null, moved, stayed, referrals: p.referrals,
    });
    const keepAfter = await User.findOne({ _id: p.keep._id, origin }).lean();
    return {
        ...report, dryRun: false, mergeId: String(rec._id),
        moved: Object.fromEntries(Object.entries(moved).map(([k, v]) => [k, v.length])), stayed,
        points: { ...report.points, keepAfter: await points(keepAfter, origin) },
        before: { duplicateStatus: p.dup.memberStatus || "active" }, after: { duplicateStatus: "closed", mergedInto: String(p.keep._id) },
    };
}

const mergeView = (m) => ({
    id: String(m._id), keep: String(m.keep), duplicate: String(m.duplicate), reason: m.reason, actor: m.actor || null,
    moved: Object.fromEntries(Object.entries(m.moved || {}).map(([k, v]) => [k, v.length])), stayed: m.stayed || {}, referrals: (m.referrals || []).length,
    createdAt: m.createdAt, undoneAt: m.undoneAt || null, undoneBy: m.undoneBy || null,
});
export async function listMerges(origin, { member } = {}) {
    const q = { origin };
    if (isId(member)) q.$or = [{ keep: oid(member) }, { duplicate: oid(member) }];
    return (await MemberMerge.find(q).sort({ createdAt: -1 }).limit(200).lean()).map(mergeView);
}

/** Put every moved row back on the duplicate and reopen it with the status it had. */
export async function undo(origin, id, { reason } = {}, actor) {
    if (!isId(id)) throw new AdminError("not_found", "Merge not found", 404);
    const why = String(reason || "").trim();
    if (why.length < 5) throw new AdminError("reason_required", "A reason is required");
    const m = await MemberMerge.findOneAndUpdate({ _id: oid(id), origin, undoneAt: null }, { $set: { undoneAt: new Date(), undoneBy: actor, undoReason: why } }, { new: false }).lean();
    if (!m) {
        if (await MemberMerge.exists({ _id: oid(id), origin })) throw new AdminError("already_undone", "This merge was already undone", 409);
        throw new AdminError("not_found", "Merge not found", 404);
    }
    const back = {};
    for (const c of OWNED) {
        const ids = m.moved?.[c.name] || [];
        if (!ids.length) continue;
        const r = await db().collection(c.name).updateMany({ _id: { $in: ids }, origin, [c.field]: ref(c, m.keep) }, { $set: { [c.field]: ref(c, m.duplicate) } });
        back[c.name] = r.modifiedCount;
    }
    if (m.referrals?.length) await User.collection.updateMany({ _id: { $in: m.referrals }, origin, referredBy: String(m.keep) }, { $set: { referredBy: String(m.duplicate) } });
    await User.collection.updateOne(
        { _id: m.duplicate, origin, mergedInto: m.keep },
        { $set: { memberStatus: m.previousStatus ?? "active", statusReason: `Merge undone: ${why}`.slice(0, 500), statusChangedAt: new Date() }, $unset: { mergedInto: "", mergedAt: "" } },
    );
    return { before: { duplicateStatus: "closed" }, after: { duplicateStatus: m.previousStatus ?? "active" }, movedBack: back };
}

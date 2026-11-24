// Points (super admin spec module 6): manual adjustments with four eyes, approvals queue, holds.
// Balances are always worked out from the ledger; an applied adjustment is one more ledger line ("adjust").
import mongoose from "mongoose";
import { User, PointsAdjustment, PointsHold, Response, Reward } from "../model/index.js";
import { registerSource, entries as ledgerEntries, balances } from "../engagement/ledger.js";
import { AdminError } from "./http.js";

const oid = (v) => new mongoose.Types.ObjectId(String(v));
const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v || ""));
export const REASON_CODES = ["goodwill", "survey_credit_missing", "survey_reversal", "fraud_reversal", "duplicate_payment", "support_fix", "migration", "other"];

// Applied adjustments are ledger lines. Negative ones count as spent, like redemptions.
registerSource(async (user, origin) => {
    const rows = await PointsAdjustment.find({ user: oid(user._id), origin, status: "applied" }).lean();
    return rows.map((a) => ({ id: String(a._id), source: "adjustment", type: "adjust", name: `Adjustment: ${a.reasonCode}`, ref: a.reasonCode, points: a.points, at: a.decidedAt || a.createdAt, createdAt: a.decidedAt || a.createdAt, ...(a.points < 0 ? { status: "spent" } : {}) }));
});

const view = (a, u) => ({
    id: String(a._id), member: String(a.user), memberName: u ? [u.name?.first, u.name?.last ? `${String(u.name.last)[0]}.` : ""].filter(Boolean).join(" ") : null,
    points: a.points, reasonCode: a.reasonCode, note: a.note || "", status: a.status, requestedBy: a.requestedBy,
    decidedBy: a.decidedBy || null, decidedAt: a.decidedAt || null, decisionNote: a.decisionNote || "", createdAt: a.createdAt,
});

/**
 * Adjust a member's points. `needsApproval` is decided by MADP from the brand's four-eyes amount; the panel then keeps
 * the adjustment pending until a different admin approves it. A deduction can't take the balance below zero.
 */
export async function adjust(origin, memberId, { points, reasonCode, note, needsApproval } = {}, actor) {
    if (!isId(memberId)) throw new AdminError("not_found", "Member not found", 404);
    const p = Number(points);
    if (!Number.isInteger(p) || p === 0 || Math.abs(p) > 10_000_000) throw new AdminError("invalid_value", "points is a whole number, not 0");
    if (!REASON_CODES.includes(reasonCode)) throw new AdminError("invalid_value", `reasonCode is one of ${REASON_CODES.join(", ")}`);
    if (!note || String(note).trim().length < 5) throw new AdminError("reason_required", "A note is required");
    const u = await User.findOne({ _id: oid(memberId), origin, isDeleted: { $ne: true } }).select("category name").lean();
    if (!u) throw new AdminError("not_found", "Member not found", 404);
    const before = balances(await ledgerEntries(u, origin));
    if (p < 0 && before.available + p < 0) throw new AdminError("insufficient", `The member has ${before.available} points available`, 409);
    const a = await PointsAdjustment.create({ origin, user: u._id, points: p, reasonCode, note: String(note).trim(), status: needsApproval ? "pending" : "applied", requestedBy: actor, ...(needsApproval ? {} : { decidedBy: actor, decidedAt: new Date() }) });
    const after = needsApproval ? before : balances(await ledgerEntries(u, origin));
    return { adjustment: view(a, u), before: { available: before.available }, after: { available: after.available } };
}

export async function approvals(origin, { status = "pending" } = {}) {
    const rows = await PointsAdjustment.find({ origin, ...(status === "all" ? {} : { status }) }).sort({ createdAt: -1 }).limit(200).lean();
    const users = await User.find({ _id: { $in: rows.map((r) => r.user) }, origin }).select("name").lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));
    return rows.map((a) => view(a, byId.get(String(a.user))));
}

/** Approve or reject a pending adjustment. The admin who asked for it cannot decide it. */
export async function decide(origin, id, { decision, note } = {}, actor) {
    if (!isId(id)) throw new AdminError("not_found", "Not found", 404);
    if (!["approve", "reject"].includes(decision)) throw new AdminError("invalid_value", "decision is approve or reject");
    const a = await PointsAdjustment.findOne({ _id: oid(id), origin }).lean();
    if (!a) throw new AdminError("not_found", "Not found", 404);
    if (a.status !== "pending") throw new AdminError("bad_transition", `Already ${a.status}`, 409);
    if (a.requestedBy === actor) throw new AdminError("four_eyes", "A second admin must approve this", 409);
    if (decision === "approve" && a.points < 0) {
        const u = await User.findOne({ _id: a.user, origin }).select("category").lean();
        const b = balances(await ledgerEntries(u, origin));
        if (b.available + a.points < 0) throw new AdminError("insufficient", `The member has ${b.available} points available`, 409);
    }
    const status = decision === "approve" ? "applied" : "rejected";
    const r = await PointsAdjustment.updateOne({ _id: a._id, origin, status: "pending" }, { $set: { status, decidedBy: actor, decidedAt: new Date(), decisionNote: String(note || "").slice(0, 500) } });
    if (!r.modifiedCount) throw new AdminError("bad_transition", "Already decided", 409);
    return { before: { status: "pending" }, after: { status }, points: a.points, member: String(a.user) };
}

// ---- holds (were /engagement/admin/holds with the old admin role) -------------------------------------------------
export async function listHolds(origin, { member } = {}) {
    const q = { origin, releasedAt: null };
    if (member && isId(member)) q.user = oid(member);
    const rows = await PointsHold.find(q).sort({ createdAt: -1 }).limit(500).lean();
    return rows.map((h) => ({ id: String(h._id), member: String(h.user), source: h.source, entry: String(h.entry), reason: h.reason || "", memberNote: h.memberNote || "", expectedBy: h.expectedBy || null, createdAt: h.createdAt }));
}

export async function createHold(origin, { member, source, entry, reason, memberNote, expectedBy } = {}) {
    if (!["survey", "reward"].includes(source)) throw new AdminError("invalid_value", "source is survey or reward");
    if (!isId(member) || !isId(entry)) throw new AdminError("invalid_value", "member and entry are ids");
    if (!reason || String(reason).trim().length < 5) throw new AdminError("reason_required", "A reason is required");
    const Model = source === "survey" ? Response : Reward;
    if (!(await Model.exists({ _id: oid(entry), user: oid(member), origin }))) throw new AdminError("not_found", "That entry doesn't belong to this member", 404);
    const open = await PointsHold.findOne({ entry: oid(entry), source, origin, releasedAt: null }).lean();
    if (open) return { id: String(open._id), existing: true };
    const h = await PointsHold.create({ origin, user: oid(member), source, entry: oid(entry), reason: String(reason).slice(0, 500), memberNote: String(memberNote || "Being checked by our quality team").slice(0, 200), expectedBy: expectedBy && !isNaN(new Date(expectedBy)) ? new Date(expectedBy) : undefined });
    return { id: String(h._id), existing: false };
}

export async function releaseHold(origin, id) {
    if (!isId(id)) throw new AdminError("not_found", "No open hold with that id", 404);
    const h = await PointsHold.findOneAndUpdate({ _id: oid(id), origin, releasedAt: null }, { $set: { releasedAt: new Date(), outcome: "released" } }, { new: true }).lean();
    if (!h) throw new AdminError("not_found", "No open hold with that id", 404);
    return { before: { status: "on_hold" }, after: { status: "released" }, member: String(h.user) };
}

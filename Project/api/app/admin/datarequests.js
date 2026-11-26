// Data requests (super admin spec module 14): members' requests to delete their account and data, and (kind
// deactivate / hold / reactivate) the account breaks asked for on My Account's "Delete or Deactivate Account" page.
// Nothing is deleted by this code. The team checks what stands in the way (an open reward request, a points hold), carries the deletion out by hand, then marks the request done.
import mongoose from "mongoose";
import { DataRequest, User, Redemption, PointsHold } from "../model/index.js";
import { AdminError } from "./http.js";
import { maskEmail } from "./mask.js";

const oid = (v) => new mongoose.Types.ObjectId(String(v));
const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v || ""));
const DAY = 86400000;
const short = (u) => [u?.name?.first, u?.name?.last ? `${String(u.name.last)[0]}.` : ""].filter(Boolean).join(" ");

const view = (r, u) => ({
    id: String(r._id), kind: r.kind, days: r.days ?? null, status: r.status, open: r.open, reason: r.reason || "", note: r.note || "",
    member: u ? { id: String(u._id), name: short(u), email: maskEmail(u.mail), teen: String(u.category || "").includes("minor") } : null,
    createdAt: r.createdAt, ageDays: Math.floor((Date.now() - new Date(r.createdAt)) / DAY),
});

export async function list(origin, q = {}) {
    const f = { origin };
    if (q.status === "open" || !q.status) f.open = true;
    else if (q.status !== "all") f.status = { $in: String(q.status).split(",") };
    const rows = await DataRequest.find(f).sort({ createdAt: 1 }).limit(200).lean();
    const users = await User.find({ _id: { $in: rows.map((r) => r.user) }, origin }).select("name mail category").lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));
    return { total: rows.length, items: rows.map((r) => view(r, byId.get(String(r.user)))) };
}

/** What stands in the way of carrying it out. Counts only. */
async function blockers(origin, userId) {
    const [openRewards, holds] = await Promise.all([
        Redemption.countDocuments({ user: userId, origin, open: true }),
        PointsHold.countDocuments({ user: userId, origin, releasedAt: null }),
    ]);
    return { openRewards, holds };
}

export async function get(origin, id) {
    if (!isId(id)) throw new AdminError("not_found", "Not found", 404);
    const r = await DataRequest.findOne({ _id: oid(id), origin }).select("+adminNote").lean();
    if (!r) throw new AdminError("not_found", "Not found", 404);
    const u = await User.findOne({ _id: r.user, origin }).select("name mail category").lean();
    return { ...view(r, u), adminNote: r.adminNote || "", history: r.history || [], blockers: await blockers(origin, r.user) };
}

const NEXT = { requested: ["approved", "rejected"], approved: ["done", "rejected"] };
export async function decide(origin, id, { status, reason, note } = {}, actor) {
    if (!isId(id)) throw new AdminError("not_found", "Not found", 404);
    if (!reason || String(reason).trim().length < 5) throw new AdminError("reason_required", "A reason is required");
    const r = await DataRequest.findOne({ _id: oid(id), origin }).lean();
    if (!r) throw new AdminError("not_found", "Not found", 404);
    if (!(NEXT[r.status] || []).includes(status)) throw new AdminError("bad_transition", `A ${r.status} request can't become ${status || "that"}`, 409);
    // an open reward request stands in the way of deleting, not of a break or a hold
    if (status === "approved" && (r.kind || "delete") === "delete") {
        const b = await blockers(origin, r.user);
        if (b.openRewards) throw new AdminError("blocked", "The member has a reward request still open; settle it first", 409);
    }
    const set = { status, adminNote: String(reason).trim().slice(0, 1000), ...(["done", "rejected"].includes(status) ? { open: false } : {}) };
    if (note !== undefined) set.note = String(note).slice(0, 300);
    const upd = await DataRequest.findOneAndUpdate({ _id: r._id, origin, status: r.status }, { $set: set, $push: { history: { status, by: `madp:${actor}`, at: new Date() } } }, { new: true }).lean();
    if (!upd) throw new AdminError("conflict", "Someone else changed this request; reload it", 409);
    return { before: r.status, after: upd.status, id: String(upd._id) };
}

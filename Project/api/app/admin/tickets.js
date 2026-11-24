// Ticket desk (super admin spec, step 3b), one brand at a time. Uses the existing SupportTicket / SupportComment /
// SupportActions collections, so the member's Support and Messages pages show agent replies as they do today.
// A reply from the console never sends an e-mail (e-mail stays behind the switches); the member sees it in the portal.
// An internal note (type "note") is never shown to the member.
import mongoose from "mongoose";
import { SupportTicket, SupportComment, SupportActions, User } from "../model/index.js";
import { maskEmail } from "./mask.js";
import { AdminError } from "./http.js";

const oid = (v) => new mongoose.Types.ObjectId(String(v));
const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v || ""));
export const STATUSES = ["new", "open", "pending", "resolved", "closed"];
export const PRIORITIES = ["low", "normal", "high", "urgent"];
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const view = (t, member) => ({
    id: String(t._id), no: t.ticketNo, subject: t.subject || "", category: t.category || "", department: t.department || "",
    priority: t.priority || "normal", status: t.status || "new", assignedTo: t.assignedTo || null,
    from: { name: t.issueRaisedBy?.name || "", email: maskEmail(t.issueRaisedBy?.email || "") },
    member: member ? { id: String(member._id), segment: String(member.category || "").includes("minor") ? "teen" : member.category } : null,
    createdAt: t.createdAt, updatedAt: t.updatedAt,
    ageHours: Math.round((Date.now() - new Date(t.createdAt).getTime()) / 36e5),
});

async function membersByEmail(origin, emails) {
    const rows = await User.find({ origin, mail: { $in: [...new Set(emails.filter(Boolean).map((e) => String(e).toLowerCase()))] } }).select("mail category").lean();
    return new Map(rows.map((u) => [String(u.mail).toLowerCase(), u]));
}

export async function list(origin, { status, priority, assignedTo, q, noTeens, page = 1 } = {}) {
    const query = { origin, isDeleted: { $ne: true } };
    if (status === "open_all") query.status = { $nin: ["resolved", "closed"] };
    else if (STATUSES.includes(status)) query.status = status;
    if (PRIORITIES.includes(priority)) query.priority = priority;
    if (assignedTo === "none") query.assignedTo = { $in: [null, ""] };
    else if (assignedTo) query.assignedTo = String(assignedTo).toLowerCase();
    if (q) {
        const r = { $regex: esc(String(q).slice(0, 80)), $options: "i" };
        query.$or = [{ subject: r }, { ticketNo: r }];
    }
    const p = Math.max(1, Number(page) || 1);
    let [rows, total] = await Promise.all([
        SupportTicket.find(query).sort({ createdAt: -1 }).skip((p - 1) * 50).limit(50).lean(),
        SupportTicket.countDocuments(query),
    ]);
    const byMail = await membersByEmail(origin, rows.map((t) => t.issueRaisedBy?.email));
    let items = rows.map((t) => view(t, byMail.get(String(t.issueRaisedBy?.email || "").toLowerCase())));
    if (noTeens) items = items.filter((i) => i.member?.segment !== "teen");
    const counts = Object.fromEntries((await SupportTicket.aggregate([{ $match: { origin, isDeleted: { $ne: true } } }, { $group: { _id: { $ifNull: ["$status", "new"] }, n: { $sum: 1 } } }])).map((r) => [r._id, r.n]));
    return { items, total, page: p, pageSize: 50, counts };
}

async function find(origin, id) {
    if (!isId(id)) throw new AdminError("not_found", "Ticket not found", 404);
    const t = await SupportTicket.findOne({ _id: oid(id), origin, isDeleted: { $ne: true } }).lean();
    if (!t) throw new AdminError("not_found", "Ticket not found", 404);
    return t;
}

export async function get(origin, id) {
    const t = await find(origin, id);
    const member = (await membersByEmail(origin, [t.issueRaisedBy?.email])).get(String(t.issueRaisedBy?.email || "").toLowerCase());
    const [comments, actions] = await Promise.all([
        SupportComment.find({ origin, ticketNo: t.ticketNo, isDeleted: { $ne: true } }).select("+created.By").sort({ createdAt: 1 }).lean(),
        SupportActions.find({ origin, ticketNo: t.ticketNo }).sort({ createdAt: 1 }).lean(),
    ]);
    return {
        ...view(t, member),
        description: t.description || "",
        attachments: t.attachments || [],
        conversation: comments.map((c) => ({ id: String(c._id), type: c.type || "reply", by: c.author?.kind || (member && String(c.created?.By || "") === String(member._id) ? "member" : "team"), name: c.author?.name || null, message: c.message || "", attachments: c.attachments || [], at: c.createdAt })),
        history: actions.map((a) => ({ action: a.action, by: a.createdBy, at: a.createdAt })),
    };
}

/** A reply the member sees in the portal (no e-mail), or an internal note they never see. */
export async function reply(origin, id, { message, internal = false, agentName, status } = {}, actor) {
    const t = await find(origin, id);
    const text = String(message || "").trim();
    if (text.length < 2 || text.length > 5000) throw new AdminError("invalid_value", "message is 2 to 5000 characters");
    const c = await SupportComment.create({ origin, ticketNo: t.ticketNo, type: internal ? "note" : "reply", message: text, author: { kind: "agent", name: String(agentName || "Support team").slice(0, 80), actor } });
    let moved = null;
    const next = status ?? (internal ? null : (["new", "open"].includes(t.status || "new") ? "pending" : null));
    if (next && next !== t.status) moved = await setStatus(origin, id, next, actor);
    await SupportActions.create({ origin, ticketNo: t.ticketNo, action: internal ? "note" : "reply", createdBy: actor });
    return { id: String(c._id), internal: Boolean(internal), emailSent: false, status: moved?.after?.status ?? t.status ?? "new" };
}

export async function setStatus(origin, id, status, actor) {
    if (!STATUSES.includes(status)) throw new AdminError("invalid_value", `status is one of ${STATUSES.join(", ")}`);
    const t = await find(origin, id);
    if ((t.status || "new") === status) return { before: { status }, after: { status } };
    await SupportTicket.updateOne({ _id: t._id, origin }, { $set: { status }, $push: { updateTimeline: { status, updatedBy: actor, updatedAt: new Date() } } });
    await SupportActions.create({ origin, ticketNo: t.ticketNo, action: `status:${status}`, createdBy: actor });
    return { before: { status: t.status || "new" }, after: { status } };
}

export async function update(origin, id, { priority, assignedTo, category } = {}, actor) {
    const t = await find(origin, id);
    const set = {};
    if (priority !== undefined) { if (!PRIORITIES.includes(priority)) throw new AdminError("invalid_value", `priority is one of ${PRIORITIES.join(", ")}`); set.priority = priority; }
    if (assignedTo !== undefined) set.assignedTo = assignedTo ? String(assignedTo).toLowerCase().slice(0, 120) : "";
    if (category !== undefined) set.category = String(category || "").toLowerCase().slice(0, 60);
    if (!Object.keys(set).length) throw new AdminError("invalid_value", "Nothing to change");
    const before = Object.fromEntries(Object.keys(set).map((k) => [k, t[k] ?? null]));
    await SupportTicket.updateOne({ _id: t._id, origin }, { $set: set });
    await SupportActions.create({ origin, ticketNo: t.ticketNo, action: `update:${Object.keys(set).join(",")}`, createdBy: actor });
    return { before, after: set };
}

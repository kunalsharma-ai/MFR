// Portal messages (super admin spec, step 3b). A message goes to the members an audience filter matches at the moment
// it is sent, and shows in their bell and Messages page. It is never e-mailed. Teens only get a message whose filter
// names the teen segment explicitly. A sent message can be withdrawn; it then disappears from members' inboxes.
import mongoose from "mongoose";
import { AdminMessage, MessageReceipt, User } from "../model/index.js";
import { query as audienceQuery, cleanFilter, audienceFilter } from "./audiences.js";
import { AdminError } from "./http.js";

const oid = (v) => new mongoose.Types.ObjectId(String(v));
const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v || ""));
const TEEN = "b2c-minor";

function clean(b, existing) {
    const out = {};
    const str = (k, max, req) => {
        if (b[k] === undefined) { if (req && !existing) throw new AdminError("invalid_value", `${k} is required`); return; }
        const v = String(b[k] ?? "").trim();
        if (req && !v) throw new AdminError("invalid_value", `${k} is required`);
        if (v.length > max) throw new AdminError("invalid_value", `${k} is at most ${max} characters`);
        out[k] = v;
    };
    str("title", 120, true); str("subtitle", 200); str("body", 4000, true); str("ctaLabel", 60);
    if (b.cta !== undefined) {
        const v = String(b.cta || "").trim();
        // only links inside the member area, so a message can't send members off-site
        if (v && !/^\/member(\/[A-Za-z0-9/_?=&.-]*)?$/.test(v)) throw new AdminError("invalid_value", "cta is a member-area path like /member/surveys");
        out.cta = v;
    }
    if (b.filter !== undefined) out.filter = cleanFilter(b.filter || {});
    return out;
}

const view = (m) => ({
    id: String(m._id), title: m.title, subtitle: m.subtitle || "", body: m.body, cta: m.cta || "", ctaLabel: m.ctaLabel || "",
    filter: m.filter || {}, status: m.status, recipients: m.recipients || 0, sentAt: m.sentAt || null, withdrawnAt: m.withdrawnAt || null,
    createdBy: m.createdBy, sentBy: m.sentBy || null, createdAt: m.createdAt,
});

async function find(origin, id) {
    if (!isId(id)) throw new AdminError("not_found", "Message not found", 404);
    const m = await AdminMessage.findOne({ _id: oid(id), origin, isDeleted: { $ne: true } }).lean();
    if (!m) throw new AdminError("not_found", "Message not found", 404);
    return m;
}

export async function list(origin, { status } = {}) {
    const q = { origin, isDeleted: { $ne: true } };
    if (["draft", "sent", "withdrawn"].includes(status)) q.status = status;
    const rows = await AdminMessage.find(q).sort({ createdAt: -1 }).limit(200).lean();
    const reads = await MessageReceipt.aggregate([{ $match: { origin, message: { $in: rows.map((r) => r._id) }, readAt: { $ne: null } } }, { $group: { _id: "$message", n: { $sum: 1 } } }]);
    const byId = new Map(reads.map((r) => [String(r._id), r.n]));
    return rows.map((m) => ({ ...view(m), read: byId.get(String(m._id)) || 0 }));
}

export async function get(origin, id) {
    const m = await find(origin, id);
    const read = await MessageReceipt.countDocuments({ origin, message: m._id, readAt: { $ne: null } });
    return { ...view(m), read };
}

export async function create(origin, b = {}, actor) {
    const doc = clean(b, null);
    const m = await AdminMessage.create({ origin, ...doc, filter: doc.filter || {}, status: "draft", createdBy: actor });
    return { id: String(m._id), before: null, after: view(m.toObject()) };
}

export async function update(origin, id, b = {}) {
    const m = await find(origin, id);
    if (m.status !== "draft") throw new AdminError("bad_transition", "Only a draft can be edited", 409);
    const set = clean(b, m);
    const before = Object.fromEntries(Object.keys(set).map((k) => [k, m[k] ?? null]));
    await AdminMessage.updateOne({ _id: m._id, origin }, { $set: set });
    return { before, after: set };
}

async function recipientQuery(origin, filter) {
    const { q, filter: f } = await audienceQuery(origin, filter || {});
    // teens only when the teen segment is named
    if (!(f.categories || []).includes(TEEN)) q.$and = [...(q.$and || []), { category: { $not: /minor/i } }];
    return q;
}

/** How many members it would reach now. With audienceId, the saved audience's filter replaces the message's. */
export async function preview(origin, id, { audienceId } = {}) {
    const m = await find(origin, id);
    const filter = audienceId ? await audienceFilter(origin, audienceId) : m.filter;
    const q = await recipientQuery(origin, filter);
    const [count, teens] = await Promise.all([User.countDocuments(q), User.countDocuments({ ...q, category: /minor/i })]);
    return { recipients: count, teens, filter };
}

export async function send(origin, id, { audienceId } = {}, actor) {
    const m = await find(origin, id);
    if (m.status !== "draft") throw new AdminError("bad_transition", `Already ${m.status}`, 409);
    const filter = audienceId ? await audienceFilter(origin, audienceId) : m.filter;
    const users = await User.find(await recipientQuery(origin, filter)).select("_id").limit(200_000).lean();
    // claim the draft first so two clicks can't send it twice
    const claimed = await AdminMessage.updateOne({ _id: m._id, origin, status: "draft" }, { $set: { status: "sent", sentAt: new Date(), sentBy: actor, filter, recipients: users.length } });
    if (!claimed.modifiedCount) throw new AdminError("bad_transition", "Already sent", 409);
    for (let i = 0; i < users.length; i += 5000) {
        const docs = users.slice(i, i + 5000).map((u) => ({ origin, message: m._id, user: u._id, readAt: null }));
        await MessageReceipt.insertMany(docs, { ordered: false }).catch((e) => { if (e?.code !== 11000 && !e?.writeErrors) throw e; });
    }
    return { before: { status: "draft" }, after: { status: "sent" }, recipients: users.length, emailSent: false };
}

export async function withdraw(origin, id, actor) {
    const m = await find(origin, id);
    if (m.status !== "sent") throw new AdminError("bad_transition", "Only a sent message can be withdrawn", 409);
    await AdminMessage.updateOne({ _id: m._id, origin }, { $set: { status: "withdrawn", withdrawnAt: new Date() } });
    return { before: { status: "sent" }, after: { status: "withdrawn" }, by: actor };
}

// ---- member side: GET /api/v1/alerts (the bell and Messages page already call it) -----------------------------
export async function inbox(user, origin) {
    const receipts = await MessageReceipt.find({ origin, user: oid(user._id) }).sort({ createdAt: -1 }).limit(100).lean();
    if (!receipts.length) return [];
    const msgs = await AdminMessage.find({ _id: { $in: receipts.map((r) => r.message) }, origin, status: "sent" }).lean();
    const byId = new Map(msgs.map((x) => [String(x._id), x]));
    return receipts.filter((r) => byId.has(String(r.message))).map((r) => {
        const x = byId.get(String(r.message));
        return { _id: String(x._id), title: x.title, subtitle: x.subtitle || "", message: x.body, cta: x.cta || "", ctaType: x.cta ? "link" : "", ctaLabel: x.ctaLabel || "", read: Boolean(r.readAt), createdAt: x.sentAt || r.createdAt };
    });
}

export async function markRead(user, origin, id) {
    if (!isId(id)) return { read: false };
    const r = await MessageReceipt.updateOne({ origin, user: oid(user._id), message: oid(id), readAt: null }, { $set: { readAt: new Date() } });
    return { read: true, changed: r.modifiedCount > 0 };
}

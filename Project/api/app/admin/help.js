// Help centre entries (super admin spec, step 3b). Published entries appear in the member Help centre next to the
// built-in content (GET /api/v1/help). Teen entries are checked against the same guardrail words as teen questions.
import mongoose from "mongoose";
import { HelpArticle } from "../model/index.js";
import { AdminError } from "./http.js";

const oid = (v) => new mongoose.Types.ObjectId(String(v));
const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v || ""));
export const TOPICS = ["start", "profiles", "surveys", "rewards", "quality", "activity", "referrals", "account", "settings", "pro", "teen", "support"];
const TYPES = ["consumer", "professional", "teen"];
// money talk is kept out of teen copy (the member Help centre never shows teens money values)
const TEEN_MONEY = /(\$|₹|€|£|\busd\b|\binr\b|paypal|gift ?card|cash)/i;

function blocks(v) {
    if (!Array.isArray(v) || !v.length || v.length > 40) throw new AdminError("invalid_value", "body is 1 to 40 blocks");
    return v.map((b) => {
        const s = (x) => { const t = String(x ?? "").trim(); if (!t || t.length > 2000) throw new AdminError("invalid_value", "Each block is 1 to 2000 characters"); return t; };
        if (typeof b === "string") return s(b);
        if (b && Array.isArray(b.ul)) return { ul: b.ul.slice(0, 30).map(s) };
        if (b && Array.isArray(b.ol)) return { ol: b.ol.slice(0, 30).map(s) };
        if (b && typeof b.note === "string") return { note: s(b.note) };
        throw new AdminError("invalid_value", "A block is text, { ul }, { ol } or { note }");
    });
}
const text = (body) => body.map((b) => (typeof b === "string" ? b : (b.ul || b.ol || [b.note]).join(" "))).join(" ");

function clean(b, existing) {
    const out = {};
    if (b.slug !== undefined || !existing) {
        const v = String(b.slug || "").trim().toLowerCase();
        if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(v)) throw new AdminError("invalid_value", "slug is 2 to 80 lower-case letters, digits or dashes");
        out.slug = v;
    }
    if (b.topic !== undefined || !existing) { if (!TOPICS.includes(b.topic)) throw new AdminError("invalid_value", `topic is one of ${TOPICS.join(", ")}`); out.topic = b.topic; }
    if (b.title !== undefined || !existing) { const v = String(b.title || "").trim(); if (v.length < 3 || v.length > 200) throw new AdminError("invalid_value", "title is 3 to 200 characters"); out.title = v; }
    if (b.body !== undefined || !existing) out.body = blocks(b.body);
    if (b.keywords !== undefined) out.keywords = (Array.isArray(b.keywords) ? b.keywords : []).map((k) => String(k).trim().toLowerCase()).filter(Boolean).slice(0, 30);
    if (b.types !== undefined) out.types = (Array.isArray(b.types) ? b.types : []).filter((t) => TYPES.includes(t));
    const types = out.types ?? existing?.types ?? [];
    const forTeens = !types.length || types.includes("teen");
    if (forTeens && TEEN_MONEY.test(`${out.title ?? existing?.title ?? ""} ${text(out.body ?? existing?.body ?? [])}`))
        throw new AdminError("teen_guardrail", "Teens can see this entry, and teen help never mentions money. Limit it to consumer and professional, or reword it.", 422);
    return out;
}

const view = (a) => ({ id: String(a._id), slug: a.slug, topic: a.topic, title: a.title, body: a.body, keywords: a.keywords || [], types: a.types || [], status: a.status, updatedBy: a.updatedBy || a.createdBy, publishedAt: a.publishedAt || null, updatedAt: a.updatedAt });

async function find(origin, id) {
    if (!isId(id)) throw new AdminError("not_found", "Entry not found", 404);
    const a = await HelpArticle.findOne({ _id: oid(id), origin, isDeleted: { $ne: true } }).lean();
    if (!a) throw new AdminError("not_found", "Entry not found", 404);
    return a;
}

export async function list(origin, { status, topic } = {}) {
    const q = { origin, isDeleted: { $ne: true } };
    if (["draft", "published", "archived"].includes(status)) q.status = status;
    if (TOPICS.includes(topic)) q.topic = topic;
    return (await HelpArticle.find(q).sort({ topic: 1, title: 1 }).limit(1000).lean()).map(view);
}
export const get = async (origin, id) => view(await find(origin, id));

export async function create(origin, b = {}, actor) {
    const doc = clean(b, null);
    try {
        const a = await HelpArticle.create({ origin, ...doc, status: "draft", createdBy: actor, updatedBy: actor });
        return { id: String(a._id), before: null, after: view(a.toObject()) };
    } catch (e) {
        if (e?.code === 11000) throw new AdminError("duplicate", "An entry with that slug exists", 409);
        throw e;
    }
}

export async function update(origin, id, b = {}, actor) {
    const a = await find(origin, id);
    const set = clean(b, a);
    const before = Object.fromEntries(Object.keys(set).map((k) => [k, a[k] ?? null]));
    try {
        await HelpArticle.updateOne({ _id: a._id, origin }, { $set: { ...set, updatedBy: actor } });
    } catch (e) {
        if (e?.code === 11000) throw new AdminError("duplicate", "An entry with that slug exists", 409);
        throw e;
    }
    return { before, after: set };
}

export async function setStatus(origin, id, status, actor) {
    if (!["draft", "published", "archived"].includes(status)) throw new AdminError("invalid_value", "status is draft, published or archived");
    const a = await find(origin, id);
    await HelpArticle.updateOne({ _id: a._id, origin }, { $set: { status, updatedBy: actor, ...(status === "published" ? { publishedAt: new Date() } : {}) } });
    return { before: { status: a.status }, after: { status } };
}

// ---- member side ------------------------------------------------------------------------------------------------
export async function forMember(type, origin) {
    const rows = await HelpArticle.find({ origin, status: "published", isDeleted: { $ne: true }, $or: [{ types: { $size: 0 } }, { types: type }] }).sort({ topic: 1, title: 1 }).limit(500).lean();
    return rows.map((a) => ({ id: `db-${a.slug}`, topic: a.topic, q: a.title, a: a.body, kw: (a.keywords || []).join(" "), types: a.types?.length ? a.types : undefined, source: "console" }));
}

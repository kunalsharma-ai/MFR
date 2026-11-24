// Site pages (super admin spec: content and legal pages). The console edits a draft; members see the live copy at
// GET /api/v1/content/:key. Legal pages (privacy, terms, gdpr, cookies, or kind "legal") need four eyes: one admin
// asks for review and a different admin, who did not make the last edit, publishes. Every publish is kept as a
// ContentRevision. Text is stored as blocks and rendered by the sites as plain elements, so no HTML ever reaches a page.
import mongoose from "mongoose";
import { ContentPage, ContentRevision } from "../model/index.js";
import { AdminError } from "./http.js";

export const LEGAL_KEYS = ["privacy", "terms", "gdpr", "cookies"];
const KINDS = ["legal", "page"];
const LANG = /^[a-z]{2}(-[A-Z]{2})?$/;
const KEY = /^[a-z0-9][a-z0-9-]{1,59}$/;
const MAX_BLOCKS = 400, MAX_TEXT = 5000, MAX_ITEMS = 100;
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v || ""));
const live = { isDeleted: { $ne: true } };

const str = (x, what = "Each block", max = MAX_TEXT) => {
    if (typeof x !== "string" && typeof x !== "number") throw new AdminError("invalid_value", `${what} is text`);
    const t = String(x).trim();
    if (!t || t.length > max) throw new AdminError("invalid_value", `${what} is 1 to ${max} characters`);
    return t;
};
const list = (v, what) => {
    if (!Array.isArray(v) || !v.length || v.length > MAX_ITEMS) throw new AdminError("invalid_value", `${what} has 1 to ${MAX_ITEMS} items`);
    return v.map((x) => str(x, `Each ${what} item`));
};

/**
 * A block is one of: "paragraph text", { h2 }, { h3 }, { ul: [...] }, { ol: [...] }, { note }, or
 * { table: { head: [...], rows: [[...], ...] } }. Links are written as plain https:// addresses or e-mail addresses;
 * the sites turn those into links. Anything else is refused.
 */
export function blocks(v) {
    if (!Array.isArray(v) || !v.length || v.length > MAX_BLOCKS) throw new AdminError("invalid_value", `body is 1 to ${MAX_BLOCKS} blocks`);
    return v.map((b, i) => {
        const at = `Block ${i + 1}`;
        if (typeof b === "string") return str(b, at);
        if (!b || typeof b !== "object" || Array.isArray(b) || Object.keys(b).length !== 1) throw new AdminError("invalid_value", `${at}: a block is text, { h2 }, { h3 }, { ul }, { ol }, { note } or { table }`);
        if ("h2" in b) return { h2: str(b.h2, `${at} heading`, 200) };
        if ("h3" in b) return { h3: str(b.h3, `${at} heading`, 200) };
        if ("note" in b) return { note: str(b.note, at) };
        if ("ul" in b) return { ul: list(b.ul, `${at} list`) };
        if ("ol" in b) return { ol: list(b.ol, `${at} list`) };
        if ("table" in b) {
            const t = b.table || {};
            const head = list(t.head, `${at} table header`);
            if (head.length > 12) throw new AdminError("invalid_value", `${at}: a table has at most 12 columns`);
            if (!Array.isArray(t.rows) || !t.rows.length || t.rows.length > 300) throw new AdminError("invalid_value", `${at}: a table has 1 to 300 rows`);
            const rows = t.rows.map((r) => {
                if (!Array.isArray(r) || r.length !== head.length) throw new AdminError("invalid_value", `${at}: every row has ${head.length} cells`);
                return r.map((c) => (c === "" || c == null ? "" : str(c, `${at} cell`, 1000)));
            });
            return { table: { head, rows } };
        }
        throw new AdminError("invalid_value", `${at}: a block is text, { h2 }, { h3 }, { ul }, { ol }, { note } or { table }`);
    });
}
const title = (v) => str(v, "title", 200);

const summary = (p) => ({
    id: String(p._id), key: p.key, lang: p.lang, kind: p.kind, version: p.version || 0,
    live: p.live ? { title: p.live.title, version: p.live.version, publishedAt: p.live.publishedAt, publishedBy: p.live.publishedBy, approvedBy: p.live.approvedBy || null } : null,
    draft: p.draft ? { state: p.draft.state, basedOn: p.draft.basedOn ?? null, updatedBy: p.draft.updatedBy, updatedAt: p.draft.updatedAt, reviewRequestedBy: p.draft.reviewRequestedBy || null } : null,
    updatedAt: p.updatedAt,
});
const full = (p) => {
    const s = summary(p);
    if (p.live) s.live = { ...s.live, body: p.live.body };
    if (p.draft) s.draft = { ...s.draft, title: p.draft.title, body: p.draft.body };
    return s;
};

async function find(origin, id) {
    if (!isId(id)) throw new AdminError("not_found", "Page not found", 404);
    const p = await ContentPage.findOne({ _id: oid(id), origin, ...live }).lean();
    if (!p) throw new AdminError("not_found", "Page not found", 404);
    return p;
}

/** List a brand's pages. Filters: kind, lang, key, state (editing | review | published | unpublished). */
export async function listPages(origin, { kind, lang, key, state } = {}) {
    const q = { origin, ...live };
    if (KINDS.includes(kind)) q.kind = kind;
    if (LANG.test(String(lang || ""))) q.lang = lang;
    if (KEY.test(String(key || ""))) q.key = key;
    if (state === "editing" || state === "review") q["draft.state"] = state;
    if (state === "published") q.live = { $ne: null };
    if (state === "unpublished") q.live = null;
    return (await ContentPage.find(q).sort({ kind: 1, key: 1, lang: 1 }).limit(500).lean()).map(summary);
}
export const getPage = async (origin, id) => full(await find(origin, id));

export async function createPage(origin, b = {}, actor) {
    const key = String(b.key || "").trim().toLowerCase();
    if (!KEY.test(key)) throw new AdminError("invalid_value", "key is 2 to 60 lower-case letters, digits or dashes");
    const lang = b.lang === undefined ? "en" : String(b.lang);
    if (!LANG.test(lang)) throw new AdminError("invalid_value", "lang is a language code, e.g. en or es-MX");
    // the legal keys are always legal, so the four-eyes rule can't be dodged by calling them a plain page
    const kind = LEGAL_KEYS.includes(key) ? "legal" : (b.kind ?? "page");
    if (!KINDS.includes(kind)) throw new AdminError("invalid_value", "kind is legal or page");
    const draft = { title: title(b.title), body: blocks(b.body), state: "editing", basedOn: null, updatedBy: actor, updatedAt: new Date() };
    try {
        const p = await ContentPage.create({ origin, key, lang, kind, version: 0, live: null, draft, createdBy: actor });
        return { id: String(p._id), before: null, after: full(p.toObject()) };
    } catch (e) {
        if (e?.code === 11000) throw new AdminError("duplicate", `A ${key} page in ${lang} already exists`, 409);
        throw e;
    }
}

/** Edit the draft (starting one from the live copy if there is none). An edit sends a draft in review back to editing. */
export async function updateDraft(origin, id, b = {}, actor) {
    const p = await find(origin, id);
    const cur = p.draft || (p.live ? { title: p.live.title, body: p.live.body, basedOn: p.live.version } : null);
    if (!cur) throw new AdminError("no_draft", "This page has nothing to edit", 409);
    if (b.title === undefined && b.body === undefined) throw new AdminError("invalid_value", "Send title, body or both");
    const next = { title: b.title === undefined ? cur.title : title(b.title), body: b.body === undefined ? cur.body : blocks(b.body) };
    const draft = { ...next, state: "editing", basedOn: cur.basedOn ?? p.live?.version ?? null, updatedBy: actor, updatedAt: new Date(), reviewRequestedBy: null };
    // only if nobody changed it in between (the update is conditional on the draft we read)
    const r = await ContentPage.updateOne({ _id: p._id, origin, "draft.updatedAt": p.draft ? p.draft.updatedAt : null }, { $set: { draft } });
    if (!r.matchedCount) throw new AdminError("conflict", "Someone else changed this draft just now. Reload and try again.", 409);
    return { before: { title: cur.title, body: cur.body, state: p.draft?.state ?? null }, after: { title: draft.title, body: draft.body, state: "editing" } };
}

/**
 * review: editing -> review. publish: makes the draft live as the next version (legal pages: only from review, and not
 * by the admin who asked for review or made the last edit). discard: drops the draft; the live copy stays.
 */
export async function move(origin, id, action, actor) {
    if (!["review", "publish", "discard"].includes(action)) throw new AdminError("bad_action", "Unknown action");
    const p = await find(origin, id);
    const d = p.draft;
    if (!d) throw new AdminError("no_draft", "There is no draft to " + action, 409);
    const guard = { _id: p._id, origin, "draft.updatedAt": d.updatedAt, "draft.state": d.state };
    if (action === "discard") {
        await ContentPage.updateOne(guard, { $set: { draft: null } });
        return { before: { state: d.state }, after: { state: null }, key: p.key, lang: p.lang };
    }
    if (action === "review") {
        if (d.state !== "editing") throw new AdminError("bad_transition", "This draft is already in review", 409);
        const r = await ContentPage.updateOne(guard, { $set: { "draft.state": "review", "draft.reviewRequestedBy": actor } });
        if (!r.matchedCount) throw new AdminError("conflict", "The draft changed just now. Reload and try again.", 409);
        return { before: { state: "editing" }, after: { state: "review" }, key: p.key, lang: p.lang };
    }
    if (p.kind === "legal") {
        if (d.state !== "review") throw new AdminError("bad_transition", "A legal page is published from review. Ask for review first.", 409);
        if (!actor || actor === d.reviewRequestedBy || actor === d.updatedBy) throw new AdminError("four_eyes", "A second admin, who did not edit this draft, must publish a legal page", 409);
    }
    const version = (p.version || 0) + 1;
    const now = new Date();
    const approvedBy = p.kind === "legal" ? actor : null;
    // the page update is conditional on the version and draft we read, so two publishes can't both win
    const r = await ContentPage.updateOne({ ...guard, version: p.version || 0 }, {
        $set: { version, draft: null, live: { title: d.title, body: d.body, version, publishedAt: now, publishedBy: actor, approvedBy } },
    });
    if (!r.matchedCount) throw new AdminError("conflict", "The page changed just now. Reload and try again.", 409);
    await ContentRevision.create({ origin, page: p._id, key: p.key, lang: p.lang, kind: p.kind, version, title: d.title, body: d.body, editedBy: d.updatedBy, reviewRequestedBy: d.reviewRequestedBy || null, publishedBy: actor, publishedAt: now });
    return { before: { version: p.version || 0, state: d.state }, after: { version, state: "published" }, key: p.key, lang: p.lang };
}

export async function revisions(origin, id) {
    const p = await find(origin, id);
    const rows = await ContentRevision.find({ origin, page: p._id }).select("-body").sort({ version: -1 }).limit(200).lean();
    return rows.map((r) => ({ version: r.version, title: r.title, editedBy: r.editedBy, reviewRequestedBy: r.reviewRequestedBy || null, publishedBy: r.publishedBy, publishedAt: r.publishedAt }));
}
async function findRevision(origin, p, version) {
    const r = Number.isInteger(Number(version)) ? await ContentRevision.findOne({ origin, page: p._id, version: Number(version) }).lean() : null;
    if (!r) throw new AdminError("not_found", "Version not found", 404);
    return r;
}
export async function revision(origin, id, version) {
    const p = await find(origin, id);
    const r = await findRevision(origin, p, version);
    return { version: r.version, title: r.title, body: r.body, editedBy: r.editedBy, reviewRequestedBy: r.reviewRequestedBy || null, publishedBy: r.publishedBy, publishedAt: r.publishedAt };
}
/** Copy an old published version into the draft (to roll back, publish that draft the usual way). */
export async function restore(origin, id, version, actor) {
    const p = await find(origin, id);
    const r = await findRevision(origin, p, version);
    const draft = { title: r.title, body: r.body, state: "editing", basedOn: r.version, updatedBy: actor, updatedAt: new Date(), reviewRequestedBy: null };
    const ok = await ContentPage.updateOne({ _id: p._id, origin, "draft.updatedAt": p.draft ? p.draft.updatedAt : null }, { $set: { draft } });
    if (!ok.matchedCount) throw new AdminError("conflict", "Someone else changed this draft just now. Reload and try again.", 409);
    return { before: p.draft ? { title: p.draft.title, state: p.draft.state } : null, after: { title: r.title, state: "editing", basedOn: r.version } };
}

// ---- member side ------------------------------------------------------------------------------------------------
/** The live copy of a page for the site, in the asked language or English. null when nothing is published. */
export async function forSite(origin, key, lang = "en") {
    const k = String(key || "").toLowerCase();
    if (!KEY.test(k)) return null;
    const langs = LANG.test(String(lang)) && lang !== "en" ? [lang, "en"] : ["en"];
    const rows = await ContentPage.find({ origin, key: k, lang: { $in: langs }, live: { $ne: null }, ...live }).lean();
    const p = langs.map((l) => rows.find((r) => r.lang === l)).find(Boolean);
    if (!p) return null;
    return { key: p.key, lang: p.lang, kind: p.kind, title: p.live.title, body: p.live.body, version: p.live.version, publishedAt: p.live.publishedAt };
}

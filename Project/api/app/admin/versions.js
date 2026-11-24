// Question bank versions and translations (super admin spec, module 3).
import zlib from "node:zlib";
import { Question, Option, Profile, QuestionVersion } from "../model/index.js";
import { exportBank, TEEN_BLOCKED } from "./qb.js";
import { AdminError } from "./http.js";

const live = { isDeleted: { $ne: true } };
const pack = (o) => zlib.gzipSync(Buffer.from(JSON.stringify(o))).toString("base64");
const unpack = (s) => JSON.parse(zlib.gunzipSync(Buffer.from(s, "base64")).toString("utf8"));
const keyed = (rows, key) => new Map(rows.map((r) => [key(r), JSON.stringify(r)]));
const qKey = (q) => `${q.name}|${[...(q.category || [])].sort().join(",")}`;
const oKey = (o) => `${o.question}|${o.value}|${o.label}`;
const pKey = (p) => `${p.slug}|${p.category}`;

function diffRows(prev, next, key) {
    const a = keyed(prev, key), b = keyed(next, key);
    const added = [...b.keys()].filter((k) => !a.has(k));
    const removed = [...a.keys()].filter((k) => !b.has(k));
    const changed = [...b.keys()].filter((k) => a.has(k) && a.get(k) !== b.get(k));
    return { added: added.length, removed: removed.length, changed: changed.length, sample: { added: added.slice(0, 20), removed: removed.slice(0, 20), changed: changed.slice(0, 20) } };
}

async function lastPublished(origin) {
    return QuestionVersion.findOne({ origin, status: "published" }).sort({ number: -1 }).select("+snapshot").lean();
}

export async function listVersions(origin) {
    const rows = await QuestionVersion.find({ origin }).sort({ number: -1 }).limit(100).lean();
    return rows.map((v) => ({ number: v.number, status: v.status, note: v.note || "", counts: v.counts, diff: v.diff, createdBy: v.createdBy, reviewRequestedBy: v.reviewRequestedBy || null, publishedBy: v.publishedBy || null, publishedAt: v.publishedAt || null, createdAt: v.createdAt }));
}

/** Snapshot the current bank as a draft, with the diff from the last published version. One open draft at a time. */
export async function createDraft(origin, { note } = {}, actor) {
    const open = await QuestionVersion.countDocuments({ origin, status: { $in: ["draft", "review"] } });
    if (open) throw new AdminError("open_version", "Publish or discard the open version first", 409);
    const bank = await exportBank(origin);
    const prev = await lastPublished(origin);
    const before = prev ? unpack(prev.snapshot) : { Question: [], Option: [], Profile: [] };
    const diff = {
        from: prev?.number ?? null,
        questions: diffRows(before.Question, bank.Question, qKey),
        options: diffRows(before.Option, bank.Option, oKey),
        profiles: diffRows(before.Profile, bank.Profile, pKey),
    };
    const last = await QuestionVersion.findOne({ origin }).sort({ number: -1 }).lean();
    const number = (last?.number ?? 0) + 1;
    await QuestionVersion.create({ origin, number, status: "draft", note: String(note || "").slice(0, 500), counts: bank.counts, diff, snapshot: pack({ Question: bank.Question, Option: bank.Option, Profile: bank.Profile }), createdBy: actor });
    return { number, status: "draft", counts: bank.counts, diff };
}

const MOVES = { review: ["draft"], publish: ["review"], discard: ["draft", "review"] };
/** draft -> review -> published (or discarded). The admin who asked for review cannot publish it (four eyes). */
export async function move(origin, number, action, actor) {
    if (!MOVES[action]) throw new AdminError("bad_action", "Unknown action");
    const v = await QuestionVersion.findOne({ origin, number: Number(number) }).lean();
    if (!v) throw new AdminError("not_found", "Version not found", 404);
    if (!MOVES[action].includes(v.status)) throw new AdminError("bad_transition", `Cannot ${action} a version that is ${v.status}`, 409);
    if (action === "publish" && (v.reviewRequestedBy === actor || v.createdBy === actor))
        throw new AdminError("four_eyes", "A second admin must publish this version", 409);
    const set = action === "review" ? { status: "review", reviewRequestedBy: actor } : action === "publish" ? { status: "published", publishedBy: actor, publishedAt: new Date() } : { status: "discarded" };
    await QuestionVersion.updateOne({ _id: v._id, origin }, { $set: set });
    return { before: { status: v.status }, after: { status: set.status }, number: v.number };
}

/** A published version's bank, in the export shape. */
export async function versionBank(origin, number) {
    const v = await QuestionVersion.findOne({ origin, number: Number(number) }).select("+snapshot").lean();
    if (!v) throw new AdminError("not_found", "Version not found", 404);
    return { number: v.number, status: v.status, counts: v.counts, ...unpack(v.snapshot) };
}

// ---- translations ------------------------------------------------------------------------------------------------
const LANG = /^[a-z]{2}(-[A-Z]{2})?$/;

/** Set one language's wording for a question and (optionally) its options' labels, keyed by option value. */
export async function setTranslation(origin, name, { lang, label, description, options } = {}) {
    if (!LANG.test(String(lang || "")) || lang === "en") throw new AdminError("invalid_value", "lang is a language code other than en, e.g. hi or es-MX");
    const q = await Question.findOne({ origin, name: String(name).toLowerCase(), ...live }).lean();
    if (!q) throw new AdminError("not_found", "Question not found", 404);
    // teen guardrails: a question teens can see (teen category, or placed in a teen profile) can't be translated into
    // wording about tobacco, alcohol, health, cosmetics or vehicles either (same words as the question editor)
    const teen = (q.category || []).some((c) => String(c).includes("minor"))
        || (await Profile.countDocuments({ origin, ...live, category: { $regex: "minor" }, pages: { $elemMatch: { $elemMatch: { $eq: q.name } } } }));
    if (teen) {
        const texts = [["label", label], ["description", description], ...Object.entries(options && typeof options === "object" ? options : {}).map(([v, t]) => [`option ${v}`, t])];
        for (const [where, t] of texts) {
            const m = typeof t === "string" ? t.match(TEEN_BLOCKED) : null;
            if (m) throw new AdminError("teen_guardrail", `${q.name} is asked of teens, so its ${lang} ${where} can't mention "${m[0]}"`, 422);
        }
    }
    const before = { label: q.translations?.[lang]?.label ?? null, description: q.translations?.[lang]?.description ?? null };
    const set = {};
    if (label !== undefined) { if (typeof label !== "string" || label.length > 500) throw new AdminError("invalid_value", "label is up to 500 characters"); set[`translations.${lang}.label`] = label.trim(); }
    if (description !== undefined) { if (typeof description !== "string" || description.length > 2000) throw new AdminError("invalid_value", "description is up to 2,000 characters"); set[`translations.${lang}.description`] = description; }
    if (Object.keys(set).length) await Question.collection.updateOne({ _id: q._id, origin }, { $set: set });
    let optionsSet = 0;
    if (options && typeof options === "object") {
        for (const [value, text] of Object.entries(options).slice(0, 2000)) {
            if (typeof text !== "string" || text.length > 500) throw new AdminError("invalid_value", `Option ${value}: label is up to 500 characters`);
            const r = await Option.collection.updateMany({ origin, question: q.name, value, ...live }, { $set: { [`translations.${lang}`]: text.trim() } });
            optionsSet += r.modifiedCount;
        }
    }
    return { before, after: { label: label ?? before.label, description: description ?? before.description }, optionsSet };
}

/** Missing-translation report for one language: questions without wording, and options without a label. */
export async function missingTranslations(origin, lang, { category } = {}) {
    if (!LANG.test(String(lang || ""))) throw new AdminError("invalid_value", "lang is a language code");
    const f = { origin, ...live, ...(category ? { category: String(category).toLowerCase() } : {}) };
    const qs = await Question.find(f).lean();
    const names = qs.map((q) => q.name);
    const opts = await Option.collection.find({ origin, question: { $in: names }, ...live }, { projection: { question: 1, translations: 1 } }).toArray();
    const missingOpts = new Map();
    for (const o of opts) if (!o.translations?.[lang]) missingOpts.set(o.question, (missingOpts.get(o.question) || 0) + 1);
    const rows = qs
        .map((q) => ({ name: q.name, label: q.label, missingLabel: !q.translations?.[lang]?.label, missingOptions: missingOpts.get(q.name) || 0 }))
        .filter((r) => r.missingLabel || r.missingOptions);
    return { lang, questions: qs.length, complete: qs.length - rows.length, missing: rows.length, missingOptions: [...missingOpts.values()].reduce((a, b) => a + b, 0), items: rows.slice(0, 500) };
}



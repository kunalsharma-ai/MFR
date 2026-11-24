// Question bank and profiles (super admin spec modules 3 and 4), one brand at a time (origin).
//
// The bank is three collections, as today: Question (key = name + categories), Option (key = question + value + label)
// and Profile (key = slug + category; pages = [[title, questionName, ...], ...]). Export and import use that same
// JSON shape, so today's Profiles.json, Question.json and Option.json exports import as they are.
import { Question, Option, Profile, Answers, User } from "../model/index.js";
import { AdminError } from "./http.js";

const live = { isDeleted: { $ne: true } };
const norm = (s) => String(s ?? "").trim();
const low = (s) => norm(s).toLowerCase();
const cats = (c) => [...new Set((Array.isArray(c) ? c : [c]).map(low).filter(Boolean))].sort();
const isTeenCat = (c) => String(c || "").includes("minor");

// ---- teen guardrails ---------------------------------------------------------------------------------------------
// Tobacco, nicotine, alcohol, health, cosmetic and vehicle questions can never be in a teen profile (spec module 3).
// Checked on the question's key, wording, admin label and description, and on an explicit topic if one is set.
export const TEEN_BLOCKED = /tobacco|nicotine|cigar|vap(e|ing)\b|smok|e-?cig|alcohol|beer|wine|liquor|spirits|whisk|vodka|health|medic|illness|disease|diagnos|prescri|pharma|cosmetic|make-?up|skin ?care|vehicle|\bcars?\b|motorcycle|automobile|auto insurance/i;
export const TEEN_BLOCKED_TOPICS = ["tobacco", "nicotine", "alcohol", "health", "cosmetic", "vehicle"];
export function teenBlocked(q) {
    if (q?.topic && TEEN_BLOCKED_TOPICS.includes(low(q.topic))) return `topic ${low(q.topic)}`;
    const text = [q?.name, q?.label, q?.adminLabel, q?.description].filter(Boolean).join(" ");
    const m = text.match(TEEN_BLOCKED);
    return m ? `"${m[0]}"` : null;
}
function guardTeenQuestion(q) {
    const why = teenBlocked(q);
    if (why) throw new AdminError("teen_guardrail", `${q.name} cannot be asked of teens (${why})`, 422);
}

// ---- export ------------------------------------------------------------------------------------------------------
const STRIP = ["_id", "__v", "origin", "createdAt", "updatedAt", "created", "updated", "deleted", "isDeleted"];
const clean = (r) => { const o = { ...r }; for (const k of STRIP) delete o[k]; return o; };
export async function exportBank(origin) {
    const [Profiles, Questions, Options] = await Promise.all([
        Profile.find({ origin, ...live }).select("+sortOrder +isActive").sort({ category: 1, sortOrder: 1, slug: 1 }).lean(),
        Question.find({ origin, ...live }).select("+sortOrder +isActive").sort({ name: 1 }).lean(),
        Option.find({ origin, ...live }).select("+sortOrder +isActive").sort({ question: 1, sortOrder: 1, value: 1 }).lean(),
    ]);
    const Q = Questions.map(clean);
    return { exportedAt: new Date().toISOString(), origin, counts: countBank({ Questions: Q }), Profile: Profiles.map(clean), Question: Q, Option: Options.map(clean) };
}

/** Questions per segment, the numbers the spec checks an import against (Consumer 730, Teen 241, Parent form 33). */
export function countBank({ Questions }) {
    const by = {};
    for (const q of Questions) for (const c of cats(q.category)) by[c] = (by[c] || 0) + 1;
    return { questions: Questions.length, byCategory: by };
}

// ---- import ------------------------------------------------------------------------------------------------------
const Q_FIELDS = ["label", "type", "parent", "description", "adminLabel", "isMoney", "isRequired", "isEditable", "hasOthers", "hasNone", "hasSkip", "size", "sortOrder", "topic", "answeredBy", "translations"];
const O_FIELDS = ["parentValue", "isSelected", "isExclusive", "describeLabel", "sortOrder", "countries", "translations"];
const P_FIELDS = ["name", "icon", "pages", "sortOrder", "points", "estimatedMinutes"];
const pick = (o, fields) => Object.fromEntries(fields.filter((f) => o[f] !== undefined).map((f) => [f, o[f]]));
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const qKey = (q) => `${low(q.name)}|${cats(q.category).join(",")}`;
const oKey = (o) => `${low(o.question)}|${norm(o.value)}|${norm(o.label)}`;
const pKey = (p) => `${low(p.slug)}|${low(p.category)}`;
const unwrap = (v) => (Array.isArray(v) ? v : []).filter((r) => r && typeof r === "object");

/**
 * Import a bank file. Dry run by default: reports adds, changes, unchanged and duplicates per collection, the
 * per-segment question counts, teen guardrail refusals and broken references, and writes nothing. With dryRun false
 * it writes, but only when the file has no duplicates, refusals or broken references. Nothing is ever deleted.
 */
export async function importBank(origin, file = {}, { dryRun = true } = {}) {
    // Normalise the way the models store them (lower-case keys and profile names), so a re-import shows no changes.
    const inQ = unwrap(file.Question || file.Questions).map((q) => ({ ...q, name: low(q.name), category: cats(q.category), ...(q.label !== undefined ? { label: norm(q.label) } : {}), ...(q.type !== undefined ? { type: low(q.type) } : {}), ...(q.parent !== undefined ? { parent: low(q.parent) } : {}) }));
    const inO = unwrap(file.Option || file.Options).map((o) => ({ ...o, question: low(o.question), value: norm(o.value), label: norm(o.label) }));
    const inP = unwrap(file.Profile || file.Profiles).map((p) => ({ ...p, slug: low(p.slug), category: low(p.category), ...(p.name !== undefined ? { name: low(p.name) } : {}) }));
    if (!inQ.length && !inO.length && !inP.length) throw new AdminError("empty_file", "The file has no Profile, Question or Option rows");
    if (inQ.length + inO.length + inP.length > 50000) throw new AdminError("file_too_big", "More than 50,000 rows");

    const report = { dryRun: Boolean(dryRun), counts: countBank({ Questions: inQ }), errors: [] };
    const dupes = (rows, key, label) => {
        const seen = new Map(), out = [];
        for (const r of rows) {
            const k = key(r);
            if (seen.has(k)) out.push(`${label} ${k.replace(/\|/g, " / ")}`);
            else seen.set(k, r);
        }
        return [seen, out];
    };
    const [qs, qDup] = dupes(inQ, qKey, "question");
    const [os, oDup] = dupes(inO, oKey, "option");
    const [ps, pDup] = dupes(inP, pKey, "profile");

    for (const q of qs.values()) if (!low(q.name) || !norm(q.label) || !norm(q.type) || !cats(q.category).length) report.errors.push(`question ${q.name || "(no name)"}: name, label, type and category are required`);
    for (const p of ps.values()) if (!low(p.slug) || !low(p.category) || !norm(p.name)) report.errors.push(`profile ${p.slug || "(no slug)"}: slug, name and category are required`);

    const [exQ, exO, exP] = await Promise.all([
        Question.find({ origin, ...live }).select("+sortOrder").lean(),
        Option.find({ origin, ...live }).select("+sortOrder").lean(),
        Profile.find({ origin, ...live }).select("+sortOrder").lean(),
    ]);
    const exQm = new Map(exQ.map((q) => [qKey(q), q])), exOm = new Map(exO.map((o) => [oKey(o), o])), exPm = new Map(exP.map((p) => [pKey(p), p]));
    const names = new Set([...exQ.map((q) => low(q.name)), ...[...qs.values()].map((q) => low(q.name))]);

    // Teen guardrails: every question placed in a teen profile, or written for a teen category.
    const qByName = new Map([...exQ, ...qs.values()].map((q) => [low(q.name), q]));
    const refused = new Set();
    for (const q of qs.values()) if (cats(q.category).some(isTeenCat)) { const why = teenBlocked(q); if (why) refused.add(`${q.name} (${why})`); }
    for (const p of ps.values()) {
        const asked = (Array.isArray(p.pages) ? p.pages : []).flatMap((pg) => (Array.isArray(pg) ? pg.slice(1) : []));
        for (const n of asked) {
            if (!names.has(low(n))) report.errors.push(`profile ${p.slug}/${p.category} asks "${n}", which is not a question`);
            else if (isTeenCat(p.category)) { const why = teenBlocked(qByName.get(low(n))); if (why) refused.add(`${n} in teen profile ${p.slug} (${why})`); }
        }
    }
    for (const o of os.values()) if (!names.has(low(o.question))) report.errors.push(`option ${o.value} belongs to "${o.question}", which is not a question`);

    const plan = (incoming, existing, key, fields) => {
        const add = [], change = [], unchanged = [];
        for (const r of incoming.values()) {
            const ex = existing.get(key(r));
            if (!ex) { add.push(r); continue; }
            const want = pick(r, fields);
            const diff = Object.keys(want).filter((f) => !same(want[f], ex[f]));
            if (diff.length) change.push({ row: r, id: ex._id, fields: diff });
            else unchanged.push(r);
        }
        return { add, change, unchanged };
    };
    const pq = plan(qs, exQm, qKey, Q_FIELDS), po = plan(os, exOm, oKey, O_FIELDS), pp = plan(ps, exPm, pKey, P_FIELDS);
    const summary = (p, dup) => ({ adds: p.add.length, changes: p.change.length, unchanged: p.unchanged.length, duplicates: dup.length });
    Object.assign(report, {
        questions: summary(pq, qDup), options: summary(po, oDup), profiles: summary(pp, pDup),
        duplicates: [...qDup, ...oDup, ...pDup].slice(0, 200),
        teenRefused: [...refused].slice(0, 200),
        sampleChanges: [...pq.change, ...pp.change].slice(0, 50).map((c) => ({ key: c.row.name || c.row.slug, fields: c.fields })),
    });
    report.errors = report.errors.slice(0, 200);
    report.ok = !report.duplicates.length && !report.teenRefused.length && !report.errors.length;
    if (dryRun) return report;
    if (!report.ok) throw new AdminError("import_blocked", "Fix the duplicates, teen refusals and broken references first (run the dry run to see them)", 409);

    const now = new Date();
    const stamp = { origin, isActive: true, isDeleted: false, createdAt: now, updatedAt: now, created: { From: "madp-import" } };
    const bulk = (Model, p, build) => {
        const ops = [
            ...p.add.map((r) => ({ insertOne: { document: { ...build(r), ...stamp } } })),
            ...p.change.map((c) => ({ updateOne: { filter: { _id: c.id, origin }, update: { $set: { ...pick(c.row, c.fields), updatedAt: now, updated: { From: "madp-import" } } } } })),
        ];
        return ops.length ? Model.collection.bulkWrite(ops, { ordered: false }) : null;
    };
    await bulk(Question, pq, (q) => ({ name: low(q.name), category: cats(q.category), ...pick(q, Q_FIELDS), label: norm(q.label), type: low(q.type) }));
    await bulk(Option, po, (o) => ({ question: low(o.question), value: norm(o.value), label: norm(o.label), parentValue: [], ...pick(o, O_FIELDS) }));
    await bulk(Profile, pp, (p) => ({ slug: low(p.slug), category: low(p.category), ...pick(p, P_FIELDS), name: low(p.name), pages: p.pages || [] }));
    return report;
}

// ---- show-when rules checker -------------------------------------------------------------------------------------
/** Rules that point at a question or option that does not exist (spec: the 24 Nov check found 16). */
export async function checkRules(origin) {
    const [qs, os] = await Promise.all([Question.find({ origin, ...live }).lean(), Option.find({ origin, ...live }).select("question value parentValue").lean()]);
    const byName = new Map(qs.map((q) => [low(q.name), q]));
    const values = new Map();
    for (const o of os) (values.get(low(o.question)) ?? values.set(low(o.question), new Set()).get(low(o.question))).add(low(o.value));
    const broken = [];
    for (const q of qs) {
        if (!q.parent) continue;
        const parent = low(q.parent);
        if (!byName.has(parent)) { broken.push({ question: q.name, parent: q.parent, problem: "parent question does not exist" }); continue; }
        const offered = values.get(parent) || new Set();
        const bad = [...new Set(os.filter((o) => low(o.question) === low(q.name)).flatMap((o) => o.parentValue || []).filter((v) => !offered.has(low(v))))];
        if (bad.length) broken.push({ question: q.name, parent: q.parent, problem: "shows for answers the parent does not offer", values: bad.slice(0, 20) });
    }
    return { checked: qs.filter((q) => q.parent).length, broken: broken.length, rules: broken };
}

// ---- questions and options editor --------------------------------------------------------------------------------
const PAGE = 50;
const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export async function listQuestions(origin, q = {}) {
    const f = { origin, ...live };
    if (q.q) f.$or = [{ name: { $regex: escape(low(q.q)) } }, { label: { $regex: escape(norm(q.q)), $options: "i" } }];
    if (q.category) f.category = low(q.category);
    const page = Math.max(1, Number(q.page) || 1);
    const [items, total] = await Promise.all([Question.find(f).select("+isActive").sort({ name: 1 }).skip((page - 1) * PAGE).limit(PAGE).lean(), Question.countDocuments(f)]);
    return { items: items.map((x) => ({ ...x, id: String(x._id), _id: undefined })), total, page, pageSize: PAGE };
}

export async function getQuestion(origin, name) {
    const q = await Question.findOne({ origin, name: low(name), ...live }).select("+isActive").lean();
    if (!q) throw new AdminError("not_found", "Question not found", 404);
    const options = await Option.find({ origin, question: q.name, ...live }).select("+sortOrder").sort({ sortOrder: 1, value: 1 }).lean();
    const inProfiles = await Profile.find({ origin, ...live, pages: { $elemMatch: { $elemMatch: { $eq: q.name } } } }).select("slug category").lean();
    return { ...q, id: String(q._id), _id: undefined, options: options.map((o) => ({ ...o, id: String(o._id), _id: undefined })), profiles: inProfiles.map((p) => ({ slug: p.slug, category: p.category })) };
}

const TYPES = ["radio", "checkbox", "select", "select-single", "select-multiple", "multiselect", "text", "textarea", "open end single line", "open end multiline", "number", "date", "phone", "email", "zipcode", "document", "grid", "slider"];
function validQuestion(body) {
    const out = pick(body, Q_FIELDS);
    if (body.label !== undefined && (!norm(body.label) || norm(body.label).length > 500)) throw new AdminError("invalid_value", "Label is required (up to 500 characters)");
    if (body.type !== undefined && !TYPES.includes(low(body.type))) throw new AdminError("invalid_value", `Type must be one of: ${TYPES.join(", ")}`);
    if (body.answeredBy !== undefined && !["teen", "parent", "both"].includes(body.answeredBy)) throw new AdminError("invalid_value", "answeredBy is teen, parent or both");
    if (body.topic !== undefined && body.topic !== null && typeof body.topic !== "string") throw new AdminError("invalid_value", "topic is text");
    for (const b of ["isMoney", "isRequired", "isEditable", "hasOthers", "hasNone", "hasSkip"]) if (body[b] !== undefined && typeof body[b] !== "boolean") throw new AdminError("invalid_value", `${b} is true or false`);
    if (out.label) out.label = norm(out.label);
    if (out.type) out.type = low(out.type);
    if (out.parent !== undefined) out.parent = low(out.parent);
    return out;
}

export async function createQuestion(origin, body = {}) {
    const name = low(body.name);
    if (!/^[a-z0-9][a-z0-9_.-]{0,79}$/.test(name)) throw new AdminError("invalid_value", "Name is the unique key: lower case letters, digits, _ . -");
    const category = cats(body.category);
    if (!category.length) throw new AdminError("invalid_value", "Pick at least one segment category");
    const fields = validQuestion(body);
    if (!fields.label || !fields.type) throw new AdminError("invalid_value", "Label and type are required");
    if (category.some(isTeenCat)) guardTeenQuestion({ ...body, name });
    if (await Question.countDocuments({ origin, name, ...live })) throw new AdminError("duplicate", `A question called ${name} already exists`, 409);
    if (fields.parent && !(await Question.countDocuments({ origin, name: fields.parent, ...live }))) throw new AdminError("bad_parent", `No question ${fields.parent}`);
    const doc = await Question.create({ origin, name, category, ...fields });
    return { before: null, after: { name, category, ...fields }, id: String(doc._id) };
}

export async function updateQuestion(origin, name, body = {}) {
    const q = await Question.findOne({ origin, name: low(name), ...live }).lean();
    if (!q) throw new AdminError("not_found", "Question not found", 404);
    const set = validQuestion(body);
    if (body.category !== undefined) set.category = cats(body.category);
    const next = { ...q, ...set };
    const teen = cats(next.category).some(isTeenCat) || (await Profile.countDocuments({ origin, ...live, category: { $regex: "minor" }, pages: { $elemMatch: { $elemMatch: { $eq: q.name } } } }));
    if (teen) guardTeenQuestion(next);
    if (set.parent && !(await Question.countDocuments({ origin, name: set.parent, ...live }))) throw new AdminError("bad_parent", `No question ${set.parent}`);
    const before = {}, after = {};
    for (const [k, v] of Object.entries(set)) if (!same(q[k], v)) { before[k] = q[k] ?? null; after[k] = v; }
    if (Object.keys(after).length) await Question.updateOne({ _id: q._id, origin }, { $set: after });
    return { before, after };
}

/** Replace a question's option list. Options left out are retired (isDeleted), never removed: answers keep their values. */
export async function setOptions(origin, name, options = []) {
    const q = await Question.findOne({ origin, name: low(name), ...live }).lean();
    if (!q) throw new AdminError("not_found", "Question not found", 404);
    if (!Array.isArray(options) || options.length > 2000) throw new AdminError("invalid_value", "Send up to 2,000 options");
    const seen = new Set();
    const rows = options.map((o, i) => {
        const value = norm(o.value), label = norm(o.label ?? o.value);
        if (!value || !label) throw new AdminError("invalid_value", `Option ${i + 1} needs a value and a label`);
        if (seen.has(`${low(value)}|${JSON.stringify([...(o.parentValue || [])].sort())}`)) throw new AdminError("duplicate", `Option ${value} is there twice`);
        seen.add(`${low(value)}|${JSON.stringify([...(o.parentValue || [])].sort())}`);
        const countries = Array.isArray(o.countries) ? o.countries.map(low).filter((c) => /^[a-z]{2}$/.test(c)) : undefined;
        return { value, label, sortOrder: i + 1, isExclusive: Boolean(o.isExclusive), parentValue: Array.isArray(o.parentValue) ? o.parentValue.map(norm) : [], describeLabel: norm(o.describeLabel), ...(countries ? { countries } : {}) };
    });
    const existing = await Option.find({ origin, question: q.name, ...live }).select("+sortOrder").lean();
    const ex = new Map(existing.map((o) => [`${o.value}|${o.label}`, o]));
    const keep = new Set();
    const ops = [];
    for (const r of rows) {
        const e = ex.get(`${r.value}|${r.label}`);
        if (e) { keep.add(String(e._id)); ops.push({ updateOne: { filter: { _id: e._id }, update: { $set: r } } }); }
        else ops.push({ insertOne: { document: { ...r, question: q.name, origin, isActive: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date() } } });
    }
    const retire = existing.filter((o) => !keep.has(String(o._id)));
    if (retire.length) ops.push({ updateMany: { filter: { _id: { $in: retire.map((o) => o._id) } }, update: { $set: { isDeleted: true, isActive: false, "deleted.At": new Date() } } } });
    if (ops.length) await Option.collection.bulkWrite(ops, { ordered: true });
    return {
        before: { options: existing.map((o) => o.value) },
        after: { options: rows.map((r) => r.value) },
        added: rows.length - keep.size, retired: retire.length,
    };
}

// ---- profiles ----------------------------------------------------------------------------------------------------
export async function listProfiles(origin, q = {}) {
    const f = { origin, ...live };
    if (q.category) f.category = low(q.category);
    const rows = await Profile.find(f).select("+sortOrder +isActive").sort({ category: 1, sortOrder: 1, slug: 1 }).lean();
    return rows.map((p) => ({
        id: String(p._id), slug: p.slug, name: p.name, category: p.category, icon: p.icon || null, sortOrder: p.sortOrder ?? 0,
        isActive: p.isActive !== false, points: p.points ?? null, estimatedMinutes: p.estimatedMinutes ?? null,
        questions: (p.pages || []).flatMap((pg) => (Array.isArray(pg) ? pg.slice(1) : [])).length,
    }));
}

/** Order, on/off, points, icon, minutes, name, and the question list (pages). Teen profiles keep the guardrails. */
export async function updateProfile(origin, id, body = {}) {
    if (!/^[a-f0-9]{24}$/i.test(String(id))) throw new AdminError("not_found", "Profile not found", 404);
    const p = await Profile.findOne({ _id: id, origin, ...live }).select("+sortOrder +isActive").lean();
    if (!p) throw new AdminError("not_found", "Profile not found", 404);
    const set = {};
    if (body.isActive !== undefined) { if (typeof body.isActive !== "boolean") throw new AdminError("invalid_value", "isActive is true or false"); set.isActive = body.isActive; }
    if (body.sortOrder !== undefined) { if (!Number.isInteger(body.sortOrder) || body.sortOrder < 0 || body.sortOrder > 10000) throw new AdminError("invalid_value", "sortOrder is a whole number"); set.sortOrder = body.sortOrder; }
    if (body.points !== undefined) { if (body.points !== null && (!Number.isInteger(body.points) || body.points < 0 || body.points > 10000)) throw new AdminError("invalid_value", "points is 0 to 10,000"); set.points = body.points; }
    if (body.estimatedMinutes !== undefined) { if (body.estimatedMinutes !== null && (!Number.isInteger(body.estimatedMinutes) || body.estimatedMinutes < 1 || body.estimatedMinutes > 120)) throw new AdminError("invalid_value", "estimatedMinutes is 1 to 120"); set.estimatedMinutes = body.estimatedMinutes; }
    if (body.icon !== undefined) set.icon = norm(body.icon).slice(0, 200);
    if (body.name !== undefined) { if (!norm(body.name)) throw new AdminError("invalid_value", "Name is required"); set.name = low(body.name).slice(0, 120); }
    if (body.pages !== undefined) {
        if (!Array.isArray(body.pages) || !body.pages.every((pg) => Array.isArray(pg) && pg.length >= 1 && pg.every((x) => typeof x === "string"))) throw new AdminError("invalid_value", "pages is [[title, question, ...], ...]");
        const asked = body.pages.flatMap((pg) => pg.slice(1).map(low));
        if (new Set(asked).size !== asked.length) throw new AdminError("duplicate", "A question is listed twice");
        const found = await Question.find({ origin, name: { $in: asked }, ...live }).lean();
        const missing = asked.filter((n) => !found.some((q) => q.name === n));
        if (missing.length) throw new AdminError("bad_question", `Not questions: ${missing.slice(0, 10).join(", ")}`);
        if (isTeenCat(p.category)) for (const q of found) guardTeenQuestion(q);
        set.pages = body.pages.map((pg) => [norm(pg[0]), ...pg.slice(1).map(low)]);
    }
    const before = {}, after = {};
    for (const [k, v] of Object.entries(set)) if (!same(p[k], v)) { before[k] = p[k] ?? null; after[k] = v; }
    if (Object.keys(after).length) await Profile.updateOne({ _id: p._id, origin }, { $set: after });
    return { before, after };
}

/**
 * Completion report (spec module 4): per profile, members of its segment who started (answered at least one of its
 * questions) and finished (answered all of them), and the drop-off question: the question where the most starters stop.
 */
export async function completionReport(origin, { category } = {}) {
    const profiles = await Profile.find({ origin, ...live, ...(category ? { category: low(category) } : {}) }).select("+sortOrder +isActive").sort({ category: 1, sortOrder: 1 }).lean();
    const out = [];
    for (const p of profiles) {
        const asked = (p.pages || []).flatMap((pg) => (Array.isArray(pg) ? pg.slice(1) : []));
        const members = await User.find({ origin, category: p.category, ...live }).select("_id").lean();
        const ids = members.map((m) => String(m._id));
        if (!asked.length || !ids.length) { out.push({ slug: p.slug, category: p.category, isActive: p.isActive !== false, questions: asked.length, members: ids.length, started: 0, finished: 0, dropOff: null }); continue; }
        const rows = await Answers.aggregate([
            { $match: { origin, user: { $in: ids }, question: { $in: asked }, isDeleted: { $ne: true } } },
            { $group: { _id: "$user", qs: { $addToSet: "$question" } } },
        ]);
        const stops = new Map();
        let finished = 0;
        for (const r of rows) {
            const done = new Set(r.qs);
            const first = asked.find((n) => !done.has(n));
            if (!first) finished++;
            else stops.set(first, (stops.get(first) || 0) + 1);
        }
        const top = [...stops].sort((a, b) => b[1] - a[1])[0];
        out.push({ slug: p.slug, category: p.category, isActive: p.isActive !== false, questions: asked.length, members: ids.length, started: rows.length, finished, dropOff: top ? { question: top[0], members: top[1] } : null });
    }
    return { profiles: out };
}

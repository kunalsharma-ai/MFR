// Segments and saved audiences (super admin spec module 2), one brand at a time.
//
// An audience filter: { categories: [..], countries: [..], ageMin, ageMax, qualityMin, qualityMax, activeWithinDays,
// verifiedEmail: bool, answers: [{ question, values: [..] }] }. Only active members match: archived members get no
// invitations and do not count in feasibility or panel size (Kunal, 24 Nov 2026).
import mongoose from "mongoose";
import { User, Answers, Audience, Category, Profile } from "../model/index.js";
import { AdminError } from "./http.js";

const oid = (v) => new mongoose.Types.ObjectId(String(v));
const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v || ""));
const low = (s) => String(s ?? "").trim().toLowerCase();
const list = (v, max = 200) => (Array.isArray(v) ? v.map(low).filter(Boolean).slice(0, max) : []);

export function cleanFilter(f = {}) {
    if (!f || typeof f !== "object" || Array.isArray(f)) throw new AdminError("invalid_value", "filter is an object");
    const out = {};
    const cats = list(f.categories, 20);
    if (cats.length) out.categories = cats;
    const countries = list(f.countries).filter((c) => /^[a-z]{2}$/.test(c));
    if (countries.length) out.countries = countries;
    for (const k of ["ageMin", "ageMax"]) if (f[k] != null && f[k] !== "") {
        const n = Number(f[k]);
        if (!Number.isInteger(n) || n < 13 || n > 120) throw new AdminError("invalid_value", `${k} is 13 to 120`);
        out[k] = n;
    }
    for (const k of ["qualityMin", "qualityMax"]) if (f[k] != null && f[k] !== "") {
        const n = Number(f[k]);
        if (!Number.isFinite(n) || n < 0 || n > 200) throw new AdminError("invalid_value", `${k} is 0 to 200`);
        out[k] = n;
    }
    if (f.activeWithinDays != null && f.activeWithinDays !== "") {
        const n = Number(f.activeWithinDays);
        if (!Number.isInteger(n) || n < 1 || n > 3650) throw new AdminError("invalid_value", "activeWithinDays is 1 to 3650");
        out.activeWithinDays = n;
    }
    if (typeof f.verifiedEmail === "boolean") out.verifiedEmail = f.verifiedEmail;
    if (Array.isArray(f.answers)) {
        out.answers = f.answers.slice(0, 20).map((a) => {
            const question = low(a?.question);
            const values = Array.isArray(a?.values) ? a.values.map((v) => String(v).trim()).filter(Boolean).slice(0, 100) : [];
            if (!question || !values.length) throw new AdminError("invalid_value", "Each answer condition needs a question and values");
            return { question, values };
        });
        if (!out.answers.length) delete out.answers;
    }
    return out;
}

const yearsAgo = (n, now) => { const d = new Date(now); d.setUTCFullYear(d.getUTCFullYear() - n); return d; };

/** The Mongo query for a filter, plus the member ids allowed by answer conditions (null = no answer condition). */
export async function query(origin, filter, now = new Date()) {
    const f = cleanFilter(filter);
    // teens waiting to accept adult terms are paused: no invitations until they do
    const q = { origin, isDeleted: { $ne: true }, memberStatus: { $in: [null, "active"] }, "adultMove.stage": { $ne: "turning_adult" } };
    if (f.categories) q.category = { $in: f.categories };
    if (f.countries) q["address.0.country"] = { $in: f.countries };
    if (f.ageMin || f.ageMax) q.dob = { ...(f.ageMin ? { $lte: yearsAgo(f.ageMin, now) } : {}), ...(f.ageMax ? { $gt: yearsAgo(f.ageMax + 1, now) } : {}) };
    if (f.qualityMin != null || f.qualityMax != null) {
        // members saved before the score existed count as the default 100
        const range = { ...(f.qualityMin != null ? { $gte: f.qualityMin } : {}), ...(f.qualityMax != null ? { $lte: f.qualityMax } : {}) };
        const inDefault = (f.qualityMin ?? 0) <= 100 && (f.qualityMax ?? 200) >= 100;
        q.$and = [...(q.$and || []), inDefault ? { $or: [{ qualityScore: range }, { qualityScore: null }] } : { qualityScore: range }];
    }
    if (f.activeWithinDays) q.lastActivityAt = { $gte: new Date(now.getTime() - f.activeWithinDays * 864e5) };
    if (f.verifiedEmail === true) q["isVerified.email"] = "verified";
    if (f.verifiedEmail === false) q["isVerified.email"] = { $ne: "verified" };
    let ids = null;
    for (const a of f.answers || []) {
        const rows = await Answers.find({ origin, question: a.question, isDeleted: { $ne: true }, answer: { $in: a.values } }).select("user").lean();
        const set = new Set(rows.map((r) => String(r.user)));
        ids = ids === null ? set : new Set([...ids].filter((x) => set.has(x)));
    }
    if (ids !== null) q._id = { $in: [...ids].filter(isId).map(oid) };
    return { q, filter: f };
}

export async function count(origin, filter) {
    const { q, filter: f } = await query(origin, filter);
    const [total, bySegment] = await Promise.all([
        User.countDocuments(q),
        User.aggregate([{ $match: q }, { $group: { _id: "$category", n: { $sum: 1 } } }]),
    ]);
    return { filter: f, count: total, bySegment: Object.fromEntries(bySegment.map((r) => [r._id || "unknown", r.n])) };
}

export async function listAudiences(origin) {
    const rows = await Audience.find({ origin, isDeleted: { $ne: true } }).sort({ name: 1 }).lean();
    return rows.map((a) => ({ id: String(a._id), name: a.name, description: a.description || "", filter: a.filter, lastCount: a.lastCount ?? null, lastCountAt: a.lastCountAt || null, createdBy: a.createdBy, updatedAt: a.updatedAt }));
}

export async function saveAudience(origin, id, { name, description, filter } = {}, actor) {
    const f = cleanFilter(filter);
    if (!name || String(name).trim().length < 2 || String(name).length > 120) throw new AdminError("invalid_value", "name is 2 to 120 characters");
    const c = await count(origin, f);
    const doc = { name: String(name).trim(), description: String(description || "").slice(0, 500), filter: f, lastCount: c.count, lastCountAt: new Date() };
    if (id) {
        if (!isId(id)) throw new AdminError("not_found", "Audience not found", 404);
        const ex = await Audience.findOne({ _id: oid(id), origin, isDeleted: { $ne: true } }).lean();
        if (!ex) throw new AdminError("not_found", "Audience not found", 404);
        await Audience.updateOne({ _id: ex._id, origin }, { $set: { ...doc, updatedBy: actor } });
        return { id, before: { name: ex.name, filter: ex.filter }, after: { name: doc.name, filter: f }, count: c.count };
    }
    try {
        const a = await Audience.create({ origin, ...doc, createdBy: actor });
        return { id: String(a._id), before: null, after: { name: doc.name, filter: f }, count: c.count };
    } catch (e) {
        if (e?.code === 11000) throw new AdminError("duplicate", "An audience with that name exists", 409);
        throw e;
    }
}

export async function audienceCount(origin, id) {
    if (!isId(id)) throw new AdminError("not_found", "Audience not found", 404);
    const a = await Audience.findOne({ _id: oid(id), origin, isDeleted: { $ne: true } }).lean();
    if (!a) throw new AdminError("not_found", "Audience not found", 404);
    const c = await count(origin, a.filter);
    await Audience.updateOne({ _id: a._id, origin }, { $set: { lastCount: c.count, lastCountAt: new Date() } });
    return { id, name: a.name, ...c };
}

export async function audienceFilter(origin, id) {
    if (!isId(id)) throw new AdminError("not_found", "Audience not found", 404);
    const a = await Audience.findOne({ _id: oid(id), origin, isDeleted: { $ne: true } }).lean();
    if (!a) throw new AdminError("not_found", "Audience not found", 404);
    return a.filter;
}

// ---- segments ----------------------------------------------------------------------------------------------------
const THEMES = ["consumer", "professional", "teen", "healthcare", "patient", "caregiver"];
export async function listSegments(origin) {
    const [cats, counts] = await Promise.all([
        Category.find({ origin, isDeleted: { $ne: true } }).lean(),
        User.aggregate([{ $match: { origin, isDeleted: { $ne: true } } }, { $group: { _id: { c: "$category", s: { $ifNull: ["$memberStatus", "active"] } }, n: { $sum: 1 } } }]),
    ]);
    return cats.map((c) => {
        const mine = counts.filter((r) => r._id.c === c.name);
        return {
            id: String(c._id), name: c.name, settings: { signupOpen: true, countries: [], minAge: c.name.includes("minor") ? 13 : 18, coreProfiles: [], theme: null, ...(c.settings || {}) },
            members: Object.fromEntries(mine.map((r) => [r._id.s, r.n])),
        };
    });
}

/** Sign-up open or closed, countries allowed, minimum age, core profiles and theme for one segment. */
export async function updateSegment(origin, name, s = {}) {
    const c = await Category.findOne({ origin, name: low(name), isDeleted: { $ne: true } }).lean();
    if (!c) throw new AdminError("not_found", "Segment not found", 404);
    const set = {};
    if (s.signupOpen !== undefined) { if (typeof s.signupOpen !== "boolean") throw new AdminError("invalid_value", "signupOpen is true or false"); set["settings.signupOpen"] = s.signupOpen; }
    if (s.countries !== undefined) { const v = list(s.countries).filter((x) => /^[a-z]{2}$/.test(x)); set["settings.countries"] = v; }
    if (s.minAge !== undefined) {
        const n = Number(s.minAge);
        const floor = c.name.includes("minor") ? 13 : 18;
        if (!Number.isInteger(n) || n < floor || n > 99) throw new AdminError("invalid_value", `minAge is ${floor} to 99 for this segment`);
        set["settings.minAge"] = n;
    }
    if (s.coreProfiles !== undefined) {
        const slugs = list(s.coreProfiles, 50);
        const found = await Profile.find({ origin, category: c.name, slug: { $in: slugs }, isDeleted: { $ne: true } }).select("slug").lean();
        const missing = slugs.filter((x) => !found.some((p) => p.slug === x));
        if (missing.length) throw new AdminError("invalid_value", `Not profiles of this segment: ${missing.join(", ")}`);
        set["settings.coreProfiles"] = slugs;
    }
    if (s.theme !== undefined) { if (s.theme !== null && !THEMES.includes(s.theme)) throw new AdminError("invalid_value", `theme is one of ${THEMES.join(", ")}`); set["settings.theme"] = s.theme; }
    const before = Object.fromEntries(Object.keys(set).map((k) => [k.replace("settings.", ""), c.settings?.[k.replace("settings.", "")] ?? null]));
    if (Object.keys(set).length) await Category.collection.updateOne({ _id: c._id, origin }, { $set: set });
    return { before, after: Object.fromEntries(Object.entries(set).map(([k, v]) => [k.replace("settings.", ""), v])) };
}

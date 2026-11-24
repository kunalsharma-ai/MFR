#!/usr/bin/env node
// Question bank clean-up, Nov 2026: merges the old profiles into the Survey 2026 profiles with no duplicate
// questions or options, carries members' answers over, and applies the fixes from the bank check.
//
//   node scripts/question-bank-2026-11/fix.mjs                 dry run: copies the data to <db>_qbfix_dryrun, runs there, reports
//   node scripts/question-bank-2026-11/fix.mjs --apply         backs up Question/Option/Profile/Answer to JSON, then runs on the real data
//   node scripts/question-bank-2026-11/fix.mjs --restore DIR   puts back the data saved in DIR by --apply
//   options: --uri mongodb://...  (default: env "mongodb", else mongodb://db/mfr)   --origin host (default: every origin)
//            --plan file (default: plan.json next to this script)   --keep (keep the dry-run database)
//
// Nothing is hard-deleted from the bank: retired questions/options/profiles get isDeleted:true, isActive:false.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const arg = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const URI = arg("--uri", process.env.mongodb ?? "mongodb://db/mfr");
const APPLY = flag("--apply");
const PLAN = JSON.parse(fs.readFileSync(arg("--plan", path.join(here, "plan.json")), "utf8"));
const ONLY_ORIGIN = arg("--origin", null);
const COLLS = ["Question", "Option", "Profile", "Answer"];
const BY = "question-bank-2026-11";
const { EJSON } = mongoose.mongo.BSON;

const live = { isDeleted: { $ne: true } };
export const key = (s) => String(s ?? "").toLowerCase().normalize("NFC").replace(/&/g, "and").replace(/[^\p{L}\p{N}+]/gu, "");
const uniq = (a) => [...new Set(a)];
const MULTI = { radio: "checkbox", "select-single": "select-multiple", select: "select-multiple" };
const SINGLE = { checkbox: "radio", "select-multiple": "select-single" };
export const isMultiple = (type) => ["checkbox", "select-multiple"].includes(type);

export class Fixer {
    constructor(db, origin, log = console.log) {
        Object.assign(this, { db, origin, log, now: new Date(), stats: {}, warnings: [] });
        this.Q = db.collection("Question"); this.O = db.collection("Option");
        this.P = db.collection("Profile"); this.A = db.collection("Answer");
    }
    count(k, n = 1) { this.stats[k] = (this.stats[k] ?? 0) + n; }
    warn(m) { this.warnings.push(m); this.log("  ! " + m); }
    o(extra = {}) { return { origin: this.origin, ...live, ...extra }; }
    q(name) { return this.Q.findOne(this.o({ name })); }
    opts(question, extra = {}) { return this.O.find(this.o({ question, ...extra })).toArray(); }
    gone() { return { isDeleted: true, isActive: false, "deleted.At": this.now, updatedAt: this.now }; }
    async profiles(filter = {}) { return this.P.find(this.o(filter)).toArray(); }
    async savePages(p, pages) {
        if (JSON.stringify(pages) === JSON.stringify(p.pages)) return false;
        await this.P.updateOne({ _id: p._id }, { $set: { pages, updatedAt: this.now } });
        p.pages = pages; this.count("profile pages changed"); return true;
    }
    async newOption(question, o, template) {
        const max = await this.O.find(this.o({ question })).sort({ sortOrder: -1 }).limit(1).toArray();
        const doc = {
            question, label: o.label, value: o.value, parentValue: o.parentValue ?? [],
            isSelected: false, isExclusive: !!o.isExclusive, origin: this.origin, isActive: true, isDeleted: false,
            sortOrder: (max[0]?.sortOrder ?? 0) + 1, createdAt: this.now, updatedAt: this.now, created: { From: BY },
        };
        // the unique index (question, value, origin, label) also covers retired rows: bring one back instead
        const old = await this.O.findOne({ question, value: o.value, label: o.label, origin: this.origin, isDeleted: true });
        if (old) {
            await this.O.updateOne({ _id: old._id }, { $set: { isDeleted: false, isActive: true, parentValue: doc.parentValue, updatedAt: this.now }, $unset: { deleted: "" } });
        } else await this.O.insertOne(doc);
        this.count("options added");
    }
    async addOptions(question, list) {
        const have = new Set((await this.opts(question)).map((x) => key(x.value)));
        for (const o of list) {
            if (have.has(key(o.value))) continue;
            await this.newOption(question, o); have.add(key(o.value));
        }
    }
    async retire(name) {
        const r = await this.Q.updateMany(this.o({ name }), { $set: this.gone() });
        const ro = await this.O.updateMany(this.o({ question: name }), { $set: this.gone() });
        this.count("questions retired", r.modifiedCount); this.count("options retired", ro.modifiedCount);
    }
    async removeFromProfiles(name, filter = {}) {
        for (const p of await this.profiles(filter))
            await this.savePages(p, p.pages.map((pg) => pg.filter((n, i) => i === 0 || n !== name)));
    }
    // writes one member's answer to a new question; returns what happened
    async putAnswer(user, question, values, from, multiple) {
        const ex = await this.A.findOne({ user, question, origin: this.origin });
        if (!ex) {
            await this.A.insertOne({ user, question, answer: values, origin: this.origin, isActive: true, isDeleted: false,
                sortOrder: 0, migratedFrom: [from], createdAt: this.now, updatedAt: this.now });
            return "answers carried over";
        }
        if (ex.isDeleted) {
            await this.A.updateOne({ _id: ex._id }, { $set: { answer: values, isDeleted: false, isActive: true, migratedFrom: [from], updatedAt: this.now } });
            return "answers carried over";
        }
        if (ex.migratedFrom && multiple) {
            const merged = uniq([...(ex.answer ?? []), ...values]);
            await this.A.updateOne({ _id: ex._id }, { $set: { answer: merged, updatedAt: this.now }, $addToSet: { migratedFrom: from } });
            return "answers combined";
        }
        return "answers kept (member already answered the new question)";
    }

    // ------------------------------------------------------------------------------------------------ steps
    async relabel(s) {
        const r = await this.Q.updateMany(this.o({ name: s.question }), { $set: { label: s.label, updatedAt: this.now } });
        if (!r.matchedCount) this.warn(`relabel: ${s.question} not found`); else this.count("labels fixed", r.modifiedCount);
    }
    async relabelReplace(s) {
        const q = await this.q(s.question);
        if (!q) return this.warn(`relabel: ${s.question} not found`);
        if (!q.label?.includes(s.find)) return;
        await this.Q.updateOne({ _id: q._id }, { $set: { label: q.label.replace(s.find, s.replace), updatedAt: this.now } });
        this.count("labels fixed");
    }
    async setQuestion(s) {
        const u = {};
        if (s.set) u.$set = { ...s.set, updatedAt: this.now };
        if (s.unset) u.$unset = Object.fromEntries(s.unset.map((k) => [k, ""]));
        await this.Q.updateMany(this.o({ name: s.question }), u);
    }
    async setOptionParentValue(s) {
        await this.O.updateMany(this.o({ question: s.question, ...(s.values ? { value: { $in: s.values } } : {}) }),
            { $set: { parentValue: s.parentValue, updatedAt: this.now } });
    }
    async addOptionParentValue(s) {
        await this.O.updateMany(this.o({ question: s.question }), { $addToSet: { parentValue: { $each: s.add } }, $set: { updatedAt: this.now } });
    }
    async addOptions_(s) { await this.addOptions(s.question, s.options); }
    async deleteOptions(s) {
        const keys = new Set(s.values.map(key));
        const ids = (await this.opts(s.question)).filter((o) => keys.has(key(o.value))).map((o) => o._id);
        const r = await this.O.updateMany({ _id: { $in: ids } }, { $set: this.gone() });
        this.count("options retired", r.modifiedCount);
    }
    async softDeleteQuestion(s) { await this.retire(s.question); await this.removeFromProfiles(s.question); }
    async replaceOptions(s) {
        const want = new Map(s.options.map((o) => [key(o.value), o.value]));
        const cur = await this.opts(s.question);
        const drop = cur.filter((o) => !want.has(key(o.value))).map((o) => o._id);
        const r = await this.O.updateMany({ _id: { $in: drop } }, { $set: this.gone() });
        this.count("options retired", r.modifiedCount);
        await this.addOptions(s.question, s.options);
        for await (const a of this.A.find({ question: s.question, origin: this.origin, ...live })) {
            const next = uniq((a.answer ?? []).flatMap((v) => s.answerMap[v] ?? (want.has(key(v)) ? [want.get(key(v))] : [])));
            if (JSON.stringify(next) === JSON.stringify(a.answer)) continue;
            if (next.length) await this.A.updateOne({ _id: a._id }, { $set: { answer: next, updatedAt: this.now } });
            else await this.A.deleteOne({ _id: a._id }); // nothing maps: the member is asked again
            this.count(next.length ? "answers remapped" : "answers removed (no matching new option)");
        }
    }
    async insertQuestions(s) {
        const t = await this.q(s.copyFrom);
        if (!t) return this.warn(`insertQuestions: template ${s.copyFrom} not found`);
        const pick = ({ type, category, isRequired, isEditable, isMoney, hasOthers, hasNone, hasSkip, size }) =>
            Object.fromEntries(Object.entries({ type, category, isRequired, isEditable, isMoney, hasOthers: false, hasNone, hasSkip, size }).filter(([, v]) => v !== undefined));
        for (const nq of s.questions) {
            if (await this.q(nq.name)) continue;
            await this.Q.insertOne({ ...pick(t), ...nq, origin: this.origin, isActive: true, isDeleted: false, sortOrder: 0,
                createdAt: this.now, updatedAt: this.now, created: { From: BY } });
            this.count("questions added");
        }
        const byQ = {};
        for (const o of s.options) (byQ[o.question] ??= []).push(o);
        for (const [q, list] of Object.entries(byQ)) await this.addOptions(q, list);
    }
    async dedupeOptions(s) {
        const groups = new Map();
        for (const o of await this.opts(s.question)) {
            const k = key(o.value) + "|" + JSON.stringify([...(o.parentValue ?? [])].sort());
            (groups.get(k) ?? groups.set(k, []).get(k)).push(o);
        }
        for (const g of groups.values()) {
            if (g.length < 2) continue;
            const used = await Promise.all(g.map((o) => this.A.countDocuments({ question: s.question, origin: this.origin, answer: o.value })));
            const keep = g[used.indexOf(Math.max(...used))];
            for (const o of g) {
                if (o === keep) continue;
                await this.O.updateOne({ _id: o._id }, { $set: this.gone() }); this.count("duplicate options removed");
                if (o.value === keep.value) continue;
                for await (const a of this.A.find({ question: s.question, origin: this.origin, answer: o.value }))
                    await this.A.updateOne({ _id: a._id }, { $set: { answer: uniq(a.answer.map((v) => (v === o.value ? keep.value : v))) } });
                await this.O.updateMany(this.o({ parentValue: o.value, question: { $in: await this.childNames(s.question) } }),
                    { $set: { "parentValue.$[e]": keep.value } }, { arrayFilters: [{ e: o.value }] });
            }
        }
    }
    async dedupeAllOptions() {
        for (const name of await this.O.distinct("question", this.o())) await this.dedupeOptions({ question: name });
    }
    async dedupeProfiles() {
        for (const p of await this.profiles()) {
            const seen = new Set();
            await this.savePages(p, p.pages.map((pg) => pg.filter((n, i) => i === 0 || (!seen.has(n) && seen.add(n)))));
        }
    }
    async childNames(name) { return (await this.Q.find(this.o({ parent: name }), { projection: { name: 1 } }).toArray()).map((x) => x.name); }
    async softDeleteOrphanOptions(s) {
        for (const name of s.questions) {
            if (await this.Q.findOne({ name, origin: this.origin, ...live })) continue;
            const r = await this.O.updateMany(this.o({ question: name }), { $set: this.gone() });
            this.count("orphan options retired", r.modifiedCount);
        }
    }
    async mergeQuestion(s) {
        const from = await this.q(s.from), to = await this.q(s.to);
        if (!from) { this.count("merges skipped (old question not found)"); return; }
        if (!to) return this.warn(`merge ${s.from} -> ${s.to}: new question not found, skipped`);
        await this.addOptions(s.to, s.addOptions ?? []);
        const multiple = s.toMultiple ?? isMultiple(to.type);
        const crossMultiple = {};
        // answers
        for await (const a of this.A.find({ question: s.from, origin: this.origin, ...live })) {
            const out = { [s.to]: [] };
            for (const v of [a.answer ?? []].flat()) {
                let hit = null;
                for (const c of s.conditional ?? []) {
                    if (c.value !== v) continue;
                    const dep = await this.A.findOne({ user: a.user, question: c.when.question, origin: this.origin });
                    if ([dep?.answer ?? []].flat().includes(c.when.value)) { hit = c.to; break; }
                }
                if (hit === null && (s.conditional ?? []).some((c) => c.value === v)) hit = [];
                const mapped = hit ?? s.valueMap?.[v] ?? [];
                out[s.to].push(...mapped);
                for (const x of s.crossMap?.[v] ?? []) (out[x.question] ??= []).push(x.value);
                if (hit === null && !(v in (s.valueMap ?? {})) && !s.crossMap?.[v]) this.count("answer values with no match (not carried over)");
            }
            for (const [q, vals] of Object.entries(out)) {
                if (!vals.length) continue;
                if (q !== s.to && crossMultiple[q] === undefined) crossMultiple[q] = true; // cross targets are all "select all that apply" lists
                this.count(await this.putAnswer(a.user, q, uniq(vals), s.from, q === s.to ? multiple : crossMultiple[q]));
            }
        }
        // questions shown under the old one now hang off the new one
        const pv = s.childParentValueMap ?? {};
        for (const child of await this.Q.find(this.o({ parent: s.from })).toArray()) {
            await this.Q.updateOne({ _id: child._id }, { $set: { parent: s.to, updatedAt: this.now } });
            for (const o of await this.opts(child.name)) {
                const next = uniq((o.parentValue ?? []).flatMap((v) => pv[v] ?? [v]));
                if (JSON.stringify(next) !== JSON.stringify(o.parentValue)) await this.O.updateOne({ _id: o._id }, { $set: { parentValue: next } });
            }
            this.count("child questions re-pointed");
        }
        // profiles (old and teen ones): the new question takes the old one's place
        // (in a retired or teen profile that would repeat a question asked in a sibling profile, it is dropped instead)
        const retired = new Set(this.plan?.retiredProfiles ?? []);
        for (const p of await this.profiles({ pages: { $elemMatch: { $elemMatch: { $eq: s.from } } } })) {
            const sibling = (await this.profiles({ category: p.category, _id: { $ne: p._id }, pages: { $elemMatch: { $elemMatch: { $eq: s.to } } } })).length > 0;
            const drop = sibling && (p.category !== "b2c" || retired.has(p.slug));
            const pages = p.pages.map((pg) => pg.flatMap((n, i) => (i > 0 && n === s.from ? (drop ? [] : [s.to]) : [n])).filter((n, i, a) => i === 0 || a.indexOf(n) === i));
            await this.savePages(p, pages);
        }
        await this.retire(s.from);
        this.count("questions merged");
    }
    async moveQuestion(s) {
        const q = await this.q(s.question);
        if (!q) return this.warn(`move: ${s.question} not found`);
        const [target] = await this.profiles({ slug: s.to.slug, category: s.to.category });
        if (!target) return this.warn(`move: profile ${s.to.slug}/${s.to.category} not found`);
        for (const p of await this.profiles({ category: s.fromCategory ?? s.to.category, _id: { $ne: target._id } }))
            await this.savePages(p, p.pages.map((pg) => pg.filter((n, i) => i === 0 || n !== s.question)));
        if (target.pages.some((pg) => pg.slice(1).includes(s.question))) return;
        const pages = target.pages.map((pg) => [...pg]);
        let pg = pages.find((x) => q.parent && x.includes(q.parent)) ?? pages[pages.length - 1];
        let at = pg.length;
        if (q.parent && pg.includes(q.parent)) {
            const parents = Object.fromEntries((await this.Q.find(this.o({ name: { $in: pg } }), { projection: { name: 1, parent: 1 } }).toArray()).map((x) => [x.name, x.parent]));
            const under = (n) => { for (let p = parents[n], k = 0; p && k < 20; p = parents[p], k++) if (p === q.parent) return true; return false; };
            at = pg.indexOf(q.parent) + 1;
            while (at < pg.length && under(pg[at])) at++;
        }
        pg.splice(at, 0, s.question);
        await this.savePages(target, pages);
        this.count("questions moved");
    }
    async findProfile(s) {
        const [p] = await this.profiles({ slug: s.profile.slug, category: s.profile.category });
        if (!p) this.warn(`profile ${s.profile.slug}/${s.profile.category} not found`);
        return p;
    }
    async profileReplaceNth(s) {
        const p = await this.findProfile(s); if (!p) return;
        let seen = 0;
        await this.savePages(p, p.pages.map((pg) => pg.map((n, i) => (i > 0 && n === s.name && ++seen === s.nth ? s.replace : n))));
    }
    async profileInsert(s) {
        const p = await this.findProfile(s); if (!p) return;
        if (p.pages.some((pg) => pg.slice(1).includes(s.name))) return;
        const pages = p.pages.map((pg) => [...pg]);
        const ref = s.after ?? s.before;
        const pg = pages.find((x) => x.slice(1).includes(ref)) ?? pages[pages.length - 1];
        const i = pg.indexOf(ref);
        pg.splice(i < 1 ? pg.length : s.after ? i + 1 : i, 0, s.name);
        if (i < 1) this.warn(`${s.profile.slug}: ${ref} not in the profile, ${s.name} added at the end`);
        await this.savePages(p, pages);
    }
    async profileRemove(s) {
        const p = await this.findProfile(s); if (!p) return;
        await this.savePages(p, p.pages.map((pg) => pg.filter((n, i) => i === 0 || !s.names.includes(n))));
    }
    async softDeleteProfile(s) {
        const r = await this.P.updateMany(this.o({ slug: s.profile.slug, category: s.profile.category, name: s.profile.name ?? "" }), { $set: this.gone() });
        this.count("profiles retired", r.modifiedCount);
    }
    async deactivateProfileIfEmpty(s) {
        const p = await this.findProfile(s); if (!p) return;
        // merged questions took the old ones' place here too; they are asked in their new profile, so drop them
        const elsewhere = new Set((await this.profiles({ category: p.category, isActive: { $ne: false }, _id: { $ne: p._id } }))
            .flatMap((x) => x.pages.flatMap((pg) => pg.slice(1))));
        await this.savePages(p, p.pages.map((pg) => pg.filter((n, i) => i === 0 || !elsewhere.has(n))));
        const left = p.pages.flatMap((pg) => pg.slice(1)).filter(Boolean);
        if (left.length) return this.warn(`${s.profile.slug}/${s.profile.category} still has ${left.join(", ")}; left active`);
        await this.P.updateOne({ _id: p._id }, { $set: { isActive: false, updatedAt: this.now } });
        this.count("old profiles switched off");
    }
    async setMultiple(s) {
        const map = s.multiple ? MULTI : SINGLE;
        for (const name of s.questions) {
            const q = await this.q(name);
            if (!q) continue;
            if (map[q.type]) { await this.Q.updateOne({ _id: q._id }, { $set: { type: map[q.type], updatedAt: this.now } }); this.count("question types fixed"); }
            else if (s.multiple !== isMultiple(q.type)) this.warn(`${name}: type "${q.type}" should be ${s.multiple ? "multiple" : "single"} choice; left as is`);
        }
    }
    async setExclusive(s) {
        const keys = new Set(s.values.map(key));
        const ids = (await this.opts(s.question)).filter((o) => keys.has(key(o.value)) && !o.isExclusive).map((o) => o._id);
        const r = await this.O.updateMany({ _id: { $in: ids } }, { $set: { isExclusive: true, updatedAt: this.now } });
        this.count("options made exclusive", r.modifiedCount);
    }
    async run(steps, plan = null) {
        this.plan = plan;
        for (const [i, s] of steps.entries()) {
            const fn = s.op === "addOptions" ? this.addOptions_ : this[s.op];
            if (typeof fn !== "function") throw new Error(`step ${i}: unknown op ${s.op}`);
            await fn.call(this, s);
        }
        return { stats: this.stats, warnings: this.warnings };
    }
}

async function backup(db, dir) {
    fs.mkdirSync(dir, { recursive: true });
    for (const c of COLLS) {
        const out = fs.createWriteStream(path.join(dir, `${c}.ejson`));
        let n = 0;
        for await (const d of db.collection(c).find(ONLY_ORIGIN ? { origin: ONLY_ORIGIN } : {})) { out.write(EJSON.stringify(d, { relaxed: false }) + "\n"); n++; }
        await new Promise((r) => out.end(r));
        console.log(`  backup ${c}: ${n} documents`);
    }
    fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify({ at: new Date(), origin: ONLY_ORIGIN, uri: URI.replace(/\/\/[^@]*@/, "//***@") }, null, 1));
}
async function restore(db, dir) {
    const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
    for (const c of COLLS) {
        const docs = fs.readFileSync(path.join(dir, `${c}.ejson`), "utf8").split("\n").filter(Boolean).map((l) => EJSON.parse(l, { relaxed: false }));
        await db.collection(c).deleteMany(meta.origin ? { origin: meta.origin } : {});
        for (let i = 0; i < docs.length; i += 1000) await db.collection(c).insertMany(docs.slice(i, i + 1000), { ordered: false });
        console.log(`  restored ${c}: ${docs.length} documents`);
    }
}

async function main() {
    await mongoose.connect(URI);
    let db = mongoose.connection.db;
    if (flag("--restore")) { await restore(db, arg("--restore")); return; }
    const origins = ONLY_ORIGIN ? [ONLY_ORIGIN] : (await db.collection("Question").distinct("origin")).filter(Boolean);
    let scratch = null;
    if (APPLY) {
        const dir = path.join(here, "backups", new Date().toISOString().replace(/[:.]/g, "-"));
        console.log(`Backing up to ${dir}`);
        await backup(db, dir);
    } else {
        scratch = mongoose.connection.client.db(`${db.databaseName}_qbfix_dryrun`);
        await scratch.dropDatabase();
        for (const c of COLLS) {
            await db.collection(c).aggregate([{ $match: ONLY_ORIGIN ? { origin: ONLY_ORIGIN } : {} }, { $out: { db: scratch.databaseName, coll: c } }]).toArray();
        }
        console.log(`Dry run on a copy (${scratch.databaseName}). Nothing in ${db.databaseName} is changed. Add --apply to run for real.`);
        db = scratch;
    }
    const report = {};
    for (const origin of origins) {
        console.log(`\n== ${origin}`);
        report[origin] = await new Fixer(db, origin).run(PLAN.steps, PLAN);
        for (const [k, v] of Object.entries(report[origin].stats)) console.log(`  ${k}: ${v}`);
    }
    fs.writeFileSync(path.join(here, APPLY ? "last-apply-report.json" : "last-dry-run-report.json"), JSON.stringify(report, null, 1));
    if (scratch && !flag("--keep")) await scratch.dropDatabase();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().then(() => mongoose.disconnect()).catch((e) => { console.error(e); mongoose.disconnect(); process.exit(1); });
}

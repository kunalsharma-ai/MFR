#!/usr/bin/env node
// Teen question bank, Nov 2026: puts the Teen Panel bank (bank.json, generated from frontend-1/src/teen/data/teenProfiles.js
// by frontend-1/scripts/teen-content-sync.mjs) into the member-hub Profiles page.
//
//   node scripts/teen-bank-2026-11/sync.mjs                  dry run: copies the data to <db>_teenbank_dryrun, runs there, reports
//   node scripts/teen-bank-2026-11/sync.mjs --apply          backs up Question/Option/Profile/Answer to JSON, then runs on the real data
//   node scripts/teen-bank-2026-11/sync.mjs --restore DIR    puts back the data saved in DIR by --apply
//   options: --uri mongodb://...  (default: env "mongodb", else mongodb://db/mfr)   --origin host (default: every origin)   --keep
//
// What it does, per origin (every step is safe to run again):
//   1. questions: one Question per bank key (name = lower-case key, category ["b2c-minor"]), wording, type and show-when
//      parent from the bank; a question already there is updated in place.
//   2. options: exactly the bank's options, in order. Options no longer in the bank are retired (isDeleted), never removed.
//   3. profiles: one b2c-minor Profile per bank profile (slug teen-*), with its questions in bank order.
//   4. the old category "minor" profiles (adult questions reused for teens) are switched off (isActive: false). Their
//      questions are NOT touched: adults still answer them, and teens' old answers stay where they are.
//   5. answers the teen API saved under an upper-case key (D04, T01 ...) are renamed to the lower-case question name,
//      unless the member already has a lower-case answer (then the old one is left and reported).
// b2c-minor profiles that are not in the bank are reported and left alone.
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
const ONLY_ORIGIN = arg("--origin", null);
const COLLS = ["Question", "Option", "Profile", "Answer"]; // User is read only (which accounts are teens)
const BY = "teen-bank-2026-11";
const { EJSON } = mongoose.mongo.BSON;
export const BANK = JSON.parse(fs.readFileSync(path.join(here, "bank.json"), "utf8"));
const live = { isDeleted: { $ne: true } };

export class TeenBank {
    constructor(db, origin, bank = BANK, log = console.log) {
        Object.assign(this, { db, origin, bank, log, now: new Date(), stats: {}, warnings: [] });
        this.Q = db.collection("Question"); this.O = db.collection("Option");
        this.P = db.collection("Profile"); this.A = db.collection("Answer");
        this.cat = bank.category;
    }
    count(k, n = 1) { if (n) this.stats[k] = (this.stats[k] ?? 0) + n; }
    warn(m) { this.warnings.push(m); this.log("  ! " + m); }

    async question(q) {
        const want = {
            label: q.label, type: q.type, parent: q.parent ?? "", isRequired: q.isRequired, isEditable: true,
            isMoney: false, hasOthers: false, hasNone: false, hasSkip: false, size: "6",
        };
        const ex = await this.Q.findOne({ name: q.name, origin: this.origin, category: this.cat });
        if (!ex) {
            await this.Q.insertOne({ name: q.name, category: [this.cat], ...want, origin: this.origin, isActive: true, isDeleted: false,
                sortOrder: 0, createdAt: this.now, updatedAt: this.now, created: { From: BY } });
            this.count("questions added");
        } else {
            const diff = Object.entries(want).filter(([k, v]) => JSON.stringify(ex[k] ?? "") !== JSON.stringify(v ?? ""));
            if (diff.length || ex.isDeleted || ex.isActive === false) {
                await this.Q.updateOne({ _id: ex._id }, { $set: { ...want, isActive: true, isDeleted: false, updatedAt: this.now }, $unset: { deleted: "" } });
                this.count("questions updated");
            }
        }
        const other = await this.Q.countDocuments({ name: q.name, origin: this.origin, category: { $ne: this.cat }, ...live });
        if (other) this.warn(`${q.name}: a question with this name also exists outside ${this.cat}`);
    }
    async options(q) {
        const cur = await this.O.find({ question: q.name, origin: this.origin }).toArray();
        const want = new Map(q.options.map((o) => [o.value, o]));
        const drop = cur.filter((o) => !o.isDeleted && !want.has(o.value)).map((o) => o._id);
        if (drop.length) {
            await this.O.updateMany({ _id: { $in: drop } }, { $set: { isDeleted: true, isActive: false, "deleted.At": this.now, updatedAt: this.now } });
            this.count("options retired", drop.length);
        }
        for (const o of q.options) {
            const set = { label: o.label, sortOrder: o.sortOrder, isExclusive: o.isExclusive, parentValue: o.parentValue, isActive: true, isDeleted: false };
            const same = cur.filter((x) => x.value === o.value);
            const keep = same.find((x) => !x.isDeleted && x.label === o.label) || same.find((x) => !x.isDeleted) || same.find((x) => x.label === o.label) || same[0];
            if (!keep) {
                await this.O.insertOne({ question: q.name, value: o.value, ...set, isSelected: false, describeLabel: "", origin: this.origin,
                    createdAt: this.now, updatedAt: this.now, created: { From: BY } });
                this.count("options added");
                continue;
            }
            const changed = Object.entries(set).some(([k, v]) => JSON.stringify(keep[k]) !== JSON.stringify(v));
            if (changed) {
                // the unique index is (question, value, origin, label): a relabel must not collide with a retired twin
                const twin = same.find((x) => x !== keep && x.label === o.label);
                if (twin) await this.O.deleteOne({ _id: twin._id });
                await this.O.updateOne({ _id: keep._id }, { $set: { ...set, updatedAt: this.now }, $unset: { deleted: "" } });
                this.count("options updated");
            }
            const dupes = same.filter((x) => x !== keep && !x.isDeleted).map((x) => x._id);
            if (dupes.length) {
                await this.O.updateMany({ _id: { $in: dupes } }, { $set: { isDeleted: true, isActive: false, "deleted.At": this.now, updatedAt: this.now } });
                this.count("duplicate options retired", dupes.length);
            }
        }
    }
    async profile(p) {
        const pages = [[p.name, ...p.questions.map((q) => q.name)]];
        const want = { name: p.name, icon: p.icon, pages, sortOrder: p.sortOrder, isActive: true, isDeleted: false };
        const ex = await this.P.findOne({ slug: p.slug, category: this.cat, origin: this.origin });
        if (!ex) {
            await this.P.insertOne({ slug: p.slug, category: this.cat, ...want, name: p.name.toLowerCase(), origin: this.origin,
                createdAt: this.now, updatedAt: this.now, created: { From: BY } });
            this.count("profiles added");
        } else if (Object.entries(want).some(([k, v]) => JSON.stringify(k === "name" ? ex[k] : ex[k]) !== JSON.stringify(k === "name" ? v.toLowerCase() : v))) {
            await this.P.updateOne({ _id: ex._id }, { $set: { ...want, name: p.name.toLowerCase(), updatedAt: this.now }, $unset: { deleted: "" } });
            this.count("profiles updated");
        }
    }
    async switchOffOldMinor() {
        const r = await this.P.updateMany({ category: "minor", origin: this.origin, isActive: { $ne: false }, ...live }, { $set: { isActive: false, updatedAt: this.now } });
        this.count("old minor profiles switched off", r.modifiedCount);
        const slugs = new Set(this.bank.profiles.map((p) => p.slug));
        for (const p of await this.P.find({ category: this.cat, origin: this.origin, isActive: { $ne: false }, ...live }).toArray())
            if (!slugs.has(p.slug)) this.warn(`${this.cat} profile "${p.slug}" is not in the teen bank; left as it is`);
    }
    async renameAnswers() {
        const names = new Set((this.bank.allKeys || []).flatMap((n) => [n, `${n}__other`]));
        // only teen accounts: the keys are the teen API's, and an adult answer is never renamed
        const teens = (await this.db.collection("User").find({ origin: this.origin, category: { $regex: /minor/ } }, { projection: { _id: 1 } }).toArray()).map((u) => String(u._id));
        const rows = await this.A.find({ origin: this.origin, user: { $in: teens }, question: { $regex: /[A-Z]/ } }, { projection: { question: 1, user: 1 } }).toArray();
        for (const a of rows) {
            const to = a.question.toLowerCase();
            if (!names.has(to)) continue;
            const clash = await this.A.findOne({ user: a.user, question: to, origin: this.origin });
            if (clash) { this.count("old upper-case answers left (member already has the new one)"); continue; }
            await this.A.updateOne({ _id: a._id }, { $set: { question: to, updatedAt: this.now } });
            this.count("answers renamed to the lower-case key");
        }
    }
    async run() {
        for (const p of this.bank.profiles) for (const q of p.questions) { await this.question(q); await this.options(q); }
        for (const p of this.bank.profiles) await this.profile(p);
        await this.switchOffOldMinor();
        await this.renameAnswers();
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
        scratch = mongoose.connection.client.db(`${db.databaseName}_teenbank_dryrun`);
        await scratch.dropDatabase();
        for (const c of [...COLLS, "User"]) await db.collection(c).aggregate([{ $match: ONLY_ORIGIN ? { origin: ONLY_ORIGIN } : {} }, { $out: { db: scratch.databaseName, coll: c } }]).toArray();
        console.log(`Dry run on a copy (${scratch.databaseName}). Nothing in ${db.databaseName} is changed. Add --apply to run for real.`);
        db = scratch;
    }
    const report = {};
    for (const origin of origins) {
        console.log(`\n== ${origin}`);
        report[origin] = await new TeenBank(db, origin).run();
        for (const [k, v] of Object.entries(report[origin].stats)) console.log(`  ${k}: ${v}`);
    }
    fs.writeFileSync(path.join(here, APPLY ? "last-apply-report.json" : "last-dry-run-report.json"), JSON.stringify(report, null, 1));
    if (scratch && !flag("--keep")) await scratch.dropDatabase();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().then(() => mongoose.disconnect()).catch((e) => { console.error(e); mongoose.disconnect(); process.exit(1); });
}

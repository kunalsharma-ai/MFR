#!/usr/bin/env node
// Checks the question bank after fix.mjs:  node scripts/question-bank-2026-11/verify.mjs [--uri ...] [--origin host]
// Exits 1 if a profile asks a missing question, a question is asked twice, or a question has duplicate options.
import mongoose from "mongoose";
import { key } from "./fix.mjs";
const argv = process.argv.slice(2);
const arg = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const live = { isDeleted: { $ne: true } };
const KEEP_ORPHANS = ["language", "specialization"];
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export async function verify(db, origin) {
    const errors = [], notes = [];
    const Q = await db.collection("Question").find({ origin, ...live }).toArray();
    const byName = new Map(Q.map((q) => [q.name, q]));
    const P = await db.collection("Profile").find({ origin, ...live, isActive: { $ne: false } }).toArray();
    const where = new Map();
    for (const p of P) {
        const names = p.pages.flatMap((pg) => pg.slice(1));
        for (const n of names) {
            if (!n) { errors.push(`${p.slug}/${p.category}: blank entry`); continue; }
            if (!byName.has(n)) errors.push(`${p.slug}/${p.category}: asks "${n}", which is not a live question`);
            (where.get(`${p.category}|${n}`) ?? where.set(`${p.category}|${n}`, []).get(`${p.category}|${n}`)).push(p.slug);
        }
    }
    for (const [k, slugs] of where) {
        if (slugs.length < 2) continue;
        const [cat, n] = k.split("|");
        if (new Set(slugs).size < slugs.length || cat !== "b2c") errors.push(`${n} is asked ${slugs.length} times (${slugs.join(", ")}) in ${cat}`);
        else notes.push(`${n} is shared by ${slugs.join(" and ")} (one question, answered once)`);
    }
    for (const q of Q) if (q.parent && !byName.has(q.parent)) errors.push(`${q.name}: parent "${q.parent}" is not a live question`);
    const opts = new Map(), orphans = {};
    for await (const o of db.collection("Option").find({ origin, ...live }, { projection: { question: 1, value: 1, parentValue: 1 } })) {
        if (!byName.has(o.question)) { orphans[o.question] = (orphans[o.question] ?? 0) + 1; continue; }
        const k = key(o.value) + "|" + JSON.stringify([...(o.parentValue ?? [])].sort());
        const m = opts.get(o.question) ?? opts.set(o.question, new Map()).get(o.question);
        if (m.has(k)) errors.push(`${o.question}: option "${o.value}" is there twice`); else m.set(k, o.value);
    }
    for (const [q, n] of Object.entries(orphans))
        (KEEP_ORPHANS.includes(q) ? notes : errors).push(`${n} options belong to "${q}", which is not a question${KEEP_ORPHANS.includes(q) ? " (kept: the app reads these lists directly)" : ""}`);
    // same wording asked in two active b2c profiles
    const asked = new Map();
    for (const p of P.filter((x) => x.category === "b2c"))
        for (const n of p.pages.flatMap((pg) => pg.slice(1))) {
            const l = norm(byName.get(n)?.label); if (!l) continue;
            (asked.get(l) ?? asked.set(l, new Set()).get(l)).add(n);
        }
    for (const [l, ns] of asked) if (ns.size > 1) errors.push(`same wording "${l}" in ${[...ns].join(", ")}`);
    // show-when values that match no answer of the parent (the child would never show for them)
    let dead = 0;
    for (const q of Q.filter((x) => x.parent && opts.has(x.parent) && opts.has(x.name))) {
        const pv = new Set([...opts.get(q.parent).values()].map(key));
        const rows = await db.collection("Option").find({ origin, question: q.name, ...live }, { projection: { parentValue: 1 } }).toArray();
        const bad = new Set(rows.flatMap((o) => o.parentValue ?? []).filter((v) => !pv.has(key(v))));
        if (bad.size) { dead++; notes.push(`${q.name} (under ${q.parent}) has show-when values ${[...bad].slice(0, 4).join(", ")} that ${q.parent} does not offer`); }
    }
    return { errors, notes, counts: { questions: Q.length, activeProfiles: P.length, options: [...opts.values()].reduce((a, m) => a + m.size, 0), childrenWithDeadShowWhen: dead } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await mongoose.connect(arg("--uri", process.env.mongodb ?? "mongodb://db/mfr"));
    const db = mongoose.connection.db;
    const origins = arg("--origin", null) ? [arg("--origin")] : (await db.collection("Question").distinct("origin")).filter(Boolean);
    let bad = 0;
    for (const o of origins) {
        const r = await verify(db, o);
        console.log(`== ${o}`, r.counts);
        r.errors.forEach((e) => console.log("  ERROR " + e)); r.notes.forEach((e) => console.log("  note  " + e));
        bad += r.errors.length;
    }
    await mongoose.disconnect();
    process.exit(bad ? 1 : 0);
}

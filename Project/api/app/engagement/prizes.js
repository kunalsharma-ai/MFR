// Prize machines (super admin spec, module 7), member side. One machine per segment: claw (Consumer), lift
// (Professional), spiral (Teen). Behind the brand's prize_machines switch, which is a legal switch and off by default.
//
//   GET  /api/v1/engagement/prize-machine         the member's machine, plays left today and their last wins (or null)
//   POST /api/v1/engagement/prize-machine/play    one play: picks a prize by its odds, pays points prizes to the ledger
//
// Teens never win points or money (the admin side refuses such prizes, and play() checks again).
import crypto from "node:crypto";
import mongoose from "mongoose";
import { PrizeMachine, PrizePlay } from "../model/index.js";
import { resolve, scopeOf } from "./switches.js";
import { grant } from "./ledger.js";
import { dayKey } from "./time.js";
import { memberType, fail } from "./http.js";

export const SKINS = { consumer: "claw", professional: "lift", teen: "spiral" };
export const TEEN_KINDS = ["badge", "nothing"];
const oid = (id) => new mongoose.Types.ObjectId(String(id));
const countryOf = (user) => String(user?.address?.[0]?.country || "").trim().toLowerCase();
const inCountries = (c, list) => Boolean(c) && (list || []).some((x) => c === x || c.startsWith(x));

/** The machine this member may play now, or null (switch off, no live machine, or not in its countries). */
export async function machineFor(user, origin) {
    const segment = memberType(user);
    if (!(await resolve(origin, "prize_machines", scopeOf(user))).on) return null;
    const m = await PrizeMachine.findOne({ origin, segment, status: "live", isActive: true, isDeleted: false }).lean();
    if (!m || !inCountries(countryOf(user), m.countries)) return null;
    return m;
}

const total = (m) => m.prizes.reduce((s, p) => s + (p.weight > 0 ? p.weight : 0), 0);
const prizeView = (p, sum, teen) => ({ key: p.key, label: p.label, kind: p.kind, points: teen ? 0 : p.points || 0, chance: sum ? Math.round((p.weight / sum) * 1000) / 10 : 0 });

export async function view(user, origin) {
    const m = await machineFor(user, origin);
    if (!m) return null;
    const teen = memberType(user) === "teen";
    const day = dayKey(new Date(), user.timezone);
    const [today, recent] = await Promise.all([
        PrizePlay.countDocuments({ origin, machine: m._id, user: oid(user._id), day }),
        PrizePlay.find({ origin, machine: m._id, user: oid(user._id) }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);
    const sum = total(m);
    return {
        id: String(m._id), skin: SKINS[m.segment], title: m.title,
        playsPerDay: m.dailyPlays, playsLeft: Math.max(0, m.dailyPlays - today),
        prizes: m.prizes.filter((p) => !teen || TEEN_KINDS.includes(p.kind)).map((p) => prizeView(p, sum, teen)),
        recent: recent.map((r) => ({ label: r.prize.label, kind: r.prize.kind, points: teen ? 0 : r.prize.points || 0, at: r.createdAt })),
    };
}

// pick by weight with a cryptographic random number
export function pick(prizes, rnd = (n) => crypto.randomInt(n)) {
    const live = prizes.filter((p) => p.weight > 0);
    const sum = live.reduce((s, p) => s + p.weight, 0);
    if (!sum) return null;
    // weights may be decimals: scale to whole numbers first
    const scale = 1000;
    let r = rnd(Math.round(sum * scale));
    for (const p of live) { r -= Math.round(p.weight * scale); if (r < 0) return p; }
    return live[live.length - 1];
}

export async function play(user, origin) {
    const m = await machineFor(user, origin);
    if (!m) fail("closed", "The prize machine isn't open for you.", 409);
    const teen = memberType(user) === "teen";
    const day = dayKey(new Date(), user.timezone);
    const used = await PrizePlay.countDocuments({ origin, machine: m._id, user: oid(user._id), day });
    if (used >= m.dailyPlays) fail("limit", `You've had your ${m.dailyPlays === 1 ? "play" : `${m.dailyPlays} plays`} for today. Come back tomorrow.`, 409);
    const prizes = teen ? m.prizes.filter((p) => TEEN_KINDS.includes(p.kind)) : m.prizes;
    const p = pick(prizes) || { key: "nothing", label: "Try again tomorrow", kind: "nothing", points: 0 };
    const prize = { key: p.key, label: p.label, kind: teen && p.kind === "points" ? "nothing" : p.kind, points: !teen && p.kind === "points" ? Math.max(0, Math.round(p.points || 0)) : 0 };
    let row;
    try {
        row = await PrizePlay.create({ origin, user: oid(user._id), machine: m._id, segment: m.segment, day, slot: used + 1, prize });
    } catch (e) {
        if (e?.code === 11000) fail("too_soon", "One moment, your last play is still being saved.", 429);
        throw e;
    }
    if (prize.kind === "points" && prize.points > 0) {
        await grant(user, origin, { category: "prize", key: `prize:${row._id}`, name: `${m.title}: ${prize.label}`, points: prize.points, remarks: `Prize machine win (${SKINS[m.segment]})` });
    }
    return { prize: { label: prize.label, kind: prize.kind, points: prize.points }, playsLeft: Math.max(0, m.dailyPlays - used - 1) };
}

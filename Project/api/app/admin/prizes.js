// Prize machines (super admin spec, module 7), admin side. One machine per segment with its prizes, odds (weights),
// daily plays and countries. Every change needs a reason. Members only see a machine while it is live, their country is
// listed and the brand's prize_machines switch (legal, Super Admin only) is on for them.
import mongoose from "mongoose";
import { PrizeMachine, PrizePlay } from "../model/index.js";
import { SKINS, TEEN_KINDS } from "../engagement/prizes.js";
import { resolve } from "../engagement/switches.js";
import { AdminError } from "./http.js";

const SEGMENTS = Object.keys(SKINS);
const KINDS = ["points", "badge", "nothing"];
const STATUSES = ["draft", "live", "paused"];
const MAX_POINTS = 10_000; // one prize; anything larger is a draw, not a machine
const COUNTRY = /^[a-z][a-z .'-]{1,59}$/;
const reasonOk = (r) => r && String(r).trim().length >= 5;

function machineView(m, segment, stats) {
    const prizes = m?.prizes || [];
    const sum = prizes.reduce((s, p) => s + (p.weight > 0 ? p.weight : 0), 0);
    return {
        segment, skin: SKINS[segment], exists: Boolean(m),
        id: m ? String(m._id) : null, title: m?.title || null, status: m?.status || "draft",
        dailyPlays: m?.dailyPlays ?? 1, countries: m?.countries || [],
        prizes: prizes.map((p) => ({ key: p.key, label: p.label, kind: p.kind, points: p.points || 0, weight: p.weight, chance: sum ? Math.round((p.weight / sum) * 1000) / 10 : 0 })),
        // average points paid per play at these odds (what one play costs the brand)
        pointsPerPlay: sum ? Math.round(prizes.reduce((s, p) => s + (p.kind === "points" && p.weight > 0 ? p.points * p.weight : 0), 0) / sum * 10) / 10 : 0,
        reason: m?.reason || null, changedBy: m?.changedBy || null, changedAt: m?.updatedAt || null,
        plays: stats || { last30Days: 0, pointsLast30Days: 0 },
    };
}

export async function list(origin) {
    const rows = await PrizeMachine.find({ origin, isDeleted: false }).lean();
    const since = new Date(Date.now() - 30 * 86400000);
    const agg = await PrizePlay.aggregate([
        { $match: { origin, createdAt: { $gte: since } } },
        { $group: { _id: "$machine", plays: { $sum: 1 }, points: { $sum: { $ifNull: ["$prize.points", 0] } } } },
    ]);
    const by = new Map(agg.map((a) => [String(a._id), { last30Days: a.plays, pointsLast30Days: a.points }]));
    const sw = await resolve(origin, "prize_machines");
    return {
        switchOn: sw.on, // whole-brand setting; narrower ones are on the switch board
        machines: SEGMENTS.map((s) => { const m = rows.find((r) => r.segment === s); return machineView(m, s, m && by.get(String(m._id))); }),
    };
}

function prizesFrom(list, segment) {
    if (!Array.isArray(list) || !list.length || list.length > 12) throw new AdminError("invalid_value", "prizes is a list of 1 to 12 prizes");
    const seen = new Set();
    return list.map((p, i) => {
        const label = String(p?.label || "").trim().slice(0, 80);
        if (label.length < 2) throw new AdminError("invalid_value", `prize ${i + 1} needs a label`);
        const kind = String(p?.kind || "");
        if (!KINDS.includes(kind)) throw new AdminError("invalid_value", `prize ${i + 1}: kind is one of ${KINDS.join(", ")}`);
        if (segment === "teen" && !TEEN_KINDS.includes(kind)) throw new AdminError("teen_prize", "Teen prizes are never points or money: use a badge or try again");
        const points = kind === "points" ? Number(p?.points) : 0;
        if (kind === "points" && !(Number.isInteger(points) && points >= 1 && points <= MAX_POINTS)) throw new AdminError("invalid_value", `prize ${i + 1}: points is a whole number from 1 to ${MAX_POINTS}`);
        const weight = Number(p?.weight);
        if (!(Number.isFinite(weight) && weight >= 0 && weight <= 100000)) throw new AdminError("invalid_value", `prize ${i + 1}: weight is from 0 to 100000`);
        let key = String(p?.key || label).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || `prize-${i + 1}`;
        while (seen.has(key)) key = `${key}-${i + 1}`;
        seen.add(key);
        return { key, label, kind, points, weight: Math.round(weight * 1000) / 1000 };
    });
}

/** Create or replace the segment's machine. */
export async function save(origin, segment, body = {}, actor) {
    if (!SEGMENTS.includes(segment)) throw new AdminError("not_found", "No such segment", 404);
    if (!reasonOk(body.reason)) throw new AdminError("reason_required", "A reason is required");
    const prev = await PrizeMachine.findOne({ origin, segment }).lean();
    const title = String(body.title ?? prev?.title ?? "").trim().slice(0, 80);
    if (title.length < 2) throw new AdminError("invalid_value", "title is required");
    const status = body.status ?? prev?.status ?? "draft";
    if (!STATUSES.includes(status)) throw new AdminError("invalid_value", `status is one of ${STATUSES.join(", ")}`);
    const dailyPlays = Number(body.dailyPlays ?? prev?.dailyPlays ?? 1);
    if (!(Number.isInteger(dailyPlays) && dailyPlays >= 1 && dailyPlays <= 10)) throw new AdminError("invalid_value", "dailyPlays is from 1 to 10");
    const countries = body.countries === undefined ? prev?.countries || [] : body.countries;
    if (!Array.isArray(countries) || countries.length > 60) throw new AdminError("invalid_value", "countries is a list");
    const cs = [...new Set(countries.map((c) => String(c).trim().toLowerCase()).filter(Boolean))];
    if (cs.some((c) => !COUNTRY.test(c))) throw new AdminError("invalid_value", "countries are country names or codes");
    const prizes = body.prizes === undefined && prev ? prizesFrom(prev.prizes, segment) : prizesFrom(body.prizes, segment);
    if (status === "live") {
        if (!cs.length) throw new AdminError("invalid_value", "A live machine needs at least one country");
        if (!prizes.some((p) => p.weight > 0)) throw new AdminError("invalid_value", "A live machine needs at least one prize with odds above 0");
    }
    const reason = String(body.reason).trim().slice(0, 500);
    const m = await PrizeMachine.findOneAndUpdate(
        { origin, segment },
        { $set: { title, status, dailyPlays, countries: cs, prizes, reason, changedBy: actor, isActive: true, isDeleted: false } },
        { upsert: true, new: true }
    ).lean();
    const before = prev ? machineView(prev, segment) : null;
    return { before, machine: machineView(m, segment) };
}

/** Recent plays on a machine (no member names: the member id only). */
export async function plays(origin, segment, query = {}) {
    if (!SEGMENTS.includes(segment)) throw new AdminError("not_found", "No such segment", 404);
    const m = await PrizeMachine.findOne({ origin, segment }).lean();
    if (!m) return { items: [] };
    const limit = Math.max(1, Math.min(200, Number(query.limit) || 50));
    const rows = await PrizePlay.find({ origin, machine: new mongoose.Types.ObjectId(String(m._id)) }).sort({ createdAt: -1 }).limit(limit).lean();
    return { items: rows.map((r) => ({ id: String(r._id), member: String(r.user), day: r.day, prize: r.prize, at: r.createdAt })) };
}

// Phase 3: monthly points prize draw.
//
// BUILT BUT OFF. Kunal chose on 23 Nov 2026 to build it and keep it switched off until legal confirms where a points
// prize draw is allowed. Three locks keep it shut:
//   1. the brand's "draw" switch must be on (config.draw.enabled is its default)
//   2. the draw lists the countries legal has cleared (an empty list means nowhere)
//   3. Teens are never offered a draw, whatever the settings
// The rules text shown to members is the admin's own (PrizeDraw.prize + rulesUrl); this code writes no legal wording.
//
// Tickets cost points: each DrawEntry is a negative "draw" entry in the ledger. A cancelled draw gives them back.
import crypto from "crypto";
import mongoose from "mongoose";
import { PrizeDraw, DrawEntry, User } from "../model/index.js";
import { isOn } from "./switches.js";
import { registerSource, ledger } from "./ledger.js";
import { memberType, fail } from "./http.js";

const oid = (id) => new mongoose.Types.ObjectId(String(id));
const countryOf = (user) => String(user?.address?.[0]?.country || "").trim().toLowerCase();

registerSource(async (user, origin) => {
    const list = await DrawEntry.find({ user: oid(user._id), origin }).populate({ path: "draw", select: "title month status" }).lean();
    return list.filter((e) => e.draw && e.draw.status !== "cancelled").map((e) => ({
        id: String(e._id), source: "draw", type: "draw", name: `${e.draw.title}: ${e.tickets} ticket${e.tickets === 1 ? "" : "s"}`,
        ref: e.draw.month, points: -Math.abs(e.points), status: "spent", at: e.updatedAt || e.createdAt, createdAt: e.createdAt,
    }));
});

// `on`: the brand's draw switch, read by the caller (isOn(origin, "draw"))
export function eligible(user, draw, on) {
    if (!on) return { ok: false, reason: "off" };
    if (memberType(user) === "teen") return { ok: false, reason: "teen" };
    if (!draw) return { ok: false, reason: "none" };
    const c = countryOf(user);
    if (!c || !(draw.countries || []).some((x) => c === x || c.startsWith(x))) return { ok: false, reason: "country" };
    if (draw.status !== "open" || new Date(draw.closesAt).getTime() <= Date.now()) return { ok: false, reason: "closed" };
    return { ok: true };
}

const view = (d, mine) => ({
    id: String(d._id), month: d.month, title: d.title, prize: d.prize, rulesUrl: d.rulesUrl || null,
    ticketPoints: d.ticketPoints, maxTickets: d.maxTicketsPerMember, closesAt: d.closesAt, status: d.status,
    myTickets: mine?.tickets || 0,
});

// The open draw for this member, or null. Says nothing at all when the feature is off or the member can't enter.
export async function current(user, origin) {
    const on = await isOn(origin, "draw");
    if (!on || memberType(user) === "teen") return null;
    const d = await PrizeDraw.findOne({ origin, status: "open", isActive: true, isDeleted: false, closesAt: { $gt: new Date() } }).sort({ closesAt: 1 }).lean();
    if (!d || !eligible(user, d, on).ok) return null;
    const mine = await DrawEntry.findOne({ draw: d._id, user: oid(user._id), origin }).lean();
    return view(d, mine);
}

// one entry at a time per member in this process, so two quick clicks can't both pass the balance check
const busy = new Set();
export async function enter(user, origin, id, tickets) {
    const n = Math.floor(Number(tickets));
    if (!(n >= 1 && n <= 100)) fail("validation", "Choose how many tickets.", 422);
    if (!mongoose.isValidObjectId(id)) fail("bad_request", "That id isn't valid.");
    const d = await PrizeDraw.findOne({ _id: id, origin, isActive: true, isDeleted: false }).lean();
    const el = eligible(user, d, await isOn(origin, "draw"));
    if (!el.ok) fail(el.reason === "off" || el.reason === "teen" ? "closed" : el.reason, el.reason === "closed" ? "This draw has closed." : "This draw isn't open to you.", el.reason === "none" ? 404 : 409);
    const key = `${user._id}`;
    if (busy.has(key)) fail("too_soon", "One moment, your last entry is still being saved.", 429);
    busy.add(key);
    try {
        const mine = await DrawEntry.findOne({ draw: d._id, user: oid(user._id), origin }).lean();
        if ((mine?.tickets || 0) + n > d.maxTicketsPerMember) fail("limit", `You can have up to ${d.maxTicketsPerMember} tickets in this draw.`, 409);
        const cost = n * d.ticketPoints;
        const { balances } = await ledger(user, origin);
        if (balances.available < cost) fail("balance", "You don't have enough points for that.", 409, { available: balances.available, needed: cost });
        const upd = await DrawEntry.findOneAndUpdate(
            { draw: d._id, user: oid(user._id), origin, tickets: { $lte: d.maxTicketsPerMember - n } },
            { $inc: { tickets: n, points: cost }, $setOnInsert: { draw: d._id, user: oid(user._id), origin, isActive: true, isDeleted: false } },
            { upsert: true, new: true }
        ).catch((e) => { if (e?.code === 11000) fail("limit", `You can have up to ${d.maxTicketsPerMember} tickets in this draw.`, 409); throw e; });
        return view(d, upd);
    } finally {
        busy.delete(key);
    }
}

// ---- admin ---------------------------------------------------------------------------------------------------------
export async function run(admin, origin, id) {
    const d = await PrizeDraw.findOne({ _id: id, origin, isDeleted: false });
    if (!d) fail("not_found", "No such draw.", 404);
    if (d.status !== "open") fail("conflict", `This draw is already ${d.status}.`, 409);
    if (new Date(d.closesAt).getTime() > Date.now()) fail("conflict", "The draw can only be run after it closes.", 409);
    const all = await DrawEntry.find({ draw: d._id, origin }).lean();
    // only members still active and not deleted can win
    const ok = new Set((await User.find({ _id: { $in: all.map((e) => e.user) }, isDeleted: { $ne: true } }).select("_id").lean()).map((u) => String(u._id)));
    let pool = all.filter((e) => ok.has(String(e.user)) && e.tickets > 0);
    const seed = crypto.randomBytes(32).toString("hex");
    const rng = (i) => crypto.createHmac("sha256", seed).update(String(i)).digest().readUInt32BE(0) / 2 ** 32;
    const winners = [];
    for (let i = 0; i < d.winners && pool.length; i++) {
        const total = pool.reduce((s, e) => s + e.tickets, 0);
        let r = rng(i) * total;
        const pick = pool.find((e) => (r -= e.tickets) < 0) || pool[pool.length - 1];
        winners.push({ user: pick.user, at: new Date() });
        pool = pool.filter((e) => e !== pick); // one prize per member
    }
    d.result = winners;
    d.seed = seed;
    d.status = "drawn";
    d.updated = { ...(d.updated || {}), By: admin._id };
    await d.save();
    return { id: String(d._id), status: d.status, entries: all.length, tickets: all.reduce((s, e) => s + e.tickets, 0), winners: winners.map((w) => String(w.user)) };
}

export async function cancel(admin, origin, id) {
    const d = await PrizeDraw.findOneAndUpdate({ _id: id, origin, status: "open" }, { $set: { status: "cancelled", "updated.By": admin._id } }, { new: true });
    if (!d) fail("conflict", "Only an open draw can be cancelled.", 409);
    return { id: String(d._id), status: d.status }; // tickets are given back by the ledger, which skips cancelled draws
}

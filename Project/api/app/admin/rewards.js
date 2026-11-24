// Rewards (super admin spec module 7): the catalogue, the redemption queue, prize draws and bonus offers.
// Nothing here pays anyone: "fulfilled" records that the team paid a request by hand, and only while the brand's
// redemptions switch is on. Payout destinations never leave this API unmasked.
import mongoose from "mongoose";
import { CatalogueItem, Redemption, PrizeDraw, DrawEntry, BonusOffer, User } from "../model/index.js";
import * as Draw from "../engagement/draw.js";
import { isOn, scopeOf } from "../engagement/switches.js";
import { AdminError } from "./http.js";
import { maskEmail } from "./mask.js";

const oid = (v) => new mongoose.Types.ObjectId(String(v));
const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v || ""));
const KINDS = ["giftcard", "upi", "paypal", "charity", "learning"];
const AUD = ["consumer", "professional", "teen"];
const TEEN = "b2c-minor";
const str = (v, n) => (v === undefined || v === null ? undefined : String(v).trim().slice(0, n));
const reasonOk = (r) => r && String(r).trim().length >= 5;

// ---- catalogue -------------------------------------------------------------------------------------------------------
const itemView = (x) => ({
    key: x.key, kind: x.kind, title: x.title, subtitle: x.subtitle || "", description: x.description || "", image: x.image || "",
    points: x.points, value: x.value ?? null, audience: x.audience || [], countries: x.countries || [],
    availableUntil: x.availableUntil || null, sortOrder: x.sortOrder || 0, active: x.isActive !== false, updatedAt: x.updatedAt,
});

function itemBody(b = {}, creating) {
    const out = {};
    if (creating) {
        const key = String(b.key || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60);
        if (!key) throw new AdminError("invalid_value", "key is letters, digits and dashes");
        out.key = key;
    }
    if (b.kind !== undefined) { if (!KINDS.includes(b.kind)) throw new AdminError("invalid_value", `kind is one of ${KINDS.join(", ")}`); out.kind = b.kind; }
    for (const [k, n] of [["title", 80], ["subtitle", 120], ["description", 1000], ["image", 500]]) if (b[k] !== undefined) out[k] = str(b[k], n);
    if (b.points !== undefined) { const p = Number(b.points); if (!Number.isInteger(p) || p < 1) throw new AdminError("invalid_value", "points is a whole number above 0"); out.points = p; }
    if (b.value !== undefined) { const v = Number(b.value); if (!(v >= 0)) throw new AdminError("invalid_value", "value is 0 or more"); out.value = v; }
    if (b.audience !== undefined) out.audience = (Array.isArray(b.audience) ? b.audience : []).filter((a) => AUD.includes(a));
    if (b.countries !== undefined) out.countries = (Array.isArray(b.countries) ? b.countries : []).map((c) => String(c).toLowerCase().trim().slice(0, 40)).filter(Boolean);
    if (b.availableUntil !== undefined) out.availableUntil = b.availableUntil ? new Date(b.availableUntil) : null;
    if (b.sortOrder !== undefined) out.sortOrder = Number(b.sortOrder) || 0;
    return out;
}
// Teens earn learning rewards only, never cash or cash-like payouts; an item with no audience is shown to everyone.
function teenGuard(kind, audience) {
    const teens = !audience?.length || audience.includes("teen");
    if (teens && kind !== "learning") throw new AdminError("teen_guardrail", "Only learning rewards can be offered to Teen Panel members. Choose the audiences.", 422);
}

export async function listCatalogue(origin) {
    const rows = await CatalogueItem.find({ origin, isDeleted: false }).select("+isActive").sort({ sortOrder: 1, points: 1 }).lean();
    return rows.map(itemView);
}
export async function createItem(origin, body = {}) {
    const b = itemBody(body, true);
    if (!b.kind || !b.title || !b.points) throw new AdminError("invalid_value", "key, kind, title and points are required");
    teenGuard(b.kind, b.audience);
    try {
        return itemView((await CatalogueItem.create({ ...b, origin })).toObject());
    } catch (e) {
        if (e?.code === 11000) throw new AdminError("duplicate", "That key is already in the catalogue", 409);
        throw e;
    }
}
export async function updateItem(origin, key, body = {}) {
    const cur = await CatalogueItem.findOne({ key, origin, isDeleted: false }).lean();
    if (!cur) throw new AdminError("not_found", "No such item", 404);
    const b = itemBody(body, false);
    if (body.active !== undefined) b.isActive = Boolean(body.active);
    teenGuard(b.kind ?? cur.kind, b.audience ?? cur.audience);
    const it = await CatalogueItem.findOneAndUpdate({ key, origin, isDeleted: false }, { $set: b }, { new: true, runValidators: true }).select("+isActive").lean();
    return { before: itemView(cur), item: itemView(it) };
}

// ---- redemptions -----------------------------------------------------------------------------------------------------
const who = (u) => (u ? { id: String(u._id), name: [u.name?.first, u.name?.last ? `${String(u.name.last)[0]}.` : ""].filter(Boolean).join(" "), email: maskEmail(u.mail), teen: u.category === TEEN } : null);
const redView = (r, u) => ({
    id: String(r._id), reference: r.reference, item: r.item, points: r.points, status: r.status, open: r.open,
    payout: { method: r.payout?.method || null, masked: r.payout?.masked || "" }, guardian: r.guardian?.decision ?? null,
    note: r.note || "", member: who(u), createdAt: r.createdAt, fulfilledAt: r.fulfilledAt || null,
});

export async function listRedemptions(origin, q = {}) {
    const f = { origin };
    if (q.status === "open") f.open = true;
    else if (q.status) f.status = { $in: String(q.status).split(",") };
    if (q.kind) f["item.kind"] = String(q.kind);
    const limit = Math.min(200, Math.max(1, Number(q.limit) || 100));
    const [rows, counts] = await Promise.all([
        Redemption.find(f).sort({ createdAt: 1 }).limit(limit).lean(),
        Redemption.aggregate([{ $match: { origin } }, { $group: { _id: "$status", n: { $sum: 1 }, points: { $sum: "$points" } } }]),
    ]);
    const users = await User.find({ _id: { $in: rows.map((r) => r.user) }, origin }).select("name mail category").lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));
    return {
        items: rows.map((r) => redView(r, byId.get(String(r.user)))),
        counts: Object.fromEntries(counts.map((c) => [c._id, { n: c.n, points: c.points }])),
        switches: { redemptions: await isOn(origin, "redemptions"), teenRedemptions: await isOn(origin, "teen_redemptions") },
    };
}
export async function getRedemption(origin, id) {
    if (!isId(id)) throw new AdminError("not_found", "Not found", 404);
    const r = await Redemption.findOne({ _id: oid(id), origin }).select("+adminNote +providerRef").lean();
    if (!r) throw new AdminError("not_found", "Not found", 404);
    const u = await User.findOne({ _id: r.user, origin }).select("name mail category").lean();
    return { ...redView(r, u), adminNote: r.adminNote || "", providerRef: r.providerRef || "", history: r.history || [] };
}

// requested -> approved | rejected; approved -> fulfilled | rejected. A teen's request waits for the guardian's YES by
// e-mail and can only be rejected here. Approving or fulfilling needs the brand's redemptions switch on.
const NEXT = { requested: ["approved", "rejected"], guardian_pending: ["rejected"], approved: ["fulfilled", "rejected"] };
export async function decideRedemption(origin, id, { status, reason, note, providerRef } = {}, actor) {
    if (!isId(id)) throw new AdminError("not_found", "Not found", 404);
    if (!reasonOk(reason)) throw new AdminError("reason_required", "A reason is required");
    const r = await Redemption.findOne({ _id: oid(id), origin }).lean();
    if (!r) throw new AdminError("not_found", "Not found", 404);
    if (!(NEXT[r.status] || []).includes(status)) throw new AdminError("bad_transition", `A ${r.status} request can't become ${status || "that"}`, 409);
    if (status !== "rejected") {
        const u = await User.findOne({ _id: r.user, origin }).select("category address").lean();
        const key = u?.category === TEEN ? "teen_redemptions" : "redemptions";
        if (!(await isOn(origin, key, scopeOf(u)))) throw new AdminError("switch_off", `The ${key} switch is off for this member's segment or country`, 409);
    }
    const set = { status, ...(status === "fulfilled" ? { fulfilledAt: new Date() } : {}), ...(["fulfilled", "rejected"].includes(status) ? { open: false } : {}) };
    if (note !== undefined) set.note = str(note, 300);
    if (providerRef !== undefined) set.providerRef = str(providerRef, 200);
    set.adminNote = str(reason, 1000);
    // only from the state that was read, so two admins can't both move it
    const upd = await Redemption.findOneAndUpdate({ _id: r._id, origin, status: r.status }, { $set: set, $push: { history: { status, by: `madp:${actor}`, at: new Date() } } }, { new: true }).lean();
    if (!upd) throw new AdminError("conflict", "Someone else changed this request; reload it", 409);
    return { before: r.status, after: upd.status, id: String(upd._id), reference: upd.reference, pointsReturned: status === "rejected" ? upd.points : 0 };
}

// ---- prize draws (legal switch) ---------------------------------------------------------------------------------------
const drawView = (d, c) => ({
    id: String(d._id), month: d.month, title: d.title, prize: d.prize, ticketPoints: d.ticketPoints, maxTicketsPerMember: d.maxTicketsPerMember,
    winners: d.winners, countries: d.countries || [], closesAt: d.closesAt, rulesUrl: d.rulesUrl || "", status: d.status,
    members: c?.members || 0, tickets: c?.tickets || 0, drawnWinners: (d.result || []).length,
});
export async function listDraws(origin) {
    const [rows, counts] = await Promise.all([
        PrizeDraw.find({ origin, isDeleted: false }).sort({ month: -1 }).lean(),
        DrawEntry.aggregate([{ $match: { origin } }, { $group: { _id: "$draw", members: { $sum: 1 }, tickets: { $sum: "$tickets" } } }]),
    ]);
    const by = new Map(counts.map((c) => [String(c._id), c]));
    return { enabled: await isOn(origin, "draw"), items: rows.map((d) => drawView(d, by.get(String(d._id)))) };
}
export async function createDraw(origin, x = {}) {
    const closesAt = new Date(x.closesAt);
    const b = {
        month: String(x.month || ""), title: str(x.title, 120), prize: str(x.prize, 300), rulesUrl: str(x.rulesUrl, 500),
        ticketPoints: Number(x.ticketPoints), maxTicketsPerMember: Math.max(1, Math.round(Number(x.maxTicketsPerMember) || 10)),
        winners: Math.max(1, Math.round(Number(x.winners) || 1)), closesAt,
        countries: (Array.isArray(x.countries) ? x.countries : []).map((c) => String(c).toLowerCase().trim().slice(0, 40)).filter(Boolean),
    };
    if (!/^\d{4}-\d{2}$/.test(b.month) || !b.title || !b.prize || !Number.isInteger(b.ticketPoints) || b.ticketPoints < 1 || isNaN(closesAt))
        throw new AdminError("invalid_value", "month (YYYY-MM), title, prize, ticketPoints and closesAt are required");
    if (!/^https:\/\//.test(b.rulesUrl || "")) throw new AdminError("invalid_value", "rulesUrl is the https link to the rules legal approved");
    try {
        return drawView((await PrizeDraw.create({ ...b, origin })).toObject());
    } catch (e) {
        if (e?.code === 11000) throw new AdminError("duplicate", "There is already a draw for that month", 409);
        throw e;
    }
}
export async function runDraw(origin, id) {
    if (!isId(id)) throw new AdminError("not_found", "Not found", 404);
    if (!(await isOn(origin, "draw"))) throw new AdminError("switch_off", "The draw switch is off for this brand", 409);
    return Draw.run({ _id: null }, origin, oid(id)).catch((e) => { throw new AdminError(e.code || "conflict", e.message, e.status || 409); });
}
export async function cancelDraw(origin, id) {
    if (!isId(id)) throw new AdminError("not_found", "Not found", 404);
    return Draw.cancel({ _id: null }, origin, oid(id)).catch((e) => { throw new AdminError(e.code || "conflict", e.message, e.status || 409); });
}

// ---- bonus offers ----------------------------------------------------------------------------------------------------
const offerView = (o) => ({ id: String(o._id), title: o.title, description: o.description || "", multiplier: o.multiplier, startsAt: o.startsAt, endsAt: o.endsAt, audience: o.audience || [], active: o.isActive !== false });
export async function listOffers(origin) {
    return (await BonusOffer.find({ origin, isDeleted: false }).select("+isActive").sort({ startsAt: -1 }).limit(200).lean()).map(offerView);
}
export async function createOffer(origin, b = {}) {
    const m = Number(b.multiplier), s = new Date(b.startsAt), e = new Date(b.endsAt);
    if (!b.title || !(m > 1 && m <= 5) || isNaN(s) || isNaN(e) || e <= s) throw new AdminError("invalid_value", "title, multiplier (above 1, up to 5) and startsAt before endsAt are required");
    if (e - s > 31 * 86400000) throw new AdminError("invalid_value", "An offer runs 31 days at most");
    const o = await BonusOffer.create({ origin, title: str(b.title, 80), description: str(b.description, 300) || "", multiplier: m, startsAt: s, endsAt: e, audience: (Array.isArray(b.audience) ? b.audience : []).filter((a) => AUD.includes(a)) });
    return offerView(o.toObject());
}
export async function endOffer(origin, id) {
    if (!isId(id)) throw new AdminError("not_found", "Not found", 404);
    const o = await BonusOffer.findOneAndUpdate({ _id: oid(id), origin, isDeleted: false }, { $set: { isActive: false } }, { new: true }).select("+isActive").lean();
    if (!o) throw new AdminError("not_found", "Not found", 404);
    return offerView(o);
}

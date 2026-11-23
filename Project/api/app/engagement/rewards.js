// Phase 2: the redemption catalogue, reward goals, redemptions, bonus offers and the weekend multiplier.
//
// Spending is always checked here: the cost comes from the catalogue item, the balance from the ledger, and a member
// can have one open request at a time (Redemption unique index on {user, open:true}), so a double click can't spend
// the same points twice. Rejected and cancelled requests drop out of the ledger, so the points come back by themselves.
import crypto from "crypto";
import mongoose from "mongoose";
import { CatalogueItem, Redemption, BonusOffer, Response, MemberPreference, User } from "../model/index.js";
import { config } from "./config.js";
import { registerSource, registerReconciler, grant, ledger } from "./ledger.js";
import { memberType, fail } from "./http.js";
import { dayKey } from "./time.js";

const oid = (id) => new mongoose.Types.ObjectId(String(id));
const OPEN = ["requested", "guardian_pending", "approved"];
const SPENT = ["requested", "guardian_pending", "approved", "fulfilled"];

// ---- ledger: redemptions are negative entries ----------------------------------------------------------------------
registerSource(async (user, origin) => {
    const list = await Redemption.find({ user: oid(user._id), origin, status: { $in: SPENT } }).lean();
    return list.map((r) => ({
        id: String(r._id), source: "redemption", type: "redemption",
        name: [r.item?.title, r.item?.subtitle].filter(Boolean).join(" · "),
        ref: r.reference, points: -Math.abs(r.points), status: "spent", at: r.createdAt, createdAt: r.createdAt,
    }));
});

// ---- catalogue -----------------------------------------------------------------------------------------------------
export async function catalogue(user, origin) {
    const type = memberType(user);
    const country = String(user?.address?.[0]?.country || "").toLowerCase();
    let items = await CatalogueItem.find({ origin, isActive: true, isDeleted: false }).sort({ sortOrder: 1, points: 1 }).lean();
    const placeholder = items.length === 0;
    if (placeholder) items = config().rewards.defaultCatalogue.map((x, i) => ({ ...x, sortOrder: i }));
    const now = Date.now();
    const inr = config().rewards.inrPerUsd;
    return {
        placeholder,
        items: items
            .filter((x) => !x.audience?.length || x.audience.includes(type))
            .filter((x) => !x.countries?.length || !country || x.countries.includes(country) || x.countries.some((c) => country.startsWith(c)))
            .filter((x) => !x.availableUntil || new Date(x.availableUntil).getTime() > now)
            .map((x) => ({
                key: x.key, kind: x.kind, title: x.title, subtitle: x.subtitle, description: x.description, image: x.image,
                points: x.points,
                // Teens never see money values
                value: type === "teen" ? null : x.value ?? null,
                valueInr: type === "teen" || x.kind !== "upi" ? null : Math.round((x.value || 0) * inr),
                availableUntil: x.availableUntil || null,
                needsGuardian: type === "teen",
            })),
    };
}

async function findItem(user, origin, key) {
    const { items } = await catalogue(user, origin);
    const it = items.find((x) => x.key === String(key || "").toLowerCase());
    if (!it) fail("not_found", "That reward isn't available to you.", 404);
    return it;
}

// ---- goals ---------------------------------------------------------------------------------------------------------
export async function goalOf(user, origin, available) {
    const p = await MemberPreference.findOne({ user: oid(user._id), origin }).lean();
    if (!p?.goal?.item) return null;
    const { items } = await catalogue(user, origin);
    const it = items.find((x) => x.key === p.goal.item);
    if (!it) return null; // the reward was withdrawn
    if (available >= it.points && !p.goal.reachedAt) {
        await MemberPreference.updateOne({ _id: p._id }, { $set: { "goal.reachedAt": new Date() } });
    }
    return { item: it, points: it.points, available, pct: Math.min(100, Math.round((available / it.points) * 100)), left: Math.max(0, it.points - available), setAt: p.goal.setAt, reached: available >= it.points };
}
export async function setGoal(user, origin, key) {
    if (key === null || key === "") {
        await MemberPreference.updateOne({ user: oid(user._id), origin }, { $unset: { goal: 1 } });
        return null;
    }
    const it = await findItem(user, origin, key);
    await MemberPreference.updateOne(
        { user: oid(user._id), origin },
        { $set: { goal: { item: it.key, points: it.points, setAt: new Date() } }, $setOnInsert: { user: oid(user._id), origin } },
        { upsert: true }
    );
    return it;
}

// ---- redemptions ---------------------------------------------------------------------------------------------------
const reference = () => `RD-${crypto.randomBytes(3).toString("hex").toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
export const maskEmail = (e) => String(e).replace(/^(.)(.*)(@.*)$/, (m, a, b, c) => `${a}${"•".repeat(Math.min(6, b.length))}${c}`);
const maskUpi = (u) => String(u).replace(/^(.{2})(.*)(@.*)$/, (m, a, b, c) => `${a}${"•".repeat(Math.min(6, b.length))}${c}`);
const UPI = /^[a-z0-9._-]{2,256}@[a-z][a-z0-9]{1,63}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function payoutFor(kind, body, user) {
    if (kind === "upi") {
        const id = String(body?.upi || "").trim();
        if (!UPI.test(id)) fail("validation", "Please enter a valid UPI ID, like name@bank.", 422, { fields: { upi: "invalid" } });
        return { method: "upi", destination: id, masked: maskUpi(id) };
    }
    if (kind === "paypal") {
        const e = String(body?.paypal || "").trim().toLowerCase();
        if (!EMAIL.test(e)) fail("validation", "Please enter the email address of your PayPal account.", 422, { fields: { paypal: "invalid" } });
        return { method: "paypal", destination: e, masked: maskEmail(e) };
    }
    // gift cards, learning vouchers and charity receipts go to the member's own email address
    return { method: kind === "charity" ? "charity" : "email", destination: user.mail, masked: maskEmail(user.mail) };
}

// phase 6 asks the guardian when a Teen requests a reward (registered by engagement/teens.js)
const TEEN_HOOKS = [];
export function onTeenRequest(fn) { TEEN_HOOKS.push(fn); }

export async function redeem(user, origin, body = {}) {
    const c = config();
    const type = memberType(user);
    // Teens have their own switch (learning rewards, each one needs their guardian's YES by email)
    if (type === "teen") {
        if (!c.teen?.redemptionsEnabled) fail("closed", "Rewards for Teen Panel members open soon, with your parent or guardian's OK.", 409);
    } else if (!c.rewards.redemptionsEnabled) fail("closed", "Redemptions open soon. Your points are safe and keep adding up.", 409);
    const it = await findItem(user, origin, body.item);
    const { balances } = await ledger(user, origin);
    if (it.points < c.points.minRedemption && type !== "teen") fail("too_small", `The smallest reward is ${c.points.minRedemption} points.`, 422);
    if (balances.available < it.points) fail("not_enough", "You don't have enough cleared points for this reward yet.", 422, { available: balances.available });
    const payout = payoutFor(it.kind, body, user);
    try {
        const r = await Redemption.create({
            user: oid(user._id), origin, reference: reference(),
            item: { key: it.key, kind: it.kind, title: it.title, subtitle: it.subtitle, value: it.value, currency: c.points.currency },
            points: it.points,
            status: type === "teen" ? "guardian_pending" : "requested",
            payout,
            history: [{ status: type === "teen" ? "guardian_pending" : "requested", by: "member" }],
            created: { By: user._id },
        });
        if (r.status === "guardian_pending") for (const fn of TEEN_HOOKS) setImmediate(() => fn(user, origin, r.toObject()).catch((e) => console.error("guardian ask failed:", e.message)));
        return view(r.toObject());
    } catch (e) {
        if (e?.code === 11000) fail("open_request", "You already have a reward request waiting. You can request another once it's done.", 409);
        throw e;
    }
}

export const view = (r) => ({
    id: String(r._id), reference: r.reference, item: r.item, points: r.points, status: r.status,
    payout: { method: r.payout?.method, masked: r.payout?.masked }, note: r.note || "", createdAt: r.createdAt, fulfilledAt: r.fulfilledAt || null,
});
export async function mine(user, origin) {
    return (await Redemption.find({ user: oid(user._id), origin }).sort({ createdAt: -1 }).limit(100).lean()).map(view);
}
export async function cancel(user, origin, id) {
    const r = await Redemption.findOneAndUpdate(
        { _id: oid(id), user: oid(user._id), origin, status: { $in: ["requested", "guardian_pending"] } },
        { $set: { status: "cancelled", open: false }, $push: { history: { status: "cancelled", by: "member", at: new Date() } } },
        { new: true }
    );
    if (!r) fail("not_found", "That request can't be cancelled any more.", 404);
    return view(r.toObject());
}

// admin: move a request along. Points come back by themselves on rejected (the ledger skips it).
const ADMIN_NEXT = { requested: ["approved", "rejected", "fulfilled"], guardian_pending: ["rejected"], approved: ["fulfilled", "rejected"] };
export async function adminUpdate(admin, origin, id, body = {}) {
    const r = await Redemption.findOne({ _id: oid(id), origin }).select("+adminNote +providerRef");
    if (!r) fail("not_found", "No such request.", 404);
    const to = String(body.status || "");
    if (!(ADMIN_NEXT[r.status] || []).includes(to)) fail("bad_state", `A ${r.status} request can't become ${to || "that"}.`, 409);
    r.status = to;
    if (["fulfilled", "rejected"].includes(to)) r.open = false;
    if (to === "fulfilled") r.fulfilledAt = new Date();
    if (body.note !== undefined) r.note = String(body.note).slice(0, 300);
    if (body.adminNote !== undefined) r.adminNote = String(body.adminNote).slice(0, 1000);
    if (body.providerRef !== undefined) r.providerRef = String(body.providerRef).slice(0, 200);
    r.history.push({ status: to, by: `admin:${admin._id}` });
    await r.save();
    return { ...view(r.toObject()), adminNote: r.adminNote, providerRef: r.providerRef };
}
export async function adminList(origin, q = {}) {
    const f = { origin };
    if (q.status) f.status = { $in: String(q.status).split(",") };
    const list = await Redemption.find(f).select("+payout.destination +adminNote +providerRef").sort({ createdAt: 1 }).limit(500).lean();
    const users = await User.find({ _id: { $in: list.map((r) => r.user) } }).select("name mail category").lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));
    return list.map((r) => ({ ...view(r), payout: r.payout, adminNote: r.adminNote, providerRef: r.providerRef, member: byId.get(String(r.user)) || null }));
}

// ---- bonus offers + weekend multiplier ------------------------------------------------------------------------------
export async function activeOffers(user, origin, now = new Date()) {
    const type = memberType(user);
    const list = await BonusOffer.find({ origin, isActive: true, isDeleted: false, startsAt: { $lte: now }, endsAt: { $gt: now } }).lean();
    const out = list.filter((o) => !o.audience?.length || o.audience.includes(type))
        .map((o) => ({ id: String(o._id), title: o.title, description: o.description, multiplier: o.multiplier, endsAt: type === "teen" ? null : o.endsAt }));
    const b = config().bonus;
    if (b.weekendMultiplier > 1 && b.audiences.includes(type)) out.push({ id: "weekend", title: "Weekend bonus", description: "", multiplier: b.weekendMultiplier, weekend: true });
    return out;
}

const isWeekend = (date, tz) => { const d = new Date(`${dayKey(date, tz)}T12:00:00Z`).getUTCDay(); return d === 0 || d === 6; };

registerReconciler(async (user, origin) => {
    const type = memberType(user);
    const b = config().bonus;
    const offers = (await BonusOffer.find({ origin, isActive: true, isDeleted: false }).lean())
        .filter((o) => !o.audience?.length || o.audience.includes(type));
    const weekendOn = b.weekendMultiplier > 1 && b.audiences.includes(type);
    if (!offers.length && !weekendOn) return;
    const earliest = Math.min(...offers.map((o) => new Date(o.startsAt).getTime()), weekendOn ? new Date(b.weekendFrom).getTime() : Infinity);
    const done = await Response.find({ user: oid(user._id), origin, status: "complete", isActive: true, isDeleted: false, updatedAt: { $gte: new Date(earliest) } }).lean();
    for (const r of done) {
        const at = new Date(r.updatedAt);
        const pts = Number(r.points) || 0;
        if (pts <= 0) continue;
        // the best single offer applies (offers don't stack)
        const best = offers.filter((o) => at >= new Date(o.startsAt) && at < new Date(o.endsAt)).sort((x, y) => y.multiplier - x.multiplier)[0];
        if (best) {
            await grant(user, origin, { category: "bonus", key: `bonus:${best._id}:${r._id}`, name: best.title, points: Math.round(pts * (best.multiplier - 1)), remarks: `${best.multiplier}x ${best.title} on ${r?.survey?.name || r?.survey?.slug}` });
        } else if (weekendOn && at >= new Date(b.weekendFrom) && isWeekend(at, user.timezone)) {
            await grant(user, origin, { category: "bonus", key: `bonus:weekend:${r._id}`, name: "Weekend bonus", points: Math.round(pts * (b.weekendMultiplier - 1)), remarks: `${b.weekendMultiplier}x weekend bonus on ${r?.survey?.name || r?.survey?.slug}` });
        }
    }
});

// Phase 2: rewards.
//  member
//  GET  /rewards                 catalogue (+ "you can afford this now"), goal, open offers, my redemptions, settings
//  PUT  /rewards/goal            {item: <key>|null}
//  POST /rewards/redeem          {item, upi?, paypal?}  (closed until config.rewards.redemptionsEnabled)
//  POST /rewards/redemptions/:id/cancel
//  admin
//  GET  /admin/redemptions?status=   POST /admin/redemptions/:id {status, note?, adminNote?, providerRef?}
//  GET|POST /admin/catalogue   PUT|DELETE /admin/catalogue/:key
//  GET|POST /admin/offers      DELETE /admin/offers/:id
import mongoose from "mongoose";
import { CatalogueItem, BonusOffer } from "../model/index.js";
import { config } from "./config.js";
import { isOn, scopeOf } from "./switches.js";
import { ledger } from "./ledger.js";
import * as R from "./rewards.js";
import { handle, fail, limit, requireAdmin, memberType, clean } from "./http.js";

const KINDS = ["giftcard", "upi", "paypal", "charity", "learning"];
const AUD = ["consumer", "professional", "teen"];
function itemBody(b = {}) {
    const x = clean(b) || {};
    const out = {};
    if (x.key !== undefined) out.key = String(x.key).toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60);
    if (x.kind !== undefined) { if (!KINDS.includes(x.kind)) fail("validation", "Unknown kind.", 422); out.kind = x.kind; }
    for (const k of ["title", "subtitle", "description", "image"]) if (x[k] !== undefined) out[k] = String(x[k]);
    if (x.points !== undefined) { const n = Math.round(Number(x.points)); if (!(n > 0)) fail("validation", "points must be above 0.", 422); out.points = n; }
    if (x.value !== undefined) out.value = Math.max(0, Number(x.value) || 0);
    if (x.audience !== undefined) out.audience = (Array.isArray(x.audience) ? x.audience : []).filter((a) => AUD.includes(a));
    if (x.countries !== undefined) out.countries = (Array.isArray(x.countries) ? x.countries : []).map((c) => String(c).toLowerCase().slice(0, 40));
    if (x.availableUntil !== undefined) out.availableUntil = x.availableUntil ? new Date(x.availableUntil) : null;
    if (x.sortOrder !== undefined) out.sortOrder = Number(x.sortOrder) || 0;
    return out;
}

export function mount(router) {
    router
        .get("/rewards", handle(async (req) => {
            const [cat, led, offers, redemptions] = await Promise.all([
                R.catalogue(req.user, req.origin), ledger(req.user, req.origin), R.activeOffers(req.user, req.origin), R.mine(req.user, req.origin),
            ]);
            const available = led.balances.available;
            const c = config();
            const teen = memberType(req.user) === "teen";
            return {
                balances: led.balances,
                items: cat.items.map((x) => ({ ...x, affordable: available >= x.points, left: Math.max(0, x.points - available) })),
                placeholder: cat.placeholder,
                goal: await R.goalOf(req.user, req.origin, available),
                offers,
                redemptions,
                open: await isOn(req.origin, teen ? "teen_redemptions" : "redemptions", scopeOf(req.user)),
                minRedemption: c.points.minRedemption,
                usdPerPoint: teen ? null : c.points.usdPerPoint,
            };
        }))
        .put("/rewards/goal", limit(30, 1), handle(async (req) => R.setGoal(req.user, req.origin, req.body?.item ?? null)))
        .post("/rewards/redeem", limit(10, 10), handle(async (req) => R.redeem(req.user, req.origin, clean(req.body))))
        .post("/rewards/redemptions/:id/cancel", limit(10, 10), handle(async (req) => {
            if (!mongoose.isValidObjectId(req.params.id)) fail("bad_request", "That id isn't valid.");
            return R.cancel(req.user, req.origin, req.params.id);
        }));

    router
        .get("/admin/redemptions", requireAdmin, handle(async (req) => R.adminList(req.origin, req.query)))
        .post("/admin/redemptions/:id", requireAdmin, handle(async (req) => {
            if (!mongoose.isValidObjectId(req.params.id)) fail("bad_request", "That id isn't valid.");
            return R.adminUpdate(req.user, req.origin, req.params.id, clean(req.body));
        }))
        .get("/admin/catalogue", requireAdmin, handle(async (req) => CatalogueItem.find({ origin: req.origin, isDeleted: false }).sort({ sortOrder: 1 }).lean()))
        .post("/admin/catalogue", requireAdmin, handle(async (req) => {
            const b = itemBody(req.body);
            if (!b.key || !b.kind || !b.title || !b.points) fail("validation", "key, kind, title and points are required.", 422);
            return CatalogueItem.create({ ...b, origin: req.origin, created: { By: req.user._id } });
        }))
        .put("/admin/catalogue/:key", requireAdmin, handle(async (req) => {
            const b = itemBody(req.body); delete b.key;
            const it = await CatalogueItem.findOneAndUpdate({ key: req.params.key, origin: req.origin, isDeleted: false }, { $set: b }, { new: true, runValidators: true });
            if (!it) fail("not_found", "No such item.", 404);
            return it;
        }))
        .delete("/admin/catalogue/:key", requireAdmin, handle(async (req) => {
            // retire, don't delete: past redemptions keep their own copy of the item anyway
            const it = await CatalogueItem.findOneAndUpdate({ key: req.params.key, origin: req.origin }, { $set: { isActive: false } }, { new: true });
            if (!it) fail("not_found", "No such item.", 404);
            return { key: it.key, isActive: false };
        }))
        .get("/admin/offers", requireAdmin, handle(async (req) => BonusOffer.find({ origin: req.origin, isDeleted: false }).sort({ startsAt: -1 }).lean()))
        .post("/admin/offers", requireAdmin, handle(async (req) => {
            const b = clean(req.body) || {};
            const m = Number(b.multiplier);
            const s = new Date(b.startsAt), e = new Date(b.endsAt);
            if (!b.title || !(m > 1 && m <= 5) || isNaN(s) || isNaN(e) || e <= s) fail("validation", "title, multiplier (1-5), startsAt < endsAt are required.", 422);
            return BonusOffer.create({ title: String(b.title).slice(0, 80), description: String(b.description || "").slice(0, 300), multiplier: m, startsAt: s, endsAt: e, audience: (b.audience || []).filter((a) => AUD.includes(a)), origin: req.origin, created: { By: req.user._id } });
        }))
        .delete("/admin/offers/:id", requireAdmin, handle(async (req) => {
            if (!mongoose.isValidObjectId(req.params.id)) fail("bad_request", "That id isn't valid.");
            await BonusOffer.updateOne({ _id: req.params.id, origin: req.origin }, { $set: { isActive: false } });
            return { id: req.params.id, isActive: false };
        }));
}

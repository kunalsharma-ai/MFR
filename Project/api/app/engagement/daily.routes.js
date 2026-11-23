// Phase 3: daily poll, monthly challenges, prize draw (off) and "Your opinion mattered" stories.
//  member
//  GET  /today                    poll, challenges, the open draw (only when on and the member may enter), latest story
//  POST /poll/:id                 {choice}
//  GET  /challenges
//  POST /draws/:id/enter          {tickets}
//  GET  /stories?type=story|insight
//  admin
//  GET|POST /admin/tasks   PUT|DELETE /admin/tasks/:id       (polls scheduled for a day, monthly challenges)
//  GET|POST /admin/draws   POST /admin/draws/:id/run   POST /admin/draws/:id/cancel
//  GET|POST /admin/stories PUT|DELETE /admin/stories/:id
import mongoose from "mongoose";
import { Task, PrizeDraw, DrawEntry, Story } from "../model/index.js";
import { config } from "./config.js";
import { reconcile } from "./ledger.js";
import * as D from "./daily.js";
import * as Draw from "./draw.js";
import { memberFacts } from "./pro.js";
import { handle, fail, limit, requireAdmin, memberType, clean } from "./http.js";

const AUD = ["consumer", "professional", "teen"];
const aud = (a) => (Array.isArray(a) ? a : []).filter((x) => AUD.includes(x));
const str = (v, n) => (v === undefined ? undefined : String(v ?? "").trim().slice(0, n));
const idOk = (id) => { if (!mongoose.isValidObjectId(id)) fail("bad_request", "That id isn't valid."); };
const drop = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

function taskBody(b = {}) {
    const x = clean(b) || {};
    const out = drop({
        kind: x.kind, title: str(x.title, 120), question: str(x.question, 300), description: str(x.description, 1000),
        day: x.day, month: x.month, season: str(x.season, 40),
        points: x.points === undefined ? undefined : Math.max(0, Math.round(Number(x.points) || 0)),
        audience: x.audience === undefined ? undefined : aud(x.audience),
        startsAt: x.startsAt ? new Date(x.startsAt) : undefined, endsAt: x.endsAt ? new Date(x.endsAt) : undefined,
    });
    if (x.options !== undefined) {
        out.options = (Array.isArray(x.options) ? x.options : []).slice(0, 8).map((o, i) => ({
            key: String(o?.key || i + 1).toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30) || String(i + 1),
            label: str(o?.label, 120), image: o?.image ? str(o.image, 500) : undefined,
        }));
    }
    if (x.goal !== undefined) out.goal = { metric: x.goal?.metric, target: Math.round(Number(x.goal?.target) || 0) };
    return out;
}
function storyBody(b = {}) {
    const x = clean(b) || {};
    const out = drop({
        type: x.type, title: str(x.title, 140), summary: str(x.summary, 400), body: str(x.body, 8000), image: str(x.image, 500),
        brand: str(x.brand, 80), fileUrl: str(x.fileUrl, 500),
        audience: x.audience === undefined ? undefined : aud(x.audience),
        industries: x.industries === undefined ? undefined : (Array.isArray(x.industries) ? x.industries : []).map((s) => String(s).toLowerCase().slice(0, 60)),
        sampleSize: x.sampleSize === undefined ? undefined : Math.max(0, Math.round(Number(x.sampleSize) || 0)),
    });
    if (x.stats !== undefined) out.stats = (Array.isArray(x.stats) ? x.stats : []).slice(0, 6).map((s) => ({ label: str(s?.label, 80), value: str(s?.value, 40) }));
    if (x.published !== undefined) out.publishedAt = x.published ? new Date() : null;
    return out;
}

export async function storiesFor(user, origin, type = "story", limitN = 20) {
    const t = memberType(user);
    const q = { origin, type, isActive: true, isDeleted: false, publishedAt: { $ne: null, $lte: new Date() }, $or: [{ audience: { $size: 0 } }, { audience: t }] };
    if (type === "insight") {
        // insight reports are for Professionals, and for their own industry when the report names industries
        if (t !== "professional") return [];
        const { industries } = await memberFacts(user, origin);
        q.$and = [{ $or: [{ industries: { $size: 0 } }, ...(industries.length ? [{ industries: { $in: industries } }] : [])] }];
    }
    const list = await Story.find(q).sort({ publishedAt: -1 }).limit(limitN).lean();
    return list.map((s) => ({ id: String(s._id), type: s.type, title: s.title, summary: s.summary, body: s.body, image: s.image, brand: s.brand, stats: s.stats, sampleSize: s.sampleSize, fileUrl: s.fileUrl, publishedAt: s.publishedAt }));
}

export function mount(router) {
    router
        .get("/today", handle(async (req) => {
            await reconcile(req.user, req.origin); // pays any challenge just finished
            const [poll, ch, draw, stories] = await Promise.all([
                D.todayPoll(req.user, req.origin), D.challenges(req.user, req.origin), Draw.current(req.user, req.origin), storiesFor(req.user, req.origin, "story", 1),
            ]);
            return { poll, challenges: ch, draw, story: stories[0] || null };
        }))
        .post("/poll/:id", limit(20, 1), handle(async (req) => { idOk(req.params.id); return D.answerPoll(req.user, req.origin, req.params.id, String(req.body?.choice || "")); }))
        .get("/challenges", handle(async (req) => { await reconcile(req.user, req.origin); return D.challenges(req.user, req.origin); }))
        .post("/draws/:id/enter", limit(10, 1), handle(async (req) => Draw.enter(req.user, req.origin, req.params.id, req.body?.tickets)))
        .get("/stories", handle(async (req) => storiesFor(req.user, req.origin, req.query.type === "insight" ? "insight" : "story")));

    // ---- admin ----
    router
        .get("/admin/tasks", requireAdmin, handle(async (req) => {
            const q = { origin: req.origin, isDeleted: false, builtIn: { $exists: false } };
            if (req.query.kind) q.kind = String(req.query.kind);
            return Task.find(q).sort({ createdAt: -1 }).limit(200).lean();
        }))
        .post("/admin/tasks", requireAdmin, handle(async (req) => {
            const b = taskBody(req.body);
            if (!b.kind || !b.title) fail("validation", "kind and title are required.", 422);
            // a poll with a `day` is that day's daily poll; without one it is a Teen creative poll (audience teen)
            if (["poll", "design_vote"].includes(b.kind) && !(b.options?.length >= 2)) fail("validation", "A poll or design vote needs at least 2 options.", 422);
            if (b.kind === "poll" && !b.day && !(b.audience || []).includes("teen")) fail("validation", "A daily poll needs a day.", 422);
            if (b.kind === "challenge" && (!b.month || !D.METRICS.includes(b.goal?.metric) || !(b.goal?.target > 0))) fail("validation", `A challenge needs a month and a goal (metric one of ${D.METRICS.join(", ")}, target above 0).`, 422);
            return Task.create({ ...b, origin: req.origin, created: { By: req.user._id } });
        }))
        .put("/admin/tasks/:id", requireAdmin, handle(async (req) => {
            idOk(req.params.id);
            const b = taskBody(req.body); delete b.kind;
            const t = await Task.findOneAndUpdate({ _id: req.params.id, origin: req.origin, isDeleted: false }, { $set: b }, { new: true, runValidators: true });
            if (!t) fail("not_found", "No such task.", 404);
            return t;
        }))
        .delete("/admin/tasks/:id", requireAdmin, handle(async (req) => {
            idOk(req.params.id);
            await Task.updateOne({ _id: req.params.id, origin: req.origin }, { $set: { isActive: false } }); // answers and points stay
            return { id: req.params.id, isActive: false };
        }))
        .get("/admin/draws", requireAdmin, handle(async (req) => {
            const draws = await PrizeDraw.find({ origin: req.origin, isDeleted: false }).sort({ month: -1 }).lean();
            const counts = await DrawEntry.aggregate([{ $match: { origin: req.origin } }, { $group: { _id: "$draw", members: { $sum: 1 }, tickets: { $sum: "$tickets" } } }]);
            const by = new Map(counts.map((c) => [String(c._id), c]));
            return { enabled: Boolean(config().draw?.enabled), draws: draws.map((d) => ({ ...d, members: by.get(String(d._id))?.members || 0, tickets: by.get(String(d._id))?.tickets || 0 })) };
        }))
        .post("/admin/draws", requireAdmin, handle(async (req) => {
            const x = clean(req.body) || {};
            const closesAt = new Date(x.closesAt);
            const b = {
                month: x.month, title: str(x.title, 120), prize: str(x.prize, 300), rulesUrl: str(x.rulesUrl, 500),
                ticketPoints: Math.round(Number(x.ticketPoints) || 0), maxTicketsPerMember: Math.max(1, Math.round(Number(x.maxTicketsPerMember) || 10)),
                winners: Math.max(1, Math.round(Number(x.winners) || 1)), closesAt,
                countries: (Array.isArray(x.countries) ? x.countries : []).map((c) => String(c).toLowerCase().trim().slice(0, 40)).filter(Boolean),
            };
            if (!/^\d{4}-\d{2}$/.test(b.month || "") || !b.title || !b.prize || !(b.ticketPoints > 0) || isNaN(closesAt)) fail("validation", "month, title, prize, ticketPoints and closesAt are required.", 422);
            return PrizeDraw.create({ ...b, origin: req.origin, created: { By: req.user._id } }).catch((e) => { if (e?.code === 11000) fail("conflict", "There is already a draw for that month.", 409); throw e; });
        }))
        .post("/admin/draws/:id/run", requireAdmin, handle(async (req) => { idOk(req.params.id); return Draw.run(req.user, req.origin, req.params.id); }))
        .post("/admin/draws/:id/cancel", requireAdmin, handle(async (req) => { idOk(req.params.id); return Draw.cancel(req.user, req.origin, req.params.id); }))
        .get("/admin/stories", requireAdmin, handle(async (req) => Story.find({ origin: req.origin, isDeleted: false }).sort({ createdAt: -1 }).limit(200).lean()))
        .post("/admin/stories", requireAdmin, handle(async (req) => {
            const b = storyBody(req.body);
            if (!["story", "insight"].includes(b.type) || !b.title) fail("validation", "type (story or insight) and title are required.", 422);
            return Story.create({ ...b, origin: req.origin, created: { By: req.user._id } });
        }))
        .put("/admin/stories/:id", requireAdmin, handle(async (req) => {
            idOk(req.params.id);
            const b = storyBody(req.body); delete b.type;
            const s = await Story.findOneAndUpdate({ _id: req.params.id, origin: req.origin, isDeleted: false }, { $set: b }, { new: true, runValidators: true });
            if (!s) fail("not_found", "No such story.", 404);
            return s;
        }))
        .delete("/admin/stories/:id", requireAdmin, handle(async (req) => {
            idOk(req.params.id);
            await Story.updateOne({ _id: req.params.id, origin: req.origin }, { $set: { isActive: false } });
            return { id: req.params.id, isActive: false };
        }));
}

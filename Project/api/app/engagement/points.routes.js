// Phase 1: points ledger, pending / on-hold view, export, streaks, preferences.
//
//  member (signed in)
//  GET  /config                     public engagement settings (no money values for Teens)
//  GET  /summary                    balances, clearing dates, streak
//  GET  /ledger?type=&status=&from=&to=&q=&limit=&offset=   filtered ledger
//  GET  /ledger.csv?<same filters>  the same as a CSV download
//  GET  /streak                     current / best streak, 28-day strip, next bonus
//  GET  /preferences  PUT /preferences   the member's engagement preferences (whitelisted fields)
//  admin
//  GET  /admin/holds?user=          active holds
//  POST /admin/holds                {user, source: survey|reward, entry, reason, memberNote?, expectedBy?}
//  POST /admin/holds/:id/release    {outcome?: released}
import mongoose from "mongoose";
import { MemberPreference, PointsHold, Response, Reward, User } from "../model/index.js";
import { publicConfig } from "./config.js";
import { isOn, scopeOf } from "./switches.js";
import * as L from "./ledger.js";
import { streakOf } from "./streak.js";
import * as Marketing from "./marketing.js";
import { handle, fail, limit, requireAdmin, memberType, clean } from "./http.js";

const oid = (id) => {
    if (!mongoose.isValidObjectId(String(id))) fail("bad_request", "That id isn't valid.");
    return new mongoose.Types.ObjectId(String(id));
};

export async function prefsOf(user, origin) {
    const p = await MemberPreference.findOne({ user: oid(user._id), origin }).lean();
    if (p) return p;
    return new MemberPreference({ user: user._id, origin }).toObject(); // defaults, not saved
}

// fields a member may set, and their shape
const BEST_TIMES = ["morning", "afternoon", "evening", "night"];
const hhmm = (s, d) => (/^\d{2}:\d{2}$/.test(String(s)) && Number(String(s).slice(0, 2)) < 24 && Number(String(s).slice(3)) < 60 ? String(s) : d);
const bool = (v, d) => (typeof v === "boolean" ? v : d);
// `on.whatsapp`: the brand's whatsapp switch. While it is off a member can't choose WhatsApp (it stays as it was).
export function sanitizePrefs(body = {}, current = {}, on = { whatsapp: true }) {
    const b = clean(body) || {};
    const out = {};
    if (b.survey) {
        out.survey = {
            topics: Array.isArray(b.survey.topics) ? [...new Set(b.survey.topics.map((x) => String(x).trim().toLowerCase().slice(0, 60)).filter(Boolean))].slice(0, 40) : current.survey?.topics || [],
            bestTimes: Array.isArray(b.survey.bestTimes) ? b.survey.bestTimes.filter((x) => BEST_TIMES.includes(x)) : current.survey?.bestTimes || [],
            invitesPerWeek: b.survey.invitesPerWeek === null ? null : Number.isFinite(Number(b.survey.invitesPerWeek)) ? Math.max(0, Math.min(50, Math.round(Number(b.survey.invitesPerWeek)))) : current.survey?.invitesPerWeek ?? null,
        };
    }
    if (b.notifications) {
        const n = b.notifications, c = current.notifications || {};
        out.notifications = {
            email: bool(n.email, c.email ?? true),
            push: bool(n.push, c.push ?? false),
            whatsapp: on.whatsapp ? bool(n.whatsapp, c.whatsapp ?? false) : c.whatsapp ?? false,
            weeklySummary: bool(n.weeklySummary, c.weeklySummary ?? true),
            expiryReminders: bool(n.expiryReminders, c.expiryReminders ?? true),
            newSurvey: bool(n.newSurvey, c.newSurvey ?? true),
            // kept as they are unless the member changes them here (they can also be switched off from an email link)
            lifecycle: bool(n.lifecycle, c.lifecycle ?? true),
            birthday: bool(n.birthday, c.birthday ?? true),
            quietHours: {
                enabled: bool(n.quietHours?.enabled, c.quietHours?.enabled ?? false),
                start: hhmm(n.quietHours?.start, c.quietHours?.start || "22:00"),
                end: hhmm(n.quietHours?.end, c.quietHours?.end || "08:00"),
            },
        };
    }
    if (b.leaderboard) out.leaderboard = { optIn: bool(b.leaderboard.optIn, current.leaderboard?.optIn ?? false) };
    return out;
}
export async function savePrefs(user, origin, patch) {
    const set = {};
    for (const [k, v] of Object.entries(patch)) set[k] = v;
    return MemberPreference.findOneAndUpdate(
        { user: oid(user._id), origin },
        { $set: set, $setOnInsert: { user: oid(user._id), origin } },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();
}

const view = (e) => ({ id: e.id, type: e.type, name: e.name, points: e.points, status: e.status, clearsAt: e.clearsAt || null, note: e.note || undefined, at: e.at });

export function mount(router) {
    router
        .get("/config", handle(async (req) => publicConfig(memberType(req.user), { draw: await isOn(req.origin, "draw", scopeOf(req.user)), push: await isOn(req.origin, "push"), whatsapp: await isOn(req.origin, "whatsapp", scopeOf(req.user)), hold: await L.holdFor(req.user, req.origin) })))
        .get("/summary", handle(async (req) => {
            const { balances, clearing, entries } = await L.ledger(req.user, req.origin);
            const streak = await streakOf(req.user, req.origin);
            return { balances, clearing, streak, onHold: entries.filter((e) => e.status === "on_hold").map(view), memberType: memberType(req.user) };
        }))
        .get("/ledger", limit(120, 1), handle(async (req) => {
            const { entries, balances } = await L.ledger(req.user, req.origin);
            const list = L.filter(entries, req.query);
            const lim = Math.max(1, Math.min(500, Number(req.query.limit) || 100));
            const off = Math.max(0, Number(req.query.offset) || 0);
            return { total: list.length, offset: off, items: list.slice(off, off + lim).map(view), balances, types: L.TYPES };
        }))
        .get("/ledger.csv", limit(20, 1), handle(async (req, res) => {
            const { entries } = await L.ledger(req.user, req.origin);
            const csv = L.toCSV(L.filter(entries, req.query));
            res.set("Content-Type", "text/csv; charset=utf-8");
            res.set("Content-Disposition", `attachment; filename="mfr-points-${new Date().toISOString().slice(0, 10)}.csv"`);
            res.set("Cache-Control", "no-store");
            res.send(csv);
        }))
        .get("/streak", handle(async (req) => streakOf(req.user, req.origin)))
        .get("/preferences", handle(async (req) => {
            const p = await prefsOf(req.user, req.origin);
            return { survey: p.survey, notifications: p.notifications, leaderboard: p.leaderboard };
        }))
        .put("/preferences", limit(30, 1), handle(async (req) => {
            const current = await prefsOf(req.user, req.origin);
            const patch = sanitizePrefs(req.body, current, { whatsapp: await isOn(req.origin, "whatsapp", scopeOf(req.user)) });
            if (!Object.keys(patch).length) fail("bad_request", "Nothing to save.");
            const p = await savePrefs(req.user, req.origin, patch);
            return { survey: p.survey, notifications: p.notifications, leaderboard: p.leaderboard };
        }))
        // "Send me news and offers": the member's marketing e-mail consent (see marketing.js)
        .get("/marketing", handle(async (req) => {
            const u = await User.findOne({ _id: req.user._id, origin: req.origin }).select("marketingOptIn").lean();
            return { ...Marketing.view(u), teen: memberType(req.user) === "teen" };
        }))
        .put("/marketing", limit(20, 1), handle(async (req) => Marketing.setOptIn(req.user._id, req.origin, req.body?.optIn, "profile", "member")));

    // ---- admin: holds ------------------------------------------------------------------------------------------------
    router
        .get("/admin/holds", requireAdmin, handle(async (req) => {
            const q = { origin: req.origin, releasedAt: null };
            if (req.query.user) q.user = oid(req.query.user);
            return PointsHold.find(q).sort({ createdAt: -1 }).limit(500).lean();
        }))
        .post("/admin/holds", requireAdmin, handle(async (req) => {
            const b = clean(req.body) || {};
            if (!["survey", "reward"].includes(b.source)) fail("bad_request", "source must be survey or reward.");
            const user = oid(b.user), entry = oid(b.entry);
            const Model = b.source === "survey" ? Response : Reward;
            const found = await Model.exists({ _id: entry, user, origin: req.origin });
            if (!found) fail("not_found", "That entry doesn't belong to this member.", 404);
            const open = await PointsHold.findOne({ entry, source: b.source, origin: req.origin, releasedAt: null });
            if (open) return open;
            return PointsHold.create({
                user, source: b.source, entry, origin: req.origin,
                reason: String(b.reason || "").slice(0, 500),
                memberNote: String(b.memberNote || "Being checked by our quality team").slice(0, 200),
                expectedBy: b.expectedBy && !isNaN(new Date(b.expectedBy)) ? new Date(b.expectedBy) : undefined,
                created: { By: req.user._id, From: req.clientIP },
            });
        }))
        .post("/admin/holds/:id/release", requireAdmin, handle(async (req) => {
            const h = await PointsHold.findOneAndUpdate(
                { _id: oid(req.params.id), origin: req.origin, releasedAt: null },
                { $set: { releasedAt: new Date(), outcome: "released", updated: { By: req.user._id, From: req.clientIP } } },
                { new: true }
            );
            if (!h) fail("not_found", "No open hold with that id.", 404);
            return h;
        }));
}

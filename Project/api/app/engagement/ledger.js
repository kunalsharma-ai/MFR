// The member's points ledger, worked out on the server from the records that already exist:
//
//   Response (status complete)  -> "survey" entries      (points = the response's points, as today)
//   Reward                      -> "profile", "poll", "streak", "referral", "challenge", "bonus", "task" entries
//   extra sources (registerSource) -> e.g. redemptions, as negative entries
//
// Nothing here writes to Response or Reward. Each entry gets a state:
//   cleared  - can be spent
//   pending  - newer than config.points.holdDays (only entries created on/after config.points.holdFrom)
//   on_hold  - an admin's PointsHold is active on it
//
// Balances: earned = all positive entries; available = cleared - spent.
import mongoose from "mongoose";
import { Response, Reward, PointsHold } from "../model/index.js";
import { config } from "./config.js";

const slugOf = (s) => String(s ?? "").trim().toLowerCase();
const oid = (id) => new mongoose.Types.ObjectId(String(id));

// ---- pluggable parts (later phases add redemptions, bonuses...) ----------------------------------------------------
const SOURCES = [];
export function registerSource(fn) { SOURCES.push(fn); }
const RECONCILERS = [];
// A reconciler grants anything the member has become due (streak bonus, referral tier...). It must be idempotent:
// it is run before every ledger read. Use grant() below, whose unique key makes a second run a no-op.
export function registerReconciler(fn) { RECONCILERS.push(fn); }

export async function grant(user, origin, { category, key, name, points, remarks }) {
    const filter = { user: oid(user._id), key: slugOf(key), origin };
    try {
        await Reward.updateOne(filter, {
            $setOnInsert: { ...filter, category: slugOf(category), name, points: Math.max(0, Math.round(Number(points) || 0)), remarks, isActive: true, isDeleted: false },
        }, { upsert: true });
    } catch (e) {
        if (e?.code !== 11000) throw e; // a parallel request granted it first
    }
}

export async function reconcile(user, origin) {
    for (const fn of RECONCILERS) {
        try { await fn(user, origin); } catch (e) { console.error("engagement reconcile failed:", e.message); }
    }
}

// ---- entries -------------------------------------------------------------------------------------------------------
async function baseEntries(user, origin) {
    const u = oid(user._id);
    const [responses, rewards] = await Promise.all([
        Response.find({ user: u, status: "complete", isActive: true, isDeleted: false, origin }).lean(),
        Reward.find({ user: u, isActive: true, isDeleted: false, origin }).lean(),
    ]);
    // a profile completed as a survey is counted once, from its response (same rule as /api/v1/rewards)
    const surveySlugs = new Set(responses.map((r) => slugOf(r?.survey?.slug)));
    const fromSurveys = responses.map((r) => ({
        id: String(r._id),
        source: "survey",
        type: "survey",
        name: r?.survey?.name || r?.survey?.slug || "",
        ref: slugOf(r?.survey?.slug),
        points: Number(r.points) || 0,
        at: r.updatedAt || r.createdAt,
        createdAt: r.createdAt || r.updatedAt,
    }));
    const fromRewards = rewards
        .filter((r) => !(r.category === "profile" && surveySlugs.has(slugOf(String(r.key).replace(/^profile:/, "")))))
        .map((r) => ({
            id: String(r._id),
            source: "reward",
            type: slugOf(r.category) || "bonus",
            name: r.name || "",
            ref: slugOf(r.key),
            points: Number(r.points) || 0,
            at: r.createdAt,
            createdAt: r.createdAt,
        }));
    return [...fromSurveys, ...fromRewards];
}

export async function entries(user, origin, { now = new Date() } = {}) {
    const extra = (await Promise.all(SOURCES.map((fn) => fn(user, origin).catch((e) => { console.error("ledger source failed:", e.message); return []; })))).flat();
    const list = [...(await baseEntries(user, origin)), ...extra];
    const holds = await PointsHold.find({ user: oid(user._id), origin, releasedAt: null, isActive: true, isDeleted: false }).lean();
    const held = new Map(holds.map((h) => [`${h.source}:${h.entry}`, h]));
    const c = config().points;
    const holdFrom = new Date(c.holdFrom).getTime();
    const holdMs = Math.max(0, Number(c.holdDays) || 0) * 86400000;
    for (const e of list) {
        e.at = e.at ? new Date(e.at) : null;
        if (e.points < 0) { e.status = e.status || "spent"; continue; }
        const h = held.get(`${e.source}:${e.id}`);
        const created = new Date(e.createdAt || e.at || 0).getTime();
        if (h) {
            e.status = "on_hold";
            e.note = h.memberNote || "";
            e.clearsAt = h.expectedBy || null;
        } else if (holdMs > 0 && created >= holdFrom && created + holdMs > now.getTime()) {
            e.status = "pending";
            e.clearsAt = new Date(created + holdMs);
        } else {
            e.status = "cleared";
        }
        delete e.createdAt;
    }
    return list.sort((a, b) => (b.at?.getTime() || 0) - (a.at?.getTime() || 0));
}

export function balances(list) {
    const b = { earned: 0, cleared: 0, pending: 0, onHold: 0, spent: 0, available: 0 };
    for (const e of list) {
        if (e.points < 0) { b.spent += -e.points; continue; }
        b.earned += e.points;
        if (e.status === "cleared") b.cleared += e.points;
        else if (e.status === "pending") b.pending += e.points;
        else if (e.status === "on_hold") b.onHold += e.points;
    }
    b.available = Math.max(0, b.cleared - b.spent);
    return b;
}

// the next dates on which pending points clear, soonest first
export function clearing(list) {
    const by = new Map();
    for (const e of list) {
        if (e.status !== "pending" || !e.clearsAt) continue;
        const k = new Date(e.clearsAt).toISOString().slice(0, 10);
        by.set(k, (by.get(k) || 0) + e.points);
    }
    return [...by.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, points]) => ({ date, points }));
}

export async function ledger(user, origin, opts = {}) {
    await reconcile(user, origin);
    const list = await entries(user, origin, opts);
    return { entries: list, balances: balances(list), clearing: clearing(list) };
}

// ---- filters + export ----------------------------------------------------------------------------------------------
export const TYPES = ["survey", "profile", "poll", "streak", "referral", "challenge", "bonus", "task", "redemption", "draw"];
export function filter(list, q = {}) {
    const types = String(q.type || "").split(",").map(slugOf).filter(Boolean);
    const statuses = String(q.status || "").split(",").map(slugOf).filter(Boolean);
    const from = q.from && !isNaN(new Date(q.from)) ? new Date(`${String(q.from).slice(0, 10)}T00:00:00Z`) : null;
    const to = q.to && !isNaN(new Date(q.to)) ? new Date(`${String(q.to).slice(0, 10)}T23:59:59.999Z`) : null;
    const text = slugOf(q.q).slice(0, 80);
    return list.filter((e) =>
        (!types.length || types.includes(e.type)) &&
        (!statuses.length || statuses.includes(e.status)) &&
        (!from || (e.at && e.at >= from)) &&
        (!to || (e.at && e.at <= to)) &&
        (!text || slugOf(e.name).includes(text) || slugOf(e.ref).includes(text)));
}

const csvCell = (v) => {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // stop spreadsheet formula injection
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export function toCSV(list) {
    const head = ["Date", "Type", "Description", "Points", "Status", "Clears on", "Reference"];
    const rows = list.map((e) => [
        e.at ? e.at.toISOString() : "",
        e.type,
        e.name,
        e.points,
        e.status,
        e.clearsAt ? new Date(e.clearsAt).toISOString().slice(0, 10) : "",
        e.id,
    ]);
    // the BOM makes Excel open UTF-8 names correctly
    return "﻿" + [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

"use client";
// Data adapter for the member hub.
//
//   existing API (/api/v1/…)  →  these hooks (read only, same calls the old screens made)  →  derived view state
//   →  hub components  →  Consumer / Professional / Teen dashboards
//
// Nothing here writes data. Every number the hub shows comes from one of these reads; when a read fails the
// hook returns error=true and the screen shows an error state instead of a made-up value.

import { useQuery } from "@tanstack/react-query";
import { useMember } from "@/Context";
import { api } from "@/util";
import { useRewardsTick, fetchRewardBalance } from "@/hooks/useRewardsRefresh";
import { CORE_SLUGS } from "../(member pages)/profiles/ps/profileRules.js";
import { locale } from "./prefs";

const ok = (r) => r && r.status !== "error";
const fail = (r) => {
  throw new Error((r && r.message) || "request failed");
};

/* ---------------- member type ---------------- */
// Category values used by the API: b2c / consumer (Consumer), b2b (Professional), b2c-minor (Teen, PR #15).
// Old "minor" / "-minor" categories are Teen too.
export function memberTypeOf(member) {
  const c = String(member?.category || "").trim().toLowerCase();
  if (c.includes("minor")) return "teen";
  if (c.startsWith("b2b") || c === "professional") return "professional";
  return "consumer";
}

/* ---------------- reads ---------------- */
export function usePoints() {
  const member = useMember();
  const tick = useRewardsTick();
  return useQuery({
    queryKey: ["hub", "points", member?._id, tick],
    enabled: Boolean(member?._id),
    queryFn: async () => {
      const r = await fetchRewardBalance(member);
      if (!ok(r) || !r.data) fail(r);
      const d = r.data;
      return {
        total: Number(d.totalPoints) || 0,
        threshold: Number(d.threshold) || 15000,
        rate: Number(d.conversionRate) || 0.001,
      };
    },
    staleTime: 30_000,
  });
}

// the reward ledger: completed surveys + paid profiles, newest first (POST /api/v1/rewards)
export function useLedger() {
  const member = useMember();
  const tick = useRewardsTick();
  return useQuery({
    queryKey: ["hub", "ledger", member?._id, tick],
    enabled: Boolean(member?._id),
    queryFn: async () => {
      const r = await api.post("/api/v1/rewards", {});
      if (!ok(r)) fail(r);
      return (Array.isArray(r.data) ? r.data : []).map((x) => ({
        id: String(x._id || `${x.slug}-${x.createdAt}`),
        kind: x.category === "survey" || x.source === "survey" ? "survey" : x.category === "profile" ? "profile" : "reward",
        name: x.name || x.slug || "",
        points: Number(x.points) || 0,
        at: x.createdAt ? new Date(x.createdAt) : null,
      }));
    },
    staleTime: 30_000,
  });
}

// survey participation summary (GET /api/v1/me/statistics)
export function useStats() {
  const member = useMember();
  return useQuery({
    queryKey: ["hub", "stats", member?._id],
    enabled: Boolean(member?._id),
    queryFn: async () => {
      const r = await api.get("/api/v1/me/statistics");
      if (!ok(r)) fail(r);
      const d = Array.isArray(r.data) ? r.data[0] || {} : r.data || {};
      return {
        started: Number(d.total) || 0,
        available: Number(d.available) || 0,
        complete: Number(d.complete) || 0,
        disqualified: Number(d.disqualified) || 0,
        dropout: Number(d.abdoned) || 0,
        points: Number(d.points) || 0,
      };
    },
    staleTime: 60_000,
  });
}

// open survey invitations by source (GET /api/v1/me/survey)
export function useOpportunities() {
  const member = useMember();
  return useQuery({
    queryKey: ["hub", "opps", member?._id],
    enabled: Boolean(member?._id),
    queryFn: async () => {
      const r = await api.get("/api/v1/me/survey");
      if (!ok(r)) fail(r);
      const d = r.data || {};
      const pick = (s) => ({
        all: Number(d?.[s]?.all) || 0,
        high: Number(d?.[s]?.highRewards) || 0,
        short: Number(d?.[s]?.short) || 0,
      });
      return { internal: pick("internal"), external: pick("external") };
    },
    staleTime: 60_000,
  });
}

// profile topics with % complete for this member (POST /api/v1/profile)
export function useProfiles() {
  const member = useMember();
  const tick = useRewardsTick();
  return useQuery({
    queryKey: ["hub", "profiles", member?.category, tick],
    enabled: Boolean(member?.category),
    queryFn: async () => {
      const r = await api.post("/api/v1/profile", { category: member.category });
      if (!ok(r)) fail(r);
      const list = (Array.isArray(r.data) ? r.data : []).map((p) => ({
        slug: String(p.slug || ""),
        name: p.name || p.title || p.slug || "",
        status: Math.max(0, Math.min(100, Number(p.status) || 0)),
        points: Number(p.points) || 0,
      }));
      const core = CORE_SLUGS.map((s) => list.find((p) => p.slug === s)).filter(Boolean);
      const coreDone = core.filter((p) => p.status >= 100).length;
      const all = list.length ? Math.round(list.reduce((n, p) => n + p.status, 0) / list.length) : 0;
      const coreAvg = core.length ? Math.round(core.reduce((n, p) => n + p.status, 0) / core.length) : 0;
      const next = core.find((p) => p.status < 100) || list.find((p) => p.status < 100) || null;
      return { list, core, coreDone, coreAvg, overall: all, next, done: list.filter((p) => p.status >= 100).length };
    },
    staleTime: 60_000,
  });
}

// invitations the member sent (GET /api/v1/me/invite) and people who joined with their link (POST /api/v1/user)
export function useReferrals() {
  const member = useMember();
  return useQuery({
    queryKey: ["hub", "referrals", member?._id],
    enabled: Boolean(member?._id),
    queryFn: async () => {
      const [inv, joined] = await Promise.all([
        api.get("/api/v1/me/invite"),
        api.post("/api/v1/user", { referredBy: member._id }),
      ]);
      if (!ok(inv)) fail(inv);
      const invited = (Array.isArray(inv.data) ? inv.data : []).map((x) => ({ email: x.email, active: x.isActive !== false }));
      const people = ok(joined) && Array.isArray(joined.data)
        ? joined.data.map((u) => ({
            id: u._id,
            name: u.fullName || [u?.name?.first, u?.name?.last].filter(Boolean).join(" ") || u.mail,
            verified: u?.isVerified?.email === "verified",
            at: u.createdAt ? new Date(u.createdAt) : null,
          }))
        : [];
      return { invited, joined: people, joinedKnown: ok(joined) };
    },
    staleTime: 60_000,
  });
}

/* ---------------- derived ---------------- */
export function qualityOf(member) {
  const score = Number(member?.qualityScore);
  const scale = Number(member?.qualityScoreTotal) || 0;
  if (!Number.isFinite(score)) return null;
  const pct = scale > 0 ? Math.max(0, Math.min(100, Math.round((score / scale) * 100))) : null;
  const band = pct == null ? null : pct >= 90 ? "excellent" : pct >= 70 ? "good" : pct >= 50 ? "fair" : "low";
  return { score, scale, pct, band };
}

// months (YYYY-MM) with their points, oldest first, from the ledger
export function monthlyPoints(ledger = [], months = 6) {
  const now = new Date();
  const keys = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const sum = Object.fromEntries(keys.map((k) => [k, 0]));
  for (const r of ledger) {
    if (!r.at) continue;
    const k = `${r.at.getFullYear()}-${String(r.at.getMonth() + 1).padStart(2, "0")}`;
    if (k in sum) sum[k] += r.points;
  }
  return keys.map((k) => ({ key: k, points: sum[k], label: new Date(`${k}-01T00:00:00`).toLocaleString(locale(), { month: "short" }) }));
}

// achievements worked out from real data only
export function achievementsOf({ stats, profiles, quality, ledger, referrals }) {
  const months = new Set((ledger || []).filter((r) => r.at && r.points > 0).map((r) => `${r.at.getFullYear()}-${r.at.getMonth()}`));
  const coreTotal = profiles?.core?.length || 0;
  return [
    { id: "first", icon: "spark", label: "ach.first", hint: "ach.firstHint", done: (stats?.complete || 0) >= 1, progress: Math.min(1, (stats?.complete || 0) / 1) },
    { id: "ten", icon: "stack", label: "ach.ten", hint: "ach.tenHint", hintVars: { n: Math.min(10, stats?.complete || 0) }, done: (stats?.complete || 0) >= 10, progress: Math.min(1, (stats?.complete || 0) / 10) },
    { id: "profile", icon: "id", label: "ach.profile", hint: "ach.profileHint", done: coreTotal > 0 && profiles.coreDone === coreTotal, progress: coreTotal ? profiles.coreDone / coreTotal : 0 },
    { id: "quality", icon: "gauge", label: "ach.quality", hint: "ach.qualityHint", done: (quality?.pct || 0) >= 90, progress: Math.min(1, (quality?.pct || 0) / 90) },
    { id: "consistent", icon: "calendar", label: "ach.consistent", hint: "ach.consistentHint", done: months.size >= 3, progress: Math.min(1, months.size / 3) },
    { id: "referral", icon: "network", label: "ach.referral", hint: "ach.referralHint", done: (referrals?.joined?.length || 0) >= 1, progress: Math.min(1, referrals?.joined?.length || 0) },
  ];
}

export const fmt = (n) => new Intl.NumberFormat(locale()).format(Math.round(Number(n) || 0));
export const money = (pts, rate) =>
  new Intl.NumberFormat(locale(), { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format((Number(pts) || 0) * (Number(rate) || 0));

export function relDay(d, t) {
  if (!d) return "";
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const now = new Date();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((b - a) / 86400000);
  if (days <= 0) return t("c.today");
  if (days === 1) return t("c.yesterday");
  if (days < 7) return t("c.daysAgo", { n: days });
  return d.toLocaleDateString(locale(), { day: "numeric", month: "short", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric" });
}

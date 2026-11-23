"use client";
// One source of truth for the member hub (v2, Nov 2026).
//
//   API reads (data.js + engage/data.js, cached and shared by react-query)
//        → validate (dedupe, clamp, drop broken rows)  → derive once (profile completion, level, quality /10, tasks)
//        → useHub()  → header, navigation, dashboards, Profile, Services, Rewards, Quality, Activity, Account
//
// Every screen reads the same snapshot, so the header ring, the dashboard hero and the Profile page always show the
// same profile %, the same points and the same quality score. When a profile is completed the profile studio calls
// bumpRewards(); every query keyed on the rewards tick refetches and the whole hub updates together.

import React from "react";
import { useMember } from "@/Context";
import { memberTypeOf, usePoints, useLedger, useStats, useOpportunities, useProfiles, useReferrals } from "./data";
import { useEngage, useSummary } from "./engage/data";
import { play } from "./sound";
import { motionReduced, getPrefs } from "./prefs";

/* ---------------- validation ---------------- */
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function cleanLedger(rows) {
  const seen = new Set();
  const out = [];
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!r || seen.has(r.id)) continue; // the same reward listed twice
    if (!Number.isFinite(r.points)) continue;
    if (r.at && Number.isNaN(r.at.getTime())) r.at = null;
    seen.add(r.id);
    out.push(r);
  }
  return out.sort((a, b) => (b.at?.getTime() || 0) - (a.at?.getTime() || 0));
}

/* ---------------- levels ---------------- */
// Display levels from lifetime earned points (never money): level n starts at 250·n·(n−1) points
// (L2 500, L3 1,500, L4 3,000, L5 5,000, L6 7,500, L7 10,500 …). Teens use the server's own level.
export const levelStart = (n) => 250 * n * (n - 1);
export function levelOf(earned) {
  const e = Math.max(0, num(earned));
  let n = 1;
  while (levelStart(n + 1) <= e && n < 99) n += 1;
  const from = levelStart(n);
  const to = levelStart(n + 1);
  return { n, xp: e, from, to, into: e - from, need: to - from, left: to - e, pct: clamp(((e - from) / (to - from)) * 100, 0, 100) };
}

/* ---------------- quality ---------------- */
// The score is User.qualityScore. The engagement API reports it on its own fixed scale (0–200); older screens used the
// category's qualityScoreScale. The engagement scale wins when it is available because the API enforces it.
export function qualityFrom(member, eq) {
  const raw0 = eq?.score ?? member?.qualityScore;
  if (raw0 == null || !Number.isFinite(Number(raw0))) return null;
  const scale = num(eq?.scale) > 0 ? num(eq.scale) : num(member?.qualityScoreTotal) > 0 ? num(member.qualityScoreTotal) : 200;
  const raw = clamp(num(raw0), 0, scale);
  const pct = Math.round((raw / scale) * 100);
  const ten = Math.round((raw / scale) * 100) / 10; // 0.0 – 10.0
  const band = pct >= 90 ? "excellent" : pct >= 70 ? "good" : pct >= 50 ? "fair" : "low";
  return {
    raw, scale, pct, ten, band,
    tier: eq?.tier || null, next: eq?.next || null, toNext: eq?.toNext ?? null,
    tiers: eq?.tiers || null, factors: eq?.factors || null, tips: eq?.tips || null, history: eq?.history || null,
    // kept for v1 modules
    score: raw,
  };
}

/* ---------------- profile completion ---------------- */
const hasPhoto = (m) => Boolean(m?.profilePicture) && !String(m.profilePicture).includes("/images/logo/user.png");
const addrOf = (m) => (Array.isArray(m?.address) ? m.address[0] || {} : {});

export function completionOf(member, type, profiles) {
  const items = [];
  const core = profiles?.core || [];
  for (const p of core) {
    items.push({
      key: `p-${p.slug}`, kind: "profile", label: p.name, slug: p.slug, progress: p.status / 100, weight: 2,
      done: p.status >= 100, reward: p.status >= 100 ? 0 : p.points, href: `/member/profiles?profile=${encodeURIComponent(p.slug)}`,
      action: p.status > 0 ? "hub.cpContinue" : "hub.cpStart",
    });
  }
  const verified = member?.isVerified?.email === "verified";
  const a = addrOf(member);
  items.push({ key: "verify", kind: "account", label: "hub.cpVerify", icon: "mail", progress: verified ? 1 : 0, weight: 1, done: verified, href: "/member/myaccount#identity" });
  if (type !== "teen") items.push({ key: "phone", kind: "account", label: "hub.cpPhone", icon: "support", progress: member?.phone ? 1 : 0, weight: 1, done: Boolean(member?.phone), href: "/member/myaccount#details" });
  const loc = Boolean(a.country && a.city);
  items.push({ key: "location", kind: "account", label: "hub.cpLocation", icon: "pin", progress: loc ? 1 : a.country ? 0.5 : 0, weight: 1, done: loc, href: "/member/myaccount#details" });
  items.push({ key: "photo", kind: "account", label: "hub.cpPhoto", icon: "camera", progress: hasPhoto(member) ? 1 : 0, weight: 1, done: hasPhoto(member), href: "/member/myaccount#identity" });

  const w = items.reduce((n, i) => n + i.weight, 0);
  const got = items.reduce((n, i) => n + i.weight * clamp(i.progress, 0, 1), 0);
  const pct = w ? Math.round((got / w) * 100) : 0;
  const remaining = items.filter((i) => !i.done);
  const extra = (profiles?.list || []).filter((p) => !core.some((c) => c.slug === p.slug));
  const pointsLeft = (profiles?.list || []).filter((p) => p.status < 100).reduce((n, p) => n + p.points, 0);
  return {
    pct: remaining.length ? Math.min(pct, 99) : 100, // never show 100% while something is still open
    items, remaining, done: items.length - remaining.length, total: items.length,
    next: remaining.find((i) => i.kind === "profile") || remaining[0] || null,
    extraDone: extra.filter((p) => p.status >= 100).length, extraTotal: extra.length,
    pointsLeft,
  };
}

/* ---------------- the snapshot ---------------- */
export function useHub() {
  const member = useMember();
  const type = memberTypeOf(member);
  const points = usePoints();
  const ledgerQ = useLedger();
  const stats = useStats();
  const opps = useOpportunities();
  const profiles = useProfiles();
  const referrals = useReferrals();
  const summary = useSummary();
  const eq = useEngage("quality", "/quality");
  const teen = useEngage("teen-progress", "/teen/progress", { enabled: type === "teen" });
  const today = useEngage("today", "/today");

  return React.useMemo(() => {
    const ledger = cleanLedger(ledgerQ.data);
    const bal = summary.data?.balances || null;
    const earned = bal?.earned ?? ledger.filter((r) => r.points > 0).reduce((n, r) => n + r.points, 0);
    const lv0 = levelOf(earned);
    const tl = teen.data?.level;
    const level = type === "teen" && tl
      ? { ...lv0, n: num(tl.level, lv0.n), name: tl.name, pct: clamp(num(tl.pct), 0, 100), left: tl.next?.left ?? null, nextName: tl.next?.name || null, server: true }
      : lv0;
    // Balance: the engagement ledger (cleared − spent, the figure redemptions are checked against) when it is
    // switched on, else GET /me/points. Waiting for the summary avoids showing one number and then another.
    const p = points.data;
    const sumReady = !summary.isLoading;
    let total = p ? p.total : null;
    if (bal && Number.isFinite(Number(bal.available))) {
      if (p && Number(bal.available) !== p.total && typeof console !== "undefined") console.warn("[hub] points differ: /me/points", p.total, "ledger available", bal.available);
      total = Number(bal.available);
    }
    const pts = p && sumReady ? { total: Math.max(0, total), threshold: p.threshold > 0 ? p.threshold : 15000, rate: p.rate, legacy: p.total } : null;
    const quality = qualityFrom(member, eq.data);
    const completion = profiles.data ? completionOf(member, type, profiles.data) : null;
    const open = opps.data ? opps.data.internal.all + opps.data.external.all : null;
    const pollOpen = Boolean(today.data?.poll && !today.data.poll.answered);
    const tasks = completion ? completion.remaining.length + (pollOpen ? 1 : 0) : null;
    const s = stats.data;
    return {
      member, type, ledger, ledgerQ, points, pts, stats, opps, profiles, referrals, summary, eq, teen, today,
      bal, earned, level, quality, completion, open, pollOpen, tasks,
      completed: s ? s.complete : null,
      completionRate: s && s.started ? Math.round((s.complete / s.started) * 100) : null,
      loading: points.isLoading || profiles.isLoading,
      pointsError: points.isError,
    };
  }, [member, type, points.data, points.isLoading, summary.isLoading, ledgerQ.data, stats.data, opps.data, profiles.data, profiles.isLoading, referrals.data, summary.data, eq.data, teen.data, today.data]); // eslint-disable-line react-hooks/exhaustive-deps
}

/* When a value goes up after the first load: returns a short-lived "pulse" flag and plays a sound once. */
export function useRise(value, sound = null) {
  const prev = React.useRef(null);
  const [pulse, setPulse] = React.useState(false);
  React.useEffect(() => {
    if (value == null) return undefined;
    const was = prev.current;
    prev.current = value;
    if (was != null && value > was) {
      setPulse(true);
      if (sound) play(sound);
      const id = setTimeout(() => setPulse(false), 1400);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [value, sound]);
  return pulse;
}

export const calm = () => motionReduced(getPrefs());

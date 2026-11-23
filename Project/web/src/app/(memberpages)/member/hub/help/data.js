"use client";
// Help centre data: which entries this member sees, live values for the answers, search, and the member's queries.
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useMember } from "@/Context";
import { api } from "@/util";
import { memberTypeOf, usePoints, qualityOf, fmt, money } from "../data";
import { TOPICS, GUIDES, FAQS, SYNONYMS } from "./content";

const ok = (r) => r && r.status !== "error";

// Features the server has. engage1 = points ledger / streaks (GET /engagement/config), rewardsShop = rewards catalogue
// (GET /engagement/rewards), today = daily poll, challenges and stories (GET /engagement/today).
// A missing endpoint just hides those entries; nothing breaks.
export function useHelpFeatures() {
  const member = useMember();
  return useQuery({
    queryKey: ["hub", "help", "features", member?._id],
    enabled: Boolean(member?._id),
    queryFn: async () => {
      // each feature is on only when its own endpoint answers (engagement PRs #18, #20, #22)
      const [c, rw, td] = await Promise.all(["/config", "/rewards", "/today"].map((u) => api.get(`/api/v1/engagement${u}`).catch(() => null)));
      const cfg = ok(c) && c.data && typeof c.data === "object" ? c.data : null;
      return {
        engage1: Boolean(cfg),
        config: cfg || {},
        rewardsShop: Boolean(ok(rw) && rw.data),
        rewardsOpen: Boolean(ok(rw) && rw.data?.open),
        today: Boolean(ok(td) && td.data),
      };
    },
    staleTime: 10 * 60_000,
    retry: false,
  });
}

// The member's own tickets. Newer API: GET /support/mine. Older API: the filter the old Support page used.
export function useMyQueries() {
  const member = useMember();
  return useQuery({
    queryKey: ["hub", "help", "queries", member?._id],
    enabled: Boolean(member?._id),
    queryFn: async () => {
      let r = await api.get("/api/v1/support/mine");
      if (!ok(r) || !Array.isArray(r.data)) r = await api.post("/api/v1/support", { "issueRaisedBy.email": member.mail });
      if (!ok(r)) throw new Error(r?.message || "request failed");
      return (Array.isArray(r.data) ? r.data : []).map((x) => ({
        id: String(x._id),
        no: x.ticketNo || String(x._id).slice(-6).toUpperCase(),
        subject: x.subject || "",
        category: x.category || "",
        status: String(x.status || "new").toLowerCase(),
        at: x.createdAt ? new Date(x.createdAt) : null,
      }));
    },
    staleTime: 30_000,
  });
}

// Live values the answers may use. Teens never get a money value.
export function useHelpContext() {
  const member = useMember();
  const type = memberTypeOf(member);
  const points = usePoints();
  const features = useHelpFeatures();
  const p = points.data;
  const showMoney = type !== "teen";
  return React.useMemo(() => {
    const cfg = features.data?.config || {};
    const rate = showMoney ? p?.rate || null : null;
    return {
      type,
      typeLabel: { consumer: "Consumer member", professional: "Professional member", teen: "Teen member" }[type],
      firstname: member?.firstname || "",
      threshold: p?.threshold || null,
      rate,
      fmt,
      money: (pts) => (rate ? money(pts, rate) : null),
      quality: qualityOf(member),
      streakBonuses: Array.isArray(cfg.streakBonuses) ? cfg.streakBonuses : [],
      rewardsOpen: Boolean(features.data?.rewardsOpen),
      pollPoints: cfg.dailyPoll?.enabled ? Number(cfg.dailyPoll.points) || null : null,
      features: { engage1: Boolean(features.data?.engage1), rewardsShop: Boolean(features.data?.rewardsShop), today: Boolean(features.data?.today) },
    };
  }, [type, member, p, features.data, showMoney]);
}

const visible = (e, ctx) => (!e.types || e.types.includes(ctx.type)) && (!e.feature || ctx.features[e.feature]);

export function useHelpContent(ctx) {
  return React.useMemo(() => {
    const guides = GUIDES.filter((g) => visible(g, ctx));
    const faqs = FAQS.filter((f) => visible(f, ctx));
    const topics = TOPICS.filter((tp) => visible(tp, ctx))
      .map((tp) => ({ ...tp, blurb: (ctx.type === "teen" && tp.blurbTeen) || tp.blurb, guides: guides.filter((g) => g.topic === tp.id), faqs: faqs.filter((f) => f.topic === tp.id) }))
      .filter((tp) => tp.guides.length || tp.faqs.length);
    return { topics, guides, faqs };
  }, [ctx]);
}

/* ---------------- text of an answer (for search and for rendering) ---------------- */
export function answerBlocks(a, ctx) {
  return (a || []).map((b) => (typeof b === "function" ? b(ctx) : b)).filter(Boolean);
}
export function blocksText(blocks) {
  return blocks.map((b) => (typeof b === "string" ? b : b.ul ? b.ul.join(" ") : b.ol ? b.ol.join(" ") : b.note || "")).join(" ");
}

const norm = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, " ");
export const words = (s) => norm(s).split(/\s+/).filter((w) => w.length > 1);

// small scored search: question/title words count most, then keywords, then the answer text; synonyms widen a word
export function searchHelp(query, { guides, faqs, topics }, ctx) {
  const qs = words(query);
  if (!qs.length) return [];
  const expand = (w) => [w, ...(SYNONYMS[w] || [])];
  const topicTitle = Object.fromEntries(topics.map((tp) => [tp.id, tp.title]));
  const score = (fields) => {
    let s = 0;
    let hit = 0;
    for (const w of qs) {
      let best = 0;
      for (const v of expand(w)) {
        const stem = v.length > 4 ? v.slice(0, v.length - 1) : v;
        for (const [txt, weight] of fields) {
          if (txt.includes(` ${v}`) || txt.startsWith(v)) best = Math.max(best, weight * (v === w ? 1 : 0.6));
          else if (txt.includes(stem)) best = Math.max(best, weight * 0.5 * (v === w ? 1 : 0.6));
        }
      }
      if (best > 0) hit += 1;
      s += best;
    }
    return hit === 0 ? 0 : s * (hit / qs.length);
  };
  const out = [];
  for (const f of faqs) {
    const s = score([[` ${norm(f.q)}`, 5], [` ${norm(f.kw)}`, 3], [` ${norm(topicTitle[f.topic])}`, 1.5], [` ${norm(blocksText(answerBlocks(f.a, ctx)))}`, 1]]);
    if (s > 0) out.push({ kind: "faq", item: f, s });
  }
  for (const g of guides) {
    const s = score([[` ${norm(g.title)}`, 5], [` ${norm(topicTitle[g.topic])}`, 1.5], [` ${norm(g.steps.map((x) => `${x.t} ${x.d}`).join(" "))}`, 1]]);
    if (s > 0) out.push({ kind: "guide", item: g, s: s * 0.95 });
  }
  return out.sort((a, b) => b.s - a.s).slice(0, 12);
}

// wraps the searched words in <mark>
export function Highlight({ text, query }) {
  const qs = words(query).filter((w) => w.length > 2);
  if (!qs.length || !text) return text || null;
  const re = new RegExp(`(${qs.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = String(text).split(re);
  return parts.map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : <React.Fragment key={i}>{p}</React.Fragment>));
}

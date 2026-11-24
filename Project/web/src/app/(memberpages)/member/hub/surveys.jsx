"use client";
// Survey discovery (v3, Nov 2026 rebuild of /member/surveys). Same data and workflow as before, new screen:
//   - the list is POST /api/v1/me/survey { status: "active" } (invited + dropout), the member's real invitations;
//     completed and closed ones come from the same call without a status filter (the request useProfileGate shares)
//   - topic profiles still to complete are listed first (useProfileGate.pending), exactly as before
//   - surveys stay locked until the four basic profiles are complete (GateDialog says what to finish)
//   - Start opens the existing survey flow: /survey?name=<slug>; a topic profile opens /member/profiles?profile=<slug>
//   - a survey whose topic profile is already complete is not listed again (useCompletedProfiles)
// Nothing on a card is invented: name, points, minutes (loi), dates, summary and the quality requirement come from
// the Survey record; the topic is read from the survey's own name. Cards differ by topic and by member segment.
import React from "react";
import Link from "next/link";
import Hero8 from "./v8/hero.jsx";
import Tile from "./tiles.jsx";
import SurveyHistory7 from "./history.jsx";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/util";
import { useMember, useQuery as useQueryParams } from "@/Context";
import useCompletedProfiles from "@/hooks/useCompletedProfiles";
import useProfileGate from "@/hooks/useProfileGate";
import { useRewardsTick } from "@/hooks/useRewardsRefresh";
import GateDialog from "../(member pages)/profiles/ps/GateDialog";
import Icon from "./icons.jsx";
import { t } from "./strings";
import { Counter, Reveal, EmptyState, ErrorState, Skeleton } from "./ui.jsx";
import { fmt, relDay } from "./data";
import { useHub } from "./store";
import { play } from "./sound";
import { surveyTopic, profileTopic, artOf, profileArt } from "./topics";

const PERMITTED = ["invited", "dropout"]; // the statuses a member can start or resume
const HIGH = 50; // more than 50 points = top reward (profileRules.isHighReward)
const QUICK = 10; // minutes
const slugOf = (x) => String(x?.slug || "").toLowerCase();
const tx = (key, fallback) => { const s = t(key); return s === key ? fallback : s; };

function useSurveys(source) {
  const member = useMember();
  const tick = useRewardsTick();
  const active = useQuery({
    queryKey: ["sx-active", member?._id, source || "", tick],
    queryFn: () => api.post("/api/v1/me/survey", { source, status: "active" }).then((r) => { if (r?.status === "error") throw new Error(r.message || "error"); return Array.isArray(r?.data) ? r.data : []; }),
    enabled: Boolean(member?._id),
  });
  const all = useQuery({
    queryKey: ["my-surveys-all", member?._id, tick], // shared with useProfileGate
    queryFn: () => api.post("/api/v1/me/survey", {}).then((r) => (Array.isArray(r?.data) ? r.data : [])),
    enabled: Boolean(member?._id),
    retry: false,
  });
  return { active, all };
}

function daysLeft(d) {
  if (!d) return null;
  const ms = new Date(d).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return Math.ceil(ms / 86400000);
}

/* one card (v6, round 5): a ticket. The stub holds the reward, the body the topic, name, facts and the action.
   Nothing on it is invented: name, points, minutes (loi), dates, summary and the quality requirement come from the record. */
export function SurveyCard({ row, type, locked, onStart, featured = false, i = 0 }) {
  const isProfile = row.kind === "profile";
  const tp = isProfile ? profileTopic(row) : surveyTopic(row, type);
  const st = row.state; // available | resume | locked | done | closed
  const mins = isProfile ? Math.max(1, Number(row.loi) || 1) : Number(row.loi) || null;
  const left = daysLeft(row.endsAt);
  const label = tx(`sx.topic.${tp.k}`, tx(`pf3.${tp.k}.title`, t("sx.topic.general")));
  const unit = type === "teen" ? t("hdr.xp") : null;
  const nq = Array.isArray(row.questions) ? row.questions.length : Number(row.questions) || 0;
  const meta = [];
  if (isProfile && nq) meta.push({ icon: "surveys", text: t("pf.questions", { n: nq }) });
  if (mins) meta.push({ icon: "clock", text: `~${t("sx.min", { n: mins })}` });
  if (left != null && st !== "done" && st !== "closed") meta.push({ icon: "calendar", text: left <= 1 ? t("sx.endsToday") : t("sx.endsIn", { n: left }) });
  if (row.minQualityScore && st !== "done") meta.push({ icon: "quality", text: t("sx.eligQuality", { n: row.minQualityScore }) });
  if (st === "done" && row.at) meta.push({ icon: "check", text: relDay(new Date(row.at), t) });
  const tstate = st === "available" ? "open" : st === "resume" ? "going" : st;
  const stateLabel = st === "available" ? (isProfile ? t("v7.tile.topicProfile") : type === "teen" ? t("v7.tile.xpSurvey") : t("v7.tile.paid")) : st === "closed" ? t(`sx.closed.${row.participationStatus}`) : t(`sx.state.${st}`);
  const cta = st === "locked" ? t("v7.tile.howUnlock") : st === "resume" ? t("pf.continue") : isProfile ? t("sx.startProfile") : st === "done" || st === "closed" ? "" : t("v7.tile.startSurvey");
  const off = st === "done" || st === "closed";
  return (
    <Tile c1={tp.c1} c2={tp.c2} art={isProfile ? profileArt(row.slug, tp) : artOf(tp)} name={row.name} topic={isProfile ? t("sx.profileTopic") : label}
      ribbon={!isProfile && row.participationStatus === "invited" && st === "available" ? t("v5.new") : null}
      meta={meta} pts={fmt(Number(row.points) || 0)} unit={unit} state={tstate} stateLabel={stateLabel} cta={cta} i={i} featured={featured}
      disabled={off} onClick={off ? undefined : () => onStart(row)} ariaLabel={off ? `${row.name}: ${stateLabel}` : `${cta}: ${row.name}`} />
  );
}

function CardSkeleton() {
  return <li className="tc is-skel" aria-hidden="true"><span className="tc-btn"><Skeleton h={18} w="70%" /><Skeleton h={14} w="50%" /><Skeleton h={30} w="100%" r={10} /></span></li>;
}

// Everything a survey list needs, shared by the Surveys page and the dashboard's opportunities section:
// real /me/survey rows (invited + dropout), pending topic profiles, the gate, and the start action.
export function useSurveyDesk(source) {
  const router = useRouter();
  const member = useMember();
  const gate = useProfileGate();
  const doneProfiles = useCompletedProfiles(member?.category);
  const { active, all } = useSurveys(source);
  const [gateOpen, setGateOpen] = React.useState(false);

  const locked = gate.loading || !gate.coreDone;
  const isProfileSurvey = (s) => gate.profileSlugs.has(slugOf(s));
  const visible = (active.data || []).filter((s) => !doneProfiles.includes(slugOf(s)));
  const surveys = visible.filter((s) => !isProfileSurvey(s) && PERMITTED.includes(s.participationStatus)).map((s) => ({
    ...s, kind: "survey", state: locked ? "locked" : s.participationStatus === "dropout" ? "resume" : "available",
  }));
  const profileRows = gate.pending.map((p) => ({ _id: p._id, slug: p.slug, name: p.name, points: p.points, loi: p.loi, questions: p.questions, kind: "profile", participationStatus: "invited", state: locked ? "locked" : "available" }));
  const openRows = [...profileRows, ...surveys];
  const history = (all.data || []).filter((s) => !isProfileSurvey(s) && ["complete", "terminate", "overquota"].includes(s.participationStatus))
    .map((s) => ({ ...s, kind: "survey", state: s.participationStatus === "complete" ? "done" : "closed", at: s.updatedAt || s.createdAt }))
    .slice(0, 6);
  const startable = openRows.filter((r) => r.state === "available" || r.state === "resume");
  // the best next one: the most points per minute among those the member can start now
  const best = startable.length > 1 ? [...startable].sort((a, b) => (Number(b.points) || 0) / Math.max(1, Number(b.loi) || 1) - (Number(a.points) || 0) / Math.max(1, Number(a.loi) || 1))[0] : startable[0] || null;
  const total = openRows.reduce((n, r) => n + (Number(r.points) || 0), 0);
  const avg = openRows.length ? Math.round(openRows.reduce((n, r) => n + (Number(r.loi) || 0), 0) / openRows.length) : 0;
  const loading = active.isLoading || gate.loading;

  const start = (row) => {
    if (row.state === "locked") { play("tap"); return setGateOpen(true); }
    play("complete");
    if (row.kind === "profile") return router.push(`/member/profiles?profile=${row.slug}`);
    if (PERMITTED.includes(row.participationStatus)) router.push(`/survey?name=${row.slug}`);
  };
  const dialog = (
    <GateDialog
      open={gateOpen}
      gate={gate}
      onClose={() => setGateOpen(false)}
      onStart={(slug) => { setGateOpen(false); router.push(`/member/profiles?profile=${slug}`); }}
    />
  );
  return { gate, active, all, surveys, profileRows, openRows, history, startable, best, total, avg, locked, loading, start, gateOpen, setGateOpen, dialog };
}

export const surveyFilters = (profileRows) => [
  { k: "all", test: () => true },
  { k: "quick", test: (r) => Number(r.loi) > 0 && Number(r.loi) <= QUICK },
  { k: "top", test: (r) => Number(r.points) > HIGH },
  ...(profileRows.length ? [{ k: "profiles", test: (r) => r.kind === "profile" }] : []),
];

// The page still accepts the legacy SurveyHistory prop from the route, but v7 renders its own history table.
export default function SurveysPage() {
  const hub = useHub();
  const { type } = hub;
  const query = useQueryParams();
  const desk = useSurveyDesk(query?.source);
  const { gate, active, surveys, profileRows, openRows, history, startable, total, avg, locked, loading, start, setGateOpen } = desk;
  const best = startable.length > 1 ? desk.best : null;
  const [filter, setFilter] = React.useState("all");
  const FILTERS = surveyFilters(profileRows);
  const f = FILTERS.find((x) => x.k === filter) || FILTERS[0];
  const [q, setQ] = React.useState("");
  const [shown, setShown] = React.useState(12);
  const rank = { available: 0, resume: 0, locked: 1 };
  const rows = openRows.filter(f.test)
    .filter((r) => !q.trim() || String(r.name || "").toLowerCase().includes(q.trim().toLowerCase()))
    .map((r, k) => [r, k]).sort((a, b) => (rank[a[0].state] ?? 2) - (rank[b[0].state] ?? 2) || a[1] - b[1]).map((x) => x[0]);

  return (
    <div className="pg pg-surveys sx">
      <Hero8 kind="surveys" id="sx-title"
        crumbs={[{ label: t("nav.dashboard"), href: "/member/dashboard" }, { label: t("nav.surveys") }]}
        eyebrow={t(`sx.eyebrow.${type}`)}
        title={loading ? t("sx.loadingTitle") : !openRows.length ? t("sx.titleNone") : !profileRows.length ? t(surveys.length === 1 ? "sx.titleOne" : "sx.title", { n: surveys.length }) : !surveys.length ? t("sx.titleProfiles", { n: profileRows.length }) : t("sx.titleMix", { n: surveys.length, p: profileRows.length })}
        sub={locked && !gate.loading ? t("sx.subLocked") : t(`sx.sub.${type}`)}
        actions={locked && !gate.loading ? <button type="button" className="h-btn h-btn-primary h-btn-lg" onClick={() => setGateOpen(true)}><Icon name="lock" size={17} /> {t("sx.whatFirst")}</button> : null}
        stats={[
          { label: t("sx.kOpen"), value: loading ? "…" : openRows.length, tone: "a" },
          { label: t("sx.kPoints"), value: loading ? "…" : openRows.length ? fmt(total) : "–", tone: "b" },
          { label: t("sx.kTime"), value: loading ? "…" : avg ? t("sx.min", { n: avg }) : "–", tone: "c" },
        ]}
      />

      {best && !loading ? (
        <section className="sx-best" aria-labelledby="sx-best-t">
          <h2 className="sx-h" id="sx-best-t"><Icon name="target" size={20} /> {t("sx.bestTitle")}</h2>
          <p className="k-note">{t("sx.bestWhy")}</p>
          <ul className="sx-grid tc-grid one"><SurveyCard row={best} type={type} locked={locked} onStart={start} featured /></ul>
        </section>
      ) : null}

      <section className="sx-list" aria-labelledby="sx-list-t">
        <div className="sx-list-head">
          <h2 className="sx-h" id="sx-list-t"><Icon name="surveys" size={20} /> {t("sx.listTitle")}</h2>
          <label className="tc-search"><Icon name="search" size={16} /><input type="search" value={q} onChange={(e) => { setQ(e.target.value); setShown(12); }} placeholder={t("v7.searchSurveys")} aria-label={t("v7.searchSurveys")} /></label>
          <div className="sx-filters" role="tablist" aria-label={t("sx.filterLabel")}>
            {FILTERS.map((x) => {
              const n = openRows.filter(x.test).length;
              if (!n && x.k !== "all" && filter !== x.k) return null; // a filter with nothing in it is not offered
              return (
                <button key={x.k} type="button" role="tab" aria-selected={filter === x.k} className={filter === x.k ? "on" : ""} onClick={() => { setFilter(x.k); setShown(12); play("tap"); }}>
                  {t(`sx.f.${x.k}`)} <span>{n}</span>
                </button>
              );
            })}
          </div>
        </div>
        {active.isError ? <ErrorState onRetry={active.refetch} /> : loading ? (
          <ul className="sx-grid tc-grid">{[0, 1, 2].map((k) => <CardSkeleton key={k} />)}</ul>
        ) : !openRows.length ? (
          <EmptyState kind="surveys" title={t("sx.emptyTitle")} text={t(`sx.emptyText.${type}`)} action={<Link className="h-btn h-btn-primary" href="/member/profiles">{t("sx.emptyCta")}</Link>} />
        ) : !rows.length ? (
          <p className="sx-none"><Icon name="search" size={18} /> {t("sx.noneInFilter")} <button type="button" className="h-link" onClick={() => setFilter("all")}>{t("sx.showAll")}</button></p>
        ) : (
          <>
            <ul className="sx-grid tc-grid">{rows.slice(0, shown).map((r, i) => <SurveyCard key={`${r.kind}-${r.slug}`} row={r} type={type} locked={locked} onStart={start} i={i % 12} />)}</ul>
            {rows.length > shown ? (
              <div className="tc-more"><span>{t("v7.showing", { n: Math.min(shown, rows.length), m: rows.length })}</span><button type="button" className="h-btn h-btn-ghost" onClick={() => { setShown((n) => n + 12); play("tap"); }}>{t("v7.showMore")} <Icon name="chevron" size={14} /></button></div>
            ) : null}
          </>
        )}
      </section>

      {history.length ? (
        <Reveal>
          <section className="sx-done" aria-labelledby="sx-done-t">
            <h2 className="sx-h" id="sx-done-t"><Icon name="check" size={20} /> {t("sx.doneTitle")}</h2>
            <ul className="sx-grid tc-grid compact">{history.map((r, i) => <SurveyCard key={`h-${r.slug}`} row={r} type={type} locked={false} onStart={start} i={i} />)}</ul>
          </section>
        </Reveal>
      ) : null}

      <SurveyHistory7 type={type} />

      {desk.dialog}
    </div>
  );
}

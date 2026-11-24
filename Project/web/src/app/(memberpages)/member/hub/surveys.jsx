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
import Scene3D from "./scene.jsx";
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
import { surveyTopic, profileTopic } from "./topics";

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

/* one card: a survey or a topic profile taken as a survey */
function SurveyCard({ row, type, locked, onStart, featured = false, i = 0 }) {
  const isProfile = row.kind === "profile";
  const tp = isProfile ? profileTopic(row) : surveyTopic(row, type);
  const st = row.state; // available | resume | locked | done | closed
  const mins = isProfile ? Math.max(1, Number(row.loi) || 1) : Number(row.loi) || null;
  const left = daysLeft(row.endsAt);
  const canStart = st === "available" || st === "resume";
  const cta = st === "resume" ? t("sx.resume") : isProfile ? t("sx.startProfile") : t("sx.start");
  const label = tx(`sx.topic.${tp.k}`, tx(`pf3.${tp.k}.title`, t("sx.topic.general")));
  return (
    <li className={`sx-card is-${st} ${featured ? "is-featured" : ""}`} style={{ "--c1": tp.c1, "--c2": tp.c2, "--i": Math.min(i, 12) }}>
      <div className="sx-band" aria-hidden="true"><span className="sx-orb" /><span className="sx-orb b" /></div>
      <span className="sx-glyph" aria-hidden="true"><Icon name={tp.ic} size={featured ? 30 : 24} /></span>
      <div className="sx-body">
        <div className="sx-top">
          <span className="sx-topic">{isProfile ? t("sx.profileTopic") : label}</span>
          <span className={`sx-state s-${st}`}><Icon name={st === "done" ? "check" : st === "locked" ? "lock" : st === "closed" ? "close" : st === "resume" ? "hourglass" : "bolt"} size={12} /> {t(`sx.state.${st}`)}</span>
        </div>
        <h3 className="sx-name">{row.name}</h3>
        {row.summary ? <p className="sx-sum">{row.summary}</p> : isProfile ? <p className="sx-sum">{tx(`pf3.${tp.k}.text`, t("sx.profileText"))}</p> : null}
        <ul className="sx-meta">
          {mins ? <li><Icon name="clock" size={15} /> <span>{t("sx.min", { n: mins })}</span></li> : null}
          {isProfile && row.questions ? <li><Icon name="surveys" size={15} /> <span>{t("pf.questions", { n: row.questions })}</span></li> : null}
          {left != null && st !== "done" ? <li><Icon name="calendar" size={15} /> <span>{left <= 1 ? t("sx.endsToday") : t("sx.endsIn", { n: left })}</span></li> : null}
          {st === "done" && row.at ? <li><Icon name="check" size={15} /> <span>{relDay(new Date(row.at), t)}</span></li> : null}
        </ul>
        <p className="sx-elig"><Icon name={row.minQualityScore ? "quality" : "check"} size={14} />
          {st === "locked" ? t("sx.eligLocked") : st === "closed" ? t(`sx.closed.${row.participationStatus}`) : st === "done" ? t("sx.eligDone") : row.minQualityScore ? t("sx.eligQuality", { n: row.minQualityScore }) : isProfile ? t("sx.eligProfile") : st === "resume" ? t("sx.eligResume") : t("sx.eligInvited")}
        </p>
        <div className="sx-foot">
          <span className="sx-pts"><span className="sx-coin" aria-hidden="true" /><b>{fmt(Number(row.points) || 0)}</b><small>{type === "teen" ? t("hdr.xp") : t("c.pts")}</small></span>
          {canStart || st === "locked" ? (
            <button type="button" className={`h-btn ${st === "locked" ? "h-btn-soft" : "h-btn-primary"} sx-go`} onClick={() => onStart(row)}
              aria-label={`${st === "locked" ? t("sx.unlock") : cta}: ${row.name}`}>
              {st === "locked" ? <><Icon name="lock" size={16} /> {t("sx.unlock")}</> : <>{cta} <Icon name="arrow" size={17} /></>}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function CardSkeleton() {
  return <li className="sx-card is-skel" aria-hidden="true"><div className="sx-band" /><div className="sx-body"><Skeleton h={14} w="40%" /><Skeleton h={22} w="85%" /><Skeleton h={14} w="60%" /><Skeleton h={44} w="100%" r={14} /></div></li>;
}

export default function SurveysPage({ SurveyHistory }) {
  const router = useRouter();
  const hub = useHub();
  const { type } = hub;
  const member = useMember();
  const query = useQueryParams();
  const gate = useProfileGate();
  const doneProfiles = useCompletedProfiles(member?.category);
  const { active, all } = useSurveys(query?.source);
  const [filter, setFilter] = React.useState("all");
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

  const FILTERS = [
    { k: "all", test: () => true },
    { k: "quick", test: (r) => Number(r.loi) > 0 && Number(r.loi) <= QUICK },
    { k: "top", test: (r) => Number(r.points) > HIGH },
    ...(profileRows.length ? [{ k: "profiles", test: (r) => r.kind === "profile" }] : []),
  ];
  const f = FILTERS.find((x) => x.k === filter) || FILTERS[0];
  const rows = openRows.filter(f.test);
  // the best next one: the most points per minute among those the member can start now
  const startable = openRows.filter((r) => r.state === "available" || r.state === "resume");
  const best = startable.length > 1 ? [...startable].sort((a, b) => (Number(b.points) || 0) / Math.max(1, Number(b.loi) || 1) - (Number(a.points) || 0) / Math.max(1, Number(a.loi) || 1))[0] : null;
  const total = openRows.reduce((n, r) => n + (Number(r.points) || 0), 0);
  const avg = openRows.length ? Math.round(openRows.reduce((n, r) => n + (Number(r.loi) || 0), 0) / openRows.length) : 0;
  const loading = active.isLoading || gate.loading;

  const start = (row) => {
    if (row.state === "locked") { play("tap"); return setGateOpen(true); }
    play("complete");
    if (row.kind === "profile") return router.push(`/member/profiles?profile=${row.slug}`);
    if (PERMITTED.includes(row.participationStatus)) router.push(`/survey?name=${row.slug}`);
  };

  return (
    <div className="pg pg-surveys sx">
      <section className="sx-hero" aria-labelledby="sx-title">
        <div className="sx-hero-bg" aria-hidden="true"><i /><i /><i /></div>
        <div className="sx-hero-main">
          <nav className="hx-crumbs" aria-label={t("c.breadcrumb")}><ol><li><Link href="/member/dashboard">{t("nav.dashboard")}</Link></li><li><span aria-current="page">{t("nav.surveys")}</span></li></ol></nav>
          <p className="hx-eyebrow">{t(`sx.eyebrow.${type}`)}</p>
          <h1 className="sx-title" id="sx-title">{loading ? t("sx.loadingTitle") : !openRows.length ? t("sx.titleNone") : !profileRows.length ? t(surveys.length === 1 ? "sx.titleOne" : "sx.title", { n: surveys.length }) : !surveys.length ? t("sx.titleProfiles", { n: profileRows.length }) : t("sx.titleMix", { n: surveys.length, p: profileRows.length })}</h1>
          <p className="hx-sub">{locked && !gate.loading ? t("sx.subLocked") : t(`sx.sub.${type}`)}</p>
          {locked && !gate.loading ? (
            <div className="hx-actions"><button type="button" className="h-btn h-btn-primary" onClick={() => setGateOpen(true)}><Icon name="lock" size={17} /> {t("sx.whatFirst")}</button></div>
          ) : null}
        </div>
        <div className="sx-scene" aria-hidden="true"><Scene3D kind="surveys" /></div>
        <ul className="sx-kpis" aria-label={t("sx.kpis")}>
          <li><small>{t("sx.kOpen")}</small><b>{loading ? "…" : <Counter value={openRows.length} />}</b></li>
          <li><small>{t("sx.kPoints")}</small><b>{loading ? "…" : openRows.length ? <Counter value={total} /> : "–"}</b></li>
          <li><small>{t("sx.kTime")}</small><b>{loading ? "…" : avg ? t("sx.min", { n: avg }) : "–"}</b></li>
        </ul>
      </section>

      {best && !loading ? (
        <section className="sx-best" aria-labelledby="sx-best-t">
          <h2 className="sx-h" id="sx-best-t"><Icon name="target" size={20} /> {t("sx.bestTitle")}</h2>
          <p className="k-note">{t("sx.bestWhy")}</p>
          <ul className="sx-grid one"><SurveyCard row={best} type={type} locked={locked} onStart={start} featured /></ul>
        </section>
      ) : null}

      <section className="sx-list" aria-labelledby="sx-list-t">
        <div className="sx-list-head">
          <h2 className="sx-h" id="sx-list-t"><Icon name="surveys" size={20} /> {t("sx.listTitle")}</h2>
          <div className="sx-filters" role="tablist" aria-label={t("sx.filterLabel")}>
            {FILTERS.map((x) => {
              const n = openRows.filter(x.test).length;
              if (!n && x.k !== "all" && filter !== x.k) return null; // a filter with nothing in it is not offered
              return (
                <button key={x.k} type="button" role="tab" aria-selected={filter === x.k} className={filter === x.k ? "on" : ""} onClick={() => { setFilter(x.k); play("tap"); }}>
                  {t(`sx.f.${x.k}`)} <span>{n}</span>
                </button>
              );
            })}
          </div>
        </div>
        {active.isError ? <ErrorState onRetry={active.refetch} /> : loading ? (
          <ul className="sx-grid">{[0, 1, 2].map((k) => <CardSkeleton key={k} />)}</ul>
        ) : !openRows.length ? (
          <EmptyState kind="surveys" title={t("sx.emptyTitle")} text={t(`sx.emptyText.${type}`)} action={<Link className="h-btn h-btn-primary" href="/member/profiles">{t("sx.emptyCta")}</Link>} />
        ) : !rows.length ? (
          <p className="sx-none"><Icon name="search" size={18} /> {t("sx.noneInFilter")} <button type="button" className="h-link" onClick={() => setFilter("all")}>{t("sx.showAll")}</button></p>
        ) : (
          <ul className="sx-grid">{rows.map((r, i) => <SurveyCard key={`${r.kind}-${r.slug}`} row={r} type={type} locked={locked} onStart={start} i={i} />)}</ul>
        )}
      </section>

      {history.length ? (
        <Reveal>
          <section className="sx-done" aria-labelledby="sx-done-t">
            <h2 className="sx-h" id="sx-done-t"><Icon name="check" size={20} /> {t("sx.doneTitle")}</h2>
            <ul className="sx-grid compact">{history.map((r, i) => <SurveyCard key={`h-${r.slug}`} row={r} type={type} locked={false} onStart={start} i={i} />)}</ul>
          </section>
        </Reveal>
      ) : null}

      {SurveyHistory ? (
        <section className="sx-history" aria-labelledby="sx-hist-t">
          <h2 className="sx-h" id="sx-hist-t"><Icon name="activity" size={20} /> {t("sx.historyTitle")}</h2>
          <div className="sx-history-box"><SurveyHistory /></div>
        </section>
      ) : null}

      <GateDialog
        open={gateOpen}
        gate={gate}
        onClose={() => setGateOpen(false)}
        onStart={(slug) => { setGateOpen(false); router.push(`/member/profiles?profile=${slug}`); }}
      />
    </div>
  );
}

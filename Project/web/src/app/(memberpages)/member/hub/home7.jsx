"use client";
// v7 dashboards (Kunal round 6, 23 Nov 2026): three different dashboards, not one layout in three colours.
//   Consumer      "Lifestyle"   spotlight hero with a points card · three big next-move cards · a carousel of picked
//                               surveys · today + quality/invite · badge shelf · recent activity
//   Professional  "Executive"   navy hero with the real 6-month earnings chart · a KPI strip · a structured study
//                               table beside profile readiness and the quality gauge · insights · activity ledger
//   Teen          "Level up"    level card with the XP bar · today's quests · guardian status · survey drops ·
//                               badge wall · poll and extras · recent XP
// Every figure comes from useHub() (store.js) or useSurveyDesk() (surveys.jsx). Nothing is invented: a value that is
// still loading shows "…", and a section with nothing real to show says so.
import React from "react";
import Link from "next/link";
import Icon from "./icons.jsx";
import { t } from "./strings";
import { Counter, Reveal, EmptyState, LoadingBlock, Ring } from "./ui.jsx";
import { GuardianStatus } from "./modules.jsx";
import TodayStrip from "./engage/today.jsx";
import ProExtras from "./engage/pro.jsx";
import TeenExtras from "./engage/teen.jsx";
import Scene3D from "./scene.jsx";
import { Avatar } from "./Shell.jsx";
import { useSurveyDesk, SurveyCard } from "./surveys.jsx";
import { achievementsOf, fmt, relDay, monthlyPoints } from "./data";
import { surveyTopic, profileTopic, artOf, profileArt } from "./topics";
import { useHub } from "./store";

const E = (n) => `/hub/3d/${n}.webp`;
const greet = () => { const h = new Date().getHours(); return h < 12 ? "pf.morning" : h < 18 ? "pf.afternoon" : "pf.evening"; };
const unitOf = (type) => (type === "teen" ? t("hdr.xp") : t("c.pts"));
const firstName = (m) => m?.firstname || (m?.fullname || "").split(" ")[0] || "";
const dots = (v, f = (x) => x) => (v == null ? "…" : f(v));

function rowInfo(r, type) {
  const tp = r.kind === "profile" ? profileTopic(r) : surveyTopic(r, type);
  const k = `sx.topic.${tp.k}`;
  const topic = r.kind === "profile" ? t("sx.profileTopic") : t(k) === k ? t("sx.topic.general") : t(k);
  const art = r.kind === "profile" ? profileArt(r.slug, tp) : artOf(tp);
  const cta = r.state === "locked" ? t("sx.unlock") : r.state === "resume" ? t("sx.resume") : r.kind === "profile" ? t("sx.startProfile") : t("v7.start");
  const state = r.state === "locked" ? t("v7.st.locked") : r.state === "resume" ? t("v7.st.resume") : t("v7.st.open");
  return { tp, topic, art, cta, state };
}

export function Head({ title, sub, action, id, art }) {
  return (
    <header className="h7-head">
      {art ? <img className="h7-head-art" src={E(art)} alt="" width="40" height="40" loading="lazy" /> : null}
      <div>
        <h2 className="h7-title" id={id}>{title}</h2>
        {sub ? <p className="h7-sub">{sub}</p> : null}
      </div>
      {action ? <div className="h7-action">{action}</div> : null}
    </header>
  );
}

export function Recent({ hub, art }) {
  const rows = hub.ledger.slice(0, 6);
  return (
    <section className="h7 h7-recent" aria-labelledby="h7-ra">
      <Head id="h7-ra" art={art} title={t("v5.recentTitle")} action={<Link href="/member/activity" className="h7-link">{t("v5.allActivity")} <Icon name="arrow" size={14} /></Link>} />
      {hub.ledgerQ.isLoading ? <LoadingBlock lines={2} h={90} /> : !rows.length ? <EmptyState kind="activity" title={t("ac.emptyTitle")} text={t("ac.emptyText")} /> : (
        <ul className="h7-feed">
          {rows.map((r, i) => (
            <li key={r.id} style={{ "--i": i }}>
              <span className={`h7-feed-ic k-${r.kind}`} aria-hidden="true"><Icon name={r.kind === "survey" ? "surveys" : r.kind === "profile" ? "profile" : "coin"} size={16} /></span>
              <span className="h7-feed-tx"><b>{r.name || t(`ac.${r.kind}`)}</b><small>{r.at ? relDay(r.at, t) : ""}</small></span>
              <em>{r.points ? `+${fmt(r.points)}` : "–"}</em>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Badges({ hub, variant }) {
  const list = achievementsOf({ stats: hub.stats?.data, profiles: hub.profiles?.data, quality: hub.quality, ledger: hub.ledger, referrals: hub.referrals?.data });
  const got = list.filter((x) => x.done).length;
  const ART = { first: "sparkles", ten: "trophy", profile: "verified", quality: "star", consistent: "calendar", referral: "handshake" };
  return (
    <section className={`h7 h7-badges v-${variant}`} aria-labelledby="h7-bd">
      <Head id="h7-bd" art="medal" title={t("v5.milesTitle")} sub={t("v7.badgesSub", { n: got, m: list.length })} />
      <ul className="h7-badge-row">
        {list.map((a, i) => (
          <li key={a.id} className={a.done ? "is-done" : ""} style={{ "--p": Math.round(a.progress * 100), "--i": i }}>
            <span className="h7-badge" aria-hidden="true"><img src={E(ART[a.id] || "star")} alt="" width="40" height="40" loading="lazy" />{a.done ? null : <i className="h7-badge-lock"><Icon name="lock" size={12} /></i>}</span>
            <b>{t(a.label)}</b>
            <small>{a.done ? t("v5.earned") : t(a.hint, a.hintVars)}</small>
            <span className="h7-badge-bar" aria-hidden="true"><i /></span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* =============================================== CONSUMER · Lifestyle =============================================== */
function ConsumerHero({ hub, desk }) {
  const { member, pts, quality } = hub;
  const open = desk.loading ? null : desk.openRows.length;
  const payPct = pts ? Math.min(100, Math.round((pts.total / pts.threshold) * 100)) : 0;
  return (
    <section className="c7-hero" aria-labelledby="c7-h">
      <div className="c7-hero-tx">
        <p className="c7-hello"><Avatar member={member} /> {t(greet(), { name: firstName(member) })}</p>
        <h1 id="c7-h">{t("v7.c.h1a")} <span>{t("v7.c.h1b")}</span></h1>
        <p className="c7-sub">{t("v7.c.sub")}</p>
        <div className="c7-cta">
          <Link href="/member/surveys" className="h-btn h-btn-primary">{open == null ? t("sx.loadingTitle") : open ? t(open === 1 ? "v5.openOne" : "v5.openN", { n: open }) : t("v5.openNone")} <Icon name="arrow" size={16} /></Link>
          <Link href="/member/rewards" className="h-btn h-btn-ghost"><Icon name="gift" size={16} /> {t("v5.viewRewards")}</Link>
        </div>
      </div>
      <div className="c7-hero-art">
        <Scene3D kind="dashboard" />
        <Link href="/member/rewards" className="c7-wallet" aria-label={t("v7.walletAria", { n: pts ? fmt(pts.total) : "…" })}>
          <small>{t("v7.c.wallet")}</small>
          <b>{pts ? <Counter value={pts.total} /> : "…"} <em>{t("c.pts")}</em></b>
          <span className="c7-wallet-bar" aria-hidden="true"><i style={{ "--w": `${payPct}%` }} /></span>
          <span className="c7-wallet-ft"><span>{pts ? t("v5.toPayoutPill", { n: payPct }) : "…"}</span>{quality ? <span><Icon name="quality" size={13} /> {quality.ten.toFixed(1)}/10</span> : null}</span>
        </Link>
      </div>
    </section>
  );
}

export function ConsumerMoves({ hub, desk }) {
  const c = hub.completion;
  const pts = hub.pts;
  const open = desk.loading ? null : desk.openRows.length;
  const left = pts ? Math.max(0, pts.threshold - pts.total) : null;
  const cards = [
    { k: "profile", href: "/member/profiles", art: "sparkle_heart", t: t("v7.c.m1"), v: c ? `${c.pct}%` : "…", s: c ? (c.pct >= 100 ? t("v7.c.m1done") : t("v7.c.m1s", { n: c.remaining.length })) : "", p: c ? c.pct : 0 },
    { k: "surveys", href: "/member/surveys", art: "shoppingbag", t: t("v7.c.m2"), v: dots(open), s: open ? t("v7.c.m2s", { n: fmt(desk.total) }) : t("sx.titleNone"), p: open ? 100 : 0 },
    { k: "rewards", href: "/member/rewards", art: "gift", t: t("v7.c.m3"), v: pts ? fmt(pts.total) : "…", s: left == null ? "" : left ? t("rw.untilMilestone", { n: fmt(left) }) : t("rw.milestoneReached"), p: pts ? Math.min(100, Math.round((pts.total / pts.threshold) * 100)) : 0 },
  ];
  return (
    <nav className="c7-moves" aria-label={t("v7.c.moves")}>
      {cards.map((x, i) => (
        <Link key={x.k} href={x.href} className={`c7-move m-${x.k}`} style={{ "--i": i }}>
          <span className="c7-move-art" aria-hidden="true"><img src={E(x.art)} alt="" width="64" height="64" /></span>
          <span className="c7-move-tx"><small>{x.t}</small><b>{x.v}</b><em>{x.s}</em></span>
          <span className="c7-move-bar" aria-hidden="true"><i style={{ "--w": `${x.p}%` }} /></span>
          <Icon name="arrow" size={18} className="c7-move-go" />
        </Link>
      ))}
    </nav>
  );
}

export function ConsumerPicks({ hub, desk }) {
  const rows = [...desk.startable, ...desk.openRows.filter((r) => !desk.startable.includes(r))].slice(0, 8);
  return (
    <section className="h7 c7-picks" aria-labelledby="c7-pk">
      <Head id="c7-pk" art="sparkles" title={t("v7.c.picks")} sub={desk.loading ? t("sx.loadingTitle") : rows.length ? t("v5.oppSub", { n: desk.openRows.length }) : t("sx.titleNone")}
        action={<Link href="/member/surveys" className="h7-link">{t("v5.allSurveys")} <Icon name="arrow" size={14} /></Link>} />
      {desk.active.isError ? <EmptyState kind="surveys" title={t("c.errorTitle")} text="" /> : desk.loading ? <LoadingBlock lines={2} h={200} /> : !rows.length ? (
        <EmptyState kind="surveys" title={t("sx.emptyTitle")} text={t("sx.emptyText.consumer")} action={<Link className="h-btn h-btn-primary" href="/member/profiles">{t("sx.emptyCta")}</Link>} />
      ) : (
        <ul className="tc-grid">{rows.map((r, i) => <SurveyCard key={`${r.kind}-${r.slug}`} row={r} type="consumer" onStart={desk.start} i={i} />)}</ul>
      )}
      {desk.dialog}
    </section>
  );
}

export function ConsumerSide({ hub }) {
  const q = hub.quality;
  const d = hub.referrals?.data;
  const joined = d?.joinedKnown ? d.joined.length : null;
  return (
    <div className="c7-side">
      <Link href="/member/quality" className="c7-mini q">
        <Ring pct={q ? q.pct : 0} size={84} stroke={8} label={q ? `${q.ten.toFixed(1)}/10` : ""}><b>{q ? q.ten.toFixed(1) : "–"}</b></Ring>
        <span><small>{t("nav.quality")}</small><b>{q ? (q.tier?.label || t(`qs.${q.band}`)) : t("c.loading")}</b><em>{t("v7.c.qHint")}</em></span>
      </Link>
      <Link href="/member/referrals" className="c7-mini r">
        <img src={E("handshake")} alt="" width="64" height="64" loading="lazy" />
        <span><small>{t("v5.invite")}</small><b>{joined == null ? (d ? fmt(d.invited.length) : "…") : joined}</b><em>{!d ? t("c.loading") : joined == null ? t("v5.invitedN", { n: d.invited.length }) : t("v5.joinedN", { n: joined, m: d.invited.length })}</em></span>
      </Link>
    </div>
  );
}

function ConsumerHome({ hub, desk }) {
  return (
    <div className="dash h7-dash c7">
      <ConsumerHero hub={hub} desk={desk} />
      <ConsumerMoves hub={hub} desk={desk} />
      <Reveal><ConsumerPicks hub={hub} desk={desk} /></Reveal>
      <Reveal className="d-today" id="today"><TodayStrip /></Reveal>
      <Reveal><ConsumerSide hub={hub} /></Reveal>
      <Reveal><Badges hub={hub} variant="shelf" /></Reveal>
      <Reveal><Recent hub={hub} art="chart2" /></Reveal>
    </div>
  );
}

/* =============================================== PROFESSIONAL · Executive =============================================== */
export function EarningsChart({ hub }) {
  const m = monthlyPoints(hub.ledger, 6);
  const max = Math.max(1, ...m.map((x) => x.points));
  const W = 320, H = 120;
  const xs = m.map((_, i) => 14 + (i * (W - 28)) / (m.length - 1));
  const ys = m.map((x) => H - 14 - (x.points / max) * (H - 34));
  const line = xs.map((x, i) => `${i ? "L" : "M"}${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
  const total = m.reduce((n, x) => n + x.points, 0);
  return (
    <figure className="p7-chart">
      <figcaption><small>{t("v7.p.earn6")}</small><b>{hub.ledgerQ.isLoading ? "…" : fmt(total)} <em>{t("c.pts")}</em></b></figcaption>
      {hub.ledgerQ.isLoading ? <LoadingBlock lines={1} h={110} /> : (
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={m.map((x) => `${x.label} ${fmt(x.points)}`).join(", ")}>
          {[0.25, 0.5, 0.75].map((g) => <line key={g} x1="0" x2={W} y1={H - 14 - g * (H - 34)} y2={H - 14 - g * (H - 34)} className="p7-grid" />)}
          <path d={`${line} L${xs[xs.length - 1]} ${H - 14} L${xs[0]} ${H - 14} Z`} className="p7-area" />
          <path d={line} className="p7-line" pathLength="100" />
          {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r={i === xs.length - 1 ? 4.5 : 2.5} className={i === xs.length - 1 ? "p7-dot now" : "p7-dot"} />)}
          {m.map((x, i) => <text key={x.key} x={xs[i]} y={H - 1} textAnchor="middle" className="p7-lbl">{x.label}</text>)}
        </svg>
      )}
    </figure>
  );
}

function ProHero({ hub }) {
  const { member } = hub;
  return (
    <section className="p7-hero" aria-labelledby="p7-h">
      <div className="p7-hero-tx">
        <p className="p7-hello"><Avatar member={member} /> {t(greet(), { name: firstName(member) })}</p>
        <h1 id="p7-h">{t("v7.p.h1")}</h1>
        <p className="p7-sub">{t("v7.p.sub")}</p>
        <div className="p7-cta">
          <Link href="/member/surveys" className="h-btn h-btn-primary">{t("v7.p.toStudies")} <Icon name="arrow" size={16} /></Link>
          <Link href="/member/profiles" className="h-btn h-btn-ghost">{t("v5.openProfiles")}</Link>
        </div>
      </div>
      <EarningsChart hub={hub} />
      <div className="p7-hero-art"><Scene3D kind="dashboard" /></div>
    </section>
  );
}

export function ProKpis({ hub, desk }) {
  const { pts, bal, quality: q, completion: c } = hub;
  const k = [
    { k: "bal", href: "/member/rewards", l: t("v7.p.k1"), v: pts ? <Counter value={pts.total} /> : "…", u: t("c.pts"), s: pts ? t("v5.toPayoutPill", { n: Math.min(100, Math.round((pts.total / pts.threshold) * 100)) }) : "", p: pts ? Math.min(100, (pts.total / pts.threshold) * 100) : 0 },
    { k: "pend", href: "/member/activity", l: t("v7.p.k2"), v: bal ? fmt(bal.pending || 0) : "…", u: t("c.pts"), s: t("v7.p.k2s"), p: null },
    { k: "q", href: "/member/quality", l: t("hdr.quality"), v: q ? q.ten.toFixed(1) : "–", u: "/10", s: q ? (q.tier?.label || t(`qs.${q.band}`)) : "", p: q ? q.pct : 0 },
    { k: "prof", href: "/member/profiles", l: t("v7.p.k4"), v: c ? `${c.pct}%` : "…", u: "", s: c ? t("v7.p.k4s", { n: c.done, m: c.total }) : "", p: c ? c.pct : 0 },
    { k: "open", href: "/member/surveys", l: t("v7.p.k5"), v: desk.loading ? "…" : fmt(desk.openRows.length), u: "", s: desk.loading ? "" : t("v7.p.k5s", { n: fmt(desk.total) }), p: null },
  ];
  return (
    <ul className="p7-kpis" aria-label={t("v7.p.kpis")}>
      {k.map((x, i) => (
        <li key={x.k} style={{ "--i": i }}>
          <Link href={x.href}>
            <small>{x.l}</small>
            <b>{x.v}<em>{x.u}</em></b>
            {x.p != null ? <span className="p7-kbar" aria-hidden="true"><i style={{ "--w": `${x.p}%` }} /></span> : <span className="p7-kbar none" aria-hidden="true" />}
            <span className="p7-ks">{x.s}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ProStudies({ desk }) {
  const rows = [...desk.startable, ...desk.openRows.filter((r) => !desk.startable.includes(r))].slice(0, 7);
  return (
    <section className="h7 p7-studies" aria-labelledby="p7-st">
      <Head id="p7-st" title={t("v7.p.studies")} sub={desk.loading ? t("sx.loadingTitle") : rows.length ? t("v5.oppSub", { n: desk.openRows.length }) : t("sx.titleNone")}
        action={<Link href="/member/surveys" className="h7-link">{t("v5.allSurveys")} <Icon name="arrow" size={14} /></Link>} />
      {desk.active.isError ? <EmptyState kind="surveys" title={t("c.errorTitle")} text="" /> : desk.loading ? <LoadingBlock lines={4} h={240} /> : !rows.length ? (
        <EmptyState kind="surveys" title={t("sx.emptyTitle")} text={t("sx.emptyText.professional")} action={<Link className="h-btn h-btn-primary" href="/member/profiles">{t("sx.emptyCta")}</Link>} />
      ) : (
        <div className="p7-table" role="table" aria-label={t("v7.p.studies")}>
          <div className="p7-tr p7-th" role="row"><span role="columnheader">{t("v7.p.colStudy")}</span><span role="columnheader">{t("v7.p.colTime")}</span><span role="columnheader">{t("v7.p.colReward")}</span><span role="columnheader">{t("v7.p.colStatus")}</span><span role="columnheader"><span className="sr-only">{t("v7.start")}</span></span></div>
          {rows.map((r, i) => {
            const x = rowInfo(r, "professional");
            return (
              <div key={`${r.kind}-${r.slug}`} className={`p7-tr is-${r.state}`} role="row" style={{ "--c1": x.tp.c1, "--i": i }}>
                <span role="cell" className="p7-study"><img src={x.art} alt="" width="30" height="30" loading="lazy" /><span><b>{r.name}</b><small>{x.topic}</small></span></span>
                <span role="cell" className="p7-time">{Number(r.loi) ? t("sx.min", { n: Number(r.loi) }) : "–"}</span>
                <span role="cell" className="p7-rew">+{fmt(Number(r.points) || 0)}</span>
                <span role="cell"><span className={`p7-st st-${r.state}`}>{x.state}</span></span>
                <span role="cell"><button type="button" className="p7-go" onClick={() => desk.start(r)} aria-label={`${x.cta}: ${r.name}`}>{r.state === "locked" ? <Icon name="lock" size={13} /> : null}{x.cta}</button></span>
              </div>
            );
          })}
        </div>
      )}
      {desk.dialog}
    </section>
  );
}

export function ProReadiness({ hub }) {
  const c = hub.completion;
  const q = hub.quality;
  const items = c ? c.items.filter((i) => i.kind === "profile" && i.core) : [];
  const a = q ? -90 + (q.pct / 100) * 180 : -90;
  return (
    <aside className="p7-side">
      <section className="h7 p7-ready" aria-labelledby="p7-rd">
        <Head id="p7-rd" title={t("v7.p.ready")} sub={c ? t("v7.p.k4s", { n: c.done, m: c.total }) : t("c.loading")} />
        {!c ? <LoadingBlock lines={3} h={120} /> : (
          <ul className="p7-ready-list">
            {items.map((p, i) => {
              const pct = Math.round(p.progress * 100);
              return (
                <li key={p.key} style={{ "--i": i }} className={p.done ? "is-done" : ""}>
                  <Link href={p.href}><span>{p.label}</span><b>{p.done ? <Icon name="check" size={14} /> : `${pct}%`}</b><span className="p7-rbar" aria-hidden="true"><i style={{ "--w": `${pct}%` }} /></span></Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <Link href="/member/quality" className="h7 p7-gauge" aria-label={`${t("hdr.quality")} ${q ? q.ten.toFixed(1) : "–"}/10`}>
        <small>{t("hdr.quality")}</small>
        <svg viewBox="0 0 200 112" aria-hidden="true">
          <path d="M20 100 A80 80 0 0 1 180 100" className="g-bg" />
          <path d="M20 100 A80 80 0 0 1 180 100" className="g-fg" pathLength="100" style={{ strokeDasharray: `${q ? q.pct : 0} 100` }} />
          <g style={{ transform: `rotate(${a}deg)`, transformOrigin: "100px 100px" }} className="g-needle"><path d="M98 100 L100 38 L102 100 Z" /><circle cx="100" cy="100" r="6" /></g>
        </svg>
        <b>{q ? q.ten.toFixed(1) : "–"}<em>/10</em></b>
        <span>{q ? (q.tier?.label || t(`qs.${q.band}`)) : t("c.loading")}</span>
      </Link>
    </aside>
  );
}

function ProHome({ hub, desk }) {
  return (
    <div className="dash h7-dash p7">
      <ProHero hub={hub} />
      <ProKpis hub={hub} desk={desk} />
      <div className="p7-main">
        <Reveal><ProStudies desk={desk} /></Reveal>
        <Reveal delay={60}><ProReadiness hub={hub} /></Reveal>
      </div>
      <Reveal className="d-today" id="today"><TodayStrip /></Reveal>
      <ProExtras />
      <Reveal><Badges hub={hub} variant="table" /></Reveal>
      <Reveal><Recent hub={hub} /></Reveal>
    </div>
  );
}

/* =============================================== TEEN · Level up =============================================== */
function TeenHero({ hub }) {
  const { member, level, pts } = hub;
  return (
    <section className="t7-hero" aria-labelledby="t7-h">
      <div className="t7-level" aria-label={t("lv.level", { n: level.n })}>
        <span className="t7-hex"><b>{level.n}</b><small>{t("v7.t.lvl")}</small></span>
      </div>
      <div className="t7-hero-tx">
        <p className="t7-hello"><Avatar member={member} /> {t(greet(), { name: firstName(member) })} <span aria-hidden="true">👋</span></p>
        <h1 id="t7-h">{t("v7.t.h1a")} <span>{t("v7.t.h1b")}</span></h1>
        <div className="t7-xp" role="img" aria-label={t("v7.t.xpAria", { n: Math.round(level.pct) })}>
          <span className="t7-xp-bar"><i style={{ "--w": `${level.pct}%` }} /></span>
          <span className="t7-xp-tx"><b>{pts ? <Counter value={pts.total} /> : "…"} {t("hdr.xp")}</b><span>{level.left != null ? t("lv.toNext", { n: fmt(level.left) }) : t("lv.top")}</span></span>
        </div>
        <div className="t7-cta">
          <Link href="/member/surveys" className="h-btn h-btn-primary">{t("v7.t.play")} <Icon name="arrow" size={16} /></Link>
          <Link href="/member/rewards" className="h-btn h-btn-ghost"><Icon name="trophy" size={16} /> {t("v5.viewRewards")}</Link>
        </div>
      </div>
      <div className="t7-hero-art"><Scene3D kind="dashboard" /></div>
    </section>
  );
}

export function TeenQuests({ hub, desk }) {
  const c = hub.completion;
  const q = hub.quality;
  const open = desk.loading ? null : desk.openRows.length;
  const quests = [
    { k: "profile", href: "/member/profiles", art: "smile", t: t("v7.t.q1"), s: c ? (c.pct >= 100 ? t("v7.c.m1done") : t("v7.c.m1s", { n: c.remaining.length })) : "…", p: c ? c.pct : 0, v: c ? `${c.pct}%` : "…" },
    { k: "surveys", href: "/member/surveys", art: "game", t: t("v7.t.q2"), s: open == null ? "…" : open ? t("v7.t.q2s", { n: open }) : t("sx.titleNone"), p: hub.completed ? Math.min(100, hub.completed * 10) : 0, v: dots(hub.completed) },
    { k: "quality", href: "/member/quality", art: "medal", t: t("v7.t.q3"), s: q ? (q.tier?.label || t(`qs.${q.band}`)) : "…", p: q ? q.pct : 0, v: q ? `${q.ten.toFixed(1)}` : "–" },
  ];
  return (
    <section className="h7 t7-quests" aria-labelledby="t7-q">
      <Head id="t7-q" art="target" title={t("v7.t.quests")} sub={t("v7.t.questsSub")} />
      <ul>
        {quests.map((x, i) => (
          <li key={x.k} className={`q-${x.k}`} style={{ "--i": i }}>
            <Link href={x.href}>
              <img src={E(x.art)} alt="" width="56" height="56" />
              <span className="t7-q-tx"><b>{x.t}</b><small>{x.s}</small></span>
              <span className="t7-q-v">{x.v}</span>
              <span className="t7-q-bar" aria-hidden="true"><i style={{ "--w": `${x.p}%` }} /></span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TeenDrops({ desk }) {
  const rows = [...desk.startable, ...desk.openRows.filter((r) => !desk.startable.includes(r))].slice(0, 8);
  return (
    <section className="h7 t7-drops" aria-labelledby="t7-d">
      <Head id="t7-d" art="lightning" title={t("v7.t.drops")} sub={desk.loading ? t("sx.loadingTitle") : rows.length ? t("v5.oppSub", { n: desk.openRows.length }) : t("sx.titleNone")}
        action={<Link href="/member/surveys" className="h7-link">{t("v5.allSurveys")} <Icon name="arrow" size={14} /></Link>} />
      {desk.active.isError ? <EmptyState kind="surveys" title={t("c.errorTitle")} text="" /> : desk.loading ? <LoadingBlock lines={2} h={200} /> : !rows.length ? (
        <EmptyState kind="surveys" title={t("sx.emptyTitle")} text={t("sx.emptyText.teen")} action={<Link className="h-btn h-btn-primary" href="/member/profiles">{t("sx.emptyCta")}</Link>} />
      ) : (
        <ul className="tc-grid">{rows.map((r, i) => <SurveyCard key={`${r.kind}-${r.slug}`} row={r} type="teen" onStart={desk.start} i={i} />)}</ul>
      )}
      {desk.dialog}
    </section>
  );
}

function TeenHome({ hub, desk }) {
  return (
    <div className="dash h7-dash t7">
      <TeenHero hub={hub} />
      <Reveal><TeenQuests hub={hub} desk={desk} /></Reveal>
      <Reveal><GuardianStatus member={hub.member} compact /></Reveal>
      <Reveal><TeenDrops desk={desk} /></Reveal>
      <Reveal><Badges hub={hub} variant="wall" /></Reveal>
      <Reveal className="d-today" id="today"><TodayStrip /></Reveal>
      <TeenExtras />
      <Reveal><Recent hub={hub} art="fire" /></Reveal>
    </div>
  );
}

export default function Home7() {
  const hub = useHub();
  const desk = useSurveyDesk();
  if (hub.type === "professional") return <ProHome hub={hub} desk={desk} />;
  if (hub.type === "teen") return <TeenHome hub={hub} desk={desk} />;
  return <ConsumerHome hub={hub} desk={desk} />;
}

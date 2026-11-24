"use client";
// Three dashboards (v2, Nov 2026 ground-up redesign), three different products on one data source (store.js):
//   Consumer      – "Reward playground": bright hero with a 3D coin orbit, bento grid of unlike cards, ways to earn
//   Professional  – "Command center": slim status band with a KPI ticker, 12-column analytics grid, log tables
//   Teen          – "Quest board": level badge hero, quest cards with XP, sticker shelf, power meter
import React from "react";
import Home8 from "./v8/home.jsx";
import Link from "next/link";
import StatBand from "./statband.jsx";
import Icon from "./icons.jsx";
import { t } from "./strings";
import { Counter, Ring, Meter, Reveal, Skeleton, EmptyState, ErrorState, LoadingBlock, Spark, Coin3D, Hero } from "./ui.jsx";
import { OpportunityCenter, AchievementShelf, ActivityTimeline, ReferralTeaser, GuardianStatus } from "./modules.jsx";
import TodayStrip from "./engage/today.jsx";
import ProExtras from "./engage/pro.jsx";
import TeenExtras from "./engage/teen.jsx";
import { monthlyPoints, fmt, money } from "./data";
import { useHub } from "./store";

function useGreeting() {
  const [g, setG] = React.useState("");
  React.useEffect(() => {
    const h = new Date().getHours();
    setG(h < 12 ? t("greet.morning") : h < 17 ? t("greet.afternoon") : t("greet.evening"));
  }, []);
  return g;
}

// one sentence that joins progress + rewards + next action
function journeyLine(hub) {
  const c = hub.completion;
  if (!c) return t("d2.lineLoading");
  if (c.pct >= 100) return hub.open ? t("d2.lineDoneOpen", { n: fmt(hub.open) }) : t("d2.lineDone");
  return t("d2.line", { pct: c.pct, n: c.remaining.length });
}

function NextAction({ hub, className = "h-btn h-btn-primary h-btn-lg" }) {
  const n = hub.completion?.next;
  if (n) {
    return (
      <Link href={n.href} className={className}>
        {n.kind === "profile" ? t(n.action, { name: n.label }) : t(n.label)} <Icon name="arrow" size={18} />
      </Link>
    );
  }
  return <Link href="/member/surveys" className={className}>{t("d2.openSurveys")} <Icon name="arrow" size={18} /></Link>;
}

/* ---------------- profile completion checklist (shared data, three looks) ---------------- */
export function CompletionList({ hub, max = 5, compact = false }) {
  const c = hub.completion;
  if (hub.profiles.isError) return <ErrorState text={t("d2.profileError")} onRetry={hub.profiles.refetch} />;
  if (!c) return <LoadingBlock lines={4} h={180} />;
  const rows = [...c.remaining, ...c.items.filter((i) => i.done)].slice(0, max);
  return (
    <ul className={`cl ${compact ? "is-compact" : ""}`}>
      {rows.map((i) => (
        <li key={i.key} className={i.done ? "is-done" : i === c.next ? "is-next" : ""}>
          <span className="cl-mark" aria-hidden="true">{i.done ? <Icon name="check" size={14} /> : <Icon name={i.kind === "profile" ? "profile" : i.icon} size={14} />}</span>
          <Link href={i.href} className="cl-tx">
            <b>{i.kind === "profile" ? i.label : t(i.label)}</b>
            <small>{i.done ? t("c.done") : i.kind === "profile" ? `${Math.round(i.progress * 100)}%${i.reward ? ` · +${fmt(i.reward)} ${t("c.pts")}` : ""}` : t("d2.todo")}</small>
          </Link>
          {!i.done && i.kind === "profile" ? <span className="cl-bar" aria-hidden="true"><i style={{ "--w": `${Math.round(i.progress * 100)}%` }} /></span> : null}
        </li>
      ))}
    </ul>
  );
}

/* ============================== CONSUMER ============================== */
function ConsumerHero({ hub }) {
  const g = useGreeting();
  const { member, pts, completion, quality, ledger, level } = hub;
  const months = monthlyPoints(ledger, 6).map((m) => m.points);
  return (
    <Hero
      kind="dash-c"
      id="dc-title"
      eyebrow={t("d2.cEyebrow")}
      title={<>{g ? `${g}, ` : ""}<span className="hx-name">{member?.firstname || ""}</span></>}
      sub={journeyLine(hub)}
      actions={<><NextAction hub={hub} /><Link href="/member/surveys" className="h-btn h-btn-ghost h-btn-lg">{t("d2.openSurveys")}</Link></>}
      art={
        <div className="dc-orbit">
          <Coin3D size={112} label="MFR" />
          <span className="dc-chip c1"><Icon name="coin" size={14} /> {pts ? fmt(pts.total) : "…"} {t("c.pts")}</span>
          <span className="dc-chip c2"><Icon name="rocket" size={14} /> {t("lv.level", { n: level.n })}</span>
          {completion ? <span className="dc-ring"><Ring pct={completion.pct} size={74} stroke={7}><b>{completion.pct}%</b></Ring><small>{t("hdr.profile")}</small></span> : null}
          {quality ? <span className="dc-chip c3"><Icon name="quality" size={14} /> {quality.ten.toFixed(1)}/10</span> : null}
          <span className="dc-spark"><Spark values={months} w={120} h={36} label={t("d2.sparkLabel")} /></span>
          <i className="dc-dot d1" /><i className="dc-dot d2" /><i className="dc-dot d3" />
        </div>
      }
    />
  );
}

function PointsJar({ hub }) {
  const { pts, points, bal } = hub;
  if (points.isError) return <ErrorState onRetry={points.refetch} />;
  if (!pts) return <LoadingBlock lines={3} h={220} />;
  const pct = Math.min(100, (pts.total / pts.threshold) * 100);
  return (
    <section className="dc-jar" aria-labelledby="jar-t">
      <div className="dc-jar-glass" aria-hidden="true"><i style={{ "--h": `${Math.max(8, pct)}%` }} /><span /><span /><span /></div>
      <div className="dc-jar-tx">
        <p className="k-eyebrow" id="jar-t">{t("d2.balance")}</p>
        <p className="dc-jar-n"><Counter value={pts.total} /> <small>{t("c.pts")}</small></p>
        <p className="dc-jar-m">{t("rw.worth", { v: money(pts.total, pts.rate) })}{bal?.pending ? ` · ${t("d2.pending", { n: fmt(bal.pending) })}` : ""}</p>
        <Meter pct={pct} label={t("rw.milestone")} ticks={[25, 50, 75]} />
        <p className="k-note">{pts.total >= pts.threshold ? t("rw.milestoneReached") : t("rw.untilMilestone", { n: fmt(pts.threshold - pts.total) })}</p>
        <Link href="/member/rewards" className="h-btn h-btn-soft">{t("d2.toMarket")} <Icon name="arrow" size={16} /></Link>
      </div>
    </section>
  );
}

function ProfileCard({ hub, title = true }) {
  const c = hub.completion;
  return (
    <section className="k-card k-profile" aria-labelledby="kp-t">
      <div className="k-head">
        <div>
          <p className="k-eyebrow">{t("d2.profileJourney")}</p>
          {title ? <h2 className="k-title" id="kp-t">{c ? (c.pct >= 100 ? t("d2.profileDone") : t("d2.profileLeft", { n: c.remaining.length })) : t("c.loading")}</h2> : null}
        </div>
        {c ? <Ring pct={c.pct} size={64} stroke={7}><b>{c.pct}%</b></Ring> : null}
      </div>
      <CompletionList hub={hub} max={4} />
      {c && c.pointsLeft ? <p className="k-note"><Icon name="gift" size={15} /> {t("d2.profileReward", { n: fmt(c.pointsLeft) })}</p> : null}
    </section>
  );
}

function QualityDial({ hub }) {
  const q = hub.quality;
  return (
    <Link href="/member/quality" className="k-card k-dial" aria-label={q ? `${t("nav.quality")} ${q.ten} / 10` : t("nav.quality")}>
      <p className="k-eyebrow">{t("nav.quality")}</p>
      {q ? (
        <>
          <svg viewBox="0 0 120 70" className="k-dial-svg" aria-hidden="true">
            <path d="M10 64 A50 50 0 0 1 110 64" className="tr" />
            <path d="M10 64 A50 50 0 0 1 110 64" className="fg" pathLength="100" style={{ strokeDasharray: `${q.pct} 100` }} />
          </svg>
          <b className="k-dial-n"><Counter value={q.ten} format={(n) => n.toFixed(1)} /><small>/10</small></b>
          <span className={`k-band b-${q.band}`}>{q.tier?.label || t(`qs.${q.band}`)}</span>
        </>
      ) : <Skeleton h={80} />}
    </Link>
  );
}

function StatTile({ icon, label, value, sub, spark, href, kind }) {
  const body = (
    <>
      <span className="k-tile-ic" aria-hidden="true"><Icon name={icon} size={18} /></span>
      <small>{label}</small>
      <b>{value == null ? "…" : <Counter value={value} />}</b>
      {sub ? <em>{sub}</em> : null}
      {spark ? <Spark values={spark} w={84} h={24} /> : null}
    </>
  );
  return href ? <Link href={href} className={`k-tile k-${kind}`}>{body}</Link> : <div className={`k-tile k-${kind}`}>{body}</div>;
}

function LevelCard({ hub }) {
  const { level } = hub;
  return (
    <section className="k-card k-level" aria-label={t("lv.level", { n: level.n })}>
      <span className="k-level-n" aria-hidden="true">{level.n}</span>
      <div>
        <p className="k-eyebrow">{t("lv.title")}</p>
        <b>{t("lv.level", { n: level.n })}</b>
        <Meter pct={level.pct} label={t("lv.title")} />
        <small>{t("lv.xpLine", { a: fmt(level.into), b: fmt(level.need), n: level.n + 1 })}</small>
      </div>
    </section>
  );
}

function ConsumerDashboard({ hub }) {
  const months = monthlyPoints(hub.ledger, 6);
  return (
    <div className="dash dash-c">
      <ConsumerHero hub={hub} />
      <StatBand hub={hub} />
      <Reveal className="d-today"><TodayStrip /></Reveal>
      <div className="dc-bento">
        <Reveal className="b-jar"><PointsJar hub={hub} /></Reveal>
        <Reveal className="b-prof" delay={60}><ProfileCard hub={hub} /></Reveal>
        <Reveal className="b-dial" delay={90}><QualityDial hub={hub} /></Reveal>
        <Reveal className="b-done" delay={110}><StatTile kind="done" icon="surveys" label={t("d2.completed")} value={hub.completed} spark={months.map((m) => m.points)} href="/member/activity" /></Reveal>
        <Reveal className="b-tasks" delay={130}><StatTile kind="tasks" icon="target" label={t("d2.pendingTasks")} value={hub.tasks} sub={hub.pollOpen ? t("d2.pollWaiting") : null} href="/member/surveys" /></Reveal>
        <Reveal className="b-level" delay={150}><LevelCard hub={hub} /></Reveal>
      </div>
      <Reveal className="dc-opps"><OpportunityCenter opps={hub.opps} variant="board" /></Reveal>
      <div className="dc-pair">
        <Reveal><ActivityTimeline ledger={{ ...hub.ledgerQ, data: hub.ledgerQ.data ? hub.ledger : undefined }} /></Reveal>
        <Reveal delay={60}><AchievementShelf stats={hub.stats} profiles={hub.profiles} quality={hub.quality} ledger={{ ...hub.ledgerQ, data: hub.ledger }} referrals={hub.referrals} /></Reveal>
      </div>
      <Reveal><ReferralTeaser referrals={hub.referrals} /></Reveal>
    </div>
  );
}

/* ============================== PROFESSIONAL ============================== */
function TrendChart({ hub }) {
  const data = monthlyPoints(hub.ledger, 6);
  const max = Math.max(1, ...data.map((d) => d.points));
  const any = data.some((d) => d.points > 0);
  const total = data.reduce((n, d) => n + d.points, 0);
  const last = data[data.length - 1]?.points || 0;
  const prev = data[data.length - 2]?.points || 0;
  const delta = prev ? Math.round(((last - prev) / prev) * 100) : null;
  const W = 560, H = 190, pad = 28;
  const x = (i) => pad + (i * (W - pad * 2)) / (data.length - 1);
  const y = (v) => H - pad - (v / max) * (H - pad * 2);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.points).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${H - pad} L${x(0)},${H - pad} Z`;
  const [hover, setHover] = React.useState(null);
  return (
    <section className="p-panel p-trend" aria-labelledby="tr-title">
      <header className="p-head">
        <div><p className="p-kicker">{t("dp.trend")}</p><h2 className="p-title" id="tr-title">{fmt(total)} <small>{t("c.pts")} · {t("d2.sixMonths")}</small></h2></div>
        {delta != null ? <span className={`p-delta ${delta >= 0 ? "up" : "down"}`}><Icon name="chart" size={14} /> {delta >= 0 ? "+" : ""}{delta}% {t("d2.vsLast")}</span> : null}
      </header>
      {hub.ledgerQ.isLoading ? <Skeleton h={H} r={8} /> : hub.ledgerQ.isError ? <ErrorState onRetry={hub.ledgerQ.refetch} /> : !any ? (
        <EmptyState kind="activity" title={t("dp.trendEmpty")} />
      ) : (
        <div className="p-chart">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={data.map((d) => `${d.label} ${d.points}`).join(", ")} preserveAspectRatio="none">
            <defs>
              <linearGradient id="pArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--accent)" stopOpacity=".35" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1={pad} x2={W - pad} y1={pad + f * (H - pad * 2)} y2={pad + f * (H - pad * 2)} className="p-grid" />)}
            {data.map((d, i) => <rect key={`b${d.key}`} x={x(i) - 9} y={y(d.points)} width="18" height={H - pad - y(d.points)} className="p-bar" rx="2" />)}
            <path d={area} fill="url(#pArea)" />
            <path d={line} className="p-line" pathLength="1" />
            {data.map((d, i) => (
              <g key={d.key} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} className="p-pt-g" aria-label={`${d.label} ${fmt(d.points)}`}>
                <rect x={x(i) - 24} y={0} width={48} height={H} fill="transparent" />
                <circle cx={x(i)} cy={y(d.points)} r={hover === i ? 6 : 3.5} className="p-pt" />
              </g>
            ))}
          </svg>
          <div className="p-axis">{data.map((d) => <span key={d.key}>{d.label}</span>)}</div>
          {hover != null ? <div className="p-tip" style={{ left: `${(x(hover) / W) * 100}%` }} role="status"><b>{fmt(data[hover].points)}</b> {t("c.pts")} · {data[hover].label}</div> : null}
        </div>
      )}
    </section>
  );
}

function Funnel({ hub }) {
  const d = hub.stats.data;
  const total = d ? Math.max(1, d.started) : 1;
  const rows = d ? [
    { k: "complete", label: t("qs.fComplete"), v: d.complete },
    { k: "disq", label: t("qs.fScreened"), v: d.disqualified },
    { k: "drop", label: t("qs.fDropout"), v: d.dropout },
  ] : [];
  return (
    <section className="p-panel p-funnel" aria-labelledby="fn-title">
      <header className="p-head"><div><p className="p-kicker">{t("dp.funnel")}</p><h2 className="p-title" id="fn-title">{hub.completionRate == null ? "–" : `${hub.completionRate}%`} <small>{t("dp.kpiCompletion")}</small></h2></div></header>
      {hub.stats.isLoading ? <Skeleton h={110} r={8} /> : hub.stats.isError ? <ErrorState onRetry={hub.stats.refetch} /> : !d || !d.started ? <EmptyState kind="surveys" title={t("op.emptyTitle")} /> : (
        <table className="p-table">
          <caption className="h-sr">{t("dp.funnelHint")}</caption>
          <tbody>
            {rows.map((r) => (
              <tr key={r.k} className={`r-${r.k}`}>
                <th scope="row">{r.label}</th>
                <td className="p-bar-cell"><span className="p-hbar"><i style={{ "--w": `${(r.v / total) * 100}%` }} /></span></td>
                <td className="p-num">{fmt(r.v)}</td>
                <td className="p-num p-dim">{Math.round((r.v / total) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function Qualification({ hub }) {
  const c = hub.completion;
  return (
    <section className="p-panel p-qual" aria-labelledby="ql-title">
      <header className="p-head">
        <div><p className="p-kicker">{t("dp.qualTitle")}</p><h2 className="p-title" id="ql-title">{c ? `${c.pct}%` : "–"} <small>{t("d2.profileComplete")}</small></h2></div>
        <Link href="/member/profiles" className="h-link">{t("d2.manage")} <Icon name="chevron" size={14} /></Link>
      </header>
      <CompletionList hub={hub} max={6} compact />
    </section>
  );
}

function OpportunityDesk({ hub }) {
  const d = hub.opps.data;
  return (
    <section className="p-panel p-desk" aria-labelledby="od-title">
      <header className="p-head">
        <div><p className="p-kicker">{t("op.title")}</p><h2 className="p-title" id="od-title">{d ? fmt(hub.open) : "–"} <small>{t("d2.openStudies")}</small></h2></div>
        <Link href="/member/surveys" className="h-link">{t("c.viewAll")} <Icon name="chevron" size={14} /></Link>
      </header>
      {hub.opps.isLoading ? <Skeleton h={120} r={8} /> : hub.opps.isError ? <ErrorState text={t("op.errorText")} onRetry={hub.opps.refetch} /> : (
        <table className="p-table">
          <thead><tr><th scope="col">{t("d2.source")}</th><th scope="col" className="p-num">{t("op.all")}</th><th scope="col" className="p-num">{t("op.high")}</th><th scope="col" className="p-num">{t("op.short")}</th></tr></thead>
          <tbody>
            {[["internal", "op.yours"], ["external", "op.partner"]].map(([k, l]) => (
              <tr key={k}>
                <th scope="row"><Link href={`/member/surveys?source=${k}`}>{t(l)}</Link></th>
                <td className="p-num">{fmt(d[k].all)}</td>
                <td className="p-num">{fmt(d[k].high)}</td>
                <td className="p-num">{fmt(d[k].short)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function ActivityLog({ hub }) {
  const rows = hub.ledger.slice(0, 7);
  return (
    <section className="p-panel p-log" aria-labelledby="al-title">
      <header className="p-head">
        <div><p className="p-kicker">{t("ac.recent")}</p><h2 className="p-title" id="al-title">{t("d2.ledger")}</h2></div>
        <Link href="/member/activity" className="h-link">{t("c.viewAll")} <Icon name="chevron" size={14} /></Link>
      </header>
      {hub.ledgerQ.isLoading ? <LoadingBlock lines={5} h={200} /> : hub.ledgerQ.isError ? <ErrorState onRetry={hub.ledgerQ.refetch} /> : !rows.length ? <EmptyState kind="activity" title={t("ac.emptyTitle")} text={t("ac.emptyText")} /> : (
        <table className="p-table p-zebra">
          <thead><tr><th scope="col">{t("d2.date")}</th><th scope="col">{t("d2.item")}</th><th scope="col">{t("d2.type")}</th><th scope="col" className="p-num">{t("c.pts")}</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="p-dim">{r.at ? r.at.toLocaleDateString(undefined, { day: "2-digit", month: "short" }) : "–"}</td>
                <td>{r.name || t(`ac.${r.kind}`)}</td>
                <td><span className={`p-tag k-${r.kind}`}>{t(`ac.${r.kind}`)}</span></td>
                <td className="p-num p-pos">+{fmt(r.points)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function ProHero({ hub }) {
  const g = useGreeting();
  const { member, pts, quality, level, completionRate, open, completion, ledger } = hub;
  const months = monthlyPoints(ledger, 6).map((m) => m.points);
  const kpis = [
    { k: "pts", label: t("dp.kpiEarned"), node: pts ? <Counter value={pts.total} /> : "…", sub: pts ? money(pts.total, pts.rate) : "", spark: months },
    { k: "rate", label: t("dp.kpiCompletion"), node: completionRate == null ? "–" : <><Counter value={completionRate} />%</>, sub: hub.stats.data ? `${fmt(hub.stats.data.complete)} / ${fmt(hub.stats.data.started)}` : "" },
    { k: "q", label: t("dp.kpiQuality"), node: quality ? <Counter value={quality.ten} format={(n) => n.toFixed(1)} /> : "–", sub: quality ? (quality.tier?.label || t(`qs.${quality.band}`)) : "" },
    { k: "open", label: t("dp.potential"), node: open == null ? "…" : <Counter value={open} />, sub: t("dp.potentialHint") },
    { k: "lv", label: t("lv.title"), node: `L${level.n}`, sub: t("lv.toNext", { n: fmt(level.left) }) },
  ];
  return (
    <Hero
      kind="dash-p"
      id="dp-title"
      crumbs={[{ label: "MFR", href: "/member/dashboard" }, { label: t("nav.dashboard") }]}
      title={<>{g ? `${g}, ` : ""}{member?.firstname || ""}</>}
      sub={journeyLine(hub)}
      actions={<><NextAction hub={hub} className="h-btn h-btn-primary" /><Link href="/member/surveys" className="h-btn h-btn-ghost">{t("dp.primary")}</Link></>}
      status={
        <ul className="dp-ticker">
          {kpis.map((k) => (
            <li key={k.k} className={`dp-kpi k-${k.k}`}>
              <small>{k.label}</small>
              <b>{k.node}</b>
              <em>{k.sub}</em>
              {k.spark ? <Spark values={k.spark} w={80} h={22} /> : null}
            </li>
          ))}
        </ul>
      }
      art={completion ? <div className="dp-mark"><Ring pct={completion.pct} size={96} stroke={6}><b>{completion.pct}%</b><small>{t("hdr.profile")}</small></Ring></div> : null}
    />
  );
}

function ProDashboard({ hub }) {
  return (
    <div className="dash dash-p">
      <ProHero hub={hub} />
      <StatBand hub={hub} />
      <Reveal className="d-today"><TodayStrip /></Reveal>
      <div className="dp-grid">
        <Reveal className="g-trend"><TrendChart hub={hub} /></Reveal>
        <Reveal className="g-qual" delay={60}><Qualification hub={hub} /></Reveal>
        <Reveal className="g-funnel"><Funnel hub={hub} /></Reveal>
        <Reveal className="g-desk" delay={60}><OpportunityDesk hub={hub} /></Reveal>
        <Reveal className="g-dial" delay={90}><QualityDial hub={hub} /></Reveal>
      </div>
      <ProExtras />
      <div className="dp-grid dp-grid-2">
        <Reveal className="g-log"><ActivityLog hub={hub} /></Reveal>
        <Reveal className="g-ach" delay={60}><AchievementShelf stats={hub.stats} profiles={hub.profiles} quality={hub.quality} ledger={{ ...hub.ledgerQ, data: hub.ledger }} referrals={hub.referrals} compact /></Reveal>
      </div>
      <Reveal><ReferralTeaser referrals={hub.referrals} /></Reveal>
    </div>
  );
}

/* ============================== TEEN ============================== */
function TeenHero({ hub }) {
  const g = useGreeting();
  const { member, level, pts } = hub;
  return (
    <Hero
      kind="dash-t"
      id="dt-title"
      eyebrow={t("dt.eyebrow")}
      title={<>{g ? `${g}, ` : ""}{member?.firstname || ""} <span className="ht-wave" aria-hidden="true">👋</span></>}
      sub={journeyLine(hub)}
      actions={<><NextAction hub={hub} /><Link href="/member/surveys" className="h-btn h-btn-ghost h-btn-lg">{t("dt.primary")}</Link></>}
      status={member?.parent?.consent === true ? <p className="ht-safe"><Icon name="shield" size={16} /> {t("dt.parent")}</p> : null}
      art={
        <div className="dt-badge">
          <span className="dt-hex" aria-hidden="true">
            <svg viewBox="0 0 100 110"><path d="M50 4l42 24v54L50 106 8 82V28z" /></svg>
            <b>{level.n}</b>
            <small>{t("lv.lvl")}</small>
          </span>
          <div className="dt-xp">
            <b>{level.name || t("lv.level", { n: level.n })}</b>
            <span className="dt-xpbar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level.pct)} aria-label={t("lv.title")}><i style={{ "--w": `${level.pct}%` }} /></span>
            <small>{pts ? `${fmt(pts.total)} ${t("hdr.xp")}` : "…"}{level.left != null ? ` · ${t("lv.toNext", { n: fmt(level.left) })}` : ""}</small>
          </div>
          <span className="dt-sticker s1" aria-hidden="true">★</span>
          <span className="dt-sticker s2" aria-hidden="true">✦</span>
          <span className="dt-sticker s3" aria-hidden="true">●</span>
        </div>
      }
    />
  );
}

function Quests({ hub }) {
  const c = hub.completion;
  const quests = [];
  if (hub.pollOpen) quests.push({ key: "poll", icon: "spark", title: t("d2.qPoll"), sub: t("d2.qPollSub"), href: "#today", state: "available", xp: hub.today.data?.poll?.points || 0 });
  if (c) for (const i of c.remaining.slice(0, 4)) quests.push({ key: i.key, icon: i.kind === "profile" ? "profile" : i.icon, title: i.kind === "profile" ? t(i.action, { name: i.label }) : t(i.label), sub: i.kind === "profile" ? `${Math.round(i.progress * 100)}%` : t("d2.todo"), href: i.href, state: i.progress > 0 ? "progress" : "available", xp: i.reward || 0, pct: Math.round(i.progress * 100) });
  if (hub.open) quests.push({ key: "surveys", icon: "rocket", title: t("d2.qSurveys", { n: hub.open }), sub: t("d2.qSurveysSub"), href: "/member/surveys", state: "available", xp: 0 });
  return (
    <section className="tq" aria-labelledby="tq-title">
      <header className="tq-head"><h2 id="tq-title">{t("d2.quests")}</h2><span className="tq-count">{quests.length}</span></header>
      {!c ? <LoadingBlock lines={3} h={160} /> : !quests.length ? (
        <EmptyState kind="achievements" title={t("d2.questsDone")} text={t("d2.questsDoneText")} />
      ) : (
        <ol className="tq-list">
          {quests.map((q, i) => (
            <li key={q.key} style={{ "--i": i }}>
              <Link href={q.href} className={`tq-card st-${q.state}`}>
                <span className="tq-ic"><Icon name={q.icon} size={22} /></span>
                <span className="tq-tx"><b>{q.title}</b><small>{q.sub}</small></span>
                {q.pct != null ? <span className="tq-bar" aria-hidden="true"><i style={{ "--w": `${q.pct}%` }} /></span> : null}
                {q.xp ? <span className="tq-xp">+{fmt(q.xp)}</span> : <Icon name="arrow" size={18} className="tq-go" />}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function PowerMeter({ hub }) {
  const q = hub.quality;
  return (
    <Link href="/member/quality" className="tp" aria-label={q ? `${t("nav.quality")} ${q.ten} / 10` : t("nav.quality")}>
      <p className="tp-k">{t("d2.power")}</p>
      <span className="tp-cells" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => <i key={i} className={q && i < Math.round(q.ten) ? "on" : ""} style={{ "--i": i }} />)}
      </span>
      <b>{q ? q.ten.toFixed(1) : "–"}<small>/10</small></b>
      <small className="tp-x">{t("qs.howTitle")}</small>
    </Link>
  );
}

function TeenDashboard({ hub }) {
  return (
    <div className="dash dash-t">
      <TeenHero hub={hub} />
      <StatBand hub={hub} />
      <div className="dt-top">
        <Reveal><Quests hub={hub} /></Reveal>
        <div className="dt-side">
          <Reveal delay={60}><PowerMeter hub={hub} /></Reveal>
          <Reveal delay={90}><GuardianStatus member={hub.member} compact /></Reveal>
        </div>
      </div>
      <Reveal className="d-today" id="today"><TodayStrip /></Reveal>
      <TeenExtras />
      <Reveal className="dt-missions"><OpportunityCenter opps={hub.opps} variant="arcade" /></Reveal>
      <div className="dt-pair">
        <Reveal><AchievementShelf stats={hub.stats} profiles={hub.profiles} quality={hub.quality} ledger={{ ...hub.ledgerQ, data: hub.ledger }} referrals={hub.referrals} /></Reveal>
        <Reveal delay={60}><ActivityTimeline ledger={{ ...hub.ledgerQ, data: hub.ledgerQ.data ? hub.ledger : undefined }} /></Reveal>
      </div>
    </div>
  );
}

// Round 6 (v7): each member type has its own dashboard (home7.jsx). journey.jsx (round 4) and the round 3 layouts
// below stay for reference.
export default function MemberDashboard() {
  return <Home8 />;
}
export function LegacyDashboard() {
  const hub = useHub();
  if (hub.type === "professional") return <ProDashboard hub={hub} />;
  if (hub.type === "teen") return <TeenDashboard hub={hub} />;
  return <ConsumerDashboard hub={hub} />;
}

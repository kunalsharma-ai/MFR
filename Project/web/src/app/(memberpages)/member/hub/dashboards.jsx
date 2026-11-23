"use client";
// Three dashboards built from the same modules but with their own hero, layout, colour and motion:
//   Consumer      – "reward ecosystem": a flowing path Activity → Progress → Points → Rewards → Recognition
//   Professional  – "performance terminal": KPI strip, earning trend chart, participation breakdown
//   Teen          – "level-up arena": stage track toward the payout milestone, badges first, parent-approved seal
import React from "react";
import Link from "next/link";
import { useMember } from "@/Context";
import Icon from "./icons.jsx";
import { t } from "./strings";
import { Counter, Ring, Meter, Reveal, Skeleton, EmptyState } from "./ui.jsx";
import { ProfileJourney, OpportunityCenter, AchievementShelf, ActivityTimeline, RewardPeek, ReferralTeaser, GuardianStatus } from "./modules.jsx";
import TodayStrip from "./engage/today.jsx";
import { memberTypeOf, usePoints, useLedger, useStats, useOpportunities, useProfiles, useReferrals, qualityOf, monthlyPoints, fmt, money } from "./data";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? t("greet.morning") : h < 17 ? t("greet.afternoon") : t("greet.evening");
}
function useGreeting() {
  const [g, setG] = React.useState("");
  React.useEffect(() => setG(greeting()), []);
  return g;
}

/* =============================== CONSUMER =============================== */
function ConsumerHero({ member, points, opps, profiles }) {
  const g = useGreeting();
  const d = points.data;
  const pct = d ? Math.min(100, (d.total / d.threshold) * 100) : 0;
  const left = d ? Math.max(0, d.threshold - d.total) : 0;
  const open = opps.data ? opps.data.internal.all + opps.data.external.all : null;
  const steps = [
    { k: "activity", icon: "surveys", label: t("dc.flowActivity"), v: open != null ? fmt(open) : "–" },
    { k: "progress", icon: "profile", label: t("dc.flowProgress"), v: profiles.data ? `${profiles.data.coreAvg}%` : "–" },
    { k: "points", icon: "coin", label: t("dc.flowPoints"), v: d ? fmt(d.total) : "–" },
    { k: "rewards", icon: "rewards", label: t("dc.flowRewards"), v: d ? `${Math.round(pct)}%` : "–" },
    { k: "recognition", icon: "trophy", label: t("dc.flowRecognition"), v: "" },
  ];
  return (
    <section className="hc-hero" aria-labelledby="hc-title">
      <div className="hc-sky" aria-hidden="true">
        <i className="b1" /><i className="b2" /><i className="b3" />
        {Array.from({ length: 10 }).map((_, i) => <span key={i} className="hc-conf" style={{ "--i": i }} />)}
      </div>
      <div className="hc-copy">
        <p className="h-eyebrow">{t("dc.eyebrow")}</p>
        <p className="hc-hello">{g ? `${g}, ` : ""}<b>{member?.firstname || ""}</b></p>
        <h1 className="h-display" id="hc-title">{t("dc.headline")}</h1>
        <p className="h-lead">{t("dc.sub")}</p>
        <div className="h-ctas">
          <Link href="/member/surveys" className="h-btn h-btn-primary h-btn-lg">{t("dc.primary")} <Icon name="arrow" size={20} /></Link>
          <Link href="/member/profiles" className="h-btn h-btn-ghost h-btn-lg">{t("dc.secondary")}</Link>
        </div>
      </div>
      <div className="hc-stage">
        <Ring pct={pct} size={208} stroke={16} className="hc-ring" label={d ? `${fmt(d.total)} ${t("c.points")}` : t("c.loading")}>
          {d ? (
            <>
              <small>{t("hdr.points")}</small>
              <b><Counter value={d.total} /></b>
              <em>{money(d.total, d.rate)}</em>
            </>
          ) : (
            <Skeleton h={34} w={110} />
          )}
        </Ring>
        <p className="hc-left">{d ? (left ? t("dc.toPayout", { n: fmt(left) }) : t("dc.payoutReached")) : " "}</p>
      </div>
      <ol className="hc-flow" aria-label={steps.map((s) => s.label).join(", ")}>
        {steps.map((s, i) => (
          <li key={s.k} className={`hc-node n-${s.k}`} style={{ "--i": i }}>
            <span className="hc-node-orb"><Icon name={s.icon} size={22} /></span>
            <b>{s.label}</b>
            {s.v ? <small>{s.v}</small> : null}
          </li>
        ))}
        <span className="hc-flow-line" aria-hidden="true"><i /></span>
      </ol>
    </section>
  );
}

function ConsumerDashboard() {
  const member = useMember();
  const points = usePoints();
  const ledger = useLedger();
  const stats = useStats();
  const opps = useOpportunities();
  const profiles = useProfiles();
  const referrals = useReferrals();
  const q = qualityOf(member);
  return (
    <div className="dash dash-consumer">
      <ConsumerHero member={member} points={points} opps={opps} profiles={profiles} />
      <Reveal className="d-today"><TodayStrip /></Reveal>
      <div className="dc-grid">
        <Reveal className="dc-journey"><ProfileJourney profiles={profiles} variant="path" /></Reveal>
        <Reveal className="dc-peek" delay={80}><RewardPeek points={points} /></Reveal>
        <Reveal className="dc-opps" delay={60}><OpportunityCenter opps={opps} variant="board" /></Reveal>
        <Reveal className="dc-ach" delay={60}><AchievementShelf stats={stats} profiles={profiles} quality={q} ledger={ledger} referrals={referrals} /></Reveal>
        <Reveal className="dc-act" delay={80}><ActivityTimeline ledger={ledger} /></Reveal>
        <Reveal className="dc-ref" delay={100}><ReferralTeaser referrals={referrals} /></Reveal>
      </div>
    </div>
  );
}

/* =============================== PROFESSIONAL =============================== */
function TrendChart({ ledger }) {
  const data = monthlyPoints(ledger.data || [], 6);
  const max = Math.max(1, ...data.map((d) => d.points));
  const any = data.some((d) => d.points > 0);
  const W = 520;
  const H = 180;
  const pad = 26;
  const x = (i) => pad + (i * (W - pad * 2)) / (data.length - 1);
  const y = (v) => H - pad - (v / max) * (H - pad * 2);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.points).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${H - pad} L${x(0)},${H - pad} Z`;
  const [hover, setHover] = React.useState(null);
  return (
    <section className="hp-trend" aria-labelledby="tr-title">
      <div className="hp-card-head">
        <h2 className="h-h3" id="tr-title"><Icon name="chart" size={20} /> {t("dp.trend")}</h2>
        <small>{t("dp.trendHint")}</small>
      </div>
      {ledger.isLoading ? (
        <Skeleton h={H} r={16} />
      ) : !any ? (
        <EmptyState kind="activity" title={t("dp.trendEmpty")} />
      ) : (
        <div className="hp-chart">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={data.map((d) => `${d.label} ${d.points}`).join(", ")} preserveAspectRatio="none">
            <defs>
              <linearGradient id="hpArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="var(--accent)" stopOpacity=".45" />
                <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={pad} x2={W - pad} y1={pad + f * (H - pad * 2)} y2={pad + f * (H - pad * 2)} className="hp-grid" />)}
            <path d={area} fill="url(#hpArea)" className="hp-area" />
            <path d={line} className="hp-line" pathLength="1" />
            {data.map((d, i) => (
              <g key={d.key} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} className="hp-pt-g">
                <rect x={x(i) - 22} y={0} width={44} height={H} fill="transparent" />
                <circle cx={x(i)} cy={y(d.points)} r={hover === i ? 6 : 4} className="hp-pt" />
              </g>
            ))}
          </svg>
          <div className="hp-axis">{data.map((d) => <span key={d.key}>{d.label}</span>)}</div>
          {hover != null ? (
            <div className="hp-tip" style={{ left: `${(x(hover) / W) * 100}%` }} role="status">
              <b>{fmt(data[hover].points)}</b> {t("c.pts")} · {data[hover].label}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function Funnel({ stats }) {
  const d = stats.data;
  const rows = d
    ? [
        { k: "complete", label: t("qs.fComplete"), v: d.complete },
        { k: "disq", label: t("qs.fScreened"), v: d.disqualified },
        { k: "drop", label: t("qs.fDropout"), v: d.dropout },
      ]
    : [];
  const total = d ? Math.max(1, d.started) : 1;
  return (
    <section className="hp-funnel" aria-labelledby="fn-title">
      <div className="hp-card-head">
        <h2 className="h-h3" id="fn-title"><Icon name="stack" size={20} /> {t("dp.funnel")}</h2>
        <small>{t("dp.funnelHint")}</small>
      </div>
      {stats.isLoading ? <Skeleton h={120} r={14} /> : !d || !d.started ? (
        <EmptyState kind="surveys" title={t("op.emptyTitle")} />
      ) : (
        <ul className="hp-bars">
          {rows.map((r, i) => (
            <li key={r.k} className={`b-${r.k}`} style={{ "--i": i }}>
              <span className="hp-bar-l">{r.label}</span>
              <span className="hp-bar"><i style={{ "--w": `${(r.v / total) * 100}%` }} /></span>
              <b>{fmt(r.v)}</b>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Qualification({ member, profiles }) {
  const p = profiles.data;
  const work = p?.list?.find((x) => x.slug === "professional");
  const rows = [
    { k: "core", label: t("dp.qualCore"), pct: p?.coreAvg ?? 0, v: p ? `${p.coreDone}/${p.core.length}` : "…" },
    { k: "work", label: t("dp.qualWork"), pct: work?.status ?? 0, v: work ? `${work.status}%` : "–" },
    { k: "mail", label: t("dp.qualVerified"), pct: member?.isVerified?.email === "verified" ? 100 : 0, v: member?.isVerified?.email === "verified" ? "✓" : "–" },
  ];
  return (
    <section className="hp-qual" aria-labelledby="ql-title">
      <div className="hp-card-head">
        <h2 className="h-h3" id="ql-title"><Icon name="briefcase" size={20} /> {t("dp.qualTitle")}</h2>
      </div>
      <ul>
        {rows.map((r) => (
          <li key={r.k}>
            <span className="hp-q-l">{r.label}</span>
            <Meter pct={r.pct} label={r.label} />
            <b>{r.v}</b>
          </li>
        ))}
      </ul>
      <Link href={work ? `/member/profiles?profile=professional` : "/member/profiles"} className="h-btn h-btn-soft">{t("dp.secondary")} <Icon name="arrow" size={18} /></Link>
    </section>
  );
}

function ProfessionalHero({ member, points, stats, opps }) {
  const g = useGreeting();
  const q = qualityOf(member);
  const s = stats.data;
  const rate = s && s.started ? Math.round((s.complete / s.started) * 100) : null;
  const open = opps.data ? opps.data.internal.all + opps.data.external.all : null;
  const kpis = [
    { k: "earned", icon: "coin", label: t("dp.kpiEarned"), node: points.data ? <Counter value={points.data.total} /> : "…", sub: points.data ? money(points.data.total, points.data.rate) : "" },
    { k: "rate", icon: "gauge", label: t("dp.kpiCompletion"), node: rate == null ? "–" : <><Counter value={rate} />%</>, sub: s ? `${fmt(s.complete)}/${fmt(s.started)}` : "" },
    { k: "quality", icon: "quality", label: t("dp.kpiQuality"), node: q ? <Counter value={q.score} /> : "–", sub: q?.scale ? `/ ${q.scale}` : "" },
    { k: "studies", icon: "briefcase", label: t("dp.potential"), node: open == null ? "…" : <Counter value={open} />, sub: t("dp.potentialHint") },
  ];
  return (
    <section className="hp-hero" aria-labelledby="hp-title">
      <div className="hp-grid-bg" aria-hidden="true" />
      <div className="hp-hero-top">
        <div>
          <p className="h-eyebrow">{t("dp.eyebrow")}</p>
          <p className="hp-hello">{g ? `${g}, ` : ""}<b>{member?.firstname || ""}</b></p>
          <h1 className="h-display" id="hp-title">{t("dp.headline")}</h1>
          <p className="h-lead">{t("dp.sub")}</p>
        </div>
        <div className="h-ctas">
          <Link href="/member/surveys" className="h-btn h-btn-primary h-btn-lg">{t("dp.primary")} <Icon name="arrow" size={20} /></Link>
          <Link href="/member/profiles?profile=professional" className="h-btn h-btn-ghost h-btn-lg">{t("dp.secondary")}</Link>
        </div>
      </div>
      <ul className="hp-kpis">
        {kpis.map((k, i) => (
          <li key={k.k} className={`hp-kpi k-${k.k}`} style={{ "--i": i }}>
            <span className="hp-kpi-ic"><Icon name={k.icon} size={20} /></span>
            <small>{k.label}</small>
            <b>{k.node}</b>
            <em>{k.sub}</em>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProfessionalDashboard() {
  const member = useMember();
  const points = usePoints();
  const ledger = useLedger();
  const stats = useStats();
  const opps = useOpportunities();
  const profiles = useProfiles();
  const referrals = useReferrals();
  const q = qualityOf(member);
  return (
    <div className="dash dash-pro">
      <ProfessionalHero member={member} points={points} stats={stats} opps={opps} />
      <Reveal className="d-today"><TodayStrip /></Reveal>
      <div className="dp-grid">
        <Reveal className="dp-journey"><ProfileJourney profiles={profiles} variant="ledger" /></Reveal>
        <Reveal className="dp-qual" delay={60}><Qualification member={member} profiles={profiles} /></Reveal>
        <Reveal className="dp-opps"><OpportunityCenter opps={opps} variant="desk" /></Reveal>
        <Reveal className="dp-trend" delay={60}><TrendChart ledger={ledger} /></Reveal>
        <Reveal className="dp-funnel" delay={100}><Funnel stats={stats} /></Reveal>
        <Reveal className="dp-act"><ActivityTimeline ledger={ledger} /></Reveal>
        <Reveal className="dp-ach" delay={60}><AchievementShelf stats={stats} profiles={profiles} quality={q} ledger={ledger} referrals={referrals} compact /></Reveal>
        <Reveal className="dp-ref" delay={80}><ReferralTeaser referrals={referrals} /></Reveal>
      </div>
    </div>
  );
}

/* =============================== TEEN =============================== */
const STAGES = 5;
function TeenHero({ member, points }) {
  const g = useGreeting();
  const d = points.data;
  const step = d ? d.threshold / STAGES : 1;
  const level = d ? Math.min(STAGES, Math.floor(d.total / step) + 1) : 1;
  const inLevel = d ? (level >= STAGES && d.total >= d.threshold ? 100 : ((d.total % step) / step) * 100) : 0;
  const toNext = d && level < STAGES ? Math.ceil(step * level - d.total) : 0;
  return (
    <section className="ht-hero" aria-labelledby="ht-title">
      <div className="ht-bg" aria-hidden="true">
        <i className="g1" /><i className="g2" />
        {Array.from({ length: 8 }).map((_, i) => <span key={i} className="ht-shard" style={{ "--i": i }} />)}
      </div>
      <div className="ht-copy">
        <p className="h-eyebrow">{t("dt.eyebrow")}</p>
        <p className="ht-hello">{g ? `${g}, ` : ""}<b>{member?.firstname || ""}</b> <span className="ht-wave" aria-hidden="true">👋</span></p>
        <h1 className="h-display" id="ht-title">{t("dt.headline")}</h1>
        <p className="h-lead">{t("dt.sub")}</p>
        <div className="h-ctas">
          <Link href="/member/surveys" className="h-btn h-btn-primary h-btn-lg">{t("dt.primary")} <Icon name="rocket" size={20} /></Link>
          <Link href="/member/profiles" className="h-btn h-btn-ghost h-btn-lg">{t("dt.secondary")}</Link>
        </div>
        {member?.parent?.consent === true ? <p className="ht-safe"><Icon name="shield" size={16} /> {t("dt.parent")}</p> : null}
      </div>
      <div className="ht-arena">
        <div className="ht-level" aria-live="polite">
          <span className="ht-level-n">{t("dt.level", { n: level })}</span>
          <b className="ht-pts">{d ? <Counter value={d.total} /> : "…"} <small>{t("c.pts")}</small></b>
          <Meter pct={inLevel} className="ht-xp" label={t("dt.level", { n: level })} />
          <small className="ht-next">{level < STAGES && d ? t("dt.xp", { n: fmt(toNext), m: level + 1 }) : d ? t("rw.milestoneReached") : " "}</small>
        </div>
        <ol className="ht-track" aria-hidden="true">
          {Array.from({ length: STAGES }).map((_, i) => (
            <li key={i} className={i + 1 < level ? "done" : i + 1 === level ? "now" : ""} style={{ "--i": i }}>
              <span><i>{i + 1 < level ? <Icon name="check" size={16} /> : i + 1}</i></span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function TeenDashboard() {
  const member = useMember();
  const points = usePoints();
  const ledger = useLedger();
  const stats = useStats();
  const opps = useOpportunities();
  const profiles = useProfiles();
  const referrals = useReferrals();
  const q = qualityOf(member);
  return (
    <div className="dash dash-teen">
      <TeenHero member={member} points={points} />
      <Reveal className="d-today"><TodayStrip /></Reveal>
      <div className="dt-grid">
        <Reveal className="dt-journey"><ProfileJourney profiles={profiles} variant="quest" /></Reveal>
        <Reveal className="dt-ach" delay={60}><AchievementShelf stats={stats} profiles={profiles} quality={q} ledger={ledger} referrals={referrals} /></Reveal>
        <Reveal className="dt-opps"><OpportunityCenter opps={opps} variant="arcade" /></Reveal>
        <Reveal className="dt-quality" delay={60}>
          <section className="dt-q">
            <p className="h-eyebrow">{t("nav.quality")}</p>
            {q ? (
              <Ring pct={q.pct ?? 0} size={130} stroke={12} label={`${q.score}`}>
                <b><Counter value={q.score} /></b>
                {q.scale ? <small>/ {q.scale}</small> : null}
              </Ring>
            ) : <Skeleton h={130} w={130} r={65} />}
            <Link href="/member/quality" className="h-link">{t("qs.howTitle")} <Icon name="chevron" size={16} /></Link>
          </section>
        </Reveal>
        <Reveal className="dt-act"><ActivityTimeline ledger={ledger} /></Reveal>
        <Reveal className="dt-guard" delay={60}><GuardianStatus member={member} compact /></Reveal>
      </div>
    </div>
  );
}

export default function MemberDashboard() {
  const member = useMember();
  const type = memberTypeOf(member);
  if (type === "professional") return <ProfessionalDashboard />;
  if (type === "teen") return <TeenDashboard />;
  return <ConsumerDashboard />;
}

"use client";
// Section pages (v2, Nov 2026 ground-up redesign). Each section has its own composition, never "hero → 4 cards → table":
//   Rewards   – reward marketplace: coin-stack hero, level track, streak, catalogue, milestones, achievement history
//   Quality   – performance analytics: gauge hero, what → why → how strip, breakdown, strengths vs attention, trend
//   Activity  – a filterable visual timeline merging rewards, quality changes and notices, with a sticky month rail
//   Referrals – a network constellation with live counts, share studio and invitation tracker
//   Settings  – personalization control center (see ./settings.jsx)
import React from "react";
import Link from "next/link";
import Scene3D from "./scene.jsx";
import { useMember } from "@/Context";
import { api } from "@/util";
import Icon from "./icons.jsx";
import { t } from "./strings";
import { Counter, Ring, Meter, Reveal, Skeleton, EmptyState, ErrorState, LoadingBlock, Hero, Coin3D } from "./ui.jsx";
import { AchievementShelf } from "./modules.jsx";
import { BalanceStrip, StreakCard, PendingPanel, LedgerTable } from "./engage/activity.jsx";
import { RewardsExtras } from "./engage/rewards.jsx";
import { QualityTiers, QualityTrend, ReferralExtras, ReferralStatus, ShareButtons } from "./engage/growth.jsx";
import { monthlyPoints, fmt, money, relDay } from "./data";
import { useHub, levelStart } from "./store";
import { useAlerts } from "./Shell.jsx";
import { locale } from "./prefs";
import Hero8 from "./v8/hero.jsx";
import RewardMachine8 from "./v8/machine.jsx";
import { play } from "./sound";

export { SettingsPage } from "./settings.jsx";

const crumbs = (label) => [{ label: t("nav.dashboard"), href: "/member/dashboard" }, { label }];

/* =============================== REWARDS =============================== */
function LevelTrack({ hub }) {
  const { level, type } = hub;
  const nodes = [0, 1, 2, 3].map((k) => level.n + k);
  return (
    <section className="rw-level" aria-labelledby="rwl-t">
      <div className="rw-level-head">
        <div>
          <p className="k-eyebrow">{t("lv.current")}</p>
          <h2 id="rwl-t" className="k-title">{level.name ? `${t("lv.level", { n: level.n })} · ${level.name}` : t("lv.level", { n: level.n })}</h2>
        </div>
        <p className="rw-xp"><b>{fmt(level.into)}</b> / {fmt(level.need)} {type === "teen" ? t("hdr.xp") : t("c.pts")}</p>
      </div>
      <ol className="rw-track">
        {nodes.map((n, i) => (
          <li key={n} className={i === 0 ? "now" : ""} style={{ "--i": i }}>
            <span className="rw-node">{i === 0 ? <Icon name="star" size={16} /> : n}</span>
            <small>{i === 0 ? t("lv.you") : `${fmt(levelStart(n))}`}</small>
            {i === 0 ? <span className="rw-seg"><i style={{ "--w": `${level.pct}%` }} /></span> : i < nodes.length - 1 ? <span className="rw-seg" /> : null}
          </li>
        ))}
      </ol>
      <p className="k-note">{level.left != null ? t("lv.xpLine", { a: fmt(level.into), b: fmt(level.need), n: level.n + 1 }) : t("lv.top")} {t("lv.how")}</p>
    </section>
  );
}

function Milestones({ hub }) {
  const d = hub.pts;
  if (!d) return <LoadingBlock lines={4} h={220} />;
  const rungs = [0.25, 0.5, 0.75, 1].map((f) => Math.round(d.threshold * f));
  return (
    <section className="rw-miles" aria-labelledby="rwm-t">
      <h2 className="k-title" id="rwm-t"><Icon name="target" size={18} /> {t("rw2.upcoming")}</h2>
      <ol className="rl">
        {rungs.map((r, i) => {
          const done = d.total >= r;
          const now = !done && (i === 0 || d.total >= rungs[i - 1]);
          const from = i ? rungs[i - 1] : 0;
          return (
            <li key={r} className={`${done ? "done" : ""} ${now ? "now" : ""}`} style={{ "--i": i }}>
              <span className="rl-gem">{done ? <Icon name="check" size={16} /> : <Icon name={i === rungs.length - 1 ? "trophy" : "lock"} size={16} />}</span>
              <span className="rl-tx"><b>{fmt(r)} {t("c.pts")}</b><small>{i === rungs.length - 1 ? t("rw.milestone") : done ? t("c.unlocked") : now ? t("rw2.left", { n: fmt(r - d.total) }) : t("c.locked")}</small></span>
              {now ? <Meter pct={((d.total - from) / (r - from)) * 100} label={`${fmt(r)}`} /> : null}
            </li>
          );
        })}
      </ol>
      <p className="k-note"><Icon name="wallet" size={15} /> {hub.type === "teen" ? t("rw2.teenNote") : t("rw.payoutNote")}</p>
    </section>
  );
}

export function RewardsPage() {
  const hub = useHub();
  const { pts, points, ledger, ledgerQ, level, type } = hub;
  const fromSurveys = ledger.filter((r) => r.kind === "survey").reduce((n, r) => n + r.points, 0);
  const fromOther = ledger.filter((r) => r.kind !== "survey").reduce((n, r) => n + r.points, 0);
  const goal = pts ? [0.25, 0.5, 0.75, 1].map((f) => Math.round(pts.threshold * f)).find((r) => pts.total < r) ?? null : null;
  const goalPct = pts && goal ? Math.min(100, Math.round((pts.total / goal) * 100)) : 100;
  return (
    <div className="pg pg-rewards">
      <Hero8
        kind="rewards"
        id="rv-title"
        crumbs={crumbs(t("nav.rewards"))}
        eyebrow={t("rw2.eyebrow")}
        title={t("rw3.title")}
        sub={points.isError ? null : pts ? (goal ? t("rw3.toGoal", { n: fmt(goal - pts.total), g: fmt(goal) }) : t("rw3.goalReached")) : t("c.loading")}
        status={points.isError ? <ErrorState onRetry={points.refetch} /> : null}
        actions={<>
          <a href="#reward-machine" className="h-btn h-btn-primary"><Icon name="gift" size={18} /> {t(`v8.m.open.${type}`)}</a>
          <Link href="/member/surveys" className="h-btn h-btn-ghost">{t("rw.waySurvey")} <Icon name="arrow" size={16} /></Link>
        </>}
        stats={[
          { label: type === "teen" ? t("rw3.xpBalance") : t("rw.balance"), value: pts ? <Counter value={pts.total} duration={1600} /> : "…", unit: type === "teen" ? t("hdr.xp") : t("c.pts"), pct: goalPct, tone: "a" },
          ...(pts && type !== "teen" ? [{ label: t("v8.worth"), value: money(pts.total, pts.rate), tone: "b" }] : []),
          { label: t("v8.levelL"), value: t("lv.level", { n: level.n }), pct: level.pct, tone: "c" },
          ...(hub.bal?.pending ? [{ label: t("v8.pendingL"), value: fmt(hub.bal.pending), unit: t("c.pts"), tone: "d" }] : []),
        ]}
      />
      <RewardMachine8 />
      <div className="rv-top">
        <Reveal><LevelTrack hub={hub} /></Reveal>
        <Reveal delay={60}><StreakCard compact /></Reveal>
      </div>
      <h2 className="sec-h" id="catalogue-h"><Icon name="gift" size={20} /> {t("rw2.available")}</h2>
      <RewardsExtras />
      <div className="rv-grid">
        <Reveal><Milestones hub={hub} /></Reveal>
        <Reveal delay={60}>
          <section className="rv-split" aria-label={`${t("rw.fromSurveys")}, ${t("rw.fromProfiles")}`}>
            <h2 className="k-title"><Icon name="layers" size={18} /> {t("rw2.where")}</h2>
            <div className="rv-split-body">
              <Ring pct={fromSurveys + fromOther ? (fromSurveys / (fromSurveys + fromOther)) * 100 : 0} size={132} stroke={16}><b>{fmt(fromSurveys + fromOther)}</b><small>{t("c.pts")}</small></Ring>
              <ul className="rv-legend">
                <li className="l-s"><i /> {t("rw.fromSurveys")} <b>{fmt(fromSurveys)}</b></li>
                <li className="l-p"><i /> {t("rw2.fromOther")} <b>{fmt(fromOther)}</b></li>
              </ul>
            </div>
            <div className="rv-ways">
              <Link href="/member/profiles" className="rv-way"><Icon name="profile" size={18} /> {t("rw.wayProfile")}</Link>
              <Link href="/member/surveys" className="rv-way"><Icon name="surveys" size={18} /> {t("rw.waySurvey")}</Link>
              {type !== "teen" ? <Link href="/member/referrals" className="rv-way"><Icon name="referrals" size={18} /> {t("rw.wayRefer")}</Link> : null}
            </div>
          </section>
        </Reveal>
      </div>
      <Reveal><AchievementShelf stats={hub.stats} profiles={hub.profiles} quality={hub.quality} ledger={{ ...ledgerQ, data: ledger }} referrals={hub.referrals} /></Reveal>
      <Reveal>
        <section className="rv-history" aria-labelledby="rh-title">
          <h2 className="k-title" id="rh-title"><Icon name="coin" size={18} /> {t("rw2.activity")}</h2>
          {ledgerQ.isLoading ? <LoadingBlock lines={5} h={240} /> : ledgerQ.isError ? <ErrorState onRetry={ledgerQ.refetch} /> : !ledger.length ? (
            <EmptyState kind="rewards" title={t("rw.historyEmpty")} text={t("rw.historyEmptyText")} action={<Link href="/member/profiles" className="h-btn h-btn-primary">{t("pj.cta")}</Link>} />
          ) : (
            <ul className="rh-shelf">
              {ledger.slice(0, 12).map((r, i) => (
                <li key={r.id} className={`rh-item k-${r.kind}`} style={{ "--i": Math.min(i, 12) }}>
                  <span className="rh-token"><Icon name={r.kind === "survey" ? "surveys" : r.kind === "profile" ? "profile" : "coin"} size={18} /></span>
                  <span className="rh-tx"><b>{r.name || t(`ac.${r.kind}`)}</b><small>{t(`ac.${r.kind}`)} · {relDay(r.at, t)}</small></span>
                  <span className="rh-pts">+{fmt(r.points)}</span>
                </li>
              ))}
            </ul>
          )}
          {ledger.length > 12 ? <Link href="/member/activity" className="h-link">{t("c.viewAll")} <Icon name="chevron" size={14} /></Link> : null}
        </section>
      </Reveal>
    </div>
  );
}

/* =============================== QUALITY SCORE =============================== */
function derivedFactors(hub) {
  const s = hub.stats.data;
  const p = hub.profiles.data;
  const verified = hub.member?.isVerified?.email === "verified";
  return [
    { key: "finish", pct: s && s.started ? Math.round((s.complete / s.started) * 100) : 0, v: s && s.started ? `${Math.round((s.complete / s.started) * 100)}%` : "–", good: !s || !s.started || s.dropout <= s.complete / 4 },
    { key: "profiles", pct: p && p.list.length ? Math.round((p.done / p.list.length) * 100) : 0, v: p ? `${p.done}/${p.list.length}` : "–", good: Boolean(p && p.coreDone === p.core.length) },
    { key: "verified", pct: verified ? 100 : 0, v: verified ? t("c.yes") : t("c.no"), good: verified },
  ];
}
function factorsOf(hub) {
  const f = hub.quality?.factors;
  if (!Array.isArray(f) || !f.length) return derivedFactors(hub);
  return f.map((x) => {
    if (x.key === "verified") return { key: x.key, pct: x.value ? 100 : 0, v: x.value ? t("c.yes") : t("c.no"), good: Boolean(x.good) };
    if (x.of != null) return { key: x.key, pct: x.of ? Math.round((x.value / x.of) * 100) : 0, v: `${x.value}/${x.of}`, good: Boolean(x.good) };
    return { key: x.key, pct: Math.max(0, Math.min(100, Number(x.value) || 0)), v: `${x.value}${x.unit || ""}`, good: Boolean(x.good) };
  });
}

function Gauge({ q }) {
  const angle = q ? -120 + (q.pct / 100) * 240 : -120;
  return (
    <div className="qs-gauge" role="img" aria-label={q ? `${t("qs.title")} ${q.ten} / 10` : t("c.loading")}>
      <svg viewBox="0 0 240 170" aria-hidden="true">
        <defs>
          <linearGradient id="qsG" x1="0" x2="1"><stop offset="0" stopColor="#ef4444" /><stop offset=".45" stopColor="#f59e0b" /><stop offset="1" stopColor="#10b981" /></linearGradient>
        </defs>
        <path d="M42.06 165 A90 90 0 1 1 197.94 165" className="qs-track" />
        <path d="M42.06 165 A90 90 0 1 1 197.94 165" className="qs-arc" pathLength="100" style={{ strokeDasharray: `${q?.pct ?? 0} 100` }} />
        {Array.from({ length: 11 }).map((_, i) => {
          const a = ((-210 + i * 24) * Math.PI) / 180;
          return <line key={i} x1={120 + Math.cos(a) * 68} y1={120 + Math.sin(a) * 68} x2={120 + Math.cos(a) * 77} y2={120 + Math.sin(a) * 77} className="qs-tick" />;
        })}
        <g className="qs-needle" style={{ transform: `rotate(${angle}deg)` }}><path d="M120 120 L116 118 L120 56 L124 118 Z" /><circle cx="120" cy="120" r="8" /></g>
      </svg>
      <div className="qs-read">
        <b>{q ? <Counter value={q.ten} format={(n) => n.toFixed(1)} /> : "…"}<small>/10</small></b>
        {q ? <span className={`qs-band b-${q.band}`}>{q.tier?.label || t(`qs.${q.band}`)}</span> : null}
      </div>
    </div>
  );
}

export function QualityPage() {
  const hub = useHub();
  const q = hub.quality;
  const factors = factorsOf(hub);
  const strengths = factors.filter((f) => f.good);
  const watch = factors.filter((f) => !f.good);
  const tips = [];
  const c = hub.completion;
  if (c && c.remaining.some((i) => i.kind === "profile")) tips.push({ icon: "profile", text: t("qs.tipProfile"), href: "/member/profiles", reward: c.pointsLeft });
  if (hub.stats.data?.dropout > 0) tips.push({ icon: "surveys", text: t("qs.tipFinish"), href: "/member/surveys" });
  if (hub.member?.isVerified?.email !== "verified") tips.push({ icon: "mail", text: t("q2.tipVerify"), href: "/member/myaccount#identity" });
  if (watch.some((f) => f.key === "active")) tips.push({ icon: "calendar", text: t("q2.tipActive"), href: "/member/services" });
  tips.push({ icon: "eye", text: t("qs.tipHonest") });
  return (
    <div className="pg pg-quality">
      <Hero
        kind="quality"
        id="qs-title"
        crumbs={crumbs(t("nav.quality"))}
        eyebrow={t("qs.eyebrow")}
        title={t("qs.title")}
        sub={q ? t("q2.sub", { ten: q.ten.toFixed(1), raw: fmt(q.raw), scale: fmt(q.scale) }) : t("c.loading")}
        status={
          <ol className="qs-why">
            <li><span>1</span><b>{t("q2.what")}</b><small>{q ? `${q.ten.toFixed(1)} / 10 · ${q.tier?.label || t(`qs.${q.band}`)}` : "…"}</small></li>
            <li><span>2</span><b>{t("q2.why")}</b><small>{t("q2.whyShort", { n: strengths.length, m: factors.length })}</small></li>
            <li><span>3</span><b>{t("q2.how")}</b><small>{t("q2.howShort", { n: tips.length })}</small></li>
          </ol>
        }
        score={q ? q.ten : null}
      />
      <div className="qs-grid">
        <Reveal className="qs-breakdown">
          <section aria-labelledby="qf-title">
            <h2 className="k-title" id="qf-title"><Icon name="gauge" size={18} /> {t("q2.breakdown")}</h2>
            <ul className="qf">
              {factors.map((f, i) => (
                <li key={f.key} className={f.good ? "good" : "watch"} style={{ "--i": i }}>
                  <span className="qf-mark" aria-hidden="true"><Icon name={f.good ? "check" : "alert"} size={14} /></span>
                  <span className="qf-l"><b>{t(`qf.${f.key}`)}</b><small>{f.good ? t("q2.good") : t("q2.watch")}</small></span>
                  <Meter pct={f.pct} label={t(`qf.${f.key}`)} />
                  <b className="qf-v">{f.v}</b>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
        <Reveal className="qs-sw" delay={60}>
          <section className="qs-col good" aria-labelledby="qsg-t">
            <h2 className="k-title" id="qsg-t"><Icon name="check" size={18} /> {t("q2.strengths")}</h2>
            {strengths.length ? <ul>{strengths.map((f) => <li key={f.key}>{t(`qf.${f.key}`)} <b>{f.v}</b></li>)}</ul> : <p className="k-note">{t("q2.noneYet")}</p>}
          </section>
          <section className="qs-col watch" aria-labelledby="qsw-t">
            <h2 className="k-title" id="qsw-t"><Icon name="alert" size={18} /> {t("q2.attention")}</h2>
            {watch.length ? <ul>{watch.map((f) => <li key={f.key}>{t(`qf.${f.key}`)} <b>{f.v}</b></li>)}</ul> : <p className="k-note">{t("q2.allGood")}</p>}
          </section>
        </Reveal>
        <Reveal className="qs-how">
          <section aria-labelledby="qh-title">
            <h2 className="k-title" id="qh-title"><Icon name="spark" size={18} /> {t("qs.howTitle")}</h2>
            <ol className="qs-tips">
              {tips.map((x, i) => (
                <li key={i} style={{ "--i": i }}>
                  <span className="qs-tip-ic"><Icon name={x.icon} size={18} /></span>
                  {x.href ? <Link href={x.href}>{x.text}</Link> : <p>{x.text}</p>}
                  {x.reward ? <span className="qs-tip-r">+{fmt(x.reward)} {t("c.pts")}</span> : null}
                </li>
              ))}
            </ol>
            <p className="k-note">{t("qs.benefitText")}</p>
          </section>
        </Reveal>
        <Reveal className="qs-tiers" delay={60}><QualityTiers /></Reveal>
        <Reveal className="qs-trend">
          <section aria-labelledby="qhh-title">
            <h2 className="k-title" id="qhh-title"><Icon name="chart" size={18} /> {t("qs.history")}</h2>
            <QualityTrend />
          </section>
        </Reveal>
      </div>
    </div>
  );
}

/* =============================== ACTIVITY =============================== */
const KIND_ICON = { survey: "surveys", profile: "profile", reward: "coin", quality: "quality", notice: "bell" };

export function ActivityPage() {
  const hub = useHub();
  const alerts = useAlerts();
  const [filter, setFilter] = React.useState("all");
  const events = [
    ...hub.ledger.map((r) => ({ id: `l-${r.id}`, kind: r.kind, at: r.at, title: r.points ? `+${fmt(r.points)} ${t("c.points")}` : t(`ac.${r.kind}`), sub: `${t(`ac.${r.kind}`)}${r.name ? ` · ${r.name}` : ""}`, pts: r.points })),
    ...(hub.quality?.history || []).map((h) => ({ id: `q-${h.month}`, kind: "quality", at: new Date(`${h.month}-01T12:00:00`), title: t("a2.qualityTitle", { n: (Math.round((h.score / hub.quality.scale) * 100) / 10).toFixed(1) }), sub: t("a2.qualitySub") })),
    ...(alerts.data || []).map((a) => ({ id: `n-${a.id}`, kind: "notice", at: a.at, title: a.subtitle || a.title, sub: a.title })),
  ].filter((e) => e.at).sort((a, b) => b.at - a.at);
  const kinds = ["all", "survey", "profile", "reward", "quality", "notice"].filter((k) => k === "all" || events.some((e) => e.kind === k));
  const shown = filter === "all" ? events : events.filter((e) => e.kind === filter);
  const groups = [];
  for (const e of shown.slice(0, 60)) {
    const k = `${e.at.getFullYear()}-${e.at.getMonth()}`;
    let g = groups.find((x) => x.k === k);
    if (!g) groups.push((g = { k, label: e.at.toLocaleDateString(locale(), { month: "long", year: "numeric" }), items: [], pts: 0 }));
    g.items.push(e);
    g.pts += e.pts || 0;
  }
  const months = monthlyPoints(hub.ledger, 6);
  const thisMonth = months[months.length - 1]?.points || 0;
  return (
    <div className="pg pg-activity">
      <Hero
        kind="activity"
        id="ac-title"
        crumbs={crumbs(t("nav.activity"))}
        eyebrow={t("ac.eyebrow")}
        title={t("ac.title")}
        sub={t("a2.sub")}
        status={
          <ul className="ac-pulse">
            <li><b>{hub.ledgerQ.data ? <Counter value={events.length} /> : "…"}</b><small>{t("a2.events")}</small></li>
            <li><b><Counter value={thisMonth} /></b><small>{t("a2.thisMonth")}</small></li>
            <li><b>{hub.completed == null ? "…" : <Counter value={hub.completed} />}</b><small>{t("qs.fComplete")}</small></li>
          </ul>
        }
        art={
          <svg className="ac-wave" viewBox="0 0 320 120" aria-hidden="true">
            <path d="M0 70 L40 70 L55 30 L72 100 L88 50 L100 70 L150 70 L165 20 L182 95 L198 60 L210 70 L320 70" />
            <circle cx="320" cy="70" r="5" />
          </svg>
        }
      />
      <Reveal><BalanceStrip /></Reveal>
      <div className="ac-layout">
        <div className="ac-main">
          <div className="ac-filters" role="toolbar" aria-label={t("a2.filter")}>
            {kinds.map((k) => (
              <button key={k} type="button" className={filter === k ? "on" : ""} aria-pressed={filter === k} onClick={() => { setFilter(k); play("tap"); }}>
                {k !== "all" ? <Icon name={KIND_ICON[k]} size={15} /> : null} {t(`a2.k.${k}`)}
              </button>
            ))}
          </div>
          {hub.ledgerQ.isLoading ? <LoadingBlock lines={6} h={320} /> : hub.ledgerQ.isError ? <ErrorState onRetry={hub.ledgerQ.refetch} /> : !groups.length ? (
            <EmptyState kind="activity" title={t("ac.emptyTitle")} text={t("ac.emptyText")} action={<Link href="/member/services" className="h-btn h-btn-primary">{t("nav.services")}</Link>} />
          ) : (
            <ol className="tl">
              {groups.map((g) => (
                <li key={g.k} className="tl-month">
                  <h2 className="tl-m"><span>{g.label}</span>{g.pts ? <small>+{fmt(g.pts)} {t("c.pts")}</small> : null}</h2>
                  <ol>
                    {g.items.map((e, i) => (
                      <li key={e.id} className={`tl-ev k-${e.kind}`} style={{ "--i": Math.min(i, 10) }}>
                        <span className="tl-dot" aria-hidden="true"><Icon name={KIND_ICON[e.kind] || "spark"} size={16} /></span>
                        <div className="tl-card">
                          <b>{e.title}</b>
                          <small>{e.sub}</small>
                        </div>
                        <time dateTime={e.at.toISOString()}>{relDay(e.at, t)}</time>
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
          )}
        </div>
        <aside className="ac-side">
          <Reveal><StreakCard /></Reveal>
          <Reveal delay={60}><PendingPanel /></Reveal>
        </aside>
      </div>
      <details className="ac-statement">
        <summary><Icon name="book" size={18} /> {t("a2.statement")}</summary>
        <LedgerTable />
      </details>
    </div>
  );
}

/* =============================== REFERRALS =============================== */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function ReferralsPage() {
  const member = useMember();
  const hub = useHub();
  const ref = hub.referrals;
  const [link, setLink] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [emails, setEmails] = React.useState("");
  const [state, setState] = React.useState({ phase: "idle", msg: "" });
  React.useEffect(() => {
    if (member?._id) setLink(`${window.location.origin}/?ref=${member._id}&signup`);
  }, [member?._id]);
  const d = ref.data;
  const nodes = [
    { k: "invited", icon: "mail", label: t("rf.invited"), v: d ? d.invited.length : null },
    { k: "joined", icon: "users", label: t("rf.joined"), v: d ? (d.joinedKnown ? d.joined.length : null) : null },
    { k: "verified", icon: "quality", label: t("rf.verified"), v: d ? (d.joinedKnown ? d.joined.filter((x) => x.verified).length : null) : null },
  ];
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      play("complete");
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      /* clipboard blocked: the link is still selectable */
    }
  }
  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: "MyFrequentRewards", url: link }); } catch (e) { /* cancelled */ }
    } else copy();
  }
  async function send(e) {
    e.preventDefault();
    const list = [...new Set(emails.split(/[\s,;]+/).map((x) => x.trim().toLowerCase()).filter(Boolean))];
    if (!list.length || list.some((x) => !EMAIL.test(x))) {
      setState({ phase: "error", msg: t("rf.bad") });
      play("error");
      return;
    }
    setState({ phase: "sending", msg: "" });
    const r = await api.post("/api/v1/me/invite", { emails: list });
    if (r && r.status !== "error") {
      const sent = r.data?.invited?.length ?? 0;
      const already = r.data?.alreadyRegistered?.length ?? 0;
      setState({ phase: "done", msg: `${t("rf.sent", { n: sent })}${already ? ` · ${t("rf.already", { n: already })}` : ""}` });
      setEmails("");
      play("complete");
      ref.refetch();
    } else setState({ phase: "error", msg: t("c.errorTitle") });
  }
  return (
    <div className="pg pg-referrals">
      <Hero
        kind="referrals"
        id="rf-title"
        crumbs={crumbs(t("nav.referrals"))}
        eyebrow={t("rf.eyebrow")}
        title={t("rf.title")}
        sub={t("rf.sub")}
        status={
          <ul className="rf-counts">
            {nodes.map((n) => <li key={n.k}><Icon name={n.icon} size={16} /><b>{n.v == null ? "–" : <Counter value={n.v} />}</b><small>{n.label}</small></li>)}
          </ul>
        }
        art={
          <div className="rf-const">
            <span className="rf-me"><Icon name="profile" size={24} /></span>
            {Array.from({ length: 6 }).map((_, i) => <span key={i} className={`rf-star ${d && i < Math.min(6, d.invited.length) ? "on" : ""}`} style={{ "--i": i }} />)}
            <svg viewBox="0 0 200 200" className="rf-lines"><circle cx="100" cy="100" r="62" /><circle cx="100" cy="100" r="92" /></svg>
          </div>
        }
      />
      <ReferralExtras />
      <div className="rf-grid">
        <Reveal className="rf-share">
          <section aria-labelledby="rs-title">
            <h2 className="k-title" id="rs-title"><Icon name="link" size={18} /> {t("rf.link")}</h2>
            <div className="rf-link">
              <input readOnly value={link} aria-label={t("rf.link")} onFocus={(e) => e.target.select()} />
              <button type="button" className="h-btn h-btn-primary" onClick={copy}>{copied ? <><Icon name="check" size={18} /> {t("c.copied")}</> : <><Icon name="link" size={18} /> {t("c.copy")}</>}</button>
              <button type="button" className="h-btn h-btn-soft" onClick={share}><Icon name="share" size={18} /> {t("c.share")}</button>
            </div>
            <ShareButtons link={link} name={member?.firstname || member?.name?.first || ""} />
            <form className="rf-invite" onSubmit={send} noValidate>
              <label htmlFor="rf-emails">{t("rf.invite")}</label>
              <textarea id="rf-emails" rows={3} value={emails} onChange={(e) => setEmails(e.target.value)} placeholder={t("rf.invitePh")} aria-invalid={state.phase === "error"} aria-describedby="rf-msg" />
              <div className="rf-invite-foot">
                <p id="rf-msg" className={`rf-msg ${state.phase}`} role="status">{state.msg}</p>
                <button type="submit" className="h-btn h-btn-primary" disabled={state.phase === "sending"}>{state.phase === "sending" ? t("rf.sending") : <>{t("rf.send")} <Icon name="arrow" size={18} /></>}</button>
              </div>
            </form>
          </section>
        </Reveal>
        <Reveal className="rf-lists" delay={80}>
          <section aria-labelledby="rl2-title">
            {ref.isLoading ? <LoadingBlock lines={4} h={220} /> : ref.isError ? <ErrorState onRetry={ref.refetch} /> : !d.invited.length && !d.joined.length ? (
              <EmptyState kind="referrals" title={t("rf.emptyTitle")} text={t("rf.emptyText")} />
            ) : (
              <>
                <ReferralStatus />
                <h2 className="k-title" id="rl2-title"><Icon name="mail" size={18} /> {t("rf.listInvited")}</h2>
                <ul className="rf-people">
                  {d.invited.map((p, i) => (
                    <li key={`${p.email}-${i}`}>
                      <span className="rf-av"><Icon name="mail" size={16} /></span>
                      <span><b>{p.email}</b></span>
                      <em>{t("rf.invited")}</em>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </Reveal>
      </div>
    </div>
  );
}


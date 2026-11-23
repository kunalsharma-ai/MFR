"use client";
// v5 dashboard (Kunal round 4, 23 Nov 2026): the Turn2Opinion page format, with MFR's own look and data.
//   1. Hero        greeting, headline, live pills (points, quality, payout), two actions, the journey wheel
//   2. Steps       the five-step journey: profile → participate → earn → quality → impact
//   3. Today       MFR's daily poll and challenges (where T2O shows alerts)
//   4. Step 1      the profile road: one pin per core profile, with its real progress
//   5. Step 2      opportunities: real /me/survey rows and pending topic profiles, filters, start
//   6. Trio        rewards vault, quality gauge, invite & earn (teens: guardian status)
//   7. Milestones  achievements worked out from real data
//   8. Activity    the latest points in the ledger
// Every figure comes from useHub() (store.js) or useSurveyDesk() (surveys.jsx). Nothing is invented: a value that
// is still loading shows "…", and a section with nothing real to show says so.
import React from "react";
import Link from "next/link";
import Icon from "./icons.jsx";
import { t } from "./strings";
import { Counter, Reveal, EmptyState, LoadingBlock, Coin3D } from "./ui.jsx";
import { GuardianStatus } from "./modules.jsx";
import TodayStrip from "./engage/today.jsx";
import ProExtras from "./engage/pro.jsx";
import TeenExtras from "./engage/teen.jsx";
import Scene3D from "./scene.jsx";
import { Avatar } from "./Shell.jsx";
import { useSurveyDesk, surveyFilters } from "./surveys.jsx";
import { achievementsOf, fmt, relDay } from "./data";
import { surveyTopic, profileTopic } from "./topics";
import { useHub } from "./store";
import { play } from "./sound";

const greet = () => { const h = new Date().getHours(); return h < 12 ? "pf.morning" : h < 18 ? "pf.afternoon" : "pf.evening"; };
const unitOf = (type) => (type === "teen" ? t("hdr.xp") : t("c.pts"));

/* ------------------------------------------------ 1. hero ------------------------------------------------ */
function JourneyWheel({ hub, steps }) {
  const R = 92;
  const C = 2 * Math.PI * R;
  const seg = C / steps.length;
  return (
    <div className="jw" aria-hidden="true">
      <div className="jw-stage"><Scene3D kind="dashboard" /></div>
      <svg className="jw-ring" viewBox="0 0 240 240">
        <circle cx="120" cy="120" r={R} className="jw-track" />
        {steps.map((s, i) => (
          <circle key={s.k} cx="120" cy="120" r={R} className={`jw-seg q${i + 1}`}
            style={{ strokeDasharray: `${Math.max(2, (seg - 8) * s.fill)} ${C}`, strokeDashoffset: -(seg * i) }} />
        ))}
        <circle cx="120" cy="120" r="112" className="jw-orbit" />
      </svg>
      <div className="jw-core">
        <b>{hub.completed == null ? "…" : <Counter value={hub.completed} />}</b>
        <small>{t(`v5.coreLabel.${hub.type}`)}</small>
      </div>
      {steps.map((s, i) => (
        <span key={s.k} className={`jw-node n${i + 1} ${s.state}`}>
          <i><Icon name={s.icon} size={16} /></i>
          <em>{t(`v5.step.${s.k}`)}</em>
          <b>{s.short}</b>
        </span>
      ))}
    </div>
  );
}

function Hero({ hub, steps, desk }) {
  const { member, type, pts, quality, level } = hub;
  const first = member?.firstname || (member?.fullname || "").split(" ")[0] || "";
  const open = desk.loading ? null : desk.openRows.length;
  const payPct = pts ? Math.min(100, Math.round((pts.total / pts.threshold) * 100)) : null;
  return (
    <section className="jh" aria-labelledby="jh-title">
      <div className="jh-bg" aria-hidden="true"><i /><i /><i /></div>
      <div className="jh-main">
        <p className="jh-hello"><Avatar member={member} /> <span>{t(greet(), { name: first })}</span>{type === "teen" ? <span className="jh-wave" aria-hidden="true">👋</span> : null}</p>
        <h1 className="jh-title" id="jh-title">{t(`v5.h1a.${type}`)} <span>{t(`v5.h1b.${type}`)}</span></h1>
        <p className="jh-sub">{t(`v5.sub.${type}`)}</p>
        <ul className="jh-pills">
          <li className="p-pts"><span className="jh-coin" aria-hidden="true" /><b>{pts ? <Counter value={pts.total} /> : "…"}</b> <small>{unitOf(type)}</small></li>
          {quality ? <li className="p-q"><span className="jh-qring" style={{ "--p": quality.pct }} aria-hidden="true" /><b>{quality.ten.toFixed(1)}</b> <small>{quality.tier?.label || t(`qs.${quality.band}`)}</small></li> : null}
          {type === "teen"
            ? <li className="p-pay"><span className="jh-bar" aria-hidden="true"><i style={{ "--w": `${level.pct}%` }} /></span><small>{t("lv.level", { n: level.n })}{level.left != null ? ` · ${t("lv.toNext", { n: fmt(level.left) })}` : ""}</small></li>
            : <li className="p-pay"><span className="jh-bar" aria-hidden="true"><i style={{ "--w": `${payPct || 0}%` }} /></span><small>{payPct == null ? "…" : t("v5.toPayoutPill", { n: payPct })}</small></li>}
        </ul>
        <div className="jh-cta">
          <Link href="/member/surveys" className="h-btn h-btn-primary h-btn-lg">{open == null ? t("sx.loadingTitle") : open ? t(open === 1 ? "v5.openOne" : "v5.openN", { n: open }) : t("v5.openNone")} <Icon name="arrow" size={18} /></Link>
          <Link href="/member/rewards" className="h-btn h-btn-ghost h-btn-lg"><Icon name="rewards" size={18} /> {t("v5.viewRewards")}</Link>
        </div>
      </div>
      <JourneyWheel hub={hub} steps={steps} />
    </section>
  );
}

/* ------------------------------------------------ 2. steps ------------------------------------------------ */
function useSteps(hub, desk) {
  const { completion: c, pts, quality, completed, type } = hub;
  const open = desk.loading ? null : desk.openRows.length;
  const steps = [
    { k: "profile", icon: "profile", href: "/member/profiles", fill: c ? c.pct / 100 : 0, done: c ? c.pct >= 100 : false, short: c ? `${c.pct}%` : "…" },
    { k: "participate", icon: "surveys", href: "/member/surveys", fill: open ? 1 : completed ? 1 : 0.15, done: false, short: open == null ? "…" : t("v5.nOpen", { n: open }) },
    { k: "earn", icon: "coin", href: "/member/rewards", fill: pts ? Math.min(1, pts.total / pts.threshold) : 0, done: false, short: pts ? `${fmt(pts.total)} ${unitOf(type)}` : "…" },
    { k: "quality", icon: "quality", href: "/member/quality", fill: quality ? quality.pct / 100 : 0, done: quality ? quality.pct >= 90 : false, short: quality ? `${quality.ten.toFixed(1)}/10` : "…" },
    { k: "impact", icon: "activity", href: "/member/activity", fill: completed ? Math.min(1, completed / 10) : 0, done: false, short: completed == null ? "…" : t("v5.nDone", { n: completed }) },
  ];
  const cur = steps.findIndex((s) => !s.done);
  return steps.map((s, i) => ({ ...s, state: s.done ? "is-done" : i === cur ? "is-now" : "is-next" }));
}

function Steps({ steps }) {
  return (
    <nav className="js" aria-label={t("v5.stepsLabel")}>
      <ol>
        {steps.map((s, i) => (
          <li key={s.k} className={`${s.state} q${i + 1}`} style={{ "--i": i }}>
            <Link href={s.href}>
              <span className="js-dot">{s.state === "is-done" ? <Icon name="check" size={18} /> : <Icon name={s.icon} size={18} />}</span>
              <b>{t(`v5.stepT.${s.k}`)}</b>
              <small>{s.short}</small>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------ section head ------------------------------------------------ */
function Head({ icon, eyebrow, title, sub, action, id, tone = 1 }) {
  return (
    <header className={`jx-head q${tone}`}>
      <span className="jx-ic" aria-hidden="true"><Icon name={icon} size={22} /></span>
      <div>
        <p className="jx-eyebrow">{eyebrow}</p>
        <h2 className="jx-title" id={id}>{title}</h2>
        {sub ? <p className="jx-sub">{sub}</p> : null}
      </div>
      {action ? <div className="jx-action">{action}</div> : null}
    </header>
  );
}

/* ------------------------------------------------ 4. profile road ------------------------------------------------ */
// a smooth road through every pin, from the left edge to the right edge
function roadPath(xs, ys, W) {
  if (!xs.length) return "";
  let d = `M0 ${ys[0]} C ${xs[0] / 2} ${ys[0]}, ${xs[0] / 2} ${ys[0]}, ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < xs.length; i += 1) {
    const mx = (xs[i - 1] + xs[i]) / 2;
    d += ` C ${mx} ${ys[i - 1]}, ${mx} ${ys[i]}, ${xs[i]} ${ys[i]}`;
  }
  const l = xs.length - 1;
  return `${d} C ${(xs[l] + W) / 2} ${ys[l]}, ${(xs[l] + W) / 2} ${ys[l]}, ${W} ${ys[l]}`;
}
function ProfileRoad({ hub }) {
  const c = hub.completion;
  const pins = c ? c.items.filter((i) => i.kind === "profile") : [];
  const status = !c ? null : c.pct >= 100 ? "full" : c.pct >= 60 ? "strong" : c.pct > 0 ? "building" : "new";
  const W = 1000;
  const xs = pins.map((_, i) => (pins.length === 1 ? W / 2 : 80 + (i * (W - 160)) / (pins.length - 1)));
  const ys = pins.map((_, i) => (i % 2 ? 96 : 34));
  return (
    <section className="jx jx-road" aria-labelledby="jr-t">
      <Head icon="pin" tone={2} id="jr-t" eyebrow={t("v5.s1")} title={t("v5.roadTitle")} sub={status ? t(`pf.sub.${status}.${hub.type}`, { n: c.remaining.length }) : t("c.loading")}
        action={<Link href="/member/profiles" className="h-btn h-btn-soft">{t("v5.openProfiles")} <Icon name="arrow" size={16} /></Link>} />
      <div className="jr-why">
        <p><Icon name="target" size={16} /> <span><b>{t("v5.whyT")}</b> {t(`v5.why.${hub.type}`)}</span></p>
        <p><Icon name={status === "full" ? "check" : "lock"} size={16} /> <span><b>{t("v5.unlockT")}</b> {status === "full" ? t("v5.unlockAll") : t("v5.unlockSome")}</span></p>
      </div>
      {!c ? <LoadingBlock lines={1} h={140} /> : !pins.length ? <p className="jx-none">{t("pf.none")}</p> : (
        <div className="jr-road">
          <svg viewBox={`0 0 ${W} 130`} preserveAspectRatio="none" aria-hidden="true">
            <path d={roadPath(xs, ys, W)} className="jr-path" />
            <path d={roadPath(xs, ys, W)} className="jr-dash" />
          </svg>
          <ol>
            {pins.map((p, i) => {
              const pct = Math.round(p.progress * 100);
              return (
                <li key={p.key} style={{ "--x": `${(xs[i] / W) * 100}%`, "--y": ys[i], "--i": i }} className={p.done ? "is-done" : pct > 0 ? "is-going" : "is-new"}>
                  <Link href={p.href} aria-label={`${p.label} ${pct}%`}>
                    <span className="jr-pin">{p.done ? <Icon name="check" size={18} /> : <b>{pct}%</b>}</span>
                    <b className="jr-name">{p.label}</b>
                    <span className="jr-bar" aria-hidden="true"><i style={{ "--w": `${pct}%` }} /></span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------ 5. opportunities ------------------------------------------------ */
function Opportunities({ hub, desk }) {
  const { type } = hub;
  const [filter, setFilter] = React.useState("all");
  const F = surveyFilters(desk.profileRows);
  const f = F.find((x) => x.k === filter) || F[0];
  const rows = desk.openRows.filter(f.test);
  const feat = (filter === "all" && desk.best && rows.includes(desk.best)) ? desk.best : rows[0];
  const rest = rows.filter((r) => r !== feat).slice(0, 4);
  const label = (r) => {
    const tp = r.kind === "profile" ? profileTopic(r) : surveyTopic(r, type);
    const k = `sx.topic.${tp.k}`;
    return { tp, name: r.kind === "profile" ? t("sx.profileTopic") : t(k) === k ? t("sx.topic.general") : t(k) };
  };
  const cta = (r) => (r.state === "locked" ? t("sx.unlock") : r.state === "resume" ? t("sx.resume") : r.kind === "profile" ? t("sx.startProfile") : t("v5.take"));
  return (
    <section className="jx jx-opps" aria-labelledby="jo-t">
      <Head icon="surveys" tone={3} id="jo-t" eyebrow={t("v5.s2")} title={t("v5.oppTitle")}
        sub={desk.loading ? t("sx.loadingTitle") : desk.openRows.length ? t("v5.oppSub", { n: desk.openRows.length }) : t("sx.titleNone")}
        action={<Link href="/member/surveys" className="h-btn h-btn-soft">{t("v5.allSurveys")} <Icon name="arrow" size={16} /></Link>} />
      {desk.openRows.length ? (
        <div className="jo-filters" role="tablist" aria-label={t("sx.filterLabel")}>
          {F.map((x) => {
            const n = desk.openRows.filter(x.test).length;
            if (!n && x.k !== "all") return null;
            return <button key={x.k} type="button" role="tab" aria-selected={filter === x.k} className={filter === x.k ? "on" : ""} onClick={() => { setFilter(x.k); play("tap"); }}>{t(`sx.f.${x.k}`)} <span>{n}</span></button>;
          })}
        </div>
      ) : null}
      {desk.active.isError ? <EmptyState kind="surveys" title={t("c.errorTitle")} text="" /> : desk.loading ? <LoadingBlock lines={3} h={220} /> : !desk.openRows.length ? (
        <EmptyState kind="surveys" title={t("sx.emptyTitle")} text={t(`sx.emptyText.${type}`)} action={<Link className="h-btn h-btn-primary" href="/member/profiles">{t("sx.emptyCta")}</Link>} />
      ) : (
        <div className="jo-grid">
          {feat ? (() => {
            const { tp, name } = label(feat);
            return (
              <article className={`jo-feat is-${feat.state}`} style={{ "--c1": tp.c1, "--c2": tp.c2 }}>
                <span className="jo-blob" aria-hidden="true"><Icon name={tp.ic} size={40} /></span>
                <div className="jo-feat-tx">
                  <p className="jo-topic">{name}{feat.participationStatus === "invited" && feat.kind === "survey" ? <em>{t("v5.new")}</em> : null}</p>
                  <h3>{feat.name}</h3>
                  <p className="jo-meta"><span className="jo-pts">+{fmt(Number(feat.points) || 0)} {unitOf(type)}</span>{Number(feat.loi) ? <span><Icon name="clock" size={14} /> {t("sx.min", { n: Number(feat.loi) })}</span> : null}</p>
                  <button type="button" className="h-btn h-btn-primary" onClick={() => desk.start(feat)}>{feat.state === "locked" ? <Icon name="lock" size={16} /> : null} {cta(feat)} <Icon name="arrow" size={16} /></button>
                </div>
              </article>
            );
          })() : null}
          <ul className="jo-list">
            {rest.map((r, i) => {
              const { tp } = label(r);
              return (
                <li key={`${r.kind}-${r.slug}`} style={{ "--c1": tp.c1, "--c2": tp.c2, "--i": i }}>
                  <button type="button" className={`jo-row is-${r.state}`} onClick={() => desk.start(r)} aria-label={`${cta(r)}: ${r.name}`}>
                    <span className="jo-row-ic" aria-hidden="true"><Icon name={r.state === "locked" ? "lock" : tp.ic} size={18} /></span>
                    <span className="jo-row-tx"><b>{r.name}</b><small><span className="jo-pts">+{fmt(Number(r.points) || 0)} {unitOf(type)}</span>{Number(r.loi) ? <> · <Icon name="clock" size={12} /> {t("sx.min", { n: Number(r.loi) })}</> : null}</small></span>
                    <Icon name="arrow" size={16} className="jo-go" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {desk.dialog}
    </section>
  );
}

/* ------------------------------------------------ 6. trio ------------------------------------------------ */
function Vault({ hub }) {
  const { pts, type, level } = hub;
  const left = pts ? Math.max(0, pts.threshold - pts.total) : null;
  return (
    <Link href="/member/rewards" className="jt jt-vault">
      <p className="jt-k">{t(type === "teen" ? "v5.vaultTeen" : "v5.vault")}</p>
      <span className="jt-coin" aria-hidden="true"><Coin3D size={104} label={type === "teen" ? "XP" : "MFR"} /><i /><i /></span>
      <b className="jt-n">{pts ? <Counter value={pts.total} /> : "…"} <small>{unitOf(type)}</small></b>
      <small className="jt-note">{type === "teen" ? (level.left != null ? t("lv.toNext", { n: fmt(level.left) }) : t("lv.top")) : left == null ? "…" : left ? t("rw.untilMilestone", { n: fmt(left) }) : t("rw.milestoneReached")}</small>
    </Link>
  );
}

function QualityCard({ hub }) {
  const q = hub.quality;
  const a = q ? -90 + (q.pct / 100) * 180 : -90;
  return (
    <Link href="/member/quality" className="jt jt-quality">
      <p className="jt-k">{t("nav.quality")}</p>
      <svg viewBox="0 0 200 116" className="jt-gauge" aria-hidden="true">
        <path d="M20 100 A80 80 0 0 1 180 100" className="g-bg" />
        <path d="M20 100 A80 80 0 0 1 180 100" className="g-fg" pathLength="100" style={{ strokeDasharray: `${q ? q.pct : 0} 100` }} />
        <g style={{ transform: `rotate(${a}deg)`, transformOrigin: "100px 100px" }} className="g-needle"><path d="M97 100 L100 34 L103 100 Z" /><circle cx="100" cy="100" r="7" /></g>
      </svg>
      <b className="jt-n">{q ? q.ten.toFixed(1) : "–"}<small>/10</small></b>
      <small className="jt-note">{q ? (q.tier?.label || t(`qs.${q.band}`)) : t("c.loading")}</small>
    </Link>
  );
}

function InviteCard({ hub }) {
  const d = hub.referrals?.data;
  const joined = d?.joinedKnown ? d.joined.length : null;
  return (
    <Link href="/member/referrals" className="jt jt-invite">
      <p className="jt-k">{t("v5.invite")}</p>
      <span className="jt-net" aria-hidden="true">
        <i className="me"><Icon name="profile" size={18} /></i>
        {[0, 1, 2, 3, 4].map((k) => <i key={k} className={`f f${k} ${d && k < Math.min(5, d.invited.length) ? "on" : ""}`} />)}
      </span>
      <b className="jt-n">{joined == null ? (d ? fmt(d.invited.length) : "…") : <Counter value={joined} />}</b>
      <small className="jt-note">{!d ? t("c.loading") : joined == null ? t("v5.invitedN", { n: d.invited.length }) : t("v5.joinedN", { n: joined, m: d.invited.length })}</small>
    </Link>
  );
}

/* ------------------------------------------------ 7. milestones ------------------------------------------------ */
function Milestones({ hub }) {
  const list = achievementsOf({ stats: hub.stats?.data, profiles: hub.profiles?.data, quality: hub.quality, ledger: hub.ledger, referrals: hub.referrals?.data });
  const got = list.filter((x) => x.done).length;
  return (
    <section className="jx jx-miles" aria-labelledby="jm-t">
      <Head icon="trophy" tone={5} id="jm-t" eyebrow={t("v5.earnedOf", { n: got, m: list.length })} title={t("v5.milesTitle")} sub={t("v5.milesSub")} />
      <ul className="jm">
        {list.map((a, i) => (
          <li key={a.id} className={a.done ? "is-done" : ""} style={{ "--p": Math.round(a.progress * 100), "--i": i }}>
            <span className="jm-badge" aria-hidden="true"><i><Icon name={a.done ? a.icon : "lock"} size={22} /></i></span>
            <b>{t(a.label)}</b>
            <small>{a.done ? t("v5.earned") : t(a.hint, a.hintVars)}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------ 8. recent activity ------------------------------------------------ */
function Recent({ hub }) {
  const rows = hub.ledger.slice(0, 5);
  return (
    <section className="jx jx-recent" aria-labelledby="ja-t">
      <Head icon="activity" tone={8} id="ja-t" eyebrow={t("v5.impact")} title={t("v5.recentTitle")} action={<Link href="/member/activity" className="h-link">{t("v5.allActivity")} <Icon name="arrow" size={14} /></Link>} />
      {hub.ledgerQ.isLoading ? <LoadingBlock lines={1} h={110} /> : !rows.length ? <EmptyState kind="activity" title={t("ac.emptyTitle")} text={t("ac.emptyText")} /> : (
        <ul className="ja">
          {rows.map((r, i) => (
            <li key={r.id} className={`k-${r.kind}`} style={{ "--i": i }}>
              <span className="ja-ic" aria-hidden="true"><Icon name={r.kind === "survey" ? "surveys" : r.kind === "profile" ? "profile" : "coin"} size={16} /></span>
              <small>{r.at ? relDay(r.at, t) : ""}</small>
              <b>{r.name || t(`ac.${r.kind}`)}</b>
              <em>{r.points ? `+${fmt(r.points)} ${unitOf(hub.type)}` : t(`ac.${r.kind}`)}</em>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function JourneyDashboard() {
  const hub = useHub();
  const desk = useSurveyDesk();
  const steps = useSteps(hub, desk);
  const { type } = hub;
  return (
    <div className={`dash jd jd-${type}`}>
      <Hero hub={hub} steps={steps} desk={desk} />
      <Steps steps={steps} />
      <Reveal className="d-today" id="today"><TodayStrip /></Reveal>
      {type === "teen" ? <Reveal><GuardianStatus member={hub.member} compact /></Reveal> : null}
      <Reveal><ProfileRoad hub={hub} /></Reveal>
      <Reveal><Opportunities hub={hub} desk={desk} /></Reveal>
      <div className="jd-trio">
        <Reveal><Vault hub={hub} /></Reveal>
        <Reveal delay={60}><QualityCard hub={hub} /></Reveal>
        {type === "teen" ? <Reveal delay={90}><Link href="/member/activity" className="jt jt-invite"><p className="jt-k">{t("v5.streakT")}</p><span className="jt-net" aria-hidden="true"><i className="me"><Icon name="flame" size={18} /></i></span><b className="jt-n">{hub.completed == null ? "…" : hub.completed}</b><small className="jt-note">{t("v5.nDone", { n: hub.completed ?? 0 })}</small></Link></Reveal> : <Reveal delay={90}><InviteCard hub={hub} /></Reveal>}
      </div>
      <Reveal><Milestones hub={hub} /></Reveal>
      {type === "professional" ? <ProExtras /> : type === "teen" ? <TeenExtras /> : null}
      <Reveal><Recent hub={hub} /></Reveal>
    </div>
  );
}

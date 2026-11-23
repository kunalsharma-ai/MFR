"use client";
// Profile studio (v3, Nov 2026 premium redesign). Replaces the v2 band and the v4.1 world cards on /member/profiles;
// the question flow itself (profiles/ps/PsFlow) is unchanged and still opens with ?profile=<slug>.
//   Hero       – welcome, the member's avatar inside the live completion ring, status, next step, live stats
//   Profiles   – one card per profile with its own identity (topic colours, icon, title, description), real
//                progress from the database (status), points from the admin, and completed / in progress / new states
//   Account    – the account steps that count toward completion (email, phone, location, photo)
//   Achieved   – completed topic profiles (taken from the Survey section) shown as earned badges
// Every figure comes from the same sources as the header: completion % from useHub() (store.js), each card's %
// from the profile API, and "done" also when the reward for it is already paid (useProfileGate).
import React from "react";
import Link from "next/link";
import Icon from "./icons.jsx";
import { t } from "./strings";
import { Counter, Ring, Burst, LoadingBlock, ErrorState, Reveal } from "./ui.jsx";
import { Avatar } from "./Shell.jsx";
import { fmt } from "./data";
import { useHub, useRise } from "./store";
import { play } from "./sound";
import { profileTopic } from "./topics";
import FamilyPanel from "./family.jsx";

function useCelebrate(id, pct) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    if (!id || pct !== 100) return;
    const key = `mfr.hub.p100.${id}`;
    let seen = false;
    try { seen = localStorage.getItem(key) === "1"; } catch (e) { /* blocked */ }
    if (seen) return;
    setShow(true);
    play("milestone");
    try { localStorage.setItem(key, "1"); } catch (e) { /* blocked */ }
  }, [id, pct]);
  return [show, () => setShow(false)];
}

const questionsOf = (p) => (p?.pages || []).reduce((n, pg) => n + Math.max(0, (pg?.length || 1) - 1), 0);
const pctOf = (p) => Math.max(0, Math.min(100, Math.round(Number(p?.status) || 0)));
const tx = (key, fallback) => { const s = t(key); return s === key ? fallback : s; };

function greetingKey() {
  const h = new Date().getHours();
  return h < 12 ? "pf.morning" : h < 18 ? "pf.afternoon" : "pf.evening";
}

/* ---------------- hero ---------------- */
function ProfileHero({ hub, cards }) {
  const { member, type, completion: c, quality, pts } = hub;
  const rise = useRise(c?.pct ?? null);
  const done = cards.filter((x) => x.done).length;
  const next = cards.find((x) => !x.done && !x.locked);
  const status = !c ? null : c.pct >= 100 ? "full" : c.pct >= 60 ? "strong" : c.pct > 0 ? "building" : "new";
  const first = member?.firstname || (member?.fullname || "").split(" ")[0] || "";
  return (
    <section className={`pf-hero is-${status || "load"}`} aria-labelledby="pf-title">
      <div className="pf-hero-bg" aria-hidden="true"><i /><i /><i /><span className="pf-grain" /></div>
      <div className="pf-hero-id">
        <span className={`pf-av ${rise ? "is-rise" : ""}`}>
          <Ring pct={c?.pct || 0} size={132} stroke={7} label={c ? t("pf.ringLabel", { n: c.pct }) : t("c.loading")}><Avatar member={member} size="xl" /></Ring>
          <span className="pf-av-pct" aria-hidden="true">{c ? <><Counter value={c.pct} />%</> : "…"}</span>
          {rise ? <Burst key={c?.pct} /> : null}
        </span>
      </div>
      <div className="pf-hero-main">
        <nav className="hx-crumbs" aria-label={t("c.breadcrumb")}><ol><li><Link href="/member/dashboard">{t("nav.dashboard")}</Link></li><li><span aria-current="page">{t("nav.myProfile")}</span></li></ol></nav>
        <p className="pf-hello">{t(greetingKey(), { name: first })}</p>
        <h1 className="pf-title" id="pf-title">{status ? t(`pf.title.${status}`) : t("c.loading")}</h1>
        <p className="pf-sub">{status ? t(`pf.sub.${status}.${type}`, { n: c.remaining.length }) : ""}</p>
        {c ? (
          <div className="pf-progress" role="img" aria-label={t("pf.ringLabel", { n: c.pct })}>
            <span className="pf-track"><i style={{ "--w": `${c.pct}%` }} /></span>
            <span className="pf-progress-tx"><b>{c.done}/{c.total}</b> {t("pf.stepsDone")}</span>
          </div>
        ) : null}
        <div className="pf-hero-cta">
          {next ? (
            <button type="button" className="h-btn h-btn-primary h-btn-lg" onClick={next.open}>{next.pct > 0 ? t("pf.continueX", { name: next.title }) : t("pf.startX", { name: next.title })} <Icon name="arrow" size={18} /></button>
          ) : c && c.remaining.length ? (
            <Link className="h-btn h-btn-primary h-btn-lg" href={c.remaining[0].href}>{t("pf.finishAccount")} <Icon name="arrow" size={18} /></Link>
          ) : (
            <Link className="h-btn h-btn-primary h-btn-lg" href="/member/surveys">{t("pf.toSurveys")} <Icon name="arrow" size={18} /></Link>
          )}
          <span className={`pf-badge s-${status || "load"}`}><Icon name={status === "full" ? "trophy" : "spark"} size={15} /> {status ? t(`pf.badge.${status}`) : "…"}</span>
        </div>
      </div>
      <ul className="pf-stats" aria-label={t("pb.status")}>
        <li><small>{t("pf.statProfiles")}</small><b>{done}<em>/{cards.length}</em></b></li>
        <li><small>{t("hdr.quality")}</small><b>{quality ? quality.ten.toFixed(1) : "–"}<em>/10</em></b></li>
        <li><small>{t("pf.statToEarn")}</small><b>{c ? (c.pointsLeft ? `+${fmt(c.pointsLeft)}` : <Icon name="check" size={20} />) : "…"}</b></li>
        <li><small>{type === "teen" ? t("hdr.xp") : t("hdr.points")}</small><b>{pts ? <Counter value={pts.total} /> : "…"}</b></li>
      </ul>
    </section>
  );
}

/* ---------------- one profile card ---------------- */
function ProfileCard({ card, i }) {
  const { tp, title, text, pct, done, locked, questions, points, open } = card;
  const state = done ? "done" : locked ? "locked" : pct > 0 ? "going" : "new";
  const cta = done ? t("pf.review") : locked ? t("pf.locked") : pct > 0 ? t("pf.continue") : t("pf.start");
  return (
    <li className={`pf-card is-${state}`} style={{ "--c1": tp.c1, "--c2": tp.c2, "--i": i, "--w": `${pct}%` }}>
      <button type="button" className="pf-card-btn" onClick={() => { play("tap"); open(); }}
        aria-label={`${title}. ${t(`pf.state.${state}`, { n: pct })}. ${cta}`}>
        <span className="pf-card-glow" aria-hidden="true" />
        <span className="pf-card-top">
          <span className="pf-glyph" aria-hidden="true"><Icon name={tp.ic} size={26} /><i /></span>
          <span className={`pf-state s-${state}`}>
            <Icon name={done ? "check" : locked ? "lock" : pct > 0 ? "hourglass" : "spark"} size={13} />
            {t(`pf.state.${state}`, { n: pct })}
          </span>
        </span>
        <span className="pf-card-tx">
          <b className="pf-card-t">{title}</b>
          <small className="pf-card-d">{text}</small>
        </span>
        <span className="pf-card-meta">
          {questions ? <span><Icon name="surveys" size={14} /> {t("pf.questions", { n: questions })}</span> : null}
          <span><Icon name="clock" size={14} /> {t("pf.minutes", { n: Math.max(1, Math.round((questions * 8) / 60)) })}</span>
          {points ? <span className="pf-pts"><Icon name="coin" size={14} /> {done ? t("pf.earned", { n: fmt(points) }) : `+${fmt(points)}`}</span> : null}
        </span>
        <span className="pf-meter" aria-hidden="true"><i /></span>
        <span className="pf-card-foot">
          <span className="pf-pct">{pct}%</span>
          <span className="pf-go">{cta} <Icon name="arrow" size={15} /></span>
        </span>
        {done ? <span className="pf-medal" aria-hidden="true"><Icon name="trophy" size={16} /></span> : null}
      </button>
    </li>
  );
}

/* ---------------- account steps ---------------- */
function AccountSteps({ c }) {
  const items = c.items.filter((i) => i.kind === "account");
  if (!items.length) return null;
  return (
    <section className="pf-acc" aria-labelledby="pf-acc-t">
      <header className="pf-sec-h">
        <h2 id="pf-acc-t" className="pf-h"><Icon name="shield" size={20} /> {t("pf.accTitle")}</h2>
        <p>{t("pf.accSub")}</p>
      </header>
      <ul className="pf-acc-list">
        {items.map((i, k) => (
          <li key={i.key} className={i.done ? "is-done" : ""} style={{ "--i": k }}>
            <Link href={i.href} className="pf-acc-row">
              <span className="pf-acc-ic"><Icon name={i.done ? "check" : i.icon} size={18} /></span>
              <span className="pf-acc-tx"><b>{t(i.label)}</b><small>{i.done ? t("pf.accDone") : t(`pb.why.${i.key}`)}</small></span>
              <span className={`pf-state s-${i.done ? "done" : i.progress > 0 ? "going" : "new"}`}>{i.done ? t("pf.state.done") : i.progress > 0 ? t("pf.state.going", { n: Math.round(i.progress * 100) }) : t("pf.todo")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------- the page ---------------- */
// profiles: the core profiles (API objects, with pages and status); extrasDone: topic profiles already completed
// isDone(p): the reward for p is already paid; onOpen(p): opens the question flow (or explains the lock)
export default function ProfileStudio({ profiles = [], extrasDone = [], onOpen, isLocked = () => false, isDone = () => false, morePending = 0, ready = true }) {
  const hub = useHub();
  const { member, type, completion: c, profiles: pq } = hub;
  const [party, endParty] = useCelebrate(member?._id, c?.pct);
  const cards = profiles.map((p) => {
    const tp = profileTopic(p);
    const pct = isDone(p) ? 100 : pctOf(p);
    return {
      slug: p.slug, tp, pct, done: pct >= 100, locked: isLocked(p.slug), questions: questionsOf(p), points: Number(p.points) || 0,
      title: tx(`pf3.${tp.k}.title`, p.name), text: tx(`pf3.${tp.k}.text`, p.description || p.summary || ""), name: p.name,
      open: () => onOpen(p),
    };
  });
  const order = { going: 0, new: 1, locked: 2, done: 3 };
  const stateOf = (x) => (x.done ? "done" : x.locked ? "locked" : x.pct > 0 ? "going" : "new");
  const sorted = [...cards].sort((a, b) => order[stateOf(a)] - order[stateOf(b)]);
  if (pq.isError) return <div className="pf"><ErrorState text={t("d2.profileError")} onRetry={pq.refetch} /></div>;
  return (
    <div className="pf">
      <ProfileHero hub={hub} cards={cards} />
      <section className="pf-sec" aria-labelledby="pf-cards-t">
        <header className="pf-sec-h">
          <h2 id="pf-cards-t" className="pf-h"><Icon name="layers" size={20} /> {t("pf.cardsTitle")}</h2>
          <p>{t("pf.cardsSub")}</p>
        </header>
        {!ready ? <LoadingBlock lines={4} h={220} /> : !cards.length ? (
          <p className="pf-empty"><Icon name="alert" size={18} /> {t("pf.none")}</p>
        ) : (
          <ul className="pf-grid">{sorted.map((x, i) => <ProfileCard key={x.slug} card={x} i={i} />)}</ul>
        )}
      </section>
      <div className="pf-duo">
        {c ? <Reveal><AccountSteps c={c} /></Reveal> : <LoadingBlock lines={3} h={200} />}
        <Reveal delay={60}>
          <section className="pf-ach" aria-labelledby="pf-ach-t">
            <header className="pf-sec-h">
              <h2 id="pf-ach-t" className="pf-h"><Icon name="trophy" size={20} /> {t("pf.achTitle")}</h2>
              <p>{extrasDone.length ? t("pf.achSub", { n: extrasDone.length }) : t("pf.achNone")}</p>
            </header>
            {extrasDone.length ? (
              <ul className="pf-badges">
                {extrasDone.map((p, k) => {
                  const tp = profileTopic(p);
                  return (
                    <li key={p.slug} style={{ "--c1": tp.c1, "--c2": tp.c2, "--i": k }} title={p.name}>
                      <span className="pf-badge-ic"><Icon name={tp.ic} size={20} /></span>
                      <span className="pf-badge-tx"><b>{p.name}</b><small>{p.points ? t("pf.earned", { n: fmt(p.points) }) : t("pf.state.done")}</small></span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            <div className="pf-ach-foot">
              {morePending ? <Link className="h-btn h-btn-soft" href="/member/surveys"><Icon name="surveys" size={16} /> {t("pf.moreTopics", { n: morePending })}</Link> : null}
              <Link className="h-btn h-btn-ghost" href="/member/rewards#prize-machine"><Icon name="gift" size={16} /> {t("pf.toMachine")}</Link>
            </div>
          </section>
        </Reveal>
      </div>
      {type === "teen" ? <FamilyPanel /> : null}
      {party ? (
        <div className="pb-party" role="dialog" aria-modal="false" aria-labelledby="pb-party-t">
          <Burst n={24} className="big" />
          <span className="pb-party-ic"><Icon name="trophy" size={34} /></span>
          <h2 id="pb-party-t">{t("pb.partyTitle")}</h2>
          <p>{t("pb.partyText")}</p>
          <div className="pb-party-cta">
            <Link href="/member/surveys" className="h-btn h-btn-primary" onClick={endParty}>{t("d2.openSurveys")}</Link>
            <button type="button" className="h-btn h-btn-ghost" onClick={endParty}>{t("c.close")}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

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
import Hero8 from "./v8/hero.jsx";
import RewardMachine8 from "./v8/machine.jsx";
import Tile from "./tiles.jsx";
import Icon from "./icons.jsx";
import { t } from "./strings";
import { Burst, LoadingBlock, ErrorState, Reveal } from "./ui.jsx";
import { fmt } from "./data";
import { useHub } from "./store";
import { play } from "./sound";
import { profileTopic, profileArt } from "./topics";
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

/* ---------------- hero (v8, round 7): the shared section banner with the Profile builder scene, no photo ---------------- */
function ProfileHero({ hub, cards }) {
  const { member, type, completion: c, quality, pts } = hub;
  const done = cards.filter((x) => x.done).length;
  const next = cards.find((x) => !x.done && !x.locked);
  const status = !c ? null : c.pct >= 100 ? "full" : c.pct >= 60 ? "strong" : c.pct > 0 ? "building" : "new";
  const first = member?.firstname || (member?.fullname || "").split(" ")[0] || "";
  const cta = next ? (
    <button type="button" className="h-btn h-btn-primary h-btn-lg" onClick={next.open}>{next.pct > 0 ? t("pf.continueX", { name: next.title }) : t("pf.startX", { name: next.title })} <Icon name="arrow" size={18} /></button>
  ) : c && c.remaining.length ? (
    <Link className="h-btn h-btn-primary h-btn-lg" href={c.remaining[0].href}>{t("pf.finishAccount")} <Icon name="arrow" size={18} /></Link>
  ) : (
    <Link className="h-btn h-btn-primary h-btn-lg" href="/member/surveys">{t("pf.toSurveys")} <Icon name="arrow" size={18} /></Link>
  );
  return (
    <Hero8 kind="profile" id="pf-title"
      crumbs={[{ label: t("nav.dashboard"), href: "/member/dashboard" }, { label: t("nav.myProfile") }]}
      eyebrow={t(greetingKey(), { name: first })}
      title={status ? t(`pf.title.${status}`) : t("c.loading")}
      sub={status ? t(`pf.sub.${status}.${type}`, { n: c.remaining.length }) : ""}
      actions={<>{cta}<a className="h-btn h-btn-ghost h-btn-lg" href="#reward-machine"><Icon name="gift" size={18} /> {t(`v8.m.open.${type}`)}</a></>}
      stats={[
        { label: t("hdr.profile"), value: c ? c.pct : "…", unit: "%", pct: c?.pct, tone: "a" },
        { label: t("pf.statProfiles"), value: done, unit: `/${cards.length}`, pct: cards.length ? (done / cards.length) * 100 : 0, tone: "b" },
        { label: t("hdr.quality"), value: quality ? quality.ten.toFixed(1) : "–", unit: "/10", pct: quality?.pct, tone: "c" },
        { label: type === "teen" ? t("hdr.xp") : t("hdr.points"), value: pts ? fmt(pts.total) : "…", tone: "d" },
      ]}
    />
  );
}

/* ---------------- one profile card (v6, round 5): art panel with a progress ring, big title, chips, full-width action ---------------- */
function ProfileCard({ card, i }) {
  const { tp, title, pct, done, locked, questions, points, open, num } = card;
  const state = done ? "done" : locked ? "locked" : pct > 0 ? "going" : "new";
  const cta = done ? t("v7.tile.update") : locked ? t("v7.tile.howUnlock") : pct > 0 ? t("pf.continue") : t("pf.start");
  const mins = Math.max(1, Math.round((questions * 8) / 60));
  const meta = [];
  if (questions) meta.push({ icon: "surveys", text: t("pf.questions", { n: questions }) });
  meta.push({ icon: "clock", text: t("pf.minutes", { n: mins }) });
  return (
    <Tile c1={tp.c1} c2={tp.c2} art={card.art} name={title} num={num} meta={meta} pts={points ? fmt(points) : null}
      state={state} stateLabel={t(`pf.state.${state}`, { n: pct })} pct={pct} cta={cta} i={i}
      onClick={() => { play("tap"); open(); }} ariaLabel={`${title}. ${t(`pf.state.${state}`, { n: pct })}. ${cta}`} />
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
  const cards = profiles.map((p, k) => {
    const tp = profileTopic(p);
    const pct = isDone(p) ? 100 : pctOf(p);
    return {
      slug: p.slug, tp, art: profileArt(p.slug, tp), pct, done: pct >= 100, locked: isLocked(p.slug), questions: questionsOf(p), points: Number(p.points) || 0,
      title: tx(`pf3.${tp.k}.title`, p.name), text: tx(`pf3.${tp.k}.text`, p.description || p.summary || ""), name: p.name,
      open: () => onOpen(p), num: k + 1,
    };
  });
  const order = { going: 0, new: 1, locked: 2, done: 3 };
  const stateOf = (x) => (x.done ? "done" : x.locked ? "locked" : x.pct > 0 ? "going" : "new");
  const sorted = [...cards].sort((a, b) => order[stateOf(a)] - order[stateOf(b)]);
  if (pq.isError) return <div className="pf"><ErrorState text={t("d2.profileError")} onRetry={pq.refetch} /></div>;
  return (
    <div className="pf">
      <ProfileHero hub={hub} cards={cards} />
      {!ready ? <LoadingBlock lines={4} h={220} /> : !cards.length ? (
        <section className="pf-sec"><p className="pf-empty"><Icon name="alert" size={18} /> {t("pf.none")}</p></section>
      ) : (
        [
          { k: "going", art: "hourglass", list: sorted.filter((x) => stateOf(x) === "going") },
          { k: "next", art: "sparkles", list: sorted.filter((x) => stateOf(x) === "new" || stateOf(x) === "locked") },
          { k: "done", art: "verified", list: sorted.filter((x) => stateOf(x) === "done") },
        ].filter((g) => g.list.length).map((g) => (
          <section key={g.k} className={`pf-sec pf-g-${g.k}`} aria-labelledby={`pf-g-${g.k}`}>
            <header className="h7-head">
              <img className="h7-head-art" src={`/ps/images/emoji/${g.art}.webp`} alt="" width="40" height="40" loading="lazy" />
              <div>
                <h2 id={`pf-g-${g.k}`} className="h7-title">{t(`v7.pf.${g.k}`)}</h2>
                <p className="h7-sub">{t(`v7.pf.${g.k}Sub`)}</p>
              </div>
              <span className="h7-count">{g.k === "done" ? `${g.list.length}/${cards.length}` : g.list.length}</span>
            </header>
            <ul className="pf-grid tc-grid">{g.list.map((x, i) => <ProfileCard key={x.slug} card={x} i={i} />)}</ul>
          </section>
        ))
      )}
      <RewardMachine8 />
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
              <Link className="h-btn h-btn-ghost" href="#reward-machine"><Icon name="gift" size={16} /> {t("pf.toMachine")}</Link>
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

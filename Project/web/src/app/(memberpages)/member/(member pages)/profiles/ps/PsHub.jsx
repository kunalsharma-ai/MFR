"use client";
// Profile hub (design: "Rewards Club"): hero + a membership card for every profile the API returns.
// Data comes from POST /api/v1/profile (see page.jsx); nothing here talks to the backend.
import React, { Suspense, lazy, useDeferredValue, useMemo, useState, useSyncExternalStore } from "react";
import { useI18n } from "./i18n.js";
import { themeFor, MAP } from "./themes.js";
import { emojiUrl } from "./assets.js";
import ProgressRing from "./ProgressRing.jsx";
import MemberCard from "./MemberCard.jsx";
import Hero from "./Hero.jsx";
import { ISearch, IArrow, IEdit } from "./Icons.jsx";
import { subscribeRewards, rewardsVersion, pointsFor } from "./rules.js";
import { isCore } from "./profileRules.js";

// "Your Prize Machine": loads when the hub opens; a same-height placeholder keeps the page still meanwhile.
const PrizeMachine = lazy(() => import("./PrizeMachine.jsx"));

const norm = (s) => String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
/** Theme for a portal profile: by slug first, then by its name, otherwise the default "Aurora" card. */
export function themeOfProfile(p) {
  const s = String(p?.slug || "").toLowerCase();
  const key = MAP[s] ? s : MAP[norm(p?.name)] ? norm(p?.name) : s;
  return themeFor(key);
}
export const questionCount = (p) => (p?.pages || []).reduce((n, pg) => n + Math.max(0, (pg?.length || 1) - 1), 0);
export const progressOf = (p) => {
  const pct = Math.max(0, Math.min(100, Math.round(Number(p?.status) || 0)));
  return { pct, done: pct >= 100 };
};

function WorldCard({ p, i, onOpen, viaSurvey = false }) {
  const { t } = useI18n();
  const th = themeOfProfile(p);
  const st = progressOf(p);
  const q = questionCount(p);
  const name = p.name;
  const cls = st.done ? "is-done" : st.pct > 0 ? "is-going" : "is-new";
  return (
    <button type="button" className={`world ${cls} cat-b2c`} onClick={() => onOpen(p)} style={{ "--i": Math.min(i, 12) }} 
      aria-label={`${name} - ${t("hub.q", { n: q })}${st.done ? " - " + t("hub.done") : st.pct ? " - " + t("hub.progress", { p: st.pct }) : ""}`}>
      <MemberCard theme={th} name={name} done={st.done} variant="hub">
        <span className="mc-meta">
          <span>{t("hub.q", { n: q })}</span>
          <span className={`mc-pill ${st.done ? "ok" : st.pct ? "go" : ""}`}>
            {viaSurvey && !st.done ? <>{t("hub.survey")} <IArrow /></> : st.done ? <><IEdit /> {t("hub.review")}</> : st.pct ? t("hub.progress", { p: st.pct }) : <>{t("hub.start")} <IArrow /></>}
          </span>
        </span>
        <span className="mc-bar"><i style={{ transform: `scaleX(${st.pct / 100})` }} /></span>
        <span className={"mc-prize" + (st.done ? " got" : "")} aria-hidden="true">{st.done ? "✓ " + t("rw.earned", { n: pointsFor(p.slug) }) : t("rw.plus", { n: pointsFor(p.slug) })}</span>
      </MemberCard>
    </button>
  );
}

function Section({ id, title, emoji, count, children, tone }) {
  return (
    <section className={`hub-sec sec-${tone}`} aria-labelledby={id}>
      <h3 className="hub-sec-h" id={id}>
        <img src={emojiUrl(emoji)} alt="" width="34" height="34" aria-hidden="true" />
        <span>{title}</span>
        <span className="hub-sec-n">{count}</span>
      </h3>
      <div className="worlds">{children}</div>
    </section>
  );
}


export default function PsHub({ profiles, onOpen, cat = "b2c", rewardsReady = true, extraDone = [], prizeProfiles = profiles, allProfiles = profiles }) {
  const { t } = useI18n();
  useSyncExternalStore(subscribeRewards, rewardsVersion, rewardsVersion); // chips follow the points from the database
  const [q, setQ] = useState("");
  const dq = useDeferredValue(q);
  const list = useMemo(() => {
    const s = dq.trim().toLowerCase();
    return profiles.filter((p) => !s || String(p.name).toLowerCase().includes(s));
  }, [profiles, dq]);
  // Basic / Education / Professional / Financial are always "continue where you left off" until done, even at 0 %
  const goingNow = (p) => !progressOf(p).done && (progressOf(p).pct > 0 || isCore(p.slug));
  const going = list.filter(goingNow);
  const fresh = list.filter((p) => !progressOf(p).done && !goingNow(p));
  const s = dq.trim().toLowerCase();
  const doneExtra = extraDone.filter((p) => !s || String(p.name).toLowerCase().includes(s));
  const done = [...list.filter((p) => progressOf(p).done), ...doneExtra];
  const doneAll = allProfiles.filter((p) => progressOf(p).done).length;
  const pct = allProfiles.length ? Math.round(allProfiles.reduce((n, p) => n + progressOf(p).pct, 0) / allProfiles.length) : 0;
  // only Basic, Education, Professional and Financial are filled as profiles; every other card opens its survey (page.jsx)
  const viaSurveyOf = (p) => !isCore(p.slug);
  const stats = { profiles: allProfiles.length, done: doneAll, pct };
  return (
    <>
      <Hero stats={stats} onStart={() => document.getElementById("worlds")?.scrollIntoView({ behavior: "smooth" })} />
      <section className="hub wrap" id="worlds" aria-labelledby="hub-title">
        <div className="hub-head">
          <h2 id="hub-title">{t("hub.title")}</h2>
          <div className="hub-tools">
            <div className="seg" role="tablist" aria-label={t("hub.title")}>
              {/* Adults / Under 18 is decided at sign-up (date of birth) and never switched here */}
              <button type="button" role="tab" aria-selected="true" className="on" disabled>
                <img src={emojiUrl(cat === "minor" ? "child" : "person")} alt="" width="20" height="20" aria-hidden="true" /> {cat === "minor" ? t("hub.minors") : t("hub.adults")} <span className="seg-n">{allProfiles.length}</span>
              </button>
            </div>
            <label className="search">
              <ISearch />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("hub.search")} aria-label={t("hub.search")} />
            </label>
          </div>
          <div className="overall" aria-label={t("hub.complete")}>
            <ProgressRing pct={pct} size={64} stroke={7} label={`${t("hub.complete")} ${pct}%`}><b>{pct}%</b></ProgressRing>
            <div className="overall-txt">
              <b>{t("hub.complete")}</b>
              <span>{t("hub.count", { d: doneAll, t: allProfiles.length })}</span>
            </div>
          </div>
        </div>
        {rewardsReady ? (
          <Suspense fallback={<div className="pm-ph" id="rewards" aria-hidden="true" />}>
            <PrizeMachine key={cat + ":" + prizeProfiles.map((p) => p.slug).join(",")} cat={cat} onOpen={(p) => onOpen(prizeProfiles.find((x) => x.slug === p.s) || { slug: p.s })} />
          </Suspense>
        ) : <div className="pm-ph" id="rewards" aria-hidden="true" />}
        {!list.length && !doneExtra.length && <p className="empty">{t("hub.none")}</p>}
        {going.length > 0 && <Section id="sec-going" tone="going" emoji="hourglass" title={t("hub.sec.going")} count={going.length}>{going.map((p, i) => <WorldCard key={p.slug || p.name} p={p} i={i} onOpen={onOpen} viaSurvey={viaSurveyOf(p)} />)}</Section>}
        {fresh.length > 0 && <Section id="sec-new" tone="new" emoji="rocket" title={t("hub.sec.new")} count={fresh.length}>{fresh.map((p, i) => <WorldCard key={p.slug || p.name} p={p} i={i} onOpen={onOpen} viaSurvey={viaSurveyOf(p)} />)}</Section>}
        {done.length > 0 && <Section id="sec-done" tone="done" emoji="trophy" title={t("hub.sec.done")} count={done.length}>{done.map((p, i) => <WorldCard key={p.slug || p.name} p={p} i={i} onOpen={onOpen} viaSurvey={viaSurveyOf(p)} />)}</Section>}
      </section>
    </>
  );
}

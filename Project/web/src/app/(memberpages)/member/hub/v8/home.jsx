"use client";
// v8 dashboards (Kunal round 7, 24 Nov 2026). Three dashboards in the public website's look, each with its own
// order and modules, so a Consumer, a Professional and a Teen never see the same page:
//   Consumer      Reward burst banner · next moves · "Finish your profile" cards · picked surveys · today · quality
//                 and invites · badges · recent activity
//   Professional  banner with the KPI row · study table beside readiness and the quality gauge · earnings chart ·
//                 profile cards · today · extras · badges · ledger
//   Teen          rocket banner with level and XP · quests · guardian · profile cards · survey drops · badges · today
// Every figure comes from useHub() (store.js) or useSurveyDesk() (surveys.jsx); a value still loading shows "…".
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "../icons.jsx";
import Tile from "../tiles.jsx";
import Hero8 from "./hero.jsx";
import { t } from "../strings";
import { Reveal, LoadingBlock } from "../ui.jsx";
import { GuardianStatus } from "../modules.jsx";
import TodayStrip from "../engage/today.jsx";
import ProExtras from "../engage/pro.jsx";
import TeenExtras from "../engage/teen.jsx";
import { useSurveyDesk } from "../surveys.jsx";
import { fmt } from "../data";
import { profileTopic, profileArt } from "../topics";
import { useHub } from "../store";
import { Recent, Badges, ConsumerMoves, ConsumerPicks, ConsumerSide, EarningsChart, ProKpis, ProStudies, ProReadiness, TeenQuests, TeenDrops, Head } from "../home7.jsx";

const greet = () => { const h = new Date().getHours(); return h < 12 ? "pf.morning" : h < 18 ? "pf.afternoon" : "pf.evening"; };
const firstName = (m) => m?.firstname || (m?.fullname || "").split(" ")[0] || "";

function useGreet(member) {
  const [g, setG] = React.useState("");
  React.useEffect(() => setG(t(greet(), { name: firstName(member) })), [member]);
  return g;
}

function DashHero({ hub, desk }) {
  const { member, type, completion: c, quality: q, pts, level } = hub;
  const hello = useGreet(member);
  const open = desk.loading ? null : desk.openRows.length;
  const payPct = pts ? Math.min(100, Math.round((pts.total / pts.threshold) * 100)) : 0;
  const stats = [
    { label: t("hdr.profile"), value: c ? c.pct : "…", unit: "%", pct: c?.pct, tone: "a" },
    { label: t("hdr.quality"), value: q ? q.ten.toFixed(1) : "–", unit: "/10", pct: q?.pct, tone: "b" },
    type === "teen"
      ? { label: t("hdr.xp"), value: pts ? fmt(pts.total) : "…", unit: ` · L${level.n}`, pct: level.pct, tone: "c" }
      : { label: t("v7.c.wallet"), value: pts ? fmt(pts.total) : "…", unit: ` ${t("c.pts")}`, pct: payPct, tone: "c" },
    { label: type === "professional" ? t("v7.p.k5") : t("v7.c.m2"), value: open == null ? "…" : fmt(open), tone: "d" },
  ];
  const copy = {
    consumer: { title: t("v7.c.h1a"), accent: t("v7.c.h1b"), sub: t("v7.c.sub"), go: t("v8.d.goSurveys"), art: "gift", alt: t("v5.viewRewards"), altHref: "/member/rewards" },
    professional: { title: t("v8.d.proA"), accent: t("v8.d.proB"), sub: t("v7.p.sub"), go: t("v7.p.toStudies"), art: "profile", alt: t("v5.openProfiles"), altHref: "/member/profiles" },
    teen: { title: t("v7.t.h1a"), accent: t("v7.t.h1b"), sub: t("v8.d.teenSub"), go: t("v7.t.play"), art: "trophy", alt: t("v5.viewRewards"), altHref: "/member/rewards" },
  }[type] || {};
  return (
    <Hero8 kind="dashboard" id="d8-h" eyebrow={hello || " "} title={copy.title} accent={copy.accent} sub={copy.sub}
      actions={<>
        <Link href="/member/surveys" className="h-btn h-btn-primary h-btn-lg">{copy.go} <Icon name="arrow" size={18} /></Link>
        <Link href={copy.altHref} className="h-btn h-btn-ghost h-btn-lg"><Icon name={copy.art} size={18} /> {copy.alt}</Link>
      </>}
      stats={stats} />
  );
}

// The member's own profiles as rich cards (art, colours, progress, reward), the ones still open first.
function ProfileRow({ hub }) {
  const router = useRouter();
  const c = hub.completion;
  const list = c ? c.items.filter((i) => i.kind === "profile") : [];
  const open = list.filter((i) => !i.done);
  const rows = [...open, ...list.filter((i) => i.done)].slice(0, 6);
  const unit = hub.type === "teen" ? t("hdr.xp") : t("c.pts");
  return (
    <section className="h7 d8-profiles" aria-labelledby="d8-pf">
      <Head id="d8-pf" art={hub.type === "teen" ? "smile" : hub.type === "professional" ? "briefcase2" : "sparkle_heart"}
        title={open.length ? t("v8.d.pfTitle") : t("v8.d.pfDone")} sub={c ? t("v8.d.pfSub", { n: open.length, m: list.length }) : t("c.loading")}
        action={<Link href="/member/profiles" className="h7-link">{t("v5.openProfiles")} <Icon name="arrow" size={14} /></Link>} />
      {!c ? <LoadingBlock lines={2} h={180} /> : (
        <ul className="tc-grid d8-pf-grid">
          {rows.map((p, i) => {
            const tp = profileTopic({ slug: p.slug, name: p.label });
            const nk = `pf3.${tp.k}.title`;
            const name = t(nk) === nk ? p.label : t(nk);
            const pct = Math.round((p.progress || 0) * 100);
            const state = p.done ? "done" : pct > 0 ? "going" : "new";
            const cta = p.done ? t("v7.tile.update") : pct > 0 ? t("pf.continue") : t("pf.start");
            return (
              <Tile key={p.key} c1={tp.c1} c2={tp.c2} k={tp.k} kind="profile" art={profileArt(p.slug, tp)} name={name} topic={t("sx.profileTopic")}
                pts={p.reward ? fmt(p.reward) : null} unit={unit} state={state} stateLabel={t(`pf.state.${state}`, { n: pct })} pct={pct} cta={cta} i={i}
                onClick={() => router.push(p.href)} ariaLabel={`${name}. ${t(`pf.state.${state}`, { n: pct })}. ${cta}`} />
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ConsumerHome({ hub, desk }) {
  return (
    <div className="dash d8 d8-consumer">
      <DashHero hub={hub} desk={desk} />
      <ConsumerMoves hub={hub} desk={desk} />
      <Reveal><ProfileRow hub={hub} /></Reveal>
      <Reveal><ConsumerPicks hub={hub} desk={desk} /></Reveal>
      <Reveal className="d-today" id="today"><TodayStrip /></Reveal>
      <Reveal><ConsumerSide hub={hub} /></Reveal>
      <Reveal><Badges hub={hub} variant="shelf" /></Reveal>
      <Reveal><Recent hub={hub} art="chart2" /></Reveal>
    </div>
  );
}

function ProHome({ hub, desk }) {
  return (
    <div className="dash d8 d8-professional p7">
      <DashHero hub={hub} desk={desk} />
      <ProKpis hub={hub} desk={desk} />
      <div className="p7-main">
        <Reveal><ProStudies desk={desk} /></Reveal>
        <Reveal delay={60}><ProReadiness hub={hub} /></Reveal>
      </div>
      <div className="d8-duo">
        <Reveal><section className="h7 d8-earn" aria-label={t("v7.p.earn6")}><EarningsChart hub={hub} /></section></Reveal>
        <Reveal delay={60}><ConsumerSide hub={hub} /></Reveal>
      </div>
      <Reveal><ProfileRow hub={hub} /></Reveal>
      <Reveal className="d-today" id="today"><TodayStrip /></Reveal>
      <ProExtras />
      <Reveal><Badges hub={hub} variant="table" /></Reveal>
      <Reveal><Recent hub={hub} /></Reveal>
    </div>
  );
}

function TeenHome({ hub, desk }) {
  return (
    <div className="dash d8 d8-teen t7">
      <DashHero hub={hub} desk={desk} />
      <Reveal><TeenQuests hub={hub} desk={desk} /></Reveal>
      <Reveal><GuardianStatus member={hub.member} compact /></Reveal>
      <Reveal><ProfileRow hub={hub} /></Reveal>
      <Reveal><TeenDrops desk={desk} /></Reveal>
      <Reveal><Badges hub={hub} variant="wall" /></Reveal>
      <Reveal className="d-today" id="today"><TodayStrip /></Reveal>
      <TeenExtras />
      <Reveal><Recent hub={hub} art="fire" /></Reveal>
    </div>
  );
}

export default function Home8() {
  const hub = useHub();
  const desk = useSurveyDesk();
  if (hub.type === "professional") return <ProHome hub={hub} desk={desk} />;
  if (hub.type === "teen") return <TeenHome hub={hub} desk={desk} />;
  return <ConsumerHome hub={hub} desk={desk} />;
}

"use client";
// v8 (Kunal round 7, 24 Nov 2026): the animated art on the right of every section banner, drawn in the public
// website's own language: glossy 3D art, frosted glass cards that float, a warm sunburst and soft blobs.
// Each section has its own scene, so no two banners repeat:
//   dashboard  Reward burst      a 3D coin (rocket for teens, chart for professionals) in a turning sunburst, with
//                                three glass cards floating around it (survey done, points added, payout / level)
//   profile    Profile builder   a glass ID card whose fields fill one by one and tick, a ring closing around it
//   surveys    Live poll         a poll card: a tap picks an answer, the bar fills and a coin drops into the jar
//   services   Service orbit     a hub with service tiles riding an elliptical orbit
//   rewards    Gift fountain     a gift box whose lid lifts and coins fountain out
//   quality    Score dial        a dial that sweeps to the member's real score, stars popping at the top
//   referrals  Friend network    friends linked to you by flowing dashed lines, bonus chips travelling in
//   other      Floating stage    the section's 3D art on a glass plinth with orbiting sparkles
// Each member type has its own colours (website: Consumer orange/pink, Professional blue/indigo/gold, Teen
// violet/pink/lime) and its own extras. Everything is decorative (aria-hidden) and shows no invented numbers;
// only the quality dial uses the member's real score.
import React from "react";
import { useMember } from "@/Context";
import { memberTypeOf } from "../data";
import { usePrefs, motionReduced } from "../prefs";
import { t } from "../strings";
import Icon from "../icons.jsx";

const E = (n) => `/ps/images/emoji/${n}.webp`;
const Img = ({ n, className = "" }) => <img className={className} src={E(n)} alt="" decoding="async" loading="lazy" draggable="false" />;

const HERO = {
  dashboard: { consumer: "coin", professional: "chart", teen: "rocket" },
  profile: { consumer: "sparkle_heart", professional: "briefcase2", teen: "smile" },
  surveys: { consumer: "shoppingbag", professional: "research", teen: "game" },
  services: { consumer: "services", professional: "stopwatch", teen: "lightning" },
  rewards: { consumer: "gift", professional: "money", teen: "trophy" },
  quality: { consumer: "star", professional: "verified", teen: "medal" },
  referrals: { consumer: "handshake", professional: "handshake", teen: "party" },
  activity: { consumer: "chart2", professional: "chart2", teen: "lightning" },
  messages: { consumer: "envelope", professional: "mail", teen: "sms" },
  account: { consumer: "key", professional: "shield", teen: "lock" },
  settings: { consumer: "tools", professional: "tools", teen: "tools" },
  help: { consumer: "question", professional: "phonecall", teen: "question" },
};
export const heroArt = (kind, type) => (HERO[kind] || HERO.dashboard)[type] || HERO.dashboard.consumer;

function Glass({ icon, label, className = "", style }) {
  return (
    <span className={`a8-glass ${className}`} style={style}>
      <i className="a8-glass-ic"><Icon name={icon} size={14} /></i>
      <b>{label}</b>
    </span>
  );
}
const Sparks = ({ n = 6 }) => Array.from({ length: n }, (_, i) => <i key={i} className="a8-spark" style={{ "--i": i }} />);

function Dashboard({ type, art }) {
  const cards = type === "teen"
    ? [["flame", t("a8.streak")], ["star", t("a8.xp")], ["rocket", t("a8.levelUp")]]
    : type === "professional"
      ? [["check", t("a8.studyDone")], ["coin", t("a8.pointsIn")], ["bank", t("a8.payout")]]
      : [["check", t("a8.surveyDone")], ["coin", t("a8.pointsIn")], ["gift", t("a8.payout")]];
  return (
    <>
      <span className="a8-rays" />
      <span className="a8-blob b1" /><span className="a8-blob b2" />
      <span className="a8-hero a8-float"><Img n={art} /></span>
      <span className="a8-shadow" />
      {cards.map(([ic, l], i) => <Glass key={i} icon={ic} label={l} className={`d-c${i}`} style={{ "--i": i }} />)}
      <span className="a8-note n1"><Img n={type === "teen" ? "star2" : "dollar"} /></span>
      <span className="a8-note n2"><Img n={type === "teen" ? "fire" : "coin"} /></span>
      <Sparks />
    </>
  );
}

function Profile({ type, art }) {
  return (
    <>
      <span className="a8-blob b1" /><span className="a8-blob b2" />
      <span className="a8-idcard">
        <span className="a8-id-top">
          <span className="a8-id-ring"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" className="bg" /><circle cx="22" cy="22" r="18" className="fg" pathLength="100" /></svg><Img n={type === "teen" ? "smile" : type === "professional" ? "person" : "woman"} /></span>
          <span className="a8-id-name"><i /><i /></span>
        </span>
        {[0, 1, 2, 3].map((i) => <span key={i} className="a8-id-row" style={{ "--i": i }}><i className="bar" /><i className="tick"><Icon name="check" size={10} /></i></span>)}
      </span>
      <span className="a8-hero sm a8-float p-art"><Img n={art} /></span>
      <Glass icon="spark" label={t("a8.betterMatches")} className="p-c0" />
      <Sparks n={5} />
    </>
  );
}

function Surveys({ type, art }) {
  return (
    <>
      <span className="a8-blob b1" /><span className="a8-blob b2" />
      <span className="a8-poll">
        <span className="a8-poll-q"><i /><i /></span>
        {[0, 1, 2].map((i) => <span key={i} className={`a8-poll-o o${i}`}><i className="dot" /><i className="bar" /></span>)}
        <span className="a8-tap"><Icon name="arrow" size={14} /></span>
      </span>
      <span className="a8-jar"><span className="a8-coin-drop"><Img n={type === "teen" ? "star2" : "coin"} /></span><Img n={type === "teen" ? "game" : "piggy"} className="jar" /></span>
      <span className="a8-hero sm a8-float s-art"><Img n={art} /></span>
      <Sparks n={5} />
    </>
  );
}

function Services({ type, art }) {
  const sats = type === "teen" ? ["game", "music", "trophy", "star2", "fire"] : type === "professional" ? ["chart2", "briefcase2", "verified", "calendar", "mail"] : ["shoppingbag", "coin", "calendar", "gift", "mail"];
  return (
    <>
      <span className="a8-blob b1" /><span className="a8-blob b2" />
      <span className="a8-orbit-ring" />
      <span className="a8-hub"><Img n={art} /></span>
      {sats.map((s, i) => <span key={s} className="a8-sat" style={{ "--i": i, "--n": sats.length }}><span><Img n={s} /></span></span>)}
      <Sparks n={4} />
    </>
  );
}

function Rewards({ type, art }) {
  const coin = type === "teen" ? "star2" : "coin";
  return (
    <>
      <span className="a8-rays" />
      <span className="a8-blob b1" /><span className="a8-blob b2" />
      <span className="a8-fount">{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ "--i": i }}><Img n={i % 3 === 2 && type !== "teen" ? "dollar" : coin} /></i>)}</span>
      <span className="a8-hero a8-gift"><Img n={art} /></span>
      <span className="a8-shadow" />
      <Glass icon={type === "teen" ? "star" : "coin"} label={type === "teen" ? t("a8.xp") : t("a8.pointsIn")} className="r-c0" />
      <Sparks />
    </>
  );
}

function Quality({ type, art, score }) {
  const pct = Math.max(0, Math.min(100, score == null ? 70 : score * 10));
  return (
    <>
      <span className="a8-blob b1" /><span className="a8-blob b2" />
      <span className="a8-dial" style={{ "--v": pct }}>
        <svg viewBox="0 0 200 120">
          <defs><linearGradient id="a8-dial-g" x1="0" x2="1"><stop offset="0" stopColor="var(--a3)" /><stop offset=".55" stopColor="var(--a2)" /><stop offset="1" stopColor="var(--a1)" /></linearGradient></defs>
          <path className="trk" d="M20 110 A80 80 0 0 1 180 110" pathLength="100" />
          <path className="val" d="M20 110 A80 80 0 0 1 180 110" pathLength="100" stroke="url(#a8-dial-g)" />
          {Array.from({ length: 11 }, (_, i) => { const a = Math.PI * (1 - i / 10); return <line key={i} className="tick" x1={100 + Math.cos(a) * 66} y1={110 - Math.sin(a) * 66} x2={100 + Math.cos(a) * 72} y2={110 - Math.sin(a) * 72} />; })}
        </svg>
        <span className="a8-needle" />
        <span className="a8-dial-v">{score == null ? "–" : score.toFixed(1)}<small>/10</small></span>
      </span>
      <span className="a8-hero sm a8-float q-art"><Img n={art} /></span>
      {[0, 1, 2].map((i) => <span key={i} className="a8-star" style={{ "--i": i }}><Img n="star2" /></span>)}
      <Sparks n={4} />
    </>
  );
}

function Referrals({ type, art }) {
  const people = type === "teen" ? ["smile", "child", "person", "woman"] : ["woman", "man", "person", "family"];
  return (
    <>
      <span className="a8-blob b1" /><span className="a8-blob b2" />
      <svg className="a8-net" viewBox="0 0 300 220" preserveAspectRatio="none">
        {[[60, 50], [250, 45], [40, 175], [258, 170]].map(([x, y], i) => <path key={i} d={`M150 110 Q ${(150 + x) / 2 + (i % 2 ? 20 : -20)} ${(110 + y) / 2 - 18} ${x} ${y}`} pathLength="100" style={{ "--i": i }} />)}
      </svg>
      {people.map((p, i) => <span key={i} className={`a8-friend f${i}`} style={{ "--i": i }}><Img n={p} /></span>)}
      <span className="a8-hub me"><Img n={art} /></span>
      <Glass icon="plus" label={t("a8.bonus")} className="f-c0" />
      <Sparks n={4} />
    </>
  );
}

function Stage({ art }) {
  return (
    <>
      <span className="a8-rays soft" />
      <span className="a8-blob b1" /><span className="a8-blob b2" />
      <span className="a8-plinth" />
      <span className="a8-hero a8-float"><Img n={art} /></span>
      <Sparks />
    </>
  );
}

const SCENES = { dashboard: Dashboard, profile: Profile, surveys: Surveys, services: Services, rewards: Rewards, quality: Quality, referrals: Referrals };

export default function Art8({ kind = "dashboard", score = null }) {
  const member = useMember();
  const type = memberTypeOf(member) || "consumer";
  const prefs = usePrefs();
  const still = motionReduced(prefs);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    const host = el?.closest("section") || el;
    if (!el || !host || still || typeof window === "undefined" || !window.matchMedia?.("(pointer: fine)").matches) return undefined;
    let raf = 0;
    const move = (e) => {
      const r = host.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { el.style.setProperty("--mx", x.toFixed(3)); el.style.setProperty("--my", y.toFixed(3)); });
    };
    const leave = () => { el.style.setProperty("--mx", 0); el.style.setProperty("--my", 0); };
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    return () => { cancelAnimationFrame(raf); host.removeEventListener("pointermove", move); host.removeEventListener("pointerleave", leave); };
  }, [still]);
  const Scene = SCENES[kind] || Stage;
  return (
    <div className={`a8 a8-${SCENES[kind] ? kind : "stage"} a8-t-${type} ${still ? "is-still" : ""}`} ref={ref} aria-hidden="true">
      <Scene type={type} art={heroArt(kind, type)} score={score} />
    </div>
  );
}

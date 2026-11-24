"use client";
// v8.1 (Kunal round 8, 24 Nov 2026): the animated art on the right of every section banner, rebuilt to be sharp and
// truly 3D. The centre of each scene is drawn in CSS 3D (real depth with perspective and preserve-3d), so it stays
// crisp at any screen density; the 3D emoji art comes from the 256px set in public/hub/3d and is never shown larger
// than 128px. Each section has its own scene and each member type its own colours and objects:
//   dashboard  Reward coin       a thick gold coin spinning in 3D on a glowing podium, 3D art riding a tilted orbit,
//                                glass cards floating around (survey done, points added, payout / level)
//   profile    Profile builder   a glass ID card turning in 3D, its fields filling and ticking, layers at depth
//   surveys    Live poll phone   a 3D phone with a poll: a tap picks an answer and coins pop out toward you
//   services   Service orbit     service art riding a tilted 3D ring around a glowing hub
//   rewards    Gift box          a 3D gift box turning, its lid lifts and coins fountain out
//   quality    Score gauge       a glass gauge tilted in 3D that sweeps to the member's real score
//   referrals  Friend network    friends on a tilted plane linked by flowing lines, bonus chips travelling in
//   other      Podium            the section's art on a 3D podium with a turning light ring
// Everything is decorative (aria-hidden) and shows no invented numbers; only the gauge uses the member's real score.
import React from "react";
import { useMember } from "@/Context";
import { memberTypeOf } from "../data";
import { usePrefs, motionReduced } from "../prefs";
import { t } from "../strings";
import Icon from "../icons.jsx";

const E = (n) => `/hub/3d/${n}.webp`;
const Img = ({ n, className = "" }) => <img className={className} src={E(n)} alt="" width="128" height="128" decoding="async" draggable="false" />;

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
const Podium = () => <span className="a8-podium" aria-hidden="true"><i className="top" /><i className="side" /><i className="ring" /></span>;

// emblems for the coin faces, drawn as vectors so they stay sharp
const EMBLEM = {
  consumer: "M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z",
  professional: "M3 17l5.5-5.5 4 4L21 7m0 0h-6m6 0v6",
  teen: "M13.5 2L5 13.5h6L10 22l9-12h-6.2z",
};
function Coin3D({ type }) {
  const d = EMBLEM[type] || EMBLEM.consumer;
  const stroke = type === "professional";
  const face = (cls) => (
    <b className={`c3-face ${cls}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true">{stroke ? <path d={d} fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /> : <path d={d} />}</svg>
    </b>
  );
  return (
    <span className="a8-coin3d">
      <span className="c3-spin">
        {Array.from({ length: 14 }, (_, i) => <i key={i} style={{ "--z": i }} />)}
        {face("front")}{face("back")}
      </span>
      <span className="c3-shine" />
    </span>
  );
}

function Orbit({ items, className = "" }) {
  return (
    <span className={`a8-orbit3d ${className}`}>
      <span className="o3-ring" />
      {items.map((n, i) => (
        <span key={n + i} className="o3-sat" style={{ "--i": i, "--n": items.length }}><span className="o3-face"><Img n={n} /></span></span>
      ))}
    </span>
  );
}

function Dashboard({ type }) {
  const cards = type === "teen"
    ? [["flame", t("a8.streak")], ["star", t("a8.xp")], ["rocket", t("a8.levelUp")]]
    : type === "professional"
      ? [["check", t("a8.studyDone")], ["coin", t("a8.pointsIn")], ["bank", t("a8.payout")]]
      : [["check", t("a8.surveyDone")], ["coin", t("a8.pointsIn")], ["gift", t("a8.payout")]];
  const sats = type === "teen" ? ["rocket", "game", "star2"] : type === "professional" ? ["chart", "briefcase2", "trophy"] : ["gift", "shoppingbag", "money"];
  return (
    <>
      <span className="a8-rays" />
      <span className="a8-blob b1" /><span className="a8-blob b2" />
      <Podium />
      <Orbit items={sats} className="back" />
      <Coin3D type={type} />
      {cards.map(([ic, l], i) => <Glass key={i} icon={ic} label={l} className={`d-c${i}`} style={{ "--i": i }} />)}
      <Sparks />
    </>
  );
}

function Profile({ type, art }) {
  return (
    <>
      <span className="a8-blob b1" /><span className="a8-blob b2" />
      <Podium />
      <span className="a8-card3d">
        <span className="k3-card">
          <span className="a8-id-top">
            <span className="a8-id-ring"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" className="bg" /><circle cx="22" cy="22" r="18" className="fg" pathLength="100" /></svg><Img n={type === "teen" ? "smile" : type === "professional" ? "person" : "woman"} /></span>
            <span className="a8-id-name"><i /><i /></span>
          </span>
          {[0, 1, 2, 3].map((i) => <span key={i} className="a8-id-row" style={{ "--i": i }}><i className="bar" /><i className="tick"><Icon name="check" size={10} /></i></span>)}
          <span className="k3-badge"><Img n={art} /></span>
        </span>
      </span>
      <span className="a8-pop p1"><Img n={type === "teen" ? "star2" : "sparkles"} /></span>
      <span className="a8-pop p2"><Img n={type === "professional" ? "verified" : "check"} /></span>
      <Glass icon="spark" label={t("a8.betterMatches")} className="p-c0" />
      <Sparks n={5} />
    </>
  );
}

function Surveys({ type, art }) {
  const coin = type === "teen" ? "star2" : "coin";
  return (
    <>
      <span className="a8-blob b1" /><span className="a8-blob b2" />
      <Podium />
      <span className="a8-phone3d">
        <span className="ph3">
          <span className="ph3-notch" />
          <span className="a8-poll-q"><i /><i /></span>
          {[0, 1, 2].map((i) => <span key={i} className={`a8-poll-o o${i}`}><i className="dot" /><i className="bar" /></span>)}
          <span className="ph3-btn" />
          <span className="a8-tap"><Icon name="arrow" size={14} /></span>
        </span>
        <span className="ph3-edge" />
      </span>
      {[0, 1, 2, 3].map((i) => <span key={i} className="a8-burst" style={{ "--i": i }}><Img n={i % 2 ? art : coin} /></span>)}
      <Glass icon={type === "teen" ? "star" : "coin"} label={type === "teen" ? t("a8.xp") : t("a8.pointsIn")} className="s-c0" />
      <Sparks n={5} />
    </>
  );
}

function Services({ type, art }) {
  const sats = type === "teen" ? ["game", "music", "trophy", "star2", "fire"] : type === "professional" ? ["chart2", "briefcase2", "verified", "calendar", "mail"] : ["shoppingbag", "coin", "calendar", "gift", "mail"];
  return (
    <>
      <span className="a8-blob b1" /><span className="a8-blob b2" />
      <Podium />
      <Orbit items={sats} className="wide" />
      <span className="a8-hub3d"><Img n={art} /></span>
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
      <Podium />
      <span className="a8-fount">{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ "--i": i }}><Img n={i % 3 === 2 && type !== "teen" ? "dollar" : coin} /></i>)}</span>
      <span className="a8-box3d">
        <span className="b3">
          {["front", "back", "left", "right", "bottom"].map((f) => <i key={f} className={`b3-f ${f}`} />)}
          <span className="b3-lid">{["top", "front", "back", "left", "right"].map((f) => <i key={f} className={`b3-l ${f}`} />)}<b className="b3-bow" /></span>
        </span>
      </span>
      <span className="a8-pop p1"><Img n={art} /></span>
      <Glass icon={type === "teen" ? "star" : "coin"} label={type === "teen" ? t("a8.xp") : t("a8.pointsIn")} className="r-c0" />
      <Sparks />
    </>
  );
}

function Quality({ art, score }) {
  const pct = Math.max(0, Math.min(100, score == null ? 70 : score * 10));
  return (
    <>
      <span className="a8-blob b1" /><span className="a8-blob b2" />
      <span className="a8-gauge3d">
        <span className="a8-dial" style={{ "--v": pct }}>
          <svg viewBox="0 0 200 120">
            <defs><linearGradient id="a8-dial-g" x1="0" x2="1"><stop offset="0" stopColor="var(--a3)" /><stop offset=".55" stopColor="var(--a2)" /><stop offset="1" stopColor="var(--a1)" /></linearGradient></defs>
            <path className="trk" d="M20 110 A80 80 0 0 1 180 110" pathLength="100" />
            <path className="val" d="M20 110 A80 80 0 0 1 180 110" pathLength="100" stroke="url(#a8-dial-g)" />
            {Array.from({ length: 11 }, (_, i) => { const a = Math.PI * (1 - i / 10); return <line key={i} className="tick" x1={100 + Math.cos(a) * 64} y1={110 - Math.sin(a) * 64} x2={100 + Math.cos(a) * 71} y2={110 - Math.sin(a) * 71} />; })}
          </svg>
          <span className="a8-needle" />
          <span className="a8-dial-v">{score == null ? "–" : score.toFixed(1)}<small>/10</small></span>
        </span>
      </span>
      <span className="a8-pop q1"><Img n={art} /></span>
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
      <span className="a8-plane3d">
        <svg className="a8-net" viewBox="0 0 300 220" preserveAspectRatio="none">
          {[[60, 50], [250, 45], [40, 175], [258, 170]].map(([x, y], i) => <path key={i} d={`M150 110 Q ${(150 + x) / 2 + (i % 2 ? 20 : -20)} ${(110 + y) / 2 - 18} ${x} ${y}`} pathLength="100" style={{ "--i": i }} />)}
        </svg>
      </span>
      {people.map((p, i) => <span key={i} className={`a8-friend f${i}`} style={{ "--i": i }}><Img n={p} /></span>)}
      <span className="a8-hub3d me"><Img n={art} /></span>
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
      <Podium />
      <span className="a8-hub3d solo"><Img n={art} /></span>
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
      <div className="a8-world">
        <Scene type={type} art={heroArt(kind, type)} score={score} />
      </div>
    </div>
  );
}

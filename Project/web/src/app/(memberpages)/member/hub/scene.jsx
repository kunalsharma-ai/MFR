"use client";
// v7 (Kunal round 6, 23 Nov 2026): the animated art on the right of every banner. Each member type has its own
// stage and its own motion, and each section its own HD 3D art (public/ps/images/emoji):
//   Consumer      "Spotlight"   a glossy turntable under the section's art, three reward satellites on a tilted orbit,
//                               soft light rays and drifting sparkles. Smooth and premium.
//   Professional  "Glass board" three frosted glass panels in perspective; a gold line chart draws itself, bars rise
//                               and a gold pulse travels the line. Calm and precise.
//   Teen          "Sticker burst" a spinning starburst behind the bouncing art, stickers pop in one after another
//                               around a level ring. Energetic and playful.
// Everything is decorative (aria-hidden) and holds no numbers, so it never shows anything the data does not.
// The stage tilts with the pointer; reduced motion stops the movement and the tilt.
import React from "react";
import { useMember } from "@/Context";
import { usePrefs, motionReduced } from "./prefs";
import { memberTypeOf } from "./data";

const E = (n) => `/ps/images/emoji/${n}.webp`;

// the section's main art, per member type (teens never get money art)
const ART = {
  dashboard: { consumer: "gift", professional: "chart", teen: "rocket" },
  profile: { consumer: "sparkle_heart", professional: "briefcase2", teen: "smile" },
  surveys: { consumer: "shoppingbag", professional: "research", teen: "game" },
  rewards: { consumer: "gift", professional: "money", teen: "trophy" },
  quality: { consumer: "star", professional: "verified", teen: "medal" },
  activity: { consumer: "chart2", professional: "chart2", teen: "lightning" },
  referrals: { consumer: "handshake", professional: "handshake", teen: "party" },
  messages: { consumer: "envelope", professional: "mail", teen: "sms" },
  account: { consumer: "key", professional: "shield", teen: "lock" },
  settings: { consumer: "tools", professional: "tools", teen: "tools" },
  help: { consumer: "question", professional: "phonecall", teen: "question" },
  services: { consumer: "clock", professional: "stopwatch", teen: "hourglass" },
};
const SATS = {
  consumer: ["coin", "sparkles", "shoppingbag"],
  professional: ["chart2", "briefcase2", "verified"],
  teen: ["lightning", "fire", "star2", "game"],
};

const KIND_TO_SCENE = { "dash-c": "dashboard", "dash-p": "dashboard", "dash-t": "dashboard" };
export const sceneKey = (kind) => KIND_TO_SCENE[kind] || kind;

function Spotlight({ art }) {
  return (
    <>
      <span className="s7-rays" />
      <span className="s7-orbit"><i /></span>
      <span className="s7-table"><i /></span>
      <span className="s7-art"><img src={E(art)} alt="" decoding="async" /></span>
      {SATS.consumer.map((s, i) => <span key={s} className={`s7-sat q${i}`}><img src={E(s)} alt="" loading="lazy" decoding="async" /></span>)}
      {[0, 1, 2, 3, 4, 5].map((i) => <i key={i} className="s7-spark" style={{ "--i": i }} />)}
    </>
  );
}

function GlassBoard({ art }) {
  return (
    <>
      <span className="s7-grid" />
      <span className="s7-pane p3" />
      <span className="s7-pane p2"><span className="s7-bars">{[38, 62, 48, 80, 66].map((h, i) => <i key={i} style={{ "--h": h, "--i": i }} />)}</span></span>
      <span className="s7-pane p1">
        <svg viewBox="0 0 200 110" preserveAspectRatio="none">
          <path className="s7-area" d="M8 96 L44 74 L80 82 L116 48 L152 56 L192 18 L192 104 L8 104 Z" />
          <path className="s7-line" pathLength="100" d="M8 96 L44 74 L80 82 L116 48 L152 56 L192 18" />
          <circle className="s7-dot" r="4.5" cx="192" cy="18" />
        </svg>
      </span>
      <span className="s7-art"><img src={E(art)} alt="" decoding="async" /></span>
    </>
  );
}

function StickerBurst({ art }) {
  return (
    <>
      <span className="s7-burst" />
      <span className="s7-lvl"><i /></span>
      <span className="s7-art"><img src={E(art)} alt="" decoding="async" /></span>
      {SATS.teen.map((s, i) => <span key={s} className={`s7-stk q${i}`} style={{ "--i": i }}><img src={E(s)} alt="" loading="lazy" decoding="async" /></span>)}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <i key={i} className="s7-dot2" style={{ "--i": i }} />)}
    </>
  );
}

export default function Scene3D({ kind, children }) {
  const member = useMember();
  const type = memberTypeOf(member) || "consumer";
  const key = sceneKey(kind);
  const art = (ART[key] || ART.dashboard)[type] || ART.dashboard.consumer;
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
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--ry", `${(x * 14).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
      });
    };
    const leave = () => { el.style.setProperty("--ry", "0deg"); el.style.setProperty("--rx", "0deg"); };
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    return () => { cancelAnimationFrame(raf); host.removeEventListener("pointermove", move); host.removeEventListener("pointerleave", leave); };
  }, [still]);

  const Stage = type === "professional" ? GlassBoard : type === "teen" ? StickerBurst : Spotlight;
  return (
    <div ref={ref} className={`s7 s7-${type} s7-k-${key}`} data-still={still ? "1" : undefined}>
      <div className="s7-stage" aria-hidden="true"><Stage art={art} /></div>
      {children ? <div className="s3-front s7-front">{children}</div> : null}
    </div>
  );
}

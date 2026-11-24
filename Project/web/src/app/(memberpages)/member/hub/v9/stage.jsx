"use client";
// Round 9 (Kunal, 24 Nov 2026): every section gets its own hero world. The banner wears the world's sky (from
// Kunal's minor suite) and the right side holds the world's rendered 3D art on a glowing ring, with three stickers on
// an orbit and drifting sparkles. Each section has a different world, and the member types differ where it matters
// (teens never get money art). Decorative only (aria-hidden); numbers stay in the text and stats.
import React from "react";
import { WORLDS } from "./worlds";

// section → world, per member type (consumer, professional, teen)
const HERO = {
  dashboard: ["celebrate", "atlas", "arcade"],
  profile: ["sunrise", "sunrise", "sunrise"],
  surveys: ["lab", "lab", "feed"],
  rewards: ["treasury", "treasury", "celebrate"],
  quality: ["sentry", "sentry", "sentry"],
  activity: ["future", "future", "future"],
  referrals: ["hearth", "hearth", "hearth"],
  messages: ["feed", "feed", "feed"],
  account: ["trust", "trust", "trust"],
  settings: ["circuit", "circuit", "circuit"],
  help: ["care", "care", "care"],
};
const IDX = { consumer: 0, professional: 1, teen: 2 };
const KIND = { "dash-c": "dashboard", "dash-p": "dashboard", "dash-t": "dashboard" };
const NO_MONEY = new Set(["coin", "money", "piggy", "bank_note", "rewards"]);

export function heroWorld(kind, type) {
  const row = HERO[KIND[kind] || kind];
  return row ? row[IDX[type] ?? 0] : null;
}

// the sky as CSS variables (prefixed, so they never clash with the hub's own --card / --muted tokens)
export function skyVars(key) {
  const w = WORLDS[key] || WORLDS.celebrate;
  const [s0, s1, s2, s3] = w.sky;
  return { "--hs0": s0, "--hs1": s1, "--hs2": s2, "--hs3": s3 || s2, "--ha1": w.a1, "--ha2": w.a2, "--ha3": w.a3 };
}
export const isDarkWorld = (key) => Boolean((WORLDS[key] || WORLDS.celebrate).dark);

export default function WorldStage({ world, type, badge }) {
  const w = WORLDS[world] || WORLDS.celebrate;
  const stickers = (w.stickers || []).filter((s) => type !== "teen" || !NO_MONEY.has(s)).slice(0, 3);
  return (
    <span className={`ws9 ws9-${world}`} aria-hidden="true">
      <span className="ws9-glow" />
      <span className="ws9-ring r1" />
      <span className="ws9-ring r2" />
      <span className="ws9-disc" />
      <img className="ws9-art" src={`/hub/worlds/${w.art}.webp`} alt="" width="360" height="360" decoding="async" />
      <span className="ws9-orbit">
        {stickers.map((s, i) => <span key={s} className={`ws9-stk k${i}`}><img src={`/hub/3d/${s}.webp`} alt="" width="56" height="56" loading="lazy" decoding="async" /></span>)}
      </span>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <i key={i} className="ws9-sp" style={{ "--i": i }} />)}
      {badge ? <span className="ws9-badge">{badge}</span> : null}
    </span>
  );
}

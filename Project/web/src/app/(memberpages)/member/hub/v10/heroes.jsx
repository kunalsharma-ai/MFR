"use client";
// Round 10 (Kunal, 24 Nov 2026): every section hero is designed for its segment, so a Consumer, a Professional and a
// Teen each feel they are in their own panel, and every section has its own art, colours and objects.
//   Consumer      "Pop-up store"     warm daylight colours; the section's 3D object on a glossy two-tier pedestal in
//                                    front of a big sun disc with rays, lifestyle objects floating in glass bubbles,
//                                    confetti ribbons
//   Professional  "Glass boardroom"  deep navy; a perspective grid floor, frosted glass panels with a line chart, bars
//                                    and a ring, the section's object on a lit plinth with a gold halo, objects on
//                                    small glass tiles
//   Teen          "Sticker arcade"   night-neon colours; a spinning starburst, halftone dots, die-cut stickers with
//                                    white borders that pop in, neon squiggles, the section's object bouncing
// Each section has a main object and five objects of its own per segment (ART below), and its own palette (PAL).
// Teens never get money art. Everything is decorative (aria-hidden) and shows no numbers.
import React from "react";

const E = (n) => `/hub/3d/${n}.webp`;
const SEG = { consumer: 0, professional: 1, teen: 2 };
const KIND = { "dash-c": "dashboard", "dash-p": "dashboard", "dash-t": "dashboard", profiles: "profile", myaccount: "account" };

// [main, ...five satellites] per section, per segment
export const ART = {
  dashboard: [["shoppingbag", "gift", "coffee", "coin", "sparkles", "heart"], ["briefcase2", "chart", "globe", "desktop", "target", "chart2"], ["rocket", "game", "music", "star2", "fire", "joystick"]],
  profile: [["sparkle_heart", "shirt", "house2", "coffee", "airplane_dep", "pet"], ["id", "briefcase2", "university", "graduation", "home_office", "verified"], ["smile", "art", "basketball", "guitar", "book", "music"]],
  surveys: [["shoppingbag", "cart", "tag", "clipboard", "coin", "sms"], ["research", "clipboard", "mag", "chart", "ballot", "stopwatch"], ["game", "console", "dice", "speech", "ballot", "popcorn"]],
  rewards: [["gift", "coin", "piggy", "ticket", "crown", "confetti"], ["money", "coin", "bank_note", "banking", "trophy", "gem"], ["trophy", "crown", "star2", "medal", "ticket", "gem"]],
  quality: [["star", "medal", "verified", "thumbsup", "trophy2", "target"], ["verified", "shield", "medal", "target", "chart2", "crown"], ["medal", "star", "target", "thumbsup", "verified", "lightning"]],
  activity: [["chart2", "calendar", "clock", "check", "fire", "coin"], ["chart", "calendar", "clock", "check", "hourglass", "chart2"], ["lightning", "fire", "calendar", "check", "chart2", "rocket"]],
  referrals: [["handshake", "family_mwg", "envelope", "gift", "party", "heart"], ["handshake", "megaphone", "globe", "envelope", "person", "woman"], ["party", "confetti", "popper", "handshake", "balloon", "sparkles"]],
  messages: [["envelope", "mail", "speech", "bell", "inbox", "sms"], ["mail", "inbox", "speech", "bell", "phonecall", "memo"], ["sms", "speech", "chat2", "bell", "thought", "envelope"]],
  account: [["key", "id", "shield", "lock", "verified", "crown"], ["shield", "key", "lockkey", "id", "verified", "briefcase2"], ["lock", "id", "shield", "key", "sparkles", "smile"]],
  settings: [["tools", "gear", "wrench", "bulb", "paint", "speaker"], ["gear", "tools", "wrench", "desktop", "keyboard", "wifi"], ["tools", "gear", "speaker", "paint", "vr", "wifi"]],
  help: [["question", "phonecall", "chat2", "bulb", "book", "ok_hand"], ["phonecall", "question", "chat2", "book", "bulb", "mic"], ["question", "bulb", "book", "chat2", "ok_hand", "school"]],
};

// palettes: [bg1, bg2, bg3, accent1, accent2] per section, per segment
export const PAL = {
  dashboard: [["#fff3e6", "#ffd9c2", "#ffb3c7", "#ff6a1a", "#e8336d"], ["#071029", "#0d2457", "#1b3a8a", "#f5b301", "#38bdf8"], ["#1a0838", "#4c1d95", "#be185d", "#a3e635", "#22d3ee"]],
  profile: [["#fff6ec", "#ffe0cc", "#ffc9d6", "#f97316", "#db2777"], ["#061a24", "#0b3b4a", "#115e59", "#f5b301", "#2dd4bf"], ["#14093a", "#5b21b6", "#db2777", "#facc15", "#22d3ee"]],
  surveys: [["#fff1ee", "#ffd3c8", "#e9d5ff", "#f43f5e", "#7c3aed"], ["#08132e", "#132f6b", "#1e40af", "#fbbf24", "#60a5fa"], ["#0b1240", "#1e3a8a", "#7c3aed", "#f472b6", "#34d399"]],
  rewards: [["#fffbea", "#ffecb3", "#ffd29a", "#d97706", "#ea580c"], ["#120d02", "#3b2a06", "#6b4a0b", "#fcd34d", "#f59e0b"], ["#1f0a3a", "#6d28d9", "#f59e0b", "#fde047", "#fb7185"]],
  quality: [["#effcf6", "#c9f2df", "#bfe8ff", "#059669", "#0284c7"], ["#03201a", "#064e3b", "#0f766e", "#fbbf24", "#34d399"], ["#081a3a", "#0e7490", "#4f46e5", "#a3e635", "#fde047"]],
  activity: [["#eef6ff", "#cfe4ff", "#e3dcff", "#2563eb", "#7c3aed"], ["#05162b", "#0c2c4f", "#155e75", "#f5b301", "#22d3ee"], ["#1a0b2e", "#7e22ce", "#ea580c", "#fde047", "#22d3ee"]],
  referrals: [["#fff0f4", "#ffd0dc", "#ffe0b8", "#e11d48", "#f97316"], ["#120a2e", "#2e1065", "#4c1d95", "#fbbf24", "#c084fc"], ["#2a0836", "#a21caf", "#f97316", "#fde047", "#5eead4"]],
  messages: [["#f6f0ff", "#e4d6ff", "#ffd6ec", "#7c3aed", "#db2777"], ["#0a1030", "#1e1b4b", "#312e81", "#fbbf24", "#818cf8"], ["#071a33", "#1d4ed8", "#9333ea", "#67e8f9", "#f0abfc"]],
  account: [["#f4f2ff", "#ddd8ff", "#ffe4cc", "#4f46e5", "#ea580c"], ["#0c0f1a", "#1f2937", "#3f3a1d", "#fcd34d", "#a3a3a3"], ["#12062b", "#3730a3", "#be123c", "#fde047", "#c4b5fd"]],
  settings: [["#ecfdfb", "#c7f3ee", "#dbeafe", "#0d9488", "#2563eb"], ["#0a1620", "#16303f", "#1e4a5c", "#fbbf24", "#7dd3fc"], ["#04201f", "#0f766e", "#7c3aed", "#bef264", "#f0abfc"]],
  help: [["#fff1f5", "#ffd6e4", "#e0e7ff", "#db2777", "#4f46e5"], ["#041b22", "#0b3d47", "#134e4a", "#fbbf24", "#5eead4"], ["#1a0730", "#86198f", "#2563eb", "#fde047", "#67e8f9"]],
};

export const SEGS = ["consumer", "professional", "teen"];
export const sectionOf = (kind) => { const k = KIND[kind] || kind; return ART[k] ? k : null; };

export function heroVars(kind, type) {
  const k = sectionOf(kind); if (!k) return undefined;
  const [b1, b2, b3, a1, a2] = PAL[k][SEG[type] ?? 0];
  return { "--x1": b1, "--x2": b2, "--x3": b3, "--xa": a1, "--xb": a2 };
}

function Consumer({ art }) {
  const [main, ...sats] = art;
  return (
    <>
      <span className="x-sun"><i /></span>
      <span className="x-ribbons">{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <i key={i} style={{ "--i": i }} />)}</span>
      <span className="x-pedestal"><i className="t1" /><i className="t2" /></span>
      <span className="x-main"><img src={E(main)} alt="" width="200" height="200" decoding="async" /></span>
      {sats.map((s, i) => <span key={s + i} className={`x-bub b${i}`}><img src={E(s)} alt="" width="64" height="64" loading="lazy" decoding="async" /></span>)}
    </>
  );
}

function Pro({ art }) {
  const [main, ...sats] = art;
  return (
    <>
      <span className="x-floor" />
      <span className="x-pane p1">
        <svg viewBox="0 0 200 100" preserveAspectRatio="none"><path className="ar" d="M6 88 L40 70 L74 76 L108 44 L142 52 L194 16 L194 96 L6 96 Z" /><path className="ln" pathLength="100" d="M6 88 L40 70 L74 76 L108 44 L142 52 L194 16" /><circle cx="194" cy="16" r="4" /></svg>
      </span>
      <span className="x-pane p2"><span className="x-bars">{[40, 64, 52, 82, 70].map((h, i) => <i key={i} style={{ "--h": h, "--i": i }} />)}</span></span>
      <span className="x-pane p3"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" className="rb" /><circle cx="20" cy="20" r="15" className="rf" pathLength="100" /></svg></span>
      <span className="x-plinth"><i /></span>
      <span className="x-halo" />
      <span className="x-main"><img src={E(main)} alt="" width="200" height="200" decoding="async" /></span>
      {sats.map((s, i) => <span key={s + i} className={`x-tile q${i}`}><img src={E(s)} alt="" width="48" height="48" loading="lazy" decoding="async" /></span>)}
    </>
  );
}

function Teen({ art }) {
  const [main, ...sats] = art;
  return (
    <>
      <span className="x-burst" />
      <span className="x-dots" />
      <svg className="x-squig s1" viewBox="0 0 120 30"><path d="M2 15 Q 17 0 32 15 T 62 15 T 92 15 T 118 15" /></svg>
      <svg className="x-squig s2" viewBox="0 0 120 30"><path d="M2 15 Q 17 0 32 15 T 62 15 T 92 15 T 118 15" /></svg>
      <span className="x-main"><img src={E(main)} alt="" width="200" height="200" decoding="async" /></span>
      {sats.map((s, i) => <span key={s + i} className={`x-stk k${i}`} style={{ "--i": i }}><img src={E(s)} alt="" width="60" height="60" loading="lazy" decoding="async" /></span>)}
      {[0, 1, 2, 3, 4].map((i) => <i key={i} className="x-star" style={{ "--i": i }} />)}
    </>
  );
}

export default function HeroArt10({ kind, type = "consumer", badge }) {
  const k = sectionOf(kind);
  if (!k) return null;
  const art = ART[k][SEG[type] ?? 0];
  const Comp = type === "professional" ? Pro : type === "teen" ? Teen : Consumer;
  return (
    <span className={`x10 x-${type} x-k-${k}`} aria-hidden="true">
      <Comp art={art} />
      {badge ? <span className="x-badge">{badge}</span> : null}
    </span>
  );
}

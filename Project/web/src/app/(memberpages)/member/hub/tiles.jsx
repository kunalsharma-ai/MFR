"use client";
// Round 10 (Kunal, 24 Nov 2026): profile and survey cards are designed per segment, and no two cards look the same.
//   Consumer      "Shop window"      a glossy lifestyle card: a sunny art panel with a spotlight disc, the topic's 3D
//                                    art and two topic objects, a price tag on a string for the reward
//   Professional  "Executive glass"  a deep navy card with a gold rule, a glass tile for the 3D art and a KPI strip
//                                    (reward, quality) like a dashboard widget
//   Teen          "Holo collectible" a trading card with a moving holographic frame, the art as a die-cut sticker,
//                                    a starburst XP badge and a nameplate; it tilts in 3D on hover
// Every card gets its own pattern (one of six per segment, picked from the card's name) and its own topic colours and
// objects, so cards next to each other never repeat. Each card shows the reward system (real points or XP from the
// row) and the quality system (how the card builds the quality score, no invented numbers).
// States: new / going (progress bar), done (stamp), locked (black and white, chained padlock, how to unlock).
// The call site API is unchanged; `k` (topic key) and `kind` ("profile" | "survey") are optional extras.
import React from "react";
import Icon from "./icons.jsx";
import { t } from "./strings";
import { useMember } from "@/Context";
import { memberTypeOf } from "./data";

const E = (n) => `/hub/3d/${n}.webp`;
const tx = (key, fallback) => { const s = t(key); return s === key ? fallback : s; };

// two topic objects per topic key (all files exist in public/hub/3d)
const SATS = {
  basic: ["smile", "id"], education: ["book", "university"], career: ["briefcase2", "chart"], money: ["coin", "piggy"],
  family: ["baby_bottle", "heart"], home: ["sofa", "plant"], pets: ["dog", "pawprint"], shopping: ["tag", "cart"],
  fashion: ["shirt", "shoe"], luxury: ["gem", "ringjewel"], food: ["pizza", "coffee"], travel: ["airplane_dep", "passport"],
  auto: ["taxi", "fuel"], health: ["heart", "pill"], beauty: ["lipstick2", "sparkles"], tech: ["electronics", "wifi"],
  sport: ["football", "medal"], gaming: ["joystick", "dice"], research: ["mag", "clipboard"], media: ["popcorn", "tv"],
  creator: ["video", "mic"], lifestyle: ["sunset", "cocktail"], more: ["puzzle", "sparkles"], general: ["star", "confetti"],
  bizTech: ["satellite", "keyboard"], bizFinance: ["chart", "bank_note"], bizPeople: ["person", "woman"],
  bizMarketing: ["megaphone", "chart2"], bizHealth: ["hospital", "pill"], bizOps: ["gear", "truck"],
  bizStrategy: ["chess", "chart2"], bizGeneral: ["globe", "chart2"],
  tGaming: ["joystick", "console"], tMusic: ["guitar", "speaker"], tSchool: ["book", "pencil"], tSocial: ["sms", "video"],
  tSport: ["basketball", "trophy"], tStyle: ["shoe", "glasses"], tTech: ["vr", "android"], tFood: ["fries", "soda"],
  tGeneral: ["star2", "lightning"],
};
const TEEN_SAFE = (n) => (["coin", "piggy", "bank_note", "money", "dollar", "cocktail"].includes(n) ? "star2" : n);

// one of six patterns per card, picked from its name so it stays the same on every visit
const motifOf = (s) => { let h = 7; for (const ch of String(s || "")) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % 6; };

function Lock() {
  return (
    <span className="c10-lock">
      <i className="c10-chain a" /><i className="c10-chain b" />
      <span className="c10-pad"><img src={E("lock")} alt="" width="54" height="54" /></span>
    </span>
  );
}

function Bar({ p }) {
  return <span className="c10-bar"><i style={{ "--w": `${p}%` }} /><b>{p}%</b></span>;
}

function Meta({ meta }) {
  if (!meta.length) return null;
  return <span className="c10-meta">{meta.map((m, k) => <span key={k}><Icon name={m.icon} size={12} /> {m.text}</span>)}</span>;
}

export default function Tile(props) {
  const { c1 = "#6d5dfc", c2 = "#ff7ab6", art, name, topic, num, ribbon, meta = [], pts, unit, state = "open", stateLabel, pct = null, cta, onClick, ariaLabel, i = 0, featured = false, disabled = false, lockText, k: topicKey, kind } = props;
  const member = useMember();
  const seg = memberTypeOf(member);
  const p = state === "done" ? 100 : Math.max(0, Math.min(100, Number(pct) || 0));
  const showBar = pct != null && state !== "locked";
  const motif = motifOf(`${name}|${topicKey || ""}`);
  let sats = SATS[topicKey] || SATS[seg === "teen" ? "tGeneral" : seg === "professional" ? "bizGeneral" : "general"];
  if (seg === "teen") sats = sats.map(TEEN_SAFE);
  const base = String(art || "").split("/").pop().replace(".webp", "");
  const spare = seg === "professional" ? ["chart2", "globe", "verified"] : seg === "teen" ? ["sparkles", "star2", "fire"] : ["sparkles", "heart", "star"];
  sats = sats.map((x, j) => (x === base ? spare.find((y) => y !== base && !sats.includes(y)) || spare[j] : x));
  const isProfile = kind ? kind === "profile" : topic === t("sx.profileTopic");
  const quality = isProfile ? tx("v10.q.profile", "Raises your quality score") : tx("v10.q.survey", "Careful answers build your quality score");
  const done = state === "done";
  const locked = state === "locked";
  const rewardLabel = seg === "teen" ? tx("v10.r.teen", "XP") : tx("v10.r.label", "Reward");
  const ptsTxt = pts != null ? `${done ? "" : "+"}${pts}` : null;
  const view = { c1, c2, art, name, topic, num, ribbon, meta, pts: ptsTxt, unit, state, stateLabel, cta, disabled, lockText, sats, quality, done, locked, showBar, p, rewardLabel };
  const Body = seg === "professional" ? ProCard : seg === "teen" ? TeenCard : ConsumerCard;
  return (
    <li className={`c10 c10-${seg} m${motif} is-${state} ${featured ? "is-featured" : ""}`} style={{ "--c1": c1, "--c2": c2, "--i": Math.min(i, 12) }}>
      <button type="button" className="c10-btn" onClick={onClick} disabled={disabled} aria-label={ariaLabel || `${cta}: ${name}`}>
        <Body {...view} />
        <i className="c10-shine" aria-hidden="true" />
      </button>
    </li>
  );
}

/* ---------- Consumer: shop window ---------- */
function ConsumerCard(v) {
  return (
    <>
      <span className="c10-art" aria-hidden="true">
        <i className="c10-motif" />
        <i className="c10-spot" />
        <img className="c10-sat s0" src={E(v.sats[0])} alt="" width="36" height="36" loading="lazy" decoding="async" />
        <img className="c10-sat s1" src={E(v.sats[1])} alt="" width="30" height="30" loading="lazy" decoding="async" />
        <span className="c10-hero">{v.art ? <img src={v.art} alt="" width="88" height="88" loading="lazy" decoding="async" /> : null}</span>
        <i className="c10-floor" />
        {v.ribbon ? <span className="c10-flag new">{v.ribbon}</span> : v.num != null ? <span className="c10-flag">#{v.num}</span> : null}
        {v.pts ? <span className={`c10-tag ${v.done ? "won" : ""}`}><i className="c10-string" /><b><i className="c10-coin" />{v.pts}</b>{v.unit ? <em>{v.unit}</em> : null}</span> : null}
        {v.done ? <span className="c10-stamp"><Icon name="check" size={14} /></span> : null}
        {v.locked ? <Lock /> : null}
      </span>
      <span className="c10-body">
        {v.topic ? <span className="c10-topic"><i />{v.topic}</span> : null}
        <b className="c10-name">{v.name}</b>
        <Meta meta={v.meta} />
        <span className="c10-sys">
          <span className="c10-q"><img src={E("star")} alt="" width="18" height="18" loading="lazy" />{v.quality}</span>
        </span>
        {v.showBar ? <Bar p={v.p} /> : null}
        {v.locked && v.lockText ? <span className="c10-locktx"><Icon name="lock" size={12} /> {v.lockText}</span> : null}
      </span>
      <Foot {...v} />
    </>
  );
}

/* ---------- Professional: executive glass ---------- */
function ProCard(v) {
  return (
    <>
      <i className="c10-motif" aria-hidden="true" />
      <i className="c10-rule" aria-hidden="true" />
      <span className="c10-head">
        <span className="c10-htx">
          {v.ribbon ? <span className="c10-flag new">{v.ribbon}</span> : v.num != null ? <span className="c10-flag">No. {v.num}</span> : null}
          {v.topic ? <span className="c10-topic">{v.topic}</span> : null}
          <b className="c10-name">{v.name}</b>
        </span>
        <span className="c10-glass" aria-hidden="true">
          <i className="c10-halo" />
          {v.art ? <img className="c10-heroimg" src={v.art} alt="" width="64" height="64" loading="lazy" decoding="async" /> : null}
          <img className="c10-sat s0" src={E(v.sats[0])} alt="" width="26" height="26" loading="lazy" decoding="async" />
          <img className="c10-sat s1" src={E(v.sats[1])} alt="" width="22" height="22" loading="lazy" decoding="async" />
          {v.done ? <span className="c10-stamp"><Icon name="check" size={13} /></span> : null}
          {v.locked ? <Lock /> : null}
        </span>
      </span>
      <span className="c10-body">
        <Meta meta={v.meta} />
        <span className="c10-kpi" aria-hidden={v.pts ? undefined : "true"}>
          {v.pts ? <span className="c10-cell"><small>{v.rewardLabel}</small><b><i className="c10-coin" />{v.pts}{v.unit ? <em> {v.unit}</em> : null}</b></span> : null}
          <span className="c10-cell q"><small>{tx("v10.q.title", "Quality")}</small><b><Icon name="quality" size={13} /> {v.quality}</b></span>
        </span>
        {v.showBar ? <Bar p={v.p} /> : null}
        {v.locked && v.lockText ? <span className="c10-locktx"><Icon name="lock" size={12} /> {v.lockText}</span> : null}
      </span>
      <Foot {...v} />
    </>
  );
}

/* ---------- Teen: holo collectible ---------- */
function TeenCard(v) {
  return (
    <>
      <i className="c10-holo" aria-hidden="true" />
      <span className="c10-inner">
        <span className="c10-art" aria-hidden="true">
          <i className="c10-motif" />
          <img className="c10-sat s0" src={E(v.sats[0])} alt="" width="34" height="34" loading="lazy" decoding="async" />
          <img className="c10-sat s1" src={E(v.sats[1])} alt="" width="30" height="30" loading="lazy" decoding="async" />
          <span className="c10-hero">{v.art ? <img src={v.art} alt="" width="86" height="86" loading="lazy" decoding="async" /> : null}</span>
          {v.ribbon ? <span className="c10-flag new">{v.ribbon}</span> : v.num != null ? <span className="c10-flag">#{String(v.num).padStart(2, "0")}</span> : null}
          {v.pts ? <span className={`c10-burst ${v.done ? "won" : ""}`}><i /><b>{v.pts}</b><em>{v.rewardLabel}</em></span> : null}
          {v.done ? <span className="c10-stamp"><Icon name="check" size={14} /></span> : null}
          {v.locked ? <Lock /> : null}
        </span>
        <span className="c10-plate">
          {v.topic ? <span className="c10-topic">{v.topic}</span> : null}
          <b className="c10-name">{v.name}</b>
        </span>
        <span className="c10-body">
          <Meta meta={v.meta} />
          <span className="c10-q"><img src={E("lightning")} alt="" width="18" height="18" loading="lazy" />{v.quality}</span>
          {v.showBar ? <Bar p={v.p} /> : null}
          {v.locked && v.lockText ? <span className="c10-locktx"><Icon name="lock" size={12} /> {v.lockText}</span> : null}
        </span>
        <Foot {...v} />
      </span>
    </>
  );
}

function Foot(v) {
  return (
    <span className="c10-foot">
      <span className="c10-state">{v.stateLabel}</span>
      {v.cta ? <span className="c10-go">{v.cta}{v.disabled ? null : <Icon name={v.locked ? "lock" : "arrow"} size={13} />}</span> : null}
    </span>
  );
}

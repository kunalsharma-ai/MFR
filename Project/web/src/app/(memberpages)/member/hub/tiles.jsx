"use client";
// Round 9b (Kunal, 24 Nov 2026): back to the round-8 card he liked (light card, coloured art panel with the topic's
// 3D art, name, facts, progress, reward and one clear action), rebuilt with more life:
//   - the art panel is a living gradient in the topic's two colours, with drifting light blobs, a slow light-ray
//     halo, twinkles and the 3D art floating above its own shadow; a soft wave joins it to the card body
//   - the reward sits on a glass chip with a spinning coin; progress is a bar with a moving shimmer
//   - on hover the card lifts, a shine sweeps across, the art pops and the action's arrow slides
//   - locked (before the basic profiles are done): black and white, chained padlock that rattles, how to unlock
//   - done: a green stamp and a full bar
// Used for every profile and survey card of every member type. Reduced motion stops all movement.
import React from "react";
import Icon from "./icons.jsx";

export default function Tile({ c1 = "#6d5dfc", c2 = "#ff7ab6", art, name, topic, num, ribbon, meta = [], pts, unit, state = "open", stateLabel, pct = null, cta, onClick, ariaLabel, i = 0, featured = false, disabled = false, lockText }) {
  const p = state === "done" ? 100 : Math.max(0, Math.min(100, Number(pct) || 0));
  const showBar = pct != null && state !== "locked";
  return (
    <li className={`tk is-${state} ${featured ? "is-featured" : ""}`} style={{ "--c1": c1, "--c2": c2, "--i": Math.min(i, 12) }}>
      <button type="button" className="tk-btn" onClick={onClick} disabled={disabled} aria-label={ariaLabel || `${cta}: ${name}`}>
        <span className="tk-art" aria-hidden="true">
          <i className="tk-blob b1" /><i className="tk-blob b2" /><i className="tk-dots" />
          <i className="tk-rays" />
          <span className="tk-float">
            {art ? <img src={art} alt="" width="84" height="84" loading="lazy" decoding="async" /> : null}
          </span>
          <i className="tk-shadow" />
          {[0, 1, 2, 3].map((k) => <i key={k} className={`tk-tw t${k}`} />)}
          {ribbon ? <span className="tk-chip tk-ribbon">{ribbon}</span> : num != null ? <span className="tk-chip tk-num">#{num}</span> : null}
          {pts != null ? <span className={`tk-chip tk-pts ${state === "done" ? "won" : ""}`}><i className="tk-coin" />{state === "done" ? "" : "+"}{pts}{unit ? <em> {unit}</em> : null}</span> : null}
          {state === "done" ? <span className="tk-stamp"><Icon name="check" size={14} /></span> : null}
          <svg className="tk-wave" viewBox="0 0 300 24" preserveAspectRatio="none"><path d="M0 14 C 50 2, 100 2, 150 12 S 250 24, 300 10 L300 24 L0 24 Z" /></svg>
          {state === "locked" ? (
            <span className="tk-lock">
              <i className="tk-chain c1" /><i className="tk-chain c2" />
              <span className="tk-pad"><img src="/hub/3d/lock.webp" alt="" width="54" height="54" /></span>
            </span>
          ) : null}
        </span>
        <span className="tk-body">
          {topic ? <span className="tk-topic"><i />{topic}</span> : null}
          <b className="tk-name">{name}</b>
          {meta.length ? <span className="tk-meta">{meta.map((m, k) => <span key={k}><Icon name={m.icon} size={12} /> {m.text}</span>)}</span> : null}
          {showBar ? <span className="tk-bar"><i style={{ "--w": `${p}%` }} /><b>{p}%</b></span> : null}
          {state === "locked" && lockText ? <span className="tk-locktx"><Icon name="lock" size={12} /> {lockText}</span> : null}
        </span>
        <span className="tk-foot">
          <span className="tk-state">{stateLabel}</span>
          {cta ? <span className="tk-go">{cta}{disabled ? null : <Icon name={state === "locked" ? "lock" : "arrow"} size={13} />}</span> : null}
        </span>
        <i className="tk-shine" aria-hidden="true" />
      </button>
    </li>
  );
}

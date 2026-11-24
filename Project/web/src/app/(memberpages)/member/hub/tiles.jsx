"use client";
// v8 (round 7): restyled in v8/v8.css as a light card with a coloured art panel, a progress bar and a clear
// action; locked cards stay light (no more graphite). Markup kept from v7.
// v7 (round 6): the one card used for every profile and every survey. A compact gradient tile: 3D art with a state
// badge, the name and topic, questions and time, the reward coin, and a foot strip with the state and one action.
// Each member type styles it differently in hub-v7.css (Consumer glossy lifestyle, Professional navy with gold,
// Teen neon with a tilted sticker); locked tiles turn graphite, completed ones get a check.
import React from "react";
import Icon from "./icons.jsx";

export default function Tile({ c1, c2, art, name, topic, num, ribbon, meta = [], pts, unit, state = "open", stateLabel, pct = null, cta, onClick, ariaLabel, i = 0, featured = false, disabled = false }) {
  const R = 9;
  const C = 2 * Math.PI * R;
  return (
    <li className={`tc is-${state} ${featured ? "is-featured" : ""}`} style={{ "--c1": c1, "--c2": c2, "--i": Math.min(i, 12) }}>
      <button type="button" className="tc-btn" onClick={onClick} disabled={disabled} aria-label={ariaLabel || `${cta}: ${name}`}>
        <span className="tc-shine" aria-hidden="true" />
        {ribbon ? <span className="tc-ribbon" aria-hidden="true">{ribbon}</span> : num != null ? <span className="tc-num" aria-hidden="true">#{num}</span> : null}
        <span className="tc-top">
          <span className="tc-art" aria-hidden="true">
            <i className="tc-orb o1" /><i className="tc-orb o2" />
            <img src={art} alt="" width="52" height="52" loading="lazy" decoding="async" />
            {state === "done" || state === "locked" ? <i className="tc-badge"><Icon name={state === "done" ? "check" : "lock"} size={12} /></i> : null}
          </span>
          <span className="tc-tx">
            <b className="tc-name">{name}</b>
            {topic ? <small className="tc-topic">{topic}</small> : null}
            <span className="tc-meta">
              {meta.map((m, k) => <span key={k}><Icon name={m.icon} size={12} /> {m.text}</span>)}
            </span>
            {pct != null && (state === "going" || state === "done" || state === "new") ? <span className="tc-bar" aria-hidden="true"><i style={{ "--w": `${state === "done" ? 100 : pct}%` }} /></span> : null}
            {pts != null ? <span className="tc-pts"><i className="tc-coin" aria-hidden="true" />+{pts}{unit ? <em> {unit}</em> : null}</span> : null}
          </span>
        </span>
        <span className="tc-foot">
          <span className="tc-state">
            {pct != null && state === "going" ? (
              <svg viewBox="0 0 24 24" className="tc-ring" aria-hidden="true"><circle cx="12" cy="12" r={R} className="bg" /><circle cx="12" cy="12" r={R} className="fg" style={{ strokeDasharray: `${(pct / 100) * C} ${C}` }} /></svg>
            ) : null}
            {stateLabel}
          </span>
          <span className="tc-go">{cta} {disabled ? null : <Icon name={state === "locked" ? "lock" : "arrow"} size={13} />}</span>
        </span>
      </button>
    </li>
  );
}

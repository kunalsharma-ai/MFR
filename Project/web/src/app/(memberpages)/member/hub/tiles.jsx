"use client";
// v9 (round 9, Kunal 24 Nov 2026): the one card used for every profile and every survey, now a "world portal" in the
// look of Kunal's minor profile suite. Each card wears the world of its topic (v9/worlds.js): its own sky, rendered
// 3D art, two floating 3D stickers, card shape and accents. A glass panel holds the topic, name, facts, reward and
// progress; the foot has a progress ring and one action. The card tilts toward the pointer.
// Locked cards (a survey or topic profile before the basic profiles are done) turn black and white and show a
// padlock with chains that rattles; the action says how to unlock. Completed cards get a stamp.
import React from "react";
import Icon from "./icons.jsx";
import { worldOf, worldVars } from "./v9/worlds";

export default function Tile({ world = "celebrate", art, name, topic, blurb, num, ribbon, meta = [], pts, unit, state = "open", stateLabel, pct = null, cta, onClick, ariaLabel, i = 0, featured = false, disabled = false, lockText }) {
  const w = worldOf(world);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof matchMedia === "undefined" || !matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    let raf = 0;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; el.style.setProperty("--tx", `${(x * 8).toFixed(2)}deg`); el.style.setProperty("--ty", `${(-y * 8).toFixed(2)}deg`); el.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(0)}%`); });
    };
    const leave = () => { el.style.setProperty("--tx", "0deg"); el.style.setProperty("--ty", "0deg"); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); cancelAnimationFrame(raf); };
  }, []);
  const R = 16;
  const C = 2 * Math.PI * R;
  const p = state === "done" ? 100 : Math.max(0, Math.min(100, Number(pct) || 0));
  const stickers = [art, w.stickers[0] ? `/hub/3d/${w.stickers[0]}.webp` : null].filter(Boolean);
  return (
    <li className={`tw is-${state} shape-${w.shape} ${w.dark ? "is-dark" : "is-light"} ${featured ? "is-featured" : ""}`} style={{ ...worldVars(world), "--i": Math.min(i, 12) }}>
      <button type="button" ref={ref} className="tw-btn" onClick={onClick} disabled={disabled} aria-label={ariaLabel || `${cta}: ${name}`}>
        <span className="tw-sky" aria-hidden="true"><i className="s1" /><i className="s2" /><i className="s3" /></span>
        <span className="tw-art" aria-hidden="true"><img src={`/hub/worlds/${w.art}.webp`} alt="" width="360" height="360" loading="lazy" decoding="async" /></span>
        <span className="tw-stk" aria-hidden="true">{stickers.map((s, k) => <img key={s} className={`k${k}`} src={s} alt="" width="52" height="52" loading="lazy" decoding="async" />)}</span>
        {ribbon ? <span className="tw-ribbon" aria-hidden="true">{ribbon}</span> : num != null ? <span className="tw-num" aria-hidden="true">#{num}</span> : null}
        {state === "done" ? <span className="tw-stamp" aria-hidden="true"><Icon name="check" size={13} /> 100%</span> : null}
        <span className="tw-body">
          <span className="tw-world"><i aria-hidden="true" />{topic || w.name}</span>
          <b className="tw-name">{name}</b>
          {blurb ? <span className="tw-blurb">{blurb}</span> : null}
          {meta.length ? <span className="tw-meta">{meta.map((m, k) => <span key={k}><Icon name={m.icon} size={12} /> {m.text}</span>)}</span> : null}
          {pts != null ? <span className={`tw-pts ${state === "done" ? "won" : ""}`}><i className="tw-coin" aria-hidden="true" />{state === "done" ? "" : "+"}{pts}{unit ? <em> {unit}</em> : null}</span> : null}
          <span className="tw-foot">
            <span className="tw-state">
              {pct != null && state !== "locked" ? (
                <svg viewBox="0 0 40 40" className="tw-ring" aria-hidden="true"><circle cx="20" cy="20" r={R} className="bg" /><circle cx="20" cy="20" r={R} className="fg" style={{ strokeDasharray: `${(p / 100) * C} ${C}` }} /><text x="20" y="24" textAnchor="middle">{p}%</text></svg>
              ) : null}
              <span className="tw-sl">{stateLabel}</span>
            </span>
            {cta ? <span className="tw-go">{state === "locked" ? <Icon name="lock" size={14} /> : null}{cta} {disabled || state === "locked" ? null : <Icon name="arrow" size={14} />}</span> : null}
          </span>
        </span>
        {state === "locked" ? (
          <span className="tw-lock" aria-hidden="true">
            <i className="tw-chain c1" /><i className="tw-chain c2" />
            <span className="tw-pad"><img src="/hub/3d/lock.webp" alt="" width="64" height="64" /></span>
            {lockText ? <span className="tw-lock-tx">{lockText}</span> : null}
          </span>
        ) : null}
      </button>
    </li>
  );
}

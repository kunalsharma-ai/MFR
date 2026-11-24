"use client";
// v8 (Kunal round 7): the celebration when a member finishes a profile or earns points. It watches the same live
// numbers as the header (profile %, Quality Points, points from useHub) and the "hub-celebrate" event the reward
// machine sends. When a number goes up it shows a card under the header with confetti and the before → after of
// each number, counting up, while the matching header chip pulses (StatusCluster's useRise). Nothing is invented:
// the card only shows numbers that really changed. With reduced motion there is no confetti.
import React from "react";
import Icon from "../icons.jsx";
import { t } from "../strings";
import { fmt } from "../data";
import { play } from "../sound";
import { usePrefs, motionReduced } from "../prefs";

const COLORS = { consumer: ["#FF8A00", "#FF5E7E", "#FFC233", "#2F6BFF"], professional: ["#2F6BFF", "#4F46E5", "#FFC233", "#14C9B5"], teen: ["#7C3AED", "#FF3B8D", "#FFC233", "#2EE6CF"] };

function CountUp({ from, to, format = (n) => fmt(Math.round(n)), still }) {
  const [v, setV] = React.useState(still ? to : from);
  React.useEffect(() => {
    if (still) { setV(to); return undefined; }
    let raf = 0;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 1100);
      const e = 1 - Math.pow(1 - k, 3);
      setV(from + (to - from) * e);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [from, to, still]);
  return <>{format(v)}</>;
}

export default function Celebrate({ hub }) {
  const { type, completion, quality, pts } = hub;
  const still = motionReduced(usePrefs());
  const prev = React.useRef(null);
  const pending = React.useRef({});
  const timer = React.useRef(0);
  const [show, setShow] = React.useState(null);

  const flush = React.useCallback(() => {
    const d = pending.current;
    pending.current = {};
    if (!d.pct && !d.q && !d.pts && !d.name) return;
    setShow({ ...d, id: Date.now() });
    play(d.pct?.to >= 100 ? "milestone" : "reward");
  }, []);
  const queue = React.useCallback((patch) => {
    pending.current = { ...pending.current, ...patch };
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 900); // numbers arrive from different requests; show them together
  }, [flush]);

  const now = { pct: completion?.pct ?? null, q: quality?.ten ?? null, pts: pts?.total ?? null };
  React.useEffect(() => {
    const p = prev.current;
    if (now.pct == null || now.pts == null) return;
    if (!p) { prev.current = now; return; }
    const patch = {};
    if (now.pct > p.pct) patch.pct = { from: pending.current.pct?.from ?? p.pct, to: now.pct };
    if (now.q != null && p.q != null && now.q > p.q) patch.q = { from: pending.current.q?.from ?? p.q, to: now.q };
    if (now.pts > p.pts) patch.pts = { from: pending.current.pts?.from ?? p.pts, to: now.pts };
    prev.current = now;
    if (Object.keys(patch).length) queue(patch);
  }, [now.pct, now.q, now.pts]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const on = (e) => queue({ name: e.detail?.name || null, gain: e.detail?.points || null });
    window.addEventListener("hub-celebrate", on);
    return () => { window.removeEventListener("hub-celebrate", on); clearTimeout(timer.current); };
  }, [queue]);

  React.useEffect(() => {
    if (!show) return undefined;
    const id = setTimeout(() => setShow(null), 6500);
    return () => clearTimeout(id);
  }, [show]);

  if (!show) return null;
  const colors = COLORS[type] || COLORS.consumer;
  const full = show.pct?.to >= 100;
  const gain = show.pts ? show.pts.to - show.pts.from : show.gain;
  const title = full ? t("v8.c.full") : show.pct ? t("v8.c.profileUp") : t(`v8.c.points.${type}`);
  return (
    <div className={`c8 c8-${type}`} role="status" aria-live="polite" key={show.id}>
      {still ? null : (
        <span className="c8-confetti" aria-hidden="true">
          {Array.from({ length: 34 }, (_, i) => (
            <i key={i} style={{ "--x": `${(i * 37) % 100}%`, "--d": `${(i % 7) * 70}ms`, "--r": `${(i * 53) % 360}deg`, "--c": colors[i % colors.length], "--s": `${0.7 + ((i * 13) % 6) / 10}` }} />
          ))}
        </span>
      )}
      <span className="c8-badge" aria-hidden="true"><img src={`/ps/images/emoji/${full ? "trophy" : type === "teen" ? "party" : "confetti"}.webp`} alt="" /></span>
      <div className="c8-tx">
        <b className="c8-title">{title}</b>
        <small>{show.name ? t("v8.c.from", { name: show.name }) : t("v8.c.header")}</small>
        <ul className="c8-chips">
          {show.pct ? <li className="k-pct"><Icon name="profile" size={14} /><span>{t("hdr.profile")}</span><b>{show.pct.from}% <i>→</i> <CountUp from={show.pct.from} to={show.pct.to} still={still} format={(n) => `${Math.round(n)}%`} /></b></li> : null}
          {show.q ? <li className="k-q"><Icon name="quality" size={14} /><span>{t("hdr.quality")}</span><b>{show.q.from.toFixed(1)} <i>→</i> <CountUp from={show.q.from} to={show.q.to} still={still} format={(n) => n.toFixed(1)} /></b></li> : null}
          {gain ? <li className="k-pts"><Icon name="coin" size={14} /><span>{type === "teen" ? t("hdr.xp") : t("hdr.points")}</span><b>+<CountUp from={0} to={gain} still={still} /></b></li> : null}
        </ul>
      </div>
      <button type="button" className="c8-x" onClick={() => setShow(null)} aria-label={t("c.close")}><Icon name="close" size={16} /></button>
    </div>
  );
}

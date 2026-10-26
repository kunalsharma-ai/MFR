import { useEffect, useRef } from 'react';
import { MOODS } from '../config/actions.js';
import { useApp } from '../context/AppContext.jsx';
import { useReducedMotion } from '../hooks/index.js';

const KEYS = Object.keys(MOODS);
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/**
 * Page background.
 * - One pre-painted glow layer per mood; switching mood only cross-fades opacity (GPU, no repaint jank).
 * - A light particle canvas (capped at 30 fps, paused when the tab is hidden, fewer particles on phones).
 */
export function Background() {
  const { mood, theme } = useApp();
  const canvas = useRef(null);
  const target = useRef(MOODS.mfr.map(hex));
  const rm = useReducedMotion();

  useEffect(() => { target.current = MOODS[mood].map(hex); }, [mood]);

  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const cx = cv.getContext('2d'); if (!cx) return;
    const cur = MOODS.mfr.map(hex);
    let w = 0, h = 0, dpr = 1, P = [], raf = 0, last = 0;
    const light = theme === 'light';
    const size = () => {
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      w = cv.width = Math.round(window.innerWidth * dpr); h = cv.height = Math.round(window.innerHeight * dpr);
      const count = Math.min(70, Math.round(window.innerWidth / 18));
      P = Array.from({ length: count }, () => ({ x: Math.random() * w, y: Math.random() * h, r: (Math.random() * 1.7 + 0.5) * dpr, v: (Math.random() * 0.3 + 0.08) * dpr, tw: Math.random() * 6.28, c: Math.random() < 0.5 ? 0 : 2, ring: Math.random() < 0.14 }));
    };
    const draw = (t) => {
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cur[i][j] += (target.current[i][j] - cur[i][j]) * 0.06;
      cx.clearRect(0, 0, w, h);
      for (const p of P) {
        if (!rm) { p.y -= p.v; p.x += Math.sin(t / 3000 + p.tw) * 0.2 * dpr; if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; } }
        const a = (light ? 0.28 : 0.4) + (light ? 0.22 : 0.4) * Math.sin(t / 700 + p.tw);
        const [r, g, b] = cur[p.c];
        if (p.ring) {
          cx.strokeStyle = `rgba(${r | 0},${g | 0},${b | 0},${a * 0.8})`; cx.lineWidth = dpr;
          cx.beginPath(); cx.ellipse(p.x, p.y, p.r * 2.8, p.r * 2.8 * Math.abs(Math.sin(t / 900 + p.tw)) + 0.6, 0, 0, 6.283); cx.stroke();
        } else { cx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${a})`; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.fill(); }
      }
    };
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden || t - last < 33) return;
      last = t; draw(t);
    };
    size();
    const onResize = () => { size(); if (rm) draw(0); };
    window.addEventListener('resize', onResize);
    if (rm) { for (let i = 0; i < 60; i++) draw(0); } else raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [theme, rm]);

  return (
    <div className="stage" aria-hidden="true">
      {KEYS.map((k) => (
        <div key={k} className={`mood mood-${k}`} style={{ opacity: k === mood ? 1 : 0, '--g1': MOODS[k][0], '--g2': MOODS[k][1], '--g3': MOODS[k][2] }}>
          <i className="glow g-a" /><i className="glow g-b" /><i className="glow g-c" />
        </div>
      ))}
      <div className="lattice" />
      <canvas ref={canvas} className="stars" />
      <div className="vignette" />
    </div>
  );
}

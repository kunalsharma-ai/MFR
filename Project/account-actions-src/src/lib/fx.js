// Completion celebrations, one per option. Drawn on a canvas that sits BEHIND the
// modal card (so nothing ever covers text) and auto-stops after ~3.5 s.

import { PALETTES } from '../config/actions.js';

export function runFx(canvas, k, origin) {
  if (!canvas) return () => {};
  const fctx = canvas.getContext('2d');
  if (!fctx) return () => {};
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = (canvas.width = Math.round(window.innerWidth * dpr));
  const H = (canvas.height = Math.round(window.innerHeight * dpr));
  const ox = (origin?.x ?? window.innerWidth / 2) * dpr;
  const oy = (origin?.y ?? window.innerHeight / 2.6) * dpr;
  const P = PALETTES[k];
  const cols = [P.c1, P.c2, P.c3, '#ffffff'];
  const R = Math.random;
  const pick = (a) => a[(R() * a.length) | 0];
  const small = window.innerWidth < 640;
  const n = (v) => Math.round(small ? v * 0.55 : v);
  const parts = [];
  const rings = [];

  if (k === 'd30') for (let i = 0; i < n(180); i++) { const a = R() * 6.283, v = (6 + R() * 11) * dpr; parts.push({ x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4 * dpr, g: 0.26 * dpr, r: (3 + R() * 5) * dpr, rot: R() * 6, vr: (R() - 0.5) * 0.4, c: pick(cols), s: R() < 0.3 ? 'star' : 'rect', life: 1, dec: 0.006 + R() * 0.005 }); }
  if (k === 'd60') { for (let i = 0; i < 6; i++) rings.push({ d: i * 170, r: 0, c: pick(cols) }); for (let i = 0; i < n(80); i++) parts.push({ x: R() * W, y: H + R() * 260 * dpr, vx: 0, vy: -(2 + R() * 3.5) * dpr, g: 0, r: (3 + R() * 10) * dpr, w: R() * 6, c: pick(cols), s: 'bubble', life: 1, dec: 0.004 + R() * 0.004 }); }
  if (k === 'd90') for (let i = 0; i < n(300); i++) parts.push({ a: R() * 6.283, rad: R() * 30 * dpr, va: 0.02 + R() * 0.04, vr: (2 + R() * 4.5) * dpr, r: (1 + R() * 2.4) * dpr, c: pick(cols), s: 'spiral', life: 1, dec: 0.005 + R() * 0.004 });
  if (k === 'hold') { rings.push({ d: 0, r: 0, c: P.c2, hex: true }); rings.push({ d: 260, r: 0, c: P.c1, hex: true }); for (let i = 0; i < n(90); i++) parts.push({ x: R() * W, y: -R() * H * 0.7, vx: (R() - 0.5) * 0.6 * dpr, vy: (1 + R() * 2) * dpr, g: 0, r: (5 + R() * 9) * dpr, rot: R() * 6, vr: (R() - 0.5) * 0.04, c: pick([P.c2, '#ffffff', P.c1]), s: 'flake', life: 1, dec: 0.0035 + R() * 0.003, w: R() * 6 }); }
  if (k === 'del') for (let i = 0; i < n(140); i++) parts.push({ x: ox + (R() - 0.5) * 520 * dpr, y: oy + R() * 260 * dpr, vx: (R() - 0.5) * 1.2 * dpr, vy: -(0.8 + R() * 2.4) * dpr, g: -0.01 * dpr, r: (2 + R() * 4) * dpr, rot: R() * 6, vr: (R() - 0.5) * 0.1, c: pick([P.c2, P.c1, '#FF8A00', '#8A8FB0']), s: 'ember', life: 1, dec: 0.005 + R() * 0.004, w: R() * 6 });
  if (k === 'react') for (let b = 0; b < 6; b++) { const bx = W * (0.12 + R() * 0.76), by = H * (0.12 + R() * 0.4), dl = b * 260; for (let i = 0; i < n(56); i++) { const a = (i / n(56)) * 6.283, v = (3 + R() * 4.5) * dpr; parts.push({ x: bx, y: by, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.07 * dpr, r: (1.5 + R() * 2.2) * dpr, c: pick(cols), s: 'spark', life: 1, dec: 0.009 + R() * 0.006, delay: dl }); } }

  const star = (x, y, r) => { fctx.beginPath(); for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; fctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } fctx.closePath(); fctx.fill(); };
  const t0 = performance.now();
  let raf = 0;
  let stopped = false;

  function frame(now) {
    if (stopped) return;
    const el = now - t0;
    fctx.clearRect(0, 0, W, H);
    fctx.globalCompositeOperation = k === 'd90' || k === 'react' ? 'lighter' : 'source-over';
    let alive = false;
    for (const rg of rings) {
      if (el < rg.d) { alive = true; continue; }
      rg.r += (rg.hex ? 9 : 6.5) * dpr;
      const max = Math.max(W, H) * 0.7;
      if (rg.r < max) alive = true;
      fctx.globalAlpha = Math.max(0, 1 - rg.r / max);
      fctx.strokeStyle = rg.c; fctx.lineWidth = (rg.hex ? 4 : 3) * dpr; fctx.beginPath();
      if (rg.hex) for (let i = 0; i <= 6; i++) { const an = (i * Math.PI) / 3 + Math.PI / 6; fctx.lineTo(ox + Math.cos(an) * rg.r, oy + Math.sin(an) * rg.r); }
      else fctx.arc(ox, oy, rg.r, 0, 6.283);
      fctx.stroke();
    }
    for (const p of parts) {
      if (p.delay && el < p.delay) { alive = true; continue; }
      if (p.life <= 0) continue;
      alive = true; p.life -= p.dec;
      fctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4));
      fctx.fillStyle = p.c; fctx.strokeStyle = p.c;
      if (p.s === 'spiral') { p.a += p.va; p.rad += p.vr; fctx.beginPath(); fctx.arc(ox + Math.cos(p.a) * p.rad, oy + Math.sin(p.a) * p.rad * 0.62, p.r, 0, 6.283); fctx.fill(); continue; }
      p.vy += p.g || 0; p.x += p.vx; p.y += p.vy; if (p.vr) p.rot += p.vr; if (p.w !== undefined) p.x += Math.sin(now / 400 + p.w) * 0.6 * dpr;
      if (p.s === 'rect') { fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.rot); fctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); fctx.restore(); }
      else if (p.s === 'star') star(p.x, p.y, p.r * 1.3);
      else if (p.s === 'bubble') { fctx.lineWidth = 1.5 * dpr; fctx.beginPath(); fctx.arc(p.x, p.y, p.r, 0, 6.283); fctx.stroke(); }
      else if (p.s === 'flake') { fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.rot); fctx.lineWidth = 1.4 * dpr; for (let i = 0; i < 6; i++) { fctx.rotate(Math.PI / 3); fctx.beginPath(); fctx.moveTo(0, 0); fctx.lineTo(0, -p.r); fctx.moveTo(0, -p.r * 0.55); fctx.lineTo(p.r * 0.25, -p.r * 0.8); fctx.moveTo(0, -p.r * 0.55); fctx.lineTo(-p.r * 0.25, -p.r * 0.8); fctx.stroke(); } fctx.restore(); }
      else if (p.s === 'ember') { fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.rot); fctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r); fctx.restore(); }
      else if (p.s === 'spark') { fctx.lineWidth = p.r; fctx.beginPath(); fctx.moveTo(p.x - p.vx * 2.5, p.y - p.vy * 2.5); fctx.lineTo(p.x, p.y); fctx.stroke(); p.vx *= 0.985; p.vy *= 0.985; }
    }
    fctx.globalAlpha = 1;
    if (alive && el < 4200) raf = requestAnimationFrame(frame);
    else fctx.clearRect(0, 0, W, H);
  }
  raf = requestAnimationFrame(frame);
  return () => { stopped = true; cancelAnimationFrame(raf); fctx.clearRect(0, 0, W, H); };
}

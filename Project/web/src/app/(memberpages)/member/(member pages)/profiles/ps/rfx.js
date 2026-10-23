// Prize Machine effects (Web Animations API, transform/opacity only). Every effect is skipped under
// prefers-reduced-motion; the callers still update the values.
import { reducedMotion } from './fx.js';

const mk = (cls, host, css) => { const e = document.createElement('span'); e.className = cls; if (css) Object.assign(e.style, css); host.append(e); return e; };
const gone = (a, el) => a.finished.then(() => el.remove(), () => el.remove());
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Animate an element through a list of [x, y, scale, rotate, offset?] waypoints (px, relative to its offset parent). */
export function path(el, pts, duration, easing = 'linear') {
  if (!el || reducedMotion()) return Promise.resolve();
  const kf = pts.map(([x, y, s = 1, r = 0, off]) => ({ transform: `translate(${x}px, ${y}px) scale(${s}) rotate(${r}deg)`, ...(off != null ? { offset: off } : null) }));
  return el.animate(kf, { duration, easing, fill: 'forwards' }).finished.catch(() => {});
}

/** Star-sparkle burst (✦ shapes in the given colours) + a shock ring, at x/y inside host. */
export function sparkle(host, x, y, colors, n = 16) {
  if (!host || reducedMotion()) return;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (i % 2) * 0.2, r = 46 + (i % 3) * 18, c = colors[i % colors.length];
    const s = mk('pm-spark', host, { left: x + 'px', top: y + 'px', color: c });
    s.textContent = i % 3 ? '✦' : '✧';
    gone(s.animate([
      { transform: 'translate(-50%,-50%) scale(.2) rotate(0deg)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * r}px), calc(-50% + ${Math.sin(a) * r}px)) scale(1.1) rotate(${90 + i * 20}deg)`, opacity: 1, offset: 0.6 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * r * 1.2}px), calc(-50% + ${Math.sin(a) * r * 1.2 + 14}px)) scale(.4) rotate(${180 + i * 20}deg)`, opacity: 0 }
    ], { duration: 950 + (i % 4) * 80, easing: 'cubic-bezier(.15,.75,.35,1)' }), s);
  }
  const ring = mk('pm-ring', host, { left: x + 'px', top: y + 'px', borderColor: colors[0] });
  gone(ring.animate([{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 0.9 }, { transform: 'translate(-50%,-50%) scale(2.4)', opacity: 0 }], { duration: 650, easing: 'ease-out' }), ring);
}

/** Floating "+100" text that rises from x/y inside host. */
export function floatText(host, x, y, text) {
  if (!host || reducedMotion()) return;
  const t = mk('pm-float', host, { left: x + 'px', top: y + 'px' });
  t.textContent = text;
  gone(t.animate([
    { transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 },
    { transform: 'translate(-50%,-110%) scale(1.15)', opacity: 1, offset: 0.25 },
    { transform: 'translate(-50%,-150%) scale(1)', opacity: 1, offset: 0.75 },
    { transform: 'translate(-50%,-210%) scale(.9)', opacity: 0 }
  ], { duration: 1500, easing: 'ease-out' }), t);
}

const onScreen = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight; };
/** A mini capsule carrying "+100" arcs from a viewport point to the header points pill (or `fallback`
 *  when the header is off-screen). Resolves with the element it landed on, or null. */
export function flyToPoints(from, label, colors, fallback) {
  const hp = document.getElementById('rw-pts'), target = onScreen(hp) ? hp : fallback;
  if (!target || reducedMotion()) return Promise.resolve(null);
  const to = target.getBoundingClientRect(), tx = to.left + to.width / 2, ty = to.top + to.height / 2;
  const el = mk('pm-fly', document.body, { left: from.x + 'px', top: from.y + 'px', '--k1': colors[0], '--k2': colors[1] || colors[0] });
  el.innerHTML = `<i></i><b>${label}</b>`;
  const dx = tx - from.x, dy = ty - from.y, lift = Math.min(-90, dy * 0.35 - 100), kf = [];
  for (let i = 0; i <= 18; i++) {
    const u = i / 18, x = dx * u, y = dy * u + lift * 4 * u * (1 - u);
    kf.push({ transform: `translate(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px)) rotate(${(u * 540).toFixed(0)}deg) scale(${(1 + Math.sin(u * Math.PI) * 0.3 - u * 0.4).toFixed(3)})`, opacity: u > 0.95 ? 0.2 : 1 });
  }
  return el.animate(kf, { duration: 1100, easing: 'cubic-bezier(.45,.05,.4,1)' }).finished.then(() => { el.remove(); return target; }, () => { el.remove(); return null; });
}

/** Pill / counter reaction when points land. */
export function bump(target) {
  if (!target || reducedMotion()) return;
  target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(.95)' }, { transform: 'scale(1)' }], { duration: 520, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  const r = target.getBoundingClientRect();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const s = mk('pm-spark', document.body, { position: 'fixed', left: r.left + r.width / 2 + 'px', top: r.top + r.height / 2 + 'px', color: i % 2 ? 'var(--L3,#ffc23d)' : 'var(--amber,#ffa200)', zIndex: 95 });
    s.textContent = '✦';
    gone(s.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * 36}px), calc(-50% + ${Math.sin(a) * 26}px)) scale(.3)`, opacity: 0 }], { duration: 650, easing: 'ease-out' }), s);
  }
}

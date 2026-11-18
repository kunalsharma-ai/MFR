// Dark / light mode (v3.0). Stored on this device; the inline script in index.html applies it before first paint.
// html[data-mode="dark"] switches on the dark stylesheet (public/css/dark.css, generated from every site
// stylesheet by scripts/build-dark-css.mjs). It is only downloaded when dark mode is used, so light-mode visitors
// pay nothing for it. The single-file preview embeds it as window.__MFR_DARK_CSS.
import { store } from './storage.js';
import { themeSound } from './sound.js';

export const MODE_EVENT = 'mfr:mode';
export const getMode = () => (typeof document !== 'undefined' && document.documentElement.dataset.mode === 'dark' ? 'dark' : 'light');

export function ensureDarkCss() {
  if (typeof document === 'undefined' || document.getElementById('mfr-dark-css')) return Promise.resolve();
  return new Promise((resolve) => {
    if (window.__MFR_DARK_CSS) {
      const st = document.createElement('style');
      st.id = 'mfr-dark-css';
      st.textContent = window.__MFR_DARK_CSS;
      document.head.appendChild(st);
      resolve();
      return;
    }
    const l = document.createElement('link');
    l.id = 'mfr-dark-css';
    l.rel = 'stylesheet';
    l.href = '/css/dark.css';
    l.onload = () => resolve();
    l.onerror = () => resolve();
    document.head.appendChild(l);
    setTimeout(resolve, 1500);
  });
}

function apply(mode) {
  const root = document.documentElement;
  if (mode === 'dark') root.dataset.mode = 'dark';
  else delete root.dataset.mode;
  root.style.colorScheme = mode;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', mode === 'dark' ? '#0b0d12' : '#0B1E5B');
  window.dispatchEvent(new CustomEvent(MODE_EVENT, { detail: { mode } }));
}

// The two directions look different on purpose.
// To dark — "Nightfall": the night grows out of the switch as a circle while a crescent moon rises there, stars
// twinkle on across the screen and a few shooting stars streak past.
// To light — "Sunrise": the day rises from the bottom edge like a dome over the horizon while a sun bursts open with
// turning rays, lens flares drift across and golden sparkles float up.
// The effect layer has its own view-transition-name, so it sits above the reveal instead of being clipped by it.
function modeFx(mode, x, y) {
  const fx = document.createElement('div');
  fx.className = `mfx mfx-${mode}`;
  fx.setAttribute('aria-hidden', 'true');
  fx.style.setProperty('--fx', `${x}px`);
  fx.style.setProperty('--fy', `${y}px`);
  const rnd = (a, b) => a + Math.random() * (b - a);
  let html = '';
  if (mode === 'dark') {
    html += '<i class="mfx-moon"></i>';
    for (let k = 0; k < 42; k++) html += `<i class="mfx-star" style="left:${rnd(0, 100)}%;top:${rnd(0, 100)}%;--d:${rnd(0, 0.9).toFixed(2)}s;--s:${rnd(0.5, 1.4).toFixed(2)}"></i>`;
    for (let k = 0; k < 4; k++) html += `<i class="mfx-shoot" style="left:${rnd(20, 95)}%;top:${rnd(-5, 40)}%;--d:${(0.2 + k * 0.22).toFixed(2)}s"></i>`;
  } else {
    html += '<i class="mfx-rays"></i><i class="mfx-sun"></i>';
    for (let k = 0; k < 3; k++) html += `<i class="mfx-flare f${k}"></i>`;
    for (let k = 0; k < 26; k++) html += `<i class="mfx-dust" style="left:${rnd(0, 100)}%;top:${rnd(40, 105)}%;--d:${rnd(0, 0.7).toFixed(2)}s;--s:${rnd(0.5, 1.3).toFixed(2)}"></i>`;
  }
  fx.innerHTML = html;
  document.body.appendChild(fx);
  setTimeout(() => fx.remove(), 2200);
}

export async function setMode(mode, origin) {
  store.set('mfr_mode', mode);
  themeSound(mode === 'dark');
  if (mode === 'dark') await ensureDarkCss();
  const root = document.documentElement;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const x = origin ? origin.x : innerWidth / 2;
  const y = origin ? origin.y : innerHeight - 60;
  root.style.setProperty('--mx', `${x}px`);
  root.style.setProperty('--my', `${y}px`);
  if (reduce) { apply(mode); return; }
  if (document.startViewTransition) {
    root.classList.add('mode-vt', mode === 'dark' ? 'to-dark' : 'to-light');
    const vt = document.startViewTransition(() => { apply(mode); modeFx(mode, x, y); });
    vt.ready.then(() => {
      if (mode === 'dark') {
        const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
        root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] }, { duration: 1000, easing: 'cubic-bezier(.7, 0, .2, 1)', pseudoElement: '::view-transition-new(root)' });
      } else {
        const cx = innerWidth / 2;
        const cy = innerHeight * 1.15;
        const r = Math.hypot(cx, cy);
        root.animate({ clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${r}px at ${cx}px ${cy}px)`] }, { duration: 1100, easing: 'cubic-bezier(.3, 0, .2, 1)', pseudoElement: '::view-transition-new(root)' });
        root.animate({ opacity: [1, 0.55] }, { duration: 1100, easing: 'ease-in', pseudoElement: '::view-transition-old(root)' });
      }
    }).catch(() => {});
    vt.finished.finally(() => root.classList.remove('mode-vt', 'to-dark', 'to-light'));
  } else {
    const fx = document.createElement('div');
    fx.className = `mode-ripple ${mode}`;
    document.body.appendChild(fx);
    modeFx(mode, x, y);
    setTimeout(() => apply(mode), 380);
    setTimeout(() => fx.remove(), 1000);
  }
}

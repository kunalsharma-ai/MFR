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
  if (meta) meta.setAttribute('content', mode === 'dark' ? '#070b1f' : '#0B1E5B');
  window.dispatchEvent(new CustomEvent(MODE_EVENT, { detail: { mode } }));
}

// Switch with a circular reveal that grows from the switch the visitor pressed (View Transitions API), a fallback
// ripple for other browsers, and a sound.
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
    const vt = document.startViewTransition(() => apply(mode));
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    vt.ready.then(() => {
      root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] }, { duration: 850, easing: 'cubic-bezier(.65, 0, .25, 1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(() => {});
    vt.finished.finally(() => root.classList.remove('mode-vt', 'to-dark', 'to-light'));
  } else {
    const fx = document.createElement('div');
    fx.className = `mode-ripple ${mode}`;
    document.body.appendChild(fx);
    setTimeout(() => apply(mode), 380);
    setTimeout(() => fx.remove(), 1000);
  }
}

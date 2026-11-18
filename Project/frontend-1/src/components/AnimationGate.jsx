import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isCalm } from '../utils/calm.js';

// Keeps the page light without changing how it looks:
//  1. Off-screen pause — every top-level block of the page (and the footer) is watched; when it scrolls well out of
//     view it gets [data-gate="off"] and CSS (v30-perf.css) holds every animation inside it until it comes back.
//     Only the attribute changes here: asking a whole block for its animations would force it to be styled.
//  2. Calm when idle — after a few seconds without input (utils/calm.js adds html.calm), endless decorative loops
//     outside the hero and the open dialogs pause in place; the next touch / scroll / mouse move resumes them.
// Only animations this gate paused are resumed, so finished one-shot entrances never replay.
const KEEP = '.rw-veil, .hc, .rwt, .mfx, .hm-hero, .dk-lock-card';
const paused = new WeakSet();
let held = 0; // how many animations the calm pause is holding (so nothing is scanned when there are none)

const pauseIn = (root, onlyLoops) => {
  if (!root || !root.getAnimations) return;
  for (const a of root.getAnimations({ subtree: true })) {
    if (a.playState !== 'running') continue;
    const t = a.effect && a.effect.getTiming ? a.effect.getTiming() : null;
    if (onlyLoops && (!t || t.iterations !== Infinity)) continue;
    const el = a.effect && a.effect.target;
    if (onlyLoops && el && el.closest && el.closest(KEEP)) continue;
    a.pause();
    paused.add(a);
    held += 1;
  }
};
const playIn = (root) => {
  if (!root || !root.getAnimations) return;
  for (const a of root.getAnimations({ subtree: true })) {
    if (!paused.has(a)) continue;
    const el = a.effect && a.effect.target;
    if (el && el.closest && el.closest('[data-gate="off"]')) continue; // its block is still off-screen
    paused.delete(a);
    held = Math.max(0, held - 1);
    if (a.playState === 'paused') a.play();
  }
};

export default function AnimationGate() {
  const { pathname } = useLocation();

  // 1. off-screen pause
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.removeAttribute('data-gate'); if (held && !isCalm()) playIn(e.target); }
        else e.target.setAttribute('data-gate', 'off');
      }
    }, { rootMargin: '250px 0px' });
    const watch = () => {
      document.querySelectorAll('#main > *, #main > div > section, .site-footer').forEach((el) => io.observe(el));
    };
    const t = setTimeout(watch, 400); // after the new page has rendered
    return () => { clearTimeout(t); io.disconnect(); document.querySelectorAll('[data-gate]').forEach((el) => el.removeAttribute('data-gate')); };
  }, [pathname]);

  // 2. calm when idle
  useEffect(() => {
    if (!document.getAnimations) return undefined;
    const root = document.documentElement;
    let was = root.classList.contains('calm');
    const mo = new MutationObserver(() => {
      const now = root.classList.contains('calm');
      if (now === was) return;
      was = now;
      if (now) pauseIn(document, true);
      else if (held) playIn(document);
    });
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);

  return null;
}

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// 1) Reveal: adds .is-in to every .reveal element when it scrolls into view — including elements that mount
//    later (via MutationObserver). A cheap once-per-frame scroll sweep also reveals anything the visitor has
//    already scrolled past, so a fast flick or a busy phone can never leave a section invisible.
// (Off-screen pausing lives in components/AnimationGate.jsx.)
// Content stays visible without JS (CSS only hides .reveal when <html> has the .js class).
export default function useReveal() {
  const { pathname } = useLocation();
  useEffect(() => {
    const showAll = () => document.querySelectorAll('.reveal:not(.is-in)').forEach((el) => el.classList.add('is-in'));
    if (!('IntersectionObserver' in window)) {
      showAll();
      return undefined;
    }
    const seen = new WeakSet();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting || e.boundingClientRect.top < 0) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.01 }
    );
    const scan = () => {
      document.querySelectorAll('.reveal:not(.is-in)').forEach((el) => {
        if (!seen.has(el)) {
          seen.add(el);
          io.observe(el);
        }
      });
    };
    // Safety sweep for very fast flicks — throttled to ~4 times a second (it reads layout), and it stops
    // listening once nothing is left to reveal.
    let queued = false;
    let lastSweep = 0;
    const sweep = () => {
      queued = false;
      lastSweep = performance.now();
      const pending = document.querySelectorAll('.reveal:not(.is-in)');
      if (!pending.length) return;
      const limit = window.innerHeight * 0.96;
      // Read the position of each top-level block once; only blocks that have reached the screen are looked into
      // (measuring items inside blocks that are still far below would force the whole page to be laid out).
      const near = new Map();
      const blockOf = (el) => el.closest('#main > *, #main > div > section, .site-footer');
      pending.forEach((el) => {
        const blk = blockOf(el);
        let top = blk ? near.get(blk) : undefined;
        if (blk && top === undefined) { top = blk.getBoundingClientRect().top; near.set(blk, top); }
        if (top !== undefined && top >= limit) return;
        if (el.getBoundingClientRect().top < limit) {
          el.classList.add('is-in');
          io.unobserve(el);
        }
      });
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      const wait = Math.max(0, 250 - (performance.now() - lastSweep));
      setTimeout(() => requestAnimationFrame(sweep), wait);
    };
    scan();
    let scanQ = false; // React re-renders add/remove nodes often — scan at most once per frame
    const mo = new MutationObserver(() => { if (!scanQ) { scanQ = true; requestAnimationFrame(() => { scanQ = false; scan(); }); } });
    mo.observe(document.getElementById('main') || document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    const safety = setTimeout(sweep, 1200);
    return () => {
      io.disconnect();
      mo.disconnect();
      clearTimeout(safety);
      window.removeEventListener('scroll', onScroll);
    };
  }, [pathname]);
}

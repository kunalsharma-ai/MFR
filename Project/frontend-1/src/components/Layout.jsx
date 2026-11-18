import { lazy, startTransition, Suspense, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import LiveChat from './LiveChat.jsx';
import ActivityToasts from './ActivityToasts.jsx';
import ReviewPopup from './ReviewPopup.jsx';
import VerifyEmailGate from './VerifyEmailGate.jsx';
import AnimationGate from './AnimationGate.jsx';
import VideoFab from './video/VideoFab.jsx';
import WatchBand from '../sections/WatchBand.jsx';
import { CookieBanner, FloatingDock, ScrollProgress } from './Common.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';
import useReveal from '../hooks/useReveal.js';
import { PagesContext, pageFor } from '../router/pages.js';
import { playSound, swishSound, tapSound, welcomePop } from '../utils/sound.js';
import { initMetaPixel, trackPageView } from '../utils/metaPixel.js';

// The language picker and the translation pill are only downloaded when they are needed.
const LanguagePicker = lazy(() => import('./LanguagePicker.jsx').then((m) => ({ default: m.LanguagePicker })));
const TranslateStatus = lazy(() => import('./LanguagePicker.jsx').then((m) => ({ default: m.TranslateStatus })));

export default function Layout({ children }) {
  const { picker, lang } = useI18n();
  const [chat, setChat] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { pathname, hash } = useLocation();
  useReveal();

  const pages = useContext(PagesContext);
  // as a transition, so it never forces the not-yet-hydrated parts of the page to re-render from scratch (React #421)
  useEffect(() => startTransition(() => setMounted(true)), []);
  useEffect(() => welcomePop(), []);
  // One delegated listener gives each kind of control its own sound: video buttons a film-reel "play",
  // menu dropdowns an airy swish, and the main call-to-action buttons a gem tap.
  useEffect(() => {
    const onClick = (e) => {
      const el = e.target.closest && e.target.closest('.vfab, .vfab-tease-body, .vs-poster, .nav-drop-btn, .btn-primary');
      if (!el) return;
      if (el.matches('.nav-drop-btn')) { if (el.getAttribute('aria-expanded') !== 'true') swishSound(); }
      else if (el.matches('.btn-primary')) tapSound();
      else playSound();
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // Meta Pixel: loads only after analytics consent (cookie banner); then one PageView per route change.
  useEffect(() => initMetaPixel(), []);
  useEffect(() => trackPageView(pathname), [pathname]);

  // Prefetch a page's code the moment a visitor shows intent (hover, touch, keyboard focus) so the click is
  // instant; then, once the browser is idle, quietly fetch the most-visited pages.
  useEffect(() => {
    if (!pages) return undefined;
    const want = (e) => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      let href = a.getAttribute('href') || '';
      if (href.startsWith('#/')) href = href.slice(1);
      if (!href.startsWith('/') || href.startsWith('//')) return;
      pages.load(pageFor(href)).catch(() => {});
    };
    const opts = { passive: true };
    document.addEventListener('pointerover', want, opts);
    document.addEventListener('touchstart', want, opts);
    document.addEventListener('focusin', want);
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 2500));
    let id;
    // Wait for the page's own load to finish first, so these prefetches never compete with it (they were landing
    // before the load event and pushing back "all scripts complete" in speed audits).
    const startIdle = () => {
      id = idle(() => ['SignUp', 'HowItWorks', 'Rewards', 'BlogList'].forEach((n) => pages.load(n).catch(() => {})), { timeout: 6000 });
    };
    if (document.readyState === 'complete') startIdle();
    else window.addEventListener('load', startIdle, { once: true });
    return () => {
      window.removeEventListener('load', startIdle);
      document.removeEventListener('pointerover', want, opts);
      document.removeEventListener('touchstart', want, opts);
      document.removeEventListener('focusin', want);
      if (window.cancelIdleCallback && typeof id === 'number') window.cancelIdleCallback(id);
    };
  }, [pages]);

  // Off-screen sections skip rendering (content-visibility in perf.css), so their heights are estimates until they
  // are seen and a jump can land a little off. Scroll, then re-check a few times and settle exactly on the target.
  const jumpTo = useCallback((el) => {
    const target = () => Math.round(el.getBoundingClientRect().top - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0));
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    let n = 0;
    const fix = () => {
      if (Math.abs(target()) > 4) el.scrollIntoView({ behavior: n < 3 ? 'auto' : 'smooth', block: 'start' });
      if (++n < 6) setTimeout(fix, 260);
    };
    setTimeout(fix, 900);
  }, []);

  // In-page anchors (#section) must scroll, not navigate. With hash routing (preview / file://) a raw
  // "#section" link would otherwise be treated as a route and show the 404 page.
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href === '#' || href.startsWith('#/')) return;
      const el = document.getElementById(decodeURIComponent(href.slice(1)));
      if (!el) return;
      e.preventDefault();
      jumpTo(el);
      jumpTo(el);
      if (el.tabIndex < 0 && el.id === 'main') el.focus({ preventScroll: true });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [jumpTo]);
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }
    // Deep links such as /#voices: scroll to the section once the page chunk has rendered it.
    let tries = 0;
    const t = setInterval(() => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el || ++tries > 20) {
        clearInterval(t);
        if (el) jumpTo(el);
        if (el) jumpTo(el);
      }
    }, 100);
    return () => clearInterval(t);
  }, [pathname, hash, jumpTo]);

  const closeChat = useCallback(() => setChat(false), []);
  useEffect(() => {
    const open = (e) => { setChat(true); if (e.detail && e.detail.q) setSeed({ q: e.detail.q, at: Date.now() }); };
    window.addEventListener('mfr:open-chat', open);
    return () => window.removeEventListener('mfr:open-chat', open);
  }, []);
  // Any component can open Live Help (optionally with a question): window.dispatchEvent(new CustomEvent('mfr:open-chat', { detail: { q } }))
  const [seed, setSeed] = useState(null);
  useEffect(() => {
    const open = (e) => { setChat(true); if (e.detail && e.detail.q) setSeed({ q: e.detail.q, at: Date.now() }); };
    window.addEventListener('mfr:open-chat', open);
    return () => window.removeEventListener('mfr:open-chat', open);
  }, []);

  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main" tabIndex={-1}>{children}<WatchBand /></main>
      <Suspense fallback={null}><Footer /></Suspense>
      <VerifyEmailGate />
      <FloatingDock onChat={() => setChat((v) => !v)} chatOpen={chat} />
      {mounted ? (
        <>
          <LiveChat open={chat} onClose={closeChat} seed={seed} />
          <ActivityToasts />
          <ReviewPopup />
          <CookieBanner />
          <AnimationGate />
          <VideoFab />
        </>
      ) : null}
      <Suspense fallback={null}>
        {picker ? <LanguagePicker /> : null}
        {lang !== 'en' ? <TranslateStatus /> : null}
      </Suspense>
    </>
  );
}
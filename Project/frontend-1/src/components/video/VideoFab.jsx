import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { dismiss, isDismissed } from '../../utils/dismiss.js';
import VideoStage, { YtGlyph } from './VideoStage.jsx';
import { videoFor } from '../../data/videos.js';

// Floating "Watch our videos" YouTube button (v3.0) — on every page, bottom-left. A spinning text ring, two sound
// waves and a breathing core; tap it to open this page's own video stage in a full-screen pop-up.
// Esc, the × button or a click on the backdrop closes it; focus returns to the button.
// A small "Show & watch this page" message pops up beside the button a few seconds after each page opens
// (at most 3 times per visit, never on sign-up / login, and never again once the visitor closes it).
const TEASE_KEY = 'mfr_watch_tease';
const TEASE = { n: 0 }; // shown at most 3 times per visit; × turns it off until the page is reloaded

export default function VideoFab() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [tease, setTease] = useState(false);
  const entry = videoFor(pathname);
  const btn = useRef(null);
  const box = useRef(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    setTease(false);
    if (/^\/(sign-up|login|set-password|forgot-password)/.test(pathname)) return undefined;
    if (isDismissed('video-tease') || TEASE.n >= 3) return undefined;
    const show = setTimeout(() => { TEASE.n += 1; setTease(true); }, 5000);
    const hide = setTimeout(() => setTease(false), 17000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [pathname]);
  useEffect(() => { if (open) setTease(false); }, [open]);
  // while the message is up, phones lift the reward notification above it (see v30-video.css)
  useEffect(() => {
    const on = tease && !open;
    document.documentElement.classList.toggle('vfab-teasing', on);
    return () => document.documentElement.classList.remove('vfab-teasing');
  }, [tease, open]);
  const closeTease = () => { setTease(false); dismiss('video-tease'); };
  useEffect(() => {
    const ext = () => setOpen(true);
    window.addEventListener('mfr:watch', ext);
    return () => window.removeEventListener('mfr:watch', ext);
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const root = document.documentElement;
    root.classList.add('vfab-lock');
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Tab' && box.current) {
        const f = [...box.current.querySelectorAll('a[href],button:not([disabled]),iframe')];
        if (!f.length) return;
        const a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => { const p = box.current && box.current.querySelector('.vs-poster, .vfab-x'); if (p) p.focus(); }, 60);
    const back = btn.current;
    return () => { clearTimeout(t); root.classList.remove('vfab-lock'); window.removeEventListener('keydown', onKey); if (back) back.focus({ preventScroll: true }); };
  }, [open]);

  return (
    <>
      <button ref={btn} type="button" className={`vfab${open ? ' is-open' : ''}`} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label="Watch our videos: play this page's video">
        <i className="vfab-wave" aria-hidden="true" /><i className="vfab-wave vfab-wave--2" aria-hidden="true" />
        <span className="vfab-spin" aria-hidden="true">
          <svg viewBox="0 0 100 100"><defs><path id="vfab-c" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" /></defs>
            <text><textPath href="#vfab-c" textLength="234" lengthAdjust="spacing">WATCH ★ OUR ★ VIDEOS ★ </textPath></text></svg>
        </span>
        <span className="vfab-core" aria-hidden="true"><YtGlyph s={30} /></span>
        <span className="vfab-tip" aria-hidden="true">Watch this page&rsquo;s video</span>
        {tease ? <span className="vfab-badge" aria-hidden="true">1</span> : null}
      </button>
      {tease && !open ? (
        <div className="vfab-tease" role="status">
          <button type="button" className="vfab-tease-x" onClick={closeTease} aria-label="Close the video message">×</button>
          <button type="button" className="vfab-tease-body" onClick={() => setOpen(true)}>
            <span className="vfab-tease-ic" aria-hidden="true"><YtGlyph s={26} /></span>
            <span className="vfab-tease-txt">
              <b>Show &amp; watch this page</b>
              <small>{entry.title} {entry.em}</small>
              <span className="vfab-tease-go">▶ Watch now</span>
            </span>
          </button>
        </div>
      ) : null}
      {open && typeof document !== 'undefined'
        ? createPortal(
          <div className={`vfab-ov vfab-ov--${entry.template}`} style={{ '--c1': entry.c1, '--c2': entry.c2 }} role="dialog" aria-modal="true" aria-labelledby="vfab-h" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
            <button type="button" className="vfab-x" onClick={() => setOpen(false)} aria-label="Close the video">×</button>
            <div className="vfab-box" ref={box} onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
              <VideoStage e={entry} headingId="vfab-h" inModal />
            </div>
          </div>,
          document.body,
        )
        : null}
    </>
  );
}

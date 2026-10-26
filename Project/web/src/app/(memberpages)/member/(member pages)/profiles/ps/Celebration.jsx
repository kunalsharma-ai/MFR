"use client";
import { useEffect, useRef, useState } from 'react';
import { useI18n } from './i18n.js';
import { reducedMotion } from './fx.js';
import { emojiUrl } from './assets.js';
import MemberCard from './MemberCard.jsx';
import { IArrow, IEdit } from './Icons.jsx';
import Capsule from './Capsule.jsx';
import LedCount from './LedCount.jsx';
import { ensureRewardStyles } from './rstyles.js';
import { totalPoints, fmtUsd, markPaid, isPaid, pKey, POINTS_PER_PROFILE, POINTS_PER_USD } from './rules.js';
import { flyToPoints, bump } from './rfx.js';
import { reward } from './sound.js';


/* Prize ticket (Prize Machine rewards): prints out of the pop-up with the profile's opened capsule,
   "+100 points won" and the new balance; a +100 capsule then flies to the header points pill. Compact, so the
   pop-up still fits the screen. Shown only on a first finish (the pop-up never opens for edits). */
function PrizeTicket({ meta }) {
  ensureRewardStyles(); // idempotent; only when a ticket is actually shown
  const { t, lang } = useI18n();
  const after = totalPoints(), nf = new Intl.NumberFormat(lang);
  const [v, setV] = useState(Math.max(0, after - POINTS_PER_PROFILE));
  const box = useRef(null);
  useEffect(() => {
    const key = pKey(meta);
    const tm = setTimeout(() => {
      setV(after); reward('pop', lang);
      if (isPaid(key) || !box.current) return;
      const r = box.current.getBoundingClientRect();
      setTimeout(() => flyToPoints({ x: r.left + 30, y: r.top + r.height / 2 }, t('rw.plus', { n: nf.format(POINTS_PER_PROFILE) }), ['#ffa200', '#ffd36a'])
        .then((el) => { markPaid(key); if (el) { bump(el); reward('land', lang); } }), 500);
    }, reducedMotion() ? 0 : 1700);
    return () => clearTimeout(tm);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const next = (Math.floor(after / POINTS_PER_USD) + 1) * POINTS_PER_USD;
  return (
    <div className="pm-ticket" ref={box} role="group" aria-label={t('rw.ticket')}>
      <Capsule slug={meta.s} open />
      <span className="pm-ticket-t">
        <small>{t('rw.ticket')}</small>
        <b>{t('rw.won', { n: nf.format(POINTS_PER_PROFILE) })}</b>
        <span aria-hidden="true"><LedCount value={v} lang={lang} /> {t('rw.pts')} · {fmtUsd(v, lang)}</span>
        <span className="sr-only">{t('rw.balance', { pts: nf.format(after), usd: fmtUsd(after, lang) })}</span>
        <span>{t('rw.toNext', { n: nf.format(next - after), usd: fmtUsd(next, lang) })}</span>
      </span>
    </div>
  );
}

// Every profile finishes differently: its own particle show, card entrance, badge and icons.
// Keyed by profile slug; under-18 profiles get a playful variant (see celebrationFor).
export const CELEBRATION = {
  basic: { mode: 'confetti', enter: 'zoom', badge: '✨', icons: ['basic', 'sparkles', 'star'] },
  professional: { mode: 'stars', enter: 'rise', badge: '💼', icons: ['professional', 'chart', 'trophy'] },
  educational: { mode: 'ribbons', enter: 'flip', badge: '🎓', icons: ['graduation', 'book', 'medal'] },
  financial: { mode: 'coins', enter: 'drop', badge: '💰' },
  'banking-financial-services': { mode: 'rain', enter: 'stamp', badge: '🏦', icons: ['banking', 'coin', 'card2', 'piggy'] },
  parenting: { mode: 'balloons', enter: 'bounce', badge: '🎈' },
  'home-pet': { mode: 'orbit', enter: 'swing', badge: '🏡', icons: ['home', 'pet', 'heart', 'plant'] },
  'home-household': { mode: 'petals', enter: 'unfold', badge: '🛋️' },
  'household-services': { mode: 'cannons', enter: 'elastic', badge: '🧹' },
  'pets-animal-care': { mode: 'emoji', enter: 'bounce', badge: '🐾', icons: ['pawprint', 'dog', 'cat', 'bone'] },
  shopping: { mode: 'hearts', enter: 'zoom', badge: '🛍️' },
  'fashion-apparel': { mode: 'spiral', enter: 'swing', badge: '👗' },
  'luxury-premium': { mode: 'gold', enter: 'fade', badge: '💎' },
  'lifestyle-food': { mode: 'emoji', enter: 'drop', badge: '🍽️', icons: ['pizza', 'food', 'noodle', 'cake', 'coffee'] },
  'food-beverages': { mode: 'bubbles', enter: 'elastic', badge: '🥤', icons: ['juice', 'soda', 'coffee'] },
  'restaurants-food-delivery': { mode: 'rain', enter: 'slide', badge: '🛵', icons: ['delivery', 'pizza', 'fries', 'bento'] },
  travel: { mode: 'emoji', enter: 'flip', badge: '✈️', icons: ['travel', 'tourism', 'globe', 'passport'] },
  'travel-tourism': { mode: 'orbit', enter: 'portal', badge: '🗺️', icons: ['airplane_dep', 'beach', 'mountain', 'map'] },
  automobile: { mode: 'fireworks', enter: 'slide', badge: '🏁' },
  'automotive-mobility': { mode: 'cannons', enter: 'stamp', badge: '🚗' },
  health: { mode: 'bubbles', enter: 'rise', badge: '💚' },
  'health-wellness': { mode: 'rings', enter: 'fade', badge: '🧘' },
  beauty: { mode: 'petals', enter: 'zoom', badge: '💄' },
  'beauty-personal-care': { mode: 'spiral', enter: 'portal', badge: '🧴' },
  tech: { mode: 'pixels', enter: 'glitch', badge: '⚡' },
  'consumer-electronics': { mode: 'matrix', enter: 'unfold', badge: '📱' },
  'technology-digital-services': { mode: 'rings', enter: 'glitch', badge: '☁️' },
  sports: { mode: 'emoji', enter: 'bounce', badge: '🏅', icons: ['medal', 'trophy2', 'sports', 'fire'] },
  'sports-physical-fitness': { mode: 'cannons', enter: 'spin', badge: '🏋️' },
  game: { mode: 'fireworks', enter: 'glitch', badge: '🎮' },
  'gaming-esports': { mode: 'matrix', enter: 'spin', badge: '🕹️' },
  mr: { mode: 'stars', enter: 'flip', badge: '🔬' },
  'research-panel': { mode: 'spiral', enter: 'rise', badge: '📊' },
  'entertainment-media': { mode: 'fireworks', enter: 'zoom', badge: '🎬' },
  'content-creator-social-influence1': { mode: 'hearts', enter: 'stamp', badge: '📸' },
  'tobacco-nicotine-alcoholic': { mode: 'gold', enter: 'swing', badge: '🥂' },
  additional: { mode: 'orbit', enter: 'elastic', badge: '🌍', icons: ['globe', 'sparkles', 'star2', 'rocket'] }
};
// playful twists for the under-18 versions of a profile (same slug, different show)
const KID = { confetti: 'balloons', stars: 'bubbles', ribbons: 'emoji', coins: 'rain', petals: 'balloons', bubbles: 'balloons', pixels: 'emoji', fireworks: 'rain', emoji: 'balloons', rain: 'bubbles', orbit: 'balloons', hearts: 'bubbles', matrix: 'emoji', spiral: 'balloons', rings: 'emoji', cannons: 'balloons', gold: 'bubbles' };
const KID_ENTER = { zoom: 'bounce', rise: 'elastic', flip: 'spin', drop: 'swing', bounce: 'elastic', glitch: 'bounce', slide: 'spin', fade: 'bounce', stamp: 'bounce', unfold: 'elastic', spin: 'swing', swing: 'bounce', elastic: 'spin', portal: 'bounce' };
export function celebrationFor(meta, theme) {
  const base = CELEBRATION[meta?.s] || { mode: 'confetti', enter: 'zoom', badge: '🎉' };
  const icons = base.icons || [theme.icon, ...theme.icons];
  if (meta?.c !== 'minor') return { ...base, icons };
  return { ...base, mode: KID[base.mode] || 'balloons', enter: KID_ENTER[base.enter] || 'bounce', badge: '🌟', icons: [theme.icon, 'star', 'balloon', 'party'] };
}

function run(canvas, mode, colors, icons) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = (canvas.width = innerWidth * dpr), H = (canvas.height = innerHeight * dpr);
  const R = Math.random, small = innerWidth < 600;
  const imgs = (icons || []).map((n) => { const i = new Image(); i.src = emojiUrl(n); return i; });
  const P = [];
  const N = { confetti: 160, stars: 90, ribbons: 40, coins: 70, balloons: 26, petals: 70, emoji: 46, hearts: 50, gold: 140, fireworks: 0, bubbles: 60, pixels: 140, rain: 70, spiral: 120, rings: 0, cannons: 180, orbit: 16, matrix: 70 }[mode] * (small ? 0.6 : 1);
  for (let i = 0; i < N; i++) {
    const c = colors[i % colors.length];
    const base = { c, a: R() * 6.28, va: (R() - 0.5) * 0.2, r: (5 + R() * 7) * dpr, t: R() * 100 };
    if (mode === 'confetti' || mode === 'pixels') P.push({ ...base, x: W / 2 + (R() - 0.5) * W * 0.2, y: H * 0.6, vx: (R() - 0.5) * 24 * dpr, vy: (-14 - R() * 16) * dpr, g: 0.42 });
    else if (mode === 'cannons') { const left = i % 2 === 0; P.push({ ...base, x: left ? 0 : W, y: H * 0.85, vx: (left ? 1 : -1) * (8 + R() * 16) * dpr, vy: (-12 - R() * 14) * dpr, g: 0.36 }); }
    else if (mode === 'spiral') P.push({ ...base, x: W / 2, y: H / 2, ang: (i / N) * 6.28 * 3, rad: 0, sp: (2 + (i % 7)) * 0.9 * dpr, vx: 0, vy: 0, g: 0, r: (3 + R() * 5) * dpr });
    else if (mode === 'orbit') P.push({ ...base, x: W / 2, y: H / 2, ang: (i / N) * 6.28, rad: Math.min(W, H) * 0.32, vx: 0, vy: 0, g: 0, r: 22 * dpr, img: imgs[i % (imgs.length || 1)] });
    else if (mode === 'rain') P.push({ ...base, x: R() * W, y: -R() * H, vx: 0, vy: (7 + R() * 8) * dpr, g: 0.08, r: (14 + R() * 14) * dpr, img: imgs[i % (imgs.length || 1)] });
    else if (mode === 'matrix') P.push({ ...base, x: Math.floor(R() * 40) * W / 40, y: -R() * H, vx: 0, vy: (4 + R() * 6) * dpr, g: 0, r: 14 * dpr, ch: '01アイウエオ★♦'.charAt(i % 11) });
    else if (mode === 'stars') P.push({ ...base, x: W / 2, y: H * 0.42, vx: Math.cos(base.a) * (2 + R() * 9) * dpr, vy: Math.sin(base.a) * (2 + R() * 9) * dpr, g: 0.03 });
    else if (mode === 'balloons' || mode === 'bubbles') P.push({ ...base, x: R() * W, y: H + R() * H * 0.6, vx: 0, vy: -(1.5 + R() * 2.6) * dpr, g: 0, r: (mode === 'balloons' ? 22 + R() * 14 : 6 + R() * 18) * dpr });
    else if (mode === 'hearts' || mode === 'emoji') P.push({ ...base, x: R() * W, y: mode === 'emoji' ? -R() * H * 0.8 : H + R() * H * 0.5, vx: 0, vy: (mode === 'emoji' ? 3 + R() * 4 : -(1.8 + R() * 2.4)) * dpr, g: mode === 'emoji' ? 0.05 : 0, r: (16 + R() * 18) * dpr, img: imgs[i % (imgs.length || 1)] });
    else P.push({ ...base, x: R() * W, y: -R() * H * 0.9, vx: (R() - 0.5) * 1.5 * dpr, vy: (1.5 + R() * 3) * dpr, g: mode === 'coins' ? 0.12 : 0.01, r: (mode === 'ribbons' ? 6 : mode === 'gold' ? 1.5 + R() * 2.5 : 7 + R() * 6) * dpr });
  }
  const rockets = [];
  if (mode === 'rings') for (let k = 0; k < 6; k++) rockets.push({ ring: true, at: k * 420, x: W / 2, y: H / 2, c: colors[k % colors.length], r: 0 });
  if (mode === 'fireworks') for (let k = 0; k < 7; k++) rockets.push({ at: k * 380, x: W * (0.15 + R() * 0.7), y: H, ty: H * (0.15 + R() * 0.3), c: colors[k % colors.length], done: false });
  let raf;
  const t0 = performance.now(), DUR = 3800;
  const tick = (now) => {
    const t = now - t0;
    ctx.clearRect(0, 0, W, H);
    for (const r of rockets) {
      if (t < r.at || r.done) continue;
      if (r.ring) {
        r.r += 9 * dpr;
        const a = Math.max(0, 1 - r.r / (Math.max(W, H) * 0.6));
        if (a <= 0) { r.done = true; continue; }
        ctx.globalAlpha = a; ctx.strokeStyle = r.c; ctx.lineWidth = 10 * dpr * a + 2;
        ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 6.3); ctx.stroke();
        if (r.r < 30 * dpr) for (let i = 0; i < 18; i++) { const an = (i / 18) * 6.28; P.push({ x: r.x, y: r.y, vx: Math.cos(an) * 7 * dpr, vy: Math.sin(an) * 7 * dpr, g: 0.04, c: r.c, r: 4 * dpr, spark: 1, life: 1, a: 0, va: 0, t: 0 }); }
        continue;
      }
      r.y -= 14 * dpr;
      ctx.fillStyle = '#fff'; ctx.globalAlpha = 1; ctx.fillRect(r.x - dpr, r.y, 2 * dpr, 12 * dpr);
      if (r.y <= r.ty) {
        r.done = true;
        for (let i = 0; i < 70; i++) { const a = (i / 70) * 6.28; const sp = (2 + R() * 6) * dpr; P.push({ x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.06, c: i % 3 ? r.c : '#fff', r: 2.4 * dpr, spark: 1, life: 1 }); }
      }
    }
    const fade = Math.max(0, 1 - Math.max(0, t - DUR + 900) / 900);
    for (const p of P) {
      if (p.ang !== undefined) {
        if (mode === 'spiral') { p.rad += p.sp; p.ang += 0.035; }
        else { p.ang += 0.03; p.rad *= t > DUR - 1200 ? 1.06 : 1; }
        p.x = W / 2 + Math.cos(p.ang) * p.rad; p.y = H / 2 + Math.sin(p.ang) * p.rad * (mode === 'orbit' ? 0.55 : 1); p.t += 0.05;
      } else { p.vy += p.g; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va; p.t += 0.05; }
      ctx.globalAlpha = fade * (p.spark ? Math.max(0, (p.life -= 0.012)) : 1);
      ctx.fillStyle = p.c; ctx.strokeStyle = p.c;
      ctx.save(); ctx.translate(p.x, p.y);
      switch (mode) {
        case 'confetti': ctx.rotate(p.a); ctx.fillRect(-p.r, -p.r / 3, p.r * 2, p.r / 1.5); break;
        case 'pixels': ctx.fillStyle = ['#ff2bd6', '#2bf0ff', '#b6ff3b', '#ffd23b'][(p.t * 3 | 0) % 4]; ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r); break;
        case 'stars': star(ctx, p.r * (0.7 + 0.3 * Math.sin(p.t * 3))); break;
        case 'coins': ctx.scale(Math.abs(Math.cos(p.t * 2)), 1); ctx.fillStyle = '#f5b400'; ctx.beginPath(); ctx.arc(0, 0, p.r * 1.3, 0, 6.3); ctx.fill(); ctx.fillStyle = '#ffd95a'; ctx.beginPath(); ctx.arc(0, 0, p.r * 0.9, 0, 6.3); ctx.fill(); break;
        case 'balloons': ctx.translate(Math.sin(p.t) * 8 * dpr, 0); ctx.beginPath(); ctx.ellipse(0, 0, p.r * 0.8, p.r, 0, 0, 6.3); ctx.fill(); ctx.globalAlpha *= 0.6; ctx.lineWidth = dpr; ctx.beginPath(); ctx.moveTo(0, p.r); ctx.quadraticCurveTo(6 * dpr, p.r * 1.8, 0, p.r * 2.6); ctx.stroke(); break;
        case 'bubbles': ctx.translate(Math.sin(p.t) * 10 * dpr, 0); ctx.lineWidth = 2 * dpr; ctx.globalAlpha *= 0.7; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.3); ctx.stroke(); ctx.globalAlpha *= 0.5; ctx.beginPath(); ctx.arc(-p.r / 3, -p.r / 3, p.r / 4, 0, 6.3); ctx.fillStyle = '#fff'; ctx.fill(); break;
        case 'petals': ctx.translate(Math.sin(p.t) * 14 * dpr, 0); ctx.rotate(p.a); ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r / 2.2, 0, 0, 6.3); ctx.fill(); break;
        case 'ribbons': ctx.lineWidth = p.r; ctx.beginPath(); for (let k = 0; k < 6; k++) ctx.lineTo(Math.sin(p.t + k) * 10 * dpr, k * 8 * dpr); ctx.stroke(); break;
        case 'hearts': ctx.translate(Math.sin(p.t) * 10 * dpr, 0); heart(ctx, p.r); break;
        case 'gold': ctx.fillStyle = ['#e6c77a', '#fff4cf', '#b8913b'][(p.t * 2 | 0) % 3]; ctx.globalAlpha *= 0.5 + 0.5 * Math.sin(p.t * 4); ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.3); ctx.fill(); break;
        case 'cannons': ctx.rotate(p.a); ctx.fillRect(-p.r, -p.r / 3, p.r * 2, p.r / 1.4); break;
        case 'spiral': ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.3); ctx.fill(); break;
        case 'matrix': ctx.font = `800 ${p.r}px monospace`; ctx.fillStyle = ['#2bf0ff', '#b6ff3b', '#ff2bd6'][(p.t * 2 | 0) % 3]; ctx.fillText(p.ch, 0, 0); break;
        case 'orbit': case 'rain':
        case 'emoji': ctx.rotate(Math.sin(p.t) * 0.4); if (p.img?.complete && p.img.naturalWidth) ctx.drawImage(p.img, -p.r, -p.r, p.r * 2, p.r * 2); break;
        default: ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.3); ctx.fill();
      }
      ctx.restore();
    }
    if (t < DUR) raf = requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, W, H);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
function star(ctx, r) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
function heart(ctx, r) { ctx.beginPath(); ctx.moveTo(0, r * 0.35); ctx.bezierCurveTo(-r, -r * 0.4, -r * 0.45, -r, 0, -r * 0.4); ctx.bezierCurveTo(r * 0.45, -r, r, -r * 0.4, 0, r * 0.35); ctx.fill(); }

// survey = the profile was filled from the Survey section (it is shown there as a survey): the pop-up says survey, not profile
export default function Celebration({ meta, theme, name, icon, colors, onClose, onNext, onHub, onEdit, survey = false }) {
  const { t } = useI18n();
  const cv = useRef(null);
  const first = useRef(null);
  const cfg = celebrationFor(meta, theme);
  useEffect(() => {
    first.current?.focus({ preventScroll: true });
    const stop = reducedMotion() ? () => {} : run(cv.current, cfg.mode, colors, cfg.icons);
    const esc = (e) => e.key === 'Escape' && onClose();
    addEventListener('keydown', esc);
    return () => { stop(); removeEventListener('keydown', esc); };
  }, []); // eslint-disable-line
  return (
    <div className={`celebrate cel-${cfg.mode}`} role="dialog" aria-modal="true" aria-labelledby="cel-title">
      <canvas ref={cv} className="celebrate-cv" aria-hidden="true" />
      <div className={`celebrate-card enter-${cfg.enter}`}>
        <div className="cel-stage" aria-hidden="true">
          <span className="cel-rays" />
          <MemberCard theme={theme} variant="cel" name={name} icon={icon} done />
          <span className="cel-100">100%</span>
        </div>
        <p className="cel-badge"><span aria-hidden="true">{cfg.badge}</span> {t('d.badge')}</p>
        <h2 id="cel-title">{t(survey ? 'd.title.survey' : 'd.title')}</h2>
        <p className="muted">{t(survey ? 'd.submitted.survey' : 'd.submitted')}</p>
        <PrizeTicket meta={meta} />
        <div className="cel-actions">
          <button ref={first} type="button" className="btn btn-full" onClick={onNext}>{t(survey ? 'd.next.survey' : 'd.next')} <IArrow /></button>
          <button type="button" className="btn btn-ghost" onClick={onEdit}><IEdit /> {t('d.editNow')}</button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t('d.answers')}</button>
          <button type="button" className="btn-link cel-hub" onClick={onHub}>{t(survey ? 'd.hub.survey' : 'd.hub')}</button>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useRef } from 'react';
import { useI18n } from './i18n.js';
import { assetUrl } from './assets.js';
import { themeFor } from './themes.js';
import MemberCard from './MemberCard.jsx';
import { IArrow } from './Icons.jsx';

// profile cards fanned out behind the MFR member card
const FAN = ['travel', 'game', 'beauty', 'lifestyle-food'];

export default function Hero({ onStart, stats }) {
  const { t, lang } = useI18n();
  const nf = new Intl.NumberFormat(lang);
  const card = useRef(null);
  const raf = useRef(0);
  // the member card follows the pointer (one rAF per frame, mouse only)
  const tilt = (e) => {
    if (e.pointerType !== 'mouse' || !card.current) return;
    const x = e.clientX, y = e.clientY;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = card.current, r = el.getBoundingClientRect();
      const px = (x - r.left) / r.width - 0.5, py = (y - r.top) / r.height - 0.5;
      el.style.setProperty('--ry', (px * 18).toFixed(2) + 'deg');
      el.style.setProperty('--rx', (-py * 14).toFixed(2) + 'deg');
      el.style.setProperty('--sx', ((px + 0.5) * 100).toFixed(1) + '%');
    });
  };
  const reset = () => { cancelAnimationFrame(raf.current); card.current?.style.setProperty('--ry', '0deg'); card.current?.style.setProperty('--rx', '0deg'); };
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-sky" aria-hidden="true">
        <span className="aur a1" /><span className="aur a2" />
        <span className="stars" />
      </div>
      <div className="hero-in wrap">
        <div className="hero-copy">
          <p className="kicker"><img src={assetUrl('images/emoji/gift.webp')} alt="" width="22" height="22" />{t('hero.kicker')}</p>
          <h1 id="hero-title">
            <span className="h1a">{t('hero.title1')}</span>
            <span className="h1b">{t('hero.title2')}</span>
          </h1>
          <p className="hero-sub">{t('hero.sub')}</p>
          <div className="hero-cta">
            <button type="button" className="btn btn-xl" onClick={onStart}>{t('hero.cta')} <IArrow /></button>
          </div>
        </div>
        <div className="club" aria-hidden="true" onPointerMove={tilt} onPointerLeave={reset}>
          <span className="club-halo" />
          {FAN.map((slug, i) => {
            const th = themeFor(slug);
            return <MemberCard key={slug} theme={th} variant="fan" className={`fan fan${i}`} name={t('p.' + slug)} />;
          })}
          <div className="club-card" ref={card}>
            <span className="cc-foil" />
            <span className="cc-sheen" />
            <span className="cc-top">
              <span className="mc-chip" />
              <span className="cc-wave"><i /><i /><i /></span>
              <span className="cc-star">★</span>
            </span>
            <img className="cc-logo" src={assetUrl('images/brand/mfr-mark-384.webp')} srcSet={`${assetUrl('images/brand/mfr-mark-192.webp')} 192w, ${assetUrl('images/brand/mfr-mark-384.webp')} 384w`}
              sizes="120px" alt="" width="120" height="120" fetchpriority="high" decoding="async" />
            <span className="cc-brand">Myfrequent<b>rewards</b></span>
            <span className="cc-details">
              <span><small>{t('hero.stat.p')}</small>{nf.format(stats.profiles)}</span>
              <span><small>{t('hub.done')}</small>{nf.format(stats.done)}</span>
              <span><small>{t('hub.complete')}</small>{nf.format(stats.pct)}%</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

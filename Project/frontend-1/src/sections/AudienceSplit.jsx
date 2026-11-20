import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import useInView from '../hooks/useInView.js';

// "Who are you today?" — three worlds, three personalities (Round 13).
// Desktop: three tall doors side by side; the open one fills the stage, the other two stay as slim glowing spines you
// can click. Phones: a pill switcher and one world at a time. Each world has its own palette and its own animated scene:
//   Consumer     → "Pop Market": a 3D product card being rated star by star, a receipt printing points, floating treats
//   Professional → "Midnight Boardroom": a spinning glass sector cube, a gold verified seal, a live chart, a sector ticker
//   Teen         → "Neon Arcade": a handheld console levelling up, pixel hearts, sticker emojis on a synthwave floor
// The worlds take turns while the section is in view; hover, focus or a pick pauses it. Reduced motion: no rotation and
// no animation, every scene shows its finished state.
const E = (n) => `/images/minor/emoji/${n}.webp`;

const WORLDS = [
  {
    id: 'c',
    name: 'Consumer',
    icon: 'user',
    tag: 'For consumers',
    title: <>Shop it. Rate it. <span>Get rewarded.</span></>,
    line: 'What you buy, watch, drive, eat and play shapes the next generation of products.',
    chips: [['cart', 'Shopping'], ['heart', 'Food & drinks'], ['mobile', 'Tech & apps'], ['globe', 'Travel'], ['star', 'Gaming'], ['sparkle', 'Beauty']],
    stats: [['Points', 'on every survey'], ['10–18', 'minutes']],
    to: '/paid-surveys-for-consumers',
    cta: 'Earn as a consumer',
    spine: 'gift',
  },
  {
    id: 'p',
    name: 'Professional',
    icon: 'briefcase',
    tag: 'For professionals',
    title: <>Your expertise has <span>a market rate.</span></>,
    line: 'CXOs, managers, engineers, clinicians and founders earn for expert B2B opinions.',
    chips: [['star', 'C-suite'], ['database', 'IT decision-makers'], ['medical', 'Healthcare'], ['activity', 'Manufacturing'], ['coins', 'Finance'], ['clipboard', 'Procurement']],
    stats: [['Higher', 'B2B rewards'], ['Verified', 'members only']],
    to: '/paid-surveys-for-professionals',
    cta: 'Earn as a professional',
    spine: 'handshake',
  },
  {
    id: 't',
    name: 'Teen',
    icon: 'rocket',
    tag: 'For teens · 13–17',
    title: <>Play it. Rate it. <span>Level up.</span></>,
    line: 'Games, music, snacks, style and the apps you live on: your take shapes them, with a parent’s OK.',
    chips: [['game', 'Gaming'], ['music', 'Music'], ['heart', 'Snacks'], ['sparkle', 'Style'], ['mobile', 'Apps'], ['trophy', 'Sport']],
    stats: [['13', 'profile worlds'], ['2 yeses', 'parent + you']],
    to: '/paid-surveys-for-teens',
    cta: 'Explore the Teen Panel',
    spine: 'console',
  },
];

/* ---------------------------------------------------------------- scenes (decorative, hidden from screen readers) */
function PopMarket() {
  return (
    <div className="wp-scene pm" aria-hidden="true">
      <div className="pm-sun" />
      <div className="pm-shelf">
        {['popcorn', 'pizza', 'icecream', 'gift', 'music'].map((n, i) => <img key={n} src={E(n)} alt="" width="56" height="56" loading="lazy" style={{ '--i': i }} />)}
      </div>
      <div className="pm-card">
        <div className="pm-prod">
          {['popcorn', 'pizza', 'icecream'].map((n, i) => <img key={n} src={E(n)} alt="" width="120" height="120" loading="lazy" style={{ '--i': i }} />)}
        </div>
        <p className="pm-q">How was it?</p>
        <div className="pm-stars">{[0, 1, 2, 3, 4].map((i) => <i key={i} style={{ '--i': i }}><Icon name="star" size={22} /></i>)}</div>
        <div className="pm-receipt"><b>Thanks for rating!</b><span>+ points added</span><em>★ ★ ★ ★ ★</em></div>
      </div>
      <img className="pm-float f1" src={E('gift')} alt="" width="74" height="74" loading="lazy" />
      <img className="pm-float f2" src={E('star')} alt="" width="52" height="52" loading="lazy" />
      <img className="pm-float f3" src={E('coin')} alt="" width="60" height="60" loading="lazy" />
      <span className="pm-bubble b1" /><span className="pm-bubble b2" /><span className="pm-bubble b3" />
    </div>
  );
}

const SECTORS = [['briefcase', 'C-suite'], ['database', 'IT'], ['medical', 'Health'], ['coins', 'Finance'], ['activity', 'Industry'], ['clipboard', 'Procure']];
function Boardroom() {
  return (
    <div className="wp-scene br" aria-hidden="true">
      <div className="br-grid" />
      <div className="br-cube-wrap">
        <div className="br-cube">
          {SECTORS.map(([ic, t], i) => <span key={t} className={`f f${i}`}><Icon name={ic} size={34} stroke={1.5} /><small>{t}</small></span>)}
        </div>
      </div>
      <div className="br-seal"><img src={E('verified')} alt="" width="54" height="54" loading="lazy" /><svg viewBox="0 0 120 120"><defs><path id="brc" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0" /></defs><text><textPath href="#brc">VERIFIED EXPERT · VERIFIED EXPERT · </textPath></text></svg></div>
      <div className="br-chart">
        <p><b>Study fit</b><em>98%</em></p>
        <svg viewBox="0 0 200 70" preserveAspectRatio="none"><path className="ln" d="M0 60 L30 52 L55 56 L80 38 L110 42 L135 24 L160 28 L200 8" /><path className="ar" d="M0 60 L30 52 L55 56 L80 38 L110 42 L135 24 L160 28 L200 8 V70 H0z" /></svg>
        <div className="br-bars">{[38, 56, 44, 72, 64, 88].map((h, i) => <i key={i} style={{ '--h': `${h}%`, '--i': i }} />)}</div>
      </div>
      <img className="br-float f1" src={E('handshake')} alt="" width="62" height="62" loading="lazy" />
      <img className="br-float f2" src={E('trophy')} alt="" width="54" height="54" loading="lazy" />
      <div className="br-ticker"><div>{[...SECTORS, ...SECTORS].map(([ic, t], i) => <span key={i}><Icon name={ic} size={13} /> {t} study open</span>)}</div></div>
    </div>
  );
}

function Arcade() {
  return (
    <div className="wp-scene ar" aria-hidden="true">
      <div className="ar-sky"><i className="s1" /><i className="s2" /><i className="s3" /><i className="s4" /></div>
      <div className="ar-floor" />
      <div className="ar-device">
        <div className="ar-screen">
          <p className="ar-lvl"><span>LEVEL</span><b className="l1">3</b><b className="l2">4</b></p>
          <div className="ar-xp"><i /></div>
          <p className="ar-msg"><span>Poll done</span><span>+ XP</span><span>LEVEL UP!</span></p>
          <div className="ar-hearts">{[0, 1, 2].map((i) => <i key={i} style={{ '--i': i }} />)}</div>
        </div>
        <div className="ar-pad"><span className="dp" /><span className="bt a" /><span className="bt b" /></div>
      </div>
      {[['crown', 'k1'], ['rocket', 'k2'], ['music', 'k3'], ['trophy', 'k4'], ['fire', 'k5']].map(([n, k]) => <img key={k} className={`ar-sticker ${k}`} src={E(n)} alt="" width="58" height="58" loading="lazy" />)}
    </div>
  );
}
const SCENE = { c: PopMarket, p: Boardroom, t: Arcade };

const AUTO_MS = 6500;

export default function AudienceSplit() {
  const [open, setOpen] = useState('c');
  const [ref, seen] = useInView({ threshold: 0.35 });
  const hold = useRef(false);
  const idle = useRef(0);
  const stage = useRef(null);

  // the worlds take turns while the section is on screen (not with reduced motion)
  useEffect(() => {
    if (!seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const iv = setInterval(() => {
      if (hold.current || document.hidden || Date.now() < idle.current) return;
      setOpen((o) => WORLDS[(WORLDS.findIndex((w) => w.id === o) + 1) % WORLDS.length].id);
    }, AUTO_MS);
    return () => clearInterval(iv);
  }, [seen]);

  const pick = (id) => { idle.current = Date.now() + 12000; setOpen(id); };
  // gentle parallax for the open world's scene
  const tilt = (e) => {
    const el = stage.current;
    if (!el || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };

  return (
    <section className="section wp" aria-labelledby="split-title" ref={ref}>
      <div className="container">
        <div className="wp-head reveal">
          <p className="eyebrow">Three ways to earn</p>
          <h2 id="split-title">Who are you <em>today?</em></h2>
          <p className="sec-sub">Three worlds, three styles of survey. Open a door to step inside.</p>
        </div>

        <div className="wp-pills" role="group" aria-label="Choose a world">
          {WORLDS.map((w) => (
            <button key={w.id} type="button" className={`wp-pill p-${w.id}`} aria-pressed={open === w.id} onClick={() => pick(w.id)}>
              <img src={E(w.spine)} alt="" width="22" height="22" /> {w.name}
            </button>
          ))}
        </div>

        <div
          className={`wp-stage on-${open} ${seen ? 'is-live' : ''}`}
          ref={stage}
          onPointerMove={tilt}
          onMouseEnter={() => { hold.current = true; }}
          onMouseLeave={() => { hold.current = false; idle.current = Date.now() + 2500; }}
          onFocus={() => { hold.current = true; }}
          onBlur={() => { hold.current = false; }}
        >
          {WORLDS.map((w) => {
            const Scene = SCENE[w.id];
            const isOpen = open === w.id;
            return (
              <article key={w.id} className={`wp-door d-${w.id} ${isOpen ? 'is-open' : ''}`} aria-label={`${w.name} world`}>
                <button type="button" className="wp-spine" onClick={() => pick(w.id)} aria-label={`Open the ${w.name.toLowerCase()} world`} tabIndex={isOpen ? -1 : 0} aria-hidden={isOpen}>
                  <img src={E(w.spine)} alt="" width="56" height="56" />
                  <span>{w.name}</span>
                  <Icon name="arrow" size={16} />
                </button>
                <div className="wp-room" aria-hidden={!isOpen}>
                  <div className="wp-copy">
                    <span className="wp-tag"><Icon name={w.icon} size={15} /> {w.tag}</span>
                    <h3>{w.title}</h3>
                    <p>{w.line}</p>
                    <ul className="wp-chips">{w.chips.map(([ic, t], i) => <li key={t} style={{ '--i': i }}><Icon name={ic} size={13} /> {t}</li>)}</ul>
                    <ul className="wp-stats">{w.stats.map(([b, t]) => <li key={t}><b>{b}</b><small>{t}</small></li>)}</ul>
                    <Link to={w.to} className="wp-cta" tabIndex={isOpen ? 0 : -1}>{w.cta} <Icon name="arrow" size={18} /></Link>
                  </div>
                  <Scene />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

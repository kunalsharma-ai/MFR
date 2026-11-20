import { useRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import useInView from '../hooks/useInView.js';

// "Who are you today?" — three worlds, all on screen at once (Round 13b).
// Each world is a tall poster card with its own palette, an HD photo or 3D art stage, floating 3D emoji and one live
// widget that tells its story on a loop:
//   Consumer     → "Pop Market": real shopper photo, a rating card filling its stars and paying "+ points"
//   Professional → "Midnight Boardroom": real boardroom photo in navy/gold, a turning verified seal and a live study chart
//   Teen         → "Neon Arcade": 3D arcade art on a synthwave floor, a pixel console levelling up, sticker emoji
// Cards tilt in 3D under the pointer. Reduced motion: no tilt, no loops, every widget shows its finished state.
const E = (n) => `/images/minor/emoji/${n}.webp`;

const WORLDS = [
  {
    id: 'c',
    world: 'Pop Market',
    tag: 'For consumers',
    icon: 'user',
    title: <>Shop it. Rate it. <span>Get rewarded.</span></>,
    line: 'What you buy, watch, eat and play shapes the next generation of products.',
    chips: [['cart', 'Shopping'], ['heart', 'Food & drinks'], ['mobile', 'Tech & apps'], ['globe', 'Travel']],
    stats: [['Points', 'on every survey'], ['10–18', 'minutes']],
    to: '/paid-surveys-for-consumers',
    cta: 'Earn as a consumer',
  },
  {
    id: 'p',
    world: 'Midnight Boardroom',
    tag: 'For professionals',
    icon: 'briefcase',
    title: <>Your expertise has <span>a market rate.</span></>,
    line: 'CXOs, managers, engineers, clinicians and founders earn for expert B2B opinions.',
    chips: [['star', 'C-suite'], ['database', 'IT leaders'], ['medical', 'Healthcare'], ['coins', 'Finance']],
    stats: [['Higher', 'B2B rewards'], ['Verified', 'members only']],
    to: '/paid-surveys-for-professionals',
    cta: 'Earn as a professional',
  },
  {
    id: 't',
    world: 'Neon Arcade',
    tag: 'For teens · 13–17',
    icon: 'rocket',
    title: <>Play it. Rate it. <span>Level up.</span></>,
    line: 'Games, music, snacks, style and apps: your take shapes them, with a parent’s OK.',
    chips: [['game', 'Gaming'], ['music', 'Music'], ['heart', 'Snacks'], ['sparkle', 'Style']],
    stats: [['13', 'profile worlds'], ['2 yeses', 'parent + you']],
    to: '/paid-surveys-for-teens',
    cta: 'Explore the Teen Panel',
  },
];

/* ---------------------------------------------------------------- stages (decorative, hidden from screen readers) */
function PopMarket() {
  return (
    <div className="wv-stage" aria-hidden="true">
      <img className="wv-photo" src="/images/worlds/consumer.webp" alt="" width="960" height="792" loading="lazy" decoding="async" />
      <span className="wv-tint" />
      <img className="wv-emo e1" src={E('popcorn')} alt="" width="64" height="64" loading="lazy" />
      <img className="wv-emo e2" src={E('gift')} alt="" width="58" height="58" loading="lazy" />
      <img className="wv-emo e3" src={E('star')} alt="" width="42" height="42" loading="lazy" />
      <div className="pm-rate">
        <div className="pm-prod">{['pizza', 'icecream', 'popcorn'].map((n, i) => <img key={n} src={E(n)} alt="" width="44" height="44" loading="lazy" style={{ '--i': i }} />)}</div>
        <div>
          <b>How was it?</b>
          <span className="pm-stars">{[0, 1, 2, 3, 4].map((i) => <i key={i} style={{ '--i': i }}><Icon name="star" size={15} /></i>)}</span>
        </div>
        <em className="pm-pay"><img src={E('coin')} alt="" width="20" height="20" loading="lazy" /> + points</em>
      </div>
    </div>
  );
}

function Boardroom() {
  return (
    <div className="wv-stage" aria-hidden="true">
      <img className="wv-photo" src="/images/worlds/professional.webp" alt="" width="1100" height="700" loading="lazy" decoding="async" />
      <span className="wv-tint" />
      <span className="br-scan" />
      <div className="br-seal">
        <img src={E('verified')} alt="" width="34" height="34" loading="lazy" />
        <svg viewBox="0 0 120 120"><defs><path id="wv-brc" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" /></defs><text><textPath href="#wv-brc">VERIFIED EXPERT · VERIFIED EXPERT · </textPath></text></svg>
      </div>
      <div className="br-chart">
        <p><b>Study fit</b><em>98%</em></p>
        <svg viewBox="0 0 200 60" preserveAspectRatio="none"><path className="ar" d="M0 52 L30 44 L55 48 L80 30 L110 34 L135 18 L160 22 L200 4 V60 H0z" /><path className="ln" d="M0 52 L30 44 L55 48 L80 30 L110 34 L135 18 L160 22 L200 4" /></svg>
      </div>
      <img className="wv-emo e1" src={E('handshake')} alt="" width="56" height="56" loading="lazy" />
      <img className="wv-emo e2" src={E('trophy')} alt="" width="46" height="46" loading="lazy" />
    </div>
  );
}

function Arcade() {
  return (
    <div className="wv-stage" aria-hidden="true">
      <span className="ar-sky"><i /><i /><i /><i /><i /></span>
      <span className="ar-sun" />
      <span className="ar-floor" />
      <img className="ar-art" src="/images/minor/art/arcade.webp" alt="" width="400" height="400" loading="lazy" decoding="async" />
      <img className="wv-emo e1" src={E('crown')} alt="" width="54" height="54" loading="lazy" />
      <img className="wv-emo e2" src={E('rocket')} alt="" width="50" height="50" loading="lazy" />
      <img className="wv-emo e3" src={E('fire')} alt="" width="40" height="40" loading="lazy" />
      <div className="ar-hud">
        <p><span>LEVEL</span><b className="l1">3</b><b className="l2">4</b><em>LEVEL UP!</em></p>
        <div className="ar-xp"><i /></div>
        <div className="ar-hearts">{[0, 1, 2].map((i) => <i key={i} style={{ '--i': i }} />)}<small>+ XP</small></div>
      </div>
    </div>
  );
}
const STAGE = { c: PopMarket, p: Boardroom, t: Arcade };

function WorldCard({ w, i }) {
  const el = useRef(null);
  const Stage = STAGE[w.id];
  // gentle 3D tilt under the pointer (mouse and pen only)
  const move = (e) => {
    const c = el.current;
    if (!c || e.pointerType === 'touch') return;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--rx', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    c.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
  };
  const leave = () => { el.current?.style.setProperty('--rx', 0); el.current?.style.setProperty('--ry', 0); };
  return (
    <article ref={el} className={`wv-card w-${w.id}`} style={{ '--n': i }} onPointerMove={move} onPointerLeave={leave} aria-labelledby={`wv-t-${w.id}`}>
      <span className="wv-ring" aria-hidden="true" />
      <div className="wv-media">
        <Stage />
        <span className="wv-world"><i />{w.world}</span>
      </div>
      <div className="wv-body">
        <span className="wv-tag"><Icon name={w.icon} size={14} /> {w.tag}</span>
        <h3 id={`wv-t-${w.id}`}>{w.title}</h3>
        <p>{w.line}</p>
        <ul className="wv-chips">{w.chips.map(([ic, t]) => <li key={t}><Icon name={ic} size={13} /> {t}</li>)}</ul>
        <ul className="wv-stats">{w.stats.map(([b, t]) => <li key={t}><b>{b}</b><small>{t}</small></li>)}</ul>
        <Link to={w.to} className="wv-cta">{w.cta} <Icon name="arrow" size={18} /></Link>
      </div>
    </article>
  );
}

export default function AudienceSplit() {
  const [ref, seen] = useInView({ threshold: 0.08 });
  return (
    <section className={`section wv ${seen ? 'is-live' : ''}`} aria-labelledby="split-title" ref={ref}>
      <span className="wv-aura" aria-hidden="true" />
      <div className="container">
        <div className="wv-head reveal">
          <p className="eyebrow">Three ways to earn</p>
          <h2 id="split-title">Who are you <em>today?</em></h2>
          <p className="sec-sub">Three worlds, each with its own kind of survey. Pick the one that sounds like you.</p>
        </div>
        <div className="wv-grid">
          {WORLDS.map((w, i) => <WorldCard key={w.id} w={w} i={i} />)}
        </div>
      </div>
    </section>
  );
}

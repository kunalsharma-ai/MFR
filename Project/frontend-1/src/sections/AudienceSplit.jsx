import { useRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import useInView from '../hooks/useInView.js';

// "Who are you today?" — three worlds, all on screen at once (Round 13b).
// Each world is a tall poster card with its own palette, its own hand-drawn animated vector scene and one live widget:
//   Consumer     → "Pop Market": products spring out of a shopping bag, confetti, a rating card paying "+ points"
//   Professional → "Midnight Boardroom": a data network with flowing wires, a gold verified shield, isometric bars
//                  growing with a trend line, and a live study chart
//   Teen         → "Neon Arcade": a pixel hero runs and jumps to hit a ? block, coins and +XP pop, a level-up HUD
// Cards tilt in 3D under the pointer. Reduced motion: no tilt, no loops, every widget shows its finished state.

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

/* ---------------------------------------------------------------- stages (decorative, hidden from screen readers)
   Everything here is hand-drawn vector art: no photos, no emoji images. */

// shared vector props for the consumer world
function ShopDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="wv-bag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF8A5B" /><stop offset=".55" stopColor="#FF4F7B" /><stop offset="1" stopColor="#D61F69" /></linearGradient>
        <linearGradient id="wv-scr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#22D3EE" /><stop offset="1" stopColor="#8B5CF6" /></linearGradient>
        <radialGradient id="wv-sun"><stop offset="0" stopColor="#FFF4D6" /><stop offset=".6" stopColor="#FFD08A" stopOpacity=".8" /><stop offset="1" stopColor="#FFD08A" stopOpacity="0" /></radialGradient>
        <symbol id="wv-shoe" viewBox="0 0 60 36"><path d="M4 22C4 14 10 8 18 8h8c4 6 12 8 20 10s12 6 12 10v2H4z" fill="#FF5E7E" /><rect x="2" y="27" width="58" height="7" rx="3.5" fill="#fff" /><path d="M20 12l4 6M26 11l4 6M32 13l3 5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /><path d="M40 20c6 1 12 4 14 8" stroke="#FFD36B" strokeWidth="3" fill="none" strokeLinecap="round" /></symbol>
        <symbol id="wv-phone" viewBox="0 0 30 50"><rect x="1" y="1" width="28" height="48" rx="6" fill="#2A1A4A" /><rect x="4" y="6" width="22" height="36" rx="3" fill="url(#wv-scr)" /><path d="M9 26l4 4 8-9" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /><circle cx="15" cy="45.5" r="1.8" fill="#fff" opacity=".6" /></symbol>
        <symbol id="wv-cup" viewBox="0 0 40 50"><path d="M6 14h28l-4 34H10z" fill="#fff" /><rect x="3" y="8" width="34" height="8" rx="4" fill="#7A3B2E" /><path d="M8.5 24h23l-1.3 11H9.8z" fill="#FFB25B" /><path d="M24 8V1h6" stroke="#FF4F7B" strokeWidth="3" fill="none" strokeLinecap="round" /></symbol>
        <symbol id="wv-head" viewBox="0 0 50 44"><path d="M7 28v-6a18 18 0 0 1 36 0v6" fill="none" stroke="#8B5CF6" strokeWidth="5" strokeLinecap="round" /><rect x="1" y="24" width="13" height="19" rx="6" fill="#FF3D7F" /><rect x="36" y="24" width="13" height="19" rx="6" fill="#FF3D7F" /></symbol>
        <symbol id="wv-gift" viewBox="0 0 44 44"><rect x="3" y="17" width="38" height="25" rx="4" fill="#FFB25B" /><rect x="1" y="10" width="42" height="9" rx="3" fill="#FF6F61" /><rect x="19" y="10" width="6" height="32" fill="#fff" /><path d="M22 10C15 1 6 5 13 10M22 10c7-9 16-5 9 0" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></symbol>
        <symbol id="wv-coin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#FFC531" /><circle cx="12" cy="12" r="7.5" fill="none" stroke="#E59A00" strokeWidth="2" /><path d="M12 7.5v9M9.5 10h5" stroke="#E59A00" strokeWidth="2" strokeLinecap="round" /></symbol>
      </defs>
    </svg>
  );
}
const POPS = [['wv-shoe', 74, 44, -136, -30, 0], ['wv-phone', 36, 60, -70, -86, 0.35], ['wv-cup', 44, 56, 26, -92, 0.7], ['wv-head', 62, 54, 108, -50, 1.05], ['wv-gift', 52, 52, 140, 30, 1.4]];
const CONFETTI = [[40, '#FF4F7B', 0], [92, '#FFB25B', -1.2], [150, '#8B5CF6', -2.4], [250, '#22D3EE', -0.6], [310, '#FF4F7B', -1.8], [360, '#FFD36B', -3]];

function PopMarket() {
  return (
    <div className="wv-stage" aria-hidden="true">
      <ShopDefs />
      <svg className="wv-art pm-art" viewBox="0 0 400 210" preserveAspectRatio="xMidYMid meet">
        <circle className="pm-glow" cx="200" cy="128" r="104" fill="url(#wv-sun)" />
        <circle className="pm-ring" cx="200" cy="128" r="86" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="3 9" opacity=".8" />
        {CONFETTI.map(([x, c, d], i) => <rect key={i} className="pm-conf" x={x} y="-12" width="7" height="12" rx="2" fill={c} style={{ animationDelay: `${d}s` }} />)}
        {POPS.map(([id, w, h, x, y, d]) => (
          <g key={id} transform="translate(200 100)">
            <g className="pm-pop" style={{ '--x': `${x}px`, '--y': `${y}px`, animationDelay: `${d}s` }}><use href={`#${id}`} x={-w / 2} y={-h / 2} width={w} height={h} /></g>
          </g>
        ))}
        <g transform="translate(200 204) scale(1.3) translate(-200 -204)"><g className="pm-bag">
          <path d="M163 118h74l7 86h-88z" fill="url(#wv-bag)" />
          <path d="M163 118h74l1 10h-76z" fill="#fff" opacity=".25" />
          <path d="M181 118v-12a19 19 0 0 1 38 0v12" fill="none" stroke="#3A0C2E" strokeWidth="5" strokeLinecap="round" />
          <path d="M200 146l5.5 11 12 1.8-8.7 8.4 2 12-10.8-5.6-10.8 5.6 2-12-8.7-8.4 12-1.8z" fill="#FFE7B8" />
          <path d="M170 128l-3 66" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".3" />
        </g></g>
        {[[96, 150], [306, 112], [262, 186], [130, 92]].map(([x, y], i) => <path key={i} className="pm-spark" d={`M${x} ${y - 9}l2.4 6.6 6.6 2.4-6.6 2.4-2.4 6.6-2.4-6.6-6.6-2.4 6.6-2.4z`} fill="#fff" style={{ animationDelay: `${i * -0.6}s` }} />)}
      </svg>
      <div className="pm-rate">
        <div className="pm-prod">{['wv-shoe', 'wv-phone', 'wv-cup'].map((n, i) => <svg key={n} viewBox="0 0 60 50" style={{ '--i': i }}><use href={`#${n}`} x="8" y="5" width="44" height="40" /></svg>)}</div>
        <div>
          <b>How was it?</b>
          <span className="pm-stars">{[0, 1, 2, 3, 4].map((i) => <i key={i} style={{ '--i': i }}><Icon name="star" size={15} /></i>)}</span>
        </div>
        <em className="pm-pay"><svg viewBox="0 0 24 24" width="18" height="18"><use href="#wv-coin" /></svg> + points</em>
      </div>
    </div>
  );
}

// isometric bar: front-left, front-right and top faces
const iso = (x, h, base = 196) => [
  `${x},${base} ${x + 20},${base + 10} ${x + 20},${base + 10 - h} ${x},${base - h}`,
  `${x + 20},${base + 10} ${x + 40},${base} ${x + 40},${base - h} ${x + 20},${base + 10 - h}`,
  `${x},${base - h} ${x + 20},${base + 10 - h} ${x + 40},${base - h} ${x + 20},${base - 10 - h}`,
];
const BARS = [[208, 46], [252, 78], [296, 62], [340, 112]];
const NODES = [[40, 52], [96, 26], [150, 70], [70, 120], [128, 150], [30, 176]];
const WIRES = [[0, 1], [1, 2], [0, 3], [3, 2], [3, 4], [4, 2], [3, 5]];

function Boardroom() {
  return (
    <div className="wv-stage" aria-hidden="true">
      <span className="br-grid" />
      <svg className="wv-art br-art" viewBox="0 0 400 210" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="wv-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFE6A3" /><stop offset="1" stopColor="#E2A62A" /></linearGradient>
        </defs>
        {WIRES.map(([a, b], i) => <line key={i} className="br-wire" x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} style={{ animationDelay: `${i * -0.4}s` }} />)}
        {NODES.map(([x, y], i) => <g key={i}><circle className="br-ping" cx={x} cy={y} r="6" style={{ animationDelay: `${i * -0.5}s` }} /><circle cx={x} cy={y} r="5" fill="#0B1433" stroke="#2EE6CF" strokeWidth="2" /></g>)}
        <g className="br-shield">
          <path d="M96 78l26 9v19c0 17-12 27-26 32-14-5-26-15-26-32V87z" fill="url(#wv-gold)" />
          <path d="M84 107l8 8 16-17" className="br-tick" fill="none" stroke="#0B1433" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {BARS.map(([x, h], i) => {
          const [l, r, t] = iso(x, h);
          return (
            <g key={x} className="br-bar" style={{ animationDelay: `${i * 0.18}s` }}>
              <polygon points={l} fill="#1C3A8A" /><polygon points={r} fill="#12286A" /><polygon points={t} fill={i === 3 ? '#F5C451' : '#2EE6CF'} />
            </g>
          );
        })}
        <path className="br-trend" d="M214 136L262 104L306 120L352 70" fill="none" stroke="#F5C451" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <g className="br-orbit"><ellipse cx="360" cy="40" rx="26" ry="9" fill="none" stroke="rgba(245,196,81,.5)" strokeWidth="1.5" /><circle className="br-moon" cx="386" cy="40" r="4" fill="#F5C451" /></g>
      </svg>
      <div className="br-chart">
        <p><b>Study fit</b><em>98%</em></p>
        <svg viewBox="0 0 200 60" preserveAspectRatio="none"><path className="ar" d="M0 52 L30 44 L55 48 L80 30 L110 34 L135 18 L160 22 L200 4 V60 H0z" /><path className="ln" d="M0 52 L30 44 L55 48 L80 30 L110 34 L135 18 L160 22 L200 4" /></svg>
      </div>
    </div>
  );
}

// 12 × 13 pixel sprite (two leg frames)
const HERO = ['...HHHHH....', '..HHHHHHHHH.', '..SSSSSS....', '..SSESSES...', '..SSSSSSS...', '...SSSS.....', '..CCCCCC....', '.CCCCCCCC...', 'SCCCCCCCCS..', 'S.CCCCCC.S..', '..PPPPPP....'];
const LEGS_A = ['..PP..PP....', '.BBB..BBB...'];
const LEGS_B = ['...PPPP.....', '...BBBB.....'];
const PAL = { H: '#FF4FD8', S: '#FFC9A8', E: '#12052C', C: '#22F0FF', P: '#8B5CF6', B: '#B8FF3C' };
const pix = (rows, y0 = 0) => rows.flatMap((r, y) => [...r].map((c, x) => (PAL[c] ? <rect key={`${x}-${y + y0}`} x={x * 4} y={(y + y0) * 4} width="4.2" height="4.2" fill={PAL[c]} /> : null)));

function Arcade() {
  return (
    <div className="wv-stage" aria-hidden="true">
      <span className="ar-sky"><i /><i /><i /><i /><i /></span>
      <span className="ar-sun" />
      <span className="ar-floor" />
      <svg className="wv-art ar-art" viewBox="0 0 400 210" preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges">
        <g className="ar-clouds">
          {[[30, 30], [230, 18], [430, 34], [630, 22]].map(([x, y]) => <path key={x} d={`M${x} ${y + 8}h8v-4h8v-4h16v4h8v4h8v8h-48z`} fill="rgba(255,255,255,.18)" />)}
        </g>
        <g className="ar-block">
          <rect x="176" y="36" width="40" height="40" fill="#FFB800" stroke="#12052C" strokeWidth="3" />
          <rect x="181" y="41" width="30" height="30" fill="none" stroke="#FFE66B" strokeWidth="2" />
          <path d="M189 47h14v5h-5v5h-5v-5h-4zM193 61h5v5h-5z" fill="#12052C" />
        </g>
        <g className="ar-coin"><rect x="186" y="4" width="20" height="26" fill="#FFE66B" stroke="#E59A00" strokeWidth="2.5" /><rect x="193" y="9" width="6" height="16" fill="#E59A00" /></g>
        <text className="ar-plus" x="222" y="22" fill="#B8FF3C">+XP</text>
        <g className="ar-hero" transform="translate(160 118) scale(1.5)">
          <g className="ar-jump">{pix(HERO)}<g className="ar-la">{pix(LEGS_A, 11)}</g><g className="ar-lb">{pix(LEGS_B, 11)}</g></g>
        </g>
        {[[70, 150, '#FF4FD8'], [300, 140, '#22F0FF'], [340, 160, '#B8FF3C']].map(([x, y, c], i) => (
          <g key={x} className="ar-gem" style={{ animationDelay: `${i * -0.7}s` }}><path d={`M${x} ${y}h8v4h4v8h-4v4h-8v-4h-4v-8h4z`} fill={c} /><rect x={x + 2} y={y + 4} width="4" height="4" fill="#fff" opacity=".7" /></g>
        ))}
        <g className="ar-heart"><path d="M330 70h8v4h4v-4h8v4h4v8h-4v4h-4v4h-4v4h-4v-4h-4v-4h-4v-4h-4v-8h4z" fill="#FF4FD8" /></g>
      </svg>
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

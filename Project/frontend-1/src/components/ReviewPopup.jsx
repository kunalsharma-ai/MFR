import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon.jsx';
import CountryPicker, { Flag } from './CountryPicker.jsx';
import CountryPicker, { Flag } from './CountryPicker.jsx';
import { COUNTRIES } from '../data/countries.js';
import { postJSON } from '../utils/api.js';
import { postJSON } from '../utils/api.js';
import { session, store } from '../utils/storage.js';
import { EMAIL_RE } from '../utils/validate.js';
import { publicName, rememberOwnReview } from '../utils/reviews.js';
import { chime, fanfare, setSound, soundOn } from '../utils/sound.js';

const ENDPOINT = import.meta.env.VITE_REVIEW_ENDPOINT || '/api/reviews';
const BLOCKED = ['/sign-up', '/login'];
const PACE = {
  minSeconds: 20, // time on site before the screen may open by itself
  minScroll: 0.2, // scroll depth on the current page before the first ask
  rescrollScreens: 1.5, // before asking again: the visitor must have scrolled this many screen-heights since last time
  quietMs: 1500, // visitor idle (not scrolling / typing) before we ask
  exitAfterSeconds: 25, // exit intent counts only after this
  maxPerVisit: 4,
  gapInVisitMinutes: 2,
  gapBetweenVisitsHours: 12,
  maxEver: 12,
  tabDelayMs: 3000,
};

const SEG = {
  consumer: {
    label: 'Consumer',
    who: 'Shopper · student · parent · gamer',
    motto: 'Everyday life, rewarded',
    icon: 'cart',
    levels: ['Not for me', 'Meh', 'Pretty good', 'Really good', 'Love it!'],
    sparks: ['What I like most is ', 'The surveys are ', 'My rewards arrived ', 'Compared with other sites, '],
    company: 'Where you work or study — or “Self-employed”',
  },
  professional: {
    label: 'Professional',
    who: 'Manager · specialist · founder · doctor',
    motto: 'Expertise, rewarded',
    icon: 'briefcase',
    levels: ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'],
    sparks: ['As a ', 'The studies are relevant because ', 'The honorarium for my time is ', 'What I value most is '],
    company: 'Your organisation',
  },
};
const byIso = (iso) => COUNTRIES.find((c) => c.iso === iso);
const busy = () =>
  document.hidden ||
  Boolean(document.activeElement && document.activeElement.matches && document.activeElement.matches('input, textarea, select, [contenteditable="true"]')) ||
  Boolean(document.querySelector('.hc.is-open, .cookie, .rw-veil'));
const initialsOf = (name) => String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '★';

/* ───────── Testimonial card (also used on the wall): story card for consumers, executive card for professionals ───────── */
export function ReviewCard({ seg, rating, text, name, iso, designation, company, placeholder = true, tone = 0 }) {
  const c = byIso(iso);
  const quote = text || (placeholder ? 'Your review appears here as you type…' : '');
  const who = name || (placeholder ? 'Your name' : '');
  if (seg === 'professional') {
    const role = [designation, company].filter(Boolean).join(' · ');
    return (
      <figure className="xc">
        <span className="xc-shine" aria-hidden="true" />
        <p className="xc-top"><span className="xc-badge"><Icon name="briefcase" size={12} /> Professional member</span><ScoreChip rating={rating} /></p>
        <blockquote className="xc-q">{quote}</blockquote>
        <figcaption className="xc-who">
          <span className="xc-mono" aria-hidden="true">{initialsOf(who)}</span>
          <span className="xc-id"><b>{who}</b><small>{role || (placeholder ? 'Designation · Company' : 'Professional member')}</small></span>
          <span className="xc-flag">{c ? <Flag iso={c.iso} size={16} /> : <Icon name="globe" size={16} />}<small>{c ? c.name : placeholder ? 'Country' : ''}</small></span>
        </figcaption>
      </figure>
    );
  }
  const role = [designation, company].filter(Boolean).join(' · ');
  return (
    <figure className={`sc3 t${tone % 5}`}>
      <span className="sc3-blob" aria-hidden="true" />
      <p className="sc3-top">
        <span className="sc3-av" aria-hidden="true">{initialsOf(who)}<i>{c ? <Flag iso={c.iso} size={12} /> : null}</i></span>
        <span className="sc3-id"><b>{who}</b><small>{c ? c.name : placeholder ? 'Country' : ''}</small></span>
        <VibeChip rating={rating} />
      </p>
      <blockquote className="sc3-q">“{quote}”</blockquote>
      {role ? <p className="sc3-role"><Icon name="user" size={12} /> {role}</p> : null}
    </figure>
  );
}

/* ───────── Rating controls (v2.4) — plain language first, no stars, no smileys ─────────
   Consumers: "Vibe meter" — a big, chunky slider like a volume control. Slide or tap 1–5; a headline word, a colour
   wash and a little reward badge react straight away ("Love it!" lights the whole bar).
   Professionals: "Scorecard gauge" — a business-style dial with five labelled zones (Poor → Excellent) and a needle,
   read like a KPI. Tap a zone or a label underneath.
   Both are real form controls (native range input / radio buttons): keyboard, touch and screen-reader friendly. */
export const VIBE = [
  { w: 'Not for me', s: 'It didn’t work for me', ic: 'close' },
  { w: 'Meh', s: 'Some good, some not', ic: 'refresh' },
  { w: 'Pretty good', s: 'Worth my time', ic: 'check' },
  { w: 'Really good', s: 'I’d tell a friend', ic: 'heart' },
  { w: 'Love it!', s: 'Easily my favourite', ic: 'sparkle' },
];
export const SCORE = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

function VibeMeter({ value, onPick }) {
  const [hov, setHov] = useState(0);
  const lit = hov || value;
  const v = VIBE[lit - 1];
  return (
    <div className={`vb l${lit}`} onMouseLeave={() => setHov(0)}>
      <div className="vb-head" aria-hidden="true">
        <span className="vb-badge"><Icon name={v ? v.ic : 'arrow'} size={22} /></span>
        <span className="vb-say"><b key={lit}>{v ? v.w : 'Slide to rate'}</b><small>{v ? v.s : 'Drag the bar or tap a number below'}</small></span>
        <span className="vb-score"><b>{lit || '–'}</b><small>/5</small></span>
      </div>
      <div className="vb-track" style={{ '--p': lit ? (lit - 1) / 4 : 0 }}>
        <span className="vb-fill" />
        {[1, 2, 3, 4, 5].map((n) => <span key={n} className={`vb-dot ${n <= lit ? 'on' : ''}`} style={{ '--n': n }} />)}
        <span className={`vb-thumb ${lit ? '' : 'idle'}`}><i>{lit || '?'}</i></span>
        <input
          type="range" min="1" max="5" step="1" value={value || 1}
          aria-label="Your rating, 1 to 5" aria-valuetext={value ? `${value} – ${VIBE[value - 1].w}` : 'Not rated yet'}
          onChange={(e) => onPick(+e.target.value)}
          onPointerUp={(e) => onPick(+e.currentTarget.value)}
          onKeyUp={(e) => onPick(+e.currentTarget.value)}
        />
      </div>
      <div className="vb-ticks" role="radiogroup" aria-label="Or pick a number">
        {VIBE.map((x, i) => (
          <button type="button" key={x.w} role="radio" aria-checked={value === i + 1} className={`${i + 1 <= lit ? 'lit' : ''} ${value === i + 1 ? 'on' : ''}`} onMouseEnter={() => setHov(i + 1)} onFocus={() => setHov(i + 1)} onBlur={() => setHov(0)} onClick={() => onPick(i + 1)}>
            <b>{i + 1}</b><small>{x.w}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

// semicircle gauge geometry: 5 zones of 36° from 180° (left) to 0° (right)
const G = { cx: 120, cy: 118, r: 92, w: 26 };
const pt = (deg, r) => [G.cx + r * Math.cos((deg * Math.PI) / 180), G.cy - r * Math.sin((deg * Math.PI) / 180)];
const zone = (i) => {
  const a0 = 180 - i * 36 - 1.5;
  const a1 = 180 - (i + 1) * 36 + 1.5;
  const [x0, y0] = pt(a0, G.r);
  const [x1, y1] = pt(a1, G.r);
  const [x2, y2] = pt(a1, G.r - G.w);
  const [x3, y3] = pt(a0, G.r - G.w);
  return `M${x0} ${y0} A${G.r} ${G.r} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${G.r - G.w} ${G.r - G.w} 0 0 0 ${x3} ${y3} Z`;
};
const ZONES = [0, 1, 2, 3, 4].map(zone);

function ScoreGauge({ value, onPick }) {
  const [hov, setHov] = useState(0);
  const lit = hov || value;
  const angle = lit ? -90 + (lit - 0.5) * 36 : -96; // needle: rest just left of "Poor"
const PACE = {
  minSeconds: 20, // time on site before the screen may open by itself
  minScroll: 0.2, // scroll depth on the current page before the first ask
  rescrollScreens: 1.5, // before asking again: the visitor must have scrolled this many screen-heights since last time
  quietMs: 1500, // visitor idle (not scrolling / typing) before we ask
  exitAfterSeconds: 25, // exit intent counts only after this
  maxPerVisit: 4,
  gapInVisitMinutes: 2,
  gapBetweenVisitsHours: 12,
  maxEver: 12,
  tabDelayMs: 3000,
};

const SEG = {
  consumer: {
    label: 'Consumer',
    who: 'Shopper · student · parent · gamer',
    motto: 'Everyday life, rewarded',
    icon: 'cart',
    levels: ['Not for me', 'Meh', 'Pretty good', 'Really good', 'Love it!'],
    sparks: ['What I like most is ', 'The surveys are ', 'My rewards arrived ', 'Compared with other sites, '],
    company: 'Where you work or study — or “Self-employed”',
  },
  professional: {
    label: 'Professional',
    who: 'Manager · specialist · founder · doctor',
    motto: 'Expertise, rewarded',
    icon: 'briefcase',
    levels: ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'],
    sparks: ['As a ', 'The studies are relevant because ', 'The honorarium for my time is ', 'What I value most is '],
    company: 'Your organisation',
  },
};
const byIso = (iso) => COUNTRIES.find((c) => c.iso === iso);
const busy = () =>
  document.hidden ||
  Boolean(document.activeElement && document.activeElement.matches && document.activeElement.matches('input, textarea, select, [contenteditable="true"]')) ||
  Boolean(document.querySelector('.hc.is-open, .cookie, .rw-veil'));
const initialsOf = (name) => String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '★';

/* ───────── Testimonial card (also used on the wall): story card for consumers, executive card for professionals ───────── */
export function ReviewCard({ seg, rating, text, name, iso, designation, company, placeholder = true, tone = 0 }) {
  const c = byIso(iso);
  const quote = text || (placeholder ? 'Your review appears here as you type…' : '');
  const who = name || (placeholder ? 'Your name' : '');
  if (seg === 'professional') {
    const role = [designation, company].filter(Boolean).join(' · ');
    return (
      <figure className="xc">
        <span className="xc-shine" aria-hidden="true" />
        <p className="xc-top"><span className="xc-badge"><Icon name="briefcase" size={12} /> Professional member</span><ScoreChip rating={rating} /></p>
        <blockquote className="xc-q">{quote}</blockquote>
        <figcaption className="xc-who">
          <span className="xc-mono" aria-hidden="true">{initialsOf(who)}</span>
          <span className="xc-id"><b>{who}</b><small>{role || (placeholder ? 'Designation · Company' : 'Professional member')}</small></span>
          <span className="xc-flag">{c ? <Flag iso={c.iso} size={16} /> : <Icon name="globe" size={16} />}<small>{c ? c.name : placeholder ? 'Country' : ''}</small></span>
        </figcaption>
      </figure>
    );
  }
  const role = [designation, company].filter(Boolean).join(' · ');
  return (
    <figure className={`sc3 t${tone % 5}`}>
      <span className="sc3-blob" aria-hidden="true" />
      <p className="sc3-top">
        <span className="sc3-av" aria-hidden="true">{initialsOf(who)}<i>{c ? <Flag iso={c.iso} size={12} /> : null}</i></span>
        <span className="sc3-id"><b>{who}</b><small>{c ? c.name : placeholder ? 'Country' : ''}</small></span>
        <VibeChip rating={rating} />
      </p>
      <blockquote className="sc3-q">“{quote}”</blockquote>
      {role ? <p className="sc3-role"><Icon name="user" size={12} /> {role}</p> : null}
    </figure>
  );
}

/* ───────── Rating controls (v2.4) — plain language first, no stars, no smileys ─────────
   Consumers: "Vibe meter" — a big, chunky slider like a volume control. Slide or tap 1–5; a headline word, a colour
   wash and a little reward badge react straight away ("Love it!" lights the whole bar).
   Professionals: "Scorecard gauge" — a business-style dial with five labelled zones (Poor → Excellent) and a needle,
   read like a KPI. Tap a zone or a label underneath.
   Both are real form controls (native range input / radio buttons): keyboard, touch and screen-reader friendly. */
export const VIBE = [
  { w: 'Not for me', s: 'It didn’t work for me', ic: 'close' },
  { w: 'Meh', s: 'Some good, some not', ic: 'refresh' },
  { w: 'Pretty good', s: 'Worth my time', ic: 'check' },
  { w: 'Really good', s: 'I’d tell a friend', ic: 'heart' },
  { w: 'Love it!', s: 'Easily my favourite', ic: 'sparkle' },
];
export const SCORE = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

function VibeMeter({ value, onPick }) {
  const [hov, setHov] = useState(0);
  const lit = hov || value;
  const v = VIBE[lit - 1];
  return (
    <div className={`vb l${lit}`} onMouseLeave={() => setHov(0)}>
      <div className="vb-head" aria-hidden="true">
        <span className="vb-badge"><Icon name={v ? v.ic : 'arrow'} size={22} /></span>
        <span className="vb-say"><b key={lit}>{v ? v.w : 'Slide to rate'}</b><small>{v ? v.s : 'Drag the bar or tap a number below'}</small></span>
        <span className="vb-score"><b>{lit || '–'}</b><small>/5</small></span>
      </div>
      <div className="vb-track" style={{ '--p': lit ? (lit - 1) / 4 : 0 }}>
        <span className="vb-fill" />
        {[1, 2, 3, 4, 5].map((n) => <span key={n} className={`vb-dot ${n <= lit ? 'on' : ''}`} style={{ '--n': n }} />)}
        <span className={`vb-thumb ${lit ? '' : 'idle'}`}><i>{lit || '?'}</i></span>
        <input
          type="range" min="1" max="5" step="1" value={value || 1}
          aria-label="Your rating, 1 to 5" aria-valuetext={value ? `${value} – ${VIBE[value - 1].w}` : 'Not rated yet'}
          onChange={(e) => onPick(+e.target.value)}
          onPointerUp={(e) => onPick(+e.currentTarget.value)}
          onKeyUp={(e) => onPick(+e.currentTarget.value)}
        />
      </div>
      <div className="vb-ticks" role="radiogroup" aria-label="Or pick a number">
        {VIBE.map((x, i) => (
          <button type="button" key={x.w} role="radio" aria-checked={value === i + 1} className={`${i + 1 <= lit ? 'lit' : ''} ${value === i + 1 ? 'on' : ''}`} onMouseEnter={() => setHov(i + 1)} onFocus={() => setHov(i + 1)} onBlur={() => setHov(0)} onClick={() => onPick(i + 1)}>
            <b>{i + 1}</b><small>{x.w}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

// semicircle gauge geometry: 5 zones of 36° from 180° (left) to 0° (right)
const G = { cx: 120, cy: 118, r: 92, w: 26 };
const pt = (deg, r) => [G.cx + r * Math.cos((deg * Math.PI) / 180), G.cy - r * Math.sin((deg * Math.PI) / 180)];
const zone = (i) => {
  const a0 = 180 - i * 36 - 1.5;
  const a1 = 180 - (i + 1) * 36 + 1.5;
  const [x0, y0] = pt(a0, G.r);
  const [x1, y1] = pt(a1, G.r);
  const [x2, y2] = pt(a1, G.r - G.w);
  const [x3, y3] = pt(a0, G.r - G.w);
  return `M${x0} ${y0} A${G.r} ${G.r} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${G.r - G.w} ${G.r - G.w} 0 0 0 ${x3} ${y3} Z`;
};
const ZONES = [0, 1, 2, 3, 4].map(zone);

function ScoreGauge({ value, onPick }) {
  const [hov, setHov] = useState(0);
  const lit = hov || value;
  const angle = lit ? -90 + (lit - 0.5) * 36 : -96; // needle: rest just left of "Poor"
  return (
    <div className={`gg l${lit}`} onMouseLeave={() => setHov(0)}>
      <div className="gg-dial">
        <svg viewBox="0 0 240 132" className="gg-svg" role="img" aria-label="Rating gauge">
          {ZONES.map((d, i) => (
            <path key={i} d={d} className={`gg-z z${i + 1} ${i + 1 <= lit ? 'on' : ''}`} onMouseEnter={() => setHov(i + 1)} onClick={() => onPick(i + 1)} />
          ))}
          {[0, 1, 2, 3, 4].map((i) => {
            const [x, y] = pt(180 - (i + 0.5) * 36, G.r - G.w / 2);
            return <text key={i} x={x} y={y + 4} className={`gg-n ${i + 1 <= lit ? 'on' : ''}`}>{i + 1}</text>;
          })}
        </svg>
        <span className="gg-needle" style={{ transform: `rotate(${angle}deg)` }}><i /></span>
        <span className="gg-hub" />
      </div>
      <p className="gg-read" aria-live="polite"><b>{lit ? SCORE[lit - 1] : 'Your score'}</b><small>{lit ? `${lit} / 5 · tap to change` : 'Tap a zone on the dial or a label below'}</small></p>
      <div className="gg-btns" role="radiogroup" aria-label="Your score">
        {SCORE.map((s, i) => (
          <button type="button" key={s} role="radio" aria-checked={value === i + 1} className={`z${i + 1} ${i + 1 <= lit ? 'lit' : ''} ${value === i + 1 ? 'on' : ''}`} onMouseEnter={() => setHov(i + 1)} onFocus={() => setHov(i + 1)} onBlur={() => setHov(0)} onClick={() => onPick(i + 1)}>
            <b>{i + 1}</b><small>{s}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

// Compact read-outs used on testimonial cards and the reviews page
export function VibeChip({ rating }) {
  if (!rating) return null;
  return <span className={`vchip l${rating}`} role="img" aria-label={`Rated ${rating} out of 5 – ${VIBE[rating - 1].w}`}><span className="vchip-bar">{[1, 2, 3, 4, 5].map((n) => <i key={n} className={n <= rating ? 'on' : ''} />)}</span><b>{VIBE[rating - 1].w}</b></span>;
}
export function ScoreChip({ rating }) {
  if (!rating) return null;
  return <span className={`schip l${rating}`} role="img" aria-label={`Scored ${rating} out of 5 – ${SCORE[rating - 1]}`}><svg viewBox="0 0 36 20" aria-hidden="true"><path d="M3 18a15 15 0 0 1 30 0" className="schip-bg" /><path d="M3 18a15 15 0 0 1 30 0" className="schip-fg" style={{ strokeDasharray: `${(rating / 5) * 47.1} 47.1` }} /></svg><b>{rating}/5</b><small>{SCORE[rating - 1]}</small></span>;
}

/* ───────── Right-edge tab ───────── */
function RateTab({ shown, onOpen }) {
  return (
    <button type="button" className={`rq-tab ${shown ? 'is-in' : ''}`} onClick={onOpen} aria-label="Rate your experience with MyFrequentRewards" aria-haspopup="dialog">
      <span className="rq-stars" aria-hidden="true">{[0, 1, 2, 3, 4].map((k) => <i key={k} style={{ '--k': k }}>★</i>)}</span>
      <span className="rq-txt"><span className="rq-long">Rate your experience</span><span className="rq-short">Rate us</span></span>
    </button>
  );
}

const STEPS = [['user', 'You'], ['star', 'Rate'], ['badge', 'About you'], ['check', 'Review']];
const EMPTY = { text: '', full: '', email: '', iso: '', company: '', designation: '', dial: '', phone: '', consent: false, website: '' };

// Left "stage" art: changes with the step and with consumer / professional.
function StageArt({ step, seg }) {
  const pro = seg === 'professional';
  if (step === 0) {
    return (
      <div className="rw-art a0">
        <span className="rw-planet"><span className="rw-ring" /><span className="rw-core"><Icon name="star" size={40} fill="currentColor" /></span></span>
        {[['cart', 'c'], ['briefcase', 'p'], ['heart', 'c'], ['trend', 'p']].map(([ic, k], i) => <span key={ic} className={`rw-moon m${i} k-${k}`}><Icon name={ic} size={18} /></span>)}
        <p className="rw-art-t">Your voice, <b>one minute</b></p>
        <small>Reviews go live in Client Testimonials</small>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className="rw-art a1">
        <span className="rw-meter">{[1, 2, 3, 4, 5].map((k) => <i key={k} style={{ '--k': k }} />)}</span>
        <p className="rw-art-t">{pro ? 'Score the studies' : 'How did it feel?'}</p>
        <small>{pro ? 'Relevance · reward · respect for your time' : 'Topics · rewards · ease'}</small>
      </div>
    );
  }
  return null;
}

export default function ReviewPopup() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [tabIn, setTabIn] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [step, setStep] = useState(0);
  const [seg, setSeg] = useState('');
  const [tabIn, setTabIn] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [step, setStep] = useState(0);
  const [seg, setSeg] = useState('');
  const [rating, setRating] = useState(0);
  const [f, setF] = useState(EMPTY);
  const [f, setF] = useState(EMPTY);
  const [errs, setErrs] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | error | done
  const [msg, setMsg] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | error | done
  const [msg, setMsg] = useState('');
  const [live, setLive] = useState(true);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const dlg = useRef(null);
  const body = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const dlg = useRef(null);
  const body = useRef(null);
  const lastFocus = useRef(null);
  const pathRef = useRef(pathname);
  const travel = useRef(0); // pixels scrolled since the screen last opened by itself
  const travel = useRef(0); // pixels scrolled since the screen last opened by itself
  pathRef.current = pathname;
  const [sound, setSoundState] = useState(true);
  useEffect(() => setSoundState(soundOn()), []);
  const toggleSound = () => { const n = !sound; setSound(n); setSoundState(n); if (n) chime({ volume: 0.12 }); };

  useEffect(() => setReviewed(Boolean(store.get('mfr_reviewed'))), []);
  const [sound, setSoundState] = useState(true);
  useEffect(() => setSoundState(soundOn()), []);
  const toggleSound = () => { const n = !sound; setSound(n); setSoundState(n); if (n) chime({ volume: 0.12 }); };

  useEffect(() => setReviewed(Boolean(store.get('mfr_reviewed'))), []);

  const canAsk = () => {
    if (store.get('mfr_reviewed') || store.get('mfr_rv_never') || BLOCKED.includes(pathRef.current)) return false;
    const log = store.get('mfr_rv_log', { n: 0, last: 0 });
    const inVisit = session.get('mfr_rv_n', 0);
    const visitLast = session.get('mfr_rv_last', 0);
  const canAsk = () => {
    if (store.get('mfr_reviewed') || store.get('mfr_rv_never') || BLOCKED.includes(pathRef.current)) return false;
    const log = store.get('mfr_rv_log', { n: 0, last: 0 });
    const inVisit = session.get('mfr_rv_n', 0);
    const visitLast = session.get('mfr_rv_last', 0);
    const now = Date.now();
    if (log.n >= PACE.maxEver || inVisit >= PACE.maxPerVisit) return false;
    if (inVisit === 0 && log.last && now - log.last < PACE.gapBetweenVisitsHours * 3600e3) return false;
    if (inVisit > 0 && now - visitLast < PACE.gapInVisitMinutes * 60e3) return false;
    if (log.n >= PACE.maxEver || inVisit >= PACE.maxPerVisit) return false;
    if (inVisit === 0 && log.last && now - log.last < PACE.gapBetweenVisitsHours * 3600e3) return false;
    if (inVisit > 0 && now - visitLast < PACE.gapInVisitMinutes * 60e3) return false;
    return true;
  };

  const openScreen = (preset = {}, auto = false) => {
  const openScreen = (preset = {}, auto = false) => {
    if (BLOCKED.includes(pathRef.current)) return;
    if (auto) {
      if (!canAsk() || busy()) return;
      const log = store.get('mfr_rv_log', { n: 0, last: 0 });
      store.set('mfr_rv_log', { n: log.n + 1, last: Date.now() });
      session.set('mfr_rv_n', session.get('mfr_rv_n', 0) + 1);
      session.set('mfr_rv_last', Date.now());
      travel.current = 0;
      if (!canAsk() || busy()) return;
      const log = store.get('mfr_rv_log', { n: 0, last: 0 });
      store.set('mfr_rv_log', { n: log.n + 1, last: Date.now() });
      session.set('mfr_rv_n', session.get('mfr_rv_n', 0) + 1);
      session.set('mfr_rv_last', Date.now());
      travel.current = 0;
    }
    chime(); // notification chime (silent until the browser allows sound, i.e. after the first click / tap)
    if (status === 'done') { setStatus('idle'); setF(EMPTY); setRating(0); setErrs({}); setSeg(''); setStep(0); }
    if (preset.segment) { setSeg(preset.segment); setStep((s) => (s === 0 ? 1 : s)); }
    chime(); // notification chime (silent until the browser allows sound, i.e. after the first click / tap)
    if (status === 'done') { setStatus('idle'); setF(EMPTY); setRating(0); setErrs({}); setSeg(''); setStep(0); }
    if (preset.segment) { setSeg(preset.segment); setStep((s) => (s === 0 ? 1 : s)); }
    lastFocus.current = document.activeElement;
    setOpen(true);
  };

  // Tab, dock button and any page button: window.dispatchEvent(new CustomEvent('mfr:rate', { detail: { segment } }))
  // Tab, dock button and any page button: window.dispatchEvent(new CustomEvent('mfr:rate', { detail: { segment } }))
  useEffect(() => {
    const onRate = (e) => {
      const s = e.detail && e.detail.segment;
      openScreen({ segment: s === 'professional' || s === 'consumer' ? s : '' });
    };
    window.addEventListener('mfr:rate', onRate);
    const t = setTimeout(() => setTabIn(true), PACE.tabDelayMs);
    return () => { window.removeEventListener('mfr:rate', onRate); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const onRate = (e) => {
      const s = e.detail && e.detail.segment;
      openScreen({ segment: s === 'professional' || s === 'consumer' ? s : '' });
    };
    window.addEventListener('mfr:rate', onRate);
    const t = setTimeout(() => setTabIn(true), PACE.tabDelayMs);
    return () => { window.removeEventListener('mfr:rate', onRate); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Opens by itself only after some browsing (time on site + scroll depth + a quiet moment) — or on exit intent.
  // Opens by itself only after some browsing (time on site + scroll depth + a quiet moment) — or on exit intent.
  useEffect(() => {
    const t0 = session.get('mfr_t0', 0) || Date.now();
    session.set('mfr_t0', t0);
    let maxScroll = 0;
    let lastActive = Date.now();
    let lastY = window.scrollY;
    // Cheap scroll bookkeeping: only scrollY is read on scroll; page height is measured by the 2 s timer below.
    let maxY = 0;
    let lastY = window.scrollY;
    // Cheap scroll bookkeeping: only scrollY is read on scroll; page height is measured by the 2 s timer below.
    let maxY = 0;
    const onScroll = () => {
      lastActive = Date.now();
      const y = window.scrollY;
      if (y > maxY) maxY = y;
      travel.current += Math.abs(y - lastY);
      lastY = y;
      const y = window.scrollY;
      if (y > maxY) maxY = y;
      travel.current += Math.abs(y - lastY);
      lastY = y;
    };
    const onActive = () => { lastActive = Date.now(); };
    const tick = setInterval(() => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      if (max > 0) maxScroll = Math.max(maxScroll, maxY / max);
      const asked = session.get('mfr_rv_n', 0) > 0;
      const scrolledEnough = asked ? travel.current >= window.innerHeight * PACE.rescrollScreens : maxScroll >= PACE.minScroll;
      if ((Date.now() - t0) / 1000 >= PACE.minSeconds && scrolledEnough && Date.now() - lastActive >= PACE.quietMs) openScreen({}, true);
    }, 2000);
    const onLeave = (e) => { if (e.clientY <= 0 && (Date.now() - t0) / 1000 >= PACE.exitAfterSeconds) openScreen({}, true); };
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      if (max > 0) maxScroll = Math.max(maxScroll, maxY / max);
      const asked = session.get('mfr_rv_n', 0) > 0;
      const scrolledEnough = asked ? travel.current >= window.innerHeight * PACE.rescrollScreens : maxScroll >= PACE.minScroll;
      if ((Date.now() - t0) / 1000 >= PACE.minSeconds && scrolledEnough && Date.now() - lastActive >= PACE.quietMs) openScreen({}, true);
    }, 2000);
    const onLeave = (e) => { if (e.clientY <= 0 && (Date.now() - t0) / 1000 >= PACE.exitAfterSeconds) openScreen({}, true); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onActive);
    window.addEventListener('pointerdown', onActive);
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      clearInterval(tick);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onActive);
      window.removeEventListener('pointerdown', onActive);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => { if (BLOCKED.includes(pathname)) setOpen(false); }, [pathname]);
  }, [pathname]);

  useEffect(() => { if (BLOCKED.includes(pathname)) setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab' && dlg.current) {
        const els = dlg.current.querySelectorAll('button:not([disabled]), input, textarea, select, a[href]');
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab' && dlg.current) {
        const els = dlg.current.querySelectorAll('button:not([disabled]), input, textarea, select, a[href]');
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => dlg.current && dlg.current.focus(), 60);
    document.documentElement.classList.add('rv-lock');
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(t); document.documentElement.classList.remove('rv-lock'); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const t = setTimeout(() => dlg.current && dlg.current.focus(), 60);
    document.documentElement.classList.add('rv-lock');
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(t); document.documentElement.classList.remove('rv-lock'); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => { if (body.current) body.current.scrollTop = 0; }, [step]);
  useEffect(() => { if (body.current) body.current.scrollTop = 0; }, [step]);

  function close() {
    setOpen(false);
    if (session.get('mfr_rv_n', 0) > 0) session.set('mfr_rv_last', Date.now());
    if (session.get('mfr_rv_n', 0) > 0) session.set('mfr_rv_last', Date.now());
    if (lastFocus.current && lastFocus.current.focus) lastFocus.current.focus();
  }
  const never = () => { store.set('mfr_rv_never', Date.now()); close(); };

  const checkStep = (s, v = f) => {
  const never = () => { store.set('mfr_rv_never', Date.now()); close(); };

  const checkStep = (s, v = f) => {
    const e = {};
    if (s === 0 && !seg) e.seg = 'Please choose consumer or professional.';
    if (s === 1) {
      if (!rating) e.rating = 'Please choose a rating.';
      const txt = v.text.trim();
      if (txt.length < 20) e.text = 'Please write at least 20 characters.';
      else if (/https?:|www\./i.test(txt)) e.text = 'Please remove links from your review.';
    }
    if (s === 2) {
      if (!/^[\p{L}][\p{L}\s.'-]{1,79}$/u.test(v.full.trim())) e.full = 'Please enter your full name.';
      if (!EMAIL_RE.test(v.email.trim())) e.email = 'Please enter a valid email address.';
      if (!v.iso) e.iso = 'Please choose your country.';
      if (v.company.trim().length < 2) e.company = 'Please enter your company name.';
      else if (/https?:|www\./i.test(v.company + v.designation)) e.company = 'Please remove links.';
      const digits = v.phone.replace(/\D/g, '');
      if (digits && (digits.length < 6 || digits.length > 15)) e.phone = 'Please enter 6–15 digits.';
      if (digits && !v.dial) e.phone = 'Please choose a country code.';
    }
    if (s === 3 && !v.consent) e.consent = 'Please accept so we can publish your review.';
    if (s === 0 && !seg) e.seg = 'Please choose consumer or professional.';
    if (s === 1) {
      if (!rating) e.rating = 'Please choose a rating.';
      const txt = v.text.trim();
      if (txt.length < 20) e.text = 'Please write at least 20 characters.';
      else if (/https?:|www\./i.test(txt)) e.text = 'Please remove links from your review.';
    }
    if (s === 2) {
      if (!/^[\p{L}][\p{L}\s.'-]{1,79}$/u.test(v.full.trim())) e.full = 'Please enter your full name.';
      if (!EMAIL_RE.test(v.email.trim())) e.email = 'Please enter a valid email address.';
      if (!v.iso) e.iso = 'Please choose your country.';
      if (v.company.trim().length < 2) e.company = 'Please enter your company name.';
      else if (/https?:|www\./i.test(v.company + v.designation)) e.company = 'Please remove links.';
      const digits = v.phone.replace(/\D/g, '');
      if (digits && (digits.length < 6 || digits.length > 15)) e.phone = 'Please enter 6–15 digits.';
      if (digits && !v.dial) e.phone = 'Please choose a country code.';
    }
    if (s === 3 && !v.consent) e.consent = 'Please accept so we can publish your review.';
    return e;
  };
  const set = (k, val) => {
    const n = { ...f, [k]: val };
    if (k === 'iso' && !f.phone) n.dial = val; // code follows the country until a number is typed
    setF(n);
    if (errs[k]) setErrs((x) => { const y = { ...x }; delete y[k]; return y; });
  };
  const pickSeg = (s) => { setSeg(s); setErrs({}); setTimeout(() => setStep(1), 420); };
  const pickRating = (r) => { setRating(r); setErrs((x) => { const y = { ...x }; delete y.rating; return y; }); };
  const goStep = (to) => {
    if (to <= step) { setStep(to); setErrs({}); return; }
    for (let s = step; s < to; s++) {
      const e = checkStep(s);
      if (Object.keys(e).length) { setErrs(e); setStep(s); return; }
    }
    setErrs({});
    setStep(to);
  };

  async function submit() {
    const all = { ...checkStep(0), ...checkStep(1), ...checkStep(2), ...checkStep(3) };
    if (f.website) return;
    if (Object.keys(all).length) {
      setErrs(all);
      if (all.seg) setStep(0); else if (all.rating || all.text) setStep(1); else if (all.full || all.email || all.iso || all.company || all.phone) setStep(2);
      return;
    }
  };
  const set = (k, val) => {
    const n = { ...f, [k]: val };
    if (k === 'iso' && !f.phone) n.dial = val; // code follows the country until a number is typed
    setF(n);
    if (errs[k]) setErrs((x) => { const y = { ...x }; delete y[k]; return y; });
  };
  const pickSeg = (s) => { setSeg(s); setErrs({}); setTimeout(() => setStep(1), 420); };
  const pickRating = (r) => { setRating(r); setErrs((x) => { const y = { ...x }; delete y.rating; return y; }); };
  const goStep = (to) => {
    if (to <= step) { setStep(to); setErrs({}); return; }
    for (let s = step; s < to; s++) {
      const e = checkStep(s);
      if (Object.keys(e).length) { setErrs(e); setStep(s); return; }
    }
    setErrs({});
    setStep(to);
  };

  async function submit() {
    const all = { ...checkStep(0), ...checkStep(1), ...checkStep(2), ...checkStep(3) };
    if (f.website) return;
    if (Object.keys(all).length) {
      setErrs(all);
      if (all.seg) setStep(0); else if (all.rating || all.text) setStep(1); else if (all.full || all.email || all.iso || all.company || all.phone) setStep(2);
      return;
    }
    setStatus('sending');
    setMsg('');
    const c = byIso(f.iso) || {};
    const dialC = byIso(f.dial);
    const full = f.full.trim().replace(/\s+/g, ' ');
    const payload = {
      segment: seg, rating, text: f.text.trim().slice(0, 600),
      fullName: full, email: f.email.trim(), country: f.iso, countryName: c.name || '',
      company: f.company.trim(), designation: f.designation.trim(),
      dial: f.phone.trim() && dialC ? dialC.dial : '', phone: f.phone.replace(/\D/g, ''),
      page: pathname, consentPublish: true,
    };
    setMsg('');
    const c = byIso(f.iso) || {};
    const dialC = byIso(f.dial);
    const full = f.full.trim().replace(/\s+/g, ' ');
    const payload = {
      segment: seg, rating, text: f.text.trim().slice(0, 600),
      fullName: full, email: f.email.trim(), country: f.iso, countryName: c.name || '',
      company: f.company.trim(), designation: f.designation.trim(),
      dial: f.phone.trim() && dialC ? dialC.dial : '', phone: f.phone.replace(/\D/g, ''),
      page: pathname, consentPublish: true,
    };
    try {
      const res = await postJSON(ENDPOINT, payload);
      store.set('mfr_reviewed', Date.now());
      setReviewed(true);
      const [fn, ...rest] = full.split(' ');
      rememberOwnReview({ id: res.id, name: publicName(fn, rest.join(' ')), iso: f.iso, country: c.name, designation: payload.designation, company: payload.company, segment: seg, rating, text: payload.text, createdAt: new Date().toISOString(), pending: res.status === 'pending' });
      setReviewed(true);
      const [fn, ...rest] = full.split(' ');
      rememberOwnReview({ id: res.id, name: publicName(fn, rest.join(' ')), iso: f.iso, country: c.name, designation: payload.designation, company: payload.company, segment: seg, rating, text: payload.text, createdAt: new Date().toISOString(), pending: res.status === 'pending' });
      setLive(res.status !== 'pending');
      setStatus('done');
      fanfare();
    } catch (err) {
      setMsg((err && err.message && err.message !== 'Failed to fetch' && err.message.length < 160) ? err.message : 'We couldn’t send your review. Please try again.');
      setStatus('done');
      fanfare();
    } catch (err) {
      setMsg((err && err.message && err.message !== 'Failed to fetch' && err.message.length < 160) ? err.message : 'We couldn’t send your review. Please try again.');
      setStatus('error');
    }
  }
  const next = () => (step < 3 ? goStep(step + 1) : submit());

  const S = SEG[seg] || SEG.consumer;
  const [first, ...rest] = f.full.trim().split(/\s+/);
  const name = publicName(first || '', rest.join(' '));
  const c = byIso(f.iso);
  const onTilt = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * -10, y: ((e.clientX - r.left) / r.width - 0.5) * 14 });
  const next = () => (step < 3 ? goStep(step + 1) : submit());

  const S = SEG[seg] || SEG.consumer;
  const [first, ...rest] = f.full.trim().split(/\s+/);
  const name = publicName(first || '', rest.join(' '));
  const c = byIso(f.iso);
  const onTilt = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * -10, y: ((e.clientX - r.left) / r.width - 0.5) * 14 });
  };
  const showTab = !BLOCKED.includes(pathname);
  const done = status === 'done';
  const TITLES = ['Rate your experience', seg === 'professional' ? 'Score your experience' : 'How was it for you?', 'A little about you', 'Check & publish'];
  const SUBS = ['First, tell us who you are — consumers and professionals each rate us their own way.', 'Pick a rating, then say it in your own words.', 'Your name, flag, company and role appear on your testimonial.', 'This is exactly how your review will appear in Client Testimonials.'];
  const showTab = !BLOCKED.includes(pathname);
  const done = status === 'done';
  const TITLES = ['Rate your experience', seg === 'professional' ? 'Score your experience' : 'How was it for you?', 'A little about you', 'Check & publish'];
  const SUBS = ['First, tell us who you are — consumers and professionals each rate us their own way.', 'Pick a rating, then say it in your own words.', 'Your name, flag, company and role appear on your testimonial.', 'This is exactly how your review will appear in Client Testimonials.'];

  return (
    <>
     

      {open ? (
        <div className="rw-veil" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <div className={`rw rw-${seg || 'none'} st-${done ? 'done' : step}`} role="dialog" aria-modal="true" aria-labelledby="rw-title" tabIndex={-1} ref={dlg}>
            <aside className="rw-stage" onMouseMove={onTilt} onMouseLeave={() => setTilt({ x: 0, y: 0 })} aria-hidden="true">
              <span className="rw-glow g1" /><span className="rw-glow g2" /><span className="rw-grid" />
              {!done && step < 2 ? <StageArt step={step} seg={seg} key={`${step}${seg}`} /> : (
                <div className="rw-art a2">
                  <p className="rw-art-k">{done ? (live ? 'Now live in Client Testimonials' : 'On its way to Client Testimonials') : 'Live preview'}</p>
                  <div className={`rw-tilt ${done ? 'is-sent' : ''}`} style={{ transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
                    <ReviewCard seg={seg || 'consumer'} rating={rating} text={f.text.trim()} name={name} iso={f.iso} designation={f.designation.trim()} company={f.company.trim()} />
                  </div>
                </div>
              )}
        <div className="rw-veil" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <div className={`rw rw-${seg || 'none'} st-${done ? 'done' : step}`} role="dialog" aria-modal="true" aria-labelledby="rw-title" tabIndex={-1} ref={dlg}>
            <aside className="rw-stage" onMouseMove={onTilt} onMouseLeave={() => setTilt({ x: 0, y: 0 })} aria-hidden="true">
              <span className="rw-glow g1" /><span className="rw-glow g2" /><span className="rw-grid" />
              {!done && step < 2 ? <StageArt step={step} seg={seg} key={`${step}${seg}`} /> : (
                <div className="rw-art a2">
                  <p className="rw-art-k">{done ? (live ? 'Now live in Client Testimonials' : 'On its way to Client Testimonials') : 'Live preview'}</p>
                  <div className={`rw-tilt ${done ? 'is-sent' : ''}`} style={{ transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
                    <ReviewCard seg={seg || 'consumer'} rating={rating} text={f.text.trim()} name={name} iso={f.iso} designation={f.designation.trim()} company={f.company.trim()} />
                  </div>
                </div>
              )}
            </aside>

            <div className="rw-main">
              <header className="rw-head">
                {!done ? (
                  <ol className="rw-steps" aria-label="Progress">
                    {STEPS.map(([ic, t], i) => (
                      <li key={t} className={i < step ? 'done' : i === step ? 'now' : ''}>
                        <button type="button" onClick={() => goStep(i)} aria-current={i === step ? 'step' : undefined}>
                          <span>{i < step ? <Icon name="check" size={12} stroke={3} /> : i + 1}</span><em>{t}</em>
                        </button>
                      </li>

            <div className="rw-main">
              <header className="rw-head">
                {!done ? (
                  <ol className="rw-steps" aria-label="Progress">
                    {STEPS.map(([ic, t], i) => (
                      <li key={t} className={i < step ? 'done' : i === step ? 'now' : ''}>
                        <button type="button" onClick={() => goStep(i)} aria-current={i === step ? 'step' : undefined}>
                          <span>{i < step ? <Icon name="check" size={12} stroke={3} /> : i + 1}</span><em>{t}</em>
                        </button>
                      </li>
                    ))}
                  </ol>
                ) : <span />}
                <button type="button" className={`rw-snd ${sound ? '' : 'off'}`} onClick={toggleSound} aria-pressed={!sound} aria-label={sound ? 'Mute sounds' : 'Turn sounds on'} title={sound ? 'Sound on' : 'Sound off'}>
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Sound icon"><path d="M11 5 6 9H3v6h3l5 4z" />{sound ? <><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></> : <path d="m16 9 5 6m0-6-5 6" />}</svg>
                </button>
                <button type="button" className="rw-x" onClick={close} aria-label="Close"><Icon name="close" size={18} /></button>
              </header>

              <div className="rw-body" ref={body}>
                {done ? (
                  <div className="rw-done">
                    <span className="rw-burst" aria-hidden="true">{Array.from({ length: 16 }).map((_, i) => <i key={i} style={{ '--i': i }} />)}</span>
                    <span className="rw-done-ico" aria-hidden="true"><Icon name="check" size={34} stroke={3} /></span>
                    <h2 id="rw-title">Thank you, {first}!</h2>
                    <p>{live ? `Your review is now live in the ${seg === 'professional' ? 'Professional' : 'Consumer'} testimonials, with your name, flag and rating.` : 'Your review will appear in Client Testimonials after a quick check.'}</p>
                    <div className="rw-done-acts">
                      <Link to={{ pathname: '/', hash: '#voices' }} className="rw-next" onClick={close}><Icon name="chat" size={16} /> See Client Testimonials</Link>
                      <Link to="/about-us/reviews" className="rw-ghost" onClick={close}>All ratings &amp; reviews <Icon name="arrow" size={14} /></Link>
                    </div>
                  </div>
                ) : (
                  <div className="rw-pane" key={step}>
                    <h2 id="rw-title">{TITLES[step]}</h2>
                    <p className="rw-sub">{SUBS[step]}</p>

                    {step === 0 ? (
                      <>
                        <div className="rw-who" role="radiogroup" aria-label="I am a">
                          {['consumer', 'professional'].map((k) => (
                            <button type="button" role="radio" aria-checked={seg === k} key={k} className={`rw-door d-${k} ${seg === k ? 'on' : ''}`} onClick={() => pickSeg(k)}>
                              <span className="rw-door-ico" aria-hidden="true"><Icon name={SEG[k].icon} size={28} /></span>
                              <span className="rw-door-t"><b>I’m a {SEG[k].label.toLowerCase()}</b><small>{SEG[k].who}</small><em>{SEG[k].motto}</em></span>
                              <span className="rw-door-go" aria-hidden="true"><Icon name={seg === k ? 'check' : 'arrow'} size={16} stroke={seg === k ? 3 : 1.8} /></span>
                            </button>
                          ))}
                        </div>
                        {errs.seg ? <p className="f-err" role="alert">{errs.seg}</p> : null}
                        <p className="rw-later"><button type="button" onClick={close}>Maybe later</button><button type="button" onClick={never}>Don’t ask again</button></p>
                      </>
                    ) : null}

                    {step === 1 ? (
                      <>
                        <div className={errs.rating ? 'is-bad' : ''}>
                          {seg === 'professional' ? <ScoreGauge value={rating} onPick={pickRating} /> : <VibeMeter value={rating} onPick={pickRating} />}
                          {errs.rating ? <p className="f-err" role="alert">{errs.rating}</p> : null}
                        </div>
                        <div className="rc-sparks">{S.sparks.map((s) => <button type="button" key={s} onClick={() => set('text', (f.text ? `${f.text.trim()} ` : '') + s)}><Icon name="sparkle" size={11} /> {s.trim()}…</button>)}</div>
                        <div className={`rc-area ${errs.text ? 'is-bad' : ''}`}>
                          <label htmlFor="rc-text">Your review <i>*</i></label>
                          <textarea id="rc-text" rows={4} maxLength={600} value={f.text} onChange={(e) => set('text', e.target.value)} placeholder={seg === 'professional' ? 'How relevant were the studies? How was the reward and support?' : 'What do you enjoy? How were the surveys and rewards?'} aria-invalid={Boolean(errs.text)} />
                          <span className="rc-count">{f.text.trim().length < 20 ? `${20 - f.text.trim().length} more characters` : `${f.text.length}/600`}</span>
                          {errs.text ? <p className="f-err" role="alert">{errs.text}</p> : null}
                        </div>
                      </>
                    ) : null}

                    {step === 2 ? (
                      <div className="rc-grid">
                        <div className={`rc-field ${errs.full ? 'is-bad' : ''}`}>
                          <label htmlFor="rc-full">Full name <i>*</i></label>
                          <span className="rc-in"><Icon name="user" size={16} /><input id="rc-full" autoComplete="name" maxLength={80} value={f.full} onChange={(e) => set('full', e.target.value)} aria-invalid={Boolean(errs.full)} placeholder="First and last name" /></span>
                          {errs.full ? <p className="f-err" role="alert">{errs.full}</p> : null}
                        </div>
                        <div className={`rc-field ${errs.email ? 'is-bad' : ''}`}>
                          <label htmlFor="rc-email">Email ID <i>*</i> <small>never shown</small></label>
                          <span className="rc-in"><Icon name="mail" size={16} /><input id="rc-email" type="email" autoComplete="email" maxLength={120} value={f.email} onChange={(e) => set('email', e.target.value)} aria-invalid={Boolean(errs.email)} placeholder="you@email.com" /></span>
                          {errs.email ? <p className="f-err" role="alert">{errs.email}</p> : null}
                        </div>
                        <div className={`rc-field ${errs.iso ? 'is-bad' : ''}`}>
                          <label htmlFor="rc-country">Country <i>*</i></label>
                          <div className="rc-country">
                            <span className="rc-flag" key={f.iso || 'none'} aria-hidden="true">{f.iso ? <Flag iso={f.iso} size={22} /> : <Icon name="globe" size={18} />}</span>
                            <CountryPicker id="rc-country" list={COUNTRIES} value={f.iso} onChange={(x) => set('iso', x.iso)} invalid={Boolean(errs.iso)} />
                          </div>
                          {errs.iso ? <p className="f-err" role="alert">{errs.iso}</p> : null}
                        </div>
                        <div className={`rc-field ${errs.company ? 'is-bad' : ''}`}>
                          <label htmlFor="rc-co">Company name <i>*</i></label>
                          <span className="rc-in"><Icon name="briefcase" size={16} /><input id="rc-co" autoComplete="organization" maxLength={60} value={f.company} onChange={(e) => set('company', e.target.value)} aria-invalid={Boolean(errs.company)} placeholder={S.company} /></span>
                          {errs.company ? <p className="f-err" role="alert">{errs.company}</p> : null}
                        </div>
                        <div className="rc-field">
                          <label htmlFor="rc-des">Designation <small>optional</small></label>
                          <span className="rc-in"><Icon name="badge" size={16} /><input id="rc-des" autoComplete="organization-title" maxLength={60} value={f.designation} onChange={(e) => set('designation', e.target.value)} placeholder={seg === 'professional' ? 'IT Manager' : 'Student, homemaker…'} /></span>
                        </div>
                        <div className={`rc-field ${errs.phone ? 'is-bad' : ''}`}>
                          <label htmlFor="rc-phone">Phone number <small>optional · never shown</small></label>
                          <div className="rc-phone">
                            <CountryPicker id="rc-dial" list={COUNTRIES} value={f.dial} onChange={(x) => set('dial', x.iso)} mode="dial" placeholder="Code" />
                            <input id="rc-phone" type="tel" inputMode="tel" autoComplete="tel-national" maxLength={20} value={f.phone} onChange={(e) => set('phone', e.target.value.replace(/[^\d\s-]/g, ''))} aria-invalid={Boolean(errs.phone)} placeholder="Number" />
                          </div>
                          {f.dial && byIso(f.dial) ? <small className="rc-dial"><Flag iso={f.dial} size={11} /> {byIso(f.dial).name} {byIso(f.dial).dial}</small> : null}
                          {errs.phone ? <p className="f-err" role="alert">{errs.phone}</p> : null}
                        </div>
                      </div>
                    ) : null}

                    {step === 3 ? (
                      <>
                        <div className="rw-mobile-card"><ReviewCard seg={seg || 'consumer'} rating={rating} text={f.text.trim()} name={name} iso={f.iso} designation={f.designation.trim()} company={f.company.trim()} /></div>
                        <ul className="rw-sum">
                          <li><Icon name={S.icon} size={15} /> <span>{S.label}</span><button type="button" onClick={() => goStep(0)}>Edit</button></li>
                          <li><Icon name="star" size={15} /> <span>{rating}/5 · {S.levels[rating - 1]}</span><button type="button" onClick={() => goStep(1)}>Edit</button></li>
                          <li>{c ? <Flag iso={c.iso} size={14} /> : <Icon name="globe" size={15} />} <span>{name} · {c ? c.name : ''}</span><button type="button" onClick={() => goStep(2)}>Edit</button></li>
                          <li><Icon name="briefcase" size={15} /> <span>{[f.designation.trim(), f.company.trim()].filter(Boolean).join(' · ')}</span><button type="button" onClick={() => goStep(2)}>Edit</button></li>
                        </ul>
                        <div className="hp" aria-hidden="true"><label htmlFor="rc-web">Website</label><input id="rc-web" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /></div>
                        <label className={`rc-consent ${errs.consent ? 'is-bad' : ''}`}>
                          <input type="checkbox" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} />
                          <span>Publish my review in Client Testimonials with my name (first name and last-name initial), flag, country, company and — if given — designation. MyFrequentRewards may store these details and contact me about my review (<Link to="/privacy" onClick={close}>Privacy Policy</Link>). Email and phone are never shown.</span>
                        </label>
                        {errs.consent ? <p className="f-err" role="alert">{errs.consent}</p> : null}
                        {status === 'error' ? <p className="form-error" role="alert">{msg}</p> : null}
                      </>
                    ) : null}
                ) : (
                  <div className="rw-pane" key={step}>
                    <h2 id="rw-title">{TITLES[step]}</h2>
                    <p className="rw-sub">{SUBS[step]}</p>

                    {step === 0 ? (
                      <>
                        <div className="rw-who" role="radiogroup" aria-label="I am a">
                          {['consumer', 'professional'].map((k) => (
                            <button type="button" role="radio" aria-checked={seg === k} key={k} className={`rw-door d-${k} ${seg === k ? 'on' : ''}`} onClick={() => pickSeg(k)}>
                              <span className="rw-door-ico" aria-hidden="true"><Icon name={SEG[k].icon} size={28} /></span>
                              <span className="rw-door-t"><b>I’m a {SEG[k].label.toLowerCase()}</b><small>{SEG[k].who}</small><em>{SEG[k].motto}</em></span>
                              <span className="rw-door-go" aria-hidden="true"><Icon name={seg === k ? 'check' : 'arrow'} size={16} stroke={seg === k ? 3 : 1.8} /></span>
                            </button>
                          ))}
                        </div>
                        {errs.seg ? <p className="f-err" role="alert">{errs.seg}</p> : null}
                        <p className="rw-later"><button type="button" onClick={close}>Maybe later</button><button type="button" onClick={never}>Don’t ask again</button></p>
                      </>
                    ) : null}

                    {step === 1 ? (
                      <>
                        <div className={errs.rating ? 'is-bad' : ''}>
                          {seg === 'professional' ? <ScoreGauge value={rating} onPick={pickRating} /> : <VibeMeter value={rating} onPick={pickRating} />}
                          {errs.rating ? <p className="f-err" role="alert">{errs.rating}</p> : null}
                        </div>
                        <div className="rc-sparks">{S.sparks.map((s) => <button type="button" key={s} onClick={() => set('text', (f.text ? `${f.text.trim()} ` : '') + s)}><Icon name="sparkle" size={11} /> {s.trim()}…</button>)}</div>
                        <div className={`rc-area ${errs.text ? 'is-bad' : ''}`}>
                          <label htmlFor="rc-text">Your review <i>*</i></label>
                          <textarea id="rc-text" rows={4} maxLength={600} value={f.text} onChange={(e) => set('text', e.target.value)} placeholder={seg === 'professional' ? 'How relevant were the studies? How was the reward and support?' : 'What do you enjoy? How were the surveys and rewards?'} aria-invalid={Boolean(errs.text)} />
                          <span className="rc-count">{f.text.trim().length < 20 ? `${20 - f.text.trim().length} more characters` : `${f.text.length}/600`}</span>
                          {errs.text ? <p className="f-err" role="alert">{errs.text}</p> : null}
                        </div>
                      </>
                    ) : null}

                    {step === 2 ? (
                      <div className="rc-grid">
                        <div className={`rc-field ${errs.full ? 'is-bad' : ''}`}>
                          <label htmlFor="rc-full">Full name <i>*</i></label>
                          <span className="rc-in"><Icon name="user" size={16} /><input id="rc-full" autoComplete="name" maxLength={80} value={f.full} onChange={(e) => set('full', e.target.value)} aria-invalid={Boolean(errs.full)} placeholder="First and last name" /></span>
                          {errs.full ? <p className="f-err" role="alert">{errs.full}</p> : null}
                        </div>
                        <div className={`rc-field ${errs.email ? 'is-bad' : ''}`}>
                          <label htmlFor="rc-email">Email ID <i>*</i> <small>never shown</small></label>
                          <span className="rc-in"><Icon name="mail" size={16} /><input id="rc-email" type="email" autoComplete="email" maxLength={120} value={f.email} onChange={(e) => set('email', e.target.value)} aria-invalid={Boolean(errs.email)} placeholder="you@email.com" /></span>
                          {errs.email ? <p className="f-err" role="alert">{errs.email}</p> : null}
                        </div>
                        <div className={`rc-field ${errs.iso ? 'is-bad' : ''}`}>
                          <label htmlFor="rc-country">Country <i>*</i></label>
                          <div className="rc-country">
                            <span className="rc-flag" key={f.iso || 'none'} aria-hidden="true">{f.iso ? <Flag iso={f.iso} size={22} /> : <Icon name="globe" size={18} />}</span>
                            <CountryPicker id="rc-country" list={COUNTRIES} value={f.iso} onChange={(x) => set('iso', x.iso)} invalid={Boolean(errs.iso)} />
                          </div>
                          {errs.iso ? <p className="f-err" role="alert">{errs.iso}</p> : null}
                        </div>
                        <div className={`rc-field ${errs.company ? 'is-bad' : ''}`}>
                          <label htmlFor="rc-co">Company name <i>*</i></label>
                          <span className="rc-in"><Icon name="briefcase" size={16} /><input id="rc-co" autoComplete="organization" maxLength={60} value={f.company} onChange={(e) => set('company', e.target.value)} aria-invalid={Boolean(errs.company)} placeholder={S.company} /></span>
                          {errs.company ? <p className="f-err" role="alert">{errs.company}</p> : null}
                        </div>
                        <div className="rc-field">
                          <label htmlFor="rc-des">Designation <small>optional</small></label>
                          <span className="rc-in"><Icon name="badge" size={16} /><input id="rc-des" autoComplete="organization-title" maxLength={60} value={f.designation} onChange={(e) => set('designation', e.target.value)} placeholder={seg === 'professional' ? 'IT Manager' : 'Student, homemaker…'} /></span>
                        </div>
                        <div className={`rc-field ${errs.phone ? 'is-bad' : ''}`}>
                          <label htmlFor="rc-phone">Phone number <small>optional · never shown</small></label>
                          <div className="rc-phone">
                            <CountryPicker id="rc-dial" list={COUNTRIES} value={f.dial} onChange={(x) => set('dial', x.iso)} mode="dial" placeholder="Code" />
                            <input id="rc-phone" type="tel" inputMode="tel" autoComplete="tel-national" maxLength={20} value={f.phone} onChange={(e) => set('phone', e.target.value.replace(/[^\d\s-]/g, ''))} aria-invalid={Boolean(errs.phone)} placeholder="Number" />
                          </div>
                          {f.dial && byIso(f.dial) ? <small className="rc-dial"><Flag iso={f.dial} size={11} /> {byIso(f.dial).name} {byIso(f.dial).dial}</small> : null}
                          {errs.phone ? <p className="f-err" role="alert">{errs.phone}</p> : null}
                        </div>
                      </div>
                    ) : null}

                    {step === 3 ? (
                      <>
                        <div className="rw-mobile-card"><ReviewCard seg={seg || 'consumer'} rating={rating} text={f.text.trim()} name={name} iso={f.iso} designation={f.designation.trim()} company={f.company.trim()} /></div>
                        <ul className="rw-sum">
                          <li><Icon name={S.icon} size={15} /> <span>{S.label}</span><button type="button" onClick={() => goStep(0)}>Edit</button></li>
                          <li><Icon name="star" size={15} /> <span>{rating}/5 · {S.levels[rating - 1]}</span><button type="button" onClick={() => goStep(1)}>Edit</button></li>
                          <li>{c ? <Flag iso={c.iso} size={14} /> : <Icon name="globe" size={15} />} <span>{name} · {c ? c.name : ''}</span><button type="button" onClick={() => goStep(2)}>Edit</button></li>
                          <li><Icon name="briefcase" size={15} /> <span>{[f.designation.trim(), f.company.trim()].filter(Boolean).join(' · ')}</span><button type="button" onClick={() => goStep(2)}>Edit</button></li>
                        </ul>
                        <div className="hp" aria-hidden="true"><label htmlFor="rc-web">Website</label><input id="rc-web" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /></div>
                        <label className={`rc-consent ${errs.consent ? 'is-bad' : ''}`}>
                          <input type="checkbox" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} />
                          <span>Publish my review in Client Testimonials with my name (first name and last-name initial), flag, country, company and — if given — designation. MyFrequentRewards may store these details and contact me about my review (<Link to="/privacy" onClick={close}>Privacy Policy</Link>). Email and phone are never shown.</span>
                        </label>
                        {errs.consent ? <p className="f-err" role="alert">{errs.consent}</p> : null}
                        {status === 'error' ? <p className="form-error" role="alert">{msg}</p> : null}
                      </>
                    ) : null}
                  </div>
                )}
              </div>

              {!done ? (
                <footer className="rw-foot">
                  <span className="rw-private"><Icon name="lock" size={13} /> Email and phone stay private</span>
                  {step > 0 ? <button type="button" className="rw-back" onClick={() => goStep(step - 1)}><Icon name="arrow" size={15} /> Back</button> : null}
                  <button type="button" className="rw-next" onClick={next} disabled={status === 'sending'}>
                    {step < 3 ? <>Continue <Icon name="arrow" size={16} /></> : status === 'sending' ? 'Publishing…' : <>Publish my review <Icon name="send" size={16} /></>}
                  </button>
                </footer>
                )}
              </div>

              {!done ? (
                <footer className="rw-foot">
                  <span className="rw-private"><Icon name="lock" size={13} /> Email and phone stay private</span>
                  {step > 0 ? <button type="button" className="rw-back" onClick={() => goStep(step - 1)}><Icon name="arrow" size={15} /> Back</button> : null}
                  <button type="button" className="rw-next" onClick={next} disabled={status === 'sending'}>
                    {step < 3 ? <>Continue <Icon name="arrow" size={16} /></> : status === 'sending' ? 'Publishing…' : <>Publish my review <Icon name="send" size={16} /></>}
                  </button>
                </footer>
              ) : null}
            </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

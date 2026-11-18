import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { PageSeo } from '../components/PageHero.jsx';
import { Breadcrumbs, CtaBand } from '../components/Common.jsx';
import { Flag } from '../components/CountryPicker.jsx';
import { SCORE, ScoreChip, VIBE } from '../components/ReviewPopup.jsx';
import { PAGES } from '../data/pages.js';
import useLiveReviews from '../hooks/useLiveReviews.js';
import useInView from '../hooks/useInView.js';
import RateButton from '../components/RateButton.jsx';
import { isRecent } from '../utils/reviews.js';
import '../styles/rv2-flag-avatar.css';

// Ratings & Reviews (v3.0 redesign)
//  1. Hero "voice galaxy": warm/cool split sky, kinetic headline, a 3D carousel of real review snippets, live stats
//  2. Two doors — Consumers and Professionals — plus search and country filter
//  3. Consumers: "postcard lounge" — sunny paper postcards with flag stamps and mood postmarks
//  4. Professionals: "briefing room" — midnight glass dossiers with gold borders, a live ticker and a gauge
// Every review shown is a real, published review (supplied testimonials appear only in the preview build,
// labelled "Preview data"). No review schema is emitted.
const page = PAGES.reviews;
const crumbs = [{ name: 'Home', path: '/' }, { name: 'About Us', path: '/about-us' }, { name: 'Ratings & Reviews', path: page.path }];
const PAGE_SIZE = 12;
const PLACES = ['kitchen tables', 'boardrooms', 'campuses', 'clinics', 'coffee breaks', 'night shifts'];
const ini = (n) => String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const avgOf = (l) => { const r = l.filter((x) => x.rating); return r.length ? r.reduce((s, x) => s + x.rating, 0) / r.length : 0; };
const clip = (t, n) => { const s = String(t || '').replace(/\s+/g, ' ').trim(); return s.length > n ? `${s.slice(0, n).replace(/\s+\S*$/, '')}…` : s; };
const MOOD_EMOJI = ['😕', '😐', '🙂', '😊', '😍'];
const PAPER = ['#FFF1E6', '#FFE9F0', '#FFF8D9', '#EAF8F1', '#EEF0FF', '#FFF0DB'];

function CountUp({ to, dec = 0, run }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return undefined;
    let raf = 0;
    const t0 = performance.now();
    const step = (t) => { const p = Math.min(1, (t - t0) / 1200); setV(to * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, run]);
  return <>{v.toFixed(dec)}</>;
}

// ── 1. Hero ──────────────────────────────────────────────────────────────────────────────────────────────
function Galaxy({ reviews }) {
  const cards = reviews.filter((r) => r.text).slice(0, 8);
  const n = Math.max(cards.length, 1);
  const flags = [...new Set(reviews.map((r) => r.iso).filter(Boolean))].slice(0, 8);
  return (
    <div className="rvg" aria-hidden="true">
      <span className="rvg-halo" />
      <span className="rvg-orb"><Icon name="star" size={40} stroke={1.6} /></span>
      <div className="rvg-ring" style={{ '--n': n }}>
        {cards.map((r, i) => (
          <span key={r.id} className={`rvg-card ${r.segment === 'professional' ? 'p' : 'c'}`} style={{ '--k': i }}>
            <i className="rvg-q">“</i>
            <b>{clip(r.text, 70)}</b>
            <small>{r.name}{r.segment === 'professional' ? ' · Professional' : ' · Consumer'}</small>
          </span>
        ))}
      </div>
      <span className="rvg-orbit">{flags.map((iso, i) => <i key={iso} style={{ '--k': i, '--n': flags.length }}><Flag iso={iso} size={18} /></i>)}</span>
      {['😍', '👍', '🎉', '💬', '⭐', '🙌'].map((e, i) => <span key={e} className="rvg-emo" style={{ '--i': i }}>{e}</span>)}
    </div>
  );
}

function Hero({ reviews, con, pro, countries }) {
  const [w, setW] = useState(0);
  const [ref, seen] = useInView({ once: true, threshold: 0.1 });
  useEffect(() => { const t = setInterval(() => setW((x) => x + 1), 2200); return () => clearInterval(t); }, []);
  const avg = avgOf(reviews);
  return (
    <section className="rvh" ref={ref} aria-labelledby="rvh-title">
      <div className="rvh-bg" aria-hidden="true"><i className="rvh-warm" /><i className="rvh-cool" /><i className="rvh-seam" /><i className="rvh-grid" /></div>
      <div className="container rvh-row">
        <div className="rvh-copy">
          <Breadcrumbs items={crumbs} />
          <p className="rvh-eyebrow"><span className="rvh-live" /> Ratings &amp; reviews · published as they arrive</p>
          <h1 id="rvh-title" className="rvh-title">
            <span className="rvh-l1">{page.h1.replace(/ from our members$/, '')}</span>
            <span className="rvh-l2">from our members</span>
          </h1>
          <p className="rvh-kin">Heard around <span className="rvh-swap" key={w}>{PLACES[w % PLACES.length]}</span> <span className="rvh-kin-tail">in {countries || 'many'} countries.</span></p>
          <p className="rvh-lead">Consumers on one side, business professionals on the other — every review written on this site, the glowing and the critical, in members’ own words.</p>
          <div className="rvh-cta">
            <RateButton className="btn btn-primary btn-lg" icon="pen" label="Rate your experience" outLabel="Log in to rate us" />
            <a className="btn btn-glass btn-lg" href="#rv-doors"><Icon name="chat" size={18} /> Read the reviews</a>
          </div>
          <ul className="rvh-stats">
            <li className="s1"><b>{avg ? <CountUp to={avg} dec={1} run={seen} /> : '–'}<small>/5</small></b><span>average score</span></li>
            <li className="s2"><b><CountUp to={con.length} run={seen} /></b><span>consumer reviews</span></li>
            <li className="s3"><b><CountUp to={pro.length} run={seen} /></b><span>professional reviews</span></li>
          </ul>
        </div>
        <Galaxy reviews={reviews} />
      </div>
    </section>
  );
}

// ── 2. Doors ─────────────────────────────────────────────────────────────────────────────────────────────
function Doors({ con, pro, q, setQ, iso, setIso, countries }) {
  const ca = avgOf(con);
  const pa = avgOf(pro);
  const go = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return (
    <section id="rv-doors" className="rvd" aria-label="Choose reviews">
      <div className="container">
        <div className="rvd-row">
          <button type="button" className="rvd-door c" onClick={() => go('rv-con')}>
            <span className="rvd-ic"><Icon name="cart" size={26} /></span>
            <span className="rvd-t"><small>The postcard lounge</small><b>Consumer reviews</b><em>{con.length} {con.length === 1 ? 'review' : 'reviews'}{ca ? ` · ${MOOD_EMOJI[Math.round(ca) - 1]} ${VIBE[Math.round(ca) - 1].w}` : ''}</em></span>
            <Icon name="arrow" size={20} />
          </button>
          <span className="rvd-or" aria-hidden="true">or</span>
          <button type="button" className="rvd-door p" onClick={() => go('rv-pro')}>
            <span className="rvd-ic"><Icon name="briefcase" size={26} /></span>
            <span className="rvd-t"><small>The briefing room</small><b>Professional reviews</b><em>{pro.length} {pro.length === 1 ? 'review' : 'reviews'}{pa ? ` · ${pa.toFixed(1)}/5 ${SCORE[Math.round(pa) - 1]}` : ''}</em></span>
            <Icon name="arrow" size={20} />
          </button>
        </div>
        <div className="rvd-tools">
          <label className="rvd-search"><Icon name="filter" size={16} /><span className="sr-only">Search reviews</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search every review…" /></label>
          <label className="rvd-select">
            <span className="sr-only">Country</span>
            {iso ? <Flag iso={iso} size={14} /> : <Icon name="globe" size={16} />}
            <select value={iso} onChange={(e) => setIso(e.target.value)}>
              <option value="">All countries</option>
              {countries.map((c) => <option key={c.iso} value={c.iso}>{c.name} ({c.n})</option>)}
            </select>
          </label>
          {q || iso ? <button type="button" className="rvd-clear" onClick={() => { setQ(''); setIso(''); }}><Icon name="close" size={14} /> Clear</button> : null}
        </div>
      </div>
    </section>
  );
}

function Tag({ r }) {
  if (r.own) return <span className="rvx-tag own">Your review</span>;
  if (isRecent(r)) return <span className="rvx-tag new">New</span>;
  if (r.preview) return <span className="rvx-tag prev">Preview data</span>;
  return null;
}

// ── 3. Consumers: postcard lounge ────────────────────────────────────────────────────────────────────────
function Postcard({ r, i }) {
  const k = r.rating ? r.rating - 1 : 3;
  return (
    <article className="pc" style={{ '--i': i % PAGE_SIZE, '--paper': PAPER[i % PAPER.length], '--tilt': `${((i * 37) % 7) - 3}deg` }}>
      <Tag r={r} />
      <span className="pc-stamp" aria-hidden="true">{r.iso ? <Flag iso={r.iso} size={34} /> : <b>{ini(r.name)}</b>}</span>
      {r.rating ? <span className={`pc-post l${r.rating}`} role="img" aria-label={`Rated ${r.rating} out of 5 – ${VIBE[k].w}`}><em>{MOOD_EMOJI[k]}</em><b>{VIBE[k].w}</b></span> : <span className="pc-post l0"><em aria-hidden="true">✉️</em><b>Member review</b></span>}
      <blockquote>{r.text}</blockquote>
      <footer><span className="pc-sig">— {r.name}</span><small>{r.country}</small></footer>
    </article>
  );
}

function Lounge({ list }) {
  const [mood, setMood] = useState(0);
  const [shown, setShown] = useState(PAGE_SIZE);
  const counts = [5, 4, 3, 2, 1].map((k) => list.filter((r) => r.rating === k).length);
  const total = Math.max(1, counts.reduce((a, b) => a + b, 0));
  const view = mood ? list.filter((r) => (mood === 3 ? r.rating && r.rating <= 3 : r.rating === mood)) : list;
  const [ref, seen] = useInView({ once: true, threshold: 0.15 });
  return (
    <section id="rv-con" className={`lg${seen ? ' is-in' : ''}`} ref={ref} aria-labelledby="lg-title">
      <div className="lg-bg" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</div>
      <div className="container">
        <header className="lg-head">
          <p className="lg-kick"><Icon name="cart" size={16} /> Consumers</p>
          <h2 id="lg-title">Postcards from <em>everyday life</em></h2>
          <p className="lg-sub">Shoppers, parents, students, gamers and travellers — how it really feels to be rewarded for an opinion.</p>
        </header>
        <div className="lg-mood" role="group" aria-label="Filter consumer reviews by mood">
          <div className="lg-bar" aria-hidden="true">{counts.map((c, i) => (c ? <i key={i} className={`l${5 - i}`} style={{ flexGrow: c / total }} /> : null))}</div>
          {[[0, '✨', 'All', list.length], [5, MOOD_EMOJI[4], VIBE[4].w, counts[0]], [4, MOOD_EMOJI[3], VIBE[3].w, counts[1]], [3, MOOD_EMOJI[2], 'Pretty good & below', counts[2] + counts[3] + counts[4]]].map(([k, e, t, n]) => (
            <button type="button" key={k} className={mood === k ? 'on' : ''} aria-pressed={mood === k} disabled={!n && k} onClick={() => { setMood(k); setShown(PAGE_SIZE); }}><em aria-hidden="true">{e}</em> {t} <b>{n}</b></button>
          ))}
        </div>
        {view.length ? (
          <div className="lg-grid" key={mood}>{view.slice(0, shown).map((r, i) => <Postcard key={r.id} r={r} i={i} />)}</div>
        ) : <p className="rvx-empty">No consumer reviews match these filters yet.</p>}
        {view.length > shown ? <p className="rvx-more"><button type="button" className="btn lg-btn" onClick={() => setShown((n) => n + PAGE_SIZE)}>More postcards ({view.length - shown}) <Icon name="arrow" size={16} /></button></p> : null}
      </div>
    </section>
  );
}

// ── 4. Professionals: briefing room ──────────────────────────────────────────────────────────────────────
function Gauge({ avg, n }) {
  const [ref, seen] = useInView({ once: true, threshold: 0.3 });
  const p = avg ? (avg - 1) / 4 : 0;
  return (
    <div className={`br-gauge${seen ? ' go' : ''}`} ref={ref} style={{ '--p': p }} role="img" aria-label={avg ? `Professionals score us ${avg.toFixed(1)} out of 5 from ${n} reviews` : 'No professional scores yet'}>
      <svg viewBox="0 0 200 112" aria-hidden="true"><path d="M14 104a86 86 0 0 1 172 0" className="g-bg" /><path d="M14 104a86 86 0 0 1 172 0" className="g-fg" pathLength="100" /></svg>
      <span className="g-needle" aria-hidden="true" />
      <b>{avg ? avg.toFixed(1) : '–'}<small>/5</small></b>
      <span>{avg ? SCORE[Math.round(avg) - 1] : 'Awaiting first score'}</span>
    </div>
  );
}

function Dossier({ r, i }) {
  const role = [r.designation, r.company].filter(Boolean).join(' · ');
  return (
    <article className="ds" style={{ '--i': i % PAGE_SIZE }}>
      <span className="ds-edge" aria-hidden="true"><i /></span>
      <Tag r={r} />
      <header>
        <span className={`rv2-av ds-av${r.iso ? ' is-flag' : ''}`} aria-hidden="true">{r.iso ? <Flag iso={r.iso} size={40} /> : ini(r.name)}</span>
        <span className="ds-id"><b>{r.name}</b><small>{role || 'Business professional'}</small><small className="ds-c">{r.country}</small></span>
        <span className="ds-seal" title="Verified professional member"><Icon name="check" size={13} /></span>
      </header>
      <blockquote>{r.text}</blockquote>
      <footer><ScoreChip rating={r.rating} /><span className="ds-file">B2B · {String(i + 1).padStart(3, '0')}</span></footer>
    </article>
  );
}

function Briefing({ list }) {
  const [band, setBand] = useState(0);
  const [shown, setShown] = useState(PAGE_SIZE);
  const view = band ? list.filter((r) => (band === 3 ? r.rating && r.rating <= 3 : r.rating === band)) : list;
  const ticker = list.filter((r) => r.text).slice(0, 8);
  const [ref, seen] = useInView({ once: true, threshold: 0.15 });
  return (
    <section id="rv-pro" className={`br${seen ? ' is-in' : ''}`} ref={ref} aria-labelledby="br-title">
      <div className="br-bg" aria-hidden="true"><i className="br-scan" /></div>
      <div className="container">
        <div className="br-top">
          <header className="br-head">
            <p className="br-kick"><span /> B2B · verified professionals</p>
            <h2 id="br-title">The <em>briefing room</em></h2>
            <p className="br-sub">CXOs, managers, engineers, clinicians and founders on the studies that value their expertise.</p>
            <div className="br-bands" role="group" aria-label="Filter professional reviews by score">
              {[[0, 'All'], [5, SCORE[4]], [4, SCORE[3]], [3, `${SCORE[2]} & below`]].map(([k, t]) => (
                <button type="button" key={k} className={band === k ? 'on' : ''} aria-pressed={band === k} onClick={() => { setBand(k); setShown(PAGE_SIZE); }}>{t}</button>
              ))}
            </div>
          </header>
          <Gauge avg={avgOf(list)} n={list.filter((r) => r.rating).length} />
        </div>
        {ticker.length ? (
          <div className="br-tick" aria-hidden="true"><div>{[...ticker, ...ticker].map((r, i) => <span key={i}><b>{r.name}</b> {clip(r.text, 80)} <i>◆</i></span>)}</div></div>
        ) : null}
        {view.length ? (
          <div className="br-grid" key={band}>{view.slice(0, shown).map((r, i) => <Dossier key={r.id} r={r} i={i} />)}</div>
        ) : (
          <div className="br-empty">
            <span className="br-empty-seal" aria-hidden="true"><Icon name="briefcase" size={34} /></span>
            <h3>{list.length ? 'No professional reviews match these filters' : 'Be the first professional voice'}</h3>
            <p>Managers, specialists, founders and decision-makers — tell other professionals what B2B studies with MyFrequentRewards are like.</p>
            <RateButton className="btn br-btn" icon="pen" label="Write a professional review" outLabel="Log in to write a review" />
          </div>
        )}
        {view.length > shown ? <p className="rvx-more"><button type="button" className="btn br-btn" onClick={() => setShown((n) => n + PAGE_SIZE)}>More briefings ({view.length - shown}) <Icon name="arrow" size={16} /></button></p> : null}
      </div>
    </section>
  );
}

export default function Reviews() {
  const { reviews } = useLiveReviews();
  const [q, setQ] = useState('');
  const [iso, setIso] = useState('');
  const countries = useMemo(() => {
    const m = {};
    reviews.forEach((r) => { if (r.iso) m[r.iso] = { iso: r.iso, name: r.country, n: (m[r.iso] ? m[r.iso].n : 0) + 1 }; });
    return Object.values(m).sort((a, b) => b.n - a.n);
  }, [reviews]);
  const filtered = useMemo(() => {
    let l = reviews;
    if (iso) l = l.filter((r) => r.iso === iso);
    if (q.trim()) { const t = q.trim().toLowerCase(); l = l.filter((r) => `${r.text} ${r.name} ${r.country} ${r.designation} ${r.company}`.toLowerCase().includes(t)); }
    return l;
  }, [reviews, q, iso]);
  const con = reviews.filter((r) => r.segment !== 'professional');
  const pro = reviews.filter((r) => r.segment === 'professional');
  const preview = reviews.some((r) => r.preview);

  return (
    <>
      <PageSeo page={page} crumbs={crumbs} />
      <Hero reviews={reviews} con={con} pro={pro} countries={countries.length} />
      <Doors con={con} pro={pro} q={q} setQ={setQ} iso={iso} setIso={setIso} countries={countries} />
      {preview ? <p className="rvx-prevnote container"><Icon name="eye" size={14} /> Preview build — includes supplied testimonials marked “Preview data” that are not on the live site until confirmed.</p> : null}
      <Lounge list={filtered.filter((r) => r.segment !== 'professional')} key={`c${q}${iso}`} />
      <Briefing list={filtered.filter((r) => r.segment === 'professional')} key={`p${q}${iso}`} />

      <section className="rvr" aria-labelledby="rvr-title">
        <div className="container rvr-row">
          <div className="rvr-stars" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <span key={i} style={{ '--i': i }}><Icon name="star" size={34} /></span>)}</div>
          <div>
            <h2 id="rvr-title">Your turn — rate us in a minute</h2>
            <p>Your review appears on this page as soon as it is published, with your name, flag and role.</p>
          </div>
          <RateButton className="btn btn-primary btn-lg" icon="star" label="Rate your experience" outLabel="Log in to rate us" />
        </div>
      </section>

      <p className="rs-policy container"><Icon name="shield" size={14} /> How we publish reviews: every review submitted on this site is shown, whatever its rating, after automatic spam checks (anything that looks like spam is checked by a person first). We never edit wording, and we never publish email addresses or phone numbers. <Link to="/terms">Terms</Link> · <Link to="/privacy">Privacy</Link></p>
      <CtaBand />
    </>
  );
}

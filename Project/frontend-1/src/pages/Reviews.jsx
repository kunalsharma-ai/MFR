import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import PageHero, { PageSeo } from '../components/PageHero.jsx';
import { CtaBand } from '../components/Common.jsx';
import { Flag } from '../components/CountryPicker.jsx';
import { SCORE, ScoreChip, VIBE, VibeChip } from '../components/ReviewPopup.jsx';
import { PAGES } from '../data/pages.js';
import useLiveReviews from '../hooks/useLiveReviews.js';
import useInView from '../hooks/useInView.js';
import RateButton from '../components/RateButton.jsx';
import '../styles/rv2-flag-avatar.css';
import { isRecent } from '../utils/reviews.js';


const page = PAGES.reviews;
const crumbs = [{ name: 'Home', path: '/' }, { name: 'About Us', path: '/about-us' }, { name: 'Ratings & Reviews', path: page.path }];
const PAGE_SIZE = 18;
const ini = (n) => String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const avgOf = (l) => { const r = l.filter((x) => x.rating); return r.length ? r.reduce((s, x) => s + x.rating, 0) / r.length : 0; };

function ReviewsScene() {
  return (
    <div className="sc sc-rv">
      <span className="rv-glow" />
      <div className="rv-stack">
        <span className="rv-c c1"><b>“Paid on time, every time.”</b><small><i className="con" /> Consumer · Love it!</small></span>
        <span className="rv-c c2"><b>“Studies that respect my expertise.”</b><small><i className="pro" /> Professional · Excellent</small></span>
        <span className="rv-c c3"><b>“Surveys that actually fit me.”</b><small><i className="con" /> Consumer · Really good</small></span>
      </div>
      <span className="rv-badge"><b>Real</b><small>reviews</small></span>
      {[0, 1, 2, 3, 4].map((i) => <span key={i} className="rv-bub" style={{ '--i': i }}><Icon name={['chat', 'heart', 'briefcase', 'globe', 'sparkle'][i]} size={16} /></span>)}
    </div>
  );
}

// Applause meter: a half-ring gauge whose needle sweeps to the average when it scrolls into view
function Applause({ avg, n }) {
  const [ref, seen] = useInView({ once: true, threshold: 0.3 });
  const word = avg ? SCORE[Math.max(0, Math.min(4, Math.round(avg) - 1))] : '—';
  const pct = avg ? (avg - 1) / 4 : 0;
  return (
    <div className={`ap ${seen ? 'go' : ''}`} ref={ref} style={{ '--p': pct }}>
      <div className="ap-dial">
      <svg viewBox="0 0 220 124" className="ap-svg" role="img" aria-label="Applause meter showing the average rating">
        <defs><linearGradient id="apg" x1="0" x2="1"><stop offset="0" stopColor="#E5484D" /><stop offset=".35" stopColor="#F2A33A" /><stop offset=".65" stopColor="#E8C33A" /><stop offset="1" stopColor="#2FBF8F" /></linearGradient></defs>
        <path d="M20 112a90 90 0 0 1 180 0" className="ap-bg" />
        <path d="M20 112a90 90 0 0 1 180 0" className="ap-fg" pathLength="100" />
        {[0, 1, 2, 3, 4].map((k) => { const a = Math.PI - (k / 4) * Math.PI; return <circle key={k} cx={110 + 90 * Math.cos(a)} cy={112 - 90 * Math.sin(a)} r="3" className="ap-tick" />; })}
      </svg>
      <span className="ap-needle" aria-hidden="true"><i /></span>
      <span className="ap-hub" aria-hidden="true" />
      </div>
      <p className="ap-read" role="img" aria-label={avg ? `Average ${avg.toFixed(1)} out of 5 from ${n} rated reviews — ${word}` : 'No ratings yet'}>
        <b>{avg ? avg.toFixed(1) : '–'}<small>/5</small></b>
        <span>{word}</span>
      </p>
      <p className="ap-note">{n ? `from ${n} rated ${n === 1 ? 'review' : 'reviews'}` : 'Be the first to rate us'}</p>
    </div>
  );
}

function Mood({ list, pro, onPick }) {
  const rated = list.filter((r) => r.rating);
  const avg = avgOf(list);
  const counts = [5, 4, 3, 2, 1].map((k) => rated.filter((r) => r.rating === k).length);
  const max = Math.max(1, ...counts);
  const label = (k) => (pro ? SCORE[k - 1] : VIBE[k - 1].w);
  return (
    <article className={`md ${pro ? 'md-pro' : 'md-con'}`}>
      <header>
        <span className="md-ico"><Icon name={pro ? 'briefcase' : 'cart'} size={20} /></span>
        <div><h3>{pro ? 'Professionals' : 'Consumers'}</h3><small>{list.length} {list.length === 1 ? 'review' : 'reviews'}{avg ? ` · average ${avg.toFixed(1)}` : ''}</small></div>
        {avg ? (pro ? <ScoreChip rating={Math.round(avg)} /> : <VibeChip rating={Math.round(avg)} />) : null}
      </header>
      <ul>
        {[5, 4, 3, 2, 1].map((k, i) => (
          <li key={k} style={{ '--w': counts[i] / max, '--i': i }}>
            <button type="button" onClick={() => onPick(pro ? 'pro' : 'con', k)} disabled={!counts[i]} aria-label={`Show ${counts[i]} ${pro ? 'professional' : 'consumer'} reviews rated ${k} – ${label(k)}`}>
              <span className="md-lab"><b>{k}</b> {label(k)}</span>
              <span className="md-bar"><i /></span>
              <span className="md-n">{counts[i]}</span>
            </button>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Card({ r, i }) {
  const pro = r.segment === 'professional';
  const role = [r.designation, r.company].filter(Boolean).join(' · ');
  return (
    <article className={`rv2 ${pro ? 'p' : 'c'}`} style={{ '--i': i }}>
      {r.own ? <span className="tv-tag own">Your review</span> : isRecent(r) ? <span className="tv-tag new">New</span> : r.preview ? <span className="tv-tag prev">Preview data</span> : null}
      <header>
        <span className={`rv2-av${r.iso ? ' is-flag' : ''}`} aria-hidden="true">{r.iso ? <Flag iso={r.iso} size={42} /> : ini(r.name)}</span>
        <span className="rv2-id"><b>{r.name}</b><small>{r.country}{role ? ` · ${role}` : ''}</small></span>
      </header>
      <div className="rv2-score">{pro ? <ScoreChip rating={r.rating} /> : <VibeChip rating={r.rating} />}<span className="rv2-seg">{pro ? 'Professional' : 'Consumer'}</span></div>
      <blockquote>{r.text}</blockquote>
    </article>
  );
}

export default function Reviews() {
  const { reviews, status } = useLiveReviews();
  const [seg, setSeg] = useState('all');
  const [stars, setStars] = useState(0);
  const [iso, setIso] = useState('');
  const [sort, setSort] = useState('new');
  const [q, setQ] = useState('');
  const [shown, setShown] = useState(PAGE_SIZE);
  const [panel, setPanel] = useState(false);

  const con = reviews.filter((r) => r.segment !== 'professional');
  const pro = reviews.filter((r) => r.segment === 'professional');
  const rated = reviews.filter((r) => r.rating);
  const avg = avgOf(reviews);
  const countries = useMemo(() => {
    const m = {};
    reviews.forEach((r) => { if (r.iso) m[r.iso] = { iso: r.iso, name: r.country, n: (m[r.iso] ? m[r.iso].n : 0) + 1 }; });
    return Object.values(m).sort((a, b) => b.n - a.n);
  }, [reviews]);
  const preview = reviews.some((r) => r.preview);

  const list = useMemo(() => {
    let l = reviews.filter((r) => (seg === 'all' ? true : seg === 'pro' ? r.segment === 'professional' : r.segment !== 'professional'));
    if (stars) l = l.filter((r) => (stars === 3 ? r.rating && r.rating <= 3 : r.rating === stars));
    if (iso) l = l.filter((r) => r.iso === iso);
    if (q.trim()) { const t = q.trim().toLowerCase(); l = l.filter((r) => `${r.text} ${r.name} ${r.country} ${r.designation} ${r.company}`.toLowerCase().includes(t)); }
    if (sort === 'top') l = [...l].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return l;
  }, [reviews, seg, stars, iso, q, sort]);
  const active = (stars ? 1 : 0) + (iso ? 1 : 0) + (sort !== 'new' ? 1 : 0);
  const reset = () => { setSeg('all'); setStars(0); setIso(''); setQ(''); setSort('new'); setShown(PAGE_SIZE); };
  const toWall = () => { const el = document.getElementById('rs-wall'); if (el) el.scrollIntoView({ behavior: 'smooth' }); };
  const pickMood = (s, k) => { setSeg(s); setStars(k >= 4 ? k : 3); setShown(PAGE_SIZE); toWall(); };

  return (
    <>
      <PageSeo page={page} crumbs={crumbs} />
      <PageHero
        crumbs={crumbs}
        eyebrow="About us · Ratings & reviews"
        title={page.h1}
        lead="Consumers and professionals from around the world, in their own words. Every review written on this site is published here as it arrives — the glowing and the critical."
        tagline={[['chat', 'Real voices.'], ['globe', 'Every country.'], ['sparkle', 'Published live.']]}
        tone="con"
        theme="berry"
        artNode={<ReviewsScene />}
      >
        <div className="rs-hero-cta">
          <RateButton className="btn btn-primary" icon="pen" label="Rate your experience" outLabel="Log in to rate us" />
          <a className="btn btn-glass" href="#rs-wall"><Icon name="chat" size={16} /> Read the reviews</a>
        </div>
      </PageHero>

      <section className="section apb" aria-labelledby="apb-title">
        <div className="container">
          <div className="sec-head sec-center reveal">
            <p className="eyebrow">The applause meter {status === 'live' ? <span className="vx-live"><i /> Live</span> : null}</p>
            <h2 id="apb-title">How members <span className="apb-hl">really feel</span></h2>
            {preview ? <p className="tv-prevnote"><Icon name="eye" size={14} /> Preview build — includes supplied testimonials marked “Preview data” that are not on the live site until confirmed.</p> : null}
          </div>
          <div className="apb-grid">
            <Mood list={con} onPick={pickMood} />
            <div className="apb-mid">
              <Applause avg={avg} n={rated.length} />
              <p className="apb-split"><span className="c"><b>{con.length}</b> consumers</span><span className="p"><b>{pro.length}</b> professionals</span><span><b>{countries.length}</b> countries</span></p>
            </div>
            <Mood list={pro} pro onPick={pickMood} />
          </div>
          {countries.length ? (
            <ul className="apb-flags" aria-label="Reviews by country">
              {countries.slice(0, 12).map((c, i) => (
                <li key={c.iso} style={{ '--i': i }}><button type="button" onClick={() => { setIso(c.iso); setPanel(true); setShown(PAGE_SIZE); toWall(); }}><Flag iso={c.iso} size={14} /> {c.name} <b>{c.n}</b></button></li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <section id="rs-wall" className="section rvw" aria-labelledby="rs-wall-title">
        <div className="container">
          <div className="rvw-head">
            <h2 id="rs-wall-title">Every review, <span className="apb-hl">every country</span></h2>
            <p className="rvw-count" aria-live="polite">{list.length} of {reviews.length} reviews</p>
          </div>

          <div className="rvw-bar">
            <div className="rvw-seg" role="tablist" aria-label="Member type">
              {[['all', 'All', 'globe', reviews.length], ['con', 'Consumers', 'cart', con.length], ['pro', 'Professionals', 'briefcase', pro.length]].map(([k, t, ic, n]) => (
                <button type="button" role="tab" key={k} aria-selected={seg === k} className={`${seg === k ? 'on' : ''} s-${k}`} onClick={() => { setSeg(k); setShown(PAGE_SIZE); }}><Icon name={ic} size={14} /> <span>{t}</span> <b>{n}</b></button>
              ))}
            </div>
            <label className="rvw-search"><Icon name="filter" size={15} /><span className="sr-only">Search reviews</span><input value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE_SIZE); }} placeholder="Search reviews…" /></label>
            <button type="button" className={`rvw-toggle ${panel ? 'on' : ''}`} onClick={() => setPanel((v) => !v)} aria-expanded={panel} aria-controls="rvw-panel">
              <Icon name="layers" size={15} /> {panel ? 'Hide filters' : 'Filters'}{active ? <b>{active}</b> : null}
            </button>
          </div>

          <div id="rvw-panel" className={`rvw-panel ${panel ? 'open' : ''}`} hidden={!panel}>
            <div className="rvw-chips" role="group" aria-label="Score">
              {[[0, 'Any score'], [5, '5 · Excellent / Love it!'], [4, '4 · Very / Really good'], [3, '3 & below']].map(([n, t]) => <button type="button" key={n} className={stars === n ? 'on' : ''} onClick={() => { setStars(n); setShown(PAGE_SIZE); }} aria-pressed={stars === n}>{t}</button>)}
            </div>
            <label className="rvw-select">
              <span className="sr-only">Country</span>
              {iso ? <Flag iso={iso} size={14} /> : <Icon name="globe" size={15} />}
              <select value={iso} onChange={(e) => { setIso(e.target.value); setShown(PAGE_SIZE); }}>
                <option value="">All countries</option>
                {countries.map((c) => <option key={c.iso} value={c.iso}>{c.name} ({c.n})</option>)}
              </select>
            </label>
            <label className="rvw-select"><span className="sr-only">Sort</span><Icon name="trend" size={15} /><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="new">Newest first</option><option value="top">Highest rated</option></select></label>
            {active || q || seg !== 'all' ? <button type="button" className="rvw-clear" onClick={reset}><Icon name="close" size={14} /> Clear all</button> : null}
          </div>

          {list.length ? (
            <div className="rvw-grid" key={`${seg}${stars}${iso}${sort}`}>
              {list.slice(0, shown).map((r, i) => <Card key={r.id} r={r} i={i % PAGE_SIZE} />)}
            </div>
          ) : (
            <div className="rs-empty"><Icon name="filter" size={28} /><p>No reviews match these filters.</p><button type="button" className="btn btn-ghost-dark" onClick={reset}>Clear filters</button></div>
          )}
          {list.length > shown ? <p className="rs-more"><button type="button" className="btn btn-primary" onClick={() => setShown((n) => n + PAGE_SIZE)}>Show more reviews ({list.length - shown} left) <Icon name="arrow" size={16} /></button></p> : null}
        </div>
      </section>

      <section className="section rs-add" aria-labelledby="rs-add-title">
        <div className="container rs-add-row">
          <div>
            <h2 id="rs-add-title">Your turn — rate us in a minute</h2>
            <p>Your review appears here and in Client Testimonials as soon as it is published, with your name, flag and role.</p>
          </div>
          <div className="rs-add-btns">
            <RateButton className="btn tv-btn-c" icon="star" label="Rate your experience" outLabel="Log in to rate us" />
          </div>
        </div>
      </section>

      <p className="rs-policy container"><Icon name="shield" size={14} /> How we publish reviews: every review submitted on this site is shown, whatever its rating, after automatic spam checks (anything that looks like spam is checked by a person first). We never edit wording, and we never publish email addresses or phone numbers. <Link to="/terms">Terms</Link> · <Link to="/privacy">Privacy</Link></p>
      <CtaBand />
    </>
  );
}

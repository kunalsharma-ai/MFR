import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { PageSeo } from '../components/PageHero.jsx';
import { Breadcrumbs, CtaBand } from '../components/Common.jsx';
import { Flag } from '../components/CountryPicker.jsx';
import ReviewerId, { StarRow } from '../components/ReviewerId.jsx';
import { PAGES } from '../data/pages.js';
import useLiveReviews from '../hooks/useLiveReviews.js';
import useInView from '../hooks/useInView.js';
import RateButton from '../components/RateButton.jsx';
import { isRecent } from '../utils/reviews.js';
import '../styles/rv2-flag-avatar.css';

// Ratings & Reviews (v3.1 redesign)
//  1. Hero: coral (Consumers) and navy + gold (Professionals) halves; two review streams flow past a spinning gold score medal
//  2. Switch: Consumer reviews or Professional reviews, plus search and country filter
//  3. Consumers: white cards with a coral edge · 4. Professionals: navy glass cards with gold stars
//  Every card shows name, title, country name + flag and the star rating (only when the member gave one).
// Every review shown is a real, published review (supplied testimonials appear only in the preview build,
// labelled "Preview data"). No review schema is emitted.
const page = PAGES.reviews;
const crumbs = [{ name: 'Home', path: '/' }, { name: 'About Us', path: '/about-us' }, { name: 'Ratings & Reviews', path: page.path }];
const PAGE_SIZE = 12;
const PLACES = ['kitchen tables', 'boardrooms', 'campuses', 'clinics', 'coffee breaks', 'night shifts'];
const avgOf = (l) => { const r = l.filter((x) => x.rating); return r.length ? r.reduce((s, x) => s + x.rating, 0) / r.length : 0; };
const clip = (t, n) => { const s = String(t || '').replace(/\s+/g, ' ').trim(); return s.length > n ? `${s.slice(0, n).replace(/\s+\S*$/, '')}…` : s; };

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

// ── 1. Hero: two review streams (Consumers, coral · Professionals, navy + gold) flow past a spinning gold score medal ──
function MiniCard({ r, pro }) {
  return (
    <span className={`rxs-card ${pro ? 'p' : 'c'}`}>
      <StarRow n={r.rating} size={12} />
      <b>{clip(r.text, 84)}</b>
      <span className="rxs-who">{r.iso ? <Flag iso={r.iso} size={14} /> : null}<em>{r.name}</em>{r.designation ? <small>{clip(r.designation, 26)}</small> : null}</span>
    </span>
  );
}

function Stream({ list, pro }) {
  if (!list.length) {
    return (
      <div className={`rxs-col ${pro ? 'p' : 'c'} empty`}>
        <span className={`rxs-card ${pro ? 'p' : 'c'}`}><b>{pro ? 'Professional reviews appear here as they are published.' : 'Consumer reviews appear here as they are published.'}</b></span>
      </div>
    );
  }
  const l = list.slice(0, 6);
  return (
    <div className={`rxs-col ${pro ? 'p' : 'c'}`}>
      <div className="rxs-track" style={{ '--n': l.length }}>{[...l, ...l].map((r, i) => <MiniCard key={`${r.id}-${i}`} r={r} pro={pro} />)}</div>
    </div>
  );
}

function ReviewStage({ con, pro, avg }) {
  return (
    <div className="rxs" aria-hidden="true">
      <Stream list={con.filter((r) => r.text)} />
      <Stream list={pro.filter((r) => r.text)} pro />
      <span className="rxs-medal">
        <i className="rxs-ring" /><i className="rxs-ring r2" />
        <span className="rxs-core"><b>★</b><em>{avg ? avg.toFixed(1) : 'Rate'}</em><small>{avg ? 'out of 5' : 'us today'}</small></span>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => <i key={k} className="rxs-spark" style={{ '--k': k }}>★</i>)}
      </span>
      <span className="rxs-lab c">Consumers</span>
      <span className="rxs-lab p">Professionals</span>
    </div>
  );
}

function Hero({ reviews, con, pro, countries }) {
  const [w, setW] = useState(0);
  const [ref, seen] = useInView({ once: true, threshold: 0.1 });
  useEffect(() => { const t = setInterval(() => setW((x) => x + 1), 2200); return () => clearInterval(t); }, []);
  const avg = avgOf(reviews);
  return (
    <section className="rxh" ref={ref} aria-labelledby="rvh-title">
      <div className="rxh-bg" aria-hidden="true"><i className="rxh-warm" /><i className="rxh-cool" /><i className="rxh-dots" /></div>
      <div className="container rxh-row">
        <div className="rxh-copy">
          <Breadcrumbs items={crumbs} />
          <p className="rxh-eyebrow"><span className="rxh-live" /> Consumers &amp; Professionals · real member reviews</p>
          <h1 id="rvh-title" className="rxh-title">
            <span>{page.h1.replace(/ from our members$/, '')}</span>
            <span className="rxh-l2">from our members</span>
          </h1>
          <p className="rxh-kin">Written at <span className="rxh-swap" key={w}>{PLACES[w % PLACES.length]}</span> in {countries || 'many'} {countries === 1 ? 'country' : 'countries'}.</p>
          <p className="rxh-lead">Every review comes from a real member and shows their name, title, country and star rating. Consumers talk about everyday surveys; business professionals rate our expert B2B studies.</p>
          <div className="rxh-cta">
            <RateButton className="btn rxh-go btn-lg" icon="star" label="Rate your experience" outLabel="Rate us" />
            <a className="btn rxh-ghost btn-lg" href="#rv-doors"><Icon name="chat" size={18} /> Read the reviews</a>
          </div>
          <ul className="rxh-stats">
            <li><b>{avg ? <CountUp to={avg} dec={1} run={seen} /> : '–'}<small>/5</small></b><span>average rating</span></li>
            <li className="c"><b><CountUp to={con.length} run={seen} /></b><span>consumer reviews</span></li>
            <li className="p"><b><CountUp to={pro.length} run={seen} /></b><span>professional reviews</span></li>
          </ul>
        </div>
        <ReviewStage con={con} pro={pro} avg={avg} />
      </div>
    </section>
  );
}

// ── 2. Switch: Consumers or Professionals, plus search and country filter ──────────────────────────────────
function Doors({ con, pro, q, setQ, iso, setIso, countries }) {
  const ca = avgOf(con);
  const pa = avgOf(pro);
  const go = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return (
    <section id="rv-doors" className="rxd" aria-label="Choose reviews">
      <div className="container">
        <div className="rxd-row">
          <button type="button" className="rxd-door c" onClick={() => go('rv-con')}>
            <span className="rxd-ic"><Icon name="user" size={26} /></span>
            <span className="rxd-t"><small>For consumers</small><b>Consumer reviews</b><em>{con.length} {con.length === 1 ? 'review' : 'reviews'}{ca ? ` · ${ca.toFixed(1)} ★` : ''}</em></span>
            <Icon name="arrow" size={20} />
          </button>
          <button type="button" className="rxd-door p" onClick={() => go('rv-pro')}>
            <span className="rxd-ic"><Icon name="briefcase" size={26} /></span>
            <span className="rxd-t"><small>For business professionals</small><b>Professional reviews</b><em>{pro.length} {pro.length === 1 ? 'review' : 'reviews'}{pa ? ` · ${pa.toFixed(1)} ★` : ''}</em></span>
            <Icon name="arrow" size={20} />
          </button>
        </div>
        <div className="rxd-tools">
          <label className="rxd-search"><Icon name="filter" size={16} /><span className="sr-only">Search reviews</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search every review…" /></label>
          <label className="rxd-select">
            <span className="sr-only">Country</span>
            {iso ? <Flag iso={iso} size={14} /> : <Icon name="globe" size={16} />}
            <select value={iso} onChange={(e) => setIso(e.target.value)}>
              <option value="">All countries</option>
              {countries.map((c) => <option key={c.iso} value={c.iso}>{c.name} ({c.n})</option>)}
            </select>
          </label>
          {q || iso ? <button type="button" className="rxd-clear" onClick={() => { setQ(''); setIso(''); }}><Icon name="close" size={14} /> Clear</button> : null}
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

function StarFilter({ list, v, set, label }) {
  const n = (k) => list.filter((r) => (k === 3 ? r.rating && r.rating <= 3 : r.rating === k)).length;
  return (
    <div className="rxf" role="group" aria-label={label}>
      {[[0, 'All', list.length], [5, '5 ★', n(5)], [4, '4 ★', n(4)], [3, '3 ★ & below', n(3)]].map(([k, t, c]) => (
        <button type="button" key={k} className={v === k ? 'on' : ''} aria-pressed={v === k} disabled={!c && k} onClick={() => set(k)}>{t} <b>{c}</b></button>
      ))}
    </div>
  );
}

function ReviewCardX({ r, i, pro }) {
  return (
    <article className={`rxc ${pro ? 'p' : 'c'}`} style={{ '--i': i % PAGE_SIZE }}>
      <Tag r={r} />
      <span className="rxc-q" aria-hidden="true">“</span>
      <StarRow n={r.rating} size={18} />
      <blockquote>{r.text}</blockquote>
      <footer>
        <ReviewerId r={r} tone={pro ? 'pro' : 'con'} />
        {pro ? <span className="rxc-seal" title="Professional member"><Icon name="check" size={12} stroke={3} /></span> : null}
      </footer>
    </article>
  );
}

function ReviewSection({ list, pro }) {
  const [band, setBand] = useState(0);
  const [shown, setShown] = useState(PAGE_SIZE);
  const view = band ? list.filter((r) => (band === 3 ? r.rating && r.rating <= 3 : r.rating === band)) : list;
  const avg = avgOf(list);
  const rated = list.filter((r) => r.rating).length;
  const [ref, seen] = useInView({ once: true, threshold: 0.12 });
  return (
    <section id={pro ? 'rv-pro' : 'rv-con'} className={`rxs2 ${pro ? 'p' : 'c'}${seen ? ' is-in' : ''}`} ref={ref} aria-labelledby={pro ? 'rxp-title' : 'rxc-title'}>
      <div className="rxs2-bg" aria-hidden="true">{Array.from({ length: 8 }, (_, k) => <i key={k} style={{ '--k': k }}>{pro ? '◆' : '★'}</i>)}</div>
      <div className="container">
        <div className="rxs2-top">
          <header className="rxs2-head">
            <p className="rxs2-kick"><Icon name={pro ? 'briefcase' : 'user'} size={15} /> {pro ? 'Business professionals' : 'Consumers'}</p>
            <h2 id={pro ? 'rxp-title' : 'rxc-title'}>{pro ? <>Experts rate <em>our B2B studies</em></> : <>Everyday people, <em>real rewards</em></>}</h2>
            <p className="rxs2-sub">{pro ? 'Managers, specialists, founders and decision-makers on paid expert research that values their time.' : 'Shoppers, parents, students and travellers on what it is like to get rewarded for their opinions.'}</p>
            <StarFilter list={list} v={band} set={(k) => { setBand(k); setShown(PAGE_SIZE); }} label={pro ? 'Filter professional reviews by rating' : 'Filter consumer reviews by rating'} />
          </header>
          <div className="rxs2-score" role="img" aria-label={avg ? `${avg.toFixed(1)} out of 5 from ${rated} rated reviews` : 'No ratings yet'}>
            <b>{avg ? avg.toFixed(1) : '–'}</b>
            {avg ? <StarRow n={avg} size={20} /> : <small>Awaiting first rating</small>}
            <small>{rated ? `${rated} rated ${rated === 1 ? 'review' : 'reviews'}` : `${list.length} ${list.length === 1 ? 'review' : 'reviews'}`}</small>
          </div>
        </div>
        {view.length ? (
          <div className="rxs2-grid" key={band}>{view.slice(0, shown).map((r, i) => <ReviewCardX key={r.id} r={r} i={i} pro={pro} />)}</div>
        ) : (
          <div className="rxs2-empty">
            <span aria-hidden="true"><Icon name={pro ? 'briefcase' : 'star'} size={32} /></span>
            <h3>{list.length ? 'No reviews match these filters' : pro ? 'Be the first professional voice' : 'Be the first to review us'}</h3>
            <p>{pro ? 'Managers, specialists, founders and decision-makers: tell other professionals what B2B studies with MyFrequentRewards are like.' : 'Tell other members what sharing your opinions with MyFrequentRewards is like.'}</p>
            <RateButton className="btn rxh-go" icon="pen" label="Write a review" outLabel="Rate us" />
          </div>
        )}
        {view.length > shown ? <p className="rvx-more"><button type="button" className="btn rxh-go" onClick={() => setShown((n) => n + PAGE_SIZE)}>More reviews ({view.length - shown}) <Icon name="arrow" size={16} /></button></p> : null}
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
      <ReviewSection list={filtered.filter((r) => r.segment !== 'professional')} key={`c${q}${iso}`} />
      <ReviewSection pro list={filtered.filter((r) => r.segment === 'professional')} key={`p${q}${iso}`} />

      <section className="rvr" aria-labelledby="rvr-title">
        <div className="container rvr-row">
          <div className="rvr-stars" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <span key={i} style={{ '--i': i }}><Icon name="star" size={34} /></span>)}</div>
          <div>
            <h2 id="rvr-title">Your turn — rate us in a minute</h2>
            <p>Your review appears on this page as soon as it is published, with your name, flag and role.</p>
          </div>
          <RateButton className="btn btn-primary btn-lg" icon="star" label="Rate your experience" outLabel="Rate us" />
        </div>
      </section>

      <p className="rs-policy container"><Icon name="shield" size={14} /> How we publish reviews: every review submitted on this site is shown, whatever its rating, after automatic spam checks (anything that looks like spam is checked by a person first). We never edit wording, and we never publish email addresses or phone numbers. <Link to="/terms">Terms</Link> · <Link to="/privacy">Privacy</Link></p>
      <CtaBand />
    </>
  );
}

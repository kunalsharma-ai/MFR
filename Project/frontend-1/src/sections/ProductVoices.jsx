import { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Flag } from '../components/CountryPicker.jsx';
import useInView from '../hooks/useInView.js';
import useLiveReviews from '../hooks/useLiveReviews.js';

// Product testimonials (v3.0) — every product has its own testimonial design:
//   consumer     → "sticky wall": two drifting columns of tilted pastel notes
//   professional → "executive briefing": one big quote on a dark stage, auto-advancing with a progress bar
//   rewards      → "payout tickets": perforated ticket stubs on a scrolling rail
// Reviews come only from the approved feed (useLiveReviews): no ratings are invented, no Review schema is emitted,
// and nothing is filtered by rating. Preview builds label supplied testimonials "Preview data".

const rate = () => window.dispatchEvent(new CustomEvent('mfr:rate', { detail: {} }));
const initials = (n) => n.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

function Who({ r }) {
  return (
    <span className="pv-who">
      <span className="pv-av">{initials(r.name)}{r.iso ? <span className="pv-flag"><Flag iso={r.iso} size={16} /></span> : null}</span>
      <span><b>{r.name}</b><small>{[r.designation, r.country].filter(Boolean).join(' · ')}</small></span>
      {r.preview ? <span className="pv-prev">Preview data</span> : null}
    </span>
  );
}

function Stars({ n }) {
  if (!n) return null;
  return <span className="pv-stars" aria-label={`${n} out of 5`}>{[1, 2, 3, 4, 5].map((k) => <i key={k} className={k <= n ? 'on' : ''}>★</i>)}</span>;
}

function Empty({ who }) {
  return (
    <div className="pv-empty">
      <Icon name="star" size={28} />
      <b>Be the first {who} to share your experience</b>
      <button type="button" className="btn btn-primary" onClick={rate}>Rate your experience <Icon name="arrow" size={16} /></button>
    </div>
  );
}

function Head({ id, eyebrow, title, em, sub }) {
  return (
    <div className="pv-head">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id}>{title} <em>{em}</em></h2>
      {sub ? <p className="sec-sub">{sub}</p> : null}
    </div>
  );
}

/* ---------- consumer: sticky wall ---------- */
function StickyWall({ list }) {
  const cols = [list.filter((_, i) => i % 2 === 0), list.filter((_, i) => i % 2 === 1)];
  return (
    <div className="pvc-wall">
      {cols.map((col, ci) => (
        <div key={ci} className={`pvc-col${ci ? ' rev' : ''}`}>
          <ul className="pvc-track" style={{ '--n': col.length }}>
            {[...col, ...col].map((r, i) => (
              <li key={`${r.id}-${i}`} className="pvc-note" aria-hidden={i >= col.length ? 'true' : undefined} style={{ '--t': ['#FFE3EA', '#FFF1D6', '#EAF0FF', '#E3FBF5'][i % 4], '--r': `${((i * 7) % 5) - 2}deg` }}>
                <span className="pvc-pin" />
                <Stars n={r.rating} />
                <p>{r.text}</p>
                <Who r={r} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ---------- professional: executive briefing ---------- */
function Briefing({ list }) {
  const [i, setI] = useState(0);
  const [ref, on] = useInView({ once: false });
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (!on || hold || list.length < 2) return undefined;
    const t = setTimeout(() => setI((x) => (x + 1) % list.length), 6500);
    return () => clearTimeout(t);
  }, [i, on, hold, list.length]);
  const r = list[i];
  return (
    <div ref={ref} className="pvp-stage" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}>
      <figure className="pvp-quote" key={r.id} aria-live="polite">
        <span className="pvp-mark" aria-hidden="true">&ldquo;</span>
        <Stars n={r.rating} />
        <blockquote>{r.text}</blockquote>
        <figcaption><Who r={r} /></figcaption>
        <span className={`pvp-bar${on && !hold ? ' run' : ''}`} key={`b${i}`} aria-hidden="true" />
      </figure>
      <div className="pvp-rail">
        <div className="pvp-ctl">
          <button type="button" onClick={() => setI((i - 1 + list.length) % list.length)} aria-label="Previous testimonial"><Icon name="arrow" size={18} className="flip" /></button>
          <span>{String(i + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')}</span>
          <button type="button" onClick={() => setI((i + 1) % list.length)} aria-label="Next testimonial"><Icon name="arrow" size={18} /></button>
        </div>
        <ul className="pvp-list">
          {list.slice(0, 8).map((x, k) => (
            <li key={x.id}><button type="button" className={k === i ? 'is-on' : ''} onClick={() => setI(k)} aria-label={`Show testimonial from ${x.name}`}>
              <span className="pv-av sm">{initials(x.name)}</span><span><b>{x.name}</b><small>{x.designation || x.country}</small></span>
            </button></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------- rewards: payout tickets ---------- */
function Tickets({ list }) {
  return (
    <ul className="pvr-rail">
      {list.map((r, i) => (
        <li key={r.id} className="pvr-ticket" style={{ '--i': i }}>
          <div className="pvr-main">
            <Stars n={r.rating} />
            <p>{r.text}</p>
            <Who r={r} />
          </div>
          <div className="pvr-stub" aria-hidden="true"><small>ADMIT</small><b>ONE</b><Icon name="gift" size={20} /></div>
        </li>
      ))}
    </ul>
  );
}

const CFG = {
  consumer: { eyebrow: 'Consumer voices', title: 'Everyday people,', em: 'honest words.', sub: 'What consumers say about sharing their views with MyFrequentRewards.', who: 'consumer' },
  professional: { eyebrow: 'Professional voices', title: 'From the people', em: 'who decide.', sub: 'Business professionals on taking part in B2B research with us.', who: 'professional' },
  rewards: { eyebrow: 'Payout stories', title: 'Rewards,', em: 'in members’ words.', sub: 'What members say about getting rewarded.', who: 'member' },
};

export default function ProductVoices({ kind = 'consumer' }) {
  const { reviews } = useLiveReviews();
  const c = CFG[kind];
  const list = useMemo(() => {
    if (kind === 'rewards') return reviews.filter((r) => /pay|reward|money|cash|earn/i.test(r.text)).slice(0, 10);
    return reviews.filter((r) => r.segment === kind).slice(0, kind === 'consumer' ? 14 : 10);
  }, [reviews, kind]);
  const preview = list.some((r) => r.preview);
  return (
    <section className={`section pv pv--${kind}`} aria-labelledby={`pv-${kind}`}>
      <div className="container">
        <div className="pv-top">
          <Head id={`pv-${kind}`} eyebrow={c.eyebrow} title={c.title} em={c.em} sub={c.sub} />
          <button type="button" className="btn pv-rate" onClick={rate}><Icon name="star" size={16} /> Add your review</button>
        </div>
        {!list.length ? <Empty who={c.who} /> : kind === 'consumer' ? <StickyWall list={list} /> : kind === 'professional' ? <Briefing list={list} /> : <Tickets list={list} />}
        {preview ? <p className="pv-note"><Icon name="eye" size={14} /> Preview build: cards marked &ldquo;Preview data&rdquo; are supplied testimonials that are not published on the live site until confirmed.</p> : null}
      </div>
    </section>
  );
}

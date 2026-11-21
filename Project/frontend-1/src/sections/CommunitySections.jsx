import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Flag } from '../components/CountryPicker.jsx';
import useInView from '../hooks/useInView.js';
import { STATS, STATS_URL, SURVEY_CATEGORIES } from '../data/community.js';
import { ALL_CONSUMER_SURVEYS, PRO_SURVEYS, TEEN_SURVEYS, TIER_LABEL } from '../data/surveys.js';
import useLiveReviews from '../hooks/useLiveReviews.js';
import { StarRow } from '../components/ReviewerId.jsx';
import { isRecent } from '../utils/reviews.js';
import { isCalm } from '../utils/calm.js';
import RateButton from '../components/RateButton.jsx';
import { spinSound } from '../utils/sound.js';
import SoundToggle from '../components/ui/SoundToggle.jsx';



function Odometer({ value, prefix = '', suffix = '' }) {
  const str = Number(value).toLocaleString('en-US');
  let di = 0;
  return (
    <span className="odo" aria-hidden="true">
      {prefix ? <span className="odo-fix">{prefix}</span> : null}
      {[...str].map((ch, i) => {
        if (!/\d/.test(ch)) return <span className="odo-sep" key={i}>{ch}</span>;
        di += 1;
        return (
          <span className="odo-d" key={i}>
            <span className="odo-strip" style={{ '--n': ch, '--i': di }}>
              {'01234567890123456789'.split('').map((d, k) => <span key={k}>{d}</span>)}
            </span>
          </span>
        );
      })}
      {suffix ? <span className="odo-fix">{suffix}</span> : null}
    </span>
  );
}

const fmtMonth = (ym) => {
  const [y, m] = String(ym).split('-').map(Number);
  if (!y || !m) return '';
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
};

function useStats() {
  const [s, setS] = useState(STATS);
  useEffect(() => {
    if (!STATS_URL) return undefined;
    let live = true;
    fetch(STATS_URL, { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => live && j && setS((cur) => ({ ...cur, ...j })))
      .catch(() => {});
    return () => { live = false; };
  }, []);
  return s;
}

export function CommunityLedger() {
  const s = useStats();
  const [ref, go] = useInView({ threshold: 0.25 });
  const tiles = [
    { key: 'paid', label: 'Rewards paid', value: s.rewardsPaidUsd, prefix: '$', suffix: '+', tone: 'sun', viz: 'coins', note: 'PayPal · UPI · bank · gift cards' },
    { key: 'done', label: 'Surveys completed this month', value: s.surveysCompletedThisMonth, tone: 'teal', viz: 'calendar', note: 'Opinions shared by members' },
    { key: 'open', label: 'Surveys available monthly', value: s.monthlyAvailableSurveys, suffix: '+', tone: 'violet', viz: 'bars', note: 'New invitations every month' },
    { key: 'members', label: 'Members registered', value: s.membersRegistered, tone: 'blue', viz: 'dots', note: 'From many countries' },
  ];
  return (
    <section className={`section ledger ${go ? 'go' : ''}`} aria-labelledby="ledger-title" ref={ref}>
      <div className="ledger-grid-bg" aria-hidden="true" />
      <div className="container">
        <div className="ledger-head reveal">
          <p className="eyebrow">Community at a glance</p>
          <h2 id="ledger-title">Real opinions. <span className="lg-hl">Real rewards.</span></h2>
          {fmtMonth(s.asOf) ? <p className="ledger-asof"><span className="live-dot" /> Updated {fmtMonth(s.asOf)}</p> : null}
        </div>
        <ul className="ledger-tiles">
          {tiles.map((t, i) => (
            <li key={t.key} className={`lt lt-${t.tone}`} style={{ '--d': `${i * 0.12}s` }}>
              <div className={`lt-viz viz-${t.viz}`} aria-hidden="true">
                {t.viz === 'coins' && [0, 1, 2, 3, 4].map((k) => <i key={k} style={{ '--k': k }} />)}
                {t.viz === 'calendar' && Array.from({ length: 28 }, (_, k) => <i key={k} style={{ '--k': k }} />)}
                {t.viz === 'bars' && SURVEY_CATEGORIES.map((c, k) => <i key={c.id} style={{ '--k': k, '--h': `${35 + ((c.reward * 9 + c.mins * 2) % 60)}%`, background: c.tone }} />)}
                {t.viz === 'dots' && Array.from({ length: 35 }, (_, k) => <i key={k} style={{ '--k': (k * 7) % 35 }} />)}
              </div>
              <p className="lt-num">
                <Odometer value={t.value} prefix={t.prefix} suffix={t.suffix} />
                <span className="sr-only">{`${t.prefix || ''}${Number(t.value).toLocaleString('en-US')}${t.suffix || ''}`}</span>
              </p>
              <h3 className="lt-label">{t.label}</h3>
              <p className="lt-note">{t.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}


function SurveyWheel({ list, visible, teen = false }) {
  const n = list.length;
  const step = 360 / n;
  const [sel, setSel] = useState(0);
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [hold, setHold] = useState(false);
  const done = useRef(0);
  const spinTo = (k, turns = 2) => {
    const target = -k * step;
    setRot((r) => {
      const base = r - (((r - target) % 360) + 360) % 360; 
      return base - turns * 360;
    });
    setSel(k);
    setSpinning(true);
    clearTimeout(done.current);
    done.current = setTimeout(() => setSpinning(false), 3700); 
  };
  useEffect(() => () => clearTimeout(done.current), []);
  const spin = () => {
    let k = Math.floor(Math.random() * n);
    if (k === sel) k = (k + 5) % n;
    spinTo(k, 3);
  };
  useEffect(() => {
    if (!visible || hold || spinning) return undefined;
    const t = setTimeout(spin, 4200);
    return () => clearTimeout(t);
   
  }, [visible, hold, spinning, sel]);
  const c = list[sel];
  const grad = `conic-gradient(from ${-step / 2}deg, ${list.map((x, i) => `${x.tone} ${i * step}deg ${(i + 1) * step}deg`).join(', ')})`;
  return (
    <div className={teen ? 'sw sw-teen' : 'sw'} onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocusCapture={() => setHold(true)} onBlurCapture={() => setHold(false)}>
      <div className="sw-stage">
        <span className="sw-pointer" aria-hidden="true" />
        <div className="sw-rim" aria-hidden="true">{list.map((x, i) => <i key={x.id} style={{ '--a': `${i * step + step / 2}deg` }} />)}</div>
        <div className="sw-wheel" style={{ background: grad, transform: `rotate(${rot}deg)` }} onTransitionEnd={() => setSpinning(false)} aria-hidden="true">
          {list.map((x, i) => (
            <span key={x.id} className="sw-lab" style={{ '--a': `${i * step}deg` }}><Icon name={x.icon} size={18} /><b>{x.tag}</b></span>
          ))}
        </div>
        <button type="button" className="sw-hub" onClick={() => { spinSound(3.2); spin(); }} disabled={spinning}><b>SPIN</b><small>a topic</small></button>
        <SoundToggle className="sw-snd" label={false} />
      </div>
      <div className="sw-side">
        <div className={`sw-ticket ${spinning ? 'is-wait' : ''}`} style={{ '--tone': c.tone }} aria-live="polite" key={`${c.id}-${spinning}`}>
          {spinning ? (
            <p className="sw-wait"><Icon name="refresh" size={18} /> Spinning…</p>
          ) : (
            <>
              <span className="sw-t-ico"><Icon name={c.icon} size={28} /></span>
              <p className="sw-t-tag"><i /> {c.tag} · {teen ? 'Teen-safe' : 'Open now'}</p>
              <h3>{c.title}</h3>
              <p className="sw-t-desc">{c.desc}</p>
              <div className="sw-t-stats">
                <span><small>{teen ? 'Typical points' : 'Typical reward'}</small><b>{c.reward ? `$${c.reward}` : c.range}</b></span>
                <span><small>About</small><b>{c.mins} min</b></span>
              </div>
            </>
          )}
        </div>
        <ul className="sw-chips" aria-label="Survey topics">
          {list.map((x, i) => (
            <li key={x.id}><button type="button" className={i === sel ? 'on' : ''} style={{ '--tone': x.tone }} onClick={() => { spinSound(3.2); spinTo(i, 1); }} aria-pressed={i === sel}>{x.tag}</button></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const TIER_CLASS = { 3: 'premium', 2: 'higher', 1: 'standard' };
function DemandMap({ list, visible }) {
  const [scan, setScan] = useState(0);
  useEffect(() => {
    if (!visible) return undefined;
    const t = setInterval(() => !isCalm() && setScan((x) => (x + 1) % list.length), 1900);
    return () => clearInterval(t);
  }, [visible, list.length]);
  const order = [...list].sort((a, b) => b.tier - a.tier);
  return (
    <div className="dm">
      <div className="dm-ticker" aria-hidden="true"><div className="dm-track">{[0, 1].map((r) => <span key={r}>{list.map((x) => <em key={x.id}><i style={{ background: x.tone }} />{x.who}</em>)}</span>)}</div></div>
      <ul className="dm-grid" aria-label="Professional (B2B) survey categories">
        {order.map((c) => (
          <li key={c.id} className={`dm-tile t-${TIER_CLASS[c.tier]} ${list[scan] && list[scan].id === c.id ? 'scan' : ''}`} style={{ '--tone': c.tone }}>
            <span className="dm-ico"><Icon name={c.icon} size={c.tier === 3 ? 24 : 18} /></span>
            <h3>{c.title}</h3>
            <p className="dm-who">{c.who}</p>
            {c.tier === 3 ? <p className="dm-desc">{c.desc}</p> : null}
            <p className="dm-meta">
              <span className="dm-len"><Icon name="clock" size={12} /> {c.mins} min</span>
              <span className="dm-coins" title={TIER_LABEL[c.tier]}>{[1, 2, 3].map((k) => <i key={k} className={k <= c.tier ? 'on' : ''}>$</i>)}</span>
            </p>
            <small className="dm-tier">{c.range || TIER_LABEL[c.tier]}</small>
          </li>
        ))}
      </ul>
      <p className="dm-legend" aria-hidden="true"><span className="l3"><i /> Premium reward</span><span className="l2"><i /> Higher reward</span><span className="l1"><i /> Standard B2B reward</span></p>
    </div>
  );
}

export function SurveyBoard() {
  const [seg, setSeg] = useState('consumer');
  const [vref, visible] = useInView({ once: false, threshold: 0.15 });
  return (
    <section ref={vref} className={`section sv sv-${seg}`} aria-labelledby="sboard-title">
      <div className="sv-deco" aria-hidden="true"><i /><i /><i /></div>
      <div className="container">
        <div className="sv-head reveal">
          <div>
            <p className="eyebrow">Paid surveys</p>
            <h2 id="sboard-title">{seg === 'teen' ? <>Spin your vibe. <span className="sv-neon">Earn points for it.</span></> : seg === 'pro' ? <>Your expertise, <span className="sv-gold">in high demand.</span></> : <>Spin a topic you love. <span className="hl-orange">Get rewarded for it.</span></>}</h2>
            <p className="sec-sub">Typical rewards and lengths by survey category. Every invitation shows its exact reward and time before you start — no surprises.</p>
          </div>
          <div className="sv-switch" role="tablist" aria-label="Survey audience">
            <span className="sv-pill" aria-hidden="true" />
            <button type="button" role="tab" aria-selected={seg === 'consumer'} className={seg === 'consumer' ? 'on' : ''} onClick={() => setSeg('consumer')}><Icon name="cart" size={16} /> Consumers <b>{ALL_CONSUMER_SURVEYS.length}</b></button>
            <button type="button" role="tab" aria-selected={seg === 'pro'} className={seg === 'pro' ? 'on' : ''} onClick={() => setSeg('pro')}><Icon name="briefcase" size={16} /> Professionals <b>{PRO_SURVEYS.length}</b></button>
            <button type="button" role="tab" aria-selected={seg === 'teen'} className={seg === 'teen' ? 'on' : ''} onClick={() => setSeg('teen')}><Icon name="rocket" size={16} /> Teens <b>{TEEN_SURVEYS.length}</b></button>
          </div>
        </div>
        {seg === 'teen' ? <SurveyWheel list={TEEN_SURVEYS} visible={visible} key="teen" teen /> : seg === 'pro' ? <DemandMap list={PRO_SURVEYS} visible={visible} key="pro" /> : <SurveyWheel list={ALL_CONSUMER_SURVEYS} visible={visible} key="con" />}
        <div className="sv-cta">
          <Link to={seg === 'teen' ? '/sign-up?type=teen' : seg === 'pro' ? '/sign-up?type=professional' : '/sign-up'} className="btn btn-primary btn-shine">{seg === 'teen' ? 'Join the Teen Panel' : <>Join free &amp; get invitations</>} <Icon name="arrow" size={18} /></Link>
          <Link to="/rewards" className="btn btn-ghost-dark">How rewards are paid</Link>
        </div>
        <p className="arc-note">{seg === 'teen' ? 'Teen surveys (ages 13–17) are age-appropriate and open only after a parent or guardian gives consent; points are shown in each invitation.' : seg === 'pro' ? 'Professional studies are typically rewarded more than consumer surveys; the exact reward is shown in each invitation.' : 'Rewards shown are typical for each category; the exact reward is shown in each invitation.'} Earnings are not guaranteed.</p>
      </div>
    </section>
  );
}


const isNew = (t) => t.own || isRecent(t);
const isoList = (list) => [...new Set(list.map((t) => t.iso).filter(Boolean))];
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const ini = (n) => String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

function Tag({ t }) {
  if (t.own) return <span className="tv-tag own">{t.pending ? 'Your review · quick check' : 'Your review · live'}</span>;
  if (isNew(t)) return <span className="tv-tag new">New</span>;
  if (t.preview) return <span className="tv-tag prev">Preview data</span>;
  return null;
}

// Advances a rolling window over `n` items: a "typing" beat, then the next item appears.
function useFeed(n, win, active, ms, typingMs) {
  const [k, setK] = useState(0);
  const [typing, setTyping] = useState(false);
  const [beat, setBeat] = useState(0);
  const [hold, setHold] = useState(false);
  const cycles = n > win;
  useEffect(() => {
    if (!active || hold || !cycles) return undefined;
    let t2;
    const t1 = setTimeout(() => {
      if (isCalm() || document.hidden) { setBeat((b) => b + 1); return; } // try again later; nothing moves while idle
      setTyping(true);
      t2 = setTimeout(() => { setTyping(false); setK((x) => x + 1); }, typingMs);
    }, ms);
    return () => { clearTimeout(t1); clearTimeout(t2); setTyping(false); };
  }, [k, beat, active, hold, cycles, ms, typingMs]);
  const size = Math.min(win, n);
  const items = Array.from({ length: size }, (_, j) => ({ seq: k + j, j }));
  const holdProps = { onMouseEnter: () => setHold(true), onMouseLeave: () => setHold(false), onFocusCapture: () => setHold(true), onBlurCapture: () => setHold(false) };
  return { items, typing, holdProps, next: () => setK((x) => x + 1), cycles };
}

function ConsumerChat({ list, active }) {
  const n = list.length;
  const { items, typing, holdProps, next, cycles } = useFeed(n, 3, active, 3800, 1100);
  const people = list.slice(0, 4);
  return (
    <div className="vl-phone" {...holdProps}>
      <div className="vl-phone-in">
        <span className="vl-notch" aria-hidden="true" />
        <header className="vl-chat-h">
          <span className="vl-av-stack" aria-hidden="true">{people.map((p, k) => <i key={p.id} className={`t${k % 4}`}>{ini(p.name)}</i>)}</span>
          <span className="vl-chat-t"><b>Members’ lounge</b><small><i className="vl-on" /> {plural(n, 'consumer review', 'consumer reviews')} · {plural(isoList(list).length, 'country', 'countries')}</small></span>
        </header>
        <ol className="vl-chat" aria-live="polite" aria-label="Consumer reviews">
          {n ? items.map(({ seq, j }) => {
            const t = list[seq % n];
            const tone = seq % 4;
            return (
              <li key={seq} className={`vl-msg t${tone} ${j % 2 ? 'r' : ''}`}>
                <span className="vl-msg-av" aria-hidden="true">{ini(t.name)}<i><Flag iso={t.iso} size={12} /></i></span>
                <div className="vl-bub">
                  <Tag t={t} />
                  <p className="vl-bub-h"><b>{t.name}</b>{t.designation || t.company ? <small className="vl-role">{[t.designation, t.company].filter(Boolean).join(' · ')}</small> : null}<small><Flag iso={t.iso} size={12} /> {t.country}</small></p>
                  <StarRow n={t.rating} size={14} />
                  <p className="vl-bub-q">{t.text}</p>
                </div>
              </li>
            );
          }) : <li className="vl-msg vl-empty"><div className="vl-bub"><p className="vl-bub-q">No consumer reviews yet — yours could open the conversation.</p></div></li>}
          {typing ? <li className="vl-typing" aria-hidden="true"><span><i /><i /><i /></span> someone is sharing a review…</li> : null}
        </ol>
        <footer className="vl-compose">
          <RateButton className="vl-compose-in" icon="pen" iconSize={15} label="Share your experience…" outLabel="Log in to share your experience…" />
          {cycles ? <button type="button" className="vl-send" onClick={next} aria-label="Show the next consumer review"><Icon name="send" size={16} /></button> : null}
        </footer>
      </div>
    </div>
  );
}

function ProBoard({ list, active }) {
  const n = list.length;
  const { items, typing, holdProps, next, cycles } = useFeed(n, 2, active, 5200, 900);
  return (
    <div className="vl-laptop" {...holdProps}>
      <div className="vl-screen">
        <header className="vl-board-h">
          <span className="vl-dots" aria-hidden="true"><i /><i /><i /></span>
          <b><Icon name="briefcase" size={14} /> Expert board</b>
          <small>{n ? `${plural(n, 'professional review', 'professional reviews')} · ${plural(isoList(list).length, 'country', 'countries')}` : 'B2B members'}</small>
        </header>
        {n ? (
          <ol className="vl-feed" aria-live="polite" aria-label="Professional reviews">
            {typing ? <li className="vl-posting" aria-hidden="true"><span><i /><i /><i /></span> New endorsement posting…</li> : null}
            {[...items].reverse().map(({ seq }) => {
              const t = list[seq % n];
              return (
                <li key={seq} className="vl-post">
                  <Tag t={t} />
                  <div className="vl-post-h">
                    <span className="vl-mono" aria-hidden="true">{ini(t.name)}</span>
                    <span className="vl-post-id"><b>{t.name}</b><small>{[t.designation, t.company].filter(Boolean).join(' · ') || 'Professional member'}</small></span>
                    <span className="vl-post-fl"><Flag iso={t.iso} size={14} /><small>{t.country}</small></span>
                  </div>
                  <StarRow n={t.rating} size={15} />
                  <p className="vl-post-q">{t.text}</p>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="vl-board-empty">
            <Icon name="briefcase" size={30} />
            <p><b>Be the first professional voice.</b> Managers, specialists, founders and decision-makers — tell other professionals what B2B studies with MyFrequentRewards are like.</p>
            <RateButton className="btn tv-btn-p" icon="pen" iconSize={15} label="Write a review" outLabel="Log in to write a review" />
          </div>
        )}
        {cycles ? <button type="button" className="vl-board-next" onClick={next}>Next endorsement <Icon name="arrow" size={14} /></button> : null}
      </div>
      <span className="vl-base" aria-hidden="true" />
    </div>
  );
}

// Teen Panel wall: neon "story" stickers that pop in one after another (first name + last initial only).
function TeenWall({ list, active }) {
  const n = list.length;
  const { items, typing, holdProps, next, cycles } = useFeed(n, 3, active, 4200, 800);
  return (
    <div className="vl-teen reveal" {...holdProps}>
      <header className="vl-teen-h">
        <span className="vl-teen-badge"><Icon name="rocket" size={15} /> Teen zone</span>
        <b>Teen Panel voices</b>
        <small>{n ? `${plural(n, 'teen review', 'teen reviews')} · ages 13–17 · parent-approved accounts` : 'Ages 13–17 · parent-approved accounts'}</small>
        {cycles ? <button type="button" className="vl-teen-next" onClick={next} aria-label="Show the next teen review"><Icon name="arrow" size={15} /></button> : null}
      </header>
      {n ? (
        <ol className="vl-teen-row" aria-live="polite" aria-label="Teen reviews">
          {items.map(({ seq, j }) => {
            const t = list[seq % n];
            return (
              <li key={seq} className={`vl-sticker s${seq % 3}`} style={{ '--j': j }}>
                <Tag t={t} />
                <span className="vl-st-av" aria-hidden="true">{ini(t.name)}<i><Flag iso={t.iso} size={12} /></i></span>
                <StarRow n={t.rating} size={14} />
                <p className="vl-st-q">{t.text}</p>
                <p className="vl-st-who"><b>{t.name}</b><small>{t.designation}{t.country ? ` · ${t.country}` : ''}</small></p>
              </li>
            );
          })}
          {typing ? <li className="vl-st-typing" aria-hidden="true"><span><i /><i /><i /></span></li> : null}
        </ol>
      ) : (
        <p className="vl-teen-empty">Teen reviews appear here once Teen Panel members, with their parent or guardian’s approval, share their experience. <Link to="/sign-up?type=teen">Join the Teen Panel</Link></p>
      )}
    </div>
  );
}

export function MemberVoices() {
  const [ref, inView] = useInView({ once: false, threshold: 0.12 });
  const { reviews, status } = useLiveReviews();
  const con = reviews.filter((r) => r.segment === 'consumer');
  const pro = reviews.filter((r) => r.segment === 'professional');
  const teen = reviews.filter((r) => r.segment === 'teen');
  const isos = isoList(reviews);
  const rated = reviews.filter((r) => r.rating);
  const avg = rated.length >= 3 ? rated.reduce((a, r) => a + r.rating, 0) / rated.length : 0;
  const preview = reviews.some((r) => r.preview);
  return (
    <section id="voices" className="section vl" aria-labelledby="voices-title" ref={ref}>
      <div className="vl-bg" aria-hidden="true"><i className="w" /><i className="c" /></div>
      <div className="container">
        <div className="vl-head reveal">
          <p className="eyebrow">Client testimonials {status === 'live' ? <span className="vx-live"><i /> Live</span> : null}</p>
          <h2 id="voices-title">Real members. Real rewards. <span className="vl-hl">In their own words.</span></h2>
          <p className="sec-sub">Reviews written on this site appear here as soon as they are published — consumers in the members’ lounge, professionals on the expert board and teens in the Teen zone.</p>
          {preview ? <p className="tv-prevnote"><Icon name="eye" size={14} /> Preview build: cards marked “Preview data” are supplied testimonials that are not published on the live site until confirmed.</p> : null}
        </div>

        <div className="vl-stage">
          <ConsumerChat list={con} active={inView} />

          <div className="vl-hub reveal">
            <Link to="/about-us/reviews" className="vl-cta" aria-label={`Open the Ratings and Reviews page — ${reviews.length} reviews from ${isos.length} countries`}>
              <span className="vl-orb" aria-hidden="true">
                <span className="vl-orb-ring" />
                <span className="vl-orb-flags">{isos.slice(0, 6).map((iso, k) => <i key={iso} style={{ '--k': k }}><Flag iso={iso} size={14} /></i>)}</span>
                <span className="vl-orb-core"><b>{reviews.length}</b><small>reviews</small></span>
              </span>
              <span className="vl-cta-t"><b>Ratings &amp; Reviews</b><small>See every review · filter by country, score and member type</small></span>
              <span className="vl-cta-go" aria-hidden="true">Open the wall <Icon name="arrow" size={16} /></span>
            </Link>
            <ul className="vl-facts">
              <li><b>{isos.length}</b><small>countries</small></li>
              {avg ? <li><b>{avg.toFixed(1)}<i>/5</i></b><small>average score</small></li> : null}
              <li><b className="c">{con.length}</b><small>consumers</small></li>
              <li><b className="p">{pro.length}</b><small>professionals</small></li>
              <li><b className="t">{teen.length}</b><small>teens</small></li>
            </ul>
          </div>

          <ProBoard list={pro} active={inView} />
        </div>

        <TeenWall list={teen} active={inView} />

        <div className="tv-foot vl-foot reveal">
          <RateButton className="btn tv-btn-c" icon="star" label="Rate your experience" outLabel="Log in to rate us" />
          <Link to="/about-us/reviews" className="btn vl-btn-all"><Icon name="eye" size={16} /> Read all reviews</Link>
        </div>
      </div>
    </section>
  );
}

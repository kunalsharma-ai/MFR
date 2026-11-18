import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import useInView from '../hooks/useInView.js';
import { BRAND, PAYOUTS } from '../data/site.js';
import { STATS, SURVEY_CATEGORIES } from '../data/community.js';
import { isCalm } from '../utils/calm.js';
import { segSound } from '../utils/sound.js';

// Home hero (v2.0). Left: brand motto, the H1, a Consumer / Professional switch that re-colours the whole hero
// (warm sunset for consumers, emerald & gold for professionals), a slot-roll audience motto with tagline, live
// community figures and the calls to action.
// Right: a different world per audience — the consumer "Reward Jar" (warm candy & gold: a spinning 3D coin fills a
// jar) or the professional "Expert Earnings Terminal" (emerald & gold: rising chart, flipping premium card, gold bars).
// Timers pause off-screen; CSS honours reduced motion.
const WHO = {
  consumer: ['students', 'homemakers', 'gamers', 'parents', 'retirees', 'shoppers', 'travellers', 'drivers'],
  pro: ['IT managers', 'doctors', 'founders', 'engineers', 'CXOs', 'HR leaders', 'marketers', 'consultants'],
};
const MOTTO_ICONS = ['chat', 'badge', 'gift'];
// Audience mottos — each word rolls into its own slot window; a tagline follows.
const MODE = {
  consumer: { words: [['chat', 'Speak up.'], ['coins', 'Cash in.'], ['refresh', 'Repeat.']], tag: 'Your opinion has a price tag — and it pays you.' },
  pro: { words: [['badge', 'Advise.'], ['trend', 'Influence.'], ['briefcase', 'Get paid like an expert.']], tag: 'Your expertise is the currency here.' },
};

const SEG_MS = 5000;

export default function HeroOrbit() {
  const [vref, visible] = useInView({ once: false, threshold: 0, rootMargin: '100px 0px' });
  const [seg, setSeg] = useState('consumer');
  const [w, setW] = useState(0);
  const [r, setR] = useState(0);
  useEffect(() => {
    if (!visible) return undefined; // pause when off-screen
    const t = setInterval(() => !isCalm() && setW((i) => i + 1), 2200);
    const t2 = setInterval(() => !isCalm() && setR((i) => (i + 1) % PAYOUTS.length), 3800);
    return () => { clearInterval(t); clearInterval(t2); };
  }, [visible]);
  // Consumer and Professional take turns every few seconds (the whole hero swaps: tint, motto, audience, scene).
  // A click on either tab pauses the rotation for a while; reduced-motion visitors keep the manual switch only.
  const hold = useRef(0);
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    if (!visible || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) { setAuto(false); return undefined; }
    setAuto(true);
    const t = setInterval(() => {
      if (document.hidden || Date.now() < hold.current) return;
      setSeg((v) => (v === 'consumer' ? 'pro' : 'consumer'));
    }, SEG_MS);
    return () => clearInterval(t);
  }, [visible]);
  const pick = (v) => { if (v !== seg) segSound(v === 'pro'); hold.current = Date.now() + 15000; setAuto(false); setSeg(v); setTimeout(() => setAuto(true), 15000); };
  const who = WHO[seg];
  const pay = PAYOUTS[r];
  const cat = SURVEY_CATEGORIES[r % SURVEY_CATEGORIES.length];
  const words = BRAND.motto.split('. ').map((x, i, a) => (i < a.length - 1 ? `${x}.` : x));

  return (
    <section ref={vref} className={`hero hm-hero seg-${seg}`} aria-labelledby="hero-title">
      <div className="hero-bg" aria-hidden="true">
        <div className="hm-tint t-con" />
        <div className="hm-tint t-pro" />
        <div className="hero-aurora a1" />
        <div className="hero-aurora a2" />
        <div className="hero-aurora a3" />
        <div className="hero-grid" />
        {Array.from({ length: 8 }).map((_, i) => <i key={i} className="hero-spark" style={{ "--i": i * 1.7 }} />)}
      </div>

      <div className="container hero-row">
        <div className="hero-copy">
          <p className="hm-motto" aria-label={BRAND.motto}>
            {words.map((x, k) => (
              <span key={x} className="hm-mw" style={{ '--k': k }} aria-hidden="true">
                <span className="hm-mi"><Icon name={MOTTO_ICONS[k]} size={15} /></span>{x}
              </span>
            ))}
          </p>
          <h1 id="hero-title" className="hero-title">
            <span className="ht-line">Earn money online</span>
            <span className="ht-line ht-accent">by sharing your opinion</span>
          </h1>

          <div className={`hm-seg${auto ? ' is-auto' : ''}`} role="tablist" aria-label="I am a" style={{ '--seg-ms': `${SEG_MS}ms` }}>
            <span className="hm-seg-pill" aria-hidden="true"><i key={seg} className="hm-seg-prog" /></span>
            <button type="button" role="tab" aria-selected={seg === 'consumer'} className={seg === 'consumer' ? 'on' : ''} onClick={() => pick('consumer')}><Icon name="user" size={16} /> Consumer</button>
            <button type="button" role="tab" aria-selected={seg === 'pro'} className={seg === 'pro' ? 'on' : ''} onClick={() => pick('pro')}><Icon name="briefcase" size={16} /> Professional</button>
          </div>

          <div className="hm-roll" key={`m-${seg}`}>
            <p className="hm-roll-w" aria-label={MODE[seg].words.map((x) => x[1]).join(' ')}>
              {MODE[seg].words.map(([ic, t], k) => (
                <span key={t} className="hm-slot" style={{ '--k': k }} aria-hidden="true"><span className="hm-slot-in"><Icon name={ic} size={18} /> {t}</span></span>
              ))}
            </p>
            <p className="hm-roll-tag">{MODE[seg].tag}</p>
          </div>
          <p className="hero-who" aria-live="off">
            Paid surveys built for{' '}
            <span className="who-swap" key={seg}>
              {who.map((x, i) => (
                <span key={x} className={i === w % who.length ? 'on' : ''} aria-hidden={i !== w % who.length}>{x}</span>
              ))}
            </span>
          </p>
          <p className="hero-lead">
            No investment. No fees. Just your honest voice — rewarded through <strong>PayPal</strong>, <strong>cash</strong>, <strong>bank or wire transfer</strong>, <strong>vouchers</strong> and <strong>gift cards</strong> — plus <strong>UPI</strong> in India.
          </p>
          <div className="hero-actions">
            <Link to={seg === 'pro' ? '/sign-up?type=professional' : '/sign-up'} className="btn btn-primary btn-lg btn-shine">Start earning free <Icon name="arrow" size={20} /></Link>
            <Link to="/how-it-works" className="btn btn-glass btn-lg"><span className="play-dot" /> How it works</Link>
          </div>
          <ul className="hm-stats" aria-label="Community figures">
            <li><b>${STATS.rewardsPaidUsd.toLocaleString('en-US')}+</b><small>rewards paid</small></li>
            <li><b>{STATS.membersRegistered.toLocaleString('en-US')}</b><small>members registered</small></li>
            <li><b>{STATS.monthlyAvailableSurveys}+</b><small>surveys monthly</small></li>
          </ul>
        </div>

        <div className="hero-stage" aria-hidden="true">
          {seg === 'pro' ? <ProWorld pay={pay} key="pro" /> : <ConsumerWorld pay={pay} cat={cat} key="con" />}
        </div>
      </div>

      <div className="hero-scroll" aria-hidden="true"><span /></div>
    </section>
  );
}

// ── Consumer world (v3.0): "Reward Jar" — warm candy & gold. A thick 3D gold coin spins over a glass jar,
// coins drop in and the jar fills, "+$X" pops out, a survey ticket fills up and the payout chips float around it.
const JAR_PAYS = ['paypal', 'giftcards', 'upi', 'cash', 'shopping', 'bank'];
function ConsumerWorld({ pay, cat }) {
  const chips = JAR_PAYS.map((id) => PAYOUTS.find((x) => x.id === id)).filter(Boolean);
  return (
    <div className="hm-scene mj-scene">
      <span className="mj-rays" />
      <span className="mj-glow" />
      <div className="mj-coin">
        <div className="mj-coin-spin">
          {Array.from({ length: 9 }).map((_, k) => <i key={k} className="mj-edge" style={{ '--z': `${(k - 4) * 2.2}px` }} />)}
          <span className="mj-face f">$</span>
          <span className="mj-face b"><Icon name="gift" size={54} /></span>
        </div>
      </div>
      {Array.from({ length: 6 }).map((_, k) => <i key={k} className="mj-drop" style={{ '--d': k }} />)}
      <div className="mj-jar">
        <span className="mj-lid" />
        <span className="mj-fill"><i /></span>
        <span className="mj-stack">{Array.from({ length: 5 }).map((_, k) => <i key={k} style={{ '--s': k }} />)}</span>
        <span className="mj-label"><Icon name="wallet" size={14} /> My rewards</span>
        <span className="mj-gloss" />
      </div>
      <p className="mj-pop" key={`p-${cat.id}`}><b>+${cat.reward}</b><small>{pay.short || pay.name}</small></p>
      <div className="mj-ticket" key={`t-${cat.id}`}>
        <p><span style={{ background: cat.tone }}><Icon name={cat.icon} size={14} /></span><b>{cat.tag} survey</b><small>{cat.mins} min</small></p>
        <span className="mj-prog"><i /></span>
        <p className="mj-done"><Icon name="check" size={13} /> Completed · reward on its way</p>
      </div>
      {chips.map((x, i) => (
        <span key={x.id} className={`mj-chip c${i} ${x.id === pay.id ? 'on' : ''}`} style={{ '--h1': x.hue, '--h2': x.hue2, '--i': i }}>
          <span><Icon name={x.icon} size={15} /></span>{x.short || x.name}
        </span>
      ))}
      {[0, 1, 2].map((k) => <span key={k} className={`mj-bill b${k}`}><b>$</b></span>)}
      {[0, 1, 2, 3, 4].map((k) => <i key={k} className={`mj-spark s${k}`} />)}
    </div>
  );
}

// ── Professional world (v3.0): "Expert Earnings Terminal" — emerald & gold. A tilted glass board draws a rising
// earnings chart (no figures), a gold premium member card flips, gold bars glint and an invitation slides in.
const ROLES = [['CXO', 'star'], ['IT', 'database'], ['Doctor', 'medical'], ['Finance', 'coins'], ['HR', 'user'], ['Founder', 'rocket'], ['Engineer', 'bolt'], ['Marketing', 'trend']];
const CANDLES = [34, 42, 38, 52, 48, 60, 58, 72, 70, 86];
function ProWorld({ pay }) {
  return (
    <div className="hm-scene xt-scene">
      <span className="xt-halo" />
      <span className="xt-beam" />
      <div className="xt-board">
        <p className="xt-head"><span className="xt-live" /><b>Expert earnings</b><small>Your expertise, rewarded</small></p>
        <div className="xt-chart">
          {CANDLES.map((h, k) => <i key={k} className="xt-candle" style={{ '--h': h, '--k': k }} />)}
          <svg className="xt-line" viewBox="0 0 300 120" preserveAspectRatio="none">
            <defs><linearGradient id="xtL" x1="0" x2="1"><stop offset="0" stopColor="#34D399" /><stop offset="1" stopColor="#FFD166" /></linearGradient></defs>
            <polyline points="0,96 33,86 66,90 100,72 133,76 166,58 200,62 233,40 266,44 300,14" />
          </svg>
          <span className="xt-cover" />
          <span className="xt-tip"><Icon name="trend" size={13} /></span>
        </div>
        <div className="xt-tape"><div>{[...ROLES, ...ROLES].map(([t, ic], k) => <span key={k}><Icon name={ic} size={12} />{t}</span>)}</div></div>
      </div>
      <div className="xt-card">
        <div className="xt-card-in">
          <div className="xt-side f">
            <p className="xt-card-top"><span>MyFrequentRewards</span><b>PREMIUM</b></p>
            <span className="xt-chip" />
            <p className="xt-card-t">Expert member</p>
            <i className="xt-shine" />
          </div>
          <div className="xt-side b">
            <p className="xt-card-top"><span>Rewards paid via</span></p>
            <p className="xt-card-pay" key={pay.id}><Icon name={pay.icon} size={18} /> {pay.name}</p>
            <p className="xt-card-s">Bank · Wire · PayPal · Gift cards</p>
          </div>
        </div>
      </div>
      <div className="xt-gold">{[0, 1, 2].map((k) => <span key={k} className={`xt-bar g${k}`}><i /></span>)}</div>
      <div className="xt-note">
        <span className="xt-note-ic"><Icon name="mail" size={15} /></span>
        <p><b>Invitation · IT decision makers</b><small><Icon name="clock" size={11} /> 20 min · <Icon name="coins" size={11} /> Premium reward</small></p>
      </div>
      <span className="xt-badge"><Icon name="shield" size={15} /> Verified professional</span>
      {['$', '€', '₹', '£'].map((c, k) => <span key={c} className={`xt-coin k${k}`}>{c}</span>)}
    </div>
  );
}

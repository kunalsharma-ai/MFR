import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import useInView from '../hooks/useInView.js';
import { BRAND, PAYOUTS } from '../data/site.js';
import { STATS, SURVEY_CATEGORIES } from '../data/community.js';
import { isCalm } from '../utils/calm.js';

// Home hero (v2.0). Left: brand motto, the H1, a Consumer / Professional switch that re-colours the whole hero
// (warm sunset for consumers, emerald & gold for professionals), a slot-roll audience motto with tagline, live
// community figures and the calls to action.
// Right: a different world per audience — the consumer "Opinion Orbit" (a live mini-survey on a phone, the eight
// reward types circling it in 3D) or the professional holographic expert globe with orbiting roles and a gold invitation.
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
  const pick = (v) => { hold.current = Date.now() + 15000; setAuto(false); setSeg(v); setTimeout(() => setAuto(true), 15000); };
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
          {seg === 'pro' ? <ProWorld pay={pay} key="pro" /> : <ConsumerWorld pay={pay} r={r} cat={cat} key="con" />}
        </div>
      </div>

      <div className="hero-scroll" aria-hidden="true"><span /></div>
    </section>
  );
}

// ── Consumer world (v2.5): "Opinion Orbit" — a tilted phone runs a live mini-survey (question → tap a score →
// "+$X earned"), while the eight reward types circle it on a 3D ring; the reward being paid out lights up.
// One CSS animation turns the whole ring, so it stays light.
function ConsumerWorld({ pay, r, cat }) {
  const n = PAYOUTS.length;
  return (
    <div className="hm-scene oo-scene">
      <span className="oo-glow" />
      <span className="oo-coin c1">$</span><span className="oo-coin c2">₹</span><span className="oo-coin c3">€</span>
      <div className="oo-phone">
        <span className="oo-notch" />
        <div className="oo-screen" key={cat.id}>
          <p className="oo-top"><span style={{ background: cat.tone }}><Icon name={cat.icon} size={14} /></span><b>{cat.tag} survey</b><small>{cat.mins} min</small></p>
          <p className="oo-q">How do you rate your last {cat.tag.toLowerCase()} experience?</p>
          <ol className="oo-scale">{[1, 2, 3, 4, 5].map((k) => <li key={k} className={k === 4 ? 'pick' : ''}><b>{k}</b></li>)}</ol>
          <span className="oo-tap" />
          <span className="oo-bar"><i /></span>
          <p className="oo-earn"><span>+${cat.reward}</span><small>earned · paid as {pay.short || pay.name}</small></p>
        </div>
      </div>
      <div className="oo-ring" style={{ '--n': n }}>
        <div className="oo-spin">
          {PAYOUTS.map((x, i) => (
            <span key={x.id} className={`oo-tile ${i === r ? 'on' : ''}`} style={{ '--i': i, '--h1': x.hue, '--h2': x.hue2 }}>
              <span className="oo-face"><span className="oo-ico"><Icon name={x.icon} size={20} /></span><small>{x.short || x.name}</small></span>
            </span>
          ))}
        </div>
        <span className="oo-track" />
      </div>
      <span className="vm-tag t1"><Icon name="clock" size={13} /> ~10 min surveys</span>
      <span className="vm-tag t2"><Icon name="heart" size={13} /> 100% free</span>
    </div>
  );
}

// ── Professional world: a holographic expert globe — roles orbit, the invitation card glints gold ──
const ROLES = [['CXO', 'star'], ['IT', 'database'], ['Doctor', 'medical'], ['Finance', 'coins'], ['HR', 'user'], ['Founder', 'rocket']];
function ProWorld({ pay }) {
  return (
    <div className="hm-scene hg-scene">
      <span className="hg-halo" />
      <div className="hg-globe">
        {[0, 1, 2, 3].map((k) => <i key={k} className="hg-mer" style={{ '--k': k }} />)}
        {[0, 1, 2].map((k) => <i key={k} className={`hg-lat l${k}`} />)}
        {[0, 1, 2, 3, 4].map((k) => <b key={k} className={`hg-city c${k}`} />)}
        <span className="hg-gloss" />
      </div>
      <svg className="hg-orbit" viewBox="0 0 520 520" role="img" aria-label="Orbit ring of reward types"><ellipse cx="260" cy="250" rx="225" ry="78" /></svg>
      {ROLES.map(([t, ic], i) => (
        <span key={t} className="hg-role" style={{ '--i': i }}><span><Icon name={ic} size={14} /></span>{t}</span>
      ))}
      <span className="hg-badge"><Icon name="shield" size={16} /> Verified professional</span>
      <div className="hg-card">
        <p className="hg-card-top"><span>INVITATION</span><b>B2B</b></p>
        <p className="hg-card-t">IT decision makers</p>
        <p className="hg-card-m"><span><Icon name="clock" size={12} /> 20 min</span><span><Icon name="coins" size={12} /> Premium reward</span></p>
        <p className="hg-card-pay" key={pay.id}><Icon name={pay.icon} size={13} /> {pay.name}</p>
        <i className="hg-card-shine" />
      </div>
    </div>
  );
}

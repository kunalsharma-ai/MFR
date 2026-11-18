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
        {/* v3.0 audience atmospheres: candy confetti sky (consumer) · gold-vault night with light beams (professional) */}
        <div className="hx-fx hx-con">
          {Array.from({ length: 16 }).map((_, i) => <i key={i} className="hx-confetti" style={{ '--i': i }} />)}
          {Array.from({ length: 5 }).map((_, i) => <b key={i} className="hx-bubble" style={{ '--i': i }} />)}
        </div>
        <div className="hx-fx hx-pro">
          {[0, 1, 2].map((i) => <span key={i} className="hx-beam" style={{ '--i': i }} />)}
          {Array.from({ length: 16 }).map((_, i) => <i key={i} className="hx-dust" style={{ '--i': i }} />)}
          <svg className="hx-ticker" viewBox="0 0 1200 200" preserveAspectRatio="none"><polyline points="0,170 120,150 220,160 330,120 440,130 560,90 660,100 780,60 900,70 1020,30 1200,10" /></svg>
        </div>
      </div>

      <div className="container hero-row">
        <div className="hero-copy">
          <p className="hm-motto">
            <span className="sr-only">{BRAND.motto}</span>
            {words.map((x, k) => (
              <span key={x} className="hm-mw" style={{ '--k': k }} aria-hidden="true">
                <span className="hm-mi"><Icon name={MOTTO_ICONS[k]} size={15} /></span>{x}
              </span>
            ))}
          </p>
          <p className={`hx-ribbon r-${seg}`} key={`r-${seg}`}>
            <span className="hx-ribbon-ic"><Icon name={seg === 'pro' ? 'briefcase' : 'gift'} size={14} /></span>
            {seg === 'pro' ? 'Premium paid studies for professionals' : 'Real rewards for everyday opinions'}
            <i className="hx-ribbon-shine" aria-hidden="true" />
          </p>
          <h1 id="hero-title" className={`hero-title hx-title t-${seg}`} key={`h-${seg}`}>
            <span className="ht-line" style={{ '--l': 0 }}>Earn money online</span>
            <span className="ht-line ht-accent" style={{ '--l': 1 }}>by sharing your opinion</span>
            <svg className="hx-swoosh" viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden="true"><path d="M4 18 C 90 4, 230 2, 396 12" /></svg>
          </h1>

          <div className={`hm-seg${auto ? ' is-auto' : ''}`} role="tablist" aria-label="I am a" style={{ '--seg-ms': `${SEG_MS}ms` }}>
            <span className="hm-seg-pill" aria-hidden="true"><i key={seg} className="hm-seg-prog" /></span>
            <button type="button" role="tab" aria-selected={seg === 'consumer'} className={seg === 'consumer' ? 'on' : ''} onClick={() => pick('consumer')}><Icon name="user" size={16} /> Consumer</button>
            <button type="button" role="tab" aria-selected={seg === 'pro'} className={seg === 'pro' ? 'on' : ''} onClick={() => pick('pro')}><Icon name="briefcase" size={16} /> Professional</button>
          </div>

          <div className="hm-roll" key={`m-${seg}`}>
            <p className="hm-roll-w">
              <span className="sr-only">{MODE[seg].words.map((x) => x[1]).join(' ')}</span>
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

// ── Professional world (v3.2): "Expert Briefcase" — the site's own navy and royal blue with gold money accents.
// A 3D executive briefcase opens and gold coins and blue notes burst out of it, an invitation to a premium study
// slides in, expert earnings climb on a glass chart and each payout lands as a "Paid via…" notice.
const EXPERTS = [['CXO', 'star'], ['Doctor', 'medical'], ['IT lead', 'database'], ['Finance', 'coins']];
const EARN = [30, 44, 40, 58, 66, 84];
function ProWorld({ pay }) {
  return (
    <div className="hm-scene eb">
      <span className="eb-glow" />
      <span className="eb-ring" />
      <span className="eb-ring r2" />
      {/* coins and notes burst out of the case */}
      {[0, 1, 2, 3, 4, 5].map((k) => <span key={k} className={`eb-coin c${k}`}><b>$</b></span>)}
      {[0, 1, 2].map((k) => <span key={k} className={`eb-note n${k}`}><i /><b>$</b></span>)}
      <div className="eb-case">
        <span className="eb-handle" />
        <div className="eb-lid"><span className="eb-lid-in" /></div>
        <span className="eb-light" />
        <div className="eb-body">
          <span className="eb-clasp l" /><span className="eb-clasp r" />
          <span className="eb-plate"><Icon name="badge" size={14} /> Expert</span>
          <i className="eb-shine" />
        </div>
        <span className="eb-shadow" />
      </div>
      <p className="eb-pop"><Icon name="coins" size={14} /> Premium reward</p>
      <div className="eb-invite">
        <span className="eb-invite-ic"><Icon name="mail" size={15} /></span>
        <p><b>Invitation · Healthcare experts</b><small><Icon name="clock" size={11} /> 20 min · <Icon name="coins" size={11} /> Premium reward</small></p>
      </div>
      <div className="eb-chart">
        <p><span className="eb-live" /><b>Expert earnings</b><Icon name="trend" size={14} /></p>
        <div className="eb-bars">{EARN.map((h, k) => <i key={k} style={{ '--h': h, '--k': k }} />)}</div>
      </div>
      <div className="eb-paid" key={pay.id}>
        <span className="eb-paid-ic"><Icon name={pay.icon} size={15} /></span>
        <p><b>Paid via {pay.short || pay.name}</b><small><Icon name="check" size={11} /> Expert reward sent</small></p>
      </div>
      {EXPERTS.map(([t, ic], k) => <span key={t} className={`eb-role r${k}`}><Icon name={ic} size={13} />{t}</span>)}
      {[0, 1, 2, 3, 4].map((k) => <i key={k} className={`eb-spark s${k}`} />)}
    </div>
  );
}

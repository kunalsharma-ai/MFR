import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import useInView from '../hooks/useInView.js';
import { BRAND, PAYOUTS } from '../data/site.js';
import { STATS, SURVEY_CATEGORIES } from '../data/community.js';
import { isCalm } from '../utils/calm.js';
import { segSound } from '../utils/sound.js';

// Home hero (v3.1). Two audiences, two worlds, no shared colours (styles/v31-hero.css):
//  • Consumer: "Opinion Mint" (berry night, magenta, tangerine, sunshine yellow). Answers on a 3D phone fly out as
//    speech bubbles, fall into a spinning mint ring and drop out as gold coins that build up coin towers.
//  • Professional: "Expertise Prism" (midnight, ice cyan, electric blue, platinum). A 3D crystal turns over a light
//    pedestal; expert roles orbit it, beams of value shoot out, a platinum member card flips and rates climb.
// Switching sends a colour burst out of the switch and the headline flips in word by word.
// Only transform and opacity animate; the scenes are fixed-size boxes, so nothing shifts layout.
// Timers pause off-screen and when idle; CSS honours reduced motion.
const WHO = {
  consumer: ['students', 'homemakers', 'gamers', 'parents', 'retirees', 'shoppers', 'travellers', 'drivers'],
  pro: ['IT managers', 'doctors', 'founders', 'engineers', 'CXOs', 'HR leaders', 'marketers', 'consultants'],
};
const MOTTO_ICONS = ['chat', 'badge', 'gift'];
const MODE = {
  consumer: {
    ribbon: ['gift', 'Real rewards for everyday opinions'],
    words: [['chat', 'Speak up.'], ['coins', 'Cash in.'], ['refresh', 'Repeat.']],
    tag: 'Your opinion has a price tag — and it pays you.',
  },
  pro: {
    ribbon: ['briefcase', 'Premium paid studies for professionals'],
    words: [['badge', 'Advise.'], ['trend', 'Influence.'], ['briefcase', 'Get paid like an expert.']],
    tag: 'Your expertise is the currency here.',
  },
};
const TITLE = [['Earn', 'money', 'online'], ['by', 'sharing', 'your', 'opinion']];

const SEG_MS = 7000;

export default function HeroOrbit() {
  const [vref, visible] = useInView({ once: false, threshold: 0, rootMargin: '100px 0px' });
  const [seg, setSeg] = useState('consumer');
  const [w, setW] = useState(0);
  const [r, setR] = useState(0);
  const [burst, setBurst] = useState(0);
  const secRef = useRef(null);
  const setRefs = (el) => { secRef.current = el; vref(el); };
  useEffect(() => {
    if (!visible) return undefined; // pause when off-screen
    const t = setInterval(() => !isCalm() && setW((i) => i + 1), 2200);
    const t2 = setInterval(() => !isCalm() && setR((i) => (i + 1) % PAYOUTS.length), 3800);
    return () => { clearInterval(t); clearInterval(t2); };
  }, [visible]);
  // Consumer and Professional take turns; a click on either pauses the rotation for a while.
  // Reduced-motion visitors keep the manual switch only.
  const hold = useRef(0);
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    if (!visible || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) { setAuto(false); return undefined; }
    setAuto(true);
    const t = setInterval(() => {
      if (document.hidden || isCalm() || Date.now() < hold.current) return;
      setSeg((v) => (v === 'consumer' ? 'pro' : 'consumer'));
      setBurst((b) => b + 1);
    }, SEG_MS);
    return () => clearInterval(t);
  }, [visible]);
  const pick = (v, e) => {
    if (v === seg) return;
    segSound(v === 'pro');
    // the colour burst starts from the button that was pressed
    const s = secRef.current;
    if (s && e && e.currentTarget) {
      const a = s.getBoundingClientRect();
      const b = e.currentTarget.getBoundingClientRect();
      s.style.setProperty('--bx', `${b.left + b.width / 2 - a.left}px`);
      s.style.setProperty('--by', `${b.top + b.height / 2 - a.top}px`);
    }
    hold.current = Date.now() + 20000; setAuto(false); setSeg(v); setBurst((n) => n + 1);
    setTimeout(() => setAuto(true), 20000);
  };
  const who = WHO[seg];
  const mode = MODE[seg];
  const pay = PAYOUTS[r];
  const cat = SURVEY_CATEGORIES[r % SURVEY_CATEGORIES.length];
  const words = BRAND.motto.split('. ').map((x, i, a) => (i < a.length - 1 ? `${x}.` : x));

  return (
    <section ref={setRefs} className={`hero hz hz-${seg === 'pro' ? 'pro' : 'con'}`} aria-labelledby="hero-title">
      <div className="hz-bg" aria-hidden="true">
        <div className="hz-sky s-con" />
        <div className="hz-sky s-pro" />
        {seg === 'pro' ? <ProSky /> : <ConSky />}
        {burst > 0 && <span className="hz-burst" key={`b${burst}`} />}
      </div>

      <div className="container hero-row hz-row">
        <div className="hz-copy">
          <p className="hz-motto">
            <span className="sr-only">{BRAND.motto}</span>
            {words.map((x, k) => (
              <span key={x} className="hz-mw" style={{ '--k': k }} aria-hidden="true"><Icon name={MOTTO_ICONS[k]} size={14} />{x}</span>
            ))}
          </p>
          <p className="hz-ribbon" key={`r-${seg}`}>
            <span className="hz-ribbon-ic"><Icon name={mode.ribbon[0]} size={14} /></span>
            {mode.ribbon[1]}
          </p>
          <h1 id="hero-title" className="hz-title" key={`h-${seg}`}>
            {TITLE.map((line, l) => (
              <span key={l} className={`hz-line${l ? ' hz-accent' : ''}`}>
                {l ? ' ' : ''}
                {line.map((x, k) => (
                  <span key={x}>{k ? ' ' : ''}<span className="hz-w" style={{ '--d': l * 3 + k }}>{x}</span></span>
                ))}
              </span>
            ))}
            <span className="hz-under" aria-hidden="true"><i /><b /></span>
          </h1>

          <div className={`hz-seg${auto ? ' is-auto' : ''}`} role="tablist" aria-label="I am a" style={{ '--seg-ms': `${SEG_MS}ms` }}>
            <span className="hz-thumb" aria-hidden="true"><i key={`${seg}${burst}`} className="hz-prog" /></span>
            <button type="button" role="tab" aria-selected={seg === 'consumer'} className={seg === 'consumer' ? 'on' : ''} onClick={(e) => pick('consumer', e)}>
              <span className="hz-seg-ic"><Icon name="user" size={16} /></span> Consumer
            </button>
            <button type="button" role="tab" aria-selected={seg === 'pro'} className={seg === 'pro' ? 'on' : ''} onClick={(e) => pick('pro', e)}>
              <span className="hz-seg-ic"><Icon name="briefcase" size={16} /></span> Professional
            </button>
          </div>

          <div className="hz-roll" key={`m-${seg}`}>
            <p className="hz-slots">
              <span className="sr-only">{mode.words.map((x) => x[1]).join(' ')}</span>
              {mode.words.map(([ic, t], k) => (
                <span key={t} className="hz-slot" style={{ '--k': k }} aria-hidden="true"><Icon name={ic} size={17} /> {t}</span>
              ))}
            </p>
            <p className="hz-tag">{mode.tag}</p>
          </div>
          <p className="hero-who hz-who" aria-live="off">
            Paid surveys built for{' '}
            <span className="who-swap" key={seg}>
              {who.map((x, i) => (
                <span key={x} className={i === w % who.length ? 'on' : ''} aria-hidden={i !== w % who.length}>{x}</span>
              ))}
            </span>
          </p>
          <p className="hero-lead hz-lead">
            No investment. No fees. Just your honest voice — rewarded through <strong>PayPal</strong>, <strong>cash</strong>, <strong>bank or wire transfer</strong>, <strong>vouchers</strong> and <strong>gift cards</strong> — plus <strong>UPI</strong> in India.
          </p>
          <div className="hero-actions">
            <Link to={seg === 'pro' ? '/sign-up?type=professional' : '/sign-up'} className="btn btn-lg hz-go">
              <span>Start earning free</span> <Icon name="arrow" size={20} /><i className="hz-go-shine" aria-hidden="true" />
            </Link>
            <Link to="/how-it-works" className="btn btn-lg hz-ghost"><span className="hz-play" /> How it works</Link>
          </div>
          <ul className="hz-stats" aria-label="Community figures">
            <li><b>${STATS.rewardsPaidUsd.toLocaleString('en-US')}+</b><small>rewards paid</small></li>
            <li><b>{STATS.membersRegistered.toLocaleString('en-US')}</b><small>members registered</small></li>
            <li><b>{STATS.monthlyAvailableSurveys}+</b><small>surveys monthly</small></li>
          </ul>
        </div>

        <div className="hero-stage hz-stage" aria-hidden="true">
          {seg === 'pro' ? <ProWorld pay={pay} key="pro" /> : <ConsumerWorld pay={pay} cat={cat} key="con" />}
        </div>
      </div>

      <div className="hero-scroll" aria-hidden="true"><span /></div>
    </section>
  );
}

// Background atmospheres: drifting glow orbs and rising confetti (consumer) · a moving light floor and light
// pillars (professional).
function ConSky() {
  return (
    <div className="hz-fx">
      <span className="hz-orb o1" /><span className="hz-orb o2" /><span className="hz-orb o3" />
      <span className="hz-rays" />
      {Array.from({ length: 10 }).map((_, i) => <i key={i} className="hz-conf" style={{ '--i': i }} />)}
    </div>
  );
}
function ProSky() {
  return (
    <div className="hz-fx">
      <span className="hz-orb o1" /><span className="hz-orb o2" />
      <span className="hz-floor"><i /></span>
      {[0, 1, 2, 3].map((i) => <span key={i} className="hz-pillar" style={{ '--i': i }} />)}
      {Array.from({ length: 8 }).map((_, i) => <i key={i} className="hz-mote" style={{ '--i': i }} />)}
    </div>
  );
}

// ── Consumer world: "Opinion Mint"
const CHIPS = ['paypal', 'giftcards', 'upi', 'cash'];
const ANSWERS = ['Love it', 'It’s okay', 'Not for me'];
function ConsumerWorld({ pay, cat }) {
  const chips = CHIPS.map((id) => PAYOUTS.find((x) => x.id === id)).filter(Boolean);
  return (
    <div className="hm-scene om">
      <span className="om-halo" />
      {/* the phone */}
      <div className="om-phone">
        <div className="om-phone-in">
          <span className="om-notch" />
          <p className="om-top"><span style={{ background: cat.tone }}><Icon name={cat.icon} size={13} /></span><b>{cat.tag} survey</b><small>{cat.mins} min</small></p>
          <span className="om-q" /><span className="om-q q2" />
          <ul className="om-ans">
            {ANSWERS.map((a) => <li key={a}><i />{a}</li>)}
            <span className="om-pick"><Icon name="check" size={12} /></span>
          </ul>
          <span className="om-prog"><i /></span>
          <p className="om-send"><Icon name="send" size={13} /> Send answer</p>
          <span className="om-tap" />
        </div>
      </div>
      {/* answers fly out as bubbles and into the mint */}
      {[0, 1, 2].map((k) => <span key={k} className="om-bub" style={{ '--k': k }}><span><i /><i /><i /></span></span>)}
      <div className="om-mint">
        <span className="om-ring" />
        <span className="om-ring r2" />
        <div className="om-coin">
          <div className="om-coin-spin">
            {Array.from({ length: 7 }).map((_, k) => <i key={k} className="om-edge" style={{ '--z': `${(k - 3) * 2.4}px` }} />)}
            <span className="om-face f">$</span>
            <span className="om-face b"><Icon name="gift" size={46} /></span>
          </div>
        </div>
      </div>
      {[0, 1, 2].map((k) => <span key={k} className="om-drop" style={{ '--k': k }}><b>$</b></span>)}
      {/* coin towers */}
      <div className="om-towers">
        {[0, 1, 2].map((s) => (
          <span key={s} className="om-tower" style={{ '--s': s }}>
            {Array.from({ length: 5 }).map((_, k) => <i key={k} style={{ '--k': k }} />)}
          </span>
        ))}
        <span className="om-shadow" />
      </div>
      <p className="om-pop" key={`p-${cat.id}`}><b>+${cat.reward}</b><small><Icon name={pay.icon} size={12} /> {pay.short || pay.name}</small></p>
      {chips.map((x, i) => (
        <span key={x.id} className={`om-chip c${i}`} style={{ '--h1': x.hue, '--h2': x.hue2 }}>
          <span><Icon name={x.icon} size={14} /></span>{x.short || x.name}
        </span>
      ))}
      {Array.from({ length: 6 }).map((_, k) => <i key={k} className={`om-star s${k}`} />)}
    </div>
  );
}

// ── Professional world: "Expertise Prism"
const ROLES = [['CXO', 'star'], ['Doctor', 'medical'], ['IT', 'database'], ['Finance', 'coins'], ['Founder', 'rocket']];
const RATE = [38, 52, 46, 64, 78];
function ProWorld({ pay }) {
  return (
    <div className="hm-scene xp">
      <span className="xp-glow" />
      <div className="xp-beams">{[0, 1, 2, 3, 4, 5].map((k) => <i key={k} style={{ '--k': k }} />)}</div>
      <div className="xp-base"><i /><i className="b2" /><i className="b3" /></div>
      <div className="xp-gem">
        <div className="xp-gem-spin">
          {[0, 1, 2, 3].map((k) => <i key={`t${k}`} className="xp-f up" style={{ '--k': k }} />)}
          {[0, 1, 2, 3].map((k) => <i key={`b${k}`} className="xp-f dn" style={{ '--k': k }} />)}
        </div>
        <span className="xp-gem-core" />
      </div>
      {/* expert roles orbit the prism */}
      {ROLES.map(([t, ic], k) => (
        <span key={t} className="xp-orb" style={{ '--k': k }}>
          <span className="xp-orb-y"><span className="xp-role"><Icon name={ic} size={13} />{t}</span></span>
        </span>
      ))}
      <div className="xp-rate">
        <p><span className="xp-live" /><b>Expert rate</b><Icon name="trend" size={14} /></p>
        <div className="xp-bars">{RATE.map((h, k) => <i key={k} style={{ '--h': h, '--k': k }} />)}</div>
      </div>
      <div className="xp-invite">
        <span className="xp-invite-ic"><Icon name="mail" size={15} /></span>
        <p><b>Invitation · IT decision makers</b><small><Icon name="clock" size={11} /> 20 min · <Icon name="coins" size={11} /> Premium reward</small></p>
      </div>
      <div className="xp-card">
        <div className="xp-card-in">
          <div className="xp-side f">
            <p className="xp-card-top"><span>MyFrequentRewards</span><b>PLATINUM</b></p>
            <span className="xp-chip" />
            <p className="xp-card-t">Expert member</p>
            <i className="xp-shine" />
          </div>
          <div className="xp-side b">
            <p className="xp-card-top"><span>Rewards paid via</span></p>
            <p className="xp-card-pay" key={pay.id}><Icon name={pay.icon} size={17} /> {pay.name}</p>
            <p className="xp-card-s">Bank · Wire · PayPal · Gift cards</p>
          </div>
        </div>
      </div>
      <span className="xp-badge"><Icon name="shield" size={14} /> Verified professional</span>
      {['$', '€', '£', '₹'].map((c, k) => <span key={c} className={`xp-tok k${k}`}>{c}</span>)}
    </div>
  );
}

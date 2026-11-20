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
  minor: ['gamers', 'creators', 'athletes', 'foodies', 'music fans', 'coders', 'artists', 'bookworms'],
};
const MOTTO_ICONS = ['chat', 'badge', 'gift'];
// Audience mottos — each word rolls into its own slot window; a tagline follows.
const MODE = {
  consumer: { words: [['chat', 'Speak up.'], ['coins', 'Cash in.'], ['refresh', 'Repeat.']], tag: 'Your opinion has a price tag — and it pays you.' },
  pro: { words: [['badge', 'Advise.'], ['trend', 'Influence.'], ['briefcase', 'Get paid like an expert.']], tag: 'Your expertise is the currency here.' },
  minor: { words: [['game', 'Play.'], ['chat', 'Speak up.'], ['trophy', 'Level up.']], tag: 'Ages 13–17 · age-appropriate surveys · opens with a parent or guardian’s yes.' },
};
// v3.3: three audiences take turns — Consumer → Professional → Minor (the teen panel, "Galaxy Pop" colours).
const SEGS = ['consumer', 'pro', 'minor'];
const RIBBON = {
  consumer: ['gift', 'Share opinions · earn multiple rewards'],
  pro: ['briefcase', 'Share expert insights · earn premium rewards'],
  minor: ['rocket', 'New · Teen Panel 13–17 · parent-approved'],
};
const ACCENT = { consumer: 'by sharing your opinion', pro: 'by sharing your expertise', minor: 'by levelling up your voice' };
const JOIN = { consumer: '/sign-up', pro: '/sign-up?type=professional', minor: '/sign-up?type=teen' };

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
      setSeg((v) => SEGS[(SEGS.indexOf(v) + 1) % SEGS.length]);
    }, SEG_MS);
    return () => clearInterval(t);
  }, [visible]);
  const pick = (v) => { if (v !== seg) segSound(v === 'pro'); hold.current = Date.now() + 15000; setAuto(false); setSeg(v); setTimeout(() => setAuto(true), 15000); };
  const who = WHO[seg];
  const others = SEGS.filter((x) => x !== seg);
  const pay = PAYOUTS[r];
  const cat = SURVEY_CATEGORIES[r % SURVEY_CATEGORIES.length];
  const words = BRAND.motto.split('. ').map((x, i, a) => (i < a.length - 1 ? `${x}.` : x));

  return (
    <section ref={vref} className={`hero hm-hero seg-${seg}`} aria-labelledby="hero-title">
      <div className="hero-bg" aria-hidden="true">
        <div className="hm-tint t-con" />
        <div className="hm-tint t-pro" />
        <div className="hm-tint t-min" />
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
        {/* v3.3 teen atmosphere: synthwave sun over a moving neon grid, with bubbles rising */}
        {/* v3.4 teen atmosphere "Neon Lagoon": aurora curtains, drifting shapes and rising light dots */}
        <div className="hx-fx hx-teen">
          <span className="hxt-aur a1" /><span className="hxt-aur a2" /><span className="hxt-aur a3" />
          {Array.from({ length: 9 }).map((_, i) => <i key={i} className={`hxt-shape s${i % 3}`} style={{ '--i': i }} />)}
        </div>
        <div className="hx-fx hx-min">
          <span className="hx-sun" />
          <span className="hx-floor" />
          {Array.from({ length: 10 }).map((_, i) => <i key={i} className="hx-bub" style={{ '--i': i }} />)}
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
          {/* Both audience variants share one grid cell (the other one is an invisible copy), so the hero keeps the
              height of the taller variant and nothing below jumps when Consumer and Professional take turns (CLS). */}
          <div className="hx-hold">
            {[seg, ...others].map((v, n) => (
              <p className={`hx-ribbon r-${v}${n ? ' hx-ghost' : ''}`} key={n ? `ghost-${n}` : `r-${v}`} aria-hidden={n ? 'true' : undefined}>
                <span className="hx-ribbon-ic"><Icon name={RIBBON[v][0]} size={14} /></span>
                {RIBBON[v][1]}
                {!n && <i className="hx-ribbon-shine" aria-hidden="true" />}
              </p>
            ))}
          </div>
          <h1 id="hero-title" className={`hero-title hx-title t-${seg}`} key={`h-${seg}`}>
            <span className="ht-line" style={{ '--l': 0 }}>{seg === 'minor' ? 'Earn rewards online' : 'Earn money online'}</span>
            <span className="ht-line ht-accent" style={{ '--l': 1 }}>{ACCENT[seg]}</span>
            <svg className="hx-swoosh" viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden="true"><path d="M4 18 C 90 4, 230 2, 396 12" /></svg>
          </h1>

          <div className={`hm-seg${auto ? ' is-auto' : ''}`} role="tablist" aria-label="I am a" style={{ '--seg-ms': `${SEG_MS}ms` }}>
            <span className="hm-seg-pill" aria-hidden="true"><i key={seg} className="hm-seg-prog" /></span>
            <button type="button" role="tab" aria-selected={seg === 'consumer'} className={seg === 'consumer' ? 'on' : ''} onClick={() => pick('consumer')}><Icon name="user" size={16} /> Consumer</button>
            <button type="button" role="tab" aria-selected={seg === 'pro'} className={seg === 'pro' ? 'on' : ''} onClick={() => pick('pro')}><Icon name="briefcase" size={16} /> Professional</button>
            <button type="button" role="tab" aria-selected={seg === 'minor'} className={seg === 'minor' ? 'on' : ''} onClick={() => pick('minor')}><Icon name="rocket" size={16} /> Teen</button>
          </div>

          <div className="hx-hold">
            {[seg, ...others].map((v, n) => (
              <div className={`hm-roll${n ? ' hx-ghost' : ''}`} key={n ? `ghost-${n}` : `m-${v}`} aria-hidden={n ? 'true' : undefined}>
                <p className="hm-roll-w">
                  {!n && <span className="sr-only">{MODE[v].words.map((x) => x[1]).join(' ')}</span>}
                  {MODE[v].words.map(([ic, t], k) => (
                    <span key={t} className="hm-slot" style={{ '--k': k }} aria-hidden="true"><span className="hm-slot-in"><Icon name={ic} size={18} /> {t}</span></span>
                  ))}
                </p>
                <p className="hm-roll-tag">{MODE[v].tag}</p>
              </div>
            ))}
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
            <Link to={JOIN[seg]} className="btn btn-primary btn-lg btn-shine">{seg === 'minor' ? 'Join the Teen Panel' : 'Start earning free'} <Icon name="arrow" size={20} /></Link>
            <Link to="/how-it-works" className="btn btn-glass btn-lg"><span className="play-dot" /> How it works</Link>
          </div>
          <ul className="hm-stats" aria-label="Community figures">
            <li><b>${STATS.rewardsPaidUsd.toLocaleString('en-US')}+</b><small>rewards paid</small></li>
            <li><b>{STATS.membersRegistered.toLocaleString('en-US')}</b><small>members registered</small></li>
            <li><b>{STATS.monthlyAvailableSurveys}+</b><small>surveys monthly</small></li>
          </ul>
        </div>

        <div className="hero-stage" aria-hidden="true">
          {seg === 'pro' ? <ProWorld pay={pay} key="pro" /> : seg === 'minor' ? <TeenWorld key="teen" /> : <ConsumerWorld pay={pay} cat={cat} key="con" />}
        </div>
      </div>

      <div className="hero-scroll" aria-hidden="true"><span /></div>
    </section>
  );
}

// ── Consumer world (v3.0): "Reward Jar" — warm candy & gold. A thick 3D gold coin spins over a glass jar,
// coins drop in and the jar fills, "+$X" pops out, a survey ticket fills up and the payout chips float around it.
const JAR_PAYS = ['paypal', 'giftcards', 'upi', 'cash'];
const FAN_C = ['bank', 'shopping', 'giftcards'];
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
      {/* the opinion → rewards story: a quick poll gets answered, "+$X" flies into the jar, three rewards fan out */}
      <div className="mx-poll">
        <p className="mx-poll-h"><span><Icon name="chat" size={13} /></span><b>Quick opinion</b><small>{cat.mins} min</small></p>
        <p className="mx-poll-q">Would you buy this {cat.tag.toLowerCase()} pick?</p>
        <div className="mx-opts">
          <span className="o1"><i className="mx-fill" /><em><Icon name="check" size={11} stroke={3} /></em><b className="mx-t"><span>Yes, love it</span><span>Yes, love it</span></b></span>
          <span className="o2"><i className="mx-fill" />Not for me</span>
        </div>
        <svg className="mx-cursor" viewBox="0 0 24 24" width="26" height="26"><path d="M5 3l14 8-6 1.6L10 19z" /></svg>
        <i className="mx-ripple" />
      </div>
      <p className="mx-earn"><Icon name="coins" size={14} /> +${cat.reward} earned</p>
      <div className="mx-fan">
        {FAN_C.map((id, i) => { const x = PAYOUTS.find((y) => y.id === id); return x ? <span key={id} className={`mx-card k${i}`} style={{ '--h1': x.hue, '--h2': x.hue2 }}><Icon name={x.icon} size={16} /><b>{x.short || x.name}</b><small>Unlocked</small></span> : null; })}
      </div>
      <p className="mx-count"><span className="mx-roll"><i>0</i><i>1</i><i>2</i><i>3</i></span><b>rewards unlocked</b></p>
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
const FAN_P = ['bank', 'paypal', 'giftcards'];
function ProWorld({ pay }) {
  return (
    <div className="hm-scene eb">
      <span className="eb-glow" />
      <span className="eb-ring" />
      <span className="eb-ring r2" />
      {/* coins and notes burst out of the case */}
      {[0, 1, 2, 3, 4, 5].map((k) => <span key={k} className={`eb-coin c${k}`}><b>$</b></span>)}
      {[0, 1].map((k) => <span key={k} className={`eb-note n${k}`}><i /><b>$</b></span>)}
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
      <div className="eb-invite ex-ins">
        <div className="ex-ins-top">
          <span className="eb-invite-ic"><Icon name="mail" size={15} /></span>
          <p><b>Invitation · Healthcare experts</b><small><Icon name="clock" size={11} /> 20 min · <Icon name="coins" size={11} /> Premium reward</small></p>
        </div>
        <p className="ex-ins-k">Your expert insight</p>
        <span className="ex-line l1"><i /></span><span className="ex-line l2"><i /></span><span className="ex-line l3"><i /></span>
        <span className="ex-send"><b>Submit insight</b><em><Icon name="check" size={12} stroke={3} /> Accepted</em></span>
        <svg className="mx-cursor ex-cursor" viewBox="0 0 24 24" width="24" height="24"><path d="M5 3l14 8-6 1.6L10 19z" /></svg>
      </div>
      <div className="mx-fan ex-fan">
        {FAN_P.map((id, i) => { const x = PAYOUTS.find((y) => y.id === id); return x ? <span key={id} className={`mx-card k${i}`}><Icon name={x.icon} size={16} /><b>{x.short || x.name}</b><small>Expert reward</small></span> : null; })}
      </div>
      <p className="mx-count ex-count"><span className="mx-roll"><i>0</i><i>1</i><i>2</i><i>3</i></span><b>premium rewards</b></p>
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

// ── Teen world (v3.4): "Level-Up Portal" — Neon Lagoon colours (deep ocean, aqua, electric lime, coral).
// A holographic portal ring spins with six topic badges riding it; at its centre a player card levels up
// (XP bar fills, "+150 XP" pops, the level number flips). A live poll races below, a parent shield pins on,
// and an equaliser pulses. Only transform / opacity animate.
const TW_TOPICS = [['game', 'Gaming', '#B8FF3C'], ['music', 'Music', '#2EE6CF'], ['cart', 'Snacks', '#FF6B4A'], ['sparkle', 'Style', '#FFD23F'], ['mobile', 'Apps', '#7CC8FF'], ['trophy', 'Sport', '#FF8FD0']];
const TW_POLL = [['Gaming night', 46, '#B8FF3C'], ['Movie marathon', 31, '#2EE6CF'], ['Group chat', 23, '#FF6B4A']];
function TeenWorld() {
  return (
    <div className="hm-scene hxw">
      <div className="tw-portal">
        <span className="tw-ring r1" /><span className="tw-ring r2" /><span className="tw-ring r3" />
        <div className="tw-orbit">
          {TW_TOPICS.map(([ic, t, c], i) => (
            <span key={t} className="tw-topic" style={{ '--a': `${i * 60}deg`, '--c': c }}><span className="tw-topic-in"><Icon name={ic} size={18} /><b>{t}</b></span></span>
          ))}
        </div>
        <div className="tw-card">
          <p className="tw-card-top"><span className="tw-av">AK</span><span><b>Aanya · 15</b><small>Teen Panel</small></span><em className="tw-lvl"><small>LVL</small><span className="tw-flip"><i>6</i><i>7</i></span></em></p>
          <p className="tw-xp"><span>XP</span><i><b /></i><small>850 / 1,000</small></p>
          <p className="tw-plus">+150 XP</p>
          <p className="tw-quest"><Icon name="check" size={13} stroke={3} /> Quest done: <b>Snack taste test</b></p>
        </div>
      </div>
      <div className="tw-poll">
        <p className="tw-poll-q"><span className="tw-live" /> Live poll · <b>Best Friday plan?</b></p>
        {TW_POLL.map(([t, v, c], i) => (
          <p key={t} className="tw-bar" style={{ '--v': v / 100, '--c': c, '--i': i }}><span>{t}</span><i><b /></i><em>{v}%</em></p>
        ))}
      </div>
      <p className="tw-shield"><Icon name="shield" size={16} /><span><b>Parent OK</b><small>consent on file</small></span></p>
      <p className="tw-eq">{Array.from({ length: 7 }).map((_, i) => <i key={i} style={{ '--i': i }} />)}</p>
      <p className="tw-streak"><Icon name="bolt" size={15} /> <b>7-day streak</b></p>
    </div>
  );
}

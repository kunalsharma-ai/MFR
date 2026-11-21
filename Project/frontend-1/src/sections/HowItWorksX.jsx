import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import useInView from '../hooks/useInView.js';
import { NOTIFY_CHANNELS } from '../data/site.js';
import { STEPS } from './JourneyPath.jsx';
import { isCalm } from '../utils/calm.js';

// How it works (v3.2) — every section has its own look, none shared with the home page:
//  hero "reward staircase" · "flip-card journey" · "step rail" · interactive "profile meter" ·
//  "notification orbit" · "two passes" (consumer ticket vs professional card). Transform / opacity only.

const STEP_C = ['#FF8A00', '#2F6BFF', '#14C9B5', '#8B5CF6', '#FF5E7E'];

/* ── hero art: a coin climbs five isometric steps to an opening gift ── */
export function StepStairs() {
  return (
    <div className="hst" aria-hidden="true">
      <span className="hst-glow" />
      {STEPS.map((s, i) => (
        <span key={s.t} className="hst-step" style={{ '--i': i, '--c': STEP_C[i] }}>
          <span className="hst-top"><Icon name={s.icon} size={18} /></span>
          <span className="hst-front"><b>{i + 1}</b>{s.t}</span>
        </span>
      ))}
      <span className="hst-coin">$</span>
      <span className="hst-gift"><i className="lid" /><i className="box" /><i className="rib" /></span>
      {[0, 1, 2, 3, 4, 5].map((k) => <i key={k} className="hst-spark" style={{ '--k': k }} />)}
    </div>
  );
}

/* ── "From hello to reward received" (Round 12): a metro line. A train glides station to station; the station it
   stops at prints a boarding ticket with the details. Tap a station to ride there. Vertical line on phones. ── */
export function FlipJourney() {
  const [vref, visible] = useInView({ once: false, threshold: 0.25 });
  const [on, setOn] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (!visible || hold) return undefined;
    const t = setInterval(() => !isCalm() && setOn((x) => (x + 1) % STEPS.length), 2800);
    return () => clearInterval(t);
  }, [visible, hold]);
  const s = STEPS[on];
  return (
    <section ref={vref} className="section fjr mtr-sec" aria-labelledby="journey-title">
      <div className="container">
        <div className="fjr-head reveal">
          <p className="eyebrow">How it works</p>
          <h2 id="journey-title">From “hello” to <span>“reward received”</span></h2>
          <p className="sec-sub">One line, five stations. Tap a station to ride there.</p>
        </div>
        <div className="mtr" style={{ '--p': on / (STEPS.length - 1), '--c': STEP_C[on] }} onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}>
          <div className="mtr-line" aria-hidden="true"><i /><span className="mtr-train"><b /><b /><em /></span></div>
          <ol className="mtr-stops">
            {STEPS.map((x, i) => (
              <li key={x.t} style={{ '--c': STEP_C[i] }} className={`${i === on ? 'on' : ''}${i < on ? ' done' : ''}`}>
                <button type="button" onClick={() => setOn(i)} aria-pressed={i === on}>
                  <span className="mtr-dot"><Icon name={i < on ? 'check' : x.icon} size={18} stroke={i < on ? 3 : 2} /></span>
                  <span className="mtr-name"><small>Station {i + 1}</small>{x.t}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="mtr-ticket" key={on} aria-live="polite">
            <div className="mtr-tk-main">
              <p className="mtr-tk-k">Boarding pass · stop {on + 1} of {STEPS.length}</p>
              <h3><span className="mtr-tk-ic"><Icon name={s.icon} size={22} /></span>{s.t}</h3>
              <p>{s.d}</p>
            </div>
            <div className="mtr-tk-stub" aria-hidden="true"><small>Next</small><b>{on < STEPS.length - 1 ? STEPS[on + 1].t : 'Ride again'}</b><span className="mtr-tk-bar">{Array.from({ length: 18 }, (_, k) => <i key={k} style={{ '--w': `${1 + ((k * 5 + on) % 3)}px` }} />)}</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Teen Panel route (13–17): same journey, one extra gate: a parent or guardian approves before the account opens.
const TEEN_PATH = [
  ['user', 'Teen details', 'Name, email, gender and a date of birth in the 13–17 range.'],
  ['heart', 'Parent or guardian', 'Mother, father or legal guardian: name, email, phone and date of birth.'],
  ['check', 'Consent boxes', 'Five ticks by hand plus a security code. Nothing submits on its own.'],
  ['mail', 'Parent approves', 'We email the Parent/Guardian Onboarding Form. The account waits until they sign.'],
  ['rocket', 'Teen starts', 'Only then does the teen set a password and see age-appropriate surveys.'],
];
function TeenPath() {
  return (
    <div className="tpa reveal" aria-labelledby="tpa-h">
      <div className="tpa-head">
        <span className="tpa-badge"><Icon name="rocket" size={15} /> Teen Panel · 13–17</span>
        <h3 id="tpa-h">Under 18? Your route has <em>one extra gate</em></h3>
        <p>A parent or guardian approves the account before any survey opens. Login stays locked until they do.</p>
      </div>
      <ol className="tpa-list">
        {TEEN_PATH.map(([ic, t, d], i) => (
          <li key={t} style={{ '--i': i }} className={i === 3 ? 'tpa-lock' : ''}>
            <span className="tpa-ic"><Icon name={ic} size={20} /></span>
            <b>{t}</b>
            <small>{d}</small>
          </li>
        ))}
      </ol>
      <Link to="/sign-up?type=teen" className="tpa-go">Start a teen sign-up <Icon name="arrow" size={16} /></Link>
    </div>
  );
}

/* ── "Every step, unpacked": a glowing centre rail with numbered nodes; cards slide in from alternating sides ── */
export function StepRail({ steps }) {
  return (
    <section className="section srl" aria-labelledby="zz-title">
      <div className="container">
        <div className="sec-head sec-center reveal">
          <p className="eyebrow">Step by step</p>
          <h2 id="zz-title">Every step, unpacked</h2>
          <p className="sec-sub">If you have ever wondered how to earn money online safely, this is the whole process — nothing hidden.</p>
        </div>
        <ol className="srl-list">
          {steps.map((s, i) => (
            <li key={s.t} className={`srl-item reveal${i % 2 ? ' r' : ''}`} style={{ '--c': s.color }}>
              <span className="srl-node" aria-hidden="true"><b>{i + 1}</b></span>
              <article className="srl-card">
                <span className="srl-ico" aria-hidden="true"><Icon name={s.icon} size={30} /></span>
                <em className="srl-big" aria-hidden="true">{i + 1}</em>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
                <ul>{s.bullets.map((b) => <li key={b}><Icon name="check" size={13} stroke={3} /> {b}</li>)}</ul>
              </article>
            </li>
          ))}
        </ol>
        <TeenPath />
      </div>
    </section>
  );
}

/* ── "Profile power": tick profile sections; the ring fills, matching invitations rise and screen-outs fall ── */
const PSECT = [['user', 'About you'], ['briefcase', 'Work'], ['heart', 'Interests'], ['mobile', 'Devices'], ['cart', 'Shopping']];
export function ProfileMeter() {
  const [vref, visible] = useInView({ once: true, threshold: 0.3 });
  const [done, setDone] = useState([true, false, false, false, false]);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!visible || !auto) return undefined;
    const t = setInterval(() => {
      if (isCalm()) return;
      setDone((d) => { const k = d.indexOf(false); return k < 0 ? [true, false, false, false, false] : d.map((x, j) => (j === k ? true : x)); });
    }, 1300);
    return () => clearInterval(t);
  }, [visible, auto]);
  const n = done.filter(Boolean).length;
  const p = n / PSECT.length;
  return (
    <section ref={vref} className="section pmx" aria-labelledby="curve-title">
      <div className="container pmx-row">
        <div className="reveal">
          <p className="eyebrow">Profile power</p>
          <h2 id="curve-title">A fuller profile means better-matched surveys</h2>
          <p className="sec-sub">Researchers look for specific people. Each profile section you complete opens doors to studies that need exactly your background — read our <Link to="/blog/survey-profile-tips-to-qualify-more">profile tips</Link>.</p>
          <div className="pmx-tabs" role="group" aria-label="Try it: tick profile sections">
            {PSECT.map(([ic, t], k) => (
              <button key={t} type="button" className={done[k] ? 'on' : ''} aria-pressed={done[k]} onClick={() => { setAuto(false); setDone((d) => d.map((x, j) => (j === k ? !x : x))); }}>
                <Icon name={done[k] ? 'check' : ic} size={15} stroke={done[k] ? 3 : 2} /> {t}
              </button>
            ))}
          </div>
          <p className="pmx-teen"><Icon name="rocket" size={15} /> <span><b>Teen Panel?</b> Your profile is shorter and age-appropriate: school, hobbies, gaming, music and the apps you use. No work or income questions.</span></p>
          <p className="tiny muted">Illustrative relationship, not a guarantee of survey volume.</p>
        </div>
        <div className="pmx-card reveal" aria-hidden="true">
          <div className="pmx-ring" style={{ '--p': p }}>
            {PSECT.map(([ic], k) => <span key={k} className={`pmx-seg${done[k] ? ' on' : ''}`} style={{ '--k': k }} />)}
            <span className="pmx-core"><b>{Math.round(p * 100)}%</b><small>profile complete</small></span>
          </div>
          <div className="pmx-bars">
            <p><span>Matching invitations</span><i className="up"><b style={{ transform: `scaleX(${0.15 + p * 0.85})` }} /></i></p>
            <p><span>Screen-outs</span><i className="down"><b style={{ transform: `scaleX(${1 - p * 0.75})` }} /></i></p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── "Never miss a survey opportunity": four channels orbit a pulsing invitation and fire into it in turn ── */
export function NotifyOrbit() {
  const [vref, visible] = useInView({ once: false, threshold: 0.2 });
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!visible) return undefined;
    const t = setInterval(() => !isCalm() && setI((x) => (x + 1) % NOTIFY_CHANNELS.length), 2400);
    return () => clearInterval(t);
  }, [visible]);
  const ch = NOTIFY_CHANNELS[i];
  return (
    <section ref={vref} className="section nfo" aria-labelledby="inv-title">
      <div className="container nfo-row">
        <div className="nfo-stage" aria-hidden="true">
          <span className="nfo-wave w1" /><span className="nfo-wave w2" /><span className="nfo-wave w3" />
          {NOTIFY_CHANNELS.map((c, k) => (
            <span key={c.id} className={`nfo-sat s${k}${k === i ? ' on' : ''} ic-${c.id}`}><Icon name={c.icon} size={22} /></span>
          ))}
          <div className="nfo-card" key={ch.id}>
            <span className={`nfo-card-ic ic-${ch.id}`}><Icon name={ch.icon} size={18} /></span>
            <p><b>New survey matches your profile</b><small>via {ch.name} · 12 min · reward shown up front</small></p>
          </div>
        </div>
        <div className="reveal">
          <p className="eyebrow">Survey invitations</p>
          <h2 id="inv-title">Never miss a survey opportunity</h2>
          <p className="sec-sub">Choose the notification method that works best for you and stay updated whenever a new survey matching your profile becomes available.</p>
          <p className="nfo-teen"><Icon name="shield" size={15} /> Teen Panel members are only ever invited to age-appropriate studies, and only after a parent or guardian has approved the account.</p>
          <ul className="nfo-list">
            {NOTIFY_CHANNELS.map((c, k) => (
              <li key={c.id}><button type="button" className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-pressed={k === i}><span className={`nfo-li-ic ic-${c.id}`}><Icon name={c.icon} size={18} /></span><span><b>{c.name}</b><small>{c.line}</small></span></button></li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ── "Consumer, professional or teen": a coral boarding ticket, a navy-and-gold member card and a neon arcade pass ── */
export function TwoPasses() {
  return (
    <section className="section tps" aria-labelledby="cmp-title">
      <div className="container">
        <div className="sec-head sec-center reveal">
          <p className="eyebrow">Three journeys, one platform</p>
          <h2 id="cmp-title">Consumer, professional — or teen</h2>
        </div>
        <div className="tps-row">
          <article className="tps-pass c reveal">
            <span className="tps-holo" aria-hidden="true" />
            <header><Icon name="user" size={20} /><b>Consumer member</b><em>ADMIT ONE</em></header>
            <ul>
              <li>Everyday topics: shopping, food, tech, travel, media</li>
              <li>Short, frequent studies</li>
              <li>Perfect for students, parents, homemakers, retirees</li>
            </ul>
            <Link to="/paid-surveys-for-consumers" className="tps-go">Consumer surveys <Icon name="arrow" size={16} /></Link>
            <span className="tps-stub" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></span>
          </article>
          <span className="tps-and" aria-hidden="true"><b>&amp;</b></span>
          <article className="tps-pass p reveal">
            <span className="tps-holo" aria-hidden="true" />
            <header><Icon name="briefcase" size={20} /><b>Professional member</b><em>EXPERT</em></header>
            <ul>
              <li>B2B topics: software, purchasing, operations, healthcare</li>
              <li>Higher-value studies for verified experts</li>
              <li>Perfect for CXOs, managers, engineers, owners</li>
            </ul>
            <Link to="/paid-surveys-for-professionals" className="tps-go">Professional surveys <Icon name="arrow" size={16} /></Link>
            <span className="tps-chip" aria-hidden="true" />
          </article>
          <span className="tps-and" aria-hidden="true"><b>+</b></span>
          <article className="tps-pass t reveal">
            <span className="tps-holo" aria-hidden="true" />
            <header><Icon name="rocket" size={20} /><b>Teen member</b><em>13–17</em></header>
            <ul>
              <li>Teen topics: gaming, music, snacks, style, apps, school</li>
              <li>Age-appropriate studies, points shown up front</li>
              <li>Opens only after a parent or guardian consents</li>
            </ul>
            <Link to="/paid-surveys-for-teens" className="tps-go">Teen surveys <Icon name="arrow" size={16} /></Link>
            <span className="tps-px" aria-hidden="true">{Array.from({ length: 9 }, (_, k) => <i key={k} style={{ '--k': k }} />)}</span>
          </article>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';
import useInView from '../hooks/useInView.js';
import Icon from '../components/Icon.jsx';
import { COMPANY_SIZES, CONSUMER_DEMOGRAPHICS, CONSUMER_INTERESTS, DEPARTMENTS, INDUSTRIES, JOB_TITLES } from '../data/profiles.js';
import { isCalm } from '../utils/calm.js';

// 1) Job titles — "Career tower": a 3D office tower whose six floors are the seniority tiers (C-suite on top).
//    A glass elevator rides to the selected floor, the floor lights up, and the lobby directory board lists the
//    roles on that floor. Auto-advances while visible (pauses on hover/focus); tap any floor to ride there.
const TIER_ICON = ['star', 'briefcase', 'bolt', 'badge', 'rocket', 'shield'];
export function JobTitleWaterfall() {
  const [vref, visible] = useInView({ once: false, threshold: 0.15 });
  const [t, setT] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (!visible || hold) return undefined;
    const id = setInterval(() => !isCalm() && setT((x) => (x + 1) % JOB_TITLES.length), 4200);
    return () => clearInterval(id);
  }, [visible, hold]);
  const tier = JOB_TITLES[t];
  const n = JOB_TITLES.length;
  return (
    <section ref={vref} className="section tw" aria-labelledby="jt-title" style={{ '--tc': tier.color, '--fl': t }}>
      <div className="tw-sky" aria-hidden="true"><i /><i /></div>
      <div className="container tw-row" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocusCapture={() => setHold(true)} onBlurCapture={() => setHold(false)}>
        <div className="tw-copy reveal">
          <p className="eyebrow">Job titles</p>
          <h2 id="jt-title">Every floor of the <span className="tw-hl">career tower</span> has a voice.</h2>
          <p className="sec-sub">From the boardroom to the shop floor — leaders, managers, specialists, professionals, owners and public servants. Ride the lift to any floor.</p>
          <div className="tw-board" aria-live="polite">
            <p className="tw-board-h"><span className="tw-lcd">{n - t}F</span><span><small>Floor {n - t} · {tier.items.length} roles</small><b>{tier.tier}</b></span><span className="tw-ico"><Icon name={TIER_ICON[t]} size={20} /></span></p>
            <ul className="tw-dir" key={t}>
              {tier.items.map((it, i) => <li key={it} style={{ '--i': i }}><span>{it}</span></li>)}
            </ul>
          </div>
        </div>
        <div className="tw-stage">
          <div className="tw-tower">
            <span className="tw-crown" aria-hidden="true"><i /></span>
            {JOB_TITLES.map((g, i) => (
              <button
                type="button"
                key={g.tier}
                className={`tw-floor ${i === t ? 'on' : ''}`}
                style={{ '--c': g.color, '--i': i }}
                onClick={() => setT(i)}
                aria-pressed={i === t}
                aria-label={`${n - i} ${g.tier}, floor ${n - i}, ${g.items.length} roles`}
              >
                <span className="tw-front">
                  <em>{n - i}</em>
                  <span className="tw-win" aria-hidden="true">{Array.from({ length: 6 }, (_, k) => <i key={k} style={{ '--k': k }} />)}</span>
                  <b>{g.tier}</b>
                </span>
                <span className="tw-side" aria-hidden="true" />
              </button>
            ))}
            <span className="tw-lobby" aria-hidden="true">LOBBY</span>
            <span className="tw-shaft" aria-hidden="true"><span className="tw-car"><i /></span></span>
          </div>
          <span className="tw-ground" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

// 2) Industries — "Industry skyline": each sector is a 2.5D tower; switching groups rebuilds the skyline.
const GROUP_STYLE = [
  { c: '#2F6BFF', c2: '#7AA2FF', icon: 'database' },
  { c: '#E8590C', c2: '#FFB347', icon: 'activity' },
  { c: '#0E9F6E', c2: '#5EE0B0', icon: 'briefcase' },
  { c: '#D6336C', c2: '#FF8FB1', icon: 'eye' },
  { c: '#5C940D', c2: '#A9E34B', icon: 'globe' },
  { c: '#1E3A9E', c2: '#8B5CF6', icon: 'shield' },
];
export function IndustryBento() {
  const [g, setG] = useState(0);
  const grp = INDUSTRIES[g];
  const st = GROUP_STYLE[g % GROUP_STYLE.length];
  return (
    <section className="section sky" aria-labelledby="ind-title" style={{ '--c': st.c, '--c2': st.c2 }}>
      <div className="sky-sun" aria-hidden="true" />
      <div className="container">
        <div className="sky-head reveal">
          <div>
            <p className="eyebrow">Industries</p>
            <h2 id="ind-title">Every sector. <span className="hl-orange">Every specialism.</span></h2>
            <p className="sec-sub">Pick a sector and watch its skyline rise — each tower is an industry our professional members work in.</p>
          </div>
          <div className="sky-tabs" role="tablist" aria-label="Industry groups">
            {INDUSTRIES.map((x, i) => {
              const s2 = GROUP_STYLE[i % GROUP_STYLE.length];
              return (
                <button type="button" key={x.group} role="tab" aria-selected={g === i} className={g === i ? 'on' : ''} style={{ '--tc': s2.c }} onClick={() => setG(i)}>
                  <Icon name={s2.icon} size={16} /> {x.group} <b>{x.items.length}</b>
                </button>
              );
            })}
          </div>
        </div>
        <ul className="sky-city" key={g} aria-label={`${grp.group} industries`}>
          {grp.items.map((it, i) => (
            <li key={it} className="sky-b" style={{ '--i': i, '--h': `${120 + ((i * 53 + g * 31) % 5) * 26}px` }}>
              <span className="sky-face"><span className="sky-win" aria-hidden="true" /><strong>{it}</strong></span>
            </li>
          ))}
        </ul>
        <div className="sky-ground" aria-hidden="true" />
      </div>
    </section>
  );
}

// 3) Departments — "Org honeycomb" (v3.2): every department is a glowing hex; a light wave rolls out from the
//    briefcase hub and a "Survey for you" pin hops from hex to hex. Company sizes grow as bubbles of people.
const DEPT_IC = ['star', 'layers', 'coins', 'bank', 'trend', 'sparkle', 'volume', 'calendar', 'cart', 'basket', 'database', 'user', 'key', 'check', 'bolt', 'pen', 'refresh', 'rocket', 'gift', 'send', 'lock', 'shield', 'headset', 'book', 'chat', 'hub', 'medical', 'clipboard', 'audit'];
const HUB_AT = 12;
export function DepartmentWheel() {
  const [vref, visible] = useInView({ once: false, threshold: 0.2 });
  const [on, setOn] = useState(3);
  useEffect(() => {
    if (!visible) return undefined;
    const t = setInterval(() => !isCalm() && setOn((x) => (x * 7 + 5) % DEPARTMENTS.length), 1900);
    return () => clearInterval(t);
  }, [visible]);
  const cells = [...DEPARTMENTS];
  cells.splice(HUB_AT, 0, null);
  const rows = [];
  for (let r = 0; r < cells.length; r += 5) rows.push(cells.slice(r, r + 5));
  return (
    <section ref={vref} className="section dhx" aria-labelledby="dept-title">
      <div className="container dhx-row">
        <div className="dhx-copy reveal">
          <p className="eyebrow">Departments</p>
          <h2 id="dept-title">Wherever you sit in the org chart.</h2>
          <p className="sec-sub">Finance to field engineering, procurement to people teams — researchers need perspectives from every function.</p>
          <ul className="sr-only">{DEPARTMENTS.map((d) => <li key={d}>{d}</li>)}</ul>
          <div className="dhx-sizes" role="group" aria-label="Company sizes">
            <p className="dhx-sizes-t"><Icon name="briefcase" size={15} /> Every company size</p>
            <ol>
              {COMPANY_SIZES.map((s, i) => (
                <li key={s} style={{ '--i': i }}>
                  <span className="dhx-bub" aria-hidden="true">{Array.from({ length: 1 + i * 3 }, (_, k) => <i key={k} style={{ '--k': k }} />)}</span>
                  <small>{s}</small>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="dhx-comb" aria-hidden="true">
          {rows.map((row, r) => (
            <div key={r} className={`dhx-line${r % 2 ? ' odd' : ''}`}>
              {row.map((d, c) => {
                const idx = r * 5 + c;
                if (d === null) return <span key="hub" className="dhx-hex hub" style={{ '--d': 0 }}><span><Icon name="briefcase" size={30} /><b>Every function</b></span></span>;
                const di = idx > HUB_AT ? idx - 1 : idx;
                const dist = Math.hypot(r - 2, c + (r % 2 ? 0.5 : 0) - 2);
                return (
                  <span key={d} className={`dhx-hex${di === on ? ' on' : ''}`} style={{ '--d': dist.toFixed(2), '--h': `${(di * 37) % 360}` }}>
                    <span><Icon name={DEPT_IC[di % DEPT_IC.length]} size={20} /><b>{d}</b></span>
                    {di === on ? <em className="dhx-pin"><Icon name="mail" size={12} /> Survey for you</em> : null}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 4) Consumer interests — "Interest dial": 12 interests around a ring; the hub shows who each one covers.
//    Auto-turns while visible; pauses on hover/focus.
const INT_COLORS = ['#FF5E7E', '#FF8A00', '#2F6BFF', '#14C9B5', '#0E9F6E', '#7048E8', '#E8457A', '#D6336C', '#E5A100', '#C77700', '#E8590C', '#0EA5A0'];
export function InterestMosaic() {
  const [vref, visible] = useInView({ once: false, threshold: 0.2 });
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const n = CONSUMER_INTERESTS.length;
  useEffect(() => {
    if (!visible || hold) return undefined;
    const t = setInterval(() => !isCalm() && setI((x) => (x + 1) % n), 3400);
    return () => clearInterval(t);
  }, [visible, hold, n]);
  const c = CONSUMER_INTERESTS[i];
  const col = INT_COLORS[i % INT_COLORS.length];
  return (
    <section ref={vref} className="section idl" aria-labelledby="int-title" style={{ '--c': col }}>
      <div className="container idl-row">
        <div className="idl-copy reveal">
          <p className="eyebrow">Consumer profiles</p>
          <h2 id="int-title">Whatever you love, <span className="hl-pink">someone wants your take.</span></h2>
          <p className="sec-sub">Turn the dial: every interest is a world of surveys. Pick the ones that sound like you.</p>
          <ul className="idl-legend">
            {CONSUMER_INTERESTS.map((x, k) => (
              <li key={x.id}><button type="button" className={k === i ? 'on' : ''} style={{ '--c': INT_COLORS[k % INT_COLORS.length] }} onClick={() => setI(k)} aria-pressed={k === i}>{x.label}</button></li>
            ))}
          </ul>
        </div>
        <div className="idl-dial" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocusCapture={() => setHold(true)} onBlurCapture={() => setHold(false)}>
          <span className="idl-track" aria-hidden="true" />
          <span className="idl-pointer" style={{ '--a': `${(360 / n) * i}deg` }} aria-hidden="true" />
          {CONSUMER_INTERESTS.map((x, k) => (
            <button type="button" key={x.id} className={`idl-knob ${k === i ? 'on' : ''}`} style={{ '--a': `${(360 / n) * k}deg`, '--c': INT_COLORS[k % INT_COLORS.length] }} onClick={() => setI(k)} aria-label={x.label} aria-pressed={k === i}>
              <span><Icon name={x.icon} size={20} /></span>
            </button>
          ))}
          <div className="idl-hub" key={c.id} aria-live="polite">
            <span className="idl-hub-ico"><Icon name={c.icon} size={26} /></span>
            <h3>{c.label}</h3>
            <ul>{c.items.map((x, k) => <li key={x} style={{ '--k': k }}>{x}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// 5) Demographics — "Demographic explorer": ordered dimensions rise as a 3D staircase,
//    unordered ones flip in as tiles. No counts or percentages (by design).
const DEMO_STYLE = {
  'Life stage': { c: '#FF8A00', icon: 'clock', stairs: true },
  Education: { c: '#7048E8', icon: 'book', stairs: true },
  Occupation: { c: '#14C9B5', icon: 'briefcase', stairs: false },
  Household: { c: '#FF3B8D', icon: 'heart', stairs: false },
  'Income bands': { c: '#2F6BFF', icon: 'coins', stairs: true },
};
export function DemographicRibbons() {
  const [i, setI] = useState(0);
  const d = CONSUMER_DEMOGRAPHICS[i];
  const st = DEMO_STYLE[d.label] || { c: '#FF8A00', icon: 'user', stairs: false };
  return (
    <section className="section dex" aria-labelledby="demo-title" style={{ '--c': st.c }}>
      <div className="container">
        <div className="dex-head reveal">
          <p className="eyebrow eyebrow-light">Demographics</p>
          <h2 id="demo-title">Every age. Every stage. Every background.</h2>
        </div>
        <div className="dex-row">
          <div className="dex-tabs" role="tablist" aria-label="Demographic dimensions">
            {CONSUMER_DEMOGRAPHICS.map((x, k) => {
              const s2 = DEMO_STYLE[x.label] || {};
              return (
                <button type="button" role="tab" key={x.label} aria-selected={k === i} className={k === i ? 'on' : ''} style={{ '--c': s2.c }} onClick={() => setI(k)}>
                  <span className="dex-ti"><Icon name={s2.icon || 'user'} size={18} /></span> {x.label} <b>{x.items.length}</b>
                </button>
              );
            })}
          </div>
          <div className={`dex-stage ${st.stairs ? 'is-stairs' : 'is-tiles'}`} key={d.label} role="tabpanel" aria-label={d.label}>
            {st.stairs ? (
              <ol className="dex-stairs">
                {d.items.map((x, k) => (
                  <li key={x} style={{ '--k': k, '--h': `${36 + (k / Math.max(d.items.length - 1, 1)) * 64}%` }}>
                    <span className="dex-step"><b>{x}</b></span>
                  </li>
                ))}
              </ol>
            ) : (
              <ul className="dex-tiles">
                {d.items.map((x, k) => <li key={x} style={{ '--k': k }}><span>{x}</span></li>)}
              </ul>
            )}
            <p className="dex-note">{st.stairs ? 'From first step to the top — every level is welcome.' : 'Whatever your day looks like, there is a survey for it.'}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

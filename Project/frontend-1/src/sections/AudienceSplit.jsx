import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import useInView from '../hooks/useInView.js';


const SIDES = {
  c: {
    tag: 'For consumers',
    title: 'Shop it. Rate it. Get paid for it.',
    line: 'What you buy, watch, drive, eat and play shapes the next generation of products.',
    chips: [['cart', 'Shopping'], ['heart', 'Food & drinks'], ['mobile', 'Tech & apps'], ['globe', 'Travel'], ['star', 'Gaming'], ['sparkle', 'Beauty']],
    to: '/paid-surveys-for-consumers',
    cta: 'Earn as a consumer',
    icon: 'user',
    stats: [['$4–$7', 'typical survey'], ['10–18', 'minutes']],
  },
  p: {
    tag: 'For professionals',
    title: 'Your expertise has a market rate.',
    line: 'CXOs, managers, engineers, clinicians and founders earn for expert B2B opinions.',
    chips: [['star', 'C-suite'], ['database', 'IT decision-makers'], ['medical', 'Healthcare'], ['activity', 'Manufacturing'], ['coins', 'Finance'], ['clipboard', 'Procurement']],
    to: '/paid-surveys-for-professionals',
    cta: 'Earn as a professional',
    icon: 'briefcase',
    stats: [['Higher', 'B2B rewards'], ['Verified', 'members only']],
  },
};

function World({ id }) {
  const s = SIDES[id];
  return (
    <div className={`ws ws-${id}`}>
      <span className="ws-orb o1" aria-hidden="true" /><span className="ws-orb o2" aria-hidden="true" />
      <div className="ws-copy">
        <span className="ws-tag"><Icon name={s.icon} size={15} /> {s.tag}</span>
        <h3>{s.title}</h3>
        <p>{s.line}</p>
        <ul className="ws-chips">{s.chips.map(([ic, t], i) => <li key={t} style={{ '--i': i }}><Icon name={ic} size={13} /> {t}</li>)}</ul>
        <ul className="ws-stats">{s.stats.map(([b, t]) => <li key={t}><b>{b}</b><small>{t}</small></li>)}</ul>
        <Link to={s.to} className="ws-cta">{s.cta} <Icon name="arrow" size={18} /></Link>
      </div>
      <div className="ws-art" aria-hidden="true">
        <span className="ws-icon"><Icon name={s.icon} size={64} stroke={1.4} /></span>
        {s.chips.slice(0, 4).map(([ic], i) => <span key={ic} className={`ws-sat s${i}`}><Icon name={ic} size={18} /></span>)}
      </div>
    </div>
  );
}

const AUTO_MS = 4200;

export default function AudienceSplit() {
  const [x, setX] = useState(50);
  const [ref, seen] = useInView({ threshold: 0.4 });
  const [demo, setDemo] = useState(false);
  const [auto, setAuto] = useState(false);
  const [side, setSide] = useState('c');
  const stage = useRef(null);
  const drag = useRef(false);
  const idle = useRef(0);
  const hold = useRef(false);
  // While in view, the two worlds take turns: consumer fills the stage, then professional, every few seconds.
  // Hover, drag or a pick pauses it; it picks up again after a short idle.
  useEffect(() => {
    if (!seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    setDemo(true);
    setAuto(true);
    let cur = 'c';
    const go = () => {
      if (hold.current || document.hidden || Date.now() < idle.current) return;
      setX(cur === 'c' ? 90 : 10);
      setSide(cur);
      cur = cur === 'c' ? 'p' : 'c';
    };
    const t0 = setTimeout(go, 500);
    const iv = setInterval(go, AUTO_MS);
    return () => { clearTimeout(t0); clearInterval(iv); setAuto(false); };
  }, [seen]);
  const pause = (ms = 9000) => { idle.current = Date.now() + ms; };
  const fromEvent = (e) => {
    const r = stage.current.getBoundingClientRect();
    const px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    setX(Math.max(6, Math.min(94, (px / r.width) * 100)));
  };
  const pick = (s) => { pause(); setDemo(true); setSide(s); setX(s === 'c' ? 90 : 10); };
  return (
    <section className="section cmp" aria-labelledby="split-title" ref={ref}>
      <div className="container">
        <div className="cmp-head reveal">
          <p className="eyebrow">Two ways to earn</p>
          <h2 id="split-title">Who are you <em>today?</em></h2>
          <p className="sec-sub">The two worlds take turns. Drag the handle any time to compare them.</p>
        </div>
        <div
          className={`cmp-stage ${demo ? 'is-demo' : ''} ${auto ? 'is-auto' : ''} on-${side}`}
          ref={stage}
          style={{ '--x': `${x}%`, '--auto': `${AUTO_MS}ms` }}
          onMouseEnter={() => { hold.current = true; }}
          onMouseLeave={() => { hold.current = false; drag.current = false; pause(2500); }}
          onPointerDown={(e) => { if (e.target.closest('a, input, button')) return; drag.current = true; setDemo(false); pause(); fromEvent(e); }}
          onPointerMove={(e) => drag.current && fromEvent(e)}
          onPointerUp={() => { drag.current = false; setDemo(true); }}
        >
          <div className="cmp-layer l-c"><World id="c" /></div>
          <div className="cmp-layer l-p"><World id="p" /></div>
          <div className="cmp-handle" aria-hidden="true"><span><Icon name="arrow" size={14} /><Icon name="arrow" size={14} /></span></div>
          <button type="button" className="cmp-pick c" onClick={() => pick('c')}>Consumer</button>
          <button type="button" className="cmp-pick p" onClick={() => pick('p')}>Professional</button>
          <div className="cmp-dots">
            <button type="button" aria-label="Show consumer side" className={side === 'c' ? 'on' : ''} key={`c${side}`} onClick={() => pick('c')}><i /></button>
            <button type="button" aria-label="Show professional side" className={side === 'p' ? 'on' : ''} key={`p${side}`} onClick={() => pick('p')}><i /></button>
          </div>
          <label className="sr-only" htmlFor="cmp-range">Compare consumer and professional</label>
          <input id="cmp-range" className="cmp-range" type="range" min="6" max="94" value={Math.round(x)} onChange={(e) => { pause(); setX(+e.target.value); }} />
        </div>
      </div>
    </section>
  );
}

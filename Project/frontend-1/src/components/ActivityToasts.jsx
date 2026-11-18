import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { Flag } from './CountryPicker.jsx';
import { METHOD_INFO, NON_MONEY } from '../utils/payouts.js';
import useActivityFeed, { initials } from '../hooks/useActivityFeed.js';
import { prefersReducedMotion, session } from '../utils/storage.js';
import { audioReady, coinSound } from '../utils/sound.js';


const SHOW_MS = 5600;


function CountUp({ value }) {
  const m = /^(\D*)([\d,]+(?:\.\d+)?)(.*)$/.exec(String(value || ''));
  const target = m ? Number(m[2].replace(/,/g, '')) : 0;
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!m) return undefined;
    let raf = 0;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 900);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    
  }, [value]);
  if (!m) return value;
  return `${m[1]}${n.toLocaleString('en-US')}${m[3]}`;
}
const Burst = () => <span className="rwt-burst" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</span>;
// v3.0 dress: a spinning glow ring, a light sweep and a short coin shower behind the card's content.
const Fx = () => (
  <>
    <span className="rwt-ring" aria-hidden="true"><i /></span>
    <span className="rwt-sweep" aria-hidden="true" />
    <span className="rwt-rain" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</span>
    <span className="rwt-stars" aria-hidden="true">{Array.from({ length: 4 }, (_, i) => <i key={i} style={{ '--i': i }}>✦</i>)}</span>
  </>
);

export default function ActivityToasts() {
  const { items, isPreview, pulse } = useActivityFeed();
  const [cur, setCur] = useState(null);
  const [show, setShow] = useState(false);
  const [muted, setMuted] = useState(false);
  const [n, setN] = useState(0);
  const last = useRef(-1);

  useEffect(() => {
    setMuted(Boolean(session.get('mfr_toasts_muted', false)));
  }, []);

  useEffect(() => {
    if (muted) return undefined;
    let t1;
    let t2;
    let k = 0;
    const pickReal = () => {
      let i = Math.floor(Math.random() * items.length);
      if (i === last.current && items.length > 1) i = (i + 1) % items.length;
      last.current = i;
      return items[i];
    };
    const cycle = () => {
      if (document.hidden) { t2 = setTimeout(cycle, 4000); return; }
      k += 1;
     
      const usePulse = !items.length || k % 4 === 0;
      setCur(usePulse ? pulse[(k * 3) % pulse.length] : pickReal());
      setN((x) => x + 1);
      setShow(true);
      // Only after the visitor has interacted (browsers block audio before that) and only with sound on.
      if (audioReady()) setTimeout(coinSound, 320);
      t1 = setTimeout(() => setShow(false), SHOW_MS);
      t2 = setTimeout(cycle, SHOW_MS + 7000 + Math.random() * 7000);
    };
    t2 = setTimeout(cycle, prefersReducedMotion() ? 10000 : 7000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [items, pulse, muted]);

  if (!cur || muted) return null;
  const close = (
    <button
      type="button"
      className="rwt-x"
      aria-label="Hide reward notifications"
      onClick={() => {
        session.set('mfr_toasts_muted', true);
        setMuted(true);
      }}
    >
      <Icon name="close" size={12} />
    </button>
  );

  if (cur.kind === 'pulse') {
    return (
      <div key={n} className={`rwt is-pulse ${show ? 'is-in' : ''}`} style={{ '--tone': cur.tone }} role="status" aria-live="polite">
        <Fx />
        <Burst />
        <div className="rwt-av"><Icon name={cur.icon} size={18} /><span className="rwt-spark" aria-hidden="true" /></div>
        <div className="rwt-body">
          <p className="rwt-tag"><span aria-hidden="true">✦</span> Community pulse</p>
          <p className="rwt-l1"><strong className="rwt-amt">{cur.big}</strong> {cur.line}</p>
          <p className="rwt-l3"><i /> MyFrequentRewards community</p>
        </div>
        {close}
        <span className="rwt-bar" aria-hidden="true" />
      </div>
    );
  }

  const info = METHOD_INFO[cur.method] || { icon: 'wallet', hue: '#0B1E5B', hue2: '#2F6BFF' };
  const biz = cur.segment === 'business';
  const nonMoney = NON_MONEY.includes(cur.method) || !cur.amount;
  return (
    <div key={n} className={`rwt ${biz ? 'is-biz' : 'is-con'} ${show ? 'is-in' : ''}`} style={{ '--h1': info.hue, '--h2': info.hue2 }} role="status" aria-live="polite">
      <Fx />
      <Burst />
      <div className="rwt-av">
        {initials(cur.name)}
        {nonMoney ? null : <span className="rwt-plus" aria-hidden="true">+{cur.amount}</span>}
        <i className="rwt-coin" aria-hidden="true"><Icon name={info.icon} size={11} stroke={2.2} /></i>
      </div>
      <div className="rwt-body">
        <p className="rwt-tag"><span aria-hidden="true">✦</span> Reward paid out</p>
        <p className="rwt-l1">
          <b>{cur.name}</b> {nonMoney ? <>received a <strong className="rwt-amt">{cur.method}</strong></> : <>earned <strong className="rwt-amt"><CountUp value={cur.amount} /></strong></>}
        </p>
        <p className="rwt-l2">
          {nonMoney ? null : <span className="rwt-m"><Icon name={info.icon} size={11} stroke={2.2} /> {cur.method}</span>}
          <span className="rwt-place"><Flag iso={cur.iso} size={10} /> {String(cur.place || '').split(',')[0]}{cur.ago ? ` · ${cur.ago}` : ''}</span>
        </p>
        <p className="rwt-l3"><i /> {cur.role}{cur.role ? ' · ' : ''}{biz ? 'Professional' : 'Consumer'}{isPreview ? <em className="rwt-prev">Preview</em> : null}</p>
      </div>
      {close}
      <span className="rwt-bar" aria-hidden="true" />
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { Flag } from './CountryPicker.jsx';
import { METHOD_INFO, NON_MONEY } from '../utils/payouts.js';
import useActivityFeed, { initials } from '../hooks/useActivityFeed.js';
import { prefersReducedMotion } from '../utils/storage.js';
import { dismiss, isDismissed } from '../utils/dismiss.js';
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
  const { items, isPreview } = useActivityFeed();
  const [cur, setCur] = useState(null);
  const [show, setShow] = useState(false);
  const [muted, setMuted] = useState(false);
  const [n, setN] = useState(0);
  const last = useRef(-1);

  useEffect(() => {
    setMuted(isDismissed('reward-toasts'));
  }, []);

  useEffect(() => {
    if (muted) return undefined;
    let t1;
    let t2;
    const pickReal = () => {
      let i = Math.floor(Math.random() * items.length);
      if (i === last.current && items.length > 1) i = (i + 1) % items.length;
      last.current = i;
      return items[i];
    };
    const cycle = () => {
      if (document.hidden) { t2 = setTimeout(cycle, 4000); return; }
     
      // Only real "reward paid" notes are shown (the "Community pulse" survey notes were removed, Kunal 18 Nov).
      if (!items.length) { t2 = setTimeout(cycle, 15000); return; }
      setCur(pickReal());
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
  }, [items, muted]);

  if (!cur || muted) return null;
  const close = (
    <button
      type="button"
      className="rwt-x"
      aria-label="Hide reward notifications"
      onClick={() => {
        dismiss('reward-toasts');
        setMuted(true);
      }}
    >
      <Icon name="close" size={12} />
    </button>
  );

  const info = METHOD_INFO[cur.method] || { icon: 'wallet', hue: '#0B1E5B', hue2: '#2F6BFF' };
  const biz = cur.segment === 'business';
  const nonMoney = NON_MONEY.includes(cur.method) || !cur.amount;
  // v3.0 layout: method disc with a turning gold ring · "Reward paid" pill, time and Preview tag · "Name earned $X" ·
  // payout-method chip with the member's flag and city.
  return (
    <div key={n} className={`rwt rwt-v2 ${biz ? 'is-biz' : 'is-con'} ${show ? 'is-in' : ''}`} style={{ '--h1': info.hue, '--h2': info.hue2 }} role="status" aria-live="polite">
      <Fx />
      <Burst />
      <div className="rv2-ic" aria-hidden="true">
        <span className="rv2-ring" />
        <span className="rv2-disc"><Icon name={info.icon} size={20} stroke={2} /></span>
        {nonMoney ? null : <span className="rwt-plus">+{cur.amount}</span>}
      </div>
      <div className="rwt-body rv2-body">
        <p className="rv2-top">
          <span className="rv2-paid"><i /> Reward paid</span>
          {cur.ago ? <span className="rv2-ago">{cur.ago}</span> : null}
          {isPreview ? <em className="rv2-prev">Preview</em> : null}
        </p>
        <p className="rv2-l1">
          <b>{cur.name}</b> {nonMoney ? <>received a <strong className="rv2-amt">{cur.method}</strong></> : <>earned <strong className="rv2-amt"><CountUp value={cur.amount} /></strong></>}
        </p>
        <p className="rv2-l3">
          <span className="rv2-chip"><Icon name={info.icon} size={12} stroke={2.2} /> {cur.method}</span>
          <span className="rv2-place"><Flag iso={cur.iso} size={14} /> {String(cur.place || '')}</span>
        </p>
      </div>
      {close}
      <span className="rwt-bar" aria-hidden="true" />
    </div>
  );
}

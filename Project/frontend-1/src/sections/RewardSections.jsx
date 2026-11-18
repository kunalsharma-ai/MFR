import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import useInView from '../hooks/useInView.js';
import { NOTIFY_CHANNELS, PAYOUTS, REWARD_KINDS } from '../data/site.js';
import useActivityFeed, { initials } from '../hooks/useActivityFeed.js';
import { isCalm } from '../utils/calm.js';

// Survey Invitations — phone mock-up with channel-synced notifications
const NOTES = {
  dashboard: { app: 'MFR Dashboard', msg: 'A new survey matches your profile · Tech & Apps · ~12 min', time: 'now' },
  sms: { app: 'SMS · MFR', msg: 'New paid survey available for you. Open your dashboard to start.', time: '1m' },
  whatsapp: { app: 'WhatsApp · MyFrequentRewards', msg: '🎯 Survey match! Business software study for IT managers.', time: '2m' },
  email: { app: 'Email · invitations@', msg: 'Your invitation: Travel Experience Study — details inside.', time: '3m' },
};

export function InvitationsPhone() {
  const [vref, visible] = useInView({ once: false, threshold: 0, rootMargin: '100px 0px' });
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return undefined;
    if (!visible) return undefined; // pause when off-screen
    const t = setInterval(() => !isCalm() && setI((x) => (x + 1) % NOTIFY_CHANNELS.length), 2800);
    return () => clearInterval(t);
  }, [paused, visible]);
  const ch = NOTIFY_CHANNELS[i];
  return (
    <section ref={vref} className="section invites" aria-labelledby="inv-title">
      <div className="container inv-row">
        <div className="inv-copy reveal">
          <p className="eyebrow">Survey Invitations</p>
          <h2 id="inv-title">Never miss a survey opportunity</h2>
          <p className="sec-sub">Choose the notification method that works best for you and stay updated whenever a new survey matching your profile becomes available.</p>
          <ul className="inv-channels" onMouseLeave={() => setPaused(false)}>
            {NOTIFY_CHANNELS.map((c, k) => (
              <li key={c.id}>
                <button type="button" className={k === i ? 'on' : ''} onMouseEnter={() => { setPaused(true); setI(k); }} onFocus={() => { setPaused(true); setI(k); }} onClick={() => setI(k)}>
                  <span className={`inv-ico ic-${c.id}`}><Icon name={c.icon} size={22} /></span>
                  <span><strong>{c.name}</strong><small>{c.line}</small></span>
                  <span className="inv-bar" />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="phone-wrap reveal" aria-hidden="true">
          <div className="phone">
            <div className="phone-notch" />
            <div className="phone-screen">
              <p className="ph-time">9:41</p>
              <p className="ph-date">Your next reward is one tap away</p>
              <div className="ph-stack">
                {NOTIFY_CHANNELS.map((c, k) => {
                  const pos = (k - i + NOTIFY_CHANNELS.length) % NOTIFY_CHANNELS.length;
                  return (
                    <div key={c.id} className={`ph-note pos-${pos} nt-${c.id}`}>
                      <span className={`inv-ico ic-${c.id}`}><Icon name={c.icon} size={16} /></span>
                      <div><b>{NOTES[c.id].app}</b><small>{NOTES[c.id].time}</small><p>{NOTES[c.id].msg}</p></div>
                    </div>
                  );
                })}
              </div>
              <div className="ph-active">{ch.name}</div>
            </div>
          </div>
          <div className="phone-glow" />
        </div>
      </div>
    </section>
  );
}

// Rewards page — "Reward explorer": filter by kind, 3D flip cards (front: the reward, back: how it lands)
const LANDS = {
  paypal: ['PayPal email', 'Wallet balance'], cash: ['Your account details', 'Cash reward'], bank: ['Verified bank account', 'Bank credit'],
  wire: ['Bank / SWIFT details', 'International transfer'], upi: ['UPI ID (India only)', 'Instant bank credit'], shopping: ['Email for delivery', 'Store voucher'],
  grocery: ['Email for delivery', 'Grocery voucher'], giftcards: ['Email for delivery', 'Digital gift code'],
};
// Rewards (v2.6) — two completely different worlds:
//  • Consumers: "Scratch & Win" — a strip of lottery tickets. Every few seconds a coin scratches the silver foil off
//    the next ticket and a reward pops out with confetti; tap any ticket to scratch it yourself.
//  • Professionals: "Payout Route" — a fintech console. The honorarium travels as a glowing packet through
//    Study completed → Quality verified → Approved → the payout rail you choose, then shows a "Settled" receipt.
// Both cycle through the eight real reward types, pause off-screen / on hover / when the page is calm.
function useCycle(n, ms, visible, hold) {
  const [sel, setSel] = useState(0);
  useEffect(() => {
    if (!visible || hold) return undefined;
    const t = setInterval(() => !isCalm() && setSel((x) => (x + 1) % n), ms);
    return () => clearInterval(t);
  }, [visible, hold, n, ms]);
  return [sel, setSel];
}

function ScratchRewards({ title, sub }) {
  const [vref, visible] = useInView({ once: false, threshold: 0.15 });
  const [hold, setHold] = useState(false);
  const [sel, setSel] = useCycle(PAYOUTS.length, 3200, visible, hold);
  const [opened, setOpened] = useState(() => new Set());
  useEffect(() => {
    setOpened((o) => {
      const n = new Set(o);
      if (n.size >= PAYOUTS.length) n.clear(); // every ticket scratched → fresh tickets
      n.add(sel);
      return n;
    });
  }, [sel]);
  const p = PAYOUTS[sel];
  const kind = REWARD_KINDS[p.kind];
  return (
    <section ref={vref} className="section scw" aria-labelledby="scw-title" style={{ '--h1': p.hue, '--h2': p.hue2 }}>
      <div className="scw-bg" aria-hidden="true"><i /><i /><i /></div>
      <div className="container">
        <div className="scw-head reveal">
          <p className="eyebrow">Rewards · scratch &amp; win</p>
          <h2 id="scw-title">{title || <>Get rewarded <span className="scw-hl">your way</span></>}</h2>
          <p className="sec-sub">{sub || 'Every completed survey adds to your balance — then you choose how it pays out. Scratch a ticket to reveal each of the eight rewards.'}</p>
        </div>
        <ul className="scw-strip" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocusCapture={() => setHold(true)} onBlurCapture={() => setHold(false)}>
          {PAYOUTS.map((r, i) => {
            const open = opened.has(i);
            return (
              <li key={r.id} className={`scw-t ${open ? 'open' : ''} ${i === sel ? 'now' : ''}`} style={{ '--h1': r.hue, '--h2': r.hue2, '--i': i }}>
                <button type="button" onClick={() => setSel(i)} aria-pressed={i === sel} aria-label={`${r.short} ${r.only === 'IN' ? 'India only' : 'You win'}: scratch to reveal ${r.name}`}>
                  <span className="scw-prize">
                    <span className="scw-ico"><Icon name={r.icon} size={26} /></span>
                    <b>{r.short}</b>
                    <small>{r.only === 'IN' ? 'India only' : 'You win'}</small>
                  </span>
                  <span className="scw-foil" aria-hidden="true"><em>SCRATCH</em><i>?</i></span>
                  {i === sel ? <span className="scw-coin" key={`c${sel}`} aria-hidden="true">$</span> : null}
                  {i === sel ? <span className="scw-pop" key={`p${sel}`} aria-hidden="true">{Array.from({ length: 8 }, (_, k) => <i key={k} style={{ '--k': k }} />)}</span> : null}
                  <span className="scw-no" aria-hidden="true">No. 00{i + 1}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="scw-win" aria-live="polite" key={p.id}>
          <span className="scw-win-ico"><Icon name={p.icon} size={26} /></span>
          <div>
            <p className="rgx-kind" style={{ '--kc': kind.c }}><i />{kind.label}</p>
            <h3>{p.name}</h3>
            <p>{p.line}</p>
          </div>
          <ul className="scw-facts">
            <li><small>You provide</small><b>{LANDS[p.id][0]}</b></li>
            <li><small>Lands as</small><b>{LANDS[p.id][1]}</b></li>
            <li><small>Available</small><b>{p.only === 'IN' ? 'India only' : 'All member countries'}</b></li>
          </ul>
          <Link to="/rewards" className="scw-link">How claims work <Icon name="arrow" size={16} /></Link>
        </div>
      </div>
    </section>
  );
}

const ROUTE = [['clipboard', 'Study completed'], ['shield', 'Quality verified'], ['badge', 'Honorarium approved']];
function PayoutRoute() {
  const [vref, visible] = useInView({ once: false, threshold: 0.15 });
  const [hold, setHold] = useState(false);
  const [sel, setSel] = useCycle(PAYOUTS.length, 5200, visible, hold);
  const p = PAYOUTS[sel];
  return (
    <section ref={vref} className="section prt" aria-labelledby="prt-title" style={{ '--h1': p.hue, '--h2': p.hue2 }}>
      <div className="prt-bg" aria-hidden="true"><span className="prt-grid" /><i /><i /></div>
      <div className="container prt-row">
        <div className="prt-copy reveal">
          <p className="eyebrow">Rewards for professionals</p>
          <h2 id="prt-title">Your expertise, <span className="prt-hl">paid your way</span></h2>
          <p className="sec-sub">Every honorarium is routed to the payout rail you choose — the same eight options as consumers, with UPI for members in India. Pick a rail and watch it settle.</p>
          <ul className="prt-rails" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocusCapture={() => setHold(true)} onBlurCapture={() => setHold(false)}>
            {PAYOUTS.map((r, i) => (
              <li key={r.id} style={{ '--h1': r.hue, '--h2': r.hue2 }}>
                <button type="button" className={i === sel ? 'on' : ''} onClick={() => setSel(i)} aria-pressed={i === sel}>
                  <span className="prt-ri"><Icon name={r.icon} size={16} /></span>
                  <span>{r.short}</span>
                  {r.only === 'IN' ? <em>IN</em> : null}
                </button>
              </li>
            ))}
          </ul>
          <Link to="/rewards" className="link-arrow prt-link">How claims work <Icon name="arrow" size={16} /></Link>
        </div>
        <div className="prt-console" aria-live="polite">
          <div className="prt-top"><span className="prt-dots" aria-hidden="true"><i /><i /><i /></span><b>Honorarium transfer</b><span className="prt-live"><i /> Live route</span></div>
          <div className="prt-flow" key={p.id}>
            {ROUTE.map(([ic, t], i) => (
              <div className="prt-node" key={t} style={{ '--n': i }}>
                <span className="prt-dot"><Icon name={ic} size={16} /></span>
                <p><b>{t}</b><small>Step {i + 1}</small></p>
                <span className="prt-ok" aria-hidden="true"><Icon name="check" size={12} stroke={3} /></span>
              </div>
            ))}
            <div className="prt-node prt-dest">
              <span className="prt-dot"><Icon name={p.icon} size={18} /></span>
              <p><b>{p.name}</b><small>{LANDS[p.id][1]}</small></p>
              <span className="prt-ok" aria-hidden="true"><Icon name="check" size={12} stroke={3} /></span>
            </div>
            <span className="prt-wire" aria-hidden="true"><i className="prt-packet" /></span>
          </div>
          <div className="prt-receipt" key={`r${p.id}`}>
            <span className="prt-stamp">SETTLED</span>
            <dl>
              <div><dt>Paid via</dt><dd>{p.name}</dd></div>
              <div><dt>You provide</dt><dd>{LANDS[p.id][0]}</dd></div>
              <div><dt>Available</dt><dd>{p.only === 'IN' ? 'Members in India' : 'All member countries'}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

export function RewardGalaxy({ title, sub, tone = 'con' }) {
  return tone === 'pro' ? <PayoutRoute /> : <ScratchRewards title={title} sub={sub} />;
}
export const PayoutFan = RewardGalaxy;

// "Pick the reward that fits your life" (v3.2): a reward display case. Keys on the left pick a reward; a 3D card
// drops into the glass window with what you need and how it lands. Cycles by itself until someone picks one.
export function RewardExplorer() {
  const [vref, visible] = useInView({ once: false, threshold: 0.25 });
  const [k, setK] = useState('all');
  const [sel, setSel] = useState(0);
  const [auto, setAuto] = useState(true);
  const list = PAYOUTS.filter((p) => k === 'all' || p.kind === k);
  const p = list[Math.min(sel, list.length - 1)];
  useEffect(() => {
    if (!visible || !auto) return undefined;
    const t = setInterval(() => !isCalm() && setSel((x) => (x + 1) % list.length), 2600);
    return () => clearInterval(t);
  }, [visible, auto, list.length]);
  return (
    <section ref={vref} className="section rex rvd" aria-labelledby="rex-title">
      <div className="container">
        <div className="rex-head reveal">
          <div>
            <p className="eyebrow">Compare</p>
            <h2 id="rex-title">Pick the reward that fits your life</h2>
            <p className="sec-sub">Choose a different reward each time you claim. UPI is available to members in India only; every other reward is open to consumers and professionals in all member countries (availability can vary by study). Learn about UPI from <a href="https://www.npci.org.in/what-we-do/upi/product-overview" target="_blank" rel="noopener noreferrer">NPCI</a>.</p>
          </div>
          <div className="rex-tabs" role="tablist" aria-label="Reward kinds">
            {[['all', 'All rewards', '#0B1E5B'], ...Object.entries(REWARD_KINDS).map(([id, v]) => [id, v.label, v.c])].map(([id, label, c]) => (
              <button type="button" role="tab" key={id} aria-selected={k === id} className={k === id ? 'on' : ''} style={{ '--kc': c }} onClick={() => { setK(id); setSel(0); }}>
                {label} <b>{id === 'all' ? PAYOUTS.length : PAYOUTS.filter((x) => x.kind === id).length}</b>
              </button>
            ))}
          </div>
        </div>
        <div className="rvd-case reveal">
          <ul className="rvd-keys" key={k}>
            {list.map((x, i) => (
              <li key={x.id} style={{ '--i': i, '--h1': x.hue, '--h2': x.hue2 }}>
                <button type="button" className={x.id === p.id ? 'on' : ''} aria-pressed={x.id === p.id} onClick={() => { setAuto(false); setSel(i); }}>
                  <span className="rvd-kic"><Icon name={x.icon} size={20} /></span>
                  <span><b>{x.name}</b><small>{REWARD_KINDS[x.kind].label}</small></span>
                  {x.only === 'IN' ? <em className="rex-only">India only</em> : null}
                </button>
              </li>
            ))}
          </ul>
          <div className="rvd-window" aria-live="polite">
            <span className="rvd-glass" aria-hidden="true" />
            <span className="rvd-spot" aria-hidden="true" />
            <div className="rvd-card" key={p.id} style={{ '--h1': p.hue, '--h2': p.hue2 }}>
              <span className="rvd-shine" aria-hidden="true" />
              <span className="rvd-cic" aria-hidden="true"><Icon name={p.icon} size={34} /></span>
              <strong>{p.name}</strong>
              <span className="rvd-line">{p.line}</span>
              <dl>
                <div><dt>You need</dt><dd>{LANDS[p.id][0]}</dd></div>
                <div><dt>Lands as</dt><dd>{LANDS[p.id][1]}</dd></div>
                <div><dt>Who</dt><dd>Consumers &amp; professionals</dd></div>
              </dl>
            </div>
            <span className="rvd-tray" aria-hidden="true">{[0, 1, 2, 3].map((c) => <i key={c} style={{ '--c': c }}>$</i>)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Rewards Claim — animated four-stage progress meter (redesign of the current "Rewards Claim" cards)
const CLAIM = [
  { icon: 'gift', t: 'Earn rewards', d: 'Participate in eligible surveys and research studies to earn valuable rewards.' },
  { icon: 'wallet', t: 'Check your balance', d: 'Keep track of your available rewards and monitor your earned points.' },
  { icon: 'clipboard', t: 'Submit a claim', d: 'Request your reward when you meet the eligibility and claim requirements.' },
  { icon: 'badge', t: 'Receive your reward', d: 'Get your reward after your claim has been successfully processed.' },
];
export function ClaimMeter() {
  const [vref, visible] = useInView({ once: false, threshold: 0, rootMargin: '100px 0px' });
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!visible) return undefined; // pause when off-screen
    const t = setInterval(() => !isCalm() && setS((x) => (x + 1) % (CLAIM.length + 1)), 1800);
    return () => clearInterval(t);
  }, [visible]);
  return (
    <section ref={vref} className="section claim" aria-labelledby="claim-title">
      <div className="container">
        <div className="claim-head reveal">
          <p className="eyebrow">Rewards claim</p>
          <h2 id="claim-title">Complete surveys, earn rewards, <br />and easily claim what’s yours.</h2>
        </div>
        <div className="claim-meter reveal">
          <div className="cm-track"><div className="cm-fill" style={{ width: `${(Math.min(s, CLAIM.length) / CLAIM.length) * 100}%` }} /></div>
          <ol className="cm-steps">
            {CLAIM.map((c, i) => (
              <li key={c.t} className={i < s ? 'done' : i === s ? 'now' : ''}>
                <span className="cm-node"><Icon name={i < s ? 'check' : c.icon} size={22} stroke={i < s ? 2.6 : 1.8} /></span>
                <h3>{c.t}</h3>
                <p>{c.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

// Incentive stories — "Rewards in motion": a 3D card stack where real reward moments rise, settle and slide away.
// Real feed → member payouts (consumers in warm tones, professionals in cool tones).
// No feed → true community facts only (never invented people).
export function IncentiveStories() {
  // "Reward gate": reward parcels ride a 3D conveyor belt through a glowing scanner gate. The card under the gate
  // is read out in full; the reward-type mix of the feed is charted below. Real consented payouts only (or labelled
  // preview data / true community facts when there are none yet).
  const [vref, visible] = useInView({ once: false, threshold: 0, rootMargin: '100px 0px' });
  const { items, isPreview, pulse } = useActivityFeed();
  const [order, setOrder] = useState([]);
  const [k, setK] = useState(0);
  useEffect(() => {
    const src = items.length >= 5 ? items : [...items, ...pulse];
    setOrder([...src].sort(() => Math.random() - 0.5));
  }, [items, pulse]);
  useEffect(() => {
    if (!order.length || !visible) return undefined;
    const t = setInterval(() => !isCalm() && setK((x) => x + 1), 2800);
    return () => clearInterval(t);
  }, [order.length, visible]);
  if (!order.length) return null;
  const real = Boolean(items.length);
  const n = order.length;
  const slots = [-3, -2, -1, 0, 1, 2, 3].map((o) => ({ v: order[(((k + o) % n) + n) % n], key: k + o, pos: o }));
  const counts = real ? { biz: items.filter((x) => x.segment === 'business').length, con: items.filter((x) => x.segment !== 'business').length, places: new Set(items.map((x) => x.iso)).size } : null;
  const mix = real ? Object.entries(items.reduce((m, x) => { m[x.method] = (m[x.method] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6) : [];
  const top = mix.length ? mix[0][1] : 1;
  return (
    <section ref={vref} className="section gate" aria-labelledby="stories-title">
      <div className="gate-sky" aria-hidden="true"><i /><i /><i /></div>
      <div className="container">
        <div className="gate-head reveal">
          <p className="eyebrow eyebrow-light">Rewards in motion</p>
          <h2 id="stories-title">Consumers and professionals, <span className="gate-hl">rewarded around the world</span></h2>
          <p>{real ? 'Recent rewards members have received — across regions, roles and reward types.' : 'Our community at a glance — rewards paid, surveys completed and categories open right now.'}{isPreview ? <em className="rwt-prev">Preview</em> : null}</p>
          {real ? (
            <ul className="gate-legend">
              <li className="c"><i /> Consumers <b>{counts.con}</b></li>
              <li className="b"><i /> Professionals <b>{counts.biz}</b></li>
              <li><Icon name="globe" size={14} /> Countries <b>{counts.places}</b></li>
            </ul>
          ) : null}
        </div>
        <div className="gate-stage">
          <div className="gate-arch" aria-hidden="true"><span className="gate-beam" /><b>REWARD GATE</b><i className="gate-led l" /><i className="gate-led r" /></div>
          <div className="gate-belt" aria-hidden="true"><i /></div>
          <div className="gate-track" aria-live="polite">
            {slots.map(({ v, key, pos }) => {
              const style = { transform: `translateX(calc(${pos} * var(--gx))) translateZ(${-Math.abs(pos) * 110}px) rotateY(${pos * -14}deg) scale(${pos === 0 ? 1.08 : 1})`, opacity: Math.abs(pos) === 3 ? 0 : 1 - Math.abs(pos) * 0.22, zIndex: 10 - Math.abs(pos) };
              if (v.kind === 'pulse') {
                return (
                  <article key={key} className={`gc is-pulse ${pos === 0 ? 'on' : ''}`} style={{ ...style, '--tone': v.tone }} aria-hidden={pos !== 0}>
                    <span className="gc-ico"><Icon name={v.icon} size={22} /></span>
                    <p className="gc-amt">{v.big}</p>
                    <p className="gc-line">{v.line}</p>
                  </article>
                );
              }
              const info = PAYOUTS.find((p) => p.name === v.method) || PAYOUTS[0];
              const biz = v.segment === 'business';
              return (
                <article key={key} className={`gc ${biz ? 'is-biz' : 'is-con'} ${pos === 0 ? 'on' : ''}`} style={{ ...style, '--h1': info.hue, '--h2': info.hue2 }} aria-hidden={pos !== 0}>
                  <p className="gc-top"><span className="gc-av">{initials(v.name)}</span><span className="gc-seg">{biz ? 'Professional' : 'Consumer'}</span>{v.ago ? <time>{v.ago}</time> : null}</p>
                  <p className="gc-amt">{v.amount || v.method}</p>
                  <p className="gc-who"><b>{v.name}</b> · {v.role}</p>
                  <p className="gc-meta"><span><Icon name="pin" size={12} /> {v.place}</span>{v.amount ? <span className="gc-m"><Icon name={info.icon} size={12} /> {v.method}</span> : null}</p>
                </article>
              );
            })}
          </div>
          <span className="gate-floor" aria-hidden="true" />
        </div>
        {mix.length ? (
          <div className="gate-mix">
            <p className="gate-mix-h"><Icon name="trend" size={14} /> Reward types in this feed</p>
            <ul>
              {mix.map(([m, c], i) => {
                const info = PAYOUTS.find((p) => p.name === m) || PAYOUTS[0];
                return <li key={m} style={{ '--h1': info.hue, '--h2': info.hue2, '--w': c / top, '--i': i }}><span><Icon name={info.icon} size={13} /> {m}</span><i /><b>{c}</b></li>;
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

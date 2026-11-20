import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { BRAND } from '../data/site.js';
import { isCalm } from '../utils/calm.js';

// One distinct, animated hero scene per page — no two pages share a visual idea.
// Everything is HTML/CSS/SVG (transform/opacity animations only), decorative (aria-hidden by PageHero),
// paused off-screen by the global [data-off] rule and frozen for prefers-reduced-motion.

/* About — "Origin stack": Frequent Research → MyFrequentRewards → You, linked by a light beam */
export function OriginScene() {
  return (
    <div className="sc sc-origin">
      <span className="og-beam"><i /></span>
      <div className="og-card c1">
        <img src="/images/brand/frequent-research-monogram.webp" alt="Frequent Research monogram" width="46" height="48" />
        <div><b>Frequent Research</b><small>ISO 20252 · 9001 · 27001</small></div>
      </div>
      <div className="og-card c2">
        <img src={BRAND.monogram} alt="MyFrequentRewards monogram" width="46" height="46" />
        <div><b>MyFrequentRewards</b><small>Global opinion community</small></div>
      </div>
      <div className="og-card c3">
        <span className="og-you"><Icon name="user" size={22} /></span>
        <div><b>You</b><small>Voice → Value → Rewards</small></div>
      </div>
      <span className="og-chip k1"><Icon name="globe" size={14} /> 5 regions</span>
      <span className="og-chip k2"><Icon name="briefcase" size={14} /> B2B + consumers</span>
      <span className="og-chip k3"><Icon name="shield" size={14} /> Data never sold</span>
    </div>
  );
}

/* Consumers — "Reward bag": survey topics pop out of a 3D shopping bag in arcs while coins drop in */
const POPS = [['cart', '#FF8A00', 'Shopping'], ['mobile', '#8B5CF6', 'Gaming'], ['globe', '#14C9B5', 'Travel'], ['heart', '#FF3B8D', 'Food'], ['activity', '#2F6BFF', 'Cars'], ['star', '#E5A100', 'Movies']];
export function PhoneScene() {
  return (
    <div className="sc sc-bag">
      <span className="bg-halo" />
      {POPS.map(([ic, c, t], k) => (
        <span key={t} className="bg-pop" style={{ '--k': k, '--c': c, '--x': `${(k - 2.5) * 62}px` }}><Icon name={ic} size={20} /><small>{t}</small></span>
      ))}
      <div className="bg-bag">
        <span className="bg-handle" />
        <span className="bg-front"><img src={BRAND.monogram} alt="MyFrequentRewards rewards badge" width="58" height="58" /><b>Your rewards</b></span>
        <span className="bg-side" />
      </div>
      {[0, 1, 2].map((k) => <i key={k} className="bg-coin" style={{ '--k': k }}>$</i>)}
      <span className="bg-chip c1"><Icon name="clock" size={13} /> ~10 min surveys</span>
      <span className="bg-chip c2"><Icon name="gift" size={13} /> Vouchers · PayPal · UPI (India)</span>
    </div>
  );
}

/* Professionals — "Verified ID": a professional ID card flips (front: role, back: verification checks) above an org chart */
const ROLES_CYCLE = ['CIO', 'Plant Director', 'HR Manager', 'Chartered Accountant', 'Founder', 'Medical Director'];
export function DashboardScene() {
  const [k, setK] = useState(0);
  useEffect(() => {
    const t = setInterval(() => !isCalm() && setK((x) => (x + 1) % ROLES_CYCLE.length), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="sc sc-id">
      <div className="id-card">
        <div className="id-face id-front">
          <span className="id-holo" />
          <div className="id-top"><img src={BRAND.monogram} alt="MyFrequentRewards professional ID card logo" width="34" height="34" /><b>PROFESSIONAL</b></div>
          <div className="id-mid">
            <span className="id-avatar"><Icon name="user" size={34} /></span>
            <div><small>Role</small><strong key={k}>{ROLES_CYCLE[k]}</strong><small>B2B member</small></div>
          </div>
          <span className="id-ok"><Icon name="check" size={13} stroke={3} /> Verified</span>
        </div>
        <div className="id-face id-back">
          <p>Verification</p>
          <ul>{['Company email', 'Phone check', 'Public profile', 'Manual review'].map((x) => <li key={x}><Icon name="check" size={12} stroke={3} /> {x}</li>)}</ul>
          <small>Identity never shared with clients</small>
        </div>
      </div>
      <svg className="id-tree" viewBox="0 0 380 120" role="img" aria-label="Organisation chart lines"><path d="M190 0 V40 M60 40 H320 M60 40 V70 M190 40 V70 M320 40 V70" /></svg>
      <div className="id-nodes">
        {[['briefcase', 'Strategy'], ['database', 'Technology'], ['coins', 'Finance']].map(([ic, t], i) => (
          <span key={t} style={{ '--i': i }}><Icon name={ic} size={18} /><small>{t}</small></span>
        ))}
      </div>
    </div>
  );
}

/* Who can join — "People orbit": a living globe circled by every kind of member */
const PEOPLE = [
  { t: 'Students', i: 'ST', c: '#8B5CF6' }, { t: 'Parents', i: 'PA', c: '#FF5E7E' }, { t: 'Gamers', i: 'GM', c: '#14C9B5' },
  { t: 'CXOs', i: 'CX', c: '#2F6BFF' }, { t: 'Doctors', i: 'DR', c: '#22C55E' }, { t: 'Engineers', i: 'EN', c: '#FF8A00' },
  { t: 'Retirees', i: 'RT', c: '#E5A100' }, { t: 'Shoppers', i: 'SH', c: '#E8457A' },
];
export function PeopleScene() {
  return (
    <div className="sc sc-people">
      <div className="pp-globe"><span className="pp-lat" /><span className="pp-lon" /><span className="pp-lon l2" /><span className="pp-shine" /></div>
      <div className="pp-ring r1">{PEOPLE.slice(0, 4).map((p, k) => <span key={p.t} className="pp-av" style={{ '--k': k, '--n': 4, '--c': p.c }}><span className="pp-in"><b>{p.i}</b><small>{p.t}</small></span></span>)}</div>
      <div className="pp-ring r2">{PEOPLE.slice(4).map((p, k) => <span key={p.t} className="pp-av" style={{ '--k': k, '--n': 4, '--c': p.c }}><span className="pp-in"><b>{p.i}</b><small>{p.t}</small></span></span>)}</div>
    </div>
  );
}

/* How it works — "Journey track": a coin travels a curved route, lighting each step as it passes */
const STEPS = [
  { t: 'Join free', icon: 'user' },
  { t: 'Build profile', icon: 'layers' },
  { t: 'Get invited', icon: 'mail' },
  { t: 'Share opinion', icon: 'clipboard' },
  { t: 'Get rewarded', icon: 'gift' },
];
export function JourneyScene() {
  return (
    <div className="sc sc-journey">
      <svg className="jr-path" viewBox="0 0 380 380" role="img" aria-label="Path from survey to reward">
        <path d="M50 330 C 150 330 120 260 190 260 S 310 210 260 180 S 130 130 180 100 S 270 50 330 50" />
      </svg>
      <span className="jr-coin">★</span>
      {STEPS.map((s, k) => (
        <span key={s.t} className={`jr-node n${k}`} style={{ '--t': [0, 0.29, 0.49, 0.7, 0.98][k] }}>
          <i><Icon name={s.icon} size={18} /></i>
          <small>{k + 1}. {s.t}</small>
        </span>
      ))}
    </div>
  );
}

/* Rewards — "Claim meter": balance ring fills to the threshold, then payout cards fan out */
const PAY = [
  { t: 'PayPal', icon: 'paypal', c: '#003087' },
  { t: 'UPI', icon: 'upi', c: '#097939', tag: 'India' },
  { t: 'Bank', icon: 'bank', c: '#0E7C66' },
  { t: 'Vouchers', icon: 'cart', c: '#E8590C' },
];
export function VaultScene() {
  return (
    <div className="sc sc-vault">
      <div className="vt-ring">
        <svg viewBox="0 0 120 120" role="img" aria-label="Progress ring"><circle cx="60" cy="60" r="50" className="vt-track" /><circle cx="60" cy="60" r="50" className="vt-fill" /></svg>
        <div className="vt-core"><small>Balance</small><b>Ready</b><span>Redeem now</span></div>
      </div>
      {PAY.map((p, k) => (
        <span key={p.t} className="vt-card" style={{ '--k': k, '--c': p.c }}>
          <Icon name={p.icon} size={18} /> {p.t}{p.tag ? <em>{p.tag}</em> : null}
        </span>
      ))}
      {[0, 1, 2, 3, 4].map((k) => <span key={k} className="vt-coin" style={{ '--k': k }}>★</span>)}
    </div>
  );
}

/* Quality — "Integrity scanner": radar sweeps a shield while checks tick off one by one */
export function ScannerScene() {
  const checks = ['VPN / proxy blocked', 'Duplicate check', 'Attention check', 'Speed check', 'Device fingerprint'];
  return (
    <div className="sc sc-scan">
      <div className="sn-radar"><span className="sn-sweep" /><span className="sn-ring r1" /><span className="sn-ring r2" /><span className="sn-ring r3" /></div>
      <div className="sn-shield"><Icon name="shield" size={64} stroke={1.4} /><span className="sn-line" /></div>
      <ul className="sn-list">
        {checks.map((c, k) => <li key={c} style={{ '--k': k }}><i><Icon name="check" size={12} stroke={3} /></i>{c}</li>)}
      </ul>
      {[0, 1, 2].map((k) => <span key={k} className="sn-blip" style={{ '--k': k }} />)}
    </div>
  );
}

/* FAQ — "Answer machine": questions type themselves and get answered, on a loop */
const QA = [
  ['Is it really free?', 'Yes — 100% free, always.'],
  ['When do I get paid?', 'After verification, 2–3 weeks.'],
  ['Is my data safe?', 'Never sold or shared.'],
];
export function AnswerScene() {
  return (
    <div className="sc sc-answer">
      <span className="an-q3d">?</span>
      <div className="an-win">
        <div className="an-head"><span /> Help centre</div>
        {QA.map(([q, a], k) => (
          <div className="an-pair" key={q} style={{ '--k': k }}>
            <p className="an-q">{q}</p>
            <p className="an-dots"><i /><i /><i /></p>
            <p className="an-a"><Icon name="check" size={14} stroke={3} /> {a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Contact — "Support hub": live New Delhi clock + channels orbiting a pulsing headset */
export function SupportScene() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata', hour12: false }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="sc sc-support">
      <div className="sp-core"><span className="sp-pulse" /><span className="sp-pulse p2" /><Icon name="headset" size={44} /></div>
      <div className="sp-orbit">
        {[['chat', '#FF8A00'], ['whatsapp', '#25D366'], ['mail', '#2F6BFF'], ['phone', '#8B5CF6']].map(([ic, c], k) => (
          <span key={ic} style={{ '--k': k, '--c': c }}><i><Icon name={ic} size={20} /></i></span>
        ))}
      </div>
      <div className="sp-clock"><small>New Delhi (IST)</small><b>{now || '--:--:--'}</b><span><i /> Live Help online</span></div>
    </div>
  );
}

/* Blogs — "Cover wall": three columns of real covers drifting at different speeds */
export function CoverWall({ posts = [] }) {
  const cols = [0, 1, 2].map((c) => posts.filter((_, i) => i % 3 === c));
  return (
    <div className="sc sc-wall">
      {cols.map((col, c) => (
        <div className={`cw-col c${c}`} key={c}>
          <div className="cw-track">
            {[...col, ...col].map((b, i) => <img key={b.slug + i} src={b.cover} alt={`Blog cover: ${b.title}`} width="200" height="113" loading="lazy" />)}
          </div>
        </div>
      ))}
      <span className="cw-badge"><Icon name="trend" size={14} /> {posts.length}+ honest guides</span>
    </div>
  );
}

/* About — "Motto cube": a 3D cube turns through Your Voice → Your Value → Your Rewards → Frequent Research */
export function CubeScene() {
  return (
    <div className="sc sc-cube">
      <div className="cube-orbit">
        <span><Icon name="badge" size={13} /> ISO 20252 · 9001 · 27001</span>
        <span><Icon name="globe" size={13} /> 5 world regions</span>
        <span><Icon name="shield" size={13} /> Data never sold</span>
      </div>
      <div className="cube">
        <div className="cube-f f1"><Icon name="chat" size={24} /><span><small>Share</small>Your Voice.</span></div>
        <div className="cube-f f2"><Icon name="badge" size={24} /><span><small>Matter</small>Your Value.</span></div>
        <div className="cube-f f3"><Icon name="gift" size={24} /><span><small>Earn</small>Your Rewards.</span></div>
        <div className="cube-f f4"><img src={BRAND.monogram} alt="Frequent Research community logo" width="74" height="74" /><span><small>A community of</small>Frequent Research</span></div>
      </div>
      <span className="cube-shadow" />
    </div>
  );
}

// About hero (v2.1) — an isometric "community city": members, Frequent Research HQ and the rewards vault stand on
// one platform; opinion tokens travel from members to HQ and reward coins travel from the vault back to members.
// Pure CSS 3D (one preserve-3d world), transform-only loops, frozen for reduced motion.
const ISO_BOX = [
  { id: 'm', x: 26, y: 170, w: 92, h: 64, c: '#FF8A00', c2: '#FFB547', label: 'Members', icon: 'user' },
  { id: 'hq', x: 140, y: 34, w: 112, h: 132, c: '#6D5BF7', c2: '#9B8CFF', label: 'Frequent Research', icon: 'badge' },
  { id: 'v', x: 176, y: 186, w: 92, h: 86, c: '#14B8A6', c2: '#5EEAD4', label: 'Rewards vault', icon: 'gift' },
];
export function IsoScene() {
  return (
    <div className="sc sc-iso">
      <div className="iso-world">
        <div className="iso-plate"><i className="iso-road r1" /><i className="iso-road r2" /></div>
        {ISO_BOX.map((b) => (
          <div key={b.id} className={`iso-box b-${b.id}`} style={{ left: b.x, top: b.y, width: b.w, height: b.w, '--h': `${b.h}px`, '--c': b.c, '--c2': b.c2 }}>
            <span className="iso-f top"><Icon name={b.icon} size={26} /></span>
            <span className="iso-f s1" style={{ width: b.w, height: b.h, top: b.w }} />
            <span className="iso-f s2" style={{ width: b.h, height: b.w, left: b.w }} />
          </div>
        ))}
        <i className="iso-tok t1" /><i className="iso-tok t2" /><i className="iso-coin c1" /><i className="iso-coin c2" />
      </div>
      <span className="iso-lab l-m"><Icon name="user" size={13} /> Members</span>
      <span className="iso-lab l-hq"><Icon name="badge" size={13} /> Frequent Research</span>
      <span className="iso-lab l-v"><Icon name="gift" size={13} /> Rewards</span>
      <span className="iso-badge b1"><Icon name="badge" size={13} /> ISO 20252 · 9001 · 27001</span>
      <span className="iso-badge b2"><Icon name="shield" size={13} /> Data never sold</span>
      <span className="iso-badge b3"><Icon name="globe" size={13} /> 5 world regions</span>
    </div>
  );
}

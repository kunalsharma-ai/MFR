import { useRef } from 'react';
import { ACTIONS, FLOW_RAIL, TEMP_KEYS, paletteVars } from '../config/actions.js';
import { useAccount } from '../context/AccountContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useFinePointer, useReducedMotion } from '../hooks/index.js';
import { Coin3D } from './Coin3D.jsx';
import { Icon } from './Icon.jsx';
import { Object3D } from './Object3D.jsx';

const STATUS_LABEL = {
  active: { cls: '', text: 'Active' },
  hold: { cls: 'hold', text: 'On hold' },
  deactivated: { cls: 'off', text: 'Deactivated' },
  deleted: { cls: 'gone', text: 'Deletion completed' },
};

export function Hero() {
  const { account, user, loading } = useAccount();
  const s = STATUS_LABEL[account.status] || STATUS_LABEL.active;
  return (
    <section className="hero" aria-labelledby="mfr-h1">
      <div className="hero-copy">
        <span className="eyebrow">My Account · Account settings</span>
        <h1 id="mfr-h1">Delete or <span className="glow-text">Deactivate</span> My Account</h1>
        <p className="lede">We’re sorry to see you go. You can temporarily deactivate your account or request permanent deletion of your MyFrequentRewards account.</p>
        <ul className="facts">
          <li><Icon name="lock" />Password required for every change</li>
          <li><Icon name="headset" />Reviewed by our Support Team</li>
          <li><Icon name="clock" />Processed within 7 working days</li>
        </ul>
        <dl className="status-card">
          <div><dt>Account status</dt><dd>{loading ? <span className="skeleton" /> : <><span className={`dot ${s.cls}`} />{s.text}{account.status === 'deactivated' && account.days ? ` (${account.days} days)` : ''}</>}</dd></div>
          <div><dt>Current rewards</dt><dd><span className="pts">{user.points ?? 0} pts</span>{user.pointsValue && <small>({user.pointsValue})</small>}</dd></div>
          <div><dt>Member ID</dt><dd className="mono">{user.id}</dd></div>
        </dl>
      </div>
      <Coin3D />
    </section>
  );
}

/** One option card. Hover previews its palette; the 3D tilt is mouse-only and stays clipped inside the card. */
export function OptionCard({ k, wide, disabled, current, onSelect, variant }) {
  const A = ACTIONS[k];
  const { setMood } = useApp();
  const fine = useFinePointer();
  const rm = useReducedMotion();
  const ref = useRef(null);
  const raf = useRef(0);
  const hoverT = useRef(0);

  const onMove = (e) => {
    if (!fine || rm) return;
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      const amp = wide ? 2 : 4;
      el.style.setProperty('--ry', `${((x - 0.5) * amp).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${((0.5 - y) * amp).toFixed(2)}deg`);
      el.style.setProperty('--px', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--py', `${(y * 100).toFixed(1)}%`);
    });
  };
  const onEnter = () => { clearTimeout(hoverT.current); hoverT.current = setTimeout(() => setMood(k), 90); };
  const onLeave = () => {
    clearTimeout(hoverT.current); setMood(null);
    const el = ref.current; if (el) { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); }
  };

  const btnIcon = { hold: 'pause', del: 'trash', react: 'power' }[k];
  const btnLabel = current ? 'Account on hold' : A.cta;

  return (
    <article ref={ref} className={`opt opt-${k} ${wide ? 'wide' : ''} ${variant || ''}`} style={paletteVars(k)}
      onPointerMove={onMove} onPointerEnter={onEnter} onPointerLeave={onLeave} onFocus={() => setMood(k)} onBlur={() => setMood(null)}>
      {current && <span className="tag now">Current status</span>}
      <div className="opt-obj"><Object3D k={k} size={wide ? 88 : 84} /></div>
      <div className="opt-body">
        <span className="tag"><Icon name={A.tagIcon} />{A.tag}</span>
        <h3>{splitTitle(A.label)}</h3>
        <p className="desc">{A.desc}</p>
        <ul className="chips">{A.chips.map(([ic, t]) => <li key={t}><Icon name={ic} />{t}</li>)}</ul>
      </div>
      <div className="opt-cta">
        <button type="button" className="btn fill" disabled={disabled || current} onClick={(e) => onSelect(k, e.currentTarget)} data-sfx={`sel-${k}`}>
          {btnIcon && <Icon name={current ? 'check' : btnIcon} />}{btnLabel}{!btnIcon && <Icon name="chev" />}
        </button>
      </div>
    </article>
  );
}

function splitTitle(label) {
  const m = {
    'Deactivate for 30 Days': ['Deactivate for ', '30 Days'], 'Deactivate for 60 Days': ['Deactivate for ', '60 Days'], 'Deactivate for 90 Days': ['Deactivate for ', '90 Days'],
    'Put My Account on Hold': ['Put My Account ', 'on Hold'], 'Permanently Delete My Account': ['Permanently Delete ', 'My Account'], 'Reactivate My Account': ['Reactivate ', 'My Account'],
  }[label];
  return m ? <>{m[0]}<em>{m[1]}</em></> : label;
}

export function OptionsSection({ onSelect }) {
  const { account, pending, request } = useAccount();
  const onHold = account.status === 'hold';
  return (
    <section className="sec" aria-labelledby="mfr-opt-h">
      <div className="sec-head">
        <div><span className="eyebrow">Temporary options</span><h2 id="mfr-opt-h">Take a break, keep your account</h2></div>
        <p>Choose how long you’d like to step away. Your account stays in our system, and every request is checked by our Support Team.</p>
      </div>
      {pending && (
        <div className="locked-note" role="status"><Icon name="clock" /><span>You have a request in progress (<b className="mono">{request.id}</b>). You can choose another option once it has been completed or cancelled.</span></div>
      )}
      <div className="deck">
        {TEMP_KEYS.map((k) => <OptionCard key={k} k={k} disabled={pending} onSelect={onSelect} />)}
        <OptionCard k="hold" wide disabled={pending} current={onHold} onSelect={onSelect} />
      </div>
    </section>
  );
}

export function DangerZone({ onSelect }) {
  const { pending } = useAccount();
  return (
    <section className="sec danger" aria-labelledby="mfr-dz-h">
      <div className="danger-frame">
        <div className="danger-head">
          <span className="eyebrow" id="mfr-dz-h">Danger zone · Permanent</span>
          <p>This option is different from a break. Once a deletion has been completed it cannot normally be reversed.</p>
        </div>
        <OptionCard k="del" wide variant="del-card" disabled={pending} onSelect={onSelect} />
      </div>
    </section>
  );
}

export function ReactivateBanner({ onSelect }) {
  const { account, pending } = useAccount();
  if (account.status !== 'hold') return null;
  return (
    <section className="sec react-wrap" id="reactivate" aria-label="Reactivate your account">
      <h2 className="sr-only">Your account is currently on hold</h2>
      <OptionCard k="react" wide variant="react-card" disabled={pending} onSelect={onSelect} />
    </section>
  );
}

export function GoneState() {
  return (
    <section className="sec">
      <div className="gone-card" style={paletteVars('del')}>
        <Object3D k="del" size={70} />
        <div><span className="eyebrow">Account status</span><h2>Your account deletion request has been completed.</h2><p>A confirmation email has been sent to your registered email address.</p></div>
      </div>
    </section>
  );
}

export function FlowRail() {
  const rm = useReducedMotion();
  return (
    <section className="sec" aria-labelledby="mfr-flow-h">
      <div className="sec-head">
        <div><span className="eyebrow">How it works</span><h2 id="mfr-flow-h">From your request to confirmation</h2></div>
        <p>Every account change follows the same secure path, whether you take a break, put your account on hold, reactivate or delete.</p>
      </div>
      <ol className={`rail ${rm ? 'still' : ''}`}>
        {FLOW_RAIL.map((s) => (
          <li key={s.title} style={{ '--hue': s.hue }}><span className="rn"><Icon name={s.icon} /></span><b>{s.title}</b><small>{s.sub}</small></li>
        ))}
      </ol>
    </section>
  );
}

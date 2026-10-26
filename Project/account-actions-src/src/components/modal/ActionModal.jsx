import { useCallback, useEffect, useRef, useState } from 'react';
import { ACTIONS, NEXT_STEPS, PALETTES, SLA_TEXT, paletteVars } from '../../config/actions.js';
import { useAccount } from '../../context/AccountContext.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useCountdown, useFocusTrap, useReducedMotion, useScrollLock } from '../../hooks/index.js';
import { runFx } from '../../lib/fx.js';
import { sound } from '../../lib/sound.js';
import { wait } from '../../lib/format.js';
import { Icon } from '../Icon.jsx';
import { Object3D } from '../Object3D.jsx';
import { CopyId } from '../CopyId.jsx';

// Kept outside React so a lock survives closing and reopening the modal (the server still enforces it).
let passwordLockUntil = 0;

const STEP_INDEX = { review: 0, warning: 0, verify: 1, confirm: 2, sending: 3, done: 3 };

export function ActionModal({ k, onClose, onTrack, links, showDemoHint }) {
  const A = ACTIONS[k];
  const { submit, user, verifyPassword, dev } = useAccount();
  const { toast } = useApp();
  const rm = useReducedMotion();
  const first = k === 'del' ? 'warning' : 'review';
  const [step, setStep] = useState(first);
  const [token, setToken] = useState(null);
  const [verifyNotice, setVerifyNotice] = useState('');
  const [submitErr, setSubmitErr] = useState('');
  const [result, setResult] = useState(null);
  const [closing, setClosing] = useState(false);
  const sheetRef = useRef(null);
  const paneRef = useRef(null);
  const fxRef = useRef(null);
  const stopFx = useRef(() => {});

  const close = useCallback(() => {
    if (step === 'sending' || closing) return;
    stopFx.current();
    sound.play('close');
    setClosing(true);
    setTimeout(onClose, rm ? 0 : 200);
  }, [step, closing, onClose, rm]);

  useScrollLock(true);
  useFocusTrap(sheetRef, true, close);
  useEffect(() => () => stopFx.current(), []);

  // Move focus to the new step's heading (or its primary field) so keyboard and screen-reader users follow along.
  useEffect(() => {
    const pane = paneRef.current; if (!pane) return;
    sheetRef.current?.scrollTo?.({ top: 0 });
    const target = pane.querySelector('[data-autofocus]') || pane.querySelector('h2');
    if (target) { if (target.tagName === 'H2') target.tabIndex = -1; target.focus({ preventScroll: true }); }
  }, [step]);

  const goVerify = () => setStep('verify');

  const onVerified = (t) => { setToken(t); setVerifyNotice(''); setSubmitErr(''); setStep('confirm'); };

  const goBack = () => { setToken(null); setSubmitErr(''); setStep(first); };

  const doSubmit = async () => {
    setSubmitErr('');
    setStep('sending');
    const minShow = wait(rm ? 300 : 1700);
    try {
      const req = await submit(k, token, A.apiAction);
      await minShow;
      setResult(req);
      setStep('done');
      sound.play(`done-${k}`);
      requestAnimationFrame(() => {
        const r = sheetRef.current?.getBoundingClientRect();
        if (!rm) stopFx.current = runFx(fxRef.current, k, r ? { x: r.left + r.width / 2, y: r.top + Math.min(160, r.height / 3) } : null);
      });
    } catch (e) {
      await minShow;
      sound.play('error');
      if (e.code === 'verification_expired' || e.status === 401) { setToken(null); setVerifyNotice(e.message); setStep('verify'); }
      else if (e.code === 'request_open' || e.status === 409) { toast(e.message, 'alert'); setClosing(true); setTimeout(onClose, 200); }
      else { setSubmitErr(e.message || 'We couldn’t submit your request. Please try again.'); setStep('confirm'); }
    }
  };

  const labels = k === 'del' ? ['Warning', 'Verify', 'Confirm', 'Submitted'] : ['Review', 'Verify', 'Confirm', 'Submitted'];
  const idx = STEP_INDEX[step];

  return (
    <div className={`modal ${closing ? 'closing' : ''}`} style={paletteVars(k)}>
      <div className="scrim" onClick={close} />
      <canvas ref={fxRef} className="fx" aria-hidden="true" />
      <div className="sheet" ref={sheetRef} role="dialog" aria-modal="true" aria-labelledby="mfr-m-title">
        <div className="sheet-top">
          <ol className="stepper" aria-label={`Step ${idx + 1} of 4`}>
            {labels.map((l, j) => (
              <li key={l} className={j < idx || step === 'done' ? 'done' : j === idx ? 'now' : ''} aria-current={j === idx ? 'step' : undefined}><span>{l}</span></li>
            ))}
          </ol>
          <button type="button" className="x" onClick={close} disabled={step === 'sending'} aria-label="Close" data-sfx="none"><Icon name="x" /></button>
        </div>
        <div className="pane" key={step} ref={paneRef}>
          {step === 'review' && <ReviewStep A={A} k={k} onCancel={close} onNext={goVerify} />}
          {step === 'warning' && <WarningStep A={A} onCancel={close} onNext={goVerify} />}
          {step === 'verify' && <VerifyStep onCancel={close} onVerified={onVerified} verify={verifyPassword} notice={verifyNotice} demoPassword={showDemoHint ? dev?.password : null} />}
          {step === 'confirm' && <ConfirmStep A={A} k={k} user={user} onBack={goBack} onSubmit={doSubmit} error={submitErr} />}
          {step === 'sending' && <SendingStep />}
          {step === 'done' && result && <DoneStep A={A} k={k} req={result} user={user} links={links} onTrack={() => { stopFx.current(); setClosing(true); setTimeout(() => { onClose(); onTrack(); }, rm ? 0 : 200); }} />}
        </div>
      </div>
    </div>
  );
}

function Head({ badge, title, sub }) {
  return (
    <div className="pane-head">
      <div className="pane-badge">{badge}</div>
      <div><h2 id="mfr-m-title">{title}</h2>{sub && <p>{sub}</p>}</div>
    </div>
  );
}

function ReviewStep({ A, k, onCancel, onNext }) {
  return (
    <>
      <Head badge={<Object3D k={k} size={50} />} title={A.title} sub="Please review what this means before you continue." />
      <dl className="detail">
        <div><dt>Selected action</dt><dd>{A.type}</dd></div>
        <div><dt>{A.durationLabel}</dt><dd>{A.duration}</dd></div>
      </dl>
      <div className="happens">
        <h3>What happens?</h3>
        <ul>{A.bullets.map((b) => <li key={b}><Icon name="check" /><span>{b}</span></li>)}</ul>
      </div>
      <div className="actions">
        <button type="button" className="btn ghost" onClick={onCancel} data-sfx="none">Cancel</button>
        <button type="button" className="btn fill" onClick={onNext} data-sfx="next" data-autofocus>Continue<Icon name="chev" /></button>
      </div>
    </>
  );
}

function WarningStep({ A, onCancel, onNext }) {
  return (
    <>
      <Head badge={<div className="hazard-badge"><span><Icon name="alert" /></span></div>} title={<><span className="sr-only">Warning: </span>{A.title}</>} sub={A.intro} />
      <div className="warn">
        <h3>Before continuing:</h3>
        <ul>{A.warnings.map((b) => <li key={b}><Icon name="alert" /><span>{b}</span></li>)}</ul>
      </div>
      <dl className="detail">
        <div><dt>Selected action</dt><dd>{A.internal}</dd></div>
        <div><dt>Processing</dt><dd>{SLA_TEXT}</dd></div>
      </dl>
      <div className="actions">
        <button type="button" className="btn ghost" onClick={onCancel} data-sfx="none" data-autofocus>Cancel</button>
        <button type="button" className="btn fill" onClick={onNext} data-sfx="next">I understand and want to continue</button>
      </div>
    </>
  );
}

function VerifyStep({ onCancel, onVerified, verify, notice, demoPassword }) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(notice || '');
  const [shake, setShake] = useState(0);
  const [lockUntil, setLockUntil] = useState(passwordLockUntil);
  const left = useCountdown(lockUntil);
  const locked = left > 0;
  const inputRef = useRef(null);

  useEffect(() => { if (!locked && lockUntil) { setErr(''); inputRef.current?.focus(); } }, [locked, lockUntil]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy || locked) return;
    if (!pw) { setErr('Please enter your password.'); setShake((s) => s + 1); sound.play('error'); inputRef.current?.focus(); return; }
    setBusy(true); setErr('');
    try {
      const res = await verify(pw);
      if (res.ok) { sound.play('ok'); onVerified(res.token); return; }
      sound.play('error'); setShake((s) => s + 1); setPw('');
      if (res.error === 'too_many_attempts') {
        passwordLockUntil = Date.now() + (res.retryAfter || 30) * 1000; setLockUntil(passwordLockUntil);
      } else {
        const r = res.attemptsRemaining;
        setErr(`Incorrect password. Please try again.${r != null && r <= 2 ? ` ${r} attempt${r === 1 ? '' : 's'} remaining before a temporary lock.` : ''}`);
      }
      inputRef.current?.focus();
    } catch (ex) {
      sound.play('error'); setErr(ex.message || 'We couldn’t verify your password. Please try again.');
    } finally { setBusy(false); }
  };

  const message = locked ? `Too many incorrect attempts. For your security, please wait ${left} second${left === 1 ? '' : 's'} before trying again.` : err;

  return (
    <>
      <Head badge={<div className="lock-badge"><span><Icon name="lock" /></span></div>} title="Confirm Your Identity" sub="For your security, please enter your MyFrequentRewards account password to continue." />
      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="mfr-pw">Password</label>
          <div className={`pw-wrap ${shake ? 'shake' : ''}`} key={shake}>
            <Icon name="key" />
            <input ref={inputRef} id="mfr-pw" name="password" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password"
              value={pw} onChange={(e) => { setPw(e.target.value); if (err && !locked) setErr(''); }} disabled={locked} data-autofocus
              aria-invalid={message ? 'true' : undefined} aria-describedby={message ? 'mfr-pw-err' : undefined} />
          </div>
        </div>
        <label className="check" htmlFor="mfr-showpw">
          <input id="mfr-showpw" type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
          <span>Show password</span>
        </label>
        {message && <p className="err" id="mfr-pw-err" role="alert"><Icon name="alert" /><span>{message}</span></p>}
        {demoPassword && <p className="demo-hint"><Icon name="sliders" />Preview only: the demo password is <code>{demoPassword}</code></p>}
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onCancel} data-sfx="none">Cancel</button>
          <button type="submit" className="btn fill" disabled={busy || locked} data-sfx="none" onClick={() => sound.play('tick')}>
            {busy ? <><span className="spin" aria-hidden="true" />Verifying…</> : 'Verify & Continue'}
          </button>
        </div>
      </form>
    </>
  );
}

function ConfirmStep({ A, k, user, onBack, onSubmit, error }) {
  const [agree, setAgree] = useState(false);
  return (
    <>
      <Head badge={<div className="lock-badge ok"><span><Icon name="shield" /></span></div>} title="Please Confirm Your Request" sub="Your identity has been verified. Check the details below." />
      <p className="summary">{A.summary}</p>
      <dl className="confirm-dl">
        <div><dt>Account</dt><dd>{user.email}</dd></div>
        <div><dt>Request</dt><dd>{A.type}</dd></div>
        <div><dt>{A.confirmDurationLabel || 'Duration'}</dt><dd>{A.confirmDuration || A.duration}</dd></div>
        <div><dt>Request processing</dt><dd>{SLA_TEXT}</dd></div>
      </dl>
      <label className="check big" htmlFor="mfr-agree">
        <input id="mfr-agree" type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} data-autofocus />
        <span>I confirm that I want to submit this request.</span>
      </label>
      {error && <p className="err" role="alert"><Icon name="alert" /><span>{error}</span></p>}
      <div className="actions">
        <button type="button" className="btn ghost" onClick={onBack} data-sfx="back"><Icon name="back" />Go Back</button>
        <button type="button" className={`btn fill ${k === 'del' ? 'danger-fill' : ''}`} disabled={!agree} onClick={onSubmit} data-sfx="next">
          {error ? 'Try again' : 'Submit Request'}
        </button>
      </div>
    </>
  );
}

function SendingStep() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const ids = [350, 850, 1350].map((t, i) => setTimeout(() => { setN(i + 1); sound.play('tap'); }, t));
    return () => ids.forEach(clearTimeout);
  }, []);
  const items = ['Confirming your verified session', 'Generating your request ID', 'Creating your support ticket'];
  return (
    <div className="sending" aria-live="polite">
      <div className="loader3d" aria-hidden="true"><i /><i /><i /></div>
      <h2 id="mfr-m-title">Sending your request to our Support Team</h2>
      <ul>{items.map((t, i) => <li key={t} className={i < n ? 'ok' : ''}><Icon name="check" />{t}</li>)}</ul>
    </div>
  );
}

function DoneStep({ A, k, req, user, links, onTrack }) {
  const gid = `sg-${k}`;
  const p = PALETTES[k];
  return (
    <>
      <div className="done-hero">
        <div className="seal-row">
          <div className="seal" aria-hidden="true">
            <svg viewBox="0 0 120 120">
              <defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={p.c2} /><stop offset="1" stopColor={p.c1} /></linearGradient></defs>
              <circle className="dash" cx="60" cy="60" r="57" stroke={p.c2} />
              <circle className="core" cx="60" cy="60" r="44" fill={`url(#${gid})`} />
              <circle className="ring-bg" cx="60" cy="60" r="50" />
              <circle className="ring" cx="60" cy="60" r="50" stroke={`url(#${gid})`} />
              <path className="tick" d="M40 62l14 14 28-30" />
            </svg>
          </div>
          <div className="seal-obj"><Object3D k={k} size={46} /></div>
        </div>
        <h2 id="mfr-m-title">Account Request Created</h2>
        <CopyId id={req.id} prefix="Request ID:" />
        <p>Your request has been successfully submitted to the MyFrequentRewards Support Team.</p>
      </div>
      <div className="next">
        <h3>What happens next?</h3>
        <ol>{NEXT_STEPS.map((s) => <li key={s}>{s}</li>)}</ol>
      </div>
      <div className="eta"><Icon name="clock" /><div><small>Estimated completion</small><b>{SLA_TEXT}</b></div></div>
      <p className="note"><Icon name="mail" />We’ve sent a “Request Received” email to {user.email}.</p>
      <div className="actions">
        <a className="btn ghost" href={links.dashboard} onClick={links.onNavigate ? (e) => links.onNavigate(e, 'dashboard') : undefined}><Icon name="home" />Back to dashboard</a>
        <button type="button" className="btn fill" onClick={onTrack} data-autofocus>Track my request<Icon name="chev" /></button>
      </div>
    </>
  );
}

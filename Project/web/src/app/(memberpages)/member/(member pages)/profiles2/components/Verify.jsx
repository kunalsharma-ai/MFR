import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { sendCode, checkCode } from '../lib/otp.js';
import { sessionId } from '../lib/session.js';
import { formatE164 } from '../validation/phone.js';
import { ui } from '../audio/sound.js';
import Orb from './Orb.jsx';
import { IArrow } from './Icons.jsx';

/** Email / phone one-time-code step. Members can verify now or later (unverified lowers trust, never blocks). */
export default function VerifyCard({ channel, target, onDone, onSkip }) {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);
  const [wait, setWait] = useState(0);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [demo, setDemo] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const inp = useRef(null);
  useEffect(() => { if (!wait) return; const id = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(id); }, [wait]);
  const send = async () => {
    setBusy(true); setMsg('');
    const r = await sendCode(channel, target, sessionId());
    setBusy(false);
    if (r.ok) { setSent(true); setWait(r.retryIn || 45); setDemo(r.demoCode || r.devCode || ''); setTimeout(() => inp.current?.focus(), 50); }
    else if (r.error === 'cooldown') setWait(r.retryIn || 30);
    else setMsg(t('v.locked'));
  };
  const verify = async (c = code) => {
    if (c.length !== 6) return;
    setBusy(true);
    const r = await checkCode(channel, target, c, sessionId());
    setBusy(false);
    if (r.verified) { setDone(true); ui('section'); setTimeout(onDone, 900); }
    else { ui('error'); setCode(''); setMsg(r.error === 'expired' ? t('v.expired') : r.error === 'locked' ? t('v.locked') : t('v.bad', { n: r.left ?? 0 })); }
  };
  const shown = channel === 'phone' ? formatE164(target) : target;
  return (
    <div className="qcard in-next verify">
      <div className="verify-head">
        <Orb icon={done ? 'check' : channel === 'phone' ? 'phonecall' : 'mail'} size={86} />
        <div>
          <h2 className="q-title">{done ? t('v.ok') : t(channel === 'phone' ? 'v.phoneTitle' : 'v.emailTitle')}</h2>
          <p className="q-hint" dir="ltr">{shown}</p>
        </div>
      </div>
      <p className="muted">{t('v.why')}</p>
      {!done && (!sent ? (
        <div className="q-nav"><button type="button" className="btn-link" onClick={onSkip}>{t('v.later')}</button>
          <button type="button" className="btn" disabled={busy} onClick={send}>{t('v.send')} <IArrow /></button></div>
      ) : (
        <>
          <p className="verify-sent">{t('v.sent', { t: shown })}</p>
          {demo && <p className="demo-note">{t('v.demo', { c: demo })}</p>}
          <input ref={inp} className="field otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} aria-label={t('v.code')} placeholder="••••••"
            onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setCode(v); if (v.length === 6) verify(v); }} />
          <p className="q-err" role="alert">{msg}</p>
          <div className="q-nav">
            <button type="button" className="btn-link" disabled={wait > 0 || busy} onClick={send}>{wait > 0 ? t('v.wait', { s: wait }) : t('v.resend')}</button>
            <span className="grow" />
            <button type="button" className="btn-link" onClick={onSkip}>{t('v.later')}</button>
            <button type="button" className="btn" disabled={busy || code.length !== 6} onClick={() => verify()}>{t('v.verify')} <IArrow /></button>
          </div>
        </>
      ))}
    </div>
  );
}

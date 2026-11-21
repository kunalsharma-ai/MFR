// Where is my Teen registration? (/teen/status). With the status link from the teen's email (or the tab that just
// registered) it shows a parcel-style tracker; without one it offers a fresh link by email (same answer whether or not
// the email exists, so nobody can probe who is registered). Look: night-sky tracker (teen.css .tz-w-st).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { t, err, fmtDate, activeLang } from '../teen/i18n.js';
import * as R from '../teen/rules.js';
import { teenApi, relationLabel } from '../teen/api.js';
import { TeenPage, TeenSeo, Art, useLinkToken, useFocusTitle, Loading } from '../teen/shell.jsx';
import { Btn, Alert } from '../teen/ui.jsx';

const STAGES = [
  ['pending_guardian_approval', 'mail'],
  ['guardian_approved', 'check'],
  ['pending_consent', 'shield'],
  ['pending_password', 'key'],
  ['active', 'rocket'],
];
const ORDER = { initial_registration: 0, pending_guardian_approval: 0, guardian_approved: 1, pending_onboarding: 1, manual_review: 2, pending_consent: 2, pending_password: 3, active: 4 };

export default function TeenStatus() {
  const token = useLinkToken('status');
  const [view, setView] = useState(null);
  const [problem, setProblem] = useState('');
  const [mail, setMail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rs, setRs] = useState('');
  const titleRef = useFocusTitle(`${Boolean(view)}-${sent}`);

  useEffect(() => {
    if (token === null) return;
    if (!token) { setProblem('none'); return; }
    teenApi.status(token).then(setView).catch((e) => setProblem(e.code || 'link_invalid'));
  }, [token]);

  const renew = async (e) => {
    e.preventDefault();
    if (!R.validEmail(mail)) return;
    setBusy(true);
    try { await teenApi.renew(R.normEmail(mail)); } catch { /* the answer is the same either way */ }
    setBusy(false); setSent(true);
  };
  const resend = async () => {
    setBusy(true);
    try { await teenApi.resend({ statusToken: token }); setRs(t('s4_resent')); } catch (e2) { setRs(err(e2.code) || err('server')); }
    setBusy(false);
  };

  const at = view ? ORDER[view.status] ?? -1 : -1;
  const ended = view && ['rejected', 'cancelled', 'expired'].includes(view.status);
  const rel = view ? relationLabel(view.guardian?.relation || '').toLowerCase() : '';
  const when = (s) => view?.timeline?.slice().reverse().find((h) => h.status === s || (s === 'guardian_approved' && h.status === 'pending_onboarding'))?.at;
  return (
    <>
      <TeenSeo title="Your Teen registration" description="Check the status of a Teen Panel registration or ask for a new link." path="/teen/status" />
      <TeenPage world="st" label={t('st_title')}>
        {token === null || (!view && !problem) ? <Loading /> : null}
        {view ? (
          <div className="tz-st">
            <header className="tz-st-head">
              <div>
                <p className="tz-kicker">{t('st_ref', view.reference)}</p>
                <h1 className="tz-h2" ref={titleRef} tabIndex={-1}>{t('st_hi', view.teenFirstName || '')}</h1>
                <p className={`tz-st-now is-${ended ? 'end' : view.status === 'active' ? 'ok' : 'wait'}`}><span className="tz-dot" /> {t(`st_${view.status}`)}</p>
              </div>
              <Art name={view.status === 'active' ? 'celebrate' : ended ? 'nest' : 'atlas'} size={160} />
            </header>
            {!ended ? (
              <ol className="tz-track">
                {STAGES.map(([s, ic], i) => (
                  <li key={s} className={i < at || view.status === 'active' ? 'is-done' : i === at ? 'is-now' : ''}>
                    <span className="tz-track-dot"><Icon name={i < at || view.status === 'active' ? 'check' : ic} size={16} stroke={2.4} /></span>
                    <b>{t(`st_step_${i + 1}`, rel)}</b>
                    {when(s) ? <small>{fmtDate(when(s), activeLang(), { dateStyle: 'medium', timeStyle: 'short' })}</small> : null}
                  </li>
                ))}
              </ol>
            ) : (
              <Alert tone="info">{t(`st_end_${view.status}`)}</Alert>
            )}
            <div className="tz-ticket">
              <div className="tz-ticket-row"><span>{t('s4_sent_to', rel)}</span><b className="tz-mono">{view.guardian?.emailMasked}</b></div>
              {view.expiresAt && !ended && view.status !== 'active' ? <div className="tz-ticket-row"><span>{t('s4_expires')}</span><b>{fmtDate(view.expiresAt)}</b></div> : null}
            </div>
            {rs ? <Alert tone="ok">{rs}</Alert> : null}
            <div className="tz-actions">
              {view.canResend ? <Btn kind="ghost" icon="refresh" busy={busy} onClick={resend}>{t('s4_resend')}</Btn> : null}
              {view.status === 'active' ? <Link className="tf-btn tf-btn-main" to="/login?type=teen"><span>{t('pw_login')}</span></Link> : null}
              {view.status === 'pending_password' ? <button type="button" className="tf-btn tf-btn-main" onClick={() => { setView(null); setProblem('none'); }}><span>{t('st_need_pw')}</span></button> : null}
            </div>
          </div>
        ) : null}
        {problem ? (
          <div className="tz-st tz-st-renew" id="renew">
            <Art name="sunrise" size={170} />
            <h1 className="tz-h2" ref={titleRef} tabIndex={-1}>{t('rn_title')}</h1>
            {problem !== 'none' ? <Alert tone="info">{err(problem)}</Alert> : null}
            <p className="tz-lead">{t('rn_lead')}</p>
            {sent ? <Alert tone="ok">{t('rn_done')}</Alert> : (
              <form className="tz-renew" onSubmit={renew}>
                <label className="tf-label" htmlFor="rn-mail">{t('email')}</label>
                <input id="rn-mail" className="tf-input" type="email" inputMode="email" autoComplete="email" value={mail} onChange={(e) => setMail(e.target.value.trim())} required />
                <Btn type="submit" busy={busy} icon="send" disabled={!R.validEmail(mail)}>{t('rn_btn')}</Btn>
              </form>
            )}
            <p className="tz-small">{t('rn_note')}</p>
            <p className="tz-small"><Link to="/sign-up?type=teen">{t('rn_start')}</Link> · <Link to="/login?type=teen">{t('en_login')}</Link></p>
          </div>
        ) : null}
      </TeenPage>
    </>
  );
}

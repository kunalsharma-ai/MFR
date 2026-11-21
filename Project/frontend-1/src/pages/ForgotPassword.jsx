import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Field from '../components/SxField.jsx';
import { PageSeo } from '../components/PageHero.jsx';
import { PAGES } from '../data/pages.js';
import { FORGOT_API } from '../data/site.js';
import { EMAIL_RE } from '../utils/validate.js';
import { postJSON } from '../utils/api.js';
import ResetPassword from './ResetPassword.jsx';
import { teenApi } from '../teen/api.js';
import { DemoMailbox } from '../teen/shell.jsx';
import { DEMO_MODE } from '../data/site.js';
const page = PAGES.forgotPassword;
const WAIT = 30; // seconds between "send again" clicks


// ?type=teen: a Teen whose parent hasn't answered yet, or whose password link ran out, asks for a fresh link here.
// The answer is the same whether or not the email is registered, so nobody can check who has an account.
function RequestResetLink({ teen = false }) { 
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [msg, setMsg] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const mail = email.trim().toLowerCase();
  const error = !mail ? 'Enter the email you joined with.' : !EMAIL_RE.test(mail) ? 'Enter a valid email address.' : '';

  async function send(e) {
    if (e) e.preventDefault();
    setTouched(true);
    if (error || status === 'sending' || cooldown > 0) return;
    setStatus('sending');
    setMsg('');
    try {
      if (teen) await teenApi.renew(mail).catch(() => {}); // same answer either way
      else await postJSON(FORGOT_API, { user: mail });
      setSentTo(mail);
      setCooldown(WAIT);
      setStatus('sent');
    } catch (ex) {
      setMsg(ex.message || 'We couldn’t send the email. Please try again.');
      setStatus('error');
    }
  }

  return (
    <>
      <PageSeo page={page} />
      <section className={`sx ${teen ? 'ax-page aud-min' : ''}`}>
        <div className="sx-bg" aria-hidden="true">
          <span className="sx-orb o1" /><span className="sx-orb o2" /><span className="sx-orb o3" />
          {teen ? <span className="ax-alt" /> : null}
          {Array.from({ length: 14 }).map((_, i) => <i key={i} className="sx-coin" style={{ '--i': i }} />)}
        </div>
        <div className="container sx-row">
          <aside className="sx-aside">
            <p className="eyebrow eyebrow-light">{teen ? 'Teen account help' : 'Account help'}</p>
            <h1>{teen ? 'Need a new link?' : page.h1}</h1>
            <p className="muted-light">{teen
              ? 'Links stop working after a while to keep your account safe. Tell us the email you registered with and we’ll send a fresh one: to your parent or guardian if they haven’t answered yet, or to you if it’s time to create your password.'
              : 'No problem. Tell us your email and we’ll send you a link to choose a new password.'}</p>
            <div className="sx-stage" aria-hidden="true">
              <div className="sx-badge s4"><Icon name={status === 'sent' ? 'mail' : 'lock'} size={44} stroke={1.4} /></div>
              <p className="sx-stage-t">{status === 'sent' ? 'Check your inbox' : teen ? 'Get a fresh link' : 'Reset your password'}</p>
            </div>
            <ul className="sx-perks">
              <li><Icon name="lock" size={18} /> We will never ask for your password by email, SMS or WhatsApp</li>
            </ul>
          </aside>

          <div className="sx-card">
            {sentTo && status !== 'error' ? ( 
              <div className="sx-done" role="status">
                <div className="done-check"><Icon name="mail" size={40} stroke={2.4} /></div>
                <h2>Check your inbox</h2>
                {teen
                  ? <p>If a Teen registration is waiting for <strong>{sentTo}</strong>, we’ve sent a new link: to your parent or guardian if they still need to answer, or to you if it’s time to create your password.</p>
                  : <p>We’ve sent a password reset link to <strong>{sentTo}</strong>. Open it to choose a new password. The link works for 24 hours.</p>}
                <p className="tiny muted">Can’t find it? Check your spam or promotions folder.</p>
                <div className="done-actions">
                  <button type="button" className="btn btn-dark" onClick={() => send()} disabled={cooldown > 0 || status === 'sending'}>
                    {cooldown > 0 ? `Send again in ${cooldown}s` : 'Send again'}
                  </button>
                  <Link to={teen ? '/login?type=teen' : '/login'} className="btn btn-ghost-dark">Back to log in</Link>
                </div>
              </div>
            ) : (
              <form onSubmit={send} noValidate>
                <div className="sx-pane d1">
                  <h2 className="sx-h">{teen ? 'Get a new link' : 'Reset your password'}</h2>
                  <p className="sx-sub">{teen ? 'Enter the email address you registered with (your username).' : 'Enter the email address you joined with.'}</p>
                  <div className="sx-grid">
                    <Field id="forgot-email" label="Email address" error={touched ? error : undefined} ok={touched && !error} icon="mail">
                      <input id="forgot-email" type="email" placeholder=" " autoComplete="username" inputMode="email" maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)} aria-invalid={Boolean(touched && error)} />
                    </Field>
                  </div>
                  {status === 'error' ? <p className="form-error" role="alert">{msg} <Link to="/sign-up">Create an account</Link></p> : null}
                </div>
                <div className="sx-nav">
                  <Link to={teen ? '/login?type=teen' : '/login'} className="btn btn-ghost-dark">Back to log in</Link>
                  <button type="submit" className="btn btn-primary btn-lg btn-shine" disabled={status === 'sending'}>
                    {status === 'sending' ? <><span className="spinner" /> Sending…</> : <>{teen ? 'Send a new link' : 'Send reset link'} <Icon name="arrow" size={18} /></>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
      {teen && DEMO_MODE ? <DemoMailbox /> : null}
    </>
  );
}
export default function ForgotPassword() {
  const [params] = useSearchParams();
  const fromEmail = Boolean(params.get('user') && params.get('code'));
  const teen = ['teen', 'minor'].includes(params.get('type'));
  return fromEmail ? <ResetPassword /> : <RequestResetLink teen={teen} />;
}
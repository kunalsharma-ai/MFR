import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import Captcha from './Captcha.jsx';
import CountryPicker from './CountryPicker.jsx';
import DobPicker from './DobPicker.jsx';
import Field from './SxField.jsx';
import SxRail, { railPct } from './SxRail.jsx';
import { COUNTRIES } from '../data/countries.js';
import { MEMBER_CATEGORIES } from '../data/site.js';
import { GENDERS } from '../utils/validate.js';
import { checkEmailDomain } from '../utils/emailChecks.js';
import {
  CONSENT_BOXES, GUARDIANS, buildTeenPayload, maskEmail, resendGuardianInvite, submitTeenRegistration, validateConsent, validateGuardian,
} from '../utils/teenRegister.js';

// The teen panel's own registration. Step 1 ("About you": first / middle / last name, email, DOB limited to teen ages,
// gender) lives on /sign-up; this component takes over after it:
//   2 · Parent / guardian → Mother, Father or Legal guardian: first*, middle, last, email*, phone*, DOB* (+ gender* for a legal guardian)
//   3 · Consent           → five boxes ticked by hand (parent consent, participation, Terms, Privacy, accuracy) + CAPTCHA
//   4 · Parent invite     → a pending registration is created and the Parent/Guardian Onboarding Form is emailed
export const TEEN_STEPS = [
  { n: 1, t: 'About you', icon: 'user' },
  { n: 2, t: 'Parent / guardian', icon: 'family' },
  { n: 3, t: 'Consent', icon: 'shield' },
  { n: 4, t: 'Parent invite', icon: 'send' },
];
const FIELDS = {
  2: ['relation', 'first', 'middle', 'last', 'dob', 'email', 'phone', 'gender'],
  3: [...CONSENT_BOXES.map((b) => b.k), 'captcha'],
};
const RESEND_WAIT = 30;
const E = (n) => `/images/minor/emoji/${n}.webp`;

function GenderPick({ id, value, onChange, error, label }) {
  return (
    <div className={`sx-field half ${error ? 'bad' : ''}`}>
      <span className="sx-static-label" id={`${id}-lbl`}>{label}</span>
      <div className="sx-genders" role="radiogroup" aria-labelledby={`${id}-lbl`} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined}>
        {GENDERS.map((x) => (
          <label key={x} className={`sx-gender ${value === x ? 'on' : ''}`}>
            <input type="radio" name={id} value={x} checked={value === x} onChange={() => onChange(x)} />
            {x}
          </label>
        ))}
      </div>
      {error ? <p className="f-err" id={`${id}-err`} role="alert">{error}</p> : null}
    </div>
  );
}

export default function TeenSignup({ seed, referredBy = '', onBack, onProgress }) {
  const [step, setStep] = useState(2);
  const [dir, setDir] = useState(1);
  const [g, setG] = useState({ relation: '', first: '', middle: '', last: '', dob: '', email: '', gender: '', phoneIso: seed.phoneIso || seed.country || '', phone: '' });
  const [c, setC] = useState({ captchaOk: false });
  const [touched, setTouched] = useState({});
  const [domainMsg, setDomainMsg] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [serverMsg, setServerMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState('');
  const [resendBusy, setResendBusy] = useState(false);
  const cardRef = useRef(null);
  const captchaRef = useRef(null);
  const first = seed.firstName.trim();
  const teenMail = seed.email.trim().toLowerCase();

  const errors = useMemo(() => {
    if (step === 3) return validateConsent(c);
    const e = validateGuardian(g, teenMail);
    const val = g.email.trim().toLowerCase();
    if (!e.email && domainMsg?.msg && domainMsg.value === val) e.email = domainMsg.msg;
    return e;
  }, [step, g, c, teenMail, domainMsg]);
  const err = (k) => (touched[`${step}.${k}`] ? errors[k] : undefined);
  const ok = (k) => touched[`${step}.${k}`] && !errors[k];
  const touch = (k) => setTouched((s) => ({ ...s, [`${step}.${k}`]: true }));
  const shownStep = status === 'sent' ? 4 : step;
  const pct = status === 'sent' ? 100 : railPct(step, TEEN_STEPS.length, FIELDS[step].length, Object.keys(errors).length);

  useEffect(() => { onProgress?.(shownStep, pct); }, [shownStep, pct]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function checkDomain(raw) {
    const val = String(raw || '').trim().toLowerCase();
    if (!val.includes('@')) return '';
    if (domainMsg?.value === val) return domainMsg.msg;
    const msg = await checkEmailDomain(val).catch(() => '');
    setDomainMsg({ value: val, msg });
    return msg;
  }

  const scrollTop = () => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const focusBad = () => setTimeout(() => cardRef.current?.querySelector('[aria-invalid="true"]')?.focus(), 40);
  function go(n) { setDir(n > step ? 1 : -1); setStep(n); scrollTop(); }
  function showAll() {
    setTouched((s) => ({ ...s, ...Object.fromEntries(FIELDS[step].map((k) => [`${step}.${k}`, true])) }));
    focusBad();
  }

  async function submit(e) {
    e.preventDefault();
    if (Object.keys(errors).length) return showAll();
    if (step === 2) {
      if (await checkDomain(g.email)) return showAll();
      return go(3);
    }
    if (status === 'sending') return;
    // the CAPTCHA is checked only now, when the button is pressed (never while typing)
    if (!captchaRef.current?.verify?.()) { setC((s) => ({ ...s, captchaOk: false })); focusBad(); return; }
    setStatus('sending');
    setServerMsg('');
    const dial = (COUNTRIES.find((x) => x.iso === g.phoneIso) || {}).dial || '';
    try {
      await submitTeenRegistration(buildTeenPayload(seed, g, c, {
        categories: MEMBER_CATEGORIES, dial, referredBy,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      }));
      setStatus('sent');
      setCooldown(RESEND_WAIT);
      scrollTop();
    } catch (ex) {
      setServerMsg(ex.message || 'We couldn’t send the invitation. Please try again.');
      setStatus('error');
      captchaRef.current?.refresh();
      setC((s) => ({ ...s, captchaOk: false }));
    }
  }

  async function resend() {
    if (resendBusy || cooldown > 0) return;
    setResendBusy(true);
    setResendMsg('');
    try {
      await resendGuardianInvite(g.email.trim().toLowerCase());
      setResendMsg('Sent again. Ask them to check spam or promotions too.');
      setCooldown(RESEND_WAIT);
    } catch (ex) {
      setResendMsg(ex.message || 'Could not resend the email. Please try again.');
    } finally {
      setResendBusy(false);
    }
  }

  const rel = GUARDIANS.find((x) => x.k === g.relation);
  const legal = g.relation === 'legal_guardian';
  const who = rel ? (legal ? 'your guardian' : `your ${rel.t.toLowerCase()}`) : 'your parent';
  const whoT = rel ? (legal ? 'Guardian' : rel.t) : 'Parent';
  const setGF = (k) => (e) => setG((s) => ({ ...s, [k]: e.target.value }));
  const gAria = (k) => ({ 'aria-invalid': Boolean(err(k)), 'aria-describedby': err(k) ? `g-${k}-err` : undefined, onBlur: () => touch(k) });

  if (status === 'sent') {
    return (
      <div className="sx-done ts-done" role="status" ref={cardRef}>
        <SxRail steps={TEEN_STEPS} step={4} pct={100} />
        <div className="ts-flight" aria-hidden="true">
          <img className="ts-env" src="/images/minor/emoji/mail.webp" alt="" width="84" height="84" />
          <span className="ts-trail" />
          <img className="ts-home" src="/images/minor/emoji/family.webp" alt="" width="72" height="72" />
          <img className="ts-spark s1" src="/images/minor/emoji/sparkles.webp" alt="" width="28" height="28" />
          <img className="ts-spark s2" src="/images/minor/emoji/star.webp" alt="" width="24" height="24" />
        </div>
        <h2>Registration request submitted!</h2>
        <p>
          Your registration request has been submitted successfully. We have sent a Parent/Guardian Onboarding Form to{' '}
          <strong>{maskEmail(g.email.trim().toLowerCase())}</strong>. Please ask {who} to check their inbox and complete the onboarding process to continue.
        </p>
        <ol className="ts-next">
          <li><img src={E('mail')} alt="" width="28" height="28" /><span><b>{whoT} opens the secure link</b><small>Subject: “{first} wants to join the MyFrequentRewards Teen Panel”</small></span></li>
          <li><img src={E('parenting')} alt="" width="28" height="28" /><span><b>They complete the onboarding form</b><small>16 short questions about them, the household, staying in touch and your health</small></span></li>
          <li><img src={E('handshake')} alt="" width="28" height="28" /><span><b>They sign the Parent Consent Form</b><small>Your account stays pending until their consent is verified</small></span></li>
          <li><img src={E('rocket')} alt="" width="28" height="28" /><span><b>You create your password and log in</b><small>We’ll email your activation link to {maskEmail(teenMail)}</small></span></li>
        </ol>
        <p className="ts-tip"><Icon name="bell" size={16} /> Tell {who} to look out for it now. Nothing starts until they say yes.</p>
        <div className="done-actions">
          <button type="button" className="btn btn-dark" onClick={resend} disabled={resendBusy || cooldown > 0}>
            {resendBusy ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : `Resend to ${rel ? rel.t.toLowerCase() : 'parent'}`}
          </button>
          <button type="button" className="btn btn-ghost-dark" onClick={() => { setStatus('idle'); setStep(2); }}>
            Fix their email
          </button>
        </div>
        <p className="tiny muted" role="status" aria-live="polite">{resendMsg}</p>
        <p className="tiny muted">Questions? <Link to="/paid-surveys-for-teens">How the Teen Panel works</Link> · <Link to="/contact-us">Contact us</Link></p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate ref={cardRef}>
      <SxRail steps={TEEN_STEPS} step={step} pct={pct} onGo={(n) => (n === 1 ? onBack() : go(n))} />
      <div className={`sx-pane d${dir}`} key={step}>
        {step === 2 ? (
          <>
            <h2 className="sx-h">Who’s your parent or guardian, {first}?</h2>
            <p className="sx-sub">We’ll send them the Parent/Guardian Onboarding Form. They fill it in and give permission first.</p>
            <div className="ts-guard" role="radiogroup" aria-label="My parent or guardian is" aria-invalid={Boolean(err('relation'))}>
              {GUARDIANS.map((x) => (
                <label key={x.k} className={`ts-g ${g.relation === x.k ? 'on' : ''}`} style={{ '--gc': x.c }}>
                  <input type="radio" name="relation" value={x.k} checked={g.relation === x.k}
                    onChange={() => { setG((s) => ({ ...s, relation: x.k, gender: x.k === 'legal_guardian' ? s.gender : '' })); touch('relation'); }} />
                  <span className="ts-g-ico"><Icon name={x.ic} size={26} /></span>
                  <strong>{x.t}</strong>
                  <small>{x.d}</small>
                  <span className="sx-tick"><Icon name="check" size={14} stroke={3} /></span>
                </label>
              ))}
            </div>
            {err('relation') ? <p className="f-err" role="alert">{err('relation')}</p> : null}

            {g.relation ? (
              <div className="sx-grid ts-gfields" key={g.relation}>
                <Field id="g-first" label={`${whoT}’s first name`} error={err('first')} ok={ok('first')} icon="user" half>
                  <input id="g-first" placeholder=" " autoComplete="off" maxLength={40} value={g.first} onChange={setGF('first')} {...gAria('first')} />
                </Field>
                <Field id="g-middle" label={`${whoT}’s middle name`} error={err('middle')} ok={ok('middle') && Boolean(g.middle.trim())} icon="user" half>
                  <input id="g-middle" placeholder=" " autoComplete="off" maxLength={40} value={g.middle} onChange={setGF('middle')} {...gAria('middle')} />
                </Field>
                <Field id="g-last" label={`${whoT}’s last name`} error={err('last')} ok={ok('last') && Boolean(g.last.trim())} icon="user" half>
                  <input id="g-last" placeholder=" " autoComplete="off" maxLength={40} value={g.last} onChange={setGF('last')} {...gAria('last')} />
                </Field>
                <div className={`sx-field half sx-dob ${err('dob') ? 'bad' : ''} ${ok('dob') ? 'good' : ''}`}>
                  <label className="sx-static-label" htmlFor="g-dob">{whoT}’s date of birth</label>
                  <DobPicker id="g-dob" value={g.dob} minAge={18} invalid={Boolean(err('dob'))} describedBy={err('dob') ? 'g-dob-err' : undefined}
                    onChange={(iso) => setG((s) => ({ ...s, dob: iso }))} onDone={() => touch('dob')} />
                  {err('dob') ? <p className="f-err" id="g-dob-err" role="alert">{err('dob')}</p> : null}
                </div>
                <Field id="g-email" label={`${whoT}’s email address`} error={err('email')} ok={ok('email')} hint="The onboarding form is sent here." icon="mail" half>
                  <input id="g-email" type="email" placeholder=" " autoComplete="off" maxLength={120} value={g.email} onChange={setGF('email')}
                    {...gAria('email')} onBlur={() => { touch('email'); checkDomain(g.email); }} />
                </Field>
                <div className={`sx-field half ${err('phone') ? 'bad' : ''} ${ok('phone') ? 'good' : ''}`}>
                  <span className="sx-static-label">{whoT}’s phone number</span>
                  <div className="sx-phone">
                    <CountryPicker id="g-phoneIso" mode="dial" list={COUNTRIES} value={g.phoneIso} placeholder="Code"
                      onChange={(x) => { setG((s) => ({ ...s, phoneIso: x.iso })); touch('phone'); }} invalid={Boolean(err('phone') && !g.phoneIso)} />
                    <input id="g-phone" type="tel" inputMode="numeric" autoComplete="off" placeholder="Phone number" maxLength={18} value={g.phone}
                      onChange={(e) => setG((s) => ({ ...s, phone: e.target.value.replace(/[^\d\s-]/g, '') }))} {...gAria('phone')} aria-label={`${whoT}’s phone number`} />
                  </div>
                  {err('phone') ? <p className="f-err" id="g-phone-err" role="alert">{err('phone')}</p> : <p className="f-hint">Only used to confirm who they are.</p>}
                </div>
                {legal ? (
                  <GenderPick id="g-gender" label="Guardian’s gender" value={g.gender} error={err('gender')}
                    onChange={(val) => { setG((s) => ({ ...s, gender: val })); touch('gender'); }} />
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h2 className="sx-h">Consent and confirmation</h2>
            <p className="sx-sub">Tick each box yourself. {rel ? `Your ${legal ? 'guardian' : rel.t.toLowerCase()}` : 'Your parent'} gives the real permission in the Parent Consent Form we email them. Your account stays pending until they do.</p>
            <div className="ts-consent">
              {CONSENT_BOXES.map((b) => (
                <label key={b.k} className={`sx-consent ${err(b.k) ? 'bad' : ''}`}>
                  <input type="checkbox" checked={Boolean(c[b.k])} aria-invalid={Boolean(err(b.k))}
                    onChange={(e) => { setC((s) => ({ ...s, [b.k]: e.target.checked })); touch(b.k); }} />
                  <span>
                    {b.link ? <>I have read and accept the <Link to={b.link[0]} target="_blank">{b.link[1]}</Link>.</> : b.t}
                  </span>
                </label>
              ))}
            </div>
            {CONSENT_BOXES.some((b) => err(b.k)) ? <p className="f-err" role="alert">Please tick every box to continue.</p> : null}
            <div className="sx-captcha">
              <p className="sx-mini-h"><Icon name="bot" size={18} /> Quick human check</p>
              <Captcha ref={captchaRef} error={err('captcha')} onChange={(filled) => setC((s) => ({ ...s, captchaOk: filled }))} />
            </div>
            {status === 'error' ? <p className="form-error" role="alert">{serverMsg}</p> : null}
          </>
        ) : null}
      </div>

      <div className="sx-nav">
        <button type="button" className="btn btn-ghost-dark" onClick={() => (step === 2 ? onBack() : go(2))}>
          <Icon name="arrow" size={16} className="flip" /> Back
        </button>
        <button type="submit" className="btn btn-primary btn-lg btn-shine" disabled={status === 'sending'}>
          {status === 'sending' ? <><span className="spinner" /> Submitting…</> : step === 2 ? <>Continue <Icon name="arrow" size={18} /></> : <><span>Submit<span className="ts-who"> & invite {who}</span></span> <Icon name="send" size={18} /></>}
        </button>
      </div>
    </form>
  );
}

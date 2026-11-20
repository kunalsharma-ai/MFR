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
import { GENDERS, ageFromDob } from '../utils/validate.js';
import { checkEmailDomain } from '../utils/emailChecks.js';
import {
  GUARDIANS, buildTeenPayload, maskEmail, resendGuardianInvite, submitTeenRegistration, validateGuardian, validateTeen,
} from '../utils/teenRegister.js';

// The teen panel's own registration, after "About you" (step 1 on /sign-up) shows the member is MIN_SIGNUP_AGE–17.
//   2 · You            → the teen's email + gender
//   3 · Your guardian  → Mother / Father / Legal guardian, their name, DOB, email (+ gender and phone for a legal guardian), CAPTCHA
//   4 · Parent invite  → the parent onboarding form is emailed to the guardian; teen is told what happens next
export const TEEN_STEPS = [
  { n: 1, t: 'About you', icon: 'user' },
  { n: 2, t: 'You', icon: 'mail' },
  { n: 3, t: 'Your guardian', icon: 'family' },
  { n: 4, t: 'Parent invite', icon: 'send' },
];
const FIELDS = { 2: ['email', 'gender'], 3: ['relation', 'name', 'dob', 'email', 'gender', 'phone', 'captcha', 'agree'] };
const RESEND_WAIT = 30;
const E = (n) => `/images/minor/emoji/${n}.webp`;

function GenderPick({ id, value, onChange, error, label }) {
  return (
    <div className={`sx-field ${error ? 'bad' : ''}`}>
      <span className="sx-static-label" id={`${id}-lbl`}>{label}</span>
      <div className="sx-genders" role="radiogroup" aria-labelledby={`${id}-lbl`} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined}>
        {GENDERS.map((g) => (
          <label key={g} className={`sx-gender ${value === g ? 'on' : ''}`}>
            <input type="radio" name={id} value={g} checked={value === g} onChange={() => onChange(g)} />
            {g}
          </label>
        ))}
      </div>
      {error ? <p className="f-err" id={`${id}-err`} role="alert">{error}</p> : null}
    </div>
  );
}

export default function TeenSignup({ seed, switched, referredBy = '', onBack, onProgress }) {
  const [step, setStep] = useState(2);
  const [dir, setDir] = useState(1);
  const [t, setT] = useState({ email: seed.email || '', gender: GENDERS.includes(seed.gender) ? seed.gender : '' });
  const [g, setG] = useState({ relation: '', name: '', dob: '', email: '', gender: '', phoneIso: seed.phoneIso || seed.country || '', phone: '', captchaOk: false, agree: false });
  const [touched, setTouched] = useState({});
  const [domainMsg, setDomainMsg] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [serverMsg, setServerMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState('');
  const [resendBusy, setResendBusy] = useState(false);
  const cardRef = useRef(null);
  const captchaRef = useRef(null);
  const age = ageFromDob(seed.dob);
  const first = seed.firstName.trim();

  const errors = useMemo(() => {
    const e = step === 2 ? validateTeen(t) : validateGuardian(g, t.email);
    const dm = domainMsg[step === 2 ? 't' : 'g'];
    const val = (step === 2 ? t.email : g.email).trim().toLowerCase();
    if (!e.email && dm?.msg && dm.value === val) e.email = dm.msg;
    return e;
  }, [step, t, g, domainMsg]);
  const err = (k) => (touched[`${step}.${k}`] ? errors[k] : undefined);
  const ok = (k) => touched[`${step}.${k}`] && !errors[k];
  const touch = (k) => setTouched((s) => ({ ...s, [`${step}.${k}`]: true }));
  const shownStep = status === 'sent' ? 4 : step;
  const pct = status === 'sent' ? 100 : railPct(step, TEEN_STEPS.length, FIELDS[step].length, Object.keys(errors).length);

  useEffect(() => { onProgress?.(shownStep, pct); }, [shownStep, pct]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function checkDomain(which, raw) {
    const val = String(raw || '').trim().toLowerCase();
    if (!val.includes('@')) return '';
    if (domainMsg[which]?.value === val) return domainMsg[which].msg;
    const msg = await checkEmailDomain(val).catch(() => '');
    setDomainMsg((s) => ({ ...s, [which]: { value: val, msg } }));
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
      if (await checkDomain('t', t.email)) return showAll();
      return go(3);
    }
    if (status === 'sending') return;
    if (await checkDomain('g', g.email)) return showAll();
    setStatus('sending');
    setServerMsg('');
    const dial = (COUNTRIES.find((c) => c.iso === g.phoneIso) || {}).dial || '';
    try {
      await submitTeenRegistration(buildTeenPayload({ ...seed, ...t }, g, {
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
      setG((s) => ({ ...s, captchaOk: false }));
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
        <h2>Invite sent to {who}!</h2>
        <p>
          We’ve emailed the parent onboarding form to <strong>{g.name.trim().split(/\s+/)[0]}</strong> at{' '}
          <strong>{maskEmail(g.email.trim().toLowerCase())}</strong>. Ask them to open it and fill in every part. It takes about five minutes.
        </p>
        <ol className="ts-next">
          <li><img src={E('mail')} alt="" width="28" height="28" /><span><b>{rel ? rel.t : 'Parent'} opens the email</b><small>Subject: “{first} wants to join the MyFrequentRewards teen panel”</small></span></li>
          <li><img src={E('parenting')} alt="" width="28" height="28" /><span><b>They fill in the parent form</b><small>16 short questions: about them, the household, staying in touch and your health</small></span></li>
          <li><img src={E('handshake')} alt="" width="28" height="28" /><span><b>Two yeses</b><small>They give permission first, then you say yes too</small></span></li>
          <li><img src={E('rocket')} alt="" width="28" height="28" /><span><b>Explore your 13 worlds</b><small>We’ll email you at {maskEmail(t.email.trim().toLowerCase())} the moment you’re in</small></span></li>
        </ol>
        <p className="ts-tip"><Icon name="bell" size={16} /> Tell {who} to look out for it now. Nothing starts until they say yes.</p>
        <div className="done-actions">
          <button type="button" className="btn btn-dark" onClick={resend} disabled={resendBusy || cooldown > 0}>
            {resendBusy ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : `Resend to ${rel ? rel.t.toLowerCase() : 'parent'}`}
          </button>
          <button type="button" className="btn btn-ghost-dark" onClick={() => { setStatus('idle'); setStep(3); }}>
            Fix their email
          </button>
        </div>
        <p className="tiny muted" role="status" aria-live="polite">{resendMsg}</p>
        <p className="tiny muted">Questions? <Link to="/paid-surveys-for-minors">How the teen panel works</Link> · <Link to="/contact-us">Contact us</Link></p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate ref={cardRef}>
      <SxRail steps={TEEN_STEPS} step={step} pct={pct} onGo={(n) => (n === 1 ? onBack() : go(n))} />
      <div className={`sx-pane d${dir}`} key={step}>
        {step === 2 ? (
          <>
            {switched ? (
              <div className="ts-switch" role="status">
                <span className="ts-switch-art" aria-hidden="true">
                  <img src="/images/minor/emoji/rocket.webp" alt="" width="44" height="44" />
                </span>
                <span>
                  <b>You’re {age}, so you’re joining the teen panel</b>
                  <small>Since you’re a teen, your registration continues through the teen panel. A parent or guardian says yes before any survey starts.</small>
                </span>
              </div>
            ) : null}
            <h2 className="sx-h">Nice to meet you, {first}! <img className="ts-wave" src="/images/minor/emoji/wave.webp" alt="" width="30" height="30" /></h2>
            <p className="sx-sub">Where should we reach you? We’ll tell you here the moment your parent says yes.</p>
            <div className="sx-grid">
              <Field id="t-email" label="Your email address" error={err('email')} ok={ok('email')} hint="Your own email. Your parent’s comes next." icon="mail">
                <input id="t-email" type="email" placeholder=" " autoComplete="email" maxLength={120} value={t.email}
                  onChange={(e) => setT((s) => ({ ...s, email: e.target.value }))}
                  onBlur={() => { touch('email'); checkDomain('t', t.email); }}
                  aria-invalid={Boolean(err('email'))} aria-describedby={err('email') ? 't-email-err' : 't-email-hint'} />
              </Field>
              <GenderPick id="t-gender" label="What is your gender?" value={t.gender} error={err('gender')}
                onChange={(val) => { setT((s) => ({ ...s, gender: val })); touch('gender'); }} />
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h2 className="sx-h">Who’s your parent or guardian?</h2>
            <p className="sx-sub">We’ll send them the parent onboarding form. They fill it in and give permission first.</p>
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
                <Field id="g-name" label={`${legal ? 'Guardian' : rel.t}’s full name`} error={err('name')} ok={ok('name')} icon="user">
                  <input id="g-name" placeholder=" " autoComplete="off" maxLength={80} value={g.name}
                    onChange={(e) => setG((s) => ({ ...s, name: e.target.value }))} onBlur={() => touch('name')}
                    aria-invalid={Boolean(err('name'))} aria-describedby={err('name') ? 'g-name-err' : undefined} />
                </Field>
                <div className={`sx-field half sx-dob ${err('dob') ? 'bad' : ''} ${ok('dob') ? 'good' : ''}`}>
                  <label className="sx-static-label" htmlFor="g-dob">Their date of birth</label>
                  <DobPicker id="g-dob" value={g.dob} minAge={18} invalid={Boolean(err('dob'))} describedBy={err('dob') ? 'g-dob-err' : undefined}
                    onChange={(iso) => setG((s) => ({ ...s, dob: iso }))} onDone={() => touch('dob')} />
                  {err('dob') ? <p className="f-err" id="g-dob-err" role="alert">{err('dob')}</p> : null}
                </div>
                <Field id="g-email" label="Their email address" error={err('email')} ok={ok('email')} hint="The parent form is sent here." icon="mail" half>
                  <input id="g-email" type="email" placeholder=" " autoComplete="off" maxLength={120} value={g.email}
                    onChange={(e) => setG((s) => ({ ...s, email: e.target.value }))}
                    onBlur={() => { touch('email'); checkDomain('g', g.email); }}
                    aria-invalid={Boolean(err('email'))} aria-describedby={err('email') ? 'g-email-err' : 'g-email-hint'} />
                </Field>
                {legal ? (
                  <>
                    <GenderPick id="g-gender" label="Their gender" value={g.gender} error={err('gender')}
                      onChange={(val) => { setG((s) => ({ ...s, gender: val })); touch('gender'); }} />
                    <div className={`sx-field ${err('phone') ? 'bad' : ''} ${ok('phone') ? 'good' : ''}`}>
                      <span className="sx-static-label">Their mobile number</span>
                      <div className="sx-phone">
                        <CountryPicker id="g-phoneIso" mode="dial" list={COUNTRIES} value={g.phoneIso} placeholder="Code"
                          onChange={(c) => { setG((s) => ({ ...s, phoneIso: c.iso })); touch('phone'); }} invalid={Boolean(err('phone') && !g.phoneIso)} />
                        <input id="g-phone" type="tel" inputMode="numeric" autoComplete="off" placeholder="Mobile number" maxLength={18} value={g.phone}
                          onChange={(e) => setG((s) => ({ ...s, phone: e.target.value.replace(/[^\d\s-]/g, '') }))} onBlur={() => touch('phone')}
                          aria-invalid={Boolean(err('phone'))} aria-describedby={err('phone') ? 'g-phone-err' : undefined} aria-label="Their mobile number" />
                      </div>
                      {err('phone') ? <p className="f-err" id="g-phone-err" role="alert">{err('phone')}</p> : <p className="f-hint">We only use it to confirm who they are.</p>}
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}

            <div className="sx-captcha">
              <p className="sx-mini-h"><Icon name="bot" size={18} /> Quick human check</p>
              <Captcha ref={captchaRef} error={err('captcha')} onChange={(okc) => { setG((s) => ({ ...s, captchaOk: okc })); }} />
            </div>
            <label className={`sx-consent ${err('agree') ? 'bad' : ''}`}>
              <input type="checkbox" checked={g.agree} onChange={(e) => { setG((s) => ({ ...s, agree: e.target.checked })); touch('agree'); }} aria-invalid={Boolean(err('agree'))} />
              <span>{rel ? `My ${legal ? 'guardian' : rel.t.toLowerCase()}` : 'My parent or guardian'} knows I’m signing up, and these are their real details. I understand nothing starts until they say yes.</span>
            </label>
            {err('agree') ? <p className="f-err" role="alert">{err('agree')}</p> : null}
            {status === 'error' ? <p className="form-error" role="alert">{serverMsg}</p> : null}
          </>
        ) : null}
      </div>

      <div className="sx-nav">
        <button type="button" className="btn btn-ghost-dark" onClick={() => (step === 2 ? onBack() : go(2))}>
          <Icon name="arrow" size={16} className="flip" /> Back
        </button>
        <button type="submit" className="btn btn-primary btn-lg btn-shine" disabled={status === 'sending'}>
          {status === 'sending' ? <><span className="spinner" /> Sending invite…</> : step === 2 ? <>Continue <Icon name="arrow" size={18} /></> : <><span>Send invite<span className="ts-who"> to {who}</span></span> <Icon name="send" size={18} /></>}
        </button>
      </div>
    </form>
  );
}

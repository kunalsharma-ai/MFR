// Teen (13–17) sign-up, inside the same Sign up page, card and look as Consumer and Professional (SignUp.jsx).
// Steps: 1 About you → 2 Stay in touch (email, phone, where you live) → 3 Your parent → 4 Agree → "invite sent".
// After that the parent says yes or no from their email (/teen/parent), the teen creates a password on the same
// Set password page as everyone (/set-password?type=teen), logs in on the same Log in page, and answers the same
// welcome survey. Everything typed stays in this tab (sessionStorage) until the invite is sent; an under-13 birthday
// is never stored. The server re-checks every rule (api/app/teen/rules.js).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import Captcha from './Captcha.jsx';
import CountryPicker from './CountryPicker.jsx';
import CityCombo from './CityCombo.jsx';
import DobPicker from './DobPicker.jsx';
import Field from './SxField.jsx';
import SxRail, { railPct } from './SxRail.jsx';
import { COUNTRIES } from '../data/countries.js';
import { detectCountry } from '../utils/geo.js';
import { err, fmtDate } from '../teen/i18n.js';
import * as R from '../teen/rules.js';
import { teenApi, relationLabel } from '../teen/api.js';
import { country as loadCountry, zipHint } from '../teen/geo.js';
import { TEEN_CONSENT } from '../teen/data/teenConsent.js';
import { ASSENT } from '../teen/data/consent.js';
import { useDraft, newKey } from '../teen/ui.jsx';
import { useLinkToken } from '../teen/link.js';

export const TEEN_STEPS = [
  { n: 1, t: 'About you', icon: 'user', art: 'Tell us who you are' },
  { n: 2, t: 'Stay in touch', icon: 'mail', art: 'Where you live and how we reach you' },
  { n: 3, t: 'Your parent', icon: 'family', art: 'Who will say yes for you?' },
  { n: 4, t: 'Agree', icon: 'shield', art: 'Tick what you agree to' },
];
const DRAFT = 'mfr.teen.reg.v3';
const EMPTY = {
  step: 1,
  teen: { firstName: '', middleName: '', lastName: '', dob: '', email: '', phone: { country: '', number: '' }, gender: '', genderSelf: '', location: { country: '', countryName: '', stateCode: '', state: '', stateManual: false, city: '', zip: '', noZip: false } },
  guardian: { relation: '', firstName: '', middleName: '', lastName: '', dob: '', email: '', phone: { country: '', number: '' }, gender: '' },
  accepted: {},
  key: '',
  result: null,
};
const RELATIONS = [
  ['mother', 'Mother', 'My mum gives permission', 'heart'],
  ['father', 'Father', 'My dad gives permission', 'user'],
  ['legal_guardian', 'Legal guardian', 'Another adult legally responsible for me', 'shield'],
];
const GENDER_LABEL = { Male: 'Male', Female: 'Female', Other: 'Other' };
// which fields each step checks
const STEP_KEYS = {
  1: ['firstName', 'middleName', 'lastName', 'dob', 'gender', 'genderSelf'],
  2: ['email', 'phone', 'country', 'state', 'city', 'zip'],
  3: ['relation', 'g.firstName', 'g.middleName', 'g.lastName', 'g.dob', 'g.email', 'g.phone', 'g.gender'],
  4: ['consent', 'captcha'],
};
const STAGES = [
  ['pending_guardian_approval', 'mail', (rel) => `Your ${rel} chooses YES or NO`],
  ['guardian_approved', 'check', () => 'They fill in a short form'],
  ['pending_consent', 'shield', () => 'They give their consent'],
  ['pending_password', 'key', () => 'You create your password'],
  ['active', 'rocket', () => 'Your account is active'],
];
const ORDER = { initial_registration: 0, pending_guardian_approval: 0, guardian_approved: 1, pending_onboarding: 1, manual_review: 2, pending_consent: 2, pending_password: 3, active: 4 };
const ENDED = { rejected: 'Your parent or guardian said no, so this registration is closed and no account was created.', cancelled: 'This registration was cancelled. No account was created.', expired: 'The link ran out before your parent or guardian answered. You can register again at any time.' };

function useCountryData(iso) {
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!iso) { setC(null); return undefined; }
    let live = true;
    setLoading(true);
    loadCountry(iso).then((x) => { if (live) setC(x); }).catch(() => { if (live) setC({ i: iso, z: '', s: [] }); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [iso]);
  return [c, loading];
}
// rules.validateTeen expects the dataBank shape: { IN: { states: { DL: { name } }, zipFormat } }
const worldFor = (iso, data) => (iso && data ? { [iso]: { zipFormat: data.z || '', states: Object.fromEntries((data.s || []).map((s) => [s.c, { name: s.n }])) } } : {});
const dialOf = (iso) => (COUNTRIES.find((c) => c.iso === iso)?.dial || '').replace(/\D/g, '');

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export default function TeenSignup({ seed, onSwitch, onView }) {
  const [d, setD, clearDraft] = useDraft(DRAFT, EMPTY);
  const statusToken = useLinkToken('status'); // ?t= from the "track my registration" email
  const [status, setStatus] = useState(null); // live status from the server
  const [touched, setTouched] = useState({});
  const [tried, setTried] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [captchaOk, setCaptchaOk] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const sent = useRef(false);
  const captchaRef = useRef(null);
  const cardRef = useRef(null);
  const tn = d.teen;
  const g = d.guardian;
  const loc = tn.location;
  const [cdata, cLoading] = useCountryData(loc.country);

  // what was typed on the Consumer / Professional form before switching to Teen comes along
  useEffect(() => {
    if (!seed) return;
    setD((s) => ({
      ...s,
      teen: {
        ...s.teen,
        firstName: s.teen.firstName || seed.firstName || '',
        lastName: s.teen.lastName || seed.lastName || '',
        email: s.teen.email || seed.email || '',
        dob: s.teen.dob || (R.classifyDob(seed.dob) === 'teen' ? seed.dob : ''),
        gender: s.teen.gender || (['Female', 'Male'].includes(seed.gender) ? seed.gender : ''),
        location: s.teen.location.country ? s.teen.location : { ...s.teen.location, country: seed.country || '', countryName: COUNTRIES.find((c) => c.iso === seed.country)?.name || '' },
        phone: s.teen.phone.country ? s.teen.phone : { country: seed.phoneIso || seed.country || '', number: s.teen.phone.number },
      },
    }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Country and phone code come from the member's IP (or, if that service can't answer, their time zone). They can
  // still change both. Nothing is overwritten once chosen.
  useEffect(() => {
    const ctrl = new AbortController();
    detectCountry({ signal: ctrl.signal }).then((iso) => {
      if (!iso || ctrl.signal.aborted) return;
      const c = COUNTRIES.find((x) => x.iso.toLowerCase() === iso);
      if (!c) return;
      setD((s) => ({
        ...s,
        teen: {
          ...s.teen,
          location: s.teen.location.country ? s.teen.location : { ...s.teen.location, country: c.iso, countryName: c.name },
          phone: s.teen.phone.country ? s.teen.phone : { ...s.teen.phone, country: c.iso },
        },
      }));
    });
    return () => ctrl.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // The "Track my registration" link in the teen's email also carries ?v=<token>: opening it confirms the email.
  const [emailOk, setEmailOk] = useState(false);
  useEffect(() => {
    const u = new URL(window.location.href);
    const v = u.searchParams.get('v');
    if (!v) return;
    u.searchParams.delete('v');
    window.history.replaceState(window.history.state, '', `${u.pathname}${u.search}${u.hash}`);
    teenApi.verifyEmail(v).then(() => setEmailOk(true)).catch(() => {});
  }, []);

  // opened from the status link: show where the registration is
  useEffect(() => {
    if (!statusToken) return;
    teenApi.status(statusToken).then((v) => { setStatus(v); setD((s) => ({ ...s, step: 5, result: s.result || { reference: v.reference, firstName: v.teenFirstName, guardianEmail: v.guardian?.emailMasked, relation: v.guardian?.relation, expiresAt: v.expiresAt, statusToken } })); }).catch(() => {});
  }, [statusToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const errors = useMemo(() => {
    const e = R.validateTeen(tn, { world: worldFor(loc.country, cdata) });
    if (loc.country && !cdata) delete e.country; // still loading the country file
    Object.entries(R.validateGuardian(g, tn)).forEach(([k, v]) => { e[`g.${k}`] = v; });
    if (TEEN_CONSENT.items.some((i) => i.required && d.accepted[i.id] !== true)) e.consent = 'consent_required';
    if (!captchaOk) e.captcha = 'captcha';
    return e;
  }, [tn, g, loc.country, cdata, d.accepted, captchaOk]); // eslint-disable-line react-hooks/exhaustive-deps

  const step = d.step;
  const stepErrors = (n) => (STEP_KEYS[n] || []).filter((k) => errors[k]);
  const pct = step > 4 ? 100 : railPct(step, TEEN_STEPS.length, STEP_KEYS[step].length, stepErrors(step).length);
  useEffect(() => { onView?.({ step: Math.min(step, 4), pct, sent: step > 4, firstName: d.result?.firstName || tn.firstName, lastName: step > 4 ? '' : tn.lastName, country: step > 4 ? (d.result?.country || loc.country) : loc.country }); }, [step, pct, tn.firstName, tn.lastName, loc.country, d.result?.country]); // eslint-disable-line react-hooks/exhaustive-deps

  const show = (k) => ((tried[step] || touched[k]) && errors[k] ? errorText(k, errors[k]) : '');
  const touch = (k) => setTouched((x) => ({ ...x, [k]: true }));
  const setT = (k, v) => setD((s) => ({ ...s, teen: { ...s.teen, [k]: v } }));
  const setLoc = (patch) => setD((s) => ({ ...s, teen: { ...s.teen, location: { ...s.teen.location, ...patch } } }));
  const setG = (k, v) => setD((s) => ({ ...s, guardian: { ...s.guardian, [k]: v } }));
  const go = (n) => { setD((s) => ({ ...s, step: n })); setMsg(''); cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const focusFirstBad = () => setTimeout(() => cardRef.current?.querySelector('[aria-invalid="true"]')?.focus(), 40);

  const age = R.ageOn(tn.dob);
  const route = tn.dob ? R.classifyDob(tn.dob) : '';
  const next = () => {
    setTried((x) => ({ ...x, [step]: true }));
    if (step === 1 && route === 'blocked') { clearDraft(); setD(EMPTY); setBlocked(true); return; }
    if (stepErrors(step).length) { focusFirstBad(); return; }
    go(step + 1);
  };

  const submit = async () => {
    setTried((x) => ({ ...x, 4: true }));
    setMsg('');
    if (stepErrors(4).length) { focusFirstBad(); return; }
    if (sent.current) return; // one request at a time: a double click can never send two
    sent.current = true;
    setBusy(true);
    const key = d.key || newKey();
    if (!d.key) setD((s) => ({ ...s, key }));
    const { phone, ...teen } = tn;
    const ph = (p) => (p?.number ? { country: p.country, number: p.number } : undefined);
    try {
      const res = await teenApi.register({
        idempotencyKey: key,
        teen: { ...teen, email: R.normEmail(teen.email), ...(ph(phone) ? { phone: ph(phone) } : {}), language: document.documentElement.lang || 'en' },
        guardian: { ...g, email: R.normEmail(g.email), phone: ph(g.phone) },
        consent: { version: TEEN_CONSENT.version, accepted: Object.fromEntries(TEEN_CONSENT.items.map((i) => [i.id, d.accepted[i.id] === true])) },
      });
      // the invite is out: forget everything typed, keep only the receipt for this tab
      const result = { ...res, firstName: tn.firstName, email: R.normEmail(tn.email), relation: g.relation, country: loc.country, guardianEmail: res.guardianEmail || R.maskEmail(g.email) };
      setD({ ...EMPTY, step: 5, result });
      try { if (res.statusToken) sessionStorage.setItem('mfr.teen.status', res.statusToken); } catch { /* */ }
    } catch (e) {
      sent.current = false;
      setBusy(false);
      captchaRef.current?.refresh?.();
      const f = e.fields || {};
      if (e.code === 'under_13') { clearDraft(); setD(EMPTY); setBlocked(true); return; }
      if (e.code === 'adult') { setTried((x) => ({ ...x, 1: true })); go(1); return; }
      if (['email_taken', 'pending_exists'].includes(e.code) || ['email_taken', 'pending_exists'].includes(f.email)) {
        setD((s) => ({ ...s, key: '', emailErr: { value: R.normEmail(s.teen.email), code: f.email || e.code } }));
        go(2);
        return;
      }
      if (e.code === 'validation') {
        const keys = Object.keys(f);
        setD((s) => ({ ...s, key: '' }));
        if (keys.some((k) => k.startsWith('guardian.'))) { setTried((x) => ({ ...x, 3: true })); go(3); return; }
        if (keys.length) { setTried((x) => ({ ...x, 1: true, 2: true })); go(keys.some((k) => ['firstName', 'lastName', 'dob', 'gender'].includes(k)) ? 1 : 2); return; }
      }
      setMsg(err(e.code) || err('server')); // a network error keeps the same key, so trying again can never create two
    }
  };

  if (blocked) {
    return (
      <div className="sx-done" role="status" ref={cardRef}>
        <div className="done-check is-stop"><Icon name="clock" size={40} stroke={2.2} /></div>
        <h2>Not quite yet!</h2>
        <p>Teen membership starts when you turn 13. We can’t create an account or keep any details before then, so come back on your 13th birthday!</p>
        <p className="tiny muted"><Icon name="lock" size={13} /> Nothing you typed has been saved.</p>
        <div className="done-actions">
          <Link to="/" className="btn btn-primary"><Icon name="home" size={18} /> Back to the home page</Link>
          <button type="button" className="btn btn-ghost-dark" onClick={() => setBlocked(false)}>I typed my birthday wrong</button>
        </div>
      </div>
    );
  }
  if (step > 4) return <Sent r={d.result || {}} status={status} emailOk={emailOk || Boolean(status?.emailVerified)} onRestart={() => { clearDraft(); setD(EMPTY); setStatus(null); }} cardRef={cardRef} />;

  const relLabel = relationLabel(g.relation || '').toLowerCase() || 'parent';
  const sOpts = cdata?.s || [];
  const hasStates = sOpts.length > 0;
  const cities = (sOpts.find((s) => s.c === loc.stateCode)?.ci) || [];
  const zipFormat = cdata?.z || '';
  const emailSrvErr = d.emailErr && R.normEmail(tn.email) === d.emailErr.value ? err(d.emailErr.code) : '';

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (step < 4) next(); else submit(); }} noValidate ref={cardRef}>
      <SxRail steps={TEEN_STEPS} step={step} pct={pct} onGo={(n) => go(n)} />
      <div className="sx-pane d1" key={step}>
        {step === 1 ? (
          <>
            <h2 className="sx-h">Hi there! Who’s joining?</h2>
            <TypeCards value="teen" onSwitch={onSwitch} />
            <div className="sx-grid">
              <div className="sx-names">
              <Text id="t-firstName" label="First name" icon="user" value={tn.firstName} onChange={(v) => setT('firstName', v)} onBlur={() => touch('firstName')} error={show('firstName')} ok={touched.firstName && !errors.firstName} autoComplete="given-name" />
              <Text id="t-middleName" label="Middle name" hint="Optional" icon="user" value={tn.middleName} onChange={(v) => setT('middleName', v)} onBlur={() => touch('middleName')} error={show('middleName')} autoComplete="additional-name" />
              <Text id="t-lastName" label="Last name" icon="user" value={tn.lastName} onChange={(v) => setT('lastName', v)} onBlur={() => touch('lastName')} error={show('lastName')} ok={touched.lastName && !errors.lastName} autoComplete="family-name" />
              </div>
              <div className={`sx-field half sx-dob ${show('dob') ? 'bad' : ''} ${touched.dob && !errors.dob ? 'good' : ''}`}>
                <label className="sx-static-label" htmlFor="t-dob">Date of birth</label>
                <DobPicker id="t-dob" value={tn.dob} minAge={13} invalid={Boolean(show('dob'))} describedBy={show('dob') ? 't-dob-err' : 't-dob-hint'}
                  onChange={(iso) => setT('dob', iso)} onDone={() => touch('dob')} />
                {show('dob') ? (
                  <p className="f-err" id="t-dob-err" role="alert">
                    {show('dob')}
                    {route === 'adult' ? <> <button type="button" className="sx-link" onClick={() => onSwitch('consumer')}>Join as a Consumer</button></> : null}
                  </p>
                ) : (
                  <p className="f-hint" id="t-dob-hint">{Number.isFinite(age) && age >= 13 && age <= 17 ? `You’re ${age}: perfect for Teen membership.` : 'Teen membership is for ages 13 to 17.'}</p>
                )}
              </div>
              <div className={`sx-field ${show('gender') ? 'bad' : ''}`} style={{ gridColumn: '1 / -1' }}>
                <span className="sx-static-label" id="t-gender-lbl">What is your gender?</span>
                <div className="sx-genders" role="radiogroup" aria-labelledby="t-gender-lbl" aria-invalid={Boolean(show('gender'))}>
                  {R.TEEN_GENDERS.map((x) => (
                    <label key={x} className={`sx-gender ${tn.gender === x ? 'on' : ''}`}>
                      <input type="radio" name="t-gender" value={x} checked={tn.gender === x} onChange={() => { setT('gender', x); touch('gender'); }} />
                      {GENDER_LABEL[x]}
                    </label>
                  ))}
                </div>
                {show('gender') ? <p className="f-err" role="alert">{show('gender')}</p> : null}
              </div>
            </div>
            <p className="sx-note"><Icon name="shield" size={16} /> Under 18 you join with a parent or guardian’s OK. We’ll email them after the last step.</p>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2 className="sx-h">Where should your invitations land?</h2>
            <p className="sx-sub">Your email becomes your username. You’ll get a link to create your password once your parent or guardian says yes.</p>
            <div className="sx-grid">
              <Text id="t-email" type="email" label="Email address" icon="mail" value={tn.email} onChange={(v) => setT('email', v.trim())} onBlur={() => touch('email')}
                error={show('email') || emailSrvErr} ok={touched.email && !errors.email && !emailSrvErr} hint="This becomes your username." autoComplete="email" maxLength={254} />
              <Phone id="t-phone" label="Mobile number (optional)" value={tn.phone} onChange={(v) => setT('phone', v)} error={show('phone')} hint="Only if you have one. We never call without asking." />
              <div className={`sx-field ${show('country') ? 'bad' : ''}`} style={{ gridColumn: '1 / -1' }}>
                <span className="sx-static-label" id="t-country-lbl">Country you live in</span>
                <CountryPicker id="t-country" list={COUNTRIES} value={loc.country} invalid={Boolean(show('country'))} describedBy="t-country-lbl"
                  onChange={(c) => { setLoc({ country: c.iso, countryName: c.name, stateCode: '', state: '', stateManual: false, city: '', zip: '', noZip: false }); touch('country'); if (!tn.phone.country) setT('phone', { ...tn.phone, country: c.iso }); }} />
                {show('country') ? <p className="f-err" role="alert">{show('country')}</p> : null}
              </div>
              {loc.country ? (
                <>
                  <Field id="t-state" label={hasStates ? 'State / province / region' : 'State / region (optional)'} icon="pin" half error={show('state')} hint={cLoading ? 'Loading…' : hasStates ? '' : 'This country has no states on our list. Type yours if you like.'}>
                    {hasStates && !loc.stateManual ? (
                      <select id="t-state" className={loc.stateCode ? 'has-val' : ''} value={loc.stateCode} aria-invalid={Boolean(show('state'))}
                        onChange={(e) => { if (e.target.value === '__type') setLoc({ stateCode: '', state: '', stateManual: true, city: '' }); else setLoc({ stateCode: e.target.value, state: sOpts.find((s) => s.c === e.target.value)?.n || '', stateManual: false, city: '' }); touch('state'); }}>
                        <option value="" disabled hidden />
                        {sOpts.map((s) => <option key={s.c} value={s.c}>{s.n}</option>)}
                        <option value="__type">Not listed: I’ll type it</option>
                      </select>
                    ) : (
                      <input id="t-state" placeholder=" " maxLength={80} value={loc.state} aria-invalid={Boolean(show('state'))}
                        onChange={(e) => setLoc({ state: e.target.value, stateCode: '', stateManual: true })} onBlur={() => touch('state')} />
                    )}
                  </Field>
                  <Field id="t-city" label="Town / city" icon="home" half error={cityOpen ? '' : show('city')} hint={cities.length ? 'Type to search, or type your own.' : ''}>
                    <CityCombo id="t-city" value={loc.city} cities={cities} invalid={Boolean(!cityOpen && show('city'))} onOpenChange={setCityOpen}
                      onChange={(v) => setLoc({ city: v })} onBlur={() => touch('city')} />
                  </Field>
                  <Field id="t-zip" label={zipFormat ? 'ZIP / postal code' : 'ZIP / postal code (optional)'} icon="mail" half error={loc.noZip ? '' : show('zip')}
                    hint={zipHint(zipFormat) ? `For example ${zipHint(zipFormat)}` : ''}>
                    <input id="t-zip" placeholder=" " maxLength={12} value={loc.zip} disabled={loc.noZip} aria-invalid={Boolean(!loc.noZip && show('zip'))}
                      onChange={(e) => setLoc({ zip: e.target.value.toUpperCase(), noZip: false })} onBlur={() => touch('zip')} autoComplete="postal-code" />
                  </Field>
                  <label className="sx-consent half sx-nozip">
                    <input type="checkbox" checked={Boolean(loc.noZip)} onChange={(e) => setLoc({ noZip: e.target.checked, zip: e.target.checked ? '' : loc.zip })} />
                    <span>I don’t have a postal code</span>
                  </label>
                </>
              ) : null}
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h2 className="sx-h">Who will say yes for you?</h2>
            <p className="sx-sub">Pick one adult. We’ll email them a secure link to approve or decline. Nothing switches on until they say yes.</p>
            <div className="sx-types sx-types-3" role="radiogroup" aria-label="Your parent or guardian">
              {RELATIONS.map(([k, l, dd, ic]) => (
                <label key={k} className={`sx-type ${g.relation === k ? 'on' : ''}`}>
                  <input type="radio" name="relation" value={k} checked={g.relation === k}
                    onChange={() => setD((s) => ({ ...s, guardian: { ...s.guardian, relation: k, gender: k === 'legal_guardian' ? s.guardian.gender : '' } }))} />
                  <span className="sx-type-ico"><Icon name={ic} size={26} /></span>
                  <strong>{l}</strong>
                  <small>{dd}</small>
                  <span className="sx-tick"><Icon name="check" size={14} stroke={3} /></span>
                </label>
              ))}
            </div>
            {show('g.relation') ? <p className="f-err" role="alert" aria-invalid="true" tabIndex={-1}>{show('g.relation')}</p> : null}
            {g.relation ? (
              <div className="sx-grid">
                <Text id="g-firstName" label="Their first name" icon="user" half value={g.firstName} onChange={(v) => setG('firstName', v)} onBlur={() => touch('g.firstName')} error={show('g.firstName')} ok={touched['g.firstName'] && !errors['g.firstName']} />
                <Text id="g-middleName" label="Middle name (optional)" icon="user" half value={g.middleName} onChange={(v) => setG('middleName', v)} onBlur={() => touch('g.middleName')} error={show('g.middleName')} />
                <Text id="g-lastName" label="Their last name" icon="user" half value={g.lastName} onChange={(v) => setG('lastName', v)} onBlur={() => touch('g.lastName')} error={show('g.lastName')} ok={touched['g.lastName'] && !errors['g.lastName']} />
                <div className={`sx-field half sx-dob ${show('g.dob') ? 'bad' : ''}`}>
                  <label className="sx-static-label" htmlFor="g-dob">Their date of birth</label>
                  <DobPicker id="g-dob" value={g.dob} minAge={18} invalid={Boolean(show('g.dob'))} describedBy={show('g.dob') ? 'g-dob-err' : undefined} onChange={(iso) => setG('dob', iso)} onDone={() => touch('g.dob')} />
                  {show('g.dob') ? <p className="f-err" id="g-dob-err" role="alert">{show('g.dob')}</p> : null}
                </div>
                <Text id="g-email" type="email" label="Their email address" icon="mail" value={g.email} onChange={(v) => setG('email', v.trim())} onBlur={() => touch('g.email')}
                  error={show('g.email')} ok={touched['g.email'] && !errors['g.email']} hint="We email them a secure link to approve or decline. It must be their own inbox." maxLength={254} />
                <Phone id="g-phone" label="Their mobile number (optional)" value={g.phone} onChange={(v) => setG('phone', v)} error={show('g.phone')} />
                {g.relation === 'legal_guardian' ? (
                  <div className={`sx-field ${show('g.gender') ? 'bad' : ''}`} style={{ gridColumn: '1 / -1' }}>
                    <span className="sx-static-label" id="g-gender-lbl">Their gender</span>
                    <div className="sx-genders" role="radiogroup" aria-labelledby="g-gender-lbl" aria-invalid={Boolean(show('g.gender'))}>
                      {R.GUARDIAN_GENDERS.map((x) => (
                        <label key={x} className={`sx-gender ${g.gender === x ? 'on' : ''}`}>
                          <input type="radio" name="g-gender" value={x} checked={g.gender === x} onChange={() => { setG('gender', x); touch('g.gender'); }} />
                          {GENDER_LABEL[x]}
                        </label>
                      ))}
                    </div>
                    {show('g.gender') ? <p className="f-err" role="alert">{show('g.gender')}</p> : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}

        {step === 4 ? (
          <>
            <h2 className="sx-h">Read it, then tick it</h2>
            <p className="sx-sub">Each box is separate and nothing is ticked for you. Your tick is your own decision. It doesn’t replace your {relLabel}’s permission: they give that separately.</p>
            <details className="sx-teen-info">
              <summary><Icon name="book" size={16} /> What joining as a teen means</summary>
              <ul>{ASSENT.map((a) => <li key={a}>{a}</li>)}</ul>
              <p className="tiny muted">
                <Link to="/terms" target="_blank" rel="noopener">Terms of Use</Link> · <Link to="/privacy" target="_blank" rel="noopener">Privacy Policy</Link> · <Link to="/teen-terms" target="_blank" rel="noopener">Teen research terms</Link>
              </p>
            </details>
            {TEEN_CONSENT.items.map((it) => {
              const bad = tried[4] && it.required && d.accepted[it.id] !== true;
              return (
                <div key={it.id}>
                  <label className={`sx-consent ${bad ? 'bad' : ''}`}>
                    <input type="checkbox" id={`tc-${it.id}`} checked={d.accepted[it.id] === true} aria-invalid={bad}
                      onChange={(e) => setD((s) => ({ ...s, accepted: { ...s.accepted, [it.id]: e.target.checked } }))} />
                    <span>
                      {it.text}{it.required ? '' : ' (optional)'}
                      {it.links ? <> {it.links.map(([href, label], i) => <span key={href}>{i ? ' · ' : ''}<Link to={href} target="_blank" rel="noopener">{label}</Link></span>)}</> : null}
                    </span>
                  </label>
                  {bad ? <p className="f-err" role="alert">{err('consent_required')}</p> : null}
                </div>
              );
            })}
            <div className="sx-captcha">
              <p className="sx-mini-h"><Icon name="bot" size={18} /> Quick human check</p>
              <Captcha ref={captchaRef} error={tried[4] && !captchaOk ? 'Complete the security check.' : undefined} onChange={setCaptchaOk} />
            </div>
            <p className="tiny muted">These confirmations are saved with version {TEEN_CONSENT.version}, the date and time, and your registration reference.</p>
            {msg ? <p className="form-error" role="alert">{msg}</p> : null}
          </>
        ) : null}
      </div>

      <div className="sx-nav">
        {step > 1 ? <button type="button" className="btn btn-ghost-dark" onClick={() => go(step - 1)} disabled={busy}><Icon name="arrow" size={16} className="flip" /> Back</button> : <span />}
        {step < 4 ? (
          <button key="next" type="submit" className="btn btn-primary btn-lg">Continue <Icon name="arrow" size={18} /></button>
        ) : (
          <button key="submit" type="submit" className="btn btn-primary btn-lg btn-shine" disabled={busy}>
            {busy ? <><span className="spinner" /> Sending…</> : <>Complete registration <Icon name="send" size={18} /></>}
          </button>
        )}
      </div>
      <p className="tiny muted center">Already approved? <Link to="/login?type=teen">Log in</Link></p>
    </form>
  );
}

// the same "Who's joining?" cards as the Consumer / Professional form
export function TypeCards({ value, onSwitch }) {
  return (
    <div className="sx-types" role="radiogroup" aria-label="I’m joining as">
      {[['consumer', 'Consumer', 'Everyday opinions on products & services', 'user'], ['professional', 'Business professional', 'Expert B2B surveys about your work', 'briefcase'], ['teen', 'Teen (13–17)', 'Fun surveys, with a parent’s OK', 'rocket']].map(([k, l, dd, ic]) => (
        <label key={k} className={`sx-type ${value === k ? 'on' : ''} t-${k}`}>
          <input type="radio" name="memberType" value={k} checked={value === k} onChange={() => onSwitch(k)} />
          <span className="sx-type-ico"><Icon name={ic} size={26} /></span>
          <strong>{l}</strong>
          <small>{dd}</small>
          <span className="sx-tick"><Icon name="check" size={14} stroke={3} /></span>
        </label>
      ))}
    </div>
  );
}

function Text({ id, label, icon, half, value, onChange, onBlur, error, ok, hint, type = 'text', autoComplete, maxLength = 40 }) {
  return (
    <Field id={id} label={label} error={error} ok={ok} half={half} icon={icon} hint={hint}>
      <input id={id} type={type} placeholder=" " autoComplete={autoComplete} maxLength={maxLength} value={value} inputMode={type === 'email' ? 'email' : undefined}
        onChange={(e) => onChange(e.target.value)} onBlur={onBlur} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} />
    </Field>
  );
}
function Phone({ id, label, value = {}, onChange, error, hint }) {
  return (
    <div className={`sx-field ${error ? 'bad' : ''}`}>
      <span className="sx-static-label">{label}</span>
      <div className="sx-phone">
        <CountryPicker id={`${id}-cc`} mode="dial" list={COUNTRIES} value={value.country} placeholder="Code" onChange={(c) => onChange({ ...value, country: c.iso, dial: dialOf(c.iso) })} />
        <input id={id} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="Mobile number" maxLength={18} value={value.number || ''} aria-label={label} aria-invalid={Boolean(error)}
          onChange={(e) => onChange({ ...value, number: e.target.value.replace(/[^\d\s-]/g, '') })} />
      </div>
      {error ? <p className="f-err" role="alert">{error}</p> : hint ? <p className="f-hint">{hint}</p> : null}
    </div>
  );
}
const errorText = (k, code) => {
  if (k === 'dob' && code === 'adult') return 'You’re 18 or over, so you can join as a Consumer or Professional instead.';
  if (k === 'dob' && code === 'under_13') return 'Teen membership starts at 13.';
  if (k === 'captcha') return 'Complete the security check.';
  return err(code) || 'Please check this.';
};

// ─────────────────────────────────────────────── invite sent / where things are ──────────────────────────────────────
function Sent({ r, status, emailOk, onRestart, cardRef }) {
  const [rs, setRs] = useState({ state: 'idle', msg: '' });
  const [cool, setCool] = useState(0);
  useEffect(() => { if (cool <= 0) return undefined; const id = setTimeout(() => setCool((c) => c - 1), 1000); return () => clearTimeout(id); }, [cool]);
  const st = status?.status || 'pending_guardian_approval';
  const at = ORDER[st] ?? 0;
  const ended = ENDED[st];
  const rel = relationLabel(r.relation || status?.guardian?.relation || '').toLowerCase() || 'parent or guardian';
  const resend = async () => {
    setRs({ state: 'busy', msg: '' });
    try { await teenApi.resend({ statusToken: r.statusToken }); setRs({ state: 'done', msg: `We’ve sent the email to your ${rel} again.` }); setCool(30); }
    catch (e) { setRs({ state: 'error', msg: err(e.code) || err('server') }); }
  };
  if (!r.reference) return <SentNoReceipt onRestart={onRestart} cardRef={cardRef} />;
  return (
    <div className="sx-done sx-teen-sent" role="status" ref={cardRef}>
      <div className="done-check"><Icon name={st === 'active' ? 'check' : ended ? 'close' : 'send'} size={40} stroke={2.4} /></div>
      <h2>{status ? `Hi ${r.firstName || ''}, here’s where things are` : `Invite sent, ${r.firstName || 'friend'}!`}</h2>
      {ended ? <p>{ended}</p> : (
        <p>{st === 'active' ? 'Your account is active. Log in with your email address.' : <>We’ve emailed your {rel} at <strong>{r.guardianEmail}</strong>. Your account switches on after they say yes and you create your password.</>}</p>
      )}
      {!ended ? (
        <ol className="sx-next sx-teen-track">
          {STAGES.map(([s, ic, label], i) => (
            <li key={s} className={i < at || st === 'active' ? 'done' : i === at ? 'now' : ''}>
              <Icon name={i < at || st === 'active' ? 'check' : ic} size={18} /> {label(rel)}
            </li>
          ))}
        </ol>
      ) : null}
      <dl className="sx-receipt">
        {r.email ? <div><dt>Your username</dt><dd>{r.email}</dd></div> : null}
        <div><dt>Your email</dt><dd>{emailOk ? 'Confirmed' : 'Not confirmed yet: open “Track my registration” in the email we sent you'}</dd></div>
        <div><dt>Reference</dt><dd>{r.reference}</dd></div>
        <div><dt>Status</dt><dd>{st === 'active' ? 'Active' : ended ? 'Closed' : st === 'pending_password' ? 'Waiting for your password' : `Waiting for your ${rel}`}</dd></div>
        {r.expiresAt && !ended && st === 'pending_guardian_approval' ? <div><dt>Their link works until</dt><dd>{fmtDate(r.expiresAt)}</dd></div> : null}
      </dl>
      {st !== 'active' && !ended ? <p className="sx-note"><Icon name="lock" size={16} /> Your account is not active yet.</p> : null}
      <div className="done-actions">
        {st === 'active' ? <Link to="/login?type=teen" className="btn btn-primary">Log in</Link> : null}
        {st === 'pending_password' ? <Link to="/forgot-password?type=teen" className="btn btn-primary">Get my password link again</Link> : null}
        {r.statusToken && st === 'pending_guardian_approval' ? (
          <button type="button" className="btn btn-dark" onClick={resend} disabled={rs.state === 'busy' || cool > 0}>
            {rs.state === 'busy' ? 'Sending…' : cool > 0 ? `Resend email in ${cool}s` : `Resend the email to my ${rel}`}
          </button>
        ) : null}
        <Link to="/" className="btn btn-ghost-dark">Back to home</Link>
      </div>
      <p className="tiny muted" role="status" aria-live="polite">{rs.msg}</p>
      <p className="tiny muted">Tip: let them know the email comes from MyFrequentRewards. Wrong email? <Link to="/contact-us">Contact us</Link>.</p>
      {ended ? <p className="tiny muted"><button type="button" className="sx-link" onClick={onRestart}>Start a new registration</button></p> : null}
    </div>
  );
}

// This tab no longer has the receipt (for example the page was opened fresh, or the track link has lapsed). Instead of
// a dead end, the teen can ask for their links again by email.
function SentNoReceipt({ onRestart, cardRef }) {
  const [mail, setMail] = useState('');
  const [rs, setRs] = useState({ state: 'idle', msg: '' });
  const ok = R.validEmail(mail);
  const send = async (e) => {
    e.preventDefault();
    if (!ok || rs.state === 'busy') return;
    setRs({ state: 'busy', msg: '' });
    try { await teenApi.renew(R.normEmail(mail)); setRs({ state: 'done', msg: 'If there is a registration for this email, we’ve sent its links again. Check your inbox and spam folder.' }); }
    catch (ex) { setRs({ state: 'error', msg: err(ex.code) || err('server') }); }
  };
  return (
    <div className="sx-done" role="status" ref={cardRef}>
      <h2>Your registration was sent</h2>
      <p>Open the “Track my registration” link in your email to see where things are. No email? Type your address and we’ll send your links again.</p>
      <form className="done-actions" onSubmit={send} noValidate>
        <input type="email" className="sx-auto-mail" aria-label="Your email address" placeholder="you@example.com" autoComplete="email" value={mail} onChange={(e) => setMail(e.target.value.trim())} />
        <button type="submit" className="btn btn-primary" disabled={!ok || rs.state === 'busy'}>{rs.state === 'busy' ? 'Sending…' : 'Send my links again'}</button>
        <button type="button" className="btn btn-ghost-dark" onClick={onRestart}>Start again</button>
      </form>
      <p className="tiny muted" role="status" aria-live="polite">{rs.msg}</p>
    </div>
  );
}

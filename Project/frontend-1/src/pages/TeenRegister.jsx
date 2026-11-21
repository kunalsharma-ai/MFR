// Teen Panel registration (ages 13–17): birthday check → 1 You → 2 Your adult → 3 Agree → 4 Invite sent.
// Reached at /sign-up?type=teen. Each screen has its own look (teen.css: .tz-w-entry, -s1, -s2, -s3, -s4).
// Everything typed stays in this tab (sessionStorage) until the invite is sent, so a refresh never loses it;
// under-13 birthdays are never stored anywhere. The server re-checks every rule (api/app/teen/rules.js).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Flag } from '../components/CountryPicker.jsx';
import { t, err, fmtDate } from '../teen/i18n.js';
import * as R from '../teen/rules.js';
import { teenApi, relationLabel } from '../teen/api.js';
import { countries, country as loadCountry, zipHint } from '../teen/geo.js';
import { TEEN_CONSENT } from '../teen/data/teenConsent.js';
import { ASSENT, ASSENT_EMOJI } from '../teen/data/consent.js';
import { TeenPage, TeenSeo, Art, Emo, StepRail, useFocusTitle } from '../teen/shell.jsx';
import { useDraft, TextInput, DateField, Combo, PhoneField, Choice, Check, Btn, Alert, Celebrate, newKey, tap } from '../teen/ui.jsx';
import { chime, fanfare, swishSound } from '../utils/sound.js';

const DRAFT = 'mfr.teen.reg.v2';
export const CARRY = 'mfr.teen.carry'; // the adult sign-up hands over name / email / birthday when it finds a 13–17 birthday
const EMPTY = {
  screen: 'entry', // entry | 1 | 2 | 3 | 4
  max: 1,
  teen: { firstName: '', middleName: '', lastName: '', dob: '', email: '', phone: { country: '', dial: '', number: '' }, gender: '', genderSelf: '', location: { country: '', countryName: '', stateCode: '', state: '', stateManual: false, city: '', zip: '', noZip: false } },
  guardian: { relation: '', firstName: '', middleName: '', lastName: '', dob: '', email: '', phone: { country: '', dial: '', number: '' }, gender: '' },
  accepted: {},
  key: '',
  result: null,
  switched: 0,
};
const now = new Date();
const thisYear = now.getUTCFullYear();
const play = (fn) => { try { fn(); } catch { /* sound off */ } };

export default function TeenRegister() {
  const [d, setD, clearDraft] = useDraft(DRAFT, EMPTY);
  const [route, setRoute] = useState(null); // 'blocked' | 'adult' — never saved
  const [list, setList] = useState([]); // countries
  useEffect(() => { countries().then(setList).catch(() => setList([])); }, []);

  // handed over from the adult sign-up: skip the birthday question, keep what they typed
  useEffect(() => {
    let carry = null;
    try { carry = JSON.parse(sessionStorage.getItem(CARRY) || 'null'); sessionStorage.removeItem(CARRY); } catch { /* */ }
    if (!carry || R.classifyDob(carry.dob) !== 'teen') return;
    setD((s) => ({
      ...s,
      screen: 1,
      switched: R.ageOn(carry.dob),
      teen: {
        ...s.teen,
        dob: carry.dob,
        firstName: s.teen.firstName || carry.firstName || '',
        lastName: s.teen.lastName || carry.lastName || '',
        email: s.teen.email || carry.email || '',
        gender: s.teen.gender || (['Female', 'Male'].includes(carry.gender) ? carry.gender : ''),
        location: s.teen.location.country ? s.teen.location : { ...s.teen.location, country: carry.country || '' },
      },
    }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (screen) => {
    tap();
    setD((s) => ({ ...s, screen, max: Math.max(s.max, typeof screen === 'number' ? screen : 1) }));
  };
  const titleRef = useFocusTitle(`${d.screen}-${route}`);
  const screen = route || d.screen;

  const worldOf = { entry: 'entry', blocked: 'block', adult: 'adult', 1: 's1', 2: 's2', 3: 's3', 4: 's4' }[screen] || 'entry';
  return (
    <>
      <TeenSeo title="Join the Teen Panel" description="Teen Panel registration for ages 13 to 17, with a parent or guardian’s permission." path="/sign-up" />
      <TeenPage world={worldOf} label={t('en_kicker')}>
        {screen === 'entry' ? (
          <Entry titleRef={titleRef} dob={d.teen.dob} onRoute={(r, dob) => {
            if (r === 'blocked') { clearDraft(); setD(EMPTY); setRoute('blocked'); play(swishSound); return; }
            if (r === 'adult') { setRoute('adult'); return; }
            setD((s) => ({ ...s, teen: { ...s.teen, dob }, screen: 1, max: Math.max(s.max, 1) }));
            play(chime);
          }} />
        ) : null}
        {screen === 'blocked' ? <Blocked titleRef={titleRef} onBack={() => setRoute(null)} /> : null}
        {screen === 'adult' ? <Adult titleRef={titleRef} onBack={() => setRoute(null)} /> : null}
        {typeof screen === 'number' ? (
          <div className="tz-flow">
            <StepRail step={screen} max={d.max} onJump={(n) => go(n)} />
            {screen === 1 ? <StepYou d={d} setD={setD} list={list} titleRef={titleRef} onNext={() => go(2)}
              onRoute={(r) => { if (r === 'blocked') { clearDraft(); setD(EMPTY); setRoute('blocked'); } else setRoute('adult'); }} /> : null}
            {screen === 2 ? <StepAdult d={d} setD={setD} list={list} titleRef={titleRef} onBack={() => go(1)} onNext={() => go(3)} /> : null}
            {screen === 3 ? <StepAgree d={d} setD={setD} titleRef={titleRef} onBack={() => go(2)} go={go}
              onDone={(result) => {
                // the invite is out: forget everything typed, keep only the receipt for this tab
                setD({ ...EMPTY, screen: 4, max: 4, result: { ...result, firstName: d.teen.firstName, email: R.normEmail(d.teen.email), relation: d.guardian.relation } });
                try { if (result.statusToken) sessionStorage.setItem('mfr.teen.status', result.statusToken); } catch { /* */ }
                play(fanfare);
              }}
              onRoute={(r) => { if (r === 'blocked') { clearDraft(); setD(EMPTY); setRoute('blocked'); } else setRoute('adult'); }} /> : null}
            {screen === 4 ? <StepSent r={d.result || {}} titleRef={titleRef} onRestart={() => { clearDraft(); setD(EMPTY); }} /> : null}
          </div>
        ) : null}
      </TeenPage>
    </>
  );
}

// ═══════════════════════════════ entry + birthday check ═══════════════════════════════
function Entry({ titleRef, dob, onRoute }) {
  const [v, setV] = useState(dob || '');
  const [e, setE] = useState('');
  const [busy, setBusy] = useState(false);
  const check = async () => {
    const c = R.classifyDob(v);
    if (c === 'invalid' || c === 'implausible') return setE(err('dob_invalid'));
    if (c === 'future') return setE(err('dob_future'));
    setE('');
    setBusy(true);
    // the server makes the same decision (and keeps nothing); the page decides locally if it can't be reached
    let route = c;
    try { const r = await teenApi.ageCheck(v); if (r?.route && r.route !== 'invalid') route = r.route; } catch { /* offline: local rule is identical */ }
    setBusy(false);
    onRoute(route, v);
  };
  return (
    <div className="tz-entry">
      <div className="tz-entry-copy">
        <p className="tz-kicker"><Emo name="sparkles" size={22} /> {t('en_kicker')}</p>
        <h1 className="tz-h1" ref={titleRef} tabIndex={-1}>{t('en_title')}</h1>
        <p className="tz-lead">{t('en_lead')}</p>
        <ol className="tz-how" aria-label={t('en_steps_h')}>
          {[['en_s1', 'en_s1d', 'smile'], ['en_s2', 'en_s2d', 'family'], ['en_s3', 'en_s3d', 'verified'], ['en_s4', 'en_s4d', 'mail']].map(([h, p, e2], i) => (
            <li key={h} style={{ '--i': i }}><Emo name={e2} size={34} /><b>{t(h)}</b><span>{t(p)}</span></li>
          ))}
        </ol>
        <div className="tz-ready">
          <b><Icon name="clipboard" size={16} /> {t('en_need_h')}</b>
          <ul><li>{t('en_need_1')}</li><li>{t('en_need_2')}</li><li>{t('en_need_3')}</li></ul>
          <span className="tz-chip"><Icon name="clock" size={14} /> {t('en_time')}</span>
        </div>
      </div>
      <div className="tz-cake">
        <div className="tz-cake-art" aria-hidden="true">
          <Art name="celebrate" size={240} />
          <Art name="sunrise" size={130} className="tz-cake-2" delay={1.2} />
        </div>
        <form className="tz-card tz-age" onSubmit={(ev) => { ev.preventDefault(); check(); }} noValidate>
          <h2 className="tz-h3"><Emo name="party" size={30} /> {t('en_age_h')}</h2>
          <p className="tz-small">{t('en_age_p')}</p>
          <DateField id="gate-dob" label={t('dob')} value={v} onChange={(x) => { setV(x); setE(''); }} fromYear={thisYear - 100} toYear={thisYear} error={e} />
          <Btn type="submit" busy={busy} iconEnd="arrow" disabled={!v}>{t('en_start')}</Btn>
          <p className="tz-small tz-center">{t('en_have')} <Link to="/login?type=teen">{t('en_login')}</Link></p>
        </form>
      </div>
    </div>
  );
}

function Blocked({ titleRef, onBack }) {
  return (
    <div className="tz-card tz-block" role="status">
      <div className="tz-block-art" aria-hidden="true"><Art name="nest" size={200} /><span className="tz-13">13</span></div>
      <h1 className="tz-h2" ref={titleRef} tabIndex={-1}>{t('route_block_h')}</h1>
      <p className="tz-lead">{t('route_block_p')}</p>
      <p className="tz-small"><Icon name="lock" size={14} /> {t('route_block_note')}</p>
      <div className="tz-actions">
        <Link className="tf-btn tf-btn-main" to="/"><Icon name="home" size={18} /> <span>{t('route_block_btn')}</span></Link>
        <button type="button" className="tf-btn tf-btn-ghost" onClick={onBack}><span>{t('route_fix_dob')}</span></button>
      </div>
    </div>
  );
}
function Adult({ titleRef, onBack }) {
  return (
    <div className="tz-card tz-block tz-adult" role="status">
      <div className="tz-block-art" aria-hidden="true"><Art name="trust" size={200} /></div>
      <h1 className="tz-h2" ref={titleRef} tabIndex={-1}>{t('route_adult_h')}</h1>
      <p className="tz-lead">{t('route_adult_p')}</p>
      <div className="tz-actions">
        <Link className="tf-btn tf-btn-main" to="/sign-up"><span>{t('route_adult_btn')}</span> <Icon name="arrow" size={18} /></Link>
        <button type="button" className="tf-btn tf-btn-ghost" onClick={onBack}><span>{t('route_fix_dob')}</span></button>
      </div>
    </div>
  );
}

// ═══════════════════════════════ step 1 · you ═══════════════════════════════
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

function StepYou({ d, setD, list, titleRef, onNext, onRoute }) {
  const tn = d.teen;
  const loc = tn.location;
  const [touched, setTouched] = useState({});
  const [tried, setTried] = useState(false);
  const [cdata, cLoading] = useCountryData(loc.country);
  const set = (k, v) => setD((s) => ({ ...s, teen: { ...s.teen, [k]: v } }));
  const setLoc = (patch) => setD((s) => ({ ...s, teen: { ...s.teen, location: { ...s.teen.location, ...patch } } }));
  const errors = useMemo(() => {
    const e = R.validateTeen(tn, { world: worldFor(loc.country, cdata) });
    if (loc.country && !cdata) delete e.country; // still loading the country file
    return e;
  }, [tn, loc.country, cdata]); // eslint-disable-line react-hooks/exhaustive-deps
  const show = (k) => (tried || touched[k] ? err(errors[k]) : '');
  const touch = (k) => () => setTouched((x) => ({ ...x, [k]: true }));

  const cOpts = useMemo(() => list.map((c) => ({ value: c.i, label: c.n, flag: c.i })), [list]);
  const sOpts = useMemo(() => (cdata?.s || []).map((s) => ({ value: s.c, label: s.n })), [cdata]);
  const cityOpts = useMemo(() => {
    const st = (cdata?.s || []).find((s) => s.c === loc.stateCode);
    return (st?.ci || []).map((n) => ({ value: n, label: n }));
  }, [cdata, loc.stateCode]);
  const hasStates = sOpts.length > 0;
  // a country handed over from the adult sign-up arrives as a code only: fill in its name once the list is here
  useEffect(() => {
    if (loc.country && !loc.countryName && list.length) { const c = list.find((x) => x.i === loc.country); if (c) setLoc({ countryName: c.n }); }
  }, [loc.country, loc.countryName, list]); // eslint-disable-line react-hooks/exhaustive-deps
  const zipFormat = cdata?.z || '';
  const age = R.ageOn(tn.dob);

  const next = () => {
    setTried(true);
    const c = R.classifyDob(tn.dob);
    if (c === 'blocked') return onRoute('blocked');
    if (c === 'adult') return onRoute('adult');
    if (Object.keys(errors).length) {
      const first = ['firstName', 'middleName', 'lastName', 'dob', 'email', 'phone', 'gender', 'country', 'state', 'city', 'zip'].find((k) => errors[k]);
      const id = { dob: 't-dob-d', country: 't-country', state: 't-state', city: 't-city', gender: 't-gender', phone: 't-phone' }[first] || `t-${first}`;
      setTimeout(() => document.getElementById(id)?.focus(), 30);
      return undefined;
    }
    play(chime);
    return onNext();
  };

  return (
    <div className="tz-step tz-s1">
      <div className="tz-step-main">
        {d.switched ? <Alert tone="info" icon="sparkle">{t('route_switched', d.switched)}</Alert> : null}
        <header className="tz-step-head">
          <p className="tz-kicker">{t('step_of', 1, 4)}</p>
          <h1 className="tz-h2" ref={titleRef} tabIndex={-1}>{t('s1_title')}</h1>
          <p className="tz-lead">{t('s1_lead')}</p>
        </header>
        {tried && Object.keys(errors).length ? <Alert>{t('e_fix_below')}</Alert> : null}
        <form className="tz-form" onSubmit={(e) => { e.preventDefault(); next(); }} noValidate>
          <fieldset className="tz-group">
            <legend><Emo name="smile" size={26} /> {t('s1_names')}</legend>
            <div className="tf-grid">
              <TextInput id="t-firstName" label={t('first_name')} value={tn.firstName} onChange={(v) => set('firstName', v)} onBlur={touch('firstName')} error={show('firstName')} autoComplete="given-name" />
              <TextInput id="t-middleName" label={t('middle_name')} optional value={tn.middleName} onChange={(v) => set('middleName', v)} onBlur={touch('middleName')} error={show('middleName')} autoComplete="additional-name" />
              <TextInput id="t-lastName" label={t('last_name')} value={tn.lastName} onChange={(v) => set('lastName', v)} onBlur={touch('lastName')} error={show('lastName')} autoComplete="family-name" span={2} />
            </div>
          </fieldset>
          <fieldset className="tz-group">
            <legend><Emo name="party" size={26} /> {t('s1_birthday')}</legend>
            <DateField id="t-dob" label={t('dob')} value={tn.dob} onChange={(v) => { set('dob', v); setTouched((x) => ({ ...x, dob: true })); }}
              fromYear={thisYear - 19} toYear={thisYear - 12} error={show('dob') && errors.dob !== 'under_13' && errors.dob !== 'adult' ? show('dob') : ''}
              hint={Number.isFinite(age) && age >= 13 && age <= 17 ? t('s1_age_ok', age) : t('s1_age_hint')} span={2} />
            {tn.dob && ['blocked', 'adult'].includes(R.classifyDob(tn.dob)) ? (
              <Alert tone="info">{R.classifyDob(tn.dob) === 'blocked' ? t('route_block_p') : t('route_adult_p')} <button type="button" className="tz-link" onClick={() => onRoute(R.classifyDob(tn.dob))}>{t('continue')}</button></Alert>
            ) : null}
          </fieldset>
          <fieldset className="tz-group">
            <legend><Emo name="mail" size={26} /> {t('s1_contact')}</legend>
            <div className="tf-grid">
              <TextInput id="t-email" type="email" inputMode="email" label={t('email')} value={tn.email} onChange={(v) => set('email', v.trim())} onBlur={touch('email')} error={show('email') || (d.emailErr && R.normEmail(tn.email) === d.emailErr.value ? err(d.emailErr.code) : '')} hint={t('s1_email_hint')} autoComplete="email" maxLength={254} span={2} />
              <PhoneField id="t-phone" label={t('phone')} value={tn.phone} onChange={(v) => set('phone', v)} countries={list} error={show('phone')} hint={t('s1_phone_hint')} span={2} />
            </div>
          </fieldset>
          <fieldset className="tz-group">
            <legend><Emo name="sparkle_heart" size={26} /> {t('s1_you')}</legend>
            <Choice id="t-gender" label={t('gender')} value={tn.gender} onChange={(v) => set('gender', v)} error={show('gender')}
              options={R.TEEN_GENDERS.map((g) => ({ value: g, label: t(`g_${g}`) }))} />
            {tn.gender === 'Self-describe' ? (
              <TextInput id="t-genderSelf" label={t('self_describe')} optional value={tn.genderSelf} onChange={(v) => set('genderSelf', v)} maxLength={40} span={2} />
            ) : null}
          </fieldset>
          <fieldset className="tz-group">
            <legend><Emo name="rocket" size={26} /> {t('s1_where')}</legend>
            <div className="tf-grid">
              <Combo id="t-country" label={t('country')} options={cOpts} value={loc.country} allowCustom={false} loading={!list.length} error={show('country')} span={2}
                onChange={(v, m) => { setLoc({ country: v, countryName: m.label, stateCode: '', state: '', stateManual: false, city: '', zip: '', noZip: false }); }} />
              {loc.country ? (
                <>
                  <Combo id="t-state" label={t('state')} optional={!hasStates && !cLoading} options={sOpts} value={loc.stateManual ? '' : loc.stateCode} manualValue={loc.stateManual ? loc.state : ''} loading={cLoading}
                    hint={!hasStates && !cLoading ? t('s1_no_states') : t('type_own')} error={show('state')}
                    onChange={(v, m) => setLoc(m.manual ? { stateCode: '', state: m.label, stateManual: true, city: '' } : { stateCode: v, state: m.label, stateManual: false, city: '' })} />
                  <Combo id="t-city" label={t('city')} options={cityOpts} value={loc.cityManual ? '' : loc.city} manualValue={loc.cityManual ? loc.city : ''} error={show('city')}
                    hint={cityOpts.length ? t('type_own') : t('s1_city_type')}
                    onChange={(v, m) => setLoc(m.manual ? { city: m.label, cityManual: true } : { city: v, cityManual: false })} />
                  <TextInput id="t-zip" label={t('zip')} value={loc.zip} onChange={(v) => setLoc({ zip: v.toUpperCase(), noZip: false })} onBlur={touch('zip')} maxLength={12}
                    error={loc.noZip ? '' : show('zip')} optional={!zipFormat} hint={zipHint(zipFormat) ? t('s1_zip_hint', zipHint(zipFormat)) : t('s1_zip_any')} autoComplete="postal-code" />
                  <label className="tz-mini-check">
                    <input type="checkbox" checked={Boolean(loc.noZip)} onChange={(e) => setLoc({ noZip: e.target.checked, zip: e.target.checked ? '' : loc.zip })} />
                    <span>{t('no_zip')}</span>
                  </label>
                </>
              ) : null}
            </div>
          </fieldset>
          <div className="tz-nav">
            <span />
            <Btn type="submit" iconEnd="arrow">{t('continue')}</Btn>
          </div>
        </form>
      </div>
      <aside className="tz-step-side" aria-hidden="true">
        <TeenPass tn={tn} list={list} age={age} />
      </aside>
    </div>
  );
}

// the live "Teen pass": fills in as the teen types, tilts with the pointer
function TeenPass({ tn, list, age }) {
  const ref = useRef(null);
  const c = list.find((x) => x.i === tn.location.country);
  const name = [tn.firstName, tn.lastName].filter(Boolean).join(' ');
  const fill = ['firstName', 'lastName', 'dob', 'email', 'gender'].filter((k) => tn[k]).length + (tn.location.country ? 1 : 0) + (tn.location.city ? 1 : 0);
  const pct = Math.round((fill / 7) * 100);
  const move = (e) => {
    const el = ref.current;
    if (!el || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--ry', `${(((e.clientX - r.left) / r.width) - 0.5) * 18}deg`);
    el.style.setProperty('--rx', `${(0.5 - ((e.clientY - r.top) / r.height)) * 14}deg`);
  };
  return (
    <div className="tz-pass-stage" onPointerMove={move} onPointerLeave={() => { ref.current?.style.removeProperty('--ry'); ref.current?.style.removeProperty('--rx'); }}>
      <Art name="arcade" size={130} className="tz-pass-a1" />
      <Art name="feed" size={110} className="tz-pass-a2" delay={1.4} />
      <div className="tz-pass" ref={ref}>
        <span className="tz-pass-holo" />
        <p className="tz-pass-top"><b>MFR</b><span>{t('pass_member')}</span></p>
        <div className="tz-pass-face">{(tn.firstName || '?').slice(0, 1).toUpperCase()}</div>
        <p className="tz-pass-name">{name || t('pass_name')}</p>
        <p className="tz-pass-meta">
          {Number.isFinite(age) && age >= 13 && age <= 17 ? <span>{t('gd_age', age)}</span> : null}
          {c ? <span><Flag iso={c.i} size={12} /> {tn.location.city || c.n}</span> : null}
        </p>
        <p className="tz-pass-mail">{tn.email || 'you@email.com'}</p>
        <div className="tz-pass-bar"><i style={{ width: `${pct}%` }} /></div>
        <p className="tz-pass-foot"><span className="tz-dot" /> {t('pass_status')}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════ step 2 · your adult ═══════════════════════════════
const REL_CARDS = [
  ['mother', 's2_mother', 's2_mother_d', 'sparkle_heart', 'nest'],
  ['father', 's2_father', 's2_father_d', 'handshake', 'hearth'],
  ['legal_guardian', 's2_guardian', 's2_guardian_d', 'shield', 'trust'],
];
function StepAdult({ d, setD, list, titleRef, onBack, onNext }) {
  const g = d.guardian;
  const [touched, setTouched] = useState({});
  const [tried, setTried] = useState(false);
  const set = (k, v) => setD((s) => ({ ...s, guardian: { ...s.guardian, [k]: v } }));
  const errors = useMemo(() => R.validateGuardian(g, d.teen), [g, d.teen]);
  const srvErr = d.guardianErr || {};
  const show = (k) => (tried || touched[k] ? err(errors[k]) : '') || (srvErr[k] && srvErr[k].value === String(g[k] || '') ? err(srvErr[k].code) : '');
  const touch = (k) => () => setTouched((x) => ({ ...x, [k]: true }));
  const next = () => {
    setTried(true);
    if (Object.keys(errors).length) {
      const first = ['relation', 'firstName', 'middleName', 'lastName', 'dob', 'email', 'phone', 'gender'].find((k) => errors[k]);
      setTimeout(() => document.getElementById(first === 'relation' ? 'g-rel-mother' : first === 'dob' ? 'g-dob-d' : `g-${first}`)?.focus(), 30);
      return;
    }
    play(chime);
    onNext();
  };
  const rel = REL_CARDS.find((r) => r[0] === g.relation);
  return (
    <div className="tz-step tz-s2">
      <div className="tz-step-main">
        <header className="tz-step-head">
          <p className="tz-kicker">{t('step_of', 2, 4)}</p>
          <h1 className="tz-h2" ref={titleRef} tabIndex={-1}>{t('s2_title')}</h1>
          <p className="tz-lead">{t('s2_lead')}</p>
        </header>
        <div className="tz-rel" role="radiogroup" aria-label={t('s2_title')}>
          {REL_CARDS.map(([id, h, p, emo, art], i) => (
            <button key={id} id={`g-rel-${id}`} type="button" role="radio" aria-checked={g.relation === id} className={`tz-rel-card ${g.relation === id ? 'is-on' : ''}`} style={{ '--i': i }}
              onClick={() => { tap(); setD((s) => ({ ...s, guardian: { ...s.guardian, relation: id, gender: id === 'legal_guardian' ? s.guardian.gender : '' } })); }}>
              <Art name={art} size={96} float={false} />
              <span className="tz-rel-emo"><Emo name={emo} size={28} /></span>
              <b>{t(h)}</b>
              <small>{t(p)}</small>
              <span className="tz-rel-tick" aria-hidden="true"><Icon name="check" size={14} stroke={3} /></span>
            </button>
          ))}
        </div>
        {tried && errors.relation ? <p className="tf-err" role="alert">{err('relation')}</p> : null}
        {g.relation ? (
          <form className="tz-form tz-g-form" onSubmit={(e) => { e.preventDefault(); next(); }} noValidate key="form">
            <h2 className="tz-h3"><Emo name={rel[3]} size={26} /> {t('s2_form_h')} · {t(rel[1])}</h2>
            <div className="tf-grid">
              <TextInput id="g-firstName" label={t('first_name')} value={g.firstName} onChange={(v) => set('firstName', v)} onBlur={touch('firstName')} error={show('firstName')} />
              <TextInput id="g-middleName" label={t('middle_name')} optional value={g.middleName} onChange={(v) => set('middleName', v)} onBlur={touch('middleName')} error={show('middleName')} />
              <TextInput id="g-lastName" label={t('last_name')} value={g.lastName} onChange={(v) => set('lastName', v)} onBlur={touch('lastName')} error={show('lastName')} span={2} />
              <DateField id="g-dob" label={t('dob')} value={g.dob} onChange={(v) => { set('dob', v); setTouched((x) => ({ ...x, dob: true })); }} fromYear={thisYear - 100} toYear={thisYear - 18} error={show('dob')} span={2} />
              <TextInput id="g-email" type="email" inputMode="email" label={t('email')} value={g.email} onChange={(v) => set('email', v.trim())} onBlur={touch('email')} error={show('email')} hint={t('s2_email_hint')} maxLength={254} span={2} />
              <PhoneField id="g-phone" label={t('phone')} value={g.phone} onChange={(v) => set('phone', v)} countries={list} error={show('phone')} span={2} />
              {g.relation === 'legal_guardian' ? (
                <Choice id="g-gender" label={t('gender')} value={g.gender} onChange={(v) => set('gender', v)} error={show('gender')}
                  options={R.GUARDIAN_GENDERS.map((x) => ({ value: x, label: t(`g_${x}`) }))} />
              ) : null}
            </div>
            <div className="tz-nav">
              <Btn kind="ghost" icon="arrow" className="is-back" onClick={onBack}>{t('back')}</Btn>
              <Btn type="submit" iconEnd="arrow">{t('continue')}</Btn>
            </div>
          </form>
        ) : (
          <div className="tz-nav"><Btn kind="ghost" icon="arrow" className="is-back" onClick={onBack}>{t('back')}</Btn><span /></div>
        )}
      </div>
      <aside className="tz-step-side" aria-hidden="true">
        <Envelope g={g} teen={d.teen} />
      </aside>
    </div>
  );
}
function Envelope({ g, teen }) {
  const name = [g.firstName, g.lastName].filter(Boolean).join(' ');
  return (
    <div className={`tz-env ${g.relation ? 'is-ready' : ''} ${R.validEmail(g.email) ? 'is-addressed' : ''}`}>
      <div className="tz-env-back" />
      <div className="tz-env-letter">
        <p><small>{t('s2_env_from')}</small> MyFrequentRewards</p>
        <p><small>{t('s2_env_to')}</small> {name || '…'}{g.email ? <em>{g.email}</em> : null}</p>
        <p className="tz-env-sub">{t('s2_env_sub', teen.firstName || '…')}</p>
        <div className="tz-env-yn"><span className="y">YES</span><span className="n">NO</span></div>
      </div>
      <div className="tz-env-front"><span className="tz-env-seal"><Icon name="lock" size={18} /></span></div>
      <Art name="sentry" size={110} className="tz-env-art" />
    </div>
  );
}

// ═══════════════════════════════ step 3 · agree ═══════════════════════════════
function StepAgree({ d, setD, titleRef, onBack, onDone, onRoute, go }) {
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const sent = useRef(false);
  const acc = d.accepted || {};
  const missing = TEEN_CONSENT.items.filter((i) => i.required && acc[i.id] !== true);
  const toggle = (id, v) => setD((s) => ({ ...s, accepted: { ...s.accepted, [id]: v } }));
  const rel = relationLabel(d.guardian.relation).toLowerCase();

  const submit = async () => {
    setTried(true);
    setMsg('');
    if (missing.length) { document.getElementById(`tc-${missing[0].id}`)?.focus(); return; }
    if (sent.current) return; // one request at a time — a double click can never send two
    sent.current = true;
    setBusy(true);
    const key = d.key || newKey();
    if (!d.key) setD((s) => ({ ...s, key }));
    const { phone, ...teen } = d.teen;
    const gp = d.guardian.phone;
    try {
      const res = await teenApi.register({
        idempotencyKey: key,
        teen: { ...teen, email: R.normEmail(teen.email), ...(phone?.number ? { phone: { country: phone.country, number: phone.number } } : {}), language: document.documentElement.lang || 'en' },
        guardian: { ...d.guardian, email: R.normEmail(d.guardian.email), phone: gp?.number ? { country: gp.country, number: gp.number } : undefined },
        consent: { version: TEEN_CONSENT.version, accepted: Object.fromEntries(TEEN_CONSENT.items.map((i) => [i.id, acc[i.id] === true])) },
      });
      onDone({ ...res, guardianEmail: res.guardianEmail || R.maskEmail(d.guardian.email) });
    } catch (e) {
      sent.current = false;
      setBusy(false);
      const f = e.fields || {};
      if (e.code === 'under_13') return onRoute('blocked');
      if (e.code === 'adult') return onRoute('adult');
      if (e.code === 'email_taken' || e.code === 'pending_exists' || f.email === 'email_taken' || f.email === 'pending_exists') {
        setD((s) => ({ ...s, emailErr: { value: R.normEmail(s.teen.email), code: f.email || e.code }, key: '' }));
        return go(1);
      }
      if (e.code === 'validation') {
        const gKeys = Object.keys(f).filter((k) => k.startsWith('guardian.'));
        const tKeys = Object.keys(f).filter((k) => !k.includes('.'));
        if (tKeys.length) { setD((s) => ({ ...s, key: '' })); return go(1); }
        if (gKeys.length) {
          setD((s) => ({ ...s, key: '', guardianErr: Object.fromEntries(gKeys.map((k) => { const n = k.slice(9); return [n, { value: String(s.guardian[n] || ''), code: f[k] }]; })) }));
          return go(2);
        }
      }
      // a network error keeps the same key, so pressing again can never create two registrations
      setMsg(err(e.code) || err('server'));
    }
    return undefined;
  };

  return (
    <div className="tz-step tz-s3">
      <div className="tz-step-main">
        <header className="tz-step-head">
          <p className="tz-kicker">{t('step_of', 3, 4)}</p>
          <h1 className="tz-h2" ref={titleRef} tabIndex={-1}>{t('s3_title')}</h1>
          <p className="tz-lead">{t('s3_lead')}</p>
        </header>
        <div className="tz-paper">
          <section className="tz-paper-sec">
            <h2 className="tz-h4"><Emo name="sparkles" size={24} /> {t('s3_what_h')}</h2>
            <p>{t('s3_what_p')}</p>
            <p><b>{t('s3_if')}</b></p>
            <ul className="tz-assent">
              {ASSENT.map((a, i) => <li key={a}><span aria-hidden="true">{ASSENT_EMOJI[i]}</span>{a}</li>)}
            </ul>
          </section>
          <section className="tz-paper-sec">
            <h2 className="tz-h4"><Emo name="family" size={24} /> {t('s3_why_h')}</h2>
            <p>{t('s3_why_p')}</p>
          </section>
          <section className="tz-paper-sec">
            <h2 className="tz-h4"><Emo name="mail" size={24} /> {t('s3_flow_h')}</h2>
            <ol className="tz-flowlist">{[1, 2, 3, 4, 5].map((n) => <li key={n}>{t(`s3_flow_${n}`)}</li>)}</ol>
            <p className="tz-small"><Icon name="clock" size={14} /> {t('s3_flow_time')}</p>
          </section>
          <section className="tz-paper-sec">
            <h2 className="tz-h4"><Emo name="lock" size={24} /> {t('s3_use_h')}</h2>
            <p>{t('s3_use_p')}</p>
            <p className="tz-links">
              <Link to="/terms" target="_blank" rel="noopener">{t('link_terms')}</Link>
              <Link to="/privacy" target="_blank" rel="noopener">{t('link_privacy')}</Link>
              <Link to="/teen/terms" target="_blank" rel="noopener">{t('link_teen_terms')}</Link>
              <Link to="/teen/terms#ch-data" target="_blank" rel="noopener">{t('link_teen_privacy')}</Link>
            </p>
          </section>
        </div>
        <Alert tone="info" icon="family">{t('s3_parent_note')}</Alert>
        <div className="tz-checks">
          {TEEN_CONSENT.items.map((it) => (
            <Check key={it.id} id={`tc-${it.id}`} checked={acc[it.id] === true} onChange={(v) => toggle(it.id, v)} title={t(`tc_${it.id}`)} icon={it.icon === 'doc' ? 'book' : it.icon}
              tag={it.required ? t('required') : t('optional')} error={tried && it.required && acc[it.id] !== true ? err('consent_required') : ''}>
              {it.text}
              {it.links ? <span className="tz-check-links">{it.links.map(([href, label]) => <Link key={href} to={href} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>{label}</Link>)}</span> : null}
            </Check>
          ))}
        </div>
        <p className="tz-small tz-version">{t('s3_version', TEEN_CONSENT.version)}</p>
        {msg ? <Alert>{msg}</Alert> : null}
        <div className="tz-nav">
          <Btn kind="ghost" icon="arrow" className="is-back" onClick={onBack} disabled={busy}>{t('back')}</Btn>
          <Btn kind="main" busy={busy} icon="send" onClick={submit} className="tz-complete">{busy ? t('s3_sending') : t('s3_submit')}</Btn>
        </div>
      </div>
      <aside className="tz-step-side" aria-hidden="true">
        <div className={`tz-stamp-card ${missing.length ? '' : 'is-stamped'}`}>
          <Art name="consent" size={150} />
          <p className="tz-stamp-count">{missing.length ? t('s3_left', missing.length) : t('s3_all')}</p>
          <ul>{TEEN_CONSENT.items.map((it) => <li key={it.id} className={acc[it.id] ? 'on' : ''}><Icon name="check" size={12} stroke={3} /> {t(`tc_${it.id}`)}</li>)}</ul>
          <span className="tz-stamp">{t('s3_stamp')}</span>
          <p className="tz-small">{t('s3_to', rel || '…')}</p>
        </div>
      </aside>
    </div>
  );
}

// ═══════════════════════════════ step 4 · invite sent ═══════════════════════════════
function StepSent({ r, titleRef, onRestart }) {
  const [fire, setFire] = useState(false);
  const [resend, setResend] = useState('idle'); // idle | busy | done | error
  const [rmsg, setRmsg] = useState('');
  useEffect(() => { const id = setTimeout(() => setFire(true), 650); return () => clearTimeout(id); }, []);
  const rel = relationLabel(r.relation || '').toLowerCase() || t('s4_adult');
  const doResend = async () => {
    setResend('busy');
    try { await teenApi.resend({ statusToken: r.statusToken }); setResend('done'); setRmsg(t('s4_resent')); }
    catch (e) { setResend('error'); setRmsg(err(e.code) || err('server')); }
  };
  if (!r.reference) {
    return (
      <div className="tz-card tz-block">
        <h1 className="tz-h2" ref={titleRef} tabIndex={-1}>{t('s4_title')}</h1>
        <p className="tz-lead">{t('s4_gone')}</p>
        <div className="tz-actions"><Link className="tf-btn tf-btn-main" to="/teen/status"><span>{t('st_title')}</span></Link><button type="button" className="tf-btn tf-btn-ghost" onClick={onRestart}><span>{t('s4_new')}</span></button></div>
      </div>
    );
  }
  return (
    <div className="tz-step tz-s4">
      <Celebrate fire={fire} colors={['#2F6BFF', '#49B6FF', '#FFC233', '#FF8A00', '#FFFFFF']} />
      <div className="tz-sent">
        <div className="tz-plane" aria-hidden="true">
          <svg viewBox="0 0 120 80" width="120" height="80"><path d="M4 38 L116 4 L78 76 L58 50 Z" fill="#fff" /><path d="M58 50 L116 4 L46 44 Z" fill="#cfe0ff" /><path d="M58 50 L64 70 L70 56" fill="#a9c4ff" /></svg>
          <i className="tz-trail" />
        </div>
        <p className="tz-kicker">{t('step_of', 4, 4)}</p>
        <h1 className="tz-h1" ref={titleRef} tabIndex={-1}>{t('s4_title')}</h1>
        <p className="tz-lead">{t('s4_lead', rel)}</p>
        <div className="tz-ticket">
          <div className="tz-ticket-row"><span>{t('s4_sent_to', rel)}</span><b className="tz-mono">{r.guardianEmail}</b></div>
          <div className="tz-ticket-row"><span>{t('s4_username')}</span><b className="tz-mono">{r.email}</b></div>
          <div className="tz-ticket-row"><span>{t('ref')}</span><b className="tz-mono">{r.reference}</b></div>
          <div className="tz-ticket-row"><span>{t('s4_status')}</span><b className="tz-pill is-wait"><span className="tz-dot" /> {t('s4_status_v')}</b></div>
          {r.expiresAt ? <div className="tz-ticket-row"><span>{t('s4_expires')}</span><b>{fmtDate(r.expiresAt)}</b></div> : null}
        </div>
        <p className="tz-warn"><Icon name="lock" size={16} /> {t('s4_not_active')}</p>
      </div>
      <div className="tz-next">
        <h2 className="tz-h3">{t('s4_next_h')}</h2>
        <ol className="tz-timeline">
          <li className="is-done"><b>{t('s4_n0')}</b></li>
          <li className="is-now"><b>{t('s4_n1', rel)}</b></li>
          <li><b>{t('s4_n2')}</b></li>
          <li><b>{t('s4_n3')}</b></li>
          <li><b>{t('s4_n4', r.email)}</b></li>
        </ol>
        <p className="tz-small">{t('s4_tip')}</p>
        {rmsg ? <Alert tone={resend === 'error' ? 'bad' : 'ok'}>{rmsg}</Alert> : null}
        <div className="tz-actions">
          {r.statusToken ? <Btn kind="ghost" icon="refresh" busy={resend === 'busy'} disabled={resend === 'done'} onClick={doResend}>{t('s4_resend')}</Btn> : null}
          <Link className="tf-btn tf-btn-ghost" to="/teen/status"><Icon name="activity" size={18} /> <span>{t('s4_track')}</span></Link>
          <Link className="tf-btn tf-btn-main" to="/"><Icon name="home" size={18} /> <span>{t('s4_home')}</span></Link>
        </div>
      </div>
    </div>
  );
}

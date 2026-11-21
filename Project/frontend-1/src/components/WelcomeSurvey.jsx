import { Autocomplete, TextField } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import { useEffect, useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import Field from './SxField.jsx';
import { CONSUMER_INTERESTS } from '../data/profiles.js';
import { OTHER, industryQuestion } from '../data/employmentProfile.js';
import { ME_API, MEMBER_CATEGORIES } from '../data/site.js';
import { getData, patchJSON, postJSON } from '../utils/api.js';
import { buildProfileAnswers } from '../utils/profileAnswers.js';
import { validateProfile } from '../utils/validate.js';
import { WORLD_FIELDS, clearBelow, loadWorldOptions, worldModel } from '../utils/worldForm.js';
import { teenApi } from '../teen/api.js';
import { WELCOME_QUESTIONS } from '../teen/data/welcome.js';
import { LANGUAGES } from '../teen/data/surveyLanguages.js';
import { answered, checkQuestion, useTimezones } from '../teen/ProfileQuestion.jsx';

// Welcome survey, shown once after the member's first log in (Consumers, Professionals and Teens alike), before the
// dashboard. It asks the same questions the set-password page used to ask in its "Your world" step:
//   • Consumer: "What are you into?" (CONSUMER_INTERESTS, optional)
//   • Professional: "Tell us about your work" (employment status → industry → specialization → department → job title,
//     plus the optional company email), with the choices loaded from /api/v1/option
//   • Teen: the short Teen welcome questions, word for word from the Teen Profile Survey (teen/data/welcome.js),
//     only those not already known from the registration, saved with PUT /api/v1/teen/me/answers
// Answers are saved with PATCH /api/v1/me/answer under the same keys as before (profileAnswers.js).
const TEEN_HIDDEN = new Set(['family', 'auto', 'finance']);
const interestsFor = (type) => (type === 'teen' ? CONSUMER_INTERESTS.filter((c) => !TEEN_HIDDEN.has(c.id)) : CONSUMER_INTERESTS);

const DONE_KEY = 'mfr.welcome.done';
const readDone = () => { try { return JSON.parse(localStorage.getItem(DONE_KEY) || '[]'); } catch { return []; } };
export const welcomeDone = (mail) => readDone().includes(String(mail).toLowerCase());
const markDone = (mail) => {
  try { localStorage.setItem(DONE_KEY, JSON.stringify([...new Set([...readDone(), String(mail).toLowerCase()])])); } catch { /* storage blocked */ }
};

const hasAnswer = (x) => (Array.isArray(x) ? x.length > 0 : Boolean(String(x ?? '').trim()));

// After a successful log in: should the welcome survey open? Returns { type, name } or null.
// Asks the backend who the member is (category) and whether the key question is already answered, so members who
// answered before (on any device) go straight to the dashboard. `fallback` is the type the login page was opened for.
export async function welcomeNeeded({ mail, fallback, demo }) {
  if (welcomeDone(mail)) return null;
  if (demo) return { type: fallback, name: '' };
  try {
    const me = (await getData(ME_API)).data || {};
    const cat = String(me.category || '');
    const type = /minor/i.test(cat) ? 'teen' : cat === MEMBER_CATEGORIES.professional ? 'professional' : cat ? 'consumer' : fallback;
    const key = type === 'professional' ? 'empstat' : 'interests';
    const ans = (await postJSON(ME_API, { questions: [key] })).data || {};
    if (hasAnswer(ans[key])) { markDone(mail); return null; }
    return { type, name: me.name?.first || '' };
  } catch {
    return null; // never keep a member away from the dashboard because the check failed
  }
}

const WORLD_ICON = { empstat: 'briefcase', freelancer: 'briefcase', jobseeker: 'question', industry: 'layers', sector: 'badge', department: 'clipboard', jobrole: 'user' };
const WORLD_HINT = {
  empstat: '',
  freelancer: 'Choose your employment status first.',
  jobseeker: 'Choose your employment status first.',
  industry: 'Choose your employment status first.',
  sector: 'Choose your industry first.',
  department: 'Choose your specialization first.',
  jobrole: 'Choose your department first.',
};
const muiField = { width: '100%', '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: 'background.paper' } };

export default function WelcomeSurvey(props) {
  return props.type === 'teen' ? <TeenWelcome {...props} /> : <AdultWelcome {...props} />;
}

function AdultWelcome({ type = 'consumer', name = '', mail = '', demo = false, onDone }) {
  const pro = type === 'professional';
  const [v, setV] = useState({ empstat: '', hw: [], freelancer: '', jobseeker: '', industry: '', sector: '', department: '', jobrole: '', jobTitleOther: '', companyEmail: '', interests: [] });
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [worldMode, setWorldMode] = useState('loading');
  const [worldOpts, setWorldOpts] = useState({});
  const world = useMemo(() => worldModel(worldMode, worldOpts, v), [worldMode, worldOpts, v]);
  const errors = useMemo(() => validateProfile({ ...v, memberType: pro ? 'professional' : 'consumer', skip: world.na }), [v, pro, world.na]);

  const set = (k, val) => setV((s) => ({ ...s, [k]: val }));
  const touch = (k) => setTouched((t) => ({ ...t, [k]: true }));
  const err = (k) => (touched[k] || touched.submit ? errors[k] : undefined);
  const ok = (k) => touched[k] && !errors[k];
  const aria = (k) => ({ 'aria-invalid': Boolean(err(k)), 'aria-describedby': err(k) ? `${k}-err` : undefined, onBlur: () => touch(k) });
  const pickWorld = (field, val) => setV((s) => ({ ...clearBelow(s, field), [field]: val }));
  const worldLabel = (f) => ({
    empstat: 'What is your current employment status?',
    hw: 'Which role you play in your homemaking?',
    freelancer: 'If you are a Freelancer, please specify your job profile?',
    jobseeker: 'Are you seeking a job?',
    industry: v.empstat ? industryQuestion(v.empstat) : 'Which industry do you work in?',
    sector: 'What is your specialization?',
    department: 'Which department do you work in?',
    jobrole: 'What is your job title?',
  })[f];
  const worldHint = (f) => {
    if (f === 'freelancer' || f === 'jobseeker' || f === 'industry') return v.empstat ? '' : WORLD_HINT[f];
    if (f === 'sector') return v.industry ? '' : WORLD_HINT[f];
    if (f === 'department') return v.sector ? '' : WORLD_HINT[f];
    if (f === 'jobrole') return v.department ? '' : WORLD_HINT[f];
    return WORLD_HINT[f] || '';
  };

  useEffect(() => {
    if (!pro || worldMode !== 'loading') return undefined;
    let live = true;
    loadWorldOptions(['empstat', 'hw', 'freelancer', 'jobseeker', 'industry', 'sector', 'department']).then((o) => {
      if (!live) return;
      setWorldOpts(o);
      setWorldMode(o.empstat.length ? 'api' : 'static');
    });
    return () => { live = false; };
  }, [pro, worldMode]);

  // The job-title list is large, so it is only fetched once the member gets to that question.
  useEffect(() => {
    if (worldMode !== 'api' || !world.ready.jobrole || worldOpts.jobrole) return undefined;
    let live = true;
    loadWorldOptions(['jobrole']).then((o) => { if (live) setWorldOpts((s) => ({ ...s, ...o })); });
    return () => { live = false; };
  }, [worldMode, world.ready.jobrole, worldOpts.jobrole]);

  async function save(e) {
    e.preventDefault();
    setTouched((t) => ({ ...t, submit: true }));
    if (Object.keys(errors).length) {
      setTimeout(() => document.querySelector('.wsv [aria-invalid="true"]')?.focus(), 30);
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      const answers = buildProfileAnswers(pro ? 'professional' : 'consumer', { ...v, jobrole: v.jobrole === OTHER ? v.jobTitleOther.trim() : v.jobrole });
      if (!demo && Object.keys(answers).length) await patchJSON(`${ME_API}/answer`, answers);
      markDone(mail);
      onDone?.();
    } catch {
      setMsg('We couldn’t save your answers. Please try again, or skip for now.');
      setBusy(false);
    }
  }

  const interests = interestsFor(type);

  return (
    <form className={`wsv wsv-${type}`} onSubmit={save} noValidate>
      <p className="tw-k"><Icon name="sparkle" size={15} /> Welcome survey · 1 minute</p>
      {pro ? (
        <>
          <h2 className="sx-h">Tell us about your work{name ? `, ${name}` : ''}</h2>
          <p className="sx-sub">Verified professional details unlock higher-value B2B studies. They are never shared with research clients.</p>
          <div className="sx-grid ws-grid">
            {WORLD_FIELDS.filter((f) => !world.na.includes(f) && (f === 'empstat' || Boolean(v.empstat))).map((f) =>
              f === 'hw' ? (
                <div key={f} className={`sx-field ${err(f) ? 'bad' : ''}`} style={{ gridColumn: '1 / -1' }}>
                  <p id={`${f}-label`} className="sx-sub" style={{ margin: '0 0 6px' }}>{worldLabel(f)}</p>
                  <div className="sx-interests" role="group" aria-labelledby={`${f}-label`}>
                    {world.lists.hw.map((o) => {
                      const on = v.hw.includes(o.value);
                      return (
                        <button type="button" key={o.value} aria-pressed={on} className={on ? 'on' : ''}
                          onClick={() => { pickWorld('hw', on ? v.hw.filter((x) => x !== o.value) : [...v.hw, o.value]); touch('hw'); }}>
                          <Icon name={on ? 'check' : 'heart'} size={16} stroke={on ? 2.6 : 1.8} /> {o.label}
                        </button>
                      );
                    })}
                  </div>
                  {err(f) ? <p className="f-err" id={`${f}-err`} role="alert">{err(f)}</p> : null}
                </div>
              ) : (
                <div key={f} style={{ minWidth: 0, width: '100%' }}>
                  <Autocomplete
                    id={f}
                    fullWidth
                    disabled={!world.ready[f]}
                    options={world.lists[f]}
                    value={world.lists[f].find((o) => o.value === v[f]) || null}
                    getOptionLabel={(o) => o.label || ''}
                    isOptionEqualToValue={(o, val) => o.value === val.value}
                    groupBy={world.lists[f].some((o) => o.group) ? (o) => o.group || 'Other' : undefined}
                    onChange={(_, o) => { pickWorld(f, o?.value || ''); touch(f); }}
                    onBlur={() => touch(f)}
                    slotProps={{ listbox: { sx: { maxHeight: 200, overflowY: 'auto' } }, popper: { sx: { zIndex: 15000 } } }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={worldLabel(f)}
                        variant="outlined"
                        error={Boolean(err(f))}
                        helperText={err(f) || worldHint(f) || ' '}
                        slotProps={{
                          ...params.slotProps,
                          input: {
                            ...params.InputProps,
                            ...params.slotProps?.input,
                            startAdornment: (
                              <>
                                <InputAdornment position="start"><Icon name={WORLD_ICON[f]} size={18} /></InputAdornment>
                                {params.slotProps?.input?.startAdornment ?? params.InputProps?.startAdornment ?? null}
                              </>
                            ),
                          },
                          htmlInput: { ...params.inputProps, ...params.slotProps?.htmlInput, 'aria-invalid': Boolean(err(f)), 'aria-describedby': err(f) ? `${f}-err` : undefined },
                          formHelperText: { sx: { mx: 0, minHeight: '1.25em' } },
                        }}
                      />
                    )}
                    sx={muiField}
                  />
                </div>
              ),
            )}
            {v.jobrole === OTHER ? (
              <Field id="jobTitleOther" label="Type your job title" error={err('jobTitleOther')} ok={ok('jobTitleOther')} icon="pen">
                <input id="jobTitleOther" placeholder=" " autoComplete="organization-title" maxLength={80} value={v.jobTitleOther} onChange={(e) => set('jobTitleOther', e.target.value)} {...aria('jobTitleOther')} />
              </Field>
            ) : null}
            <div style={{ minWidth: 0, width: '100%' }}>
              <TextField
                id="companyEmail"
                name="companyEmail"
                label="Company email (optional — speeds up verification)"
                type="email"
                variant="outlined"
                fullWidth
                value={v.companyEmail}
                onChange={(e) => set('companyEmail', e.target.value)}
                onBlur={() => touch('companyEmail')}
                autoComplete="work email"
                error={Boolean(err('companyEmail'))}
                helperText={err('companyEmail') || ' '}
                slotProps={{
                  htmlInput: { maxLength: 120, ...aria('companyEmail') },
                  input: { startAdornment: <InputAdornment position="start"><Icon name="mail" size={18} /></InputAdornment> },
                  formHelperText: { sx: { mx: 0, minHeight: '1.25em' } },
                }}
                sx={muiField}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <h2 className="sx-h">What are you into{name ? `, ${name}` : ''}? <small>(optional)</small></h2>
          <p className="sx-sub">Pick a few interests so your first invitations feel relevant. You can refine them later in profile surveys.</p>
          <div className="sx-interests">
            {interests.map((c) => {
              const on = v.interests.includes(c.id);
              return (
                <button type="button" key={c.id} aria-pressed={on} className={on ? 'on' : ''}
                  onClick={() => set('interests', on ? v.interests.filter((x) => x !== c.id) : [...v.interests, c.id])}>
                  <Icon name={on ? 'check' : c.icon} size={18} stroke={on ? 2.6 : 1.8} /> {c.label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {msg ? <p className="form-error" role="alert">{msg}</p> : null}
      <div className="tw-nav">
        <button type="button" className="btn btn-ghost-dark" onClick={() => onDone?.()} disabled={busy}>Skip for now</button>
        <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
          {busy ? <><span className="spinner" /> Saving…</> : <>Save and open my dashboard <Icon name="arrow" size={18} /></>}
        </button>
      </div>
    </form>
  );
}

// ── Teens: the same welcome step, with the Teen Profile Survey's own first questions ──────────────────────────────────
function TeenWelcome({ name = '', mail = '', onDone }) {
  const [me, setMe] = useState(null);
  const [a, setA] = useState({});
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    teenApi.me().then((m) => { setMe(m); setA(m.answers || {}); }).catch(() => setMe({ answers: {} }));
  }, []);
  const tz = useTimezones(me?.teen?.location?.country);
  const qs = useMemo(() => (me ? WELCOME_QUESTIONS.filter((q) => !answered(me.answers?.[q.n])) : []), [me]);
  useEffect(() => { if (me && !qs.length) { markDone(mail); onDone?.(); } }, [me, qs.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    // the device's own time zone is the likely answer: start with it filled in
    if (!a.D10 && qs.some((q) => q.n === 'D10')) { try { setA((x) => ({ ...x, D10: x.D10 || Intl.DateTimeFormat().resolvedOptions().timeZone })); } catch { /* */ } }
  }, [qs]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k, v) => { setA((x) => ({ ...x, [k]: v })); setErrs((x) => ({ ...x, [k.replace(/__other$/, '')]: '' })); };

  async function save(e) {
    e.preventDefault();
    const bad = Object.fromEntries(qs.map((q) => [q.n, checkQuestion(q, a)]).filter(([, x]) => x));
    if (Object.keys(bad).length) {
      setErrs(bad);
      setTimeout(() => document.querySelector('.wsv [aria-invalid="true"]')?.focus(), 30);
      return;
    }
    setBusy(true);
    setMsg('');
    const out = {};
    qs.forEach((q) => { if (answered(a[q.n])) out[q.n] = a[q.n]; if (answered(a[`${q.n}__other`])) out[`${q.n}__other`] = a[`${q.n}__other`]; });
    try {
      await teenApi.saveAnswers(out, true);
      markDone(mail);
      onDone?.();
    } catch {
      setMsg('We couldn’t save your answers. Please try again, or skip for now.');
      setBusy(false);
    }
  }
  if (!me) return <div className="wsv wsv-teen" aria-busy="true"><p className="sx-sub">One moment…</p></div>;
  if (!qs.length) return null;
  return (
    <form className="wsv wsv-teen" onSubmit={save} noValidate>
      <p className="tw-k"><Icon name="sparkle" size={15} /> Welcome survey · {qs.length} quick questions</p>
      <h2 className="sx-h">A few quick questions{name ? `, ${name}` : ''}</h2>
      <p className="sx-sub">So we can match you with surveys you’ll actually like. Your age, country, region and gender are already saved from your registration.</p>
      {qs.map((q) => {
        const v = a[q.n];
        const list = Array.isArray(v) ? v : v ? [v] : [];
        const label = <p className="sx-sub ws-q" id={`${q.n}-label`}><b>{q.q}</b>{q.req ? '' : ' (optional)'}{q.multi ? <small> · choose all that apply</small> : null}</p>;
        const error = errs[q.n] ? <p className="f-err" id={`${q.n}-err`} role="alert">{errs[q.n]}</p> : null;
        if (q.kind === 'language' || q.kind === 'timezone') {
          const opts = q.kind === 'language' ? LANGUAGES.map((l) => ({ value: l.code, label: l.native === l.name ? l.name : `${l.native} · ${l.name}` })) : tz;
          return (
            <div key={q.n} className={`sx-field ${errs[q.n] ? 'bad' : ''}`}>
              {label}
              <div className="sx-control">
                <select id={`ws-${q.n}`} className={v ? 'has-val' : ''} value={v || ''} onChange={(e) => set(q.n, e.target.value)} aria-labelledby={`${q.n}-label`} aria-invalid={Boolean(errs[q.n])}>
                  <option value="">Choose…</option>
                  {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {error}
            </div>
          );
        }
        const hasOther = q.other && list.includes(q.other);
        return (
          <div key={q.n} className={`sx-field ${errs[q.n] ? 'bad' : ''}`}>
            {label}
            <div className="sx-interests" role="group" aria-labelledby={`${q.n}-label`} aria-invalid={Boolean(errs[q.n])}>
              {(q.o || []).map(([l, val, emoji]) => {
                const on = list.includes(val);
                const pick = () => {
                  if (!q.multi) return set(q.n, val);
                  const ex = q.exclusive || [];
                  if (ex.includes(val)) return set(q.n, on ? [] : [val]);
                  const base = list.filter((x) => !ex.includes(x));
                  return set(q.n, on ? base.filter((x) => x !== val) : [...base, val]);
                };
                return (
                  <button type="button" key={val} aria-pressed={on} className={on ? 'on' : ''} onClick={pick}>
                    {on ? <Icon name="check" size={16} stroke={2.6} /> : <span aria-hidden="true">{emoji}</span>} {l}
                  </button>
                );
              })}
            </div>
            {hasOther ? (
              <Field id={`ws-${q.n}-other`} label="Tell us more" icon="pen">
                <input id={`ws-${q.n}-other`} placeholder=" " maxLength={120} value={a[`${q.n}__other`] || ''} onChange={(e) => set(`${q.n}__other`, e.target.value)} />
              </Field>
            ) : null}
            {error}
          </div>
        );
      })}
      {msg ? <p className="form-error" role="alert">{msg}</p> : null}
      <div className="tw-nav">
        <button type="button" className="btn btn-ghost-dark" onClick={() => onDone?.()} disabled={busy}>Skip for now</button>
        <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
          {busy ? <><span className="spinner" /> Saving…</> : <>Save and open my dashboard <Icon name="arrow" size={18} /></>}
        </button>
      </div>
    </form>
  );
}

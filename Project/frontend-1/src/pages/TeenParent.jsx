// The parent / legal guardian's pages, all behind the secure link from the invitation email (/teen/parent?t=…):
//   landing (YES / NO) → onboarding form (Module 1, with review) → consent (MINOR-2026.10) → approved
//   landing → NO → optional reasons → declined
// Calm, professional look (teen.css: .tz-w-gd, -ob, -cs, -ap, -dc) — deliberately unlike the teen's playful screens.
// The link token is taken out of the address bar at once; the server checks it (and the stage) on every request.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Flag } from '../components/CountryPicker.jsx';
import { t, err, fmtDate, activeLang } from '../teen/i18n.js';
import * as R from '../teen/rules.js';
import { teenApi, relationLabel } from '../teen/api.js';
import { countries, country as loadCountry } from '../teen/geo.js';
import { PARENT_SURVEY } from '../teen/data/parentSurvey.js';
import { SELECTIONS, EN as CEN, TERMS_VERSION } from '../teen/data/consent.js';
import { LANGUAGES } from '../teen/data/surveyLanguages.js';
import GuardianConsentV2 from '../teen/consent-v2/GuardianConsentV2.jsx';
import { DEFAULT_CONFIG as MINOR_CFG } from '../teen/consent-v2/config.js';
import { TeenPage, TeenSeo, Art, Emo, useLinkToken, forgetLinkToken, useFocusTitle, Loading, LinkProblem } from '../teen/shell.jsx';
import { TextInput, DateField, Combo, PhoneField, Choice, Btn, Alert, Celebrate, tap } from '../teen/ui.jsx';
import { chime } from '../utils/sound.js';

const play = (fn) => { try { fn(); } catch { /* sound off */ } };
const thisYear = new Date().getUTCFullYear();
const REL_TO_P03 = { mother: 'mother', father: 'father', legal_guardian: 'guardian' };
const SECTIONS_OB = PARENT_SURVEY.sections;
const ALL_QS = SECTIONS_OB.flatMap((s) => s.qs);
const rulesFor = (qs) => ({ questions: qs.map((q) => ({ n: q.n, kind: q.kind || 'choice', req: q.req, reqWhen: q.reqWhen, when: q.when, multi: q.multi, values: q.o ? q.o.map((o) => o[1]) : null, exclusive: q.exclusive })) });

export default function TeenParent() {
  const token = useLinkToken('guardian');
  const [view, setView] = useState(null);
  const [problem, setProblem] = useState(null); // { code, canRenew, status }
  const [screen, setScreen] = useState('loading'); // loading | landing | confirm-yes | decline | declined | onboarding | consent | approved | stop
  const [extra, setExtra] = useState({});
  const [renew, setRenew] = useState('idle');
  const titleRef = useFocusTitle(screen);

  const load = useCallback(async () => {
    if (token === null) return;
    if (!token) { setProblem({ code: 'link_invalid' }); setScreen('problem'); return; }
    try {
      const v = await teenApi.guardian(token);
      setView(v);
      const want = new URLSearchParams(window.location.search).get('d');
      if (v.status === 'pending_guardian_approval') setScreen(want === 'no' ? 'decline' : want === 'yes' ? 'confirm-yes' : 'landing');
      else if (v.status === 'pending_consent') setScreen(want === 'no' ? 'decline' : 'consent');
      else setScreen(want === 'no' ? 'decline' : 'onboarding');
    } catch (e) {
      setProblem({ code: e.code, canRenew: e.extra?.canRenew, status: e.extra?.status });
      setScreen('problem');
    }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const world = { landing: 'gd', 'confirm-yes': 'gd', decline: 'dc', declined: 'dc', onboarding: 'ob', consent: 'cs', approved: 'ap', stop: 'dc', problem: 'gd', loading: 'gd' }[screen];
  const teenName = view?.teen?.firstName || '';
  return (
    <>
      <TeenSeo title="Parent or guardian permission" description="Review a Teen Panel registration request and give or decline permission." path="/teen/parent" />
      <TeenPage world={world} label={t('gd_kicker')}>
        {screen === 'loading' ? <Loading /> : null}
        {screen === 'problem' ? (
          problem.code === 'already_done' || problem.code === 'already_declined' || problem.code === 'link_used' ? (
            <Done titleRef={titleRef} code={problem.code} />
          ) : (
            <LinkProblem code={problem.code} renewBusy={renew === 'busy'} renewDone={renew === 'done'}
              onRenew={problem.canRenew ? async () => { setRenew('busy'); try { await teenApi.guardianRenew(token); setRenew('done'); } catch (e) { setRenew('idle'); setProblem({ code: e.code }); } } : undefined} />
          )
        ) : null}
        {view && screen === 'landing' ? <Landing view={view} titleRef={titleRef} onYes={() => setScreen('confirm-yes')} onNo={() => { tap(); setScreen('decline'); }} /> : null}
        {view && screen === 'confirm-yes' ? (
          <ConfirmYes view={view} titleRef={titleRef} onBack={() => setScreen('landing')} onNo={() => setScreen('decline')}
            onDone={(v) => { setView((x) => ({ ...x, status: v.status, decision: 'yes' })); play(chime); setScreen('onboarding'); }} token={token} />
        ) : null}
        {view && screen === 'decline' ? (
          <Decline view={view} token={token} titleRef={titleRef}
            onBack={() => setScreen(view.status === 'pending_guardian_approval' ? 'landing' : view.status === 'pending_consent' ? 'consent' : 'onboarding')}
            onDone={(reasons) => { setExtra({ reasons }); forgetLinkToken('guardian'); setScreen('declined'); }} />
        ) : null}
        {screen === 'declined' ? <Declined name={teenName} reasons={extra.reasons || []} titleRef={titleRef} /> : null}
        {view && screen === 'onboarding' ? (
          <Onboarding view={view} token={token} titleRef={titleRef} onDecline={() => setScreen('decline')}
            onDone={(r) => {
              if (r.stop) { setExtra({ stop: r.stop }); if (r.stop === 'not_authorised') forgetLinkToken('guardian'); setScreen('stop'); return; }
              setView((x) => ({ ...x, status: 'pending_consent' })); play(chime); setScreen('consent');
            }} />
        ) : null}
        {screen === 'stop' ? <Stopped kind={extra.stop} name={teenName} titleRef={titleRef} /> : null}
        {view && screen === 'consent' ? (
          <GuardianConsentV2 view={view}
            submit={(b) => teenApi.consent(token, { version: TERMS_VERSION, ...b })}
            onDecline={() => setScreen('decline')}
            onDone={(rec, r) => { setExtra({ ...(r || {}), at: rec.timestamps.submittedAt, selections: rec.consents, record: rec }); forgetLinkToken('guardian'); setScreen('approved'); }} />
        ) : null}
        {view && screen === 'approved' ? <Approved view={view} r={extra} titleRef={titleRef} /> : null}
      </TeenPage>
    </>
  );
}

// ═══════════════════════════════ landing: YES or NO ═══════════════════════════════
function RequestCard({ view }) {
  const g = view.guardian;
  return (
    <aside className="tz-req" aria-label={t('gd_request')}>
      <p className="tz-req-h"><Icon name="clipboard" size={16} /> {t('gd_request')} <span className="tz-mono">{view.reference}</span></p>
      <div className="tz-req-row"><span className="tz-req-av is-teen">{(view.teen.firstName || '?')[0]}</span><div><small>{t('gd_teen')}</small><b>{view.teen.firstName}</b><em>{t('gd_age', view.teen.age)}{view.teen.countryCode ? <> · <Flag iso={view.teen.countryCode} size={11} /> {view.teen.country}</> : null}</em></div></div>
      <div className="tz-req-link" aria-hidden="true"><i /><Icon name="link" size={14} /><i /></div>
      <div className="tz-req-row"><span className="tz-req-av">{(g.firstName || '?')[0]}</span><div><small>{t('gd_you')}</small><b>{[g.firstName, g.lastName].filter(Boolean).join(' ')}</b><em>{relationLabel(g.relation)} · {g.email}</em></div></div>
      {view.expiresAt ? <p className="tz-small"><Icon name="clock" size={13} /> {t('gd_expires', fmtDate(view.expiresAt))}</p> : null}
    </aside>
  );
}

function Landing({ view, titleRef, onYes, onNo }) {
  const name = view.teen.firstName;
  return (
    <div className="tz-gd">
      <div className="tz-gd-main">
        <p className="tz-kicker"><Icon name="shield" size={15} /> {t('gd_kicker')}</p>
        <h1 className="tz-h1 tz-serif" ref={titleRef} tabIndex={-1}>{t('gd_title', name)}</h1>
        <p className="tz-lead">{t('gd_lead', name, relationLabel(view.guardian.relation).toLowerCase())}</p>
        <div className="tz-gd-grid">
          <section className="tz-gd-box">
            <h2 className="tz-h4"><Emo name="sparkles" size={24} /> {t('gd_what_h')}</h2>
            <p>{t('gd_what_p')}</p>
          </section>
          <section className="tz-gd-box">
            <h2 className="tz-h4"><Emo name="shield" size={24} /> {t('gd_safe_h')}</h2>
            <ul className="tz-ticks">{[1, 2, 3, 4].map((n) => <li key={n}><Icon name="check" size={14} stroke={3} /> {t(`gd_safe_${n}`)}</li>)}</ul>
          </section>
          <section className="tz-gd-box">
            <h2 className="tz-h4"><Emo name="clipboard" size={24} /> {t('gd_how_h')}</h2>
            <ol className="tz-flowlist">{[1, 2, 3].map((n) => <li key={n}>{t(`gd_how_${n}`)}</li>)}</ol>
          </section>
          <section className="tz-gd-box">
            <h2 className="tz-h4"><Emo name="key" size={24} /> {t('gd_after_h')}</h2>
            <p>{t('gd_after_p', name)}</p>
            <p className="tz-links"><Link to="/teen-terms" target="_blank" rel="noopener">{t('link_teen_terms')}</Link><Link to="/privacy" target="_blank" rel="noopener">{t('link_privacy')}</Link></p>
          </section>
        </div>
        <h2 className="tz-h3 tz-serif tz-q">{t('gd_q', name)}</h2>
        <div className="tz-yn">
          <button type="button" className="tz-yn-btn is-yes" onClick={onYes}>
            <span className="tz-yn-ic"><Icon name="check" size={26} stroke={3} /></span>
            <span><b>{t('gd_yes')}</b><small>{t('gd_yes_sub')}</small></span>
          </button>
          <button type="button" className="tz-yn-btn is-no" onClick={onNo}>
            <span className="tz-yn-ic"><Icon name="close" size={24} stroke={3} /></span>
            <span><b>{t('gd_no')}</b><small>{t('gd_no_sub')}</small></span>
          </button>
        </div>
        <p className="tz-small">{t('support_line')}</p>
      </div>
      <div className="tz-gd-side">
        <Art name="trust" size={200} />
        <RequestCard view={view} />
      </div>
    </div>
  );
}

function ConfirmYes({ view, token, titleRef, onBack, onNo, onDone }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const once = useRef(false);
  const go = async () => {
    if (once.current) return;
    once.current = true; setBusy(true); setMsg('');
    try { onDone(await teenApi.decide(token, { decision: 'yes', confirm: true })); }
    catch (e) { once.current = false; setBusy(false); setMsg(err(e.code) || err('server')); }
  };
  return (
    <div className="tz-card tz-confirm" role="dialog" aria-modal="false" aria-labelledby="cy-h">
      <Art name="hearth" size={150} />
      <h1 id="cy-h" className="tz-h2 tz-serif" ref={titleRef} tabIndex={-1}>{t('gd_confirm_yes_h', view.teen.firstName)}</h1>
      <p className="tz-lead">{t('gd_confirm_yes_p')}</p>
      <ol className="tz-mini-steps"><li className="is-now">{t('gd_how_2')}</li><li>{t('gd_how_3')}</li><li>{t('ap_n1', view.teen.firstName)}</li></ol>
      {msg ? <Alert>{msg}</Alert> : null}
      <div className="tz-actions">
        <Btn icon="check" busy={busy} onClick={go}>{t('gd_confirm_yes_btn')}</Btn>
        <Btn kind="ghost" onClick={onBack} disabled={busy}>{t('gd_cancel')}</Btn>
      </div>
      <button type="button" className="tz-link tz-small" onClick={onNo}>{t('gd_no')}</button>
    </div>
  );
}

// ═══════════════════════════════ NO path ═══════════════════════════════
function Decline({ view, token, titleRef, onBack, onDone }) {
  const [reasons, setReasons] = useState([]);
  const [comment, setComment] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const once = useRef(false);
  const name = view.teen.firstName;
  const send = async () => {
    if (once.current) return;
    once.current = true; setBusy(true); setMsg('');
    try { await teenApi.decide(token, { decision: 'no', confirm: true, reasons, comment }); onDone(reasons); }
    catch (e) { once.current = false; setBusy(false); setMsg(err(e.code) || err('server')); }
  };
  return (
    <div className="tz-dc">
      <div className="tz-dc-main">
        <p className="tz-kicker"><Icon name="shield" size={15} /> {t('gd_kicker')} · {view.reference}</p>
        <h1 className="tz-h2 tz-serif" ref={titleRef} tabIndex={-1}>{t('dc_title')}</h1>
        <p className="tz-lead">{t('dc_lead')}</p>
        <Choice id="dc-reasons" multi optional label={t('dc_reasons_h')} value={reasons} onChange={setReasons} columns={1}
          options={R.DECLINE_REASONS.map((r) => ({ value: r, label: t(`dc_r_${r}`) }))} />
        <div className="tf-field tf-span-2">
          <label className="tf-label" htmlFor="dc-comment"><span>{t('dc_comment')}</span><em className="tf-opt">{t('optional')}</em></label>
          <textarea id="dc-comment" className="tf-input tf-area" rows={4} maxLength={1500} value={comment} onChange={(e) => setComment(e.target.value)} />
          <p className="tf-hint">{comment.length}/1500</p>
        </div>
        {(reasons.includes('not_recognised') || reasons.includes('not_guardian')) ? <Alert tone="info" icon="shield">{t('dc_unrec_note')}</Alert> : null}
        {msg ? <Alert>{msg}</Alert> : null}
        {!confirm ? (
          <div className="tz-actions">
            <Btn kind="danger" icon="close" onClick={() => { tap(); setConfirm(true); }}>{t('dc_submit')}</Btn>
            <Btn kind="ghost" icon="arrow" className="is-back" onClick={onBack}>{t('dc_back')}</Btn>
          </div>
        ) : (
          <div className="tz-card tz-dc-confirm" role="alertdialog" aria-labelledby="dc-ch" aria-describedby="dc-cp">
            <h2 id="dc-ch" className="tz-h3">{t('dc_confirm_h', name)}</h2>
            <p id="dc-cp">{t('dc_confirm_p', name)}</p>
            <div className="tz-actions">
              <Btn kind="danger" busy={busy} onClick={send}>{t('dc_confirm_btn')}</Btn>
              <Btn kind="ghost" onClick={() => setConfirm(false)} disabled={busy}>{t('gd_cancel')}</Btn>
            </div>
            <button type="button" className="tz-link tz-small" onClick={onBack} disabled={busy}>{t('dc_back')}</button>
          </div>
        )}
      </div>
      <div className="tz-dc-side"><Art name="nest" size={190} /><RequestCard view={view} /></div>
    </div>
  );
}
function Declined({ name, reasons, titleRef }) {
  const unrec = reasons.includes('not_recognised') || reasons.includes('not_guardian');
  return (
    <div className="tz-card tz-block tz-declined">
      <Art name="sunrise" size={170} />
      <h1 className="tz-h2 tz-serif" ref={titleRef} tabIndex={-1}>{t('dc_done_h')}</h1>
      <p className="tz-lead">{t('dc_done_p', name)}</p>
      <ul className="tz-ticks"><li><Icon name="check" size={14} stroke={3} /> {t('dc_done_1')}</li><li><Icon name="check" size={14} stroke={3} /> {t('dc_done_2', name)}</li><li><Icon name="check" size={14} stroke={3} /> {t('dc_done_3')}</li></ul>
      {unrec ? <Alert tone="info" icon="shield">{t('dc_done_unrec')}</Alert> : null}
      <p className="tz-small">{t('dc_done_change')}</p>
      <div className="tz-actions"><Link className="tf-btn tf-btn-ghost" to="/"><Icon name="home" size={18} /> <span>{t('s4_home')}</span></Link></div>
    </div>
  );
}
function Stopped({ kind, name, titleRef }) {
  const no = kind === 'not_authorised';
  return (
    <div className="tz-card tz-block">
      <Art name={no ? 'sentry' : 'lab'} size={160} />
      <h1 className="tz-h2 tz-serif" ref={titleRef} tabIndex={-1}>{no ? t('ob_stop_no_h') : t('ob_stop_unsure_h')}</h1>
      <p className="tz-lead">{no ? t('ob_stop_no_p', name) : t('ob_stop_unsure_p')}</p>
      <p className="tz-small">{t('support_line')}</p>
    </div>
  );
}
function Done({ code, titleRef }) {
  return (
    <div className="tz-card tz-block">
      <Art name={code === 'already_declined' ? 'nest' : 'celebrate'} size={160} />
      <h1 className="tz-h2 tz-serif" ref={titleRef} tabIndex={-1}>{err(code)}</h1>
      <p className="tz-lead">{code === 'already_declined' ? t('dc_done_change') : t('gd_done_p')}</p>
      <p className="tz-small">{t('support_line')}</p>
      <div className="tz-actions"><Link className="tf-btn tf-btn-ghost" to="/"><Icon name="home" size={18} /> <span>{t('s4_home')}</span></Link></div>
    </div>
  );
}

// ═══════════════════════════════ onboarding (Module 1) ═══════════════════════════════
function prefillFrom(view) {
  const g = view.guardian || {};
  const p = view.prefill || {};
  const a = { ...(view.onboarding?.answers || {}) };
  const put = (k, v) => { if ((a[k] === undefined || a[k] === '') && v) a[k] = v; };
  put('parent-first-name', g.firstName); put('parent-middle-name', g.middleName); put('parent-last-name', g.lastName);
  put('parent-dob', g.dob);
  if (['Female', 'Male', 'Non-binary', 'Prefer not to say'].includes(g.gender)) put('parent-gender', g.gender);
  put('P01', p.country); put('P02', p.state);
  put('P03', REL_TO_P03[g.relation]);
  put('P08', g.email);
  if (g.phone) put('P09', g.phone);
  put('P06', LANGUAGES.some((l) => l.code === activeLang()) ? activeLang() : 'en');
  return a;
}
const KNOWN_FROM_TEEN = ['parent-first-name', 'parent-dob', 'P01', 'P02', 'P03', 'P08'];

function Onboarding({ view, token, titleRef, onDone, onDecline }) {
  const [a, setA] = useState(() => prefillFrom(view));
  const [sec, setSec] = useState(0); // 0..3 sections, 4 = review
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [savedAt, setSavedAt] = useState(null);
  const [healthMode, setHealthMode] = useState(a.HQ_skipped ? 'skipped' : a.HQ1 || a.HQ2 ? 'answer' : 'intro'); // intro | confirm | answer | skipped
  const [editKnown, setEditKnown] = useState({});
  const [list, setList] = useState([]);
  const [cdata, setCdata] = useState(null);
  const once = useRef(false);
  const secRef = useFocusTitle(sec);
  useEffect(() => { countries().then(setList).catch(() => {}); }, []);
  useEffect(() => { if (a.P01) loadCountry(a.P01).then(setCdata).catch(() => setCdata(null)); }, [a.P01]);
  const set = (k, v) => setA((x) => ({ ...x, [k]: v }));
  const prefilled = useMemo(() => prefillFrom(view), [view]);
  const teenName = view.teen.firstName;

  const section = SECTIONS_OB[sec];
  const visible = (q) => !q.when || q.when(a);
  const errors = useMemo(() => {
    const qs = sec < SECTIONS_OB.length ? section.qs : ALL_QS;
    const e = R.validateOnboarding(a, rulesFor(qs));
    qs.forEach((q) => { if (q.other && (Array.isArray(a[q.n]) ? a[q.n] : [a[q.n]]).includes(q.other) && !String(a[`${q.n}__other`] || '').trim()) e[`${q.n}__other`] = 'required'; });
    if (sec === 3 && healthMode !== 'answer') return {};
    return e;
  }, [a, sec, section, healthMode]);
  const show = (k) => (tried ? err(errors[k]) : '');

  const save = async (submit = false) => {
    const body = { ...a, 'parent-name': [a['parent-first-name'], a['parent-middle-name'], a['parent-last-name']].filter(Boolean).join(' ') };
    if (healthMode === 'skipped') { body.HQ_skipped = true; delete body.HQ1; delete body.HQ2; delete body.HQ4; }
    if (body.HQ4 && !['primary', 'shared'].includes(body.HQ2)) delete body.HQ4;
    return teenApi.onboarding(token, body, submit);
  };
  const next = async () => {
    setTried(true); setMsg('');
    if (Object.keys(errors).length) {
      const k = Object.keys(errors)[0];
      setTimeout(() => (document.getElementById(`ob-${k}`) || document.getElementById(`ob-${k}-d`) || document.querySelector(`[data-q="${k}"] button, [data-q="${k}"] input`))?.focus(), 30);
      return;
    }
    setTried(false);
    tap();
    // the answers save as the parent goes, so a closed tab or a later visit picks up where they left off
    save(false).then(() => setSavedAt(new Date())).catch(() => {});
    setSec((s) => s + 1);
  };
  const submit = async () => {
    if (once.current) return;
    setTried(true);
    const e = R.validateOnboarding(a, rulesFor(ALL_QS.filter((q) => !q.n.startsWith('HQ') || healthMode === 'answer')));
    if (Object.keys(e).length) { setMsg(t('e_fix_below')); const first = ALL_QS.findIndex((q) => e[q.n]); setSec(SECTIONS_OB.findIndex((s) => s.qs.includes(ALL_QS[first]))); return; }
    once.current = true; setBusy(true); setMsg('');
    try { onDone(await save(true)); }
    catch (ex) {
      once.current = false; setBusy(false);
      if (ex.code === 'validation') { setMsg(t('e_fix_below')); const k = Object.keys(ex.fields || {})[0]; const i = SECTIONS_OB.findIndex((s) => s.qs.some((q) => q.n === k)); if (i >= 0) setSec(i); }
      else setMsg(err(ex.code) || err('server'));
    }
  };

  const steps = [...SECTIONS_OB.map((s) => s.name), t('ob_review')];
  return (
    <div className="tz-ob">
      <aside className="tz-ob-side">
        <p className="tz-kicker"><Icon name="shield" size={15} /> {t('gd_kicker')}</p>
        <h1 className="tz-h3 tz-serif" ref={titleRef} tabIndex={-1}>{t('ob_title')}</h1>
        <p className="tz-small">{t('ob_lead', teenName)}</p>
        <ol className="tz-ob-steps">
          {steps.map((s, i) => (
            <li key={s} className={i < sec ? 'is-done' : i === sec ? 'is-now' : ''}>
              <button type="button" disabled={i > sec} onClick={() => setSec(i)} aria-current={i === sec ? 'step' : undefined}>
                <span>{i < sec ? <Icon name="check" size={12} stroke={3} /> : i + 1}</span>{s}{SECTIONS_OB[i]?.optional ? <em>{t('optional')}</em> : null}
              </button>
            </li>
          ))}
        </ol>
        <p className="tz-small tz-saved"><Icon name="check" size={13} /> {savedAt ? `${t('saved')} · ${savedAt.toLocaleTimeString(activeLang(), { hour: '2-digit', minute: '2-digit' })}` : t('ob_saved_auto')}</p>
        <Art name="hearth" size={130} className="tz-ob-art" />
      </aside>
      <div className="tz-ob-main">
        {sec < SECTIONS_OB.length ? (
          <>
            <p className="tz-kicker">{t('ob_section', sec + 1, SECTIONS_OB.length)}</p>
            <h2 className="tz-h2 tz-serif" ref={secRef} tabIndex={-1}><span aria-hidden="true">{section.icon}</span> {section.name}</h2>
            {tried && Object.keys(errors).length ? <Alert>{t('e_fix_below')}</Alert> : null}
            {section.optional ? (
              <HealthGate intro={section.intro} mode={healthMode} setMode={(m) => { setHealthMode(m); if (m === 'skipped') setA((x) => { const y = { ...x }; delete y.HQ1; delete y.HQ2; delete y.HQ4; delete y.HQ1__other; return y; }); }} />
            ) : null}
            {!section.optional || healthMode === 'answer' ? (
              <div className="tz-ob-qs">
                {section.qs.filter(visible).map((q) => (
                  <Question key={q.n} q={q} a={a} set={set} show={show} list={list} cdata={cdata} teenName={teenName}
                    known={KNOWN_FROM_TEEN.includes(q.n) && prefilled[q.n] && a[q.n] === prefilled[q.n] && !editKnown[q.n]}
                    onEditKnown={() => setEditKnown((x) => ({ ...x, [q.n]: true }))} />
                ))}
              </div>
            ) : null}
            <div className="tz-nav">
              {sec > 0 ? <Btn kind="ghost" icon="arrow" className="is-back" onClick={() => setSec((s) => s - 1)}>{t('back')}</Btn> : <button type="button" className="tz-link tz-small" onClick={onDecline}>{t('ob_changed_mind')}</button>}
              <Btn iconEnd="arrow" onClick={next} disabled={section.optional && healthMode === 'intro'}>{t('continue')}</Btn>
            </div>
          </>
        ) : (
          <Review a={a} healthMode={healthMode} list={list} titleRef={secRef} onEdit={(i) => setSec(i)} busy={busy} msg={msg} onSubmit={submit} onBack={() => setSec(SECTIONS_OB.length - 1)} />
        )}
      </div>
    </div>
  );
}

function HealthGate({ intro, mode, setMode }) {
  if (mode === 'answer') return <p className="tz-small tz-health-note"><Icon name="lock" size={13} /> {intro.assurance} <button type="button" className="tz-link" onClick={() => setMode('skipped')}>{intro.skipLabel}</button></p>;
  if (mode === 'skipped') return <Alert tone="info" icon="clock">{intro.skipNote} <button type="button" className="tz-link" onClick={() => setMode('answer')}>{t('ob_health_start')}</button></Alert>;
  return (
    <div className="tz-health">
      <Art name={intro.art || 'care'} size={120} />
      <p className="tz-kicker">{intro.kicker}</p>
      <h3 className="tz-h3">{intro.title}</h3>
      <p>{intro.body}</p>
      <ul className="tz-health-r">{intro.reasons.map(([e, h, p]) => <li key={h}><span aria-hidden="true">{e}</span><div><b>{h}</b><small>{p}</small></div></li>)}</ul>
      <p className="tz-small"><Icon name="lock" size={13} /> {intro.assurance}</p>
      {mode === 'confirm' ? (
        <div className="tz-card tz-health-confirm" role="alertdialog" aria-labelledby="hc-h">
          <b id="hc-h">{intro.confirm.title}</b>
          <p>{intro.confirm.body}</p>
          <div className="tz-actions"><Btn onClick={() => setMode('answer')}>{intro.confirm.stay}</Btn><Btn kind="ghost" onClick={() => setMode('skipped')}>{intro.confirm.leave}</Btn></div>
        </div>
      ) : (
        <div className="tz-actions"><Btn icon="shield" onClick={() => setMode('answer')}>{intro.startLabel}</Btn><Btn kind="ghost" onClick={() => setMode('confirm')}>{intro.skipLabel}</Btn></div>
      )}
    </div>
  );
}

function labelOf(q, v, list) {
  if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) return '—';
  if (q.kind === 'country') return list.find((c) => c.i === v)?.n || v;
  if (q.kind === 'language') return LANGUAGES.find((l) => l.code === v)?.native || v;
  if (q.kind === 'dob') return fmtDate(v);
  if (q.o) return (Array.isArray(v) ? v : [v]).map((x) => q.o.find((o) => o[1] === x)?.[0] || x).join(', ');
  return String(v);
}

function Question({ q, a, set, show, list, cdata, known, onEditKnown, teenName }) {
  const id = `ob-${q.n}`;
  const req = q.req || (q.reqWhen && q.reqWhen(a));
  if (known) {
    const v = q.kind === 'name' ? [a['parent-first-name'], a['parent-middle-name'], a['parent-last-name']].filter(Boolean).join(' ') : labelOf(q, a[q.n], list);
    return (
      <div className="tz-known" data-q={q.n}>
        <div><small>{q.q}</small><b>{q.kind === 'country' && a.P01 ? <Flag iso={a.P01} size={12} /> : null} {v}</b><em><Icon name="check" size={11} stroke={3} /> {t('ob_prefilled', teenName)}</em></div>
        <button type="button" className="tz-link" onClick={onEditKnown}>{t('edit')}</button>
      </div>
    );
  }
  const wrap = (children) => (
    <div className="tz-q" data-q={q.n}>
      {children}
      {q.help && q.kind !== 'choice' ? null : null}
    </div>
  );
  if (q.kind === 'name') {
    return wrap(
      <fieldset className="tz-q-name">
        <legend className="tf-label">{q.q}</legend>
        {q.help ? <p className="tf-hint">{q.help}</p> : null}
        <div className="tf-grid">
          <TextInput id="ob-parent-first-name" label={t('first_name')} value={a['parent-first-name']} onChange={(v) => set('parent-first-name', v)} error={show('parent-first-name')} />
          <TextInput id="ob-parent-middle-name" label={t('middle_name')} optional value={a['parent-middle-name']} onChange={(v) => set('parent-middle-name', v)} />
          <TextInput id="ob-parent-last-name" label={t('last_name')} optional value={a['parent-last-name']} onChange={(v) => set('parent-last-name', v)} span={2} />
        </div>
      </fieldset>,
    );
  }
  if (q.kind === 'dob') return wrap(<DateField id={id} label={q.q} hint={t('ob_dob_hint')} value={a[q.n]} onChange={(v) => set(q.n, v)} fromYear={thisYear - 100} toYear={thisYear - 18} error={show(q.n)} span={2} />);
  if (q.kind === 'country') {
    return wrap(<Combo id={id} label={q.q} options={list.map((c) => ({ value: c.i, label: c.n, flag: c.i }))} value={a[q.n]} allowCustom={false} loading={!list.length} error={show(q.n)} span={2}
      onChange={(v) => { set(q.n, v); set('P02', ''); }} />);
  }
  if (q.kind === 'region') {
    const opts = (cdata?.s || []).map((s) => ({ value: s.n, label: s.n }));
    return wrap(<Combo id={id} label={q.q} options={opts} value={opts.some((o) => o.value === a[q.n]) ? a[q.n] : ''} manualValue={opts.some((o) => o.value === a[q.n]) ? '' : a[q.n]} error={show(q.n)} span={2}
      hint={t('type_own')} onChange={(v, m) => set(q.n, m.manual ? m.label : v)} />);
  }
  if (q.kind === 'language') {
    return wrap(<Combo id={id} label={q.q} options={LANGUAGES.map((l) => ({ value: l.code, label: l.native, sub: l.name !== l.native ? l.name : '' }))} value={a[q.n]} allowCustom={false} error={show(q.n)} span={2} onChange={(v) => set(q.n, v)} />);
  }
  if (q.kind === 'email') return wrap(<TextInput id={id} type="email" inputMode="email" label={q.q} hint={q.help} value={a[q.n]} onChange={(v) => set(q.n, v.trim())} error={show(q.n)} maxLength={254} span={2} />);
  if (q.kind === 'phone') {
    const cc = a.P09__country || a.P01 || '';
    const dial = list.find((x) => x.i === cc)?.d || '';
    const full = a[q.n] ? String(a[q.n]) : '';
    const ph = { country: cc, number: a.P09__number ?? (dial && full.startsWith(dial) ? full.slice(dial.length) : full) };
    return wrap(<PhoneField id={id} label={q.q} hint={q.help} optional={!req} countries={list} value={ph} error={show(q.n)} span={2}
      onChange={(v) => { const c = list.find((x) => x.i === v.country); set('P09__country', v.country); set('P09__number', v.number); set(q.n, v.number ? `${c?.d || ''}${R.digitsOnly(v.number)}` : ''); }} />);
  }
  // choice
  const multi = Boolean(q.multi);
  const v = a[q.n];
  const hasOther = q.other && (Array.isArray(v) ? v : [v]).includes(q.other);
  return wrap(
    <>
      <Choice id={id} label={q.q} hint={q.help || (multi ? t('ob_choose_many') : '')} optional={!req} multi={multi} exclusive={q.exclusive || []} value={v} error={show(q.n)}
        options={q.o.map(([label, value, emoji]) => ({ value, label, emoji }))} onChange={(x) => set(q.n, x)} columns={q.o.length > 6 ? 2 : undefined} />
      {hasOther ? <TextInput id={`${id}__other`} label={t('ob_other')} value={a[`${q.n}__other`]} onChange={(x) => set(`${q.n}__other`, x)} error={show(`${q.n}__other`)} maxLength={120} span={2} /> : null}
      {q.gate && v && v !== 'yes' ? <Alert tone="info" icon="shield">{v === 'no' ? t('ob_gate_no') : t('ob_gate_unsure')}</Alert> : null}
    </>,
  );
}

function Review({ a, healthMode, list, titleRef, onEdit, busy, msg, onSubmit, onBack }) {
  return (
    <div className="tz-review">
      <p className="tz-kicker">{t('ob_review')}</p>
      <h2 className="tz-h2 tz-serif" ref={titleRef} tabIndex={-1}>{t('ob_review')}</h2>
      <p className="tz-lead">{t('ob_review_p')}</p>
      {SECTIONS_OB.map((s, i) => (
        <section key={s.name} className="tz-review-sec">
          <header><h3><span aria-hidden="true">{s.icon}</span> {s.name}</h3><button type="button" className="tz-link" onClick={() => onEdit(i)}><Icon name="pen" size={14} /> {t('edit')}</button></header>
          {s.optional && healthMode !== 'answer' ? <p className="tz-small">{t('ob_health_skipped')}</p> : (
            <dl>
              {s.qs.filter((q) => !q.when || q.when(a)).map((q) => (
                <div key={q.n}><dt>{q.q}</dt><dd>{q.kind === 'name' ? [a['parent-first-name'], a['parent-middle-name'], a['parent-last-name']].filter(Boolean).join(' ') : q.kind === 'phone' ? (a.P09 ? `+${a.P09}` : '—') : labelOf(q, a[q.n], list)}{a[`${q.n}__other`] ? ` · ${a[`${q.n}__other`]}` : ''}</dd></div>
              ))}
            </dl>
          )}
        </section>
      ))}
      {a.P04 && a.P04 !== 'yes' ? <Alert tone="info" icon="shield">{a.P04 === 'no' ? t('ob_gate_no') : t('ob_gate_unsure')}</Alert> : null}
      {msg ? <Alert>{msg}</Alert> : null}
      <div className="tz-nav">
        <Btn kind="ghost" icon="arrow" className="is-back" onClick={onBack} disabled={busy}>{t('back')}</Btn>
        <Btn iconEnd="arrow" busy={busy} onClick={onSubmit}>{a.P04 === 'yes' || !a.P04 ? t('ob_submit') : t('ob_submit_review')}</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════ consent (MINOR-2026.10 Part B) ═══════════════════════════════
// the approved package's PDF: the consent record on page 1, then the binding English agreement
async function savePdf(record) {
  const { downloadAgreementPdf } = await import('../teen/consent-v2/pdf.js');
  downloadAgreementPdf({ cfg: MINOR_CFG, record: { ...record, guardianPermissionStatus: 'verified' } });
}

function Approved({ view, r, titleRef }) {
  const [fire, setFire] = useState(false);
  useEffect(() => { const id = setTimeout(() => setFire(true), 400); return () => clearTimeout(id); }, []);
  const name = view.teen.firstName;
  return (
    <div className="tz-ap">
      <Celebrate fire={fire} shape="stars" colors={['#0E9F6E', '#34D399', '#F5C451', '#FFFFFF']} />
      <div className="tz-seal" aria-hidden="true"><Icon name="check" size={46} stroke={3} /></div>
      <h1 className="tz-h1 tz-serif" ref={titleRef} tabIndex={-1}>{t('ap_title', view.guardian.firstName)}</h1>
      <p className="tz-lead">{t('ap_lead', '', name)}</p>
      <div className="tz-ticket tz-ap-rec">
        <p className="tz-ticket-h"><Icon name="shield" size={16} /> {t('ap_record')}</p>
        <div className="tz-ticket-row"><span>{t('ref')}</span><b className="tz-mono">{view.reference}</b></div>
        <div className="tz-ticket-row"><span>{t('ap_version')}</span><b className="tz-mono">{TERMS_VERSION}</b></div>
        <div className="tz-ticket-row"><span>{t('ap_when')}</span><b>{fmtDate(r.at, activeLang(), { dateStyle: 'long', timeStyle: 'short' })}</b></div>
        <div className="tz-ticket-row"><span>{t('ap_user_l')}</span><b className="tz-mono">{r.teenEmail}</b></div>
        {SELECTIONS.filter((s) => !s.required).map((s) => <div key={s.id} className="tz-ticket-row"><span>{CEN[`c_${s.id}_k`]}</span><b>{r.selections?.[s.id] ? t('ap_given') : t('ap_not_given')}</b></div>)}
      </div>
      <h2 className="tz-h3">{t('ap_next_h')}</h2>
      <ol className="tz-timeline">
        <li className="is-done"><b>{t('ap_n0')}</b></li>
        <li className="is-now"><b>{t('ap_n1', name)}</b></li>
        <li><b>{t('ap_n2')}</b></li>
        <li><b>{t('ap_n3')}</b></li>
      </ol>
      <p className="tz-small">{t('ap_change')}</p>
      <div className="tz-actions">{r.record ? <button type="button" className="tf-btn tf-btn-ghost" onClick={() => savePdf(r.record)}><Icon name="book" size={18} /> <span>{t('cs_print')}</span></button> : <button type="button" className="tf-btn tf-btn-ghost" onClick={() => window.print()}><Icon name="book" size={18} /> <span>{t('cs_print')}</span></button>}<Link className="tf-btn tf-btn-main" to="/"><Icon name="home" size={18} /> <span>{t('s4_home')}</span></Link></div>
    </div>
  );
}

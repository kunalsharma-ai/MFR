import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useI18n, useTr } from '../i18n/I18nProvider.jsx';
import { loadProfile, ProfileRun, LOCK, NO_TRANSLATE, filled, isOtherLabel, otherKey } from '../lib/profileEngine.js';
import { themeFor, themeVars } from '../themes/themes.js';
import { ui } from '../audio/sound.js';
import { burstFrom } from '../lib/fx.js';
import { submitProfile } from '../lib/api.js';
import EN from '../i18n/en.js';
import { useToast } from './Toasts.jsx';
import ThemeScene from './ThemeScene.jsx';
import MemberCard from './MemberCard.jsx';
import ProgressRing from './ProgressRing.jsx';
import Celebration from './Celebration.jsx';
import Flag from './Flag.jsx';
import { Tiles, Chips, RadioList, Combo, TextInput } from './controls/Controls.jsx';
import { PhoneInput, DobInput, EmailInput, guessCountry } from './controls/Special.jsx';
import VerifyCard from './Verify.jsx';
import { iconFor, questionIcon } from '../themes/optionIcons.js';
import { emojiUrl } from '../lib/assets.js';
import { CONFIG } from '../config.js';
import { isVerified } from '../lib/otp.js';
import { trackInput, markShown, markAnswered, deviceSignals, scoreTrust } from '../validation/risk.js';
import { consistencyFlags } from '../validation/consistency.js';
import { mergedAnswers } from '../validation/completeness.js';
import { store } from '../lib/storage.js';
import { IArrow, ICheck, IEdit, IGrid, ILock } from './Icons.jsx';

const isCountryList = (n, opts) => opts.length > 100 && opts.every((o) => /^[A-Z]{2}$/.test(o[1]));

function useSectionLabel(meta) {
  const { t } = useI18n();
  return (name) => {
    const k = 's.' + name;
    if (EN[k]) return t(k);
    return t('p.' + meta.s);
  };
}

/** One question: translated text, the best control for its option count, validation + nav. */
function QuestionCard({ run, n, dir, err, onOther, onAnswer, onPick, onToggle, onRaw, onNext, onBack, nextLabel, backLabel, showBack, secLabel, onDomain }) {
  const { t, lang } = useI18n();
  const raw = run.opts(n);
  const opts = raw || null;
  const loading = raw === undefined;
  const country = !!opts && isCountryList(n, opts);
  const translatable = !!opts && !NO_TRANSLATE.test(run.optKey(n)) && !country && opts.length <= 600;
  const [tr, pending] = useTr([run.text(n), ...(translatable ? opts.map((o) => o[0]) : [])]);
  const regionNames = useMemo(() => {
    try { return new Intl.DisplayNames([lang], { type: 'region' }); } catch { return null; }
  }, [lang]);
  const items = useMemo(() => {
    if (!opts) return [];
    return opts.map((o, i) => {
      let label = translatable ? tr[i + 1] || o[0] : o[0];
      let flag;
      if (country) {
        flag = o[1].toLowerCase();
        try { label = (lang !== 'en' && regionNames?.of(o[1])) || o[0]; } catch { /* keep */ }
      }
      return { label, value: o[1], flag, icon: !country && opts.length <= 30 ? iconFor(o[0], o[1]) : null };
    });
  }, [opts, tr, translatable, country, regionNames, lang]);
  const multi = !!opts && run.multi(n);
  const value = run.ans[n];
  const spec = !opts ? run.spec(n) : null;
  const nf = new Intl.NumberFormat(lang);
  const prog = run.progress();
  let control;
  if (loading) control = <div className="skeleton" />;
  else if (!opts && spec.kind === 'phone') control = <PhoneInput value={value} defaultCountry={guessCountry(run.ans)} onChange={(v) => onAnswer(n, v)} onEnter={onNext} autoFocus />;
  else if (!opts && spec.kind === 'dob') control = <DobInput value={value} onChange={(v) => onAnswer(n, v)} onEnter={onNext} autoFocus />;
  else if (!opts && spec.kind === 'email') control = <EmailInput value={value} onChange={(v) => onAnswer(n, v)} onEnter={onNext} onDomain={onDomain} placeholder={spec.ph} autoFocus />;
  else if (!opts) control = <TextInput spec={spec} value={value} long={spec.type === 'textarea'} onChange={(v) => onAnswer(n, v)} onEnter={onNext} placeholder={spec.ph || t('q.type')} autoFocus />;
  else if (multi) {
    control = items.length <= 6
      ? <Tiles items={items} value={value} multi onToggle={(v, e) => onToggle(n, v, e)} />
      : <Chips items={items} value={value} onToggle={(v, e) => onToggle(n, v, e)} filterPh={t('q.filter', { n: nf.format(items.length) })}
          selectedLabel={t('q.selected', { n: nf.format((value || []).length) })} noMatch={t('q.noMatch')}
          moreLabel={(a, b) => t('q.more', { n: nf.format(a), t: nf.format(b) })} />;
  } else if (items.length <= 6) control = <Tiles items={items} value={value} onToggle={(v, e) => onPick(n, v, e, true)} />;
  else if (items.length <= 30) control = <RadioList items={items} value={value} onPick={(v, e) => onPick(n, v, e, true)} filterPh={t('q.filter', { n: nf.format(items.length) })} noMatch={t('q.noMatch')} />;
  else control = <Combo key={n} items={items} value={value} raw={run.raw[n]} onPick={(v, e) => onPick(n, v, e, true)} onRaw={(v, commit) => onRaw(n, v, commit)}
      customLabel={/^(city|org-city)$/.test(n) ? (v) => t('city.custom', { v }) : null}
      placeholder={t('q.search')} noMatch={t('q.noMatch')} onEnter={onNext} moreLabel={(a, b) => t('q.more', { n: nf.format(a), t: nf.format(b) })} />;

  const hint = multi ? t('q.multi') : opts && items.length <= 6 && items.length > 1 ? t('q.keys') : spec?.kind === 'phone' ? t('phone.hint') : spec?.kind === 'dob' ? t('dob.label') : !opts ? t('q.enter') : '';
  return (
    <div className={`qcard ${dir > 0 ? 'in-next' : 'in-back'} ${err ? 'has-err' : ''}`}>
      <div className="q-top">
        <span className="q-sec">{secLabel}</span>
        <span className="q-pos">{t('q.pos', { i: nf.format(prog.pos), n: nf.format(prog.total) })}</span>
        {!run.required(n) && <span className="q-opt">{t('q.optional')}</span>}
      </div>
      <h2 className="q-title" id="q-title" aria-live="polite">
        <img className="q-emoji" src={emojiUrl(questionIcon(run.text(n), n, opts))} alt="" aria-hidden="true" width="44" height="44" decoding="async" />
        <span>{tr[0]}</span>
        {pending && <span className="q-tr" title={t('q.translating')}><span /><span /><span /></span>}
      </h2>
      {hint && <p className={`q-hint ${hint === t('q.keys') ? 'keys' : ''}`}>{hint}</p>}
      <div className="q-control" aria-labelledby="q-title">{control}</div>
      {!!opts && run.otherSelected(n) && (
        <div className="other-box">
          <label htmlFor="q-other">✍️ {t('q.otherSpecify')}</label>
          <input id="q-other" className="field" value={run.ans[otherKey(n)] || ''} maxLength={120} autoComplete="off" placeholder={t('q.otherPh')}
            ref={(el) => { if (el && !el.dataset.f) { el.dataset.f = 1; setTimeout(() => el.focus({ preventScroll: true }), 60); } }}
            onChange={(e) => onOther(n, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); onNext(); } }} />
        </div>
      )}
      <p className="q-err" role="alert">{err ? t(err.key, err.vars) : ''}</p>
      <div className="q-nav">
        <button type="button" className="btn btn-ghost" onClick={onBack} style={{ visibility: showBack ? 'visible' : 'hidden' }}>
          <IArrow back /> {backLabel}
        </button>
        <button type="button" className="btn" onClick={onNext}>{nextLabel} <IArrow /></button>
      </div>
    </div>
  );
}

function Review({ run, msg, onEdit, onEditAll, onHub, onNext, theme }) {
  const { t } = useI18n();
  const rows = run.flat.map(([n], i) => [n, i]).filter(([n]) => run.vis(n) && filled(run.ans[n]));
  const texts = rows.map(([n]) => run.text(n));
  const labels = rows.map(([n]) => (NO_TRANSLATE.test(run.optKey(n)) || !run.opts(n) ? '' : run.label(n, run.ans[n])));
  const [tr] = useTr([...texts, ...labels.filter(Boolean)]);
  let li = texts.length;
  return (
    <div className="review qcard in-next">
      <div className="rev-head">
        <span className="rev-badge" aria-hidden="true"><img src={emojiUrl('trophy')} alt="" width="64" height="64" /><span className="rev-tick"><ICheck /></span></span>
        <div>
          <p className="rev-kicker">🏆 {t('d.badge')}</p>
          <h2>{t('p.' + run.meta.s)}</h2>
          <p className="muted">{msg || t('d.sub')}</p>
        </div>
      </div>
      <div className="rev-cta">
        <button type="button" className="btn" onClick={onEditAll}><IEdit /> {t('d.editNow')}</button>
        <button type="button" className="btn btn-ghost" onClick={onNext}>{t('d.next')} <IArrow /></button>
      </div>
      <h3 className="rev-h">{t('d.answers')}</h3>
      <ul className="rev-list">
        {rows.map(([n, i], k) => {
          const lab = labels[k] ? tr[li++] : run.label(n, run.ans[n]);
          const cc = /country|nationality/.test(n) && /^[A-Z]{2}$/.test(String(run.ans[n])) ? String(run.ans[n]) : null;
          return (
            <li key={n} style={{ '--i': Math.min(k, 20) }}>
              <div>
                <small>{tr[k]}</small>
                <b>{cc && <Flag cc={cc.toLowerCase()} size={14} />} {lab}</b>
              </div>
              {LOCK.test(n) ? (
                <span className="lock"><ILock /> {t('d.locked')}</span>
              ) : (
                <button type="button" className="btn-link edit-one" onClick={() => onEdit(i)} aria-label={`${t('d.edit')}: ${tr[k]}`}><IEdit /> {t('d.edit')}</button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="muted small">{t('d.lockedNote')}</p>
      <div className="q-nav wrap">
        <button type="button" className="btn btn-ghost" onClick={onHub}><IGrid /> {t('d.hub')}</button>
        <button type="button" className="btn btn-ghost" onClick={onEditAll}><IEdit /> {t('d.editAll')}</button>
        <button type="button" className="btn" onClick={onNext}>{t('d.next')} <IArrow /></button>
      </div>
      <CopyJson run={run} />
    </div>
  );
}

function CopyJson({ run }) {
  const { t } = useI18n();
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className="btn-link small" onClick={async () => {
      try { await navigator.clipboard.writeText(JSON.stringify(run.payload(), null, 2)); setOk(true); setTimeout(() => setOk(false), 2000); } catch { /* clipboard blocked */ }
    }}>{ok ? t('d.copied') : t('d.copy')}</button>
  );
}

export default function Flow({ meta, dark, onHub, onNextProfile }) {
  const { t, lang } = useI18n();
  const toast = useToast();
  const th = useMemo(() => themeFor(meta.s), [meta.s]);
  const vars = useMemo(() => themeVars(th, dark), [th, dark]);
  const secLabel = useSectionLabel(meta);
  const [run, setRun] = useState(null);
  const [state, setState] = useState('loading'); // loading | q | verify | review | error
  const [, force] = useReducer((x) => x + 1, 0);
  const [dir, setDir] = useState(1);
  const [err, setErr] = useState(null);
  const [live, setLive] = useState(false);
  const [msg, setMsg] = useState('');
  const [party, setParty] = useState(false);
  const [verifyFor, setVerifyFor] = useState(null);
  const snap = useRef(null);
  const busy = useRef(false);
  const top = useRef(null);
  const domain = useRef({});
  const t0 = useRef(Date.now());
  const colors = [th.c[5], th.c[6], th.c[7], '#ffd27a', '#ffffff'];

  useEffect(() => { trackInput(); }, []);
  const boot = useCallback(async () => {
    setState('loading');
    try {
      const r = await loadProfile(meta);
      const saved = ProfileRun.saved(meta);
      if (saved) {
        r.ans = saved.a || {}; r.raw = saved.r || {}; r.flags = saved.f || {};
        await r.ensureAll();
        setRun(r); setState('review');
        return;
      }
      const d = ProfileRun.draft(meta);
      if (d) {
        r.ans = d.a || {}; r.raw = d.r || {}; r.hist = d.h || [];
        await r.ensureAll();
        r.i = d.i >= 0 && d.i < r.flat.length && r.allowed(d.i) ? d.i : await r.nextVisible(-1);
      } else r.i = await r.nextVisible(-1);
      setRun(r); setState(r.i < 0 ? 'review' : 'q');
    } catch (e) {
      console.error(e);
      setState('error');
    }
  }, [meta]);
  useEffect(() => { boot(); }, [boot]);
  // QA hook for the automated end-to-end walker (tests/e2e-walk.cjs): only with ?qa=1 in the URL
  useEffect(() => { if (run && typeof location !== 'undefined' && /[?&]qa=1/.test(location.search)) window.__mfrRun = run; }, [run]);
  useEffect(() => { if (run && state === 'q') markShown(run.cur()); }, [run, state, run?.i]); // eslint-disable-line

  const scrollTop = () => {
    const el = top.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const afterChange = (n) => {
    run.prune();
    run.flat.forEach(([m]) => { if (run.parent(m) === n) run.ensure(m).then(force); });
    if (live) setErr(run.check(n));
    run.saveDraft();
    force();
  };
  const onAnswer = (n, v) => { run.ans[n] = v; afterChange(n); };
  const onOther = (n, v) => { run.ans[otherKey(n)] = v; if (live) setErr(run.check(n)); run.saveDraft(); force(); };
  const onRaw = (n, v, commit) => {
    run.ans[n] = ''; run.raw[n] = v; afterChange(n);
    if (commit) setTimeout(() => next(), 250); // "my city isn't listed" -> validate + continue
  };
  const onToggle = (n, v, e) => {
    const cur = run.ans[n] || [];
    const on = cur.includes(v);
    // "None of these / not involved" is exclusive in multi-select questions
    const exclusive = (x) => /^(none|not involved|i am not involved|none of these|i don.?t)/i.test(String(run.label(n, x)));
    let nextVal = on ? cur.filter((x) => x !== v) : exclusive(v) ? [v] : [...cur.filter((x) => !exclusive(x)), v];
    run.ans[n] = nextVal;
    ui(on ? 'deselect' : 'select');
    if (!on) burstFrom(e, colors, 8);
    afterChange(n);
  };
  // Auto-advance: every single-answer question moves on by itself once a valid option is picked.
  const onPick = (n, v, e, auto) => {
    run.ans[n] = v; run.raw[n] = '';
    ui('select');
    burstFrom(e, colors, 12);
    afterChange(n);
    setErr(null);
    // "Other" never auto-advances: the respondent must specify it first
    if (auto && !run.otherSelected(n)) setTimeout(() => { if (run.cur() === n && run.ans[n] === v && !busy.current) next(); }, 420);
  };

  const buildPayload = async () => {
    const all = { ...mergedAnswers(meta.c), ...run.ans };
    const device = await deviceSignals();
    const consistency = consistencyFlags(all, { timezone: device.traits.tz });
    const flags = [...run.allFlags(), ...consistency];
    const verified = store.get('mfr:verified', {});
    const trust = scoreTrust({ flags, verified: { email: verified.email && verified.email === all.mail, phone: verified.phone && verified.phone === all.phone }, device, answeredCount: Object.keys(run.ans).length, durationMs: Date.now() - t0.current, residence: all['residence-country'] || all.country });
    return { ...run.payload(), lang, flags, verified, device, trust, durationMs: Date.now() - t0.current };
  };

  const complete = async () => {
    run.save();
    const payload = await buildPayload();
    submitProfile(payload);
    if (run.edit) {
      run.edit = false; run.one = false;
      setMsg(t('d.saved')); toast(t('d.saved'), 'ok', '✓');
      setState('review');
    } else {
      setMsg(t('d.submitted'));
      setState('review');
      setParty(true);
      ui('complete');
    }
    scrollTop();
  };
  // Members have already consented at sign-up: finishing saves straight away (no consent form, no CAPTCHA).
  // Trust signals are still computed silently and sent with the payload for back-office review.
  const finish = () => complete();

  async function next() {
    if (busy.current || !run || state !== 'q') return;
    const n = run.cur();
    let e = run.check(n);
    if (!e && run.spec && !run.opts(n) && run.spec(n).kind === 'email' && ['no-domain', 'no-mx'].includes(domain.current[run.ans[n]])) e = { key: 'e.emailDomain' };
    if (e) {
      setErr(e); setLive(true); ui('error');
      const c = document.querySelector('.qcard');
      c?.classList.remove('shake'); void c?.offsetWidth; c?.classList.add('shake');
      return;
    }
    busy.current = true;
    try {
      run.commit(n);
      markAnswered(n);
      setErr(null); setLive(false);
      // email / phone one-time-code verification right after the main contact question
      const kind = !run.opts(n) && run.spec(n).kind;
      if (!run.edit && ((n === 'mail' && CONFIG.verifyEmail && kind === 'email') || (n === 'phone' && CONFIG.verifyPhone && kind === 'phone')) && run.ans[n] && !isVerified(n === 'mail' ? 'email' : 'phone', run.ans[n]) && !run.skipVerify?.[n]) {
        setVerifyFor({ channel: n === 'mail' ? 'email' : 'phone', target: run.ans[n], n });
        setState('verify');
        return;
      }
      await advance();
    } finally {
      busy.current = false;
    }
  }
  async function advance() {
    if (run.one) {
      run.prune();
      await run.ensureAll();
      const j = run.flat.findIndex(([m]) => run.vis(m) && !LOCK.test(m) && run.check(m));
      if (j >= 0) { run.hist.push(run.i); run.i = j; setDir(1); setState('q'); force(); }
      else { run.prune(); await finish(); }
      return;
    }
    const prevSec = run.section(run.i);
    const j = await run.nextVisible(run.i);
    if (j < 0) { await finish(); return; }
    run.hist.push(run.i);
    if (run.section(j) !== prevSec) { ui('section'); toast(t('q.sectionDone'), 'ok', '🎉'); } else ui('next');
    run.i = j; setDir(1);
    run.saveDraft();
    setState('q');
    force();
    scrollTop();
  }
  const back = () => {
    if (!run.hist.length && run.edit) {
      const s = snap.current;
      run.ans = s.a; run.raw = s.r; run.edit = false; run.one = false;
      setErr(null); setState('review'); return;
    }
    if (!run.hist.length) return;
    run.i = run.hist.pop(); setDir(-1); setErr(null); setLive(false); ui('back'); force();
  };
  const editOne = (i) => {
    snap.current = { a: JSON.parse(JSON.stringify(run.ans)), r: JSON.parse(JSON.stringify(run.raw)) };
    run.edit = true; run.one = true; run.hist = []; run.i = i; setDir(1); setMsg(''); setState('q'); scrollTop();
  };
  const editAll = async () => {
    snap.current = { a: JSON.parse(JSON.stringify(run.ans)), r: JSON.parse(JSON.stringify(run.raw)) };
    run.edit = true; run.one = false; run.hist = [];
    run.i = await run.nextVisible(-1);
    if (run.i < 0) { run.edit = false; return; }
    setDir(1); setMsg(''); setState('q'); scrollTop();
  };

  // keyboard shortcuts: 1-9 picks a tile, Enter continues (when focus is not in a text field)
  useEffect(() => {
    if (state !== 'q') return;
    const h = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('.lp, .celebrate')) return;
      if (/^[1-9]$/.test(e.key)) {
        const tiles = document.querySelectorAll('.qcard .tile');
        const b = tiles[+e.key - 1];
        if (b) { e.preventDefault(); b.click(); }
      } else if (e.key === 'Enter' && ((tag !== 'BUTTON' && tag !== 'A') || e.target.closest('.q-control'))) {
        e.preventDefault(); next();
      }
    };
    addEventListener('keydown', h);
    return () => removeEventListener('keydown', h);
  });

  const prog = run && state === 'q' ? run.progress() : run ? { pct: 100, done: 1, total: 1 } : { pct: 0 };
  const sections = run ? run.sections() : [];
  const n = run && state === 'q' ? run.cur() : null;
  const nextLabel = run?.one ? t('q.save') : run && state === 'q' && run.i === run.visibleIdx().at(-1) ? (run.edit ? t('q.saveAll') : t('q.finish')) : t('q.next');
  const nf = new Intl.NumberFormat(lang);

  return (
    <div className={`flow w-${th.id} card-${th.card} ${th.dark ? 'is-dark' : ''}`} style={vars} ref={top}>
      <ThemeScene theme={th} />
      <div className="flow-in">
        <aside className="panel" aria-label={t('p.' + meta.s)}>
          <button type="button" className="btn-link panel-back" onClick={onHub}><IArrow back /> {t('q.profiles')}</button>
          <h1 className="panel-name">{t('p.' + meta.s)}</h1>
          <MemberCard theme={th} variant="panel" name={t('p.' + meta.s)} done={state === 'review'}>
            <span className="mc-bar"><i style={{ transform: `scaleX(${prog.pct / 100})` }} /></span>
          </MemberCard>
          <div className="panel-prog">
            <ProgressRing pct={prog.pct} size={58} stroke={6} label={`${prog.pct}%`}><b>{nf.format(prog.pct)}%</b></ProgressRing>
            <div className="panel-bar">
              <b>{t('hub.progress', { p: nf.format(prog.pct) })}</b>
              <small>{state === 'q' ? t('q.left', { n: nf.format(Math.max(0, prog.total - prog.done)) }) : t('hub.done')}</small>
            </div>
          </div>
          {sections.length > 1 && (
            <ol className="panel-secs" aria-label={t('q.sections')}>
              {sections.map((s) => (
                <li key={s.name} className={`${s.done === s.total ? 'done' : ''} ${n && run.section(run.i) === s.name ? 'cur' : ''}`}>
                  <span className="sec-dot" aria-hidden="true">{s.done === s.total ? <ICheck /> : null}</span>
                  <span>{secLabel(s.name)}</span>
                  <small>{nf.format(s.done)}/{nf.format(s.total)}</small>
                </li>
              ))}
            </ol>
          )}
        </aside>
        <main className="stage" id="main">
          {state === 'loading' && (
            <div className="qcard in-next" aria-busy="true">
              <span className="sk sk-chip" /><span className="sk sk-h" /><span className="sk sk-h short" />
              <div className="sk-tiles"><span className="sk" /><span className="sk" /><span className="sk" /><span className="sk" /></div>
              <p className="sr-only">{t('q.loading')}</p>
            </div>
          )}
          {state === 'error' && (
            <div className="qcard"><h2>{t('err.title')}</h2><p className="muted">{t('err.sub')}</p>
              <button type="button" className="btn" onClick={boot}>{t('err.retry')}</button></div>
          )}
          {state === 'q' && n && (
            <QuestionCard key={n + ':' + run.i} run={run} n={n} dir={dir} err={err} onAnswer={onAnswer} onOther={onOther} onPick={onPick} onToggle={onToggle} onRaw={onRaw}
              onNext={next} onBack={back} nextLabel={nextLabel} onDomain={(st) => { domain.current[run.ans[n]] = st; }}
              backLabel={!run.hist.length && run.edit ? t('q.cancel') : t('q.back')} showBack={run.hist.length > 0 || run.edit}
              secLabel={secLabel(run.section(run.i))} />
          )}
          {state === 'verify' && verifyFor && (
            <VerifyCard key={verifyFor.target} channel={verifyFor.channel} target={verifyFor.target}
              onDone={() => { setVerifyFor(null); advance(); }}
              onSkip={() => { run.skipVerify = { ...run.skipVerify, [verifyFor.n]: true }; setVerifyFor(null); advance(); }} />
          )}
          {state === 'review' && run && (
            <Review run={run} msg={msg} theme={th} onEdit={editOne} onEditAll={editAll} onHub={onHub} onNext={onNextProfile} />
          )}
        </main>
      </div>
      {party && (
        <Celebration meta={meta} theme={th} name={t('p.' + meta.s)} icon={th.icon} colors={colors}
          onClose={() => setParty(false)} onEdit={() => { setParty(false); editAll(); }}
          onNext={() => { setParty(false); onNextProfile(); }} onHub={() => { setParty(false); onHub(); }} />
      )}
    </div>
  );
}

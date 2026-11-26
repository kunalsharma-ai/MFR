// MyFrequentRewards — Teen (13–17) research terms & parental consent. Shown after login, minors only.
//
// The whole agreement is three cards and four taps:
//   A  the terms, as six plain-language topics (full legal text one tap away in the reader) → one tap to agree
//   B  the parent's or guardian's permission → three separate taps (nothing to type: their details are already
//      on file from registration, so the page only shows where the confirmation goes)
//   C  the teen's own yes or no → one tap ("no" stops everything and stores no guardian data)
// Then one button sends it. Every click has a sound; sending sets off the celebration (confetti + fanfare) and
// the record can be saved as a PDF. The account itself is unlocked by the server, never by the browser.
//
// MyFrequentRewards site (Nov 2026): used as the consent step of the guardian's secure-link page (/teen/parent).
// Three small additions, all optional config, the design and the text unchanged:
//   cfg.submit(record)   sends through the site's Teen API instead of fetch(submitUrl)
//   cfg.handOff(record)  after the celebration, the guardian page shows its own "approved" screen
//   cfg.assentGiven      the teen already said yes at sign-up: Part C shows that yes, locked
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from './components/Icons.jsx';
import Lock3D from './components/Lock3D.jsx';
import { Dial, VaultSky } from './components/Vault.jsx';
import TermsCard from './components/TermsCard.jsx';
import ConsentCard from './components/ConsentCard.jsx';
import TeenAssent from './components/TeenAssent.jsx';
import Reader from './components/Reader.jsx';
import Celebrate from './components/Celebrate.jsx';
import LanguagePicker from './components/LanguagePicker.jsx';
import { DeclineDialog, Done, Notice, SendDock } from './components/Finish.jsx';
import { CHAPTERS, CONSENTS } from './content/terms.js';
import { ageBandOf } from './config.js';
import { guardianOnFile } from './guardian.js';
import { useI18n } from './i18n/I18n.jsx';
import { isSoundEnabled, setSoundEnabled } from './i18n/soundPrefs.js';
import { play, recentlyPlayed } from './sound.js';
import { downloadAgreementPdf } from './pdf.js';
import { asset } from './assets.js';

const THEME_KEY = 'mfr.minor.theme';
const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};
export function initialTheme(cfg, lang) {
  const saved = ls.get(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  if (cfg.theme === 'light' || cfg.theme === 'dark') return cfg.theme;
  return lang === 'en' ? 'light' : 'dark';
}
const rid = (n = 8) => (typeof crypto !== 'undefined' && crypto.getRandomValues
  ? Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => (b % 36).toString(36)).join('')
  : Math.random().toString(36).slice(2, 2 + n)).toUpperCase();
const ymd = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');
const fmtDate = (iso, lang) => { try { return new Date(`${iso}T00:00:00`).toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' }); } catch { return iso; } };
const reduced = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// the dial around the lock: one notch per step of the agreement
const DIAL = [
  { n: 'terms', hue: '#2f6bff' },
  { n: 'participation', hue: '#ff8a00' },
  { n: 'privacy', hue: '#8b5cf6' },
  { n: 'contact', hue: '#14c9b5' },
  { n: 'teen', hue: '#ff5e7e' },
];

export default function App({ cfg }) {
  const { t, lang, meta, mtBusy } = useI18n();
  const band = ageBandOf(cfg);
  const eligible = band !== 'adult' && band !== 'under';
  const guardian = useMemo(() => guardianOnFile(cfg), [cfg]);
  const [mounted, setMounted] = useState(false);
  // The first screen (intro + the terms card) is prerendered and hydrated on its own; the permission card, the
  // teen's card and the send panel mount in a short follow-up task, so no single task blocks the page for long.
  const [full, setFull] = useState(false);
  useEffect(() => {
    if (full) return undefined;
    // Timer only: requestAnimationFrame never fires in background tabs, in-app viewers and some preview panes,
    // which used to leave the parent card, the teen's card and the send panel unmounted for ever.
    const t = setTimeout(() => startTransition(() => setFull(true)), 30);
    return () => clearTimeout(t);
  }, [full]);
  const [theme, setTheme] = useState(() => (typeof window === 'undefined' || cfg.hydrating ? 'light' : initialTheme(cfg, lang)));
  const [themeChosen, setThemeChosen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [consents, setConsents] = useState(() => Object.fromEntries(CONSENTS.map((c) => [c.id, false]))); // all untapped
  const [assent, setAssent] = useState(cfg.assentGiven ? 'yes' : null); // null | 'yes' | 'no'
  const [showErr, setShowErr] = useState(false);
  const [phase, setPhase] = useState('form'); // form | saving | sent | active | declined
  const [error, setError] = useState(false);
  const [record, setRecord] = useState(null);
  const [picker, setPicker] = useState(false);
  const [decline, setDecline] = useState(false);
  const [reader, setReader] = useState({ open: false, focus: null });
  const [party, setParty] = useState(false);
  const [sound, setSound] = useState(true);
  const [activeNav, setActiveNav] = useState('partA');
  const opened = useRef(new Date().toISOString());
  const stamps = useRef({});
  const topics = useRef(new Set());
  const rootRef = useRef(null);
  const storeKey = `mfr.minor.${cfg.termsVersion}`;

  useEffect(() => {
    setMounted(true);
    setSound(isSoundEnabled());
    setThemeChosen(Boolean(ls.get(THEME_KEY)));
    if (cfg.hydrating) setTheme(initialTheme(cfg, lang));
    // if the page was reloaded during this visit, bring the taps back
    try {
      const saved = JSON.parse(sessionStorage.getItem(storeKey) || 'null');
      if (saved && typeof saved === 'object') {
        if (saved.accepted) setAccepted(true);
        if (saved.consents && typeof saved.consents === 'object') setConsents((x) => ({ ...x, ...saved.consents }));
        if (!cfg.assentGiven && (saved.assent === 'yes' || saved.assent === 'no')) setAssent(saved.assent);
      }
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (mounted && !themeChosen) setTheme(initialTheme(cfg, lang)); }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!cfg.standalone || !mounted) return;
    document.documentElement.dataset.theme = theme === 'dark' ? 'classic' : 'light';
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', theme === 'dark' ? '#070d2b' : '#ffffff');
  }, [theme, mounted, cfg.standalone]);
  // the page is short, so nothing but the taps is remembered for this visit
  useEffect(() => {
    if (!mounted) return;
    try { sessionStorage.setItem(storeKey, JSON.stringify({ accepted, consents, assent })); } catch { /* ignore */ }
  }, [accepted, consents, assent, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    play(next);
    setTheme(next);
    setThemeChosen(true);
    ls.set(THEME_KEY, next);
  };
  const toggleSound = () => {
    const next = !sound;
    setSoundEnabled(next);
    setSound(next);
    if (next) play('on');
  };

  // rail highlight + entrance (transform/opacity only, no layout reads)
  useEffect(() => {
    if (!eligible || typeof IntersectionObserver === 'undefined' || !rootRef.current) return undefined;
    const root = rootRef.current;
    const nav = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) setActiveNav(vis.target.dataset.nav);
    }, { rootMargin: '-25% 0px -55% 0px' });
    root.querySelectorAll('[data-nav]').forEach((el) => nav.observe(el));
    let rise = null;
    if (!reduced()) {
      let first = true;
      rise = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) { e.target.dataset.in = '1'; rise.unobserve(e.target); }
        if (first) { first = false; root.dataset.rise = '1'; }
      }, { rootMargin: '0px 0px -6% 0px' });
      root.querySelectorAll('.card, .dock').forEach((el) => { if (el.dataset.in !== '1') rise.observe(el); });
    }
    // Failsafe: if the observer never reports (hidden tab, in-app viewer, preview pane), show everything anyway.
    const safety = setTimeout(() => { root.dataset.rise = '1'; root.querySelectorAll('.card, .dock').forEach((el) => { el.dataset.in = '1'; }); }, 1800);
    return () => { clearTimeout(safety); nav.disconnect(); if (rise) rise.disconnect(); };
  }, [eligible, mounted, full]);

  const required = CONSENTS.filter((c) => c.required);
  const requiredOk = required.every((c) => consents[c.id]);
  const checks = { terms: accepted, required: requiredOk, teen: assent === 'yes' };
  const doneCount = [checks.terms, ...required.map((c) => Boolean(consents[c.id])), checks.teen].filter(Boolean).length;
  const locked = phase !== 'form';
  const dialDone = useMemo(() => {
    const s = new Set();
    if (accepted) s.add('terms');
    required.forEach((c) => { if (consents[c.id]) s.add(c.id); });
    if (assent === 'yes') s.add('teen');
    return s;
  }, [accepted, consents, assent]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (requiredOk && !stamps.current.guardianAt) stamps.current.guardianAt = new Date().toISOString(); if (!requiredOk) stamps.current.guardianAt = null; }, [requiredOk]);
  useEffect(() => { stamps.current.teenAssentAt = assent ? new Date().toISOString() : null; }, [assent]);
  useEffect(() => { stamps.current.termsAt = accepted ? new Date().toISOString() : null; }, [accepted]);
  const prevParent = useRef(false);
  useEffect(() => { if (mounted && requiredOk && !prevParent.current) play('key'); prevParent.current = requiredOk; }, [requiredOk, mounted]);
  const setConsent = useCallback((id, v) => setConsents((x) => ({ ...x, [id]: v })), []);
  const setAssentKey = useCallback((v) => { setAssent(v); if (v === 'yes') setTimeout(() => play('key'), 260); }, []);
  const openReader = useCallback((focus) => {
    if (focus && CHAPTERS.some((c) => c.id === focus)) topics.current.add(focus);
    setReader({ open: true, focus: focus || null });
  }, []);

  const goto = (id) => {
    const el = rootRef.current && rootRef.current.querySelector(`#${id}`);
    if (!el) return;
    const bar = rootRef.current.querySelector('.top');
    const off = (bar ? bar.offsetHeight : 0) + 14;
    const y = el.getBoundingClientRect().top + window.scrollY - off;
    window.scrollTo({ top: Math.max(0, y), behavior: reduced() ? 'auto' : 'smooth' });
  };

  const baseRecord = () => ({
    recordType: 'minor-participation-consent',
    consentId: `MFR-MC-${ymd()}-${rid(8)}`,
    auditRef: `AUD-${rid(12)}`,
    participantId: cfg.member.id || null,
    ageBand: band || 'unverified',
    country: guardian.country || cfg.member.country || null,
    policyVersion: cfg.termsVersion,
    privacyNoticeVersion: cfg.privacyNoticeVersion,
    assentVersion: cfg.assentVersion,
    effectiveDate: cfg.effectiveDate,
    language: lang,
    timezone: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ''; } })(),
    withdrawal: null,
    accountActivationStatus: 'blocked',
    pageUrl: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  });

  const post = async (rec) => {
    if (typeof cfg.submit === 'function') return (await cfg.submit(rec)) || {};
    if (!cfg.submitUrl || cfg.demo) return {};
    const r = await fetch(cfg.submitUrl, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(cfg.headers || {}) },
      body: JSON.stringify(rec),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json().catch(() => ({}));
  };

  const send = async () => {
    if (phase === 'saving') return;
    if (!(checks.terms && checks.required && checks.teen)) {
      setShowErr(true);
      play('warn');
      goto(!checks.terms ? 'partA' : !checks.required ? 'partB' : 'partC');
      return;
    }
    setError(false);
    setPhase('saving');
    play('send');
    const at = new Date().toISOString();
    const shown = CONSENTS.filter((c) => c.required || (cfg.optionalConsents || []).includes(c.id));
    const rec = {
      ...baseRecord(),
      termsAccepted: true,
      termsTopics: CHAPTERS.map((c) => c.id),
      topicsOpened: [...topics.current],
      // the guardian's own details are not sent from the browser: the backend uses the record it already holds
      guardian: { onFile: true, contactType: guardian.contactType, country: guardian.country || null },
      consents: Object.fromEntries(shown.map((c) => [c.id, Boolean(consents[c.id])])),
      optionalOffered: shown.filter((c) => !c.required).map((c) => c.id),
      declarationVersion: cfg.termsVersion,
      guardianPermissionStatus: 'pending',
      verification: { method: guardian.contactType === 'phone' ? 'sms-code' : 'email-link', status: guardian.verified ? 'previously-verified-contact' : 'pending' },
      teenAssent: { status: 'agreed', version: cfg.assentVersion, at: stamps.current.teenAssentAt || at },
      studyPermissions: { recording: Boolean(consents.recording), sensitive: Boolean(consents.sensitive), note: 'interest only — every study asks again before it starts' },
      timestamps: { pageOpenedAt: opened.current, termsAcceptedAt: stamps.current.termsAt || at, guardianPermissionAt: stamps.current.guardianAt || at, teenAssentAt: stamps.current.teenAssentAt || at, submittedAt: at },
    };
    const started = Date.now();
    try {
      const data = await post(rec);
      if (data && data.consentId) rec.consentId = data.consentId;
      await new Promise((res) => setTimeout(res, Math.max(0, 900 - (Date.now() - started))));
      setRecord(rec);
      try { window.dispatchEvent(new CustomEvent('mfr:minor-consent', { detail: rec })); } catch { /* ignore */ }
      if (typeof cfg.onSubmit === 'function') cfg.onSubmit(rec);
      celebrate();
      if (typeof cfg.handOff === 'function') { setTimeout(() => cfg.handOff(rec, data), reduced() ? 300 : 2200); return; }
      if (data && data.accountActivationStatus === 'active') activate(rec);
      else setPhase('sent');
    } catch {
      setPhase('form');
      setError(true);
      play('warn');
    }
  };

  const celebrate = () => {
    play('party');
    setParty(false);
    requestAnimationFrame(() => setParty(true));
  };

  const saveNo = async () => {
    if (phase === 'saving') return;
    setPhase('saving');
    const at = new Date().toISOString();
    // data minimisation: a "no" stores no guardian details and no permissions
    const rec = {
      ...baseRecord(),
      termsAccepted: accepted,
      consents: {},
      guardianPermissionStatus: 'not-requested',
      teenAssent: { status: 'declined', version: cfg.assentVersion, at: stamps.current.teenAssentAt || at },
      timestamps: { pageOpenedAt: opened.current, teenAssentAt: stamps.current.teenAssentAt || at, submittedAt: at },
    };
    try {
      const data = await post(rec);
      if (data && data.consentId) rec.consentId = data.consentId;
      setRecord(rec);
      setPhase('declined');
      play('no');
      if (typeof cfg.onDecline === 'function') cfg.onDecline('teen-declined');
      try { window.dispatchEvent(new CustomEvent('mfr:minor-declined', { detail: rec })); } catch { /* ignore */ }
    } catch {
      setPhase('form');
      setError(true);
      play('warn');
    }
  };

  const activate = (rec) => {
    setRecord((r) => ({ ...(r || rec), guardianPermissionStatus: 'verified', accountActivationStatus: 'active' }));
    setPhase('active');
    play('unlock');
    setTimeout(celebrate, 420);
    try { window.dispatchEvent(new CustomEvent('mfr:minor-activated', { detail: { consentId: (rec || record || {}).consentId } })); } catch { /* ignore */ }
    if (typeof cfg.onActivated === 'function') cfg.onActivated({ consentId: (rec || record || {}).consentId });
  };

  // waiting for the guardian's verification: ask the status endpoint now and then (issue #84: not a fixed fast loop).
  // The gap starts at pollMs (6 s) and doubles up to 60 s, nothing is asked while the tab is hidden, and coming back
  // to the tab asks once straight away and starts the short gap again. It stops after 30 minutes; a tab return
  // still checks once after that.
  useEffect(() => {
    if (phase !== 'sent' || !record || cfg.demo || !cfg.statusUrl) return undefined;
    let stop = false;
    let timer;
    const first = Math.max(2000, cfg.pollMs || 6000);
    let gap = first;
    const until = Date.now() + 30 * 60 * 1000;
    const check = async () => {
      try {
        const r = await fetch(`${cfg.statusUrl}${cfg.statusUrl.includes('?') ? '&' : '?'}consentId=${encodeURIComponent(record.consentId)}`, { credentials: 'include', headers: { Accept: 'application/json', ...(cfg.headers || {}) } });
        if (!r.ok) return false;
        const d = await r.json();
        if (!stop && d && d.accountActivationStatus === 'active') { activate(record); return true; }
      } catch { /* try again */ }
      return false;
    };
    const next = () => {
      clearTimeout(timer);
      if (stop || Date.now() > until) return;
      timer = setTimeout(async () => {
        if (document.hidden) return; // asked again when the tab comes back
        if (await check()) return;
        gap = Math.min(gap * 2, 60000);
        next();
      }, gap);
    };
    const onVis = async () => {
      if (document.hidden || stop) return;
      if (await check()) return;
      gap = first;
      next();
    };
    next();
    document.addEventListener('visibilitychange', onVis);
    return () => { stop = true; clearTimeout(timer); document.removeEventListener('visibilitychange', onVis); };
  }, [phase, record]); // eslint-disable-line react-hooks/exhaustive-deps

  const resend = async () => {
    play('send');
    if (!cfg.demo && cfg.submitUrl && record) {
      try {
        await fetch(`${cfg.submitUrl.replace(/\/$/, '')}/resend`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', ...(cfg.headers || {}) }, body: JSON.stringify({ consentId: record.consentId }) });
      } catch { /* shown as sent; the backend rate-limits */ }
    }
  };

  const savePdf = () => {
    try {
      downloadAgreementPdf({ cfg, record, langName: (meta && meta.name) || 'English' });
    } catch { /* a browser that blocks the download: the Print button still works */ }
  };

  // every click has a sound: specific actions play their own; anything else gets the soft paper tap
  const pendingTap = useRef(0);
  const onRootClick = (e) => {
    const el = e.target.closest && e.target.closest('button, a, label, select, input, [role="button"]');
    if (el) {
      if (el.matches('a[data-go]')) { e.preventDefault(); goto(el.dataset.go); }
      if (!pendingTap.current) pendingTap.current = setTimeout(() => { pendingTap.current = 0; if (!recentlyPlayed(90)) play('tap'); }, 0);
    }
  };

  const name = mounted && cfg.member.firstName ? cfg.member.firstName : '';
  const parentKey = phase === 'active' ? 'turned' : phase === 'sent' ? 'verifying' : requiredOk ? 'ready' : 'wait';
  const teenKey = assent === 'yes' ? 'turned' : assent === 'no' ? 'no' : 'wait';
  const stations = [
    { id: 'partA', icon: 'book', label: t('j_read'), done: accepted },
    { id: 'partB', icon: 'family', label: t('j_parent'), done: requiredOk },
    { id: 'partC', icon: 'hand', label: t('j_teen'), done: assent === 'yes', no: assent === 'no' },
    { id: 'send', icon: 'lock', label: t('j_send'), done: phase === 'sent' || phase === 'active' },
  ];
  const progress = doneCount / 5;

  return (
    <div
      ref={rootRef}
      className={`mt ${phase === 'saving' ? 'is-sending' : ''} ${reader.open ? 'is-reading' : ''}`}
      data-theme={theme === 'dark' ? 'classic' : 'light'}
      lang={lang}
      dir={meta.dir === 'rtl' ? 'rtl' : 'ltr'}
      style={{ '--lg1': meta.grade[0], '--lg2': meta.grade[1], '--lg3': meta.grade[2] }}
      onClick={onRootClick}
    >
      <div className="mt-paper" aria-hidden="true" />
      <VaultSky />
      {eligible ? <a className="skip" href="#partA" data-go="partA">{t('skip')}</a> : null}

      <header className="top">
        <div className="top-in">
          <span className="logo">
            <img src={asset('brand/myfrequentrewards-logo.webp')} alt="MyFrequentRewards logo" width="168" height="41" fetchPriority="high" />
          </span>
          <span className="top-doc">
            <span className="age-pill">{t('ages')}</span>
            <span className="top-doc-t">{t('agreement')} · <span className="mono">{t('version', cfg.termsVersion)}</span></span>
          </span>
          <span className="top-gap" />
          <button type="button" className="lang-btn" onClick={() => { play('unfold'); setPicker(true); }} aria-haspopup="dialog" aria-label={`${t('language')}: ${meta.native}`}>
            <span className="lang-orb" aria-hidden="true">{meta.glyph}</span>
            <span className="lang-name">{meta.native}</span>
            {mtBusy ? <span className="spin sm" aria-hidden="true" /> : <Icon name="chevron" size={16} decorative />}
          </button>
          <button type="button" className={`theme-sw ${theme}`} onClick={toggleTheme} aria-label={theme === 'dark' ? t('theme_light') : t('theme_dark')} title={theme === 'dark' ? t('theme_light') : t('theme_dark')} aria-pressed={theme === 'dark'}>
            <span className="theme-knob"><Icon name={theme === 'dark' ? 'moon' : 'sun'} size={15} decorative /></span>
          </button>
          <button type="button" className="icon-btn" onClick={toggleSound} aria-pressed={sound} aria-label={sound ? t('sound_on') : t('sound_off')} title={sound ? t('sound_on') : t('sound_off')}>
            <Icon name={sound ? 'volume' : 'mute'} size={20} decorative />
          </button>
        </div>
        {eligible ? (
          <nav className="trip" aria-label={t('progress')}>
            <span className="trip-line" aria-hidden="true"><i style={{ transform: `scaleX(${progress})` }} /></span>
            {stations.map((s) => (
              <a key={s.id} href={`#${s.id}`} data-go={s.id} className={`st ${s.done ? 'done' : ''} ${s.no ? 'no' : ''} ${activeNav === s.id ? 'here' : ''}`} aria-current={activeNav === s.id ? 'step' : undefined}>
                <span className="st-dot" aria-hidden="true">{s.done ? <Icon name="check" size={14} decorative /> : <Icon name={s.icon} size={14} decorative />}</span>
                <span className="st-l">{s.label}</span>
              </a>
            ))}
          </nav>
        ) : null}
      </header>

      <main id="main">
        {!eligible ? <Notice kind={band} cfg={cfg} /> : (<>
          <section className="intro">
            <div className="intro-card">
              <div className="intro-txt">
                <p className="hello"><Icon name="wave" size={20} decorative />{name ? t('hello', name) : t('hello_anon')}</p>
                <h1>{t('h1')}</h1>
                <p className="lead">{t('lead')}</p>
                <ol className="roles">
                  <li className="r1"><span className="r-n">A</span><b>{t('role1_h')}</b></li>
                  <li className="r2"><span className="r-n">B</span><b>{t('role2_h')}</b></li>
                  <li className="r3"><span className="r-n">C</span><b>{t('role3_h')}</b></li>
                </ol>
                <p className="meta-line"><Icon name="clock" size={16} decorative />{t('mins')}<span className="dot" aria-hidden="true">•</span>{t('effective', fmtDate(cfg.effectiveDate, lang))}</p>
              </div>
              <div className="intro-art">
                <div className="vault">
                  <Dial sections={DIAL} read={dialDone} />
                  <span className="vault-glow" aria-hidden="true" />
                  <span className="orbit" aria-hidden="true"><i /><i /><i /></span>
                  <Lock3D parent={parentKey} teen={teenKey} open={phase === 'active'} />
                </div>
                <p className="lk-cap"><Icon name="lock" size={14} decorative />{t('lock_title')} · {phase === 'active' ? t('lock_open') : t('lock_locked')}</p>
              </div>
            </div>
          </section>

          <div className="flow">
            <TermsCard accepted={accepted} onAccept={setAccepted} onRead={openReader} showErr={showErr} locked={locked} />
            {full ? (<>
            <ConsentCard cfg={cfg} g={guardian} consents={consents} setConsent={setConsent} showErr={showErr} locked={locked} onRead={openReader} />
            <TeenAssent name={name} assent={assent} setAssent={setAssentKey} locked={locked || Boolean(cfg.assentGiven)} onSaveNo={saveNo} busy={phase === 'saving'} showErr={showErr} onRead={openReader} />

            {assent === 'no' ? null : <SendDock parentKey={parentKey} teenKey={teenKey} checks={checks} count={t('done_count', doneCount, 5)} onSend={send} onNotNow={() => { play('unfold'); setDecline(true); }} status={phase} error={error} />}
            <p className="part-e"><Icon name="server" size={16} decorative />{t('partE_note', cfg.termsVersion)}</p>

            <footer className="foot">
              <p>{t('footer_q').split('{0}').reduce((acc, part, i) => (i ? [...acc, <a key={i} href={`mailto:${cfg.supportEmail}`}>{cfg.supportEmail}</a>, part] : [part]), [])}</p>
              <p className="foot-links">
                <button type="button" className="linkish" onClick={() => { play('unfold'); openReader(null); }}><Icon name="book" size={16} decorative />{t('full_agreement')}</button>
                <button type="button" className="linkish" onClick={savePdf}><Icon name="download" size={16} decorative />{t('download_pdf')}</button>
                <a href={cfg.privacyPolicyUrl} target="_blank" rel="noopener noreferrer">{t('privacy_policy')}</a>
              </p>
              <p className="foot-op">{cfg.operator} · {cfg.address}</p>
            </footer>
            </>) : <div className="flow-wait" aria-hidden="true" />}
          </div>
        </>)}
      </main>

      <div className="fly" aria-hidden="true"><Icon name="key" size={46} decorative /></div>

      <Celebrate run={party} onDone={() => setParty(false)} />
      <LanguagePicker open={picker} onClose={() => setPicker(false)} />
      <Reader open={reader.open} focus={reader.focus} cfg={cfg} onClose={() => setReader({ open: false, focus: null })} onPdf={savePdf} />
      <DeclineDialog
        open={decline}
        onBack={() => setDecline(false)}
        onLogout={() => {
          try { window.dispatchEvent(new CustomEvent('mfr:minor-declined', { detail: { reason: 'not-now' } })); } catch { /* ignore */ }
          if (typeof cfg.onDecline === 'function') cfg.onDecline('not-now');
          else if (cfg.logoutUrl) window.location.assign(cfg.logoutUrl);
          setDecline(false);
        }}
      />
      {record && (phase === 'sent' || phase === 'active' || phase === 'declined') ? (
        <Done
          record={record}
          phase={phase}
          guardian={guardian}
          demo={cfg.demo}
          onPdf={savePdf}
          hasContinue={Boolean(cfg.continueUrl)}
          onContinue={() => window.location.assign(cfg.continueUrl)}
          onResend={resend}
          onDemoVerify={() => activate(record)}
          onLeave={() => { if (cfg.logoutUrl) window.location.assign(cfg.logoutUrl); }}
        />
      ) : null}
    </div>
  );
}

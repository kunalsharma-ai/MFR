// Language state for the whole site: which language is active, the theme, the picker, the sounds.
//
// Order of choice on page load (client only — prerendered HTML is always English, so hydration is safe):
//   1. ?lang=zh-CN in the URL (campaign links, e.g. https://www.myfrequentrewards.com/?lang=zh-CN for China)
//   2. the visitor's saved choice (localStorage "mfr.lang"; the v2.x Google-Translate choice is migrated once)
//   3. nothing saved and the browser speaks a supported non-English language → the picker opens once,
//      with that language suggested at the top (visitors always choose; we never switch silently).
//
// Themes (v3.0):  English → "light"  (white theme with the Turn2Opinion colour grading)
//                 every other language → "classic"  (the MyFrequentRewards look, unchanged)
// index.html sets the theme before the first paint (inline script), so returning visitors never see a flash.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BY_CODE, DEFAULT_LANG, LANGUAGES, matchLocale, resolveLang, themeFor } from './languages.js';
// The translation engine is only downloaded when a language other than English is in use.
let enginePromise = null;
const engine = () => (enginePromise ||= import('./engine.js'));
const setPageLanguage = (code, opts) => (code === DEFAULT_LANG && !enginePromise ? Promise.resolve() : engine().then((m) => m.setPageLanguage(code, opts)));
const retryWithGesture = () => engine().then((m) => m.retryWithGesture());
import { isSoundEnabled, setSoundEnabled } from './soundPrefs.js';
import { skipWelcome } from '../utils/sound.js';

const loadSounds = () => import('./sounds.js');
/** Play a language's signature sound (the synthesiser chunk is fetched on first use). */
function playLanguageSound(code) {
  if (!isSoundEnabled()) return;
  loadSounds().then((m) => m.playLanguageSound(code)).catch(() => {});
}
function track(event, params) {
  try {
    (window.dataLayer = window.dataLayer || []).push({ event, ...params });
  } catch {
    /* analytics optional */
  }
}

const KEY = 'mfr.lang';
const SEEN = 'mfr.lang.seen';
let statusBound = false;
const I18nContext = createContext({ lang: DEFAULT_LANG, meta: BY_CODE[DEFAULT_LANG], setLang: () => {}, openPicker: () => {}, picker: false, sound: true, status: {} });

const store = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* blocked storage: the choice lasts for this visit */
    }
  },
};

/** v2.x used Google's website translator (cookie "googtrans" + localStorage "mfr_lang"). Migrate once, then clear. */
function migrateLegacy() {
  let legacy = null;
  try {
    legacy = localStorage.getItem('mfr_lang');
    if (legacy) localStorage.removeItem('mfr_lang');
  } catch {
    /* ignore */
  }
  try {
    if (/(?:^|;\s*)googtrans=/.test(document.cookie)) {
      const host = window.location.hostname;
      const parts = host.split('.');
      ['', host, parts.length > 1 ? `.${parts.slice(-2).join('.')}` : ''].forEach((d) => {
        document.cookie = `googtrans=; path=/${d ? `; domain=${d}` : ''}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      });
    }
  } catch {
    /* ignore */
  }
  const map = { iw: 'he', tl: 'fil', no: 'nb' };
  return legacy ? resolveLang(map[legacy] || legacy) : null;
}

/** Paint the site's theme for a language (CSS variables; the picker and the colour wave use the grade). */
export function applyGrade(meta) {
  const [a, b, c] = meta.grade;
  const root = document.documentElement;
  root.dataset.theme = themeFor(meta.code);
  const s = root.style;
  s.setProperty('--lg1', a);
  s.setProperty('--lg2', b);
  s.setProperty('--lg3', c);
  window.dispatchEvent(new CustomEvent('mfr:grade', { detail: meta.grade }));
}

/** A ripple of the language's colours that washes over the screen from the click point. */
function gradeWave(meta, origin) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const el = document.createElement('div');
  el.className = 'grade-wave';
  el.setAttribute('aria-hidden', 'true');
  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? 80;
  el.style.setProperty('--x', `${x}px`);
  el.style.setProperty('--y', `${y}px`);
  el.style.setProperty('--w1', meta.grade[0]);
  el.style.setProperty('--w2', meta.grade[1]);
  el.style.setProperty('--w3', meta.grade[2]);
  el.innerHTML = `<i></i><i></i><i></i><b class="notranslate" translate="no">${meta.glyph}</b>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT_LANG);
  const [picker, setPicker] = useState(false);
  const [suggested, setSuggested] = useState(null);
  const [sound, setSound] = useState(true);
  const [status, setStatus] = useState({ waiting: 0, pending: 0, hasProvider: false, needsClick: false });
  const first = useRef(true);
  const setStatusRef = useRef(setStatus);

  const setLang = useCallback((code, { origin, silent = false, interactive = true } = {}) => {
    const meta = BY_CODE[code] || BY_CODE[DEFAULT_LANG];
    setLangState(meta.code);
    store.set(KEY, meta.code);
    store.set(SEEN, '1');
    if (!silent) {
      skipWelcome();
      playLanguageSound(meta.code);
      gradeWave(meta, origin);
      track('language_change', { language: meta.code });
    }
    applyGrade(meta);
    if (meta.code !== DEFAULT_LANG && !statusBound) {
      statusBound = true;
      engine().then((m) => m.onStatus(setStatusRef.current));
    }
    // let the wave start before the page text changes
    setTimeout(() => setPageLanguage(meta.code, { interactive }), silent ? 0 : 160);
  }, []);

  // Initial language (after hydration)
  useEffect(() => {
    if (!first.current) return undefined;
    first.current = false;
    setSound(isSoundEnabled());
    let fromUrl = null;
    try {
      fromUrl = resolveLang(new URLSearchParams(window.location.search).get('lang'));
    } catch {
      /* ignore */
    }
    const legacy = migrateLegacy();
    const saved = store.get(KEY) || legacy;
    const pick = fromUrl || (saved && BY_CODE[saved] ? saved : null);
    if (pick) {
      if (pick !== DEFAULT_LANG) setLang(pick, { silent: true, interactive: false });
      else applyGrade(BY_CODE[DEFAULT_LANG]);
      store.set(KEY, pick);
      store.set(SEEN, '1');
    } else {
      applyGrade(BY_CODE[DEFAULT_LANG]);
      const guess = matchLocale(navigator.languages || [navigator.language]);
      if (guess && guess !== DEFAULT_LANG && !store.get(SEEN) && !store.get('mfr_lang_dismissed')) {
        setSuggested(guess);
        const t = setTimeout(() => setPicker(true), 1400);
        return () => clearTimeout(t);
      }
    }
    return undefined;
  }, [setLang]);

  // Other components can open the picker: window.dispatchEvent(new Event('mfr:lang'))
  useEffect(() => {
    const open = () => setPicker(true);
    window.addEventListener('mfr:lang', open);
    return () => window.removeEventListener('mfr:lang', open);
  }, []);

  const toggleSound = useCallback(() => {
    setSound((s) => {
      setSoundEnabled(!s);
      return !s;
    });
  }, []);
  const openPicker = useCallback(() => {
    loadSounds().catch(() => {}); // warm up so the first sound plays instantly
    setPicker(true);
  }, []);
  const closePicker = useCallback(() => {
    store.set(SEEN, '1');
    setPicker(false);
  }, []);

  const value = useMemo(
    () => ({
      lang,
      meta: BY_CODE[lang],
      languages: LANGUAGES,
      setLang,
      picker,
      suggested,
      openPicker,
      closePicker,
      sound,
      toggleSound,
      status,
      translateRest: retryWithGesture,
    }),
    [lang, setLang, picker, suggested, openPicker, closePicker, sound, toggleSound, status]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);

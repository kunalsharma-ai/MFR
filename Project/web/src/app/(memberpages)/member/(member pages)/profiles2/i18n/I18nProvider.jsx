import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import EN from './en.js';
import { LANG_BY_CODE, matchLang } from './languages.js';
import { getJSON } from '../lib/assets.js';
import { store } from '../lib/storage.js';
import { CONFIG } from '../config.js';
import { translateMany, onTranslated, peek } from './contentTranslator.js';
import { applyPalette } from '../themes/langPalettes.js';

const Ctx = createContext(null);
const KEY = 'mfr:lang';

function initialLang() {
  if (typeof window === 'undefined') return 'en';
  const q = new URLSearchParams(location.search).get('lang');
  const fromUrl = matchLang(q);
  if (fromUrl) return fromUrl;
  const saved = store.get(KEY);
  if (saved && LANG_BY_CODE[saved]) return saved;
  if (CONFIG.autoDetectLanguage) {
    for (const tag of navigator.languages || [navigator.language]) {
      const m = matchLang(tag);
      if (m && LANG_BY_CODE[m].full) return m;
    }
  }
  return CONFIG.defaultLang;
}

const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? '{' + k + '}')) : s);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);
  const [dict, setDict] = useState(EN);
  const [busy, setBusy] = useState(false);
  const [, bump] = useState(0);
  const req = useRef(0);

  useEffect(() => onTranslated(() => bump((x) => x + 1)), []);

  useEffect(() => {
    const id = ++req.current;
    const meta = LANG_BY_CODE[lang] || LANG_BY_CODE.en;
    const html = document.documentElement;
    html.lang = lang;
    html.dir = meta.rtl ? 'rtl' : 'ltr';
    applyPalette(lang);
    if (lang === 'en') {
      setDict(EN);
      setBusy(false);
      return;
    }
    setBusy(true);
    (async () => {
      let next;
      if (meta.full) {
        next = { ...EN, ...(await getJSON(`i18n/ui/${lang}.json`).catch(() => ({}))) };
      } else {
        // a baked pack (scripts/pretranslate.mjs) wins; otherwise translate the UI live
        const baked = await getJSON('i18n/content/index.json')
          .then((list) => (list.includes(lang) ? getJSON(`i18n/ui/${lang}.json`) : null))
          .catch(() => null);
        if (baked) { if (id === req.current) { setDict({ ...EN, ...baked }); setBusy(false); } return; }
        const keys = Object.keys(EN);
        const vals = await translateMany(keys.map((k) => EN[k]), lang);
        next = Object.fromEntries(keys.map((k, i) => [k, vals[i]]));
      }
      if (id === req.current) {
        setDict(next);
        setBusy(false);
      }
    })();
  }, [lang]);

  const setLang = useCallback((code) => {
    if (!LANG_BY_CODE[code]) return;
    store.set(KEY, code);
    setLangState(code);
    const u = new URL(location.href);
    if (u.searchParams.has('lang')) {
      u.searchParams.set('lang', code);
      history.replaceState(history.state, '', u);
    }
  }, []);

  const t = useCallback((key, vars) => fill(dict[key] ?? EN[key] ?? key, vars), [dict]);
  const meta = LANG_BY_CODE[lang] || LANG_BY_CODE.en;
  const value = useMemo(
    () => ({ lang, setLang, t, busy, meta, rtl: !!meta.rtl, peek: (s) => peek(s, lang) }),
    [lang, setLang, t, busy, meta]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);

/** Translate dynamic strings (question text, option labels). Returns [translatedArray, pending]. */
export function useTr(texts, enabled = true) {
  const { lang } = useI18n();
  const key = texts.join('\u0001');
  const initial = () => texts.map((s) => (lang === 'en' ? s : peek(s, lang) || s));
  const [out, setOut] = useState(initial);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    let live = true;
    setOut(initial());
    if (!enabled || lang === 'en' || !texts.length) {
      setPending(false);
      return;
    }
    const needs = texts.some((s) => s && !peek(s, lang) && /[A-Za-z]/.test(s));
    setPending(needs);
    translateMany(texts, lang).then((r) => {
      if (live) {
        setOut(r);
        setPending(false);
      }
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, lang, enabled]);
  return [out, pending];
}

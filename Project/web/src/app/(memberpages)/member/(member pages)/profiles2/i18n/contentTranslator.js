// Translates dynamic content (questions, answer options, UI for auto languages).
// Order of sources, fastest first:
//   1. in-memory cache
//   2. static pack  public/i18n/content/<lang>.json  (generate with `npm run translate:content`)
//   3. localStorage cache from earlier visits
//   4. your translation endpoint (CONFIG.translateEndpoint) - Google / DeepL / LibreTranslate via server/
//   5. the browser's on-device Translator API (Chrome 138+)
// If nothing is available the original English text is shown - the app never blocks or breaks.
// Stored answer VALUES are never translated, so your backend always receives the same data.
import { CONFIG } from '../config.js';
import { getJSON } from '../lib/assets.js';
import { store } from '../lib/storage.js';

const mem = new Map(); // lang -> Map(src -> translated)
const packs = new Map(); // lang -> Promise<void>
const listeners = new Set();
let status = { available: null }; // null = unknown, true/false after first attempt

const LS_KEY = (lang) => 'mfr:tc:' + lang;
const MAX_LS_CHARS = 1_200_000;

function bucket(lang) {
  if (!mem.has(lang)) {
    const m = new Map();
    const saved = store.get(LS_KEY(lang));
    if (saved && typeof saved === 'object') for (const k in saved) m.set(k, saved[k]);
    mem.set(lang, m);
  }
  return mem.get(lang);
}

let packIndex = null; // which static packs exist (written by scripts/pretranslate.mjs)
function loadPack(lang) {
  if (!packIndex) packIndex = getJSON('i18n/content/index.json').catch(() => []);
  if (!packs.has(lang)) {
    packs.set(
      lang,
      packIndex
        .then((list) => (Array.isArray(list) && list.includes(lang) ? getJSON(`i18n/content/${lang}.json`) : {}))
        .then((obj) => {
          const m = bucket(lang);
          for (const k in obj) if (!m.has(k)) m.set(k, obj[k]);
        })
        .catch(() => {})
    );
  }
  return packs.get(lang);
}

let persistTimer = 0;
function persist(lang) {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    const m = bucket(lang);
    const obj = {};
    let size = 0;
    for (const [k, v] of m) {
      size += k.length + v.length;
      if (size > MAX_LS_CHARS) break;
      obj[k] = v;
    }
    store.set(LS_KEY(lang), obj);
  }, 800);
}

// ---------- providers ----------
async function viaEndpoint(texts, lang) {
  if (!CONFIG.translateEndpoint) return null;
  const out = [];
  for (let i = 0; i < texts.length; i += 100) {
    const chunk = texts.slice(i, i + 100);
    const r = await fetch(CONFIG.translateEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'en', target: lang, q: chunk })
    });
    if (!r.ok) throw new Error('translate endpoint ' + r.status);
    const j = await r.json();
    if (!Array.isArray(j.translations) || j.translations.length !== chunk.length) throw new Error('bad translate response');
    out.push(...j.translations);
  }
  return out;
}

const browserTranslators = new Map();
async function viaBrowser(texts, lang) {
  if (!CONFIG.useBrowserTranslator || typeof self === 'undefined' || !('Translator' in self)) return null;
  const target = lang === 'zh-CN' ? 'zh' : lang === 'zh-TW' ? 'zh-Hant' : lang === 'fil' ? 'tl' : lang;
  try {
    if (!browserTranslators.has(target)) {
      browserTranslators.set(
        target,
        (async () => {
          const av = await self.Translator.availability({ sourceLanguage: 'en', targetLanguage: target });
          if (av === 'unavailable') return null;
          return self.Translator.create({ sourceLanguage: 'en', targetLanguage: target });
        })().catch(() => null)
      );
    }
    const tr = await browserTranslators.get(target);
    if (!tr) return null;
    const out = [];
    for (const t of texts) out.push(await tr.translate(t));
    return out;
  } catch {
    browserTranslators.delete(target);
    return null;
  }
}

// ---------- batching ----------
const queues = new Map(); // lang -> {set:Set, timer, waiters:[]}
function flush(lang) {
  const q = queues.get(lang);
  queues.delete(lang);
  const texts = [...q.set];
  (async () => {
    let res = null;
    try {
      res = await viaEndpoint(texts, lang);
    } catch (e) {
      console.warn('[i18n] endpoint failed, trying on-device translation', e);
    }
    if (!res) res = await viaBrowser(texts, lang);
    const m = bucket(lang);
    if (res) {
      status.available = true;
      texts.forEach((t, i) => res[i] && m.set(t, res[i]));
      persist(lang);
    } else if (status.available !== true) {
      status.available = false;
    }
    q.waiters.forEach((w) => w());
    listeners.forEach((l) => l(lang));
  })();
}

function enqueue(texts, lang) {
  return new Promise((resolve) => {
    let q = queues.get(lang);
    if (!q) {
      q = { set: new Set(), waiters: [] };
      queues.set(lang, q);
      q.timer = setTimeout(() => flush(lang), 40);
    }
    texts.forEach((t) => q.set.add(t));
    q.waiters.push(resolve);
  });
}

/** Synchronous lookup (returns undefined when not translated yet). */
export function peek(text, lang) {
  if (!text || lang === 'en') return text;
  return bucket(lang).get(text);
}

/** Translate many strings. Resolves with an array in the same order (falls back to the source). */
export async function translateMany(texts, lang) {
  if (lang === 'en' || !texts.length) return texts;
  await loadPack(lang);
  const m = bucket(lang);
  const missing = [...new Set(texts.filter((t) => t && !m.has(t) && /[A-Za-z]/.test(t)))];
  if (missing.length) await enqueue(missing, lang);
  return texts.map((t) => m.get(t) || t);
}

export function onTranslated(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export const translatorStatus = () => status.available;

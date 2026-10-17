// v2.5 — whole-site translation. The site is written in English; when a visitor picks another language the
// page text is machine-translated in the browser by Google's website translator. The script is loaded ONLY after
// a visitor chooses a language (nothing is sent to Google before that), and the choice is remembered in the
// standard `googtrans` cookie so every page — including pages opened later — stays translated.
// If the translator can't load (blocked network, ad blocker, service change) we fall back to Google's
// translated-page proxy (*.translate.goog) for the live domain.
import { byCode } from './languages.js';

const SCRIPT = 'https://translate.google.com/translate_a/element.js?cb=__mfrGoogleTranslateInit';
const KEY = 'mfr_lang';
let loading = null;

const readCookie = () => {
  const m = typeof document !== 'undefined' && document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
};
export function currentLang() {
  if (typeof window === 'undefined') return 'en';
  const c = readCookie().split('/')[2];
  if (c) return c;
  try { return localStorage.getItem(KEY) || 'en'; } catch { return 'en'; }
}
function writeCookie(value) {
  const host = window.location.hostname;
  const parts = host.split('.');
  const domains = ['', host, parts.length > 1 ? `.${parts.slice(-2).join('.')}` : ''];
  domains.forEach((d) => {
    const dom = d ? `; domain=${d}` : '';
    if (value) document.cookie = `googtrans=${value}; path=/${dom}; max-age=31536000; SameSite=Lax`;
    else document.cookie = `googtrans=; path=/${dom}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });
}

// React and Google's translator both touch the same text nodes. Google wraps translated words in <font>, so React
// can later fail to find a node it wants to remove ("Failed to execute 'removeChild'"), which would crash the page.
// This small, well-known guard makes those two DOM calls tolerant. Installed only when translation is active.
let guarded = false;
function guardDom() {
  if (guarded || typeof Node === 'undefined') return;
  guarded = true;
  const remove = Node.prototype.removeChild;
  Node.prototype.removeChild = function guardedRemove(child) {
    if (child.parentNode !== this) return child;
    return remove.call(this, child);
  };
  const insert = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function guardedInsert(node, ref) {
    if (ref && ref.parentNode !== this) return insert.call(this, node, null);
    return insert.call(this, node, ref);
  };
}

function applyDocLang(code) {
  const l = byCode(code);
  document.documentElement.lang = code === 'en' ? 'en' : code;
  document.documentElement.classList.toggle('is-translated', code !== 'en');
  // Layout stays left-to-right (the design is built for it); Arabic, Urdu, Persian and Hebrew text still reads
  // correctly inside each block.
  document.documentElement.classList.toggle('is-rtl-lang', Boolean(l && l.rtl));
}

function loadTranslator() {
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    guardDom();
    if (!document.getElementById('google_translate_element')) {
      const holder = document.createElement('div');
      holder.id = 'google_translate_element';
      holder.setAttribute('aria-hidden', 'true');
      holder.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)';
      document.body.appendChild(holder);
    }
    window.__mfrGoogleTranslateInit = () => {
      try {
        // eslint-disable-next-line no-new
        new window.google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'google_translate_element');
        resolve();
      } catch (e) { reject(e); }
    };
    const s = document.createElement('script');
    s.src = SCRIPT;
    s.async = true;
    s.onerror = () => { loading = null; reject(new Error('translator-unavailable')); };
    document.head.appendChild(s);
    setTimeout(() => reject(new Error('translator-timeout')), 9000);
  });
  return loading;
}

// Tell the (hidden) Google widget to switch language; retries until its <select> exists.
function pick(code, tries = 0) {
  const sel = document.querySelector('select.goog-te-combo');
  if (!sel || !sel.options.length) { if (tries < 40) setTimeout(() => pick(code, tries + 1), 150); return; }
  sel.value = code;
  sel.dispatchEvent(new Event('change'));
}

export function proxyUrl(code) {
  const { hostname, pathname, search, hash } = window.location;
  const dashed = hostname.replace(/-/g, '--').replace(/\./g, '-');
  const q = new URLSearchParams(search);
  q.set('_x_tr_sl', 'en'); q.set('_x_tr_tl', code); q.set('_x_tr_hl', code);
  return `https://${dashed}.translate.goog${pathname}?${q.toString()}${hash}`;
}

export async function setLanguage(code) {
  try { localStorage.setItem(KEY, code); } catch { /* ignore */ }
  if (code === 'en') {
    writeCookie('');
    applyDocLang('en');
    window.location.reload(); // the only reliable way to restore the original text
    return { ok: true };
  }
  writeCookie(`/en/${code}`);
  applyDocLang(code);
  try {
    await loadTranslator();
    pick(code);
    return { ok: true };
  } catch (e) {
    return { ok: false, fallback: /^(localhost|127\.|\d+\.\d+\.\d+\.\d+$)/.test(window.location.hostname) || window.location.protocol === 'file:' ? '' : proxyUrl(code) };
  }
}

// On every page load: if a language was chosen earlier, load the translator straight away.
export function resumeTranslation() {
  if (typeof window === 'undefined') return;
  const code = currentLang();
  if (!code || code === 'en') return;
  applyDocLang(code);
  if (!readCookie()) writeCookie(`/en/${code}`);
  loadTranslator().then(() => pick(code)).catch(() => { /* stays in English */ });
}

// A visitor whose browser prefers another language (and who hasn't chosen yet) gets a one-time suggestion.
export function suggestedLang() {
  try { if (localStorage.getItem(KEY) || localStorage.getItem('mfr_lang_dismissed')) return null; } catch { return null; }
  const prefs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en']).map((x) => x || '');
  for (const p of prefs) {
    const low = p.toLowerCase();
    if (low.startsWith('en')) return null;
    const exact = byCode(p) || (low === 'zh-hk' || low === 'zh-tw' ? byCode('zh-TW') : low.startsWith('zh') ? byCode('zh-CN') : low === 'he' ? byCode('iw') : low === 'fil' ? byCode('tl') : byCode(low.split('-')[0]));
    if (exact && exact.code !== 'en') return exact;
  }
  return null;
}

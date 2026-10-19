// Client-side quality signals (privacy-conscious: no canvas/audio fingerprinting, hashed identifiers).
// The server recomputes the authoritative Trust Score with IP/ASN, duplicate and history data.
import { store } from '../lib/storage.js';
import { LEVEL } from './result.js';
import { languageFitsCountry, timezoneCountry } from './geo.js';

const S = { start: Date.now(), dwell: {}, pastes: {}, keys: 0, pointer: 0, fastAnswers: 0 };

export function trackInput() {
  if (typeof window === 'undefined' || S.tracking) return;
  S.tracking = true;
  addEventListener('keydown', () => S.keys++, { passive: true, capture: true });
  addEventListener('pointermove', () => S.pointer++, { passive: true, capture: true });
  addEventListener('paste', (e) => { const n = e.target?.dataset?.q; if (n) S.pastes[n] = (S.pastes[n] || 0) + 1; }, { capture: true });
}
export function markShown(n) { S.dwell[n] = { shown: performance.now() }; }
export function markAnswered(n) {
  const d = S.dwell[n];
  if (d && !d.ms) { d.ms = Math.round(performance.now() - d.shown); if (d.ms < 700) S.fastAnswers++; }
}

async function sha256(s) {
  try {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
  } catch { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return 'h' + (h >>> 0).toString(16); }
}

/** Device/session signals - an install id + hashed coarse device traits (resets when storage is cleared). */
export async function deviceSignals() {
  let install = store.get('mfr:install');
  if (!install) { install = (crypto.randomUUID?.() || Math.random().toString(36).slice(2)) + ''; store.set('mfr:install', install); store.set('mfr:firstSeen', Date.now()); }
  const n = navigator;
  const traits = {
    ua: n.userAgent, platform: n.userAgentData?.platform || n.platform, mobile: n.userAgentData?.mobile ?? /Mobi/.test(n.userAgent),
    langs: (n.languages || [n.language]).slice(0, 4), tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${screen.width}x${screen.height}@${devicePixelRatio}`, cores: n.hardwareConcurrency || 0, mem: n.deviceMemory || 0, touch: n.maxTouchPoints || 0
  };
  const automation = [];
  if (n.webdriver) automation.push('webdriver');
  if (/HeadlessChrome|PhantomJS|Puppeteer|Playwright/i.test(n.userAgent)) automation.push('headless_ua');
  if (window.callPhantom || window._phantom || window.__nightmare) automation.push('phantom');
  if (Object.keys(window).some((k) => /^(cdc_|__playwright|__pw_|__selenium|_selenium|__webdriver)/.test(k))) automation.push('automation_globals');
  if (!n.languages || !n.languages.length) automation.push('no_languages');
  return {
    installId: install, firstSeen: store.get('mfr:firstSeen'), deviceHash: await sha256(JSON.stringify({ ...traits, ua: traits.ua.replace(/[\d.]+/g, '') })),
    traits, automation, behaviour: { keys: S.keys, pointer: S.pointer, pastes: S.pastes, fastAnswers: S.fastAnswers, sessionMs: Date.now() - S.start }
  };
}

/** Provisional trust score (0-100) + level, used client-side only to decide progressive CAPTCHA / OTP step-up. */
export function scoreTrust({ flags = [], verified = {}, device, answeredCount = 0, durationMs = 0, residence }) {
  let s = 60;
  const reasons = [];
  const add = (w, code) => { s += w; reasons.push([code, w]); };
  if (verified.email) add(10, 'email_verified');
  if (verified.phone) add(10, 'phone_verified');
  if (device?.firstSeen && Date.now() - device.firstSeen > 30 * 864e5) add(5, 'established_device');
  for (const f of flags) if (f.weight) add(f.weight, f.code);
  if (device?.automation?.length) add(-30, 'automation');
  if (device && residence) {
    const tzc = timezoneCountry(device.traits.tz);
    const langOk = (device.traits.langs || []).some((l) => languageFitsCountry(l, residence));
    if ((!tzc || tzc === residence) && langOk) add(10, 'consistent_geography');
  }
  if (answeredCount >= 10 && durationMs && durationMs / answeredCount < 1200) add(-15, 'speeding');
  if (device?.behaviour?.fastAnswers > 8) add(-5, 'many_instant_answers');
  if (device && !device.behaviour.pointer && !device.behaviour.keys && answeredCount > 5) add(-10, 'no_human_interaction');
  s = Math.max(0, Math.min(100, Math.round(s)));
  const level = s <= 30 ? LEVEL.BLOCK : s <= 60 ? LEVEL.STEP_UP : s <= 80 ? LEVEL.SOFT : LEVEL.PASS;
  return { score: s, level, reasons };
}

// Date of birth: DD / MM / YYYY. Age is (re)calculated on the server - the client value is never trusted.
import { ok, bad, flag } from './result.js';

// Age of digital consent by country (GDPR Art. 8 national choices, COPPA, PIPL, DPDP…). Default 13.
export const CONSENT_AGE = { AT: 14, BE: 13, BG: 14, HR: 16, CY: 14, CZ: 15, DK: 13, EE: 13, FI: 13, FR: 15, DE: 16, GR: 15, HU: 16, IE: 16, IT: 14, LV: 13, LT: 14, LU: 16, MT: 13, NL: 16, PL: 16, PT: 13, RO: 16, SK: 16, SI: 15, ES: 14, SE: 13, GB: 13, US: 13, CA: 13, CN: 14, KR: 14, IN: 18, BR: 18, ZA: 18, SG: 13, AU: 13, JP: 13 };
export const MIN_PANEL_AGE = 13; // youngest age that may join (with parental consent where required)
export const MAX_AGE = 110;

export function parseDob(v) {
  const m = String(v || '').trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/) || null;
  if (m) return { y: +m[1], m: +m[2], d: +m[3] };
  const p = String(v || '').trim().match(/^(\d{1,2})[/.\- ](\d{1,2})[/.\- ](\d{4})$/);
  return p ? { y: +p[3], m: +p[2], d: +p[1] } : null;
}
export function ageOn(dob, today = new Date()) {
  let a = today.getFullYear() - dob.y;
  if (today.getMonth() + 1 < dob.m || (today.getMonth() + 1 === dob.m && today.getDate() < dob.d)) a--;
  return a;
}

/** @param {{segment?: 'adult'|'minor', country?: string, previous?: string}} o  - value stored as ISO YYYY-MM-DD */
export function validateDob(v, o = {}) {
  const d = parseDob(v);
  if (!d) return bad('e.date');
  const dt = new Date(Date.UTC(d.y, d.m - 1, d.d));
  if (dt.getUTCFullYear() !== d.y || dt.getUTCMonth() !== d.m - 1 || dt.getUTCDate() !== d.d) return bad('e.dateImpossible'); // 31/02
  const today = new Date();
  if (dt > today) return bad('e.future');
  const age = ageOn(d, today);
  if (age > MAX_AGE || d.y < 1900) return bad('e.dob');
  if (o.segment === 'minor') {
    if (age >= 18) return bad('e.minor');
    if (age < MIN_PANEL_AGE) return bad('e.tooYoung', { n: MIN_PANEL_AGE });
  } else if (age < 18) return bad('e.adult');
  const flags = [];
  if (age >= 95) flags.push(flag('age_unusual_high', -2, age)); // unusual ≠ invalid
  if (d.d === 1 && d.m === 1) flags.push(flag('dob_jan_first', -1)); // common placeholder date
  if (o.previous && o.previous !== iso(d)) flags.push(flag('dob_changed', -10, o.previous));
  const consentAge = CONSENT_AGE[o.country] ?? 13;
  const res = ok(iso(d), flags);
  res.age = age;
  res.needsParentalConsent = o.segment === 'minor' && age < Math.max(consentAge, 16);
  return res;
}
export const iso = (d) => `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;

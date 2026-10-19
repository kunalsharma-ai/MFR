// International phone validation on E.164 - never a single global regex.
import { ok, bad, flag } from './result.js';
import { PHONE, MOBILE } from './phone-meta.js';

const byDial = Object.entries(PHONE).sort((a, b) => b[1].dial.length - a[1].dial.length);
// main country for calling codes shared by several territories
const PRIMARY = { 1: 'US', 7: 'RU', 39: 'IT', 44: 'GB', 47: 'NO', 61: 'AU', 64: 'NZ', 212: 'MA', 262: 'RE', 290: 'SH', 358: 'FI', 500: 'FK', 590: 'GP', 599: 'CW', 672: 'NF' };

/** Parse "+44 7911 123456", "07911 123456" (with default country), "0091…" into parts. */
export function parsePhone(raw, defaultCountry) {
  let s = String(raw || '').trim();
  if (!s) return null;
  if (/[^\d+\s().\-/]/.test(s.replace(/ext\.?\s*\d+$/i, ''))) return { error: 'chars' };
  s = s.replace(/[^\d+]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  let country = defaultCountry, nsn;
  if (s.startsWith('+')) {
    const digits = s.slice(1);
    // prefer the selected country when its calling code matches (+1 is shared by 25 countries, +7 by RU/KZ, +44 by GB/GG/JE/IM …)
    if (defaultCountry && PHONE[defaultCountry] && digits.startsWith(PHONE[defaultCountry].dial)) { country = defaultCountry; nsn = digits.slice(PHONE[defaultCountry].dial.length); }
    else {
      const hit = byDial.find(([, m]) => digits.startsWith(m.dial));
      if (!hit) return { error: 'code' };
      country = PRIMARY[hit[1].dial] || hit[0]; nsn = digits.slice(hit[1].dial.length);
    }
  } else {
    if (!country || !PHONE[country]) return { error: 'code' };
    nsn = s.replace(/^\+/, '');
    if (nsn.startsWith(PHONE[country].dial) && nsn.length > PHONE[country].max) nsn = nsn.slice(PHONE[country].dial.length);
    if (nsn.startsWith('0') && country !== 'IT' && country !== 'SM' && country !== 'VA') nsn = nsn.replace(/^0+/, ''); // trunk prefix
  }
  if (country === 'IT' || country === 'SM' || country === 'VA') { /* Italian numbers keep their leading 0 */ }
  return { country, dial: PHONE[country]?.dial, nsn, e164: '+' + PHONE[country]?.dial + nsn };
}

// 'block' = clearly invented (all same digit / whole number is a run), 'flag' = suspicious pattern inside
function fakePattern(nsn) {
  const asc = '012345678901234567890', desc = '987654321098765432109';
  if (/^(\d)\1+$/.test(nsn) || asc.includes(nsn) || desc.includes(nsn) || /^(\d{2,3})\1{3,}$/.test(nsn)) return 'block';
  const tail = nsn.slice(-7);
  if (asc.includes(tail) || desc.includes(tail) || /(\d)\1{5,}/.test(nsn)) return 'flag';
  return null;
}

/**
 * @returns ok(E.164 string, flags) | bad(key)
 * @param {{country?: string, optional?: boolean, residence?: string}} o
 */
export function validatePhone(raw, o = {}) {
  if (!String(raw || '').trim()) return o.optional ? ok('') : bad('e.required');
  const p = parsePhone(raw, o.country);
  if (!p || p.error === 'chars') return bad('e.phoneChars');
  if (p.error === 'code' || !p.dial) return bad('e.phoneCode');
  const m = PHONE[p.country];
  if (p.nsn.length < m.min || p.nsn.length > m.max) return m.min === m.max ? bad('e.phoneLen1', { n: m.min }) : bad('e.phoneLen', { a: m.min, b: m.max });
  if (m.pattern && !m.pattern.test(p.nsn)) return bad('e.phoneInvalid');
  if (p.e164.length > 16) return bad('e.phoneInvalid'); // E.164 max 15 digits
  const flags = [];
  const fake = fakePattern(p.nsn);
  if (fake === 'block') return bad('e.phoneFake');
  if (fake === 'flag') flags.push(flag('phone_sequential_digits', -10));
  const mob = MOBILE[p.country];
  const type = mob ? (mob.test(p.nsn) ? 'mobile' : 'fixed-or-voip') : 'unknown';
  if (type === 'fixed-or-voip') flags.push(flag('phone_not_mobile', -2)); // landline/VoIP - allowed, small risk only
  if (o.residence && o.residence !== p.country) flags.push(flag('phone_country_mismatch', -5, `${p.country}≠${o.residence}`));
  return { ...ok(p.e164, flags), country: p.country, type, national: p.nsn };
}

export function formatE164(e164) {
  const p = parsePhone(e164);
  if (!p || p.error) return e164;
  return `+${p.dial} ${p.nsn.replace(/(\d{3,4})(?=(\d{3,4})+$)/g, '$1 ')}`;
}

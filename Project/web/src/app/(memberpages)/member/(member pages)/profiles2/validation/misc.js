// Address, banking/payment IDs, URLs, social handles, numbers and free text.
import { ok, bad, flag, clean } from './result.js';

const FAKE_ADDR = /\b(test|testing|asdf|qwerty|fake|dummy|sample|lorem|ipsum|n\/?a|none|unknown|xxx+|abc+|123 (fake|main) st(reet)?)\b/i;
export function validateAddress(raw, o = {}) {
  const v = clean(raw);
  if (!v) return o.optional ? ok('') : bad('e.required');
  if (v.length < 5) return bad('e.addrShort');
  if (v.length > 300) return bad('e.len', { a: 5, b: 300 });
  if (!/\p{L}/u.test(v)) return bad('e.addrShort');
  if (FAKE_ADDR.test(v) || /(.)\1{5,}/u.test(v)) return bad('e.addrFake');
  const flags = [];
  if (!/\p{N}/u.test(v)) flags.push(flag('address_no_number', 0)); // many valid addresses have no number
  return ok(v, flags);
}

// IBAN (ISO 13616 mod-97), SWIFT/BIC (ISO 9362), IFSC (India)
export function ibanValid(s) {
  const v = s.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(v)) return false;
  const r = (v.slice(4) + v.slice(0, 4)).replace(/[A-Z]/g, (c) => c.charCodeAt(0) - 55);
  let mod = 0;
  for (const ch of r) mod = (mod * 10 + +ch) % 97;
  return mod === 1;
}
export const swiftValid = (s) => /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(s.replace(/\s/g, '').toUpperCase());
export const ifscValid = (s) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(s.replace(/\s/g, '').toUpperCase());

export function validateBankCode(raw, o = {}) {
  const v = clean(raw).toUpperCase().replace(/\s/g, '');
  if (!v) return o.optional ? ok('') : bad('e.required');
  if (ifscValid(v) || swiftValid(v) || ibanValid(v)) return ok(v);
  return bad('e.bankCode');
}
export function validateBankAccount(raw, o = {}) {
  const v = clean(raw).toUpperCase().replace(/[\s-]/g, '');
  if (!v) return o.optional ? ok('') : bad('e.required');
  if (ibanValid(v)) return ok(v);
  if (!/^[A-Z0-9]{6,34}$/.test(v) || !/\d{4}/.test(v)) return bad('e.bank');
  if (/^(\d)\1+$/.test(v) || '01234567890123456789'.includes(v)) return bad('e.bank');
  return ok(v);
}
export function validateUpi(raw, o = {}) {
  const v = clean(raw).toLowerCase();
  if (!v) return o.optional ? ok('') : bad('e.required');
  return /^[a-z0-9.\-_]{2,256}@[a-z][a-z0-9]{1,64}$/.test(v) ? ok(v) : bad('e.upi');
}
export function validateUrl(raw, o = {}) {
  let v = clean(raw);
  if (!v) return o.optional ? ok('') : bad('e.required');
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
  try {
    const u = new URL(v);
    if (!/^[\p{L}\p{N}-]+(\.[\p{L}\p{N}-]+)+$/u.test(u.hostname) || !/\.[\p{L}]{2,}$/u.test(u.hostname)) return bad('e.url');
    if (o.linkedin && !/(^|\.)linkedin\.com$/i.test(u.hostname)) return bad('e.linkedin');
    return ok(u.href.replace(/\/$/, ''));
  } catch { return bad('e.url'); }
}
const HANDLE = /^@?[\p{L}\p{N}._]{2,40}$/u;
export function validateHandle(raw, o = {}) {
  const v = clean(raw);
  if (!v) return o.optional ? ok('') : bad('e.required');
  if (HANDLE.test(v) && !/^@?\.|\.\.|\.$/.test(v)) return ok(v.startsWith('@') ? v : '@' + v);
  if (/^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}\/\S+$/i.test(v)) return ok(v);
  return bad('e.handle');
}
export function validateInt(raw, a, b, o = {}) {
  const v = clean(raw);
  if (!v) return o.optional ? ok('') : bad('e.required');
  if (!/^\d+$/.test(v) || +v < a || +v > b) return bad('e.num', { a, b });
  return ok(String(+v));
}
export function validateText(raw, o = {}) {
  const v = clean(raw);
  const min = o.min ?? 2, max = o.max ?? 200;
  if (!v) return o.optional ? ok('') : bad('e.required');
  if (v.length < min || v.length > max) return bad('e.len', { a: min, b: max });
  if (/^(.)\1+$/u.test(v.replace(/\s/g, '')) || /^(asdf|qwer|test|xxx|aaa|n\/?a|none|nothing|na)$/i.test(v)) return bad('e.textJunk');
  return ok(v);
}
export function validateCompany(raw, o = {}) {
  const r = validateText(raw, { ...o, min: 2, max: 120 });
  if (!r.ok) return r;
  if (/^(none|no|self|myself|n\/?a|nil|company|test|abc|xyz)$/i.test(r.value)) return o.optional ? ok('') : bad('e.textJunk');
  return r;
}
export function validateCity(raw) {
  const v = clean(raw);
  if (!v) return bad('e.required');
  if (v.length < 2 || v.length > 80 || /\p{N}{3,}/u.test(v) || /[^\p{L}\p{M}\p{N} '’\-.(),]/u.test(v)) return bad('e.city');
  if (/^(test|asdf|city|none|n\/?a|unknown|xxx)$/i.test(v)) return bad('e.city');
  return ok(v, [flag('city_unlisted', 0, v)]);
}

/** Open-ended answers about the respondent ("please specify", free text). Unicode-aware junk detection:
 *  must contain letters, no keyboard mashing / repeated characters / placeholder words / URLs or emails,
 *  Latin text must contain vowels (gibberish like "xkcd qwrt" is rejected). */
const JUNK = /^(asdf\w*|qwer\w*|zxcv\w*|test(ing)?|abc|xyz|xxx+|aaa+|idk|dunno|hmm+|blah|lol|\.+|-+|\?+|1+|0+)$/i;
// "Other - please specify" must name something real: placeholders like "none" / "n/a" / "other" are not answers there
const NOT_SPECIFIC = /^(n\/?a|na|nil|none|nothing|no|yes|ok|okay|other|others|any|anything|something|misc|etc\.?|don'?t know|not sure|nope)$/i;
export function validateOpenText(raw, o = {}) {
  const v = clean(raw);
  const min = o.min ?? 2, max = o.max ?? 200;
  if (!v) return o.optional ? ok('') : bad('e.required');
  if (v.length > max) return bad('e.len', { a: min, b: max });
  const letters = (v.match(/\p{L}/gu) || []).length;
  if (letters < Math.min(min, 2)) return bad('e.textLetters');
  if (JUNK.test(v) || (o.specific && NOT_SPECIFIC.test(v)) || /(.)\1{4,}/u.test(v.replace(/\s/g, ''))) return bad('e.textJunk');
  if (/https?:\/\/|www\.|@[\w-]+\.[a-z]{2,}/i.test(v)) return bad('e.textLink');
  const latin = v.replace(/[^A-Za-z]/g, '');
  if (latin.length >= 5 && latin.length / letters > 0.8 && !/[aeiouyAEIOUY]/.test(latin)) return bad('e.textJunk');
  if (latin.length >= 8 && /[bcdfghjklmnpqrstvwxz]{6,}/i.test(latin)) return bad('e.textJunk');
  return ok(v);
}

// Unicode-aware name validation for a global panel - never a Western-only [A-Za-z] regex.
import { ok, bad, flag, clean } from './result.js';

const PLACEHOLDER = /^(test(ing)?|tester|demo|dummy|sample|anonymous|anon|none|null|nil|n\/?a|na|unknown|nobody|no ?name|name|first ?name|last ?name|surname|fname|lname|abc|xyz|asd|qwe|aaa|xxx|user|admin|guest|fake|nothing|nope|blah|hello|hi|ok|yes|no|mr|mrs|ms|sir|madam)$/i;
const FAKE_COMBOS = [/^john\s+doe$/i, /^jane\s+doe$/i, /^mickey\s+mouse$/i, /^donald\s+duck$/i, /^harry\s+potter$/i, /^bat\s*man$/i, /^super\s*man$/i, /^spider\s*man$/i, /^test\s+user$/i, /^foo\s+bar$/i, /^lorem\s+ipsum$/i, /^asdf\s+asdf$/i];
const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890', 'qwertzuiop', 'azertyuiop', 'abcdefghijklmnopqrstuvwxyz'];
// Particles / connectors that are legitimate inside names
export const PARTICLES = new Set(['van', 'von', 'der', 'den', 'de', 'del', 'della', 'di', 'da', 'dos', 'das', 'du', 'la', 'le', 'bin', 'binti', 'bint', 'ibn', 'al', 'el', 'ben', 'ter', 'ten', 'mac', 'mc', 'st', 'abu', 'ould', 'y', 'e']);

function keyboardPattern(s) {
  const t = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (t.length < 4) return false;
  return KEY_ROWS.some((row) => {
    for (let i = 0; i + 4 <= t.length; i++) {
      const chunk = t.slice(i, i + 4);
      if (row.includes(chunk) || [...row].reverse().join('').includes(chunk)) {
        if (t.length <= 8 || chunk.length / t.length > 0.5) return true;
      }
    }
    return false;
  });
}

/**
 * @param {string} raw
 * @param {{kind?: 'first'|'middle'|'last'|'full', optional?: boolean, other?: string}} o
 */
export function validateName(raw, o = {}) {
  const v = clean(raw);
  const flags = [];
  if (!v) return o.optional ? ok('') : bad('e.required');
  const min = o.kind === 'middle' ? 1 : o.kind === 'full' ? 2 : 1;
  const letters = (v.match(/\p{L}/gu) || []).length;
  if (letters < min) return bad('e.nameShort');
  // CJK/Thai single-character given names are legitimate; Latin 1-letter only as middle initial
  if (letters === 1 && /^\p{Script=Latin}/u.test(v) && o.kind !== 'middle') return bad('e.nameShort');
  if (/\p{N}/u.test(v)) return bad('e.nameDigits');
  // allowed: letters, combining marks, space, apostrophes (’ ' ʼ), hyphen, period, middle dot (Catalan/Japanese)
  if (/[^\p{L}\p{M} '’ʼ\-.·・]/u.test(v)) return bad('e.nameChars');
  const specials = (v.match(/['’ʼ\-.·・]/g) || []).length;
  if (specials > 3 || /['’ʼ\-.]{2,}/.test(v) || /^['’ʼ\-.]|['’ʼ\-]$/.test(v)) return bad('e.nameChars');
  if (/(\p{L})\1{3,}/u.test(v)) return bad('e.nameRepeat');
  if (PLACEHOLDER.test(v)) return bad('e.namePlaceholder');
  if (keyboardPattern(v)) return bad('e.namePattern');
  if (v.length > 60) flags.push(flag('name_very_long', -2, v.length)); // reviewed, never auto-rejected
  if (v.length > 120) return bad('e.nameLong');
  if (o.kind === 'full' && FAKE_COMBOS.some((r) => r.test(v))) return bad('e.namePlaceholder');
  if (o.other && clean(o.other).toLowerCase() === v.toLowerCase() && o.kind === 'last') flags.push(flag('first_equals_last', -5));
  if (/^[\p{Lu}\s'’\-.]+$/u.test(v) && v.length > 3 && /\p{Script=Latin}/u.test(v)) flags.push(flag('name_all_caps', 0));
  // nice capitalisation for Latin names, keeping particles lower-case ("ludwig van beethoven" -> "Ludwig van Beethoven")
  let out = v;
  if (/^[\p{Ll}\s'’\-.]+$/u.test(v) && /\p{Script=Latin}/u.test(v)) {
    out = v.split(' ').map((w, i) => (i > 0 && PARTICLES.has(w) ? w : w.replace(/(^|[-'’])(\p{Ll})/gu, (m, a, b) => a + b.toUpperCase()))).join(' ');
  }
  return ok(out, flags);
}

/** Jaro-Winkler similarity - fuzzy duplicate detection ("Mohammed Ali" ~ "Muhammad Ali"). */
export function nameSimilarity(a, b) {
  const s1 = clean(a).toLowerCase(), s2 = clean(b).toLowerCase();
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  const md = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const m1 = [], m2 = [];
  let m = 0;
  for (let i = 0; i < s1.length; i++) {
    for (let j = Math.max(0, i - md); j < Math.min(s2.length, i + md + 1); j++) {
      if (!m2[j] && s1[i] === s2[j]) { m1[i] = m2[j] = true; m++; break; }
    }
  }
  if (!m) return 0;
  let t = 0, k = 0;
  for (let i = 0; i < s1.length; i++) if (m1[i]) { while (!m2[k]) k++; if (s1[i] !== s2[k]) t++; k++; }
  const jaro = (m / s1.length + m / s2.length + (m - t / 2) / m) / 3;
  let p = 0;
  while (p < 4 && s1[p] === s2[p]) p++;
  return jaro + p * 0.1 * (1 - jaro);
}

// Countries (with flags), states/provinces and cities for the Teen registration, from public/data/geo
// (built from the API's dataBank by scripts/build-teen-geo.mjs). Each country is a separate small file, fetched once.
import { asset } from '../utils/asset.js';

let indexP = null;
const cache = new Map();

const url = (p) => {
  try { return asset(p); } catch { return p; }
};
async function getJSON(p) {
  // the preview build embeds these files (window.__MFR_GEO), so the single preview file works offline
  if (typeof window !== 'undefined' && window.__MFR_GEO && window.__MFR_GEO[p]) return window.__MFR_GEO[p];
  const r = await fetch(url(p), { credentials: 'omit' });
  if (!r.ok) throw new Error('geo');
  return r.json();
}

// [{ i: 'IN', n: 'India', d: '91', z: '\\d{6}', s: 1, tz: [...] }]
export function countries() {
  // dial codes arrive as "91", "+1-684", "+358-18": keep digits only
  if (!indexP) indexP = getJSON('/data/geo/index.json').then((list) => list.map((c) => ({ ...c, d: String(c.d || '').replace(/\D/g, '') }))).catch((e) => { indexP = null; throw e; });
  return indexP;
}
// { i, z, s: [{ c: 'DL', n: 'Delhi', ci: ['New Delhi', ...] }] }
export function country(iso) {
  const k = String(iso || '').toUpperCase();
  if (!k) return Promise.resolve(null);
  if (!cache.has(k)) cache.set(k, getJSON(`/data/geo/${k}.json`).catch((e) => { cache.delete(k); throw e; }));
  return cache.get(k);
}

// postcode pattern from the dataset → a human example ("\\d{6}" → "6 digits")
export function zipHint(z) {
  if (!z) return '';
  const m = /^\\?d\{(\d+)\}$/.exec(z.replace(/\\\\/g, '\\'));
  if (m) return `${m[1]} digits`;
  if (/^\(\\d\{5\}\)/.test(z)) return '5 digits (e.g. 90210)';
  return '';
}
export function zipOk(z, value) {
  if (!z || !value) return true;
  try { return new RegExp(`^(?:${z})$`, 'i').test(String(value).trim()); } catch { return true; }
}
// Regional-indicator emoji as a fallback when an SVG flag is missing
export const flagEmoji = (iso = '') => String(iso).toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

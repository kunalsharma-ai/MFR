
import { COUNTRIES } from '../data/countries.js';
import { store } from './storage.js';

const BY_NAME = Object.fromEntries(COUNTRIES.map((c) => [c.name.toLowerCase(), c.iso]));
const BY_ISO = Object.fromEntries(COUNTRIES.map((c) => [c.iso, c.name]));
const OWN_KEY = 'mfr_own_reviews';
export const REVIEW_EVENT = 'mfr:review-submitted';

const clean = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);

// Accepts the API shape ({ name, country, iso, designation, company, segment, rating, text, createdAt }) and the older static
// shape ({ name, place, text, rating }). Returns null for anything unusable.
export function normalizeReview(r) {
  if (!r || typeof r !== 'object') return null;
  const text = clean(r.text, 600);
  const name = clean(r.name || r.firstName, 40);
  if (text.length < 10 || !name) return null;
  const iso = String(r.iso || BY_NAME[String(r.country || r.place || '').toLowerCase()] || '').toUpperCase().slice(0, 2);
  const rating = Number(r.rating);
  return {
    id: String(r.id || `${name}-${text.slice(0, 24)}`),
    name,
    iso,
    country: clean(r.country && r.country.length > 2 ? r.country : BY_ISO[iso] || r.place || '', 60),
    company: clean(r.company, 60),
    designation: clean(r.designation, 60),
    segment: r.segment === 'professional' || (!r.segment && clean(r.company, 60)) ? 'professional' : 'consumer',
    rating: rating >= 1 && rating <= 5 ? Math.round(rating) : null,
    text,
    createdAt: r.createdAt || null,
    own: Boolean(r.own),
    pending: Boolean(r.pending),
    preview: Boolean(r.preview),
  };
}

export const ownReviews = () => (store.get(OWN_KEY, []) || []).map(normalizeReview).filter(Boolean);
export function rememberOwnReview(r) {
  const list = store.get(OWN_KEY, []) || [];
  store.set(OWN_KEY, [{ ...r, own: true }, ...list].slice(0, 3));
  window.dispatchEvent(new CustomEvent(REVIEW_EVENT, { detail: r }));
}

const key = (r) => `${r.segment === 'professional' ? 'p' : 'c'}|${r.name.toLowerCase()}|${r.text.slice(0, 40).toLowerCase()}`; // same person + same words + same member type = one review
// Newest live reviews first, then the reviewer's own (if not yet live), then the static set — de-duplicated.
export function mergeReviews(live, own, base) {
  const seen = new Set();
  const out = [];
  const liveKeys = new Set(live.map(key));
  [...own.filter((r) => !liveKeys.has(key(r))), ...live, ...base].forEach((r) => {
    const k = key(r);
    if (seen.has(k)) return;
    seen.add(k);
    out.push(r);
  });
  return out;
}

export const isRecent = (r, days = 14) => Boolean(r.own) || (r.createdAt && Date.now() - new Date(r.createdAt).getTime() < days * 864e5);

// "Priya S." from first + optional last name (the public form used everywhere).
export const publicName = (first, last) => {
  const f = clean(first, 40);
  const l = clean(last, 40);
  return l ? `${f} ${l.slice(0, 1).toUpperCase()}.` : f;
};

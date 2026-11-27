import { useEffect, useState } from 'react';
import { REVIEW_EVENT, mergeReviews, normalizeReview, ownReviews, publicName } from '../utils/reviews.js';
import { TESTIMONIALS } from '../data/community.js';
import { SUPPLIED_TESTIMONIALS } from '../data/testimonialsSupplied.js';
import { API_BASE, DEMO_MODE } from '../data/site.js';


const FEED = import.meta.env.VITE_REVIEWS_FEED_URL || `${API_BASE}/api/v1/testimonial`;
// Issue #89 (Kunal, 27 Nov 2026): the site shows ONLY reviews from the live feed (plus the visitor's own just-posted
// one). The fixed testimonial texts (data/community.js, data/testimonialsSupplied.js, public/data/reviews.json) are no
// longer shown on the live site; preview builds (no backend) still use them so the sections can be seen.
const FALLBACK = DEMO_MODE ? '/data/reviews.json' : null;
// No polling (issue #84). Reviews only change when the team approves one, so the feed is read once per page load and
// shared by every section that shows reviews; it is read again only when the member comes back to a tab that has
// been away for STALE_MS or more, and shortly after the member posts a review of their own.
const STALE_MS = 10 * 60 * 1000;

let feedUrl = FEED;
let cache = null; // { list, status, at }
let inflight = null;
const subscribers = new Set();

function readFeed(force = false) {
  if (inflight) return inflight;
  if (!force && cache && Date.now() - cache.at < STALE_MS) return Promise.resolve(cache);
  inflight = (async () => {
    let list = null;
    try {
      list = await fetchFeed(feedUrl);
    } catch {
      // the live feed is not answering: a preview build uses the static file; the live site shows no fixed texts
      if (FALLBACK && feedUrl !== FALLBACK) {
        feedUrl = FALLBACK;
        try { list = await fetchFeed(feedUrl); } catch { /* keep what we had */ }
      }
    }
    cache = { list: list || cache?.list || [], status: list && feedUrl !== FALLBACK && !DEMO_MODE ? 'live' : 'static', at: Date.now() };
    inflight = null;
    subscribers.forEach((fn) => fn(cache));
    return cache;
  })();
  return inflight;
}

const BASE = DEMO_MODE
  ? [...TESTIMONIALS, ...SUPPLIED_TESTIMONIALS.map((t) => (t.publish ? t : { ...t, preview: true }))].map(normalizeReview).filter(Boolean)
  : [];


function fromApi(r) {
  if (!r || typeof r !== 'object') return null;
  if (r.status && !/^(approved|published|live)$/i.test(String(r.status))) return null; 
  const u = r.reviewer|| r.user || r.member || {};
  const nm = u.name || {};
  const first = r.firstName || nm.first || u.firstName || '';
  const last = r.lastName || nm.last || u.lastName || '';
  let name = r.name || r.fullName || '';
  if (!name && (first || last)) name = publicName(first, last);
  else if (/\s/.test(String(name).trim())) { const [f, ...rest] = String(name).trim().split(/\s+/); name = publicName(f, rest.join(' ')); }
  const code = [r.iso, r.countryCode, r.country, u.country, (u.address && u.address[0] && u.address[0].country)].find((x) => typeof x === 'string' && x.length === 2) || '';
  const countryName = [r.countryName, r.country, u.country].find((x) => typeof x === 'string' && x.length > 2) || '';
  const category = String(r.category || u.category || '');
  return {
    ...r,
    id: r.id || r._id,
    name,
    iso: code,
    country: countryName,
    rating: r.rating ?? r.rate,
    text: r.text ?? r.message,
    designation: r.designation || r.jobrole || u.jobrole || '',
    segment: r.segment || (/b2b/i.test(category) ? 'professional' : 'consumer'),
    createdAt: r.createdAt || (r.created && r.created.At) || r.updatedAt,
  };
}

async function fetchFeed(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store', credentials: 'same-origin' });
  if (!res.ok) throw new Error('feed');
  const j = await res.json();
  // the backend's catch-all answers 200 "Fallback route: … is not available" for a route that does not exist yet
  if (j && /^Fallback route:/i.test(j.message || '')) throw new Error('feed');
  const arr = Array.isArray(j) ? j : Array.isArray(j.reviews) ? j.reviews : Array.isArray(j.data) ? j.data : [];
  return arr.map(fromApi).map(normalizeReview).filter(Boolean);
}


export default function useLiveReviews() {
  const [live, setLive] = useState(() => cache?.list || []);
  const [own, setOwn] = useState([]);
  const [status, setStatus] = useState(() => cache?.status || 'static'); // static | live
  useEffect(() => {
    setOwn(ownReviews());
    const apply = (c) => { setLive(c.list); setStatus(c.status); };
    subscribers.add(apply);
    if (cache) apply(cache);
    readFeed();
    let later;
    const onNew = () => { setOwn(ownReviews()); clearTimeout(later); later = setTimeout(() => readFeed(true), 1500); };
    const onVis = () => { if (!document.hidden) readFeed(); };
    window.addEventListener(REVIEW_EVENT, onNew);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      subscribers.delete(apply);
      clearTimeout(later);
      window.removeEventListener(REVIEW_EVENT, onNew);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);
  return { reviews: mergeReviews(live, own, BASE), status };
}

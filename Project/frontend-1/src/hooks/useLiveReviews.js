import { useEffect, useState } from 'react';
import { REVIEW_EVENT, mergeReviews, normalizeReview, ownReviews, publicName } from '../utils/reviews.js';
import { TESTIMONIALS } from '../data/community.js';
import { SUPPLIED_TESTIMONIALS } from '../data/testimonialsSupplied.js';
import { API_BASE, DEMO_MODE } from '../data/site.js';


const FEED = import.meta.env.VITE_REVIEWS_FEED_URL || `${API_BASE}/api/v1/testimonial`;
const FALLBACK = '/data/reviews.json';
const POLL_MS = 30000;

const BASE = [...TESTIMONIALS, ...SUPPLIED_TESTIMONIALS.filter((t) => t.publish || DEMO_MODE).map((t) => (t.publish ? t : { ...t, preview: true }))].map(normalizeReview).filter(Boolean);


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
  const [live, setLive] = useState([]);
  const [own, setOwn] = useState([]);
  const [status, setStatus] = useState('static'); // static | live
  useEffect(() => {
    setOwn(ownReviews());
    let alive = true;
    let url = FEED;
    const load = async () => {
      if (document.hidden) return;
      try {
        const list = await fetchFeed(url);
        if (!alive) return;
        setLive(list);
        setStatus(url === FALLBACK || DEMO_MODE ? 'static' : 'live');
      } catch {
        if (url !== FALLBACK) { url = FALLBACK; load(); }
      }
    };
    load();
    const t = setInterval(load, POLL_MS);
    const onNew = () => { setOwn(ownReviews()); setTimeout(load, 1500); };
    const onVis = () => { if (!document.hidden) load(); };
    window.addEventListener(REVIEW_EVENT, onNew);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener(REVIEW_EVENT, onNew);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);
  return { reviews: mergeReviews(live, own, BASE), status };
}

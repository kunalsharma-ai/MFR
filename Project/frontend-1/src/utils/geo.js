// src/utils/geo.js
// Best-effort IP -> country (ISO-2, lowercase). Never throws, never blocks signup.
// Uses the same backend endpoint as the MHO app's telemetry.ip(): GET /api/v1/get-country -> { country }.
// Override with VITE_GEO_ENDPOINT if needed.
import { API_BASE, DEMO_MODE } from '../data/site.js';
import { COUNTRIES } from '../data/countries.js';
import { countries as geoIndex } from '../teen/geo.js';

const GEO_ENDPOINT = import.meta.env.VITE_GEO_ENDPOINT || `${API_BASE}/api/v1/get-country`;
const CACHE_KEY = 'mfr.geo.country';
const TIMEOUT_MS = 4000;

function readCache() {
  try { return sessionStorage.getItem(CACHE_KEY) || ''; } catch { return ''; }
}
function writeCache(iso) {
  try { sessionStorage.setItem(CACHE_KEY, iso); } catch { /* storage blocked */ }
}

export async function detectCountry({ signal } = {}) {
  if (DEMO_MODE) return 'in'; // preview build: there is no backend to ask
  const cached = readCache();
  if (cached) return cached;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener('abort', onAbort, { once: true });

  try {
    const iso = await fromEndpoint(ctrl.signal) || await fromTimeZone();
    if (iso) writeCache(iso);
    return iso;
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

// The IP service has answered in more than one shape over time: { country: 'IN' }, { data: { country: 'India' } },
// { country_code }, { countryCode }, or the name of the country. Any of them is read here.
export function readCountry(json) {
  const d = json?.data && typeof json.data === 'object' ? json.data : {};
  const raw = [json?.country, json?.country_code, json?.countryCode, json?.iso, d.country, d.country_code, d.countryCode, d.iso, typeof json?.data === 'string' ? json.data : '', typeof json === 'string' ? json : '']
    .find((x) => typeof x === 'string' && x.trim()) || '';
  const t = raw.trim();
  if (/^[a-z]{2}$/i.test(t)) return t.toLowerCase();
  const byName = COUNTRIES.find((c) => c.name.toLowerCase() === t.toLowerCase());
  return byName ? byName.iso.toLowerCase() : '';
}

async function fromEndpoint(signal) {
  if (!GEO_ENDPOINT) return '';
  try {
    const res = await fetch(GEO_ENDPOINT, { signal, credentials: 'omit' });
    if (!res.ok) return '';
    const text = await res.text();
    let json = text;
    try { json = JSON.parse(text); } catch { /* plain text answer */ }
    return readCountry(json);
  } catch {
    return '';
  }
}

// When the IP service is down or blocked, the browser's time zone still says where most members are
// (Asia/Kolkata → India). public/data/geo/index.json lists each country's time zones.
const TZ_ALIAS = { 'Asia/Calcutta': 'Asia/Kolkata', 'Asia/Katmandu': 'Asia/Kathmandu', 'Asia/Saigon': 'Asia/Ho_Chi_Minh', 'Asia/Rangoon': 'Asia/Yangon', 'Europe/Kiev': 'Europe/Kyiv' };
// index.json keeps only the first few zones per country, so the busiest ones that fell off are listed here.
const TZ_EXTRA = {
  'America/New_York': 'us', 'America/Los_Angeles': 'us', 'America/Phoenix': 'us', 'America/Indiana/Indianapolis': 'us',
  'America/Toronto': 'ca', 'America/Vancouver': 'ca', 'America/Edmonton': 'ca', 'America/Winnipeg': 'ca', 'America/Halifax': 'ca',
  'Australia/Sydney': 'au', 'Australia/Melbourne': 'au', 'Australia/Perth': 'au', 'Australia/Hobart': 'au',
  'America/Sao_Paulo': 'br', 'America/Mexico_City': 'mx', 'Europe/Moscow': 'ru', 'Asia/Kolkata': 'in',
};
export async function fromTimeZone() {
  try {
    let tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    tz = TZ_ALIAS[tz] || tz;
    if (!tz || tz === 'UTC' || tz.startsWith('Etc/')) return '';
    if (TZ_EXTRA[tz]) return TZ_EXTRA[tz];
    const list = await geoIndex();
    const hit = list.find((c) => Array.isArray(c.tz) && (c.tz.includes(tz) || c.tz.some((z) => TZ_ALIAS[z] === tz)));
    return hit ? String(hit.i).toLowerCase() : '';
  } catch {
    return '';
  }
}
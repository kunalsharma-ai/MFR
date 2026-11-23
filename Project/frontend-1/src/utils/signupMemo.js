import { getData, patchJSON } from './api.js';
import { ME_API } from '../data/site.js';

const KEY = 'mfr.signup.v1';
const LINK_TTL = 24 * 60 * 60 * 1000;         // email link validity
const PENDING_TTL = 30 * 24 * 60 * 60 * 1000; // waiting for the first login

const load = () => {
  try {
    const now = Date.now();
    const all = JSON.parse(localStorage.getItem(KEY) || '{}');
    return Object.fromEntries(Object.entries(all).filter(([, e]) => e && e.exp > now));
  } catch {
    return {};
  }
};
const store = (all) => {
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* storage blocked */ }
};

// /sign-up: remember what the member chose, keyed by the user id the backend returned.
export function rememberSignup(userId, { memberType, firstName, mail, answers }) {
  if (!userId) return;
  const all = load();
  const waiting = answers && Object.keys(answers).length > 0;
  all[userId] = { memberType, firstName, ...(mail ? { mail } : {}), ...(waiting ? { answers } : {}), exp: Date.now() + (waiting ? PENDING_TTL : LINK_TTL) };
  store(all);
}

export const recallSignup = (userId) => load()[userId] || null;

// /auth/password: keep the step-4 answers until the member logs in (the answers API needs a session).
export function savePendingProfile(userId, answers) {
  if (!userId || !answers || !Object.keys(answers).length) return;
  const all = load();
all[userId] = { ...(all[userId] || {}), answers: { ...((all[userId] || {}).answers || {}), ...answers }, exp: Date.now() + PENDING_TTL };
  store(all);
}

// Is there a sign-up answers entry waiting for this member? (synchronous, no network)
export function hasPendingProfile(userId) {
  if (!userId) return false;
  const entry = load()[userId];
  return Boolean(entry && entry.answers && Object.keys(entry.answers).length);
}

// Uploads the waiting answers. Pass the member's id when it is already known, otherwise it is asked from /api/v1/me.
export async function flushPendingProfile(knownUserId) {
  try {
    const userId = knownUserId || (await getData(ME_API)).data?._id;
    const entry = userId ? load()[userId] : null;
    if (!entry?.answers) return false;
    try {
      await patchJSON(`${ME_API}/answer`, entry.answers);
    } catch (bulkErr) {
      // One answer the backend refuses must not throw the others away: retry them one by one.
      console.warn('[flush] bulk save failed, retrying one by one:', bulkErr);
      let saved = 0;
      for (const [k, val] of Object.entries(entry.answers)) {
        try { await patchJSON(`${ME_API}/answer`, { [k]: val }); saved += 1; } catch (e) { console.warn('[flush] answer not saved:', k, e); }
      }
      if (!saved) throw bulkErr;
    }
    const all = load();
    delete all[userId];
    store(all);
    return true;
  } catch (e) {
    console.warn('[flush] failed:', e);
    return false;
  }
}
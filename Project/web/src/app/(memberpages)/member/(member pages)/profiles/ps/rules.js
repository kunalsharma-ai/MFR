// Reward points ("Prize Machine"): POINTS_PER_PROFILE points for every completed profile, 1,000 points = 1 USD.
//
// DATA COMES FROM THE DATABASE: when a profile is completed the API pays its points once and stores the reward on the member
// (User.profileRewards); GET /api/v1/me/points returns that list. Only if the API does not send it (not updated yet) the capsules
// are worked out from each profile's completion % (status >= 100) instead.
// Only the *show* state lives in this browser: which capsules were already dispensed (seen) and which +points already
// landed on the counter (paid), so the animation plays once per profile and never replays for earlier ones.
export let POINTS_PER_PROFILE = 50; // what the API says (pointsPerProfile in GET /api/v1/me/points) replaces this
export const POINTS_PER_USD = 1000;
/** Arcade ranks, at this share of a category's profiles collected. */
export const RANK_SHARE = [0, 0.2, 0.45, 0.7, 1];
export const RANK_KEYS = ['rw.rank0', 'rw.rank1', 'rw.rank2', 'rw.rank3', 'rw.rank4'];

const subs = new Set();
let ver = 0;
export const subscribeRewards = (f) => (subs.add(f), () => subs.delete(f));
export const rewardsVersion = () => ver;
export function emitRewards() { ver++; subs.forEach((f) => f()); }

let D = { uid: 'anon', profiles: [], rewarded: new Set(), total: 0, profilePts: 0 };
const key = (p) => p.c + ':' + p.s;
export const pKey = key;
const store = {
  get(name) { try { return JSON.parse(localStorage.getItem(name)); } catch { return null; } },
  set(name, v) { try { localStorage.setItem(name, JSON.stringify(v)); } catch { /* storage blocked */ } },
};
const sname = (n) => `mfr:rw:${D.uid}:${n}`;
const list = (n) => store.get(sname(n)) || [];
function add(n, k) { const l = list(n); if (l.includes(k)) return; store.set(sname(n), [...l, k]); emitRewards(); }

/**
 * profiles: [{ slug, name, status }] from the EXISTING POST /api/v1/profile (status = completion % computed by the backend).
 * No backend change: a profile with status >= 100 is a collected capsule and is worth 100 points. First time on this
 * browser, profiles that are already complete count as collected and paid (no replay); only profiles completed from now on
 * play the capsule show.
 */
export function setRewardData({ uid, cat, profiles, completed, points }) {
  const list = profiles || []; // the profiles listed on the page = the capsules in the machine
  if (points && Number(points.pointsPerProfile) > 0) POINTS_PER_PROFILE = Number(points.pointsPerProfile);
  // the rewards the database holds; without them: every completed profile (also one that is not listed right now)
  const fromDb = points && Array.isArray(points.profileRewards) ? points.profileRewards.map((r) => r.profile) : null;
  const rewarded = new Set(fromDb || (completed || list).filter((p) => Number(p.status) >= 100).map((p) => p.slug));
  const pts = fromDb && Number.isFinite(Number(points.profilePoints)) ? Number(points.profilePoints) : rewarded.size * POINTS_PER_PROFILE;
  D = { uid: uid || 'anon', profiles: list.map((p) => ({ c: cat, s: p.slug, q: 0 })), rewarded, total: pts, profilePts: pts };
  if (list.length) {
    const keys = [...rewarded].map((s) => cat + ':' + s);
    for (const n of ['seen', 'paid']) if (store.get(sname(n)) == null) store.set(sname(n), keys);
  }
  emitRewards();
}
export const catProfiles = () => D.profiles;
export const isDone = (p) => D.rewarded.has(p.s);
export const doneKeys = () => D.profiles.filter(isDone).map(key);
export const totalPoints = () => D.total;
export const isSeen = (k) => list('seen').includes(k);
export const isPaid = (k) => list('paid').includes(k);
export const markPaid = (k) => add('paid', k);
export const markSeen = (k) => { add('paid', k); add('seen', k); };
/** completed profiles whose capsule has not been dispensed on the hub yet */
export const pendingKeys = () => D.profiles.filter((p) => isDone(p) && !isSeen(key(p))).map(key);
/** points already shown in the counter: everything that is not a profile reward + the +100s that have landed */
export const paidPoints = () => Math.max(0, D.total - D.profiles.filter((p) => isDone(p) && !isPaid(key(p))).length * POINTS_PER_PROFILE);

const usdF = new Map();
/** 1200 -> "$1.20" */
export function fmtUsd(points, lang = 'en') {
  let f = usdF.get(lang);
  if (!f) { try { f = new Intl.NumberFormat(lang, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }); } catch { f = new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' }); } usdF.set(lang, f); }
  return f.format(points / POINTS_PER_USD);
}
export function rankOf(n, total) {
  const steps = RANK_SHARE.map((f) => Math.ceil(total * f));
  let i = 0;
  steps.forEach((v, k) => { if (n >= v) i = k; });
  return { i, steps, next: i < 4 ? steps[i + 1] : null };
}

// Reward points ("Prize Machine"): 100 points for every completed profile, 1,000 points = 1 USD.
//
// DATA COMES FROM THE DATABASE through the existing profile API: a profile's completion % (status) decides whether its
// capsule is collected (100) and the points are 100 per collected capsule. Nothing is written to the backend.
// Only the *show* state lives in this browser: which capsules were already dispensed (seen) and which +100 already
// landed on the counter (paid), so the animation plays once per profile and never replays for earlier ones.
export const POINTS_PER_PROFILE = 100;
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
export function setRewardData({ uid, cat, profiles }) {
  const list = profiles || [];
  const rewarded = new Set(list.filter((p) => Number(p.status) >= 100).map((p) => p.slug));
  D = {
    uid: uid || 'anon',
    profiles: list.map((p) => ({ c: cat, s: p.slug, q: 0 })),
    rewarded,
    total: rewarded.size * POINTS_PER_PROFILE,
    profilePts: rewarded.size * POINTS_PER_PROFILE,
  };
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
export const paidPoints = () => Math.max(0, D.total - D.profilePts) + D.profiles.filter((p) => isDone(p) && isPaid(key(p))).length * POINTS_PER_PROFILE;

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

// Profile completeness score (separate from the fraud / trust score).
import { store } from '../lib/storage.js';

// weights from the panel policy: Identity 15, Contact verification 20, Geography 15, Demographics 20,
// Employment/B2B 15, Household 10, Preferences 5
export const AREAS = [
  { id: 'identity', w: 15, fields: ['firstname', 'lastname', 'dob', 'gender'] },
  { id: 'contact', w: 20, verify: ['email', 'phone'] },
  { id: 'geography', w: 15, fields: ['country', 'state', 'city', 'zipcode'] },
  { id: 'demographics', w: 20, profiles: ['basic', 'educational', 'financial'] },
  { id: 'employment', w: 15, profiles: ['professional'] },
  { id: 'household', w: 10, profiles: ['home-pet', 'parenting', 'home-household'] },
  { id: 'preferences', w: 5, profiles: ['additional', 'shopping', 'lifestyle-food', 'travel', 'tech', 'research-panel'] }
];

export function mergedAnswers(cat = 'b2c') {
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`t2oa:${cat}:`)) Object.assign(out, store.get(k)?.a || {});
    }
  } catch { /* storage blocked */ }
  return out;
}

export function completeness(cat = 'b2c') {
  const A = mergedAnswers(cat);
  const verified = store.get('mfr:verified', {});
  const done = (slug) => !!store.get(`t2oa:${cat}:${slug}`);
  let total = 0;
  const parts = AREAS.map((a) => {
    let r = 0;
    if (a.fields) r = a.fields.filter((f) => A[f] != null && A[f] !== '').length / a.fields.length;
    else if (a.verify) r = a.verify.filter((v) => verified[v]).length / a.verify.length;
    else r = a.profiles.filter(done).length / a.profiles.length;
    total += r * a.w;
    return { ...a, pct: Math.round(r * 100) };
  });
  return { pct: Math.round(total), parts };
}

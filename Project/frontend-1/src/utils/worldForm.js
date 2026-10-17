
import { loadOptions } from './worldOptions.js';
import { staticLists } from '../data/employmentProfile.js';

// Display order (a parent always comes before its children).
export const WORLD_FIELDS = ['empstat', 'hw', 'freelancer', 'jobseeker', 'industry', 'sector', 'department', 'jobrole'];
export const MULTI_FIELDS = ['hw']; // answers are lists
const PARENT = { hw: 'empstat', freelancer: 'empstat', jobseeker: 'empstat', industry: 'empstat', sector: 'industry', department: 'sector', jobrole: 'department' };

// Questions that only exist for one employment status. Used ONLY if the backend options carry no parentValue at all.
const ONLY_FOR = { hw: ['homemaker'], freelancer: ['Freelancer'], jobseeker: ['Unemployed'] };
// Options that must never be offered (the "Student" status is not asked here).
const HIDDEN = { empstat: /student/i };
// The built-in fallback lists do not cover these.
const NOT_IN_FALLBACK = new Set(['hw', 'freelancer', 'jobseeker']);

const asList = (x) => (Array.isArray(x) ? x : x ? [x] : []);
const isDone = (v, f) => asList(v[f]).length > 0;
const isConditional = (f) => Object.prototype.hasOwnProperty.call(ONLY_FOR, f);

export const applicable = (list, v, field) => {
  const parent = PARENT[field];
  if (!parent) return list; // empstat: everything
  const chosen = asList(v[parent]);
  if (!chosen.length) return [];
  const declared = list.some((o) => o.parentValue.length);
  if (declared) return list.filter((o) => (o.parentValue.length ? o.parentValue.some((p) => chosen.includes(p)) : !isConditional(field)));
  if (isConditional(field)) return ONLY_FOR[field].some((s) => chosen.includes(s)) ? list : [];
  return list;
};

const byLabel = (a, b) => a.label.localeCompare(b.label);

// Loads the options of the given questions in parallel → { empstat: [...], ... } (an empty list when a request fails).
export async function loadWorldOptions(fields) {
  const lists = await Promise.all(fields.map((f) => loadOptions(f)));
  return Object.fromEntries(fields.map((f, i) => [f, lists[i].filter((o) => !(HIDDEN[fields[i]] && (HIDDEN[fields[i]].test(o.value) || HIDDEN[fields[i]].test(o.label)))).sort(byLabel)]));
}

// lists  → what each dropdown offers right now
// ready  → can the member answer it yet (its parent question is answered or does not apply)
// na     → questions that do not apply to this member (hidden, not required)
export function worldModel(mode, opts, v) {
  const lists = mode === 'static' ? staticLists(v) : Object.fromEntries(WORLD_FIELDS.map((f) => [f, opts[f] ? applicable(opts[f], v, f) : []]));
  const ready = {};
  const na = [];
  WORLD_FIELDS.forEach((f) => {
    const parent = PARENT[f];
    ready[f] = mode !== 'loading' && (!parent || isDone(v, parent) || na.includes(parent));
    const loaded = mode === 'static' || Boolean(opts[f]);
    const notApplicable = mode === 'static' ? NOT_IN_FALLBACK.has(f) : f !== 'empstat' && ready[f] && loaded && lists[f].length === 0;
    if (notApplicable) na.push(f);
  });
  return { lists, ready, na };
}

// Changing an answer clears the answers that depend on it (their choices may no longer apply).
export function clearBelow(v, field) {
  const next = { ...v };
  const below = (f) => WORLD_FIELDS.filter((x) => PARENT[x] === f).flatMap((x) => [x, ...below(x)]);
  below(field).forEach((f) => { next[f] = MULTI_FIELDS.includes(f) ? [] : ''; });
  if (field !== 'jobrole') next.jobTitleOther = '';
  return next;
}

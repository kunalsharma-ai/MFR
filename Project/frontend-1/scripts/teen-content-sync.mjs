// Copies the Teen registration content the SERVER must enforce into api/app/teen/content.json, so the browser and
// the API can never drift apart: consent versions and the exact statement texts (recorded with every consent), the
// guardian onboarding questions (keys, required flags, allowed values) and the welcome-survey keys.
//
//   node scripts/teen-content-sync.mjs           (run after editing anything in src/teen/data)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PARENT_SURVEY } from '../src/teen/data/parentSurvey.js';
import { TERMS_VERSION, EFFECTIVE, SELECTIONS, DECLARATION, EN } from '../src/teen/data/consent.js';
import { TEEN_CONSENT } from '../src/teen/data/teenConsent.js';
import { MINOR_PROFILES } from '../src/teen/data/teenProfiles.js';
import { WELCOME_KEYS, KNOWN_KEYS } from '../src/teen/data/welcome.js';
import { LANGUAGES } from '../src/teen/data/surveyLanguages.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../../api/app/teen/content.json');

const questions = [];
PARENT_SURVEY.sections.forEach((s) => s.qs.forEach((q) => {
  const values = q.o ? q.o.map((o) => o[1]) : null;
  questions.push({
    n: q.n,
    kind: q.kind || 'choice',
    req: Boolean(q.req),
    multi: Boolean(q.multi),
    ...(values ? { values } : {}),
    ...(q.exclusive ? { exclusive: q.exclusive } : {}),
    ...(q.other ? { other: q.other } : {}),
    ...(q.fields ? { fields: q.fields } : {}),
    ...(q.gate ? { gate: true } : {}),
    section: s.name,
    optional: Boolean(s.optional),
    ...(s.intro ? { health: true } : {}),
    ...(q.profile ? { profile: true } : {}),
    // display only (the Teen profile's "What your parent told us" cards show the exact wording the parent saw)
    q: q.q,
    ...(q.o ? { labels: Object.fromEntries(q.o.map((o) => [o[1], o[0]])) } : {}),
  });
}));

// every teen profile question key with its allowed values (the profile section and welcome survey save into these)
const profileKeys = {};
MINOR_PROFILES.forEach((p) => p.sections.forEach((s) => s.qs.forEach((q) => {
  profileKeys[q.n] = { kind: q.kind || 'choice', multi: Boolean(q.multi), ...(q.o ? { values: q.o.map((o) => o[1]) } : {}), ...(q.other ? { other: q.other } : {}), profile: p.id };
})));

const data = {
  generated: 'scripts/teen-content-sync.mjs — do not edit by hand',
  teenConsent: {
    version: TEEN_CONSENT.version,
    agreement: TEEN_CONSENT.agreement,
    items: TEEN_CONSENT.items.map(({ id, required, text, source }) => ({ id, required, text, source })),
    assentPoints: TEEN_CONSENT.assentPoints,
  },
  guardianConsent: {
    version: TERMS_VERSION,
    effective: EFFECTIVE,
    declaration: DECLARATION,
    selections: SELECTIONS.map((s) => ({ id: s.id, required: s.required, title: EN[`c_${s.id}_k`], text: EN[`c_${s.id}`] })),
  },
  parentSurvey: { id: PARENT_SURVEY.id, questions },
  welcome: { keys: WELCOME_KEYS, known: KNOWN_KEYS },
  profileKeys,
};
writeFileSync(out, `${JSON.stringify(data, null, 1)}\n`);

// The same bank for the member-hub Profiles page (Mongo Question / Option / Profile, category b2c-minor), loaded by
// api/scripts/teen-bank-2026-11/sync.mjs. Question names are the lower-case keys, which is also how the teen API
// stores answers. Not in the hub: date of birth, country and region (taken at registration, D01-D03) and the time
// zone (D10, welcome survey only). A show-when rule becomes the hub's parent + option parentValue: the child is
// offered for every parent answer that makes the rule true.
const HUB_SKIP = new Set(['dob', 'country', 'region', 'timezone']);
const bankQs = new Map();
MINOR_PROFILES.forEach((p) => p.sections.forEach((s) => s.qs.forEach((q) => bankQs.set(q.n, q))));
const optsOf = (q) => (q.kind === 'language' ? LANGUAGES.map((l) => [l.native === l.name ? l.name : `${l.name} (${l.native})`, l.code]) : (q.o || []));
function showWhen(q) {
  if (!q.when) return {};
  const keys = [...new Set((q.when.toString().match(/a\.([A-Za-z0-9_]+)/g) || []).map((m) => m.slice(2)))];
  const parent = bankQs.get(keys[0]);
  if (keys.length !== 1 || !parent || !parent.o) throw new Error(`teen bank: ${q.n} show-when cannot be expressed in the hub`);
  const values = parent.o.map((o) => o[1]).filter((v) => q.when({ [parent.n]: parent.multi ? [v] : v }));
  return { parent: parent.n.toLowerCase(), parentValue: values };
}
const hub = {
  generated: 'frontend-1/scripts/teen-content-sync.mjs from src/teen/data/teenProfiles.js - do not edit by hand',
  category: 'b2c-minor',
  // every teen key (also the ones not shown in the hub), for renaming answers saved under the upper-case key
  allKeys: [...bankQs.keys()].map((k) => k.toLowerCase()),
  profiles: MINOR_PROFILES.map((p, i) => ({
    slug: p.id.replace(/^minor__/, 'teen-'),
    name: p.name,
    icon: p.icon,
    sortOrder: i + 1,
    questions: p.sections.flatMap((s) => s.qs).filter((q) => !HUB_SKIP.has(q.kind)).map((q) => {
      const sw = showWhen(q);
      return {
        name: q.n.toLowerCase(),
        label: q.q,
        type: q.kind === 'textarea' ? 'textarea' : q.multi ? 'multiselect' : 'select',
        ...(sw.parent ? { parent: sw.parent } : {}),
        isRequired: Boolean(q.req),
        ...(q.by ? { answeredBy: q.by } : {}),
        options: optsOf(q).map(([label, value], k) => ({
          label, value, sortOrder: k + 1,
          isExclusive: (q.exclusive || []).includes(value),
          parentValue: sw.parentValue || [],
        })),
      };
    }),
  })),
};
const hubOut = path.resolve(here, '../../api/scripts/teen-bank-2026-11/bank.json');
writeFileSync(hubOut, `${JSON.stringify(hub, null, 1)}\n`);
console.log(`teen bank for the member hub → ${path.relative(process.cwd(), hubOut)} (${hub.profiles.length} profiles, ${hub.profiles.reduce((n, p) => n + p.questions.length, 0)} questions)`);
console.log(`teen content → ${path.relative(process.cwd(), out)} (${questions.length} onboarding questions, ${Object.keys(profileKeys).length} profile keys)`);

// the validation rules are written once, in the API, and copied here so the pages check exactly what the server checks
const rulesSrc = path.resolve(here, '../../api/app/teen/rules.js');
const rulesOut = path.resolve(here, '../src/teen/rules.js');
writeFileSync(rulesOut, `// COPIED from api/app/teen/rules.js by scripts/teen-content-sync.mjs - edit the API file, then run the script.\n${readFileSync(rulesSrc, 'utf-8')}`);
console.log('teen rules → src/teen/rules.js');

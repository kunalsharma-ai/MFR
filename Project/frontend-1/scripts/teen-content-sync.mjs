// Copies the Teen registration content the SERVER must enforce into api/app/teen/content.json, so the browser and
// the API can never drift apart: consent versions and the exact statement texts (recorded with every consent), the
// guardian onboarding questions (keys, required flags, allowed values) and the welcome-survey keys.
//
//   node scripts/teen-content-sync.mjs           (run after editing anything in src/teen/data)
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PARENT_SURVEY } from '../src/teen/data/parentSurvey.js';
import { TERMS_VERSION, EFFECTIVE, SELECTIONS, DECLARATION, EN } from '../src/teen/data/consent.js';
import { TEEN_CONSENT } from '../src/teen/data/teenConsent.js';
import { MINOR_PROFILES } from '../src/teen/data/teenProfiles.js';
import { WELCOME_KEYS, KNOWN_KEYS } from '../src/teen/data/welcome.js';

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
console.log(`teen content → ${path.relative(process.cwd(), out)} (${questions.length} onboarding questions, ${Object.keys(profileKeys).length} profile keys)`);

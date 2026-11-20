// Teen panel registration (ages MIN_SIGNUP_AGE to 17): validation, payload and the API hook.
//
// BACKEND NEEDED (not part of this repo, and not built yet):
//   POST {VITE_TEEN_ENDPOINT || /api/v1/user/teen}         body = buildTeenPayload(...)
//     • creates the teen as a consumer member in a "pending parent consent" state (no surveys until consent)
//     • emails the parent onboarding form (16 questions, consent) to guardian.mail
//     • emails the teen a short "we've asked your parent" note
//   POST {endpoint}/resend   body = { mail: guardian.mail }   re-sends the parent onboarding email
// Until that exists the live site answers "This service is not available right now", and the preview
// build (DEMO_MODE) simulates success so the flow can be reviewed.
import { MIN_SIGNUP_AGE } from '../data/site.js';
import { ADULT_AGE, EMAIL_RE, GENDERS, ageFromDob, isDisposable, validateDob, validatePhone } from './validate.js';
import { postJSON } from './api.js';

export const TEEN_API = import.meta.env.VITE_TEEN_ENDPOINT || '/api/v1/user/teen';
export const CONSENT_VERSION = 'teen-panel-v1';

const NAME_RE = /^[\p{L}][\p{L}\s.'-]{1,39}$/u;
const FULL_NAME_RE = /^[\p{L}][\p{L}\s.'-]{2,79}$/u;
const digits = (s = '') => String(s).replace(/\D/g, '');

export const GUARDIANS = [
  { k: 'mother', t: 'Mother', d: 'My mum fills in the parent form', ic: 'heart', c: '#FF3B8D', gender: 'Female' },
  { k: 'father', t: 'Father', d: 'My dad fills in the parent form', ic: 'user', c: '#2F6BFF', gender: 'Male' },
  { k: 'legal_guardian', t: 'Legal guardian', d: 'Another adult who is legally responsible for me', ic: 'shield', c: '#14C9B5', gender: '' },
];

export const isTeenAge = (iso) => {
  const a = ageFromDob(iso);
  return Number.isFinite(a) && a >= MIN_SIGNUP_AGE && a < ADULT_AGE;
};

// Step "You": the teen's own email and gender.
export function validateTeen(t) {
  const e = {};
  const em = (t.email || '').trim();
  if (!EMAIL_RE.test(em)) e.email = 'Enter a valid email address.';
  else if (isDisposable(em)) e.email = 'Temporary email addresses are not accepted.';
  if (!GENDERS.includes(t.gender)) e.gender = 'Select your gender.';
  return e;
}

// Step "Your guardian". Phone and gender are asked for a legal guardian only (a mother / father implies the gender).
export function validateGuardian(g, teenEmail = '') {
  const e = {};
  if (!g.relation) e.relation = 'Choose who your parent or guardian is.';
  if (!FULL_NAME_RE.test((g.name || '').trim()) || (g.name || '').trim().split(/\s+/).length < 2)
    e.name = 'Enter their full name (first and last name).';
  const dobErr = validateDob(g.dob, ADULT_AGE);
  if (!g.dob) e.dob = 'Pick their date of birth.';
  else if (dobErr) e.dob = dobErr.replace(/You must be at least (\d+) to join\./, 'A parent or guardian must be $1 or older.').replace('Your date', 'Their date');
  const em = (g.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(em)) e.email = 'Enter a valid email address.';
  else if (isDisposable(em)) e.email = 'Temporary email addresses are not accepted.';
  else if (em === String(teenEmail).trim().toLowerCase()) e.email = 'Use your parent’s own email, not yours.';
  if (g.relation === 'legal_guardian') {
    if (!GENDERS.includes(g.gender)) e.gender = 'Select their gender.';
    const ph = validatePhone(g.phoneIso, g.phone);
    if (ph) e.phone = ph;
  }
  if (!g.captchaOk) e.captcha = 'Complete the security check.';
  if (!g.agree) e.agree = 'Please confirm this before we contact your parent.';
  return e;
}

export const teenLastNameError = (last = '') => (last.trim() && !NAME_RE.test(last.trim()) ? 'Use letters only.' : '');

export function buildTeenPayload(teen, guardian, { categories, dial = '', timezone = 'UTC', referredBy = '' }) {
  const rel = GUARDIANS.find((x) => x.k === guardian.relation);
  const payload = {
    panel: 'teen',
    category: categories.consumer,
    teen: {
      name: { first: teen.firstName.trim(), last: (teen.lastName || '').trim() },
      dob: teen.dob,
      gender: teen.gender,
      mail: teen.email.trim().toLowerCase(),
      address: [{ tag: 'home', country: String(teen.country || '').toLowerCase() }],
      timezone,
    },
    guardian: {
      relation: guardian.relation,
      name: guardian.name.trim().replace(/\s+/g, ' '),
      dob: guardian.dob,
      gender: guardian.relation === 'legal_guardian' ? guardian.gender : rel?.gender,
      mail: guardian.email.trim().toLowerCase(),
      ...(guardian.relation === 'legal_guardian' ? { phone: digits(dial) + digits(guardian.phone) } : {}),
    },
    consent: { version: CONSENT_VERSION, teenConfirmedGuardianKnows: true, at: new Date().toISOString() },
  };
  if (referredBy) payload.referredBy = referredBy;
  return payload;
}

export const submitTeenRegistration = (payload) => postJSON(TEEN_API, payload);
export const resendGuardianInvite = (mail) => postJSON(`${TEEN_API}/resend`, { mail });

// "kunal@example.com" → "ku•••@example.com"
export function maskEmail(m = '') {
  const [u, d] = String(m).split('@');
  if (!d) return m;
  return `${u.slice(0, 2)}${'•'.repeat(Math.max(2, Math.min(5, u.length - 2)))}@${d}`;
}

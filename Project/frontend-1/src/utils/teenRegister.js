// Teen panel registration (ages MIN_SIGNUP_AGE to TEEN_MAX_AGE): validation, payload and the API hook.
//
// The payload mirrors the EXISTING user model (api/app/model/User.js): the teen's own fields are the same as a
// consumer registration, and the parent/guardian goes in the model's existing `parent` sub-document
// (email, name.first/middle/last, relation, consent). See docs/teen-panel-backend.md for the smallest backend
// change needed (pending status, `legal_guardian` relation, parent dob/phone/gender, the parent onboarding email).
//
//   POST {VITE_TEEN_ENDPOINT || /api/v1/user/teen}   body = buildTeenPayload(...)
//   POST {endpoint}/resend                           body = { mail: <guardian email> }
// Until that exists the live site answers "This service is not available right now", and the preview
// build (DEMO_MODE) simulates success so the flow can be reviewed.
import { MIN_SIGNUP_AGE, USER_API } from '../data/site.js';
import { ADULT_AGE, EMAIL_RE, GENDERS, ageFromDob, isDisposable, validateDob, validatePhone } from './teenValidate.js';
import { postJSON } from './api.js';

export const TEEN_MAX_AGE = ADULT_AGE - 1;
export const TEEN_API = import.meta.env.VITE_TEEN_ENDPOINT || `${USER_API}/teen`;
export const CONSENT_VERSION = 'teen-panel-v1';

const NAME_RE = /^[\p{L}][\p{L}\s.'-]{1,39}$/u;
const digits = (s = '') => String(s).replace(/\D/g, '');

export const GUARDIANS = [
  { k: 'mother', t: 'Mother', d: 'My mum fills in the parent form', ic: 'heart', c: '#FF3B8D', gender: 'Female' },
  { k: 'father', t: 'Father', d: 'My dad fills in the parent form', ic: 'user', c: '#2F6BFF', gender: 'Male' },
  { k: 'legal_guardian', t: 'Legal guardian', d: 'Another adult who is legally responsible for me', ic: 'shield', c: '#14C9B5', gender: '' },
];

export const isTeenAge = (iso) => {
  const a = ageFromDob(iso);
  return Number.isFinite(a) && a >= MIN_SIGNUP_AGE && a <= TEEN_MAX_AGE;
};

// Step "Parent / guardian". Gender is asked for a legal guardian only (a mother / father implies it).
export function validateGuardian(g, teenEmail = '') {
  const e = {};
  if (!g.relation) e.relation = 'Choose who your parent or guardian is.';
  if (!NAME_RE.test((g.first || '').trim())) e.first = 'Enter their first name (letters only).';
  if ((g.middle || '').trim() && !NAME_RE.test(g.middle.trim())) e.middle = 'Use letters only.';
  if ((g.last || '').trim() && !NAME_RE.test(g.last.trim())) e.last = 'Use letters only.';
  const dobErr = validateDob(g.dob, ADULT_AGE);
  if (!g.dob) e.dob = 'Pick their date of birth.';
  else if (dobErr) e.dob = dobErr.replace(/You must be at least (\d+) to join\./, 'A parent or guardian must be $1 or older.').replace('Your date', 'Their date');
  const em = (g.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(em)) e.email = 'Enter a valid email address.';
  else if (isDisposable(em)) e.email = 'Temporary email addresses are not accepted.';
  else if (em === String(teenEmail).trim().toLowerCase()) e.email = 'Use your parent’s own email, not yours.';
  const ph = validatePhone(g.phoneIso, g.phone);
  if (ph) e.phone = ph;
  if (g.relation === 'legal_guardian' && !GENDERS.includes(g.gender)) e.gender = 'Select their gender.';
  return e;
}

// Teen welcome questionnaire (Round 12): shown once, after the teen has set a password and logged in (TeenWelcome).
// Age-appropriate questions only; the answers are saved to the member's profile (PATCH /api/v1/me/answer).
export const TEEN_SCHOOL = ['Middle school', 'Secondary / high school', 'Pre-university / junior college', 'Not in school right now'];
export const TEEN_PROFILE_Q = [
  { k: 'interests', t: 'What are you into?', d: 'Pick all that fit.', opts: ['Gaming', 'Music', 'Sport & fitness', 'Fashion & style', 'Movies & series', 'Snacks & food', 'Tech & gadgets', 'Reading & comics', 'Art & design', 'Travel'] },
  { k: 'devices', t: 'Which devices do you use?', d: 'Your own or shared at home.', opts: ['Smartphone', 'Tablet', 'Laptop or PC', 'Games console', 'Smart speaker', 'Smartwatch'] },
  { k: 'entertainment', t: 'Where do you watch, listen and play?', d: 'Pick all that fit.', opts: ['Video platforms', 'Streaming services', 'Music streaming', 'Short-video apps', 'Mobile games', 'Console or PC games', 'Podcasts'] },
];
export function validateTeenWelcome(t) {
  const e = {};
  if (!TEEN_SCHOOL.includes(t.school)) e.school = 'Choose your school stage.';
  TEEN_PROFILE_Q.forEach((q) => { if (!(t[q.k] || []).length) e[q.k] = 'Pick at least one.'; });
  return e;
}
// Answer keys sent to PATCH /api/v1/me/answer.
export const teenWelcomeAnswers = (t) => ({
  teen_school: t.school,
  ...Object.fromEntries(TEEN_PROFILE_Q.map((q) => [`teen_${q.k}`, [...(t[q.k] || [])]])),
});

// Step "Consent": every box must be ticked by hand, plus the CAPTCHA.
export const CONSENT_BOXES = [
  { k: 'parentConsent', t: 'My parent or guardian knows I’m joining and agrees to review and sign the Parent Consent Form we email them.' },
  { k: 'participation', t: 'I understand I can only take part in age-appropriate research after my parent or guardian gives permission, and that either of us can stop at any time.' },
  { k: 'terms', t: 'I have read and accept the Terms and Conditions.', link: ['/terms', 'Terms and Conditions'] },
  { k: 'privacy', t: 'I have read and accept the Privacy Policy.', link: ['/privacy', 'Privacy Policy'] },
  { k: 'accurate', t: 'The details about me and my parent or guardian are true and accurate.' },
];
export function validateConsent(c) {
  const e = {};
  CONSENT_BOXES.forEach((b) => { if (!c[b.k]) e[b.k] = 'Please tick this box to continue.'; });
  if (!c.captchaOk) e.captcha = 'Type the security code to continue.';
  return e;
}

export function buildTeenPayload(teen, guardian, consent, { categories, dial = '', timezone = 'UTC', referredBy = '' }) {
  const rel = GUARDIANS.find((x) => x.k === guardian.relation);
  const name = (o) => ({
    first: o.first.trim(),
    ...(String(o.middle || '').trim() ? { middle: o.middle.trim() } : {}),
    last: String(o.last || '').trim(),
  });
  const payload = {
    panel: 'teen',
    status: 'parent_details_submitted',
    category: categories.consumer,
    name: {
      first: teen.firstName.trim(),
      ...(String(teen.middleName || '').trim() ? { middle: teen.middleName.trim() } : {}),
      last: String(teen.lastName || '').trim(),
    },
    gender: teen.gender,
    dob: teen.dob,
    mail: teen.email.trim().toLowerCase(),
    timezone,
    address: [{
      tag: 'home',
      country: String(teen.country || '').toLowerCase(),
      ...(String(teen.state || '').trim() ? { state: teen.state.trim() } : {}),
    }],
    parent: {
      email: guardian.email.trim().toLowerCase(),
      name: name(guardian),
      relation: guardian.relation,
      dob: guardian.dob,
      gender: guardian.relation === 'legal_guardian' ? guardian.gender : rel?.gender,
      phone: digits(dial) + digits(guardian.phone),
      consent: null, // given by the parent in the onboarding form, never by this submission
    },
    teenConsent: {
      version: CONSENT_VERSION,
      at: new Date().toISOString(),
      ...Object.fromEntries(CONSENT_BOXES.map((b) => [b.k, Boolean(consent[b.k])])),
    },
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

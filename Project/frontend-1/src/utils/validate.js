// Client-side validation helpers. The server MUST repeat every check (never trust the browser).
import { MIN_SIGNUP_AGE } from '../data/site.js';
import { PHONE_LENGTHS } from '../data/countries.js';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[\p{L}][\p{L}\s.'-]{1,39}$/u;
const FREE_MAIL = ['gmail.', 'yahoo.', 'hotmail.', 'outlook.', 'live.', 'icloud.', 'aol.', 'proton', 'rediffmail.', 'yandex.', 'mail.ru', 'gmx.'];
const DISPOSABLE = ['mailinator.', 'tempmail', '10minutemail', 'guerrillamail', 'yopmail.', 'trashmail', 'sharklasers.', 'getnada.', 'dispostable.', 'throwaway'];

export const ADULT_AGE = 18;
// Under 13: friendly, and nothing typed is sent or kept (the server refuses these birthdays too)
export const UNDER_MIN_MSG = 'Not quite yet! MyFrequentRewards starts at 13. We can’t create an account or keep any details before then — come back on your 13th birthday.';
export const TEEN_DOB_MSG = 'Under 18? Teens join through the Teen sign-up, with a parent’s OK.';
export const GENDERS = ['Male', 'Female', 'Other']; // values the backend accepts
export const isFreeMail = (e = '') => FREE_MAIL.some((d) => e.toLowerCase().split('@')[1]?.includes(d));
export const isDisposable = (e = '') => DISPOSABLE.some((d) => e.toLowerCase().split('@')[1]?.includes(d));

// Date of birth — stored as ISO "YYYY-MM-DD" (picked in the DobPicker calendar or typed DD/MM/YYYY).
export function parseDob(iso = '') {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null; // e.g. 31/02
  return { y, m: mo, d };
}
export function ageFromDob(iso, now = new Date()) {
  const b = parseDob(iso);
  if (!b) return NaN;
  let age = now.getFullYear() - b.y;
  const md = (now.getMonth() + 1) * 100 + now.getDate();
  if (md < b.m * 100 + b.d) age -= 1;
  return age;
}
export const isMinor = (iso) => Boolean(parseDob(iso)) && ageFromDob(iso) < ADULT_AGE;
export function validateDob(iso, min = MIN_SIGNUP_AGE, now = new Date()) {
  if (!iso) return 'Pick your date of birth.';
  const b = parseDob(iso);
  if (!b) return 'Enter a real date (DD/MM/YYYY).';
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  if (Date.UTC(b.y, b.m - 1, b.d) > today) return 'Your date of birth can’t be in the future.';
  const age = ageFromDob(iso, now);
  if (age > 110) return 'Please check the year.';
  if (age < min) return UNDER_MIN_MSG;
  return '';
}

export function passwordChecks(p = '') {
  return [
    { k: 'len', label: '8+ characters', ok: p.length >= 8 },
    { k: 'case', label: 'Upper & lower case', ok: /[a-z]/.test(p) && /[A-Z]/.test(p) },
    { k: 'num', label: 'A number', ok: /\d/.test(p) },
    { k: 'sym', label: 'A symbol', ok: /[^A-Za-z0-9]/.test(p) },
  ];
}
export function passwordScore(p = '') {
  return passwordChecks(p).filter((c) => c.ok).length;
}

export function validatePhone(iso, raw = '') {
  const digits = raw.replace(/\D/g, '');
  if (!iso) return 'Choose your country code.';
  if (!digits) return 'Please enter your mobile number.';
  const [min, max] = PHONE_LENGTHS[iso] || [6, 14];
  if (digits.length < min || digits.length > max) return min === max ? `Enter a ${min}-digit mobile number.` : `Enter ${min}–${max} digits.`;
  if (iso === 'IN' && !/^[6-9]/.test(digits)) return 'Indian mobile numbers start with 6, 7, 8 or 9.';
  if (/^(\d)\1+$/.test(digits)) return 'That number doesn’t look real.';
  return '';
}

// Field-level rules grouped by wizard step. Steps 1–2 are on /sign-up; steps 3–4 on /auth/password (the emailed link).
export const STEP_FIELDS = {
  1: ['memberType', 'firstName', 'lastName', 'gender', 'dob', 'country', 'state', 'city', 'zip'],
  2: ['email', 'phone','captcha', 'agreeTerms'],
  3: ['password', 'confirm'],
  4: ['empstat', 'hw', 'freelancer', 'jobseeker', 'industry', 'sector', 'department', 'jobrole', 'jobTitleOther', 'companyEmail'],
  
};

export function validateSignup(v) {
  const e = {};
  if (!v.memberType) e.memberType = 'Choose how you are joining.';
  if (!NAME_RE.test((v.firstName || '').trim())) e.firstName = 'Enter your first name (letters only).';
  if (!NAME_RE.test((v.lastName || '').trim())) e.lastName = 'Enter your last name (letters only).';
  if (!GENDERS.includes(v.gender)) e.gender = 'Select your gender.';
  const dobErr = validateDob(v.dob);
  if (dobErr) e.dob = dobErr;
  // Consumers and professionals are adults. Under-18s join through the Teen sign-up (a parent or guardian must agree).
  else if (ageFromDob(v.dob) < ADULT_AGE) e.dob = TEEN_DOB_MSG;
  if (!v.country) e.country = 'Select your country of residence.';
  const em = (v.email || '').trim();
  if (!EMAIL_RE.test(em)) e.email = 'Enter a valid email address.';
  else if (isDisposable(em)) e.email = 'Temporary email addresses are not accepted.';
  const ph = validatePhone(v.phoneIso, v.phone);
  if (ph) e.phone = ph;
  
  if (!v.captchaOk) e.captcha = 'Complete the security check.';
  if (!v.agreeTerms) e.agreeTerms = 'Accept the Terms of Use and Privacy Policy to continue.';
  return e;
}

// Step 3 ("Your world"), shown after the email is confirmed.
export function validateProfile(v) {
  const e = {};
  if (v.memberType === 'professional') {
    // `skip` = questions that do not apply to this member (the backend has no choices for them)
    const skip = new Set(v.skip || []);
    if (!v.empstat && !skip.has('empstat')) e.empstat = 'Select your employment status.';
    if (!(v.hw || []).length && !skip.has('hw')) e.hw = 'Pick at least one.';
    if (!v.freelancer && !skip.has('freelancer')) e.freelancer = 'Select your job profile.';
    if (!v.jobseeker && !skip.has('jobseeker')) e.jobseeker = 'Please choose Yes or No.';
    if (!v.industry && !skip.has('industry')) e.industry = 'Select your industry.';
    if (!v.sector && !skip.has('sector')) e.sector = 'Select your specialization.';
    if (!v.department && !skip.has('department')) e.department = 'Select your department.';
    if (!v.jobrole && !skip.has('jobrole')) e.jobrole = 'Select your job title.';
    else if (v.jobrole === 'Other' && (v.jobTitleOther || '').trim().length < 2) e.jobTitleOther = 'Type your job title.';
    const ce = (v.companyEmail || '').trim();
    if (ce && !EMAIL_RE.test(ce)) e.companyEmail = 'Enter a valid company email.';
    else if (ce && isFreeMail(ce)) e.companyEmail = 'Use your work domain, not a free email provider.';
  }
  return e;
}

// Step 4 ("Secure it"). The link carries no email address, so the "don't reuse your email" rule is not applied there.
export function validateNewPassword({ password = '', confirm = '' }) {
  const e = {};
  if (passwordScore(password) < 3 || password.length < 8) e.password = 'Use 8+ characters with upper & lower case and a number.';
  if (!confirm) e.confirm = 'Re-enter your password.';
  else if (confirm !== password) e.confirm = 'Passwords do not match.';
  return e;
}

export function validateContact(v) {
  const e = {};
  if ((v.name || '').trim().length < 2) e.name = 'Please enter your name.';
  if (!EMAIL_RE.test((v.email || '').trim())) e.email = 'Please enter a valid email address.';
  if (!v.topic) e.topic = 'Please choose a topic.';
  if ((v.message || '').trim().length < 15) e.message = 'Please write at least 15 characters.';
  if (!v.captchaOk) e.captcha = 'Please complete the security check.';
  return e;
}

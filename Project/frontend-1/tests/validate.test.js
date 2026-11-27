// Sign-up form rules (src/utils/validate.js). Test case ids refer to the MFR test case sheet.
import { describe, it, expect } from 'vitest';
import {
  GENDERS, parseDob, ageFromDob, validateDob, validatePhone, validateSignup, validateProfile,
  validateNewPassword, validateContact, passwordScore, isDisposable, isFreeMail, UNDER_MIN_MSG, TEEN_DOB_MSG,
} from '../src/utils/validate.js';

const NOW = new Date(2026, 10, 27); // 27 Nov 2026, local time
const yearsAgo = (n, dayShift = 0) => {
  const d = new Date(NOW.getFullYear() - n, NOW.getMonth(), NOW.getDate() + dayShift);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const adult = (over = {}) => ({
  memberType: 'consumer', firstName: 'Asha', middleName: '', lastName: 'Rao', gender: 'Female', dob: '1995-04-12',
  country: 'IN', email: 'asha@example.com', phoneIso: 'IN', phone: '9876543210', captchaOk: true, agreeTerms: true, ...over,
});

describe('gender (issue #88, PR #96)', () => {
  it('offers exactly Male, Female, Other', () => expect(GENDERS).toEqual(['Male', 'Female', 'Other']));
  it('refuses any other value', () => {
    for (const g of ['Non-binary', 'Prefer not to say', '', undefined]) expect(validateSignup(adult({ gender: g })).gender).toBeTruthy();
  });
});

describe('date of birth', () => {
  it('rejects impossible dates like 31/02', () => expect(parseDob('1990-02-31')).toBeNull());
  it('counts a birthday that is today', () => expect(ageFromDob(yearsAgo(18), NOW)).toBe(18));
  it('counts a birthday that is tomorrow as one year less', () => expect(ageFromDob(yearsAgo(18, 1), NOW)).toBe(17));
  it('refuses under 13 with the friendly message (REG: DOB under 13)', () => expect(validateDob(yearsAgo(12), 13, NOW)).toBe(UNDER_MIN_MSG));
  it('accepts exactly 13', () => expect(validateDob(yearsAgo(13), 13, NOW)).toBe(''));
  it('refuses a future date', () => expect(validateDob(yearsAgo(0, 1), 13, NOW)).toMatch(/future/));
  it('refuses an age over 110', () => expect(validateDob('1900-01-01', 13, NOW)).toMatch(/year/));
  it('asks for a date when empty', () => expect(validateDob('', 13, NOW)).toMatch(/Pick/));
});

describe('adult sign-up (validateSignup)', () => {
  it('a complete consumer form has no errors', () => expect(validateSignup(adult())).toEqual({}));
  it('sends 13-17 year olds to the Teen sign-up', () => expect(validateSignup(adult({ dob: '2011-01-01' })).dob).toBe(TEEN_DOB_MSG));
  it('middle name is optional, a single initial is fine, digits are not (issue #90)', () => {
    expect(validateSignup(adult({ middleName: '' })).middleName).toBeUndefined();
    expect(validateSignup(adult({ middleName: 'K' })).middleName).toBeUndefined();
    expect(validateSignup(adult({ middleName: 'K2' })).middleName).toBeTruthy();
  });
  it('names must be letters', () => {
    expect(validateSignup(adult({ firstName: 'J0hn' })).firstName).toBeTruthy();
    expect(validateSignup(adult({ lastName: '<b>' })).lastName).toBeTruthy();
  });
  it('refuses disposable email', () => {
    expect(isDisposable('x@mailinator.com')).toBe(true);
    expect(validateSignup(adult({ email: 'x@mailinator.com' })).email).toMatch(/Temporary/);
  });
  it('refuses a malformed email', () => expect(validateSignup(adult({ email: 'asha@' })).email).toBeTruthy());
  it('needs captcha, terms, member type and country', () => {
    const e = validateSignup(adult({ captchaOk: false, agreeTerms: false, memberType: '', country: '' }));
    expect(Object.keys(e).sort()).toEqual(['agreeTerms', 'captcha', 'country', 'memberType']);
  });
});

describe('phone', () => {
  it('needs a country code and a number', () => {
    expect(validatePhone('', '9876543210')).toBeTruthy();
    expect(validatePhone('IN', '')).toBeTruthy();
  });
  it('checks the length for the country', () => expect(validatePhone('IN', '98765')).toMatch(/10-digit/));
  it('Indian numbers start with 6-9', () => expect(validatePhone('IN', '5876543210')).toMatch(/6, 7, 8 or 9/));
  it('refuses repeated digits', () => expect(validatePhone('US', '1111111111')).toBeTruthy());
  it('accepts a real number', () => expect(validatePhone('IN', '98765 43210')).toBe(''));
});

describe('professional "Your world" step', () => {
  it('asks every professional question', () => {
    const e = validateProfile({ memberType: 'professional' });
    expect(Object.keys(e)).toEqual(expect.arrayContaining(['empstat', 'hw', 'freelancer', 'jobseeker', 'industry', 'sector', 'department', 'jobrole']));
  });
  it('skips questions the backend has no choices for', () => expect(validateProfile({ memberType: 'professional', skip: ['empstat', 'hw', 'freelancer', 'jobseeker', 'industry', 'sector', 'department', 'jobrole'] })).toEqual({}));
  it('job title Other needs typed text', () => expect(validateProfile({ memberType: 'professional', jobrole: 'Other', skip: ['empstat', 'hw', 'freelancer', 'jobseeker', 'industry', 'sector', 'department'] }).jobTitleOther).toBeTruthy());
  it('company email may not be a free mail domain', () => {
    expect(isFreeMail('me@gmail.com')).toBe(true);
    expect(validateProfile({ memberType: 'professional', companyEmail: 'me@gmail.com', skip: ['empstat', 'hw', 'freelancer', 'jobseeker', 'industry', 'sector', 'department', 'jobrole'] }).companyEmail).toMatch(/work domain/);
  });
  it('consumers have no step 3 questions', () => expect(validateProfile({ memberType: 'consumer' })).toEqual({}));
});

describe('password', () => {
  it('needs 8+ characters with upper, lower and a number', () => {
    for (const p of ['Short1', 'alllowercase1', 'ALLUPPER1', 'NoNumberHere']) expect(validateNewPassword({ password: p, confirm: p }).password).toBeTruthy();
    expect(validateNewPassword({ password: 'Good1Pass', confirm: 'Good1Pass' })).toEqual({});
  });
  it('confirm must match', () => expect(validateNewPassword({ password: 'Good1Pass', confirm: 'Good1Pasz' }).confirm).toMatch(/match/));
  it('scores each rule', () => expect(passwordScore('Aa1!aaaa')).toBe(4));
});

describe('contact form', () => {
  it('a complete message has no errors', () => expect(validateContact({ name: 'Ravi', email: 'r@example.com', topic: 'rewards', message: 'Where are my points please?', captchaOk: true })).toEqual({}));
  it('flags every missing field', () => expect(Object.keys(validateContact({ message: 'short' })).sort()).toEqual(['captcha', 'email', 'message', 'name', 'topic']));
});

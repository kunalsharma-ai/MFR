// Cross-profile consistency rules -> soft flags (never automatic rejection).
import { flag } from './result.js';
import { parseDob, ageOn } from './dob.js';
import { isFreeMail } from './email.js';
import { parsePhone } from './phone.js';
import { timezoneCountry } from './geo.js';

const num = (s) => { const m = String(s ?? '').match(/\d+/); return m ? +m[0] : null; };
const has = (v, re) => (Array.isArray(v) ? v : [v]).some((x) => re.test(String(x || '')));

/** @param {Record<string, any>} A merged answers from all profiles */
export function consistencyFlags(A, env = {}) {
  const f = [];
  let age = null;
  const d = parseDob(A.dob);
  if (d) age = ageOn(d);
  else if (num(A.age)) age = num(A.age);
  const residence = A['residence-country'] || A.country;
  if (age != null) {
    if (age < 30 && has(A.empstat, /retired/i)) f.push(flag('young_retired', -10, age));
    if (age < 21 && has(A.empstat, /full-time/i) && has(A.experience, /(1[0-9]|20|more than)/i)) f.push(flag('experience_exceeds_age', -10));
    const exp = num(A['years-experience'] ?? A.experience);
    if (exp != null && exp > age - 14) f.push(flag('experience_exceeds_age', -10, `${exp}y @ ${age}`));
    if (age < 22 && has(A.education, /doctor|ph\.?d|doctorate/i)) f.push(flag('education_vs_age', -5, age));
    if (age < 18 && (num(A.children) > 0 || has(A.havechild, /^yes/i))) f.push(flag('minor_with_children', -10));
    const gy = num(A['grad-year']);
    if (gy && d && gy < d.y + 14) f.push(flag('graduation_before_age_14', -10, gy));
    if (age < 20 && has(A['personal-income'], /(100,?000|lakh|crore|\+|above|more than)/i)) f.push(flag('income_vs_age', -3));
    const rv = num(A['residence-years']);
    if (rv && rv > age) f.push(flag('residence_years_exceed_age', -5));
  }
  if (has(A.student, /^yes/i) && has(A.jobrole, /\b(ceo|cfo|cto|coo|chief|president|managing director|vice president|vp)\b/i)) f.push(flag('student_c_level', -5));
  if (has(A.empstat, /unemployed|not working/i) && A.jobrole) f.push(flag('unemployed_with_job_title', -3));
  // geography
  const ph = A.phone && parsePhone(A.phone);
  if (ph && !ph.error && residence && ph.country !== residence) f.push(flag('phone_vs_residence', -5, `${ph.country}≠${residence}`));
  const tzc = timezoneCountry(env.timezone);
  if (tzc && residence && tzc !== residence) f.push(flag('timezone_vs_residence', -3, `${tzc}≠${residence}`));
  if (env.ipCountry && residence && env.ipCountry !== residence) f.push(flag('ip_vs_residence', -5, `${env.ipCountry}≠${residence}`));
  // B2B
  const wd = String(A.workemail || '').split('@')[1];
  if (wd && isFreeMail(wd) && has(A['job-seniority'] ?? A.jobrole, /c-level|chief|owner|director|vp|vice/i)) f.push(flag('senior_role_free_email', -3, wd));
  const site = String(A.orgwebsite || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  if (wd && site && !isFreeMail(wd) && !wd.endsWith(site) && !site.endsWith(wd)) f.push(flag('work_email_vs_company_site', -3, `${wd}≠${site}`));
  if (A.firstname && A.lastname && String(A.firstname).toLowerCase() === String(A.lastname).toLowerCase()) f.push(flag('first_equals_last', -5));
  return f;
}

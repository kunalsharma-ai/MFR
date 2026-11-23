// Browser client for /api/v1/teen (see api/app/routes/api/Teen.js).
// Errors come back as TeenApiError { code, fields, status } — pages show their own translated text for the code,
// never the server's raw message.
//
// Preview builds (VITE_DEMO_MODE=true) have no backend, so a small in-browser stand-in (demoServer below) plays the
// server's part with the SAME rules (rules.js) and the same statuses, saved in localStorage, and shows the emails it
// "sent" in the preview mailbox (TeenDemoMail). That makes the whole journey — teen, parent, password, welcome —
// clickable in the single preview file. It is never used on the live site.
import { API_BASE, DEMO_MODE } from '../data/site.js';
import * as R from './rules.js';
import { TEEN_CONSENT } from './data/teenConsent.js';
import { TERMS_VERSION, SELECTIONS } from './data/consent.js';
import { PARENT_SURVEY } from './data/parentSurvey.js';

export const TEEN_API = `${API_BASE}${import.meta.env.VITE_TEEN_API || '/api/v1/teen'}`;

export class TeenApiError extends Error {
  constructor(code, { status = 0, fields = {}, extra = {} } = {}) {
    super(code);
    this.code = code;
    this.status = status;
    this.fields = fields || {};
    this.extra = extra || {};
  }
}

async function http(method, path, body) {
  if (DEMO_MODE) return demoServer(method, path, body);
  let res;
  try {
    res = await fetch(`${TEEN_API}${path}`, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      referrerPolicy: 'no-referrer',
    });
  } catch {
    throw new TeenApiError('network');
  }
  let json = {};
  try { json = await res.json(); } catch { /* not JSON */ }
  if (res.ok && json.status === 'success') return json.data;
  const { code = res.status === 401 ? 'signin' : 'server', fields, status, message, ...extra } = json || {};
  throw new TeenApiError(code, { status: res.status, fields, extra });
}

export const teenApi = {
  ageCheck: (dob) => http('POST', '/age-check', { dob }),
  register: (body) => http('POST', '/register', body),
  status: (token) => http('GET', `/status/${encodeURIComponent(token)}`),
  resend: (body) => http('POST', '/resend', body),
  renew: (mail) => http('POST', '/renew', { mail }),
  guardian: (token) => http('GET', `/guardian/${encodeURIComponent(token)}`),
  decide: (token, body) => http('POST', `/guardian/${encodeURIComponent(token)}/decision`, body),
  onboarding: (token, answers, submit = false) => http('PUT', `/guardian/${encodeURIComponent(token)}/onboarding`, { answers, submit }),
  consent: (token, body) => http('POST', `/guardian/${encodeURIComponent(token)}/consent`, body),
  guardianRenew: (token) => http('POST', `/guardian/${encodeURIComponent(token)}/renew`, {}),
  passwordView: (token) => http('GET', `/password/${encodeURIComponent(token)}`),
  setPassword: (token, password, confirm) => http('POST', `/password/${encodeURIComponent(token)}`, { password, confirm }),
  me: () => http('GET', '/me'),
  saveAnswers: (answers, welcomeDone = false) => http('PUT', '/me/answers', { answers, welcomeDone }),
};

// ═════════════════════════════ preview-only stand-in ═════════════════════════════
const KEY = 'mfr.teen.demo.v1';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked */ } window.dispatchEvent(new Event('mfr:teen-demo')); };
const rnd = (n = 32) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'[b % 64]).join('');
const REL = { mother: 'Mother', father: 'Father', legal_guardian: 'Legal guardian' };
export const demoReset = () => { try { localStorage.removeItem(KEY); } catch { /* */ } window.dispatchEvent(new Event('mfr:teen-demo')); };
export const demoState = () => load();
const fail = (code, opts) => { throw new TeenApiError(code, opts); };

function mail(s, template, to, address, subject, data) {
  s.outbox = s.outbox || [];
  s.outbox.unshift({ id: rnd(8), template, to, address, subject, data, at: new Date().toISOString() });
}
const link = (p, t) => `${p}${p.includes('?') ? '&' : '?'}t=${t}`;

async function demoServer(method, path, body = {}) {
  await new Promise((r) => setTimeout(r, 450));
  const s = load();
  s.regs = s.regs || {};
  s.tokens = s.tokens || {};
  const parts = path.split('/').filter(Boolean);
  const tok = (purpose) => {
    const tk = decodeURIComponent(parts[1] || '');
    const rec = s.tokens[tk];
    if (!rec || rec.purpose !== purpose) fail('link_invalid', { status: 404 });
    if (rec.used) fail('link_used', { status: 410 });
    return [s.regs[rec.ref], rec, tk];
  };
  const move = (reg, to) => { reg.status = to; reg.history.push({ status: to, at: new Date().toISOString() }); };

  if (path === '/age-check') {
    const c = R.classifyDob(body.dob);
    return { route: ['invalid', 'future', 'implausible'].includes(c) ? 'invalid' : c, age: c === 'blocked' ? undefined : R.ageOn(body.dob) };
  }
  if (path === '/register') {
    const again = Object.values(s.regs).find((r) => r.key === body.idempotencyKey);
    if (again) return { reference: again.ref, status: again.status, guardianEmail: R.maskEmail(again.guardian.email), statusToken: again.statusToken };
    const c = R.classifyDob(body.teen?.dob);
    if (c === 'blocked') fail('under_13', { status: 403 });
    if (c === 'adult') fail('adult', { status: 409 });
    const fields = {};
    const g = R.validateGuardian(body.guardian, body.teen);
    Object.entries(g).forEach(([k, v]) => { fields[`guardian.${k}`] = v; });
    Object.entries(R.validateTeenConsent(body.consent, TEEN_CONSENT)).forEach(([k, v]) => { fields[`consent.${k}`] = v; });
    if (Object.keys(fields).length) fail('validation', { status: 422, fields });
    if (Object.values(s.regs).some((r) => r.teen.email === R.normEmail(body.teen.email) && !['rejected', 'cancelled'].includes(r.status))) fail('pending_exists', { status: 409, fields: { email: 'pending_exists' } });
    const ref = `TR-${rnd(4).toUpperCase().replace(/[^A-Z0-9]/g, 'X')}-${rnd(4).toUpperCase().replace(/[^A-Z0-9]/g, 'Q')}`;
    const gTok = rnd(43); const sTok = rnd(43);
    const reg = {
      ref, key: body.idempotencyKey, status: 'pending_guardian_approval', history: [{ status: 'initial_registration', at: new Date().toISOString() }, { status: 'pending_guardian_approval', at: new Date().toISOString() }],
      teen: { ...body.teen, email: R.normEmail(body.teen.email) }, guardian: { ...body.guardian, email: R.normEmail(body.guardian.email) },
      teenConsent: { version: TEEN_CONSENT.version, accepted: body.consent.accepted, at: new Date().toISOString() },
      statusToken: sTok, expiresAt: new Date(Date.now() + 7 * 864e5).toISOString(),
    };
    s.regs[ref] = reg;
    s.tokens[gTok] = { purpose: 'guardian', ref };
    s.tokens[sTok] = { purpose: 'status', ref };
    mail(s, 'guardian-invite', 'guardian', reg.guardian.email, `${reg.teen.firstName} would like to join the Teen Panel. Yes or no?`, { yes: `${link('/teen/parent', gTok)}&d=yes`, no: `${link('/teen/parent', gTok)}&d=no`, review: link('/teen/parent', gTok) });
    mail(s, 'teen-registered', 'teen', reg.teen.email, 'You’re in the queue! Your parent or guardian has your invite', { status: link('/sign-up?type=teen', sTok) });
    save(s);
    return { reference: ref, status: reg.status, guardianEmail: R.maskEmail(reg.guardian.email), statusToken: sTok, expiresAt: reg.expiresAt };
  }
  if (parts[0] === 'status') {
    const [reg] = tok('status');
    return { reference: reg.ref, status: reg.status, teenFirstName: reg.teen.firstName, guardian: { relation: reg.guardian.relation, emailMasked: R.maskEmail(reg.guardian.email) }, timeline: reg.history, expiresAt: reg.expiresAt, canResend: ['pending_guardian_approval', 'expired'].includes(reg.status) };
  }
  if (path === '/resend' || path === '/renew') {
    const reg = body.statusToken ? s.regs[s.tokens[body.statusToken]?.ref] : Object.values(s.regs).find((r) => r.teen.email === R.normEmail(body.mail));
    if (reg && reg.status === 'pending_guardian_approval') {
      const gTok = Object.entries(s.tokens).find(([, v]) => v.ref === reg.ref && v.purpose === 'guardian')?.[0];
      if (gTok) mail(s, 'guardian-invite', 'guardian', reg.guardian.email, `Reminder: ${reg.teen.firstName} would like to join`, { yes: `${link('/teen/parent', gTok)}&d=yes`, no: `${link('/teen/parent', gTok)}&d=no`, review: link('/teen/parent', gTok) });
      save(s);
    }
    return { message: 'sent_if_pending' };
  }
  if (parts[0] === 'guardian') {
    const [reg, rec, tk] = tok('guardian');
    const action = parts[2];
    if (!action) {
      if (!['pending_guardian_approval', 'guardian_approved', 'pending_onboarding', 'pending_consent'].includes(reg.status)) fail(reg.status === 'rejected' ? 'already_declined' : 'already_done', { status: 409 });
      return {
        reference: reg.ref, status: reg.status, decision: reg.decision || null,
        teen: { firstName: reg.teen.firstName, age: R.ageOn(reg.teen.dob), country: reg.teen.location?.countryName, countryCode: reg.teen.location?.country },
        guardian: { relation: reg.guardian.relation, firstName: reg.guardian.firstName, middleName: reg.guardian.middleName || '', lastName: reg.guardian.lastName, dob: reg.guardian.dob, gender: R.guardianGender(reg.guardian) || '', email: reg.guardian.email, phone: reg.guardian.phoneE164 || '' },
        prefill: { country: reg.teen.location?.country, stateCode: reg.teen.location?.stateCode, state: reg.teen.location?.state },
        onboarding: { answers: reg.onboarding || {}, submittedAt: reg.onboardingAt || null },
        consent: { version: TERMS_VERSION }, expiresAt: reg.expiresAt,
      };
    }
    if (action === 'decision') {
      if (body.confirm !== true) fail('confirm_required');
      if (body.decision === 'yes') {
        if (reg.status !== 'pending_guardian_approval' && reg.decision !== 'yes') fail('bad_state', { status: 409 });
        reg.decision = 'yes'; if (reg.status === 'pending_guardian_approval') move(reg, 'guardian_approved');
        mail(s, 'guardian-approved', 'guardian', reg.guardian.email, 'Thank you. Next: two short steps', { continue: link('/teen/parent', tk) });
      } else {
        reg.decision = 'no'; reg.declineReasons = body.reasons || []; reg.declineComment = body.comment || '';
        move(reg, reg.status === 'pending_guardian_approval' ? 'rejected' : 'cancelled'); rec.used = true;
        mail(s, 'guardian-declined', 'guardian', reg.guardian.email, 'We’ve recorded your decision', {});
        mail(s, 'teen-declined', 'teen', reg.teen.email, 'An update on your Teen Panel registration', {});
      }
      save(s);
      return { status: reg.status };
    }
    if (action === 'onboarding') {
      reg.onboarding = body.answers;
      if (reg.status === 'guardian_approved') move(reg, 'pending_onboarding');
      if (body.submit) {
        const rules = { questions: PARENT_SURVEY.sections.flatMap((sec) => sec.qs.map((q) => ({ n: q.n, kind: q.kind || 'choice', req: q.req, reqWhen: q.reqWhen, when: q.when, multi: q.multi, values: q.o ? q.o.map((o) => o[1]) : null, exclusive: q.exclusive }))) };
        const e = R.validateOnboarding(body.answers, rules);
        if (Object.keys(e).length) fail('validation', { status: 422, fields: e });
        reg.onboardingAt = new Date().toISOString();
        if (body.answers.P04 === 'no') { move(reg, 'cancelled'); rec.used = true; save(s); return { status: reg.status, stop: 'not_authorised' }; }
        if (body.answers.P04 === 'unsure') { move(reg, 'manual_review'); save(s); return { status: reg.status, stop: 'manual_review' }; }
        if (reg.status !== 'pending_consent') move(reg, 'pending_consent');
      }
      save(s);
      return { status: reg.status, saved: true };
    }
    if (action === 'consent') {
      if (reg.status !== 'pending_consent') fail('bad_state', { status: 409 });
      const e = R.validateGuardianConsent(body, { version: TERMS_VERSION, selections: SELECTIONS });
      if (Object.keys(e).length) fail('validation', { status: 422, fields: e });
      rec.used = true;
      reg.guardianConsent = { version: TERMS_VERSION, selections: body.selections, at: new Date().toISOString() };
      move(reg, 'pending_password');
      const pTok = rnd(43);
      s.tokens[pTok] = { purpose: 'password', ref: reg.ref };
      mail(s, 'guardian-complete', 'guardian', reg.guardian.email, 'All done. Your teen can now create their password', {});
      mail(s, 'teen-password', 'teen', reg.teen.email, 'Your parent said yes! Create your password', { password: link('/set-password?type=teen', pTok) });
      save(s);
      return { status: reg.status, teenEmail: R.maskEmail(reg.teen.email) };
    }
  }
  if (parts[0] === 'password') {
    const [reg, rec] = tok('password');
    if (method === 'GET') return { firstName: reg.teen.firstName, email: reg.teen.email, reference: reg.ref, relation: reg.guardian.relation };
    if (body.password !== body.confirm) fail('validation', { status: 422, fields: { confirm: 'pw_match' } });
    const pe = R.validatePassword(body.password, { email: reg.teen.email, firstName: reg.teen.firstName });
    if (pe) fail('validation', { status: 422, fields: { password: pe } });
    rec.used = true; move(reg, 'active'); reg.activatedAt = new Date().toISOString();
    s.session = reg.ref;
    mail(s, 'teen-active', 'teen', reg.teen.email, 'Your Teen Panel account is live', { login: '/login?type=teen' });
    save(s);
    return { status: 'active', email: reg.teen.email };
  }
  if (parts[0] === 'me') {
    const reg = s.regs[s.session] || Object.values(s.regs).find((r) => r.status === 'active') || demoTeen(s);
    if (method === 'GET') {
      const loc = reg.teen.location || {};
      return {
        reference: reg.ref,
        teen: { firstName: reg.teen.firstName, middleName: reg.teen.middleName, lastName: reg.teen.lastName, dob: reg.teen.dob, email: reg.teen.email, phone: reg.teen.phone?.number ? `+${reg.teen.phone.dial || ''} ${reg.teen.phone.number}` : '', gender: reg.teen.gender, genderSelf: reg.teen.genderSelf, location: { country: loc.country, countryName: loc.countryName, state: loc.state, city: loc.city, zip: loc.zip }, memberSince: reg.activatedAt },
        guardian: { relation: reg.guardian.relation, firstName: reg.guardian.firstName, emailMasked: R.maskEmail(reg.guardian.email), consentVersion: reg.guardianConsent?.version || TERMS_VERSION, consentAt: reg.guardianConsent?.at || reg.activatedAt, optional: [] },
        answers: { D01: String(R.ageOn(reg.teen.dob)), D02: loc.country, D03: loc.stateCode || loc.state, D06: reg.teen.gender === 'Self-describe' ? 'Other' : reg.teen.gender, ...(reg.answers || {}) },
        locked: ['D01', 'D02', 'D03', 'D06'], welcomeDone: Boolean(reg.welcomeDone),
      };
    }
    reg.answers = { ...(reg.answers || {}), ...(body.answers || {}) };
    if (body.welcomeDone) reg.welcomeDone = true;
    save(s);
    return { saved: Object.keys(body.answers || {}).length };
  }
  fail('server', { status: 500 });
  return null;
}

// a ready-made active teen, so the welcome survey and profile can be previewed on their own
function demoTeen(s) {
  const ref = 'TR-DEMO-TEEN';
  if (!s.regs[ref]) {
    s.regs[ref] = {
      ref, status: 'active', history: [], activatedAt: new Date().toISOString(),
      teen: { firstName: 'Aarav', lastName: 'Sharma', dob: `${new Date().getFullYear() - 15}-05-04`, email: 'aarav@example.com', gender: 'Male', location: { country: 'IN', countryName: 'India', stateCode: 'DL', state: 'Delhi', city: 'New Delhi', zip: '110085' } },
      guardian: { relation: 'mother', firstName: 'Priya', lastName: 'Sharma', email: 'priya@example.com' },
      guardianConsent: { version: TERMS_VERSION, at: new Date().toISOString() },
    };
    s.session = ref;
    save(s);
  }
  return s.regs[ref];
}
export const relationLabel = (r) => REL[r] || r;

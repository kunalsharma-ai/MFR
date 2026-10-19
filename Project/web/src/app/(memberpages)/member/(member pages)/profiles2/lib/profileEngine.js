// Profile question engine - a faithful port of the original page logic
// (dependent questions, option filtering by parent answers, validation, pruning,
// locked identity fields, review/edit flows) with lazy data loading added.
import { getJSON } from './assets.js';
import { bucketOf } from './bucket.js';
import { store } from './storage.js';
import * as V from '../validation/index.js';

export const LOCK = /^(firstname|lastname|mail|phone|dob|age|gender|country|ethnicity)$/;
const OPTIONAL = /alternate|linkedin|website|payment-method|social-media|company-address/;
// payment detail fields only appear for the payout method(s) the respondent picked
const SHOW_IF = {
  'payment-method-upi': [/upi/i], 'payment-method-amazon': [/amazon/i], 'payment-method-paypal': [/paypal/i],
  'payment-method-bank-name': [/wire|bank/i], 'payment-method-bank-ifsc': [/wire|bank/i], 'payment-method-bank-account': [/wire|bank/i]
};
const LONG = /^(orglocation|company-address)$/;
export const NO_TRANSLATE = /^(org-)?(country|state|city)$/; // place names stay as-is (countries are localised via Intl)

// "Other" answers ask the respondent to specify (stored in `<question>__other`)
export function isOtherLabel(label) {
  const l = String(label || '').trim();
  if (!/^others?\b/i.test(l)) return false;
  return /^others?\s*[:.)-]?\s*$/i.test(l) || /specify|please|\(other\)/i.test(l) || l.split(/\s+/).length <= 3;
}
export const otherKey = (n) => n + '__other';

export const filled = (a) => a != null && a !== '' && !(Array.isArray(a) && !a.length);
const E = (key, vars) => ({ key, vars });


export class ProfileRun {
  constructor(meta, data) {
    this.meta = meta; // {id, n, s, c}
    this.D = data; // {p, Q, O, A, S}
    this.buckets = {}; // optKey -> {bucket -> {key: list}}
    this.ans = {};
    this.raw = {};
    this.flat = [];
    this.hist = [];
    this.i = -1;
    this.edit = false;
    this.one = false;
    this.flags = {}; // soft risk flags per question
    this.optSet = new Set(data.X || []);
    const seen = new Set();
    const add = (q, t) => {
      if (seen.has(q) || !this.D.Q[q]) return;
      seen.add(q);
      const par = this.D.Q[q][1];
      if (par && this.D.Q[par]) add(par, t);
      this.flat.push([q, t]);
    };
    data.p.forEach(([t, qs]) => qs.forEach((q) => add(q, t)));
  }

  // ---------- storage (same keys as the original page: t2oa:<category>:<slug>) ----------
  get storeKey() { return 't2oa:' + this.meta.c + ':' + this.meta.s; }
  get draftKey() { return 'mfr:draft:' + this.meta.id; }
  static saved(meta) { return store.get('t2oa:' + meta.c + ':' + meta.s); }
  static draft(meta) { return store.get('mfr:draft:' + meta.id); }
  save() {
    store.set(this.storeKey, { a: this.ans, r: this.raw, f: this.flags, t: Date.now() });
    store.remove(this.draftKey);
  }
  saveDraft() {
    if (this.edit) return;
    store.set(this.draftKey, { a: this.ans, r: this.raw, i: this.i, h: this.hist, p: this.progress().pct });
  }

  // ---------- question metadata ----------
  text(n) { return this.D.Q[n][0]; }
  parent(n) { const p = this.D.Q[n][1]; return p && this.D.Q[p] ? p : null; }
  name(i) { return this.flat[i][0]; }
  section(i) { return this.flat[i][1]; }
  cur() { return this.name(this.i); }
  required(n) {
    if (this.optSet.has(n)) return false;
    if (/^(alternate-|phone1$|orglinkedin|social-media-linkedin|orgwebsite|social-media-|company-address)/.test(n)) return false;
    if (/^(zipcode|org-zipcode)$/.test(n)) { const cc = this.ans[n === 'zipcode' ? 'country' : 'org-country']; if (V.NO_POSTAL.has(cc)) return false; }
    if (n === 'payment-method') return true;
    return !OPTIONAL.test(n) || /^payment-method-/.test(n);
  }
  multi(n) { return /all that apply|select all|check all|choose all|multiple/i.test(this.text(n)); }
  long(n) { return LONG.test(n); }

  /** Validation spec per question: { type, kind, validate(v) -> result, ph, sample, optional } */
  spec(n) {
    const A = this.ans, minor = this.meta.c === 'minor';
    const residence = A['residence-country'] || A.country;
    const opt = !this.required(n);
    const S = (type, kind, validate, ph = '', sample) => ({ type, kind, validate, ph, sample, optional: opt });
    const country = (k) => (typeof A[k] === 'string' && /^[A-Z]{2}$/.test(A[k]) ? A[k] : null);
    if (/^(firstname|lastname|middlename|preferred-name)$/.test(n)) {
      const kind = n === 'firstname' || n === 'preferred-name' ? 'first' : n === 'lastname' ? 'last' : 'middle';
      return S('text', 'name', (v) => V.validateName(v, { kind, optional: opt, other: kind === 'last' ? A.firstname : null }), '', 'María-José');
    }
    if (/^(mail|alternate-email|workemail|payment-method-paypal|payment-method-amazon)$/.test(n)) {
      return S('email', 'email', (v) => {
        const r = V.validateEmail(v, { optional: opt, b2b: n === 'workemail' });
        if (r.ok && r.value && n === 'alternate-email' && A.mail && V.emailKey(r.value) === V.emailKey(A.mail)) return V.bad('e.emailSame');
        if (r.ok && r.value && n === 'workemail' && V.isFreeMail(r.value.split('@')[1])) r.flags.push(V.flag('work_email_free_provider', -2));
        return r;
      }, 'name@example.com', { mail: 'maria.lopez@gmail.com', 'alternate-email': 'maria.work@outlook.com', workemail: 'maria@acme-analytics.com' }[n] || 'maria.pay@gmail.com');
    }
    if (/^(phone|alternate-phone|phone1|social-media-whatsapp)$/.test(n)) {
      return S('tel', 'phone', (v) => {
        const r = V.validatePhone(v, { optional: opt, residence });
        if (r.ok && r.value && n !== 'phone' && A.phone && r.value === A.phone) return V.bad('e.phoneSame');
        return r;
      }, '', { phone: '+919812345671', 'alternate-phone': '+447911123456', phone1: '+14155552671' }[n] || '+919812345672');
    }
    if (n === 'dob') return S('dob', 'dob', (v) => V.validateDob(v, { segment: minor ? 'minor' : 'adult', country: residence }), '', minor ? '2011-04-15' : '1990-04-15');
    if (n === 'age') return S('number', 'int', (v) => V.validateInt(v, minor ? 13 : 18, minor ? 17 : 110, { optional: opt }), '', minor ? '15' : '34');
    if (/^(zipcode|org-zipcode)$/.test(n)) {
      const cc = country(n === 'zipcode' ? 'country' : 'org-country');
      return { ...S('text', 'postal', (v) => V.validatePostal(v, { country: cc, optional: opt }), V.postalExample(cc)), sample: V.postalExample(cc) || '110001', optional: opt || V.NO_POSTAL.has(cc) };
    }
    if (/^(orglocation|company-address|address-line1)$/.test(n)) return S('textarea', 'address', (v) => V.validateAddress(v, { optional: opt }), '', '221B Baker Street, Marylebone');
    if (/^(orgwebsite)$/.test(n)) return S('url', 'url', (v) => V.validateUrl(v, { optional: opt }), 'https://example.com', 'https://www.example.org');
    if (/linkedin/.test(n)) return S('url', 'url', (v) => V.validateUrl(v, { optional: opt, linkedin: true }), 'https://www.linkedin.com/in/your-name', 'https://www.linkedin.com/in/maria');
    if (/^social-media-/.test(n)) return S('text', 'handle', (v) => V.validateHandle(v, { optional: opt }), '@yourhandle', '@maria.lopez');
    if (n === 'payment-method-upi') return S('text', 'upi', (v) => V.validateUpi(v, { optional: opt }), 'name@bank', 'maria@okhdfc');
    if (n === 'payment-method-bank-ifsc') return S('text', 'bankcode', (v) => V.validateBankCode(v, { optional: opt }), 'HDFC0001234 / DEUTDEFF / DE89…', 'HDFC0001234');
    if (n === 'payment-method-bank-account') return S('text', 'bankaccount', (v) => V.validateBankAccount(v, { optional: opt }), '', '50100234567891');
    if (n === 'company-name') return S('text', 'company', (v) => V.validateCompany(v, { optional: opt }), '', 'Acme Analytics Ltd');
    if (n === 'grad-year') {
      const y = new Date().getFullYear();
      return S('number', 'int', (v) => {
        const r = V.validateInt(v, 1940, y + 8, { optional: opt });
        const d = V.parseDob(A.dob);
        if (r.ok && r.value && d && +r.value < d.y + 12) return V.bad('e.gradYear');
        return r;
      }, String(y), '2015');
    }
    if (n === 'food18') return S('number', 'int', (v) => V.validateInt(v, 0, 200, { optional: opt }), '0', '4');
    if (/count$/.test(n)) return S('number', 'int', (v) => V.validateInt(v, 0, 999, { optional: opt }), '0', '3');
    if (/number of|how many/i.test(this.text(n))) return S('number', 'int', (v) => V.validateInt(v, 0, 99, { optional: opt }), '0', '2');
    const max = this.long(n) ? 500 : 200;
    return S(this.long(n) ? 'textarea' : 'text', 'text', (v) => V.validateOpenText(v, { min: 2, max, optional: opt }), '', 'Sample answer');
  }

  // ---------- options ----------
  optKey(n) { return this.D.A[n] || n; }
  keysFor(n) {
    const par = this.parent(n);
    if (!par) return null; // all keys
    const a = this.ans[par];
    return [''].concat(Array.isArray(a) ? a : filled(a) ? [a] : []);
  }
  /** Loads any lazily split option buckets this question needs. */
  async ensure(n) {
    const c = this.optKey(n), mode = this.D.S[c];
    if (!mode) return;
    const keys = this.keysFor(n) || [''];
    const store_ = (this.buckets[c] ||= {});
    await Promise.all(
      [...new Set(keys.map((k) => bucketOf(mode, k)))].map(async (b) => {
        if (store_[b]) return;
        try {
          store_[b] = await getJSON(`data/o/${c}/${b}.json`);
        } catch {
          store_[b] = {}; // missing bucket == no options for that key
        }
      })
    );
  }
  /** [[label, value], …] | null (free-text question) | undefined (options still loading) */
  opts(n) {
    const c = this.optKey(n);
    const mode = this.D.S[c];
    const d = this.D.O[c];
    if (!d && !mode) return n === 'sports31' ? [['Yes', 'Yes'], ['No', 'No']] : null;
    const keys = this.keysFor(n) || Object.keys(d || {});
    const seen = new Set(), r = [];
    for (const k of keys) {
      let list;
      if (mode) {
        const b = this.buckets[c]?.[bucketOf(mode, k)];
        if (!b) return undefined;
        list = b[k];
      } else list = d[k];
      (list || []).forEach((x) => {
        const o = typeof x === 'string' ? [x, x] : x;
        if (!seen.has(o[1])) { seen.add(o[1]); r.push(o); }
      });
    }
    return r;
  }

  // ---------- visibility / navigation ----------
  vis(n) {
    if (n === 'welcome-note' || !n || !this.D.Q[n]) return false; // unknown names never become an empty screen
    const par = this.parent(n);
    if (par && !filled(this.ans[par])) return false;
    if (SHOW_IF[n]) { const a = [].concat(this.ans[par] || []); if (!a.some((x) => SHOW_IF[n][0].test(x))) return false; }
    const o = this.opts(n);
    return o === undefined ? true : !o || o.length > 0;
  }
  allowed(i) { const n = this.name(i); return this.vis(n) && !(this.edit && LOCK.test(n)); }
  async nextVisible(i) {
    for (i++; i < this.flat.length; i++) {
      await this.ensure(this.name(i));
      if (this.allowed(i)) return i;
    }
    return -1;
  }
  visibleIdx() { return this.flat.map((_, i) => i).filter((i) => this.allowed(i)); }
  progress() {
    const vs = this.visibleIdx();
    const done = vs.filter((i) => i < this.i || filled(this.ans[this.name(i)])).length;
    return { pos: vs.indexOf(this.i) + 1, total: vs.length, done, pct: vs.length ? Math.round((done / vs.length) * 100) : 0 };
  }
  sections() {
    const vs = this.visibleIdx(), map = new Map();
    vs.forEach((i) => {
      const s = this.section(i);
      if (!map.has(s)) map.set(s, { name: s, total: 0, done: 0, first: i });
      const e = map.get(s);
      e.total++;
      if (filled(this.ans[this.name(i)])) e.done++;
    });
    return [...map.values()];
  }

  // ---------- validation ----------
  check(n) {
    const o = this.opts(n), a = this.ans[n];
    if (o) {
      if (this.raw[n] && !filled(a)) {
        if (/^(city|org-city)$/.test(n)) { const r = V.validateCity(this.raw[n]); return r.ok ? null : E(r.key, r.vars); }
        return E('e.list');
      }
      if (!filled(a) && this.required(n)) return E('e.choose');
      if (this.otherSelected(n)) {
        const r = V.validateOpenText(this.ans[otherKey(n)], { min: 2, max: 120, specific: true });
        if (!r.ok) return E(r.key === 'e.required' ? 'e.otherSpecify' : r.key, r.vars);
      }
      if (filled(a) && !Array.isArray(a) && !o.some((x) => x[1] === a) && !/^(city|org-city)$/.test(n)) return E('e.list'); // manipulated value
      return null;
    }
    const sp = this.spec(n);
    const v = String(a ?? '').trim();
    if (!v) return sp.optional ? null : E('e.required');
    const r = sp.validate(v);
    return r.ok ? null : E(r.key, r.vars);
  }
  /** Runs validation once more and stores the normalised value + soft flags (call when moving on). */
  commit(n) {
    const o = this.opts(n);
    if (o) {
      if (/^(city|org-city)$/.test(n) && this.raw[n] && !filled(this.ans[n])) {
        const r = V.validateCity(this.raw[n]);
        if (r.ok) { this.ans[n] = r.value; this.flags[n] = r.flags; this.raw[n] = ''; }
      }
      if (this.otherSelected(n)) { const r = V.validateOpenText(this.ans[otherKey(n)], { min: 2, max: 120, specific: true }); if (r.ok) this.ans[otherKey(n)] = r.value; }
      else delete this.ans[otherKey(n)];
      return;
    }
    const v = String(this.ans[n] ?? '').trim();
    if (!v) return;
    const r = this.spec(n).validate(v);
    if (r.ok) { this.ans[n] = r.value; this.flags[n] = r.flags || []; if (r.age != null) this.derived = { ...this.derived, age: r.age, needsParentalConsent: r.needsParentalConsent }; }
  }
  /** values of the selected option(s) that are "Other …" */
  otherSelected(n) {
    const o = this.opts(n);
    if (!o) return false;
    const sel = [].concat(this.ans[n] ?? []);
    return o.some((x) => sel.includes(x[1]) && isOtherLabel(x[0]));
  }
  allFlags() { return Object.entries(this.flags).flatMap(([q, fl]) => (fl || []).map((f) => ({ ...f, q }))); }
  prune() {
    this.flat.forEach(([n]) => {
      if (!this.vis(n)) { delete this.ans[n]; delete this.raw[n]; delete this.ans[otherKey(n)]; return; }
      const o = this.opts(n), a = this.ans[n];
      if (!o || !filled(a)) return;
      const ok = new Set(o.map((x) => x[1]));
      if (Array.isArray(a)) this.ans[n] = a.filter((x) => ok.has(x));
      else if (!ok.has(a)) delete this.ans[n];
    });
  }
  label(n, v) {
    if (n === 'dob' && /^\d{4}-\d{2}-\d{2}$/.test(v)) { const [y, m, d] = v.split('-'); return `${d}/${m}/${y}`; }
    const o = this.opts(n);
    const f = (x) => { const h = o && o.find((y) => y[1] === x); return h ? h[0] : x; };
    const out = Array.isArray(v) ? v.map(f).join(', ') : f(v);
    return this.otherSelected(n) && this.ans[otherKey(n)] ? `${out} - “${this.ans[otherKey(n)]}”` : out;
  }
  payload() {
    const answers = {};
    this.flat.forEach(([n]) => {
      if (this.vis(n) && filled(this.ans[n])) answers[n] = this.ans[n];
      if (this.vis(n) && this.otherSelected(n) && filled(this.ans[otherKey(n)])) answers[otherKey(n)] = this.ans[otherKey(n)];
    });
    return { category: this.meta.c, profile: this.meta.s, answers, flags: this.allFlags(), completedAt: new Date().toISOString() };
  }
  async ensureAll() {
    // load buckets for every answered dependent question (used by review & pruning)
    for (const [n] of this.flat) await this.ensure(n);
  }
}

export async function loadProfile(meta) {
  const data = await getJSON(`data/p/${meta.id}.json`);
  return new ProfileRun(meta, data);
}

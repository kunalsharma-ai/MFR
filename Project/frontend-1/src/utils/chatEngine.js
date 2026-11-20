// Live Help answer engine — a small, dependency-free search over the site's own knowledge base.
// Scoring: TF-IDF style word overlap (question text weighted 3×, answer 1×) + strong boosts for exact
// topic phrases, with light stemming and synonyms. Below the confidence threshold the assistant does NOT
// guess: it asks the visitor for their details so a person can reply (see LiveChat.jsx → lead form).
import { COUNTRIES } from '../data/countries.js';
import { buildDocs, CURATED, ENTITIES, SMALL_TALK, SRC } from '../data/chatKnowledge.js';
import { PAYOUT_LINE } from '../data/site.js';
import { BLOG_META } from '../data/blogs/meta.js';

const STOP = new Set('a an the is are was were be been am i me my mine you your yours we our us it its this that these those to of in on at for from by with about as and or but if so do does did done can could would should will shall may might must have has had having what which whom whose how any some there here then than too very just also not no yes please pls plz kindly tell know want need get got give make one much many more most other such into out up down over again only same both each few all he she they them his her their hi hello'.split(' '));
// Words that point to the same idea (expanded at query time with a lower weight)
const SYN = {
  pay: ['payout', 'reward'], paid: ['payout', 'reward'], payment: ['payout', 'reward'], payments: ['payout'], money: ['reward', 'cash', 'earn'], cash: ['reward'],
  withdraw: ['payout', 'redeem', 'claim'], withdrawal: ['payout', 'redeem', 'claim'], redeem: ['claim', 'payout'], claim: ['redeem', 'payout'], earn: ['reward'], earning: ['reward', 'earn'], income: ['earn', 'reward'],
  register: ['join', 'sign'], registration: ['join', 'sign'], signup: ['join', 'sign'], enroll: ['join'], enrol: ['join'], member: ['join'], membership: ['join'],
  login: ['log', 'password', 'sign'], signin: ['log', 'password'], otp: ['verification', 'code'], verify: ['verification'], delete: ['deletion', 'close'], remove: ['delete'],
  safe: ['secure', 'privacy'], secure: ['safe', 'security'], data: ['privacy'], scam: ['legit', 'genuine'], fake: ['legit', 'genuine'], legit: ['genuine', 'legitimate'],
  own: ['owner', 'run', 'company'], owns: ['owner', 'run', 'company'], owner: ['run', 'company'], when: ['long', 'time'],
  b2b: ['professional', 'business'], business: ['professional'], job: ['employment'], mobile: ['phone', 'device'], phone: ['mobile'], app: ['download'],
};
// Common Hinglish words → English before matching
const TRANSLATE = { paisa: 'money', paise: 'money', rupay: 'money', rupaye: 'money', kaise: 'how', kab: 'when', milega: 'paid', milenge: 'paid', milta: 'paid', kitna: 'how much', kitne: 'how much', kya: 'what', karna: '', karein: '', karu: '', hai: '', hain: '', mujhe: '', mera: 'my', meri: 'my', kahan: 'where', nahi: 'not', nahin: 'not', aaya: 'received', account: 'account', band: 'close', surveys: 'surveys' };
const translate = (t) => t.split(/\s+/).map((w) => (w.toLowerCase() in TRANSLATE ? TRANSLATE[w.toLowerCase()] : w)).join(' ');

const stem = (w) => {
  if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith('ies')) return `${w.slice(0, -3)}y`;
  if (w.length > 4 && w.endsWith('ed')) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
};
const norm = (t = '') => ` ${String(t).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9₹$€£\s-]/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim()} `;
const tokens = (t) => norm(t).trim().split(' ').filter((w) => w && !STOP.has(w)).map(stem);
const has = (text, phrase) => norm(text).includes(norm(phrase));

let INDEX = null;
function index() {
  if (INDEX) return INDEX;
  const docs = buildDocs().map((d, id) => {
    const qText = [d.q, ...(d.alt || [])].join(' ');
    return { ...d, id, qTok: new Set(tokens(qText)), aTok: new Set(tokens(d.a)), kN: (d.k || []).map(norm) };
  });
  const df = new Map();
  docs.forEach((d) => new Set([...d.qTok, ...d.aTok]).forEach((t) => df.set(t, (df.get(t) || 0) + 1)));
  const idf = (t) => Math.log(1 + docs.length / (1 + (df.get(t) || 0)));
  INDEX = { docs, idf };
  return INDEX;
}

const KIND_W = { curated: 1.3, faq: 1.12, data: 0.95, policy: 0.8, blog: 0.82 };

export function resolveSrc(key, title) {
  if (!key) return null;
  if (key.startsWith('blog:')) {
    const slug = key.slice(5);
    const b = BLOG_META.find((x) => x.slug === slug);
    return { path: `/blog/${slug}`, label: `Guide: ${title || (b && b.title) || 'read the guide'}` };
  }
  return SRC[key] || null;
}

function search(q) {
  const { docs, idf } = index();
  q = translate(q);
  const qn = norm(q);
  const base = tokens(q);
  const weighted = new Map();
  base.forEach((t) => weighted.set(t, Math.max(weighted.get(t) || 0, 1)));
  base.forEach((t) => (SYN[t] || []).forEach((s) => { const st = stem(s); if (!weighted.has(st)) weighted.set(st, 0.55); }));
  const maxPossible = [...weighted].reduce((s, [t, w]) => s + w * idf(t) * 3, 0) || 1;
  const baseIdf = base.reduce((s, t) => s + idf(t), 0) || 1;
  const scored = docs.map((d) => {
    let s = 0;
    let covered = 0; // share of the visitor's own words (idf-weighted) this answer actually covers
    weighted.forEach((w, t) => {
      const i = idf(t);
      if (d.qTok.has(t)) s += 3 * w * i;
      else if (d.aTok.has(t)) s += 1 * w * i;
    });
    base.forEach((t) => { if (d.qTok.has(t) || d.aTok.has(t) || (SYN[t] || []).some((x) => d.qTok.has(stem(x)))) covered += idf(t); });
    let ratio = s / maxPossible;
    const phraseHits = d.kN.filter((k) => qn.includes(k));
    if (phraseHits.length) {
      const words = Math.max(...phraseHits.map((k) => k.trim().split(' ').length));
      ratio += words > 1 ? 0.3 + 0.12 * words : 0.22;
      phraseHits.forEach((k) => k.trim().split(' ').forEach((w) => { if (base.includes(stem(w))) covered += 0; }));
    }
    if (norm(d.q) === qn) ratio += 1;
    const coverage = Math.min(1, covered / baseIdf + (phraseHits.length ? 0.25 : 0));
    // answers that ignore most of what was asked are demoted
    return { d, ratio: ratio * (KIND_W[d.kind] || 1) * (0.45 + 0.55 * coverage), coverage };
  });
  scored.sort((a, b) => b.ratio - a.ratio);
  return scored;
}

// ── Direct answers about countries, job titles, industries and personas ──────
const CONSUMER_PERSONAS = ['student', 'students', 'homemaker', 'housewife', 'house wife', 'retiree', 'retired', 'pensioner', 'gamer', 'parent', 'mother', 'father', 'mom', 'dad', 'driver', 'unemployed', 'shopper', 'senior citizen', 'freelancer'];
const PRO_PERSONAS = ['doctor', 'nurse', 'pharmacist', 'engineer', 'lawyer', 'accountant', 'manager', 'teacher', 'developer', 'programmer', 'it professional', 'ceo', 'founder', 'business owner', 'consultant', 'architect', 'banker', 'hr', 'marketer', 'director'];
const JOINISH = /\b(join|eligible|allowed|can i|can a|can an|can we|available|accept|welcome|from|live in|living in|i am a|i am an|im a|i'm a|as a|members in|work as|apply)\b/;

const wb = (text, phrase) => new RegExp(`(^|[^a-z])${phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(text.toLowerCase());

function entityAnswer(q) {
  const t = q.toLowerCase();
  // Countries
  const country = COUNTRIES.find((c) => c.name.length > 3 && wb(t, c.name)) || (wb(t, 'usa') || wb(t, 'us') ? COUNTRIES.find((c) => c.iso === 'US') : null) || (wb(t, 'uk') ? COUNTRIES.find((c) => c.iso === 'GB') : null) || (wb(t, 'uae') ? COUNTRIES.find((c) => c.iso === 'AE') : null);
  if (country) {
    const listed = ENTITIES.countries.find((c) => c.name.toLowerCase() === country.name.toLowerCase() || (country.iso === 'GB' && c.name === 'United Kingdom') || (country.iso === 'US' && c.name === 'United States') || (country.iso === 'AE' && c.name === 'United Arab Emirates'));
    const india = country.iso === 'IN';
    if (/\bupi\b/.test(t) && !india) return { a: `UPI is available to members in India only. Members in ${country.name} can choose PayPal, bank or wire transfer, shopping, grocery or digital gift card vouchers.`, src: 'rewards' };
    if (/\b(pay|paid|payout|reward|rewards|payment|redeem|claim|withdraw|method)/.test(t)) {
      return { a: india ? `Members in India can choose ${PAYOUT_LINE.replace(' — plus UPI in India', '')} — and UPI.` : `Members in ${country.name} can choose PayPal, bank or wire transfer, shopping, grocery or digital gift card vouchers. (UPI is India-only.)`, src: 'rewards' };
    }
    if (JOINISH.test(t) || t.split(/\s+/).length <= 4) {
      if (listed) return { a: `Yes — ${country.name} is one of the countries we welcome (${listed.region}). Joining is free: sign up, verify your email and start receiving surveys matched to your profile.${india ? ' Members in India can also claim rewards by UPI.' : ''}`, src: 'who', more: 'signup' };
      return { a: `${country.name} is not on the list of countries shown on our website, and availability can vary by country. Leave your details below and our team will confirm whether you can join from ${country.name}.`, src: 'who', lead: true };
    }
  }
  if (!JOINISH.test(t)) return null;
  const title = ENTITIES.titles.find((x) => x.name.length > 2 && wb(t, x.name));
  if (title) return { a: `Yes — ${title.name} is among the ${title.group} roles we welcome. Professionals receive B2B studies about their role and industry (verified once, typically rewarded more) and can receive consumer surveys too.`, src: 'pros', more: 'who' };
  const ind = ENTITIES.industries.find((x) => x.name.length > 3 && wb(t, x.name));
  if (ind) return { a: `Yes — professionals in ${ind.name} (${ind.group}) are welcome. Studies cover the tools, suppliers and decisions in your field.`, src: 'who', more: 'pros' };
  const pro = PRO_PERSONAS.find((p) => wb(t, p));
  if (pro) return { a: `Yes — as a ${pro} you can join as a Business professional and receive B2B studies about your work (verified through checks such as a company email or LinkedIn), plus everyday consumer surveys.`, src: 'pros', more: 'signup' };
  const con = CONSUMER_PERSONAS.find((p) => wb(t, p));
  if (con) return { a: `Absolutely — ${con}s are very welcome. Join free as a Consumer and you’ll receive surveys about the products, services, media and lifestyle topics you know. No experience or investment needed.`, src: 'consumers', more: 'signup' };
  return null;
}

const CONFIDENT = 0.55;
const POSSIBLE = 0.32;

// Main entry: returns { a, src, more, related[], human, lead, confidence }
export function answer(raw) {
  const q = String(raw || '').trim();
  if (!q) return null;
  const t = q.toLowerCase();
  const small = SMALL_TALK.find((s) => s.k.some((k) => norm(t) === norm(k) || (t.split(/\s+/).length <= 3 && wb(t, k))));
  if (small) return { a: small.a, confidence: 1, kind: 'small' };

  const ent = entityAnswer(translate(q));
  if (ent) return { ...ent, src: resolveSrc(ent.src), more: resolveSrc(ent.more), confidence: 0.9, related: [] };

  const scored = search(q);
  const best = scored[0];
  const seen = new Set([best && best.d.q.toLowerCase()]);
  const related = [];
  for (const s of scored.slice(1, 25)) {
    if (related.length >= 3 || s.ratio < POSSIBLE * 0.9) break;
    const key = s.d.q.toLowerCase();
    if (seen.has(key) || s.d.kind === 'policy') continue;
    seen.add(key);
    related.push(s.d.q.endsWith('?') ? s.d.q : `${s.d.q}?`.replace(/ survey\?$/, ' surveys?').replace(/ reward\?$/, ' reward?'));
  }
  if (!best || best.ratio < POSSIBLE) {
    return { a: 'I couldn’t find that on our website, so I’d like a person from our team to answer it properly. Please share your details below and we’ll get back to you.', lead: true, confidence: best ? best.ratio : 0, related };
  }
  const d = best.d;
  if (best.coverage < 0.5 && best.ratio < 1.2) {
    return { a: 'I couldn’t find a clear answer to that on our website. Please share your details below and our team will reply — or pick one of these related questions.', lead: true, confidence: best.ratio, related };
  }
  return {
    a: d.a,
    src: resolveSrc(d.src, d.srcTitle),
    more: resolveSrc(d.more),
    human: Boolean(d.human),
    lead: Boolean(d.lead),
    unsure: best.ratio < CONFIDENT,
    confidence: best.ratio,
    related,
  };
}

// Suggestions while typing (autocomplete) — curated questions first
export function suggest(prefix, n = 4) {
  const p = norm(prefix).trim();
  if (p.length < 3) return [];
  const words = p.split(' ');
  return CURATED.map((c) => c.q)
    .filter((qq) => { const qn = norm(qq); return words.every((w) => qn.includes(w)); })
    .slice(0, n);
}

export const KB_SIZE = () => index().docs.length;

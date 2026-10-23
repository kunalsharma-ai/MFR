import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon.jsx';
import { COUNTRIES } from '../data/countries.js';
import CountryPicker, { Flag } from './CountryPicker.jsx';
import { API_BASE, BRAND, CONTACT, DEMO_MODE, whatsappLink } from '../data/site.js';
import { EMAIL_RE } from '../utils/validate.js';
import { COUNTRIES } from '../data/countries.js';
import CountryPicker, { Flag } from './CountryPicker.jsx';
import { API_BASE, BRAND, CONTACT, DEMO_MODE, whatsappLink } from '../data/site.js';
import { EMAIL_RE } from '../utils/validate.js';
import { pop, setSound, soundOn } from '../utils/sound.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

// 24/7 Live Help.
// • Answers instantly from the website's own knowledge base (every FAQ, policy, guide FAQ and key data —
//   see src/data/chatKnowledge.js). The engine + knowledge base are loaded only when the chat is opened.
// • Every answer links to its SOURCE page so visitors can read the topic in full.
// • When the assistant can't find an answer on the website it does not guess — it asks for the visitor's
//   full name, email, phone (optional) and country and sends them to VITE_CHAT_LEAD_ENDPOINT
//   (default /api/chat-leads, implemented in server/index.mjs). Tawk.to can be added for a live agent.

const TAWK_P = import.meta.env.VITE_TAWK_PROPERTY_ID;
const TAWK_W = import.meta.env.VITE_TAWK_WIDGET_ID;
const LEAD_ENDPOINT = import.meta.env.VITE_CHAT_LEAD_ENDPOINT || '/api/chat-leads';
const LEAD_ENDPOINT = import.meta.env.VITE_CHAT_LEAD_ENDPOINT || '/api/chat-leads';

const TOPICS = [
  { q: 'How do I join?', t: 'Joining', d: 'Free · 2 minutes', icon: 'user', c: '#FF8A00' },
  { q: 'What rewards can I get?', t: 'Rewards', d: '8 reward types', icon: 'gift', c: '#14C9B5' },
  { q: 'How much can I earn per survey?', t: 'Earnings', d: 'Rates & times', icon: 'coins', c: '#FFC233' },
  { q: 'When will I get paid?', t: 'Payouts', d: 'Claims & timing', icon: 'wallet', c: '#2F6BFF' },
  { q: 'What rewards can I get?', t: 'Rewards', d: '8 reward types', icon: 'gift', c: '#14C9B5' },
  { q: 'How much can I earn per survey?', t: 'Earnings', d: 'Rates & times', icon: 'coins', c: '#FFC233' },
  { q: 'When will I get paid?', t: 'Payouts', d: 'Claims & timing', icon: 'wallet', c: '#2F6BFF' },
  { q: 'Is my data safe?', t: 'Privacy', d: 'Never sold or shared', icon: 'shield', c: '#8B5CF6' },
  { q: 'Talk to a real person', t: 'Real person', d: 'Leave your details', icon: 'headset', c: '#E8457A' },
  { q: 'Talk to a real person', t: 'Real person', d: 'Leave your details', icon: 'headset', c: '#E8457A' },
];
const POPULAR = ['Is it really free?', 'Is UPI available?', 'Can professionals join?', 'Why was I screened out?', 'I forgot my password', 'Do I need an app?', 'Is MyFrequentRewards legit?', 'How many surveys will I get?', 'Do you give gift cards?', 'How do I delete my account?'];
const GREETINGS = ['How can we help today?', 'Ask about rewards & payouts', 'Curious how surveys work?', 'Questions about privacy?'];

let enginePromise = null;
export const loadEngine = () => {
  if (!enginePromise) enginePromise = import('../utils/chatEngine.js');
  return enginePromise;
};
const POPULAR = ['Is it really free?', 'Is UPI available?', 'Can professionals join?', 'Why was I screened out?', 'I forgot my password', 'Do I need an app?', 'Is MyFrequentRewards legit?', 'How many surveys will I get?', 'Do you give gift cards?', 'How do I delete my account?'];
const GREETINGS = ['How can we help today?', 'Ask about rewards & payouts', 'Curious how surveys work?', 'Questions about privacy?'];

let enginePromise = null;
export const loadEngine = () => {
  if (!enginePromise) enginePromise = import('../utils/chatEngine.js');
  return enginePromise;
};

function loadTawk() {
  if (!TAWK_P || !TAWK_W || window.Tawk_API) {
    if (window.Tawk_API && window.Tawk_API.maximize) window.Tawk_API.maximize();
    return Boolean(TAWK_P && TAWK_W);
  }
  window.Tawk_API = window.Tawk_API || {};
  window.Tawk_API.onLoad = () => window.Tawk_API.maximize();
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://embed.tawk.to/${TAWK_P}/${TAWK_W}`;
  s.charset = 'UTF-8';
  s.setAttribute('crossorigin', '*');
  document.body.appendChild(s);
  return true;
}

const timeNow = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function Typewriter({ lines }) {
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  useEffect(() => {
    const full = lines[i];
    if (n < full.length) {
      const t = setTimeout(() => setN(n + 1), 38);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setI((i + 1) % lines.length); setN(0); }, 2600);
    return () => clearTimeout(t);
  }, [i, n, lines]);
  return <span className="hc-type">{lines[i].slice(0, n)}<i aria-hidden="true" /></span>;
}

// Inline "leave your details" card
// "Talk to our team" — a step-by-step contact card, asked like a conversation:
// full name → email → country (flag) → phone (optional, country code + flag) → consent & send.
// Answered steps stay as chips (tap to edit). Sent to VITE_CHAT_LEAD_ENDPOINT (default /api/chat-leads).
const LEAD_STEPS = [
  { k: 'name', q: 'What’s your full name?', icon: 'user' },
  { k: 'email', q: 'Which email should we reply to?', icon: 'mail' },
  { k: 'country', q: 'Which country are you in?', icon: 'globe' },
  { k: 'phone', q: 'A phone number? (optional)', icon: 'phone' },
  { k: 'send', q: 'All set — shall we send this to our team?', icon: 'send' },
];
function LeadForm({ question, tab, onDone }) {
  const { pathname } = useLocation();
  const [v, setV] = useState({ name: '', email: '', iso: '', dial: '', phone: '', consent: false, website: '' });
  const [s, setS] = useState(0);
  const [err, setErr] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | sent | failed
  const inputRef = useRef(null);
  useEffect(() => { const t = setTimeout(() => inputRef.current && inputRef.current.focus({ preventScroll: true }), 80); return () => clearTimeout(t); }, [s]);
  const set = (k, val) => { setV((x) => { const n = { ...x, [k]: val }; if (k === 'iso' && !x.phone) n.dial = val; return n; }); setErr(''); };
  const country = COUNTRIES.find((c) => c.iso === v.iso);
  const dialC = COUNTRIES.find((c) => c.iso === v.dial);
  const validate = (k) => {
    if (k === 'name' && !/^[\p{L}][\p{L}\s.'-]{1,79}$/u.test(v.name.trim())) return 'Please enter your full name.';
    if (k === 'email' && !EMAIL_RE.test(v.email.trim())) return 'Please enter a valid email address.';
    if (k === 'country' && !v.iso) return 'Please choose your country.';
    if (k === 'phone') {
      const d = v.phone.replace(/\D/g, '');
      if (d && (d.length < 6 || d.length > 15)) return 'Please enter 6–15 digits, or skip.';
      if (d && !v.dial) return 'Please choose a country code.';
    }
    if (k === 'send' && !v.consent) return 'Please agree so we can reply.';
    return '';
  };
  const next = async (e) => {
    if (e) e.preventDefault();
    const k = LEAD_STEPS[s].k;
    const m = validate(k);
    if (m) { setErr(m); return; }
    if (k !== 'send') { setS(s + 1); return; }
    if (v.website) return;
    setState('sending');
    try {
      const phone = v.phone.replace(/\D/g, '') ? `${dialC ? dialC.dial : ''} ${v.phone.trim()}`.trim() : '';
      if (DEMO_MODE) {
        await new Promise((r) => setTimeout(r, 800));
      } else {
        const res = await fetch(API_BASE + LEAD_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ name: v.name.trim(), email: v.email.trim(), phone, country: country ? country.name : '', consent: true, website: v.website, question, page: pathname }),
        });
        if (!res.ok) throw new Error(String(res.status));
      }
      setState('sent');
      onDone && onDone(v.name.trim().split(' ')[0]);
    } catch {
      setState('failed');
    }
  };
  const mail = `mailto:${CONTACT.email}?subject=${encodeURIComponent('Question from Live Help')}&body=${encodeURIComponent(`Name: ${v.name}\nEmail: ${v.email}\nPhone: ${v.phone || '-'}\nCountry: ${country ? country.name : ''}\n\nQuestion: ${question || ''}`)}`;
  if (state === 'sent') {
    return (
      <div className="hl hl-sent" role="status">
        <span className="hl-ok"><Icon name="check" size={22} stroke={3} /></span>
        <b>Thanks{v.name ? `, ${v.name.trim().split(' ')[0]}` : ''}! A real person will reply.</b>
        <small>Usually within 24–72 business hours at {v.email}.{DEMO_MODE ? ' (Preview build — nothing was sent.)' : ''}</small>
      </div>
    );
  }
  const answers = [
    v.name.trim() && s > 0 ? { i: 0, icon: 'user', t: v.name.trim() } : null,
    v.email.trim() && s > 1 ? { i: 1, icon: 'mail', t: v.email.trim() } : null,
    country && s > 2 ? { i: 2, icon: null, iso: country.iso, t: country.name } : null,
    s > 3 ? { i: 3, icon: 'phone', t: v.phone.trim() ? `${dialC ? dialC.dial : ''} ${v.phone.trim()}` : 'No phone' } : null,
  ].filter(Boolean);
  const step = LEAD_STEPS[s];
  return (
    <form className="hl" onSubmit={next} noValidate>
      <div className="hl-head">
        <span className="hl-team" aria-hidden="true"><i><Icon name="headset" size={14} /></i><i><Icon name="chat" size={14} /></i><i><Icon name="mail" size={14} /></i></span>
        <div><b>Talk to our team</b><small>A real person replies</small></div>
        <span className="hl-dots" aria-label={`Step ${s + 1} of ${LEAD_STEPS.length}`}>{LEAD_STEPS.map((x, k) => <i key={x.k} className={k < s ? 'done' : k === s ? 'now' : ''} />)}</span>
      </div>
      {answers.length ? (
        <ul className="hl-answers">
          {answers.map((a) => (
            <li key={a.i}><button type="button" onClick={() => { setS(a.i); setErr(''); }} tabIndex={tab} aria-label={`Edit: ${a.t}`}>{a.iso ? <Flag iso={a.iso} size={12} /> : <Icon name={a.icon} size={12} />} {a.t} <Icon name="pen" size={11} /></button></li>
          ))}
        </ul>
      ) : null}
      <div className="hl-step" key={step.k}>
        <p className="hl-q"><span><Icon name={step.icon} size={14} /></span> {step.q}</p>
        {step.k === 'name' ? <input ref={inputRef} className="hl-in" value={v.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" maxLength={80} placeholder="First and last name" tabIndex={tab} aria-label="Full name" aria-invalid={Boolean(err)} /> : null}
        {step.k === 'email' ? <input ref={inputRef} className="hl-in" type="email" value={v.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" maxLength={120} placeholder="you@email.com" tabIndex={tab} aria-label="Email ID" aria-invalid={Boolean(err)} /> : null}
        {step.k === 'country' ? <CountryPicker id="hl-country" list={COUNTRIES} value={v.iso} onChange={(c) => set('iso', c.iso)} invalid={Boolean(err)} /> : null}
        {step.k === 'phone' ? (
          <div className="hl-phone">
            <CountryPicker id="hl-dial" list={COUNTRIES} value={v.dial} onChange={(c) => set('dial', c.iso)} mode="dial" placeholder="Code" />
            <input ref={inputRef} className="hl-in" type="tel" inputMode="tel" value={v.phone} onChange={(e) => set('phone', e.target.value.replace(/[^\d\s-]/g, ''))} autoComplete="tel-national" maxLength={20} placeholder="Number" tabIndex={tab} aria-label="Phone number" aria-invalid={Boolean(err)} />
          </div>
        ) : null}
        {step.k === 'send' ? (
          <label className="hl-consent">
            <input type="checkbox" checked={v.consent} onChange={(e) => set('consent', e.target.checked)} tabIndex={tab} />
            <span>MyFrequentRewards may use these details to reply to my question (<Link to="/privacy" tabIndex={tab}>Privacy Policy</Link>).</span>
          </label>
        ) : null}
        {err ? <em className="hl-err" role="alert">{err}</em> : null}
      </div>
      <input className="hp" tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => set('website', e.target.value)} aria-hidden="true" />
      {state === 'failed' ? (
        <p className="hl-fail" role="alert">We couldn’t send that just now. <a href={mail} tabIndex={tab}>Email it to us</a> or <a href={whatsappLink(`Hi, my question: ${question || ''}`)} target="_blank" rel="noopener noreferrer" tabIndex={tab}>WhatsApp us</a>.</p>
      ) : null}
      <div className="hl-acts">
        {s > 0 ? <button type="button" className="hl-back" onClick={() => { setS(s - 1); setErr(''); }} tabIndex={tab}><Icon name="arrow" size={14} /> Back</button> : <span />}
        {step.k === 'phone' && !v.phone.trim() ? <button type="button" className="hl-skip" onClick={() => setS(s + 1)} tabIndex={tab}>Skip</button> : null}
        <button type="submit" className="hl-next" disabled={state === 'sending'} tabIndex={tab}>
          {step.k === 'send' ? (state === 'sending' ? 'Sending…' : <>Send to our team <Icon name="send" size={14} /></>) : <>Next <Icon name="arrow" size={14} /></>}
        </button>
      </div>
    </form>
  );
}

export default function LiveChat({ open, onClose, seed }) {
  // Translated pages show the greeting whole (a letter-by-letter typewriter cannot be translated mid-word).
  const { lang } = useI18n();
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [sent, setSent] = useState(0);
  const [hints, setHints] = useState([]);
  const [engine, setEngine] = useState(null);
  const [hints, setHints] = useState([]);
  const [engine, setEngine] = useState(null);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const started = msgs.length > 0;

  const [sound, setSoundState] = useState(true);
  useEffect(() => setSoundState(soundOn()), []);
  useEffect(() => {
    if (open) {
      pop(); // pop every time the chat opens
      loadEngine().then(setEngine).catch(() => {});
      loadEngine().then(setEngine).catch(() => {});
      setTimeout(() => inputRef.current && inputRef.current.focus({ preventScroll: true }), 300);
    }
  }, [open]);
  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    setSoundState(next);
    if (next) pop({ volume: 0.15 });
  };
  useEffect(() => {
    // Keep the welcome screen at the top; follow the conversation once it starts.
    if (bodyRef.current && (msgs.length || typing)) bodyRef.current.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, typing]);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && open && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  useEffect(() => {
    setHints(engine && input.trim().length >= 3 ? engine.suggest(input) : []);
  }, [input, engine]);
  useEffect(() => {
    setHints(engine && input.trim().length >= 3 ? engine.suggest(input) : []);
  }, [input, engine]);

  const ask = async (text) => {
  const ask = async (text) => {
    const q = text.trim();
    if (!q || typing) return;
    setMsgs((m) => [...m, { from: 'me', text: q, at: timeNow() }]);
    setInput('');
    setHints([]);
    setHints([]);
    setSent((s) => s + 1);
    setTyping(true);
    let res;
    try {
      const eng = engine || (await loadEngine());
      if (!engine) setEngine(eng);
      res = eng.answer(q);
    } catch {
      res = { a: 'Sorry — I couldn’t load answers just now. Please leave your details and our team will reply.', lead: true };
    }
    let res;
    try {
      const eng = engine || (await loadEngine());
      if (!engine) setEngine(eng);
      res = eng.answer(q);
    } catch {
      res = { a: 'Sorry — I couldn’t load answers just now. Please leave your details and our team will reply.', lead: true };
    }
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: 'bot', q, ...res, at: timeNow() }]);
      setMsgs((m) => [...m, { from: 'bot', q, ...res, at: timeNow() }]);
      pop({ volume: 0.1, pitch: 1.3 }); // gentle pop for each reply
    }, 650 + Math.min(q.length * 10, 800));
    }, 650 + Math.min(q.length * 10, 800));
  };
  useEffect(() => {
    if (seed && seed.q) setTimeout(() => ask(seed.q), 450);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);
  const patch = (idx, obj) => setMsgs((m) => m.map((x, i) => (i === idx ? { ...x, ...obj } : x)));
  useEffect(() => {
    if (seed && seed.q) setTimeout(() => ask(seed.q), 450);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);
  const patch = (idx, obj) => setMsgs((m) => m.map((x, i) => (i === idx ? { ...x, ...obj } : x)));
  const tab = open ? 0 : -1;

  return (
    <div className={`hc ${open ? 'is-open' : ''}`} role="dialog" aria-modal="false" aria-label="Live Help chat" aria-hidden={!open}>
      <div className="hc-head">
        <span className="hc-aurora a1" aria-hidden="true" />
        <span className="hc-aurora a2" aria-hidden="true" />
        <div className="hc-head-row">
          <div className="hc-avatar" aria-hidden="true">
            <span className="hc-avatar-ring" />
            <img src={BRAND.monogram} alt="MyFrequentRewards Live Help assistant" width="40" height="40" />
            <i className="hc-online" />
          </div>
          <div className="hc-title">
            <strong>Live Help <span>24/7</span></strong>
            <small><i className="hc-dot" /> Online now · instant answers</small>
            <small><i className="hc-dot" /> Online now · instant answers</small>
          </div>
          <button type="button" className={`hc-snd ${sound ? '' : 'off'}`} onClick={toggleSound} aria-pressed={!sound} aria-label={sound ? 'Mute chat sounds' : 'Turn chat sounds on'} title={sound ? 'Sound on' : 'Sound off'} tabIndex={tab}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Sound icon">
              <path d="M11 5 6 9H3v6h3l5 4z" />
              {sound ? <><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></> : <path d="m16 9 5 6m0-6-5 6" />}
            </svg>
          </button>
          <button type="button" className="hc-x" onClick={onClose} aria-label="Close chat" tabIndex={tab}><Icon name="close" size={18} /></button>
        </div>
        <div className="hc-wave" aria-hidden="true">
          <svg viewBox="0 0 400 24" preserveAspectRatio="none" role="img" aria-label="Decorative wave"><path d="M0 12 C 60 0, 100 24, 160 12 S 260 0, 320 12 S 380 24, 400 12 V24 H0Z" /></svg>
        </div>
      </div>

      <div className="hc-body" ref={bodyRef} aria-live="polite">
        {!started ? (
          <div className="hc-welcome">
            <p className="hc-hi"><span className="hc-wave-hand" aria-hidden="true">👋</span> Hi there!</p>
            <h3>{open && lang === 'en' ? <Typewriter lines={GREETINGS} /> : GREETINGS[0]}</h3>
            <p className="hc-sub">Ask anything about joining, surveys, rewards, payouts, privacy or your account — every answer links to the page it comes from.</p>
            <div className="hc-topics">
              {TOPICS.map((t, i) => (
                <button type="button" key={t.t} className="hc-topic" style={{ '--c': t.c, '--i': i }} onClick={() => ask(t.q)} tabIndex={tab}>
                  <span className="hc-topic-ico"><Icon name={t.icon} size={18} /></span>
                  <b>{t.t}</b>
                  <small>{t.d}</small>
                </button>
              ))}
            </div>
            <a className="hc-wa-card" href={whatsappLink()} target="_blank" rel="noopener noreferrer" tabIndex={tab}>
              <span className="hc-wa-ico"><Icon name="whatsapp" size={20} /></span>
              <span><b>Prefer WhatsApp?</b><small>Chat with our support team</small></span>
              <Icon name="arrow" size={16} />
            </a>
          </div>
        ) : null}

        {msgs.map((m, i) => (
          <Fragment key={i}>
          <div className={`hc-msg ${m.from}`}>
            {m.from === 'bot' ? <img className="hc-msg-av" src={BRAND.monogram} alt="MyFrequentRewards assistant" width="28" height="28" /> : null}
            <div className="hc-bubble">
              {m.unsure ? <p className="hc-unsure">Here’s the closest answer I found:</p> : null}
              <p>{m.a || m.text}</p>
              {m.src || m.more ? (
                <div className="hc-src">
                  {m.src ? <Link to={m.src.path} className="hc-src-chip" onClick={onClose} tabIndex={tab}><Icon name="book" size={13} /> <span>Source: {m.src.label}</span> <Icon name="arrow" size={12} /></Link> : null}
                  {m.more && (!m.src || m.more.path !== m.src.path) ? <Link to={m.more.path} className="hc-src-chip alt" onClick={onClose} tabIndex={tab}><Icon name="link" size={13} /> <span>{m.more.label}</span></Link> : null}
                </div>
              {m.unsure ? <p className="hc-unsure">Here’s the closest answer I found:</p> : null}
              <p>{m.a || m.text}</p>
              {m.src || m.more ? (
                <div className="hc-src">
                  {m.src ? <Link to={m.src.path} className="hc-src-chip" onClick={onClose} tabIndex={tab}><Icon name="book" size={13} /> <span>Source: {m.src.label}</span> <Icon name="arrow" size={12} /></Link> : null}
                  {m.more && (!m.src || m.more.path !== m.src.path) ? <Link to={m.more.path} className="hc-src-chip alt" onClick={onClose} tabIndex={tab}><Icon name="link" size={13} /> <span>{m.more.label}</span></Link> : null}
                </div>
              ) : null}
              {m.human ? (
                <div className="hc-human">
                  <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" tabIndex={tab} className="wa"><Icon name="whatsapp" size={16} /> WhatsApp</a>
                  <a href={`mailto:${CONTACT.email}`} tabIndex={tab}><Icon name="mail" size={16} /> Email</a>
                  {TAWK_P ? <button type="button" onClick={loadTawk} tabIndex={tab}><Icon name="chat" size={16} /> Live agent</button> : null}
                </div>
              ) : null}
              {m.from === 'bot' && m.unsure && !m.lead && !m.showLead ? (
                <button type="button" className="hc-notit" onClick={() => patch(i, { showLead: true })} tabIndex={tab}>Not what I asked — contact the team</button>
              ) : null}
              {m.related && m.related.length ? (
                <div className="hc-related" aria-label="Related questions">
                  <small>Related</small>
                  {m.related.map((r) => <button type="button" key={r} onClick={() => ask(r)} tabIndex={tab}>{r}</button>)}
                </div>
              ) : null}
              {m.from === 'bot' && m.unsure && !m.lead && !m.showLead ? (
                <button type="button" className="hc-notit" onClick={() => patch(i, { showLead: true })} tabIndex={tab}>Not what I asked — contact the team</button>
              ) : null}
              {m.related && m.related.length ? (
                <div className="hc-related" aria-label="Related questions">
                  <small>Related</small>
                  {m.related.map((r) => <button type="button" key={r} onClick={() => ask(r)} tabIndex={tab}>{r}</button>)}
                </div>
              ) : null}
              <span className="hc-meta">
                {m.at}
                {m.from === 'bot' && !m.lead ? (
                  m.rated ? <em className="hc-thanks">{m.rated === 'down' ? 'Thanks — tell us more below.' : 'Thanks for the feedback!'}</em> : (
                {m.from === 'bot' && !m.lead ? (
                  m.rated ? <em className="hc-thanks">{m.rated === 'down' ? 'Thanks — tell us more below.' : 'Thanks for the feedback!'}</em> : (
                    <span className="hc-rate">
                      Helpful?
                      <button type="button" onClick={() => patch(i, { rated: 'up' })} aria-label="Yes, helpful" tabIndex={tab}>👍</button>
                      <button type="button" onClick={() => patch(i, { rated: 'down', showLead: true })} aria-label="Not helpful" tabIndex={tab}>👎</button>
                      <button type="button" onClick={() => patch(i, { rated: 'up' })} aria-label="Yes, helpful" tabIndex={tab}>👍</button>
                      <button type="button" onClick={() => patch(i, { rated: 'down', showLead: true })} aria-label="Not helpful" tabIndex={tab}>👎</button>
                    </span>
                  )
                ) : m.from === 'me' ? <span className="hc-tick" aria-label="Sent">✓✓</span> : null}
                ) : m.from === 'me' ? <span className="hc-tick" aria-label="Sent">✓✓</span> : null}
              </span>
            </div>
          </div>
          {m.from === 'bot' && (m.lead || m.showLead) ? (
            <div className="hc-leadrow"><LeadForm question={m.q} tab={tab} onDone={() => pop({ volume: 0.12, pitch: 1.5 })} /></div>
          ) : null}
          </Fragment>
          {m.from === 'bot' && (m.lead || m.showLead) ? (
            <div className="hc-leadrow"><LeadForm question={m.q} tab={tab} onDone={() => pop({ volume: 0.12, pitch: 1.5 })} /></div>
          ) : null}
          </Fragment>
        ))}
        {typing ? (
          <div className="hc-msg bot">
            <img className="hc-msg-av" src={BRAND.monogram} alt="MyFrequentRewards assistant" width="28" height="28" />
            <div className="hc-bubble hc-typing" aria-label="Support is typing"><span /><span /><span /></div>
          </div>
        ) : null}
      </div>

      {hints.length ? (
        <ul className="hc-hints" aria-label="Suggested questions">
          {hints.map((h) => <li key={h}><button type="button" onClick={() => ask(h)} tabIndex={tab}><Icon name="sparkle" size={13} /> {h}</button></li>)}
        </ul>
      ) : (
        <div className="hc-popular" aria-label="Popular questions">
          <div className="hc-popular-track">
            {[...POPULAR, ...POPULAR].map((q, i) => (
              <button type="button" key={q + i} onClick={() => ask(q)} tabIndex={i < POPULAR.length ? tab : -1} aria-hidden={i >= POPULAR.length}>{q}</button>
            ))}
          </div>
        </div>
      )}
      {hints.length ? (
        <ul className="hc-hints" aria-label="Suggested questions">
          {hints.map((h) => <li key={h}><button type="button" onClick={() => ask(h)} tabIndex={tab}><Icon name="sparkle" size={13} /> {h}</button></li>)}
        </ul>
      ) : (
        <div className="hc-popular" aria-label="Popular questions">
          <div className="hc-popular-track">
            {[...POPULAR, ...POPULAR].map((q, i) => (
              <button type="button" key={q + i} onClick={() => ask(q)} tabIndex={i < POPULAR.length ? tab : -1} aria-hidden={i >= POPULAR.length}>{q}</button>
            ))}
          </div>
        </div>
      )}

      <form className="hc-input" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
        <label htmlFor="chat-q" className="sr-only">Type your question</label>
        <span className="hc-input-ico" aria-hidden="true"><Icon name="sparkle" size={18} /></span>
        <input id="chat-q" ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything about surveys or rewards…" maxLength={300} autoComplete="off" tabIndex={tab} />
        <button type="submit" className={`hc-send ${input.trim() ? 'ready' : ''} ${sent ? 'flew' : ''}`} aria-label="Send" tabIndex={tab} key={sent}><Icon name="send" size={18} /></button>
      </form>
      <p className="hc-foot"><Icon name="lock" size={12} /> Secure · We’ll never ask for your password or OTP</p>
    </div>
  );
}

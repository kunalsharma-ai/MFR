import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useInView from '../hooks/useInView.js';
import Icon from '../components/Icon.jsx';
import PageHero, { PageSeo } from '../components/PageHero.jsx';
import { CtaBand, FaqSplit } from '../components/Common.jsx';
import { PAGES } from '../data/pages.js';
import { DepartmentWheel, IndustryBento, JobTitleWaterfall } from '../sections/ProfileSections.jsx';
import { VerificationScanner } from '../sections/TrustSections.jsx';
import { RewardGalaxy } from '../sections/RewardSections.jsx';
import { FAQ_PROFESSIONALS, FAQ_WHO } from '../data/faqs.js';
import CountryAtlas from '../sections/CountryAtlas.jsx';
import ProductVoices from '../sections/ProductVoices.jsx';

const page = PAGES.professionals;
const crumbs = [{ name: 'Home', path: '/' }, { name: 'For Professionals', path: page.path }];

const TOPICS = [
  { icon: 'database', t: 'Software & cloud', d: 'Tools you evaluate, buy or use daily.', q: 'Which features would make you switch your team’s CRM next year?', who: 'IT leads · developers · CIOs' },
  { icon: 'clipboard', t: 'Procurement', d: 'How vendors are chosen and budgets set.', q: 'What makes a new supplier make your shortlist?', who: 'Buyers · finance · operations heads' },
  { icon: 'activity', t: 'Operations', d: 'Manufacturing, logistics and supply chains.', q: 'Where do delays in your supply chain usually start?', who: 'Plant managers · logistics · quality' },
  { icon: 'heart', t: 'Healthcare', d: 'Clinical practice, devices and care pathways.', q: 'How do you decide which device to recommend to a patient?', who: 'Doctors · nurses · pharmacists' },
  { icon: 'user', t: 'People & HR', d: 'Hiring, training and workplace technology.', q: 'Which hiring tools save your team the most time?', who: 'HR managers · recruiters · L&D' },
  { icon: 'trend', t: 'Strategy', d: 'Industry outlook, regulation and growth.', q: 'Which regulation will change your industry most by 2028?', who: 'Founders · directors · consultants' },
];

// v2.5: eligibility questions from the former Who Can Join page live here now
const FAQS = [...FAQ_PROFESSIONALS, ...FAQ_WHO.filter((f) => /countries|industry and department|particular job/i.test(f.q))];

export default function Professionals() {
  return (
    <>
      <PageSeo page={page} faqs={FAQS} crumbs={crumbs} />
      <PageHero
        crumbs={crumbs}
        eyebrow="For business professionals"
        title={page.h1}
        tagline={[['book', 'Know your field.'], ['trend', 'Shape your market.'], ['badge', 'Earn the premium.']]}
        tone="pro"
        lead="Your expertise moves markets. Share it in verified B2B studies — from enterprise software to hospital operations — and earn rewards that respect the value of your time."
        art="grid"
        theme="exec"
      >
        <div className="ph-actions">
          <Link to="/sign-up?type=professional" className="btn btn-light">Join as a professional <Icon name="arrow" size={18} /></Link>
          <a href="#countries" className="btn btn-outline-light">Countries we cover</a>
        </div>
      </PageHero>

      <section className="section bf bt-sec" aria-labelledby="tp-title">
        <div className="container bf-row">
          <div className="reveal">
            <p className="eyebrow">B2B research</p>
            <h2 id="tp-title">What professionals are asked about</h2>
            <p className="sec-sub">Make money from the internet without investment by doing what you already do best — thinking critically about your field. Read the full <Link to="/blog/paid-surveys-for-business-professionals">professional’s guide</Link>.</p>
          </div>
          <BriefTerminal />
        </div>
      </section>

      <JobTitleWaterfall />
      <IndustryBento />
      <DepartmentWheel />
      <CountryAtlas variant="professional" />
      <RewardGalaxy tone="pro" />
      <VerificationScanner />

      <section className="section idp" aria-labelledby="pr-deep">
        <div className="container">
          <div className="sec-head sec-center reveal">
            <p className="eyebrow eyebrow-light">Privacy by design</p>
            <h2 id="pr-deep">Expert opinion, protected identity</h2>
            <p className="sec-sub">Verification confirms your credentials — it never exposes them. Here is what happens to your answers.</p>
          </div>
          <ol className="idp-pipe">
            {[
              ['user', 'You', 'Your name, employer and contacts', 'Private'],
              ['shield', 'Verified once', 'Company email, phone, public profile', 'Checked'],
              ['lock', 'Answers de-identified', 'Details stripped before reporting', 'Encrypted'],
              ['trend', 'Client sees insight', 'Anonymised or aggregated results only', 'Anonymous'],
            ].map(([ic, t, d, tag], i) => (
              <li key={t} className="reveal" style={{ '--i': i }}>
                <span className="idp-ico"><Icon name={ic} size={24} /></span>
                <em>{tag}</em>
                <h3>{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
          <p className="idp-note reveal">Your name, employer and contact details are never passed to research clients. See the full list of <Link to="/trust-and-safety">quality and security checks</Link> and our <Link to="/privacy">privacy policy</Link>. Market research standards such as <a href="https://www.iso.org/standard/73671.html" target="_blank" rel="noopener noreferrer">ISO 20252</a> guide how our parent company works.</p>
        </div>
      </section>

      <ProductVoices kind="professional" />
      <FaqSplit id="pr-faq" look="dossier" title="Professional questions" faqs={FAQS} hue="#2F6BFF" hue2="#8B5CF6" />
      <CtaBand title="Your expertise deserves a reward." sub="Join free, verify once, and start receiving B2B invitations." variant="exec" />
    </>
  );
}

// "Research terminal" (Round 12): six B2B research desks on a dark trading-floor terminal. The desks cycle on
// their own (pausing on hover or focus); the open desk types out a real-style study question and who it is for.
const SPARK = ['M0 18 L10 12 L20 14 L30 6 L40 9 L50 3', 'M0 10 L10 14 L20 8 L30 11 L40 5 L50 7', 'M0 16 L10 15 L20 9 L30 12 L40 6 L50 4', 'M0 12 L10 6 L20 10 L30 4 L40 8 L50 2', 'M0 14 L10 10 L20 12 L30 8 L40 9 L50 5', 'M0 18 L10 14 L20 9 L30 10 L40 4 L50 3'];
const HUES = ['#5B8CFF', '#FFB547', '#2EE6CF', '#FF6B9A', '#B794FF', '#3DDC97'];
function BriefTerminal() {
  const [ref, inView] = useInView({ once: false, threshold: 0.3 });
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const [n, setN] = useState(0);
  const t = TOPICS[i];
  const calm = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => { setN(calm ? t.q.length : 0); }, [i, calm, t.q.length]);
  useEffect(() => {
    if (!inView) return undefined;
    if (n < t.q.length) { const k = setTimeout(() => setN((x) => x + 1), 26); return () => clearTimeout(k); }
    if (hold) return undefined;
    const k = setTimeout(() => setI((x) => (x + 1) % TOPICS.length), 2600);
    return () => clearTimeout(k);
  }, [inView, n, t.q.length, hold]);
  return (
    <div className="bt" ref={ref} style={{ '--c': HUES[i] }} onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}>
      <div className="bt-bar" aria-hidden="true"><i /><i /><i /><span>mfr://b2b-research/desks</span><b>LIVE</b></div>
      <div className="bt-body">
        <ul className="bt-desks" role="tablist" aria-label="Research topics">
          {TOPICS.map((x, k) => (
            <li key={x.t}>
              <button type="button" role="tab" aria-selected={k === i} className={k === i ? 'on' : ''} style={{ '--c': HUES[k] }} onClick={() => setI(k)}>
                <span className="bt-ic"><Icon name={x.icon} size={18} /></span>
                <span className="bt-tx"><b>{x.t}</b><small>{x.d}</small></span>
                <svg viewBox="0 0 50 20" aria-hidden="true"><path d={SPARK[k]} /></svg>
              </button>
            </li>
          ))}
        </ul>
        <div className="bt-screen" role="tabpanel" aria-live="polite">
          <p className="bt-k"><span className="bt-dot" /> Brief 0{i + 1} · {t.t}</p>
          <p className="bt-q"><span className="sr-only">{t.q}</span><span aria-hidden="true">{t.q.slice(0, n)}<i className="bt-caret" /></span></p>
          <div className="bt-meta">
            <span><Icon name="user" size={15} /> {t.who}</span>
            <span><Icon name="clock" size={15} /> 10–20 min</span>
            <span><Icon name="shield" size={15} /> Identity never shared</span>
          </div>
          <div className="bt-chart" aria-hidden="true">{Array.from({ length: 14 }).map((_, k) => <i key={`${i}-${k}`} style={{ '--h': `${25 + ((k * 37 + i * 13) % 70)}%`, '--k': k }} />)}</div>
        </div>
      </div>
    </div>
  );
}

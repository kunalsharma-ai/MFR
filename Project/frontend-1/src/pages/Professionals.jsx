import { Link } from 'react-router-dom';
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
  { icon: 'database', t: 'Software & cloud', d: 'Tools you evaluate, buy or use daily.' },
  { icon: 'clipboard', t: 'Procurement', d: 'How vendors are chosen and budgets set.' },
  { icon: 'activity', t: 'Operations', d: 'Manufacturing, logistics and supply chains.' },
  { icon: 'heart', t: 'Healthcare', d: 'Clinical practice, devices and care pathways.' },
  { icon: 'user', t: 'People & HR', d: 'Hiring, training and workplace technology.' },
  { icon: 'trend', t: 'Strategy', d: 'Industry outlook, regulation and growth.' },
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

      <section className="section bf" aria-labelledby="tp-title">
        <div className="container bf-row">
          <div className="reveal">
            <p className="eyebrow">B2B research</p>
            <h2 id="tp-title">What professionals are asked about</h2>
            <p className="sec-sub">Make money from the internet without investment by doing what you already do best — thinking critically about your field. Read the full <Link to="/blog/paid-surveys-for-business-professionals">professional’s guide</Link>.</p>
          </div>
          <ul className="bf-folders">
            {TOPICS.map((t, i) => (
              <li key={t.t} className="bf-folder" style={{ '--i': i, '--c': ['#2F6BFF', '#C77700', '#14C9B5', '#D6336C', '#8B5CF6', '#0E9F6E'][i] }} tabIndex={0}>
                <span className="bf-tab">Brief 0{i + 1}</span>
                <span className="bf-paper" aria-hidden="true"><i /><i /><i /></span>
                <span className="bf-ico"><Icon name={t.icon} size={22} /></span>
                <strong>{t.t}</strong>
                <small>{t.d}</small>
              </li>
            ))}
          </ul>
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

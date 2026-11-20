import { Suspense } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { CtaBand, FaqSplit } from '../components/Common.jsx';
import { PageSeo } from '../components/PageHero.jsx';
import { HOME_FAQS, PAGES } from '../data/pages.js';
import HeroOrbit from '../sections/HeroOrbit.jsx';
import InviteMarquee from '../sections/InviteMarquee.jsx';
import AudienceSplit from '../sections/AudienceSplit.jsx';
import JourneyPath from '../sections/JourneyPath.jsx';
import GlobeReach from '../sections/GlobeReach.jsx';
import { JobTitleWaterfall } from '../sections/ProfileSections.jsx';
import { IncentiveStories, InvitationsPhone, PayoutFan } from '../sections/RewardSections.jsx';
import { PrivacyVault, QualityRadar, VerificationScanner } from '../sections/TrustSections.jsx';
import BlogBento from '../sections/BlogBento.jsx';
import SearchShowcase from '../sections/SearchShowcase.jsx';
import { CommunityLedger, MemberVoices, SurveyBoard } from '../sections/CommunitySections.jsx';

// Each block below the first screen is its own hydration unit: React wakes them up one by one in short tasks
// after the first screen is interactive, instead of in one long task (the HTML is already there either way).
const Part = ({ children }) => <Suspense fallback={null}>{children}</Suspense>;

const page = PAGES.home;

const WHY = [
  { icon: 'heart', t: '100% free membership', d: 'No joining fee, no deposit, no withdrawal charge.' },
  { icon: 'coins', t: 'Rewarding opinions', d: 'Every eligible survey adds to your balance.' },
  { icon: 'mobile', t: 'Any device, anywhere', d: 'Phone, tablet or laptop — wherever you are.' },
  { icon: 'lock', t: 'Secure & confidential', d: 'Your personal details are never sold or shared.' },
  { icon: 'wallet', t: 'Seven reward types', d: 'PayPal, bank or wire transfer, vouchers, gift cards and more — plus UPI in India.' },
  { icon: 'headset', t: '24/7 Live Help', d: 'Chat or WhatsApp us whenever you need a hand.' },
];

export default function Home() {
  return (
    <>
      <PageSeo page={page} faqs={HOME_FAQS} home />
      <HeroOrbit />
      <InviteMarquee />
      <CommunityLedger />

      <section className="section wh" aria-labelledby="intro-title">
        <div className="container wh-row">
          <div className="wh-copy reveal">
            <p className="eyebrow">Why MyFrequentRewards</p>
            <h2 id="intro-title">The honest way to <span className="hl-orange">earn money online without investment</span></h2>
            <p className="wh-lead">Brands need real opinions. You have them. We turn every eligible answer into a reward you can actually use.</p>
            <ol className="wh-flow" aria-label="How value flows">
              {[['briefcase', 'Brands ask', 'Companies need real people’s views', '#2F6BFF'], ['chat', 'You answer', 'Honest opinions in paid surveys', '#FF8A00'], ['gift', 'You’re rewarded', '7 reward types, including UPI in India', '#12B76A']].map(([ic, t, d, c], i) => (
                <li key={t} style={{ '--c': c, '--i': i }}>
                  <span className="wh-node"><Icon name={ic} size={22} /></span>
                  <b>{t}</b>
                  <small>{d}</small>
                </li>
              ))}
            </ol>
            <details className="wh-story">
              <summary><Icon name="book" size={16} /> Read the full story</summary>
              <p>
                MyFrequentRewards is the worldwide consumer and business opinion community of Frequent Research. Brands, agencies and organisations need real people to tell them what works — and they reward that insight. You share your honest opinion in paid online surveys; we turn it into rewards you can actually use. It is one of the simplest ways to make money online — and one of the few real ways to make money from home for free.
              </p>
              <p>
                Whether you are a student looking for online earning without investment, a parent searching for a side hustle from home, or a senior professional with rare industry expertise, joining is free and takes minutes. Take online surveys for money on any device and redeem via PayPal, bank or wire transfer, shopping, grocery or digital gift card vouchers — plus UPI in India. Read our guide on <Link to="/blog/how-to-earn-money-online-with-surveys">how to earn money online with surveys</Link> or see <Link to="/how-it-works">how it works</Link>.
              </p>
            </details>
          </div>
          <ul className="wh-hive">
            {WHY.map((w, i) => (
              <li key={w.t} className="wh-hex reveal" style={{ '--i': i, '--c': ['#FF8A00', '#FF3B8D', '#8B5CF6', '#2F6BFF', '#14C9B5', '#E5A100'][i] }}>
                <div className="wh-hex-in" tabIndex={0}>
                  <div className="wh-front"><span className="wh-ico"><Icon name={w.icon} size={26} /></span><h3>{w.t}</h3></div>
                  <div className="wh-back"><p>{w.d}</p></div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Part><AudienceSplit /></Part>
      <Part><JourneyPath /></Part>
      <Part><SurveyBoard /></Part>
      <Part><GlobeReach /></Part>
      <Part><JobTitleWaterfall /></Part>
      <Part><InvitationsPhone /></Part>
      <Part><PayoutFan /></Part>
      <Part><IncentiveStories /></Part>
      <Part><MemberVoices /></Part>
      <Part><QualityRadar /></Part>
      <Part><VerificationScanner /></Part>
      <Part><PrivacyVault /></Part>
      <Part><SearchShowcase /></Part>
      <Part><BlogBento /></Part>

      <FaqSplit id="faq-home-title" title="Quick answers before you join" sub={<>Still curious? Our <Link to="/faq">full FAQ</Link> covers surveys, rewards and privacy — or ask Live Help any time.</>} faqs={HOME_FAQS} hue="#FF8A00" hue2="#FF3B8D">
        <a className="ext-note" href="https://esomar.org/codes-and-guidelines" target="_blank" rel="noopener noreferrer"><Icon name="book" size={16} /> Market research codes of conduct (ESOMAR)</a>
      </FaqSplit>

      <Part><CtaBand /></Part>
    </>
  );
}

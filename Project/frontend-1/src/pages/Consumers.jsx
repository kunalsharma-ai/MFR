import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import PageHero, { PageSeo } from '../components/PageHero.jsx';
import { CtaBand, FaqSplit } from '../components/Common.jsx';
import { PAGES } from '../data/pages.js';
import { DemographicRibbons, InterestMosaic } from '../sections/ProfileSections.jsx';
import { PayoutFan } from '../sections/RewardSections.jsx';
import { FAQ_CONSUMERS, FAQ_WHO } from '../data/faqs.js';
import CountryAtlas from '../sections/CountryAtlas.jsx';
import ProductVoices from '../sections/ProductVoices.jsx';

const page = PAGES.consumers;
const crumbs = [{ name: 'Home', path: '/' }, { name: 'For Consumers', path: page.path }];

const PERSONAS = [
  { icon: 'book', t: 'Students', d: 'Earn between classes — tech, media and education studies love young voices.', to: '/blog/online-earning-for-students-without-investment' },
  { icon: 'heart', t: 'Homemakers & parents', d: 'Your household decisions shape grocery, family and home brands.', to: '/blog/online-earning-for-homemakers' },
  { icon: 'mobile', t: 'Gamers & streamers', d: 'Mobile, console and PC players are in constant demand.', to: '/blog/earn-money-online-on-mobile' },
  { icon: 'activity', t: 'Drivers & EV owners', d: 'Automotive, insurance and mobility research needs you.', to: '/paid-surveys-for-consumers#countries' },
  { icon: 'globe', t: 'Travellers', d: 'Airlines, hotels and travel apps want your experiences.', to: '/paid-surveys-for-consumers#countries' },
  { icon: 'clock', t: 'Retirees', d: 'Decades of perspective for health, finance and leisure studies.', to: '/blog/online-earning-for-retirees' },
];

const WEEK = [
  { d: 'Mon', t: 'Profile refresh', i: 'layers' },
  { d: 'Tue', t: 'Quick snack survey', i: 'coins' },
  { d: 'Wed', t: 'App feedback', i: 'mobile' },
  { d: 'Thu', t: 'Ad concept test', i: 'eye' },
  { d: 'Fri', t: 'Travel study', i: 'globe' },
  { d: 'Sat', t: 'Check balance', i: 'wallet' },
  { d: 'Sun', t: 'Claim reward', i: 'gift' },
];

// v2.5: eligibility questions from the former Who Can Join page live here now
const FAQS = [...FAQ_CONSUMERS, ...FAQ_WHO.filter((f) => !/industry and department/i.test(f.q))];

export default function Consumers() {
  return (
    <>
      <PageSeo page={page} faqs={FAQS} crumbs={crumbs} />
      <PageHero
        crumbs={crumbs}
        eyebrow="For consumers"
        title={page.h1}
        tagline={[['cart', 'Shop it.'], ['star', 'Rate it.'], ['coins', 'Get paid for it.']]}
        tone="con"
        lead="Earn money online from home by telling brands what you really think about the things you buy, use, watch and love. Free to join, flexible, and rewarded via PayPal, cash, vouchers or gift cards — plus UPI in India."
        art="bubbles"
        theme="berry"
      >
        <div className="ph-actions">
          <Link to="/sign-up" className="btn btn-light">Join as a consumer <Icon name="arrow" size={18} /></Link>
        </div>
      </PageHero>

      <section className="section lny" aria-labelledby="per-title">
        <div className="lny-rail" aria-hidden="true" />
        <div className="container">
          <div className="sec-head sec-center reveal">
            <p className="eyebrow">Made for real life</p>
            <h2 id="per-title">Find yourself here</h2>
            <p className="sec-sub">Online earning without investment works best when it fits your day. Grab your badge.</p>
          </div>
          <ul className="lny-row">
            {PERSONAS.map((p, i) => (
              <li key={p.t} className="lny-item" style={{ '--i': i, '--c': ['#FF8A00', '#FF3B8D', '#8B5CF6', '#2F6BFF', '#14C9B5', '#E5A100'][i] }}>
                <span className="lny-strap" aria-hidden="true" />
                <Link to={p.to} className="lny-badge">
                  <span className="lny-clip" aria-hidden="true" />
                  <span className="lny-photo"><Icon name={p.icon} size={30} /></span>
                  <span className="lny-role">Member pass</span>
                  <h3>{p.t}</h3>
                  <p>{p.d}</p>
                  <span className="lny-bar" aria-hidden="true">{Array.from({ length: 14 }, (_, k) => <i key={k} style={{ '--w': `${1 + ((k * 7 + i) % 3)}px` }} />)}</span>
                  <span className="lny-go">Explore <Icon name="arrow" size={14} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <InterestMosaic />

      <section className="section week" aria-labelledby="week-title">
        <div className="container">
          <div className="sec-head sec-center reveal">
            <p className="eyebrow">A week of earning</p>
            <h2 id="week-title">Small moments, steady rewards</h2>
            <p className="sec-sub">A typical flexible week for a consumer member — minutes at a time, never a chore.</p>
          </div>
          <ol className="week-track reveal">
            {WEEK.map((w, i) => (
              <li key={w.d} style={{ '--i': i }}>
                <span className="wk-day">{w.d}</span>
                <span className="wk-dot"><Icon name={w.i} size={18} /></span>
                <span className="wk-t">{w.t}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <DemographicRibbons />
      <CountryAtlas variant="consumer" />

      <section className="section ojr" aria-labelledby="cs-deep">
        <div className="container">
          <div className="sec-head sec-center reveal">
            <p className="eyebrow">The bigger picture</p>
            <h2 id="cs-deep">Why consumer opinions are worth rewarding</h2>
          </div>
          <ol className="ojr-flow">
            {[
              ['sparkle', 'A brand has an idea', 'A new recipe, price, package or app feature.', '#8B5CF6'],
              ['chat', 'You share your opinion', 'Before it launches, they ask people like you.', '#FF8A00'],
              ['trend', 'The product gets better', 'Your answers cut the risk of costly mistakes.', '#14C9B5'],
              ['gift', 'You’re rewarded', 'Eligible answers add to your balance.', '#FF3B8D'],
            ].map(([ic, t, d, c], i) => (
              <li key={t} className="reveal" style={{ '--c': c, '--i': i }}>
                <span className="ojr-n">0{i + 1}</span>
                <span className="ojr-ico"><Icon name={ic} size={26} /></span>
                <h3>{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
          <p className="ojr-note reveal">At MyFrequentRewards you never pay to take part — keep your profile honest, answer invitations that match you and claim your balance when you are ready. Learn the basics in <Link to="/blog/earn-money-online-free-guide">earn money online free</Link>, or see the <Link to="/trust-and-safety">security checks</Link> that keep the community fair.</p>
        </div>
      </section>

      <PayoutFan />

      <ProductVoices kind="consumer" />
      <FaqSplit id="cs-faq" title="Consumer questions" faqs={FAQS} hue="#FF5E7E" hue2="#FF8A00" />
      <CtaBand title="Your everyday opinion has value." sub="Join free and start sharing it today." variant="berry" />
    </>
  );
}

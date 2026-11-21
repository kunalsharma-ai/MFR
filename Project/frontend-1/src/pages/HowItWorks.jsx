import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import PageHero, { PageSeo } from '../components/PageHero.jsx';
import { CtaBand, FaqSplit } from '../components/Common.jsx';
import { PAGES } from '../data/pages.js';
import { FlipJourney, NotifyOrbit, ProfileMeter, StepRail, StepStairs, TwoPasses } from '../sections/HowItWorksX.jsx';
import { FAQ_HOW } from '../data/faqs.js';

const page = PAGES.howItWorks;
const crumbs = [{ name: 'Home', path: '/' }, { name: 'How It Works', path: page.path }];

const DEEP = [
  {
    icon: 'user', color: '#FF8A00', t: 'Register online — free for life',
    d: 'Create your account with an active email, mobile number, country and date of birth. A CAPTCHA and quick validation keep bots out from day one.',
    bullets: ['No fees, ever', 'Full date of birth (DD/MM/YYYY) — kept private', 'One account per person'],
  },
  {
    icon: 'doubleCheck', color: '#2F6BFF', t: 'Verify your email and phone',
    d: 'Double opt-in activates your account. It protects you, keeps the community genuine and makes sure invitations reach you.',
    bullets: ['Email confirmation link', 'Phone verification code', 'Professionals may confirm a company email'],
  },
  {
    icon: 'layers', color: '#14C9B5', t: 'Complete your profile surveys',
    d: 'Profile surveys about your household, work, interests and devices are how we match you to studies. Profile sections can also add points to your balance.',
    bullets: ['Consumer and business profile sections', 'Update anytime life changes', 'More complete = better matches'],
  },
  {
    icon: 'mail', color: '#8B5CF6', t: 'Receive matched survey invitations',
    d: 'When a study needs someone like you, you are notified through your dashboard, SMS, WhatsApp or email. Each invitation shows the topic, estimated time and incentive.',
    bullets: ['Respond early — quotas fill', 'Screen-outs are normal', 'Honest answers build your quality score'],
  },
  {
    icon: 'gift', color: '#FF5E7E', t: 'Track, claim and receive rewards',
    d: 'Watch your balance grow in the dashboard. Once you reach the claim threshold, choose PayPal, bank or wire transfer, shopping, grocery or digital gift card vouchers — or UPI if you live in India. Unclaimed balances carry forward.',
    bullets: ['Transparent balance history', 'Seven reward types', 'Support on WhatsApp and Live Help'],
  },
];

const FAQS = FAQ_HOW;

export default function HowItWorks() {
  return (
    <>
      <PageSeo page={page} faqs={FAQS} crumbs={crumbs} />
      <PageHero
        crumbs={crumbs}
        eyebrow="How it works"
        title={page.h1}
        lead="Five simple steps turn your honest opinion into real rewards — no investment, no skills, no fees. Here is exactly what happens from sign-up to payout."
        artNode={<StepStairs />}
        theme="tangerine"
      >
        <div className="ph-actions">
          <Link to="/sign-up" className="btn btn-light">Join free <Icon name="arrow" size={18} /></Link>
          <Link to="/rewards" className="btn btn-outline-light">See rewards</Link>
        </div>
      </PageHero>

      <FlipJourney />

      <StepRail steps={DEEP} />

      <ProfileMeter />

      <NotifyOrbit />

      <TwoPasses />

      <FaqSplit id="hiw-faq" look="desk" title="How it works — answered" sub={<>More in the <Link to="/faq">FAQ</Link> or our guide to <Link to="/blog/earn-money-online-without-investment">earning without investment</Link>.</>} faqs={FAQS} hue="#FF8A00" hue2="#8B5CF6" />
      <CtaBand title="Ready for step one?" sub="It’s free, it’s quick, and your first profile survey is waiting." variant="ocean" />
    </>
  );
}

import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import PageHero, { PageSeo } from '../components/PageHero.jsx';
import { CtaBand, FaqSplit } from '../components/Common.jsx';
import { PAGES } from '../data/pages.js';
import { PAYOUTS } from '../data/site.js';
import { ClaimMeter, IncentiveStories, InvitationsPhone, RewardExplorer, RewardGalaxy } from '../sections/RewardSections.jsx';
import { FAQ_REWARDS } from '../data/faqs.js';
import VideoShowcase from '../sections/VideoShowcase.jsx';
import ProductVoices from '../sections/ProductVoices.jsx';

const page = PAGES.rewards;
const crumbs = [{ name: 'Home', path: '/' }, { name: 'Rewards & Payouts', path: page.path }];


const FAQS = FAQ_REWARDS;

export default function Rewards() {
  return (
    <>
      <PageSeo page={page} faqs={FAQS} crumbs={crumbs} />
      <PageHero
        crumbs={crumbs}
        eyebrow="Rewards & payouts"
        title={page.h1}
        lead="Earn money online in cash, transfers or vouchers: track your balance, claim when you are ready and choose PayPal, cash rewards, bank or wire transfer, shopping, grocery or digital gift card vouchers — plus UPI for members in India."
        art="coins"
        theme="gold"
      >
        <ul className="ph-pills">{PAYOUTS.map((p) => <li key={p.id}><Icon name={p.icon} size={16} /> {p.name}{p.only === 'IN' ? <small className="ph-only">India only</small> : null}</li>)}</ul>
      </PageHero>

      <RewardGalaxy title={<>Eight rewards, <span className="hl-orange">one balance</span></>} />

      <RewardExplorer />

      <ClaimMeter />
      <InvitationsPhone />
      <IncentiveStories />

      <section className="section rules" aria-labelledby="rules-title">
        <div className="container rules-row">
          <div className="reveal">
            <p className="eyebrow">Fair play</p>
            <h2 id="rules-title">Simple rules that protect your rewards</h2>
            <p className="sec-sub">Rewards are paid for eligible, validated completions. Full details are in our <Link to="/terms">terms of use</Link> and <Link to="/profiling">profiling & quality score</Link> policy.</p>
          </div>
          <ul className="rule-cards">
            <li className="reveal"><Icon name="user" size={22} /><strong>One account per person</strong><span>Duplicates are detected and removed.</span></li>
            <li className="reveal"><Icon name="pen" size={22} /><strong>Honest, attentive answers</strong><span>Quality checks protect the value of every reward.</span></li>
            <li className="reveal"><Icon name="clock" size={22} /><strong>Balances carry forward</strong><span>Nothing is lost if you take a break.</span></li>
            <li className="reveal"><Icon name="lock" size={22} /><strong>Secure payout details</strong><span>Used only to send your reward.</span></li>
          </ul>
        </div>
      </section>

      <ProductVoices kind="rewards" />
      <VideoShowcase />
      <FaqSplit id="rw-faq" title="Rewards questions" sub={<>Compare methods in our blog: <Link to="/blog/survey-rewards-paypal-upi-gift-cards">PayPal vs UPI vs gift cards</Link>.</>} faqs={FAQS} hue="#E5A100" hue2="#FF5E7E" />
      <CtaBand title="Your first reward starts with a free account." variant="sunrise" />
    </>
  );
}

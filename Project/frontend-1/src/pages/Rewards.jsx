import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import PageHero, { PageSeo } from '../components/PageHero.jsx';
import { CtaBand, FaqSplit } from '../components/Common.jsx';
import { PAGES } from '../data/pages.js';
import { PAYOUTS } from '../data/site.js';
import { ClaimMeter, IncentiveStories, InvitationsPhone, RewardExplorer, RewardGalaxy } from '../sections/RewardSections.jsx';
import { FAQ_REWARDS } from '../data/faqs.js';
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

      <section className="section rules vlt" aria-labelledby="rules-title">
        <div className="container">
          <div className="sec-head sec-center reveal">
            <p className="eyebrow">Fair play</p>
            <h2 id="rules-title">Simple rules that protect your rewards</h2>
            <p className="sec-sub">Rewards are paid for eligible, validated completions. Full details are in our <Link to="/terms">terms of use</Link> and <Link to="/profiling">profiling & quality score</Link> policy.</p>
          </div>
          <div className="vlt-stage">
            <div className="vlt-door" aria-hidden="true">
              <span className="vlt-rim" />
              {[0, 1, 2, 3, 4, 5, 6, 7].map((b) => <i key={b} className="vlt-bolt" style={{ '--b': b }} />)}
              <span className="vlt-dial"><span className="vlt-spoke" /><span className="vlt-spoke s2" /><span className="vlt-hub"><Icon name="lock" size={26} /></span></span>
              <span className="vlt-coin c1">$</span><span className="vlt-coin c2">$</span><span className="vlt-coin c3">$</span>
            </div>
            <ul className="vlt-rules">
              {[['user', 'One account per person', 'Duplicates are detected and removed.'], ['pen', 'Honest, attentive answers', 'Quality checks protect the value of every reward.'], ['clock', 'Balances carry forward', 'Nothing is lost if you take a break.'], ['lock', 'Secure payout details', 'Used only to send your reward.']].map(([ic, t, d], i) => (
                <li key={t} className={`vlt-rule reveal q${i}`} style={{ '--i': i }}>
                  <span className="vlt-ric"><Icon name={ic} size={22} /></span>
                  <strong>{t}</strong><span>{d}</span>
                  <em className="vlt-ok" aria-hidden="true"><Icon name="check" size={13} stroke={3} /></em>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <ProductVoices kind="rewards" />
      <FaqSplit id="rw-faq" look="gift" title="Rewards questions" sub={<>Compare methods in our blog: <Link to="/blog/survey-rewards-paypal-upi-gift-cards">PayPal vs UPI vs gift cards</Link>.</>} faqs={FAQS} hue="#E5A100" hue2="#FF5E7E" />
      <CtaBand title="Your first reward starts with a free account." variant="sunrise" />
    </>
  );
}

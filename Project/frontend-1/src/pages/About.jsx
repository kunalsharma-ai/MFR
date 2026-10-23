import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import FrLogo from '../components/FrLogo.jsx';
import { IsoScene } from '../components/HeroScenes.jsx';
import { IsoScene } from '../components/HeroScenes.jsx';
import PageHero, { PageSeo } from '../components/PageHero.jsx';
import { CtaBand, FaqSplit } from '../components/Common.jsx';
import { CtaBand, FaqSplit } from '../components/Common.jsx';
import { PAGES } from '../data/pages.js';
import { BRAND } from '../data/site.js';
import GlobeReach from '../sections/GlobeReach.jsx';
import { FAQ_ABOUT } from '../data/faqs.js';
import { FAQ_ABOUT } from '../data/faqs.js';

const page = PAGES.about;
const crumbs = [{ name: 'Home', path: '/' }, { name: 'About Us', path: page.path }];

const VALUES = [
  { icon: 'heart', t: 'Respect', d: 'Your time and opinion deserve a fair reward.', c: '#FF5E7E' },
  { icon: 'eye', t: 'Transparency', d: 'Clear rules, clear rewards, clear policies.', c: '#2F6BFF' },
  { icon: 'shield', t: 'Integrity', d: 'Verified people, honest data, no shortcuts.', c: '#14C9B5' },
  { icon: 'globe', t: 'Inclusion', d: 'Every country, culture and career is welcome.', c: '#FF8A00' },
];

const FAQS = FAQ_ABOUT;
const FAQS = FAQ_ABOUT;

export default function About() {
  return (
    <>
      <PageSeo page={page} faqs={FAQS} crumbs={crumbs} />
      <PageHero
        crumbs={crumbs}
        eyebrow="About us"
        title={page.h1}
        lead="We are the worldwide consumer and business opinion community of Frequent Research — built on a simple belief: when you help the world make better decisions, you deserve to be rewarded."
        theme="navy"
        artNode={<IsoScene />}
      />
        artNode={<IsoScene />}
      />

      <section className="section story2" aria-labelledby="story-title">
        <div className="container story2-row">
          <div className="mr reveal">
            <div className="mr-ribbon" aria-label={BRAND.tagline}>
              <span className="mr-tail l" aria-hidden="true" />
              <p aria-hidden="true">{BRAND.tagline.split('. ').map((w, i, a) => <span key={w} style={{ '--i': i }}>{i < a.length - 1 ? `${w}.` : w}</span>)}</p>
              <span className="mr-tail r" aria-hidden="true" />
            </div>
            <small className="mr-by">— The MyFrequentRewards promise</small>
            <ul className="mr-facts">
              <li style={{ '--c': '#FF8A00' }}><span><Icon name="user" size={20} /></span><b>Consumers</b><small>everyday opinions</small></li>
              <li style={{ '--c': '#6D5BF7' }}><span><Icon name="briefcase" size={20} /></span><b>Professionals</b><small>expert B2B views</small></li>
              <li style={{ '--c': '#14B8A6' }}><span><Icon name="gift" size={20} /></span><b>Rewards</b><small>for every eligible survey</small></li>
            </ul>
      <section className="section story2" aria-labelledby="story-title">
        <div className="container story2-row">
          <div className="mr reveal">
            <div className="mr-ribbon" aria-label={BRAND.tagline}>
              <span className="mr-tail l" aria-hidden="true" />
              <p aria-hidden="true">{BRAND.tagline.split('. ').map((w, i, a) => <span key={w} style={{ '--i': i }}>{i < a.length - 1 ? `${w}.` : w}</span>)}</p>
              <span className="mr-tail r" aria-hidden="true" />
            </div>
            <small className="mr-by">— The MyFrequentRewards promise</small>
            <ul className="mr-facts">
              <li style={{ '--c': '#FF8A00' }}><span><Icon name="user" size={20} /></span><b>Consumers</b><small>everyday opinions</small></li>
              <li style={{ '--c': '#6D5BF7' }}><span><Icon name="briefcase" size={20} /></span><b>Professionals</b><small>expert B2B views</small></li>
              <li style={{ '--c': '#14B8A6' }}><span><Icon name="gift" size={20} /></span><b>Rewards</b><small>for every eligible survey</small></li>
            </ul>
          </div>
          <div className="story2-copy reveal">
          <div className="story2-copy reveal">
            <p className="eyebrow">Who we are</p>
            <h2 id="story-title">A research community with a reward at its heart</h2>
            <ul className="story2-list">
              <li style={{ '--c': '#FF8A00' }}><span><Icon name="globe" size={18} /></span><p>MyFrequentRewards welcomes <b>consumers and business professionals</b> to take part in wide-ranging market research studies.</p></li>
              <li style={{ '--c': '#E8457A' }}><span><Icon name="chat" size={18} /></span><p>Members share <b>honest perspectives</b> on products, services, workplaces and ideas.</p></li>
              <li style={{ '--c': '#14B8A6' }}><span><Icon name="coins" size={18} /></span><p>They receive <b>rewards for every eligible contribution</b>.</p></li>
              <li style={{ '--c': '#6D5BF7' }}><span><img src={BRAND.monogram} alt="MyFrequentRewards monogram" width="22" height="22" /></span><p>Behind the community stands <a href={BRAND.parent.url} target="_blank" rel="noopener noreferrer">Frequent Research</a>, a fieldwork and data collection company serving brands and agencies worldwide — which means real studies, verified respondents and reliable payouts.</p></li>
            </ul>
            <p className="story2-links"><Link to="/about-us/reviews"><Icon name="star" size={14} /> Ratings &amp; reviews</Link><Link to="/how-it-works">How it works <Icon name="arrow" size={14} /></Link><Link to="/blog">Read our blogs <Icon name="arrow" size={14} /></Link></p>
          </div>
        </div>
      </section>

      <section className="section values" aria-labelledby="val-title">
        <div className="container">
          <div className="sec-head sec-center reveal"><p className="eyebrow">What we stand for</p><h2 id="val-title">Four values, zero compromise</h2></div>
          <ul className="values-row">
            {VALUES.map((v, i) => (
              <li key={v.t} className="value-coin reveal" style={{ '--c': v.c, '--d': `${i * 0.1}s` }}>
                <div className="vc-inner">
                  <div className="vc-front"><Icon name={v.icon} size={34} /><strong>{v.t}</strong></div>
                  <div className="vc-back"><p>{v.d}</p></div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <GlobeReach />

      <section className="section iso-sec" aria-labelledby="ab-iso">
        <div className="container iso-row reveal">
          <FrLogo variant="iso" width={520} height={277} alt="Frequent Research logo with ISO 20252:2019, 9001:2015 and 27001:2013 certifications" />
          <div>
            <p className="eyebrow">Credentials</p>
            <h2 id="ab-iso">Quality you can verify</h2>
            <p className="sec-sub">Insights · Analytics · Growth. Our parent company is certified to {BRAND.iso.join(', ')}. See our <Link to="/quality-and-data-security">quality & security</Link> approach.</p>
          </div>
        </div>
      </section>

      <FaqSplit id="ab-faq" title="About the company" faqs={FAQS} hue="#14C9B5" hue2="#2F6BFF" />
      <FaqSplit id="ab-faq" title="About the company" faqs={FAQS} hue="#14C9B5" hue2="#2F6BFF" />
      <CtaBand />
    </>
  );
}

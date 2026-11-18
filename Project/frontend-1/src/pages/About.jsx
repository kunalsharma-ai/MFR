import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import PageHero, { PageSeo } from '../components/PageHero.jsx';
import { CtaBand, FaqSplit } from '../components/Common.jsx';
import { PAGES } from '../data/pages.js';
import GlobeReach from '../sections/GlobeReach.jsx';
import { AboutCompass, AboutJourney, AboutManifesto, AboutPrism, BrandFamily, IsoMedals, TwoWorlds, ValueLoop, ValuesDial } from '../sections/AboutStory.jsx';
import { FAQ_ABOUT } from '../data/faqs.js';

// About Us (v3.0 redesign) — the story told visually, one distinct treatment per section (see sections/AboutStory.jsx).
const page = PAGES.about;
const crumbs = [{ name: 'Home', path: '/' }, { name: 'About Us', path: page.path }];
const FAQS = FAQ_ABOUT;

export default function About() {
  return (
    <>
      <PageSeo page={page} faqs={FAQS} crumbs={crumbs} />
      <PageHero
        crumbs={crumbs}
        eyebrow="About us"
        title={page.h1}
        lead="The worldwide consumer and business opinion community of Frequent Research, built on one belief: when you help the world make better decisions, you deserve to be rewarded."
        tagline={[['user', 'Your voice.'], ['sparkle', 'Our community.'], ['gift', 'Real rewards.']]}
        tone="con"
        theme="navy"
        artNode={<AboutPrism />}
      >
        <p className="ab-hero-links">
          <a href="#ab-story" className="btn btn-primary">Our story <Icon name="arrow" size={16} /></a>
          <button type="button" className="btn ab-watch" onClick={() => window.dispatchEvent(new CustomEvent('mfr:watch'))}><Icon name="youtube" size={18} /> Watch who we are</button>
        </p>
      </PageHero>

      <AboutManifesto />
      <ValueLoop />
      <AboutJourney />
      <AboutCompass />
      <ValuesDial />
      <TwoWorlds />
      <GlobeReach />
      <BrandFamily />
      <IsoMedals />

      <FaqSplit id="ab-faq" title="About the company" sub={<>Read <Link to="/about-us/reviews">ratings &amp; reviews</Link>, see <Link to="/how-it-works">how it works</Link> or browse <Link to="/blog">our blogs</Link>.</>} faqs={FAQS} hue="#14C9B5" hue2="#2F6BFF" />
      <CtaBand />
    </>
  );
}

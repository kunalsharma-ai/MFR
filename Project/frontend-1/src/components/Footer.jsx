import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { LanguageButton } from './Language.jsx';
import BrandLogo from './BrandLogo.jsx';
import ThemeToggle from './ui/ThemeToggle.jsx';
import SoundToggle from './ui/SoundToggle.jsx';
import { BRAND, CONTACT, PAYOUTS, whatsappLink } from '../data/site.js';
import { CONNECT_BRANDS } from '../data/connect.js';

const MFR = CONNECT_BRANDS[0];
const QR_TINT = { website: '#FF8A00', youtube: '#FF0033', facebook: '#1877F2', instagram: '#E1306C', linkedin: '#0A66C2', x: '#0F1419', whatsapp: '#25D366' };

// Footer — "Reward launchpad":
// 1) launch strip with a spinning 3D MFR coin and the main calls to action,
// 2) Scan & Connect strip: every MyFrequentRewards channel with its QR code on show + a link to all brands,
// 3) brand block (animated logo, shimmering motto, ISO seals), link columns, contact chips,
// 4) a drifting ribbon of all seven reward types and a giant gradient wordmark.
const COLS = [
  {
    title: 'Earn',
    c: '#FF8A00',
    links: [
      ['/how-it-works', 'How it works'],
      ['/paid-surveys-for-consumers', 'For consumers'],
      ['/paid-surveys-for-professionals', 'For professionals'],
      ['/paid-surveys-for-teens', 'For teens'],
      ['/who-can-join', 'Who can join'],
      ['/rewards', 'Rewards & payouts'],
    ],
  },
  {
    title: 'Learn',
    c: '#14C9B5',
    links: [
      ['/blog', 'Blogs'],
      ['/blog/how-to-earn-money-online-with-surveys', 'How to earn money online'],
      ['/blog/earn-money-online-without-investment', 'Earn without investment'],
      ['/faq', 'FAQ'],
      ['/about-us', 'About us'],
      ['/scan-and-connect', 'Scan & Connect'],
    ],
  },
  {
    title: 'Trust',
    c: '#8B5CF6',
    links: [
      ['/privacy', 'Privacy Policy'],
      ['/gdpr', 'GDPR Compliance'],
      ['/cookies', 'Cookies Policy'],
      ['/terms', 'Terms of Use'],
      ['/profiling', 'Profiling & Quality Score'],
      ['/trust-and-safety', 'Quality & security'],
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();
  const toTop = () => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  return (
    <footer className="site-footer ft">
      <div className="ft-sky" aria-hidden="true"><i /><i /><i /><span className="ft-grid" /></div>

      {/* 1) Launch strip */}
      <section className="container ft-launch" aria-labelledby="ft-launch-title">
        <div className="ft-coin3d" aria-hidden="true">
          <div className="ft-coin">
            {Array.from({ length: 7 }).map((_, i) => <span key={i} className="ft-coin-edge" style={{ '--z': i }} />)}
            <span className="ft-coin-face front"><img src={BRAND.monogram} alt="MyFrequentRewards reward coin" width="74" height="74" loading="lazy" /></span>
            <span className="ft-coin-face back"><Icon name="star" size={46} fill="currentColor" /></span>
          </div>
          <span className="ft-coin-shadow" />
        </div>
        <div className="ft-launch-copy">
          <p className="eyebrow eyebrow-light">Ready when you are</p>
          <h2 id="ft-launch-title">Your next reward is <span className="grad-text">one survey away.</span></h2>
          <p className="muted-light">Free for consumers and professionals · {PAYOUTS.length} reward types · UPI for members in India.</p>
        </div>
        <div className="ft-launch-cta">
          <Link to="/sign-up" className="btn btn-primary btn-lg btn-shine">Join free <Icon name="arrow" size={18} /></Link>
          <Link to="/login" className="btn btn-outline-light btn-lg">Member log in</Link>
        </div>
      </section>

      {/* 2) Scan & Connect strip — every MyFrequentRewards channel with its QR code always visible */}
      <section className="container ft-social" aria-labelledby="social-title">
        <div className="ft-social-intro">
          <p className="eyebrow eyebrow-light">Scan &amp; connect</p>
          <h2 id="social-title" className="ft-social-title">Point your camera. <span className="grad-text">Follow the rewards.</span></h2>
          <p className="muted-light">Survey drops, payout tips and member stories — scan a code or tap a card.</p>
        </div>
        <ul className="ft-qrs">
          {MFR.channels.filter((c) => c.url).map((c, i) => (
            <li key={c.id} className="ft-qr" style={{ '--sc': QR_TINT[c.id] || '#FF8A00', '--i': i }}>
              <a href={c.url} target="_blank" rel="noopener noreferrer" aria-label={`MyFrequentRewards ${c.id === 'website' ? 'website' : `on ${c.label}`} (opens in new tab)`}>
                <span className="ft-qr-img"><img src={c.qr} alt={`QR code for MyFrequentRewards ${c.label}`} width="92" height="92" loading="lazy" /><i aria-hidden="true" /></span>
                <span className="ft-qr-id"><span className="ft-qr-ico"><Icon name={c.id === 'website' ? 'globe' : c.id} size={16} /></span><b>{c.label}</b></span>
                <small>{c.handle}</small>
              </a>
            </li>
          ))}
          <li className="ft-qr ft-qr-all">
            <Link to="/scan-and-connect">
              <span className="ft-qr-brands" aria-hidden="true">{CONNECT_BRANDS.map((b, k) => <i key={b.id} style={{ '--c': b.color, '--c2': b.color2, '--k': k }}>{b.short}</i>)}</span>
              <b>All our brands</b>
              <small>Turn2Opinion · MyHealthOpinions · Frequent Research</small>
              <em>Scan &amp; Connect <Icon name="arrow" size={13} /></em>
            </Link>
          </li>
        </ul>
      </section>

      {/* 3) Brand + links */}
      <div className="container ft-main">
        <div className="ft-brand">
          <Link to="/" className="ft-logo" aria-label="MyFrequentRewards home">
            <span className="ft-logo-orbit" aria-hidden="true"><i /></span>
            <BrandLogo width={196} />
          </Link>
          <p className="ft-motto">{BRAND.motto}</p>
          <p className="muted-light small">
            The global consumer and business opinion community of{' '}
            <a href={BRAND.parent.url} target="_blank" rel="noopener noreferrer">Frequent Research</a>.
          </p>
          <ul className="ft-seals" aria-label="Certifications of Frequent Research">
            {BRAND.iso.map((iso, i) => (
              <li key={iso} className="ft-seal" style={{ '--i': i }}>
                <span className="ft-seal-ring" aria-hidden="true" />
                <b>{iso.split(':')[0].replace('ISO ', '')}</b>
                <small>ISO</small>
                <span className="sr-only">{iso}</span>
              </li>
            ))}
          </ul>
        </div>

        {COLS.map((c) => (
          <nav key={c.title} className="ft-col" aria-label={c.title} style={{ '--cc': c.c }}>
            <h3><i aria-hidden="true" />{c.title}</h3>
            <ul>
              {c.links.map(([to, label]) => (
                <li key={to}><Link to={to}><span>{label}</span><Icon name="arrow" size={13} /></Link></li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="ft-col ft-contact" style={{ '--cc': '#FF5E7E' }}>
          <h3><i aria-hidden="true" />Contact</h3>
          <ul>
            <li><span className="ft-chip"><Icon name="pin" size={15} /></span> {CONTACT.address.street}, {CONTACT.address.city} – {CONTACT.address.postalCode}</li>
            <li><span className="ft-chip"><Icon name="phone" size={15} /></span> <a href={CONTACT.phoneHref}>{CONTACT.phone}</a></li>
            <li><span className="ft-chip wa"><Icon name="whatsapp" size={15} /></span> <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">{CONTACT.whatsappDisplay}</a></li>
            <li><span className="ft-chip"><Icon name="mail" size={15} /></span> <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
          </ul>
        </div>
      </div>

      {/* 4) Reward ribbon + wordmark */}
      <div className="ft-ribbon" role="group" aria-label="Reward types">
        <ul className="ft-ribbon-track">
          {[...PAYOUTS, ...PAYOUTS].map((p, i) => (
            <li key={p.id + i} aria-hidden={i >= PAYOUTS.length} style={{ '--h1': p.hue, '--h2': p.hue2 }}>
              <span><Icon name={p.icon} size={15} /></span>{p.name}
            </li>
          ))}
        </ul>
      </div>
      <p className="ft-word" aria-hidden="true">MyFrequentRewards</p>

      <div className="container">
        <div className="ft-modes" role="group" aria-label="Display and sound">
          <span className="ft-modes-lab">Theme</span>
          <ThemeToggle labels />
          <span className="ft-modes-lab">Sound</span>
          <SoundToggle />
        </div>
      </div>

      <div className="ft-bottom">
        <div className="container ft-bottom-row">
          <p>Copyright {year} © {BRAND.legalName} ({BRAND.dba}). All Rights Reserved.</p>
          <p className="ft-safe"><Icon name="lock" size={14} /> We never sell or share your personal details.</p>
          <LanguageButton compact />
          <button type="button" className="ft-top" onClick={toTop} aria-label="Back to top"><Icon name="rocket" size={18} /></button>
        </div>
      </div>
    </footer>
  );
}

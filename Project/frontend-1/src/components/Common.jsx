import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { whatsappLink } from '../data/site.js';
import { session, store } from '../utils/storage.js';
import { useRater } from '../utils/rater.js';
import { asset } from '../utils/asset.js';
import { dismiss, isDismissed } from '../utils/dismiss.js';

export function Breadcrumbs({ items }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((it, i) => (
          <li key={it.path}>
            {i < items.length - 1 ? <Link to={it.path}>{it.name}</Link> : <span aria-current="page">{it.name}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export const askLiveHelp = (q) => window.dispatchEvent(new CustomEvent('mfr:open-chat', { detail: { q } }));


export function FaqList({ faqs, hue, followUp = true }) {
  return (
    <div className="faq-list" style={hue ? { '--fh': hue } : undefined}>
      {faqs.map((f, i) => (
        <details key={f.q} className="faq-item" style={{ '--i': i }}>
          <summary>
            <span className="faq-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <span className="faq-q">{f.q}</span>
            <span className="faq-plus" aria-hidden="true" />
          </summary>
          <div className="faq-a">
            <span className="faq-a-av" aria-hidden="true">A</span>
            <div>
              <p>{f.a}</p>
              {followUp ? (
                <button type="button" className="faq-ask" onClick={() => askLiveHelp(f.q)}>
                  <Icon name="chat" size={14} /> Ask a follow-up in Live Help
                </button>
              ) : null}
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}


export function FaqSplit({ id, title, sub, faqs, hue = '#FF8A00', hue2 = '#8B5CF6', eyebrow = 'FAQ', children }) {
  return (
    <section className="section fq" aria-labelledby={id} style={{ '--fh': hue, '--fh2': hue2 }}>
      <div className="container fq-row">
        <div className="fq-side reveal">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={id}>{title}</h2>
          {sub ? <p className="sec-sub">{sub}</p> : null}
          {children}
          <div className="fq-deck" aria-hidden="true">
            <span className="fq-card c1"><b>?</b><i /><i /></span>
            <span className="fq-card c2"><b>!</b><i /><i /></span>
            <span className="fq-card c3"><Icon name="check" size={30} stroke={3} /><i /><i /></span>
            <span className="fq-orb" />
          </div>
          <button type="button" className="fq-help" onClick={() => askLiveHelp('')}>
            <span className="fq-help-ico"><Icon name="chat" size={18} /></span>
            <span><b>Still curious?</b><small>Ask Live Help — instant answers 24/7</small></span>
            <Icon name="arrow" size={16} />
          </button>
        </div>
        <FaqList faqs={faqs} />
      </div>
    </section>
  );
}

export function CtaBand({ title = 'Your opinion is worth more than you think.', sub = 'Join free in two minutes — no investment, no fees, ever.', variant = 'sunrise' }) {
  return (
    <section className={`cta-band cta-${variant}`} aria-label="Join MyFrequentRewards">
      <div className="container cta-inner reveal">
        <div className="cta-confetti" aria-hidden="true">{Array.from({ length: 14 }).map((_, i) => <i key={i} style={{ '--i': i }} />)}</div>
        <h2>{title}</h2>
        <p>{sub}</p>
        <div className="cta-actions">
          <Link to="/sign-up" className="btn btn-light btn-lg">Join free now <Icon name="arrow" size={18} /></Link>
          <Link to="/how-it-works" className="btn btn-outline-light btn-lg">See how it works</Link>
        </div>
      </div>
    </section>
  );
}

// v3.0 floating dock: three round, animated buttons stacked on a glass rail — Rate & Review (locked until the
// visitor logs in: the click opens the "Log in to rate us" window), WhatsApp, and Live Help (the round MFR logo).
export function FloatingDock({ onChat, chatOpen }) {
  const { state, reviewed } = useRater();
  const [tease, setTease] = useState(false);
  const [badge, setBadge] = useState(false);
  useEffect(() => {
    if (isDismissed('chat-tease')) return undefined;
    const t1 = setTimeout(() => { setTease(true); setBadge(true); }, 15000);
    const t2 = setTimeout(() => setTease(false), 24000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  useEffect(() => {
    if (chatOpen) { setTease(false); setBadge(false); dismiss('chat-tease'); }
  }, [chatOpen]);
  const locked = state !== 'ok';
  const rate = () => {
    if (state === 'checking') return;
    window.dispatchEvent(new CustomEvent('mfr:rate', { detail: {} }));
  };
  return (
    <div className={`dock dk${chatOpen ? ' is-chat' : ''}`} role="group" aria-label="Quick help">
      <span className="dk-rail" aria-hidden="true" />
      {state !== 'kid' ? (
        <div className="dk-rate-wrap">
          {reviewed && !locked ? (
            <Link to="/about-us/reviews" className="dk-orb dk-rate is-done" aria-label="Thanks for your review. See all reviews">
              <span className="dk-ring" aria-hidden="true" />
              <span className="dk-face"><Icon name="check" size={24} /></span>
              <span className="dock-tip">Thanks for your review!</span>
            </Link>
          ) : (
            <button type="button" className={`dk-orb dk-rate${locked ? ' is-locked' : ''}`} onClick={rate} aria-label={locked ? 'Rate & review (log in first)' : 'Rate your experience'} aria-haspopup="dialog">
              <span className="dk-ring" aria-hidden="true" />
              <span className="dk-face"><span className="dk-star"><Icon name="star" size={26} fill="currentColor" /></span></span>
              <span className="dk-orbit" aria-hidden="true">{[0, 1, 2, 3, 4].map((k) => <i key={k} style={{ '--k': k }}>★</i>)}</span>
              {locked ? <span className="dk-lock" aria-hidden="true"><Icon name="lock" size={11} /></span> : null}
              <span className="dock-tip">{locked ? 'Rate & review · log in first' : 'Rate & review us'}</span>
            </button>
          )}
        </div>
      ) : null}
      <a className="dk-orb dk-wa" href={whatsappLink()} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp (+91 81782 00573)">
        <span className="dk-ring" aria-hidden="true" />
        <span className="dk-face"><Icon name="whatsapp" size={28} stroke={1.6} /></span>
        <span className="dk-wave" aria-hidden="true" />
        <span className="dock-tip">WhatsApp us</span>
      </a>
      <div className="dock-chat-wrap">
        {tease && !chatOpen ? (
          <button type="button" className="dock-tease" onClick={onChat}>
            <span className="dock-tease-x" role="presentation" onClick={(e) => { e.stopPropagation(); setTease(false); setBadge(false); dismiss('chat-tease'); }}>×</span>
            <b>Questions? Ask us anything 💬</b>
            <small>Payouts, surveys, sign-up — instant answers 24/7</small>
          </button>
        ) : null}
        <button type="button" className={`dk-orb dk-chat ${chatOpen ? 'is-open' : ''}`} onPointerEnter={() => import('../utils/chatEngine.js')} onClick={onChat} aria-expanded={chatOpen} aria-label="Open Live Help 24/7">
          <span className="dk-ring" aria-hidden="true" />
          <span className="dk-face">
            {chatOpen ? <Icon name="close" size={24} /> : <img src={asset('/images/brand/mfr-mark-160.webp')} alt="" width="46" height="46" />}
          </span>
          <span className="dk-spark" aria-hidden="true" />
          <span className="dk-247" aria-hidden="true">24/7</span>
          <span className="dock-tip">Live Help 24/7</span>
          {badge && !chatOpen ? <span className="dock-badge" role="img" aria-label="1 new message">1</span> : null}
        </button>
      </div>
    </div>
  );
}

export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const reopen = () => setShow(true);
    window.addEventListener('mfr:cookie-settings', reopen);
    let t;
    if (!store.get('mfr_cookie_choice')) t = setTimeout(() => setShow(true), 1200);
    return () => {
      clearTimeout(t);
      window.removeEventListener('mfr:cookie-settings', reopen);
    };
  }, []);
  const choose = (v) => {
    store.set('mfr_cookie_choice', { analytics: v, at: Date.now() });
    // Analytics loaders should read this choice before firing (see README → Analytics & consent).
    window.dispatchEvent(new CustomEvent('mfr:consent', { detail: { analytics: v } }));
    setShow(false);
  };
  if (!show) return null;
  return (
    <div className="cookie" role="region" aria-label="Cookie choices">
      <Icon name="cookie" size={26} />
      <p>We use essential cookies to keep you signed in and secure, and optional analytics cookies to improve the site. <Link to="/cookies">Cookies policy</Link></p>
      <div className="cookie-btns">
        <button type="button" className="btn btn-ghost-dark btn-sm" onClick={() => choose(false)}>Essential only</button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => choose(true)}>Accept all</button>
      </div>
    </div>
  );
}

export function ScrollProgress() {
  // Writes straight to the DOM once per frame — no React re-render on every scroll event.
  const ref = useRef(null);
  useEffect(() => {
    let queued = false;
    const paint = () => {
      queued = false;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      if (ref.current) ref.current.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
    };
    const on = () => {
      if (!queued) { queued = true; requestAnimationFrame(paint); }
    };
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return <div ref={ref} className="scroll-progress" style={{ transform: 'scaleX(0)' }} aria-hidden="true" />;
}

export function SectionHead({ eyebrow, title, sub, align = 'left', light = false, id }) {
  return (
    <div className={`sec-head sec-${align} ${light ? 'is-light' : ''} reveal`}>
      {eyebrow ? <p className={`eyebrow ${light ? 'eyebrow-light' : ''}`}>{eyebrow}</p> : null}
      <h2 id={id}>{title}</h2>
      {sub ? <p className="sec-sub">{sub}</p> : null}
    </div>
  );
}

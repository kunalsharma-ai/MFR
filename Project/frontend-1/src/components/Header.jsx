import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Icon from './Icon.jsx';
import { LanguageButton } from './Language.jsx';
import BrandLogo from './BrandLogo.jsx';
import { BRAND } from '../data/site.js';
import UserMenu from './UserMenu.jsx';
import { DASHBOARD_URL, useSession } from '../utils/session.js';

const EARN = [
  { to: '/paid-surveys-for-consumers', label: 'For Consumers', sub: 'Students, parents, shoppers, gamers', icon: 'user' },
  { to: '/paid-surveys-for-professionals', label: 'For Professionals', sub: 'CXOs, managers, engineers, doctors', icon: 'briefcase' },
  { to: '/who-can-join', label: 'Who Can Join', sub: 'Countries, roles & industries', icon: 'globe' },
];

const ABOUT = [
  { to: '/about-us', label: 'About MyFrequentRewards', sub: 'Who we are and what we stand for', icon: 'badge' },
  { to: '/about-us/reviews', label: 'Ratings & Reviews', sub: 'What consumers and professionals say', icon: 'star' },
  { to: '/scan-and-connect', label: 'Scan & Connect', sub: 'QR codes for all our brands & socials', icon: 'mobile' },
];
const DROPS = { about: { label: 'About Us', items: ABOUT }, earn: { label: 'Earn', items: EARN } };

// Menu order (as requested): Home · About Us ▾ · Earn ▾ · How It Works · Rewards · Trust & Safety · Blogs · FAQ · Contact
const NAV = [
  { to: '/', label: 'Home', end: true },
  { drop: 'about' },
  { drop: 'earn' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/rewards-and-payouts', label: 'Rewards' },
  { to: '/quality-and-data-security', label: 'Trust & Safety' },
  { to: '/blog', label: 'Blogs', hot: true },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact-us', label: 'Contact' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [drop, setDrop] = useState(null);
  const { pathname } = useLocation();
  const { user, logout } = useSession();
  const navRef = useRef(null);
  const [ind, setInd] = useState({ x: 0, w: 0, on: false });

  // "Magic pill": a gradient pill glides under whichever item you hover and settles back on the active page.
  const moveTo = useCallback((el) => {
    const nav = navRef.current;
    if (!nav || !el || window.matchMedia('(max-width: 767px)').matches) return setInd((v) => ({ ...v, on: false }));
    const a = nav.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    setInd({ x: b.left - a.left, w: b.width, on: true });
  }, []);
  const settle = useCallback(() => {
    const nav = navRef.current;
    const active = nav && (nav.querySelector('.nav-link.is-active') || (Object.keys(DROPS).map((k) => DROPS[k].items.some((e) => pathname.startsWith(e.to)) && nav.querySelector(`.nav-drop-btn[data-drop="${k}"]`)).find(Boolean)));
    if (active) moveTo(active);
    else setInd((v) => ({ ...v, on: false }));
  }, [moveTo, pathname]);
  useEffect(() => {
    const t = setTimeout(settle, 60);
    window.addEventListener('resize', settle);
    document.fonts && document.fonts.ready && document.fonts.ready.then(settle).catch(() => {});
    return () => { clearTimeout(t); window.removeEventListener('resize', settle); };
  }, [settle]);
  const hover = (e) => {
    const el = e.target.closest && e.target.closest('.nav-link');
    if (el) moveTo(el);
  };

  useEffect(() => {
    setOpen(false);
    setDrop(null);
  }, [pathname]);

  useEffect(() => {
    // Only re-render when the state actually flips (not on every scroll event).
    let last = null;
    let queued = false;
    const check = () => {
      queued = false;
      const now = window.scrollY > 12;
      if (now !== last) { last = now; setScrolled(now); }
    };
    const on = () => { if (!queued) { queued = true; requestAnimationFrame(check); } };
    check();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  // v2.5: phone menu — lock page scroll, hide the floating buttons, close with Escape or when the screen widens.
  useEffect(() => {
    const root = document.documentElement;
    document.body.style.overflow = open ? 'hidden' : '';
    root.classList.toggle('menu-open', open);
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const mq = window.matchMedia('(min-width: 768px)');
    const onWide = () => { if (mq.matches) setOpen(false); };
    window.addEventListener('keydown', onKey);
    mq.addEventListener ? mq.addEventListener('change', onWide) : mq.addListener(onWide);
    return () => {
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener ? mq.removeEventListener('change', onWide) : mq.removeListener(onWide);
      root.classList.remove('menu-open');
      document.body.style.overflow = '';
    };
  }, [open]);
  // Dropdowns open on hover only with a real mouse on wide screens; on phones/tablets a tap toggles them
  // (before, the tap fired "hover open" and "click toggle" together, so the dropdown closed at once).
  const canHover = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 768px)').matches;

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="container header-row">
        <Link to="/" className="brand" aria-label={`${BRAND.name} home`}>
          <BrandLogo width={184} eager />
        </Link>

        <nav id="main-nav" className={`main-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation" ref={navRef} onMouseOver={hover} onMouseLeave={settle} onFocus={hover}>
          <span className={`nav-pill ${ind.on ? 'on' : ''}`} style={{ transform: `translateX(${ind.x}px)`, width: ind.w }} aria-hidden="true" />
          {NAV.map((n, i) => n.drop ? (
            <div
              key={n.drop}
              style={{ '--i': i }}
              className={`nav-drop nav-in ${drop === n.drop ? 'is-open' : ''}`}
              onMouseEnter={() => canHover() && setDrop(n.drop)}
              onMouseLeave={() => canHover() && setDrop(null)}
            >
              <button type="button" className={`nav-link nav-drop-btn ${DROPS[n.drop].items.some((e) => pathname === e.to || pathname.startsWith(`${e.to}/`)) ? 'is-here' : ''}`} data-drop={n.drop} aria-expanded={drop === n.drop} onClick={() => setDrop((v) => (v === n.drop ? null : n.drop))}>
                {DROPS[n.drop].label} <Icon name="chevron" size={16} />
              </button>
              <div className="nav-panel" role="menu">
                {DROPS[n.drop].items.map((e) => (
                  <a key={e.to} href={e.to} className="nav-panel-item" role="menuitem">
                    <span className="npi-ico"><Icon name={e.icon} /></span>
                    <span>
                      <strong>{e.label}</strong>
                      <small>{e.sub}</small>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <NavLink key={n.to} to={n.to} end={n.end} style={{ '--i': i }} className={({ isActive }) => `nav-link nav-in ${isActive ? 'is-active' : ''}`}>
              {n.label}
              {n.hot ? <span className="nav-hot">Trending</span> : null}
            </NavLink>
          ))}
          <div className="nav-cta-mobile">
            <LanguageButton wide />
            {user ? (
              <>
                <a href={DASHBOARD_URL} className="btn btn-primary">Dashboard</a>
                <button type="button" className="btn btn-ghost-dark" onClick={logout}>Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost-dark">Log in</Link>
                <Link to="/sign-up" className="btn btn-primary">Join free</Link>
              </>
            )}
          </div>
        </nav>

        <div className="header-cta">
          <LanguageButton />
          {user ? (
            <UserMenu user={user} onLogout={logout} />
          ) : (
            <>
              <Link to="/login" className="btn btn-text hdr-login"><span className="hdr-login-ico"><Icon name="user" size={16} /></span>Log in</Link>
              <Link to="/sign-up" className="btn btn-primary btn-glow btn-shine hdr-join">
                <span className="hdr-join-spark" aria-hidden="true"><Icon name="gift" size={16} /></span>
                Join free <span className="hdr-join-arrow"><Icon name="arrow" size={18} /></span>
              </Link>
            </>
          )}
          <button
            type="button"
            className={`burger ${open ? 'is-open' : ''}`}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="main-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}

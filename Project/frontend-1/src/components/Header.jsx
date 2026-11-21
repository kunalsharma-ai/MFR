import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Icon from './Icon.jsx';
import { LanguageButton } from './Language.jsx';
import BrandLogo from './BrandLogo.jsx';
import ThemeToggle from './ui/ThemeToggle.jsx';
import SoundToggle from './ui/SoundToggle.jsx';
import { BRAND } from '../data/site.js';
import UserMenu from './UserMenu.jsx';
import { DASHBOARD_URL, useSession } from '../utils/session.js';

const EARN = [
  { to: '/paid-surveys-for-consumers', label: 'For Consumers', sub: 'Students, parents, shoppers, gamers', icon: 'user' },
  { to: '/paid-surveys-for-professionals', label: 'For Professionals', sub: 'CXOs, managers, engineers, doctors', icon: 'briefcase' },
  { to: '/paid-surveys-for-teens', label: 'For Teens', sub: 'Teens, with a parent’s permission', icon: 'rocket', isNew: true, hues: ['#7C3AED', '#2EE6CF'] },
  { to: '/who-can-join', label: 'Who Can Join', sub: 'Countries, roles & industries', icon: 'globe' },
];

const ABOUT = [
  { to: '/about-us', label: 'About MyFrequentRewards', sub: 'Who we are and what we stand for', icon: 'badge' },
  { to: '/about-us/reviews', label: 'Ratings & Reviews', sub: 'What consumers and professionals say', icon: 'star' },
  { to: '/scan-and-connect', label: 'Scan & Connect', sub: 'QR codes for all our brands & socials', icon: 'mobile' },
];
const DROPS = { about: { label: 'About Us', items: ABOUT, icon: 'badge' }, earn: { label: 'Earn', items: EARN, icon: 'coins' } };
const NPI_HUES = [['#FF8A00', '#FF3B8D'], ['#2F6BFF', '#14C9B5'], ['#8B5CF6', '#FF5E7E']];

// Menu order (as requested): Home · About Us ▾ · Earn ▾ · How It Works · Rewards · Trust & Safety · Blogs · FAQ · Contact
const NAV = [
  { to: '/', label: 'Home', end: true, icon: 'sparkle' },
  { drop: 'about' },
  { drop: 'earn' },
  { to: '/how-it-works', label: 'How It Works', icon: 'activity' },
  { to: '/rewards', label: 'Rewards', icon: 'gift' },
  { to: '/trust-and-safety', label: 'Trust & Safety', icon: 'shield' },
  { to: '/blog', label: 'Blogs', hot: true, icon: 'book' },
  { to: '/faq', label: 'FAQ', icon: 'question' },
  { to: '/contact-us', label: 'Contact', icon: 'headset' },
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
    nav.querySelectorAll('.has-pill').forEach((x) => x !== el && x.classList.remove('has-pill'));
    el.classList.add('has-pill'); // the tab under the white pill switches to orange text
    const a = nav.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    setInd({ x: b.left - a.left, w: b.width, on: true });
  }, []);
  const settle = useCallback(() => {
    const nav = navRef.current;
    const active = nav && (nav.querySelector('.nav-link.is-active') || (Object.keys(DROPS).map((k) => DROPS[k].items.some((e) => pathname.startsWith(e.to)) && nav.querySelector(`.nav-drop-btn[data-drop="${k}"]`)).find(Boolean)));
    if (active) moveTo(active);
    else { if (nav) nav.querySelectorAll('.has-pill').forEach((x) => x.classList.remove('has-pill')); setInd((v) => ({ ...v, on: false })); }
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
                <span className="nav-ic" aria-hidden="true"><Icon name={DROPS[n.drop].icon} size={15} /></span>{DROPS[n.drop].label} <Icon name="chevron" size={16} />
              </button>
              <div className="nav-panel" role="menu">
                <span className="nav-panel-glow" aria-hidden="true" />
                {DROPS[n.drop].items.map((e, k) => (
                  <a key={e.to} href={e.to} className="nav-panel-item" role="menuitem" style={{ '--k': k, '--h1': (e.hues || NPI_HUES[k % 3])[0], '--h2': (e.hues || NPI_HUES[k % 3])[1] }}>
                    <span className="npi-ico"><Icon name={e.icon} /></span>
                    <span>
                      <strong>{e.label}{e.isNew ? <em className="npi-new">New</em> : null}</strong>
                      <small>{e.sub}</small>
                    </span>
                    <span className="npi-go" aria-hidden="true"><Icon name="arrow" size={14} /></span>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <NavLink key={n.to} to={n.to} end={n.end} style={{ '--i': i }} className={({ isActive }) => `nav-link nav-in ${isActive ? 'is-active' : ''}`}>
              <span className="nav-ic" aria-hidden="true"><Icon name={n.icon} size={15} /></span>{n.label}
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
          <div className="hdr-modes" role="group" aria-label="Theme and sound">
            <ThemeToggle className="thm-sm" />
            <SoundToggle className="snd-sm" label={false} />
          </div>
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

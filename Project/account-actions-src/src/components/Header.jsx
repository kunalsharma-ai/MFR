import { useEffect, useRef, useState } from 'react';
import mono from '../assets/mfr-monogram.webp';
import { Icon } from './Icon.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useAccount } from '../context/AccountContext.jsx';
import { DevTools } from './DevTools.jsx';

export function ThemeToggle() {
  const { theme, toggleTheme } = useApp();
  const dark = theme === 'dark';
  return (
    <button type="button" className={`theme-toggle ${dark ? 'is-dark' : 'is-light'}`} onClick={toggleTheme} data-sfx="none"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} title={dark ? 'Light theme' : 'Dark theme'}>
      <span className="tt-track"><span className="tt-thumb"><Icon name={dark ? 'moon' : 'sun'} /></span></span>
      <span className="tt-label">{dark ? 'Dark' : 'Light'}</span>
    </button>
  );
}

export function SoundToggle() {
  const { soundOn, toggleSound } = useApp();
  return (
    <button type="button" className="icon-btn" onClick={toggleSound} data-sfx="none" aria-pressed={soundOn}
      aria-label={soundOn ? 'Turn sound effects off' : 'Turn sound effects on'} title={soundOn ? 'Sound on' : 'Sound off'}>
      <Icon name={soundOn ? 'sound' : 'mute'} />
    </button>
  );
}

export function Header({ links, showDevTools }) {
  const { user, dev } = useAccount();
  const [devOpen, setDevOpen] = useState(false);
  const devRef = useRef(null);
  const initials = user.name.split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  useEffect(() => {
    if (!devOpen) return;
    const out = (e) => { if (devRef.current && !devRef.current.contains(e.target)) setDevOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setDevOpen(false); };
    document.addEventListener('pointerdown', out);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', out); document.removeEventListener('keydown', esc); };
  }, [devOpen]);

  return (
    <header className="top">
      <div className="top-in">
        <a className="brand" href={links.dashboard} onClick={links.onNavigate ? (e) => links.onNavigate(e, 'dashboard') : undefined} aria-label="MyFrequentRewards dashboard">
          <span className="brand-coin"><img src={mono} alt="" width="34" height="34" /></span>
          <span className="brand-word"><b>Myfrequent<span>rewards</span></b><small>REWARDING LOYALTY. ENRICHING EVERYDAY.</small></span>
        </a>
        <nav className="crumbs" aria-label="Breadcrumb">
          <a href={links.dashboard} onClick={links.onNavigate ? (e) => links.onNavigate(e, 'dashboard') : undefined}>Dashboard</a><Icon name="chev" />
          <a href={links.account} onClick={links.onNavigate ? (e) => links.onNavigate(e, 'account') : undefined}>My Account</a><Icon name="chev" />
          <span aria-current="page">Delete or Deactivate</span>
        </nav>
        <div className="top-actions">
          {showDevTools && dev && (
            <div className="dev-wrap" ref={devRef}>
              <button type="button" className={`dev-btn ${devOpen ? 'on' : ''}`} aria-expanded={devOpen} aria-controls="mfr-dev" onClick={() => setDevOpen((v) => !v)} data-sfx="toggle">
                <Icon name="sliders" /><span>Demo</span>
              </button>
              {devOpen && <DevTools id="mfr-dev" onClose={() => setDevOpen(false)} />}
            </div>
          )}
          <ThemeToggle />
          <SoundToggle />
          <div className="who" title={user.email}><span className="avatar">{initials}</span><b>{user.name}</b></div>
        </div>
      </div>
    </header>
  );
}

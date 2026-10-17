import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from './Icon.jsx';
import { DASHBOARD_URL } from '../utils/session.js';
import './UserMenu.css';

// The member menu of the previous website: avatar + first name; click → Admin Zone (admins only), Dashboard,
// My Account, Settings … (the list comes from GET /api/v1/me → data.navbar) and Log out.
// These pages belong to the member portal (another application), so they are opened with a normal page load.
const ICONS = { admin: 'shield', dashboard: 'dashboard', myaccount: 'user', settings: 'key' };
const iconFor = (link = '') => {
  const k = Object.keys(ICONS).find((x) => link.includes(x));
  return ICONS[k] || 'arrow';
};

export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const box = useRef(null);
  const { pathname } = useLocation();
  const first = (user && user.name && user.name.first) || 'Member';
  const items = Array.isArray(user && user.navbar) && user.navbar.length ? user.navbar : [{ text: 'Dashboard', link: DASHBOARD_URL }];

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('touchstart', away, { passive: true });
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('touchstart', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const go = (e, link) => {
    e.preventDefault();
    setOpen(false);
    window.location.replace(link || '/');
  };

  return (
    <div className={`um ${open ? 'is-open' : ''}`} ref={box}>
      <button type="button" className="um-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="um-avatar">
          {user && user.profilePicture && imgOk
            ? <img src={user.profilePicture} alt="" onError={() => setImgOk(false)} />
            : first.charAt(0)}
        </span>
        <span className="um-name">{first}</span>
        <span className="um-caret" aria-hidden="true"><Icon name="chevron" size={16} /></span>
      </button>
      {open ? (
        <div className="um-panel" role="menu">
          {items.map((l) => (
            <a key={l.text} role="menuitem" className="um-item" href={l.link || '/'} onClick={(e) => go(e, l.link)}>
              <Icon name={iconFor(l.link)} size={18} />{l.text}
            </a>
          ))}
          <button type="button" role="menuitem" className="um-item um-out" onClick={() => { setOpen(false); onLogout(); }}>
            <Icon name="lock" size={18} />Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}

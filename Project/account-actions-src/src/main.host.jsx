// Entry of the page when it is served inside the member site: /member/account-actions/index.html?id=<member id>&theme=light|dark
//   id     the member id (from the site)          theme  light | dark (follow the site's mode; default: the device)
//   points / usd   the member's reward balance, only shown in the page's status card        sound  on = play click sounds (default: off)
// The page is shown inside the site (an iframe of the same origin). Links and Esc are handed to the site with postMessage;
// opened on its own (no parent) they go to the member pages directly.
import { createRoot } from 'react-dom/client';
import AccountActionsPage from './AccountActionsPage.jsx';
import { createMfrApi } from './services/mfrApi.js';

const q = new URLSearchParams(window.location.search);
const idParam = (q.get('id') || '').trim();
const theme = q.get('theme') === 'dark' ? 'dark' : q.get('theme') === 'light' ? 'light' : undefined;
const framed = window.parent !== window;

const PAGES = { dashboard: '/member/dashboard', account: '/member/myaccount', support: '/member/support' };
const tell = (msg) => { try { window.parent.postMessage({ source: 'mfr-account-actions', ...msg }, window.location.origin); } catch { /* parent not reachable */ } };

const links = {
  ...PAGES,
  onNavigate: (e, key) => {
    e.preventDefault();
    if (framed) tell({ type: 'navigate', key }); else window.location.assign(PAGES[key] || PAGES.account);
  },
};

// Esc closes the page when no pop-up of the page is open (the pop-ups close themselves on Esc)
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && framed && !document.querySelector('.mfr .modal')) tell({ type: 'close' });
});

/** name and email of the signed-in member (same origin: the session cookie goes along); the page still opens if this fails */
async function loadMember() {
  const fallback = { id: idParam, name: 'Member', email: '', points: Number(q.get('points')) || 0, pointsValue: q.get('usd') || '' };
  try {
    const res = await fetch('/api/v1/me', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    const d = (await res.json())?.data;
    if (!d) return fallback;
    return { ...fallback, id: d._id || idParam, name: d.fullName || fallback.name, email: d.mail || '' };
  } catch {
    return fallback;
  }
}

loadMember().then((user) => {
  createRoot(document.getElementById('mfr-account-actions')).render(
    <AccountActionsPage
      api={createMfrApi({ memberId: user.id })}
      user={user}
      links={links}
      theme={theme}
      showHeader={false}
      soundDefault={q.get('sound') === 'on'}
    />,
  );
});

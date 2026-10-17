import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { API_BASE, DEMO_MODE, ME_API, MEMBER_PORTAL_URL } from '../data/site.js';

// Where a logged-in member belongs (the member portal). Same target the Login page uses after a successful login.
export const DASHBOARD_URL = MEMBER_PORTAL_URL || '/member/dashboard';

// Who is logged in? Asks the backend (GET /api/v1/me with the "authorization" cookie). Never throws:
// 401 / network error / anything unexpected simply means "nobody is logged in" (null).
// The answer is cached for a few seconds so several components can ask at once with one request.
const TTL_MS = 5000;
let cache = { at: 0, user: null, pending: null };

export function clearSession() {
  cache = { at: 0, user: null, pending: null };
}

export function fetchSession({ force = false } = {}) {
  if (DEMO_MODE || typeof window === 'undefined') return Promise.resolve(null);
  if (!force && cache.pending) return cache.pending;
  if (!force && cache.at && Date.now() - cache.at < TTL_MS) return Promise.resolve(cache.user);
  const p = fetch(`${API_BASE}${ME_API}`, { method: 'GET', headers: { Accept: 'application/json' }, credentials: 'include' })
    .then(async (res) => {
      if (!res.ok) return null;
      const body = await res.json().catch(() => ({}));
      return body && body.status !== 'error' && body.data && (body.data._id || body.data.mail || body.data.name) ? body.data : null;
    })
    .catch(() => null)
    .then((user) => {
      cache = { at: Date.now(), user, pending: null };
      return user;
    });
  cache.pending = p;
  return p;
}

export async function logoutMember() {
  try {
    await fetch(`${API_BASE}${ME_API}`, { method: 'DELETE', headers: { Accept: 'application/json' }, credentials: 'include' });
  } catch { /* the cookie is cleared server-side; if the call failed we still reset the UI below */ }
  clearSession();
}

// For the header: { user, logout }. user = null while logged out (or still checking).
export function useSession() {
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);
  useEffect(() => {
    let alive = true;
    fetchSession().then((u) => alive && setUser(u));
    const onShow = (e) => { if (e.persisted) fetchSession({ force: true }).then((u) => alive && setUser(u)); };
    window.addEventListener('pageshow', onShow);
    return () => { alive = false; window.removeEventListener('pageshow', onShow); };
  }, [pathname]);
  const logout = useCallback(async () => {
    await logoutMember();
    setUser(null);
    window.location.replace('/');
  }, []);
  return { user, logout };
}

// For the Log in / Sign up pages: a member who is already logged in must not see them (also when coming back with the
// browser Back / Forward buttons) — send them straight to the dashboard. replace() keeps these pages out of the history.
export function useGuestRedirect(active = true) {
  useEffect(() => {
    if (!active) return undefined;
    let alive = true;
    const check = (force) => fetchSession({ force }).then((u) => { if (alive && u) window.location.replace(DASHBOARD_URL); });
    check(false);
    const onShow = (e) => { if (e.persisted) check(true); };
    window.addEventListener('pageshow', onShow);
    return () => { alive = false; window.removeEventListener('pageshow', onShow); };
  }, [active]);
}

// Referral link: a member shares  <site>/?ref=<their member id>&signup  (from the Referrals page of the member portal).
// App.jsx forwards it to /sign-up?ref=<id>; the id is sent with the registration as `referredBy` (User.referredBy in the backend).
//
// The id is kept in localStorage until the sign-up is sent, so it is not lost when the visitor reloads, opens another page first, or
// signs up with a social account (that round trip leaves the site and comes back without the ?ref in the address).
// Kept free of imports so it can be tested without Vite.

const KEY = 'mfr.ref';
const VALID = /^[A-Za-z0-9_-]{1,64}$/; // a member id; anything else in the address is ignored, never sent

/** The referral for this visit: ?ref=<id> in the address (and remember it), else the one remembered earlier, else ''. */
export function readReferral(search = '') {
  const fromUrl = (new URLSearchParams(search).get('ref') || '').trim();
  if (VALID.test(fromUrl)) {
    try { localStorage.setItem(KEY, fromUrl); } catch { /* storage blocked: the address is still used this visit */ }
    return fromUrl;
  }
  try {
    const saved = localStorage.getItem(KEY) || '';
    return VALID.test(saved) ? saved : '';
  } catch {
    return '';
  }
}

/** Forget the referral once the sign-up went through. */
export function clearReferral() {
  try { localStorage.removeItem(KEY); } catch { /* nothing to forget */ }
}

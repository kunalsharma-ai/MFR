import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchSession } from './session.js';
import { REVIEW_EVENT } from './reviews.js';
import { store } from './storage.js';


export const isPro = (u) => /b2b/i.test(String(u?.category || ''));
export const isKid = (u) => Boolean(u?.isMinor) || /minor/i.test(String(u?.category || ''));


export const reviewedKey = (u) => (u?._id ? `mfr_reviewed_${u._id}` : 'mfr_reviewed');

export function useRater() {
  const { pathname } = useLocation();
  const [user, setUser] = useState(undefined); 
  useEffect(() => {
    let alive = true;
    const ask = (force) => fetchSession({ force }).then((u) => alive && setUser(u || null));
    ask(false);
    const onShow = (e) => { if (e.persisted) ask(true); }; 
    window.addEventListener('pageshow', onShow);
    return () => { alive = false; window.removeEventListener('pageshow', onShow); };
  }, [pathname]);
  const [reviewed, setReviewed] = useState(false);
  useEffect(() => {
    const read = () => setReviewed(Boolean(store.get(reviewedKey(user))));
    read();
    window.addEventListener(REVIEW_EVENT, read); 
    return () => window.removeEventListener(REVIEW_EVENT, read);
  }, [user]);
  const refresh = useCallback(() => fetchSession({ force: true }).then((u) => setUser(u || null)), []);
  const state = user === undefined ? 'checking' : !user ? 'out' : isKid(user) ? 'kid' : 'ok';
  return { user, state, canRate: state === 'ok', reviewed, refresh };
}

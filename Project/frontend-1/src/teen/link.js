// Secure links arrive as ?t=<token>. Read it once, keep it for this tab only, and take it out of the address bar so it
// is not left in history, screenshots or a Referer header. Used by the shared Sign up, Set password and parent pages.
import { useEffect, useState } from 'react';

export function useLinkToken(slot) {
  const [tok, setTok] = useState(null);
  useEffect(() => {
    const key = `mfr.teen.${slot}`;
    const u = new URL(window.location.href);
    const fromUrl = u.searchParams.get('t');
    let v = fromUrl;
    try {
      if (fromUrl) sessionStorage.setItem(key, fromUrl);
      else v = sessionStorage.getItem(key);
    } catch { /* storage blocked: keep it in memory */ }
    if (fromUrl) {
      u.searchParams.delete('t');
      window.history.replaceState(window.history.state, '', `${u.pathname}${u.search}${u.hash}`);
    }
    setTok(v || '');
  }, [slot]);
  return tok;
}
export const forgetLinkToken = (slot) => { try { sessionStorage.removeItem(`mfr.teen.${slot}`); } catch { /* */ } };

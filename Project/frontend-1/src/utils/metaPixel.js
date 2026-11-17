// Meta (Facebook) Pixel — loaded ONLY after the visitor accepts analytics cookies in the cookie banner
// (MASTER_PROMPT rule 9 and README → Analytics & consent). Nothing is requested from Facebook before that.
// The pixel ID is public by design (it is visible in every page that runs it); override it with VITE_META_PIXEL_ID,
// or set VITE_META_PIXEL_ID=off to disable the pixel entirely.
// Never send email addresses, phone numbers, passwords or survey answers to the pixel.
import { store } from './storage.js';

const RAW_ID = (import.meta.env.VITE_META_PIXEL_ID || '1113266537846357').trim();
export const META_PIXEL_ID = /^\d{6,20}$/.test(RAW_ID) ? RAW_ID : '';

let loaded = false;
let lastPath = '';

function inject() {
  if (loaded || !META_PIXEL_ID || typeof window === 'undefined') return;
  loaded = true;
  // Meta's standard base code (fbevents.js), written out readably. Queues calls until the library arrives.
  if (!window.fbq) {
    const fbq = function fbqStub(...args) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;
    if (!window._fbq) window._fbq = fbq;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
  }
  window.fbq('init', META_PIXEL_ID);
}

const consented = () => Boolean(store.get('mfr_cookie_choice')?.analytics);

/** Records a PageView for the current URL once per path (the site is a single-page app after the first load). */
export function trackPageView(path = typeof window !== 'undefined' ? window.location.pathname : '') {
  if (!loaded || !window.fbq || path === lastPath) return;
  lastPath = path;
  window.fbq('track', 'PageView');
}

/** Standard or custom event, sent only when the pixel is running (i.e. the visitor consented). */
export function trackEvent(name, params) {
  if (!loaded || !window.fbq) return;
  window.fbq('track', name, params);
}

/**
 * Call once on the client. Loads the pixel now if the visitor already accepted analytics, otherwise waits for the
 * cookie banner's `mfr:consent` event. Choosing "Essential only" later revokes consent for the rest of the visit.
 * Returns a cleanup function.
 */
export function initMetaPixel() {
  if (typeof window === 'undefined' || !META_PIXEL_ID) return () => {};
  const start = () => {
    inject();
    if (window.fbq) window.fbq('consent', 'grant');
    trackPageView();
  };
  const onConsent = (e) => {
    if (e?.detail?.analytics) start();
    else if (loaded && window.fbq) window.fbq('consent', 'revoke');
  };
  if (consented()) start();
  window.addEventListener('mfr:consent', onConsent);
  return () => window.removeEventListener('mfr:consent', onConsent);
}

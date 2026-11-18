import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { PagesContext, pageFor } from './router/pages.js';
import { lazyPages } from './router/lazyPages.js';
import './styles/global.css';
import './styles/sections.css';
import './styles/pages.css';
import './styles/widgets.css';
import './styles/community.css';
import './styles/auth.css';
import './styles/chat.css';
import './styles/brand.css';
import './styles/blog.css';
import './styles/scenes.css';
import './styles/contact.css';
import './styles/rewards.css';
import './styles/faq.css';
import './styles/profiles.css';
import './styles/voices.css';
import './styles/footer.css';
import './styles/hero.css';
import './styles/auth2.css';
import './styles/verify-modal.css';
import './styles/home2.css';
import './styles/rewards.css';
import './styles/faq.css';
import './styles/profiles.css';
import './styles/voices.css';
import './styles/footer.css';
import './styles/hero.css';
import './styles/auth2.css';
import './styles/verify-modal.css';
import './styles/home2.css';
import './styles/cursor.css';
import './styles/chat2.css';
import './styles/review.css';
import './styles/sections21.css';
import './styles/wall.css';
import './styles/v20.css';
import './styles/connect.css';
import './styles/atlas.css';
import './styles/v25.css';
import './styles/chat2.css';
import './styles/review.css';
import './styles/sections21.css';
import './styles/wall.css';
import './styles/v20.css';
import './styles/connect.css';
import './styles/atlas.css';
import './styles/v25.css';
import './styles/v30-video.css';
import './styles/v30-about.css';
import './styles/v30-voices.css';
import './styles/v30-mode.css';
import './styles/v30-toast.css';
import './styles/v30-watch.css';
import './styles/v30-reviews.css';
import './styles/v30-nav.css';
import './styles/v30-hero.css';
import './styles/perf.css';
import './styles/i18n.css';
import './styles/theme-light.css';
import { startCalm } from './utils/calm.js';
import './styles/rv2-flag-avatar.css';

document.documentElement.classList.add('js');

// "Lite" motion profile for phones, tablets and low-power computers: decorative looping animations play a few
// times and then rest (entrance animations, the hero and the review screen keep full motion). Keeps scrolling smooth
// and stops the page from heating up / hanging on weaker devices. See perf.css → html.lite.
try {
  const nav = navigator;
  const conn = nav.connection || {};
  const lowPower = (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) || (nav.deviceMemory && nav.deviceMemory <= 4) || conn.saveData;
  const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (lowPower || touch) document.documentElement.classList.add('lite');
} catch { /* ignore */ }
startCalm();


// "Lite" motion profile for phones, tablets and low-power computers: decorative looping animations play a few
// times and then rest (entrance animations, the hero and the review screen keep full motion). Keeps scrolling smooth
// and stops the page from heating up / hanging on weaker devices. See perf.css → html.lite.
try {
  const nav = navigator;
  const conn = nav.connection || {};
  const lowPower = (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) || (nav.deviceMemory && nav.deviceMemory <= 4) || conn.saveData;
  const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (lowPower || touch) document.documentElement.classList.add('lite');
} catch { /* ignore */ }
startCalm();


const useHash = import.meta.env.VITE_ROUTER === 'hash' || window.location.protocol === 'file:';
if (useHash && window.location.protocol === 'file:' && !window.location.hash) window.location.hash = '#/';
const Router = useHash ? HashRouter : BrowserRouter;
// Hash-routed preview (single HTML file): plain links such as the header dropdown items ("/about-us/reviews") and
// in-page jumps ("#ab-story") would leave the file or be read as routes. Route them correctly instead.
if (useHash) {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self')) return;
    const href = a.getAttribute('href');
    if (/^#[^/]/.test(href)) {
      const el = document.getElementById(decodeURIComponent(href.slice(1)));
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    } else if (/^\/(?!\/)/.test(href)) {
      e.preventDefault();
      window.location.hash = `#${href}`;
    }
  }, true);
}

const normalize = (p) => (p.replace(/\/index\.html$/, '').replace(/\/+$/, '') || '/');

const tree = (
  <StrictMode>
    <PagesContext.Provider value={lazyPages}>
      <Router>
        <App />
      </Router>
    </PagesContext.Provider>
  </StrictMode>
);

const root = document.getElementById('root');


const prerenderedFor = root.getAttribute('data-route');
const matches = !useHash && root.hasChildNodes() && prerenderedFor && normalize(prerenderedFor) === normalize(window.location.pathname);
// Download the current page's chunk first, so hydration renders exactly the prerendered markup.
const currentPath = useHash ? (window.location.hash.slice(1) || '/') : window.location.pathname;
const start = () => {
  if (matches) hydrateRoot(root, tree);
  else {
    root.innerHTML = '';
    createRoot(root).render(tree);
  }
};
lazyPages.load(pageFor(currentPath)).then(start, start);
// The approved Teen consent page (mfr-minor-terms v2.0.1: three cards, four taps, celebration, PDF) as the consent
// step of the guardian's secure-link page (/teen/parent). It renders in its own Shadow DOM, like the package's embed
// build, so its styles and the site's styles never touch. Text and design are the package's, unchanged.
//
// What it sends: the site's Teen API (teenApi.consent) with the same selections as before, the sections behind the
// topics the guardian opened, and the language. The server records version and time; the guardian's details are
// the ones already on file. The teen's own "yes" was given at sign-up, so Part C shows it, locked.
import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Root from './Root.jsx';
import { DEFAULT_CONFIG } from './config.js';
import { loadLanguage, pickInitialLanguage } from './i18n/I18n.jsx';
import { setAssetBase, asset } from './assets.js';
import { CHAPTERS } from './content/terms.js';
import CSS from './styles/app.css?inline';
import FONTS from './styles/fonts.css?inline';

const BASE = `${import.meta.env.BASE_URL || '/'}minor-consent/`;
const REL = { mother: 'mother', father: 'father', legal_guardian: 'guardian' };

export default function GuardianConsentV2({ view, submit, onDone, onDecline }) {
  const host = useRef(null);
  const live = useRef({ submit, onDone, onDecline });
  live.current = { submit, onDone, onDecline };

  useEffect(() => {
    const el = host.current;
    if (!el) return undefined;
    setAssetBase(BASE);
    if (!document.getElementById('mfr-minor-fonts')) {
      const f = document.createElement('style');
      f.id = 'mfr-minor-fonts';
      f.textContent = FONTS.replace(/url\(['"]?(fonts\/[^'")]+)['"]?\)/g, (m, p) => `url('${asset(p)}')`);
      document.head.appendChild(f);
    }
    const shadow = el.shadowRoot || el.attachShadow({ mode: 'open' });
    shadow.innerHTML = '';
    const st = document.createElement('style');
    st.textContent = CSS;
    shadow.appendChild(st);
    const target = document.createElement('div');
    target.id = 'mfr-minor';
    shadow.appendChild(target);

    const g = view.guardian || {};
    const cfg = {
      ...DEFAULT_CONFIG,
      standalone: false,
      submitUrl: '',
      statusUrl: '',
      continueUrl: '',
      logoutUrl: '',
      member: { id: view.reference || '', firstName: view.teen?.firstName || '', age: view.teen?.age ?? null, ageBand: '', country: view.teen?.countryCode || '' },
      guardian: {
        name: [g.firstName, g.lastName].filter(Boolean).join(' '),
        relationship: REL[g.relation] || '',
        contactType: 'email',
        contact: g.email || '',
        country: view.teen?.countryCode || '',
        verified: true, // the guardian opened the secure link sent to this address
      },
      assentGiven: true,
      submit: async (rec) => {
        const topics = new Set(rec.topicsOpened || []);
        const sectionsRead = CHAPTERS.filter((c) => topics.has(c.id)).flatMap((c) => c.sections);
        const r = await live.current.submit({ selections: rec.consents, sectionsRead, language: rec.language });
        return { ...(r || {}), consentId: rec.consentId };
      },
      handOff: (rec, data) => live.current.onDone(rec, data),
      onDecline: () => live.current.onDecline(),
    };
    const lang = pickInitialLanguage(cfg);
    let root = null;
    let gone = false;
    loadLanguage(lang).then(() => {
      if (gone) return;
      root = createRoot(target);
      root.render(<Root cfg={cfg} initial={lang} />);
    });
    return () => { gone = true; if (root) setTimeout(() => root.unmount(), 0); };
  }, [view]);

  return <div ref={host} className="tz-minor-v2" />;
}

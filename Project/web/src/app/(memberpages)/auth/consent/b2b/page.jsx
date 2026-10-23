'use client';

/**
 * Next.js App Router page for the MFR Pro Consent experience.
 * Route: /mfr-pro-consent
 *
 * Pass member data via:
 *   - window.MFR_PRO_CONSENT (set in a parent layout / script), or
 *   - searchParams / server props if you extend this page.
 */
import { useEffect, useState } from 'react';
import Root from './Root.jsx';
import { readConfig } from './config.js';
import { setAssetBase } from './assets.js';
import { loadLanguage, pickInitialLanguage } from './i18n/I18n.jsx';

import './styles/fonts.css';
import './styles/app.css';
import './styles/picker.css';

export default function MfrProConsentPage() {
  const [ready, setReady] = useState(false);
  const [cfg, setCfg] = useState(null);
  const [lang, setLang] = useState('en');

  useEffect(() => {
    // Assets live in Next.js /public — serve from site root
    setAssetBase('/');

    const config = {
      ...readConfig(),
      standalone: true, // lets App set document theme + theme-color
    };
    setCfg(config);

    const initial = pickInitialLanguage(config);
    setLang(initial);

    // Preload non-English strings before first paint when needed
    if (initial === 'en') {
      setReady(true);
    } else {
      loadLanguage(initial).then(() => setReady(true));
    }
  }, []);

  if (!ready || !cfg) {
    // Minimal shell while language pack loads (avoids English flash)
    return (
      <div
        id="mfr-pro-consent"
        className="mfr-pro-consent"
        style={{ minHeight: '100vh', background: 'var(--bg, #f6f7fb)' }}
        aria-busy="true"
      />
    );
  }

  return (
    <div id="mfr-pro-consent" className="mfr-pro-consent">
      <Root cfg={cfg} initial={lang} />
    </div>
  );
}

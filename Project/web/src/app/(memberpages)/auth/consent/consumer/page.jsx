'use client';

/**
 * Next.js App Router page for the MFR Consent experience.
 * Place this folder under your Next.js project's `app/` directory.
 *
 * Route: /consent  (or rename the folder for a different path)
 *
 * Before the page loads, set window.MFR_CONSENT from a layout or a parent
 * server component / middleware if you need member-specific data.
 * Example (in a layout or via a small script):
 *   window.MFR_CONSENT = {
 *     member: { id: '123', firstName: 'Priya' },
 *     submitUrl: '/api/consent',
 *     continueUrl: '/dashboard',
 *     logoutUrl: '/logout',
 *     headers: { 'X-CSRF-Token': '…' },
 *   };
 */

import { useEffect, useState } from 'react';
import Root from './Root.jsx';
import { readConfig } from './config.js';
import { setAssetBase } from './assets.js';
import { loadLanguage, pickInitialLanguage } from './i18n/I18n.jsx';
import './styles/fonts.css';
import './styles/app.css';

export default function ConsentPage() {
  const [ready, setReady] = useState(false);
  const [cfg, setCfg] = useState(null);
  const [lang, setLang] = useState('en');

  useEffect(() => {
    // Assets live in Next.js /public — use root-relative paths
    setAssetBase('/');

    const config = { ...readConfig(), standalone: true };
    const initialLang = pickInitialLanguage(config);

    // Apply theme before paint to avoid flash (mirrors original boot script)
    try {
      const stored = localStorage.getItem('mfr.consent.theme');
      const th =
        stored ||
        (config.theme === 'light' || config.theme === 'dark' ? config.theme : '') ||
        (initialLang && !/^en/i.test(initialLang) ? 'dark' : 'light');
      document.documentElement.setAttribute(
        'data-theme',
        th === 'dark' ? 'classic' : 'light'
      );
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', th === 'dark' ? '#060b26' : '#fbfbff');
    } catch (_) {}

    loadLanguage(initialLang).then(() => {
      setCfg(config);
      setLang(initialLang);
      setReady(true);
    });
  }, []);

  if (!ready || !cfg) {
    // Minimal placeholder while language strings load (avoids English flash for non-en)
    return (
      <div
        id="mfr-consent"
        style={{
          minHeight: '100vh',
          background: 'var(--bg, #fbfbff)',
        }}
      />
    );
  }

  return (
    <div id="mfr-consent">
      <Root cfg={cfg} initial={lang} />
    </div>
  );
}

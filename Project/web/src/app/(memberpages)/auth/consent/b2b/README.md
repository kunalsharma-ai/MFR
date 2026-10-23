# MFR Pro Consent — Next.js App Router page

Drop this folder into your Next.js project’s `app/` directory.

## Structure

```
app/
  mfr-pro-consent/
    page.jsx          ← route entry (client component)  →  /mfr-pro-consent
    layout.jsx        ← metadata + full-viewport wrapper
    App.jsx
    Root.jsx
    config.js
    assets.js
    sound.js
    components/
    content/
    i18n/
    styles/
public/
  brand/              ← logos & marks
  fonts/              ← Inter + Manrope variable fonts
server/               ← optional reference API (consent-api.mjs)
```

## Usage

1. Copy `app/mfr-pro-consent/` into your project’s `app/` folder.
2. Copy `public/brand/` and `public/fonts/` into your project’s `public/` folder.
3. Ensure React 19 (or 18) is available — this page uses only React + browser APIs.

### Pass member config

Set `window.MFR_PRO_CONSENT` **before** the page hydrates (e.g. in a root layout script, or from a server component that injects a small script tag):

```js
window.MFR_PRO_CONSENT = {
  member: {
    id: 'B-10293',
    firstName: 'Arjun',
    jobTitle: 'IT Director',
    company: 'Northwind Ltd',
  },
  submitUrl: '/api/consent/business',
  headers: { 'X-CSRF-Token': '…' },
  continueUrl: '/business/dashboard',
  logoutUrl: '/logout',
  termsVersion: 'B2B-2026.10',
};
```

Or extend `page.jsx` to accept searchParams / server-fetched props and merge them into `cfg`.

### Route

Visiting `/mfr-pro-consent` renders the full consent experience.

Rename the folder (e.g. to `consent` or `business/consent`) if you want a different URL.

## Notes

- The page is a **client component** (`'use client'`) because it uses localStorage, sessionStorage, Web Audio, and pointer events.
- Fonts are loaded from `/fonts/*` (Next.js public folder).
- Brand images resolve via `asset()` which defaults to site root (`/brand/...`).
- Optional backend: see `server/consent-api.mjs` + `schema.sql` for a reference consent store.

'use client';

import { I18nProvider } from './i18n/I18nProvider.jsx';
import { ToastProvider } from './components/Toasts.jsx';
import App from './App.jsx';

/**
 * Next.js App Router page — route: /profile
 *
 * IMPORTANT: import the global stylesheet once in your root layout:
 *   import './profile/styles/app.css';
 * (Next.js only allows global CSS from the root app/layout.jsx)
 */
export default function ProfilePage() {
  return (
    <I18nProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </I18nProvider>
  );
}

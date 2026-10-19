// Runtime configuration. Override without rebuilding by editing public/config.js
// (window.MFR_CONFIG), which is loaded before the app.
const cfg = (typeof window !== 'undefined' && window.MFR_CONFIG) || {};

export const CONFIG = {
  /** POST {target, source, q: string[]} -> {translations: string[]}. See server/ and api/translate.js */
  translateEndpoint: cfg.translateEndpoint || '',
  /** Use the on-device browser Translator API (Chrome 138+) when no endpoint is configured. */
  useBrowserTranslator: cfg.useBrowserTranslator !== false,
  /** Optional: POST finished profile payloads here (JSON). Local saving always happens. */
  profileEndpoint: cfg.profileEndpoint || '',
  /** Extra headers for the profile endpoint, e.g. { Authorization: 'Bearer …' } */
  profileHeaders: cfg.profileHeaders || {},
  /** Send cookies with the profile POST ('include' when the endpoint is on another domain and uses a session cookie). */
  profileCredentials: cfg.profileCredentials || 'same-origin',
  /** The logged-in member's id, set by your member portal: window.MFR_CONFIG.memberId, window.MFR_MEMBER = { id }
   *  or ?member=<id> in the URL. Sent as `memberId` with every finished profile. */
  memberId: cfg.memberId || (typeof window !== 'undefined' && (window.MFR_MEMBER?.id || new URLSearchParams(location.search).get('member'))) || '',
  /** Default language when the browser language is not supported. */
  defaultLang: cfg.defaultLang || 'en',
  /** Detect the visitor's browser language on the first visit. */
  autoDetectLanguage: cfg.autoDetectLanguage !== false,
  /** Base URL of the validation/OTP/profile API (server/server.mjs). '' = demo mode (codes shown on screen). */
  apiBase: cfg.apiBase ?? '',
  /** Ask respondents to verify email / phone with a one-time code (optional, always skippable). */
  verifyEmail: cfg.verifyEmail !== false,
  verifyPhone: cfg.verifyPhone !== false,
  /** Sound default for first-time visitors. */
  soundDefault: cfg.soundDefault !== false
};

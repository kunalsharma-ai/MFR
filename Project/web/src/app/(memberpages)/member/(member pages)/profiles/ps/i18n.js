import EN from './en.js';

const fill = (s, vars) => (vars ? String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s);
// Profile names come from the portal's own profile list (database); register them so t('p.<slug>') returns them.
const NAMES = {};
export const setProfileNames = (list) => { (list || []).forEach((p) => { if (p?.slug && p?.name) NAMES[p.slug] = p.name; }); };
export const t = (key, vars) => (key.startsWith('p.') && NAMES[key.slice(2)]) || fill(EN[key] ?? key, vars);
// Same shape as the design's hook; the portal profile page is English-only.
export const useI18n = () => ({ t, lang: 'en', rtl: false });
export const useTr = (texts) => [texts, false];

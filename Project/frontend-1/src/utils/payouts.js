// Country-aware reward rules.
// • India: every reward type, including UPI
// • Everywhere else: every reward type except UPI (UPI is an India-only payment system)
import { COUNTRIES } from '../data/countries.js';
import { PAYOUTS } from '../data/site.js';

export const METHODS_GLOBAL = PAYOUTS.filter((p) => !p.only).map((p) => p.name);
export const METHODS_INDIA = PAYOUTS.map((p) => p.name);
export const METHOD_ICON = Object.fromEntries(PAYOUTS.map((p) => [p.name, p.icon]));
export const METHOD_INFO = Object.fromEntries(PAYOUTS.map((p) => [p.name, p]));
// Rewards that are not a money amount (none at the moment — every reward type shows a figure)
export const NON_MONEY = [];

const ALIASES = { uk: 'GB', 'united kingdom': 'GB', england: 'GB', usa: 'US', us: 'US', 'united states': 'US', uae: 'AE', 'south korea': 'KR', korea: 'KR', vietnam: 'VN', russia: 'RU' };
const BY_NAME = Object.fromEntries(COUNTRIES.map((c) => [c.name.toLowerCase(), c.iso]));

// "Pune, India" / "India" / "IN" → "IN"
export function isoFromPlace(place = '', iso = '') {
  if (/^[A-Za-z]{2}$/.test(iso)) return iso.toUpperCase();
  const country = String(place).split(',').pop().trim().toLowerCase();
  return ALIASES[country] || BY_NAME[country] || (/^[a-z]{2}$/.test(country) ? country.toUpperCase() : '');
}
export const methodsFor = (iso) => (iso === 'IN' ? METHODS_INDIA : METHODS_GLOBAL);

// Free-text method from a feed → one of the reward type names above
export const normalizeMethod = (m = '') => {
  const t = String(m).toLowerCase();
  if (t.includes('upi')) return 'UPI (India)';
  if (t.includes('paypal')) return 'PayPal';
  if (t.includes('wire')) return 'Wire Transfer';
  if (t.includes('bank')) return 'Bank Transfer';
  if (t.includes('grocery')) return 'Grocery Vouchers';
  if (t.includes('shopping') || t.includes('voucher')) return 'Shopping Vouchers';
  if (t.includes('gift') || t.includes('amazon')) return 'Digital Gift Cards';
  if (t.includes('cash')) return 'Cash Rewards';
  return m;
};

// Drops any activity item whose reward type isn't offered in that member's country
// (e.g. a UPI payout outside India, or a rupee amount outside India) so notifications are always accurate.
export function sanitizeActivity(items = []) {
  return items
    .map((it) => {
      const iso = isoFromPlace(it.place, it.iso);
      return { ...it, iso, method: normalizeMethod(it.method) };
    })
    .filter((it) => it.iso && it.name && methodsFor(it.iso).includes(it.method) && !(it.iso !== 'IN' && /₹|INR|rs\.?\s/i.test(it.amount || '')));
}

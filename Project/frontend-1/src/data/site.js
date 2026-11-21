// Single source of truth for brand, contact and channel data.
// Edit here — every component reads from this file.

export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://www.myfrequentrewards.com').replace(/\/$/, '');

export const BRAND = {
  name: 'MyFrequentRewards',
  legalName: 'Frequent Research Fieldwork Solutions Pvt. Ltd.',
  dba: 'd/b/a MyFrequentRewards',
  tagline: 'Rewarding Loyalty. Enriching Everyday.',
  motto: 'Your Voice. Your Value. Your Rewards.',
  parent: { name: 'Frequent Research', url: 'https://www.frequentresearch.com/' },
  logo: '/images/brand/myfrequentrewards-logo.webp',
  logoPng: '/images/brand/myfrequentrewards-logo.png',
  monogram: '/images/brand/mfr-monogram.webp',
  ogImage: '/images/og-myfrequentrewards.jpg',
  iso: ['ISO 20252:2019', 'ISO 9001:2015', 'ISO 27001:2013'],
};

export const CONTACT = {
  email: 'support@myfrequentrewards.com',
  phone: '+91 81300 15743',
  phoneHref: 'tel:+918130015743',
  whatsapp: '918178200573',
  whatsappDisplay: '+91 81782 00573',
  address: { street: 'Mangolpur Kalan', city: 'New Delhi', region: 'Delhi', postalCode: '110085', country: 'IN' },
};

export const whatsappLink = (text = 'Hi MyFrequentRewards team, I need help with my account.') =>
  `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;

export const X_HANDLE = '@MFR_Community'; // twitter:site on every page

export const SOCIALS = [
  { id: 'youtube', name: 'YouTube', handle: '@MyFrequentRewards', url: 'https://www.youtube.com/@MyFrequentRewards', qr: '/images/qr/youtube.svg', color: '#FF0033', cta: 'Watch earning tips' },
  { id: 'facebook', name: 'Facebook', handle: '/myfrequentreswards', url: 'https://www.facebook.com/myfrequentreswards/', qr: '/images/qr/facebook.svg', color: '#1877F2', cta: 'Join the community' },
  { id: 'instagram', name: 'Instagram', handle: '@myfrequentrewards', url: 'https://www.instagram.com/myfrequentrewards/', qr: '/images/qr/instagram.svg', color: '#E1306C', cta: 'See reward drops' },
  { id: 'linkedin', name: 'LinkedIn', handle: 'MyFrequentRewards', url: 'https://www.linkedin.com/company/myfrequentrewards', qr: '/images/qr/linkedin.svg', color: '#0A66C2', cta: 'For professionals' },
  { id: 'x', name: 'X', handle: '@MFR_Community', url: 'https://x.com/MFR_Community', qr: '/images/qr/x.svg', color: '#0F1419', cta: 'Get survey updates' },
];

export const NOTIFY_CHANNELS = [
  { id: 'dashboard', name: 'Account Dashboard', line: 'Track surveys and rewards anytime.', icon: 'dashboard' },
  { id: 'sms', name: 'SMS', line: 'Receive instant survey alerts.', icon: 'sms' },
  { id: 'whatsapp', name: 'WhatsApp', line: 'Get notifications directly on WhatsApp.', icon: 'whatsapp' },
  { id: 'email', name: 'Email', line: 'Detailed invitations delivered to your inbox.', icon: 'email' },
];

// Reward types members can choose when they claim (consumers and professionals alike).
// Availability of a given type can vary by study and country; UPI is offered ONLY to members in India.
// `kind` groups them on the Rewards page: money (paid to an account), voucher (spend in store), care (health).
export const PAYOUTS = [
  { id: 'paypal', name: 'PayPal', short: 'PayPal', line: 'Rewards sent straight to your PayPal wallet — used worldwide.', best: 'Worldwide', kind: 'money', icon: 'paypal', hue: '#003087', hue2: '#009CDE' },
  { id: 'bank', name: 'Bank Transfer', short: 'Bank', line: 'Paid directly into your verified bank account.', best: 'Bank-first members', kind: 'money', icon: 'bank', hue: '#0E7C66', hue2: '#3DDBB4' },
  { id: 'wire', name: 'Wire Transfer', short: 'Wire', line: 'Secure international transfer to your verified account.', best: 'International', kind: 'money', icon: 'globe', hue: '#0B1E5B', hue2: '#2F6BFF' },
  { id: 'upi', name: 'UPI (India)', short: 'UPI', line: 'Instant transfer to your UPI ID — available to members in India only.', best: 'India only', only: 'IN', kind: 'money', icon: 'upi', hue: '#5B2EA6', hue2: '#ED752E' },
  { id: 'shopping', name: 'Shopping Vouchers', short: 'Shopping', line: 'Vouchers for popular stores — online and on the high street.', best: 'Shoppers', kind: 'voucher', icon: 'cart', hue: '#E8590C', hue2: '#FFB347' },
  { id: 'grocery', name: 'Grocery Vouchers', short: 'Grocery', line: 'Put your rewards towards the weekly shop.', best: 'Families', kind: 'voucher', icon: 'basket', hue: '#C77700', hue2: '#FFD43B' },
  { id: 'giftcards', name: 'Digital Gift Cards', short: 'Gift cards', line: 'Instant e-gift codes for brands such as Amazon, sent to your inbox.', best: 'Instant codes', kind: 'voucher', icon: 'card', hue: '#7048E8', hue2: '#C084FC' },
];
export const REWARD_KINDS = {
  money: { label: 'Money to your account', c: '#14C9B5' },
  voucher: { label: 'Vouchers & gift cards', c: '#FF8A00' },
};
// One plain-English line used in copy across the site (keep in sync with PAYOUTS).
export const PAYOUT_LINE = 'PayPal, bank or wire transfer, shopping, grocery and digital gift card vouchers — plus UPI in India';

export const MIN_SIGNUP_AGE = Number(import.meta.env.VITE_MIN_SIGNUP_AGE || 13);
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
// Existing member application login URL (dashboard, surveys, claims). MUST be set for production.
export const MEMBER_PORTAL_URL = import.meta.env.VITE_MEMBER_PORTAL_URL || '';
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

// ── Backend (existing MHO-style API) ─────────────────────────────────────────────────────────────
// Everything about a member lives under one route: PUT = register, POST /resend = resend the email,
// POST /:id = check an email link, PATCH = set the password. (See src/utils/api.js.)
export const USER_API = import.meta.env.VITE_USER_ENDPOINT || '/api/v1/user';
// Stored in User.category. Must match the names in the backend `Category` collection for this domain.
export const MEMBER_CATEGORIES = {
  consumer: import.meta.env.VITE_CATEGORY_CONSUMER || 'b2c',
  professional: import.meta.env.VITE_CATEGORY_PROFESSIONAL || 'b2b',
};

export const ME_API = '/api/v1/me'; // signed-in member: PATCH /answer saves profile answers · PUT updates the member · DELETE signs out
export const OPTION_API = import.meta.env.VITE_OPTION_ENDPOINT || '/api/v1/option'; // GET /<question name> → the choices for a profile question
export const FORGOT_API = import.meta.env.VITE_FORGOT_ENDPOINT || '/api/v1/forgot-password'; // POST { user: <email> } mails a reset link

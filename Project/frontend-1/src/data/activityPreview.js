const PEOPLE = [
  // [name, city, country ISO, currency, segment, role]
  ['Aarav S.', 'Mumbai', 'IN', '₹', 'consumer', 'College student'],
  ['Priya K.', 'Pune', 'IN', '₹', 'business', 'HR Manager'],
  ['Rohan M.', 'Bengaluru', 'IN', '₹', 'business', 'Software Developer'],
  ['Kavya R.', 'Chennai', 'IN', '₹', 'consumer', 'Homemaker'],
  ['Imran Q.', 'Lucknow', 'IN', '₹', 'consumer', 'Small shop owner'],
  ['Dr. Meera N.', 'Kochi', 'IN', '₹', 'business', 'Physician'],
  ['Emily R.', 'Austin', 'US', '$', 'consumer', 'Parent of two'],
  ['Marcus J.', 'Chicago', 'US', '$', 'business', 'IT Director'],
  ['Hannah W.', 'Toronto', 'CA', 'CA$', 'consumer', 'Nursing student'],
  ['Daniel P.', 'Manchester', 'GB', '£', 'business', 'Procurement Head'],
  ['Olivia T.', 'Leeds', 'GB', '£', 'consumer', 'Retiree'],
  ['Lukas B.', 'Munich', 'DE', '€', 'consumer', 'Homemaker'],
  ['Jonas F.', 'Berlin', 'DE', '€', 'business', 'Plant Manager'],
  ['Chloé D.', 'Lyon', 'FR', '€', 'consumer', 'Mobile gamer'],
  ['Giulia R.', 'Milan', 'IT', '€', 'business', 'Marketing Manager'],
  ['Sofia M.', 'Madrid', 'ES', '€', 'consumer', 'EV owner'],
  ['Nora V.', 'Utrecht', 'NL', '€', 'business', 'Finance Manager'],
  ['Kasia W.', 'Warsaw', 'PL', 'zł', 'consumer', 'Online shopper'],
  ['Lucas M.', 'São Paulo', 'BR', 'R$', 'consumer', 'Delivery rider'],
  ['Isabela C.', 'Bogotá', 'CO', '$', 'business', 'Agency Owner'],
  ['Diego F.', 'Mexico City', 'MX', 'MX$', 'consumer', 'Football fan'],
  ['Aisha H.', 'Dubai', 'AE', 'AED ', 'business', 'Operations Manager'],
  ['Omar A.', 'Riyadh', 'SA', 'SAR ', 'business', 'Civil Engineer'],
  ['Amara O.', 'Lagos', 'NG', '₦', 'consumer', 'Fashion buyer'],
  ['Wanjiru K.', 'Nairobi', 'KE', 'KSh ', 'business', 'AgTech Founder'],
  ['Thabo M.', 'Johannesburg', 'ZA', 'R', 'consumer', 'Car owner'],
  ['Kenji T.', 'Osaka', 'JP', '¥', 'business', 'Product Manager'],
  ['Mei L.', 'Singapore', 'SG', 'S$', 'consumer', 'Frequent traveller'],
  ['Nguyen H.', 'Hanoi', 'VN', '₫', 'consumer', 'Coffee lover'],
  ['Charoen P.', 'Bangkok', 'TH', '฿', 'consumer', 'Food blogger'],
  ['Jessa R.', 'Manila', 'PH', '₱', 'business', 'Call-centre Team Lead'],
  ['Liam O.', 'Sydney', 'AU', 'A$', 'business', 'Cloud Architect'],
];
const COUNTRY = { IN: 'India', US: 'USA', CA: 'Canada', GB: 'UK', DE: 'Germany', FR: 'France', IT: 'Italy', ES: 'Spain', NL: 'Netherlands', PL: 'Poland', BR: 'Brazil', CO: 'Colombia', MX: 'Mexico', AE: 'UAE', SA: 'Saudi Arabia', NG: 'Nigeria', KE: 'Kenya', ZA: 'South Africa', JP: 'Japan', SG: 'Singapore', VN: 'Vietnam', TH: 'Thailand', PH: 'Philippines', AU: 'Australia' };
// Rough local equivalents of small survey rewards (consumer) and larger B2B rewards (business)
const SCALE = { '₹': [350, 1800], $: [5, 40], 'CA$': [6, 45], '£': [4, 30], '€': [5, 35], zł: [20, 140], R$: [25, 180], 'MX$': [90, 600], 'AED ': [20, 150], 'SAR ': [20, 150], '₦': [4000, 30000], 'KSh ': [600, 4500], R: [80, 600], '¥': [700, 5000], S$: [6, 45], '₫': [120000, 900000], '฿': [150, 1100], '₱': [250, 1800], 'A$': [7, 55] };
const METHODS_ALL = ['PayPal', 'Bank Transfer', 'Wire Transfer', 'Shopping Vouchers', 'Grocery Vouchers', 'Digital Gift Cards'];
const fmt = (cur, n) => {
  const rounded = n >= 10000 ? Math.round(n / 1000) * 1000 : n >= 1000 ? Math.round(n / 50) * 50 : n >= 100 ? Math.round(n / 10) * 10 : Math.round(n);
  return `${cur}${rounded.toLocaleString('en-US')}`;
};

export function previewActivity(n = 40) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const [name, city, iso, cur, segment, role] = PEOPLE[(i * 7) % PEOPLE.length];
    const pool = iso === 'IN' ? ['UPI (India)', 'UPI (India)', ...METHODS_ALL] : METHODS_ALL; // UPI: India only
    let method = pool[(i * 3 + Math.floor(i / pool.length)) % pool.length];
    const [lo, hi] = SCALE[cur];
    const t = ((i * 37) % 100) / 100;
    const base = segment === 'business' ? lo + (hi - lo) * (0.45 + t * 0.55) : lo + (hi - lo) * t * 0.45;
    out.push({
      name, role, segment, iso,
      place: `${city}, ${COUNTRY[iso]}`,
      method,
      amount: fmt(cur, base),
      at: new Date(Date.now() - ((i * 13) % 55 + 1) * 60000).toISOString(),
    });
  }
  return out;
}

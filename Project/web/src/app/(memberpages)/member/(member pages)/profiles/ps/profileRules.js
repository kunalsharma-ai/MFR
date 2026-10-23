
export const CORE_SLUGS = ['basic', 'educational', 'professional', 'financial'];
export const isCore = (slug) => CORE_SLUGS.includes(slug);

// sign-up interest id (CONSUMER_INTERESTS in the sign-up site)  ->  profile slugs (Profile.slug in the database)
export const INTEREST_PROFILES = {
  family: ['parenting'],
  shopping: ['shopping', 'fashion-apparel'],
  tech: ['tech', 'consumer-electronics', 'technology-digital-services'],
  auto: ['automobile', 'automotive-mobility'],
  finance: ['banking-financial-services'],
  travel: ['travel', 'travel-tourism'],
  media: ['entertainment-media', 'game', 'gaming-esports'],
  beauty: ['beauty', 'beauty-personal-care'],
  food: ['lifestyle-food', 'food-beverages', 'restaurants-food-delivery'],
  pets: ['home-pet', 'pets-animal-care'],
  sports: ['sports', 'sports-physical-fitness'],
  health: ['health', 'health-wellness'],
};

const pct = (p) => Math.max(0, Number(p?.status) || 0);

// The saved answer comes back as one string (a single interest) or a list.
export const normalizeInterests = (raw) => [...new Set([].concat(raw ?? []).map((x) => String(x).trim()).filter(Boolean))];

const doneOf = (p) => pct(p) >= 100;
const coreOf = (list) => CORE_SLUGS.map((s) => list.find((p) => p.slug === s)).filter(Boolean);

/** true when every basic profile this member has is complete (also when they have none). */
export const basicsDone = (all) => coreOf(Array.isArray(all) ? all : []).every(doneOf);
/** the first basic profile that is not complete yet, or null. */
export const nextBasic = (all) => coreOf(Array.isArray(all) ? all : []).find((p) => !doneOf(p)) || null;

/** all = the profile list from POST /api/v1/profile; returns the profiles to list: the basics first, then the others. */
export function visibleProfiles(all, interests = [], minStatus = 0) {
  const list = Array.isArray(all) ? all : [];
  const wanted = new Set(normalizeInterests(interests).flatMap((i) => INTEREST_PROFILES[i] || []));
  const noInterests = wanted.size === 0; // nothing to filter by: list every other profile
  const extras = list.filter((p) => !isCore(p.slug) && (noInterests || pct(p) >= minStatus || wanted.has(p.slug)));
  return [...coreOf(list), ...extras];
}

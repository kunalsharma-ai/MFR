// Round 9: which world a profile or survey card wears, and the CSS variables of a world.
import { WORLDS as BASE } from "./worldsData";

export const WORLDS = {
  ...BASE,
  care: { name: "Care", dark: false, sky: ["#fff0f3", "#ffc2d1", "#ff8fab", "#9be7d8"], grade: "saturate(1.08)", a1: "#e11d48", a2: "#0d9488", a3: "#f59e0b", card: ["#ffffff", "#3a0d1c", "#7d5866"], shape: "soft", art: "care", stickers: ["health", "heart", "pill", "wellness"] },
  celebrate: { name: "Prize hall", dark: true, sky: ["#120a3a", "#3b1d8f", "#ff4f8b", "#ffb703"], grade: "saturate(1.1)", a1: "#ffb703", a2: "#ff4f8b", a3: "#8b5cf6", card: ["#ffffff", "#1b0b33", "#6b5b85"], shape: "soft", art: "celebrate", stickers: ["trophy", "gift", "star2", "sparkles"] },
};

// profile slugs (the database) and card topics (topics.js) → world
const BY_SLUG = {
  basic: "sunrise", educational: "campus", professional: "circuit", financial: "treasury", "banking-financial-services": "treasury",
  parenting: "hearth", "home-pet": "nest", "home-household": "nest", "household-services": "nest", "pets-animal-care": "nest",
  shopping: "boutique", "fashion-apparel": "runway", "luxury-premium": "runway", "lifestyle-food": "bistro", "food-beverages": "bistro",
  "restaurants-food-delivery": "bistro", travel: "atlas", "travel-tourism": "atlas", automobile: "future", "automotive-mobility": "future",
  health: "care", "health-wellness": "care", beauty: "runway", "beauty-personal-care": "feed", tech: "circuit", "consumer-electronics": "circuit",
  "technology-digital-services": "future", sports: "arena", "sports-physical-fitness": "arena", game: "arcade", "gaming-esports": "arcade",
  mr: "lab", "research-panel": "lab", "entertainment-media": "feed", "content-creator-social-influence1": "feed", "tobacco-nicotine-alcoholic": "bistro",
  additional: "celebrate",
  // the Teen bank (minor__ slugs)
  minor__basic: "sunrise", minor__education: "campus", minor__household: "nest", minor__devices: "circuit", minor__social: "feed", minor__gaming: "arcade",
  minor__shopping: "boutique", minor__food: "bistro", minor__fashion: "runway", minor__sports: "arena", minor__tech: "future", minor__research: "lab", minor__topics: "atlas",
};
const BY_TOPIC = {
  basic: "sunrise", education: "campus", career: "circuit", money: "treasury", family: "hearth", home: "nest", pets: "nest", shopping: "boutique",
  fashion: "runway", luxury: "runway", food: "bistro", lifestyle: "bistro", travel: "atlas", auto: "future", health: "care", beauty: "feed",
  tech: "circuit", sport: "arena", gaming: "arcade", research: "lab", media: "feed", creator: "feed", more: "celebrate", general: "celebrate",
  bizTech: "circuit", bizFinance: "treasury", bizPeople: "hearth", bizMarketing: "feed", bizHealth: "care", bizOps: "future", bizStrategy: "sentry", bizGeneral: "lab",
  tGaming: "arcade", tMusic: "feed", tSchool: "campus", tSocial: "feed", tSport: "arena", tStyle: "runway", tTech: "future", tFood: "bistro", tGeneral: "celebrate",
};

export const worldKey = (slug, topicKey) => BY_SLUG[String(slug || "").toLowerCase()] || BY_TOPIC[topicKey] || "celebrate";

const onColor = (hex) => {
  const h = String(hex).replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#0b1020" : "#ffffff";
};

export function worldVars(key) {
  const w = WORLDS[key] || WORLDS.celebrate;
  const [s0, s1, s2, s3] = w.sky;
  return {
    "--sky0": s0, "--sky1": s1, "--sky2": s2, "--sky3": s3 || s2, "--grade": w.grade,
    "--a1": w.a1, "--a2": w.a2, "--a3": w.a3, "--on-a1": onColor(w.a1),
    "--card": w.card[0], "--ink": w.card[1], "--muted": w.card[2],
  };
}
export const worldOf = (key) => WORLDS[key] || WORLDS.celebrate;

// Topic identities for profile cards and survey cards (v3, Nov 2026).
// Nothing here invents data: a profile's topic comes from its slug (the database), a survey's topic is read from
// the words of its own name and slug. When no word matches, the card uses the segment's "general" topic.
// Each segment (Consumer, Professional, Teen) has its own topic set: lifestyle, business and youth categories.

// Profile categories, by slug. `k` is the strings key (pf3.<k>.title / pf3.<k>.text), `ic` an icon from icons.jsx,
// c1/c2 the card's two identity colours.
export const PROFILE_TOPICS = {
  basic: { k: "basic", ic: "user", c1: "#6d5dfc", c2: "#ff7ab6" },
  educational: { k: "education", ic: "cap", c1: "#ff7a1a", c2: "#ffcd29" },
  professional: { k: "career", ic: "briefcase", c1: "#1d4ed8", c2: "#c2a35a" },
  financial: { k: "money", ic: "bank", c1: "#0b7a5b", c2: "#c9a227" },
  "banking-financial-services": { k: "money", ic: "bank", c1: "#0b7a5b", c2: "#14b88a" },
  parenting: { k: "family", ic: "baby", c1: "#ff5fa2", c2: "#41c9b4" },
  "home-pet": { k: "home", ic: "home", c1: "#d9623b", c2: "#6a994e" },
  "home-household": { k: "home", ic: "home", c1: "#d9623b", c2: "#f2b134" },
  "household-services": { k: "home", ic: "home", c1: "#c2410c", c2: "#f2b134" },
  "pets-animal-care": { k: "pets", ic: "paw", c1: "#0aa5a5", c2: "#ff8a3d" },
  shopping: { k: "shopping", ic: "bag", c1: "#e0287d", c2: "#7b2ff7" },
  "fashion-apparel": { k: "fashion", ic: "shirt", c1: "#db2777", c2: "#f59e0b" },
  "luxury-premium": { k: "luxury", ic: "diamond", c1: "#1b1712", c2: "#b8913b" },
  "lifestyle-food": { k: "food", ic: "food", c1: "#e2482d", c2: "#f5a524" },
  "food-beverages": { k: "food", ic: "cup", c1: "#c2410c", c2: "#3f9b54" },
  "restaurants-food-delivery": { k: "food", ic: "food", c1: "#e2482d", c2: "#3f9b54" },
  travel: { k: "travel", ic: "plane", c1: "#0b84d8", c2: "#1fc7b6" },
  "travel-tourism": { k: "travel", ic: "plane", c1: "#0369a1", c2: "#ff8a5b" },
  automobile: { k: "auto", ic: "car", c1: "#e11d2e", c2: "#202330" },
  "automotive-mobility": { k: "auto", ic: "car", c1: "#be123c", c2: "#ffb800" },
  health: { k: "health", ic: "pulse", c1: "#0e9f8e", c2: "#3d7bfd" },
  "health-wellness": { k: "health", ic: "pulse", c1: "#0e9f8e", c2: "#7bd389" },
  beauty: { k: "beauty", ic: "sparkles", c1: "#d9577a", c2: "#c68b59" },
  "beauty-personal-care": { k: "beauty", ic: "sparkles", c1: "#be185d", c2: "#c68b59" },
  tech: { k: "tech", ic: "chip", c1: "#2563eb", c2: "#06b6d4" },
  "consumer-electronics": { k: "tech", ic: "phone", c1: "#4338ca", c2: "#06b6d4" },
  "technology-digital-services": { k: "tech", ic: "chip", c1: "#2563eb", c2: "#a855f7" },
  sports: { k: "sport", ic: "ball", c1: "#2f9e44", c2: "#ff6b2c" },
  "sports-physical-fitness": { k: "sport", ic: "ball", c1: "#15803d", c2: "#c6f432" },
  game: { k: "gaming", ic: "gamepad", c1: "#7c3aed", c2: "#ff2bd6" },
  "gaming-esports": { k: "gaming", ic: "gamepad", c1: "#6d28d9", c2: "#2bf0ff" },
  mr: { k: "research", ic: "flask", c1: "#5b3fd6", c2: "#f59e0b" },
  "research-panel": { k: "research", ic: "flask", c1: "#5b3fd6", c2: "#06b6d4" },
  "entertainment-media": { k: "media", ic: "film", c1: "#9b2cf0", c2: "#ff3d6e" },
  "content-creator-social-influence1": { k: "creator", ic: "camera", c1: "#f43f5e", c2: "#8b5cf6" },
  "tobacco-nicotine-alcoholic": { k: "lifestyle", ic: "cup", c1: "#8c1c2f", c2: "#c98b2f" },
  additional: { k: "more", ic: "layers", c1: "#475569", c2: "#0ea5e9" },
};
const norm = (s) => String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const FALLBACK = { k: "more", ic: "layers", c1: "#6366f1", c2: "#14b8a6" };
export function profileTopic(p) {
  const s = String(p?.slug || "").toLowerCase();
  return PROFILE_TOPICS[s] || PROFILE_TOPICS[norm(p?.name)] || FALLBACK;
}

// Survey topics per segment, matched on whole words of the survey's name + slug, in order (first match wins).
const SURVEY_TOPICS = {
  consumer: [
    { k: "food", ic: "food", c1: "#e2482d", c2: "#f5a524", w: ["food", "drink", "beverage", "snack", "restaurant", "coffee", "tea", "grocery", "meal", "recipe", "dining", "beer", "wine"] },
    { k: "shopping", ic: "bag", c1: "#e0287d", c2: "#7b2ff7", w: ["shop", "shopping", "retail", "brand", "store", "ecommerce", "purchase", "product", "fashion", "apparel", "clothing"] },
    { k: "beauty", ic: "sparkles", c1: "#d9577a", c2: "#c68b59", w: ["beauty", "skin", "skincare", "cosmetic", "cosmetics", "hair", "makeup", "fragrance", "personal", "care"] },
    { k: "travel", ic: "plane", c1: "#0b84d8", c2: "#1fc7b6", w: ["travel", "holiday", "vacation", "hotel", "airline", "flight", "tourism", "trip"] },
    { k: "health", ic: "pulse", c1: "#0e9f8e", c2: "#3d7bfd", w: ["health", "wellness", "fitness", "medical", "medicine", "pharma", "diet", "sleep"] },
    { k: "tech", ic: "phone", c1: "#2563eb", c2: "#06b6d4", w: ["tech", "technology", "mobile", "phone", "smartphone", "app", "apps", "internet", "digital", "electronics", "gadget", "telecom"] },
    { k: "money", ic: "bank", c1: "#0b7a5b", c2: "#c9a227", w: ["bank", "banking", "finance", "financial", "insurance", "money", "credit", "card", "payment", "loan"] },
    { k: "home", ic: "home", c1: "#d9623b", c2: "#6a994e", w: ["home", "household", "kitchen", "furniture", "appliance", "cleaning", "garden"] },
    { k: "auto", ic: "car", c1: "#e11d2e", c2: "#ffb800", w: ["car", "cars", "auto", "automotive", "vehicle", "mobility", "ev"] },
    { k: "media", ic: "film", c1: "#9b2cf0", c2: "#ff3d6e", w: ["tv", "movie", "movies", "streaming", "music", "media", "entertainment", "video", "ad", "ads", "advert", "advertising"] },
    { k: "family", ic: "baby", c1: "#ff5fa2", c2: "#41c9b4", w: ["parent", "parents", "parenting", "baby", "kids", "family", "child"] },
    { k: "pets", ic: "paw", c1: "#0aa5a5", c2: "#ff8a3d", w: ["pet", "pets", "dog", "cat", "animal"] },
  ],
  professional: [
    { k: "bizTech", ic: "chip", c1: "#1d4ed8", c2: "#06b6d4", w: ["it", "software", "saas", "cloud", "technology", "tech", "ai", "data", "cyber", "security", "digital", "erp", "crm", "telecom"] },
    { k: "bizFinance", ic: "bank", c1: "#0b5f4a", c2: "#c2a35a", w: ["finance", "financial", "bank", "banking", "investment", "insurance", "accounting", "tax", "payments", "fintech", "budget"] },
    { k: "bizPeople", ic: "users", c1: "#4338ca", c2: "#c2a35a", w: ["hr", "people", "talent", "hiring", "recruitment", "workplace", "employee", "employees", "leadership", "culture", "remote"] },
    { k: "bizMarketing", ic: "megaphone", c1: "#9d174d", c2: "#c2a35a", w: ["marketing", "brand", "advertising", "media", "sales", "customer", "cx", "b2b", "agency"] },
    { k: "bizHealth", ic: "pulse", c1: "#0f766e", c2: "#38bdf8", w: ["healthcare", "medical", "physician", "doctor", "doctors", "pharma", "pharmaceutical", "hospital", "clinical", "nurse"] },
    { k: "bizOps", ic: "cog", c1: "#334155", c2: "#c2a35a", w: ["operations", "supply", "logistics", "manufacturing", "procurement", "industrial", "energy", "construction", "automotive", "fleet"] },
    { k: "bizStrategy", ic: "target", c1: "#0b1a3a", c2: "#c2a35a", w: ["strategy", "executive", "c-suite", "ceo", "cfo", "cio", "decision", "business", "sme", "smb", "enterprise", "industry", "market"] },
  ],
  teen: [
    { k: "tGaming", ic: "gamepad", c1: "#7c3aed", c2: "#22d3ee", w: ["game", "games", "gaming", "gamer", "esports", "console", "play"] },
    { k: "tMusic", ic: "music", c1: "#db2777", c2: "#f59e0b", w: ["music", "song", "songs", "artist", "concert", "playlist", "audio"] },
    { k: "tSchool", ic: "cap", c1: "#2563eb", c2: "#a3e635", w: ["school", "study", "studies", "learning", "education", "exam", "exams", "class", "college", "homework"] },
    { k: "tSocial", ic: "camera", c1: "#f43f5e", c2: "#8b5cf6", w: ["social", "creator", "creators", "influencer", "video", "videos", "app", "apps", "online", "internet", "streaming"] },
    { k: "tSport", ic: "ball", c1: "#16a34a", c2: "#facc15", w: ["sport", "sports", "fitness", "football", "cricket", "basketball", "team"] },
    { k: "tStyle", ic: "shirt", c1: "#c026d3", c2: "#fb7185", w: ["style", "fashion", "clothes", "shoes", "sneakers", "beauty", "brand", "brands"] },
    { k: "tTech", ic: "phone", c1: "#0891b2", c2: "#a78bfa", w: ["tech", "phone", "phones", "gadget", "gadgets", "device", "devices", "ai"] },
    { k: "tFood", ic: "food", c1: "#ea580c", c2: "#facc15", w: ["food", "snack", "snacks", "drink", "drinks", "fast", "pizza"] },
  ],
};
const GENERAL = {
  consumer: { k: "general", ic: "star", c1: "#be185d", c2: "#f59e0b" },
  professional: { k: "bizGeneral", ic: "briefcase", c1: "#1e3a8a", c2: "#c2a35a" },
  teen: { k: "tGeneral", ic: "bolt", c1: "#6d28d9", c2: "#a3e635" },
};
const wordsOf = (s) => String(s || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
export function surveyTopic(survey, type = "consumer") {
  const set = SURVEY_TOPICS[type] || SURVEY_TOPICS.consumer;
  const words = new Set([...wordsOf(survey?.name), ...wordsOf(survey?.slug)]);
  return set.find((x) => x.w.some((w) => words.has(w))) || GENERAL[type] || GENERAL.consumer;
}

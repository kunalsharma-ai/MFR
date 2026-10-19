// One visual "world" per profile category: palette, background motif, 3D icon set,
// card shape and motion style. Add or tweak worlds here - components read only these tokens.
const svg = (s, w = 80, h = 80) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${s}</svg>`)}")`;

const MOTIFS = {
  stars: (c) => svg(`<g fill='${c}'><circle cx='10' cy='12' r='1.4'/><circle cx='52' cy='30' r='1'/><circle cx='30' cy='64' r='1.6'/><circle cx='70' cy='70' r='.9'/><path d='M62 8l1.5 3.5L67 13l-3.5 1.5L62 18l-1.5-3.5L57 13l3.5-1.5z'/></g>`),
  blueprint: (c) => svg(`<g stroke='${c}' fill='none'><path d='M0 .5h80M.5 0v80' stroke-width='1'/><path d='M0 40.5h80M40.5 0v80' stroke-width='.5'/></g>`),
  notebook: (c) => svg(`<g stroke='${c}' fill='none' stroke-width='1'><path d='M0 19.5h80M0 39.5h80M0 59.5h80M0 79.5h80'/><path d='M12 0v80' stroke-width='.6'/></g>`),
  chart: (c) => svg(`<g fill='none' stroke='${c}' stroke-width='1.4' stroke-linecap='round'><path d='M4 70l16-14 14 6 18-22 12 8 14-20'/></g><g fill='${c}'><circle cx='52' cy='40' r='2'/></g>`, 80, 80),
  blocks: (c) => svg(`<g fill='${c}'><rect x='8' y='10' width='14' height='14' rx='4'/><circle cx='58' cy='22' r='7'/><path d='M30 60l9-15 9 15z'/></g>`),
  house: (c) => svg(`<g fill='none' stroke='${c}' stroke-width='1.6' stroke-linejoin='round'><path d='M14 40l16-14 16 14v18H14z'/><path d='M26 58V46h8v12'/></g>`),
  paws: (c) => svg(`<g fill='${c}'><ellipse cx='30' cy='40' rx='8' ry='7'/><circle cx='20' cy='28' r='3.6'/><circle cx='28' cy='24' r='3.6'/><circle cx='36' cy='25' r='3.6'/><circle cx='42' cy='31' r='3.4'/></g>`),
  bags: (c) => svg(`<g fill='none' stroke='${c}' stroke-width='1.6' stroke-linejoin='round'><path d='M18 30h24l-3 26H21z'/><path d='M24 30c0-8 12-8 12 0'/></g>`),
  steam: (c) => svg(`<g fill='none' stroke='${c}' stroke-width='1.6' stroke-linecap='round'><path d='M24 54c-6-8 6-12 0-20M36 54c-6-8 6-12 0-20M48 54c-6-8 6-12 0-20'/></g>`),
  flight: (c) => svg(`<g fill='none' stroke='${c}' stroke-width='1.2' stroke-dasharray='3 5' stroke-linecap='round'><path d='M0 70C30 60 50 30 80 12'/></g>`, 80, 80),
  road: (c) => svg(`<g fill='${c}'><rect x='0' y='38' width='22' height='4' rx='2'/><rect x='40' y='38' width='22' height='4' rx='2'/></g>`, 80, 80),
  pulse: (c) => svg(`<g fill='none' stroke='${c}' stroke-width='1.6' stroke-linejoin='round'><path d='M0 40h22l5-12 7 26 6-20 4 6h36'/></g>`, 80, 80),
  bokeh: (c) => svg(`<g fill='${c}'><circle cx='16' cy='20' r='8' opacity='.6'/><circle cx='56' cy='54' r='12' opacity='.4'/><circle cx='64' cy='14' r='4'/></g>`),
  circuit: (c) => svg(`<g fill='none' stroke='${c}' stroke-width='1.2'><path d='M0 20h24l10 10h20l8-8h18M40 80V58l-10-10H0M80 60H62'/></g><g fill='${c}'><circle cx='24' cy='20' r='2.4'/><circle cx='54' cy='30' r='2.4'/><circle cx='30' cy='48' r='2.4'/><circle cx='62' cy='60' r='2.4'/></g>`),
  field: (c) => svg(`<g fill='none' stroke='${c}' stroke-width='1.2'><path d='M40 0v80'/><circle cx='40' cy='40' r='14'/></g>`),
  neon: (c) => svg(`<g fill='none' stroke='${c}' stroke-width='1'><path d='M0 .5h40M.5 0v40'/></g>`, 40, 40),
  molecule: (c) => svg(`<g stroke='${c}' stroke-width='1.2' fill='none'><path d='M20 24l18 10 16-12M38 34v18l-14 10'/></g><g fill='${c}'><circle cx='20' cy='24' r='3'/><circle cx='38' cy='34' r='3.6'/><circle cx='54' cy='22' r='2.6'/><circle cx='38' cy='52' r='2.6'/><circle cx='24' cy='62' r='3'/></g>`),
  film: (c) => svg(`<g fill='${c}'><rect x='4' y='4' width='8' height='6' rx='1.5'/><rect x='4' y='70' width='8' height='6' rx='1.5'/><rect x='24' y='4' width='8' height='6' rx='1.5'/><rect x='24' y='70' width='8' height='6' rx='1.5'/><rect x='44' y='4' width='8' height='6' rx='1.5'/><rect x='44' y='70' width='8' height='6' rx='1.5'/><rect x='64' y='4' width='8' height='6' rx='1.5'/><rect x='64' y='70' width='8' height='6' rx='1.5'/></g>`),
  sparkle: (c) => svg(`<g fill='${c}'><path d='M20 12l2 6 6 2-6 2-2 6-2-6-6-2 6-2z'/><path d='M58 48l1.5 4.5 4.5 1.5-4.5 1.5L58 60l-1.5-4.5L52 54l4.5-1.5z'/></g>`),
  diamonds: (c) => svg(`<g fill='none' stroke='${c}' stroke-width='1'><path d='M40 4l36 36-36 36L4 40z'/></g>`),
  rings: (c) => svg(`<g fill='none' stroke='${c}' stroke-width='1.2'><circle cx='40' cy='40' r='10'/><circle cx='40' cy='40' r='22' opacity='.6'/></g>`),
  dots: (c) => svg(`<g fill='${c}'><circle cx='10' cy='10' r='1.6'/><circle cx='50' cy='50' r='1.6'/></g>`, 60, 60),
  smoke: (c) => svg(`<g fill='none' stroke='${c}' stroke-width='1.4' stroke-linecap='round'><path d='M20 70c-8-10 10-14 2-26s8-16 4-26'/></g>`)
};

// c: [bg, bg2, surface, ink, muted, accent, accent2, accent3]
export const THEMES = {
  aurora:   { name: 'Aurora',    c: ['#f7f9ff', '#eef1ff', '#ffffff', '#0b1640', '#56608a', '#5b5bf0', '#ff7ab6', '#ffc35a'], motif: 'stars',     icons: ['basic', 'sparkles', 'star'],        card: 'glass', r: 26 },
  executive:{ name: 'Executive', c: ['#f4f6fb', '#e7ecf6', '#ffffff', '#0a1b3d', '#55617c', '#0b3d91', '#c89b3c', '#1e7bd8'], motif: 'blueprint', icons: ['professional', 'chart', 'trophy'],    card: 'paper', r: 14 },
  campus:   { name: 'Campus',    c: ['#fffaf0', '#fff1d6', '#ffffff', '#2a1a05', '#7a6243', '#ff7a1a', '#2f80ed', '#ffcd29'], motif: 'notebook',  icons: ['educational', 'brain', 'medal'],    card: 'note',  r: 20 },
  vault:    { name: 'Vault',     c: ['#f3faf7', '#e3f3ec', '#ffffff', '#062b22', '#4c6b62', '#0b7a5b', '#c9a227', '#14b88a'], motif: 'chart',     icons: ['banking', 'coin', 'chart'],         card: 'paper', r: 12 },
  playroom: { name: 'Playroom',  c: ['#fff7fb', '#ffeaf3', '#ffffff', '#3a1430', '#80587a', '#ff5fa2', '#41c9b4', '#ffc93c'], motif: 'blocks',    icons: ['parenting', 'heart', 'star'],       card: 'soft',  r: 30 },
  nest:     { name: 'Nest',      c: ['#fff8f3', '#fdebdc', '#ffffff', '#3a1d0e', '#7d5b46', '#d9623b', '#6a994e', '#f2b134'], motif: 'house',     icons: ['home', 'household', 'heart'],       card: 'soft',  r: 24 },
  paws:     { name: 'Paws',      c: ['#f2fbfb', '#dff5f4', '#ffffff', '#0b3135', '#4d7174', '#0aa5a5', '#ff8a3d', '#ffd166'], motif: 'paws',      icons: ['pet', 'heart', 'home'],             card: 'soft',  r: 28 },
  boutique: { name: 'Boutique',  c: ['#fff6fa', '#ffe6f1', '#ffffff', '#3b0a24', '#83536b', '#e0287d', '#7b2ff7', '#ffb547'], motif: 'bags',      icons: ['shopping', 'fashion', 'gift'],      card: 'ticket',r: 22 },
  noir:     { name: 'Noir Luxe', c: ['#f7f4ee', '#efe8da', '#fffdf8', '#16120a', '#6d6250', '#1b1712', '#b8913b', '#e6c77a'], motif: 'diamonds',  icons: ['luxury', 'crown', 'sparkles'],      card: 'luxe',  r: 6 },
  bistro:   { name: 'Bistro',    c: ['#fffaf2', '#ffeed7', '#ffffff', '#3b1406', '#7f5845', '#e2482d', '#f5a524', '#3f9b54'], motif: 'steam',     icons: ['food', 'lifestyle', 'delivery'],    card: 'soft',  r: 24 },
  voyage:   { name: 'Voyage',    c: ['#f2f9ff', '#dff0ff', '#ffffff', '#062849', '#4a6a88', '#0b84d8', '#ff8a5b', '#1fc7b6'], motif: 'flight',    icons: ['travel', 'tourism', 'globe'],       card: 'ticket',r: 20 },
  motor:    { name: 'Motor',     c: ['#f5f5f7', '#e8e8ee', '#ffffff', '#141418', '#5f6070', '#e11d2e', '#202330', '#ffb800'], motif: 'road',      icons: ['automobile', 'mobility', 'fire'],   card: 'clip',  r: 10 },
  care:     { name: 'Care',      c: ['#f2fbfa', '#e0f5f2', '#ffffff', '#08302c', '#4b6f6a', '#0e9f8e', '#3d7bfd', '#7bd389'], motif: 'pulse',     icons: ['health', 'wellness', 'heart'],      card: 'glass', r: 22 },
  glow:     { name: 'Glow',      c: ['#fff7f5', '#fde8e3', '#ffffff', '#3d1a17', '#86605b', '#d9577a', '#c68b59', '#ffb3c1'], motif: 'bokeh',     icons: ['beauty', 'personal-care', 'sparkles'], card: 'glass', r: 30 },
  circuit:  { name: 'Circuit',   c: ['#f3f7ff', '#e3ebff', '#ffffff', '#081a3a', '#4f6086', '#2563eb', '#06b6d4', '#a855f7'], motif: 'circuit',   icons: ['tech', 'digital', 'electronics'],   card: 'clip',  r: 12 },
  arena:    { name: 'Arena',     c: ['#f5fbef', '#e6f6d8', '#ffffff', '#11250a', '#53704a', '#2f9e44', '#ff6b2c', '#c6f432'], motif: 'field',     icons: ['sports', 'fitness', 'medal'],       card: 'clip',  r: 16 },
  neon:     { name: 'Neon',      dark: true, c: ['#0b0820', '#160f3a', '#140f33', '#f2efff', '#a69ccc', '#ff2bd6', '#2bf0ff', '#b6ff3b'], motif: 'neon', icons: ['game', 'esports', 'trophy'], card: 'neon', r: 8 },
  lab:      { name: 'Lab',       c: ['#f6f5ff', '#e9e6ff', '#ffffff', '#16123d', '#5b5785', '#5b3fd6', '#f59e0b', '#06b6d4'], motif: 'molecule',  icons: ['research', 'rewards', 'brain'],     card: 'glass', r: 18 },
  studio:   { name: 'Studio',    c: ['#fbf5ff', '#f1e4ff', '#ffffff', '#24093d', '#6c5482', '#9b2cf0', '#ff3d6e', '#ffc23d'], motif: 'film',      icons: ['media', 'star', 'sparkles'],        card: 'ticket',r: 18 },
  creator:  { name: 'Creator',   c: ['#fff6f8', '#ffe8ee', '#ffffff', '#33091c', '#7d5568', '#f43f5e', '#8b5cf6', '#f59e0b'], motif: 'sparkle',   icons: ['creator', 'fire', 'heart'],         card: 'glass', r: 26 },
  lounge:   { name: 'Lounge',    c: ['#fbf6f3', '#f3e6de', '#fffdfb', '#2e0f12', '#755a55', '#8c1c2f', '#c98b2f', '#5a3e8a'], motif: 'smoke',     icons: ['tobacco', 'sparkles', 'crown'],     card: 'luxe',  r: 10 },
  atlas:    { name: 'Atlas',     c: ['#f6f7f9', '#eaedf2', '#ffffff', '#151b26', '#5d6676', '#475569', '#d88632', '#0ea5e9'], motif: 'dots',      icons: ['additional', 'globe', 'check'],     card: 'paper', r: 16 }
};

const MAP = {
  basic: 'aurora', professional: 'executive', educational: 'campus', financial: 'vault', 'banking-financial-services': 'vault',
  parenting: 'playroom', 'home-pet': 'nest', 'home-household': 'nest', 'household-services': 'nest', 'pets-animal-care': 'paws',
  shopping: 'boutique', 'fashion-apparel': 'boutique', 'luxury-premium': 'noir', 'lifestyle-food': 'bistro', 'food-beverages': 'bistro',
  'restaurants-food-delivery': 'bistro', travel: 'voyage', 'travel-tourism': 'voyage', automobile: 'motor', 'automotive-mobility': 'motor',
  health: 'care', 'health-wellness': 'care', beauty: 'glow', 'beauty-personal-care': 'glow', tech: 'circuit', 'consumer-electronics': 'circuit',
  'technology-digital-services': 'circuit', sports: 'arena', 'sports-physical-fitness': 'arena', game: 'neon', 'gaming-esports': 'neon',
  mr: 'lab', 'research-panel': 'lab', 'entertainment-media': 'studio', 'content-creator-social-influence1': 'creator',
  'tobacco-nicotine-alcoholic': 'lounge', additional: 'atlas'
};

// Main 3D icon per profile (so worlds that share a theme still look different)
const ICON = {
  basic: 'basic', professional: 'professional', educational: 'educational', financial: 'financial', 'banking-financial-services': 'banking',
  parenting: 'parenting', 'home-pet': 'home', 'home-household': 'household', 'household-services': 'services', 'pets-animal-care': 'pet',
  shopping: 'shopping', 'fashion-apparel': 'fashion', 'luxury-premium': 'luxury', 'lifestyle-food': 'lifestyle', 'food-beverages': 'food',
  'restaurants-food-delivery': 'delivery', travel: 'travel', 'travel-tourism': 'tourism', automobile: 'automobile', 'automotive-mobility': 'mobility',
  health: 'health', 'health-wellness': 'wellness', beauty: 'beauty', 'beauty-personal-care': 'personal-care', tech: 'tech',
  'consumer-electronics': 'electronics', 'technology-digital-services': 'digital', sports: 'sports', 'sports-physical-fitness': 'fitness',
  game: 'game', 'gaming-esports': 'esports', mr: 'rewards', 'research-panel': 'research', 'entertainment-media': 'media',
  'content-creator-social-influence1': 'creator', 'tobacco-nicotine-alcoholic': 'tobacco', additional: 'additional'
};

export function themeFor(slug) {
  const id = MAP[slug] || 'aurora';
  const th = THEMES[id];
  return { id, ...th, icon: ICON[slug] || th.icons[0] };
}

/** CSS custom properties for a theme (light or dark UI). */
export function themeVars(th, darkUI) {
  const [bg, bg2, surface, ink, muted, a1, a2, a3] = th.c;
  const dark = th.dark || darkUI;
  const v = {
    '--w-bg': dark && !th.dark ? '#0b1022' : bg,
    '--w-bg2': dark && !th.dark ? '#121a36' : bg2,
    '--w-surface': dark && !th.dark ? '#121a33' : surface,
    '--w-ink': dark && !th.dark ? '#eef1fb' : ink,
    '--w-muted': dark && !th.dark ? '#9aa5c4' : muted,
    '--w-a1': a1 === '#1b1712' && dark ? '#e6c77a' : a1,
    '--w-a2': a2,
    '--w-a3': a3,
    '--w-r': th.r + 'px',
    '--w-motif': MOTIFS[th.motif](encodeColor(dark ? a2 : a1, dark ? 0.22 : 0.16))
  };
  return v;
}
function encodeColor(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

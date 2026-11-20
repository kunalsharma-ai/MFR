// Blog covers: text-free, animated SVG scenes, one per post (no two share the same picture + colours).
// Each cover is a centre motif that says what the post is about (phone, shield, clock, wallet…) on a gradient
// with soft light, floating coins and sparkles. Plain functions returning SVG markup, so the same art renders in
// the page (components/BlogCover.jsx, animated) and in scripts/blog-covers.mjs (still 1200×675 .webp files used
// for link previews and search results). Motion lives in styles/v30-blogcover.css: transform / opacity only.

const PALETTES = [
  { a: '#FF8A00', b: '#FF3B8D', c: '#FFD166', d: '#7B2CBF', bg1: '#FFF1E0', bg2: '#FFD9E8' }, // sunrise
  { a: '#2F6BFF', b: '#22D3EE', c: '#FFC233', d: '#0B1E5B', bg1: '#E6F0FF', bg2: '#D9FBFF' }, // ocean
  { a: '#8B5CF6', b: '#EC4899', c: '#FDE68A', d: '#3B0764', bg1: '#F1E9FF', bg2: '#FFE4F3' }, // grape
  { a: '#10B981', b: '#14C9B5', c: '#FCD34D', d: '#064E3B', bg1: '#E3FBF1', bg2: '#E0FFFB' }, // mint
  { a: '#F43F5E', b: '#FB923C', c: '#FEF08A', d: '#4C0519', bg1: '#FFE6EA', bg2: '#FFF0DE' }, // coral
  { a: '#0EA5E9', b: '#8B5CF6', c: '#FBBF24', d: '#082F49', bg1: '#E2F4FF', bg2: '#EEE8FF' }, // sky
  { a: '#E9B949', b: '#0FB37A', c: '#FFF3C4', d: '#053D2F', bg1: '#FFF7DD', bg2: '#E1F8EE' }, // emerald gold
  { a: '#6366F1', b: '#06B6D4', c: '#F472B6', d: '#1E1B4B', bg1: '#ECEDFF', bg2: '#DDF8FD' }, // indigo
  { a: '#FF5E7E', b: '#8B5CF6', c: '#FFC233', d: '#3A0A2A', bg1: '#FFE6EC', bg2: '#EFE6FF' }, // berry
  { a: '#F59E0B', b: '#EF4444', c: '#FDE68A', d: '#451A03', bg1: '#FFF4D6', bg2: '#FFE2E2' }, // amber
  { a: '#14B8A6', b: '#3B82F6', c: '#FDBA74', d: '#042F2E', bg1: '#DDFAF5', bg2: '#E3EEFF' }, // lagoon
  { a: '#D946EF', b: '#F97316', c: '#FDE047', d: '#4A044E', bg1: '#FBE8FF', bg2: '#FFEDD9' }, // neon
];

// slug → [motif, palette]. Posts on the same theme share a motif but never the same colours.
const PICK = {
  'easy-ways-to-make-money-online': ['bulb', 0],
  'paid-surveys-for-cash-guide': ['wallet', 1],
  'side-hustle-from-home-ideas': ['house', 2],
  'side-income-ideas-without-investment': ['bulb', 3],
  'extra-income-from-home-ideas': ['house', 4],
  'online-earning-for-students-without-investment': ['cap', 5],
  'online-earning-for-homemakers': ['house', 6],
  'online-earning-for-retirees': ['clock', 7],
  'generate-money-online-free-spare-time': ['clock', 8],
  'earn-money-online-on-mobile': ['phone', 9],
  'money-earning-app-vs-website': ['phone', 10],
  'data-privacy-in-paid-surveys': ['shield', 1],
  'legit-survey-sites-spot-scams': ['shield', 4],
  'online-earning-platform-checklist': ['checklist', 3],
  'survey-and-earn-money-process': ['checklist', 0],
  'survey-profile-tips-to-qualify-more': ['checklist', 8],
  'paid-surveys-for-business-professionals': ['chart', 6],
  'highest-paying-survey-sites-guide': ['chart', 11],
  'paid-online-focus-groups-research': ['chat', 5],
  'why-companies-pay-for-your-opinion': ['chat', 9],
  'earn-money-online-cash-payouts': ['wallet', 3],
  'survey-rewards-paypal-upi-gift-cards': ['gift', 2],
  'earn-rupees-online-without-investment': ['wallet', 9],
  'earn-dollars-online-without-investment': ['wallet', 7],
  'surveys-that-pay-instantly-truth': ['bolt', 10],
  'make-quick-money-online-truth': ['bolt', 4],
  'money-making-online-myths-facts': ['bulb', 11],
  'earn-money-online-free-guide': ['globe', 0],
  'earn-money-online-without-investment': ['globe', 2],
  'how-to-earn-money-online-with-surveys': ['rocket', 1],
  'online-jobs-without-investment-guide': ['rocket', 8],
  'make-money-online-from-home': ['house', 10],
  'paid-surveys-for-teens-guide': ['rocket', 11],
  'parental-consent-online-surveys': ['shield', 2],
  'teen-online-safety-checklist': ['checklist', 10],
  'why-brands-want-gen-z-opinions': ['chat', 11],
  'teen-money-skills-first-rewards': ['wallet', 8],
  'gaming-surveys-for-teens': ['bolt', 5],
  'teen-screen-time-digital-wellbeing': ['clock', 3],
  'teen-privacy-data-rights-explained': ['shield', 7],
  'balance-school-and-online-surveys': ['cap', 9],
  'turning-18-teen-to-adult-account': ['gift', 10],
  'ai-in-market-research-2026': ['bulb', 7],
  'synthetic-data-vs-real-opinions': ['chart', 2],
  'zero-party-data-explained': ['shield', 9],
  'mobile-first-survey-trends': ['phone', 3],
  'music-streaming-surveys-for-teens': ['chat', 2],
  'sustainability-surveys-green-consumers': ['globe', 3],
  'quick-commerce-shopping-habits': ['bolt', 6],
  'creator-economy-consumer-opinions': ['rocket', 4],
  'voice-and-video-surveys-future': ['chat', 0],
  'digital-payments-upi-trends-surveys': ['wallet', 10],
};
const MOTIFS = ['bulb', 'wallet', 'house', 'cap', 'clock', 'phone', 'shield', 'checklist', 'chart', 'chat', 'gift', 'bolt', 'globe', 'rocket'];

const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed) => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

export function coverPick(slug) {
  const p = PICK[slug];
  if (p) return { motif: p[0], pal: PALETTES[p[1]] };
  const h = hash(slug);
  return { motif: MOTIFS[h % MOTIFS.length], pal: PALETTES[(h >>> 5) % PALETTES.length] };
}

let U = 'x'; // id suffix of the cover being drawn (unique per instance on a page)
const d = (s) => `style="animation-delay:${s}s"`;
const coin = (x, y, r, cls, delay, p) => `<g transform="translate(${x} ${y})"><g class="bc-a ${cls}" ${d(delay)}><circle r="${r}" fill="url(#gold-${U})"/><circle r="${r * 0.72}" fill="none" stroke="#fff6c9" stroke-width="${r * 0.12}" opacity=".85"/><path d="M0 ${-r * 0.42} L${r * 0.12} ${-r * 0.12} L${r * 0.42} ${-r * 0.1} L${r * 0.18} ${r * 0.1} L${r * 0.26} ${r * 0.42} L0 ${r * 0.24} L${-r * 0.26} ${r * 0.42} L${-r * 0.18} ${r * 0.1} L${-r * 0.42} ${-r * 0.1} L${-r * 0.12} ${-r * 0.12}Z" fill="${p.d}" opacity=".35"/></g></g>`;
const spark = (x, y, s, fill, delay) => `<g transform="translate(${x} ${y}) scale(${s})"><path class="bc-a bc-twinkle" ${d(delay)} d="M0-10 C1.5-2 2-1.5 10 0 C2 1.5 1.5 2 0 10 C-1.5 2-2 1.5-10 0 C-2-1.5-1.5-2 0-10Z" fill="${fill}"/></g>`;

const MOTIF = {
  phone: (p) => `
    <g transform="translate(320 186)">
      <g class="bc-a bc-float-s">
        <rect x="-66" y="-122" width="132" height="244" rx="24" fill="${p.d}"/>
        <rect x="-56" y="-108" width="112" height="216" rx="16" fill="#fff"/>
        <rect x="-20" y="-102" width="40" height="8" rx="4" fill="${p.d}" opacity=".9"/>
        <rect x="-44" y="-78" width="88" height="38" rx="10" fill="${p.a}"/>
        <rect x="-34" y="-66" width="40" height="7" rx="3.5" fill="#fff" opacity=".9"/><rect x="-34" y="-54" width="24" height="6" rx="3" fill="#fff" opacity=".6"/>
        <g class="bc-a bc-slide" ${d(-0.2)}><rect x="-44" y="-28" width="88" height="26" rx="8" fill="${p.bg1}"/><circle cx="-30" cy="-15" r="6" fill="${p.b}"/><rect x="-18" y="-18" width="44" height="6" rx="3" fill="${p.d}" opacity=".35"/></g>
        <g class="bc-a bc-slide" ${d(-1.1)}><rect x="-44" y="6" width="88" height="26" rx="8" fill="${p.bg1}"/><circle cx="-30" cy="19" r="6" fill="${p.c}"/><rect x="-18" y="16" width="36" height="6" rx="3" fill="${p.d}" opacity=".35"/></g>
        <g class="bc-a bc-slide" ${d(-2)}><rect x="-44" y="40" width="88" height="26" rx="8" fill="${p.bg1}"/><circle cx="-30" cy="53" r="6" fill="${p.a}"/><rect x="-18" y="50" width="48" height="6" rx="3" fill="${p.d}" opacity=".35"/></g>
        <rect x="-34" y="78" width="68" height="18" rx="9" fill="${p.b}"/>
      </g>
      <g transform="translate(78 -86)"><g class="bc-a bc-pop"><circle r="22" fill="${p.b}"/><path d="M-8 0h16M0-8v16" stroke="#fff" stroke-width="5" stroke-linecap="round"/></g></g>
    </g>`,
  shield: (p) => `
    <g transform="translate(320 180)">
      <circle class="bc-a bc-ring" r="96" fill="none" stroke="${p.b}" stroke-width="4"/>
      <circle class="bc-a bc-ring" ${d(-1.3)} r="96" fill="none" stroke="${p.a}" stroke-width="3"/>
      <g class="bc-a bc-float-s">
        <path d="M0-112 L92-78 V-6 C92 56 50 96 0 116 C-50 96-92 56-92-6 V-78Z" fill="${p.a}"/>
        <path d="M0-92 L74-64 V-6 C74 44 40 78 0 94 C-40 78-74 44-74-6 V-64Z" fill="${p.b}" opacity=".9"/>
        <path d="M0-92 L74-64 V-6 C74 44 40 78 0 94Z" fill="#fff" opacity=".14"/>
        <path class="bc-a bc-draw" d="M-34 4 L-8 30 L40-26" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <g transform="translate(104 62)"><g class="bc-a bc-bob" ${d(-0.8)}><rect x="-24" y="-12" width="48" height="40" rx="9" fill="${p.d}"/><path d="M-14-12 v-10 a14 14 0 0 1 28 0 v10" fill="none" stroke="${p.d}" stroke-width="7"/><circle cy="6" r="5" fill="${p.c}"/></g></g>
    </g>`,
  clock: (p) => `
    <g transform="translate(320 180)">
      <circle r="118" fill="${p.a}" opacity=".18"/>
      <circle r="100" fill="#fff"/>
      <circle r="100" fill="none" stroke="${p.a}" stroke-width="12"/>
      <path d="M0-100 A100 100 0 0 1 100 0" fill="none" stroke="${p.b}" stroke-width="12" stroke-linecap="round"/>
      ${Array.from({ length: 12 }, (_, i) => `<rect x="-3" y="-86" width="6" height="${i % 3 ? 10 : 18}" rx="3" fill="${p.d}" opacity="${i % 3 ? 0.3 : 0.7}" transform="rotate(${i * 30})"/>`).join('')}
      <g class="bc-a bc-clock-h"><rect x="-5" y="-50" width="10" height="56" rx="5" fill="${p.d}"/></g>
      <g class="bc-a bc-spin"><rect x="-3.5" y="-74" width="7" height="80" rx="3.5" fill="${p.a}"/></g>
      <circle r="10" fill="${p.b}"/>
      <g transform="translate(-118 -70)"><g class="bc-a bc-bob" ${d(-0.5)}><rect x="-34" y="-30" width="68" height="62" rx="12" fill="#fff"/><rect x="-34" y="-30" width="68" height="18" rx="9" fill="${p.b}"/><rect x="-18" y="-4" width="36" height="22" rx="5" fill="${p.d}" opacity=".18"/></g></g>
    </g>`,
  chart: (p) => `
    <g transform="translate(320 186)">
      <g class="bc-a bc-float-s">
        <rect x="-150" y="-104" width="300" height="196" rx="18" fill="${p.d}"/>
        <rect x="-138" y="-92" width="276" height="172" rx="10" fill="#fff"/>
        ${[40, 70, 52, 96, 120].map((h, i) => `<rect class="bc-a bc-grow" ${d(-i * 0.35)} x="${-110 + i * 48}" y="${66 - h}" width="30" height="${h}" rx="6" fill="${i % 2 ? p.a : p.b}"/>`).join('')}
        <path d="M-96 20 L-48 -6 L0 6 L48 -40 L96 -66" fill="none" stroke="${p.c}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <circle class="bc-a bc-pulse" cx="96" cy="-66" r="9" fill="${p.c}"/>
        <rect x="-30" y="92" width="60" height="18" rx="4" fill="${p.d}"/><rect x="-70" y="108" width="140" height="10" rx="5" fill="${p.d}" opacity=".7"/>
      </g>
      <g transform="translate(-150 -96)"><g class="bc-a bc-bob" ${d(-1.2)}><rect x="-40" y="-26" width="80" height="52" rx="14" fill="#fff"/><circle cx="-16" cy="0" r="12" fill="${p.a}"/><rect x="2" y="-8" width="26" height="6" rx="3" fill="${p.d}" opacity=".4"/><rect x="2" y="4" width="18" height="6" rx="3" fill="${p.d}" opacity=".25"/></g></g>
    </g>`,
  wallet: (p) => `
    <g transform="translate(320 196)">
      ${[-34, 0, 34].map((x, i) => `<g transform="translate(${x} -110)"><g class="bc-a bc-drop" ${d(-i * 0.7)}><circle r="20" fill="url(#gold-${U})"/><circle r="14" fill="none" stroke="#fff6c9" stroke-width="2.6"/></g></g>`).join('')}
      <g class="bc-a bc-float-s">
        <rect x="-130" y="-70" width="260" height="160" rx="26" fill="${p.a}"/>
        <rect x="-130" y="-70" width="260" height="46" rx="23" fill="${p.d}" opacity=".25"/>
        <path d="M-130 -30 H130 V64 a26 26 0 0 1 -26 26 H-104 a26 26 0 0 1 -26 -26Z" fill="${p.b}"/>
        <rect x="50" y="0" width="96" height="56" rx="18" fill="${p.d}"/>
        <circle cx="86" cy="28" r="12" fill="${p.c}"/>
        <path d="M-130 -30 H130" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>
      </g>
    </g>`,
  house: (p) => `
    <g transform="translate(320 196)">
      <g class="bc-a bc-float-s">
        <path d="M-130-14 L0-124 L130-14Z" fill="${p.a}"/>
        <rect x="80" y="-110" width="26" height="54" rx="4" fill="${p.d}" opacity=".8"/>
        <rect x="-108" y="-20" width="216" height="128" rx="10" fill="#fff"/>
        <rect x="-26" y="34" width="52" height="74" rx="8" fill="${p.b}"/><circle cx="14" cy="72" r="4" fill="${p.c}"/>
        <rect class="bc-a bc-glow" x="-90" y="6" width="44" height="40" rx="6" fill="${p.c}"/>
        <rect class="bc-a bc-glow" ${d(-1.4)} x="46" y="6" width="44" height="40" rx="6" fill="${p.c}"/>
        <path d="M-68 6v40M-90 26h44M68 6v40M46 26h44" stroke="#fff" stroke-width="3"/>
      </g>
      <g transform="translate(0 -84)"><g class="bc-a bc-pulse"><path d="M0 14 C-26-6-14-30 0-18 C14-30 26-6 0 14Z" fill="${p.b}"/></g></g>
    </g>`,
  cap: (p) => `
    <g transform="translate(320 176)">
      <g transform="translate(0 70)"><rect x="-110" y="0" width="220" height="30" rx="8" fill="${p.b}"/><rect x="-96" y="-28" width="196" height="30" rx="8" fill="${p.a}"/><rect x="-104" y="30" width="208" height="28" rx="8" fill="${p.d}" opacity=".85"/><path d="M-84-14h150M-90 15h160M-90 44h170" stroke="#fff" stroke-opacity=".5" stroke-width="3"/></g>
      <g class="bc-a bc-float-s">
        <path d="M0-120 L140-70 L0-20 L-140-70Z" fill="${p.d}"/>
        <path d="M-80-48 V0 C-80 22 80 22 80 0 V-48 L0-20Z" fill="${p.d}" opacity=".85"/>
        <circle cy="-70" r="8" fill="${p.c}"/>
        <g transform="translate(0 -70)"><g class="bc-a bc-swing"><path d="M0 0 L108 34 V86" fill="none" stroke="${p.c}" stroke-width="5"/><rect x="100" y="84" width="16" height="26" rx="5" fill="${p.c}"/></g></g>
      </g>
    </g>`,
  checklist: (p) => `
    <g transform="translate(320 184)">
      <g class="bc-a bc-float-s">
        <rect x="-104" y="-130" width="208" height="262" rx="20" fill="${p.a}"/>
        <rect x="-90" y="-112" width="180" height="230" rx="12" fill="#fff"/>
        <rect x="-40" y="-142" width="80" height="34" rx="12" fill="${p.d}"/>
        ${[0, 1, 2, 3].map((i) => `<rect x="-70" y="${-84 + i * 50}" width="30" height="30" rx="8" fill="${p.bg1}" stroke="${p.b}" stroke-width="3"/><rect x="-26" y="${-74 + i * 50}" width="${92 - (i % 2) * 24}" height="10" rx="5" fill="${p.d}" opacity=".25"/><path class="bc-a bc-tick" ${d(-i * 0.6)} d="M-63 ${-70 + i * 50} l7 7 l13 -14" fill="none" stroke="${p.b}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
      </g>
      <g transform="translate(112 40)"><g class="bc-a bc-write"><rect x="-8" y="-70" width="16" height="96" rx="5" fill="${p.c}" transform="rotate(28)"/><path d="M8 24 L0 42 L-8 24Z" fill="${p.d}" transform="rotate(28)"/></g></g>
    </g>`,
  chat: (p) => `
    <g transform="translate(320 180)">
      <g transform="translate(-60 -40)"><g class="bc-a bc-bob">
        <path d="M-110-56 h190 a26 26 0 0 1 26 26 v70 a26 26 0 0 1 -26 26 h-140 l-36 30 v-30 h-14 a26 26 0 0 1 -26 -26 v-70 a26 26 0 0 1 26 -26Z" fill="${p.a}"/>
        <rect x="-86" y="-30" width="140" height="12" rx="6" fill="#fff" opacity=".9"/><rect x="-86" y="-6" width="100" height="12" rx="6" fill="#fff" opacity=".6"/>
      </g></g>
      <g transform="translate(78 64)"><g class="bc-a bc-bob" ${d(-1.5)}>
        <path d="M-96-44 h170 a24 24 0 0 1 24 24 v52 a24 24 0 0 1 -24 24 h-10 v28 l-32 -28 h-128 a24 24 0 0 1 -24 -24 v-52 a24 24 0 0 1 24 -24Z" fill="${p.d}"/>
        <circle class="bc-a bc-dot" cx="-40" cy="6" r="10" fill="${p.c}"/><circle class="bc-a bc-dot" ${d(-0.9)} cx="-6" cy="6" r="10" fill="${p.c}"/><circle class="bc-a bc-dot" ${d(-0.6)} cx="28" cy="6" r="10" fill="${p.c}"/>
      </g></g>
    </g>`,
  bulb: (p) => `
    <g transform="translate(320 168)">
      <g class="bc-a bc-spin-slow">${Array.from({ length: 12 }, (_, i) => `<rect x="-4" y="-150" width="8" height="30" rx="4" fill="${i % 2 ? p.a : p.b}" opacity=".7" transform="rotate(${i * 30})"/>`).join('')}</g>
      <circle class="bc-a bc-glow" r="104" fill="${p.c}" opacity=".5"/>
      <g class="bc-a bc-float-s">
        <path d="M0-96 C54-96 84-54 78-14 C74 14 52 30 46 52 H-46 C-52 30-74 14-78-14 C-84-54-54-96 0-96Z" fill="${p.c}"/>
        <path d="M-30-60 C-50-46-56-24-50-4" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".8"/>
        <path d="M-20 52 V10 L0 30 L20 10 V52" fill="none" stroke="${p.a}" stroke-width="6" stroke-linejoin="round"/>
        <rect x="-46" y="52" width="92" height="20" rx="8" fill="${p.d}"/><rect x="-40" y="76" width="80" height="18" rx="8" fill="${p.d}" opacity=".85"/><rect x="-24" y="98" width="48" height="14" rx="7" fill="${p.d}" opacity=".7"/>
      </g>
    </g>`,
  gift: (p) => `
    <g transform="translate(320 196)">
      <rect x="-110" y="-40" width="220" height="140" rx="16" fill="${p.a}"/>
      <rect x="-20" y="-40" width="40" height="140" fill="${p.c}"/>
      <rect x="-110" y="-40" width="220" height="30" fill="${p.d}" opacity=".15"/>
      <g class="bc-a bc-lid">
        <rect x="-124" y="-84" width="248" height="46" rx="12" fill="${p.b}"/><rect x="-20" y="-84" width="40" height="46" fill="${p.c}"/>
        <path d="M0-84 C-30-130-86-116-60-92 C-46-80-20-84 0-84Z M0-84 C30-130 86-116 60-92 C46-80 20-84 0-84Z" fill="${p.c}"/>
      </g>
    </g>`,
  bolt: (p) => `
    <g transform="translate(320 180)">
      <circle class="bc-a bc-ring" r="100" fill="none" stroke="${p.a}" stroke-width="5"/>
      <circle r="100" fill="${p.d}"/>
      <circle r="84" fill="${p.a}" opacity=".35"/>
      <g class="bc-a bc-flash"><path d="M14-104 L-58 12 H-6 L-20 104 L58-18 H6Z" fill="${p.c}" stroke="#fff" stroke-width="5" stroke-linejoin="round"/></g>
    </g>`,
  globe: (p) => `
    <g transform="translate(320 180)">
      <circle r="104" fill="${p.a}"/>
      <path d="M-60-70 C-30-80-10-60-30-40 C-50-20-20 0-40 20 C-60 34-86 10-92-10 C-90-40-80-60-60-70Z M30-90 C60-84 84-60 96-30 C80-34 60-20 50 0 C40 20 20 10 20-14 C20-40 6-60 30-90Z M10 40 C34 34 56 46 52 70 C46 90 20 100 4 96 C-6 76-8 50 10 40Z" fill="${p.b}" opacity=".9"/>
      <ellipse rx="104" ry="36" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>
      <ellipse rx="40" ry="104" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>
      <ellipse rx="150" ry="52" fill="none" stroke="${p.d}" stroke-opacity=".3" stroke-width="3" transform="rotate(-18)"/>
      <g transform="rotate(-18)"><g class="bc-a bc-orbit-x"><g class="bc-a bc-orbit-y"><circle r="20" fill="url(#gold-${U})"/><circle r="14" fill="none" stroke="#fff6c9" stroke-width="2.6"/></g></g></g>
    </g>`,
  rocket: (p) => `
    <g transform="translate(320 190) rotate(35)">
      <g class="bc-a bc-float-s">
        <g transform="translate(0 92)"><path class="bc-a bc-flame" d="M-26 0 C-26 40 0 70 0 70 C0 70 26 40 26 0Z" fill="${p.c}"/><path class="bc-a bc-flame" ${d(-0.15)} d="M-12 0 C-12 22 0 40 0 40 C0 40 12 22 12 0Z" fill="#fff"/></g>
        <path d="M0-130 C46-96 50-20 40 92 H-40 C-50-20-46-96 0-130Z" fill="#fff"/>
        <path d="M0-130 C22-114 34-90 40-60 H-40 C-34-90-22-114 0-130Z" fill="${p.a}"/>
        <circle cy="-20" r="24" fill="${p.d}"/><circle cy="-20" r="15" fill="${p.b}"/>
        <path d="M-40 30 L-80 92 H-40Z M40 30 L80 92 H40Z" fill="${p.a}"/>
        <rect x="-40" y="80" width="80" height="16" rx="6" fill="${p.d}"/>
      </g>
    </g>`,
};

/** SVG markup for a post's cover (viewBox 640 × 360). */
export function coverSvg(slug, uid = slug) {
  const { motif, pal: p } = coverPick(slug);
  U = uid;
  const r = rng(hash(slug));
  const coins = [
    [70 + r() * 90, 70 + r() * 70, 20 + r() * 8],
    [500 + r() * 90, 60 + r() * 60, 16 + r() * 8],
    [480 + r() * 110, 260 + r() * 50, 22 + r() * 8],
    [60 + r() * 100, 250 + r() * 60, 14 + r() * 6],
  ];
  const sparks = Array.from({ length: 5 }, () => [30 + r() * 580, 24 + r() * 312, 0.6 + r() * 0.9]);
  const dots = Array.from({ length: 7 }, () => [r() * 640, r() * 360, 3 + r() * 5]);
  const pattern = hash(slug) % 3;
  return `<svg viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="bg-${U}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.bg1}"/><stop offset="1" stop-color="${p.bg2}"/></linearGradient>
    <radialGradient id="glow-${U}"><stop offset="0" stop-color="${p.a}" stop-opacity=".45"/><stop offset="1" stop-color="${p.a}" stop-opacity="0"/></radialGradient>
    <radialGradient id="glow2-${U}"><stop offset="0" stop-color="${p.b}" stop-opacity=".4"/><stop offset="1" stop-color="${p.b}" stop-opacity="0"/></radialGradient>
    <radialGradient id="gold-${U}" cx=".35" cy=".3"><stop offset="0" stop-color="#FFF6C9"/><stop offset=".45" stop-color="#FFC233"/><stop offset="1" stop-color="#D98A00"/></radialGradient>
    <pattern id="pt-${U}" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="${p.d}" opacity=".12"/></pattern>
  </defs>
  <rect width="640" height="360" fill="url(#bg-${U})"/>
  ${pattern === 0 ? `<rect width="640" height="360" fill="url(#pt-${U})"/>` : ''}
  ${pattern === 1 ? `<g opacity=".18">${Array.from({ length: 18 }, (_, i) => `<rect x="-3" y="-420" width="6" height="420" fill="${i % 2 ? p.a : p.b}" transform="translate(320 200) rotate(${i * 20})"/>`).join('')}</g>` : ''}
  ${pattern === 2 ? `<path d="M0 290 C120 250 220 330 340 296 C460 262 540 300 640 272 V360 H0Z" fill="${p.a}" opacity=".16"/><path d="M0 318 C140 286 260 350 380 320 C500 292 560 330 640 306 V360 H0Z" fill="${p.b}" opacity=".16"/>` : ''}
  <g class="bc-a bc-drift"><circle cx="150" cy="110" r="150" fill="url(#glow-${U})"/></g>
  <g class="bc-a bc-drift" ${d(-4)}><circle cx="510" cy="260" r="160" fill="url(#glow2-${U})"/></g>
  ${dots.map(([x, y, s], i) => `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${s.toFixed(1)}" fill="${i % 2 ? p.a : p.b}" opacity=".35"/>`).join('')}
  ${MOTIF[motif](p)}
  ${coins.map(([x, y, s], i) => coin(x.toFixed(0), y.toFixed(0), +s.toFixed(1), i % 2 ? 'bc-float' : 'bc-float-b', -(i * 0.9 + r()).toFixed(2), p)).join('')}
  ${sparks.map(([x, y, s], i) => spark(x.toFixed(0), y.toFixed(0), +s.toFixed(2), i % 2 ? '#fff' : p.c, -(i * 0.7).toFixed(2))).join('')}
</svg>`;
}

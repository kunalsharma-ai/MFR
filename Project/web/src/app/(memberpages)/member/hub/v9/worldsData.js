// Round 9 (Kunal, 24 Nov 2026): the "world" look of Kunal's minor profile suite (mfr-minor-suite v2.0.0, src/themes/worlds.js),
// carried into the member hub. Each world has its own sky, accents, card ink, card shape and rendered 3D art
// (public/hub/worlds/<art>.webp, from the suite's dist/art). Generated from the suite's tokens; stickers are 3D emoji
// from public/hub/3d. Profile and survey cards of every member type pick a world by their topic (worldFor below).
export const WORLDS = {
 "trust": {
  "name": "Dawn watch",
  "dark": true,
  "sky": [
   "#070b2e",
   "#13207a",
   "#4b2aa8",
   "#ff8a3d"
  ],
  "grade": "saturate(1.08) contrast(1.04)",
  "a1": "#ffa21a",
  "a2": "#ff6a3d",
  "a3": "#8f8cff",
  "card": [
   "#fffdf8",
   "#1a1640",
   "#6b6790"
  ],
  "shape": "soft",
  "art": "trust",
  "stickers": [
   "family",
   "shield",
   "handshake",
   "star2",
   "heart",
   "key"
  ]
 },
 "consent": {
  "name": "The seal",
  "dark": true,
  "sky": [
   "#04122b",
   "#0b3b5c",
   "#0f766e",
   "#f5b301"
  ],
  "grade": "saturate(1.1) contrast(1.05)",
  "a1": "#f5b301",
  "a2": "#14b8a6",
  "a3": "#60a5fa",
  "card": [
   "#fffefb",
   "#0b1b33",
   "#5b6b85"
  ],
  "shape": "soft",
  "art": "consent",
  "stickers": [
   "verified",
   "lock",
   "shield",
   "pencil",
   "check",
   "star"
  ]
 },
 "hearth": {
  "name": "Hearth",
  "dark": false,
  "sky": [
   "#fff1e8",
   "#ffd1b8",
   "#ff9e7a",
   "#b8a4ff"
  ],
  "grade": "saturate(1.05)",
  "a1": "#e5532d",
  "a2": "#7a3cff",
  "a3": "#f2a33a",
  "card": [
   "#ffffff",
   "#2a1530",
   "#7a5f73"
  ],
  "shape": "paper",
  "art": "hearth",
  "stickers": [
   "home",
   "family",
   "sofa",
   "plant",
   "heart",
   "parenting"
  ]
 },
 "treasury": {
  "name": "Treasury",
  "dark": false,
  "sky": [
   "#ecfff6",
   "#a7f3d0",
   "#34d399",
   "#fde68a"
  ],
  "grade": "saturate(1.08)",
  "a1": "#0f8a5f",
  "a2": "#d99a00",
  "a3": "#14b8a6",
  "card": [
   "#ffffff",
   "#0b2a1f",
   "#4a6b5d"
  ],
  "shape": "paper",
  "art": "treasury",
  "stickers": [
   "coin",
   "gift",
   "piggy",
   "money",
   "trophy",
   "rewards"
  ]
 },
 "sentry": {
  "name": "Sentry",
  "dark": false,
  "sky": [
   "#eef2ff",
   "#c7d2fe",
   "#818cf8",
   "#7dd3fc"
  ],
  "grade": "saturate(1.04)",
  "a1": "#2f49d1",
  "a2": "#e0a100",
  "a3": "#0ea5e9",
  "card": [
   "#ffffff",
   "#0d1640",
   "#59648a"
  ],
  "shape": "paper",
  "art": "sentry",
  "stickers": [
   "shield",
   "lock",
   "key",
   "bell",
   "verified",
   "mail"
  ]
 },
 "sunrise": {
  "name": "Sunrise",
  "dark": false,
  "sky": [
   "#ffe7c2",
   "#ffb07a",
   "#ff5d8f",
   "#9b6bff"
  ],
  "grade": "saturate(1.15) contrast(1.02)",
  "a1": "#ff5d2e",
  "a2": "#7b3ff2",
  "a3": "#ffb703",
  "card": [
   "#ffffff",
   "#2b0f2e",
   "#7a5b78"
  ],
  "shape": "blob",
  "art": "sunrise",
  "stickers": [
   "sun",
   "rainbow",
   "wave",
   "sparkles",
   "smile",
   "star2"
  ]
 },
 "campus": {
  "name": "Campus",
  "dark": false,
  "sky": [
   "#e8f1ff",
   "#a9c8ff",
   "#4f7cff",
   "#ffe14d"
  ],
  "grade": "saturate(1.12)",
  "a1": "#2563eb",
  "a2": "#ffb800",
  "a3": "#ef4444",
  "card": [
   "#fffef5",
   "#0f1b3d",
   "#5b6789"
  ],
  "shape": "note",
  "art": "campus",
  "stickers": [
   "graduation",
   "pencil",
   "book",
   "bulb",
   "teacher",
   "school"
  ]
 },
 "nest": {
  "name": "Nest",
  "dark": false,
  "sky": [
   "#fff4ec",
   "#ffc9b5",
   "#9be3c9",
   "#ffd56b"
  ],
  "grade": "saturate(1.1)",
  "a1": "#e4572e",
  "a2": "#17a589",
  "a3": "#f4a259",
  "card": [
   "#ffffff",
   "#2d1a12",
   "#7b6154"
  ],
  "shape": "blob",
  "art": "nest",
  "stickers": [
   "home",
   "dog",
   "cat",
   "sofa",
   "cake",
   "family"
  ]
 },
 "circuit": {
  "name": "Circuit",
  "dark": true,
  "sky": [
   "#030712",
   "#0b1e3f",
   "#1d4ed8",
   "#00e5ff"
  ],
  "grade": "saturate(1.25) contrast(1.08)",
  "a1": "#00e5ff",
  "a2": "#a855f7",
  "a3": "#22c55e",
  "card": [
   "#0b1224",
   "#e6f7ff",
   "#8aa4c2"
  ],
  "shape": "chip",
  "art": "circuit",
  "stickers": [
   "wifi",
   "desktop",
   "keyboard",
   "battery",
   "satellite",
   "tech"
  ]
 },
 "feed": {
  "name": "Feed",
  "dark": false,
  "sky": [
   "#ffe3f1",
   "#ff8cc6",
   "#c05cff",
   "#6b8bff"
  ],
  "grade": "saturate(1.2)",
  "a1": "#ec4899",
  "a2": "#7c3aed",
  "a3": "#f59e0b",
  "card": [
   "#ffffff",
   "#2a0a2a",
   "#7a5a7d"
  ],
  "shape": "bubble",
  "art": "feed",
  "stickers": [
   "sparkle_heart",
   "heart",
   "mail",
   "creator",
   "video",
   "smile"
  ]
 },
 "arcade": {
  "name": "Arcade",
  "dark": true,
  "sky": [
   "#0d0221",
   "#2a0b5e",
   "#ff2e97",
   "#00f0ff"
  ],
  "grade": "saturate(1.3) contrast(1.1)",
  "a1": "#39ff14",
  "a2": "#ff2e97",
  "a3": "#00f0ff",
  "card": [
   "#140a2e",
   "#f4f0ff",
   "#a99bd6"
  ],
  "shape": "pixel",
  "art": "arcade",
  "stickers": [
   "console",
   "esports",
   "dice",
   "trophy",
   "game",
   "star"
  ]
 },
 "boutique": {
  "name": "Boutique",
  "dark": false,
  "sky": [
   "#f6edff",
   "#e0c3ff",
   "#9ff0d8",
   "#ffd98a"
  ],
  "grade": "saturate(1.1)",
  "a1": "#9333ea",
  "a2": "#10b981",
  "a3": "#f59e0b",
  "card": [
   "#ffffff",
   "#24103a",
   "#6e5d86"
  ],
  "shape": "tag",
  "art": "boutique",
  "stickers": [
   "shoppingbag",
   "tag",
   "gift",
   "card2",
   "cart",
   "ringjewel"
  ]
 },
 "bistro": {
  "name": "Bistro",
  "dark": false,
  "sky": [
   "#fff6e0",
   "#ffd166",
   "#ff7b54",
   "#ef476f"
  ],
  "grade": "saturate(1.18)",
  "a1": "#e63946",
  "a2": "#f4a100",
  "a3": "#2a9d8f",
  "card": [
   "#fffdf7",
   "#2b130a",
   "#7d5e4c"
  ],
  "shape": "plate",
  "art": "bistro",
  "stickers": [
   "pizza",
   "fries",
   "icecream",
   "juice",
   "noodle",
   "cake"
  ]
 },
 "runway": {
  "name": "Runway",
  "dark": true,
  "sky": [
   "#0a0a0f",
   "#1f1530",
   "#ff4fa3",
   "#e9e4ff"
  ],
  "grade": "saturate(1.12) contrast(1.12)",
  "a1": "#ff4fa3",
  "a2": "#c4b5fd",
  "a3": "#fde047",
  "card": [
   "#121019",
   "#fbf7ff",
   "#b6a9cf"
  ],
  "shape": "sharp",
  "art": "runway",
  "stickers": [
   "fashion",
   "shoe",
   "lipstick2",
   "glasses",
   "ringjewel",
   "sparkles"
  ]
 },
 "arena": {
  "name": "Arena",
  "dark": false,
  "sky": [
   "#eafff0",
   "#86efac",
   "#16a34a",
   "#ff8a00"
  ],
  "grade": "saturate(1.15)",
  "a1": "#ea580c",
  "a2": "#15803d",
  "a3": "#facc15",
  "card": [
   "#ffffff",
   "#0d2414",
   "#557061"
  ],
  "shape": "badge",
  "art": "arena",
  "stickers": [
   "football",
   "basketball",
   "trophy2",
   "medal",
   "running",
   "tennis"
  ]
 },
 "future": {
  "name": "Future",
  "dark": true,
  "sky": [
   "#020617",
   "#1e1b4b",
   "#5b21b6",
   "#14b8a6"
  ],
  "grade": "saturate(1.2) contrast(1.06) hue-rotate(-6deg)",
  "a1": "#a78bfa",
  "a2": "#22d3ee",
  "a3": "#f472b6",
  "card": [
   "#0e0b26",
   "#eef0ff",
   "#9aa0c8"
  ],
  "shape": "glass",
  "art": "future",
  "stickers": [
   "rocket",
   "satellite",
   "vr",
   "bulb",
   "android",
   "sparkles"
  ]
 },
 "lab": {
  "name": "Lab",
  "dark": false,
  "sky": [
   "#f2ffe6",
   "#c6f68d",
   "#5eead4",
   "#a78bfa"
  ],
  "grade": "saturate(1.12)",
  "a1": "#16a34a",
  "a2": "#0891b2",
  "a3": "#c026d3",
  "card": [
   "#ffffff",
   "#0e2416",
   "#577063"
  ],
  "shape": "flask",
  "art": "lab",
  "stickers": [
   "research",
   "target",
   "chart",
   "check",
   "mic",
   "clock"
  ]
 },
 "atlas": {
  "name": "Atlas",
  "dark": false,
  "sky": [
   "#e6f6ff",
   "#7dd3fc",
   "#2563eb",
   "#fcd34d"
  ],
  "grade": "saturate(1.1)",
  "a1": "#1d4ed8",
  "a2": "#f97316",
  "a3": "#10b981",
  "card": [
   "#ffffff",
   "#0b1d3a",
   "#56698a"
  ],
  "shape": "map",
  "art": "atlas",
  "stickers": [
   "globe",
   "map",
   "travel",
   "passport",
   "airplane_dep",
   "tent"
  ]
 }
};

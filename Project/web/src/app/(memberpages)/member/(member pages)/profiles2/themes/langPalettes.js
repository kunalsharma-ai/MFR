// Every language gets its own colour story: three brand colours (primary, secondary, highlight),
// a mesh angle for the background colour grading and its own motion personality.
// The 34 hand-translated languages are art-directed; every other language gets a palette generated
// from its code (stable across visits). Applied as CSS custom properties on <html> (see applyPalette).
//   a: primary  b: secondary  c: highlight  m: motion  g: mesh angle  hi: greeting shown in the marquee
export const PALETTES = {
  en: { a: '#2b59ff', b: '#ff4f6d', c: '#ffc23d', m: 'float', g: 120, hi: 'Hello' },
  'zh-CN': { a: '#e0301e', b: '#0f9b74', c: '#f5b700', m: 'lantern', g: 160, hi: '你好' },
  'zh-TW': { a: '#c2185b', b: '#00897b', c: '#ffb300', m: 'lantern', g: 200, hi: '您好' },
  hi: { a: '#ff6a00', b: '#00a3a3', c: '#e6007e', m: 'mandala', g: 135, hi: 'नमस्ते' },
  es: { a: '#d7263d', b: '#00a99d', c: '#f4b400', m: 'wave', g: 100, hi: '¡Hola!' },
  ar: { a: '#0b8457', b: '#1f4fbf', c: '#d4a017', m: 'drift', g: 240, hi: 'مرحبا' },
  bn: { a: '#d62246', b: '#0a9396', c: '#ffb703', m: 'wave', g: 150, hi: 'নমস্কার' },
  pt: { a: '#009c3b', b: '#1d3fbb', c: '#ffcc00', m: 'samba', g: 110, hi: 'Olá' },
  ru: { a: '#1d4ed8', b: '#e11d48', c: '#f59e0b', m: 'zoom', g: 180, hi: 'Привет' },
  ja: { a: '#e8436f', b: '#2c3e94', c: '#8bc34a', m: 'petals', g: 210, hi: 'こんにちは' },
  fr: { a: '#7c4dff', b: '#ff5c8a', c: '#f6c85f', m: 'drift', g: 130, hi: 'Bonjour' },
  de: { a: '#e63946', b: '#1d3557', c: '#ffbe0b', m: 'bauhaus', g: 90, hi: 'Hallo' },
  ko: { a: '#ff3d7f', b: '#00b8c9', c: '#ffd23f', m: 'pop', g: 145, hi: '안녕하세요' },
  it: { a: '#138a36', b: '#e4572e', c: '#f9c80e', m: 'wave', g: 115, hi: 'Ciao' },
  tr: { a: '#00a3a3', b: '#e30a17', c: '#f78c6b', m: 'mandala', g: 170, hi: 'Merhaba' },
  vi: { a: '#e2457a', b: '#3a9b4a', c: '#ffc107', m: 'petals', g: 125, hi: 'Xin chào' },
  ur: { a: '#0d7a3e', b: '#2ec4b6', c: '#e9b949', m: 'drift', g: 220, hi: 'السلام علیکم' },
  id: { a: '#c1121f', b: '#0096c7', c: '#ff8500', m: 'wave', g: 140, hi: 'Halo' },
  th: { a: '#6a1b9a', b: '#00838f', c: '#f9a825', m: 'lantern', g: 195, hi: 'สวัสดี' },
  fa: { a: '#1c39bb', b: '#14b8a6', c: '#f4a300', m: 'mandala', g: 230, hi: 'سلام' },
  pl: { a: '#dc143c', b: '#2d6a4f', c: '#ffb000', m: 'zoom', g: 105, hi: 'Cześć' },
  uk: { a: '#0057b7', b: '#ff7a00', c: '#ffd500', m: 'wave', g: 95, hi: 'Привіт' },
  nl: { a: '#ff6f00', b: '#1e50a2', c: '#e63946', m: 'bauhaus', g: 160, hi: 'Hallo' },
  ms: { a: '#d00000', b: '#3a86ff', c: '#ffbe0b', m: 'float', g: 135, hi: 'Selamat' },
  fil: { a: '#0038a8', b: '#ce1126', c: '#fcd116', m: 'mandala', g: 120, hi: 'Kumusta' },
  sw: { a: '#f77f00', b: '#2a9d8f', c: '#9d4edd', m: 'samba', g: 175, hi: 'Jambo' },
  ta: { a: '#c9184a', b: '#118ab2', c: '#ffb703', m: 'mandala', g: 150, hi: 'வணக்கம்' },
  te: { a: '#ff7b00', b: '#2ec4b6', c: '#e71d36', m: 'pop', g: 125, hi: 'నమస్కారం' },
  kn: { a: '#d00000', b: '#3a0ca3', c: '#ffc300', m: 'zoom', g: 160, hi: 'ನಮಸ್ಕಾರ' },
  ml: { a: '#2b9348', b: '#0081c6', c: '#d4a017', m: 'wave', g: 200, hi: 'നമസ്കാരം' },
  mr: { a: '#ff6d00', b: '#7b2cbf', c: '#2b9348', m: 'lantern', g: 140, hi: 'नमस्कार' },
  gu: { a: '#f72585', b: '#4361ee', c: '#fb8500', m: 'samba', g: 115, hi: 'નમસ્તે' },
  pa: { a: '#fb5607', b: '#ff006e', c: '#ffbe0b', m: 'pop', g: 135, hi: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ' },
  he: { a: '#0038b8', b: '#00b4d8', c: '#ffd166', m: 'drift', g: 250, hi: 'שלום' }
};
export const MOTIONS = ['float', 'lantern', 'mandala', 'wave', 'drift', 'samba', 'zoom', 'petals', 'bauhaus', 'pop'];

const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.codePointAt(0), 16777619); return h >>> 0; };
const hsl = (h, s, l) => {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return '#' + [f(0), f(8), f(4)].map((x) => x.toString(16).padStart(2, '0')).join('');
};

export function paletteFor(code) {
  if (PALETTES[code]) return PALETTES[code];
  const h = hash(code), hue = h % 360;
  return {
    a: hsl(hue, 78, 46), b: hsl((hue + 150 + (h % 60)) % 360, 70, 42), c: hsl((hue + 55) % 360, 95, 56),
    m: MOTIONS[h % MOTIONS.length], g: 90 + (h % 180), hi: null
  };
}

/** Sets --L1/--L2/--L3 (+ mesh angle and motion) on <html>; CSS @property makes the change animate. */
export function applyPalette(code) {
  if (typeof document === 'undefined') return;
  const p = paletteFor(code), r = document.documentElement;
  r.style.setProperty('--L1', p.a);
  r.style.setProperty('--L2', p.b);
  r.style.setProperty('--L3', p.c);
  r.style.setProperty('--Lg', p.g + 'deg');
  r.dataset.motion = p.m;
}

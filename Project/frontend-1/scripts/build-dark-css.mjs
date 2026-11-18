// Generates public/css/dark.css — the dark-mode stylesheet (v3.0).
// It reads every site stylesheet and writes, for each rule that sets a colour, a dark twin scoped to
// html[data-mode="dark"]:
//   • light surfaces (backgrounds, gradient stops, light borders)  → deep navy surfaces that keep their hue
//   • dark text colours                                           → light text that keeps its hue
//   • brand colours, dark sections, white text on navy, images    → unchanged
// Then it appends src/styles/dark-base.css (hand-tuned page background and component fixes).
// Run automatically by `npm run build`, `npm run dev` and `npm run build:preview`.
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIRS = ['src/styles', 'src/components'];
const SKIP = new Set(['dark-base.css', 'v30-mode.css']);
const P = 'html[data-mode="dark"]';

// ---------- colour helpers ----------
const NAMED = { white: [255, 255, 255], black: [0, 0, 0], snow: [255, 250, 250], ivory: [255, 255, 240], whitesmoke: [245, 245, 245], ghostwhite: [248, 248, 255], aliceblue: [240, 248, 255] };
function parseColor(str) {
  let m;
  if ((m = str.match(/^#([0-9a-f]{3,8})$/i))) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
  }
  if ((m = str.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i))) {
    let a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: +m[1], g: +m[2], b: +m[3], a };
  }
  if (NAMED[str.toLowerCase()]) { const [r, g, b] = NAMED[str.toLowerCase()]; return { r, g, b, a: 1 }; }
  return null;
}
function toHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}
const fmt = (h, s, l, a) => (a < 1 ? `hsla(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%, ${+a.toFixed(3)})` : `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`);
// light surface → dark surface. Every light fill becomes the same deep-navy family; only a faint tint of the
// original hue is kept, so cream/peach/pink panels never turn into muddy browns ("photo negative" look).
function grade(h, s) {
  if (s < 0.12) return [228, 0.36];
  const warm = h < 75 || h > 315;
  // warm hues lean into navy-violet, cool hues keep their own hue with low saturation
  return warm ? [h > 315 ? 285 : 255, Math.min(0.3, 0.16 + s * 0.12)] : [h, Math.min(0.42, 0.2 + s * 0.2)];
}
function darkSurface(c) {
  const { h, s, l } = toHsl(c);
  if (l < 0.72 || c.a < 0.5) return null;
  const [gh, gs] = grade(h, s);
  return fmt(gh, gs, 0.1 + (1 - l) * 0.45, c.a);
}
// light border → subtle dark border
function darkLine(c) {
  const { h, s, l } = toHsl(c);
  if (l < 0.72) return null;
  const [gh, gs] = grade(h, s);
  return fmt(gh, gs, 0.24, Math.max(c.a, 0.6));
}
// dark text → light text
let textCut = 0.38;
function lightText(c) {
  const { h, s, l } = toHsl(c);
  if (l > textCut) return null;
  return fmt(h, Math.min(0.6, s * 0.7), 0.92 - l * 0.45, c.a);
}
const COLOR_RE = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|\b(?:white|snow|ivory|whitesmoke|ghostwhite|aliceblue)\b/gi;
function mapValue(v, fn) {
  let changed = false;
  const out = v.replace(COLOR_RE, (m) => {
    const c = parseColor(m);
    if (!c) return m;
    const r = fn(c);
    if (!r) return m;
    changed = true;
    return r;
  });
  return changed ? out : null;
}

const BG = /^(background|background-color|background-image)$/;
const TEXT = /^(color|-webkit-text-fill-color|caret-color|text-decoration-color)$/;
const LINE = /^(border|border-(top|right|bottom|left)|border(-(top|right|bottom|left))?-color|outline|outline-color|column-rule)$/;
const VAR_TEXT = /ink|text|muted|fg|copy|heading/i;
const VAR_SURF = /bg|surface|paper|card|soft|panel|line|border|tint|light|white|glass/i;

function darkDecl(prop, value) {
  const p = prop.trim().toLowerCase();
  if (/url\(/i.test(value)) return null;
  if (BG.test(p)) return mapValue(value, darkSurface);
  if (TEXT.test(p)) {
    // Navy brand variables used as text colour → light text (the variables themselves stay navy for fills).
    if (/^var\(--navy(-[6-9]00)?\)\s*(!important)?$/.test(value.trim())) return value.replace(/var\([^)]*\)/, '#eef2ff');
    return mapValue(value, lightText);
  }
  if (LINE.test(p)) return mapValue(value, darkLine);
  if (p.startsWith('--')) {
    const c = parseColor(value.replace(/!important/, '').trim());
    if (!c) return null;
    if (VAR_TEXT.test(p)) { const r = lightText(c); return r && value.replace(/^[^!]+/, r); }
    if (VAR_SURF.test(p)) { const r = darkSurface(c) || darkLine(c); return r && value.replace(/^[^!]+/, r); }
  }
  return null;
}

// ---------- tiny CSS walker ----------
function splitTop(s, ch) {
  const out = []; let depth = 0, cur = '';
  for (const c of s) {
    if (c === '(' || c === '[') depth++;
    if (c === ')' || c === ']') depth--;
    if (c === ch && depth === 0) { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur);
  return out;
}
function prefixSel(sel) {
  return splitTop(sel, ',').map((x) => {
    const t = x.trim();
    if (!t) return t;
    if (/^html\b/.test(t)) return t.replace(/^html/, P);
    if (/^:root\b/.test(t)) return t.replace(/^:root/, ':root[data-mode="dark"]');
    return `${P} ${t}`;
  }).join(', ');
}
function walk(css) {
  let out = '';
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open < 0) break;
    const head = css.slice(i, open).trim();
    // find matching brace
    let depth = 1, j = open + 1;
    while (j < css.length && depth) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
    const body = css.slice(open + 1, j - 1);
    i = j;
    if (head.startsWith('@')) {
      if (/^@(media|supports|layer|container)/.test(head)) {
        const inner = walk(body);
        if (inner) out += `${head}{${inner}}\n`;
      }
      continue; // keyframes, font-face, page …
    }
    // A rule that paints its own coloured fill (orange, yellow, brand gradients…) keeps its text colour too.
    let keepsFill = false;
    // If this rule paints a light surface (which turns dark), mid-tone text on it must go light too.
    textCut = splitTop(body, ';').some((d) => { const k = d.indexOf(':'); return k > 0 && BG.test(d.slice(0, k).trim().toLowerCase()) && darkDecl(d.slice(0, k), d.slice(k + 1).trim()); }) ? 0.56 : 0.38;
    const parts = splitTop(body, ';').map((d) => {
      const k = d.indexOf(':');
      if (k < 0) return null;
      const prop = d.slice(0, k).trim();
      const val = d.slice(k + 1).trim();
      const nv = darkDecl(prop, val);
      if (BG.test(prop.toLowerCase()) && !nv && (val.match(COLOR_RE) || []).some((m) => { const c = parseColor(m); return c && c.a >= 0.5; })) keepsFill = true;
      return nv ? [prop, nv] : null;
    }).filter(Boolean);
    const decls = parts.filter(([prop]) => !(keepsFill && TEXT.test(prop.toLowerCase()))).map(([prop, nv]) => `${prop}:${nv}`);
    // A `background` shorthand resets background-clip, which would turn gradient text into a solid bar.
    if (decls.some((d) => /^background\s*:/.test(d)) && /background-clip\s*:\s*text/i.test(body)) decls.push('-webkit-background-clip:text', 'background-clip:text');
    if (decls.length) out += `${prefixSel(head)}{${decls.join(';')}}\n`;
  }
  return out;
}

let all = '';
for (const d of DIRS) {
  for (const f of (await readdir(path.join(root, d))).sort()) {
    if (!f.endsWith('.css') || SKIP.has(f)) continue;
    const css = (await readFile(path.join(root, d, f), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
    const out = walk(css);
    if (out) all += `/* ${d}/${f} */\n${out}`;
  }
}
const base = await readFile(path.join(root, 'src/styles/dark-base.css'), 'utf8');
const header = '/* GENERATED by scripts/build-dark-css.mjs — do not edit by hand. Hand-tuned rules live in src/styles/dark-base.css. */\n';
await mkdir(path.join(root, 'public/css'), { recursive: true });
await writeFile(path.join(root, 'public/css/dark.css'), header + all + '\n/* dark-base.css */\n' + base);
console.log(`dark.css written (${((header.length + all.length + base.length) / 1024).toFixed(0)} KB)`);

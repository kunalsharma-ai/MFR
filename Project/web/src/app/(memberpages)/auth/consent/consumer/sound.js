// Interface sounds for the consent page — synthesised with the Web Audio API (no audio files).
// Every click has a sound; each kind of action has its own character so the page "answers" the visitor:
//   tap      soft wooden tick (buttons, links, chapter rail)
//   open     airy upward swish (opening a section)       close  the same, downward
//   on       bright two-note chime (a permission switched on)   off  lower, muted blip
//   read     tiny glass ping (a section counted as read)
//   sign     warm major chord + sparkle (agreement confirmed)
//   warn     gentle low double knock (something still needed)
// Language signatures (one per language) live in i18n/sounds.js and are loaded on demand.
import { isSoundEnabled } from './i18n/soundPrefs.js';

let ctx = null;
let out = null;
function audio() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    out = ctx.createGain();
    out.gain.value = 0.55;
    const comp = ctx.createDynamicsCompressor();
    out.connect(comp);
    comp.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
function note(t, freq, { type = 'sine', dur = 0.18, vol = 0.18, a = 0.005, glide = 0, pan = 0 } = {}) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glide) o.frequency.exponentialRampToValueAtTime(freq * glide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  if (p) { p.pan.value = pan; g.connect(p); p.connect(out); } else g.connect(out);
  o.start(t);
  o.stop(t + dur + 0.02);
}
function hiss(t, { dur = 0.12, vol = 0.06, from = 800, to = 5000 } = {}) {
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ctx.createBufferSource();
  s.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 1.2;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(out);
  s.start(t);
}
const RECIPES = {
  tap: (t) => { note(t, 1320, { type: 'triangle', dur: 0.06, vol: 0.12, glide: 0.6 }); note(t, 2640, { dur: 0.03, vol: 0.04 }); },
  open: (t) => { hiss(t, { dur: 0.16, vol: 0.05, from: 600, to: 4200 }); note(t + 0.02, 660, { type: 'sine', dur: 0.16, vol: 0.08, glide: 1.5 }); },
  close: (t) => { hiss(t, { dur: 0.14, vol: 0.045, from: 4000, to: 700 }); note(t + 0.02, 880, { dur: 0.14, vol: 0.06, glide: 0.66 }); },
  on: (t) => { note(t, 784, { type: 'triangle', dur: 0.12, vol: 0.12 }); note(t + 0.07, 1175, { type: 'triangle', dur: 0.2, vol: 0.12 }); },
  off: (t) => { note(t, 523, { type: 'triangle', dur: 0.1, vol: 0.1, glide: 0.75 }); },
  read: (t) => { note(t, 2093, { dur: 0.22, vol: 0.05 }); note(t, 3136, { dur: 0.14, vol: 0.025 }); },
  sign: (t) => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(t + i * 0.06, f, { type: 'triangle', dur: 0.9, vol: 0.09, pan: (i - 1.5) * 0.3 }));
    for (let i = 0; i < 8; i++) note(t + 0.35 + i * 0.05, 2000 + Math.random() * 2000, { dur: 0.12, vol: 0.03, pan: Math.random() * 2 - 1 });
  },
  light: (t) => { note(t, 880, { type: 'triangle', dur: 0.08, vol: 0.07 }); note(t + 0.06, 1320, { type: 'triangle', dur: 0.14, vol: 0.07 }); },
  dark: (t) => { note(t, 660, { type: 'triangle', dur: 0.08, vol: 0.07 }); note(t + 0.06, 440, { type: 'triangle', dur: 0.16, vol: 0.07 }); },
  warn: (t) => { note(t, 220, { type: 'square', dur: 0.07, vol: 0.05 }); note(t + 0.11, 196, { type: 'square', dur: 0.08, vol: 0.05 }); },
};
export function play(kind = 'tap') {
  if (!isSoundEnabled()) return;
  try {
    if (!audio()) return;
    (RECIPES[kind] || RECIPES.tap)(ctx.currentTime + 0.01);
  } catch {
    /* audio unavailable */
  }
}
/** Language signature (separate chunk, loaded when the picker opens). */
export function playLanguage(code) {
  if (!isSoundEnabled()) return;
  import('./i18n/sounds.js').then((m) => m.playLanguageSound(code)).catch(() => {});
}
export const preloadLanguageSounds = () => import('./i18n/sounds.js').catch(() => {});

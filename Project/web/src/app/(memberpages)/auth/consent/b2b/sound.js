// Interface sounds for the business consent page — synthesised with the Web Audio API (no audio files).
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
  // soft "executive keyboard" click
  tap: (t) => { hiss(t, { dur: 0.03, vol: 0.05, from: 3000, to: 6000 }); note(t, 1800, { type: 'square', dur: 0.025, vol: 0.03 }); },
  // paper sliding (clause drawer opens) / back
  paper: (t) => { hiss(t, { dur: 0.28, vol: 0.06, from: 900, to: 3200 }); note(t + 0.05, 440, { dur: 0.2, vol: 0.04, glide: 1.4 }); },
  close: (t) => { hiss(t, { dur: 0.2, vol: 0.05, from: 3000, to: 800 }); },
  // rubber stamp: thud + ink smack + small chime
  stamp: (t) => { note(t, 120, { type: 'sine', dur: 0.18, vol: 0.28, glide: 0.5 }); hiss(t, { dur: 0.06, vol: 0.12, from: 2000, to: 1200 }); note(t + 0.09, 1568, { type: 'triangle', dur: 0.25, vol: 0.05 }); },
  unstamp: (t) => { note(t, 330, { type: 'triangle', dur: 0.1, vol: 0.07, glide: 0.7 }); hiss(t, { dur: 0.05, vol: 0.04, from: 4000, to: 2000 }); },
  // reviewed clause: two soft marimba notes
  read: (t) => { note(t, 1047, { type: 'sine', dur: 0.18, vol: 0.06 }); note(t + 0.06, 1568, { type: 'sine', dur: 0.2, vol: 0.05 }); },
  // slide-to-sign progress ticks
  tick: (t) => { note(t, 2400, { type: 'square', dur: 0.015, vol: 0.025 }); },
  // theme switch: up for light, down for dark
  light: (t) => { note(t, 880, { type: 'triangle', dur: 0.08, vol: 0.07 }); note(t + 0.06, 1320, { type: 'triangle', dur: 0.14, vol: 0.07 }); },
  dark: (t) => { note(t, 660, { type: 'triangle', dur: 0.08, vol: 0.07 }); note(t + 0.06, 440, { type: 'triangle', dur: 0.16, vol: 0.07 }); },
  // signed: pen scratch + warm suspended → major chord + bell
  sign: (t) => {
    for (let i = 0; i < 6; i++) hiss(t + i * 0.07, { dur: 0.06, vol: 0.05, from: 2500 + i * 300, to: 5000 });
    [392, 523.25, 587.33].forEach((f, i) => note(t + 0.45 + i * 0.03, f, { type: 'triangle', dur: 0.5, vol: 0.07 }));
    [392, 493.88, 587.33, 783.99].forEach((f, i) => note(t + 0.8 + i * 0.05, f, { type: 'triangle', dur: 1.1, vol: 0.08, pan: (i - 1.5) * 0.3 }));
    note(t + 1.0, 2093, { type: 'sine', dur: 1.2, vol: 0.04 });
  },
  warn: (t) => { note(t, 196, { type: 'square', dur: 0.07, vol: 0.05 }); note(t + 0.11, 174.6, { type: 'square', dur: 0.09, vol: 0.05 }); },
  open: (t) => RECIPES.paper(t),
  on: (t) => RECIPES.stamp(t),
  off: (t) => RECIPES.unstamp(t),
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

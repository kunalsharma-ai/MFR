"use client";
// Tiny Web Audio synthesizer - zero audio files, ~0 KB of network.
// Every language has its own signature motif (scale + instrument + rhythm) that plays
// when the visitor picks it. Sounds only start after a user gesture (autoplay-safe)
// and respect the mute toggle.
// Portal: the mute toggle is the member hub's Sound setting (header speaker button / Settings > Sound,
// saved as mfr.hub.prefs.sound), so the profile studio and the rest of the member area share one switch.
const HUB_KEY = 'mfr.hub.prefs';
const hubSound = () => { try { const p = JSON.parse(localStorage.getItem(HUB_KEY) || '{}'); return p.sound !== false; } catch { return false; } };
const store = { set() {} }; // the hub owns the stored value

let ctx = null, out = null, send = null;
let enabled = typeof window !== 'undefined' && hubSound();
if (typeof window !== 'undefined') window.addEventListener('storage', (e) => { if (e.key === HUB_KEY) enabled = hubSound(); });
function live() { if (typeof window !== "undefined") enabled = hubSound(); return enabled; } // re-read: the hub may have changed it in this tab
const subs = new Set();

export const isSoundOn = () => enabled;
export function setSound(on) {
  enabled = !!on;
  store.set('mfr:sound', enabled);
  subs.forEach((f) => f(enabled));
  if (enabled) ui('toggle');
}
export const onSound = (f) => (subs.add(f), () => subs.delete(f));

function audio() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    out = ctx.createGain();
    out.gain.value = 0.42;
    out.connect(comp).connect(ctx.destination);
    // light "room": feedback delay + lowpass
    send = ctx.createGain();
    send.gain.value = 0.22;
    const d = ctx.createDelay(1);
    d.delayTime.value = 0.19;
    const fb = ctx.createGain();
    fb.gain.value = 0.33;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;
    send.connect(d).connect(lp).connect(fb).connect(d);
    lp.connect(out);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

function env(g, t, a, peak, decay, sustain = 0.0001) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t + a + decay);
}
function osc(type, f, t, stop, dest, detune = 0) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  o.detune.value = detune;
  o.connect(dest);
  o.start(t);
  o.stop(stop);
  return o;
}
function voice(peak, t, a, decay, wet = true) {
  const g = ctx.createGain();
  env(g, t, a, peak, decay);
  g.connect(out);
  if (wet) g.connect(send);
  return g;
}

// ---------------- instruments ----------------
const INST = {
  bell(f, t, v) {
    const g = voice(0.32 * v, t, 0.005, 2.2);
    [[1, 1], [2.76, 0.45], [5.4, 0.2], [8.93, 0.08]].forEach(([m, a]) => {
      const gg = ctx.createGain(); gg.gain.value = a; gg.connect(g); osc('sine', f * m, t, t + 2.4, gg);
    });
  },
  gamelan(f, t, v) {
    const g = voice(0.3 * v, t, 0.004, 1.8);
    osc('sine', f, t, t + 2, g); osc('sine', f * 1.006, t, t + 2, g);
    const h = ctx.createGain(); h.gain.value = 0.3; h.connect(g); osc('sine', f * 3.01, t, t + 1, h);
  },
  glock(f, t, v) {
    const g = voice(0.24 * v, t, 0.002, 0.9);
    osc('sine', f * 2, t, t + 1, g);
    const h = ctx.createGain(); h.gain.value = 0.25; h.connect(g); osc('sine', f * 5.6, t, t + 0.4, h);
  },
  marimba(f, t, v) {
    const g = voice(0.34 * v, t, 0.003, 0.5);
    osc('sine', f, t, t + 0.6, g);
    const h = ctx.createGain(); env(h, t, 0.002, 0.3, 0.08); h.connect(g); osc('sine', f * 4, t, t + 0.2, h);
  },
  kalimba(f, t, v) {
    const g = voice(0.3 * v, t, 0.002, 0.9);
    osc('triangle', f, t, t + 1, g);
    const h = ctx.createGain(); env(h, t, 0.001, 0.4, 0.06); h.connect(g); osc('sine', f * 5.95, t, t + 0.15, h);
  },
  steel(f, t, v) {
    const g = voice(0.28 * v, t, 0.004, 0.8);
    [[1, 1], [2, 0.5], [3, 0.22], [4.2, 0.1]].forEach(([m, a]) => {
      const gg = ctx.createGain(); gg.gain.value = a; gg.connect(g); osc('sine', f * m, t, t + 0.9, gg);
    });
  },
  pluck(f, t, v, o = {}) {
    const g = voice(0.26 * v, t, 0.003, o.decay || 0.7);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = 2;
    lp.frequency.setValueAtTime(f * 9, t);
    lp.frequency.exponentialRampToValueAtTime(f * 1.4, t + 0.35);
    lp.connect(g);
    const s = osc(o.wave || 'sawtooth', f, t, t + (o.decay || 0.7) + 0.1, lp);
    if (o.bend) { s.frequency.setValueAtTime(f * 0.97, t); s.frequency.exponentialRampToValueAtTime(f, t + 0.06); }
  },
  sitar(f, t, v) {
    INST.pluck(f, t, v, { decay: 1.1, bend: true });
    const g = voice(0.05 * v, t, 0.01, 0.8);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 6; bp.Q.value = 6; bp.connect(g);
    osc('sawtooth', f, t, t + 0.9, bp, 8);
  },
  harp(f, t, v) { INST.pluck(f, t, v, { wave: 'triangle', decay: 1.2 }); },
  flute(f, t, v, o = {}) {
    const d = o.len || 0.42;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22 * v, t + 0.06);
    g.gain.setValueAtTime(0.2 * v, t + d * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.25);
    g.connect(out); g.connect(send);
    const s = osc(o.wave || 'sine', f, t, t + d + 0.3, g);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 5.4;
    const lg = ctx.createGain(); lg.gain.value = f * 0.006; lfo.connect(lg).connect(s.frequency);
    lfo.start(t); lfo.stop(t + d + 0.3);
    if (o.glide) { s.frequency.setValueAtTime(f * 0.94, t); s.frequency.exponentialRampToValueAtTime(f, t + 0.12); }
    // breath
    const n = ctx.createBufferSource(); n.buffer = noise();
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 3;
    const ng = ctx.createGain(); env(ng, t, 0.01, 0.05 * v, 0.12);
    n.connect(bp).connect(ng).connect(out); n.start(t); n.stop(t + 0.2);
  },
  reed(f, t, v) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.14 * v, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = f * 4; lp.connect(g);
    g.connect(out); g.connect(send);
    const s = osc('square', f, t, t + 0.65, lp);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 6; const lg = ctx.createGain(); lg.gain.value = f * 0.008;
    lfo.connect(lg).connect(s.frequency); lfo.start(t); lfo.stop(t + 0.65);
  },
  accordion(f, t, v) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.11 * v, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; lp.connect(g);
    g.connect(out); g.connect(send);
    osc('square', f, t, t + 0.6, lp, -7); osc('sawtooth', f, t, t + 0.6, lp, 7);
  },
  brass(f, t, v) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16 * v, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(f * 1.5, t); lp.frequency.exponentialRampToValueAtTime(f * 6, t + 0.08);
    lp.frequency.exponentialRampToValueAtTime(f * 2.5, t + 0.5);
    lp.connect(g); g.connect(out); g.connect(send);
    osc('sawtooth', f, t, t + 0.75, lp); osc('sawtooth', f, t, t + 0.75, lp, 9);
  },
  piano(f, t, v) {
    const g = voice(0.3 * v, t, 0.003, 1.3);
    osc('triangle', f, t, t + 1.4, g);
    const h = ctx.createGain(); env(h, t, 0.002, 0.35, 0.3); h.connect(g); osc('sine', f * 2, t, t + 0.5, h);
  },
  chip(f, t, v) {
    const g = voice(0.09 * v, t, 0.002, 0.18, false);
    osc('square', f, t, t + 0.22, g);
  },
  pad(f, t, v) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07 * v, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; lp.connect(g);
    g.connect(out); g.connect(send);
    osc('sawtooth', f, t, t + 1.7, lp, -10); osc('sawtooth', f, t, t + 1.7, lp, 10);
  }
};

let noiseBuf = null;
function noise() {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

// ---------------- scales & language signatures ----------------
const S = {
  maj: [0, 2, 4, 5, 7, 9, 11], min: [0, 2, 3, 5, 7, 8, 10], penta: [0, 2, 4, 7, 9], minPenta: [0, 3, 5, 7, 10],
  in: [0, 1, 5, 7, 8], hira: [0, 2, 3, 7, 8], yaman: [0, 2, 4, 6, 7, 9, 11], bhairav: [0, 1, 4, 5, 7, 8, 11],
  hijaz: [0, 1, 4, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], harm: [0, 2, 3, 5, 7, 8, 11], lyd: [0, 2, 4, 6, 7, 9, 11],
  mixo: [0, 2, 4, 5, 7, 9, 10], phryg: [0, 1, 3, 5, 7, 8, 10], pelog: [0, 1, 3, 7, 8], slendro: [0, 2, 5, 7, 9],
  gypsy: [0, 2, 3, 6, 7, 8, 11]
};
const deg = (scale, root, d) => {
  const n = scale.length, o = Math.floor(d / n), i = ((d % n) + n) % n;
  return hz(root + scale[i] + 12 * o);
};

// inst, scale, root (MIDI), degrees, step seconds, options
export const SIGNATURES = {
  en: ['harp', 'maj', 72, [0, 2, 4, 7], 0.09, { chord: [0, 2, 4] }],
  'zh-CN': ['pluck', 'penta', 69, [5, 4, 3, 2, 1, 2, 4], 0.065, { tail: 'bell' }],
  'zh-TW': ['flute', 'penta', 74, [0, 2, 1, 3, 4], 0.14, { glide: true }],
  hi: ['sitar', 'yaman', 62, [0, 2, 3, 4, 6, 7], 0.11, { drone: true }],
  es: ['pluck', 'phryg', 64, [4, 3, 2, 1, 0], 0.085, { strum: true }],
  ar: ['flute', 'hijaz', 62, [0, 1, 2, 3, 4, 3, 2], 0.12, { glide: true, wave: 'triangle' }],
  bn: ['flute', 'penta', 67, [0, 1, 2, 4, 3, 2], 0.13, {}],
  pt: ['marimba', 'mixo', 67, [0, 2, 4, 5, 4, 7], 0.1, { swing: true }],
  ru: ['bell', 'min', 57, [7, 4, 2, 0], 0.18, { chord: [0, 2, 4] }],
  ja: ['pluck', 'in', 69, [0, 1, 2, 4, 3], 0.11, { wave: 'triangle' }],
  fr: ['accordion', 'maj', 69, [0, 2, 4, 2, 7, 4], 0.11, { swing: true }],
  de: ['brass', 'maj', 60, [0, 2, 4, 7], 0.12, { chord: [0, 2, 4] }],
  ko: ['glock', 'penta', 76, [0, 2, 4, 3, 5], 0.08, {}],
  it: ['pluck', 'maj', 72, [0, 2, 4, 7], 0.12, { tremolo: true, wave: 'triangle' }],
  tr: ['pluck', 'hijaz', 64, [0, 1, 2, 1, 0, 4], 0.09, { bend: true }],
  vi: ['flute', 'penta', 69, [0, 2, 1, 3, 2], 0.14, { glide: true, wave: 'sine' }],
  ur: ['accordion', 'yaman', 60, [0, 2, 4, 5, 4], 0.13, { drone: true }],
  id: ['gamelan', 'pelog', 67, [0, 1, 2, 4, 3, 2], 0.11, {}],
  th: ['marimba', 'penta', 72, [0, 1, 2, 3, 4, 3, 4], 0.07, {}],
  fa: ['pluck', 'harm', 64, [0, 2, 3, 1, 0, 4], 0.075, { tremolo: true, wave: 'triangle' }],
  pl: ['piano', 'harm', 64, [0, 2, 4, 3, 7], 0.13, {}],
  uk: ['pluck', 'min', 62, [0, 2, 4, 3, 4, 7], 0.1, { wave: 'triangle' }],
  nl: ['bell', 'maj', 72, [0, 1, 2, 4], 0.14, {}],
  ms: ['steel', 'slendro', 69, [0, 1, 2, 3, 2], 0.1, {}],
  fil: ['harp', 'maj', 67, [0, 2, 4, 5, 7], 0.09, { chord: [0, 2, 4] }],
  sw: ['kalimba', 'penta', 67, [0, 2, 1, 3, 2, 4], 0.1, {}],
  he: ['reed', 'hijaz', 62, [0, 1, 2, 3, 4], 0.12, {}],
  ta: ['sitar', 'maj', 62, [0, 2, 4, 6, 4], 0.12, { drone: true }],
  te: ['flute', 'yaman', 67, [4, 3, 2, 1, 0], 0.12, { glide: true }],
  mr: ['sitar', 'bhairav', 60, [0, 1, 2, 3, 4], 0.12, { drone: true }],
  gu: ['steel', 'maj', 67, [0, 0, 2, 4, 4, 7], 0.09, { swing: true }],
  kn: ['pluck', 'penta', 64, [0, 1, 2, 3, 4, 3], 0.1, { wave: 'triangle', bend: true }],
  ml: ['glock', 'minPenta', 69, [0, 1, 2, 4], 0.11, { drone: true }],
  pa: ['pluck', 'mixo', 76, [0, 0, 4, 0, 5, 4], 0.075, { wave: 'square', decay: 0.3 }]
};
const INST_KEYS = ['bell', 'glock', 'marimba', 'kalimba', 'steel', 'harp', 'flute', 'pluck', 'piano', 'gamelan'];
const SCALE_KEYS = Object.keys(S);
function signatureFor(code) {
  if (SIGNATURES[code]) return SIGNATURES[code];
  let h = 7;
  for (const c of code) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const inst = INST_KEYS[h % INST_KEYS.length], sc = SCALE_KEYS[(h >> 4) % SCALE_KEYS.length];
  const root = 62 + ((h >> 8) % 12), len = 4 + ((h >> 12) % 3);
  const d = Array.from({ length: len }, (_, i) => ((h >> (i * 3)) % 5) + (i > len / 2 ? 1 : 0));
  return [inst, sc, root, d, 0.1, {}];
}

/** Plays the signature motif of a language. */
export function playLanguage(code) {
  if (!live() || !audio()) return;
  const [inst, scName, root, degs, step, o] = signatureFor(code);
  const scale = S[scName], f0 = INST[inst];
  let t = ctx.currentTime + 0.02;
  if (o.drone) INST.pad(hz(root - 12), t, 1.2);
  degs.forEach((d, i) => {
    const f = deg(scale, root, d);
    const tt = t + i * step + (o.swing && i % 2 ? step * 0.3 : 0);
    if (o.tremolo) [0, 1, 2].forEach((k) => f0(f, tt + k * step * 0.28, 0.6, o));
    else if (o.strum) f0(f, tt, 1, o), f0(f * 1.5, tt + 0.012, 0.5, o);
    else f0(f, tt, 1, o);
  });
  const end = t + degs.length * step;
  if (o.chord) o.chord.forEach((d, i) => f0(deg(scale, root, d), end + i * 0.015, 0.7, o));
  if (o.tail) INST[o.tail](deg(scale, root, 7), end + 0.05, 0.8);
}

/** Small interface sounds. */
export function ui(kind) {
  if (!live() || !audio()) return;
  lastTap = ctx.currentTime; // the global click sound (tap) stays quiet for this click
  const t = ctx.currentTime + 0.01;
  switch (kind) {
    case 'select': INST.marimba(hz(84), t, 0.5); break;
    case 'deselect': INST.marimba(hz(77), t, 0.35); break;
    case 'next': INST.glock(hz(79), t, 0.35); INST.glock(hz(86), t + 0.05, 0.25); break;
    case 'back': INST.glock(hz(81), t, 0.3); INST.glock(hz(76), t + 0.05, 0.2); break;
    case 'error': INST.marimba(hz(52), t, 0.6); INST.marimba(hz(51), t + 0.09, 0.5); break;
    case 'open': INST.harp(hz(67), t, 0.5); INST.harp(hz(74), t + 0.06, 0.5); INST.harp(hz(79), t + 0.12, 0.6); break;
    case 'toggle': INST.glock(hz(84), t, 0.4); break;
    case 'section': [72, 76, 79, 84].forEach((m, i) => INST.bell(hz(m), t + i * 0.08, 0.55)); break;
    case 'complete': {
      [60, 64, 67, 72].forEach((m, i) => INST.brass(hz(m), t + i * 0.11, 0.8));
      [72, 76, 79].forEach((m) => INST.brass(hz(m), t + 0.5, 0.7));
      [84, 88, 91, 96, 100].forEach((m, i) => INST.glock(hz(m), t + 0.62 + i * 0.07, 0.45));
      INST.pad(hz(48), t + 0.5, 1.4);
      break;
    }
    default:
  }
}

/* ---------- Prize Machine reward sounds ----------
   Played on the current language's own signature instrument and scale (guzheng pentatonic in Chinese,
   sitar in Hindi, ney flute in Arabic, flamenco guitar in Spanish, gamelan in Indonesian, mbira in Swahili…),
   so every language's prize machine sounds different.
   crank: ratchet clicks + rising run · drop: capsule bounces into the tray · pop: capsule cracks open +
   sparkle · land: points land in the counter · rank: rank-up fanfare · tick: LED counter roll */
export function reward(kind, code = 'en') {
  if (!live() || !audio()) return;
  const [inst, scName, root, degs, , o] = signatureFor(code);
  const scale = S[scName], f0 = INST[inst], t = ctx.currentTime + 0.02;
  const click = (tt, v = 0.25, f = 2400) => {
    const n = ctx.createBufferSource(); n.buffer = noise();
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 4;
    const g = ctx.createGain(); env(g, tt, 0.001, v, 0.035); n.connect(bp).connect(g).connect(out); n.start(tt); n.stop(tt + 0.06);
  };
  switch (kind) {
    case 'crank':
      for (let i = 0; i < 8; i++) click(t + i * 0.075, 0.22, 1800 + i * 120);
      [0, 1, 2, 3, 4].forEach((d, i) => f0(deg(scale, root, d), t + 0.1 + i * 0.11, 0.55, o));
      break;
    case 'drop':
      [0, 0.22, 0.38, 0.48].forEach((dt, i) => { INST.marimba(deg(scale, root - 12, 4 - i), t + dt, 0.7 - i * 0.15); click(t + dt, 0.12, 900); });
      break;
    case 'pop': {
      const n = ctx.createBufferSource(); n.buffer = noise();
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1200;
      const g = ctx.createGain(); env(g, t, 0.002, 0.35, 0.12); n.connect(hp).connect(g).connect(out); n.start(t); n.stop(t + 0.2);
      [0, 2, 4, 7, 9].forEach((d, i) => f0(deg(scale, root, d + 2), t + 0.05 + i * 0.06, 0.7, o));
      INST.glock(deg(scale, root + 12, 4), t + 0.4, 0.5);
      break;
    }
    case 'land': f0(deg(scale, root, 4), t, 0.8, o); f0(deg(scale, root, 7), t + 0.08, 0.9, o); INST.glock(deg(scale, root + 12, 2), t + 0.12, 0.35); break;
    case 'tick': INST.chip(deg(scale, root + 12, degs[0] || 0), t, 0.5); break;
    case 'rank':
      if (o.drone) INST.pad(hz(root - 12), t, 1.4);
      degs.forEach((d, i) => f0(deg(scale, root, d), t + i * 0.08, 0.9, o));
      [0, 2, 4].forEach((d) => f0(deg(scale, root + 12, d), t + degs.length * 0.08 + 0.05, 0.7, o));
      [72, 76, 79].forEach((m) => INST.brass(hz(m), t + degs.length * 0.08 + 0.05, 0.45));
      break;
    default:
  }
}

/* ---------- a sound on every click ----------
   tap(code, i, kind): every answer option, chip, list item and button plays one note of the current language's
   own scale on its own instrument (koto-like pluck for Japanese, sitar for Hindi, gamelan for Indonesian…).
   Option i plays scale degree i, so a list of answers is a little melody; selecting climbs, unselecting falls.
   kinds: 'pick' (choose an answer), 'unpick' (remove one), 'press' (any other button), 'soft' (tabs, filters). */
let lastTap = 0;
export function tap(code = 'en', i = 0, kind = 'pick') {
  if (!live() || !audio()) return;
  const now = ctx.currentTime;
  if (now - lastTap < 0.035) return; // one click = one note, even when two handlers fire
  lastTap = now;
  const [inst, scName, root, , , o] = signatureFor(code);
  const scale = S[scName], t = now + 0.005;
  const f = INST[inst] || INST.marimba;
  if (kind === 'pick') { f(deg(scale, root, 2 + (i % 7)), t, 0.55, o); INST.glock(deg(scale, root + 12, 2 + (i % 7)), t + 0.045, 0.16); }
  else if (kind === 'unpick') f(deg(scale, root, 1 - (i % 3)), t, 0.4, o);
  else if (kind === 'soft') INST.marimba(deg(scale, root + 12, i % 5), t, 0.28);
  else { f(deg(scale, root, 4), t, 0.4, o); }
}

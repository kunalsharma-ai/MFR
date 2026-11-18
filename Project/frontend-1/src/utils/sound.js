// Sounds synthesised with the Web Audio API — no audio file to download.
// Browsers only allow sound after the visitor interacts with the page, so the welcome chime on opening the
// website plays on the visitor's first tap / click / key press of every page load. The review screen chimes when it
// appears (once sound is allowed) and plays a fanfare on publish; the chat pops when opened. Visitors can mute all of
// it from the chat header or the review screen (remembered on this device).
import { store } from './storage.js';

let ctx = null;
const getCtx = () => {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
};

export const soundOn = () => store.get('mfr_sound', 'on') !== 'off';
export const SOUND_EVENT = 'mfr:sound';
// Every on/off switch (footer, chat, review screen) shares this setting and hears about changes through SOUND_EVENT.
export const setSound = (on) => {
  store.set('mfr_sound', on ? 'on' : 'off');
  try { window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: { on } })); } catch { /* ignore */ }
};

// A soft, bubbly pop: quick pitch drop + a tiny sparkle overtone.
export function pop({ volume = 0.22, pitch = 1 } = {}) {
  if (!soundOn()) return;
  try {
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    const t = c.currentTime + 0.01;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volume, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    if (c.state === 'running') out(c, g, 0.35); else g.connect(c.destination); // water-drop bubble with a little room
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(620 * pitch, t);
    o.frequency.exponentialRampToValueAtTime(1180 * pitch, t + 0.05);
    o.frequency.exponentialRampToValueAtTime(240 * pitch, t + 0.17);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.2);
    const s = c.createOscillator();
    const sg = c.createGain();
    s.type = 'triangle';
    s.frequency.setValueAtTime(2100 * pitch, t + 0.04);
    sg.gain.setValueAtTime(0.0001, t + 0.04);
    sg.gain.exponentialRampToValueAtTime(volume * 0.25, t + 0.05);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    s.connect(sg).connect(c.destination);
    s.start(t + 0.04);
    s.stop(t + 0.13);
  } catch {
    /* audio unavailable — stay silent */
  }
}


// let welcomed = false;
// A bright notification chime: three quick bell notes rising (C6 · E6 · G6) with a soft shimmer.
// `fanfare` adds a fourth, higher note for "review published".
function bell(c, t, freq, volume, len = 0.55) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  g.connect(c.destination);
  const o = c.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(freq, t);
  o.connect(g);
  o.start(t);
  o.stop(t + len + 0.02);
  const h = c.createOscillator(); // shimmer overtone
  const hg = c.createGain();
  h.type = 'sine';
  h.frequency.setValueAtTime(freq * 2.01, t);
  hg.gain.setValueAtTime(0.0001, t);
  hg.gain.exponentialRampToValueAtTime(volume * 0.3, t + 0.01);
  hg.gain.exponentialRampToValueAtTime(0.0001, t + len * 0.6);
  h.connect(hg).connect(c.destination);
  h.start(t);
  h.stop(t + len);
}
// Review screen: a harp sparkle (quick rising glissando) that ends on bell notes. `notes` are the closing bells.
export function chime({ volume = 0.16, notes = [1046.5, 1318.5, 1568] } = {}) {
  if (!soundOn()) return;
  try {
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    if (c.state !== 'running') return; // browser has not allowed sound yet (no interaction) — stay silent
    const t = c.currentTime + 0.02;
    [523.25, 659.25, 783.99, 987.77].forEach((f, i) => pluck(c, t + i * 0.035, f, volume * 0.35, 0.6));
    notes.forEach((f, i) => bell(c, t + 0.16 + i * 0.09, f, volume * (1 - i * 0.12)));
  } catch {
    /* audio unavailable — stay silent */
  }
}
// Review published: a short brass fanfare (two chords) crowned with bells.
export function fanfare() {
  try {
    const c = ready();
    if (!c) return;
    const t = c.currentTime + 0.02;
    pad(c, t, [392, 493.88, 587.33], { vol: 0.06, len: 0.28, from: 900, to: 3000, space: 0.3 });
    pad(c, t + 0.26, [523.25, 659.25, 783.99, 1046.5], { vol: 0.07, len: 1.1, from: 900, to: 3600, space: 0.5 });
    [1046.5, 1318.5, 1568, 2093].forEach((f, i) => bell(c, t + 0.3 + i * 0.08, f, 0.1 * (1 - i * 0.12)));
  } catch { /* stay silent */ }
}
export const audioReady = () => Boolean(ctx && ctx.state === 'running');
const WELCOME = [
  { root: 523.25, steps: [0, 4, 7, 12, 16] }, // C major sparkle
  { root: 587.33, steps: [0, 2, 7, 9, 14] }, // D pentatonic
  { root: 466.16, steps: [0, 7, 4, 12, 19] }, // B♭ wide leap
  { root: 440.0, steps: [0, 4, 11, 7, 16] }, // A major-seventh shimmer
];
const hz = (root, st) => root * 2 ** (st / 12);
function mallet(c, out, t, freq, vol, len = 0.6) {
  // two-operator FM: a woody attack that melts into a clear bell
  const car = c.createOscillator();
  const mod = c.createOscillator();
  const mg = c.createGain();
  const g = c.createGain();
  car.type = 'sine';
  mod.type = 'sine';
  car.frequency.setValueAtTime(freq, t);
  mod.frequency.setValueAtTime(freq * 3.5, t);
  mg.gain.setValueAtTime(freq * 1.6, t);
  mg.gain.exponentialRampToValueAtTime(1, t + 0.18);
  mod.connect(mg).connect(car.frequency);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  car.connect(g).connect(out);
  car.start(t); mod.start(t);
  car.stop(t + len + 0.05); mod.stop(t + len + 0.05);
}
function swell(c, out, t, freq, vol) {
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(400, t);
  f.frequency.exponentialRampToValueAtTime(2600, t + 0.5);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.25);
  f.connect(g).connect(out);
  [-7, 7].forEach((cents) => {
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(freq, t);
    o.detune.setValueAtTime(cents, t);
    o.connect(f);
    o.start(t);
    o.stop(t + 1.3);
  });
}
export function welcomeSound({ volume = 0.15 } = {}) {
  if (!soundOn()) return;
  try {
    const c = getCtx();
    if (!c || c.state !== 'running') return;
    let k = 0;
    try { k = (Number(localStorage.getItem('mfr_welcome_v')) + 1) % WELCOME.length || 0; localStorage.setItem('mfr_welcome_v', String(k)); } catch { k = Math.floor(Math.random() * WELCOME.length); }
    const v = WELCOME[k];
    const out = c.createDynamicsCompressor();
    const master = c.createGain();
    master.gain.value = 1;
    out.connect(master).connect(c.destination);
    const t = c.currentTime + 0.03;
    swell(c, out, t, hz(v.root, -12), volume * 0.18);
    v.steps.forEach((st, i) => mallet(c, out, t + 0.06 + i * 0.085, hz(v.root, st), volume * (0.9 - i * 0.08), 0.5 + i * 0.08));
    // coin sparkle: two quick high pings at the end
    bell(c, t + 0.06 + v.steps.length * 0.085 + 0.02, hz(v.root, 31), volume * 0.35, 0.35);
    bell(c, t + 0.06 + v.steps.length * 0.085 + 0.09, hz(v.root, 36), volume * 0.28, 0.45);
  } catch {
    /* audio unavailable — stay silent */
  }
}

let welcomed = false;
export function welcomePop() {
  if (typeof window === 'undefined' || welcomed) return () => {};
  const evs = ['pointerdown', 'keydown', 'touchstart'];
  const off = () => evs.forEach((e) => window.removeEventListener(e, fire, true));
  function fire() {
    off();
    if (welcomed) return;
    welcomed = true;
    const c = getCtx();
    if (c && c.state === 'suspended') c.resume().then(() => welcomeSound()).catch(() => {});
    else welcomeSound();
  }
  evs.forEach((e) => window.addEventListener(e, fire, { capture: true, passive: true }));
  // If the browser already allows sound for this site, play straight away as the page opens.
  const early = setTimeout(() => {
    if (welcomed || !soundOn()) return;
    // Without a user gesture Chrome refuses to start an AudioContext and logs a console warning on every page load,
    // which audit tools report as a JavaScript error. Only try early when the visitor has already interacted.
    if (!navigator.userActivation || !navigator.userActivation.hasBeenActive) return;
    const c = getCtx();
    if (!c) return;
    const tryNow = () => { if (!welcomed && c.state === 'running') { welcomed = true; off(); welcomeSound(); } };
    if (c.state === 'running') tryNow();
    else c.resume().then(tryNow).catch(() => {});
  }, 700);
  return () => { off(); clearTimeout(early); };
}
 

/** A language sound is about to play — skip the welcome chime so the two never overlap. */
export function skipWelcome() {
  welcomed = true;
}
 

// ── v3.0 sound effects ─────────────────────────────────────────────────────────────────────────────
// Every effect has its own character so the site never sounds samey: a water-drop chat bubble, a harp sparkle for
// the review screen, brass for "published", a ratchet + jackpot for the spin wheel, a cash-register "ka-ching" for
// rewards, nightfall vs sunrise for the theme switch, coins vs a gold chord for the hero switch, a film-reel "play"
// for videos and a gem tap for the main buttons. All share one bus with a soft room reverb, respect the on/off
// switch and stay silent until the browser allows audio (after a click / tap / key).
const ready = () => {
  if (!soundOn()) return null;
  const c = getCtx();
  if (!c) return null;
  if (c.state === 'suspended') c.resume();
  return c.state === 'running' ? c : null;
};
let bus = null;
// dry + reverb mix with a gentle compressor so stacked notes never clip
function getBus(c) {
  if (bus && bus.c === c) return bus;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -16; comp.ratio.value = 4;
  comp.connect(c.destination);
  const dry = c.createGain(); dry.gain.value = 1; dry.connect(comp);
  const verb = c.createConvolver();
  const len = Math.floor(c.sampleRate * 1.8);
  const ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let k = 0; k < len; k++) d[k] = (Math.random() * 2 - 1) * (1 - k / len) ** 3; }
  verb.buffer = ir;
  const wet = c.createGain(); wet.gain.value = 0.32;
  verb.connect(wet).connect(comp);
  bus = { c, dry, verb };
  return bus;
}
// route a node to the bus; `space` 0..1 sets how much reverb it gets
function out(c, node, space = 0.3) {
  const b = getBus(c);
  node.connect(b.dry);
  if (space > 0) { const s = c.createGain(); s.gain.value = space; node.connect(s).connect(b.verb); }
}
function tone(c, t, { f = 440, f2 = null, type = 'sine', vol = 0.12, len = 0.2, attack = 0.008, space = 0.25, glide = null }) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  out(c, g, space);
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + (glide || len));
  o.connect(g);
  o.start(t);
  o.stop(t + len + 0.03);
}
let noiseBuf = null;
function noise(c, t, { len = 0.2, vol = 0.1, type = 'bandpass', f = 1000, f2 = null, q = 1, attack = 0.005, space = 0.2 }) {
  if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let k = 0; k < d.length; k++) d[k] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const fl = c.createBiquadFilter();
  fl.type = type; fl.Q.value = q;
  fl.frequency.setValueAtTime(f, t);
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + len);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  src.connect(fl).connect(g);
  out(c, g, space);
  src.start(t, Math.random() * 0.5);
  src.stop(t + len + 0.02);
}
// metallic ring: inharmonic partials, like a coin or a small bell
function ring(c, t, f, vol, len = 0.6, space = 0.35) {
  [[1, 1], [2.76, 0.45], [5.4, 0.25], [8.93, 0.12]].forEach(([m, a]) => tone(c, t, { f: f * m, vol: vol * a, len: len / (1 + m * 0.15), attack: 0.002, space }));
}
// plucked harp string: a fast-decaying triangle with a sine octave
function pluck(c, t, f, vol, len = 0.9, space = 0.5) {
  tone(c, t, { f, type: 'triangle', vol, len, attack: 0.004, space });
  tone(c, t, { f: f * 2, vol: vol * 0.35, len: len * 0.5, attack: 0.004, space });
}
// warm pad: detuned saws through a moving low-pass
function pad(c, t, freqs, { vol = 0.05, len = 1.2, from = 500, to = 2200, space = 0.6 } = {}) {
  const fl = c.createBiquadFilter();
  fl.type = 'lowpass';
  fl.frequency.setValueAtTime(from, t);
  fl.frequency.exponentialRampToValueAtTime(to, t + len * 0.6);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + len * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  fl.connect(g);
  out(c, g, space);
  freqs.forEach((f) => [-8, 8].forEach((cents) => {
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f, t);
    o.detune.setValueAtTime(cents, t);
    o.connect(fl);
    o.start(t);
    o.stop(t + len + 0.05);
  }));
}
const play = (fn) => { try { const c = ready(); if (c) fn(c, c.currentTime + 0.02); } catch { /* stay silent */ } };

// Prize wheel: a whoosh, a ratchet that slows like a real pointer, then a jackpot arpeggio with coins.
export function spinSound(duration = 3.6) {
  play((c, t0) => {
    noise(c, t0, { len: 0.5, vol: 0.12, f: 400, f2: 3000, q: 0.8, attack: 0.08 });
    let t = 0.1;
    let gap = 0.042;
    while (t < duration - 0.25) {
      noise(c, t0 + t, { len: 0.035, vol: 0.16, type: 'highpass', f: 2600, q: 0.7, attack: 0.001, space: 0.05 });
      tone(c, t0 + t, { f: 1150, f2: 700, type: 'square', vol: 0.018, len: 0.025, attack: 0.001, space: 0 });
      t += gap;
      gap *= 1.075;
    }
    const w = t0 + duration;
    [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568].forEach((f, i) => pluck(c, w + i * 0.06, f, 0.08, 0.7));
    [0, 0.09, 0.15, 0.24].forEach((d, i) => ring(c, w + 0.4 + d, 2400 + i * 260, 0.035, 0.5));
  });
}

// Theme switch. Dark = "nightfall": a falling pad, a breath of wind and crystal stars twinkling in.
// Light = "sunrise": a warm swelling chord, a rising harp glissando and two bird-like chirps.
export function themeSound(dark) {
  play((c, t) => {
    if (dark) {
      pad(c, t, [220, 277.18, 329.63], { vol: 0.045, len: 1.6, from: 1800, to: 300 });
      tone(c, t, { f: 880, f2: 196, type: 'sine', vol: 0.07, len: 0.9, attack: 0.03, space: 0.5 });
      noise(c, t, { len: 1.1, vol: 0.05, f: 1800, f2: 300, q: 0.6, attack: 0.25, space: 0.6 });
      [2349.3, 3135.9, 2637, 3520, 2793.8].forEach((f, i) => tone(c, t + 0.45 + i * 0.13, { f, vol: 0.035, len: 0.6, attack: 0.004, space: 0.9 }));
    } else {
      pad(c, t, [261.63, 329.63, 392, 493.88], { vol: 0.04, len: 1.3, from: 300, to: 3200 });
      [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.7, 1318.5].forEach((f, i) => pluck(c, t + 0.05 + i * 0.045, f, 0.06 * (1 - i * 0.05), 0.8));
      [0.55, 0.68].forEach((d) => tone(c, t + d, { f: 2800, f2: 4200, vol: 0.03, len: 0.09, attack: 0.004, space: 0.3 }));
    }
  });
}

// Reward toast: a cash-register "ka-ching" — drawer thunk, then the bell.
export function coinSound() {
  play((c, t) => {
    noise(c, t, { len: 0.08, vol: 0.12, type: 'lowpass', f: 900, attack: 0.002, space: 0.05 });
    tone(c, t, { f: 160, f2: 70, vol: 0.08, len: 0.12, attack: 0.002, space: 0 });
    noise(c, t + 0.06, { len: 0.05, vol: 0.06, type: 'highpass', f: 5000, attack: 0.001, space: 0 });
    ring(c, t + 0.09, 2093, 0.06, 0.9);
    ring(c, t + 0.15, 2637, 0.04, 0.8);
  });
}

// Sound switch turned on: a little two-step "power up".
export function tick() {
  play((c, t) => {
    tone(c, t, { f: 660, f2: 990, type: 'triangle', vol: 0.06, len: 0.08, attack: 0.003, space: 0.15 });
    tone(c, t + 0.08, { f: 990, f2: 1480, type: 'triangle', vol: 0.06, len: 0.12, attack: 0.003, space: 0.3 });
  });
}

// Hero audience switch. Consumer: a bright handful of coins. Professional: a deep gold chord with a single "ting".
export function segSound(pro) {
  play((c, t) => {
    if (pro) {
      pad(c, t, [130.81, 196, 246.94], { vol: 0.05, len: 0.9, from: 400, to: 1400, space: 0.5 });
      tone(c, t, { f: 98, vol: 0.08, len: 0.5, attack: 0.01, space: 0.2 });
      ring(c, t + 0.12, 1568, 0.05, 1.1, 0.6);
    } else {
      [0, 0.05, 0.11, 0.14, 0.2].forEach((d, i) => ring(c, t + d, 2600 + ((i * 337) % 900), 0.035, 0.35, 0.2));
      pluck(c, t + 0.22, 1318.5, 0.05, 0.5);
    }
  });
}

// Video buttons: a film-reel flutter and a soft "ta-dum".
export function playSound() {
  play((c, t) => {
    for (let k = 0; k < 6; k++) noise(c, t + k * 0.03, { len: 0.02, vol: 0.05, type: 'bandpass', f: 1800, q: 4, attack: 0.001, space: 0 });
    tone(c, t + 0.2, { f: 392, type: 'triangle', vol: 0.08, len: 0.25, attack: 0.004, space: 0.3 });
    tone(c, t + 0.32, { f: 587.33, type: 'triangle', vol: 0.09, len: 0.5, attack: 0.004, space: 0.5 });
  });
}

// Main call-to-action buttons: a crisp gem tap with a sparkle.
export function tapSound() {
  play((c, t) => {
    tone(c, t, { f: 1800, f2: 1200, type: 'sine', vol: 0.05, len: 0.07, attack: 0.002, space: 0.1 });
    tone(c, t + 0.03, { f: 3520, vol: 0.025, len: 0.25, attack: 0.002, space: 0.5 });
  });
}

// Menu dropdown opening: a short airy swish upwards.
export function swishSound() {
  play((c, t) => {
    noise(c, t, { len: 0.18, vol: 0.05, f: 900, f2: 4200, q: 1.2, attack: 0.04, space: 0.2 });
    tone(c, t + 0.06, { f: 1046.5, f2: 1568, vol: 0.025, len: 0.14, attack: 0.01, space: 0.3 });
  });
}

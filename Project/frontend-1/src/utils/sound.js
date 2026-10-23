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
export const setSound = (on) => store.set('mfr_sound', on ? 'on' : 'off');

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
    g.connect(c.destination);
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
export function chime({ volume = 0.16, notes = [1046.5, 1318.5, 1568] } = {}) {
  if (!soundOn()) return;
  try {
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    if (c.state !== 'running') return; // browser has not allowed sound yet (no interaction) — stay silent
    const t = c.currentTime + 0.02;
    notes.forEach((f, i) => bell(c, t + i * 0.09, f, volume * (1 - i * 0.12)));
  } catch {
    /* audio unavailable — stay silent */
  }
}
export const fanfare = () => chime({ volume: 0.18, notes: [784, 1046.5, 1318.5, 2093] });
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
 
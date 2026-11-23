"use client";
// Small synthesised sounds (Web Audio, no files). Played only when the member has sound on, only after a user
// gesture (browsers block audio before one), and never on page load or while reduced motion is requested.

let ctx = null;
const audio = () => {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
};

function prefs() {
  try {
    return { sound: true, soundNotify: true, ...JSON.parse(localStorage.getItem("mfr.hub.prefs") || "{}") };
  } catch (e) {
    return { sound: true, soundNotify: true };
  }
}

function tone(freq, start, dur, type = "sine", gain = 0.06) {
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime + start);
  g.gain.setValueAtTime(0, a.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start);
  o.stop(a.currentTime + start + dur + 0.05);
}

const SOUNDS = {
  // a reward was earned / counted
  reward: () => [880, 1175, 1568].forEach((f, i) => tone(f, i * 0.07, 0.35, "triangle", 0.05)),
  // something finished or was saved
  complete: () => [660, 990].forEach((f, i) => tone(f, i * 0.09, 0.28, "sine", 0.06)),
  // an achievement / milestone
  achievement: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.5, "triangle", 0.045)),
  // important notification
  notify: () => [1046, 784].forEach((f, i) => tone(f, i * 0.12, 0.25, "sine", 0.05)),
  // soft tap for toggles
  tap: () => tone(1400, 0, 0.06, "sine", 0.025),
};

export function play(name) {
  const p = prefs();
  if (!p.sound) return;
  if (name === "notify" && !p.soundNotify) return;
  try {
    SOUNDS[name]?.();
  } catch (e) {
    /* audio not available */
  }
}

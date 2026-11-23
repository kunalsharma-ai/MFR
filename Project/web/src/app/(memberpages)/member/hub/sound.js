"use client";
// Small synthesised sounds (Web Audio, no files). Three categories the member can switch separately in Settings:
//   reward       – reward, achievement, milestone, level up
//   notification – notify, warning
//   interaction  – tap, complete, error
// Played only when the master switch and the category are on, only after a user gesture (browsers block audio before
// one), and never on page load.

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
    return { sound: true, soundNotify: true, soundUi: true, soundReward: true, ...JSON.parse(localStorage.getItem("mfr.hub.prefs") || "{}") };
  } catch (e) {
    return { sound: true, soundNotify: true, soundUi: true, soundReward: true };
  }
}

function tone(freq, start, dur, type = "sine", gain = 0.06, slide = 0) {
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime + start);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, a.currentTime + start + dur);
  g.gain.setValueAtTime(0, a.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start);
  o.stop(a.currentTime + start + dur + 0.05);
}

const SOUNDS = {
  reward: { cat: "soundReward", play: () => [880, 1175, 1568].forEach((f, i) => tone(f, i * 0.07, 0.35, "triangle", 0.05)) },
  achievement: { cat: "soundReward", play: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.5, "triangle", 0.045)) },
  milestone: { cat: "soundReward", play: () => { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.06, 0.6, "triangle", 0.04)); tone(1568, 0.36, 0.7, "sine", 0.03); } },
  levelup: { cat: "soundReward", play: () => tone(440, 0, 0.45, "sawtooth", 0.025, 2.2) },
  notify: { cat: "soundNotify", play: () => [1046, 784].forEach((f, i) => tone(f, i * 0.12, 0.25, "sine", 0.05)) },
  warning: { cat: "soundNotify", play: () => [520, 440].forEach((f, i) => tone(f, i * 0.14, 0.22, "square", 0.025)) },
  complete: { cat: "soundUi", play: () => [660, 990].forEach((f, i) => tone(f, i * 0.09, 0.28, "sine", 0.06)) },
  tap: { cat: "soundUi", play: () => tone(1400, 0, 0.06, "sine", 0.025) },
  error: { cat: "soundUi", play: () => tone(300, 0, 0.25, "triangle", 0.05, 0.6) },
};

export const SOUND_CATEGORIES = [
  { key: "soundReward", sample: "achievement" },
  { key: "soundNotify", sample: "notify" },
  { key: "soundUi", sample: "complete" },
];

export function play(name, { force = false } = {}) {
  const p = prefs();
  const s = SOUNDS[name];
  if (!s) return;
  if (!force && (!p.sound || p[s.cat] === false)) return;
  try {
    s.play();
  } catch (e) {
    /* audio not available */
  }
}

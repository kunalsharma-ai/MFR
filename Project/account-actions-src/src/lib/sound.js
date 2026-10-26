// Tiny Web Audio synth: every sound is generated in code (no audio files to host).
// Audio starts only after the first user gesture (browser autoplay rules) and never throws.

let ctx = null;
let master = null;
let enabled = true;
let lastAt = 0;
let lastName = '';

function ensure() {
  if (!enabled) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.2;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function tone(f, t, d, { type = 'sine', g = 0.5, a = 0.008, to = null, lp = null } = {}) {
  const os = ctx.createOscillator();
  const gn = ctx.createGain();
  let node = os;
  os.type = type;
  os.frequency.setValueAtTime(f, t);
  if (to) os.frequency.exponentialRampToValueAtTime(to, t + d);
  if (lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; os.connect(fl); node = fl; }
  node.connect(gn); gn.connect(master);
  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.linearRampToValueAtTime(g, t + a);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + d);
  os.start(t); os.stop(t + d + 0.05);
}

function noise(t, d, g = 0.15, lp = 2000) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * d));
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = b.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ctx.createBufferSource(); const f = ctx.createBiquadFilter(); const gn = ctx.createGain();
  s.buffer = b; f.type = 'lowpass'; f.frequency.value = lp; gn.gain.value = g;
  s.connect(f); f.connect(gn); gn.connect(master); s.start(t);
}

const arp = (notes, t, step, o) => notes.forEach((f, i) => tone(f, t + i * step, o.d ?? 0.4, o));

const PATCHES = {
  // generic UI
  tap:    (t) => tone(1400, t, 0.04, { g: 0.06, type: 'triangle' }),
  tick:   (t) => { tone(1800, t, 0.05, { g: 0.13 }); tone(2700, t, 0.03, { g: 0.04 }); },
  tab:    (t) => tone(1100, t, 0.07, { g: 0.12, type: 'triangle', to: 1500 }),
  toggle: (t) => { tone(900, t, 0.06, { g: 0.12, type: 'triangle' }); tone(1350, t + 0.05, 0.08, { g: 0.1, type: 'triangle' }); },
  check:  (t) => { tone(1200, t, 0.06, { g: 0.12, type: 'triangle' }); tone(1800, t + 0.04, 0.09, { g: 0.1 }); },
  open:   (t) => { noise(t, 0.25, 0.08, 1800); tone(500, t, 0.25, { g: 0.08, to: 900 }); },
  close:  (t) => { noise(t, 0.2, 0.06, 1200); tone(800, t, 0.18, { g: 0.07, to: 450 }); },
  next:   (t) => { noise(t, 0.3, 0.09, 1500); tone(660, t, 0.12, { g: 0.12, type: 'triangle' }); tone(990, t + 0.07, 0.16, { g: 0.1, type: 'triangle' }); },
  back:   (t) => { tone(990, t, 0.1, { g: 0.1, type: 'triangle' }); tone(660, t + 0.06, 0.14, { g: 0.1, type: 'triangle' }); },
  ok:     (t) => { tone(880, t, 0.12, { type: 'triangle', g: 0.22 }); tone(1320, t + 0.08, 0.2, { type: 'triangle', g: 0.2 }); },
  error:  (t) => { tone(240, t, 0.16, { type: 'sawtooth', g: 0.16, lp: 900 }); tone(180, t + 0.14, 0.22, { type: 'sawtooth', g: 0.16, lp: 700 }); },
  copy:   (t) => { tone(1500, t, 0.05, { g: 0.12 }); tone(2000, t + 0.05, 0.08, { g: 0.1 }); },
  themeDark:  (t) => arp([880, 660, 440], t, 0.06, { g: 0.12, type: 'sine', d: 0.3 }),
  themeLight: (t) => arp([440, 660, 880, 1320], t, 0.05, { g: 0.12, type: 'triangle', d: 0.25 }),
  // option signatures: "sel-*" when chosen, "done-*" when the request is created / completed
  'sel-d30':   (t) => arp([1046, 1318, 1568], t, 0.06, { type: 'triangle', g: 0.2, d: 0.35 }),
  'done-d30':  (t) => { arp([523, 659, 784, 1046, 1318], t, 0.09, { type: 'triangle', g: 0.22, d: 0.7 }); noise(t + 0.45, 0.5, 0.06, 6000); },
  'sel-d60':   (t) => [880, 660, 990].forEach((f, i) => tone(f, t + i * 0.09, 0.25, { g: 0.26, to: f * 0.6 })),
  'done-d60':  (t) => [588, 784, 988, 1176, 1482, 1762].forEach((f, i) => tone(f, t + i * 0.1, 0.4, { g: 0.22, to: f * 1.1 })),
  'sel-d90':   (t) => { [220, 277, 330].forEach((f) => tone(f, t, 1, { type: 'sawtooth', g: 0.06, a: 0.25, lp: 1200 })); tone(1760, t + 0.2, 0.8, { g: 0.05 }); },
  'done-d90':  (t) => { [220, 277, 330, 415].forEach((f) => tone(f, t, 2, { type: 'sawtooth', g: 0.06, a: 0.4, lp: 1500 })); arp([1760, 2093, 2637], t + 0.5, 0.2, { g: 0.06, d: 1 }); },
  'sel-hold':  (t) => [1568, 2349, 3136].forEach((f, i) => tone(f, t + i * 0.02, 0.9, { g: 0.09 / (i + 1) })),
  'done-hold': (t) => [1568, 1976, 2349, 2794].forEach((f, i) => { tone(f, t + i * 0.16, 1.1, { g: 0.11 }); tone(f * 2.76, t + i * 0.16, 0.5, { g: 0.025 }); }),
  'sel-del':   (t) => tone(196, t, 0.5, { g: 0.28, to: 147, lp: 800 }),
  'done-del':  (t) => { tone(262, t, 0.9, { g: 0.22, lp: 1200 }); tone(196, t + 0.3, 1.1, { g: 0.22, lp: 900 }); noise(t + 0.2, 0.8, 0.04, 600); },
  'sel-react': (t) => arp([392, 494, 587, 784], t, 0.05, { type: 'square', g: 0.06, lp: 2400, d: 0.3 }),
  'done-react':(t) => { arp([392, 494, 587, 784, 988, 1175, 1568], t, 0.07, { type: 'square', g: 0.06, lp: 3000, d: 0.5 }); noise(t + 0.5, 0.4, 0.08, 8000); },
};

export const sound = {
  get enabled() { return enabled; },
  setEnabled(v) { enabled = !!v; },
  /** Unlocks audio on the first gesture so the first click is not silent on iOS. */
  unlock() { ensure(); },
  play(name = 'tick') {
    const now = performance.now();
    // De-duplicate: a <label> click fires twice (label + input); also stops stacked identical sounds.
    if (name === lastName && now - lastAt < 60) return;
    lastAt = now; lastName = name;
    const c = ensure(); if (!c) return;
    const p = PATCHES[name] || PATCHES.tick;
    try { p(c.currentTime + 0.005); } catch { /* ignore audio errors */ }
  },
  names: Object.keys(PATCHES),
};

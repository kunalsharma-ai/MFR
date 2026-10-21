// One sound switch shared with the main MyFrequentRewards website (localStorage "mfr_sound", JSON "on" / "off").
const KEY = 'mfr_sound';
let memory = null; // fallback when storage is blocked
export function isSoundEnabled() {
  try {
    const v = window.localStorage.getItem(KEY);
    if (v == null) return memory !== false;
    return JSON.parse(v) !== 'off';
  } catch {
    return memory !== false;
  }
}
export function setSoundEnabled(on) {
  memory = !!on;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(on ? 'on' : 'off'));
  } catch {
    /* blocked storage: remembered for this visit */
  }
}

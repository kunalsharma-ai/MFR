
const QUIET_MS = 9000;
let calm = false;
let timer = 0;

export const isCalm = () => calm;

export function startCalm() {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const sleep = () => {
    // keep moving while a dialog is open — someone is clearly reading it
    if (document.querySelector('.rw-veil, .hc.is-open')) { arm(); return; }
    calm = true;
    root.classList.add('calm');
  };
  const arm = () => { clearTimeout(timer); timer = setTimeout(sleep, QUIET_MS); };
  const wake = () => {
    if (calm) {
      calm = false;
      root.classList.remove('calm');
      window.dispatchEvent(new Event('mfr:wake'));
    }
    arm();
  };
  ['pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'].forEach((t) => window.addEventListener(t, wake, { passive: true }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  arm();
}

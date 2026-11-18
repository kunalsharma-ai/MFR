import { useEffect, useState } from 'react';
import { getMode, MODE_EVENT, setMode } from '../../utils/theme.js';

// Dark / light switch (v3.0): a day-sky pill with a sun that rolls across and turns into a crescent moon over a
// starry night. Switching plays a sound and reveals the new mode in a circle that grows from the switch.
export default function ThemeToggle({ className = '', labels = false }) {
  const [mode, setM] = useState('light');
  useEffect(() => {
    setM(getMode());
    const sync = (e) => setM(e.detail.mode);
    window.addEventListener(MODE_EVENT, sync);
    return () => window.removeEventListener(MODE_EVENT, sync);
  }, []);
  const dark = mode === 'dark';
  const flip = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMode(dark ? 'light' : 'dark', { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };
  const pick = (m) => (e) => {
    if (m === mode) return;
    const r = e.currentTarget.parentElement.querySelector('.thm-tg').getBoundingClientRect();
    setMode(m, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };
  const sw = (
    <button type="button" className={`thm-tg${dark ? ' is-dark' : ''} ${className}`} onClick={flip} role="switch" aria-checked={dark} aria-label="Dark mode">
      <span className="thm-sky" aria-hidden="true">
        <i className="thm-cloud c1" /><i className="thm-cloud c2" />
        {[0, 1, 2, 3, 4].map((k) => <i key={k} className="thm-star" style={{ '--k': k }} />)}
      </span>
      <span className="thm-knob" aria-hidden="true"><i className="thm-crater" /><i className="thm-crater c2" /></span>
      <span className="thm-txt">{dark ? 'Dark' : 'Light'}</span>
    </button>
  );
  if (!labels) return sw;
  // Footer version: clickable "Light" and "Dark" labels on both sides so the choice is obvious.
  return (
    <span className="thm-pick">
      <button type="button" className={`thm-opt${dark ? '' : ' is-on'}`} onClick={pick('light')} aria-pressed={!dark}><span aria-hidden="true">☀️</span> Light mode</button>
      {sw}
      <button type="button" className={`thm-opt${dark ? ' is-on' : ''}`} onClick={pick('dark')} aria-pressed={dark}>Dark mode <span aria-hidden="true">🌙</span></button>
    </span>
  );
}

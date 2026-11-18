import { useEffect, useState } from 'react';
import { getMode, MODE_EVENT, setMode } from '../../utils/theme.js';

// Dark / light switch (v3.0): a day-sky pill with a sun that rolls across and turns into a crescent moon over a
// starry night. Switching plays a sound and reveals the new mode in a circle that grows from the switch.
export default function ThemeToggle({ className = '' }) {
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
  return (
    <button type="button" className={`thm-tg${dark ? ' is-dark' : ''} ${className}`} onClick={flip} role="switch" aria-checked={dark} aria-label="Dark mode">
      <span className="thm-sky" aria-hidden="true">
        <i className="thm-cloud c1" /><i className="thm-cloud c2" />
        {[0, 1, 2, 3, 4].map((k) => <i key={k} className="thm-star" style={{ '--k': k }} />)}
      </span>
      <span className="thm-knob" aria-hidden="true"><i className="thm-crater" /><i className="thm-crater c2" /></span>
      <span className="thm-txt">{dark ? 'Dark' : 'Light'}</span>
    </button>
  );
}

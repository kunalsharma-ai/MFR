import { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { segSound } from '../utils/sound.js';

// Consumer / Professional switch for Log in and Create account. The page around it re-colours itself
// (v30-audience.css: a second colour layer fades in, and a light burst spreads from the switch).
// Only transform and opacity animate.
const OPTS = [
  ['consumer', 'Consumer', 'user'],
  ['professional', 'Professional', 'briefcase'],
  ['minor', 'Teen', 'rocket'], // v3.3: the teen panel (Galaxy Pop colours, v32-minor.css)
];

// Teens have their own Log in and Create account pages (?type=teen); Consumers and Professionals keep the original
// pages. On those pages (`teenPage` false) picking Teen opens the teen page, and on the teen page (`teenPage`)
// picking Consumer or Professional goes back to the original page.
export default function AudienceSwitch({ value, onChange, label = 'I am a', teenPage = false }) {
  const ref = useRef(null);
  const nav = useNavigate();
  const { pathname } = useLocation();
  const pick = (k, e) => {
    if (k === value) return;
    // where the burst starts: the middle of the option that was picked, relative to the page section
    const sec = ref.current && ref.current.closest('.ax-page');
    const btn = e && e.currentTarget;
    if (sec && btn) {
      const s = sec.getBoundingClientRect();
      const b = btn.getBoundingClientRect();
      sec.style.setProperty('--bx', `${Math.round(b.left + b.width / 2 - s.left)}px`);
      sec.style.setProperty('--by', `${Math.round(b.top + b.height / 2 - s.top)}px`);
      sec.classList.remove('ax-burst');
      void sec.offsetWidth; // restart the burst
      sec.classList.add('ax-burst');
    }
    try { segSound(k === 'professional'); } catch { /* sound is optional */ }
    if (k === 'minor' && !teenPage) { nav(`${pathname}?type=teen`); return; }
    if (k !== 'minor' && teenPage) { nav(k === 'professional' ? `${pathname}?type=professional` : pathname); return; }
    onChange(k);
  };
  return (
    <div className={`ax-switch ax-3 ${value === 'professional' ? 'is-pro' : value === 'minor' ? 'is-min' : ''}`} role="radiogroup" aria-label={label} ref={ref}>
      <span className="ax-thumb" aria-hidden="true" />
      {OPTS.map(([k, l, ic]) => (
        <button key={k} type="button" role="radio" aria-checked={value === k} className={`ax-opt ${value === k ? 'on' : ''}`} onClick={(e) => pick(k, e)}>
          <Icon name={ic} size={18} /> {l}
        </button>
      ))}
    </div>
  );
}

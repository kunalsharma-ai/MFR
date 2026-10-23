import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useRater } from '../utils/rater.js';

// One button for every "rate us" call-to-action on the site (home testimonials, About us → Reviews).
//   adult member → opens the rating screen (the member's category is known, so consumer / professional is never asked)
//   visitor      → "Log in to …" link to /login
//   under 18     → nothing (public reviews show a name)
//   already rated → a disabled "Thanks for rating us"
//   checking     → the same button, disabled, so the layout does not jump while the session is checked
export default function RateButton({ className = 'btn', icon = 'pen', iconSize = 16, label = 'Rate your experience', outLabel = 'Log in to rate us', doneLabel = 'Thanks for rating us' }) {
  const { state, reviewed } = useRater();
  if (state === 'kid') return null;
  if (state === 'out') return <Link to="/login" className={className}><Icon name="lock" size={iconSize} /> {outLabel}</Link>;
  if (reviewed) return <button type="button" className={className} disabled><Icon name="check" size={iconSize} /> {doneLabel}</button>;
  return (
    <button type="button" className={className} disabled={state === 'checking'} onClick={() => window.dispatchEvent(new CustomEvent('mfr:rate', { detail: {} }))}>
      <Icon name={icon} size={iconSize} /> {label}
    </button>
  );
}

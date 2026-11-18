import { Flag } from './CountryPicker.jsx';
import { COUNTRIES } from '../data/countries.js';

// One way to show who wrote a review, everywhere on the site: name, title, country name + flag, and a star rating.
// Only real fields are shown: no rating → no stars, no title → no title line. Nothing is invented.
const ini = (n) => String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const countryOf = (r) => r.country || (r.iso ? (COUNTRIES.find((c) => c.iso.toLowerCase() === String(r.iso).toLowerCase()) || {}).name : '') || '';

export function StarRow({ n, size = 16, className = '' }) {
  const v = Math.round(Number(n) || 0);
  if (!v) return null;
  return (
    <span className={`rid-stars ${className}`} role="img" aria-label={`Rated ${v} out of 5`} style={{ '--s': `${size}px` }}>
      {[1, 2, 3, 4, 5].map((k) => <i key={k} className={k <= v ? 'on' : ''} style={{ '--k': k }} aria-hidden="true">★</i>)}
    </span>
  );
}

export default function ReviewerId({ r, tone = 'con', stars = false, className = '' }) {
  const title = [r.designation, r.company].filter(Boolean).join(' · ');
  const country = countryOf(r);
  return (
    <span className={`rid rid-${tone} ${className}`}>
      <span className="rid-av" aria-hidden="true">{ini(r.name)}{r.iso ? <i className="rid-fl"><Flag iso={r.iso} size={16} /></i> : null}</span>
      <span className="rid-txt">
        <b className="rid-name">{r.name}</b>
        {title ? <small className="rid-title">{title}</small> : null}
        {country ? <small className="rid-c">{r.iso ? <Flag iso={r.iso} size={14} /> : null}{country}</small> : null}
      </span>
      {stars ? <StarRow n={r.rating} size={14} /> : null}
    </span>
  );
}

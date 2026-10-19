import { assetUrl, emojiUrl } from '../lib/assets.js';

/** The MFR membership card - the visual signature of the site. Every profile world is a card in its own
 *  foil colourway (theme accents) on the MyFrequentRewards navy/amber frame. Pure CSS 3D, no images
 *  except the 3D emoji and the brand mark. */
export default function MemberCard({ theme, name, icon, variant = 'hub', children, done, className = '', style }) {
  const [, , , , , c1, c2, c3] = theme.c;
  return (
    <span className={`mcard v-${variant} mc-${theme.card} ${done ? 'is-done' : ''} ${className}`} style={{ '--c1': c1, '--c2': c2, '--c3': c3, ...style }} aria-hidden={variant === 'hub' ? undefined : 'true'}>
      <span className="mc-pattern" />
      <span className="mc-sheen" />
      <span className="mc-top">
        <span className="mc-chip" />
        <span className="mc-world">{theme.name}</span>
        <img className="mc-mark" src={assetUrl('images/brand/mfr-mark-96.webp')} alt="" width="28" height="28" loading="lazy" decoding="async" />
      </span>
      <img className="mc-ico" src={emojiUrl(icon || theme.icon)} alt="" width="96" height="96" loading="lazy" decoding="async" />
      <span className="mc-bottom">
        {name && <span className="mc-name">{name}</span>}
        {children}
      </span>
      {done && <span className="mc-seal" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>}
    </span>
  );
}

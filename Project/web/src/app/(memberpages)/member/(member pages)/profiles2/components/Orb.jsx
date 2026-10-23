import { emojiUrl } from '../lib/assets.js';

/** Glossy 3D orb with a floating icon and a contact shadow (pure CSS - GPU friendly). */
export default function Orb({ icon, size = 120, className = '', float = true, alt = '' }) {
  return (
    <span className={`orb ${float ? 'orb-float' : ''} ${className}`} style={{ '--s': size + 'px' }}>
      <span className="orb-ball" />
      <img src={emojiUrl(icon)} alt={alt} aria-hidden={alt ? undefined : 'true'} width={size * 0.56} height={size * 0.56} decoding="async" loading="lazy" />
      <span className="orb-shadow" />
    </span>
  );
}

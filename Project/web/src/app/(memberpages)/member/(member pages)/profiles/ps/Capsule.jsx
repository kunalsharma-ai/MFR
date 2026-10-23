"use client";
import { themeFor } from './themes.js';
import { emojiUrl } from './assets.js';

/** Colours of a profile's prize capsule: the shell takes the profile world's accent, the band its second accent. */
export function capsuleColors(slug) {
  const th = themeFor(slug), [, , , , , a1, a2, a3] = th.c;
  return { a1, a2, a3, icon: th.icon };
}

/* A prize capsule: clear dome (top half) over a coloured shell (bottom half) with the profile's 3D emoji inside.
   `open` lifts the dome off and the emoji springs up. Pure CSS (see src/rewards/styles.js). */
export default function Capsule({ slug, open = false, className = '', style, size }) {
  const c = capsuleColors(slug);
  return (
    <span className={`cap ${open ? 'is-open' : ''} ${className}`} style={{ '--k1': c.a1, '--k2': c.a2, '--k3': c.a3, ...(size ? { '--cs': size + 'px' } : null), ...style }} aria-hidden="true">
      <span className="cap-bot" />
      <img className="cap-emo" src={emojiUrl(c.icon)} alt="" width="48" height="48" loading="lazy" decoding="async" draggable="false" />
      <span className="cap-top" />
      <span className="cap-band" />
    </span>
  );
}

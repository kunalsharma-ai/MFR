import { flagUrl } from '../lib/assets.js';

/** Country flag image (lazy, fixed size -> no layout shift). Decorative unless `label` is given. */
export default function Flag({ cc, size = 22, label }) {
  return (
    <img
      className="flag"
      src={flagUrl(cc)}
      width={Math.round(size * 1.333)}
      height={size}
      loading="lazy"
      decoding="async"
      alt={label || ''}
      aria-hidden={label ? undefined : 'true'}
      onError={(e) => {
        if (!e.currentTarget.dataset.fb) {
          e.currentTarget.dataset.fb = 1;
          e.currentTarget.src = flagUrl('xx');
        }
      }}
    />
  );
}

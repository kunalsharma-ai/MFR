// The activation lock: a 3D padlock with TWO keyholes — the parent/guardian key and the teen's own key.
// It shows the system rule of Part E: the account opens only when both keys have turned.
//   parent: 'wait' | 'ready' (form complete) | 'verifying' (sent, waiting for verification) | 'turned' (verified)
//   teen:   'wait' | 'turned' (said yes) | 'no' (said no)
// CSS-only 3D (stacked slabs + preserve-3d), transform/opacity animations only.
import { memo, useId } from 'react';
import { useI18n } from '../i18n/I18n.jsx';
import { asset } from '../assets.js';

function Key({ side, state, uid }) {
  const gid = `kg-${side}-${uid}`;
  return (
    <span className={`lk-key lk-key-${side} is-${state}`} aria-hidden="true">
      <svg viewBox="0 0 40 96" width="40" height="96">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={side === 'parent' ? '#9cc0ff' : '#ffe08a'} />
            <stop offset=".55" stopColor={side === 'parent' ? '#2f6bff' : '#ff8a00'} />
            <stop offset="1" stopColor={side === 'parent' ? '#1e3a9e' : '#c25400'} />
          </linearGradient>
        </defs>
        <circle cx="20" cy="16" r="14" fill={`url(#${gid})`} />
        <circle cx="20" cy="16" r="5.5" fill="#0b1e5b" opacity=".55" />
        <rect x="16.5" y="28" width="7" height="58" rx="3" fill={`url(#${gid})`} />
        <rect x="23" y="66" width="9" height="5" rx="1.5" fill={`url(#${gid})`} />
        <rect x="23" y="77" width="6" height="5" rx="1.5" fill={`url(#${gid})`} />
      </svg>
    </span>
  );
}

function Lock3D({ parent = 'wait', teen = 'wait', open = false, size = 1, label = true }) {
  const { t } = useI18n();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const pState = parent === 'turned' ? 'turned' : parent === 'verifying' ? 'verifying' : parent === 'ready' ? 'ready' : 'wait';
  const tState = teen;
  const pLabel = pState === 'turned' ? t('lock_turned') : pState === 'verifying' ? t('lock_verifying') : pState === 'ready' ? t('lock_ready') : teen === 'no' ? '—' : t('lock_wait');
  const tLabel = tState === 'turned' ? t('lock_turned') : tState === 'no' ? t('no') : t('lock_wait');
  const summary = `${t('lock_title')}: ${open ? t('lock_open') : t('lock_locked')} — ${t('lock_parent')}: ${pLabel}, ${t('lock_teen')}: ${tLabel}`;
  return (
    <div className={`lk ${open ? 'is-open' : ''}`} style={{ '--s': size }} role="img" aria-label={summary}>
      <div className="lk-stage">
        <div className="lk-rig">
          <div className="lk-shackle">
            {[5, 4, 3, 2, 1].map((z) => <i key={z} className="lk-sh-depth" style={{ '--z': `${-z * 2.2}px` }} />)}
            <i className="lk-sh-face" />
          </div>
          <div className="lk-body">
            {[7, 6, 5, 4, 3, 2, 1].map((z) => <i key={z} className="lk-slab" style={{ '--z': `${-z * 2.4}px` }} />)}
            <div className="lk-face">
              <span className="lk-mark"><img src={asset('brand/mfr-mark-160.webp')} alt="MyFrequentRewards seal on the activation lock" width="40" height="40" decoding="async" /></span>
              <span className={`lk-hole lk-hole-p is-${pState}`}><i /></span>
              <span className={`lk-hole lk-hole-t is-${tState}`}><i /></span>
              <span className={`lk-led lk-led-p is-${pState}`} />
              <span className={`lk-led lk-led-t is-${tState}`} />
            </div>
            <Key side="parent" state={pState} uid={uid} />
            <Key side="teen" state={tState} uid={uid} />
          </div>
        </div>
        <span className="lk-floor" aria-hidden="true" />
        <span className="lk-burst" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</span>
      </div>
      {label ? (
        <div className="lk-legend" aria-hidden="true">
          <span className={`lk-tag is-${pState}`}><b>{t('lock_parent')}</b><small>{pLabel}</small></span>
          <span className={`lk-tag lk-tag-t is-${tState}`}><b>{t('lock_teen')}</b><small>{tLabel}</small></span>
        </div>
      ) : null}
    </div>
  );
}
export default memo(Lock3D);

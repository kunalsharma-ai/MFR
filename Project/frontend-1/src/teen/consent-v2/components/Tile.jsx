// The one control this page uses: a card you tap to agree. No typing, no signature — tap once and a stamp
// lands, the mini padlock opens and a sound plays; tap again to take it back.
// Used for the terms (Part A), each separate parental permission (Part B) and the teen's own yes (Part C).
import { memo } from 'react';
import Icon from './Icons.jsx';
import { MiniLock } from './Vault.jsx';
import { useI18n } from '../i18n/I18n.jsx';
import { play } from '../sound.js';

function Tile({ id, icon, kind, title, desc, on, onToggle, disabled, tone = 'req', big = false, err = false, children }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      id={id}
      className={`tile tile-${tone} ${on ? 'is-on' : ''} ${big ? 'tile-big' : ''} ${err ? 'has-err' : ''}`}
      aria-pressed={on}
      disabled={disabled}
      onClick={() => { if (disabled) return; play(on ? 'untick' : 'agree'); onToggle(!on); }}
    >
      <span className="tile-ico" aria-hidden="true">
        <Icon name={icon} size={big ? 26 : 22} decorative />
        <MiniLock open={on} size={big ? 16 : 14} />
      </span>
      <span className="tile-txt">
        {kind ? <span className="tile-kind">{kind}</span> : null}
        <b>{title}</b>
        {desc ? <span className="tile-desc">{desc}</span> : null}
        {children}
      </span>
      <span className="tile-state">
        <span className="tile-box" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7" /></svg></span>
        <small>{on ? t('agreed') : t('tap_agree')}</small>
      </span>
      <span className="tile-stamp" aria-hidden="true"><Icon name="check" size={14} decorative />{t('agreed')}</span>
    </button>
  );
}
export default memo(Tile);

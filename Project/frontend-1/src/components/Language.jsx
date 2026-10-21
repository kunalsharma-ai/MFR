// Language UI (always loaded): the header / mobile-menu / footer language button. The picker itself lives in
// LanguagePicker.jsx and is loaded on demand (see Layout.jsx), so it adds nothing to the first page load.
import { useI18n } from '../i18n/I18nProvider.jsx';
import Icon from './Icon.jsx';

/** Warm up the picker chunk as soon as someone points at or focuses the button, so it opens instantly. */
const preload = () => import('./LanguagePicker.jsx').catch(() => {});

/** compact = orb only (footer); wide = full-width row (mobile menu); default = orb + native name (header). */
export function LanguageButton({ compact = false, wide = false }) {
  const { meta, openPicker } = useI18n();
  return (
    <button
      type="button"
      className={`lang-btn ${compact ? 'is-compact' : ''} ${wide ? 'is-wide' : ''}`}
      onClick={openPicker}
      onPointerEnter={preload}
      onTouchStart={preload}
      onFocus={preload}
      aria-haspopup="dialog"
      aria-label="Change language"
      title={`${meta.native} · ${meta.name}`}
      style={{ '--b1': meta.grade[0], '--b2': meta.grade[1], '--b3': meta.grade[2] }}
    >
      <span className="lb-orb" aria-hidden="true">
        <span className="lb-glyph notranslate" translate="no">{meta.glyph}</span>
      </span>
      <span className="lb-txt notranslate" translate="no">{compact ? meta.native : meta.native}</span>
      {wide ? <span className="lb-hint">51 languages</span> : null}
      <Icon name="chevron" size={14} className="lb-caret" />
    </button>
  );
}

import { useI18n } from '../i18n/I18nProvider.jsx';
import { FEATURED, LANG_BY_CODE, LANGS } from '../i18n/languages.js';
import { useChooseLanguage } from './LanguagePicker.jsx';
import Flag from './Flag.jsx';
import { IGlobe } from './Icons.jsx';

/** Up-front language strip - visible on the first screen as requested. */
export default function LangRibbon({ onMore }) {
  const { lang, t } = useI18n();
  const choose = useChooseLanguage();
  const list = FEATURED.includes(lang) ? FEATURED : [lang, ...FEATURED.slice(0, -1)];
  return (
    <section className="ribbon" aria-labelledby="ribbon-h">
      <h2 id="ribbon-h" className="ribbon-h"><IGlobe /> {t('lang.choose')}</h2>
      <div className="ribbon-row" role="list">
        {list.map((code, i) => {
          const l = LANG_BY_CODE[code];
          return (
            <button key={code} role="listitem" type="button" className={`chip-lang ${code === lang ? 'on' : ''}`}
              style={{ '--i': i }} aria-pressed={code === lang} lang={code} onClick={() => choose(l)}>
              <Flag cc={l.flag} size={16} />
              <span>{l.native}</span>
            </button>
          );
        })}
        <button type="button" className="chip-lang chip-more" onClick={onMore}>
          <IGlobe /> <span>+{LANGS.length - FEATURED.length}</span>
        </button>
      </div>
    </section>
  );
}

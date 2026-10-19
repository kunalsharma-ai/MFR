import { useEffect, useState } from "react";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { isSoundOn, onSound, setSound } from "../audio/sound.js";
import { assetUrl } from "../lib/assets.js";
import Flag from "./Flag.jsx";
import { IChevron, IMoon, ISound, ISun } from "./Icons.jsx";

export default function Header({ onLang, dark, onToggleDark, onHome }) {
  const { t, meta } = useI18n();
  const [snd, setSnd] = useState(isSoundOn());
  useEffect(() => onSound(setSnd), []);
  return <></>;
  return (
    <header className="top">
      <div className="top-in wrap">
        <a
          className="brand"
          href="#/"
          onClick={onHome}
          aria-label="MyFrequentRewards - home"
        >
          <span className="brand-mark">
            <img
              src={assetUrl("images/brand/mfr-mark-96.webp")}
              width="44"
              height="44"
              alt=""
              fetchpriority="high"
            />
            <i className="brand-star" aria-hidden="true">
              ★
            </i>
          </span>
          <span className="brand-word">
            <b>
              Myfrequent<em>rewards</em>
            </b>
            <small>{t("brandTag")}</small>
          </span>
        </a>
        <nav className="top-actions" aria-label="Preferences">
          <button
            type="button"
            className="lang-btn"
            onClick={onLang}
            aria-haspopup="dialog"
            title={t("lang.choose")}
          >
            <Flag cc={meta.flag} size={18} />
            <span className="lang-btn-name" lang={meta.code}>
              {meta.native}
            </span>
            <span className="lang-btn-label">{t("lang.button")}</span>
            <IChevron />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSound(!snd)}
            aria-pressed={snd}
            aria-label={snd ? t("sound.on") : t("sound.off")}
            title={snd ? t("sound.on") : t("sound.off")}
          >
            <ISound on={snd} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={onToggleDark}
            aria-pressed={dark}
            aria-label={dark ? t("theme.light") : t("theme.dark")}
            title={dark ? t("theme.light") : t("theme.dark")}
          >
            {dark ? <ISun /> : <IMoon />}
          </button>
        </nav>
      </div>
    </header>
  );
}

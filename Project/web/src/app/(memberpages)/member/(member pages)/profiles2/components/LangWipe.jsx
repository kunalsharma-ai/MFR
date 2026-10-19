import { useEffect, useRef, useState } from 'react';
import { paletteFor } from '../themes/langPalettes.js';
import { LANG_BY_CODE } from '../i18n/languages.js';
import Flag from './Flag.jsx';

/** A short full-screen colour burst in the new language's palette whenever the language changes. */
export default function LangWipe({ lang }) {
  const prev = useRef(lang);
  const [shot, setShot] = useState(null);
  useEffect(() => {
    if (prev.current === lang) return;
    prev.current = lang;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const p = paletteFor(lang), m = LANG_BY_CODE[lang];
    setShot({ k: Date.now(), p, m });
    const id = setTimeout(() => setShot(null), 1300);
    return () => clearTimeout(id);
  }, [lang]);
  if (!shot) return null;
  const { p, m } = shot;
  return (
    <div key={shot.k} className={`lwipe lw-${p.m}`} style={{ '--w1': p.a, '--w2': p.b, '--w3': p.c }} aria-hidden="true">
      <span className="lw-c c1" /><span className="lw-c c2" /><span className="lw-c c3" />
      <span className="lw-word" lang={lang}>{m.flag && <Flag cc={m.flag} size={40} />}{p.hi || m.native}</span>
    </div>
  );
}

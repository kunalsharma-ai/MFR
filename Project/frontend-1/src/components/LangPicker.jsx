import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { LANGUAGES, POPULAR, byCode } from '../i18n/languages.js';
import { currentLang, resumeTranslation, setLanguage, suggestedLang } from '../i18n/translate.js';

// v2.5 — language switcher, always in the header ("in front"): a spinning globe button with the current
// language code. It opens a "Babel board": popular languages as big script tiles (中 · अ · Ñ · ع …) plus a
// searchable list of 50 languages. Picking one translates the whole site (see i18n/translate.js).
export default function LangPicker() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [cur, setCur] = useState('en');
  const [msg, setMsg] = useState(null);
  const box = useRef(null);
  useEffect(() => { setCur(currentLang()); resumeTranslation(); }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('lang-open', open);
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onDown = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    setTimeout(() => { const i = box.current && box.current.querySelector('.lp-search input'); if (i && window.matchMedia('(pointer: fine)').matches) i.focus(); }, 60);
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, [open]);
  useEffect(() => {
    const openFromElsewhere = () => setOpen(true);
    window.addEventListener('mfr:lang', openFromElsewhere);
    return () => window.removeEventListener('mfr:lang', openFromElsewhere);
  }, []);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return LANGUAGES.filter((l) => !t || l.name.toLowerCase().includes(t) || l.native.toLowerCase().includes(t) || l.code.toLowerCase().startsWith(t));
  }, [q]);
  const choose = async (code) => {
    setCur(code);
    setMsg(null);
    const r = await setLanguage(code);
    if (r.ok) { setOpen(false); return; }
    setMsg(r.fallback ? { link: r.fallback } : { text: 'Translation is not available on this connection right now. Please try again later.' });
  };
  const L = byCode(cur) || LANGUAGES[0];
  return (
    <div className="lp notranslate" ref={box} translate="no">
      <button type="button" className={`lp-btn ${open ? 'on' : ''}`} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="dialog" aria-label={`Language: ${L.name}. Change language`}>
        <span className="lp-globe" aria-hidden="true"><Icon name="language" size={18} /></span>
        <b>{cur === 'en' ? 'EN' : cur.split('-')[0].toUpperCase()}</b>
      </button>
      {open ? (
        <div className="lp-panel" role="dialog" aria-label="Choose your language">
          <div className="lp-head">
            <p><b>Choose your language</b><small>The whole site is translated instantly</small></p>
            <button type="button" className="lp-x" onClick={() => setOpen(false)} aria-label="Close"><Icon name="close" size={16} /></button>
          </div>
          <div className="lp-pop">
            {POPULAR.map((c, i) => { const l = byCode(c); return (
              <button type="button" key={c} className={`lp-tile t${i % 8} ${cur === c ? 'on' : ''}`} onClick={() => choose(c)} lang={c} style={{ '--i': i }}>
                <span className="lp-glyph" aria-hidden="true">{l.glyph}</span><b>{l.native}</b><small>{l.name}</small>
              </button>
            ); })}
          </div>
          <label className="lp-search"><Icon name="filter" size={15} /><span className="sr-only">Search languages</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 50 languages…" /></label>
          <ul className="lp-list">
            {list.map((l) => (
              <li key={l.code}><button type="button" className={cur === l.code ? 'on' : ''} onClick={() => choose(l.code)} lang={l.code}><span className="lp-g" aria-hidden="true">{l.glyph}</span><b>{l.native}</b><small>{l.name}</small>{cur === l.code ? <Icon name="check" size={14} stroke={3} /> : null}</button></li>
            ))}
            {!list.length ? <li className="lp-none">No language matches “{q}”.</li> : null}
          </ul>
          {msg ? <p className="lp-msg" role="status">{msg.link ? <>Opening the translated site… <a href={msg.link}>Continue</a></> : msg.text}</p> : null}
          <p className="lp-note"><Icon name="shield" size={12} /> Machine translation by Google Translate — page text is sent to Google only after you choose a language. English is the original.</p>
        </div>
      ) : null}
    </div>
  );
}

// One-time suggestion for visitors whose browser prefers another language
export function LangSuggest() {
  const [sug, setSug] = useState(null);
  useEffect(() => {
    const t = setTimeout(() => { if (currentLang() === 'en') setSug(suggestedLang()); }, 1500);
    return () => clearTimeout(t);
  }, []);
  if (!sug) return null;
  const close = () => { try { localStorage.setItem('mfr_lang_dismissed', '1'); } catch { /* ignore */ } setSug(null); };
  return (
    <div className="lsug notranslate" role="dialog" aria-label="Language suggestion" translate="no">
      <span className="lsug-glyph" aria-hidden="true">{sug.glyph}</span>
      <p lang={sug.code}><b>{sug.native}?</b><small>View this website in {sug.name}</small></p>
      <button type="button" className="lsug-yes" onClick={async () => { const r = await setLanguage(sug.code); if (!r.ok && r.fallback) window.location.assign(r.fallback); setSug(null); }}>Switch</button>
      <button type="button" className="lsug-no" onClick={close} aria-label="Keep English">English</button>
    </div>
  );
}

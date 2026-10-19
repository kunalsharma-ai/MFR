import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { LANGS } from '../i18n/languages.js';
import { playLanguage } from '../audio/sound.js';
import { useToast } from './Toasts.jsx';
import Flag from './Flag.jsx';
import { IClose, ISearch, ICheck } from './Icons.jsx';

const norm = (s) => s.toLocaleLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function useChooseLanguage() {
  const { setLang, t } = useI18n();
  const toast = useToast();
  return (l) => {
    setLang(l.code);
    playLanguage(l.code);
    toast(t('lang.changed', { lang: l.native }), 'lang', '🌐');
  };
}

/** Accessible, keyboard-friendly language dialog with instant (non-blocking) search. */
export default function LanguagePicker({ open, onClose }) {
  const { lang, t } = useI18n();
  const choose = useChooseLanguage();
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);
  const [active, setActive] = useState(0);
  const input = useRef(null);
  const list = useRef(null);
  const ref = useRef(null);

  // localized language names for search, e.g. typing "chinois" in French finds 中文
  const names = useMemo(() => {
    let dn = null;
    try { dn = new Intl.DisplayNames([lang], { type: 'language' }); } catch { /* old browser */ }
    return LANGS.map((l) => {
      let local = '';
      try { local = dn ? dn.of(l.code) || '' : ''; } catch { /* ignore */ }
      return { ...l, local, hay: norm([l.native, l.name, l.code, local].join(' ')) };
    });
  }, [lang]);

  const results = useMemo(() => {
    const s = norm(dq.trim());
    if (!s) return names;
    return names
      .filter((l) => l.hay.includes(s))
      .sort((a, b) => (norm(a.native).startsWith(s) || norm(a.name).startsWith(s) ? -1 : 0) - (norm(b.native).startsWith(s) || norm(b.name).startsWith(s) ? -1 : 0));
  }, [dq, names]);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setActive(Math.max(0, LANGS.findIndex((l) => l.code === lang)));
    const prev = document.activeElement;
    const id = requestAnimationFrame(() => input.current?.focus({ preventScroll: true }));
    document.body.classList.add('no-scroll');
    return () => {
      cancelAnimationFrame(id);
      document.body.classList.remove('no-scroll');
      prev?.focus?.({ preventScroll: true });
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => setActive(0), [dq]);
  useEffect(() => {
    const el = list.current?.querySelector(`[data-i="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;
  const pick = (l) => { choose(l); onClose(); };
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); pick(results[active]); }
    else if (e.key === 'Tab') {
      const f = ref.current.querySelectorAll('input,button');
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  };
  const full = results.filter((l) => l.full), more = results.filter((l) => !l.full);
  let idx = -1;
  const row = (l) => {
    idx++;
    const i = idx;
    return (
      <li key={l.code} id={'lp-' + l.code} role="option" aria-selected={l.code === lang} data-i={i}
        className={`lp-item ${i === active ? 'is-active' : ''} ${l.code === lang ? 'is-current' : ''}`}
        onMouseMove={() => active !== i && setActive(i)} onClick={() => pick(l)}>
        <Flag cc={l.flag} size={20} />
        <span className="lp-names" lang={l.code} dir={l.rtl ? 'rtl' : 'ltr'}>
          <b>{l.native}</b>
        </span>
        <small>{l.local && l.local !== l.native ? l.local : l.name}</small>
        {l.code === lang && <ICheck className="lp-check" />}
      </li>
    );
  };
  return (
    <div className="lp-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lp" role="dialog" aria-modal="true" aria-labelledby="lp-title" ref={ref} onKeyDown={onKey}>
        <div className="lp-head">
          <h2 id="lp-title">{t('lang.choose')}</h2>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close"><IClose /></button>
        </div>
        <label className="lp-search">
          <ISearch />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('lang.search')}
            aria-label={t('lang.search')} role="combobox" aria-expanded="true" aria-controls="lp-list"
            aria-activedescendant={results[active] ? 'lp-' + results[active].code : undefined}
            autoComplete="off" spellCheck="false" />
        </label>
        <ul className="lp-list" id="lp-list" role="listbox" ref={list} aria-label={t('lang.choose')}>
          {!results.length && <li className="lp-empty">{t('lang.none')}</li>}
          {!!full.length && <li className="lp-group" role="presentation">{t('lang.full')}</li>}
          {full.map(row)}
          {!!more.length && <li className="lp-group" role="presentation">{t('lang.more')}</li>}
          {more.map(row)}
        </ul>
      </div>
    </div>
  );
}

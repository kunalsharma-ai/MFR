// Agreement MINOR-2026.10, Part A: the parents' information box and the 19 sections in 6 chapters, each with its
// "in short" summary and the full approved text one tap away. Shared by the guardian's consent step and /teen-terms.
// The wording is the approved text from src/teen/data/consent.js, unchanged.
import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { CHAPTERS, SECTIONS, SECTION_EMOJI, INFO, INFO_RULE, COMPANY, TERMS_VERSION, EFFECTIVE } from './data/consent.js';
import { t, fmtDate } from './i18n.js';
import { tap } from './ui.jsx';

export default function ConsentReader({ read = [], onRead, openAll = false, idPrefix = 'sec' }) {
  const [open, setOpen] = useState(() => (openAll ? Object.keys(SECTIONS).map(Number) : []));
  const toggle = (n) => {
    tap();
    setOpen((o) => (o.includes(n) ? o.filter((x) => x !== n) : [...o, n]));
    if (onRead && !read.includes(n)) onRead(n);
  };
  const all = Object.keys(SECTIONS).length;
  return (
    <div className="tz-reader">
      <div className="tz-info">
        <h2 className="tz-h4"><Icon name="shield" size={18} /> {t('cs_info_h')}</h2>
        {INFO.map((p) => <p key={p.slice(0, 20)}>{p}</p>)}
        <p className="tz-info-rule"><b>{INFO_RULE}</b></p>
        <p className="tz-small">{t('cs_meta', TERMS_VERSION, fmtDate(EFFECTIVE))} · {t('cs_binding')}</p>
      </div>
      <div className="tz-reader-bar">
        <span>{t('cs_read', read.length, all)}</span>
        <span className="tz-meter" aria-hidden="true"><i style={{ width: `${(read.length / all) * 100}%` }} /></span>
        <button type="button" className="tz-link" onClick={() => {
          const everything = Object.keys(SECTIONS).map(Number);
          const closing = open.length === everything.length;
          setOpen(closing ? [] : everything);
          if (!closing && onRead) everything.forEach((n) => { if (!read.includes(n)) onRead(n); });
        }}>{open.length === all ? t('cs_close_all') : t('cs_open_all')}</button>
      </div>
      {CHAPTERS.map((ch) => (
        <section key={ch.id} id={`ch-${ch.id}`} className="tz-chapter" style={{ '--c1': ch.grade[0], '--c2': ch.grade[1] }}>
          <header><span className="tz-ch-emo" aria-hidden="true">{ch.emoji}</span><div><h3>{ch.title}</h3><p>{ch.tag}</p></div></header>
          {ch.sections.map((n) => {
            const s = SECTIONS[String(n)];
            const isOpen = open.includes(n);
            return (
              <article key={n} className={`tz-sec ${isOpen ? 'is-open' : ''} ${read.includes(n) ? 'is-read' : ''}`} id={`${idPrefix}-${n}`}>
                <button type="button" className="tz-sec-head" aria-expanded={isOpen} aria-controls={`${idPrefix}-${n}-body`} onClick={() => toggle(n)}>
                  <span className="tz-sec-n" aria-hidden="true">{SECTION_EMOJI[n]}</span>
                  <span className="tz-sec-t"><small>{t('cs_section', n)}</small><b>{s.title}</b><em>{s.short}</em></span>
                  <span className="tz-sec-state">{read.includes(n) ? <Icon name="check" size={14} stroke={3} /> : null}<Icon name="chevron" size={16} /></span>
                </button>
                {isOpen ? (
                  <div className="tz-sec-body" id={`${idPrefix}-${n}-body`}>
                    {s.body.map((b, i) => (typeof b === 'string' ? <p key={i}>{b}</p> : b && b.ul ? <ul key={i}>{b.ul.map((l) => <li key={l}>{l}</li>)}</ul> : b && b.contact ? (
                      <address key={i} className="tz-contact">
                        <span><Icon name="briefcase" size={14} /> {COMPANY.legalName}</span>
                        <span><Icon name="mail" size={14} /> <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a></span>
                        <span><Icon name="pin" size={14} /> {COMPANY.address}</span>
                        <span><Icon name="phone" size={14} /> {COMPANY.phone}</span>
                      </address>
                    ) : null))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
}

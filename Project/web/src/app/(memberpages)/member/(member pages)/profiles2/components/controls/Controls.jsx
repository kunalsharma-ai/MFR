import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';
import Flag from '../Flag.jsx';
import { emojiUrl } from '../../lib/assets.js';

const Ico = ({ name, size = 30 }) => (name ? <img className="opt-ico" src={emojiUrl(name)} alt="" aria-hidden="true" width={size} height={size} loading="lazy" decoding="async" /> : null);
import { ICheck, ISearch } from '../Icons.jsx';

const norm = (s) => String(s).toLocaleLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const YES = /^(yes|no|y|n|true|false)$/i;

/** Big tappable tiles for <= 6 options (single) - keyboard 1-9, auto-advance handled by parent. */
export function Tiles({ items, value, multi, onToggle }) {
  const binary = items.length === 2 && items.every((o) => YES.test(o.value));
  return (
    <div className={`tiles ${binary ? 'tiles-yn' : ''} ${items.length > 4 ? 'tiles-3' : ''} ${items.every((o) => o.label.length <= 12) ? 'tiles-short' : ''}`} role={multi ? 'group' : 'radiogroup'}>
      {items.map((o, i) => {
        const on = multi ? (value || []).includes(o.value) : value === o.value;
        const yn = binary ? (/^(yes|y|true)$/i.test(o.value) ? 'yes' : 'no') : '';
        return (
          <button key={o.value} type="button" role={multi ? 'checkbox' : 'radio'} aria-checked={on}
            className={`tile ${on ? 'on' : ''} ${yn ? 'tile-' + yn : ''}`} style={{ '--i': i }}
            onClick={(e) => onToggle(o.value, e)}>
            <span className="tile-key" aria-hidden="true">{yn ? (yn === 'yes' ? '✓' : '✕') : KEYS[i]}</span>
            {!yn && o.icon && <Ico name={o.icon} size={34} />}
            <span className="tile-label">{o.label}</span>
            <span className="tile-check" aria-hidden="true"><ICheck /></span>
          </button>
        );
      })}
    </div>
  );
}

/** Chips with filter for multi-select lists. */
export function Chips({ items, value, onToggle, filterPh, selectedLabel, noMatch, moreLabel }) {
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);
  const sel = value || [];
  const shown = useMemo(() => {
    const s = norm(dq.trim());
    return s ? items.filter((o) => norm(o.label).includes(s) || norm(o.value).includes(s)) : items;
  }, [dq, items]);
  const LIMIT = 120;
  return (
    <div className="chips-wrap">
      <div className="chips-bar">
        {items.length > 12 && (
          <label className="search search-sm">
            <ISearch />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={filterPh} aria-label={filterPh} />
          </label>
        )}
        <span className={`count-pill ${sel.length ? 'on' : ''}`} aria-live="polite">{selectedLabel}</span>
      </div>
      <div className="chips" role="group">
        {shown.slice(0, LIMIT).map((o, i) => {
          const on = sel.includes(o.value);
          return (
            <button key={o.value} type="button" role="checkbox" aria-checked={on} className={`chip ${on ? 'on' : ''}`}
              style={{ '--i': Math.min(i, 24) }} onClick={(e) => onToggle(o.value, e)}>
              <span className="chip-box" aria-hidden="true"><ICheck /></span>
              {o.label}
            </button>
          );
        })}
        {!shown.length && <p className="muted">{noMatch}</p>}
      </div>
      {shown.length > LIMIT && <p className="muted small">{moreLabel(LIMIT, shown.length)}</p>}
    </div>
  );
}

/** Filterable radio list for 7-30 options. */
export function RadioList({ items, value, onPick, filterPh, noMatch }) {
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);
  const shown = useMemo(() => {
    const s = norm(dq.trim());
    return s ? items.filter((o) => norm(o.label).includes(s) || norm(o.value).includes(s)) : items;
  }, [dq, items]);
  return (
    <div>
      {items.length > 9 && (
        <label className="search search-sm">
          <ISearch />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={filterPh} aria-label={filterPh} />
        </label>
      )}
      <div className="rlist" role="radiogroup">
        {shown.map((o, i) => (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value}
            className={`ritem ${value === o.value ? 'on' : ''}`} style={{ '--i': Math.min(i, 20) }} onClick={(e) => onPick(o.value, e)}>
            <span className="rdot" aria-hidden="true" />
            {o.flag ? <Flag cc={o.flag} size={16} /> : <Ico name={o.icon} size={24} />}
            <span>{o.label}</span>
          </button>
        ))}
        {!shown.length && <p className="muted">{noMatch}</p>}
      </div>
    </div>
  );
}

/** Searchable combobox for long lists (countries, states, cities, job titles).
 *  Renders at most 60 matches -> no lag even with thousands of options. */
export function Combo({ items, value, raw, onPick, onRaw, placeholder, noMatch, moreLabel, autoFocus, onEnter, customLabel }) {
  const id = useId();
  const cur = items.find((o) => o.value === value);
  const [text, setText] = useState(cur ? cur.label : raw || '');
  const [open, setOpen] = useState(false);
  const [act, setAct] = useState(0);
  const dtext = useDeferredValue(text);
  const inp = useRef(null);
  const listRef = useRef(null);
  useEffect(() => { setText(cur ? cur.label : raw || ''); }, [cur?.label]); // eslint-disable-line
  const matches = useMemo(() => {
    const s = norm(dtext.trim());
    if (!s || (cur && dtext === cur.label)) return items;
    const starts = [], has = [];
    for (const o of items) {
      const l = norm(o.label);
      if (l.startsWith(s)) starts.push(o);
      else if (l.includes(s) || norm(o.value).includes(s)) has.push(o);
    }
    return starts.concat(has);
  }, [dtext, items, cur]);
  const LIMIT = 60;
  const shown = matches.slice(0, LIMIT);
  useEffect(() => setAct(0), [dtext]);
  useEffect(() => { listRef.current?.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' }); }, [act]);
  const pick = (o, e) => { setText(o.label); setOpen(false); onPick(o.value, e); };
  const type = (v) => {
    setText(v);
    setOpen(true);
    const exact = items.find((o) => norm(o.label) === norm(v.trim()));
    if (exact) onPick(exact.value);
    else onRaw(v);
  };
  const key = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setAct((a) => Math.min(shown.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setAct((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && shown[act] && !(cur && text === cur.label)) pick(shown[act]);
      else onEnter?.();
    } else if (e.key === 'Escape') setOpen(false);
  };
  return (
    <div className={`combo ${open ? 'open' : ''}`}>
      <div className="combo-field">
        {cur?.flag ? <Flag cc={cur.flag} size={18} /> : <ISearch />}
        <input ref={inp} className="field" value={text} placeholder={placeholder} autoFocus={autoFocus}
          role="combobox" aria-expanded={open} aria-controls={id} aria-autocomplete="list" autoComplete="off" spellCheck="false"
          aria-activedescendant={open && shown[act] ? `${id}-${act}` : undefined}
          onChange={(e) => type(e.target.value)} onFocus={() => setOpen(true)} onKeyDown={key}
          onBlur={() => setTimeout(() => setOpen(false), 150)} />
      </div>
      {open && (
        <ul className="combo-list" id={id} role="listbox" ref={listRef}>
          {shown.map((o, i) => (
            <li key={o.value} id={`${id}-${i}`} role="option" aria-selected={o.value === value}
              className={`${i === act ? 'is-active' : ''} ${o.value === value ? 'is-sel' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); pick(o, e); }} onMouseMove={() => act !== i && setAct(i)}>
              {o.flag && <Flag cc={o.flag} size={16} />}
              <span>{o.label}</span>
              {o.value === value && <ICheck />}
            </li>
          ))}
          {customLabel && text.trim().length > 1 && !items.some((o) => norm(o.label) === norm(text.trim())) && (
            <li className="combo-custom" onMouseDown={(e) => { e.preventDefault(); setOpen(false); onRaw(text.trim(), true); }}>✎ {customLabel(text.trim())}</li>
          )}
          {!shown.length && !customLabel && <li className="combo-empty">{noMatch}</li>}
          {matches.length > LIMIT && <li className="combo-more">{moreLabel(LIMIT, matches.length)}</li>}
        </ul>
      )}
    </div>
  );
}

/** Free text / email / phone / date / number with stepper. */
export function TextInput({ spec, value, onChange, long, onEnter, placeholder, autoFocus }) {
  const today = new Date().toISOString().slice(0, 10);
  const ref = useRef(null);
  useEffect(() => { if (autoFocus) ref.current?.focus({ preventScroll: true }); }, [autoFocus]);
  const key = (e) => { if (e.key === 'Enter' && !long) { e.preventDefault(); onEnter(); } };
  if (long) {
    return <textarea ref={ref} className="field" rows={4} maxLength={500} value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
  }
  if (spec.type === 'number') {
    const n = parseInt(value, 10);
    const step = (d) => onChange(String(Math.max(0, (isNaN(n) ? 0 : n) + d)));
    return (
      <div className="stepper">
        <button type="button" onClick={() => step(-1)} aria-label="−1">−</button>
        <input ref={ref} className="field" inputMode="numeric" value={value || ''} placeholder={spec.ph || '0'}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 4))} onKeyDown={key} />
        <button type="button" onClick={() => step(1)} aria-label="+1">+</button>
      </div>
    );
  }
  const type = spec.type === 'url' ? 'url' : spec.type;
  return (
    <input ref={ref} className="field" type={type} value={value || ''} placeholder={spec.ph || placeholder} maxLength={200}
      min={type === 'date' ? '1900-01-01' : undefined} max={type === 'date' ? today : undefined}
      autoComplete="off" inputMode={type === 'tel' ? 'tel' : type === 'email' ? 'email' : undefined}
      onChange={(e) => onChange(e.target.value)} onKeyDown={key} />
  );
}

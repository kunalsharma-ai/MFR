// Shared form pieces for the Teen journey. Each page gives them its own look through CSS variables
// (--tz-accent, --tz-ink, --tz-field, ...) — the behaviour is identical everywhere:
//   • every control has a visible label, an error tied to it with aria-describedby, and 44 px touch targets
//   • lists are searchable, open upwards when there is no room below, and always offer "type it yourself"
//   • nothing animates for people who ask their system for reduced motion
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Flag } from '../components/CountryPicker.jsx';
import { t, err, monthNames } from './i18n.js';
import { tapSound } from '../utils/sound.js';

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// ---- state that survives a refresh (sessionStorage: cleared when the tab closes, so a shared computer forgets it) ----
export function useDraft(key, initial) {
  const [v, setV] = useState(() => {
    if (typeof window === 'undefined') return initial;
    try { const raw = sessionStorage.getItem(key); return raw ? { ...initial, ...JSON.parse(raw) } : initial; } catch { return initial; }
  });
  useEffect(() => { try { sessionStorage.setItem(key, JSON.stringify(v)); } catch { /* storage blocked */ } }, [key, v]);
  const clear = useCallback(() => { try { sessionStorage.removeItem(key); } catch { /* */ } }, [key]);
  return [v, setV, clear];
}
export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const tap = () => { try { tapSound(); } catch { /* sound off / not ready */ } };

// ---- field shell ----
export function Field({ id, label, hint, error, optional, children, span = 1, className = '' }) {
  return (
    <div className={`tf-field tf-span-${span} ${error ? 'is-bad' : ''} ${className}`}>
      {label ? (
        <label className="tf-label" htmlFor={id}>
          <span>{label}</span>
          {optional ? <em className="tf-opt">{t('optional')}</em> : null}
        </label>
      ) : null}
      {children}
      {error ? <p className="tf-err" id={`${id}-err`} role="alert"><Icon name="close" size={12} stroke={3} /> {error}</p>
        : hint ? <p className="tf-hint" id={`${id}-hint`}>{hint}</p> : null}
    </div>
  );
}
const describedBy = (id, error, hint) => (error ? `${id}-err` : hint ? `${id}-hint` : undefined);

export function TextInput({ id, label, hint, error, optional, value, onChange, onBlur, type = 'text', span, autoComplete, maxLength = 60, inputMode, placeholder, dir }) {
  return (
    <Field id={id} label={label} hint={hint} error={error} optional={optional} span={span}>
      <input
        id={id}
        className="tf-input"
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        autoComplete={autoComplete}
        maxLength={maxLength}
        inputMode={inputMode}
        placeholder={placeholder}
        dir={dir}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, error, hint)}
        aria-required={!optional}
      />
    </Field>
  );
}

// ---- date of birth: three selects (fast on phones, no calendar to fight, works in every language) ----
export function DateField({ id, label, hint, error, value, onChange, fromYear, toYear, span }) {
  const [y, m, d] = String(value || '').split('-');
  const [parts, setParts] = useState({ y: y || '', m: m || '', d: d || '' });
  useEffect(() => { const [a, b, c] = String(value || '').split('-'); if (value) setParts({ y: a, m: b, d: c }); }, [value]);
  const months = monthNames();
  const years = [];
  for (let i = toYear; i >= fromYear; i -= 1) years.push(i);
  const dim = parts.y && parts.m ? new Date(Date.UTC(Number(parts.y), Number(parts.m), 0)).getUTCDate() : 31;
  const set = (k, v) => {
    const next = { ...parts, [k]: v };
    if (next.d && next.y && next.m && Number(next.d) > new Date(Date.UTC(Number(next.y), Number(next.m), 0)).getUTCDate()) next.d = '';
    setParts(next);
    onChange(next.y && next.m && next.d ? `${next.y}-${next.m}-${next.d}` : '');
  };
  return (
    <Field id={`${id}-d`} label={label} hint={hint} error={error} span={span} className="tf-date">
      <div className="tf-date-row" role="group" aria-label={label}>
        <select id={`${id}-d`} className="tf-input tf-sel" value={parts.d} onChange={(e) => set('d', e.target.value)} aria-label={t('dd')} aria-invalid={Boolean(error)} aria-describedby={describedBy(`${id}-d`, error, hint)}>
          <option value="">{t('dd')}</option>
          {Array.from({ length: dim }, (_, i) => String(i + 1).padStart(2, '0')).map((x) => <option key={x} value={x}>{Number(x)}</option>)}
        </select>
        <select id={`${id}-m`} className="tf-input tf-sel" value={parts.m} onChange={(e) => set('m', e.target.value)} aria-label={t('mm')} aria-invalid={Boolean(error)}>
          <option value="">{t('mm')}</option>
          {months.map((name, i) => <option key={name} value={String(i + 1).padStart(2, '0')}>{name}</option>)}
        </select>
        <select id={`${id}-y`} className="tf-input tf-sel" value={parts.y} onChange={(e) => set('y', e.target.value)} aria-label={t('yyyy')} aria-invalid={Boolean(error)}>
          <option value="">{t('yyyy')}</option>
          {years.map((x) => <option key={x} value={String(x)}>{x}</option>)}
        </select>
      </div>
    </Field>
  );
}

// ---- searchable list with "type it yourself" ----
// options: [{ value, label, sub?, flag? }]. onChange(value, { manual, label }).
export function Combo({ id, label, hint, error, optional, options = [], value, manualValue, onChange, allowCustom = true, placeholder, span, disabled, loading, max = 60, compact }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hi, setHi] = useState(0);
  const [up, setUp] = useState(false);
  const wrap = useRef(null);
  const input = useRef(null);
  const listId = `${id}-list`;
  const selected = options.find((o) => o.value === value);
  const shown = selected ? selected.label : manualValue || '';

  const norm = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const matches = useMemo(() => {
    const n = norm(q.trim());
    if (!n) return options.slice(0, max);
    const starts = []; const has = [];
    for (const o of options) {
      const l = norm(o.label);
      if (l.startsWith(n) || (o.value && norm(o.value) === n)) starts.push(o);
      else if (l.includes(n)) has.push(o);
      if (starts.length >= max) break;
    }
    return [...starts, ...has].slice(0, max);
  }, [q, options, max]);
  const custom = allowCustom && q.trim() && !options.some((o) => norm(o.label) === norm(q.trim()));
  const items = custom ? [...matches, { value: '__custom', label: t('use_typed', q.trim()), custom: true }] : matches;

  useIso(() => {
    if (!open || !wrap.current) return;
    const r = wrap.current.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    setUp(below < 280 && r.top > below);
  }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const off = (e) => { if (wrap.current && !wrap.current.contains(e.target)) { setOpen(false); setQ(''); } };
    document.addEventListener('pointerdown', off);
    return () => document.removeEventListener('pointerdown', off);
  }, [open]);
  useEffect(() => { setHi(0); }, [q]);

  const pick = (o) => {
    tap();
    if (o.custom) onChange('', { manual: true, label: q.trim() });
    else onChange(o.value, { manual: false, label: o.label });
    setOpen(false); setQ('');
    input.current?.blur();
  };
  const key = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHi((h) => Math.min(items.length - 1, h + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(0, h - 1)); }
    else if (e.key === 'Enter' && open && items[hi]) { e.preventDefault(); pick(items[hi]); }
    else if (e.key === 'Escape') { setOpen(false); setQ(''); }
  };
  useEffect(() => {
    if (!open) return;
    const el = document.getElementById(`${id}-opt-${hi}`);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [hi, open, id]);

  return (
    <Field id={id} label={label} hint={hint} error={error} optional={optional} span={span} className={`tf-combo ${compact ? 'is-compact' : ''}`}>
      <div className={`tf-combo-box ${open ? 'is-open' : ''} ${up ? 'is-up' : ''}`} ref={wrap}>
        {selected?.flag ? <span className="tf-combo-flag"><Flag iso={selected.flag} size={14} /></span> : null}
        <input
          ref={input}
          id={id}
          className={`tf-input ${selected?.flag ? 'has-flag' : ''}`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && items[hi] ? `${id}-opt-${hi}` : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(id, error, hint)}
          autoComplete="off"
          disabled={disabled}
          placeholder={loading ? t('loading') : placeholder || t('search')}
          value={open ? q : shown}
          onFocus={() => { setOpen(true); setQ(''); }}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onKeyDown={key}
        />
        <Icon name="chevron" size={16} className="tf-combo-chev" />
        {open ? (
          <ul className="tf-list" id={listId} role="listbox" aria-label={label}>
            {items.length === 0 ? <li className="tf-empty">{q ? t('none_found', q) : t('loading')}</li> : null}
            {items.map((o, i) => (
              <li
                key={`${o.value}-${i}`}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={o.value === value}
                className={`${i === hi ? 'is-hi' : ''} ${o.custom ? 'is-custom' : ''} ${o.value === value ? 'is-on' : ''}`}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => pick(o)}
                onPointerEnter={() => setHi(i)}
              >
                {o.flag ? <Flag iso={o.flag} size={13} /> : o.custom ? <Icon name="pen" size={14} /> : null}
                <span>{o.label}</span>
                {o.sub ? <small>{o.sub}</small> : null}
              </li>
            ))}
            {options.length > max && !q ? <li className="tf-empty">{t('search')} …</li> : null}
          </ul>
        ) : null}
      </div>
    </Field>
  );
}

// ---- phone: country code + number (optional) ----
export function PhoneField({ id, label, hint, error, value = {}, onChange, countries = [], span, optional = true }) {
  const opts = useMemo(() => countries.filter((c) => c.d).map((c) => ({ value: c.i, label: `${c.n} +${c.d}`, flag: c.i })), [countries]);
  const c = countries.find((x) => x.i === value.country);
  return (
    <Field id={id} label={label} hint={hint} error={error} optional={optional} span={span} className="tf-phone">
      <div className="tf-phone-row">
        <Combo id={`${id}-cc`} options={opts} value={value.country} allowCustom={false} compact
          onChange={(v) => onChange({ ...value, country: v, dial: countries.find((x) => x.i === v)?.d || '' })} placeholder={t('country_code')} />
        <span className="tf-dial" aria-hidden="true">{c ? `+${c.d}` : '+'}</span>
        <input id={id} className="tf-input" type="tel" inputMode="tel" autoComplete="tel-national" maxLength={18}
          value={value.number || ''} onChange={(e) => onChange({ ...value, number: e.target.value.replace(/[^\d\s-]/g, '') })}
          aria-invalid={Boolean(error)} aria-describedby={describedBy(id, error, hint)} aria-label={label} />
      </div>
    </Field>
  );
}

// ---- single / multiple choice ----
export function Choice({ id, label, hint, error, options, value, onChange, multi = false, exclusive = [], span, optional, columns }) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  const toggle = (v) => {
    tap();
    if (!multi) return onChange(v);
    if (exclusive.includes(v)) return onChange(list.includes(v) ? [] : [v]);
    const base = list.filter((x) => !exclusive.includes(x));
    return onChange(base.includes(v) ? base.filter((x) => x !== v) : [...base, v]);
  };
  return (
    <fieldset className={`tf-field tf-choice tf-span-${span || 2} ${error ? 'is-bad' : ''}`} aria-describedby={describedBy(id, error, hint)}>
      {label ? <legend className="tf-label"><span>{label}</span>{optional ? <em className="tf-opt">{t('optional')}</em> : null}</legend> : null}
      <div className="tf-chips" role={multi ? 'group' : 'radiogroup'} style={columns ? { '--cols': columns } : undefined}>
        {options.map((o) => {
          const on = list.includes(o.value);
          return (
            <button type="button" key={o.value} className={`tf-chip ${on ? 'is-on' : ''}`} role={multi ? 'checkbox' : 'radio'} aria-checked={on} onClick={() => toggle(o.value)}>
              {o.emoji ? <span className="tf-chip-emo" aria-hidden="true">{o.emoji}</span> : null}
              <span className="tf-chip-t">{o.label}</span>
              <span className="tf-chip-tick" aria-hidden="true"><Icon name="check" size={12} stroke={3} /></span>
            </button>
          );
        })}
      </div>
      {error ? <p className="tf-err" id={`${id}-err`} role="alert">{error}</p> : hint ? <p className="tf-hint" id={`${id}-hint`}>{hint}</p> : null}
    </fieldset>
  );
}

// ---- a consent box: separate, unticked, with its own error ----
export function Check({ id, checked, onChange, title, children, error, icon = 'check', tag }) {
  return (
    <div className={`tf-check ${checked ? 'is-on' : ''} ${error ? 'is-bad' : ''}`}>
      <input type="checkbox" id={id} checked={Boolean(checked)} onChange={(e) => { tap(); onChange(e.target.checked); }} aria-describedby={error ? `${id}-err` : undefined} />
      <label htmlFor={id}>
        <span className="tf-check-box" aria-hidden="true"><Icon name="check" size={16} stroke={3} /></span>
        <span className="tf-check-body">
          {title ? <b>{icon ? <Icon name={icon} size={14} /> : null} {title}{tag ? <em>{tag}</em> : null}</b> : null}
          <span>{children}</span>
        </span>
      </label>
      {error ? <p className="tf-err" id={`${id}-err`} role="alert">{error}</p> : null}
    </div>
  );
}

export function Btn({ children, kind = 'main', busy, icon, iconEnd, className = '', ...rest }) {
  return (
    <button type="button" className={`tf-btn tf-btn-${kind} ${busy ? 'is-busy' : ''} ${className}`} aria-busy={busy || undefined} disabled={busy || rest.disabled} {...rest}>
      {icon ? <Icon name={icon} size={18} /> : null}
      <span>{children}</span>
      {iconEnd ? <Icon name={iconEnd} size={18} /> : null}
      {busy ? <i className="tf-spin" aria-hidden="true" /> : null}
    </button>
  );
}

export function Alert({ children, tone = 'bad', icon }) {
  if (!children) return null;
  return <div className={`tf-alert tf-alert-${tone}`} role={tone === 'bad' ? 'alert' : 'status'}><Icon name={icon || (tone === 'bad' ? 'question' : 'check')} size={18} /><div>{children}</div></div>;
}

// ---- confetti / sparkles on a canvas (skipped with reduced motion) ----
export function Celebrate({ fire, colors = ['#FF8A00', '#FFC233', '#8B5CF6', '#14C9B5', '#FF5E7E', '#2F6BFF'], shape = 'confetti' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!fire || reducedMotion()) return undefined;
    const cv = ref.current;
    if (!cv) return undefined;
    const ctx = cv.getContext('2d');
    const W = (cv.width = cv.offsetWidth * (window.devicePixelRatio || 1));
    const H = (cv.height = cv.offsetHeight * (window.devicePixelRatio || 1));
    const n = shape === 'stars' ? 70 : 140;
    const ps = Array.from({ length: n }, () => ({
      x: W / 2 + (Math.random() - 0.5) * W * 0.2, y: H * 0.45, vx: (Math.random() - 0.5) * W * 0.02, vy: -Math.random() * H * 0.025 - H * 0.006,
      r: (Math.random() * 6 + 4) * (window.devicePixelRatio || 1), a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3, c: colors[Math.floor(Math.random() * colors.length)],
    }));
    let raf = 0; let frame = 0;
    const tick = () => {
      frame += 1;
      ctx.clearRect(0, 0, W, H);
      ps.forEach((p) => {
        p.vy += H * 0.0006; p.x += p.vx; p.y += p.vy; p.a += p.va; p.vx *= 0.99;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - frame / 160);
        if (shape === 'stars') { ctx.beginPath(); for (let i = 0; i < 5; i += 1) { ctx.lineTo(Math.cos((18 + i * 72) / 57.3) * p.r, -Math.sin((18 + i * 72) / 57.3) * p.r); ctx.lineTo(Math.cos((54 + i * 72) / 57.3) * p.r * 0.45, -Math.sin((54 + i * 72) / 57.3) * p.r * 0.45); } ctx.closePath(); ctx.fill(); }
        else ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        ctx.restore();
      });
      if (frame < 170) raf = requestAnimationFrame(tick); else ctx.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fire]); // eslint-disable-line react-hooks/exhaustive-deps
  return <canvas ref={ref} className="tf-confetti" aria-hidden="true" />;
}

// map API field codes to text, with a fallback
export const fieldErr = (fields = {}, key) => (fields[key] ? err(fields[key]) : '');
export const newKey = () => {
  try { return Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => b.toString(16).padStart(2, '0')).join(''); } catch { return `${Date.now()}${Math.random().toString(16).slice(2)}`.padEnd(24, '0'); }
};
export const useUid = useId;

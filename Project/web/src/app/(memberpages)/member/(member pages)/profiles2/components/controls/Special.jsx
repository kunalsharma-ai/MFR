import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider.jsx';
import { PHONE } from '../../validation/phone-meta.js';
import { parsePhone } from '../../validation/phone.js';
import { checkEmailDomain, validateEmail } from '../../validation/email.js';
import { timezoneCountry } from '../../validation/geo.js';
import { CONFIG } from '../../config.js';
import Flag from '../Flag.jsx';
import { Combo } from './Controls.jsx';

export function guessCountry(ans) {
  const a = ans['residence-country'] || ans.country;
  if (a && PHONE[a]) return a;
  try {
    const tz = timezoneCountry(Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (tz) return tz;
    const reg = (navigator.language || '').split('-')[1];
    if (reg && PHONE[reg.toUpperCase()]) return reg.toUpperCase();
  } catch { /* */ }
  return 'IN';
}

/** Country calling-code picker + national number -> stores E.164 (+14155552671). */
export function PhoneInput({ value, onChange, onEnter, defaultCountry, autoFocus }) {
  const { t, lang } = useI18n();
  const parsed = value ? parsePhone(value, defaultCountry) : null;
  const [cc, setCc] = useState(parsed && !parsed.error ? parsed.country : defaultCountry);
  const [num, setNum] = useState(parsed && !parsed.error ? parsed.nsn : '');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { if (autoFocus) ref.current?.focus({ preventScroll: true }); }, [autoFocus]);
  const names = useMemo(() => { try { return new Intl.DisplayNames([lang], { type: 'region' }); } catch { return null; } }, [lang]);
  const items = useMemo(() => Object.entries(PHONE).map(([c, m]) => {
    let n = c; try { n = names?.of(c) || c; } catch { /* */ }
    return { value: c, label: `${n} +${m.dial}`, flag: c.toLowerCase() };
  }).sort((a, b) => a.label.localeCompare(b.label, lang)), [names, lang]);
  const emit = (c, n) => {
    const digits = n.replace(/[^\d]/g, '');
    if (!digits) return onChange('');
    if (n.trim().startsWith('+')) return onChange(n.replace(/[^\d+]/g, ''));
    const p = parsePhone(digits, c);
    onChange(p && !p.error ? p.e164 : `+${PHONE[c]?.dial}${digits}`);
  };
  return (
    <div className="phone" dir="ltr">
      {open ? (
        <div className="phone-cc-pick">
          <Combo items={items} value={cc} autoFocus placeholder={t('phone.code')} noMatch={t('q.noMatch')} moreLabel={(a, b) => t('q.more', { n: a, t: b })}
            onPick={(v) => { setCc(v); setOpen(false); emit(v, num); setTimeout(() => ref.current?.focus(), 30); }} onRaw={() => {}} />
        </div>
      ) : (
        <button type="button" className="phone-cc" onClick={() => setOpen(true)} aria-label={t('phone.code')}>
          <Flag cc={cc} size={18} /> <b>+{PHONE[cc]?.dial}</b>
        </button>
      )}
      <input ref={ref} className="field" type="tel" inputMode="tel" autoComplete="tel-national" value={num} placeholder={t('phone.num')}
        aria-label={t('phone.num')} data-q="phone" maxLength={22}
        onChange={(e) => {
          const v = e.target.value;
          if (v.trim().startsWith('+')) { const p = parsePhone(v); if (p && !p.error && p.country) { setCc(p.country); setNum(p.nsn); onChange(p.e164); return; } }
          setNum(v); emit(cc, v);
        }}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onEnter())} />
    </div>
  );
}

/** DD / MM / YYYY with auto-advance between parts. Stores ISO YYYY-MM-DD. */
export function DobInput({ value, onChange, onEnter, autoFocus }) {
  const { t } = useI18n();
  const init = /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value.split('-') : ['', '', ''];
  const [y, setY] = useState(init[0]), [m, setM] = useState(init[1]), [d, setD] = useState(init[2]);
  const rd = useRef(null), rm = useRef(null), ry = useRef(null);
  useEffect(() => { if (autoFocus) rd.current?.focus({ preventScroll: true }); }, [autoFocus]);
  const push = (dd, mm, yy) => onChange(dd && mm && yy.length === 4 ? `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}` : dd || mm || yy ? `${yy || '0000'}-${(mm || '0').padStart(2, '0')}-${(dd || '0').padStart(2, '0')}x` : '');
  const key = (e, prev) => {
    if (e.key === 'Enter') { e.preventDefault(); onEnter(); }
    if (e.key === 'Backspace' && !e.currentTarget.value && prev) prev.current?.focus();
  };
  const dig = (s, n) => s.replace(/\D/g, '').slice(0, n);
  return (
    <div className="dob" dir="ltr" role="group" aria-label={t('dob.label')}>
      <label><span>{t('dob.d')}</span><input ref={rd} className="field" inputMode="numeric" placeholder="DD" value={d} maxLength={2} autoComplete="bday-day"
        onChange={(e) => { const v = dig(e.target.value, 2); setD(v); push(v, m, y); if (v.length === 2 || +v > 3) rm.current?.focus(); }} onKeyDown={(e) => key(e)} /></label>
      <i aria-hidden="true">/</i>
      <label><span>{t('dob.m')}</span><input ref={rm} className="field" inputMode="numeric" placeholder="MM" value={m} maxLength={2} autoComplete="bday-month"
        onChange={(e) => { const v = dig(e.target.value, 2); setM(v); push(d, v, y); if (v.length === 2 || +v > 1) ry.current?.focus(); }} onKeyDown={(e) => key(e, rd)} /></label>
      <i aria-hidden="true">/</i>
      <label className="dob-y"><span>{t('dob.y')}</span><input ref={ry} className="field" inputMode="numeric" placeholder="YYYY" value={y} maxLength={4} autoComplete="bday-year"
        onChange={(e) => { const v = dig(e.target.value, 4); setY(v); push(d, m, v); }} onKeyDown={(e) => key(e, rm)} /></label>
    </div>
  );
}

/** Email with live typo suggestion ("gmial.com" -> "gmail.com") and DNS/MX domain check on blur. */
export function EmailInput({ value, onChange, onEnter, autoFocus, onDomain, placeholder }) {
  const { t } = useI18n();
  const ref = useRef(null);
  const [dom, setDom] = useState(null);
  useEffect(() => { if (autoFocus) ref.current?.focus({ preventScroll: true }); }, [autoFocus]);
  const r = value ? validateEmail(value) : null;
  const suggestion = r && !r.ok && r.key === 'e.emailTypo' ? r.vars.s : null;
  const check = async () => {
    const v = validateEmail(value || '');
    if (!v.ok || !v.value) return;
    setDom('checking');
    const res = await checkEmailDomain(v.value, { endpoint: CONFIG.apiBase ? CONFIG.apiBase.replace(/\/$/, '') + '/api/validate/email' : '' });
    setDom(res.status);
    onDomain?.(res.status);
  };
  return (
    <div className="email">
      <input ref={ref} className="field" type="email" inputMode="email" autoComplete="email" value={value || ''} placeholder={placeholder}
        data-q="email" maxLength={254} onChange={(e) => { setDom(null); onDomain?.(null); onChange(e.target.value); }} onBlur={check}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onEnter(); } }} />
      {suggestion && <button type="button" className="suggest" onClick={() => onChange(suggestion)}>{t('e.emailTypo', { s: suggestion })}</button>}
      {dom === 'checking' && <small className="muted dom-state">…</small>}
      {dom === 'ok' && <small className="dom-state ok">✓</small>}
    </div>
  );
}

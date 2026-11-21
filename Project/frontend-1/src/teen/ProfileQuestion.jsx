// One Teen Profile Survey question (teenProfiles.js), used by the welcome survey and the profile topics.
// Kinds: choice (single / multiple / exclusive answers, "other" text), language, timezone, textarea.
// Country / region / birthday are never asked here: they come from the registration and are locked.
import { useEffect, useMemo, useState } from 'react';
import { t, err } from './i18n.js';
import { LANGUAGES } from './data/surveyLanguages.js';
import { countries } from './geo.js';
import { Choice, Combo, TextInput, Field } from './ui.jsx';

export const LOCKED_KINDS = new Set(['country', 'region', 'dob']);
export const answered = (v) => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && String(v).trim() !== '');

export function useTimezones(country) {
  const [list, setList] = useState([]);
  useEffect(() => { countries().then(setList).catch(() => {}); }, []);
  return useMemo(() => {
    const local = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ''; } })();
    const mine = list.find((c) => c.i === country)?.tz || [];
    const all = [...new Set([local, ...mine, ...list.flatMap((c) => c.tz || [])].filter(Boolean))];
    return all.map((z) => ({ value: z, label: z.replace(/_/g, ' '), sub: z === local ? t('wl_tz_device') : mine.includes(z) ? t('wl_tz_country') : '' }));
  }, [list, country]);
}

export default function ProfileQuestion({ q, a, set, error, country, big = false }) {
  const tz = useTimezones(country);
  const id = `pq-${q.n}`;
  const v = a[q.n];
  if (q.kind === 'language') {
    return <Combo id={id} label={q.q} hint={q.help} optional={!q.req} span={2} allowCustom={false} value={v} error={error}
      options={LANGUAGES.map((l) => ({ value: l.code, label: l.native, sub: l.name !== l.native ? l.name : '' }))} onChange={(x) => set(q.n, x)} />;
  }
  if (q.kind === 'timezone') {
    return <Combo id={id} label={q.q} hint={q.help} optional={!q.req} span={2} allowCustom={false} value={v} error={error} options={tz} onChange={(x) => set(q.n, x)} max={80} />;
  }
  if (q.kind === 'textarea') {
    return (
      <Field id={id} label={q.q} hint={q.help} optional={!q.req} error={error} span={2}>
        <textarea id={id} className="tf-input tf-area" rows={4} maxLength={200} value={v || ''} onChange={(e) => set(q.n, e.target.value)} />
      </Field>
    );
  }
  if (!q.o) return null;
  const hasOther = q.other && (Array.isArray(v) ? v : [v]).includes(q.other);
  return (
    <>
      <Choice id={id} label={q.q} hint={q.help || (q.multi ? t('ob_choose_many') : '')} optional={!q.req} multi={Boolean(q.multi)} exclusive={q.exclusive || []} value={v} error={error}
        options={q.o.map(([label, value, emoji]) => ({ value, label, emoji }))} onChange={(x) => set(q.n, x)} columns={big ? 2 : q.o.length > 6 ? 2 : undefined} />
      {hasOther ? <TextInput id={`${id}__other`} label={t('ob_other')} value={a[`${q.n}__other`]} onChange={(x) => set(`${q.n}__other`, x)} maxLength={120} span={2} /> : null}
    </>
  );
}

export function checkQuestion(q, a) {
  const v = a[q.n];
  if (q.req && !answered(v)) return err('required');
  if (q.other && (Array.isArray(v) ? v : [v]).includes(q.other) && !answered(a[`${q.n}__other`])) return err('required');
  return '';
}
export function labelFor(q, v) {
  if (!answered(v)) return '—';
  if (q.kind === 'language') return LANGUAGES.find((l) => l.code === v)?.native || v;
  if (q.kind === 'timezone') return String(v).replace(/_/g, ' ');
  if (q.o) return (Array.isArray(v) ? v : [v]).map((x) => { const o = q.o.find((y) => y[1] === x); return o ? `${o[2] || ''} ${o[0]}`.trim() : x; }).join(', ');
  return String(v);
}

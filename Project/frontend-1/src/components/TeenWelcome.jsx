import { useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import { ME_API } from '../data/site.js';
import { patchJSON } from '../utils/api.js';
import { TEEN_PROFILE_Q, TEEN_SCHOOL, teenWelcomeAnswers, validateTeenWelcome } from '../utils/teenRegister.js';

// Teen welcome questionnaire (Round 12). It is NOT part of sign-up: it opens once, right after a teen whose parent has
// consented sets a password and logs in for the first time, and before the dashboard. Answers are saved to the member's
// profile with PATCH /api/v1/me/answer (the session exists by then). "Skip for now" goes straight to the dashboard and
// the questionnaire comes back on the next log in.
const DONE_KEY = 'mfr.teenWelcome.done';
export const teenWelcomeDone = (mail) => {
  try { return JSON.parse(localStorage.getItem(DONE_KEY) || '[]').includes(String(mail).toLowerCase()); } catch { return false; }
};
const markDone = (mail) => {
  try {
    const all = JSON.parse(localStorage.getItem(DONE_KEY) || '[]');
    localStorage.setItem(DONE_KEY, JSON.stringify([...new Set([...all, String(mail).toLowerCase()])]));
  } catch { /* storage blocked */ }
};

export default function TeenWelcome({ name = '', mail = '', demo = false, onDone }) {
  const [t, setT] = useState({ school: '', interests: [], devices: [], entertainment: [] });
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const errors = useMemo(() => validateTeenWelcome(t), [t]);
  const err = (k) => (shown ? errors[k] : undefined);
  const toggle = (k, x) => setT((s) => ({ ...s, [k]: s[k].includes(x) ? s[k].filter((y) => y !== x) : [...s[k], x] }));

  async function save(e) {
    e.preventDefault();
    setShown(true);
    if (Object.keys(errors).length) {
      setTimeout(() => document.querySelector('.tw-q.bad input')?.focus(), 30);
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      if (!demo) await patchJSON(`${ME_API}/answer`, teenWelcomeAnswers(t));
      markDone(mail);
      onDone?.();
    } catch {
      setMsg('We couldn’t save your answers. Please try again, or skip for now.');
      setBusy(false);
    }
  }

  return (
    <form className="tw" onSubmit={save} noValidate>
      <p className="tw-k"><Icon name="sparkle" size={15} /> Welcome questionnaire · 1 minute</p>
      <h2 className="tw-h">Tell us a little about you{name ? `, ${name}` : ''}</h2>
      <p className="tw-sub">Your answers help us invite you only to surveys that suit your age and interests. You can change them later in your profile.</p>

      <fieldset className={`tw-q ${err('school') ? 'bad' : ''}`}>
        <legend>Where are you at school?</legend>
        <div className="tq-opts" role="radiogroup">
          {TEEN_SCHOOL.map((x) => (
            <label key={x} className={`tq-chip ${t.school === x ? 'on' : ''}`}>
              <input type="radio" name="tw-school" value={x} checked={t.school === x} onChange={() => setT((s) => ({ ...s, school: x }))} />
              {x}
            </label>
          ))}
        </div>
        {err('school') ? <p className="f-err" role="alert">{err('school')}</p> : null}
      </fieldset>

      {TEEN_PROFILE_Q.map((q) => (
        <fieldset key={q.k} className={`tw-q ${err(q.k) ? 'bad' : ''}`}>
          <legend>{q.t} <small>{q.d}</small></legend>
          <div className="tq-opts">
            {q.opts.map((x) => {
              const on = t[q.k].includes(x);
              return (
                <label key={x} className={`tq-chip ${on ? 'on' : ''}`}>
                  <input type="checkbox" checked={on} onChange={() => toggle(q.k, x)} />
                  {on ? <Icon name="check" size={14} stroke={3} /> : null}{x}
                </label>
              );
            })}
          </div>
          {err(q.k) ? <p className="f-err" role="alert">{err(q.k)}</p> : null}
        </fieldset>
      ))}

      {msg ? <p className="form-error" role="alert">{msg}</p> : null}
      <div className="tw-nav">
        <button type="button" className="btn btn-ghost-dark" onClick={() => onDone?.()} disabled={busy}>Skip for now</button>
        <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
          {busy ? <><span className="spinner" /> Saving…</> : <>Save and open my dashboard <Icon name="arrow" size={18} /></>}
        </button>
      </div>
    </form>
  );
}

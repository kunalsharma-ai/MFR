// Page frame for every Teen registration screen: language + writing direction, the page's own colour world,
// 3D art, step rail, secure-link handling and (preview builds only) the sample mailbox.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Seo from '../seo/Seo.jsx';
import { asset } from '../utils/asset.js';
import { DEMO_MODE } from '../data/site.js';
import { t, useTeenLang } from './i18n.js';
import { demoReset, demoState } from './api.js';
import { reducedMotion } from './ui.jsx';
import './teen.css';

export function TeenSeo({ title, description, path }) {
  // every Teen journey page is private: never indexed, never in the sitemap
  return <Seo title={`${title} | MyFrequentRewards Teen Panel`} description={description} path={path} noindex />;
}

// <TeenPage world="s1"> sets the palette (.tz-w-s1 in teen.css), the language and the direction.
export function TeenPage({ world, children, label, className = '' }) {
  const { lang, dir } = useTeenLang();
  return (
    <section className={`tz tz-w-${world} ${className}`} lang={lang} dir={dir} aria-label={label}>
      <div className="tz-sky" aria-hidden="true"><i className="tz-b1" /><i className="tz-b2" /><i className="tz-b3" /><i className="tz-grain" /></div>
      <div className="tz-wrap">{children}</div>
      {DEMO_MODE ? <DemoMailbox /> : null}
    </section>
  );
}

// One of Kunal's 3D renders, floating (still when reduced motion is on)
export function Art({ name, className = '', size = 220, alt = '', float = true, delay = 0 }) {
  return (
    <img
      className={`tz-art ${float ? 'is-float' : ''} ${className}`}
      src={asset(`/images/minor/art/${name}.webp`)}
      width={size}
      height={size}
      alt={alt}
      aria-hidden={alt ? undefined : 'true'}
      loading="lazy"
      decoding="async"
      style={{ '--d': `${delay}s` }}
    />
  );
}
export function Emo({ name, size = 40, alt = '' }) {
  return <img className="tz-emo" src={asset(`/images/minor/emoji/${name}.webp`)} width={size} height={size} alt={alt} aria-hidden={alt ? undefined : 'true'} loading="lazy" decoding="async" />;
}

// Four-stop rail for the teen's sign-up (You · Your adult · Agree · Invite)
export function StepRail({ step, onJump, max }) {
  const items = [['en_s1', 'user'], ['en_s2', 'family'], ['en_s3', 'check'], ['en_s4', 'send']];
  return (
    <ol className="tz-rail" aria-label={t('step_of', step, 4)}>
      {items.map(([k, ic], i) => {
        const n = i + 1;
        const state = n < step ? 'done' : n === step ? 'now' : 'next';
        const can = onJump && n < step && n <= (max || step) && step < 4;
        return (
          <li key={k} className={`is-${state}`} aria-current={n === step ? 'step' : undefined}>
            {can ? (
              <button type="button" onClick={() => onJump(n)} aria-label={`${t('edit')}: ${t(k)}`}>
                <span className="tz-rail-dot"><Icon name={state === 'done' ? 'check' : ic} size={16} stroke={state === 'done' ? 3 : 2} /></span>
                <span className="tz-rail-t">{t(k)}</span>
              </button>
            ) : (
              <span className="tz-rail-in">
                <span className="tz-rail-dot"><Icon name={state === 'done' ? 'check' : ic} size={16} stroke={state === 'done' ? 3 : 2} /></span>
                <span className="tz-rail-t">{t(k)}</span>
              </span>
            )}
          </li>
        );
      })}
      <li className="tz-rail-bar" aria-hidden="true"><i style={{ '--p': `${((step - 1) / 3) * 100}%` }} /></li>
    </ol>
  );
}

// Secure links arrive as ?t=<token>. Read it once, keep it for this tab only, and take it out of the address bar so it
// is not left in history, screenshots or a Referer header.
export function useLinkToken(slot) {
  const [tok, setTok] = useState(null);
  useEffect(() => {
    const key = `mfr.teen.${slot}`;
    const u = new URL(window.location.href);
    const fromUrl = u.searchParams.get('t');
    let v = fromUrl;
    try {
      if (fromUrl) sessionStorage.setItem(key, fromUrl);
      else v = sessionStorage.getItem(key);
    } catch { /* storage blocked: keep it in memory */ }
    if (fromUrl) {
      u.searchParams.delete('t');
      window.history.replaceState(window.history.state, '', `${u.pathname}${u.search}${u.hash}`);
    }
    setTok(v || '');
  }, [slot]);
  return tok;
}
export const forgetLinkToken = (slot) => { try { sessionStorage.removeItem(`mfr.teen.${slot}`); } catch { /* */ } };

// Moves focus to a screen's heading when the screen changes (screen readers announce it; keyboard users start there)
export function useFocusTitle(dep) {
  const ref = useRef(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const el = ref.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    const top = el.getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion() ? 'auto' : 'smooth' });
  }, [dep]);
  return ref;
}

export function Loading({ label }) {
  return <div className="tz-loading" role="status"><i className="tf-spin" aria-hidden="true" /> {label || t('loading')}</div>;
}

export function LinkProblem({ code, onRenew, renewBusy, renewDone, home = '/' }) {
  const expired = code === 'link_expired';
  return (
    <div className="tz-card tz-problem" role="alert">
      <Art name={expired ? 'sunrise' : 'sentry'} size={150} />
      <h1 className="tz-h2">{expired ? t('pw_expired_h') : t(`e_${code}`) || t('e_link_invalid')}</h1>
      <p>{expired ? t('pw_expired_p') : t('e_link_invalid')}</p>
      {renewDone ? <p className="tz-ok"><Icon name="check" size={16} /> {t('rn_done')}</p> : null}
      <div className="tz-actions">
        {onRenew && !renewDone ? <button type="button" className="tf-btn tf-btn-main" onClick={onRenew} disabled={renewBusy}><Icon name="refresh" size={18} /> <span>{t('rn_btn')}</span></button> : null}
        <Link className="tf-btn tf-btn-ghost" to={home}><Icon name="home" size={18} /> <span>{t('s4_home')}</span></Link>
      </div>
      <p className="tz-small">{t('support_line')}</p>
    </div>
  );
}

// ───────────── preview builds only: the emails the stand-in server "sent", with clickable links ─────────────
const NAMES = {
  'guardian-invite': 'Guardian invitation (YES / NO)', 'teen-registered': 'Teen: registration received', 'guardian-approved': 'Guardian: thank you, next steps',
  'guardian-declined': 'Guardian: decision recorded', 'teen-declined': 'Teen: registration update', 'guardian-complete': 'Guardian: consent complete',
  'teen-password': 'Teen: create your password', 'teen-active': 'Teen: account active',
};
function DemoMailbox() {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState({});
  useEffect(() => {
    const read = () => setS(demoState());
    read();
    window.addEventListener('mfr:teen-demo', read);
    return () => window.removeEventListener('mfr:teen-demo', read);
  }, []);
  const box = useMemo(() => s.outbox || [], [s]);
  const linkOf = (d = {}) => Object.entries(d).filter(([, v]) => typeof v === 'string' && v.startsWith('/'));
  return (
    <aside className={`tz-mail ${open ? 'is-open' : ''}`} aria-label="Preview mailbox">
      <button type="button" className="tz-mail-tab" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Icon name="mail" size={18} /> <span>Preview mailbox</span>{box.length ? <b>{box.length}</b> : null}
      </button>
      {open ? (
        <div className="tz-mail-panel">
          <p className="tz-small">Preview only: these are the emails the live site would send. Links open the real pages.</p>
          {box.length === 0 ? <p className="tz-small">No emails yet. Register a teen to see the guardian’s invitation here.</p> : null}
          <ul>
            {box.map((m) => (
              <li key={m.id}>
                <span className={`tz-mail-to is-${m.to}`}>{m.to === 'guardian' ? 'Guardian' : 'Teen'}</span>
                <b>{m.subject}</b>
                <small>{NAMES[m.template] || m.template} · {m.address}</small>
                <span className="tz-mail-links">
                  {linkOf(m.data).map(([k, v]) => <a key={k} href={v} className={`is-${k}`}>{k === 'yes' ? 'YES' : k === 'no' ? 'NO' : k}</a>)}
                </span>
              </li>
            ))}
          </ul>
          <button type="button" className="tf-btn tf-btn-ghost tf-btn-sm" onClick={() => { demoReset(); try { sessionStorage.clear(); } catch { /* */ } }}>Reset the preview</button>
        </div>
      ) : null}
    </aside>
  );
}

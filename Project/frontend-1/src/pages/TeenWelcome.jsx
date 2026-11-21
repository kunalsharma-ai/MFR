// First log-in: a short welcome and the welcome survey (/teen/welcome). The questions are the Teen Profile Survey's own
// (teen/data/welcome.js); anything already known from the registration is shown as "saved", never asked again.
// One question per card, progress at the top, a review before saving. Look: arcade night (teen.css .tz-w-wl).
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Flag } from '../components/CountryPicker.jsx';
import { t, err } from '../teen/i18n.js';
import { teenApi } from '../teen/api.js';
import { DEMO_MODE } from '../data/site.js';
import { WELCOME_QUESTIONS, questionByKey } from '../teen/data/welcome.js';
import ProfileQuestion, { checkQuestion, labelFor, answered } from '../teen/ProfileQuestion.jsx';
import { TeenPage, TeenSeo, Art, Emo, useFocusTitle, Loading } from '../teen/shell.jsx';
import { Btn, Alert, Celebrate, tap } from '../teen/ui.jsx';
import { chime, fanfare, coinSound } from '../utils/sound.js';

const play = (fn) => { try { fn(); } catch { /* sound off */ } };
const DASHBOARD = import.meta.env.VITE_MEMBER_DASHBOARD_URL || '/member/dashboard';

export default function TeenWelcome() {
  const nav = useNavigate();
  const [me, setMe] = useState(null);
  const [problem, setProblem] = useState('');
  const [a, setA] = useState({});
  const [i, setI] = useState(-1); // -1 intro, 0..n-1 questions, n review, n+1 done
  const [e, setE] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const titleRef = useFocusTitle(i);

  useEffect(() => {
    teenApi.me().then((m) => {
      setMe(m); setA(m.answers || {});
      if (m.welcomeDone && !/again/.test(window.location.search)) {
        // a returning teen coming from the log-in goes straight on to the dashboard
        if (/from=login/.test(window.location.search) && !DEMO_MODE) { window.location.href = DASHBOARD; return; }
        setI(-2);
      }
    })
      .catch((x) => setProblem(x.code || 'signin'));
  }, []);
  // only what's still missing — a returning teen who answered some before isn't asked again
  const qs = useMemo(() => (me ? WELCOME_QUESTIONS.filter((q) => !answered(me.answers?.[q.n])) : []), [me]);
  const n = qs.length;
  const set = (k, v) => { setA((x) => ({ ...x, [k]: v })); setE(''); };

  const next = () => {
    const q = qs[i];
    const bad = checkQuestion(q, a);
    if (bad) { setE(bad); return; }
    tap(); play(() => coinSound());
    setI((x) => x + 1);
  };
  const save = async () => {
    setBusy(true); setMsg('');
    const out = {};
    qs.forEach((q) => { if (answered(a[q.n])) out[q.n] = a[q.n]; if (answered(a[`${q.n}__other`])) out[`${q.n}__other`] = a[`${q.n}__other`]; });
    try { await teenApi.saveAnswers(out, true); play(fanfare); setI(n + 1); }
    catch (x) { setMsg(err(x.code === 'validation' ? Object.values(x.fields || {})[0] : x.code) || err('server')); }
    setBusy(false);
  };

  if (problem) {
    return (
      <>
        <TeenSeo title="Welcome" description="Your Teen Panel welcome." path="/teen/welcome" />
        <TeenPage world="wl"><div className="tz-card tz-block"><Art name="arcade" size={150} /><h1 className="tz-h2">{t('pf_signin')}</h1><div className="tz-actions"><Link className="tf-btn tf-btn-main" to="/login?type=teen"><span>{t('en_login')}</span></Link></div></div></TeenPage>
      </>
    );
  }
  const known = me ? [
    ['D01', t('wl_k_age'), me.answers?.D01],
    ['D02', t('country'), me.teen?.location?.countryName, me.teen?.location?.country],
    ['D03', t('state'), me.teen?.location?.state],
    ['D06', t('gender'), me.teen?.gender ? t(`g_${me.teen.gender}`) : ''],
  ].filter((k) => k[2]) : [];
  const pct = i < 0 ? 0 : Math.round((Math.min(i, n) / Math.max(1, n)) * 100);
  return (
    <>
      <TeenSeo title="Welcome to the Teen Panel" description="A few quick questions to match you with surveys." path="/teen/welcome" />
      <TeenPage world="wl" label={t('wl_title')}>
        {!me ? <Loading /> : null}
        {me && i === -2 ? (
          <div className="tz-card tz-block tz-wl-done">
            <Art name="arcade" size={170} />
            <h1 className="tz-h2" ref={titleRef} tabIndex={-1}>{t('wl_hi', me.teen.firstName)}</h1>
            <p className="tz-lead">{t('wl_already')}</p>
            <div className="tz-actions"><Link className="tf-btn tf-btn-ghost" to="/teen/profile"><Icon name="user" size={18} /> <span>{t('wl_profile')}</span></Link><a className="tf-btn tf-btn-main" href={DASHBOARD}><span>{t('wl_dashboard')}</span> <Icon name="arrow" size={18} /></a></div>
          </div>
        ) : null}
        {me && i >= -1 ? (
          <div className="tz-wl">
            {i >= 0 && i <= n ? (
              <div className="tz-wl-top">
                <span className="tz-wl-xp" aria-hidden="true"><Emo name="star" size={22} /> {Math.min(i, n)}/{n}</span>
                <div className="tz-meter is-big" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={t('wl_q', Math.min(i + 1, n), n)}><i style={{ width: `${pct}%` }} /></div>
              </div>
            ) : null}
            {i === -1 ? (
              <div className="tz-wl-intro">
                <div className="tz-wl-hero" aria-hidden="true"><Art name="arcade" size={190} /><Art name="future" size={120} className="tz-wl-a2" delay={1} /><Art name="arena" size={110} className="tz-wl-a3" delay={2} /></div>
                <p className="tz-kicker"><Emo name="wave" size={22} /> {t('wl_hi', me.teen.firstName)}</p>
                <h1 className="tz-h1" ref={titleRef} tabIndex={-1}>{t('wl_title')}</h1>
                <p className="tz-lead">{n ? t('wl_lead') : t('wl_nothing')}</p>
                {known.length ? (
                  <div className="tz-wl-known">
                    <p><b><Icon name="check" size={14} stroke={3} /> {t('wl_known_h')}</b> <span className="tz-small">{t('wl_known_p')}</span></p>
                    <ul>{known.map(([k, l, v, flag]) => <li key={k}><small>{l}</small><b>{flag ? <Flag iso={flag} size={11} /> : null} {v}</b><Icon name="lock" size={12} /></li>)}</ul>
                  </div>
                ) : null}
                <div className="tz-actions">
                  {n ? <Btn iconEnd="arrow" onClick={() => { play(chime); setI(0); }}>{t('wl_go')}</Btn> : <Link className="tf-btn tf-btn-main" to="/teen/profile"><span>{t('wl_profile')}</span></Link>}
                  <a className="tf-btn tf-btn-ghost" href={DASHBOARD}><span>{t('wl_later')}</span></a>
                </div>
                <p className="tz-small"><Icon name="clock" size={13} /> {t('wl_time', n)}</p>
              </div>
            ) : null}
            {i >= 0 && i < n ? (
              <div className="tz-wl-card" key={qs[i].n}>
                <p className="tz-kicker">{t('wl_q', i + 1, n)} · <span aria-hidden="true">{qs[i].profileIcon}</span> {qs[i].profileName}</p>
                <h2 className="tz-wl-q" ref={titleRef} tabIndex={-1}>{qs[i].q}</h2>
                <ProfileQuestion q={{ ...qs[i], q: '' }} a={a} set={set} error={e} country={me.teen?.location?.country} big />
                <div className="tz-nav">
                  <Btn kind="ghost" icon="arrow" className="is-back" onClick={() => setI((x) => x - 1)}>{t('back')}</Btn>
                  <span className="tz-nav-r">
                    {!qs[i].req ? <button type="button" className="tz-link" onClick={() => { setA((x) => { const y = { ...x }; delete y[qs[i].n]; return y; }); setI((x) => x + 1); }}>{t('wl_skip_q')}</button> : null}
                    <Btn iconEnd="arrow" onClick={next}>{t('continue')}</Btn>
                  </span>
                </div>
              </div>
            ) : null}
            {i === n && n > 0 ? (
              <div className="tz-wl-card tz-wl-review">
                <h2 className="tz-h2" ref={titleRef} tabIndex={-1}>{t('wl_review_h')}</h2>
                <p className="tz-small">{t('wl_review_p')}</p>
                <ul className="tz-wl-list">
                  {qs.map((q, k) => (
                    <li key={q.n}><button type="button" onClick={() => setI(k)}><small>{q.q}</small><b>{labelFor(q, a[q.n])}{a[`${q.n}__other`] ? ` · ${a[`${q.n}__other`]}` : ''}</b><Icon name="pen" size={14} /></button></li>
                  ))}
                </ul>
                {msg ? <Alert>{msg}</Alert> : null}
                <div className="tz-nav"><Btn kind="ghost" icon="arrow" className="is-back" onClick={() => setI(n - 1)}>{t('back')}</Btn><Btn icon="check" busy={busy} onClick={save}>{t('wl_finish')}</Btn></div>
              </div>
            ) : null}
            {i === n + 1 ? (
              <div className="tz-wl-card tz-wl-fin">
                <Celebrate fire colors={['#FF3DA5', '#7C5CFF', '#22E3C3', '#FFD23F']} />
                <Art name="celebrate" size={170} />
                <h2 className="tz-h1" ref={titleRef} tabIndex={-1}>{t('wl_done_h')}</h2>
                <p className="tz-lead">{t('wl_done_p')}</p>
                <div className="tz-actions"><Btn kind="ghost" icon="user" onClick={() => nav('/teen/profile')}>{t('wl_profile')}</Btn><a className="tf-btn tf-btn-main" href={DASHBOARD}><span>{t('wl_dashboard')}</span> <Icon name="arrow" size={18} /></a></div>
              </div>
            ) : null}
          </div>
        ) : null}
      </TeenPage>
    </>
  );
}
export { questionByKey };

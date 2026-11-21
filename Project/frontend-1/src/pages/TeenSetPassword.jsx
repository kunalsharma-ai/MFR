// The teen creates their password from the single-use link emailed after the guardian's consent
// (/teen/set-password?t=…). The account switches on only here. Look: a vault (teen.css .tz-w-pw).
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { t, err } from '../teen/i18n.js';
import * as R from '../teen/rules.js';
import { teenApi, relationLabel } from '../teen/api.js';
import { TeenPage, TeenSeo, Art, useLinkToken, forgetLinkToken, useFocusTitle, Loading, LinkProblem } from '../teen/shell.jsx';
import { Btn, Alert, Celebrate } from '../teen/ui.jsx';
import { fanfare } from '../utils/sound.js';

export default function TeenSetPassword() {
  const token = useLinkToken('password');
  const nav = useNavigate();
  const [view, setView] = useState(null);
  const [problem, setProblem] = useState(null);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);
  const [renew, setRenew] = useState('idle');
  const [mail, setMail] = useState('');
  const titleRef = useFocusTitle(`${done}-${Boolean(problem)}`);

  useEffect(() => {
    if (token === null) return;
    if (!token) { setProblem({ code: 'link_invalid' }); return; }
    teenApi.passwordView(token).then(setView).catch((e) => setProblem({ code: e.code, canRenew: e.extra?.canRenew }));
  }, [token]);

  const who = { email: view?.email, firstName: view?.firstName };
  const rules = [
    ['pw_rule_len', pw.length >= 8],
    ['pw_rule_mix', /[A-Za-z]/.test(pw) && /\d/.test(pw)],
    ['pw_rule_personal', pw.length > 0 && R.validatePassword(pw, who) !== 'pw_personal'],
    ['pw_rule_match', pw.length > 0 && pw === pw2],
  ];
  const strength = rules.filter((r) => r[1]).length;
  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    const pe = R.validatePassword(pw, who) || (pw !== pw2 ? 'pw_match' : null);
    if (pe) { setMsg(err(pe)); return; }
    setBusy(true);
    try {
      await teenApi.setPassword(token, pw, pw2);
      forgetLinkToken('password');
      setDone(true);
      try { fanfare(); } catch { /* */ }
    } catch (ex) {
      setBusy(false);
      if (ex.code === 'validation') setMsg(err(Object.values(ex.fields || {})[0]) || err('server'));
      else if (['link_used', 'link_expired', 'link_revoked', 'already_done'].includes(ex.code)) setProblem({ code: ex.code, canRenew: ex.code !== 'already_done' });
      else setMsg(err(ex.code) || err('server'));
    }
  };

  return (
    <>
      <TeenSeo title="Create your password" description="Create the password for your Teen Panel account." path="/teen/set-password" />
      <TeenPage world="pw" label={t('pw_title')}>
        {!view && !problem ? <Loading /> : null}
        {problem ? (
          problem.code === 'already_done' ? (
            <div className="tz-card tz-block"><Art name="celebrate" size={150} /><h1 className="tz-h2" ref={titleRef} tabIndex={-1}>{t('pw_done_h')}</h1><p className="tz-lead">{t('pw_already')}</p><div className="tz-actions"><Link className="tf-btn tf-btn-main" to="/login?type=teen"><span>{t('pw_login')}</span></Link></div></div>
          ) : (
            <div>
              <LinkProblem code={problem.code} renewDone={renew === 'done'} />
              {problem.canRenew && renew !== 'done' ? (
                <form className="tz-card tz-renew-inline" onSubmit={async (e) => { e.preventDefault(); setRenew('busy'); try { await teenApi.renew(mail); } catch { /* same answer either way */ } setRenew('done'); }}>
                  <label className="tf-label" htmlFor="pw-renew">{t('rn_lead')}</label>
                  <input id="pw-renew" className="tf-input" type="email" value={mail} onChange={(e) => setMail(e.target.value.trim())} autoComplete="email" required />
                  <Btn type="submit" busy={renew === 'busy'} icon="refresh" disabled={!R.validEmail(mail)}>{t('rn_btn')}</Btn>
                </form>
              ) : null}
            </div>
          )
        ) : null}
        {view && !problem && !done ? (
          <div className="tz-pw">
            <div className="tz-vault" aria-hidden="true">
              <div className={`tz-vault-door s-${strength}`}><span className="tz-vault-wheel">{[0, 1, 2, 3].map((i) => <i key={i} className={i < strength ? 'on' : ''} />)}</span></div>
              <Art name="treasury" size={140} className="tz-vault-art" />
            </div>
            <form className="tz-card tz-pw-card" onSubmit={submit} noValidate>
              <p className="tz-kicker"><Icon name="key" size={15} /> {view.reference}</p>
              <h1 className="tz-h2" ref={titleRef} tabIndex={-1}>{t('pw_title')}</h1>
              <p className="tz-lead">{t('pw_lead', relationLabel(view.relation || '').toLowerCase() || t('s4_adult'), view.firstName)}</p>
              <div className="tz-user"><small>{t('pw_user')}</small><b className="tz-mono">{view.email}</b></div>
              <input type="email" autoComplete="username" value={view.email} readOnly hidden />
              <div className="tf-field tf-span-2">
                <label className="tf-label" htmlFor="pw-new">{t('pw_new')}</label>
                <div className="tz-pw-row">
                  <input id="pw-new" className="tf-input" type={show ? 'text' : 'password'} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} maxLength={128} aria-describedby="pw-rules" />
                  <button type="button" className="tz-eye" onClick={() => setShow((s) => !s)} aria-pressed={show}>{show ? t('pw_hide') : t('pw_show')}</button>
                </div>
              </div>
              <div className="tf-field tf-span-2">
                <label className="tf-label" htmlFor="pw-again">{t('pw_again')}</label>
                <input id="pw-again" className="tf-input" type={show ? 'text' : 'password'} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} maxLength={128} />
              </div>
              <ul className="tz-rules" id="pw-rules">{rules.map(([k, ok]) => <li key={k} className={ok ? 'on' : ''}><Icon name={ok ? 'check' : 'close'} size={12} stroke={3} /> {t(k)}</li>)}</ul>
              {msg ? <Alert>{msg}</Alert> : null}
              <Btn type="submit" busy={busy} icon="key" disabled={strength < 4}>{t('pw_btn')}</Btn>
              <p className="tz-small">{t('pw_safe')}</p>
            </form>
          </div>
        ) : null}
        {done ? (
          <div className="tz-card tz-block tz-pw-done">
            <Celebrate fire shape="confetti" colors={['#14C9B5', '#FFC233', '#8B5CF6', '#FFFFFF']} />
            <Art name="celebrate" size={170} />
            <h1 className="tz-h1" ref={titleRef} tabIndex={-1}>{t('pw_done_h')}</h1>
            <p className="tz-lead">{t('pw_done_p')}</p>
            <div className="tz-user"><small>{t('pw_user')}</small><b className="tz-mono">{view?.email}</b></div>
            <div className="tz-actions"><Btn iconEnd="arrow" onClick={() => nav('/login?type=teen')}>{t('pw_login')}</Btn></div>
          </div>
        ) : null}
      </TeenPage>
    </>
  );
}

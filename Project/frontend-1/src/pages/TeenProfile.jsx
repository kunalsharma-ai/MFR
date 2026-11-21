// The teen's profile (/teen/profile): their own details, their parent / guardian kept as a separate record, the consent
// on file, and the 13 profile topics from the Teen Profile Survey. Registration details (name, birthday, email, where
// they live, gender) are guardian-controlled: shown with a lock and changed only through support with the guardian's
// confirmation. Topic answers are the teen's own and save straight away. Look: a bright world map (.tz-w-pf).
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Flag } from '../components/CountryPicker.jsx';
import { t, err, fmtDate } from '../teen/i18n.js';
import { teenApi, relationLabel } from '../teen/api.js';
import { MINOR_PROFILES } from '../teen/data/teenProfiles.js';
import { SELECTIONS, EN as CEN } from '../teen/data/consent.js';
import ProfileQuestion, { LOCKED_KINDS, answered, checkQuestion } from '../teen/ProfileQuestion.jsx';
import { TeenPage, TeenSeo, Art, Emo, useFocusTitle, Loading } from '../teen/shell.jsx';
import { Btn, Alert, tap } from '../teen/ui.jsx';
import { coinSound } from '../utils/sound.js';

const qsOf = (p) => p.sections.flatMap((s) => s.qs).filter((q) => !LOCKED_KINDS.has(q.kind));

export default function TeenProfile() {
  const [me, setMe] = useState(null);
  const [problem, setProblem] = useState('');
  const [a, setA] = useState({});
  const [open, setOpen] = useState(null); // profile id
  const [draft, setDraft] = useState({});
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [lockInfo, setLockInfo] = useState(false);
  const titleRef = useFocusTitle(open);

  useEffect(() => { teenApi.me().then((m) => { setMe(m); setA(m.answers || {}); }).catch((x) => setProblem(x.code || 'signin')); }, []);
  const stats = useMemo(() => MINOR_PROFILES.map((p) => {
    const qs = qsOf(p).filter((q) => !q.when || q.when(a));
    return { p, total: qs.length, done: qs.filter((q) => answered(a[q.n])).length };
  }), [a]);

  const openTopic = (id) => { tap(); setOpen(id); setDraft({ ...a }); setErrs({}); setMsg(''); };
  const saveTopic = async () => {
    const p = MINOR_PROFILES.find((x) => x.id === open);
    const qs = qsOf(p).filter((q) => !q.when || q.when(draft));
    const e = {};
    qs.forEach((q) => { const bad = answered(draft[q.n]) || q.req ? checkQuestion(q, draft) : ''; if (bad && answered(draft[q.n])) e[q.n] = bad; });
    if (Object.keys(e).length) { setErrs(e); return; }
    const out = {};
    qs.forEach((q) => {
      if (me.locked.includes(q.n)) return;
      if (answered(draft[q.n]) && JSON.stringify(draft[q.n]) !== JSON.stringify(a[q.n])) out[q.n] = draft[q.n];
      if (answered(draft[`${q.n}__other`])) out[`${q.n}__other`] = draft[`${q.n}__other`];
    });
    setBusy(true); setMsg('');
    try {
      if (Object.keys(out).length) await teenApi.saveAnswers(out);
      setA((x) => ({ ...x, ...out }));
      try { coinSound(); } catch { /* */ }
      setOpen(null);
    } catch (x) { setMsg(err(x.code === 'validation' ? Object.values(x.fields || {})[0] : x.code) || err('server')); }
    setBusy(false);
  };

  if (problem) {
    return (
      <>
        <TeenSeo title="My profile" description="Your Teen Panel profile." path="/teen/profile" />
        <TeenPage world="pf"><div className="tz-card tz-block"><Art name="atlas" size={150} /><h1 className="tz-h2">{t('pf_signin')}</h1><div className="tz-actions"><Link className="tf-btn tf-btn-main" to="/login?type=teen"><span>{t('en_login')}</span></Link></div></div></TeenPage>
      </>
    );
  }
  const tn = me?.teen || {};
  const g = me?.guardian || {};
  const topic = open ? MINOR_PROFILES.find((x) => x.id === open) : null;
  const totalDone = stats.reduce((s, x) => s + x.done, 0);
  const total = stats.reduce((s, x) => s + x.total, 0);
  return (
    <>
      <TeenSeo title="My profile" description="Your Teen Panel profile." path="/teen/profile" />
      <TeenPage world="pf" label={t('pf_title')}>
        {!me ? <Loading /> : null}
        {me && !topic ? (
          <div className="tz-pf">
            <header className="tz-pf-head">
              <div className="tz-pf-av" aria-hidden="true">{(tn.firstName || '?')[0]}</div>
              <div>
                <p className="tz-kicker">{t('pf_member_since', fmtDate(tn.memberSince))} · {me.reference}</p>
                <h1 className="tz-h2" ref={titleRef} tabIndex={-1}>{[tn.firstName, tn.lastName].filter(Boolean).join(' ')}</h1>
                <p className="tz-small">{t('pf_lead')}</p>
              </div>
              <div className="tz-pf-ring" style={{ '--p': `${total ? (totalDone / total) * 100 : 0}%` }} aria-label={t('pf_done', totalDone, total)}><b>{total ? Math.round((totalDone / total) * 100) : 0}%</b></div>
            </header>
            <div className="tz-pf-grid">
              <section className="tz-pf-card">
                <h2 className="tz-h4"><Emo name="smile" size={22} /> {t('pf_me')}</h2>
                <dl className="tz-pf-dl">
                  <Row l={t('first_name')} v={[tn.firstName, tn.middleName].filter(Boolean).join(' ')} lock />
                  <Row l={t('last_name')} v={tn.lastName} lock />
                  <Row l={t('dob')} v={fmtDate(tn.dob)} lock />
                  <Row l={t('gender')} v={tn.gender ? `${t(`g_${tn.gender}`)}${tn.genderSelf ? ` · ${tn.genderSelf}` : ''}` : '—'} lock />
                  <Row l={t('email')} v={tn.email} lock mono />
                  <Row l={t('phone')} v={tn.phone ? `+${String(tn.phone).replace(/^\+/, '')}` : '—'} lock />
                </dl>
              </section>
              <section className="tz-pf-card">
                <h2 className="tz-h4"><Emo name="rocket" size={22} /> {t('pf_where')}</h2>
                <dl className="tz-pf-dl">
                  <Row l={t('country')} v={<>{tn.location?.country ? <Flag iso={tn.location.country} size={12} /> : null} {tn.location?.countryName}</>} lock />
                  <Row l={t('state')} v={tn.location?.state || '—'} lock />
                  <Row l={t('city')} v={tn.location?.city || '—'} lock />
                  <Row l={t('zip')} v={tn.location?.zip || '—'} lock />
                </dl>
              </section>
              <section className="tz-pf-card tz-pf-adult">
                <h2 className="tz-h4"><Emo name="family" size={22} /> {t('pf_adult')}</h2>
                <p className="tz-small">{t('pf_adult_p')}</p>
                <dl className="tz-pf-dl">
                  <Row l={t('pf_relation')} v={`${relationLabel(g.relation)} · ${g.firstName || ''}`} />
                  <Row l={t('email')} v={g.emailMasked} mono />
                  <Row l={t('pf_consent')} v={g.consentVersion ? `${t('pf_consent_v', g.consentVersion)} · ${fmtDate(g.consentAt)}` : '—'} />
                  {(g.optional || []).map((o) => <Row key={o.id} l={CEN[`c_${o.id}_k`] || o.id} v={o.accepted ? t('ap_given') : t('ap_not_given')} />)}
                </dl>
              </section>
            </div>
            <p className="tz-small tz-lockline"><Icon name="lock" size={13} /> {t('pf_locked_p')} <button type="button" className="tz-link" onClick={() => setLockInfo((x) => !x)} aria-expanded={lockInfo}>{t('pf_how_change')}</button></p>
            {lockInfo ? <Alert tone="info" icon="shield">{t('pf_change_steps')}</Alert> : null}
            <h2 className="tz-h3 tz-pf-topics-h">{t('pf_topics')} <span className="tz-small">{t('pf_done', totalDone, total)}</span></h2>
            <ul className="tz-worlds">
              {stats.map(({ p, total: tt, done }, k) => (
                <li key={p.id} style={{ '--i': k }}>
                  <button type="button" className={`tz-world is-${p.theme} ${done === tt && tt ? 'is-full' : ''}`} onClick={() => openTopic(p.id)}>
                    <Art name={p.theme} size={92} float={false} />
                    <b><span aria-hidden="true">{p.icon}</span> {p.name}</b>
                    <small>{p.blurb}</small>
                    <span className="tz-world-bar"><i style={{ width: `${tt ? (done / tt) * 100 : 0}%` }} /></span>
                    <em>{done === tt && tt ? <><Icon name="check" size={12} stroke={3} /> {t('pf_complete')}</> : t('pf_done', done, tt)}</em>
                  </button>
                </li>
              ))}
            </ul>
            <p className="tz-small tz-center"><Link to="/teen/welcome?again=1">{t('pf_welcome_again')}</Link> · <Link to="/teen/terms">{t('link_teen_terms')}</Link></p>
          </div>
        ) : null}
        {topic ? (
          <div className={`tz-topic is-${topic.theme}`}>
            <header className="tz-topic-head">
              <button type="button" className="tz-link" onClick={() => setOpen(null)}><Icon name="arrow" size={14} className="tz-flip" /> {t('pf_title')}</button>
              <div className="tz-topic-t">
                <Art name={topic.theme} size={130} />
                <div><h1 className="tz-h2" ref={titleRef} tabIndex={-1}><span aria-hidden="true">{topic.icon}</span> {topic.name}</h1><p className="tz-small">{topic.blurb}</p></div>
              </div>
            </header>
            {topic.sections.map((s) => {
              const qs = s.qs.filter((q) => (!q.when || q.when(draft)));
              if (!qs.length) return null;
              return (
                <section key={s.name} className="tz-topic-sec">
                  <h2 className="tz-h4"><span aria-hidden="true">{s.icon}</span> {s.name}</h2>
                  <div className="tz-topic-qs">
                    {qs.map((q) => (LOCKED_KINDS.has(q.kind) || me.locked.includes(q.n) ? (
                      <div key={q.n} className="tz-known"><div><small>{q.q}</small><b>{q.n === 'D02' ? tn.location?.countryName : q.n === 'D03' ? tn.location?.state : q.n === 'D01' ? t('gd_age', a.D01) : q.n === 'D06' ? t(`g_${tn.gender}`) : String(a[q.n] || '—')}</b><em><Icon name="lock" size={11} /> {t('pf_locked')}</em></div></div>
                    ) : (
                      <ProfileQuestion key={q.n} q={q} a={draft} set={(k, v) => { setDraft((x) => ({ ...x, [k]: v })); setErrs((x) => ({ ...x, [k]: '' })); }} error={errs[q.n]} country={tn.location?.country} />
                    )))}
                  </div>
                </section>
              );
            })}
            {msg ? <Alert>{msg}</Alert> : null}
            <div className="tz-nav tz-sticky"><Btn kind="ghost" onClick={() => setOpen(null)} disabled={busy}>{t('close')}</Btn><Btn icon="check" busy={busy} onClick={saveTopic}>{t('pf_save')}</Btn></div>
          </div>
        ) : null}
      </TeenPage>
    </>
  );
}
function Row({ l, v, lock, mono }) {
  return <div className="tz-pf-row"><dt>{l}</dt><dd className={mono ? 'tz-mono' : ''}>{v || '—'}{lock ? <Icon name="lock" size={12} className="tz-lock" /> : null}</dd></div>;
}

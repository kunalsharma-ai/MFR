import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { PROFILES } from '../data/profiles.generated.js';
import { ProfileRun } from '../lib/profileEngine.js';
import { themeFor } from '../themes/themes.js';
import { completeness } from '../validation/completeness.js';
import { emojiUrl } from '../lib/assets.js';
import ProgressRing from './ProgressRing.jsx';
import MemberCard from './MemberCard.jsx';
import { ISearch, IArrow, IEdit } from './Icons.jsx';

export function profileStatus(p) {
  if (ProfileRun.saved(p)) return { pct: 100, done: true };
  const d = ProfileRun.draft(p);
  return d ? { pct: Math.max(1, d.p || 1), done: false } : { pct: 0, done: false };
}

function WorldCard({ p, i, st, onOpen }) {
  const { t, lang } = useI18n();
  const th = themeFor(p.s);
  const name = t('p.' + p.s);
  const nf = new Intl.NumberFormat(lang);
  const cls = st.done ? 'is-done' : st.pct > 0 ? 'is-going' : 'is-new';
  return (
    <button type="button" className={`world ${cls} cat-${p.c}`} onClick={() => onOpen(p)} style={{ '--i': Math.min(i, 12) }}
      aria-label={`${name} - ${t('hub.q', { n: nf.format(p.q) })}${st.done ? ' - ' + t('hub.done') : st.pct ? ' - ' + t('hub.progress', { p: st.pct }) : ''}`}>
      <MemberCard theme={th} name={name} done={st.done} variant="hub">
        <span className="mc-meta">
          <span>{t('hub.q', { n: nf.format(p.q) })}</span>
          <span className={`mc-pill ${st.done ? 'ok' : st.pct ? 'go' : ''}`}>
            {st.done ? <><IEdit /> {t('hub.review')}</> : st.pct ? t('hub.progress', { p: nf.format(st.pct) }) : <>{t('hub.start')} <IArrow /></>}
          </span>
        </span>
        <span className="mc-bar"><i style={{ transform: `scaleX(${st.pct / 100})` }} /></span>
      </MemberCard>
    </button>
  );
}

function Section({ id, title, emoji, count, children, empty, tone }) {
  return (
    <section className={`hub-sec sec-${tone}`} aria-labelledby={id}>
      <h3 className="hub-sec-h" id={id}>
        <img src={emojiUrl(emoji)} alt="" width="34" height="34" aria-hidden="true" />
        <span>{title}</span>
        <span className="hub-sec-n">{count}</span>
      </h3>
      {count ? <div className="worlds">{children}</div> : <p className="hub-empty">{empty}</p>}
    </section>
  );
}

export default function Hub({ onOpen, cat, setCat }) {
  const { t, lang } = useI18n();
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);
  const nf = new Intl.NumberFormat(lang);
  const groups = useMemo(() => {
    const s = dq.trim().toLocaleLowerCase();
    const list = PROFILES.filter((p) => p.c === cat && (!s || t('p.' + p.s).toLocaleLowerCase().includes(s) || p.n.includes(s)));
    const g = { going: [], fresh: [], done: [] };
    for (const p of list) {
      const st = profileStatus(p);
      g[st.done ? 'done' : st.pct > 0 ? 'going' : 'fresh'].push([p, st]);
    }
    return g;
  }, [dq, cat, t]);
  const total = groups.going.length + groups.fresh.length + groups.done.length;
  // mount cards in small batches so no single main-thread task gets long (keeps scrolling/typing smooth)
  const [limit, setLimit] = useState(8);
  useEffect(() => {
    if (limit >= total) return;
    const id = setTimeout(() => startTransition(() => setLimit((l) => l + 8)), 30);
    return () => clearTimeout(id);
  }, [limit, total]);
  const mine = PROFILES.filter((p) => p.c === cat);
  const done = mine.filter((p) => profileStatus(p).done).length;
  const comp = useMemo(() => completeness(cat), [cat, done]);
  const pct = comp.pct;
  let budget = limit;
  const cards = (arr) => {
    const out = arr.slice(0, Math.max(0, budget)).map(([p, st], i) => <WorldCard key={p.id} p={p} st={st} i={i} onOpen={onOpen} />);
    budget -= arr.length;
    return out;
  };
  return (
    <section className="hub wrap" id="worlds" aria-labelledby="hub-title">
      <div className="hub-head">
        <h2 id="hub-title">{t('hub.title')}</h2>
        <div className="hub-tools">
          <div className="seg" role="tablist" aria-label={t('hub.title')}>
            {[['b2c', t('hub.adults'), 'person'], ['minor', t('hub.minors'), 'child']].map(([k, l, ic]) => (
              <button key={k} role="tab" type="button" aria-selected={cat === k} className={cat === k ? 'on' : ''} onClick={() => setCat(k)}>
                <img src={emojiUrl(ic)} alt="" width="20" height="20" aria-hidden="true" /> {l} <span className="seg-n">{nf.format(PROFILES.filter((p) => p.c === k).length)}</span>
              </button>
            ))}
          </div>
          <label className="search">
            <ISearch />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('hub.search')} aria-label={t('hub.search')} />
          </label>
        </div>
        <div className="overall" aria-label={t('hub.complete')}>
          <ProgressRing pct={pct} size={64} stroke={7} label={`${t('hub.complete')} ${pct}%`}>
            <b>{nf.format(pct)}%</b>
          </ProgressRing>
          <div className="overall-txt">
            <b>{t('hub.complete')}</b>
            <span>{t('hub.count', { d: nf.format(done), t: nf.format(mine.length) })}</span>
            <span className="areas" aria-hidden="true">
              {comp.parts.map((a) => (
                <span key={a.id} className="area" title={`${t('area.' + a.id)} ${a.pct}%`}><i style={{ transform: `scaleY(${Math.max(0.08, a.pct / 100)})` }} /></span>
              ))}
            </span>
          </div>
        </div>
      </div>
      {!total && <p className="empty">{t('hub.none')}</p>}
      {groups.going.length > 0 && (
        <Section id="sec-going" tone="going" emoji="hourglass" title={t('hub.sec.going')} count={groups.going.length}>{cards(groups.going)}</Section>
      )}
      {groups.fresh.length > 0 && (
        <Section id="sec-new" tone="new" emoji="rocket" title={t('hub.sec.new')} count={groups.fresh.length}>{cards(groups.fresh)}</Section>
      )}
      {total > 0 && (
        <Section id="sec-done" tone="done" emoji="trophy" title={t('hub.sec.done')} count={groups.done.length} empty={t('hub.sec.doneEmpty')}>{cards(groups.done)}</Section>
      )}
    </section>
  );
}

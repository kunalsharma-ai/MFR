// The full teen research terms (agreement MINOR-2026.10, Part A) as a readable page: /teen/terms.
// Linked from the teen's step 3 and the guardian's pages. Approved text only (teen/data/consent.js).
import Icon from '../components/Icon.jsx';
import { Link } from 'react-router-dom';
import { t, fmtDate } from '../teen/i18n.js';
import { TERMS_VERSION, EFFECTIVE, CHAPTERS, ASSENT, ASSENT_EMOJI, EN as CEN } from '../teen/data/consent.js';
import ConsentReader from '../teen/ConsentReader.jsx';
import { TeenPage, TeenSeo, Art } from '../teen/shell.jsx';

export default function TeenTerms() {
  return (
    <>
      <TeenSeo title="Teen research terms" description="The MyFrequentRewards teen research terms and parental consent information (MINOR-2026.10)." path="/teen/terms" />
      <TeenPage world="tm" label={CEN.h1}>
        <div className="tz-tm">
          <header className="tz-tm-head">
            <div>
              <p className="tz-kicker"><Icon name="book" size={15} /> {t('cs_meta', TERMS_VERSION, fmtDate(EFFECTIVE))}</p>
              <h1 className="tz-h1 tz-serif">{CEN.h1}</h1>
              <p className="tz-lead">{CEN.lead}</p>
              <nav className="tz-toc" aria-label={t('tm_toc')}>
                {CHAPTERS.map((c) => <a key={c.id} href={`#ch-${c.id}`} style={{ '--c1': c.grade[0] }}><span aria-hidden="true">{c.emoji}</span> {c.title}</a>)}
                <a href="#tm-assent"><span aria-hidden="true">🙋</span> {CEN.partC_h}</a>
              </nav>
            </div>
            <Art name="campus" size={190} />
          </header>
          <ConsentReader openAll idPrefix="sec" read={[]} />
          <section className="tz-paper tz-tm-assent" id="tm-assent">
            <h2 className="tz-h3 tz-serif">{CEN.partC_h}</h2>
            <p>{CEN.c_lead}</p>
            <p><b>{CEN.c_if}</b></p>
            <ul className="tz-assent">{ASSENT.map((a, i) => <li key={a}><span aria-hidden="true">{ASSENT_EMOJI[i]}</span>{a}</li>)}</ul>
            <p>{CEN.c_decide}</p>
          </section>
          <p className="tz-small tz-center">{CEN.legal_en} · <button type="button" className="tz-link" onClick={() => window.print()}>{t('cs_print')}</button> · <Link to="/privacy">{t('link_privacy')}</Link></p>
        </div>
      </TeenPage>
    </>
  );
}

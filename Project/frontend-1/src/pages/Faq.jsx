import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import PageHero, { PageSeo } from '../components/PageHero.jsx';
import { askLiveHelp, CtaBand, FaqList } from '../components/Common.jsx';
import { ALL_FAQS, PAGES } from '../data/pages.js';
import { CONTACT, whatsappLink } from '../data/site.js';

const page = PAGES.faq;
const crumbs = [{ name: 'Home', path: '/' }, { name: 'FAQ', path: page.path }];
const CATS = ['All', ...Array.from(new Set(ALL_FAQS.map((f) => f.cat)))];
const META = {
  All: { icon: 'sparkle', c: '#7048E8' },
  'Getting started': { icon: 'rocket', c: '#FF8A00' },
  Account: { icon: 'key', c: '#2F6BFF' },
  Surveys: { icon: 'clipboard', c: '#14C9B5' },
  Rewards: { icon: 'gift', c: '#E5A100' },
  'Privacy & security': { icon: 'shield', c: '#0EA5A0' },
  Support: { icon: 'headset', c: '#E8457A' },
};
const POPULAR = ['Do I have to pay to join?', 'How long does redemption take?', 'Which reward types can I choose?', 'Why does it say “Survey Closed”?'];

export default function Faq() {
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const list = useMemo(
    () => ALL_FAQS.filter((f) => (cat === 'All' || f.cat === cat) && (f.q + f.a).toLowerCase().includes(q.toLowerCase())),
    [cat, q]
  );
  const m = META[cat] || META.All;
  return (
    <>
      <PageSeo page={page} faqs={ALL_FAQS} crumbs={crumbs} />
      <PageHero crumbs={crumbs} eyebrow="Help centre" title={page.h1} lead="Everything about joining, paid surveys, rewards, payouts, privacy and support — in one place." art="question" theme="violet">
        <div className="faq-search">
          <Icon name="audit" size={20} />
          <label htmlFor="faq-q" className="sr-only">Search questions</label>
          <input id="faq-q" placeholder={`Search ${ALL_FAQS.length} answers…`} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </PageHero>
      <section className="section fqp" aria-labelledby="fqp-title">
        <div className="container">
          <h2 id="fqp-title" className="sr-only">Questions by topic</h2>
          <ul className="fqp-topics" aria-label="FAQ topics">
            {CATS.map((c) => {
              const cm = META[c] || META.All;
              const n = c === 'All' ? ALL_FAQS.length : ALL_FAQS.filter((f) => f.cat === c).length;
              return (
                <li key={c}>
                  <button type="button" className={cat === c ? 'on' : ''} style={{ '--tc': cm.c }} onClick={() => setCat(c)} aria-pressed={cat === c}>
                    <span className="fqp-t-ico"><Icon name={cm.icon} size={20} /></span>
                    <b>{c === 'All' ? 'All topics' : c}</b>
                    <small>{n} answers</small>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="fqp-row">
            <div>
              <div className="fqp-bar">
                <p className="fqp-count" aria-live="polite"><b>{list.length}</b> {list.length === 1 ? 'answer' : 'answers'}{q ? <> for “{q}”</> : null}</p>
                <div className="fqp-pop" aria-label="Popular questions">
                  {POPULAR.map((p) => <button type="button" key={p} onClick={() => { setCat('All'); setQ(p.replace(/[“”?]/g, '').split(' ').slice(0, 4).join(' ')); }}>{p}</button>)}
                </div>
              </div>
              {list.length ? (
                <FaqList faqs={list} hue={m.c} key={cat + q} />
              ) : (
                <div className="fqp-empty">
                  <p>No questions match “{q}”. Live Help knows every answer on this website — ask it directly.</p>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => askLiveHelp(q)}><Icon name="chat" size={16} /> Ask Live Help</button>
                </div>
              )}
              <p className="faq-more">Need more? Read <Link to="/blog/how-to-earn-money-online-with-surveys">how to earn money online</Link>, <Link to="/rewards">rewards & payouts</Link>, <Link to="/trust-and-safety">quality & security</Link> or <Link to="/contact-us">contact us</Link>. Data rights for EU members are set out in the <a href="https://eur-lex.europa.eu/eli/reg/2016/679/oj" target="_blank" rel="noopener noreferrer">GDPR</a>.</p>
            </div>
            <aside className="fqp-aside" aria-label="More help">
              <div className="fqp-live">
                <h3>Can’t find it?</h3>
                <p>Live Help answers from every page, policy and guide on this website — and links you to the source.</p>
                <div className="fqp-bubbles" aria-hidden="true">
                  <span>Is UPI available outside India?</span>
                  <span>UPI is for members in India only ✓</span>
                  <span>Source: Rewards &amp; Payouts →</span>
                </div>
                <button type="button" className="btn btn-light" onClick={() => askLiveHelp('')}><Icon name="chat" size={18} /> Ask Live Help 24/7</button>
              </div>
              <div className="fqp-contact">
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={18} /> WhatsApp {CONTACT.whatsappDisplay}</a>
                <a href={`mailto:${CONTACT.email}`}><Icon name="mail" size={18} /> {CONTACT.email}</a>
                <a href={CONTACT.phoneHref}><Icon name="phone" size={18} /> {CONTACT.phone}</a>
              </div>
            </aside>
          </div>
        </div>
      </section>
      <CtaBand variant="violet" />
    </>
  );
}

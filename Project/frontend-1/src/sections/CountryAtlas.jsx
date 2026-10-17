import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Flag } from '../components/CountryPicker.jsx';
import { REGIONS } from '../data/profiles.js';
import { COUNTRIES } from '../data/countries.js';

// v2.5 — "Countries we cover" (#countries) on the consumer and professional pages. Every country is listed — no
// scrolling boxes, nothing hidden — grouped by region, with a region filter.
//  • consumer: "Passport" — a 3D passport whose stamps thump onto the page, one ink colour per region.
//  • professional: "Departures board" — an airport split-flap board where each country flips in as a destination
//    for B2B studies.
const ISO = Object.fromEntries(COUNTRIES.map((c) => [c.name.toLowerCase(), c.iso]));
const isoOf = (n) => ISO[n.toLowerCase()] || '';
const ALL = REGIONS.flatMap((r) => r.countries.map((c) => ({ name: c, iso: isoOf(c), reg: r })));

function RegionTabs({ active, setActive, tone }) {
  return (
    <div className={`ca-tabs ${tone}`} role="tablist" aria-label="Filter countries by region">
      <button type="button" role="tab" aria-selected={active === 'all'} className={active === 'all' ? 'on' : ''} onClick={() => setActive('all')}>
        <Icon name="globe" size={15} /> All regions <b>{ALL.length}</b>
      </button>
      {REGIONS.map((r) => (
        <button type="button" role="tab" key={r.id} aria-selected={active === r.id} className={active === r.id ? 'on' : ''} style={{ '--rc': r.color }} onClick={() => setActive(r.id)}>
          <i /> {r.name} <b>{r.countries.length}</b>
        </button>
      ))}
    </div>
  );
}

function Passport({ active }) {
  const regs = active === 'all' ? REGIONS : REGIONS.filter((r) => r.id === active);
  return (
    <div className="psp" key={active}>
      <div className="psp-book" aria-hidden="true">
        <span className="psp-page" />
        <span className="psp-cover"><Icon name="globe" size={34} /><b>MEMBER PASSPORT</b><small>MyFrequentRewards</small></span>
      </div>
      <div className="psp-pages">
        {regs.map((r, ri) => (
          <section key={r.id} className="psp-region" style={{ '--rc': r.color }} aria-label={`${r.name}: ${r.countries.length} countries`}>
            <h3><span>{r.name}</span><small>{r.countries.length} countries</small></h3>
            <ul>
              {r.countries.map((c, i) => (
                <li key={c} className="psp-stamp" style={{ '--i': i + ri * 3, '--r': `${((i * 37) % 9) - 4}deg` }}>
                  <span className="psp-flag"><Flag iso={isoOf(c)} size={18} /></span>
                  <b>{c}</b>
                  <small>CONSUMER SURVEYS</small>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function Departures({ active }) {
  const rows = active === 'all' ? ALL : ALL.filter((x) => x.reg.id === active);
  return (
    <div className="dep" key={active}>
      <div className="dep-head" aria-hidden="true">
        <span><Icon name="briefcase" size={16} /> B2B STUDIES · DEPARTURES</span>
        <span className="dep-clock">ALL GATES OPEN</span>
      </div>
      <div className="dep-cols" role="table" aria-label="Countries where professional studies run">
        <div className="dep-row dep-th" role="row"><span role="columnheader">Code</span><span role="columnheader">Destination</span><span role="columnheader">Region</span><span role="columnheader">Status</span></div>
        {rows.map((x, i) => (
          <div className="dep-row" role="row" key={x.name} style={{ '--i': i % 24, '--rc': x.reg.color }}>
            <span className="dep-code" role="cell">{(x.iso || '··').split('').map((ch, k) => <i key={k} style={{ '--k': k }}>{ch}</i>)}</span>
            <span className="dep-dest" role="cell"><Flag iso={x.iso} size={16} /> <b>{x.name}</b></span>
            <span className="dep-reg" role="cell"><i />{x.reg.name}</span>
            <span className="dep-st" role="cell">Boarding</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CountryAtlas({ variant = 'consumer' }) {
  const [active, setActive] = useState('all');
  const pro = variant === 'professional';
  const n = ALL.length;
  return (
    <section id="countries" className={`section ca ${pro ? 'ca-pro' : 'ca-con'}`} aria-labelledby="ca-title">
      <div className="ca-bg" aria-hidden="true"><i /><i /></div>
      <div className="container">
        <div className="ca-head reveal">
          <p className="eyebrow">{pro ? 'Where B2B studies run' : 'Where our members live'}</p>
          <h2 id="ca-title">{pro ? <>Your expertise travels to <span className="ca-hl">{n} countries</span></> : <>Stamped in <span className="ca-hl">{n} countries</span> and counting</>}</h2>
          <p className="sec-sub">
            {pro
              ? 'Professionals in every country below receive business studies matched to their role, industry and seniority — across five regions.'
              : 'Consumers in every country below can join free and receive surveys in their language and local currency — across five regions.'}
          </p>
        </div>
        <RegionTabs active={active} setActive={setActive} tone={pro ? 'pro' : 'con'} />
        {pro ? <Departures active={active} /> : <Passport active={active} />}
        <p className="ca-note"><Icon name="shield" size={14} /> Eligibility can vary by study and age rules in each country. Don’t see your country? <Link to="/contact-us">Tell us</Link> — new countries are added regularly.</p>
      </div>
    </section>
  );
}

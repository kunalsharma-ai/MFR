import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Flag } from '../components/CountryPicker.jsx';
import { REGIONS } from '../data/profiles.js';
import { COUNTRIES } from '../data/countries.js';

// v2.5 — "Countries we cover" (#countries) on the consumer and professional pages. Every country is listed — no
// scrolling boxes, nothing hidden — grouped by region, with a region filter.
//  • consumer: "Flag islands" (v3.2) · professional: "Expert radar" (v3.2).
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

// consumer (v3.2): "Flag islands" — each region is a floating island of round flag bubbles that bob in a wave.
function Passport({ active }) {
  const regs = active === 'all' ? REGIONS : REGIONS.filter((r) => r.id === active);
  return (
    <div className="fis" key={active}>
      {regs.map((r, ri) => (
        <section key={r.id} className="fis-isle" style={{ '--rc': r.color, '--ri': ri }} aria-label={`${r.name}: ${r.countries.length} countries`}>
          <span className="fis-blob" aria-hidden="true" />
          <h3><i /><span>{r.name}</span><small>{r.countries.length} countries</small></h3>
          <ul>
            {r.countries.map((c, i) => (
              <li key={c} className="fis-b" style={{ '--i': i }}>
                <span className="fis-flag"><Flag iso={isoOf(c)} size={40} /></span>
                <b>{c}</b>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// professional (v3.2): "Expert radar" — a radar sweeps a dark globe and every country lights up as a blip,
// then the full list sits in region columns of glass signal tiles.
function Departures({ active }) {
  const rows = active === 'all' ? ALL : ALL.filter((x) => x.reg.id === active);
  const regs = active === 'all' ? REGIONS : REGIONS.filter((r) => r.id === active);
  return (
    <div className="rdr" key={active}>
      <div className="rdr-scope" aria-hidden="true">
        <span className="rdr-ring r1" /><span className="rdr-ring r2" /><span className="rdr-ring r3" /><span className="rdr-cross" />
        <span className="rdr-sweep" />
        {rows.map((x, i) => {
          const ri = REGIONS.indexOf(x.reg);
          const inReg = x.reg.countries.indexOf(x.name);
          const ang = ri * 72 + 6 + (inReg / x.reg.countries.length) * 62;
          const rad = 18 + ((inReg * 3) % 5) * 6.5;
          return <i key={x.name} className="rdr-blip" style={{ '--a': `${ang}deg`, '--d': rad, '--t': `${(ang / 360) * 4}s`, '--rc': x.reg.color }}><Flag iso={x.iso} size={16} /></i>;
        })}
        <span className="rdr-core"><Icon name="briefcase" size={22} /><b>{rows.length}</b><small>countries live</small></span>
      </div>
      <div className="rdr-cols" role="list" aria-label="Countries where professional studies run">
        {regs.map((r) => (
          <div key={r.id} className="rdr-col" style={{ '--rc': r.color }} role="listitem">
            <h3><i />{r.name}<small>{r.countries.length}</small></h3>
            <ul>{r.countries.map((c, i) => <li key={c} style={{ '--i': i }}><Flag iso={isoOf(c)} size={16} /><b>{c}</b><em>Live</em></li>)}</ul>
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
          <h2 id="ca-title">{pro ? <>Your expertise travels to <span className="ca-hl">{n} countries</span></> : <>Members in <span className="ca-hl">{n} countries</span> and counting</>}</h2>
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

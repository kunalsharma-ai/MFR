import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { asset } from '../utils/asset.js';
import FrLogo from '../components/FrLogo.jsx';
import useInView from '../hooks/useInView.js';
import { BRAND } from '../data/site.js';
import { CONNECT_BRANDS } from '../data/connect.js';

// About Us (v3.0) — every section tells its part of the story with a different visual: an isometric prism, kinetic
// type, a value-loop diagram, a film-strip timeline, a 3D card fan, a values dial, a two-worlds connector map,
// a flip-to-scan brand constellation and spinning ISO medals. No community numbers (content rules).

/* ---------- Hero art: isometric prism of the three layers ---------- */
// About hero art (v3.2): "Reward planet" — the MFR mark is a glowing core; three tilted orbits carry the motto
// (Voice · Value · Rewards) as moons, member flags circle on the outer ring and coins rain into the core.
const ORBITS = [
  { t: 'Your voice', ic: 'chat', c: '#FF5E7E', tilt: -18, dur: 9 },
  { t: 'Your value', ic: 'badge', c: '#14C9B5', tilt: 22, dur: 12 },
  { t: 'Your rewards', ic: 'gift', c: '#FFC233', tilt: 70, dur: 15 },
];
const AB_FLAGS = ['in', 'us', 'gb', 'br', 'de', 'jp', 'ng', 'ae'];
export function AboutPrism() {
  return (
    <div className="abo">
      <span className="abo-halo" />
      <div className="abo-flags">{AB_FLAGS.map((f, k) => <i key={f} style={{ '--k': k }}><img src={asset(`/flags/${f}.svg`)} alt="" width="26" height="26" loading="lazy" /></i>)}</div>
      {ORBITS.map((o, k) => (
        <div key={o.t} className={`abo-orbit o${k}`} style={{ '--tilt': `${o.tilt}deg`, '--dur': `${o.dur}s`, '--c': o.c }}>
          <span className="abo-moon"><span className="abo-moon-in"><Icon name={o.ic} size={18} /><b>{o.t}</b></span></span>
        </div>
      ))}
      <span className="abo-core"><img src={asset('/images/brand/mfr-mark-160.webp')} alt="" width="96" height="96" /></span>
      {[0, 1, 2, 3, 4].map((k) => <em key={k} className="abo-coin" style={{ '--k': k }}>$</em>)}
      {[0, 1, 2, 3, 4, 5].map((k) => <i key={k} className="ab-spark" style={{ '--k': k }} />)}
    </div>
  );
}

/* ---------- 1. Manifesto: kinetic type instead of a paragraph ---------- */
const LINES = [
  { w: ['Brands', 'need', 'answers.'], c: '#2F6BFF', c2: '#8B5CF6' },
  { w: ['You', 'have', 'opinions.'], c: '#FF8A00', c2: '#FF5E7E' },
  { w: ['We', 'make', 'it', 'fair.'], c: '#14C9B5', c2: '#2F6BFF' },
];
const FACTS = [
  { ic: 'globe', t: 'A worldwide community', d: 'Consumers and business professionals in one place', c: '#FF8A00' },
  { ic: 'shield', t: 'Run by Frequent Research', d: 'An ISO-certified market research company', c: '#2F6BFF' },
  { ic: 'heart', t: 'Free, always', d: 'No fees, no deposits, no investment', c: '#FF5E7E' },
  { ic: 'coins', t: 'Rewarded', d: 'For every eligible survey you complete', c: '#14C9B5' },
];
export function AboutManifesto() {
  const [ref, on] = useInView();
  return (
    <section id="ab-story" ref={ref} className={`section abm${on ? ' is-on' : ''}`} aria-labelledby="abm-h">
      <div className="container abm-row">
        <div className="abm-type">
          <p className="eyebrow">Who we are</p>
          <h2 id="abm-h" className="sr-only">MyFrequentRewards, the online survey community of Frequent Research</h2>
          <p className="abm-lines">
            <span className="sr-only">Brands need answers. You have opinions. We make it fair.</span>
            {LINES.map((l, li) => (
              <span key={li} className="abm-line" style={{ '--c': l.c, '--c2': l.c2 }} aria-hidden="true">
                {l.w.map((w, wi) => <span key={wi} className="abm-word" style={{ '--d': `${li * 0.35 + wi * 0.08}s` }}>{w}</span>)}
              </span>
            ))}
          </p>
          <p className="abm-sub">MyFrequentRewards is the online survey community of <a href={BRAND.parent.url} target="_blank" rel="noopener noreferrer">Frequent Research</a>. Real studies, verified people and rewards you can actually use.</p>
        </div>
        <ul className="abm-facts">
          {FACTS.map((f, i) => (
            <li key={f.t} style={{ '--c': f.c, '--i': i }}>
              <span className="abm-ico"><Icon name={f.ic} size={22} /></span>
              <b>{f.t}</b>
              <small>{f.d}</small>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- 2. The value loop: circular flow diagram ---------- */
const LOOP = [
  { ic: 'briefcase', t: 'Brands ask', d: 'Companies and researchers need real people’s views.', c: '#2F6BFF' },
  { ic: 'sparkle', t: 'We match', d: 'MyFrequentRewards invites members whose profile fits.', c: '#FF8A00' },
  { ic: 'chat', t: 'You answer', d: 'You share honest opinions on any device.', c: '#FF5E7E' },
  { ic: 'gift', t: 'You’re rewarded', d: 'Eligible surveys add to your balance; claim it your way.', c: '#14C9B5' },
];
export function ValueLoop() {
  const [ref, on] = useInView();
  const [act, setAct] = useState(0);
  useEffect(() => {
    if (!on) return undefined;
    const t = setInterval(() => setAct((a) => (a + 1) % LOOP.length), 2600);
    return () => clearInterval(t);
  }, [on]);
  const pos = [[150, 22], [278, 150], [150, 278], [22, 150]];
  return (
    <section ref={ref} className={`section abl${on ? ' is-on' : ''}`} aria-labelledby="abl-h">
      <div className="container abl-row">
        <div className="abl-dia" aria-hidden="true">
          <svg viewBox="0 0 300 300">
            <defs>
              <linearGradient id="abl-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2F6BFF" /><stop offset=".35" stopColor="#FF8A00" /><stop offset=".7" stopColor="#FF5E7E" /><stop offset="1" stopColor="#14C9B5" /></linearGradient>
            </defs>
            <circle cx="150" cy="150" r="128" className="abl-track" />
            <circle cx="150" cy="150" r="128" className="abl-flow" stroke="url(#abl-g)" />
            <circle r="7" className="abl-dot"><animateMotion dur="10.4s" repeatCount="indefinite" path="M150 22 a128 128 0 1 1 0 256 a128 128 0 1 1 0 -256" /></circle>
          </svg>
          <div className="abl-core"><img src={BRAND.monogram} alt="" width="54" height="54" /><b>The value loop</b></div>
          {LOOP.map((s, i) => (
            <span key={s.t} className={`abl-node${act === i ? ' is-act' : ''}`} style={{ '--c': s.c, left: `${(pos[i][0] / 300) * 100}%`, top: `${(pos[i][1] / 300) * 100}%` }}>
              <Icon name={s.ic} size={22} />
            </span>
          ))}
        </div>
        <div className="abl-copy">
          <p className="eyebrow">How it fits together</p>
          <h2 id="abl-h">One loop, <em className="ab-accent">everyone gains</em></h2>
          <ol className="abl-steps">
            {LOOP.map((s, i) => (
              <li key={s.t} className={act === i ? 'is-act' : ''} style={{ '--c': s.c }}>
                <button type="button" onClick={() => setAct(i)} aria-pressed={act === i}>
                  <span className="abl-n">{i + 1}</span>
                  <span><b>{s.t}</b><small>{s.d}</small></span>
                </button>
              </li>
            ))}
          </ol>
          <p className="abl-out"><Icon name="refresh" size={16} /> Better products and services, shaped by the people who use them.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------- 3. Journey: film-strip timeline ---------- */
const MILESTONES = [
  { y: '2015', t: 'Frequent Research begins', d: 'Market research and fieldwork for agencies and brands.', ic: 'rocket', c: '#2F6BFF' },
  { y: '2017', t: 'MyFrequentRewards launches', d: 'A rewards community for consumers and professionals, alongside Turn2Opinion.', ic: 'gift', c: '#FF8A00' },
  { y: '2018', t: 'MyHealthOpinions joins', d: 'A dedicated community for healthcare voices.', ic: 'medical', c: '#E5484D' },
  { y: '2020', t: 'Sampledge arrives', d: 'A DIY marketplace for research projects and samples.', ic: 'layers', c: '#7B4DFF' },
  { y: 'Today', t: 'ISO-certified research', d: 'ISO 20252, ISO 9001 and ISO 27001 standards behind every study.', ic: 'badge', c: '#14C9B5' },
];
export function AboutJourney() {
  const [ref, on] = useInView();
  return (
    <section ref={ref} className={`section abj${on ? ' is-on' : ''}`} aria-labelledby="abj-h">
      <div className="container">
        <div className="abj-head">
          <p className="eyebrow eyebrow-light">Our journey</p>
          <h2 id="abj-h">From one research team <em className="ab-accent">to a family of communities</em></h2>
        </div>
        <ol className="abj-strip">
          {MILESTONES.map((m, i) => (
            <li key={m.y} style={{ '--c': m.c, '--i': i }}>
              <span className="abj-year">{m.y}</span>
              <span className="abj-ico"><Icon name={m.ic} size={22} /></span>
              <b>{m.t}</b>
              <small>{m.d}</small>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- 4. Mission · Vision · Promise: 3D card fan over a compass ---------- */
const MVP = [
  { k: 'Mission', ic: 'heart', t: 'A fair reward for every honest opinion.', d: 'We connect real people with real research and make sure their time is valued.', c: '#FF8A00', c2: '#FF5E7E' },
  { k: 'Vision', ic: 'eye', t: 'Products shaped by the people who use them.', d: 'Every voice, from a student to a CEO, counted in the decisions that affect them.', c: '#8B5CF6', c2: '#2F6BFF' },
  { k: 'Promise', ic: 'lock', t: 'Your details stay with us.', d: 'Your details are secured with us. We never sell or share your personal details with anyone else.', c: '#14C9B5', c2: '#2F6BFF' },
];
export function AboutCompass() {
  return (
    <section className="section abc" aria-labelledby="abc-h">
      <svg className="abc-rose" viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="92" /><circle cx="100" cy="100" r="64" />
        <path d="M100 4 L110 100 L100 196 L90 100Z M4 100 L100 90 L196 100 L100 110Z" />
      </svg>
      <div className="container">
        <div className="sec-head sec-center reveal"><p className="eyebrow eyebrow-light">What drives us</p><h2 id="abc-h">Mission, vision <em className="ab-accent">and a promise</em></h2></div>
        <ul className="abc-fan">
          {MVP.map((m, i) => (
            <li key={m.k} className="abc-card reveal" style={{ '--c': m.c, '--c2': m.c2, '--i': i }} tabIndex={0}>
              <span className="abc-k"><Icon name={m.ic} size={20} /> {m.k}</span>
              <b>{m.t}</b>
              <small>{m.d}</small>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- 5. Values dial ---------- */
const VALUES = [
  { icon: 'heart', t: 'Respect', d: 'Your time and opinion deserve a fair reward.', c: '#FF5E7E', ex: ['Clear survey length', 'Reward shown up front'] },
  { icon: 'eye', t: 'Transparency', d: 'Clear rules, clear rewards, clear policies.', c: '#2F6BFF', ex: ['Plain-language policies', 'Exact figures in every invite'] },
  { icon: 'shield', t: 'Integrity', d: 'Verified people, honest data, no shortcuts.', c: '#14C9B5', ex: ['Verified members', 'Quality checks on answers'] },
  { icon: 'globe', t: 'Inclusion', d: 'Every country, culture and career is welcome.', c: '#FF8A00', ex: ['Consumers and professionals', 'Members worldwide'] },
];
export function ValuesDial() {
  const [i, setI] = useState(0);
  const v = VALUES[i];
  return (
    <section className="section abv" aria-labelledby="abv-h" style={{ '--c': v.c }}>
      <div className="container abv-row">
        <div className="abv-dial" aria-hidden="true">
          <span className="abv-ring" style={{ transform: `rotate(${-i * 90}deg)` }}>
            {VALUES.map((x, k) => <i key={x.t} style={{ '--c': x.c, '--k': k }}><Icon name={x.icon} size={22} /></i>)}
          </span>
          <span className="abv-needle" />
          <span className="abv-hub"><Icon name={v.icon} size={34} /></span>
        </div>
        <div className="abv-copy">
          <p className="eyebrow">What we stand for</p>
          <h2 id="abv-h">Four values, <em className="ab-accent">zero compromise</em></h2>
          <div className="abv-tabs" role="tablist" aria-label="Our values">
            {VALUES.map((x, k) => (
              <button key={x.t} type="button" role="tab" aria-selected={k === i} className={k === i ? 'is-on' : ''} style={{ '--c': x.c }} onClick={() => setI(k)}>
                <Icon name={x.icon} size={16} /> {x.t}
              </button>
            ))}
          </div>
          <div className="abv-panel" role="tabpanel" key={v.t}>
            <b>{v.t}</b>
            <p>{v.d}</p>
            <ul>{v.ex.map((e) => <li key={e}><Icon name="check" size={14} /> {e}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 6. Two worlds, one community: connector map ---------- */
const CON = ['Students', 'Homemakers', 'Gamers', 'Shoppers', 'Travellers', 'Parents'];
const PRO = ['CXOs & founders', 'IT managers', 'Doctors', 'Engineers', 'HR leaders', 'Finance heads'];
export function TwoWorlds() {
  const [ref, on] = useInView();
  return (
    <section ref={ref} className={`section abw${on ? ' is-on' : ''}`} aria-labelledby="abw-h">
      <div className="container">
        <div className="sec-head sec-center"><p className="eyebrow">Who we bring together</p><h2 id="abw-h">Two worlds, <em className="ab-accent">one community</em></h2></div>
        <div className="abw-map">
          <ul className="abw-col abw-con" aria-label="Consumers">
            <li className="abw-cap"><Icon name="user" size={18} /> Consumers</li>
            {CON.map((c, i) => <li key={c} style={{ '--i': i }}>{c}</li>)}
          </ul>
          <svg className="abw-wires" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((k) => <path key={`l${k}`} className="abw-w l" style={{ '--k': k }} d={`M0 ${40 + k * 44} C120 ${40 + k * 44} 120 150 200 150`} />)}
            {[0, 1, 2, 3, 4, 5].map((k) => <path key={`r${k}`} className="abw-w r" style={{ '--k': k }} d={`M400 ${40 + k * 44} C280 ${40 + k * 44} 280 150 200 150`} />)}
          </svg>
          <div className="abw-core"><img src={BRAND.monogram} alt="MyFrequentRewards" width="60" height="60" /><b>MyFrequentRewards</b></div>
          <ul className="abw-col abw-pro" aria-label="Professionals">
            <li className="abw-cap"><Icon name="briefcase" size={18} /> Professionals</li>
            {PRO.map((c, i) => <li key={c} style={{ '--i': i }}>{c}</li>)}
          </ul>
        </div>
        <p className="abw-links"><Link to="/paid-surveys-for-consumers">Surveys for consumers <Icon name="arrow" size={14} /></Link><Link to="/paid-surveys-for-professionals">Surveys for professionals <Icon name="arrow" size={14} /></Link><Link to="/who-can-join">Who can join <Icon name="arrow" size={14} /></Link></p>
      </div>
    </section>
  );
}

/* ---------- 7. The Frequent Research family: flip-to-scan constellation ---------- */
const SOC = ['youtube', 'instagram', 'linkedin', 'facebook', 'x', 'threads', 'pinterest'];
export function BrandFamily() {
  return (
    <section className="section abf" aria-labelledby="abf-h">
      <div className="container">
        <div className="sec-head sec-center reveal"><p className="eyebrow eyebrow-light">The family</p><h2 id="abf-h">One parent, <em className="ab-accent">five brands</em></h2><p className="sec-sub">Tap or hover a card to flip it and scan its website. Every channel is on <Link to="/scan-and-connect">Scan &amp; Connect</Link>.</p></div>
        <ul className="abf-orbit">
          {CONNECT_BRANDS.map((b, i) => {
            const site = b.channels.find((c) => c.id === 'website');
            const socials = b.channels.filter((c) => SOC.includes(c.id) && c.url);
            const name = b.name.replace(' Fieldwork Solutions Pvt. Ltd.', '');
            return (
              <li key={b.id} className={`abf-card${b.id === 'fr' ? ' is-parent' : ''}`} style={{ '--c': b.color, '--c2': b.color2, '--i': i }}>
                <div className="abf-in" tabIndex={0} role="group" aria-label={`${name}: ${b.tagline}`}>
                  <div className="abf-front">
                    <span className="abf-mono">{b.short}</span>
                    <b>{name}</b>
                    <small>{b.tagline}</small>
                    <span className="abf-soc">{socials.map((c) => <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer" aria-label={`${name} on ${c.label}`}><Icon name={c.id} size={15} /></a>)}</span>
                  </div>
                  <div className="abf-back">
                    {site ? <img src={site.qr} alt={`QR code for the ${name} website`} width="120" height="120" loading="lazy" /> : null}
                    {site ? <a href={site.url} target="_blank" rel="noopener noreferrer">{site.handle} <Icon name="arrow" size={13} /></a> : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------- 8. Credentials: ISO medals ---------- */
const ISO = [
  { n: '20252', y: '2019', t: 'Market research', d: 'The international standard for market, opinion and social research.', c: '#FF8A00' },
  { n: '9001', y: '2015', t: 'Quality management', d: 'Consistent, documented processes from brief to delivery.', c: '#2F6BFF' },
  { n: '27001', y: '2013', t: 'Information security', d: 'How personal data is protected, stored and accessed.', c: '#14C9B5' },
];
export function IsoMedals() {
  return (
    <section className="section abi" aria-labelledby="abi-h">
      <div className="container abi-row">
        <div className="abi-copy reveal">
          <p className="eyebrow">Credentials</p>
          <h2 id="abi-h">Quality <em className="ab-accent">you can verify</em></h2>
          <p className="sec-sub">Our parent company is certified to {BRAND.iso.join(', ')}. See our <Link to="/trust-and-safety">quality &amp; security</Link> approach.</p>
          <FrLogo variant="iso" width={360} height={192} alt="Frequent Research logo with ISO 20252:2019, 9001:2015 and 27001:2013 certifications" />
        </div>
        <ul className="abi-medals">
          {ISO.map((m, i) => (
            <li key={m.n} className="abi-medal reveal" style={{ '--c': m.c, '--i': i }} tabIndex={0}>
              <span className="abi-coin"><span className="abi-face"><small>ISO</small><b>{m.n}</b><small>{m.y}</small></span></span>
              <span className="abi-txt"><b>{m.t}</b><small>{m.d}</small></span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

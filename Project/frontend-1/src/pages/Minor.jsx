import { TeenStandards } from '../sections/TrustSections.jsx';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { PageSeo } from '../components/PageHero.jsx';
import { Breadcrumbs, FaqSplit } from '../components/Common.jsx';
import { PAGES } from '../data/pages.js';
import useInView from '../hooks/useInView.js';
import {
  FAQ_MINOR, JOURNEY, MINOR_AGE, PARENT_CONTROLS, PARENT_PARTS, PARENT_WORLDS, POINTS_PER_USD, POINTS_PER_WORLD,
  PROMISE_CHAPTERS, RANKS, TEEN_WORLDS,
} from '../data/minor.js';

// For Minors (v3.3) — the teen panel under EARN. Its own "Galaxy Pop" palette: electric violet, hot magenta,
// aqua mint and sunshine gold, the youngest member of the MFR family of colours. Every block has a look of its own:
// orbit hero → double-key lock → quest map → sticker album → arcade scoreboard → calm parent notebook →
// heartbeat care card → stamped promise sheets. Styles: src/styles/v32-minor.css (all `mn-` classes).
const page = PAGES.minor;
const crumbs = [{ name: 'Home', path: '/' }, { name: 'For Teens', path: page.path }];

const EMOJI = {
  game: '/images/minor/emoji/game.webp', pizza: '/images/minor/emoji/pizza.webp', music: '/images/minor/emoji/music.webp',
  football: '/images/minor/emoji/football.webp', graduation: '/images/minor/emoji/graduation.webp', paint: '/images/minor/emoji/paint.webp',
  vr: '/images/minor/emoji/vr.webp', popcorn: '/images/minor/emoji/popcorn.webp', sparkles: '/images/minor/emoji/sparkles.webp',
  rocket: '/images/minor/emoji/rocket.webp', star: '/images/minor/emoji/star.webp', trophy: '/images/minor/emoji/trophy.webp',
  coin: '/images/minor/emoji/coin.webp', key: '/images/minor/emoji/key.webp', lock: '/images/minor/emoji/lock.webp',
  party: '/images/minor/emoji/party.webp', confetti: '/images/minor/emoji/confetti.webp', heart: '/images/minor/emoji/sparkle_heart.webp',
  shield: '/images/minor/emoji/shield.webp', family: '/images/minor/emoji/family.webp', wave: '/images/minor/emoji/wave.webp',
  gift: '/images/minor/emoji/gift.webp', crown: '/images/minor/emoji/crown.webp', lightning: '/images/minor/emoji/lightning.webp',
};
const Emo = ({ k, size = 40, className = '', eager = false }) => (
  <img src={EMOJI[k]} alt="" width={size} height={size} className={`mn-emo ${className}`} loading={eager ? 'eager' : 'lazy'} decoding="async" />
);

const TAGLINE = [['game', 'Play it.'], ['chat', 'Say it.'], ['coins', 'Earn it.']];

export default function Minor() {
  return (
    <>
      <PageSeo page={page} faqs={FAQ_MINOR} crumbs={crumbs} />
      <MinorHero />
      <DoubleKey />
      <QuestMap />
      <StickerAlbum />
      <Scoreboard />
      <ParentNotebook />
      <CareCard />
      <PromiseSheets />
      <TeenStandards compact />
      <FaqSplit id="mn-faq" look="minor" eyebrow="Teen FAQ" title="Questions teens and parents ask" faqs={FAQ_MINOR} hue="#7C3AED" hue2="#FF3B8D" />
      <MinorCta />
    </>
  );
}

// ── 1. Hero: "Capsule Pop" — kinetic 3D sticker headline + a candy capsule machine. Capsules (one per world)
// tumble in a glass dome, the knob turns, a capsule drops down the chute, cracks open and the world pops out
// with "+100". Pop-art rays and halftone dots behind. Only transform / opacity animate.
const VIBES = ['games', 'music', 'snacks', 'style', 'ideas', 'selfies'];
const CAPS = [
  ['/images/minor/art/arcade.webp', '#7C3AED', '#2EE6CF'], ['/images/minor/art/bistro.webp', '#FF8A00', '#FFC233'],
  ['/images/minor/art/runway.webp', '#FF3B8D', '#FFD6F0'], ['/images/minor/art/arena.webp', '#22C55E', '#FFC233'],
  ['/images/minor/art/future.webp', '#4F46E5', '#22D3EE'], ['/images/minor/art/feed.webp', '#D946EF', '#FF9BCB'],
  ['/images/minor/art/campus.webp', '#2F6BFF', '#FFC233'],
];
const PRIZES = [
  ['/images/minor/art/arcade.webp', 'Arcade'], ['/images/minor/art/bistro.webp', 'Bistro'], ['/images/minor/art/runway.webp', 'Runway'], ['/images/minor/art/future.webp', 'Future'],
];
function MinorHero() {
  const [ref, visible] = useInView({ once: false, threshold: 0 });
  const [v, setV] = useState(0);
  const [prize, setPrize] = useState(0);
  useEffect(() => {
    if (!visible || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return undefined;
    const t = setInterval(() => setV((i) => (i + 1) % VIBES.length), 2000);
    const t2 = setInterval(() => setPrize((i) => (i + 1) % PRIZES.length), 4800);
    return () => { clearInterval(t); clearInterval(t2); };
  }, [visible]);
  return (
    <section ref={ref} className="mn-hero" aria-labelledby="mn-title">
      <div className="mn-hero-bg" aria-hidden="true">
        <span className="mn-rays" />
        <span className="mn-dots" />
        <span className="mn-blob b1" /><span className="mn-blob b2" /><span className="mn-blob b3" />
        <svg className="mn-squig s1" viewBox="0 0 200 40"><path d="M2 20 Q 27 2, 52 20 T 102 20 T 152 20 T 198 20" /></svg>
        <svg className="mn-squig s2" viewBox="0 0 200 40"><path d="M2 20 Q 27 2, 52 20 T 102 20 T 152 20 T 198 20" /></svg>
        {Array.from({ length: 10 }).map((_, i) => <i key={i} className="mn-twinkle" style={{ '--i': i }} />)}
      </div>
      <div className="container mn-hero-row">
        <div className="mn-hero-copy">
          <Breadcrumbs items={crumbs} />
          <p className="mn-eyebrow"><span className="mn-new">New</span> The teen panel · ages {MINOR_AGE.min}–{MINOR_AGE.max}</p>
          <p className="mn-kinetic" aria-hidden="true">
            <span className="mk-line l1">Your</span>
            <span className="mk-line l2"><span className="mk-swap" key={v}>{VIBES[v].split('').map((ch, i) => <b key={i} style={{ '--c': i }}>{ch}</b>)}</span></span>
            <span className="mk-line l3">are worth <em>points.</em></span>
            <span className="mk-sticker s1">Parent-approved ✓</span>
            <span className="mk-sticker s2">+100 / world</span>
          </p>
          <h1 id="mn-title">{page.h1}</h1>
          <p className="mn-tag">
            <span className="sr-only">{TAGLINE.map((x) => x[1]).join(' ')}</span>
            {TAGLINE.map(([ic, t], k) => <span key={t} className="mn-tag-w" style={{ '--k': k }} aria-hidden="true"><Icon name={ic} size={16} /> {t}</span>)}
          </p>
          <p className="mn-lead">Explore thirteen profile worlds, win points for each one and share what you really think about games, food, school, style and tech. A parent says yes first, then you do. Nothing starts until you both agree.</p>
          <div className="mn-actions">
            <Link to="/sign-up?type=teen" className="btn btn-lg mn-btn">Join as a teen <Icon name="arrow" size={18} /></Link>
            <a href="#parents" className="btn btn-lg mn-btn-ghost"><Icon name="family" size={18} /> I’m a parent</a>
          </div>
          <ul className="mn-stats" aria-label="The teen panel in numbers">
            <li style={{ '--c': '#FFC233' }}><b>13</b><small>profile worlds</small></li>
            <li style={{ '--c': '#2EE6CF' }}><b>+{POINTS_PER_WORLD}</b><small>points per world</small></li>
            <li style={{ '--c': '#FF6FB5' }}><b>2</b><small>yeses to start</small></li>
          </ul>
        </div>
        <div className="mn-machine" aria-hidden="true">
          <span className="mn-halo" />
          <div className="mc-top"><span>WORLD</span><span>POP</span></div>
          <div className="mc-dome">
            <span className="mc-glass" />
            {CAPS.map(([src, c1, c2], i) => (
              <span key={i} className={`mc-cap k${i}`} style={{ '--c1': c1, '--c2': c2, '--i': i }}>
                <img src={src} alt="" width="60" height="60" decoding="async" />
              </span>
            ))}
            <span className="mc-shine" />
          </div>
          <div className="mc-base">
            <span className="mc-knob"><i /></span>
            <span className="mc-slot">1 opinion</span>
            <span className="mc-chute" />
          </div>
          <div className="mc-drop" key={prize}>
            <span className="mc-pc">
              <span className="mc-half top" /><span className="mc-half bot" />
              <img className="mc-prize" src={PRIZES[prize][0]} alt="" width="120" height="120" decoding="async" />
            </span>
            <span className="mc-tag"><b>{PRIZES[prize][1]}</b> unlocked <em>+100</em></span>
            {Array.from({ length: 8 }).map((_, i) => <i key={i} className="mc-conf" style={{ '--i': i }} />)}
          </div>
          {[['game', 'p1', 54], ['music', 'p2', 46], ['pizza', 'p3', 50], ['crown', 'p4', 44], ['lightning', 'p5', 40]].map(([k, c, sz]) => (
            <span key={c} className={`mn-pop ${c}`}><Emo k={k} size={sz} eager /></span>
          ))}
          <div className="mn-hud">
            <span className="mn-hud-ava"><Emo k="wave" size={30} eager /></span>
            <p><b>Hey you!</b><small>3 of 13 worlds done</small></p>
            <span className="mn-hud-bar"><i /></span>
            <span className="mn-hud-pts"><Emo k="coin" size={20} eager /> 300</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 2. "Two yeses": two keys (parent + teen) slide into one lock; it opens only when both have turned.
function DoubleKey() {
  const [ref, seen] = useInView({ threshold: 0.35 });
  return (
    <section ref={ref} className={`section mn-keys ${seen ? 'is-on' : ''}`} aria-labelledby="mn-keys-title">
      <div className="container mn-keys-row">
        <div className="mn-keys-copy reveal">
          <p className="eyebrow">Double-key permission</p>
          <h2 id="mn-keys-title">Two keys. <span className="mn-hl">One door.</span></h2>
          <p className="sec-sub">The teen panel opens only when two people say yes: a parent or legal guardian first, and then you. Your parent’s yes never overrides your no, and either of you can take it back at any time.</p>
          <ul className="mn-keys-list">
            <li><span className="k1"><Icon name="family" size={18} /></span><p><b>Parent’s key</b> Verified permission that covers only what is explained, never every future study.</p></li>
            <li><span className="k2"><Icon name="hand" size={18} /></span><p><b>Your key</b> A clear explanation, then your own decision. Saying no is always okay.</p></li>
            <li><span className="k3"><Icon name="exit" size={18} /></span><p><b>The exit</b> Stop whenever you like. Stopping never brings a penalty.</p></li>
          </ul>
        </div>
        <div className="mn-lockstage" aria-hidden="true">
          <span className="mn-key-card kc1"><Emo k="family" size={44} /><b>Parent</b><i>Yes</i></span>
          <span className="mn-key-card kc2"><Emo k="wave" size={44} /><b>You</b><i>Yes</i></span>
          <div className="mn-lock">
            <span className="mn-shackle" />
            <span className="mn-body"><span className="mn-hole h1" /><span className="mn-hole h2" /><Icon name="check" size={34} stroke={3} /></span>
          </div>
          <span className="mn-unlocked">Panel unlocked</span>
          {Array.from({ length: 12 }).map((_, i) => <i key={i} className="mn-spark" style={{ '--i': i }} />)}
        </div>
      </div>
    </section>
  );
}

// ── 3. Quest map: the six levels from "I want in" to the first reward, along a winding glowing path.
function QuestMap() {
  return (
    <section className="section mn-quest" aria-labelledby="mn-quest-title">
      <div className="mn-quest-sky" aria-hidden="true" />
      <div className="container">
        <div className="sec-head sec-center reveal">
          <p className="eyebrow eyebrow-light">Your quest</p>
          <h2 id="mn-quest-title">Six levels from <span className="mn-hl-light">“I want in”</span> to your first reward</h2>
          <p className="sec-sub">About five minutes for your parent, one sitting, and then the worlds are yours.</p>
        </div>
        <div className="mn-map">
          <svg className="mn-trail" viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true">
            <path className="mn-trail-glow" d="M60 90 C 260 20, 380 180, 500 110 S 800 20, 940 120 S 820 300, 640 300 S 300 250, 180 340 S 160 520, 420 500 S 820 470, 940 480" />
            <path className="mn-trail-dash" d="M60 90 C 260 20, 380 180, 500 110 S 800 20, 940 120 S 820 300, 640 300 S 300 250, 180 340 S 160 520, 420 500 S 820 470, 940 480" />
          </svg>
          <ol className="mn-levels">
            {JOURNEY.map((s, i) => (
              <li key={s.k} className={`mn-level reveal who-${s.who.toLowerCase()}`} style={{ '--i': i }}>
                <span className="mn-level-gem"><img src={s.e} alt="" width="46" height="46" loading="lazy" decoding="async" /></span>
                <div>
                  <p className="mn-level-n">Level {i + 1} <em>{s.who}</em></p>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

// ── 4. Sticker album: thirteen holographic world stickers, each with its own colours and 3D art.
function StickerAlbum() {
  const [ref, inView] = useInView({ threshold: 0.2 });
  const [got, setGot] = useState(0);
  useEffect(() => {
    if (!inView) return undefined;
    let n = 0;
    const t = setInterval(() => { n += 1; setGot(n); if (n >= TEEN_WORLDS.length) clearInterval(t); }, 140);
    return () => clearInterval(t);
  }, [inView]);
  const tilt = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - 0.5) * -14}deg`);
    e.currentTarget.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 16}deg`);
  };
  const untilt = (e) => { e.currentTarget.style.setProperty('--rx', '0deg'); e.currentTarget.style.setProperty('--ry', '0deg'); };
  return (
    <section className="section mn-album nx-album" aria-labelledby="mn-album-title" ref={ref}>
      <span className="nx-stars" aria-hidden="true" />
      <div className="container">
        <div className="nx-album-head reveal">
          <div>
            <p className="eyebrow">Your profile worlds</p>
            <h2 id="mn-album-title">Thirteen worlds. <span className="nx-holo-t">Collect them all.</span></h2>
            <p className="sec-sub">Each world is a few quick questions about something you love. Finish one, win {POINTS_PER_WORLD} points, and surveys start fitting you better. Start anywhere.</p>
          </div>
          <div className="nx-meter" role="img" aria-label={`${TEEN_WORLDS.length} worlds, ${TEEN_WORLDS.length * POINTS_PER_WORLD} points to collect`}>
            <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" /><circle cx="60" cy="60" r="52" style={{ strokeDashoffset: 327 - (327 * got) / TEEN_WORLDS.length }} /></svg>
            <b>{got}<small>/{TEEN_WORLDS.length}</small></b>
            <span>{(got * POINTS_PER_WORLD).toLocaleString('en-US')} pts</span>
          </div>
        </div>
        <ul className="nx-cards">
          {TEEN_WORLDS.map((w, i) => (
            <li key={w.id} className={`nx-card${i < got ? ' got' : ''}`} style={{ '--i': i, '--c': w.c, '--c2': w.c2 || w.c }} tabIndex={0} onPointerMove={tilt} onPointerLeave={untilt}>
              <span className="nx-foil" aria-hidden="true" />
              <span className="nx-no" aria-hidden="true">#{String(i + 1).padStart(2, '0')}</span>
              <img src={w.art} alt={`${w.name} world illustration`} width="200" height="200" loading="lazy" decoding="async" />
              <p className="nx-name">{w.name}</p>
              <p className="nx-t">{w.t}</p>
              <p className="nx-d">{w.d}</p>
              <p className="nx-meta"><span><Icon name="question" size={13} /> {w.q} questions</span><span><Icon name="clock" size={13} /> {w.m} min</span><em>+{POINTS_PER_WORLD}</em></p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── 5. Arcade scoreboard: slide through the worlds you have finished and watch points and rank climb.
function Scoreboard() {
  const [n, setN] = useState(5);
  const pts = n * POINTS_PER_WORLD;
  const rank = [...RANKS].reverse().find((r) => n >= r.at) || RANKS[0];
  const digits = String(pts).padStart(4, '0').split('');
  return (
    <section className="section mn-arcade" aria-labelledby="mn-arcade-title">
      <div className="mn-scan" aria-hidden="true" />
      <div className="container mn-arcade-row">
        <div className="mn-arcade-copy reveal">
          <p className="mn-insert">Insert opinion ▸</p>
          <h2 id="mn-arcade-title">Rookie to <span>Legend</span></h2>
          <p className="sec-sub">Every world you finish adds {POINTS_PER_WORLD} points and pushes your rank up the board. {POINTS_PER_USD.toLocaleString('en-US')} points are worth 1 US dollar, and every reward is shown before a survey starts.</p>
          <p className="mn-arcade-note"><Icon name="wallet" size={16} /> In most markets rewards for members under 18 are paid to a parent or guardian.</p>
        </div>
        <div className="mn-cabinet">
          <div className="mn-screen" role="group" aria-label="Points calculator">
            <p className="mn-hi">HI-SCORE</p>
            <p className="mn-digits" aria-live="polite"><span className="sr-only">{pts} points, rank {rank.t}</span>{digits.map((d, i) => <b key={`${i}-${d}`} aria-hidden="true">{d}</b>)}</p>
            <p className="mn-usd" aria-hidden="true">= ${(pts / POINTS_PER_USD).toFixed(2)} USD</p>
            <ol className="mn-ranks">
              {RANKS.map((r) => (
                <li key={r.id} className={n >= r.at ? 'on' : ''} aria-current={r.id === rank.id ? 'step' : undefined}>
                  <img src={r.e} alt="" width="34" height="34" loading="lazy" decoding="async" />
                  <b>{r.t}</b>
                </li>
              ))}
            </ol>
            <label className="mn-slider">
              <span>Worlds finished: <b>{n}</b> / 13</span>
              <input type="range" min="0" max="13" value={n} onChange={(e) => setN(Number(e.target.value))} style={{ '--p': `${(n / 13) * 100}%` }} />
            </label>
          </div>
          <span className="mn-btns" aria-hidden="true"><i /><i /><i /></span>
        </div>
      </div>
    </section>
  );
}

// ── 6. Parent notebook: calm paper, the three parent worlds and the controls a parent holds.
function ParentNotebook() {
  return (
    <section id="parents" className="section mn-parents nx-par" aria-labelledby="mn-parents-title">
      <div className="container">
        <div className="mn-parents-head reveal">
          <p className="eyebrow">For parents &amp; guardians</p>
          <h2 id="mn-parents-title">Two steps, and your teen is in</h2>
          <p className="sec-sub">Your teen asks to join, you get an invitation, and you answer 16 short questions in about five minutes. Then you give permission, and your teen gives theirs. Nothing is switched on until you say yes.</p>
        </div>
        <div className="nx-par-flow">
          <article className="nx-step nx-step-1 reveal">
            <span className="nx-step-n" aria-hidden="true">1</span>
            <header>
              <span className="nx-env" aria-hidden="true"><i /><i /></span>
              <div><p className="nx-k">Step one · your invitation</p><h3>Parent registration</h3></div>
              <em>16 questions · about 5 min</em>
            </header>
            <ol className="nx-parts">
              {PARENT_PARTS.map((p, i) => (
                <li key={p.t} style={{ '--i': i, '--n': p.n }}>
                  <span className="nx-part-ic"><Icon name={p.ic} size={18} /></span>
                  <div><b>{p.t}</b><p>{p.d}</p></div>
                  <span className="nx-part-n">{p.n}<small>q</small></span>
                </li>
              ))}
            </ol>
          </article>
          <span className="nx-link" aria-hidden="true"><i /><Icon name="arrow" size={20} /></span>
          <article className="nx-step nx-step-2 reveal">
            <span className="nx-step-n" aria-hidden="true">2</span>
            <header>
              <span className="nx-dial" aria-hidden="true"><i /></span>
              <div><p className="nx-k">Step two · your permission</p><h3>What you control</h3></div>
            </header>
            <ul className="nx-ctrls">
              {PARENT_CONTROLS.map((c, i) => (
                <li key={c.t} style={{ '--i': i }}>
                  <div><b>{c.t}</b><p>{c.d}</p></div>
                  <span className="nx-sw" aria-hidden="true"><i /></span>
                </li>
              ))}
            </ul>
          </article>
        </div>
        <ul className="nx-pworlds">
          {PARENT_WORLDS.map((w, i) => (
            <li key={w.id} className="reveal" style={{ '--i': i, '--c': w.c }}>
              <span className="nx-pw-art"><img src={w.art} alt={`${w.name}: ${w.t}`} width="150" height="150" loading="lazy" decoding="async" /></span>
              <p className="nx-k">Parent world · {w.q} questions</p>
              <h3>{w.name}</h3>
              <p className="nx-pw-t">{w.t}</p>
              <p>{w.d}</p>
            </li>
          ))}
        </ul>
        <p className="mn-parents-foot reveal">Your teen can open your worlds and read exactly what you said, including the permissions you set. You can read theirs too, but the answers have to be theirs.</p>
      </div>
    </section>
  );
}

// ── 7. Care card: why a parent is asked about their teen's health, with a live heartbeat line.
function CareCard() {
  const VITALS = [
    ['shield', 'Screened out', 'Unsuitable studies never reach your teen.'],
    ['heart', 'Caregiver studies, paid to you', 'If you look after your teen’s health, you can join caregiver research answered and rewarded by you.'],
    ['star', 'Rarer, better rewarded', 'Studies for teens with a particular condition are longer and pay more, and only ever with permission.'],
  ];
  return (
    <section className="section mn-care nx-care" aria-labelledby="mn-care-title">
      <div className="container nx-monitor reveal">
        <div className="nx-screen" aria-hidden="true">
          <span className="nx-bpm"><b>72</b> bpm · safe</span>
          <svg className="nx-ecg" viewBox="0 0 600 90" preserveAspectRatio="none"><path d="M0 45 H150 L168 45 L182 14 L198 78 L214 26 L226 45 H330 L346 45 L360 18 L376 72 L388 45 H600" /></svg>
          <img src="/images/minor/art/care.webp" alt="" width="200" height="200" loading="lazy" decoding="async" />
        </div>
        <div className="nx-care-copy">
          <p className="eyebrow">Health safeguards</p>
          <h2 id="mn-care-title">Two health questions that keep your teen safe</h2>
          <p>They matter more than anything else on the parent form. They are the only way we can keep studies about medicines, food, allergies or conditions away from a teen they could upset or harm. “Prefer not to disclose” is always an option.</p>
          <ul className="nx-vitals">
            {VITALS.map(([ic, t, d], i) => (
              <li key={t} style={{ '--i': i }}><span><Icon name={ic} size={18} /></span><b>{t}</b><small>{d}</small></li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ── 8. Promise sheets: five chapters of promises, each a stamped sheet in its own colour.
function PromiseSheets() {
  const [tab, setTab] = useState(0);
  const [stamp, setStamp] = useState(0);
  useEffect(() => { setStamp((s) => s + 1); }, [tab]);
  const ch = PROMISE_CHAPTERS[tab];
  return (
    <section className="section mn-promise nx-prom" aria-labelledby="mn-promise-title" style={{ '--c': ch.c }}>
      <div className="container">
        <div className="sec-head sec-center reveal">
          <p className="eyebrow">Our promises</p>
          <h2 id="mn-promise-title">Safe by design, <span className="mn-hl">promise by promise</span></h2>
          <p className="sec-sub">The teen panel follows the MRS Code of Conduct and your country’s rules come first. Pick a chapter.</p>
        </div>
        <div className="nx-book">
          <div className="nx-marks" role="tablist" aria-label="Promise chapters" aria-orientation="vertical">
            {PROMISE_CHAPTERS.map((c, i) => (
              <button key={c.id} type="button" role="tab" id={`mn-tab-${c.id}`} aria-controls="mn-sheet" aria-selected={i === tab} className={i === tab ? 'on' : ''} style={{ '--c': c.c }} onClick={() => setTab(i)}>
                <span><Icon name={c.ic} size={16} /></span> {c.t} <small>{String(i + 1).padStart(2, '0')}</small>
              </button>
            ))}
          </div>
          <div className="nx-page" id="mn-sheet" role="tabpanel" aria-labelledby={`mn-tab-${ch.id}`} key={stamp}>
            <p className="nx-page-h"><span>Chapter {tab + 1} of {PROMISE_CHAPTERS.length}</span> {ch.t}</p>
            <span className="nx-seal" aria-hidden="true"><Icon name="check" size={20} stroke={3} /><i>Promised</i></span>
            {ch.items.map(([ic, t, d], i) => (
              <article key={t} className="nx-pr" style={{ '--i': i }}>
                <span className="nx-pr-ic"><Icon name={ic} size={20} /></span>
                <div><h3>{t}</h3><p>{d}</p></div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MinorCta() {
  return (
    <section className="mn-cta" aria-label="Join the teen panel">
      <div className="mn-cta-sky" aria-hidden="true">
        {['party', 'confetti', 'gift', 'crown', 'lightning', 'heart', 'trophy', 'star'].map((k, i) => <span key={k} className="mn-float" style={{ '--i': i }}><Emo k={k} size={48} /></span>)}
      </div>
      <div className="container mn-cta-in reveal">
        <h2>Your opinion counts. <span>At any age.</span></h2>
        <p>Ask to join today. We’ll invite your parent, and you can start exploring as soon as you both say yes.</p>
        <div className="mn-actions">
          <Link to="/sign-up?type=teen" className="btn btn-lg mn-btn">Join as a teen <Icon name="arrow" size={18} /></Link>
          <Link to="/login?type=teen" className="btn btn-lg mn-btn-ghost">Teen log in</Link>
        </div>
      </div>
    </section>
  );
}

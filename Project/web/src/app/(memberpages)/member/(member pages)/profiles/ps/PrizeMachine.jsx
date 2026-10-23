"use client";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useI18n } from './i18n.js';
import { reward, tap } from './sound.js';
import { reducedMotion } from './fx.js';
import Capsule, { capsuleColors } from './Capsule.jsx';
import LedCount from './LedCount.jsx';
import { catProfiles, isDone, isSeen, isPaid, markSeen, markPaid, pKey, pendingKeys, paidPoints, rankOf, fmtUsd, RANK_KEYS, POINTS_PER_PROFILE, POINTS_PER_USD, subscribeRewards, rewardsVersion } from './rules.js';
import { path, sparkle, floatText, flyToPoints, bump, wait } from './rfx.js';
import { ensureRewardStyles } from './rstyles.js';
import { IArrow } from './Icons.jsx';

ensureRewardStyles();

/* "Your Prize Machine" - the reward board on the hub (lazy-loaded from Hub.jsx).
   An arcade capsule machine: every unfinished profile is a prize capsule waiting inside the glass globe, in
   that profile's colours with its 3D emoji. Completing a profile dispenses its capsule: the crank turns, the
   capsule rolls down the chute into the tray, cracks open, +100 points flies to the header and the opened
   capsule joins the member's collection. Members can also turn the crank to let the machine pick their next
   profile. The machine body, LED and bulbs take the language palette (--L1/--L2/--L3) and every sound is
   played on the language's own instrument, so each language has its own machine. */

// machine geometry, in units (1 unit = --u px): globe centre and inner radius, chute and tray
const G = { cx: 160, cy: 200, r: 130 }, CAP = 40, CHUTE = { x: 90, y: 446 }, TRAY = { x: 90, y: 474 };
function pack(n) {
  const pts = [], step = 36.5, lim = G.r - CAP / 2 - 3;
  for (let row = 0; row < 12; row++) {
    const y = G.cy + G.r - CAP / 2 - 4 - row * step * 0.87;
    for (let col = -6; col <= 6; col++) {
      const x = G.cx + col * step + (row % 2 ? step / 2 : 0);
      if (Math.hypot(x - G.cx, y - G.cy) <= lim) pts.push([x, y]);
    }
  }
  pts.sort((a, b) => b[1] - a[1] || Math.abs(a[0] - G.cx) - Math.abs(b[0] - G.cx));
  return pts.slice(0, n);
}
const rot = (s) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return (h % 70) - 35; };

export default function PrizeMachine({ cat, onOpen }) {
  const { t, lang } = useI18n();
  useSyncExternalStore(subscribeRewards, rewardsVersion, rewardsVersion);
  const ps = useMemo(() => catProfiles(cat), [cat]);
  const [shown, setShown] = useState(() => new Set(ps.filter((p) => isDone(p) && isSeen(pKey(p))).map((p) => p.s)));
  const [busy, setBusy] = useState(false);
  const [fly, setFly] = useState(null);            // { slug, open } capsule travelling through the machine
  const [pick, setPick] = useState(null);          // lucky-pick result
  const [sign, setSign] = useState('');            // rank-up text on the marquee sign
  const [crank, setCrank] = useState(0);
  const root = useRef(null), machine = useRef(null), flyEl = useRef(null);
  const nf = new Intl.NumberFormat(lang);

  const inGlobe = ps.filter((p) => !shown.has(p.s));
  const spots = useMemo(() => pack(ps.length), [ps.length]);
  const n = shown.size, rk = rankOf(n, ps.length), pts = paidPoints();
  const nextUsd = (Math.floor(pts / POINTS_PER_USD) + 1) * POINTS_PER_USD;
  const todo = ps.filter((p) => !isDone(p));
  const nextP = todo.find((p) => p.s !== 'additional') || todo[0];
  const rankName = t(RANK_KEYS[rk.i]);
  const u = () => (machine.current ? parseFloat(getComputedStyle(machine.current).getPropertyValue('--u')) || 1 : 1);
  const at = (x, y, s = 1, r = 0, off) => [(x - CAP / 2) * u(), (y - CAP / 2) * u(), s, r, off];
  const inGlobeIndex = (slug) => ps.filter((p) => !shown.has(p.s)).findIndex((p) => p.s === slug);

  /* ---------- dispense one capsule: crank, drop, bounce, crack open ---------- */
  async function dispense(slug, from) {
    setCrank((c) => c + 1); reward('crank', lang);
    machine.current?.classList.add('is-running');
    await wait(reducedMotion() ? 0 : 650);
    setFly({ slug, open: false });
    await wait(30);
    const el = flyEl.current;
    reward('drop', lang);
    await path(el, [at(from[0], from[1], 1, rot(slug)), at(G.cx, G.cy + G.r - 30, 1, rot(slug) + 90, 0.25), at(G.cx, 346, 0.9, 200, 0.42), at(CHUTE.x, CHUTE.y, 0.92, 300, 0.62), at(TRAY.x, TRAY.y, 1, 360, 0.78), at(TRAY.x, TRAY.y - 16, 1, 380, 0.86), at(TRAY.x, TRAY.y, 1, 360, 0.93), at(TRAY.x, TRAY.y - 5, 1, 365, 0.97), at(TRAY.x, TRAY.y, 1, 360, 1)], 1500, 'cubic-bezier(.45,.05,.55,.95)');
    machine.current?.classList.remove('is-running');
    if (reducedMotion() && el) el.style.transform = `translate(${(TRAY.x - CAP / 2) * u()}px, ${(TRAY.y - CAP / 2) * u()}px)`;
    setFly({ slug, open: true }); reward('pop', lang);
    path(el, [at(TRAY.x, TRAY.y, 1, 360), at(TRAY.x, TRAY.y - 18, 1.6, 360)], 380, 'cubic-bezier(.34,1.56,.64,1)');
    const c = capsuleColors(slug), mr = machine.current.getBoundingClientRect(), k = u();
    sparkle(machine.current, TRAY.x * k, (TRAY.y - 10) * k, [c.a1, c.a2, c.a3, '#ffd36a']);
    floatText(machine.current, TRAY.x * k, (TRAY.y - 34) * k, t('rw.plus', { n: nf.format(POINTS_PER_PROFILE) }));
    await wait(reducedMotion() ? 0 : 750);
    return { x: mr.left + TRAY.x * k, y: mr.top + (TRAY.y - 20) * k, c };
  }

  async function flyToSlot(slug) {
    const el = flyEl.current, slot = root.current?.querySelector(`.pm-slot[data-s="${slug}"]`);
    if (!el || !slot || reducedMotion()) return;
    const m = machine.current.getBoundingClientRect(), s = slot.getBoundingClientRect(), k = u();
    const x = s.left - m.left + s.width / 2 - (CAP / 2) * k, y = s.top - m.top + s.height / 2 - (CAP / 2) * k;
    const x0 = (TRAY.x - CAP / 2) * k, y0 = (TRAY.y - 18 - CAP / 2) * k;
    await path(el, [[x0, y0, 1.6, 0], [(x0 + x) / 2, Math.min(y0, y) - 90 * k, 1.3, -10, 0.5], [x, y, 0.85, 0]], 800, 'cubic-bezier(.4,.1,.3,1)');
  }

  /* ---------- delivery: newly completed profiles dispense their capsules ---------- */
  useEffect(() => {
    const keys = pendingKeys(cat);
    if (!keys.length) {
      if (location.hash === '#rewards') setTimeout(() => root.current?.scrollIntoView({ block: 'start' }), 300);
      return undefined;
    }
    let alive = true;
    (async () => {
      setBusy(true);
      await wait(200);
      root.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
      await wait(reducedMotion() ? 50 : 800);
      let have = new Set(ps.filter((p) => isDone(p) && isSeen(pKey(p))).map((p) => p.s));
      for (const [i, key] of keys.entries()) {
        if (!alive) return;
        const slug = key.split(':')[1], before = rankOf(have.size, ps.length).i;
        have = new Set(have).add(slug);
        if (i >= 3 || reducedMotion()) { setShown(new Set(have)); markSeen(key); continue; }
        const from = spots[inGlobeIndex(slug)] || [G.cx, G.cy];
        const tray = await dispense(slug, from);
        if (!alive) return;
        if (!isPaid(key)) {
          const landed = await flyToPoints(tray, t('rw.plus', { n: nf.format(POINTS_PER_PROFILE) }), [tray.c.a1, tray.c.a2], root.current?.querySelector('.pm-led'));
          markPaid(key);
          if (landed) { bump(landed); reward('land', lang); }
        }
        await flyToSlot(slug);
        setShown(new Set(have)); markSeen(key); setFly(null);
        const after = rankOf(have.size, ps.length).i;
        if (after > before) {
          setSign(t('rw.rankUp', { rank: t(RANK_KEYS[after]) })); machine.current?.classList.add('is-party'); reward('rank', lang);
          await wait(2400); setSign(''); machine.current?.classList.remove('is-party');
        }
        await wait(200);
      }
      if (!alive) return;
      setBusy(false);
      const sr = document.getElementById('rw-live');
      if (sr) sr.textContent = t('rw.boardAria', { rank: t(RANK_KEYS[rankOf(have.size, ps.length).i]), pts: nf.format(paidPoints()), usd: fmtUsd(paidPoints(), lang), n: nf.format(have.size), total: nf.format(ps.length) });
    })();
    return () => { alive = false; };
  }, [cat]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- lucky pick: the machine chooses the next profile ---------- */
  async function lucky() {
    if (busy || !todo.length) return;
    setBusy(true); setPick(null);
    const cand = todo[Math.floor(Math.random() * todo.length)];
    await dispense(cand.s, spots[inGlobeIndex(cand.s)] || [G.cx, G.cy]);
    setPick(cand); setBusy(false);
  }
  const closePick = () => { setPick(null); setFly(null); };
  const open = (p, i = 0) => { tap(lang, i, 'press'); onOpen(p); };

  const slot = (p, i) => {
    const got = shown.has(p.s), name = t('p.' + p.s);
    return (
      <li key={p.s}>
        <button type="button" className={'pm-slot ' + (got ? 'got' : '')} data-s={p.s} onClick={() => open(p, i)} title={name}
          aria-label={got ? t('rw.slotDone', { name }) : t('rw.slotTodo', { name })}>
          {got ? <Capsule slug={p.s} open className="mini" /> : <span className="pm-empty" aria-hidden="true">+100</span>}
        </button>
      </li>
    );
  };

  return (
    <section className={'pm' + (todo.length ? '' : ' maxed')} id="rewards" ref={root} aria-labelledby="pm-h">
      <div className="pm-machine-wrap">
        <div className="pm-machine" ref={machine}>
          <div className="pm-sign" aria-hidden="true"><b>{sign || t('rw.machine')}</b></div>
          <div className="pm-globe" aria-hidden="true">
            {inGlobe.map((p, i) => {
              const [x, y] = spots[i] || [G.cx, G.cy];
              return <Capsule key={p.s} slug={p.s} className={'in-globe' + (fly && fly.slug === p.s ? ' gone' : '')} style={{ '--x': x - CAP / 2, '--y': y - CAP / 2, '--r': rot(p.s) + 'deg', '--i': i }} />;
            })}
            <span className="pm-glass" />
          </div>
          <div className="pm-neck" aria-hidden="true" />
          <div className="pm-body">
            <span className="pm-bulbrow" aria-hidden="true">{Array.from({ length: 11 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</span>
            <div className="pm-led" role="img" aria-label={t('rw.boardAria', { rank: rankName, pts: nf.format(pts), usd: fmtUsd(pts, lang), n: nf.format(n), total: nf.format(ps.length) })}>
              <span className="pm-led-l">{t('rw.points')}</span>
              <span className="pm-led-v"><LedCount value={pts} lang={lang} /><small>{t('rw.pts')}</small></span>
              <span className="pm-led-usd">{fmtUsd(pts, lang)}</span>
            </div>
            <span className="pm-chute" aria-hidden="true"><i /></span>
            <span className="pm-tray" aria-hidden="true" />
            <button type="button" className="pm-crank" onClick={lucky} disabled={busy || !todo.length} aria-label={t('rw.crank')} title={t('rw.crankHint')}>
              <span className="pm-crank-k" style={{ '--turns': crank }}><i /></span>
            </button>
          </div>
          <div className="pm-base" aria-hidden="true" />
          {fly && <span className="pm-flyer" ref={flyEl}><Capsule slug={fly.slug} open={fly.open} /></span>}
          {pick && (
            <div className="pm-pick" role="dialog" aria-labelledby="pm-pick-h">
              <small>{t('rw.pick')}</small>
              <b id="pm-pick-h">{t('p.' + pick.s)}</b>
              <span>{t('rw.pickMeta', { n: nf.format(POINTS_PER_PROFILE), m: nf.format(Math.max(1, Math.round((pick.q || 10) * 8 / 60))) })}</span>
              <div>
                <button type="button" className="btn pm-go" onClick={() => open(pick)}>{t('rw.start')} <IArrow /></button>
                <button type="button" className="btn-link" onClick={() => { closePick(); setTimeout(lucky, 50); }}>{t('rw.again')}</button>
              </div>
              <button type="button" className="pm-x" onClick={closePick} aria-label={t('rw.close')}>×</button>
            </div>
          )}
        </div>
      </div>
      <div className="pm-head">
        <p className="pm-kicker"><span className="pm-stars" aria-hidden="true">{'★'.repeat(rk.i + 1)}{'☆'.repeat(4 - rk.i)}</span>{rankName}</p>
        <h3 id="pm-h">{t('rw.title')}</h3>
        <p className="pm-sub">{t('rw.sub', { n: nf.format(POINTS_PER_PROFILE), rate: nf.format(POINTS_PER_USD), usd: fmtUsd(POINTS_PER_USD, lang) })}</p>
      </div>
      <div className="pm-side">
        <div className="pm-coll-h"><b>{t('rw.collection')}</b><span>{t('rw.count', { n: nf.format(n), total: nf.format(ps.length) })}</span></div>
        <ol className="pm-slots" aria-label={t('rw.collection')}>{ps.map(slot)}</ol>
        <div className="pm-chips">
          {rk.next != null ? <span className="pm-chip">⭐ {t('rw.nextRank', { n: nf.format((rk.next - n) * POINTS_PER_PROFILE), rank: t(RANK_KEYS[rk.i + 1]) })}</span> : <span className="pm-chip gold">🏁 {t('rw.max')}</span>}
          {todo.length > 0 && <span className="pm-chip">💵 {t('rw.nextUsd', { n: nf.format(Math.max(0, nextUsd - pts)), usd: fmtUsd(nextUsd, lang) })}</span>}
          <span className="pm-chip soft">{t('rw.rate', { rate: nf.format(POINTS_PER_USD), usd: fmtUsd(POINTS_PER_USD, lang) })}</span>
        </div>
        <ol className="pm-ranks" aria-label={t('rw.rank')}>
          {rk.steps.map((v, k) => (
            <li key={k} className={k < rk.i ? 'past' : k === rk.i ? 'cur' : ''} aria-current={k === rk.i ? 'step' : undefined}>
              <span aria-hidden="true">{'★'.repeat(k + 1)}</span><b>{t(RANK_KEYS[k])}</b><small>{nf.format(v * POINTS_PER_PROFILE)} {t('rw.pts')}</small>
            </li>
          ))}
        </ol>
        <div className="pm-ctas">
          {nextP && <button type="button" className="btn pm-cta" onClick={() => open(nextP)}>{t('rw.cta', { name: t('p.' + nextP.s) })} <IArrow /></button>}
          {todo.length > 1 && <button type="button" className="btn btn-ghost pm-luck" onClick={lucky} disabled={busy}>🎰 {t('rw.crank')}</button>}
        </div>
        <p className="pm-hint">{t('rw.crankHint')}</p>
        <p className="sr-only" id="rw-live" aria-live="polite" />
      </div>
    </section>
  );
}

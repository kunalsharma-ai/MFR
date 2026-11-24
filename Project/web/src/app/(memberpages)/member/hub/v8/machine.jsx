"use client";
// v8 (Kunal round 7): the reward machine on the Profile page, the "Lucky spin" idea from his file: every profile a
// member completes gives one play, and the play pays that profile's points into the header. Each member type has a
// machine of its own, with its own look and motion:
//   Consumer      Prize Wheel      a glossy wheel with one slice per profile; it spins and lands on the profile
//                                  just completed, the pointer flicks and the slice's coins fly to the header
//   Professional  Vault Dial       a steel vault door; the combination dial turns to the profile, the bolts slide,
//                                  the door swings open on gold bars, then closes
//   Teen          Jackpot Reels    a neon arcade cabinet; pull the lever, three reels spin and stop one by one on
//                                  the profile's art, the bulbs chase and XP flies to the header
// With no play waiting, the same control makes a "lucky pick" of an open profile and offers to start it.
// The data is the Profiles page's own (ps/rules.js, filled by usePrizeData): which profiles are done, which payouts
// were already shown (markPaid / markSeen) and the points per profile. Nothing is paid here: the points are already
// in the database when a profile is complete; the machine shows the moment.
import React from "react";
import { useRouter } from "next/navigation";
import { useMember } from "@/Context";
import Icon from "../icons.jsx";
import { t } from "../strings";
import { fmt, memberTypeOf } from "../data";
import { play } from "../sound";
import { usePrefs, motionReduced } from "../prefs";
import { usePrizeData } from "../prize.jsx";
import GateDialog from "../../(member pages)/profiles/ps/GateDialog";
import { capsuleColors } from "../../(member pages)/profiles/ps/Capsule.jsx";
const emojiUrl = (n) => `/hub/3d/${n}.webp`; // the sharp 256px 3D set (round 8)
import { t as pt } from "../../(member pages)/profiles/ps/i18n";
import { catProfiles, isDone, isPaid, markPaid, markSeen, pKey, pendingKeys, pointsFor, subscribeRewards, rewardsVersion } from "../../(member pages)/profiles/ps/rules";
import { isCore } from "../../(member pages)/profiles/ps/profileRules";
import { flyToPoints, bump, sparkle, wait } from "../../(member pages)/profiles/ps/rfx";

const SKIN = { consumer: "wheel", professional: "vault", teen: "slots" };
const MAX = 12;

export const celebrate = (detail) => { try { window.dispatchEvent(new CustomEvent("hub-celebrate", { detail })); } catch (e) { /* old browser */ } };

function useRewards() {
  return React.useSyncExternalStore(subscribeRewards, rewardsVersion, rewardsVersion);
}

/* ---------------- Consumer: Prize Wheel ---------------- */
function Wheel({ slices, turn, spinning, hit }) {
  const n = slices.length || 1;
  const a = 360 / n;
  const R = 100;
  const pt2 = (deg, r = R) => { const rad = ((deg - 90) * Math.PI) / 180; return [110 + Math.cos(rad) * r, 110 + Math.sin(rad) * r]; };
  return (
    <div className={`m8-wheel ${spinning ? "is-spin" : ""}`}>
      <span className="m8-wheel-glow" />
      <span className="m8-bulbs">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ "--i": i }} />)}</span>
      <svg className="m8-wheel-disc" viewBox="0 0 220 220" style={{ transform: `rotate(${turn}deg)` }}>
        {slices.map((s, i) => {
          const [x1, y1] = pt2(i * a); const [x2, y2] = pt2((i + 1) * a);
          const [ex, ey] = pt2((i + 0.5) * a, 70);
          return (
            <g key={s.s} className={`${s.done ? "is-done" : ""} ${hit === s.s ? "is-hit" : ""}`}>
              <path d={`M110 110 L${x1} ${y1} A${R} ${R} 0 ${a > 180 ? 1 : 0} 1 ${x2} ${y2} Z`} fill={i % 2 ? s.c.a2 : s.c.a1} />
              <image href={emojiUrl(s.c.icon)} x={ex - 13} y={ey - 13} width="26" height="26" transform={`rotate(${(i + 0.5) * a} ${ex} ${ey})`} />
            </g>
          );
        })}
        <circle cx="110" cy="110" r="100" className="rim" />
      </svg>
      <span className="m8-wheel-hub"><Icon name="coin" size={22} /></span>
      <span className="m8-pointer" />
    </div>
  );
}

/* ---------------- Professional: Vault Dial ---------------- */
function Vault({ slices, turn, spinning, open, hit }) {
  const n = slices.length || 1;
  const a = 360 / n;
  const hitS = slices.find((s) => s.s === hit);
  return (
    <div className={`m8-vault ${spinning ? "is-spin" : ""} ${open ? "is-open" : ""}`}>
      <span className="m8-vault-inside">
        <span className="m8-bars">{[0, 1, 2, 3, 4, 5].map((i) => <i key={i} style={{ "--i": i }} />)}</span>
        {hitS ? <img className="m8-vault-prize" src={emojiUrl(hitS.c.icon)} alt="" /> : null}
      </span>
      <span className="m8-door">
        <span className="m8-bolts">{[0, 1, 2, 3].map((i) => <i key={i} style={{ "--i": i }} />)}</span>
        <span className="m8-dial" style={{ transform: `rotate(${turn}deg)` }}>
          {slices.map((s, i) => (
            <span key={s.s} className={`m8-mark ${s.done ? "is-done" : ""}`} style={{ "--r": `${i * a}deg` }}><img src={emojiUrl(s.c.icon)} alt="" /></span>
          ))}
          {Array.from({ length: 48 }, (_, i) => <i key={i} className="m8-tick" style={{ "--r": `${i * 7.5}deg` }} />)}
        </span>
        <span className="m8-handle"><i /><i /><i /></span>
        <span className="m8-notch" />
      </span>
    </div>
  );
}

/* ---------------- Teen: Jackpot Reels ---------------- */
function Slots({ slices, reels, jump, spinning, lever, win }) {
  const strip = slices.length ? slices : [{ s: "x", c: { icon: "star" } }];
  return (
    <div className={`m8-slots ${spinning ? "is-spin" : ""} ${win ? "is-win" : ""}`}>
      <span className="m8-marquee">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ "--i": i }} />)}<b>JACKPOT</b></span>
      <span className="m8-window">
        {[0, 1, 2].map((k) => (
          <span key={k} className="m8-reel">
            <span className={`m8-strip ${jump ? "is-jump" : ""}`} style={{ "--y": reels[k], "--k": k }}>
              {[...strip, ...strip, ...strip, ...strip].map((s, i) => <img key={i} src={emojiUrl(s.c.icon)} alt="" />)}
            </span>
          </span>
        ))}
        <span className="m8-payline" />
      </span>
      <span className={`m8-lever ${lever ? "is-pull" : ""}`}><i /><b /></span>
      <span className="m8-tray"><i /></span>
    </div>
  );
}

export default function RewardMachine8() {
  const router = useRouter();
  const member = useMember();
  const type = memberTypeOf(member) || "consumer";
  const skin = SKIN[type] || "wheel";
  const prefs = usePrefs();
  const still = motionReduced(prefs);
  const { ready, gate, error } = usePrizeData();
  useRewards();
  const ps = ready ? catProfiles() : [];
  const slices = ps.slice(0, MAX).map((p) => ({ s: p.s, c: capsuleColors(p.s), done: isDone(p) }));
  const pending = ready ? pendingKeys().filter((k) => slices.some((s) => `${s.s}` === k.split(":")[1])) : [];
  const open = ps.filter((p) => !isDone(p));
  const canOpen = (slug) => isCore(slug) || Boolean(gate?.coreDone);
  const done = ps.filter(isDone).length;

  const [turn, setTurn] = React.useState(0);
  const [reels, setReels] = React.useState([1, 1, 1]);
  const [busy, setBusy] = React.useState(false);
  const [hit, setHit] = React.useState(null);
  const [vaultOpen, setVaultOpen] = React.useState(false);
  const [lever, setLever] = React.useState(false);
  const [reelJump, setReelJump] = React.useState(false);
  const [pick, setPick] = React.useState(null);
  const [won, setWon] = React.useState(null);
  const [gateOpen, setGateOpen] = React.useState(false);
  const stage = React.useRef(null);

  async function run(slug) {
    const i = Math.max(0, slices.findIndex((s) => s.s === slug));
    const n = slices.length || 1;
    setHit(null); setWon(null); setPick(null);
    if (skin === "slots") {
      setLever(true); play("tap");
      setTimeout(() => setLever(false), 450);
      // jump back to the first copy of the strip without motion, then roll down to the same profile two copies on
      setReelJump(true); setReels([i, i, i]);
      await wait(40);
      setReelJump(false); setReels([2 * n + i, 2 * n + i, 2 * n + i]);
      await wait(still ? 50 : 2500);
    } else {
      const a = 360 / n;
      const goal = 360 - (i + 0.5) * a; // that slice under the pointer at the top
      setTurn((cur) => { const base = cur - (cur % 360); return base + (still ? 0 : 360 * 5) + goal + (goal < (cur % 360) ? 360 : 0); });
      play("tap");
      await wait(still ? 50 : skin === "vault" ? 2600 : 3800);
      if (skin === "vault") { setVaultOpen(true); play("complete"); await wait(still ? 0 : 700); }
    }
    setHit(slug);
    return i;
  }

  async function playOne() {
    if (busy || !ready) return;
    setBusy(true);
    if (pending.length) {
      const key = pending[0];
      const slug = key.split(":")[1];
      await run(slug);
      const pts = pointsFor(slug);
      const r = stage.current?.getBoundingClientRect();
      const c = capsuleColors(slug);
      if (stage.current && r) sparkle(stage.current, r.width / 2, r.height / 2, [c.a1, c.a2, c.a3, "#FFC233"], 20);
      setWon({ slug, pts });
      play("reward");
      if (!isPaid(key) && r) {
        const landed = await flyToPoints({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, `+${fmt(pts)}`, [c.a1, c.a2], null);
        if (landed) bump(landed);
      }
      markPaid(key); markSeen(key);
      celebrate({ kind: "machine", points: pts, name: pt(`p.${slug}`) });
      if (skin === "vault") { await wait(still ? 0 : 1600); setVaultOpen(false); }
    } else if (open.length) {
      const cand = open[Math.floor(Math.random() * open.length)];
      await run(cand.s);
      setPick(cand.s);
      if (skin === "vault") { await wait(still ? 0 : 900); setVaultOpen(false); }
    }
    setBusy(false);
  }

  const startPick = () => {
    if (!pick) return;
    if (canOpen(pick)) router.push(`/member/profiles?profile=${encodeURIComponent(pick)}`);
    else setGateOpen(true);
  };

  const left = pending.length;
  const verb = t(`v8.m.verb.${skin}`);
  return (
    <section className={`m8 m8-k-${skin}`} id="reward-machine" aria-labelledby="m8-title">
      <div className="m8-stage" ref={stage}>
        {skin === "wheel" ? <Wheel slices={slices} turn={turn} spinning={busy} hit={hit} /> : skin === "vault" ? <Vault slices={slices} turn={turn} spinning={busy} open={vaultOpen} hit={hit} /> : <Slots slices={slices} reels={reels} jump={reelJump} spinning={busy} lever={lever} win={Boolean(won)} />}
      </div>
      <div className="m8-side">
        <p className="m8-eyebrow"><Icon name="gift" size={15} /> {t(`v8.m.name.${skin}`)}</p>
        <h2 className="m8-title" id="m8-title">{t(`v8.m.title.${skin}`)}</h2>
        <p className="m8-sub">{t(`v8.m.sub.${type}`, { n: fmt(pointsFor(ps[0]?.s || "basic")) })}</p>
        <div className="m8-count" aria-live="polite">
          <span className={`m8-plays ${left ? "has" : ""}`}><b>{ready ? left : "…"}</b><small>{t(left === 1 ? `v8.m.ready1.${skin}` : `v8.m.readyN.${skin}`)}</small></span>
          <span className="m8-got"><b>{ready ? `${done}/${ps.length}` : "…"}</b><small>{t("v8.m.collected")}</small></span>
        </div>
        {error ? <p className="m8-note"><Icon name="alert" size={16} /> {t("d2.profileError")}</p> : null}
        <button type="button" className="h-btn h-btn-primary h-btn-lg m8-go" onClick={playOne} disabled={!ready || busy || (!left && !open.length)}>
          <Icon name={skin === "slots" ? "bolt" : skin === "vault" ? "lock" : "refresh"} size={18} /> {left ? verb : t(`v8.m.lucky.${skin}`)}
        </button>
        {won ? <p className="m8-won"><img src={emojiUrl(capsuleColors(won.slug).icon)} alt="" /> {t(type === "teen" ? "v8.m.wonXp" : "v8.m.won", { n: fmt(won.pts), name: pt(`p.${won.slug}`) })}</p> : null}
        {pick ? (
          <p className="m8-won pick"><img src={emojiUrl(capsuleColors(pick).icon)} alt="" /> {t("v8.m.picked", { name: pt(`p.${pick}`) })} <button type="button" className="h-link" onClick={startPick}>{t("pf.start")} <Icon name="arrow" size={14} /></button></p>
        ) : null}
        {!left && !won && !pick ? <p className="m8-note">{open.length ? t("v8.m.how", { n: fmt(pointsFor(open[0]?.s || "basic")) }) : t("v8.m.all")}</p> : null}
        <ul className="m8-chips" aria-label={t("v8.m.collected")}>
          {slices.map((s) => (
            <li key={s.s} className={s.done ? "is-done" : ""} title={pt(`p.${s.s}`)} style={{ "--k1": s.c.a1, "--k2": s.c.a2 }}>
              <img src={emojiUrl(s.c.icon)} alt="" />{s.done ? <i><Icon name="check" size={10} /></i> : null}
            </li>
          ))}
        </ul>
      </div>
      <GateDialog open={gateOpen} gate={gate} onClose={() => setGateOpen(false)} onStart={(slug) => { setGateOpen(false); router.push(`/member/profiles?profile=${slug}`); }} />
    </section>
  );
}

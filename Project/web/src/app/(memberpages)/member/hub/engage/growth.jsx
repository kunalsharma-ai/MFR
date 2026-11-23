"use client";
// Quality page: tier ladder, "score up" celebration, monthly trend and the surveys a higher tier opens.
// Referrals page: tier bonuses, live status per referral, one-tap sharing with an invite card, opt-in leaderboard.
// Every figure comes from /api/v1/engagement. Teens get no referral tiers or leaderboard.
import React from "react";
import Link from "next/link";
import Icon from "../icons.jsx";
import { t } from "../strings";
import { LoadingBlock, ErrorState, EmptyState, Reveal } from "../ui.jsx";
import { fmt, relDay } from "../data";
import { useEngage, useEngageMutation, usePreferences, useSavePreferences } from "./data";
import { play } from "../sound";
import "./engage.css";

const monthName = (m) => new Date(`${m}-15`).toLocaleDateString(undefined, { month: "short" });

/* =============================== QUALITY =============================== */
export const useQuality = () => useEngage("quality", "/quality");

function Celebrate({ c, onClose }) {
  React.useEffect(() => { play("achievement"); }, []);
  return (
    <div className="eg-celebrate" role="status">
      <span className="eg-confetti" aria-hidden="true">{Array.from({ length: 14 }).map((_, i) => <i key={i} style={{ "--i": i }} />)}</span>
      <Icon name="rocket" size={28} />
      <div>
        <b>{c.tierUp ? t("qt.tierUp", { tier: c.tierUp.label }) : t("qt.up")}</b>
        <small>{t("qt.upBy", { from: fmt(c.from), to: fmt(c.to) })}</small>
      </div>
      <button type="button" className="h-btn h-btn-soft" onClick={onClose}>{t("qt.nice")}</button>
    </div>
  );
}

export function QualityTiers() {
  const q = useQuality();
  const seen = useEngageMutation("post", "/quality/seen");
  const [hidden, setHidden] = React.useState(false);
  if (q.isLoading) return <LoadingBlock lines={2} h={100} />;
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  const d = q.data;
  const cur = d.tier?.key;
  return (
    <>
      {d.celebrate && !hidden ? <Celebrate c={d.celebrate} onClose={() => { setHidden(true); seen.mutate({}); }} /> : null}
      <section className="eg-card eg-tiers" aria-labelledby="qt-title">
        <h2 className="h-h3" id="qt-title"><Icon name="trophy" size={20} /> {t("qt.title")}</h2>
        <ol className="eg-ladder">
          {d.tiers.map((x) => (
            <li key={x.key} className={`t-${x.key}${x.key === cur ? " is-cur" : ""}${d.score >= x.min ? " is-reached" : ""}`} aria-current={x.key === cur ? "step" : undefined}>
              <span className="eg-medal" aria-hidden="true"><Icon name="star" size={18} /></span>
              <b>{x.label}</b>
              <small>{t("qt.from", { n: fmt(x.min) })}</small>
            </li>
          ))}
        </ol>
        <p className="h-sub">
          {d.next ? t("qt.next", { n: fmt(d.toNext), tier: d.next.label }) : t("qt.top")}
        </p>
        {d.unlocks?.length ? (
          <ul className="eg-unlocks">
            {d.unlocks.map((u) => (
              <li key={u.tier}><Icon name="lock" size={16} /> {t("qt.unlock", { n: u.surveys, tier: u.label || u.tier })}</li>
            ))}
          </ul>
        ) : null}
      </section>
    </>
  );
}

export function QualityTrend() {
  const q = useQuality();
  if (q.isLoading) return <LoadingBlock lines={2} h={140} />;
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  const h = q.data.history || [];
  if (h.length < 2) return <EmptyState kind="quality" title={t("qt.trendSoon")} text={t("qt.trendSoonText")} />;
  const max = q.data.scale || 200;
  const W = 600, H = 160, pad = 24;
  const x = (i) => pad + (i * (W - pad * 2)) / Math.max(1, h.length - 1);
  const y = (v) => H - pad - (v / max) * (H - pad * 2);
  const path = h.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.score).toFixed(1)}`).join(" ");
  return (
    <figure className="eg-trend">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={h.map((p) => `${monthName(p.month)} ${p.score}`).join(", ")}>
        {q.data.tiers.filter((t2) => t2.min > 0).map((t2) => <line key={t2.key} x1={pad} x2={W - pad} y1={y(t2.min)} y2={y(t2.min)} className="eg-trend-band" />)}
        <path d={path} className="eg-trend-line" />
        {h.map((p, i) => <circle key={p.month} cx={x(i)} cy={y(p.score)} r="5" className="eg-trend-dot" />)}
      </svg>
      <figcaption className="eg-trend-x">{h.map((p) => <span key={p.month}>{monthName(p.month)}<b>{p.score}</b></span>)}</figcaption>
    </figure>
  );
}

/* =============================== REFERRALS =============================== */
export const useReferralData = () => useEngage("referrals", "/referrals");

function Tiers({ d }) {
  if (!d.tiersOn) return <p className="rv-note small"><Icon name="coin" size={16} /> {t("rf.noBonus")}</p>;
  const top = d.tiers[d.tiers.length - 1]?.count || 1;
  return (
    <section className="eg-card eg-rtiers" aria-labelledby="rt-title">
      <h2 className="h-h3" id="rt-title"><Icon name="trophy" size={20} /> {t("rt.title")}</h2>
      <p className="h-sub">{t("rt.sub")}</p>
      <div className="eg-rtrack">
        <div className="eg-bar" role="progressbar" aria-valuemin={0} aria-valuemax={top} aria-valuenow={d.counts.counted} aria-label={t("rt.title")}>
          <i style={{ "--w": `${Math.min(100, (d.counts.counted / top) * 100)}%` }} />
        </div>
        <ol>
          {d.tiers.map((x) => (
            <li key={x.count} className={x.reached ? "is-reached" : ""} style={{ "--at": `${(x.count / top) * 100}%` }}>
              <b>{x.count}</b><small>+{fmt(x.points)}</small>
            </li>
          ))}
        </ol>
      </div>
      <p className="eg-goal-meta">
        <b>{t("rt.counted", { n: d.counts.counted })}</b>
        {d.next ? <span className="eg-pill muted">{t("rt.next", { n: d.next.left, p: fmt(d.next.points) })}</span> : <span className="eg-pill ok">{t("rt.all")}</span>}
      </p>
      {d.from && new Date(d.from) > new Date() ? <p className="h-sub">{t("rt.from", { d: new Date(d.from).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) })}</p> : null}
    </section>
  );
}

const STAGES = ["joined", "verified", "first_survey"];
export function ReferralStatus() {
  const r = useReferralData();
  const d = r.data;
  if (!d?.referrals?.length) return null;
  return (
    <>
      <h2 className="h-h3" id="rl2-title"><Icon name="users" size={20} /> {t("rf.listJoined")}</h2>
      <ul className="rf-people eg-rstatus">
        {d.referrals.map((p) => {
          const at = STAGES.indexOf(p.stage);
          return (
            <li key={p.id}>
              <span className="rf-av">{(p.name || "?").slice(0, 1).toUpperCase()}</span>
              <span><b>{p.name}</b><small>{p.joinedAt ? relDay(new Date(p.joinedAt), t) : ""}</small></span>
              <ol className="eg-steps" aria-label={t(`rs.${p.stage}`)}>
                {STAGES.map((s, i) => <li key={s} className={i <= at ? "on" : ""} title={t(`rs.${s}`)}><i /></li>)}
              </ol>
              <em className={p.counts ? "ok" : ""}>{p.counts ? t("rs.counts") : t(`rs.${p.stage}`)}</em>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// a square invite card drawn in the browser, shared as an image where the device allows it
async function inviteCard(name, link) {
  const c = document.createElement("canvas");
  c.width = 1080; c.height = 1080;
  const g = c.getContext("2d");
  const css = getComputedStyle(document.querySelector(".hub") || document.documentElement);
  const p = css.getPropertyValue("--primary").trim() || "#4f46e5";
  const a = css.getPropertyValue("--accent").trim() || "#06b6d4";
  const grad = g.createLinearGradient(0, 0, 1080, 1080);
  grad.addColorStop(0, p); grad.addColorStop(1, a);
  g.fillStyle = grad; g.fillRect(0, 0, 1080, 1080);
  g.fillStyle = "rgba(255,255,255,.12)";
  for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(900 - i * 40, 180 + i * 30, 220 - i * 30, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#fff";
  g.font = "800 92px system-ui, sans-serif";
  g.fillText("MyFrequentRewards", 80, 200);
  g.font = "700 64px system-ui, sans-serif";
  const lines = [t("sh.cardLine1", { name: name || "" }).trim(), t("sh.cardLine2")];
  lines.forEach((l, i) => g.fillText(l, 80, 520 + i * 90));
  g.font = "500 40px system-ui, sans-serif";
  g.fillText(link.replace(/^https?:\/\//, ""), 80, 960);
  return new Promise((r) => c.toBlob((b) => r(b), "image/png"));
}

export function ShareButtons({ link, name }) {
  const [msg, setMsg] = React.useState("");
  const text = t("sh.text");
  const wa = `https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`;
  const mail = `mailto:?subject=${encodeURIComponent(t("sh.subject"))}&body=${encodeURIComponent(`${text}\n\n${link}`)}`;
  async function card(forInsta) {
    setMsg("");
    const blob = await inviteCard(name, link);
    if (!blob) return;
    const file = new File([blob], "myfrequentrewards-invite.png", { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${text} ${link}` });
        play("complete");
        return;
      }
    } catch (e) { if (e?.name === "AbortError") return; }
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url; el.download = file.name; el.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    try { await navigator.clipboard.writeText(link); } catch (e) { /* clipboard blocked */ }
    setMsg(forInsta ? t("sh.instaHint") : t("sh.saved"));
  }
  return (
    <div className="eg-share">
      <p className="eg-share-l">{t("sh.title")}</p>
      <div className="eg-actions">
        <a className="h-btn h-btn-soft eg-wa" href={wa} target="_blank" rel="noopener noreferrer"><Icon name="share" size={18} /> WhatsApp</a>
        <button type="button" className="h-btn h-btn-soft eg-ig" onClick={() => card(true)}><Icon name="camera" size={18} /> Instagram</button>
        <a className="h-btn h-btn-soft" href={mail}><Icon name="mail" size={18} /> {t("sh.email")}</a>
        <button type="button" className="h-btn h-btn-soft" onClick={() => card(false)}><Icon name="spark" size={18} /> {t("sh.card")}</button>
      </div>
      {msg ? <p className="h-sub" role="status">{msg}</p> : null}
    </div>
  );
}

function Leaderboard() {
  const lb = useEngage("leaderboard", "/referrals/leaderboard");
  const prefs = usePreferences();
  const save = useSavePreferences();
  if (lb.isLoading) return <LoadingBlock lines={3} h={120} />;
  if (lb.isError || !lb.data) return null;
  const d = lb.data;
  const toggle = () => save.mutate({ leaderboard: { optIn: !d.optedIn } });
  return (
    <section className="eg-card eg-lb" aria-labelledby="lb-title">
      <h2 className="h-h3" id="lb-title"><Icon name="chart" size={20} /> {t("lb.title", { m: new Date(`${d.month}-15`).toLocaleDateString(undefined, { month: "long" }) })}</h2>
      <p className="h-sub">{t("lb.sub")}</p>
      {d.top.length ? (
        <ol className="eg-lb-list">
          {d.top.map((r, i) => (
            <li key={i} className={r.me ? "is-me" : ""}><span className="eg-lb-rank">{r.rank}</span><b>{r.name}{r.me ? ` (${t("rf.you")})` : ""}</b><span>{t("lb.count", { n: r.count })}</span></li>
          ))}
        </ol>
      ) : <p className="h-sub">{t("lb.empty")}</p>}
      {d.me && !d.top.some((r) => r.me) ? <p className="eg-goal-meta">{d.me.rank ? t("lb.mine", { r: d.me.rank, n: d.me.count }) : t("lb.notYet")}</p> : null}
      <label className="eg-check">
        <input type="checkbox" checked={d.optedIn} disabled={save.isPending || prefs.isLoading} onChange={toggle} />
        <span>{t("lb.optIn")}</span>
      </label>
    </section>
  );
}

export function ReferralExtras() {
  const r = useReferralData();
  if (r.isLoading) return <LoadingBlock lines={2} h={120} />;
  if (r.isError) return <ErrorState onRetry={() => r.refetch()} />;
  const d = r.data;
  return (
    <div className="eg-rgrid">
      <Reveal><Tiers d={d} /></Reveal>
      {d.leaderboard ? <Reveal delay={60}><Leaderboard /></Reveal> : null}
    </div>
  );
}

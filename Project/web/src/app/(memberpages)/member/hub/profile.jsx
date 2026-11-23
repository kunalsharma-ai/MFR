"use client";
// Profile hero + completion system (v2, Nov 2026). Sits above the approved v4.1 profile studio (profiles/ps/*, untouched).
// Reads the same snapshot as the header and dashboard (store.js), so the % here is the % everywhere. When the
// studio saves a profile it calls bumpRewards(); this band, the header ring and the dashboard update together.
// Reaching 100% plays a one-time celebration (remembered per member on this device).
import React from "react";
import Link from "next/link";
import Icon from "./icons.jsx";
import { t } from "./strings";
import { Counter, Ring, Meter, Burst, LoadingBlock, ErrorState } from "./ui.jsx";
import { Avatar } from "./Shell.jsx";
import { fmt } from "./data";
import { useHub, useRise } from "./store";
import { play } from "./sound";

function useCelebrate(id, pct) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    if (!id || pct !== 100) return;
    const key = `mfr.hub.p100.${id}`;
    let seen = false;
    try { seen = localStorage.getItem(key) === "1"; } catch (e) { /* blocked */ }
    if (seen) return;
    setShow(true);
    play("milestone");
    try { localStorage.setItem(key, "1"); } catch (e) { /* blocked */ }
  }, [id, pct]);
  return [show, () => setShow(false)];
}

export default function ProfileBand() {
  const hub = useHub();
  const { member, type, completion: c, quality, level, pts, profiles } = hub;
  const rise = useRise(c?.pct ?? null);
  const [party, endParty] = useCelebrate(member?._id, c?.pct);
  if (profiles.isError) return <div className="pb pb-err"><ErrorState text={t("d2.profileError")} onRetry={profiles.refetch} /></div>;
  if (!c) return <div className="pb"><LoadingBlock lines={3} h={200} /></div>;
  const done = c.items.filter((i) => i.done);
  const missing = c.remaining;
  const steps = missing.slice(0, 3);
  return (
    <section className={`pb t-${type} ${c.pct >= 100 ? "is-full" : ""}`} aria-labelledby="pb-title">
      <div className="pb-hero">
        <div className="pb-id">
          <span className={`pb-av ${rise ? "is-rise" : ""}`}>
            <Ring pct={c.pct} size={112} stroke={8} label={`${c.pct}%`}><Avatar member={member} size="xl" /></Ring>
            {rise ? <Burst key={c.pct} /> : null}
          </span>
          <div>
            <nav className="hx-crumbs" aria-label={t("c.breadcrumb")}><ol><li><Link href="/member/dashboard">{t("nav.dashboard")}</Link></li><li><span aria-current="page">{t("nav.myProfile")}</span></li></ol></nav>
            <h1 className="pb-title" id="pb-title">{c.pct >= 100 ? t("pb.titleDone") : t("pb.title", { n: c.pct })}</h1>
            <p className="pb-sub">{c.pct >= 100 ? t("pb.subDone") : t("pb.sub", { n: missing.length })}</p>
          </div>
        </div>
        <ul className="pb-stats" aria-label={t("pb.status")}>
          <li><small>{t("pb.completion")}</small><b><Counter value={c.pct} />%</b><Meter pct={c.pct} label={t("pb.completion")} /></li>
          <li><small>{t("nav.quality")}</small><b>{quality ? <>{quality.ten.toFixed(1)}<em>/10</em></> : "–"}</b><span className="pb-tag">{quality ? (quality.tier?.label || t(`qs.${quality.band}`)) : ""}</span></li>
          <li><small>{t("lv.title")}</small><b>L{level.n}</b><span className="pb-tag">{level.left != null ? t("lv.toNext", { n: fmt(level.left) }) : t("lv.top")}</span></li>
          <li><small>{t("pb.reward")}</small><b>{c.pointsLeft ? `+${fmt(c.pointsLeft)}` : <Icon name="check" size={20} />}</b><span className="pb-tag">{c.pointsLeft ? t("pb.toEarn") : t("pb.allPaid")}</span></li>
        </ul>
        <div className="pb-illus" aria-hidden="true">
          <span className="pb-card c1"><i /><i /><i /></span>
          <span className="pb-card c2"><i /><i /></span>
          <span className="pb-card c3"><Icon name="check" size={18} /></span>
        </div>
      </div>

      <div className="pb-grid">
        <div className="pb-col pb-next">
          <h2 className="pb-h"><Icon name="target" size={18} /> {c.pct >= 100 ? t("pb.keepGoing") : t("pb.nextSteps")}</h2>
          {steps.length ? (
            <ol className="pb-steps">
              {steps.map((i, k) => (
                <li key={i.key} style={{ "--i": k }}>
                  <span className="pb-step-n">{k + 1}</span>
                  <span className="pb-step-tx">
                    <b>{i.kind === "profile" ? t(i.action, { name: i.label }) : t(i.label)}</b>
                    <small>{i.kind === "profile" ? (i.reward ? t("pb.stepReward", { n: fmt(i.reward) }) : t("pb.stepMatch")) : t(`pb.why.${i.key}`)}</small>
                  </span>
                  <Link href={i.href} className="h-btn h-btn-primary">{k === 0 ? t("pb.go") : t("c.open")} <Icon name="arrow" size={16} /></Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="pb-more">{c.extraTotal ? t("pb.extra", { a: c.extraDone, b: c.extraTotal }) : t("pb.subDone")}</p>
          )}
        </div>
        <div className="pb-col pb-missing">
          <h2 className="pb-h"><Icon name="alert" size={18} /> {t("pb.missing")} <span className="pb-count">{missing.length}</span></h2>
          {missing.length ? (
            <ul className="pb-chips">{missing.map((i) => <li key={i.key}><Link href={i.href}><Icon name={i.kind === "profile" ? "profile" : i.icon} size={14} /> {i.kind === "profile" ? i.label : t(i.label)}</Link></li>)}</ul>
          ) : <p className="pb-more"><Icon name="check" size={16} /> {t("pb.nothingMissing")}</p>}
        </div>
        <div className="pb-col pb-done">
          <h2 className="pb-h"><Icon name="check" size={18} /> {t("pb.completed")} <span className="pb-count">{done.length}</span></h2>
          {done.length ? (
            <ul className="pb-chips done">{done.map((i) => <li key={i.key}><span><Icon name="check" size={14} /> {i.kind === "profile" ? i.label : t(i.label)}</span></li>)}</ul>
          ) : <p className="pb-more">{t("pb.noneYet")}</p>}
          <p className="pb-benefit"><Icon name="spark" size={16} /> {t("pb.benefit", { n: pts ? fmt(hub.open || 0) : "…" })}</p>
        </div>
      </div>

      {party ? (
        <div className="pb-party" role="dialog" aria-modal="false" aria-labelledby="pb-party-t">
          <Burst n={24} className="big" />
          <span className="pb-party-ic"><Icon name="trophy" size={34} /></span>
          <h2 id="pb-party-t">{t("pb.partyTitle")}</h2>
          <p>{t("pb.partyText")}</p>
          <div className="pb-party-cta">
            <Link href="/member/surveys" className="h-btn h-btn-primary" onClick={endParty}>{t("d2.openSurveys")}</Link>
            <button type="button" className="h-btn h-btn-ghost" onClick={endParty}>{t("c.close")}</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

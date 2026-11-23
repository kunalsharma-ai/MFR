"use client";
// Services (v2, Nov 2026): everything a member can do on MyFrequentRewards as one interactive workflow.
// Each service's state is worked out from live data (store.js + the engagement and help reads), never stored:
//   Requires action · Available · In progress · Pending · Completed
// Desktop shows a workflow board (one lane per state); phones get state filters and a single list.
import React from "react";
import Link from "next/link";
import Icon from "./icons.jsx";
import { t } from "./strings";
import { Hero, Reveal, StatusChip, LoadingBlock, EmptyState } from "./ui.jsx";
import { fmt } from "./data";
import { useHub } from "./store";
import { useEngage } from "./engage/data";
import { useMyQueries } from "./help/data";
import { play } from "./sound";

export const STATES = ["action", "available", "progress", "pending", "done"];

function useServices() {
  const hub = useHub();
  const tasks = useEngage("teen-tasks", "/teen/tasks", { enabled: hub.type === "teen" });
  const queries = useMyQueries();
  const { completion: c, opps, today, referrals, pts, bal, member, type } = hub;
  const list = [];
  if (c) {
    const core = c.items.filter((i) => i.kind === "profile");
    const coreDone = core.filter((i) => i.done).length;
    const basic = core.find((i) => i.slug === "basic");
    list.push({
      key: "profile", cat: "svc.catProfile", icon: "profile", title: t("svc.profile"), text: t("svc.profileText"),
      state: c.pct >= 100 ? "done" : basic && !basic.done ? "action" : coreDone || core.some((i) => i.progress > 0) ? "progress" : "available",
      progress: c.pct, meta: t("svc.profileMeta", { a: coreDone, b: core.length }), reward: c.pointsLeft,
      steps: core.map((i) => ({ label: i.label, done: i.done, now: i === c.next })),
      href: c.next?.kind === "profile" ? c.next.href : "/member/profiles", cta: c.pct >= 100 ? t("svc.review") : t("svc.continue"),
    });
  }
  const verified = member?.isVerified?.email === "verified";
  if (!verified) list.push({ key: "verify", cat: "svc.catAccount", icon: "mail", title: t("svc.verify"), text: t("svc.verifyText"), state: "action", href: "/member/myaccount#identity", cta: t("svc.fix") });
  if (opps.data) {
    for (const [k, title, text, icon] of [["internal", "op.yours", "op.yoursHint", "spark"], ["external", "op.partner", "op.partnerHint", "network"]]) {
      if (type === "teen" && k === "external" && !opps.data.external.all) continue;
      const d = opps.data[k];
      list.push({
        key: `s-${k}`, cat: "svc.catSurveys", icon, title: t(title), text: t(text),
        state: d.all ? "available" : "pending", meta: d.all ? t("svc.surveysMeta", { n: fmt(d.all), h: fmt(d.high), s: fmt(d.short) }) : t("svc.waitingMatch"),
        href: `/member/surveys?source=${k}`, cta: t("op.go"), count: d.all,
      });
    }
  }
  const poll = today.data?.poll;
  if (poll) list.push({ key: "poll", cat: "svc.catDaily", icon: "spark", title: t("pl.title"), text: poll.question, state: poll.answered ? "done" : "available", reward: poll.answered ? 0 : poll.points, href: "/member/dashboard#today", cta: poll.answered ? t("svc.results") : t("svc.answer") });
  for (const ch of today.data?.challenges?.items || []) {
    const pct = Math.round((ch.progress / Math.max(1, ch.target)) * 100);
    list.push({ key: `ch-${ch.key}`, cat: "svc.catChallenge", icon: "trophy", title: ch.title, text: t("svc.challengeText"), state: ch.done ? "done" : ch.progress > 0 ? "progress" : "available", progress: pct, meta: `${ch.progress}/${ch.target}`, reward: ch.pays && !ch.paid ? ch.points : 0, href: "/member/dashboard#today", cta: t("c.open") });
  }
  if (type === "teen") {
    for (const tk of tasks.data || []) list.push({ key: `tk-${tk.id}`, cat: "svc.catCreative", icon: "palette", title: tk.title, text: tk.question || t(`tk.${tk.kind}`), state: tk.done ? (tk.status === "pending" ? "pending" : "done") : "available", reward: tk.points, href: "/member/dashboard", cta: tk.done ? t("svc.results") : t("svc.join") });
  }
  if (referrals.data) {
    const inv = referrals.data.invited.length;
    const joined = referrals.data.joined.length;
    if (type !== "teen") list.push({ key: "refer", cat: "svc.catNetwork", icon: "referrals", title: t("svc.refer"), text: t("svc.referText"), state: joined ? "done" : inv ? "pending" : "available", meta: t("svc.referMeta", { a: fmt(inv), b: fmt(joined) }), href: "/member/referrals", cta: inv ? t("svc.track") : t("rf.invite") });
  }
  if (pts) {
    const pct = Math.min(100, Math.round((pts.total / pts.threshold) * 100));
    list.push({ key: "redeem", cat: "svc.catRewards", icon: "gift", title: t("svc.redeem"), text: type === "teen" ? t("svc.redeemTextTeen") : t("svc.redeemText"), state: pts.total >= pts.threshold ? "available" : "progress", progress: pct, meta: `${fmt(pts.total)} / ${fmt(pts.threshold)} ${t("c.pts")}`, href: "/member/rewards", cta: t("svc.market") });
  }
  if (bal?.pending) list.push({ key: "clearing", cat: "svc.catRewards", icon: "hourglass", title: t("svc.clearing"), text: t("svc.clearingText"), state: "pending", meta: `${fmt(bal.pending)} ${t("c.pts")}`, href: "/member/activity", cta: t("svc.track") });
  for (const q of (queries.data || []).slice(0, 3)) {
    const open = !["resolved", "closed"].includes(q.status);
    list.push({ key: `q-${q.id}`, cat: "svc.catSupport", icon: "help", title: q.subject || t("hp.noSubject"), text: `#${q.no}`, state: open ? "pending" : "done", meta: t(`hp.status.${q.status}`), href: `/member/support/open?ticket=${encodeURIComponent(q.id)}`, cta: t("c.open") });
  }
  return { hub, list, loading: !c && hub.profiles.isLoading };
}

function ServiceCard({ s, i }) {
  return (
    <article className={`sv-card st-${s.state}`} style={{ "--i": i }}>
      <header className="sv-top">
        <span className="sv-art" aria-hidden="true"><Icon name={s.icon} size={24} /><i /><i /></span>
        <div className="sv-id">
          <small>{t(s.cat)}</small>
          <h3>{s.title}</h3>
        </div>
        <StatusChip state={s.state} label={t(`svc.st.${s.state}`)} />
      </header>
      {s.text ? <p className="sv-text">{s.text}</p> : null}
      {s.steps?.length ? (
        <ol className="sv-steps" aria-label={s.meta}>
          {s.steps.map((x, k) => <li key={k} className={x.done ? "done" : x.now ? "now" : ""}><span aria-hidden="true">{x.done ? <Icon name="check" size={12} /> : k + 1}</span><small>{x.label}</small></li>)}
        </ol>
      ) : s.progress != null ? (
        <div className="sv-prog" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={s.progress} aria-label={s.title}><i style={{ "--w": `${s.progress}%` }} /></div>
      ) : null}
      <footer className="sv-foot">
        {s.meta ? <span className="sv-meta">{s.meta}</span> : <span />}
        {s.reward ? <span className="sv-reward"><Icon name="coin" size={14} /> +{fmt(s.reward)}</span> : null}
        <Link href={s.href} className={`h-btn ${s.state === "action" || s.state === "available" ? "h-btn-primary" : "h-btn-soft"}`} onClick={() => play("tap")}>{s.cta} <Icon name="arrow" size={16} /></Link>
      </footer>
    </article>
  );
}

export default function ServicesPage() {
  const { hub, list, loading } = useServices();
  const [filter, setFilter] = React.useState("all");
  const counts = Object.fromEntries(STATES.map((s) => [s, list.filter((x) => x.state === s).length]));
  const rec = list.find((x) => x.state === "action") || list.find((x) => x.state === "available" && x.reward) || list.find((x) => x.state === "available");
  const shown = filter === "all" ? list : list.filter((x) => x.state === filter);
  const live = list.length - counts.done;
  return (
    <div className="pg pg-services">
      <Hero
        kind="services"
        id="sv-title"
        crumbs={[{ label: t("nav.dashboard"), href: "/member/dashboard" }, { label: t("nav.services") }]}
        eyebrow={t("svc.eyebrow")}
        title={t("svc.title")}
        sub={t("svc.sub", { n: live })}
        status={
          <div className="sv-filters" role="toolbar" aria-label={t("svc.filter")}>
            <button type="button" className={filter === "all" ? "on" : ""} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>{t("svc.all")} <b>{list.length}</b></button>
            {STATES.map((s) => (
              <button key={s} type="button" className={`f-${s} ${filter === s ? "on" : ""}`} aria-pressed={filter === s} onClick={() => { setFilter(s); play("tap"); }} disabled={!counts[s]}>
                <StatusChip state={s} label={t(`svc.st.${s}`)} /> <b>{counts[s]}</b>
              </button>
            ))}
          </div>
        }
        art={
          <div className="sv-flow">
            {STATES.map((s, i) => <span key={s} className={`sv-node f-${s}`} style={{ "--i": i }}><b>{counts[s]}</b></span>)}
            <i className="sv-flow-line" />
          </div>
        }
      />
      {loading ? <LoadingBlock lines={5} h={320} /> : !list.length ? (
        <EmptyState kind="surveys" title={t("svc.empty")} text={t("svc.emptyText")} />
      ) : (
        <>
          {rec && filter === "all" ? (
            <Reveal className="sv-rec">
              <span className="sv-rec-k"><Icon name="target" size={16} /> {t("svc.recommended")}</span>
              <ServiceCard s={rec} i={0} />
            </Reveal>
          ) : null}
          {filter === "all" ? (
            <div className="sv-board" aria-label={t("svc.board")}>
              {STATES.filter((s) => counts[s]).map((s) => (
                <section key={s} className={`sv-lane l-${s}`} aria-labelledby={`lane-${s}`}>
                  <h2 id={`lane-${s}`} className="sv-lane-h"><StatusChip state={s} label={t(`svc.st.${s}`)} /> <span>{counts[s]}</span></h2>
                  <div className="sv-lane-list">
                    {list.filter((x) => x.state === s && x !== rec).map((x, i) => <ServiceCard key={x.key} s={x} i={i} />)}
                    {list.filter((x) => x.state === s && x !== rec).length === 0 ? <p className="sv-lane-empty">{t("svc.aboveRec")}</p> : null}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="sv-list">{shown.map((x, i) => <ServiceCard key={x.key} s={x} i={i} />)}</div>
          )}
          <p className="sv-note"><Icon name="eye" size={15} /> {t("svc.note", { n: hub.tasks ?? 0 })}</p>
        </>
      )}
    </div>
  );
}

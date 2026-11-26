"use client";
// Professional dashboard additions: premium studies matched to the member's industry and seniority, the expertise
// score with the verified expert badge, monthly earnings statements and payout receipts, and insight reports.
import React from "react";
import Link from "next/link";
import Icon from "../icons.jsx";
import { t } from "../strings";
import { LoadingBlock, ErrorState, Reveal, CardBoundary } from "../ui.jsx";
import { fmt } from "../data";
import { E, useEngage, useEngageMutation } from "./data";
import { useRewardsData } from "./rewards.jsx";
import "./engage.css";

const cap = (s) => (s ? String(s).replace(/\b\w/g, (c) => c.toUpperCase()) : "");
const monthLong = (m) => new Date(`${m}-15`).toLocaleDateString(undefined, { month: "long", year: "numeric" });

function Studies() {
  const q = useEngage("pro-studies", "/pro/studies");
  if (q.isLoading) return <LoadingBlock lines={3} h={140} />;
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  // Read the reply defensively: an older API, or a proxy answering for it, can send a body without these fields.
  const facts = q.data?.facts || {};
  const studies = Array.isArray(q.data?.studies) ? q.data.studies : [];
  const missing = facts.missing !== false || (!facts.industry && !facts.seniority);
  return (
    <section className="eg-card eg-pstudies" aria-labelledby="ps2-title">
      <h2 className="h-h3" id="ps2-title"><Icon name="briefcase" size={20} /> {t("pr.studies")}</h2>
      <p className="h-sub">
        {missing ? <>{t("pr.factsMissing")} <Link href="/member/profiles" className="h-link">{t("pr.factsLink")}</Link></>
          : t("pr.matchedOn", { i: cap(facts.industry), s: cap(facts.seniority) })}
      </p>
      {studies.length ? (
        <ul className="eg-plist">
          {studies.map((s) => (
            <li key={s.slug} className={`st-${s.state}`}>
              <div><b>{s.name}</b>{s.summary ? <small>{s.summary}</small> : null}</div>
              <span className="eg-pill">{fmt(s.points)} {t("c.points")}</span>
              <span className="eg-pill muted">{t("pr.loi", { n: s.loi })}</span>
              {s.state === "open" ? <Link href="/member/surveys" className="h-btn h-btn-primary">{t("pr.start")}</Link>
                : <span className={`eg-pill ${s.state === "done" ? "ok" : "muted"}`}>{t(`pr.s.${s.state}`)}</span>}
            </li>
          ))}
        </ul>
      ) : <p className="h-sub">{t("pr.none")}</p>}
    </section>
  );
}

function Expertise() {
  const q = useEngage("pro-expertise", "/pro/expertise");
  const ask = useEngageMutation("post", "/pro/verification");
  const [f, setF] = React.useState({ linkedin: "", workEmail: "", jobTitle: "" });
  const [open, setOpen] = React.useState(false);
  if (q.isLoading) return <LoadingBlock lines={3} h={140} />;
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  const d = q.data || {};
  const parts = Array.isArray(d.parts) ? d.parts : [];
  const v = d.verification;
  const canAsk = !v || v.status === "declined";
  const submit = (e) => { e.preventDefault(); ask.mutate(f, { onSuccess: () => setOpen(false) }); };
  return (
    <section className="eg-card eg-expert" aria-labelledby="ex-title">
      <h2 className="h-h3" id="ex-title"><Icon name="gauge" size={20} /> {t("pr.expertise")}
        {d.badge ? <span className="eg-badge"><Icon name="check" size={14} /> {t("pr.verified")}</span> : null}
      </h2>
      <div className="eg-xscore"><b>{Number(d.score) || 0}</b><small>/ 100</small></div>
      <ul className="eg-xparts">
        {parts.map((p) => (
          <li key={p.key}>
            <span>{t(`pr.p.${p.key}`)}</span>
            <div className="eg-bar sm" aria-hidden="true"><i style={{ "--w": `${(p.points / Math.max(1, p.weight)) * 100}%` }} /></div>
            <b>{p.points}/{p.weight}</b>
          </li>
        ))}
      </ul>
      {v?.status === "requested" ? <p className="h-sub">{t("pr.checking")}</p> : null}
      {v?.status === "declined" ? <p className="h-sub">{t("pr.declined")}{v.note ? ` ${v.note}` : ""}</p> : null}
      {canAsk && !open ? <button type="button" className="h-btn h-btn-soft" onClick={() => setOpen(true)}>{t("pr.ask")}</button> : null}
      {canAsk && open ? (
        <form className="eg-form" onSubmit={submit} noValidate>
          <p className="h-sub">{t("pr.askSub")}</p>
          <label><span>{t("pr.linkedin")}</span><input type="url" inputMode="url" placeholder="https://www.linkedin.com/in/…" value={f.linkedin} onChange={(e) => setF({ ...f, linkedin: e.target.value })} /></label>
          <label><span>{t("pr.workEmail")}</span><input type="email" value={f.workEmail} onChange={(e) => setF({ ...f, workEmail: e.target.value })} /></label>
          <label><span>{t("pr.jobTitle")}</span><input type="text" maxLength={120} value={f.jobTitle} onChange={(e) => setF({ ...f, jobTitle: e.target.value })} /></label>
          {ask.error ? <p className="eg-err" role="alert">{ask.error.message}</p> : null}
          <div className="eg-actions">
            <button type="submit" className="h-btn h-btn-primary" disabled={ask.isPending}>{t("pr.send")}</button>
            <button type="button" className="h-btn h-btn-soft" onClick={() => setOpen(false)}>{t("c.cancel")}</button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function Statements() {
  const q = useEngage("pro-statements", "/pro/statements");
  const rw = useRewardsData();
  if (q.isLoading) return <LoadingBlock lines={3} h={140} />;
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  const rows = Array.isArray(q.data) ? q.data : [];
  const sent = (Array.isArray(rw.data?.redemptions) ? rw.data.redemptions : []).filter((r) => r.status === "fulfilled");
  return (
    <section className="eg-card eg-statements" aria-labelledby="sm-title">
      <h2 className="h-h3" id="sm-title"><Icon name="stack" size={20} /> {t("pr.statements")}</h2>
      {rows.length ? (
        <table className="eg-table">
          <thead><tr><th>{t("pr.month")}</th><th className="n">{t("pr.earned")}</th><th className="n">{t("pr.used")}</th><th /></tr></thead>
          <tbody>
            {rows.slice(0, 12).map((s) => (
              <tr key={s.month}>
                <td>{monthLong(s.month)}</td>
                <td className="n">{fmt(s.earned)}</td>
                <td className="n">{fmt(s.spent)}</td>
                <td><a className="h-link" href={`${E}/pro/statements/${s.month}.html`} target="_blank" rel="noopener">{t("pr.open")}</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p className="h-sub">{t("pr.noStatements")}</p>}
      {sent.length ? (
        <>
          <h3 className="h-h4">{t("pr.receipts")}</h3>
          <ul className="eg-receipts">
            {sent.map((r) => <li key={r.id}><a className="h-link" href={`${E}/pro/receipts/${r.id}.html`} target="_blank" rel="noopener">{r.reference} · {r.item?.title}</a></li>)}
          </ul>
        </>
      ) : null}
    </section>
  );
}

function Insights() {
  const q = useEngage("insights", "/stories?type=insight");
  if (q.isLoading || q.isError || !Array.isArray(q.data) || !q.data.length) return null;
  return (
    <section className="eg-card eg-insights" aria-labelledby="in-title">
      <h2 className="h-h3" id="in-title"><Icon name="chart" size={20} /> {t("pr.insights")}</h2>
      <ul className="eg-story-list">
        {q.data.map((s) => (
          <li key={s.id}>
            <b>{s.title}</b>
            {s.summary ? <span>{s.summary}</span> : null}
            {s.sampleSize ? <small className="h-sub">{t("pr.sample", { n: fmt(s.sampleSize) })}</small> : null}
            {s.fileUrl ? <a className="h-link" href={s.fileUrl} target="_blank" rel="noopener noreferrer">{t("pr.report")}</a> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ProExtras() {
  return (
    <div className="eg-pgrid">
      <Reveal className="eg-pg-studies"><CardBoundary name="pro-studies"><Studies /></CardBoundary></Reveal>
      <Reveal delay={60}><CardBoundary name="pro-expertise"><Expertise /></CardBoundary></Reveal>
      <Reveal delay={80}><CardBoundary name="pro-statements"><Statements /></CardBoundary></Reveal>
      <Reveal delay={100}><CardBoundary name="pro-insights" quiet><Insights /></CardBoundary></Reveal>
    </div>
  );
}

"use client";
// Messages (v2, Nov 2026): one inbox for platform notifications (GET /api/v1/alerts, the old bell's feed) and the
// member's own support conversations (GET /api/v1/support/mine). Two panes on desktop, list → detail on phones.
import React from "react";
import Link from "next/link";
import Icon from "./icons.jsx";
import { t } from "./strings";
import { Hero, LoadingBlock, ErrorState, EmptyState, StatusChip } from "./ui.jsx";
import { useAlerts, NewsletterDialog } from "./Shell.jsx";
import { useMyQueries } from "./help/data";
import { relDay } from "./data";

const ticketState = (s) => (["resolved", "closed"].includes(s) ? "done" : s === "pending" ? "pending" : "progress");

export default function MessagesPage() {
  const alerts = useAlerts();
  const queries = useMyQueries();
  const [tab, setTab] = React.useState("all");
  const [sel, setSel] = React.useState(null);
  const [popup, setPopup] = React.useState(null);
  const items = [
    ...(alerts.data || []).map((a) => ({ kind: "note", id: `n-${a.id}`, title: a.subtitle || a.title, from: a.title || t("msg.platform"), text: a.message, at: a.at, a })),
    ...(queries.data || []).map((q) => ({ kind: "ticket", id: `q-${q.id}`, title: q.subject || t("hp.noSubject"), from: t("msg.support"), text: `#${q.no} · ${t(`hp.status.${q.status}`)}`, at: q.at, q })),
  ].sort((x, y) => (y.at?.getTime() || 0) - (x.at?.getTime() || 0));
  const shown = tab === "all" ? items : items.filter((x) => x.kind === tab);
  const cur = shown.find((x) => x.id === sel) || null;
  const openTickets = (queries.data || []).filter((q) => ticketState(q.status) !== "done").length;
  const loading = alerts.isLoading || queries.isLoading;
  return (
    <div className="pg pg-messages">
      <Hero
        kind="messages"
        id="msg-title"
        crumbs={[{ label: t("nav.dashboard"), href: "/member/dashboard" }, { label: t("nav.messages") }]}
        eyebrow={t("msg.eyebrow")}
        title={t("msg.title")}
        sub={t("msg.sub", { a: alerts.data?.length || 0, b: openTickets })}
        actions={<Link href="/member/help?ask=other" className="h-btn h-btn-primary"><Icon name="send" size={16} /> {t("msg.new")}</Link>}
        art={<div className="msg-art"><span className="env e1" /><span className="env e2" /><span className="env e3" /></div>}
      />
      <div className="msg">
        <div className="msg-list">
          <div className="msg-tabs" role="tablist" aria-label={t("msg.title")}>
            {[["all", "msg.all", items.length], ["note", "msg.notes", alerts.data?.length || 0], ["ticket", "msg.tickets", queries.data?.length || 0]].map(([k, l, n]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => { setTab(k); setSel(null); }}>{t(l)} <b>{n}</b></button>
            ))}
          </div>
          {loading ? <LoadingBlock lines={5} h={260} /> : alerts.isError && queries.isError ? <ErrorState text={t("msg.error")} onRetry={() => { alerts.refetch(); queries.refetch(); }} /> : !shown.length ? (
            <EmptyState kind="activity" title={t("msg.empty")} text={t("msg.emptyText")} action={<Link href="/member/help" className="h-btn h-btn-soft">{t("nav.support")}</Link>} />
          ) : (
            <ul className="msg-rows">
              {shown.map((m) => (
                <li key={m.id}>
                  <button type="button" className={`msg-row mk-${m.kind} ${sel === m.id ? "on" : ""}`} aria-expanded={sel === m.id} onClick={() => setSel(sel === m.id ? null : m.id)}>
                    <span className="msg-av" aria-hidden="true"><Icon name={m.kind === "ticket" ? "help" : "bell"} size={18} /></span>
                    <span className="msg-tx">
                      <b>{m.title}</b>
                      <small>{m.from}{m.text ? ` · ${m.text}` : ""}</small>
                    </span>
                    <time>{relDay(m.at, t)}</time>
                  </button>
                  {sel === m.id ? <div className="msg-inline"><Detail m={m} setPopup={setPopup} /></div> : null}
                </li>
              ))}
            </ul>
          )}
          {alerts.isError && !queries.isError ? <p className="msg-warn" role="status"><Icon name="alert" size={15} /> {t("msg.alertsError")}</p> : null}
        </div>
        <div className="msg-pane" aria-live="polite">
          {cur ? <Detail m={cur} setPopup={setPopup} /> : (
            <div className="msg-pick"><Icon name="inbox" size={40} /><p>{t("msg.pick")}</p></div>
          )}
        </div>
      </div>
      <NewsletterDialog url={popup} onClose={() => setPopup(null)} />
    </div>
  );
}

function Detail({ m, setPopup }) {
  if (m.kind === "ticket") {
    const q = m.q;
    return (
      <article className="msg-detail">
        <p className="msg-d-k">{t("msg.support")} · #{q.no}</p>
        <h2>{m.title}</h2>
        <StatusChip state={ticketState(q.status)} label={t(`hp.status.${q.status}`)} />
        <p className="msg-d-x">{t("msg.ticketText")}</p>
        <Link className="h-btn h-btn-primary" href={`/member/support/open?ticket=${encodeURIComponent(q.id)}`}>{t("msg.openConversation")} <Icon name="arrow" size={16} /></Link>
      </article>
    );
  }
  const a = m.a;
  return (
    <article className="msg-detail">
      <p className="msg-d-k">{m.from}{m.at ? ` · ${m.at.toLocaleString()}` : ""}</p>
      <h2>{m.title}</h2>
      {a.message ? <p className="msg-d-x">{a.message}</p> : null}
      {a.cta ? (a.ctaType === "popup"
        ? <button type="button" className="h-btn h-btn-primary" onClick={() => setPopup(a.cta)}>{t("c.view")} <Icon name="arrow" size={16} /></button>
        : <a className="h-btn h-btn-primary" href={a.cta} target="_blank" rel="noopener noreferrer">{t("c.open")} <Icon name="arrow" size={16} /></a>) : null}
    </article>
  );
}

"use client";
// Activity page additions: balances with pending / on hold, the clearing calendar, the daily streak and the full
// filterable ledger with CSV export.
import React from "react";
import { useMember } from "@/Context";
import Icon from "../icons.jsx";
import { t } from "../strings";
import { Counter, Reveal, LoadingBlock, ErrorState, EmptyState } from "../ui.jsx";
import { fmt, memberTypeOf } from "../data";
import { useSummary, useLedgerPage, ledgerCsvUrl } from "./data";
import "./engage.css";

const day = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "");
const TYPES = ["survey", "profile", "poll", "streak", "referral", "challenge", "bonus", "task", "redemption", "draw"];
const STATES = ["cleared", "pending", "on_hold", "spent"];
const ICON = { survey: "surveys", profile: "profile", poll: "chart", streak: "bolt", referral: "network", challenge: "trophy", bonus: "star", task: "spark", redemption: "wallet", draw: "star" };

/* ---------------- balances strip ---------------- */
export function BalanceStrip() {
  const s = useSummary();
  if (s.isLoading) return <LoadingBlock lines={1} h={90} />;
  if (s.isError) return <ErrorState onRetry={s.refetch} />;
  const b = s.data?.balances;
  if (!b) return null;
  const items = [
    { k: "available", v: b.available, tone: "ok" },
    { k: "pending", v: b.pending, tone: "wait" },
    { k: "onHold", v: b.onHold, tone: "hold" },
    { k: "earned", v: b.earned, tone: "" },
  ];
  return (
    <ul className="eg-bal" aria-label={t("lg.points")}>
      {items.map((i) => (
        <li key={i.k} className={`eg-bal-i ${i.tone}`}>
          <b><Counter value={i.v} /></b>
          <small>{t(`bal.${i.k}`)}</small>
        </li>
      ))}
    </ul>
  );
}

/* ---------------- pending / on hold ---------------- */
export function PendingPanel() {
  const s = useSummary();
  if (s.isLoading) return <LoadingBlock lines={2} h={120} />;
  if (s.isError) return <ErrorState onRetry={s.refetch} />;
  const { clearing = [], onHold = [] } = s.data;
  const none = !clearing.length && !onHold.length;
  return (
    <section className="eg-card eg-pending" aria-labelledby="pd-title">
      <h2 className="h-h3" id="pd-title"><Icon name="clock" size={20} /> {t("pd.title")}</h2>
      <p className="h-sub">{t("pd.sub")}</p>
      {none ? (
        <p className="eg-ok"><Icon name="check" size={18} /> {t("pd.none")}</p>
      ) : (
        <ol className="eg-clear">
          {clearing.map((c) => (
            <li key={c.date}><span className="eg-dot wait" aria-hidden="true" />{t("pd.on", { p: fmt(c.points), d: day(c.date) })}</li>
          ))}
          {onHold.map((h) => (
            <li key={h.id}>
              <span className="eg-dot hold" aria-hidden="true" />
              <span>
                {t("pd.hold", { p: fmt(h.points) })} · {h.name}
                {h.note ? <small> · {h.note}</small> : null}
                {h.clearsAt ? <small> · {t("pd.holdBy", { d: day(h.clearsAt) })}</small> : null}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/* ---------------- streak ---------------- */
export function StreakCard({ compact = false }) {
  const member = useMember();
  const teen = memberTypeOf(member) === "teen";
  const s = useSummary();
  if (s.isLoading) return <LoadingBlock lines={2} h={compact ? 90 : 150} />;
  if (s.isError) return <ErrorState onRetry={s.refetch} />;
  const k = s.data?.streak;
  if (!k) return null; // summary not loaded (query disabled or feature off): show nothing rather than crash
  return (
    <section className={`eg-card eg-streak${compact ? " is-compact" : ""}`} aria-labelledby="sk-title">
      <div className="eg-streak-top">
        <span className={`eg-flame${k.current ? " on" : ""}`} aria-hidden="true"><Icon name="bolt" size={26} /></span>
        <div>
          <h2 className="h-h3" id="sk-title">{t("sk.days", { n: k.current })}</h2>
          <p className="h-sub">{k.todayDone ? t("sk.today") : t("sk.todayNot")} · {t("sk.best", { n: k.best })}</p>
        </div>
      </div>
      {!compact ? (
        <>
          <p className="eg-muted">{t("sk.how")}</p>
          <p className="eg-cap">{t("sk.last28")}</p>
          <ol className="eg-strip" aria-label={t("sk.last28")}>
            {k.strip.map((d) => (
              <li key={d.day} className={d.active ? "on" : ""} title={`${day(d.day)}${d.active ? " ✓" : ""}`}>
                <span className="h-sr">{day(d.day)} {d.active ? t("c.done") : ""}</span>
              </li>
            ))}
          </ol>
        </>
      ) : null}
      {k.next ? (
        <p className="eg-next"><Icon name="star" size={16} /> {t(teen ? "sk.nextTeen" : "sk.next", { n: k.next.daysLeft, d: k.next.days, p: fmt(k.next.points) })}</p>
      ) : null}
    </section>
  );
}

/* ---------------- full ledger ---------------- */
export function LedgerTable() {
  const [f, setF] = React.useState({ type: "", status: "", from: "", to: "", q: "" });
  const [limit, setLimit] = React.useState(50);
  const [q, setQ] = React.useState("");
  React.useEffect(() => { const id = setTimeout(() => setF((x) => ({ ...x, q })), 300); return () => clearTimeout(id); }, [q]);
  const filters = { ...f, limit };
  const L = useLedgerPage(filters);
  const set = (k) => (e) => { setLimit(50); setF((x) => ({ ...x, [k]: e.target.value })); };
  const reset = () => { setQ(""); setF({ type: "", status: "", from: "", to: "", q: "" }); setLimit(50); };
  const { limit: _l, ...exportFilters } = filters;

  let body;
  if (L.isLoading) body = <LoadingBlock lines={5} h={240} />;
  else if (L.isError) body = <ErrorState onRetry={L.refetch} />;
  else if (!L.data.items.length) body = <EmptyState kind="activity" title={t("lg.none")} text="" />;
  else body = (
    <>
      <div className="eg-table-wrap">
        <table className="eg-table">
          <thead><tr><th scope="col">{t("lg.date")}</th><th scope="col">{t("lg.what")}</th><th scope="col">{t("lg.status")}</th><th scope="col" className="num">{t("lg.points")}</th></tr></thead>
          <tbody>
            {L.data.items.map((e) => (
              <tr key={`${e.type}-${e.id}`}>
                <td>{e.at ? e.at.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : ""}</td>
                <td>
                  <span className={`eg-type t-${e.type}`}><Icon name={ICON[e.type] || "coin"} size={15} /> {t(`lt.${e.type}`)}</span>
                  {e.name ? <small className="eg-name">{e.name}</small> : null}
                </td>
                <td>
                  <span className={`eg-state s-${e.status}`}>{t(`ls.${e.status}`)}</span>
                  {e.status === "pending" && e.clearsAt ? <small className="eg-name">{t("lg.clearsOn", { d: day(e.clearsAt) })}</small> : null}
                </td>
                <td className={`num ${e.points < 0 ? "neg" : "pos"}`}>{e.points > 0 ? "+" : ""}{fmt(e.points)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {L.data.total > L.data.items.length ? (
        <button type="button" className="h-btn h-btn-soft eg-more" onClick={() => setLimit((n) => Math.min(500, n + 50))}>{t("lg.more")}</button>
      ) : null}
    </>
  );

  return (
    <section className="eg-card eg-ledger" aria-labelledby="lg-title">
      <div className="eg-ledger-head">
        <div>
          <h2 className="h-h3" id="lg-title"><Icon name="stack" size={20} /> {t("lg.title")}</h2>
          <p className="h-sub">{t("lg.sub")}{L.data ? ` · ${t("lg.count", { n: fmt(L.data.total) })}` : ""}</p>
        </div>
        <a className="h-btn h-btn-primary" href={ledgerCsvUrl(exportFilters)} download><Icon name="arrow" size={16} /> {t("lg.export")}</a>
      </div>
      <form className="eg-filters" onSubmit={(e) => e.preventDefault()} role="search">
        <label><span>{t("lg.type")}</span>
          <select value={f.type} onChange={set("type")}>
            <option value="">{t("lg.allTypes")}</option>
            {TYPES.map((x) => <option key={x} value={x}>{t(`lt.${x}`)}</option>)}
          </select>
        </label>
        <label><span>{t("lg.status")}</span>
          <select value={f.status} onChange={set("status")}>
            <option value="">{t("lg.allStatus")}</option>
            {STATES.map((x) => <option key={x} value={x}>{t(`ls.${x}`)}</option>)}
          </select>
        </label>
        <label><span>{t("lg.from")}</span><input type="date" value={f.from} max={f.to || undefined} onChange={set("from")} /></label>
        <label><span>{t("lg.to")}</span><input type="date" value={f.to} min={f.from || undefined} onChange={set("to")} /></label>
        <label className="grow"><span>{t("lg.search")}</span><input type="search" value={q} placeholder={t("lg.searchPh")} onChange={(e) => setQ(e.target.value)} /></label>
        <button type="button" className="h-btn h-btn-ghost" onClick={reset}>{t("lg.reset")}</button>
      </form>
      {body}
    </section>
  );
}

export function ActivityExtras() {
  return (
    <>
      <Reveal><BalanceStrip /></Reveal>
      <div className="eg-grid2">
        <Reveal><StreakCard /></Reveal>
        <Reveal delay={80}><PendingPanel /></Reveal>
      </div>
      <Reveal><LedgerTable /></Reveal>
    </>
  );
}

"use client";
// v8 section banner: a light card in the public website's look (warm paper, navy type, the member type's gradient
// on the key words) with the section's own animated scene on the right (art.jsx) and an optional row of live stats.
// Used by every section, so the frame is consistent while each scene is different.
import React from "react";
import Link from "next/link";
import Art8 from "./art.jsx";
import { t } from "../strings";

export default function Hero8({ kind, id, crumbs = [], eyebrow, title, accent, sub, status, actions, stats, score, children, className = "" }) {
  return (
    <section className={`h8 h8-${kind} ${className}`} aria-labelledby={id}>
      <div className="h8-bg" aria-hidden="true"><i /><i /><i /></div>
      <div className="h8-main">
        {crumbs.length ? (
          <nav className="h8-crumbs" aria-label={t("c.breadcrumb")}>
            <ol>
              {crumbs.map((c, i) => (
                <li key={i}>{c.href && i < crumbs.length - 1 ? <Link href={c.href}>{c.label}</Link> : <span aria-current={i === crumbs.length - 1 ? "page" : undefined}>{c.label}</span>}</li>
              ))}
            </ol>
          </nav>
        ) : null}
        {eyebrow ? <p className="h8-eyebrow"><i aria-hidden="true" />{eyebrow}</p> : null}
        <h1 className="h8-title" id={id}>{title}{accent ? <> <span className="h8-accent">{accent}</span></> : null}</h1>
        {sub ? <p className="h8-sub">{sub}</p> : null}
        {status ? <div className="h8-status">{status}</div> : null}
        {actions ? <div className="h8-actions">{actions}</div> : null}
        {children}
      </div>
      <div className="h8-art"><Art8 kind={kind} score={score} /></div>
      {stats && stats.length ? (
        <ul className="h8-stats">
          {stats.map((s, i) => (
            <li key={i} style={{ "--i": i }} className={s.tone ? `tone-${s.tone}` : ""}>
              <small>{s.label}</small>
              <b>{s.value}{s.unit ? <em>{s.unit}</em> : null}</b>
              {s.pct != null ? <span className="h8-bar"><i style={{ "--w": `${Math.max(0, Math.min(100, s.pct))}%` }} /></span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

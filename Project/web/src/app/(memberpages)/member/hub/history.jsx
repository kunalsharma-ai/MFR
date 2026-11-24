"use client";
// Survey participation history (v7, Kunal 24 Nov 2026): the history table on the Surveys page, rebuilt in the hub's
// own design for each member type. It keeps every control the old Datatable had:
//   date range (today, yesterday, this/last week, this/last month, this/last year, custom), search by survey name,
//   sort on every column, a status filter, column locking (pinned to the left), rows per page 10/20/50/100, paging.
// Data: the same request as before, POST /api/v1/response with status $nin ["invited"] and the dateRange
// [YYYY-MM-DD, YYYY-MM-DD]. An internal dropout still links to /survey?name=<slug> so the member can resume.
import React from "react";
import Link from "next/link";
import { api } from "@/util";
import { useMember } from "@/Context";
import Icon from "./icons.jsx";
import { t } from "./strings";
import { fmt } from "./data";
import { locale } from "./prefs";

const day = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOf = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
function rangeOf(k) {
  const n = new Date();
  const dow = (n.getDay() + 6) % 7; // weeks start on Monday? the old picker used dayjs default (Sunday)
  const sun = n.getDay();
  switch (k) {
    case "today": return [day(n), endOf(n)];
    case "yesterday": { const y = new Date(n); y.setDate(n.getDate() - 1); return [day(y), endOf(y)]; }
    case "thisWeek": { const s = new Date(n); s.setDate(n.getDate() - sun); return [day(s), endOf(n)]; }
    case "lastWeek": { const s = new Date(n); s.setDate(n.getDate() - sun - 7); const e = new Date(s); e.setDate(s.getDate() + 6); return [day(s), endOf(e)]; }
    case "thisMonth": return [new Date(n.getFullYear(), n.getMonth(), 1), endOf(n)];
    case "lastMonth": return [new Date(n.getFullYear(), n.getMonth() - 1, 1), endOf(new Date(n.getFullYear(), n.getMonth(), 0))];
    case "thisYear": return [new Date(n.getFullYear(), 0, 1), endOf(n)];
    case "lastYear": return [new Date(n.getFullYear() - 1, 0, 1), endOf(new Date(n.getFullYear() - 1, 11, 31))];
    default: void dow; return null;
  }
}
const PRESETS = ["today", "yesterday", "thisWeek", "lastWeek", "thisMonth", "lastMonth", "thisYear", "lastYear"];
const iso = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
const DONE = ["complete", "terminate", "overquota"];
const STATUS = ["complete", "terminate", "overquota", "dropout"];
const ART = { complete: "check", terminate: "cross", overquota: "hourglass", dropout: "clock" };

function loiMs(r) { return DONE.includes(r.status) && r.timeline?.start && r.updatedAt ? Math.max(0, new Date(r.updatedAt) - new Date(r.timeline.start)) : null; }
function fmtLoi(ms) { if (ms == null) return "–"; const m = Math.floor(ms / 60000); const s = Math.round((ms % 60000) / 1000); return m ? t("hs.minSec", { m, s: String(s).padStart(2, "0") }) : t("hs.sec", { s }); }

const COLS = [
  { id: "name", w: 260, lock: true, sort: (r) => String(r.survey?.name || "").toLowerCase() },
  { id: "start", w: 190, lock: true, sort: (r) => new Date(r.timeline?.start || r.updatedAt || 0).getTime() },
  { id: "loi", w: 180, lock: true, sort: (r) => loiMs(r) ?? -1 },
  { id: "status", w: 150, lock: true, sort: (r) => STATUS.indexOf(r.status) },
  { id: "rewards", w: 130, lock: false, sort: (r) => (r.status === "complete" ? Number(r.points) || 0 : 0) },
  { id: "feedback", w: 130, lock: false, sort: (r) => Number(r.rating) || 0 },
];

function Stars({ value }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  if (!v) return <span className="shx-muted">–</span>;
  return (
    <span className="shx-stars" role="img" aria-label={t("hs.stars", { n: v })}>
      {[1, 2, 3, 4, 5].map((k) => <i key={k} className={v >= k ? "on" : v >= k - 0.5 ? "half" : ""}>★</i>)}
    </span>
  );
}

export default function SurveyHistory7({ type = "consumer" }) {
  const user = useMember();
  const [preset, setPreset] = React.useState("thisMonth");
  const [custom, setCustom] = React.useState(() => { const r = rangeOf("thisMonth"); return [iso(r[0]), iso(r[1])]; });
  const [open, setOpen] = React.useState(false);
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [sort, setSort] = React.useState({ id: "start", dir: -1 });
  const [locked, setLocked] = React.useState(["name"]);
  const [per, setPer] = React.useState(20);
  const [page, setPage] = React.useState(0);
  const [reload, setReload] = React.useState(0);
  const pop = React.useRef(null);

  const range = preset === "custom" ? custom : (() => { const r = rangeOf(preset); return [iso(r[0]), iso(r[1])]; })();
  const rangeKey = range.join("|");

  React.useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    setLoading(true); setError(false);
    api.post("/api/v1/response", { status: { $nin: ["invited"] }, dateRange: range })
      .then((r) => { if (!alive) return; if (!r || r.status === "error") { setError(true); setRows([]); } else setRows((Array.isArray(r.data) ? r.data : []).filter((x) => x.status !== "invited")); })
      .catch(() => alive && (setError(true), setRows([])))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [user, rangeKey, reload]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!open) return undefined;
    const off = (e) => { if (pop.current && !pop.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", off); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", off); document.removeEventListener("keydown", esc); };
  }, [open]);

  const counts = Object.fromEntries(STATUS.map((s) => [s, rows.filter((r) => r.status === s).length]));
  const needle = q.trim().toLowerCase();
  const list = rows
    .filter((r) => status === "all" || r.status === status)
    .filter((r) => !needle || String(r.survey?.name || "").toLowerCase().includes(needle));
  const col = COLS.find((c) => c.id === sort.id) || COLS[1];
  const sorted = [...list].sort((a, b) => { const x = col.sort(a), y = col.sort(b); return (x > y ? 1 : x < y ? -1 : 0) * sort.dir; });
  const pages = Math.max(1, Math.ceil(sorted.length / per));
  const pg = Math.min(page, pages - 1);
  const shown = sorted.slice(pg * per, pg * per + per);
  React.useEffect(() => { setPage(0); }, [q, status, per, rangeKey]);

  const earned = rows.filter((r) => r.status === "complete").reduce((n, r) => n + (Number(r.points) || 0), 0);
  const lois = rows.map(loiMs).filter((x) => x != null);
  const avg = lois.length ? lois.reduce((n, x) => n + x, 0) / lois.length : null;
  const rate = rows.length ? Math.round((counts.complete / rows.length) * 100) : null;
  const unit = type === "teen" ? t("hdr.xp") : t("c.pts");

  // locked columns first, in the order they were locked; their left offsets make them stick while the rest scroll
  const cols = [...COLS.filter((c) => locked.includes(c.id)).sort((a, b) => locked.indexOf(a.id) - locked.indexOf(b.id)), ...COLS.filter((c) => !locked.includes(c.id))];
  let left = 0;
  const lefts = {};
  cols.forEach((c) => { if (locked.includes(c.id)) { lefts[c.id] = left; left += c.w; } });
  const toggleLock = (id) => setLocked((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  const toggleSort = (id) => setSort((s) => (s.id === id ? { id, dir: -s.dir } : { id, dir: id === "name" ? 1 : -1 }));
  const fmtDate = (d) => new Date(d).toLocaleDateString(locale(), { day: "numeric", month: "short", year: "numeric" });
  const fmtStart = (d) => new Date(d).toLocaleString(locale(), { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
  const rangeLabel = preset === "custom" ? `${fmtDate(custom[0])} – ${fmtDate(custom[1])}` : t(`hs.p.${preset}`);
  const rangeText = preset === "custom" ? rangeLabel : rangeLabel.toLowerCase();
  const filtered = status !== "all" || needle;

  const cell = (c, r) => {
    switch (c.id) {
      case "name": return <span className="shx-name"><i className={`shx-dot s-${r.status}`} aria-hidden="true" /><b title={r.survey?.name}>{r.survey?.name || "–"}</b></span>;
      case "start": return DONE.includes(r.status) && r.timeline?.start ? <span className="shx-muted">{fmtStart(r.timeline.start)}</span> : <span className="shx-muted">–</span>;
      case "loi": return <span className="shx-muted shx-num">{fmtLoi(loiMs(r))}</span>;
      case "status":
        if (r.source === "internal" && r.status === "dropout" && r.survey?.slug) return <Link href={`/survey?name=${encodeURIComponent(r.survey.slug)}`} className="shx-badge s-resume"><Icon name="play" size={12} /> {t("hs.resume")}</Link>;
        return <span className={`shx-badge s-${r.status}`}><img src={`/ps/images/emoji/${ART[r.status] || "question"}.webp`} alt="" width="14" height="14" />{t(`hs.s.${r.status}`) === `hs.s.${r.status}` ? r.status : t(`hs.s.${r.status}`)}</span>;
      case "rewards": return r.status === "complete" ? <span className="shx-pts"><i className="tc-coin" aria-hidden="true" />+{fmt(r.points || 0)} <em>{unit}</em></span> : <span className="shx-muted">–</span>;
      case "feedback": return <Stars value={r.rating} />;
      default: return null;
    }
  };

  return (
    <section className={`shx shx-${type}`} aria-labelledby="shx-t">
      <header className="shx-head">
        <span className="shx-head-art" aria-hidden="true"><img src="/ps/images/emoji/calendar.webp" alt="" width="36" height="36" /></span>
        <div>
          <h2 id="shx-t" className="h7-title">{t("hs.title")}</h2>
          <p className="h7-sub">{loading ? t("c.loading") : t(rows.length === 1 ? "hs.subOne" : "hs.sub", { n: fmt(rows.length), r: rangeText })}</p>
        </div>
      </header>

      <ul className="shx-kpis" aria-label={t("hs.kpis")}>
        <li className="k1"><small>{t("hs.k.taken")}</small><b>{loading ? "…" : fmt(rows.length)}</b></li>
        <li className="k2"><small>{t("hs.k.done")}</small><b>{loading ? "…" : fmt(counts.complete)}</b>{rate != null ? <em>{t("hs.k.rate", { n: rate })}</em> : null}</li>
        <li className="k3"><small>{t("hs.k.earned")}</small><b>{loading ? "…" : `+${fmt(earned)}`}</b><em>{unit}</em></li>
        <li className="k4"><small>{t("hs.k.avg")}</small><b>{loading ? "…" : fmtLoi(avg)}</b></li>
      </ul>

      <div className="shx-tools">
        <div className="shx-range" ref={pop}>
          <button type="button" className="shx-range-btn" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <Icon name="calendar" size={15} /> <span>{rangeLabel}</span> <small>{fmtDate(range[0])} – {fmtDate(range[1])}</small> <Icon name="chevron" size={14} className="shx-caret" />
          </button>
          {open ? (
            <div className="shx-pop" role="dialog" aria-label={t("hs.rangeLabel")}>
              <div className="shx-presets">
                {PRESETS.map((p) => <button key={p} type="button" className={preset === p ? "on" : ""} onClick={() => { setPreset(p); setOpen(false); }}>{t(`hs.p.${p}`)}</button>)}
                <button type="button" className={preset === "custom" ? "on" : ""} onClick={() => setPreset("custom")}>{t("hs.p.custom")}</button>
              </div>
              {preset === "custom" ? (
                <div className="shx-custom">
                  <label><small>{t("hs.from")}</small><input type="date" value={custom[0]} max={custom[1]} onChange={(e) => e.target.value && setCustom([e.target.value, custom[1]])} /></label>
                  <label><small>{t("hs.to")}</small><input type="date" value={custom[1]} min={custom[0]} onChange={(e) => e.target.value && setCustom([custom[0], e.target.value])} /></label>
                  <button type="button" className="h-btn h-btn-primary" onClick={() => setOpen(false)}>{t("hs.apply")}</button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <label className="tc-search shx-search"><Icon name="search" size={15} /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("hs.search")} aria-label={t("hs.search")} /></label>
        <div className="shx-status" role="tablist" aria-label={t("hs.statusLabel")}>
          <button type="button" role="tab" aria-selected={status === "all"} className={status === "all" ? "on" : ""} onClick={() => setStatus("all")}>{t("hs.all")} <span>{rows.length}</span></button>
          {STATUS.map((s) => (
            <button key={s} type="button" role="tab" aria-selected={status === s} className={`st-${s} ${status === s ? "on" : ""}`} onClick={() => setStatus(s)}><i className={`shx-dot s-${s}`} aria-hidden="true" />{t(`hs.s.${s}`)} <span>{counts[s]}</span></button>
          ))}
        </div>
      </div>

      <div className="shx-wrap">
        <table className="shx-table" style={{ "--lockw": `${left}px` }}>
          <colgroup>{cols.map((c) => <col key={c.id} style={{ width: c.w }} />)}</colgroup>
          <thead>
            <tr>
              {cols.map((c) => {
                const isL = locked.includes(c.id);
                return (
                  <th key={c.id} scope="col" className={`${isL ? "is-lock" : ""} ${sort.id === c.id ? "is-sort" : ""}`} style={isL ? { left: lefts[c.id] } : undefined} aria-sort={sort.id === c.id ? (sort.dir > 0 ? "ascending" : "descending") : "none"}>
                    <span className="shx-th">
                      <button type="button" className="shx-sort" onClick={() => toggleSort(c.id)}>{t(`hs.c.${c.id}`)}<i className={`shx-arrow ${sort.id === c.id ? (sort.dir > 0 ? "up" : "down") : ""}`} aria-hidden="true" /></button>
                      {c.lock ? <button type="button" className={`shx-lock ${isL ? "on" : ""}`} onClick={() => toggleLock(c.id)} aria-pressed={isL} aria-label={t(isL ? "hs.unlockCol" : "hs.lockCol", { c: t(`hs.c.${c.id}`) })} title={t(isL ? "hs.unlockCol" : "hs.lockCol", { c: t(`hs.c.${c.id}`) })}><Icon name="lock" size={12} /></button> : null}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, k) => (
              <tr key={k} className="shx-skel">{cols.map((c) => <td key={c.id} className={locked.includes(c.id) ? "is-lock" : ""} style={locked.includes(c.id) ? { left: lefts[c.id] } : undefined}><i /></td>)}</tr>
            )) : shown.map((r, i) => (
              <tr key={r._id || i} style={{ "--i": i }}>
                {cols.map((c) => <td key={c.id} data-label={t(`hs.c.${c.id}`)} className={`c-${c.id} ${locked.includes(c.id) ? "is-lock" : ""}`} style={locked.includes(c.id) ? { left: lefts[c.id] } : undefined}>{cell(c, r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !shown.length ? (
          <div className="shx-empty">
            <span className="shx-empty-art" aria-hidden="true"><img src={`/ps/images/emoji/${error ? "question" : filtered ? "research" : "calendar"}.webp`} alt="" width="84" height="84" /><i /><i /><i /></span>
            <b>{error ? t("hs.e.errorT") : filtered ? t("hs.e.filterT") : t("hs.e.noneT")}</b>
            <p>{error ? t("hs.e.error") : filtered ? t("hs.e.filter") : t("hs.e.none", { r: rangeText })}</p>
            <div className="shx-empty-cta">
              {error ? <button type="button" className="h-btn h-btn-primary" onClick={() => setReload((x) => x + 1)}><Icon name="refresh" size={15} /> {t("hs.retry")}</button>
                : filtered ? <button type="button" className="h-btn h-btn-primary" onClick={() => { setQ(""); setStatus("all"); }}>{t("hs.clear")}</button>
                  : <>
                    {preset !== "thisYear" ? <button type="button" className="h-btn h-btn-ghost" onClick={() => setPreset("thisYear")}><Icon name="calendar" size={15} /> {t("hs.wider")}</button> : null}
                    <a href="#sx-list-t" className="h-btn h-btn-primary">{t("hs.findSurvey")} <Icon name="arrow" size={15} /></a>
                  </>}
            </div>
          </div>
        ) : null}
      </div>

      <footer className="shx-foot">
        <label className="shx-per"><span>{t("hs.perPage")}</span>
          <select value={per} onChange={(e) => setPer(Number(e.target.value))}>{[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}</select>
        </label>
        <span className="shx-showing">{sorted.length ? t("hs.showing", { a: pg * per + 1, b: Math.min(sorted.length, pg * per + per), n: sorted.length }) : t("hs.showingNone")}</span>
        <nav className="shx-pager" aria-label={t("hs.pages")}>
          <button type="button" onClick={() => setPage(0)} disabled={pg === 0} aria-label={t("hs.first")}>«</button>
          <button type="button" onClick={() => setPage(pg - 1)} disabled={pg === 0} aria-label={t("hs.prev")}>‹</button>
          {Array.from({ length: pages }).map((_, k) => k).filter((k) => k === 0 || k === pages - 1 || Math.abs(k - pg) <= 1).map((k, i, a) => (
            <React.Fragment key={k}>
              {i && k - a[i - 1] > 1 ? <span className="shx-gap">…</span> : null}
              <button type="button" className={k === pg ? "on" : ""} aria-current={k === pg ? "page" : undefined} onClick={() => setPage(k)}>{k + 1}</button>
            </React.Fragment>
          ))}
          <button type="button" onClick={() => setPage(pg + 1)} disabled={pg >= pages - 1} aria-label={t("hs.next")}>›</button>
          <button type="button" onClick={() => setPage(pages - 1)} disabled={pg >= pages - 1} aria-label={t("hs.last")}>»</button>
        </nav>
      </footer>
    </section>
  );
}

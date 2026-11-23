"use client";
// Teen dashboard additions: level, badges and the season track (points and badges only, never money), creative tasks
// (design votes, polls, idea contests) and a button that emails the parent or guardian a read-only view.
import React from "react";
import Icon from "../icons.jsx";
import { t } from "../strings";
import { LoadingBlock, ErrorState, Reveal } from "../ui.jsx";
import { fmt } from "../data";
import { useEngage, useEngageMutation } from "./data";
import { play } from "../sound";
import "./engage.css";

const day = (d) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" });

function Level({ p }) {
  const l = p.level;
  return (
    <section className="eg-card eg-level" aria-labelledby="lv-title">
      <p className="h-eyebrow"><Icon name="rocket" size={16} /> {t("tn.level")}</p>
      <h2 className="h-h3" id="lv-title"><span className="eg-lvl">{l.level}</span> {l.name}</h2>
      <div className="eg-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={l.pct} aria-label={t("tn.level")}><i style={{ "--w": `${l.pct}%` }} /></div>
      <p className="h-sub">{l.next ? t("tn.next", { n: fmt(l.next.left), name: l.next.name }) : t("tn.top")}</p>
    </section>
  );
}

function Badges({ p }) {
  return (
    <section className="eg-card eg-badges" aria-labelledby="bd-title">
      <p className="h-eyebrow"><Icon name="star" size={16} /> {t("tn.badges")}</p>
      <h2 className="h-h3" id="bd-title">{t("tn.badgesCount", { n: p.badges.filter((b) => b.earned).length, of: p.badges.length })}</h2>
      <ul className="eg-bgrid">
        {p.badges.map((b) => (
          <li key={b.key} className={b.earned ? "is-on" : ""} title={t(`tb.${b.key}`)}>
            <span className="eg-bico" aria-hidden="true"><Icon name={b.earned ? "trophy" : "lock"} size={18} /></span>
            <b>{t(`tb.${b.key}`)}</b>
            {!b.earned ? <small>{b.progress}/{b.target}</small> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Season({ s }) {
  if (!s) return null;
  const top = s.stages[s.stages.length - 1]?.points || 1;
  return (
    <section className="eg-card eg-season" aria-labelledby="sn-title">
      <p className="h-eyebrow"><Icon name="calendar" size={16} /> {t("tn.season")}</p>
      <h2 className="h-h3" id="sn-title">{s.title}</h2>
      {!s.started ? <p className="h-sub">{t("tn.seasonSoon", { d: day(`${s.starts}T12:00:00Z`) })}</p> : (
        <>
          <div className="eg-rtrack">
            <div className="eg-bar" role="progressbar" aria-valuemin={0} aria-valuemax={top} aria-valuenow={s.points} aria-label={s.title}><i style={{ "--w": `${Math.min(100, (s.points / top) * 100)}%` }} /></div>
            <ol>{s.stages.map((x) => <li key={x.stage} className={x.reached ? "is-reached" : ""} style={{ "--at": `${(x.points / top) * 100}%` }}><b>{x.stage}</b><small>{fmt(x.points)}</small></li>)}</ol>
          </div>
          <p className="h-sub">{t("tn.seasonPts", { n: fmt(s.points), d: day(`${s.ends}T12:00:00Z`) })}</p>
        </>
      )}
    </section>
  );
}

function TaskCard({ task }) {
  const m = useEngageMutation("post", () => `/teen/tasks/${task.id}`);
  const [text, setText] = React.useState("");
  const res = m.data?.results || task.results;
  const done = task.done || m.isSuccess;
  return (
    <li className="eg-task">
      <span className="eg-pill">{t(`tk.${task.kind}`)}{task.points ? ` · +${task.points}` : ""}</span>
      <b>{task.title}</b>
      {task.question ? <p>{task.question}</p> : null}
      {task.kind === "idea" ? (
        done ? <p className="h-sub">{(m.data?.status || task.status) === "approved" ? t("tk.ideaOk") : t("tk.ideaWait")}</p> : (
          <form onSubmit={(e) => { e.preventDefault(); m.mutate({ text }, { onSuccess: () => play("complete") }); }} className="eg-form">
            <textarea rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} aria-label={task.title} placeholder={t("tk.ideaPh")} />
            <button type="submit" className="h-btn h-btn-primary" disabled={m.isPending || text.trim().length < 10}>{t("tk.send")}</button>
          </form>
        )
      ) : done && res ? (
        <ul className="eg-poll-res">
          {task.options.map((o) => {
            const pct = res.options.find((x) => x.key === o.key)?.pct || 0;
            return <li key={o.key} className={o.key === (task.choice || m.variables?.choice) ? "is-mine" : ""}><span>{o.image ? <img src={o.image} alt="" className="eg-opt-img" /> : null}{o.label}</span><b>{pct}%</b><i style={{ "--w": `${pct}%` }} aria-hidden="true" /></li>;
          })}
        </ul>
      ) : (
        <div className="eg-poll-opts">
          {task.options.map((o) => (
            <button key={o.key} type="button" className="h-btn h-btn-soft" disabled={m.isPending} onClick={() => m.mutate({ choice: o.key }, { onSuccess: () => play("complete") })}>
              {o.image ? <img src={o.image} alt="" className="eg-opt-img" /> : null}{o.label}
            </button>
          ))}
        </div>
      )}
      {task.kind === "idea" && task.ideas?.length ? (
        <details><summary>{t("tk.others", { n: task.ideas.length })}</summary><ul className="eg-ideas">{task.ideas.map((x, i) => <li key={i}>{x}</li>)}</ul></details>
      ) : null}
      {task.endsAt ? <small className="h-sub">{t("tk.until", { d: day(task.endsAt) })}</small> : null}
      {m.error ? <p className="eg-err" role="alert">{m.error.message}</p> : null}
    </li>
  );
}

function Tasks() {
  const q = useEngage("teen-tasks", "/teen/tasks");
  if (q.isLoading) return <LoadingBlock lines={2} h={120} />;
  if (q.isError || !q.data?.length) return null;
  return (
    <section className="eg-card eg-tasks" aria-labelledby="tk-title">
      <p className="h-eyebrow"><Icon name="spark" size={16} /> {t("tk.eyebrow")}</p>
      <h2 className="h-h3" id="tk-title">{t("tk.title")}</h2>
      <ul className="eg-task-list">{q.data.map((x) => <TaskCard key={x.id} task={x} />)}</ul>
    </section>
  );
}

export function GuardianViewButton() {
  const m = useEngageMutation("post", "/teen/guardian-view");
  return (
    <div className="eg-gview">
      <button type="button" className="h-btn h-btn-soft" disabled={m.isPending || m.isSuccess} onClick={() => m.mutate({})}>
        <Icon name="shield" size={18} /> {t("tn.gview")}
      </button>
      {m.isSuccess ? <p className="h-sub" role="status">{t("tn.gviewSent", { to: m.data.to })}</p> : null}
      {m.error ? <p className="eg-err" role="alert">{m.error.message}</p> : null}
    </div>
  );
}

export default function TeenExtras() {
  const q = useEngage("teen-progress", "/teen/progress");
  if (q.isLoading) return <LoadingBlock lines={2} h={140} />;
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  const p = q.data;
  return (
    <div className="eg-tgrid">
      <Reveal><Level p={p} /></Reveal>
      <Reveal delay={60}><Season s={p.season} /></Reveal>
      <Reveal className="eg-tg-wide" delay={80}><Badges p={p} /></Reveal>
      <Reveal className="eg-tg-wide" delay={100}><Tasks /></Reveal>
      <Reveal className="eg-tg-wide" delay={120}><GuardianViewButton /></Reveal>
    </div>
  );
}

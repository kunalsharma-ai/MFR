"use client";
// Dashboard "Today" strip: the daily poll, this month's challenges, the prize draw (only when it's switched on and
// open to the member, never for Teens) and the latest "Your opinion mattered" story. Every figure is the server's.
import React from "react";
import Icon from "../icons.jsx";
import { t } from "../strings";
import { LoadingBlock, ErrorState } from "../ui.jsx";
import { fmt } from "../data";
import { useEngage, useEngageMutation } from "./data";
import { play } from "../sound";
import "./engage.css";

const when = (d) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" });
export const useToday = () => useEngage("today", "/today");

function Poll({ poll }) {
  const m = useEngageMutation("post", (b) => `/poll/${poll.id}`);
  const [picked, setPicked] = React.useState(null);
  const shown = m.data || poll;
  const answer = (key) => {
    setPicked(key);
    m.mutate({ choice: key }, { onSuccess: () => play("complete") });
  };
  const err = m.error?.code === "already" ? t("pl.already") : m.error?.code === "expired" ? t("pl.expired") : m.error ? t("pl.error") : "";
  return (
    <section className="eg-card eg-poll" aria-labelledby="pl-title">
      <p className="h-eyebrow"><Icon name="spark" size={16} /> {t("pl.title")}</p>
      <h2 className="h-h3" id="pl-title">{shown.question}</h2>
      {shown.answered && shown.results ? (
        <>
          <ul className="eg-poll-res" aria-label={t("pl.results")}>
            {shown.results.options.map((o) => (
              <li key={o.key} className={o.key === shown.choice ? "is-mine" : ""}>
                <span>{o.label}{o.key === shown.choice ? <Icon name="check" size={14} /> : null}</span>
                <b>{o.pct}%</b>
                <i style={{ "--w": `${o.pct}%` }} aria-hidden="true" />
              </li>
            ))}
          </ul>
          <p className="h-sub">{t("pl.thanks", { n: fmt(shown.results.total) })}</p>
        </>
      ) : (
        <>
          <div className="eg-poll-opts" role="group" aria-labelledby="pl-title">
            {shown.options.map((o) => (
              <button key={o.key} type="button" className="h-btn h-btn-soft" disabled={m.isPending} aria-pressed={picked === o.key} onClick={() => answer(o.key)}>
                {o.label}
              </button>
            ))}
          </div>
          <p className="h-sub">{shown.points > 0 ? t("pl.earn", { n: shown.points }) : t("pl.streak")}</p>
        </>
      )}
      {err ? <p className="eg-err" role="alert">{err}</p> : null}
    </section>
  );
}

function Challenges({ ch }) {
  if (!ch?.items?.length) return null;
  const pays = ch.items.some((x) => x.pays);
  return (
    <section className="eg-card eg-ch" aria-labelledby="ch-title">
      <p className="h-eyebrow"><Icon name="trophy" size={16} /> {t("ch.title")}</p>
      <h2 className="h-h3" id="ch-title">{t("ch.month", { m: new Date(`${ch.month}-15`).toLocaleDateString(undefined, { month: "long" }) })}</h2>
      <ul className="eg-ch-list">
        {ch.items.map((x) => {
          const pct = Math.round((x.progress / x.target) * 100);
          return (
            <li key={x.key} className={x.done ? "is-done" : ""}>
              <div className="eg-ch-top">
                <span>{x.title}</span>
                {x.paid ? <span className="eg-pill ok">{t("ch.paid", { n: fmt(x.points) })}</span>
                  : <span className="eg-pill muted">{x.progress}/{x.target}{x.pays ? ` · +${fmt(x.points)}` : ""}</span>}
              </div>
              <div className="eg-bar sm" role="progressbar" aria-valuemin={0} aria-valuemax={x.target} aria-valuenow={x.progress} aria-label={x.title}><i style={{ "--w": `${pct}%` }} /></div>
            </li>
          );
        })}
      </ul>
      {!pays ? <p className="h-sub">{t("ch.soon", { m: new Date(`${ch.bonusesFrom}-15`).toLocaleDateString(undefined, { month: "long", year: "numeric" }) })}</p> : null}
    </section>
  );
}

function Draw({ draw }) {
  const m = useEngageMutation("post", () => `/draws/${draw.id}/enter`);
  const left = draw.maxTickets - draw.myTickets;
  return (
    <section className="eg-card eg-draw" aria-labelledby="dr-title">
      <p className="h-eyebrow"><Icon name="star" size={16} /> {t("dr.title")}</p>
      <h2 className="h-h3" id="dr-title">{draw.title}</h2>
      <p>{draw.prize}</p>
      <p className="h-sub">{t("dr.cost", { n: fmt(draw.ticketPoints), d: when(draw.closesAt) })}</p>
      <p className="eg-goal-meta"><b>{t("dr.mine", { n: draw.myTickets, max: draw.maxTickets })}</b></p>
      <div className="eg-actions">
        <button type="button" className="h-btn h-btn-primary" disabled={left < 1 || m.isPending} onClick={() => m.mutate({ tickets: 1 }, { onSuccess: () => play("reward") })}>
          {t("dr.enter", { n: fmt(draw.ticketPoints) })}
        </button>
        {draw.rulesUrl ? <a className="h-link" href={draw.rulesUrl} target="_blank" rel="noopener noreferrer">{t("dr.rules")}</a> : null}
      </div>
      {m.error ? <p className="eg-err" role="alert">{m.error.code === "balance" ? t("dr.balance") : m.error.code === "limit" ? t("dr.limit") : t("pl.error")}</p> : null}
    </section>
  );
}

function StoryCard({ story }) {
  const [open, setOpen] = React.useState(false);
  const all = useEngage("stories", "/stories", { enabled: open });
  if (!story) return null;
  return (
    <section className="eg-card eg-story" aria-labelledby="st-title">
      <p className="h-eyebrow"><Icon name="heart" size={16} /> {t("st.title")}</p>
      {story.image ? <img src={story.image} alt="" loading="lazy" className="eg-story-img" /> : null}
      <h2 className="h-h3" id="st-title">{story.title}</h2>
      {story.summary ? <p>{story.summary}</p> : null}
      {story.stats?.length ? (
        <dl className="eg-story-stats">
          {story.stats.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}
        </dl>
      ) : null}
      <button type="button" className="h-link" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? t("st.less") : t("st.more")} <Icon name="chevron" size={14} />
      </button>
      {open ? (
        all.isLoading ? <LoadingBlock lines={2} h={60} /> : (
          <ul className="eg-story-list">
            {(all.data || []).map((s) => (
              <li key={s.id}>
                <b>{s.title}</b>
                {s.summary ? <span>{s.summary}</span> : null}
                {s.body ? <details><summary>{t("st.read")}</summary><p>{s.body}</p></details> : null}
              </li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  );
}

export default function TodayStrip() {
  const q = useToday();
  if (q.isLoading) return <LoadingBlock lines={2} h={120} />;
  if (q.isError) return <ErrorState text={t("pl.loadError")} onRetry={() => q.refetch()} />;
  const d = q.data || {};
  if (!d.poll && !d.challenges?.items?.length && !d.draw && !d.story) return null;
  return (
    <div className="eg-today" aria-label={t("td.title")}>
      {d.poll ? <Poll poll={d.poll} /> : null}
      <Challenges ch={d.challenges} />
      {d.draw ? <Draw draw={d.draw} /> : null}
      <StoryCard story={d.story} />
    </div>
  );
}

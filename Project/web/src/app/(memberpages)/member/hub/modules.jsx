"use client";
// Shared hub modules. Each one has its own composition (journey path, opportunity board, badge shelf, timeline…)
// and reads only real data through ./data.js.
import React from "react";
import Link from "next/link";
import Icon from "./icons.jsx";
import { t } from "./strings";
import { Counter, Ring, Meter, EmptyState, ErrorState, LoadingBlock, Skeleton } from "./ui.jsx";
import { fmt, relDay, achievementsOf } from "./data";

/* ---------------- Profile journey: a path of stepping stones, one per core profile ---------------- */
export function ProfileJourney({ profiles, variant = "path" }) {
  const { data, isLoading, isError, refetch } = profiles;
  if (isLoading) return <section className="m-journey"><LoadingBlock lines={3} h={220} /></section>;
  if (isError) return <section className="m-journey"><ErrorState onRetry={refetch} /></section>;
  const core = data?.core || [];
  if (!data?.list?.length) {
    return (
      <section className="m-journey">
        <EmptyState
          kind="profile"
          title={t("pj.empty")}
          text={t("pj.emptyHint")}
          action={<Link href="/member/profiles" className="h-btn h-btn-primary">{t("pj.cta")} <Icon name="arrow" size={18} /></Link>}
        />
      </section>
    );
  }
  const allCore = core.length > 0 && data.coreDone === core.length;
  const next = data.next;
  return (
    <section className={`m-journey v-${variant}`} aria-labelledby="pj-title">
      <div className="m-journey-top">
        <div>
          <p className="h-eyebrow">{t("pj.title")}</p>
          <h2 className="h-h2" id="pj-title">{allCore ? t("pj.allDone") : t("pj.sub")}</h2>
        </div>
        <Ring pct={data.coreAvg} size={92} stroke={9} className="m-journey-ring" label={`${data.coreAvg}% ${t("pj.complete")}`}>
          <b><Counter value={data.coreAvg} />%</b>
          <small>{t("pj.complete")}</small>
        </Ring>
      </div>
      <ol className="m-path" aria-label={t("pj.ofCore", { n: data.coreDone, m: core.length })}>
        {core.map((p, i) => {
          const st = p.status >= 100 ? "done" : next && p.slug === next.slug ? "now" : "todo";
          return (
            <li key={p.slug} className={`m-stone is-${st}`} style={{ "--i": i }}>
              <Link href={`/member/profiles?profile=${encodeURIComponent(p.slug)}`} className="m-stone-btn">
                <span className="m-stone-orb">
                  {st === "done" ? <Icon name="check" size={20} /> : <span className="m-stone-n">{i + 1}</span>}
                  <svg viewBox="0 0 44 44" className="m-stone-arc" aria-hidden="true">
                    <circle cx="22" cy="22" r="20" pathLength="100" style={{ strokeDasharray: `${p.status} 100` }} />
                  </svg>
                </span>
                <span className="m-stone-tx">
                  <b>{p.name}</b>
                  <small>{p.status}%</small>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <div className="m-journey-foot">
        <div className="m-why">
          <Icon name="spark" size={18} />
          <p>
            <b>{t("pj.why")}.</b> {t("pj.whyText")}
          </p>
        </div>
        <Link href={next ? `/member/profiles?profile=${encodeURIComponent(next.slug)}` : "/member/profiles"} className="h-btn h-btn-primary">
          {next ? (
            <>
              {t("pj.next")}: {next.name} <Icon name="arrow" size={18} />
            </>
          ) : (
            <>
              {t("pj.ctaDone")} <Icon name="arrow" size={18} />
            </>
          )}
        </Link>
      </div>
    </section>
  );
}

/* ---------------- Opportunity center: two source "doors" with category chips ---------------- */
export function OpportunityCenter({ opps, variant = "board" }) {
  const { data, isLoading, isError, refetch } = opps;
  const sources = [
    { key: "internal", title: t("op.yours"), hint: t("op.yoursHint"), icon: "spark" },
    { key: "external", title: t("op.partner"), hint: t("op.partnerHint"), icon: "network" },
  ];
  const total = data ? data.internal.all + data.external.all : 0;
  return (
    <section className={`m-opps v-${variant}`} aria-labelledby="op-title">
      <div className="m-opps-head">
        <span className="m-opps-badge" aria-hidden="true">
          <Icon name="surveys" size={22} />
          {total ? <i className="m-ping" /> : null}
        </span>
        <div>
          <p className="h-eyebrow">{t("op.title")}</p>
          <h2 className="h-h2" id="op-title">{t("op.sub")}</h2>
        </div>
        {data ? <span className="m-opps-count"><Counter value={total} /></span> : null}
      </div>
      {isLoading ? (
        <div className="m-opps-grid">
          <Skeleton h={150} r={22} />
          <Skeleton h={150} r={22} />
        </div>
      ) : isError ? (
        <ErrorState text={t("op.errorText")} onRetry={refetch} />
      ) : total === 0 ? (
        <EmptyState
          kind="surveys"
          title={t("op.emptyTitle")}
          text={t("op.emptyText")}
          action={<Link href="/member/profiles" className="h-btn h-btn-soft">{t("op.emptyCta")}</Link>}
        />
      ) : (
        <div className="m-opps-grid">
          {sources.map((s, i) => {
            const d = data[s.key];
            const base = `/member/surveys?source=${s.key}`;
            return (
              <article key={s.key} className={`m-door d-${s.key} ${d.all ? "" : "is-quiet"}`} style={{ "--i": i }}>
                <div className="m-door-top">
                  <span className="m-door-ic"><Icon name={s.icon} size={22} /></span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.hint}</p>
                  </div>
                  <span className="m-door-n">{fmt(d.all)}</span>
                </div>
                <div className="m-chips">
                  <Link href={base} className="m-chip">{t("op.all")} <b>{fmt(d.all)}</b></Link>
                  <Link href={`${base}&filter=${encodeURIComponent("High Reward Surveys")}`} className="m-chip c-high"><Icon name="coin" size={14} /> {t("op.high")} <b>{fmt(d.high)}</b></Link>
                  <Link href={`${base}&filter=${encodeURIComponent("Short Surveys")}`} className="m-chip c-short"><Icon name="clock" size={14} /> {t("op.short")} <b>{fmt(d.short)}</b></Link>
                </div>
                <Link href={base} className="h-btn h-btn-primary m-door-go" aria-disabled={!d.all}>
                  {t("op.go")} <Icon name="arrow" size={18} />
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ---------------- Achievement shelf: hexagon badges with progress ---------------- */
export function AchievementShelf({ stats, profiles, quality, ledger, referrals, compact = false }) {
  const loading = stats.isLoading || profiles.isLoading || ledger.isLoading;
  const list = achievementsOf({ stats: stats.data, profiles: profiles.data, quality, ledger: ledger.data, referrals: referrals?.data });
  const done = list.filter((a) => a.done).length;
  return (
    <section className={`m-ach ${compact ? "is-compact" : ""}`} aria-labelledby="ach-title">
      <div className="m-ach-head">
        <h2 className="h-h3" id="ach-title">
          <Icon name="trophy" size={20} /> {t("ach.title")}
        </h2>
        <span className="m-ach-count">{loading ? "…" : `${done}/${list.length}`}</span>
      </div>
      <ul className="m-ach-list">
        {list.map((a, i) => (
          <li key={a.id} className={`m-badge ${a.done ? "is-done" : ""}`} style={{ "--i": i, "--p": a.progress }}>
            <span className="m-badge-hex" aria-hidden="true">
              <svg viewBox="0 0 60 66">
                <path d="M30 2l26 15v32L30 64 4 49V17z" className="hx-bg" />
                <path d="M30 2l26 15v32L30 64 4 49V17z" className="hx-p" pathLength="100" style={{ strokeDasharray: `${Math.round(a.progress * 100)} 100` }} />
              </svg>
              <Icon name={a.icon} size={22} />
            </span>
            <span className="m-badge-tx">
              <b>{t(a.label)}</b>
              <small>{a.done ? t("c.unlocked") : t(a.hint, a.hintVars)}</small>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------- Activity timeline grouped by day ---------------- */
export function ActivityTimeline({ ledger, limit = 6, title = true }) {
  const { data, isLoading, isError, refetch } = ledger;
  let body;
  if (isLoading) body = <LoadingBlock lines={4} h={200} />;
  else if (isError) body = <ErrorState onRetry={refetch} />;
  else if (!data?.length) body = <EmptyState kind="activity" title={t("ac.emptyTitle")} text={t("ac.emptyText")} />;
  else {
    const rows = data.slice(0, limit);
    const groups = [];
    for (const r of rows) {
      const k = relDay(r.at, t);
      const g = groups.find((x) => x.k === k);
      if (g) g.items.push(r);
      else groups.push({ k, items: [r] });
    }
    body = (
      <ol className="m-tl">
        {groups.map((g) => (
          <li key={g.k} className="m-tl-day">
            <p className="m-tl-k">{g.k}</p>
            <ul>
              {g.items.map((r) => (
                <li key={r.id} className={`m-tl-row k-${r.kind}`}>
                  <span className="m-tl-dot"><Icon name={r.kind === "survey" ? "surveys" : r.kind === "profile" ? "profile" : "coin"} size={16} /></span>
                  <span className="m-tl-tx">
                    <b>{r.points ? `+${fmt(r.points)} ${t("c.points")}` : t(`ac.${r.kind}`)}</b>
                    <small>{t(`ac.${r.kind}`)}{r.name ? ` · ${r.name}` : ""}</small>
                  </span>
                  {r.at ? <time dateTime={r.at.toISOString()}>{r.at.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</time> : null}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <section className="m-activity" aria-labelledby={title ? "ac-title" : undefined}>
      {title ? (
        <div className="m-activity-head">
          <h2 className="h-h3" id="ac-title"><Icon name="activity" size={20} /> {t("ac.recent")}</h2>
          <Link href="/member/activity" className="h-link">{t("c.viewAll")} <Icon name="chevron" size={16} /></Link>
        </div>
      ) : null}
      {body}
    </section>
  );
}

/* ---------------- Reward peek: balance + payout milestone ---------------- */
export function RewardPeek({ points }) {
  const { data, isLoading, isError, refetch } = points;
  if (isLoading) return <section className="m-peek"><LoadingBlock lines={2} h={180} /></section>;
  if (isError) return <section className="m-peek"><ErrorState onRetry={refetch} /></section>;
  const pct = Math.min(100, (data.total / data.threshold) * 100);
  const left = Math.max(0, data.threshold - data.total);
  return (
    <section className="m-peek" aria-labelledby="peek-title">
      <p className="h-eyebrow" id="peek-title">{t("dc.nextTitle")}</p>
      <p className="m-peek-n"><Counter value={data.total} /> <small>{t("c.pts")}</small></p>
      <Meter pct={pct} label={t("rw.milestone")} ticks={[25, 50, 75]} />
      <p className="m-peek-x">{left ? t("rw.untilMilestone", { n: fmt(left) }) : t("rw.milestoneReached")}</p>
      <Link href="/member/rewards" className="h-btn h-btn-soft">{t("nav.rewards")} <Icon name="arrow" size={18} /></Link>
    </section>
  );
}

/* ---------------- Referral teaser ---------------- */
export function ReferralTeaser({ referrals }) {
  const d = referrals.data;
  return (
    <section className="m-refer" aria-labelledby="rt-title">
      <span className="m-refer-art" aria-hidden="true">
        <i /><i /><i />
      </span>
      <div>
        <p className="h-eyebrow">{t("rf.eyebrow")}</p>
        <h2 className="h-h3" id="rt-title">{t("rf.sub")}</h2>
        {d ? (
          <p className="m-refer-stats">
            <span><b>{fmt(d.invited.length)}</b> {t("rf.invited")}</span>
            {d.joinedKnown ? <span><b>{fmt(d.joined.length)}</b> {t("rf.joined")}</span> : null}
          </p>
        ) : null}
      </div>
      <Link href="/member/referrals" className="h-btn h-btn-primary">{t("rf.invite")} <Icon name="arrow" size={18} /></Link>
    </section>
  );
}

/* ---------------- Teen: parent / guardian consent status (only what /me holds) ---------------- */
export function GuardianStatus({ member, compact = false }) {
  const p = member?.parent || {};
  if (p.consent !== true) return null;
  const name = [p?.name?.first, p?.name?.last].filter(Boolean).join(" ");
  const at = p.consentAt ? new Date(p.consentAt) : null;
  return (
    <section className={`m-guardian ${compact ? "is-compact" : ""}`} aria-labelledby="gd-title">
      <span className="m-guardian-seal" aria-hidden="true"><Icon name="shield" size={26} /></span>
      <div>
        <h2 className="h-h3" id="gd-title">{t("ma.guardian")}</h2>
        <p className="m-guardian-ok"><Icon name="check" size={16} /> {t("ma.guardianDone")}</p>
        <dl>
          {name ? (<><dt>{t("ma.guardian")}</dt><dd>{name}</dd></>) : null}
          {at ? (<><dt>{t("ma.guardianDate")}</dt><dd>{at.toLocaleDateString()}</dd></>) : null}
          {p.consentVersion ? (<><dt>{t("ma.guardianVersion")}</dt><dd>{p.consentVersion}</dd></>) : null}
          <dt>{t("ma.guardianStatus")}</dt><dd>{t("ma.guardianVerified")}</dd>
        </dl>
      </div>
    </section>
  );
}

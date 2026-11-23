"use client";
// Section pages of the member hub. Each has its own hero composition and component structure:
//   Rewards   – vault door + milestone ladder + reward shelf
//   Quality   – gauge "instrument panel" + factor bars + guidance
//   Activity  – full timeline with month rail
//   Referrals – network journey (You → Invited → Joined → Verified) with live counts
//   Settings  – control center with a side index and live previews
import React from "react";
import Link from "next/link";
import { useMember } from "@/Context";
import { api } from "@/util";
import { LANGUAGES } from "@/i18n/languages";
import Icon from "./icons.jsx";
import { t } from "./strings";
import { Counter, Ring, Meter, Reveal, Skeleton, EmptyState, ErrorState, LoadingBlock } from "./ui.jsx";
import { ActivityTimeline } from "./modules.jsx";
import { ActivityExtras } from "./engage/activity.jsx";
import { RewardsExtras } from "./engage/rewards.jsx";
import { usePoints, useLedger, useStats, useProfiles, useReferrals, qualityOf, memberTypeOf, fmt, money, relDay } from "./data";
import { usePrefs, setPrefs, PALETTES, THEMES, currentLanguage, setLanguage } from "./prefs";
import { play } from "./sound";

/* =============================== REWARDS =============================== */
export function RewardsPage() {
  const points = usePoints();
  const ledger = useLedger();
  const d = points.data;
  const pct = d ? Math.min(100, (d.total / d.threshold) * 100) : 0;
  const rungs = d ? [0.25, 0.5, 0.75, 1].map((f) => Math.round(d.threshold * f)) : [];
  const fromSurveys = (ledger.data || []).filter((r) => r.kind === "survey").reduce((n, r) => n + r.points, 0);
  const fromProfiles = (ledger.data || []).filter((r) => r.kind !== "survey").reduce((n, r) => n + r.points, 0);
  const prev = React.useRef(null);
  React.useEffect(() => {
    if (!d) return;
    if (prev.current == null) {
      prev.current = d.total;
      if (d.total > 0) setTimeout(() => play("reward"), 400);
    }
  }, [d]);
  return (
    <div className="pg pg-rewards">
      <section className="rv-hero" aria-labelledby="rv-title">
        <div className="rv-vault" aria-hidden="true">
          <span className="rv-door">
            <i className="rv-bolt" /><i className="rv-bolt" /><i className="rv-bolt" /><i className="rv-bolt" />
            <span className="rv-wheel"><i /><i /><i /></span>
          </span>
          <span className="rv-glow" />
          {Array.from({ length: 7 }).map((_, i) => <span key={i} className="rv-coin" style={{ "--i": i }} />)}
        </div>
        <div className="rv-copy">
          <p className="h-eyebrow">{t("rw.eyebrow")}</p>
          <h1 className="h-display" id="rv-title">{t("rw.title")}</h1>
          <p className="h-lead">{t("rw.sub")}</p>
          {points.isError ? (
            <ErrorState onRetry={points.refetch} />
          ) : (
            <div className="rv-balance">
              <small>{t("rw.balance")}</small>
              <b>{d ? <Counter value={d.total} duration={1600} /> : <Skeleton h={48} w={180} />}</b>
              {d ? <em>{t("rw.worth", { v: money(d.total, d.rate) })}</em> : null}
            </div>
          )}
        </div>
      </section>

      <RewardsExtras />

      <div className="rv-grid">
        <Reveal className="rv-ladder">
          <section aria-labelledby="rl-title">
            <h2 className="h-h3" id="rl-title"><Icon name="stack" size={20} /> {t("rw.ladder")}</h2>
            <p className="h-sub">{t("rw.ladderHint")}</p>
            {d ? (
              <ol className="rl">
                {rungs.map((r, i) => {
                  const done = d.total >= r;
                  const now = !done && (i === 0 || d.total >= rungs[i - 1]);
                  return (
                    <li key={r} className={`${done ? "done" : ""} ${now ? "now" : ""}`} style={{ "--i": i }}>
                      <span className="rl-gem">{done ? <Icon name="check" size={16} /> : <Icon name={i === rungs.length - 1 ? "trophy" : "lock"} size={16} />}</span>
                      <span className="rl-tx">
                        <b>{fmt(r)} {t("c.pts")}</b>
                        <small>{i === rungs.length - 1 ? t("rw.milestone") : done ? t("c.unlocked") : t("c.locked")}</small>
                      </span>
                      {now ? <Meter pct={((d.total - (i ? rungs[i - 1] : 0)) / (r - (i ? rungs[i - 1] : 0))) * 100} label={`${fmt(r)}`} /> : null}
                    </li>
                  );
                })}
              </ol>
            ) : <LoadingBlock lines={4} h={220} />}
            {d ? <p className="rv-note">{d.total >= d.threshold ? t("rw.milestoneReached") : t("rw.untilMilestone", { n: fmt(d.threshold - d.total) })}</p> : null}
            <p className="rv-note small"><Icon name="wallet" size={16} /> {t("rw.payoutNote")}</p>
          </section>
        </Reveal>

        <Reveal className="rv-split" delay={80}>
          <section aria-label={`${t("rw.fromSurveys")}, ${t("rw.fromProfiles")}`}>
            <div className="rv-split-ring">
              <Ring pct={fromSurveys + fromProfiles ? (fromSurveys / (fromSurveys + fromProfiles)) * 100 : 0} size={150} stroke={18}>
                <b>{fmt(fromSurveys + fromProfiles)}</b>
                <small>{t("c.pts")}</small>
              </Ring>
            </div>
            <ul className="rv-legend">
              <li className="l-s"><i /> {t("rw.fromSurveys")} <b>{fmt(fromSurveys)}</b></li>
              <li className="l-p"><i /> {t("rw.fromProfiles")} <b>{fmt(fromProfiles)}</b></li>
            </ul>
            <div className="rv-ways">
              <p className="h-eyebrow">{t("rw.ways")}</p>
              <Link href="/member/profiles" className="rv-way"><Icon name="profile" size={18} /> {t("rw.wayProfile")}</Link>
              <Link href="/member/surveys" className="rv-way"><Icon name="surveys" size={18} /> {t("rw.waySurvey")}</Link>
              <Link href="/member/referrals" className="rv-way"><Icon name="referrals" size={18} /> {t("rw.wayRefer")}</Link>
            </div>
          </section>
        </Reveal>

        <Reveal className="rv-history">
          <section aria-labelledby="rh-title">
            <h2 className="h-h3" id="rh-title"><Icon name="rewards" size={20} /> {t("rw.history")}</h2>
            {ledger.isLoading ? <LoadingBlock lines={5} h={240} /> : ledger.isError ? <ErrorState onRetry={ledger.refetch} /> : !ledger.data.length ? (
              <EmptyState kind="rewards" title={t("rw.historyEmpty")} text={t("rw.historyEmptyText")} action={<Link href="/member/profiles" className="h-btn h-btn-primary">{t("pj.cta")}</Link>} />
            ) : (
              <ul className="rh-shelf">
                {ledger.data.map((r, i) => (
                  <li key={r.id} className={`rh-item k-${r.kind}`} style={{ "--i": Math.min(i, 12) }}>
                    <span className="rh-token"><Icon name={r.kind === "survey" ? "surveys" : "profile"} size={18} /></span>
                    <span className="rh-tx">
                      <b>{r.name || t(`ac.${r.kind}`)}</b>
                      <small>{t(`ac.${r.kind}`)} · {relDay(r.at, t)}</small>
                    </span>
                    <span className="rh-pts">+{fmt(r.points)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Reveal>
      </div>
    </div>
  );
}

/* =============================== QUALITY SCORE =============================== */
export function QualityPage() {
  const member = useMember();
  const stats = useStats();
  const profiles = useProfiles();
  const q = qualityOf(member);
  const s = stats.data;
  const p = profiles.data;
  const angle = q?.pct != null ? -120 + (q.pct / 100) * 240 : -120;
  const factors = [
    { k: "p", icon: "profile", label: t("qs.fProfiles"), v: p ? `${p.done}/${p.list.length}` : "…", pct: p && p.list.length ? (p.done / p.list.length) * 100 : 0, good: true },
    { k: "c", icon: "check", label: t("qs.fComplete"), v: s ? fmt(s.complete) : "…", pct: s && s.started ? (s.complete / s.started) * 100 : 0, good: true },
    { k: "d", icon: "clock", label: t("qs.fDropout"), v: s ? fmt(s.dropout) : "…", pct: s && s.started ? (s.dropout / s.started) * 100 : 0, good: false },
    { k: "v", icon: "mail", label: t("qs.fVerified"), v: member?.isVerified?.email === "verified" ? "✓" : "–", pct: member?.isVerified?.email === "verified" ? 100 : 0, good: true },
  ];
  const tips = [];
  if (p && p.done < p.list.length) tips.push({ icon: "profile", text: t("qs.tipProfile"), href: "/member/profiles" });
  if (s && s.dropout > 0) tips.push({ icon: "surveys", text: t("qs.tipFinish"), href: "/member/surveys" });
  tips.push({ icon: "eye", text: t("qs.tipHonest") });
  return (
    <div className="pg pg-quality">
      <section className="qs-hero" aria-labelledby="qs-title">
        <div className="qs-copy">
          <p className="h-eyebrow">{t("qs.eyebrow")}</p>
          <h1 className="h-display" id="qs-title">{t("qs.title")}</h1>
          <p className="h-lead">{t("qs.whyText")}</p>
        </div>
        <div className="qs-gauge" role="img" aria-label={q ? `${t("qs.title")} ${q.score}${q.scale ? ` / ${q.scale}` : ""}` : t("c.loading")}>
          <svg viewBox="0 0 240 170" aria-hidden="true">
            <defs>
              <linearGradient id="qsG" x1="0" x2="1">
                <stop offset="0" stopColor="#ef4444" />
                <stop offset=".45" stopColor="#f59e0b" />
                <stop offset="1" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <path d="M30 140 A90 90 0 1 1 210 140" className="qs-track" />
            <path d="M30 140 A90 90 0 1 1 210 140" className="qs-arc" pathLength="100" style={{ strokeDasharray: `${q?.pct ?? 0} 100` }} />
            {Array.from({ length: 11 }).map((_, i) => {
              const a = ((-210 + i * 24) * Math.PI) / 180;
              return <line key={i} x1={120 + Math.cos(a) * 70} y1={120 + Math.sin(a) * 70} x2={120 + Math.cos(a) * 78} y2={120 + Math.sin(a) * 78} className="qs-tick" />;
            })}
            <g className="qs-needle" style={{ transform: `rotate(${angle}deg)` }}>
              <path d="M120 120 L116 118 L120 52 L124 118 Z" />
              <circle cx="120" cy="120" r="9" />
            </g>
          </svg>
          <div className="qs-read">
            <b>{q ? <Counter value={q.score} /> : "…"}{q?.scale ? <small> / {q.scale}</small> : null}</b>
            {q?.band ? <span className={`qs-band b-${q.band}`}>{t(`qs.${q.band}`)}</span> : null}
          </div>
        </div>
      </section>

      <div className="qs-grid">
        <Reveal className="qs-factors">
          <section aria-labelledby="qf-title">
            <h2 className="h-h3" id="qf-title"><Icon name="gauge" size={20} /> {t("qs.factors")}</h2>
            <ul>
              {factors.map((f) => (
                <li key={f.k} className={f.good ? "good" : "watch"}>
                  <span className="qf-ic"><Icon name={f.icon} size={18} /></span>
                  <span className="qf-l">{f.label}</span>
                  <Meter pct={f.pct} label={f.label} />
                  <b>{f.v}</b>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
        <Reveal className="qs-how" delay={60}>
          <section aria-labelledby="qh-title">
            <h2 className="h-h3" id="qh-title"><Icon name="spark" size={20} /> {t("qs.howTitle")}</h2>
            <ol className="qs-tips">
              {tips.map((x, i) => (
                <li key={i} style={{ "--i": i }}>
                  <span><Icon name={x.icon} size={18} /></span>
                  {x.href ? <Link href={x.href}>{x.text}</Link> : <p>{x.text}</p>}
                </li>
              ))}
            </ol>
            <div className="qs-benefit">
              <h3>{t("qs.benefitTitle")}</h3>
              <p>{t("qs.benefitText")}</p>
            </div>
          </section>
        </Reveal>
        <Reveal className="qs-history" delay={100}>
          <section aria-labelledby="qhh-title">
            <h2 className="h-h3" id="qhh-title"><Icon name="chart" size={20} /> {t("qs.history")}</h2>
            <EmptyState kind="quality" title={t("qs.historyEmpty")} text={t("qs.historyEmptyText")} />
          </section>
        </Reveal>
      </div>
    </div>
  );
}

/* =============================== ACTIVITY =============================== */
export function ActivityPage() {
  const ledger = useLedger();
  const stats = useStats();
  const total = (ledger.data || []).reduce((n, r) => n + r.points, 0);
  return (
    <div className="pg pg-activity">
      <section className="ac-hero" aria-labelledby="ac-title">
        <div>
          <p className="h-eyebrow">{t("ac.eyebrow")}</p>
          <h1 className="h-display" id="ac-title">{t("ac.title")}</h1>
          <p className="h-lead">{t("ac.sub")}</p>
        </div>
        <ul className="ac-pulse">
          <li><b>{ledger.data ? <Counter value={ledger.data.length} /> : "…"}</b><small>{t("nav.activity")}</small></li>
          <li><b>{ledger.data ? <Counter value={total} /> : "…"}</b><small>{t("c.points")}</small></li>
          <li><b>{stats.data ? <Counter value={stats.data.complete} /> : "…"}</b><small>{t("qs.fComplete")}</small></li>
        </ul>
        <svg className="ac-wave" viewBox="0 0 600 80" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 50 Q 50 10 100 45 T 200 40 T 300 50 T 400 30 T 500 45 T 600 35" />
        </svg>
      </section>
      <ActivityExtras />
      <Reveal><ActivityTimeline ledger={ledger} limit={20} title={false} /></Reveal>
    </div>
  );
}

/* =============================== REFERRALS =============================== */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function ReferralsPage() {
  const member = useMember();
  const ref = useReferrals();
  const [link, setLink] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [emails, setEmails] = React.useState("");
  const [state, setState] = React.useState({ phase: "idle", msg: "" });
  React.useEffect(() => {
    if (member?._id) setLink(`${window.location.origin}/?ref=${member._id}&signup`);
  }, [member?._id]);
  const d = ref.data;
  const nodes = [
    { k: "you", icon: "profile", label: t("rf.you"), v: member?.firstname || "" },
    { k: "invited", icon: "mail", label: t("rf.invited"), v: d ? fmt(d.invited.length) : "…" },
    { k: "joined", icon: "users", label: t("rf.joined"), v: d ? (d.joinedKnown ? fmt(d.joined.length) : "–") : "…" },
    { k: "verified", icon: "quality", label: t("rf.verified"), v: d ? (d.joinedKnown ? fmt(d.joined.filter((x) => x.verified).length) : "–") : "…" },
  ];
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      play("complete");
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      /* clipboard blocked: the link is still selectable */
    }
  }
  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "MyFrequentRewards", url: link });
      } catch (e) {
        /* cancelled */
      }
    } else copy();
  }
  async function send(e) {
    e.preventDefault();
    const list = [...new Set(emails.split(/[\s,;]+/).map((x) => x.trim().toLowerCase()).filter(Boolean))];
    if (!list.length || list.some((x) => !EMAIL.test(x))) {
      setState({ phase: "error", msg: t("rf.bad") });
      return;
    }
    setState({ phase: "sending", msg: "" });
    const r = await api.post("/api/v1/me/invite", { emails: list });
    if (r && r.status !== "error") {
      const sent = r.data?.invited?.length ?? 0;
      const already = r.data?.alreadyRegistered?.length ?? 0;
      setState({ phase: "done", msg: `${t("rf.sent", { n: sent })}${already ? ` · ${t("rf.already", { n: already })}` : ""}` });
      setEmails("");
      play("complete");
      ref.refetch();
    } else setState({ phase: "error", msg: t("c.errorTitle") });
  }
  return (
    <div className="pg pg-referrals">
      <section className="rf-hero" aria-labelledby="rf-title">
        <div className="rf-copy">
          <p className="h-eyebrow">{t("rf.eyebrow")}</p>
          <h1 className="h-display" id="rf-title">{t("rf.title")}</h1>
          <p className="h-lead">{t("rf.sub")}</p>
        </div>
        <ol className="rf-journey" aria-label={nodes.map((n) => `${n.label} ${n.v}`).join(", ")}>
          {nodes.map((n, i) => (
            <li key={n.k} className={`rf-node n-${n.k}`} style={{ "--i": i }}>
              <span className="rf-orb"><Icon name={n.icon} size={22} /></span>
              <b>{n.v}</b>
              <small>{n.label}</small>
            </li>
          ))}
          <span className="rf-wire" aria-hidden="true"><i /></span>
        </ol>
      </section>

      <div className="rf-grid">
        <Reveal className="rf-share">
          <section aria-labelledby="rs-title">
            <h2 className="h-h3" id="rs-title"><Icon name="link" size={20} /> {t("rf.link")}</h2>
            <div className="rf-link">
              <input readOnly value={link} aria-label={t("rf.link")} onFocus={(e) => e.target.select()} />
              <button type="button" className="h-btn h-btn-primary" onClick={copy}>{copied ? <><Icon name="check" size={18} /> {t("c.copied")}</> : <><Icon name="link" size={18} /> {t("c.copy")}</>}</button>
              <button type="button" className="h-btn h-btn-soft" onClick={share}><Icon name="share" size={18} /> {t("c.share")}</button>
            </div>
            <form className="rf-invite" onSubmit={send} noValidate>
              <label htmlFor="rf-emails">{t("rf.invite")}</label>
              <textarea id="rf-emails" rows={3} value={emails} onChange={(e) => setEmails(e.target.value)} placeholder={t("rf.invitePh")} aria-invalid={state.phase === "error"} aria-describedby="rf-msg" />
              <div className="rf-invite-foot">
                <p id="rf-msg" className={`rf-msg ${state.phase}`} role="status">{state.msg}</p>
                <button type="submit" className="h-btn h-btn-primary" disabled={state.phase === "sending"}>{state.phase === "sending" ? t("rf.sending") : <>{t("rf.send")} <Icon name="arrow" size={18} /></>}</button>
              </div>
            </form>
            <p className="rv-note small"><Icon name="coin" size={16} /> {t("rf.noBonus")}</p>
          </section>
        </Reveal>
        <Reveal className="rf-lists" delay={80}>
          <section aria-labelledby="rl2-title">
            {ref.isLoading ? <LoadingBlock lines={4} h={220} /> : ref.isError ? <ErrorState onRetry={ref.refetch} /> : !d.invited.length && !d.joined.length ? (
              <EmptyState kind="referrals" title={t("rf.emptyTitle")} text={t("rf.emptyText")} />
            ) : (
              <>
                {d.joined.length ? (
                  <>
                    <h2 className="h-h3" id="rl2-title"><Icon name="users" size={20} /> {t("rf.listJoined")}</h2>
                    <ul className="rf-people">
                      {d.joined.map((p) => (
                        <li key={p.id}>
                          <span className="rf-av">{(p.name || "?").slice(0, 1).toUpperCase()}</span>
                          <span><b>{p.name}</b><small>{p.at ? relDay(p.at, t) : ""}</small></span>
                          <em className={p.verified ? "ok" : ""}>{p.verified ? t("rf.verified") : t("rf.joined")}</em>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
                <h2 className="h-h3" id={d.joined.length ? undefined : "rl2-title"}><Icon name="mail" size={20} /> {t("rf.listInvited")}</h2>
                <ul className="rf-people">
                  {d.invited.map((p, i) => (
                    <li key={`${p.email}-${i}`}>
                      <span className="rf-av m"><Icon name="mail" size={16} /></span>
                      <span><b>{p.email}</b></span>
                      <em>{t("rf.invited")}</em>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </Reveal>
      </div>
    </div>
  );
}

/* =============================== SETTINGS =============================== */
function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="st-toggle">
      <span>
        <b>{label}</b>
        {hint ? <small>{hint}</small> : null}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}

const CHANNELS = [
  { value: "email", label: "st.chEmail", icon: "mail" },
  { value: "sms", label: "st.chSms", icon: "bell" },
  { value: "phone", label: "st.chPhone", icon: "support" },
  { value: "dashboard", label: "st.chDashboard", icon: "dashboard" },
  { value: "whatsapp", label: "st.chWhatsapp", icon: "share" },
];

function NotificationPrefs() {
  const member = useMember();
  const [sel, setSel] = React.useState(null);
  const [init, setInit] = React.useState([]);
  const [st, setSt] = React.useState("");
  React.useEffect(() => {
    if (!member?._id) return;
    api.post("/api/v1/me", { questions: ["communication-methods"] }).then((r) => {
      const v = [].concat(r?.data?.["communication-methods"] ?? []);
      setSel(v);
      setInit(v);
    });
  }, [member?._id]);
  if (!sel) return <LoadingBlock lines={3} h={160} />;
  const changed = JSON.stringify([...sel].sort()) !== JSON.stringify([...init].sort());
  return (
    <div className="st-channels">
      {CHANNELS.map((c) => (
        <label key={c.value} className={`st-chan ${sel.includes(c.value) ? "on" : ""}`}>
          <input type="checkbox" checked={sel.includes(c.value)} onChange={() => setSel((s) => (s.includes(c.value) ? s.filter((x) => x !== c.value) : [...s, c.value]))} />
          <Icon name={c.icon} size={20} />
          <span>{t(c.label)}</span>
          <i className="st-chan-tick" aria-hidden="true"><Icon name="check" size={14} /></i>
        </label>
      ))}
      <div className="st-row-end">
        <span role="status" className="st-status">{st}</span>
        <button
          type="button"
          className="h-btn h-btn-primary"
          disabled={!changed || st === t("c.saving")}
          onClick={async () => {
            setSt(t("c.saving"));
            const r = await api.patch("/api/v1/me/answer", { "communication-methods": sel });
            if (r && r.status !== "error") {
              setInit(sel);
              setSt(t("c.saved"));
              play("complete");
            } else setSt(t("c.errorTitle"));
          }}
        >
          {t("c.save")}
        </button>
      </div>
    </div>
  );
}

function PasswordForm() {
  const [v, setV] = React.useState({ oldPassword: "", newPassword: "", cnfPassword: "" });
  const [msg, setMsg] = React.useState({ k: "", text: "" });
  const err = v.newPassword && v.newPassword.length < 8 ? t("st.pwShort") : v.cnfPassword && v.cnfPassword !== v.newPassword ? t("st.pwMismatch") : "";
  return (
    <form
      className="st-pw"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (err || !v.oldPassword || !v.newPassword) {
          setMsg({ k: "error", text: err || t("st.pwShort") });
          return;
        }
        setMsg({ k: "busy", text: t("c.saving") });
        const r = await api.patch("/api/v1/me", v);
        if (r && r.status === "success") {
          setV({ oldPassword: "", newPassword: "", cnfPassword: "" });
          setMsg({ k: "ok", text: r.message || t("c.saved") });
          play("complete");
        } else setMsg({ k: "error", text: (r && r.message) || t("c.errorTitle") });
      }}
    >
      {[
        ["oldPassword", "st.oldPw", "current-password"],
        ["newPassword", "st.newPw", "new-password"],
        ["cnfPassword", "st.cnfPw", "new-password"],
      ].map(([k, l, ac]) => (
        <label key={k} className="st-field">
          <span>{t(l)}</span>
          <input type="password" autoComplete={ac} value={v[k]} onChange={(e) => setV((s) => ({ ...s, [k]: e.target.value }))} aria-invalid={Boolean(err && k !== "oldPassword")} />
        </label>
      ))}
      {err ? <p className="st-err" role="alert">{err}</p> : null}
      <div className="st-row-end">
        <span role="status" className={`st-status ${msg.k}`}>{msg.text}</span>
        <button type="submit" className="h-btn h-btn-primary">{t("st.pwChange")}</button>
      </div>
    </form>
  );
}

export function SettingsPage() {
  const member = useMember();
  const prefs = usePrefs();
  const type = memberTypeOf(member);
  const [lang, setLang] = React.useState("en");
  React.useEffect(() => setLang(currentLanguage()), []);
  const cats = [
    { id: "appearance", icon: "palette", label: t("st.appearance") },
    { id: "sound", icon: "soundOn", label: t("st.sound") },
    { id: "language", icon: "globe", label: t("st.language") },
    { id: "notifications", icon: "bell", label: t("st.notifications") },
    { id: "security", icon: "lock", label: t("st.security") },
    { id: "privacy", icon: "shield", label: t("st.privacy") },
    { id: "account", icon: "account", label: t("st.account") },
  ];
  const [active, setActive] = React.useState("appearance");
  React.useEffect(() => {
    const els = cats.map((c) => document.getElementById(`st-${c.id}`)).filter(Boolean);
    if (typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver((es) => {
      const v = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (v) setActive(v.target.id.replace("st-", ""));
    }, { rootMargin: "-30% 0px -60% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const icons = { light: "sun", dark: "moon", night: "night" };
  return (
    <div className="pg pg-settings">
      <section className="st-hero" aria-labelledby="st-title">
        <p className="h-eyebrow">{t("st.eyebrow")}</p>
        <h1 className="h-display" id="st-title">{t("st.title")}</h1>
        <p className="h-lead">{t("st.sub")}</p>
      </section>
      <div className="st-layout">
        <nav className="st-index" aria-label={t("st.title")}>
          {cats.map((c) => (
            <a key={c.id} href={`#st-${c.id}`} className={active === c.id ? "on" : ""} aria-current={active === c.id ? "true" : undefined}>
              <Icon name={c.icon} size={18} /> <span>{t(c.label)}</span>
            </a>
          ))}
        </nav>
        <div className="st-panels">
          <section id="st-appearance" className="st-card c-appearance" aria-labelledby="sa-t">
            <header><span className="st-ic"><Icon name="palette" size={20} /></span><div><h2 id="sa-t" className="h-h3">{t("st.appearance")}</h2><p>{t("st.appearanceHint")}</p></div></header>
            <div className="st-themes" role="radiogroup" aria-label={t("hdr.theme")}>
              {THEMES.map((k) => (
                <button key={k} type="button" role="radio" aria-checked={prefs.theme === k} className={`st-theme th-${k} ${prefs.theme === k ? "on" : ""}`} onClick={() => { setPrefs({ theme: k }); play("tap"); }}>
                  <span className="st-theme-pv" aria-hidden="true"><i /><i /><i /></span>
                  <span className="st-theme-l"><Icon name={icons[k]} size={16} /> {t(`theme.${k}`)}</span>
                  <small>{t(`theme.${k}Hint`)}</small>
                </button>
              ))}
            </div>
            <h3 className="st-sub">{t("st.palette")}</h3>
            <div className="st-pals" role="radiogroup" aria-label={t("st.palette")}>
              {[...Object.keys(PALETTES), "custom"].map((k) => {
                const pal = PALETTES[k];
                const sw = k === "custom" ? [prefs.custom, prefs.custom, prefs.custom] : pal ? [pal.primary, pal.secondary, pal.accent] : null;
                return (
                  <button key={k} type="button" role="radio" aria-checked={prefs.palette === k} className={`st-pal p-${k} ${prefs.palette === k ? "on" : ""}`} onClick={() => { setPrefs({ palette: k }); play("tap"); }}>
                    <span className={`st-pal-sw ${sw ? "" : `mfr-${type}`}`} style={sw ? { background: `conic-gradient(${sw[0]} 0 40%, ${sw[1]} 0 75%, ${sw[2]} 0)` } : undefined} aria-hidden="true" />
                    <span>{t(`pal.${k}`)}</span>
                  </button>
                );
              })}
            </div>
            {prefs.palette === "custom" ? (
              <label className="st-color">
                <span>{t("st.custom")}</span>
                <input type="color" value={prefs.custom} onChange={(e) => setPrefs({ custom: e.target.value })} />
                <code>{prefs.custom.toUpperCase()}</code>
              </label>
            ) : null}
            <div className="st-preview" aria-label={t("st.preview")}>
              <span className="h-btn h-btn-primary" aria-hidden="true">{t("op.go")}</span>
              <Meter pct={68} label={t("st.preview")} />
              <span className="st-preview-chip">+120 {t("c.pts")}</span>
            </div>
            <p className="st-foot">{t("st.storedHere")}</p>
          </section>

          <section id="st-sound" className="st-card c-sound" aria-labelledby="ss-t">
            <header><span className="st-ic"><Icon name="soundOn" size={20} /></span><div><h2 id="ss-t" className="h-h3">{t("st.sound")}</h2><p>{t("st.soundHint")}</p></div></header>
            <Toggle checked={prefs.sound} onChange={(v) => { setPrefs({ sound: v }); if (v) setTimeout(() => play("reward"), 0); }} label={t("st.soundAll")} />
            <Toggle checked={prefs.soundNotify} onChange={(v) => setPrefs({ soundNotify: v })} label={t("st.soundNotify")} />
            <button type="button" className="h-btn h-btn-soft" onClick={() => play("achievement")} disabled={!prefs.sound}><Icon name="soundOn" size={18} /> {t("st.soundTest")}</button>
          </section>

          <section id="st-language" className="st-card c-language" aria-labelledby="sl-t">
            <header><span className="st-ic"><Icon name="globe" size={20} /></span><div><h2 id="sl-t" className="h-h3">{t("st.language")}</h2><p>{t("st.languageHint")}</p></div></header>
            <label className="st-field">
              <span>{t("hdr.language")}</span>
              <select className="notranslate" value={lang} onChange={(e) => { setLang(e.target.value); setLanguage(e.target.value); }}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.native} · {l.name}</option>)}
              </select>
            </label>
          </section>

          <section id="st-notifications" className="st-card c-notifications" aria-labelledby="sn-t">
            <header><span className="st-ic"><Icon name="bell" size={20} /></span><div><h2 id="sn-t" className="h-h3">{t("st.notifications")}</h2><p>{t("st.notificationsHint")}</p></div></header>
            <NotificationPrefs />
          </section>

          <section id="st-security" className="st-card c-security" aria-labelledby="sx-t">
            <header><span className="st-ic"><Icon name="lock" size={20} /></span><div><h2 id="sx-t" className="h-h3">{t("st.security")}</h2><p>{t("st.securityHint")}</p></div></header>
            <PasswordForm />
          </section>

          <section id="st-privacy" className="st-card c-privacy" aria-labelledby="sp-t">
            <header><span className="st-ic"><Icon name="shield" size={20} /></span><div><h2 id="sp-t" className="h-h3">{t("st.privacy")}</h2><p>{t("st.privacyHint")}</p></div></header>
            <div className="st-links">
              <a href={type === "teen" ? "/teen-terms" : "/terms"} target="_blank" rel="noopener" className="h-btn h-btn-soft">{t("st.terms")} <Icon name="arrow" size={16} /></a>
              <a href="/privacy" target="_blank" rel="noopener" className="h-btn h-btn-soft">{t("st.privacyPolicy")} <Icon name="arrow" size={16} /></a>
            </div>
          </section>

          <section id="st-account" className="st-card c-account" aria-labelledby="sac-t">
            <header><span className="st-ic"><Icon name="account" size={20} /></span><div><h2 id="sac-t" className="h-h3">{t("st.account")}</h2><p>{t("st.accountHint")}</p></div></header>
            <div className="st-links">
              <Link href="/member/myaccount" className="h-btn h-btn-soft">{t("nav.account")} <Icon name="arrow" size={16} /></Link>
              <Link href="/member/support" className="h-btn h-btn-soft">{t("ma.close")} <Icon name="arrow" size={16} /></Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

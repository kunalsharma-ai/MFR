"use client";
// Settings additions (phase 7): survey preferences, notification controls (email, push, WhatsApp) with quiet hours,
// the privacy centre (download my data, ask to delete my account) and, for Teens, the guardian tab.
// My Account additions: profile strength, anniversary badges, lifetime stats, identity and payout in one place.
import React from "react";
import Link from "next/link";
import Icon from "../icons.jsx";
import { t } from "../strings";
import { LoadingBlock, ErrorState, Ring, Reveal } from "../ui.jsx";
import { fmt } from "../data";
import { E, useEngage, useEngageConfig, useEngageMutation, usePreferences, useSavePreferences, send } from "./data";
import { play } from "../sound";
import "./engage.css";

const when = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "");
const BEST = ["morning", "afternoon", "evening", "night"];

function Switch({ checked, onChange, label, hint, disabled }) {
  return (
    <label className={`eg-switch${disabled ? " is-off" : ""}`}>
      <input type="checkbox" role="switch" checked={Boolean(checked)} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="eg-switch-ui" aria-hidden="true" />
      <span><b>{label}</b>{hint ? <small>{hint}</small> : null}</span>
    </label>
  );
}

/* ---------------- survey preferences ---------------- */
export function SurveyPrefs() {
  const p = usePreferences();
  const save = useSavePreferences();
  const [v, setV] = React.useState(null);
  React.useEffect(() => { if (p.data && !v) setV(p.data.survey || { bestTimes: [], invitesPerWeek: null, topics: [] }); }, [p.data]); // eslint-disable-line react-hooks/exhaustive-deps
  if (p.isLoading || !v) return <LoadingBlock lines={2} h={100} />;
  if (p.isError) return <ErrorState onRetry={() => p.refetch()} />;
  const toggle = (k) => setV({ ...v, bestTimes: v.bestTimes.includes(k) ? v.bestTimes.filter((x) => x !== k) : [...v.bestTimes, k] });
  return (
    <div className="eg-set">
      <p className="eg-set-l">{t("sp.best")}</p>
      <div className="eg-chips" role="group" aria-label={t("sp.best")}>
        {BEST.map((k) => <button key={k} type="button" className={`eg-chip${v.bestTimes.includes(k) ? " on" : ""}`} aria-pressed={v.bestTimes.includes(k)} onClick={() => toggle(k)}>{t(`sp.t.${k}`)}</button>)}
      </div>
      <label className="st-field">
        <span>{t("sp.cap")}</span>
        <select value={v.invitesPerWeek ?? ""} onChange={(e) => setV({ ...v, invitesPerWeek: e.target.value === "" ? null : Number(e.target.value) })}>
          <option value="">{t("sp.noCap")}</option>
          {[1, 2, 3, 5, 7, 10, 15].map((n) => <option key={n} value={n}>{t("sp.perWeek", { n })}</option>)}
        </select>
      </label>
      <p className="h-sub">{t("sp.capHint")}</p>
      <div className="st-row-end">
        <span role="status" className="st-status">{save.isSuccess ? t("c.saved") : save.isError ? t("c.errorTitle") : ""}</span>
        <button type="button" className="h-btn h-btn-primary" disabled={save.isPending} onClick={() => save.mutate({ survey: { bestTimes: v.bestTimes, invitesPerWeek: v.invitesPerWeek } }, { onSuccess: () => play("complete") })}>{t("c.save")}</button>
      </div>
    </div>
  );
}

/* ---------------- notifications (email, push, WhatsApp, quiet hours) ---------------- */
const b64 = (s) => { const p = "=".repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); };
async function pushSubscribe(publicKey) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("unsupported");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("denied");
  const reg = await navigator.serviceWorker.register("/member-sw.js", { scope: "/member/" });
  await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(publicKey) });
  await send("post", "/push/subscribe", { subscription: sub.toJSON() });
}
async function pushUnsubscribe() {
  const reg = await navigator.serviceWorker?.getRegistration?.("/member/");
  const sub = await reg?.pushManager?.getSubscription();
  if (sub) { await send("post", "/push/unsubscribe", { endpoint: sub.endpoint }).catch(() => {}); await sub.unsubscribe(); }
}

export function EngageNotifications({ teen }) {
  const p = usePreferences();
  const cfg = useEngageConfig();
  const save = useSavePreferences();
  const [n, setN] = React.useState(null);
  const [pushMsg, setPushMsg] = React.useState("");
  React.useEffect(() => { if (p.data && !n) setN(p.data.notifications || {}); }, [p.data]); // eslint-disable-line react-hooks/exhaustive-deps
  if (p.isLoading || cfg.isLoading || !n) return <LoadingBlock lines={3} h={140} />;
  if (p.isError) return <ErrorState onRetry={() => p.refetch()} />;
  const pushOn = cfg.data?.push?.enabled;
  const waOn = cfg.data?.whatsapp?.enabled;
  const set = (k) => (v) => setN({ ...n, [k]: v });
  const q = n.quietHours || { enabled: false, start: "22:00", end: "08:00" };
  async function togglePush(v) {
    setPushMsg("");
    try {
      if (v) await pushSubscribe(cfg.data.push.publicKey); else await pushUnsubscribe();
      setN({ ...n, push: v });
    } catch (e) {
      setPushMsg(e.message === "denied" ? t("np.pushDenied") : e.message === "unsupported" ? t("np.pushUnsupported") : t("c.errorTitle"));
    }
  }
  return (
    <div className="eg-set">
      <p className="eg-set-l">{t("np.channels")}</p>
      <Switch checked={n.email !== false} onChange={set("email")} label={t("np.email")} hint={t("np.emailHint")} />
      <Switch checked={n.push} onChange={togglePush} label={t("np.push")} hint={pushOn ? t("np.pushHint") : t("np.soon")} disabled={!pushOn} />
      {pushMsg ? <p className="eg-err" role="alert">{pushMsg}</p> : null}
      <Switch checked={n.whatsapp} onChange={set("whatsapp")} label="WhatsApp" hint={waOn ? t("np.waHint") : t("np.soon")} disabled={!waOn} />
      <p className="eg-set-l">{t("np.what")}</p>
      <Switch checked={n.newSurvey !== false} onChange={set("newSurvey")} label={t("np.newSurvey")} />
      <Switch checked={n.weeklySummary !== false} onChange={set("weeklySummary")} label={t("np.weekly")} />
      <Switch checked={n.lifecycle !== false} onChange={set("lifecycle")} label={t("np.reminders")} />
      {!teen ? <Switch checked={n.expiryReminders !== false} onChange={set("expiryReminders")} label={t("np.expiry")} /> : null}
      <Switch checked={n.birthday !== false} onChange={set("birthday")} label={t("np.birthday")} />
      <p className="eg-set-l">{t("np.quiet")}</p>
      <Switch checked={q.enabled} onChange={(v) => setN({ ...n, quietHours: { ...q, enabled: v } })} label={t("np.quietOn")} hint={t("np.quietHint")} />
      {q.enabled ? (
        <div className="eg-quiet">
          <label><span>{t("np.from")}</span><input type="time" value={q.start} onChange={(e) => setN({ ...n, quietHours: { ...q, start: e.target.value } })} /></label>
          <label><span>{t("np.to")}</span><input type="time" value={q.end} onChange={(e) => setN({ ...n, quietHours: { ...q, end: e.target.value } })} /></label>
        </div>
      ) : null}
      <div className="st-row-end">
        <span role="status" className="st-status">{save.isSuccess ? t("c.saved") : save.isError ? t("c.errorTitle") : ""}</span>
        <button type="button" className="h-btn h-btn-primary" disabled={save.isPending} onClick={() => save.mutate({ notifications: n }, { onSuccess: () => play("complete") })}>{t("c.save")}</button>
      </div>
    </div>
  );
}

/* ---------------- privacy centre ---------------- */
export function PrivacyCentre({ teen }) {
  const reqs = useEngage("privacy", "/privacy/requests", { tickDep: false });
  const del = useEngageMutation("post", "/privacy/delete");
  const cancel = useEngageMutation("post", "/privacy/delete/cancel");
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [sure, setSure] = React.useState(false);
  const live = (reqs.data || []).find((r) => ["requested", "approved"].includes(r.status));
  return (
    <div className="eg-set">
      <div className="eg-priv">
        <div>
          <b>{t("pv.export")}</b>
          <small>{t("pv.exportHint")}</small>
        </div>
        <a className="h-btn h-btn-soft" href={`${E}/privacy/export`} download><Icon name="arrow" size={16} /> {t("pv.download")}</a>
      </div>
      <div className="eg-priv">
        <div>
          <b>{t("pv.delete")}</b>
          <small>{teen ? t("pv.deleteHintTeen") : t("pv.deleteHint")}</small>
        </div>
        {live ? (
          <div className="eg-priv-state">
            <span className="eg-pill warn">{t(`pv.s.${live.status}`)} · {when(live.at)}</span>
            {live.note ? <small>{live.note}</small> : null}
            {live.status === "requested" ? <button type="button" className="h-btn h-btn-soft" disabled={cancel.isPending} onClick={() => cancel.mutate({})}>{t("pv.cancel")}</button> : null}
          </div>
        ) : !open ? (
          <button type="button" className="h-btn h-btn-soft eg-danger" onClick={() => setOpen(true)}>{t("pv.ask")}</button>
        ) : (
          <form className="eg-form" onSubmit={(e) => { e.preventDefault(); del.mutate({ reason }, { onSuccess: () => { setOpen(false); setSure(false); } }); }}>
            <label><span>{t("pv.reason")}</span><textarea rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
            <label className="eg-check"><input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} /> <span>{t("pv.sure")}</span></label>
            {del.error ? <p className="eg-err" role="alert">{del.error.message}</p> : null}
            <div className="eg-actions">
              <button type="submit" className="h-btn h-btn-primary eg-danger" disabled={!sure || del.isPending}>{t("pv.send")}</button>
              <button type="button" className="h-btn h-btn-soft" onClick={() => setOpen(false)}>{t("c.cancel")}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------------- Teen guardian tab ---------------- */
export function GuardianTab() {
  const g = useEngage("teen-guardian", "/teen/guardian", { tickDep: false });
  const viewLink = useEngageMutation("post", "/teen/guardian-view");
  if (g.isLoading) return <LoadingBlock lines={2} h={100} />;
  if (g.isError) return <ErrorState onRetry={() => g.refetch()} />;
  const d = g.data;
  if (!d.found) return <p className="h-sub">{t("gt.none")}</p>;
  return (
    <div className="eg-set">
      <div className="eg-priv">
        <div>
          <b>{d.firstName} · {t(`gt.r.${d.relation}`)}</b>
          <small>{d.email}</small>
        </div>
        <span className={`eg-pill ${d.status === "active" ? "ok" : "warn"}`}>{d.status === "active" ? t("gt.approved") : t("gt.pending")}</span>
      </div>
      <ul className="eg-gt-list">
        <li><Icon name="check" size={16} /> {t("gt.rewards")}</li>
        <li><Icon name="eye" size={16} /> {t("gt.view")}</li>
        <li><Icon name="mail" size={16} /> {t("gt.change")}</li>
      </ul>
      <div className="eg-actions">
        <button type="button" className="h-btn h-btn-soft" disabled={viewLink.isPending || viewLink.isSuccess} onClick={() => viewLink.mutate({})}><Icon name="shield" size={18} /> {t("tn.gview")}</button>
        <Link href="/member/support" className="h-link">{t("gt.support")}</Link>
      </div>
      {viewLink.isSuccess ? <p className="h-sub" role="status">{t("tn.gviewSent", { to: viewLink.data.to })}</p> : null}
      {viewLink.error ? <p className="eg-err" role="alert">{viewLink.error.message}</p> : null}
    </div>
  );
}

/* ---------------- My Account extras ---------------- */
export function AccountExtras() {
  const q = useEngage("account", "/account/summary");
  if (q.isLoading) return <LoadingBlock lines={3} h={160} />;
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  const d = q.data;
  const a = d.anniversary;
  const todo = d.items.filter((i) => !i.done);
  return (
    <div className="eg-agrid">
      <Reveal>
        <section className="eg-card eg-strength" aria-labelledby="ps-title">
          <h2 className="h-h3" id="ps-title"><Icon name="gauge" size={20} /> {t("ac.strength")}</h2>
          <div className="eg-strength-row">
            <Ring pct={d.strength} size={96} stroke={9} label={`${d.strength}%`}><b>{d.strength}%</b></Ring>
            <ul className="eg-strength-list">
              {d.items.map((i) => (
                <li key={i.key} className={i.done ? "on" : ""}>
                  <Icon name={i.done ? "check" : "plus"} size={14} />
                  {i.done ? <span>{t(`ac.i.${i.key}`)}</span> : <Link href={i.href}>{t(`ac.i.${i.key}`)}{i.progress ? ` (${i.progress.done}/${i.progress.total})` : ""}</Link>}
                </li>
              ))}
            </ul>
          </div>
          {!todo.length ? <p className="h-sub">{t("ac.allDone")}</p> : null}
        </section>
      </Reveal>
      <Reveal delay={60}>
        <section className="eg-card eg-anniv" aria-labelledby="an-title">
          <h2 className="h-h3" id="an-title"><Icon name="calendar" size={20} /> {t("ac.anniv")}</h2>
          <p className="h-sub">{a.years ? t("ac.years", { n: a.years }) : t("ac.firstYear")} · {t("ac.next", { n: a.daysToNext })}</p>
          <ul className="eg-bgrid">
            {a.badges.map((b) => (
              <li key={b.years} className={b.earned ? "is-on" : ""}>
                <span className="eg-bico" aria-hidden="true"><Icon name={b.earned ? "trophy" : "lock"} size={18} /></span>
                <b>{t("ac.yearBadge", { n: b.years })}</b>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>
      <Reveal delay={80}>
        <section className="eg-card eg-life" aria-labelledby="lf-title">
          <h2 className="h-h3" id="lf-title"><Icon name="chart" size={20} /> {t("ac.lifetime")}</h2>
          <dl className="eg-life-list">
            <div><dt>{t("ac.s.earned")}</dt><dd>{fmt(d.stats.pointsEarned)}</dd></div>
            <div><dt>{t("ac.s.available")}</dt><dd>{fmt(d.stats.pointsAvailable)}</dd></div>
            <div><dt>{t("ac.s.surveys")}</dt><dd>{fmt(d.stats.surveys)}</dd></div>
            {d.stats.profiles != null ? <div><dt>{t("ac.s.profiles")}</dt><dd>{fmt(d.stats.profiles)}</dd></div> : null}
            <div><dt>{t("ac.s.streak")}</dt><dd>{fmt(d.stats.bestStreak)}</dd></div>
            {d.stats.referrals != null ? <div><dt>{t("ac.s.referrals")}</dt><dd>{fmt(d.stats.referrals)}</dd></div> : null}
          </dl>
        </section>
      </Reveal>
      <Reveal delay={100}>
        <section className="eg-card eg-ident" aria-labelledby="id-title">
          <h2 className="h-h3" id="id-title"><Icon name="id" size={20} /> {t("ac.identity")}</h2>
          <dl className="eg-life-list">
            <div><dt>{t("ac.name")}</dt><dd>{d.identity.name}</dd></div>
            <div><dt>{t("ac.email")}</dt><dd>{d.identity.email} {d.identity.emailVerified ? <span className="eg-pill ok">{t("ma.verified")}</span> : null}</dd></div>
            {d.identity.phone ? <div><dt>{t("ac.phone")}</dt><dd>{d.identity.phone}</dd></div> : null}
            {d.identity.country ? <div><dt>{t("ac.location")}</dt><dd style={{ textTransform: "capitalize" }}>{[d.identity.city, d.identity.country].filter(Boolean).join(", ")}</dd></div> : null}
            {d.identity.memberId ? <div><dt>{t("ac.memberId")}</dt><dd>{d.identity.memberId}</dd></div> : null}
          </dl>
          {d.payout ? (
            <>
              <h3 className="h-h4">{t("ac.payout")}</h3>
              {d.payout.methods.length ? (
                <ul className="eg-receipts">{d.payout.methods.map((m) => <li key={m.method}><b>{m.method === "upi" ? "UPI" : "PayPal"}</b> {m.masked} · {t("ac.lastUsed", { d: when(m.lastUsed) })}</li>)}</ul>
              ) : <p className="h-sub">{t("ac.noPayout")}</p>}
            </>
          ) : null}
        </section>
      </Reveal>
    </div>
  );
}

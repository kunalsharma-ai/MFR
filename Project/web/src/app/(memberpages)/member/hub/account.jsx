"use client";
// My Account as an identity and security center (v2, Nov 2026):
//   ID-card hero with the photo studio → identity checklist (the same items as the profile %) → personal details and
//   location → membership (lifetime numbers + anniversary badges) → payout methods (existing module) → security
//   shortcuts → close account. Social settings moved to Settings › Social & visibility.
import React from "react";
import Link from "next/link";
import Scene3D from "./scene.jsx";
import { api } from "@/util";
import Icon from "./icons.jsx";
import { t } from "./strings";
import { Counter, Reveal, Ring, Skeleton } from "./ui.jsx";
import { GuardianStatus } from "./modules.jsx";
import { fmt } from "./data";
import { useHub } from "./store";
import { useEngage } from "./engage/data";
import { play } from "./sound";
import { locale } from "./prefs";
import { Payment } from "../(member pages)/myaccount/legacy.jsx";

const MAX = 5 * 1024 * 1024;

/* Profile photo: preview → upload (existing POST /api/v1/upload/image) → save (existing PUT /api/v1/me {profilePicture}) */
export function AvatarStudio({ member }) {
  const [phase, setPhase] = React.useState("idle"); // idle | preview | uploading | success | removed | error
  const [preview, setPreview] = React.useState(null);
  const [file, setFile] = React.useState(null);
  const [msg, setMsg] = React.useState("");
  const input = React.useRef(null);
  const current = member?.profilePicture && !String(member.profilePicture).includes("/images/logo/user.png") ? member.profilePicture : null;
  const initials = `${member?.firstname?.[0] || ""}${member?.lastname?.[0] || ""}`.toUpperCase() || "M";
  React.useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
  function pick(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) { setPhase("error"); setMsg(t("av.notImage")); play("error"); return; }
    if (f.size > MAX) { setPhase("error"); setMsg(t("av.tooBig")); play("error"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setPhase("preview");
    setMsg("");
  }
  async function save() {
    if (!file) return;
    setPhase("uploading");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await api.post("/api/v1/upload/image", fd);
      const url = up?.file?.url;
      if (up?.status !== "success" || !url) throw new Error("upload");
      const r = await api.put("/api/v1/me", { profilePicture: url });
      if (r?.status === "error") throw new Error("save");
      setPhase("success");
      setMsg(t("av.success"));
      play("complete");
      member?.Reload?.();
    } catch (e) {
      setPhase("error");
      setMsg(t("av.error"));
      play("error");
    }
  }
  async function remove() {
    setPhase("uploading");
    const r = await api.put("/api/v1/me", { profilePicture: null });
    if (r?.status === "error") { setPhase("error"); setMsg(t("av.error")); return; }
    setPreview(null);
    setFile(null);
    setPhase("removed");
    setMsg(t("av.removed"));
    member?.Reload?.();
  }
  const shown = phase === "preview" || phase === "uploading" ? preview : current;
  return (
    <div className={`av av-${phase}`}>
      <div className="av-frame">
        <span className="av-halo" aria-hidden="true" />
        <span className="av-img">
          {shown ? <img src={shown} alt={t("av.title")} /> : <span className="av-ini">{initials}</span>}
          {phase === "uploading" ? <span className="av-spin" aria-hidden="true" /> : null}
          {phase === "success" ? <span className="av-ok" aria-hidden="true"><Icon name="check" size={28} /></span> : null}
        </span>
        <button type="button" className="av-cam" onClick={() => input.current?.click()} aria-label={current ? t("av.replace") : t("av.upload")}><Icon name="camera" size={18} /></button>
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={pick} />
      <div className="av-actions">
        {phase === "preview" ? (
          <>
            <button type="button" className="h-btn h-btn-primary" onClick={save}><Icon name="check" size={16} /> {t("av.use")}</button>
            <button type="button" className="h-btn h-btn-ghost" onClick={() => { setPhase("idle"); setPreview(null); setFile(null); }}>{t("c.cancel")}</button>
          </>
        ) : phase === "uploading" ? <span className="av-tag">{t("av.uploading")}</span> : (
          <>
            <button type="button" className="h-btn h-btn-soft" onClick={() => input.current?.click()}><Icon name="camera" size={16} /> {current ? t("av.replace") : t("av.upload")}</button>
            {current ? <button type="button" className="h-btn h-btn-ghost" onClick={remove}><Icon name="trash" size={16} /> {t("av.remove")}</button> : null}
          </>
        )}
      </div>
      <p className={`av-msg ${phase}`} role={phase === "error" ? "alert" : "status"}>{msg}</p>
    </div>
  );
}

function EditableRow({ label, icon, value, field, member }) {
  const [edit, setEdit] = React.useState(false);
  const [v, setV] = React.useState(value || "");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  React.useEffect(() => setV(value || ""), [value]);
  return (
    <li className="ma-row">
      <span className="ma-row-ic"><Icon name={icon} size={18} /></span>
      <span className="ma-row-l">{label}</span>
      {edit ? (
        <form className="ma-edit" onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr("");
          const r = await api.patch("/api/v1/me/answer", { [field]: v.trim() });
          if (r && r.status !== "error") {
            const re = await api.post("/api/v1/me", { questions: ["alternate-email", "alternate-phone"] });
            if (re?.data) member?.update?.({ ...member, ...re.data });
            setEdit(false);
            play("complete");
          } else { setErr(t("c.errorTitle")); play("error"); }
          setBusy(false);
        }}>
          <input value={v} onChange={(e) => setV(e.target.value)} aria-label={label} autoFocus />
          <button type="submit" className="h-icon-btn" aria-label={t("c.save")} disabled={busy}><Icon name="check" size={16} /></button>
          <button type="button" className="h-icon-btn" aria-label={t("c.cancel")} onClick={() => { setEdit(false); setV(value || ""); }}><Icon name="close" size={16} /></button>
          {err ? <small className="ma-err" role="alert">{err}</small> : null}
        </form>
      ) : (
        <>
          <span className={`ma-row-v ${value ? "" : "muted"}`}>{value || t("c.notSet")}</span>
          <button type="button" className="h-icon-btn" onClick={() => setEdit(true)} aria-label={`${t("c.edit")} ${label}`}><Icon name={value ? "sliders" : "plus"} size={16} /></button>
        </>
      )}
    </li>
  );
}

const titleCase = (s) => String(s || "").replace(/\b\w/g, (c) => c.toUpperCase());

export function AccountPage() {
  const hub = useHub();
  const { member, type, completion: c, quality, level, pts } = hub;
  const acct = useEngage("account", "/account/summary");
  const since = member?.createdAt ? new Date(member.createdAt) : null;
  const verified = member?.isVerified?.email === "verified";
  const addr = Array.isArray(member?.address) ? member.address[0] || {} : {};
  let countryName = addr.country ? String(addr.country).toUpperCase() : "";
  try {
    if (addr.country && Intl.DisplayNames) countryName = new Intl.DisplayNames(locale(), { type: "region" }).of(String(addr.country).toUpperCase()) || countryName;
  } catch (e) { /* keep the code */ }
  const dob = member?.dob ? new Date(member.dob) : null;
  const idItems = (c?.items || []).filter((i) => i.kind === "account");
  const a = acct.data?.anniversary;
  const life = [
    { k: "pts", label: t("hdr.points"), v: pts?.total, icon: "coin" },
    { k: "earned", label: t("ma2.earned"), v: hub.earned, icon: "chart" },
    { k: "done", label: t("qs.fComplete"), v: hub.completed, icon: "surveys" },
    { k: "prof", label: t("qs.fProfiles"), v: hub.profiles.data?.done, icon: "profile" },
    { k: "streak", label: t("ac.s.streak"), v: acct.data?.stats?.bestStreak, icon: "flame" },
  ].filter((x) => x.v != null || x.k !== "streak");
  return (
    <div className="pg pg-account">
      <section className={`ma-id t-${type}`} aria-labelledby="ma-name" id="identity">
        <div className="ma-id-bg" aria-hidden="true"><i /><i /><i /></div>
        <AvatarStudio member={member} />
        <div className="ma-id-copy">
          <nav className="hx-crumbs" aria-label={t("c.breadcrumb")}><ol><li><Link href="/member/dashboard">{t("nav.dashboard")}</Link></li><li><span aria-current="page">{t("nav.account")}</span></li></ol></nav>
          <h1 className="ma-name" id="ma-name">{member?.fullname || member?.firstname}</h1>
          <p className="ma-badges">
            <span className={`hh-type t-${type}`}>{t(`type.${type}Member`)}</span>
            <span className={`ma-chip ${verified ? "ok" : "warn"}`}><Icon name={verified ? "check" : "mail"} size={14} /> {verified ? t("ma.verified") : t("ma.unverified")}</span>
            {since ? <span className="ma-chip"><Icon name="calendar" size={14} /> {t("ma.since", { d: since.toLocaleDateString(locale(), { month: "long", year: "numeric" }) })}</span> : null}
            <span className="ma-chip"><Icon name="rocket" size={14} /> {t("lv.level", { n: level.n })}</span>
          </p>
          <div className="ma-status"><span>{t("ma.status")}</span><b><i className="ma-live" aria-hidden="true" /> {t("ma.active")}</b></div>
        </div>
        <div className="ma-scene" aria-hidden="true"><Scene3D kind="account" /></div>
        <div className="ma-health">
          <Link href="/member/profiles" className="ma-health-ring" aria-label={`${t("hdr.profile")} ${c?.pct ?? 0}%`}>
            <Ring pct={c?.pct ?? 0} size={96} stroke={8}><b>{c ? `${c.pct}%` : "…"}</b><small>{t("hdr.profile")}</small></Ring>
          </Link>
          {quality ? (
            <Link href="/member/quality" className="ma-health-ring" aria-label={`${t("nav.quality")} ${quality.ten} / 10`}>
              <Ring pct={quality.pct} size={96} stroke={8}><b>{quality.ten.toFixed(1)}</b><small>/10</small></Ring>
            </Link>
          ) : null}
        </div>
      </section>

      <div className="ma-grid">
        <Reveal className="ma-check">
          <section aria-labelledby="mi-title">
            <h2 className="k-title" id="mi-title"><Icon name="shield" size={18} /> {t("ma2.checklist")}</h2>
            <p className="k-note">{t("ma2.checklistHint")}</p>
            <ul className="ma-checks">
              {idItems.map((i) => (
                <li key={i.key} className={i.done ? "on" : ""}>
                  <span className="ma-check-ic" aria-hidden="true"><Icon name={i.done ? "check" : i.icon} size={16} /></span>
                  <span>{t(i.label)}</span>
                  {i.done ? <em>{t("c.done")}</em> : <a href={i.key === "photo" || i.key === "verify" ? "#identity" : "#details"} className="h-link">{t("d2.todo")}</a>}
                </li>
              ))}
              {type === "teen" ? <li className={member?.parent?.consent === true ? "on" : ""}><span className="ma-check-ic" aria-hidden="true"><Icon name="shield" size={16} /></span><span>{t("ma.guardian")}</span><em>{member?.parent?.consent === true ? t("ma.guardianDone") : t("gt.pending")}</em></li> : null}
            </ul>
          </section>
        </Reveal>

        <Reveal className="ma-details" delay={60}>
          <section aria-labelledby="md-title" id="details">
            <h2 className="k-title" id="md-title"><Icon name="id" size={18} /> {t("ma.details")}</h2>
            <ul className="ma-rows">
              <li className="ma-row"><span className="ma-row-ic"><Icon name="calendar" size={18} /></span><span className="ma-row-l">{t("ma.dob")}</span><span className="ma-row-v">{dob ? dob.toLocaleDateString(locale()) : "–"}</span><Icon name="lock" size={14} className="ma-lock" /></li>
              <li className="ma-row"><span className="ma-row-ic"><Icon name="mail" size={18} /></span><span className="ma-row-l">{t("ma.email")}</span><span className="ma-row-v">{member?.mail}</span><Icon name="lock" size={14} className="ma-lock" /></li>
              <EditableRow label={t("ma.altEmail")} icon="mail" value={member?.["alternate-email"]} field="alternate-email" member={member} />
              <li className="ma-row"><span className="ma-row-ic"><Icon name="support" size={18} /></span><span className="ma-row-l">{t("ma.phone")}</span><span className={`ma-row-v ${member?.phone ? "" : "muted"}`}>{member?.phone ? `+${String(member.phone).replace(/^\+/, "")}` : t("c.notSet")}</span><Icon name="lock" size={14} className="ma-lock" /></li>
              <EditableRow label={t("ma.altPhone")} icon="support" value={member?.["alternate-phone"]} field="alternate-phone" member={member} />
            </ul>
            <p className="k-note"><Icon name="lock" size={13} /> {t("ma2.lockedHint")}</p>
          </section>
        </Reveal>

        <Reveal className="ma-location">
          <section aria-labelledby="ml-title">
            <h2 className="k-title" id="ml-title"><Icon name="pin" size={18} /> {t("ma.location")}</h2>
            <ol className="ma-geo">
              {[[t("ma.country"), countryName], [t("ma.state"), titleCase(addr.state)], [t("ma.city"), titleCase(addr.city)], [t("ma.zip"), String(addr.zipcode || "").toUpperCase()]].map(([l, v], i) => (
                <li key={l} style={{ "--i": i }}><small>{l}</small><b className={v ? "" : "muted"}>{v || t("c.notSet")}</b></li>
              ))}
            </ol>
          </section>
        </Reveal>

        <Reveal className="ma-member" delay={60}>
          <section aria-labelledby="mm-title">
            <h2 className="k-title" id="mm-title"><Icon name="chart" size={18} /> {t("ma2.membership")}</h2>
            <ul className="ma-life">
              {life.map((n) => <li key={n.k}><Icon name={n.icon} size={18} /><b>{n.v == null ? "…" : <Counter value={n.v} />}</b><small>{n.label}</small></li>)}
            </ul>
            {acct.isLoading ? <Skeleton h={60} /> : a ? (
              <>
                <p className="k-note">{a.years ? t("ac.years", { n: a.years }) : t("ac.firstYear")} · {t("ac.next", { n: a.daysToNext })}</p>
                <ul className="ma-anniv">{a.badges.map((b) => <li key={b.years} className={b.earned ? "on" : ""}><Icon name={b.earned ? "trophy" : "lock"} size={16} /> {t("ac.yearBadge", { n: b.years })}</li>)}</ul>
              </>
            ) : null}
          </section>
        </Reveal>

        {type === "teen" ? <Reveal className="ma-guardian"><GuardianStatus member={member} /></Reveal> : null}

        <Reveal className="ma-wallet">
          <section aria-labelledby="mw-title" className="ma-legacy">
            <h2 className="k-title" id="mw-title"><Icon name="wallet" size={18} /> {t("ma.payments")}</h2>
            <Payment />
          </section>
        </Reveal>

        <Reveal className="ma-sec" delay={60}>
          <section aria-labelledby="msx-title">
            <h2 className="k-title" id="msx-title"><Icon name="lock" size={18} /> {t("ma2.security")}</h2>
            <ul className="ma-links">
              <li><Link href="/member/settings#st-security"><Icon name="lock" size={18} /> <span><b>{t("st.pwChange")}</b><small>{t("ma2.pwHint")}</small></span><Icon name="chevron" size={16} /></Link></li>
              <li><Link href="/member/settings#st-social"><Icon name="users" size={18} /> <span><b>{t("st.social")}</b><small>{t("ma2.socialHint")}</small></span><Icon name="chevron" size={16} /></Link></li>
              <li><Link href="/member/settings#st-notifications"><Icon name="bell" size={18} /> <span><b>{t("st.notifications")}</b><small>{t("ma2.notifHint")}</small></span><Icon name="chevron" size={16} /></Link></li>
              <li><Link href="/member/settings#st-security"><Icon name="layers" size={18} /> <span><b>{t("st.dataControls")}</b><small>{t("ma2.dataHint")}</small></span><Icon name="chevron" size={16} /></Link></li>
            </ul>
          </section>
        </Reveal>

        <Reveal className="ma-close">
          <section aria-labelledby="mc-title">
            <h2 className="k-title" id="mc-title">{t("ma.close")}</h2>
            <p>{t("ma.closeText")}</p>
            <Link href="/member/help?ask=account" className="h-btn h-btn-soft">{t("ma.closeCta")} <Icon name="arrow" size={16} /></Link>
          </section>
        </Reveal>
      </div>
    </div>
  );
}

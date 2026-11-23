"use client";
// My Account as a "member identity center": a large identity card, the profile-photo studio, personal numbers,
// details and location, then the existing payment and social modules (unchanged, from myaccount/legacy.jsx).
import React from "react";
import Link from "next/link";
import { useMember } from "@/Context";
import { api } from "@/util";
import Icon from "./icons.jsx";
import { t } from "./strings";
import { Counter, Reveal, Ring } from "./ui.jsx";
import { GuardianStatus } from "./modules.jsx";
import { memberTypeOf, usePoints, useStats, useProfiles, useLedger, qualityOf, fmt } from "./data";
import { play } from "./sound";
import { Payment, SocialAccounts } from "../(member pages)/myaccount/legacy.jsx";

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
    if (!f.type.startsWith("image/")) {
      setPhase("error");
      setMsg(t("av.notImage"));
      return;
    }
    if (f.size > MAX) {
      setPhase("error");
      setMsg(t("av.tooBig"));
      return;
    }
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
    }
  }
  async function remove() {
    setPhase("uploading");
    const r = await api.put("/api/v1/me", { profilePicture: null });
    if (r?.status === "error") {
      setPhase("error");
      setMsg(t("av.error"));
      return;
    }
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
        <button type="button" className="av-cam" onClick={() => input.current?.click()} aria-label={current ? t("av.replace") : t("av.upload")}>
          <Icon name="camera" size={18} />
        </button>
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={pick} />
      <div className="av-actions">
        {phase === "preview" ? (
          <>
            <span className="av-tag">{t("av.preview")}</span>
            <button type="button" className="h-btn h-btn-primary" onClick={save}><Icon name="check" size={16} /> {t("av.use")}</button>
            <button type="button" className="h-btn h-btn-ghost" onClick={() => { setPhase("idle"); setPreview(null); setFile(null); }}>{t("c.cancel")}</button>
          </>
        ) : phase === "uploading" ? (
          <span className="av-tag">{t("av.uploading")}</span>
        ) : (
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
  React.useEffect(() => setV(value || ""), [value]);
  return (
    <li className="ma-row">
      <span className="ma-row-ic"><Icon name={icon} size={18} /></span>
      <span className="ma-row-l">{label}</span>
      {edit ? (
        <form
          className="ma-edit"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const r = await api.patch("/api/v1/me/answer", { [field]: v.trim() });
            if (r && r.status !== "error") {
              const re = await api.post("/api/v1/me", { questions: ["alternate-email", "alternate-phone"] });
              if (re?.data) member?.update?.({ ...member, ...re.data });
              setEdit(false);
              play("complete");
            }
            setBusy(false);
          }}
        >
          <input value={v} onChange={(e) => setV(e.target.value)} aria-label={label} autoFocus />
          <button type="submit" className="h-icon-btn" aria-label={t("c.save")} disabled={busy}><Icon name="check" size={16} /></button>
          <button type="button" className="h-icon-btn" aria-label={t("c.cancel")} onClick={() => { setEdit(false); setV(value || ""); }}><Icon name="close" size={16} /></button>
        </form>
      ) : (
        <>
          <span className={`ma-row-v ${value ? "" : "muted"}`}>{value || t("c.notSet")}</span>
          <button type="button" className="h-icon-btn" onClick={() => setEdit(true)} aria-label={`${t("c.edit")} ${label}`}><Icon name="plus" size={16} /></button>
        </>
      )}
    </li>
  );
}

const titleCase = (s) => String(s || "").replace(/\b\w/g, (c) => c.toUpperCase());

export function AccountPage() {
  const member = useMember();
  const type = memberTypeOf(member);
  const points = usePoints();
  const stats = useStats();
  const profiles = useProfiles();
  const ledger = useLedger();
  const q = qualityOf(member);
  const since = member?.createdAt ? new Date(member.createdAt) : null;
  const verified = member?.isVerified?.email === "verified";
  const addr = Array.isArray(member?.address) ? member.address[0] || {} : {};
  let countryName = addr.country ? String(addr.country).toUpperCase() : "";
  try {
    if (addr.country && typeof Intl !== "undefined" && Intl.DisplayNames) countryName = new Intl.DisplayNames(undefined, { type: "region" }).of(String(addr.country).toUpperCase()) || countryName;
  } catch (e) {
    /* keep the code */
  }
  const dob = member?.dob ? new Date(member.dob) : null;
  const numbers = [
    { k: "pts", label: t("hdr.points"), v: points.data?.total, icon: "coin" },
    { k: "done", label: t("qs.fComplete"), v: stats.data?.complete, icon: "surveys" },
    { k: "prof", label: t("qs.fProfiles"), v: profiles.data?.done, icon: "profile" },
    { k: "acts", label: t("nav.activity"), v: ledger.data?.length, icon: "activity" },
  ];
  return (
    <div className="pg pg-account">
      <section className={`ma-id t-${type}`} aria-labelledby="ma-name">
        <div className="ma-id-bg" aria-hidden="true"><i /><i /></div>
        <AvatarStudio member={member} />
        <div className="ma-id-copy">
          <p className="h-eyebrow">{t("ma.eyebrow")}</p>
          <h1 className="h-display" id="ma-name">{member?.fullname || member?.firstname}</h1>
          <p className="ma-badges">
            <span className={`hh-type t-${type}`}>{t(`type.${type}Member`)}</span>
            <span className={`ma-chip ${verified ? "ok" : "warn"}`}><Icon name={verified ? "check" : "mail"} size={14} /> {verified ? t("ma.verified") : t("ma.unverified")}</span>
            {since ? <span className="ma-chip"><Icon name="calendar" size={14} /> {t("ma.since", { d: since.toLocaleDateString(undefined, { month: "long", year: "numeric" }) })}</span> : null}
          </p>
          <div className="ma-status">
            <span>{t("ma.status")}</span>
            <b><i className="ma-live" aria-hidden="true" /> {t("ma.active")}</b>
          </div>
        </div>
        {q ? (
          <Link href="/member/quality" className="ma-q" aria-label={`${t("nav.quality")} ${q.score}`}>
            <Ring pct={q.pct ?? 0} size={104} stroke={9}>
              <b>{q.score}</b>
              {q.scale ? <small>/ {q.scale}</small> : null}
            </Ring>
            <span>{t("nav.quality")}</span>
          </Link>
        ) : null}
      </section>

      <Reveal>
        <ul className="ma-numbers" aria-label={t("ma.stats")}>
          {numbers.map((n, i) => (
            <li key={n.k} style={{ "--i": i }}>
              <Icon name={n.icon} size={20} />
              <b>{n.v == null ? "…" : <Counter value={n.v} />}</b>
              <small>{n.label}</small>
            </li>
          ))}
        </ul>
      </Reveal>

      <div className="ma-grid">
        <Reveal className="ma-details">
          <section aria-labelledby="md-title">
            <h2 className="h-h3" id="md-title"><Icon name="id" size={20} /> {t("ma.details")}</h2>
            <ul className="ma-rows">
              <li className="ma-row"><span className="ma-row-ic"><Icon name="calendar" size={18} /></span><span className="ma-row-l">{t("ma.dob")}</span><span className="ma-row-v">{dob ? dob.toLocaleDateString() : "–"}</span></li>
              <li className="ma-row"><span className="ma-row-ic"><Icon name="mail" size={18} /></span><span className="ma-row-l">{t("ma.email")}</span><span className="ma-row-v">{member?.mail}</span></li>
              <EditableRow label={t("ma.altEmail")} icon="mail" value={member?.["alternate-email"]} field="alternate-email" member={member} />
              <li className="ma-row"><span className="ma-row-ic"><Icon name="support" size={18} /></span><span className="ma-row-l">{t("ma.phone")}</span><span className="ma-row-v">{member?.phone ? `+${String(member.phone).replace(/^\+/, "")}` : "–"}</span></li>
              <EditableRow label={t("ma.altPhone")} icon="support" value={member?.["alternate-phone"]} field="alternate-phone" member={member} />
            </ul>
          </section>
        </Reveal>
        <Reveal className="ma-location" delay={60}>
          <section aria-labelledby="ml-title">
            <h2 className="h-h3" id="ml-title"><Icon name="pin" size={20} /> {t("ma.location")}</h2>
            <ol className="ma-geo">
              {[
                [t("ma.country"), countryName],
                [t("ma.state"), titleCase(addr.state)],
                [t("ma.city"), titleCase(addr.city)],
                [t("ma.zip"), String(addr.zipcode || "").toUpperCase()],
              ].map(([l, v], i) => (
                <li key={l} style={{ "--i": i }}>
                  <small>{l}</small>
                  <b className={v ? "" : "muted"}>{v || t("c.notSet")}</b>
                </li>
              ))}
            </ol>
          </section>
        </Reveal>
        {type === "teen" ? <Reveal className="ma-guardian"><GuardianStatus member={member} /></Reveal> : null}
        <Reveal className="ma-wallet">
          <section aria-labelledby="mw-title" className="ma-legacy">
            <h2 className="h-h3" id="mw-title"><Icon name="wallet" size={20} /> {t("ma.payments")}</h2>
            <Payment />
          </section>
        </Reveal>
        <Reveal className="ma-socials" delay={60}>
          <section aria-labelledby="ms-title" className="ma-legacy">
            <h2 className="h-h3" id="ms-title"><Icon name="share" size={20} /> {t("ma.socials")}</h2>
            <SocialAccounts user={member} />
          </section>
        </Reveal>
        <Reveal className="ma-close">
          <section aria-labelledby="mc-title">
            <h2 className="h-h3" id="mc-title">{t("ma.close")}</h2>
            <p>{t("ma.closeText")}</p>
            <Link href="/member/help?ask=account" className="h-btn h-btn-soft">{t("ma.closeCta")} <Icon name="arrow" size={16} /></Link>
          </section>
        </Reveal>
      </div>
    </div>
  );
}

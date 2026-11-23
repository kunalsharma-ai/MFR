"use client";
// Settings as a personalization control center (v2, Nov 2026). Category tiles on the left (a strip on phones), one
// panel per category on the right, each with its own controls and a live preview where it helps:
//   Appearance · Accessibility · Language & region · Sound · Notifications · Survey preferences ·
//   Social & visibility · Privacy & security · (Teen) Guardian · App · Account
import React from "react";
import Link from "next/link";
import { useMember } from "@/Context";
import { api } from "@/util";
import { LANGUAGES } from "@/i18n/languages";
import Icon from "./icons.jsx";
import { t } from "./strings";
import { Hero, LoadingBlock, Meter } from "./ui.jsx";
import { SurveyPrefs, EngageNotifications, PrivacyCentre, GuardianTab } from "./engage/settings.jsx";
import { usePreferences, useSavePreferences } from "./engage/data";
import { InstallApp } from "./engage/pwa.jsx";
import { PaletteList } from "./Shell.jsx";
import { memberTypeOf, money } from "./data";
import { usePrefs, setPrefs, MODES, DENSITIES, TEXT_SIZES, CONTRASTS, MOTIONS, currentLanguage, setLanguage, languageOf, resolvedMode, locale } from "./prefs";
import { play, SOUND_CATEGORIES } from "./sound";

function Toggle({ checked, onChange, label, hint, disabled }) {
  return (
    <label className={`st-toggle ${disabled ? "is-off" : ""}`}>
      <span><b>{label}</b>{hint ? <small>{hint}</small> : null}</span>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => { onChange(e.target.checked); play("tap"); }} />
      <i aria-hidden="true" />
    </label>
  );
}

function Seg({ label, value, options, onChange, render }) {
  return (
    <div className="st-seg-row">
      <span className="st-seg-l">{label}</span>
      <div className="st-seg" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={value === o} className={value === o ? "on" : ""} onClick={() => { onChange(o); play("tap"); }}>{render ? render(o) : o}</button>
        ))}
      </div>
    </div>
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
  if (!sel) return <LoadingBlock lines={3} h={120} />;
  const changed = JSON.stringify([...sel].sort()) !== JSON.stringify([...init].sort());
  return (
    <div className="st-channels">
      <p className="st-sub">{t("st.channelsWhere")}</p>
      <div className="st-chan-grid">
        {CHANNELS.map((c) => (
          <label key={c.value} className={`st-chan ${sel.includes(c.value) ? "on" : ""}`}>
            <input type="checkbox" checked={sel.includes(c.value)} onChange={() => setSel((s) => (s.includes(c.value) ? s.filter((x) => x !== c.value) : [...s, c.value]))} />
            <Icon name={c.icon} size={20} />
            <span>{t(c.label)}</span>
            <i className="st-chan-tick" aria-hidden="true"><Icon name="check" size={12} /></i>
          </label>
        ))}
      </div>
      <div className="st-row-end">
        <span role="status" className="st-status">{st}</span>
        <button type="button" className="h-btn h-btn-primary" disabled={!changed || st === t("c.saving")}
          onClick={async () => {
            setSt(t("c.saving"));
            const r = await api.patch("/api/v1/me/answer", { "communication-methods": sel });
            if (r && r.status !== "error") { setInit(sel); setSt(t("c.saved")); play("complete"); } else { setSt(t("c.errorTitle")); play("error"); }
          }}>{t("c.save")}</button>
      </div>
    </div>
  );
}

function PasswordForm() {
  const [v, setV] = React.useState({ oldPassword: "", newPassword: "", cnfPassword: "" });
  const [msg, setMsg] = React.useState({ k: "", text: "" });
  const [show, setShow] = React.useState(false);
  const err = v.newPassword && v.newPassword.length < 8 ? t("st.pwShort") : v.cnfPassword && v.cnfPassword !== v.newPassword ? t("st.pwMismatch") : "";
  const strength = Math.min(4, [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(v.newPassword)).length);
  return (
    <form className="st-pw" noValidate onSubmit={async (e) => {
      e.preventDefault();
      if (err || !v.oldPassword || !v.newPassword) { setMsg({ k: "error", text: err || t("st.pwShort") }); play("error"); return; }
      setMsg({ k: "busy", text: t("c.saving") });
      const r = await api.patch("/api/v1/me", v);
      if (r && r.status === "success") { setV({ oldPassword: "", newPassword: "", cnfPassword: "" }); setMsg({ k: "ok", text: r.message || t("c.saved") }); play("complete"); }
      else { setMsg({ k: "error", text: (r && r.message) || t("c.errorTitle") }); play("error"); }
    }}>
      {[["oldPassword", "st.oldPw", "current-password"], ["newPassword", "st.newPw", "new-password"], ["cnfPassword", "st.cnfPw", "new-password"]].map(([k, l, ac]) => (
        <label key={k} className="st-field">
          <span>{t(l)}</span>
          <input type={show ? "text" : "password"} autoComplete={ac} value={v[k]} onChange={(e) => setV((s) => ({ ...s, [k]: e.target.value }))} aria-invalid={Boolean(err && k !== "oldPassword")} />
        </label>
      ))}
      {v.newPassword ? <div className={`st-strength s${strength}`}><Meter pct={strength * 25} label={t("st.pwStrength")} /><small>{t(`st.pw${strength}`)}</small></div> : null}
      <label className="st-check"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> {t("st.pwShow")}</label>
      {err ? <p className="st-err" role="alert">{err}</p> : null}
      <div className="st-row-end">
        <span role="status" className={`st-status ${msg.k}`}>{msg.text}</span>
        <button type="submit" className="h-btn h-btn-primary">{t("st.pwChange")}</button>
      </div>
    </form>
  );
}

function deviceName() {
  if (typeof navigator === "undefined") return "";
  const ua = navigator.userAgent;
  const b = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : t("st.browser");
  const o = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return [b, o].filter(Boolean).join(" · ");
}

function Session() {
  const member = useMember();
  const [dev, setDev] = React.useState("");
  React.useEffect(() => setDev(deviceName()), []);
  return (
    <div className="st-session">
      <span className="st-session-ic"><Icon name="device" size={22} /></span>
      <span><b>{dev || "…"}</b><small>{t("st.thisDevice")}</small></span>
      <button type="button" className="h-btn h-btn-soft" onClick={() => (member?.Logout ? member.Logout() : null)}><Icon name="logout" size={16} /> {t("st.signOut")}</button>
    </div>
  );
}

/* ---------------- Social & visibility ---------------- */
const NETWORKS = [
  { key: "instagram", name: "Instagram", c: "#E1306C", ph: "@yourname" },
  { key: "facebook", name: "Facebook", c: "#1877F2", ph: "facebook.com/yourname" },
  { key: "linkedin", name: "LinkedIn", c: "#0A66C2", ph: "linkedin.com/in/yourname" },
  { key: "youtube", name: "YouTube", c: "#FF0000", ph: "@yourchannel" },
  { key: "x", name: "X", c: "#111111", ph: "@yourname" },
];

function NetworkCard({ n, value, member }) {
  const [edit, setEdit] = React.useState(false);
  const [v, setV] = React.useState(value || "");
  const [st, setSt] = React.useState("");
  React.useEffect(() => setV(value || ""), [value]);
  async function save(next) {
    setSt(t("c.saving"));
    const r = await api.patch("/api/v1/me/answer", { [`social-media-${n.key}`]: next });
    if (r && r.status !== "error") { setSt(""); setEdit(false); play("complete"); member?.Reload?.(); } else { setSt(t("c.errorTitle")); play("error"); }
  }
  const on = Boolean(value);
  return (
    <li className={`so-card ${on ? "on" : ""}`} style={{ "--net": n.c }}>
      <span className="so-logo" aria-hidden="true">{n.name.charAt(0)}</span>
      <span className="so-id"><b>{n.name}</b><small>{on ? value : t("so.notLinked")}</small></span>
      {edit ? (
        <form className="so-edit" onSubmit={(e) => { e.preventDefault(); save(v.trim()); }}>
          <input value={v} onChange={(e) => setV(e.target.value)} placeholder={n.ph} aria-label={`${n.name} ${t("so.handle")}`} autoFocus />
          <button type="submit" className="h-btn h-btn-primary">{t("c.save")}</button>
          <button type="button" className="h-btn h-btn-ghost" onClick={() => { setEdit(false); setV(value || ""); }}>{t("c.cancel")}</button>
        </form>
      ) : (
        <span className="so-act">
          <span className={`so-state ${on ? "on" : ""}`}><Icon name={on ? "check" : "plus"} size={12} /> {on ? t("so.linked") : t("so.add")}</span>
          <button type="button" className="h-btn h-btn-soft" onClick={() => setEdit(true)}>{on ? t("c.edit") : t("so.link")}</button>
          {on ? <button type="button" className="h-icon-btn" aria-label={`${t("so.unlink")} ${n.name}`} onClick={() => save("")}><Icon name="trash" size={14} /></button> : null}
        </span>
      )}
      {st ? <small className="so-st" role="status">{st}</small> : null}
    </li>
  );
}

export function SocialCenter({ teen }) {
  const member = useMember();
  const p = usePreferences();
  const save = useSavePreferences();
  const opt = Boolean(p.data?.leaderboard?.optIn);
  const linked = NETWORKS.filter((n) => member?.[`social-media-${n.key}`]).length;
  return (
    <div className="so">
      <div className="so-summary">
        <div className="so-orbit" aria-hidden="true">
          <span className="so-me">{(member?.firstname || "M").charAt(0)}</span>
          {NETWORKS.map((n, i) => <i key={n.key} className={member?.[`social-media-${n.key}`] ? "on" : ""} style={{ "--i": i, "--net": n.c }} />)}
        </div>
        <div>
          <b>{t("so.summary", { n: linked, m: NETWORKS.length })}</b>
          <small>{t("so.summaryHint")}</small>
        </div>
      </div>
      <h3 className="st-sub">{t("so.networks")}</h3>
      <ul className="so-list">{NETWORKS.map((n) => <NetworkCard key={n.key} n={n} value={member?.[`social-media-${n.key}`]} member={member} />)}</ul>
      <h3 className="st-sub">{t("so.visibility")}</h3>
      <div className="so-vis">
        <div className="so-vis-row">
          <span className="so-vis-ic"><Icon name="eyeOff" size={18} /></span>
          <span><b>{t("so.profileVis")}</b><small>{t("so.profileVisHint")}</small></span>
          <span className="so-pill">{t("so.private")}</span>
        </div>
        {!teen ? (
          <Toggle checked={opt} disabled={p.isLoading || p.isError || save.isPending} onChange={(v) => save.mutate({ leaderboard: { optIn: v } })} label={t("so.discover")} hint={p.isError ? t("so.discoverOff") : t("so.discoverHint")} />
        ) : <p className="st-foot">{t("so.teenNote")}</p>}
        <div className="so-vis-row">
          <span className="so-vis-ic"><Icon name="referrals" size={18} /></span>
          <span><b>{t("so.connections")}</b><small>{teen ? t("so.connectionsTeen") : t("so.connectionsHint")}</small></span>
          {!teen ? <Link href="/member/referrals" className="h-btn h-btn-soft">{t("so.manage")}</Link> : null}
        </div>
        <div className="so-vis-row">
          <span className="so-vis-ic"><Icon name="mail" size={18} /></span>
          <span><b>{t("so.comms")}</b><small>{t("so.commsHint")}</small></span>
          <a href="#st-notifications" className="h-btn h-btn-soft">{t("so.manage")}</a>
        </div>
      </div>
    </div>
  );
}

/* ---------------- panels ---------------- */
function ThemePreview({ mode }) {
  return (
    <span className={`st-mini m-${mode}`} aria-hidden="true">
      <i className="bar" /><i className="side" /><i className="c1" /><i className="c2" /><i className="c3" />
    </span>
  );
}

function RegionSample() {
  const now = new Date();
  const loc = locale();
  let date = "", num = "", cur = "";
  try {
    date = now.toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    num = new Intl.NumberFormat(loc).format(1234567.89);
    cur = money(15000, 0.001);
  } catch (e) { /* unsupported locale: the browser default is used */ }
  return (
    <dl className="st-region">
      <div><dt>{t("st.date")}</dt><dd>{date}</dd></div>
      <div><dt>{t("st.number")}</dt><dd>{num}</dd></div>
      <div><dt>{t("st.currency")}</dt><dd>{cur}</dd></div>
    </dl>
  );
}

function Panel({ c, children, wide }) {
  return (
    <section id={`st-${c.id}`} className={`st-card c-${c.id} ${wide ? "wide" : ""}`} aria-labelledby={`st-${c.id}-t`}>
      <header><span className="st-ic"><Icon name={c.icon} size={20} /></span><div><h2 id={`st-${c.id}-t`}>{t(c.label)}</h2><p>{t(c.hint)}</p></div></header>
      {children}
    </section>
  );
}

export function SettingsPage() {
  const member = useMember();
  const prefs = usePrefs();
  const type = memberTypeOf(member);
  const teen = type === "teen";
  const [lang, setLang] = React.useState("en");
  React.useEffect(() => setLang(currentLanguage()), [prefs]);
  const L = languageOf(lang);
  const cats = [
    { id: "appearance", icon: "palette", label: "st.appearance", hint: "st.appearanceHint" },
    { id: "access", icon: "eye", label: "st.access", hint: "st.accessHint" },
    { id: "language", icon: "globe", label: "st.language", hint: "st.languageHint" },
    { id: "sound", icon: "soundOn", label: "st.sound", hint: "st.soundHint" },
    { id: "notifications", icon: "bell", label: "st.notifications", hint: "st.notificationsHint" },
    { id: "surveyprefs", icon: "surveys", label: "sp.title", hint: "sp.hint" },
    { id: "social", icon: "users", label: "st.social", hint: "st.socialHint" },
    { id: "security", icon: "lock", label: "st.securityPrivacy", hint: "st.securityHint" },
    ...(teen ? [{ id: "guardian", icon: "shield", label: "gt.title", hint: "gt.hint" }] : []),
    { id: "app", icon: "rocket", label: "pw.title", hint: "pw.hint" },
    { id: "account", icon: "account", label: "st.account", hint: "st.accountHint" },
  ];
  const [active, setActive] = React.useState("appearance");
  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const els = cats.map((c) => document.getElementById(`st-${c.id}`)).filter(Boolean);
    const io = new IntersectionObserver((es) => {
      const v = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (v) setActive(v.target.id.replace("st-", ""));
    }, { rootMargin: "-25% 0px -65% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [teen]); // eslint-disable-line react-hooks/exhaustive-deps
  const mode = resolvedMode(prefs);
  const P = (id) => cats.find((x) => x.id === id);
  return (
    <div className="pg pg-settings">
      <Hero
        kind="settings"
        id="st-title"
        crumbs={[{ label: t("nav.dashboard"), href: "/member/dashboard" }, { label: t("nav.settings") }]}
        eyebrow={t("st.eyebrow")}
        title={t("st.title")}
        sub={t("st.sub")}
        status={
          <ul className="st-now">
            <li><Icon name={{ light: "sun", dark: "moon", night: "night", system: "device" }[prefs.mode]} size={15} /> {t(`mode.${prefs.mode}`)}</li>
            <li><Icon name="palette" size={15} /> {t(`pal.${prefs.palette}`)}</li>
            <li className="notranslate"><Icon name="globe" size={15} /> {L.native}</li>
            <li><Icon name={prefs.sound ? "soundOn" : "soundOff"} size={15} /> {prefs.sound ? t("hdr.soundOn") : t("hdr.soundOff")}</li>
          </ul>
        }
        art={<div className="st-art"><ThemePreview mode={mode} /><span className="st-knob k1" /><span className="st-knob k2" /><span className="st-knob k3" /></div>}
      />
      <div className="st-layout">
        <nav className="st-index" aria-label={t("st.title")}>
          {cats.map((c) => (
            <a key={c.id} href={`#st-${c.id}`} className={active === c.id ? "on" : ""} aria-current={active === c.id ? "true" : undefined}>
              <Icon name={c.icon} size={18} /> <span>{t(c.label)}</span>
            </a>
          ))}
        </nav>
        <div className="st-panels">
          <Panel c={P("appearance")} wide>
            <h3 className="st-sub">{t("hdr.mode")}</h3>
            <div className="st-modes" role="radiogroup" aria-label={t("hdr.mode")}>
              {MODES.map((k) => (
                <button key={k} type="button" role="radio" aria-checked={prefs.mode === k} className={`st-mode ${prefs.mode === k ? "on" : ""}`} onClick={() => { setPrefs({ mode: k }); play("tap"); }}>
                  <ThemePreview mode={k === "system" ? "system" : k} />
                  <b>{t(`mode.${k}`)}</b>
                  <small>{t(`mode.${k}Hint`)}</small>
                </button>
              ))}
            </div>
            <h3 className="st-sub">{t("st.palette")}</h3>
            <PaletteList prefs={prefs} type={type} withCustom />
            {prefs.palette === "custom" ? (
              <label className="st-color">
                <span>{t("st.custom")}</span>
                <input type="color" value={prefs.custom} onChange={(e) => setPrefs({ custom: e.target.value })} />
                <code>{prefs.custom.toUpperCase()}</code>
                <small>{t("st.customHint")}</small>
              </label>
            ) : null}
            {prefs.palette === "midnight" && prefs.mode === "light" ? <p className="st-foot"><Icon name="moon" size={14} /> {t("st.midnightNote")}</p> : null}
            <Seg label={t("st.density")} value={prefs.density} options={DENSITIES} onChange={(v) => setPrefs({ density: v })} render={(o) => t(`st.d.${o}`)} />
            <div className="st-preview" aria-label={t("st.preview")}>
              <span className="h-btn h-btn-primary" aria-hidden="true">{t("op.go")}</span>
              <Meter pct={68} label={t("st.preview")} />
              <span className="st-preview-chip">+120 {t("c.pts")}</span>
              <span className="h-state s-done"><Icon name="check" size={14} /> {t("svc.st.done")}</span>
            </div>
            <p className="st-foot">{t("st.storedHere")}</p>
          </Panel>

          <Panel c={P("access")}>
            <Seg label={t("st.motion")} value={prefs.motion} options={MOTIONS} onChange={(v) => setPrefs({ motion: v })} render={(o) => t(`st.m.${o}`)} />
            <Seg label={t("st.textSize")} value={prefs.text} options={TEXT_SIZES} onChange={(v) => setPrefs({ text: v })} render={(o) => <span style={{ fontSize: `${o * 0.14}px` }}>A</span>} />
            <Seg label={t("st.contrast")} value={prefs.contrast} options={CONTRASTS} onChange={(v) => setPrefs({ contrast: v })} render={(o) => t(`st.c.${o}`)} />
            <Toggle checked={prefs.focusAlways} onChange={(v) => setPrefs({ focusAlways: v })} label={t("st.focus")} hint={t("st.focusHint")} />
            <div className="st-keys">
              <p className="st-sub"><Icon name="keyboard" size={16} /> {t("st.keys")}</p>
              <ul>
                <li><kbd>Tab</kbd> {t("st.kTab")}</li>
                <li><kbd>Enter</kbd> / <kbd>Space</kbd> {t("st.kEnter")}</li>
                <li><kbd>Esc</kbd> {t("st.kEsc")}</li>
              </ul>
            </div>
          </Panel>

          <Panel c={P("language")}>
            <label className="st-field">
              <span>{t("hdr.language")}</span>
              <select className="notranslate" value={lang} onChange={(e) => { setLang(e.target.value); setLanguage(e.target.value); }}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.native} · {l.name}{l.dir === "rtl" ? " (RTL)" : ""}</option>)}
              </select>
            </label>
            <RegionSample />
            {L.dir === "rtl" ? <p className="st-foot"><Icon name="globe2" size={14} /> {t("st.rtlOn")}</p> : <p className="st-foot">{t("st.rtlHint")}</p>}
          </Panel>

          <Panel c={P("sound")}>
            <Toggle checked={prefs.sound} onChange={(v) => { setPrefs({ sound: v }); if (v) setTimeout(() => play("reward"), 0); }} label={t("st.soundAll")} hint={t("st.soundAllHint")} />
            <ul className="st-sounds">
              {SOUND_CATEGORIES.map((c) => (
                <li key={c.key}>
                  <Toggle checked={prefs[c.key]} disabled={!prefs.sound} onChange={(v) => setPrefs({ [c.key]: v })} label={t(`st.${c.key}`)} hint={t(`st.${c.key}Hint`)} />
                  <button type="button" className="h-icon-btn" disabled={!prefs.sound || !prefs[c.key]} onClick={() => play(c.sample)} aria-label={`${t("st.soundTest")}: ${t(`st.${c.key}`)}`}><Icon name="play" size={16} /></button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel c={P("notifications")} wide>
            <NotificationPrefs />
            <EngageNotifications teen={teen} />
          </Panel>

          <Panel c={P("surveyprefs")}><SurveyPrefs /></Panel>

          <Panel c={P("social")} wide><SocialCenter teen={teen} /></Panel>

          <Panel c={P("security")} wide>
            <div className="st-split">
              <div>
                <h3 className="st-sub"><Icon name="lock" size={16} /> {t("st.password")}</h3>
                <PasswordForm />
              </div>
              <div>
                <h3 className="st-sub"><Icon name="device" size={16} /> {t("st.sessions")}</h3>
                <Session />
                <h3 className="st-sub"><Icon name="shield" size={16} /> {t("st.privacy")}</h3>
                <div className="st-links">
                  <a href={teen ? "/teen-terms" : "/terms"} target="_blank" rel="noopener" className="h-btn h-btn-soft">{t("st.terms")} <Icon name="arrow" size={16} /></a>
                  <a href="/privacy" target="_blank" rel="noopener" className="h-btn h-btn-soft">{t("st.privacyPolicy")} <Icon name="arrow" size={16} /></a>
                </div>
              </div>
            </div>
            <h3 className="st-sub"><Icon name="layers" size={16} /> {t("st.dataControls")}</h3>
            <PrivacyCentre teen={teen} />
          </Panel>

          {teen ? <Panel c={P("guardian")}><GuardianTab /></Panel> : null}

          <Panel c={P("app")}><InstallApp /></Panel>

          <Panel c={P("account")}>
            <div className="st-links">
              <Link href="/member/myaccount" className="h-btn h-btn-soft">{t("nav.account")} <Icon name="arrow" size={16} /></Link>
              <Link href="/member/help?ask=account" className="h-btn h-btn-soft">{t("ma.close")} <Icon name="arrow" size={16} /></Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}


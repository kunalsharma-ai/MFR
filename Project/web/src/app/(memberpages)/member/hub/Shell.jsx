"use client";
// The member hub frame (v3, Nov 2026 premium redesign).
//   Header: logo + panel badge, three live status gauges (profile %, Quality Points /10, points + level), language
//           selector (globe, flag, language name, full list), notification bell with an animated unread dot, help,
//           "more" menu (appearance, palette, sound, all sections) and the account menu.
//   Navigation (v4, Kunal round 3): a fixed left menu that never moves while the page scrolls; only the main content
//           scrolls. Reward balance + member card at its foot. Below 1000px it is a drawer opened from the header.
//           There is no bottom bar.
// Every number comes from useHub() (store.js), the single source of truth.
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useMember } from "@/Context";
import { api } from "@/util";
import { LANGUAGES } from "@/i18n/languages";
import Icon from "./icons.jsx";
import { Counter, Tip } from "./ui.jsx";
import { t, setStringsLanguage } from "./strings";
import { usePrefs, setPrefs, applyTheme, paletteVars, currentLanguage, setLanguage, MODES, PALETTES, resolvedMode, dirOf, motionReduced } from "./prefs";
import { fmt } from "./data";
import { useHub, useRise } from "./store";
import { play } from "./sound";
import { helpForSection } from "./help/content";
import "./hub.css";
import "./hub-sections.css";
import "./hub-identity.css";
import "./hub-v3.css";
import "./hub-v4.css";
import "./hub-v5.css";

// v5 (round 4): one "Your journey" list in the order members follow (the Turn2Opinion format Kunal chose),
// with MFR's own Services and Messages kept where they belong.
export const NAV = [
  { group: "nav.groupJourney", items: [
    { key: "dashboard", href: "/member/dashboard", icon: "dashboard", label: "nav.dashboard", short: "nav.home", hint: "nav.hDashboard", tone: 1 },
    { key: "profile", href: "/member/profiles", icon: "profile", label: "nav.myProfile", short: "nav.profile", hint: "nav.hProfile", tone: 2 },
    { key: "surveys", href: "/member/surveys", icon: "surveys", label: "nav.surveys", hint: "nav.hSurveys", tone: 3 },
    { key: "services", href: "/member/services", icon: "services", label: "nav.services", hint: "nav.hServices", tone: 4 },
    { key: "rewards", href: "/member/rewards", icon: "rewards", label: "nav.rewards", hint: "nav.hRewards", tone: 5 },
    { key: "quality", href: "/member/quality", icon: "quality", label: "nav.quality", short: "nav.qualityShort", hint: "nav.hQuality", tone: 6 },
    { key: "referrals", href: "/member/referrals", icon: "referrals", label: "nav.referrals", hint: "nav.hReferrals", tone: 7 },
    { key: "activity", href: "/member/activity", icon: "activity", label: "nav.activity", hint: "nav.hActivity", tone: 8 },
    { key: "messages", href: "/member/messages", icon: "inbox", label: "nav.messages", hint: "nav.hMessages", tone: 1 },
    { key: "account", href: "/member/myaccount", icon: "account", label: "nav.account", hint: "nav.hAccount", tone: 2 },
    { key: "settings", href: "/member/settings", icon: "settings", label: "nav.settings", hint: "nav.hSettings", tone: 4 },
    // The ticket pages under /member/support count as Help.
    { key: "help", href: "/member/help", also: ["/member/support"], icon: "help", label: "nav.support", short: "nav.help", hint: "nav.hHelp", tone: 6 },
  ] },
];
const ALL = NAV.flatMap((g) => g.items);

const isActive = (pathname, href) => typeof pathname === "string" && (pathname === href || pathname.startsWith(`${href}/`));
const isOn = (pathname, it) => isActive(pathname, it.href) || (it.also || []).some((h) => isActive(pathname, h));
export const sectionOf = (pathname) => (ALL.find((x) => isOn(pathname, x)) || ALL[0]);

/* ---------------- notifications (GET /api/v1/alerts, the feed the old bell read) ---------------- */
export function useAlerts() {
  const member = useMember();
  return useQuery({
    queryKey: ["hub", "alerts", member?._id],
    enabled: Boolean(member?._id),
    queryFn: async () => {
      const r = await api.get("/api/v1/alerts");
      if (!r || r.status === "error") throw new Error((r && r.message) || "alerts");
      return (Array.isArray(r.data) ? r.data : [])
        .filter(Boolean)
        .map((a, i) => ({ id: String(a._id || i), title: a.title || "", subtitle: a.subtitle || "", message: a.message || "", cta: a.cta || "", ctaType: a.ctaType || "", at: a.createdAt ? new Date(a.createdAt) : null }))
        .sort((a, b) => (b.at?.getTime() || 0) - (a.at?.getTime() || 0));
    },
    staleTime: 60_000,
  });
}

/* click-outside + Esc popover used by every header control */
function Pop({ id, label, icon, badge, children, className = "", buttonClass = "", tip = true }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    const first = ref.current?.querySelector(".hh-menu button, .hh-menu a, .hh-menu input");
    first?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const btn = (
    <button
      type="button"
      className={`hh-icon ${buttonClass} ${open ? "is-open" : ""}`}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={id}
      aria-label={label}
      onClick={() => { setOpen((o) => !o); play("tap"); }}
    >
      {icon}
      {badge}
    </button>
  );
  return (
    <div className={`hh-pop ${className}`} ref={ref}>
      {tip ? <Tip text={label}>{btn}</Tip> : btn}
      {open ? (
        <div className="hh-menu" id={id} role="dialog" aria-label={label}>
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      ) : null}
    </div>
  );
}

const MODE_ICON = { light: "sun", dark: "moon", night: "night", system: "device" };

function ModeList({ prefs, onPick }) {
  return (
    <div className="hh-seg" role="radiogroup" aria-label={t("hdr.mode")}>
      {MODES.map((k) => (
        <button key={k} type="button" role="radio" aria-checked={prefs.mode === k} className={prefs.mode === k ? "on" : ""} onClick={() => { setPrefs({ mode: k }); play("tap"); onPick?.(); }}>
          <Icon name={MODE_ICON[k]} size={18} />
          <span>{t(`mode.${k}`)}</span>
        </button>
      ))}
    </div>
  );
}

export function PaletteList({ prefs, type, onPick, withCustom = false }) {
  const keys = Object.keys(PALETTES);
  const dark = resolvedMode(prefs) !== "light";
  return (
    <div className="hh-pals" role="radiogroup" aria-label={t("hdr.palette")}>
      {keys.map((k) => {
        const pal = PALETTES[k];
        const v = pal ? (dark ? pal.dark : pal.light) : null;
        return (
          <button key={k} type="button" role="radio" aria-checked={prefs.palette === k} className={`hh-pal ${prefs.palette === k ? "on" : ""}`} onClick={() => { setPrefs({ palette: k }); play("tap"); onPick?.(); }}>
            <span className={`hh-pal-sw ${v ? "" : `sig-${type}`}`} style={v ? { "--p1": v.primary, "--p2": v.secondary, "--p3": v.accent } : undefined} aria-hidden="true"><i /><i /><i /></span>
            <span className="hh-pal-n">{t(`pal.${k}`)}</span>
            {prefs.palette === k ? <Icon name="check" size={14} className="hh-tick" /> : null}
          </button>
        );
      })}
      {withCustom ? (
        <button type="button" role="radio" aria-checked={prefs.palette === "custom"} className={`hh-pal ${prefs.palette === "custom" ? "on" : ""}`} onClick={() => { setPrefs({ palette: "custom" }); play("tap"); }}>
          <span className="hh-pal-sw" style={{ "--p1": prefs.custom, "--p2": prefs.custom, "--p3": prefs.custom }} aria-hidden="true"><i /><i /><i /></span>
          <span className="hh-pal-n">{t("pal.custom")}</span>
        </button>
      ) : null}
    </div>
  );
}

export const flagSrc = (l) => (l?.flag ? `/images/flags/${l.flag}.svg` : null);
export function Flag({ lang, size = 20 }) {
  const src = flagSrc(lang);
  return src ? <img className="hh-flag" src={src} alt="" width={Math.round(size * 1.34)} height={size} loading="lazy" /> : <span className="hh-flag hh-flag-x" aria-hidden="true" />;
}

// Every language the site is translated into, grouped by region, with its flag and native name. Picking one calls
// setLanguage (prefs.js): it stores the choice (cookie + localStorage), switches the hub strings and runs the
// site's translation engine (@/i18n/engine setPageLanguage) on the page.
function LanguageList({ onPick }) {
  const [lang, setLang] = React.useState("en");
  const [q, setQ] = React.useState("");
  React.useEffect(() => setLang(currentLanguage()), []);
  const list = LANGUAGES.filter((l) => !q || `${l.native} ${l.name} ${l.region}`.toLowerCase().includes(q.toLowerCase()));
  const regions = [...new Set(list.map((l) => l.region))];
  return (
    <div className="hh-langs">
      <p className="hh-menu-t"><Icon name="globe" size={16} /> {t("v3.langTitle")}</p>
      <label className="hh-search">
        <Icon name="search" size={16} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("hdr.langSearch")} aria-label={t("hdr.langSearch")} />
      </label>
      <div className="hh-list" role="listbox" aria-label={t("hdr.language")}>
        {!list.length ? <p className="hh-empty">{t("v3.langNone")}</p> : null}
        {regions.map((r) => (
          <React.Fragment key={r}>
            <p className="hh-lang-region">{r}</p>
            {list.filter((l) => l.region === r).map((l) => (
              <button key={l.code} type="button" role="option" aria-selected={l.code === lang} className={`hh-opt hh-lang notranslate ${l.code === lang ? "on" : ""}`} dir={l.dir || "ltr"} lang={l.code}
                onClick={() => { setLang(l.code); setLanguage(l.code); play("tap"); onPick?.(); }}>
                <Flag lang={l} />
                <span><b>{l.native}</b><small>{l.name}{l.dir === "rtl" ? " · RTL" : ""}</small></span>
                {l.code === lang ? <Icon name="check" size={16} className="hh-tick" /> : null}
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// The header's language selector: globe + flag + language name + chevron; opens the full list.
function LanguagePicker({ prefs }) {
  const [code, setCode] = React.useState("en");
  React.useEffect(() => setCode(currentLanguage()), [prefs]);
  const l = LANGUAGES.find((x) => x.code === code) || LANGUAGES[0];
  return (
    <Pop id="hh-lang" label={`${t("hdr.language")}: ${l.name}`} className="hh-langpop" buttonClass="hh-langbtn" tip={false}
      icon={<><Icon name="globe" size={18} className="hh-lang-globe" /><Flag lang={l} size={14} /><span className="hh-lang-name notranslate">{l.native}</span><Icon name="chevron" size={14} className="hh-lang-chev" /></>}>
      {(close) => <LanguageList onPick={close} />}
    </Pop>
  );
}

function SoundButton({ prefs }) {
  return (
    <Tip text={prefs.sound ? t("hdr.soundOn") : t("hdr.soundOff")}>
      <button type="button" className={`hh-icon ${prefs.sound ? "" : "is-muted"}`} aria-pressed={prefs.sound} aria-label={t("hdr.sound")}
        onClick={() => { const next = !prefs.sound; setPrefs({ sound: next }); if (next) setTimeout(() => play("tap"), 0); }}>
        <Icon name={prefs.sound ? "soundOn" : "soundOff"} size={20} />
      </button>
    </Tip>
  );
}

// tells an open Help centre to re-read the address after a client-side link changed only its query or hash
const helpNav = () => setTimeout(() => window.dispatchEvent(new Event("hub-help-nav")), 60);

function HelpMenu({ section, type }) {
  const tip = helpForSection(section, type);
  return (
    <Pop id="hh-help" label={t("hp.pageHelp")} className="hh-help" icon={<Icon name="help" size={20} />}>
      {(close) => (
        <div className="hh-list hh-helpmenu">
          <p className="hh-menu-t"><span className="hh-help-ic" style={{ "--c1": tip.topic.c1, "--c2": tip.topic.c2 }}><Icon name={tip.topic.icon} size={16} /></span> {tip.topic.title}</p>
          {tip.guide ? (
            <Link className="hh-opt" href={`/member/help#guide-${tip.guide.id}`} onClick={() => { close(); helpNav(); }}>
              <Icon name="book" size={18} /> <span><b>{tip.guide.title}</b><small>{t("hp.guide")} · {t("hp.steps", { n: tip.guide.steps.length })}</small></span>
            </Link>
          ) : null}
          {tip.faqs.map((f) => (
            <Link key={f.id} className="hh-opt" href={`/member/help#faq-${f.id}`} onClick={() => { close(); helpNav(); }}>
              <Icon name="help" size={18} /> <span><b>{f.q}</b></span>
            </Link>
          ))}
          <div className="hh-menu-end">
            <Link className="h-btn h-btn-soft" href={`/member/help?topic=${tip.topic.id}`} onClick={() => { close(); helpNav(); }}>{t("hp.openCentre")}</Link>
            <Link className="h-btn h-btn-primary" href={`/member/help?ask=${tip.topic.id}`} onClick={() => { close(); helpNav(); }}>{t("hp.raise")}</Link>
          </div>
        </div>
      )}
    </Pop>
  );
}

export function NewsletterDialog({ url, onClose }) {
  React.useEffect(() => {
    if (!url) return undefined;
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [url, onClose]);
  if (!url) return null;
  return (
    <div className="hh-modal" role="dialog" aria-modal="true" aria-label={t("msg.newsletter")} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hh-modal-box">
        <div className="hh-modal-head"><b>{t("msg.newsletter")}</b><button type="button" className="hh-icon" onClick={onClose} aria-label={t("c.close")}><Icon name="close" size={18} /></button></div>
        <iframe src={url} title={t("msg.newsletter")} />
      </div>
    </div>
  );
}

function Notifications() {
  const alerts = useAlerts();
  const n = alerts.data?.length || 0;
  const rose = useRise(alerts.data ? n : null, "notify");
  const [popup, setPopup] = React.useState(null);
  return (
    <>
      <Pop id="hh-notif" label={t("hdr.notifications")} className="hh-notif" buttonClass={`${rose ? "is-ring" : ""} ${n ? "has-unread" : ""}`}
        icon={<Icon name="bell" size={20} />}
        badge={n ? <span className="hh-badge" aria-label={t("hdr.unread", { n })}>{n > 9 ? "9+" : n}</span> : null}>
        {(close) => (
          <div className="hh-notes">
            <div className="hh-menu-head"><b>{t("hdr.notifications")}</b><small>{alerts.isLoading ? t("c.loading") : t("hdr.unread", { n })}</small></div>
            {alerts.isError ? (
              <p className="hh-empty"><Icon name="alert" size={18} /> {t("msg.alertsError")}</p>
            ) : !n && !alerts.isLoading ? (
              <p className="hh-empty"><Icon name="check" size={18} /> {t("msg.alertsEmpty")}</p>
            ) : (
              <ul className="hh-notes-list">
                {(alerts.data || []).slice(0, 6).map((a) => (
                  <li key={a.id}>
                    <span className="hh-note-av" aria-hidden="true">{(a.title || "M").charAt(0)}</span>
                    <span className="hh-note-tx">
                      <b>{a.subtitle || a.title}</b>
                      {a.message ? <small>{a.message}</small> : null}
                      <em>{a.title}{a.at ? ` · ${a.at.toLocaleDateString()}` : ""}</em>
                    </span>
                    {a.cta ? (a.ctaType === "popup"
                      ? <button type="button" className="h-link" onClick={() => { setPopup(a.cta); close(); }}>{t("c.view")}</button>
                      : <a className="h-link" href={a.cta} target="_blank" rel="noopener noreferrer">{t("c.open")}</a>) : null}
                  </li>
                ))}
              </ul>
            )}
            <div className="hh-menu-end"><Link href="/member/messages" className="h-btn h-btn-soft" onClick={close}>{t("hdr.allMessages")} <Icon name="arrow" size={16} /></Link></div>
          </div>
        )}
      </Pop>
      <NewsletterDialog url={popup} onClose={() => setPopup(null)} />
    </>
  );
}

function initialsOf(m) {
  return `${m?.firstname?.[0] || ""}${m?.lastname?.[0] || ""}`.toUpperCase() || "M";
}
export function Avatar({ member, size = "" }) {
  const pic = member?.profilePicture && !String(member.profilePicture).includes("/images/logo/user.png") ? member.profilePicture : null;
  return <span className={`hh-avatar ${size}`}>{pic ? <img src={pic} alt="" /> : <span>{initialsOf(member)}</span>}</span>;
}

function AvatarMenu({ hub }) {
  const router = useRouter();
  const { member, type, level, completion } = hub;
  return (
    <Pop id="hh-me" label={t("hdr.account")} className="hh-me" buttonClass="hh-avatar-btn" tip={false} icon={<Avatar member={member} />}>
      {(close) => (
        <div className="hh-list">
          <div className="hh-me-card">
            <Avatar member={member} size="lg" />
            <span>
              <b>{member?.fullname || member?.firstname}</b>
              <small className={`hh-type t-${type}`}>{t(`type.${type}Member`)}</small>
              <small className="hh-me-lv">{t("lv.level", { n: level.n })}{completion ? ` · ${t("hdr.profilePct", { n: completion.pct })}` : ""}</small>
            </span>
          </div>
          {[["account", "/member/myaccount", "nav.account"], ["user", "/member/settings#st-social", "nav.social"], ["settings", "/member/settings", "nav.settings"], ["inbox", "/member/messages", "nav.messages"], ["help", "/member/help", "nav.support"]].map(([ic, href, l]) => (
            <Link key={href} className="hh-opt" href={href} onClick={close}><Icon name={ic} size={18} /> <span><b>{t(l)}</b></span></Link>
          ))}
          <button type="button" className="hh-opt danger" onClick={() => { close(); member?.Logout ? member.Logout() : router.replace("/"); }}>
            <Icon name="logout" size={18} /> <span><b>{t("hdr.logout")}</b></span>
          </button>
        </div>
      )}
    </Pop>
  );
}

/* the three live gauges */
function MiniRing({ pct, children }) {
  return (
    <span className="hs-ring" style={{ "--p": Math.max(0, Math.min(100, pct || 0)) }}>
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="15" className="bg" />
        <circle cx="18" cy="18" r="15" className="fg" pathLength="100" style={{ strokeDasharray: `${Math.max(0, Math.min(100, pct || 0))} 100` }} />
      </svg>
      <span className="hs-ring-in">{children}</span>
    </span>
  );
}

function StatusCluster({ hub }) {
  const router = useRouter();
  const { completion, quality, pts, level, type } = hub;
  const pPulse = useRise(completion?.pct ?? null, "complete");
  const qPulse = useRise(quality?.raw ?? null, "achievement");
  const ptPulse = useRise(pts?.total ?? null, "reward");
  const lvPulse = useRise(level?.n ?? null, "levelup");
  return (
    <div className="hs" role="group" aria-label={t("hdr.status")}>
      <Tip text={completion ? (completion.pct >= 100 ? t("hdr.profileDone") : t("hdr.profileTip", { n: completion.remaining.length })) : t("c.loading")}>
        <Link href="/member/profiles" className={`hs-item hs-profile ${pPulse ? "is-pulse" : ""}`} aria-label={`${t("hdr.profile")} ${completion?.pct ?? 0}%`}>
          <MiniRing pct={completion?.pct}><Icon name="profile" size={13} /></MiniRing>
          <span className="hs-tx"><small>{t("hdr.profile")}</small><b>{completion ? <><Counter value={completion.pct} />%</> : "…"}</b></span>
        </Link>
      </Tip>
      {quality ? (
        <Tip text={t("hdr.qualityTip", { raw: fmt(quality.raw), scale: fmt(quality.scale), tier: quality.tier?.label || t(`qs.${quality.band}`) })}>
          <Link href="/member/quality" className={`hs-item hs-quality b-${quality.band} ${qPulse ? "is-pulse" : ""}`} aria-label={`${t("hdr.quality")} ${quality.ten} / 10`}>
            <MiniRing pct={quality.pct}><Icon name="quality" size={13} /></MiniRing>
            <span className="hs-tx"><small>{t("hdr.quality")}</small><b><Counter value={quality.ten} format={(n) => n.toFixed(1)} /><em>/10</em></b></span>
          </Link>
        </Tip>
      ) : null}
      <Tip text={pts ? t("hdr.pointsTip", { n: fmt(level.left ?? 0), lv: (level.n || 1) + 1 }) : t("c.loading")}>
        <button type="button" id="rw-pts" className={`hs-item hs-points ${ptPulse ? "is-pulse" : ""} ${lvPulse ? "is-level" : ""}`}
          onClick={() => {
            const machine = document.getElementById("rewards");
            if (machine) machine.scrollIntoView({ behavior: "smooth", block: "start" });
            else router.push("/member/rewards");
          }}
          aria-label={`${fmt(pts?.total || 0)} ${t("c.points")}, ${t("lv.level", { n: level.n })}`}>
          <span className="hs-coin" aria-hidden="true"><Icon name="coin" size={16} /></span>
          <span className="hs-tx"><small>{type === "teen" ? t("hdr.xp") : t("hdr.points")}</small><b>{pts ? <Counter value={pts.total} /> : "…"}</b></span>
          <span className="hs-lv" aria-hidden="true">L{level.n}</span>
          {ptPulse ? <span className="hs-float" aria-hidden="true">+</span> : null}
        </button>
      </Tip>
    </div>
  );
}

function Header({ hub, prefs, onMenu, section, navOpen }) {
  const { type } = hub;
  return (
    <header className="hh" role="banner">
      <a href="#hub-main" className="hh-skip">{t("hdr.skip")}</a>
      <button type="button" className="hh-icon hh-burger" onClick={onMenu} aria-controls="hub-nav" aria-expanded={Boolean(navOpen)} aria-label={t("nav.main")}><Icon name="menu" size={22} /></button>
      <Link href="/member/dashboard" className="hh-logo" aria-label={t("hdr.home")}>
        <img src="/images/logo/mfr-logo.png" alt="MyFrequentRewards" className="hh-logo-img" width="168" height="40" />
        <img src="/images/logo/mfr/icon/128.webp" alt="" className="hh-mark" width="34" height="34" aria-hidden="true" />
      </Link>
      <span className={`hh-type t-${type}`}><i aria-hidden="true" />{t(`type.${type}`)}</span>
      <JumpTo />
      <StatusCluster hub={hub} />
      <div className="hh-tools">
        <LanguagePicker prefs={prefs} />
        <Notifications />
        <HelpMenu section={section.key === "messages" ? "dashboard" : section.key === "services" ? "surveys" : section.key} type={type} />
        <Pop id="hh-more" label={t("hdr.more")} className="hh-morepop" icon={<Icon name="sliders" size={20} />}>
          {(close) => (
            <div className="hh-moremenu">
              <p className="hh-menu-t">{t("hdr.mode")}</p>
              <ModeList prefs={prefs} />
              <p className="hh-menu-t">{t("hdr.palette")}</p>
              <PaletteList prefs={prefs} type={type} />
              <div className="hh-more-row">
                <span>{t("hdr.sound")}</span>
                <SoundButton prefs={prefs} />
              </div>
              <div className="hh-more-links">
                <Link className="h-btn h-btn-soft" href="/member/settings" onClick={close}><Icon name="settings" size={16} /> {t("nav.settings")}</Link>
                <Link className="h-btn h-btn-soft hh-more-help" href="/member/help" onClick={close}><Icon name="help" size={16} /> {t("nav.support")}</Link>
              </div>
            </div>
          )}
        </Pop>
        <AvatarMenu hub={hub} />
      </div>
    </header>
  );
}

function navBadge(key, hub, alerts) {
  if (key === "profile" && hub.completion && hub.completion.remaining.length) return { n: hub.completion.remaining.length, tip: "nav.bProfile" };
  if (key === "surveys" && hub.open) return { n: hub.open, tip: "nav.bSurveys" };
  if (key === "messages" && alerts) return { n: alerts, tip: "nav.bMessages" };
  if (key === "services" && hub.pollOpen) return { n: 1, tip: "nav.bServices", dot: true };
  return null;
}

// Sidebar foot (v5): the way to the payout (teens: to the next level), contact support and collapse.
function NavFoot({ hub, rail, onRail }) {
  const { type, pts, level } = hub;
  const pct = type === "teen" ? Math.round(level.pct || 0) : pts ? Math.min(100, Math.round((pts.total / pts.threshold) * 100)) : 0;
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <div className="hn-foot">
      <Link href="/member/rewards" className="hn-pay" aria-label={type === "teen" ? t("v5.toLevel", { n: pct, lv: (level.n || 1) + 1 }) : t("v5.toPayout", { n: pct })}>
        <span className="hn-pay-ring" aria-hidden="true">
          <svg viewBox="0 0 36 36"><circle cx="18" cy="18" r={r} className="bg" /><circle cx="18" cy="18" r={r} className="fg" style={{ strokeDasharray: `${(pct / 100) * c} ${c}` }} /></svg>
        </span>
        <span className="hn-tx hn-pay-tx">
          {type === "teen" ? <><b>{pct}%</b> {t("v5.toLevelShort", { lv: (level.n || 1) + 1 })}</> : <><b>{pts ? `${pct}%` : "…"}</b> {t("v5.toPayoutShort")}</>}
        </span>
      </Link>
      <Link href="/member/help" className="hn-link hn-mini"><span className="hn-ic"><Icon name="support" size={18} /></span><span className="hn-tx"><b>{t("v5.contact")}</b></span></Link>
      <button type="button" className="hn-link hn-mini hn-railbtn" onClick={onRail} aria-pressed={rail}>
        <span className="hn-ic"><Icon name="arrow" size={18} className="hn-rail-ic" /></span><span className="hn-tx"><b>{rail ? t("v5.expand") : t("v5.collapse")}</b></span>
      </button>
    </div>
  );
}

/* "Jump to…" (Ctrl/⌘ K): find any section by name and go there. */
function JumpTo() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [at, setAt] = React.useState(0);
  const input = React.useRef(null);
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(true); }
      else if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  React.useEffect(() => { if (open) { setQ(""); setAt(0); setTimeout(() => input.current?.focus(), 20); } }, [open]);
  const norm = (x) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const list = ALL.filter((it) => !q || norm(`${t(it.label)} ${t(it.hint)}`).includes(norm(q)));
  const go = (it) => { if (!it) return; setOpen(false); play("tap"); router.push(it.href); };
  return (
    <>
      <button type="button" className="hh-jump" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <Icon name="search" size={18} /><span>{t("v5.jump")}</span><kbd>Ctrl K</kbd>
      </button>
      {open ? (
        <div className="hj-scrim" onPointerDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="hj" role="dialog" aria-modal="true" aria-label={t("v5.jump")}>
            <label className="hj-in"><Icon name="search" size={20} />
              <input ref={input} value={q} placeholder={t("v5.jumpPh")} aria-label={t("v5.jump")}
                onChange={(e) => { setQ(e.target.value); setAt(0); }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setAt((n) => Math.min(list.length - 1, n + 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setAt((n) => Math.max(0, n - 1)); }
                  else if (e.key === "Enter") go(list[at]);
                }} />
            </label>
            <ul className="hj-list" role="listbox">
              {list.length ? list.map((it, i) => (
                <li key={it.key} role="option" aria-selected={i === at}>
                  <button type="button" className={`hj-opt t${it.tone} ${i === at ? "on" : ""}`} onMouseEnter={() => setAt(i)} onClick={() => go(it)}>
                    <span className="hn-ic"><Icon name={it.icon} size={18} /></span><span><b>{t(it.label)}</b><small>{t(it.hint)}</small></span>
                  </button>
                </li>
              )) : <li className="hj-none">{t("v5.jumpNone")}</li>}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}

function useDrawer() {
  const [drawer, setDrawer] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(max-width: 1000px)");
    const on = () => setDrawer(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return drawer;
}

// The fixed left menu: it never moves while the page scrolls (only the main content does). Below 1000px it becomes
// a drawer opened from the header menu button.
function SideNav({ pathname, open, onClose, hub, alerts, rail, onRail }) {
  const { type } = hub;
  const drawer = useDrawer();
  const ref = React.useRef(null);
  React.useEffect(() => { if (open && drawer) ref.current?.querySelector("a,button")?.focus({ preventScroll: true }); }, [open, drawer]);
  const hidden = drawer && !open;
  return (
    <>
      <div className={`hn-scrim ${open ? "is-open" : ""}`} onClick={onClose} aria-hidden="true" />
      <nav ref={ref} className={`hn ${open ? "is-open" : ""}`} aria-label={t("nav.main")} id="hub-nav" aria-hidden={hidden || undefined} inert={hidden}>
        <div className="hn-head">
          <img src="/images/logo/mfr-logo-ondark.png" alt="MyFrequentRewards" className="hn-head-logo" width="150" height="36" />
          <button type="button" className="hh-icon hn-close" onClick={onClose} aria-label={t("c.close")}><Icon name="close" size={20} /></button>
        </div>
        <span className={`hn-type t-${type}`}><i aria-hidden="true" />{t(`type.${type}Member`)}</span>
        <div className="hn-scroll">
          {NAV.map((g) => (
            <div className="hn-group" key={g.group}>
              <p className="hn-gt">{t(g.group)}</p>
              <ul>
                {g.items.map((it) => {
                  const on = isOn(pathname, it);
                  const b = navBadge(it.key, hub, alerts);
                  return (
                    <li key={it.key}>
                      <Link href={it.href} title={rail ? t(it.label) : undefined} className={`hn-link s-${it.key} t${it.tone} ${on ? "is-on" : ""}`} aria-current={on ? "page" : undefined} onClick={() => { play("tap"); onClose(); }}>
                        <span className="hn-ic"><Icon name={it.icon} size={20} /></span>
                        <span className="hn-tx"><b>{t(it.label)}</b></span>
                        {b ? <span className={`hn-badge ${b.dot ? "dot" : ""}`} aria-label={t(b.tip, { n: b.n })}>{b.dot ? "" : b.n > 99 ? "99+" : b.n}</span> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <NavFoot hub={hub} rail={rail} onRail={onRail} />
      </nav>
    </>
  );
}

export default function HubShell({ children }) {
  const pathname = usePathname();
  const prefs = usePrefs();
  const hub = useHub();
  const alerts = useAlerts();
  const { type } = hub;
  const [navOpen, setNavOpen] = React.useState(false);
  const [rail, setRail] = React.useState(false);
  React.useEffect(() => { try { setRail(localStorage.getItem("mfr.hub.rail") === "1"); } catch (e) { /* storage blocked */ } }, []);
  const toggleRail = () => setRail((r) => { try { localStorage.setItem("mfr.hub.rail", r ? "0" : "1"); } catch (e) { /* storage blocked */ } return !r; });
  const [dir, setDir] = React.useState("ltr");

  React.useEffect(() => {
    applyTheme();
    const c = currentLanguage();
    setStringsLanguage(c);
    setDir(dirOf(c));
  }, []);
  React.useEffect(() => setDir(dirOf(currentLanguage())), [prefs]);
  React.useEffect(() => setNavOpen(false), [pathname]);
  React.useEffect(() => {
    if (!navOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setNavOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navOpen]);
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-hub-text", String(prefs.text));
    return () => document.documentElement.removeAttribute("data-hub-text");
  }, [prefs.text]);

  const section = sectionOf(pathname);
  const vars = paletteVars(prefs) || undefined;
  const mode = resolvedMode(prefs);
  const nAlerts = alerts.data?.length || 0;
  return (
    <div
      className="hub"
      dir={dir}
      data-type={type}
      data-sec={section.key}
      data-pal={prefs.palette}
      data-mode={mode}
      data-density={prefs.density}
      data-contrast={prefs.contrast}
      data-motion={motionReduced(prefs) ? "reduced" : "full"}
      data-focus={prefs.focusAlways ? "always" : "auto"}
      data-rail={rail ? "1" : undefined}
      style={vars}
    >
      <Header hub={hub} prefs={prefs} section={section} navOpen={navOpen} onMenu={() => setNavOpen(true)} />
      <SideNav pathname={pathname} open={navOpen} onClose={() => setNavOpen(false)} hub={hub} alerts={nAlerts} rail={rail} onRail={toggleRail} />
      <div className="hub-body">
        <main id="hub-main" className="hub-main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

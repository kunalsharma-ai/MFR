"use client";
// The member hub frame: header (logo, points, quality, notifications, language, theme, sound, avatar),
// grouped side navigation on desktop, an icon rail on tablets and a bottom bar + drawer on phones.
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMember } from "@/Context";
import { LANGUAGES } from "@/i18n/languages";
import MemberNotification from "../components/MemberNotification";
import Icon from "./icons.jsx";
import { Counter } from "./ui.jsx";
import { t, setStringsLanguage } from "./strings";
import { usePrefs, setPrefs, applyTheme, paletteVars, currentLanguage, setLanguage, THEMES } from "./prefs";
import { memberTypeOf, usePoints, qualityOf, fmt } from "./data";
import { play } from "./sound";
import { helpForSection } from "./help/content";
import "./hub.css";

export const NAV = [
  { group: "nav.groupEarn", items: [
    { key: "dashboard", href: "/member/dashboard", icon: "dashboard", label: "nav.dashboard", short: "nav.home" },
    { key: "profile", href: "/member/profiles", icon: "profile", label: "nav.profile" },
    { key: "surveys", href: "/member/surveys", icon: "surveys", label: "nav.surveys" },
    { key: "rewards", href: "/member/rewards", icon: "rewards", label: "nav.rewards" },
  ] },
  { group: "nav.groupProgress", items: [
    { key: "quality", href: "/member/quality", icon: "quality", label: "nav.quality" },
    { key: "activity", href: "/member/activity", icon: "activity", label: "nav.activity" },
    { key: "referrals", href: "/member/referrals", icon: "referrals", label: "nav.referrals" },
  ] },
  { group: "nav.groupYou", items: [
    { key: "account", href: "/member/myaccount", icon: "account", label: "nav.account" },
    { key: "settings", href: "/member/settings", icon: "settings", label: "nav.settings" },
    // Help centre (Nov 2026): FAQs, guides and "raise a query". The ticket pages under /member/support count as Help.
    { key: "help", href: "/member/help", also: ["/member/support"], icon: "help", label: "nav.helpCentre", short: "nav.help" },
  ] },
];
const BOTTOM = ["dashboard", "surveys", "rewards", "profile", "help"];
const ALL = NAV.flatMap((g) => g.items);

const isActive = (pathname, href) => typeof pathname === "string" && (pathname === href || pathname.startsWith(`${href}/`));
const isOn = (pathname, it) => isActive(pathname, it.href) || (it.also || []).some((h) => isActive(pathname, h));

/* click-outside + Esc popover used by every header control */
function Pop({ id, label, icon, badge, children, className = "", buttonClass = "" }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className={`hh-pop ${className}`} ref={ref}>
      <button
        type="button"
        className={`hh-icon ${buttonClass} ${open ? "is-open" : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        title={label}
        onClick={() => {
          setOpen((o) => !o);
          play("tap");
        }}
      >
        {icon}
        {badge}
      </button>
      {open ? (
        <div className="hh-menu" id={id} role="dialog" aria-label={label}>
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      ) : null}
    </div>
  );
}

function ThemeMenu({ prefs }) {
  const icons = { light: "sun", dark: "moon", night: "night" };
  return (
    <Pop id="hh-theme" label={t("hdr.theme")} icon={<Icon name={icons[prefs.theme]} size={20} />}>
      {(close) => (
        <div className="hh-list" role="radiogroup" aria-label={t("hdr.theme")}>
          {THEMES.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={prefs.theme === k}
              className={`hh-opt ${prefs.theme === k ? "on" : ""}`}
              onClick={() => {
                setPrefs({ theme: k });
                play("tap");
                close();
              }}
            >
              <span className={`hh-swatch th-${k}`}>
                <Icon name={icons[k]} size={16} />
              </span>
              <span>
                <b>{t(`theme.${k}`)}</b>
                <small>{t(`theme.${k}Hint`)}</small>
              </span>
              {prefs.theme === k ? <Icon name="check" size={16} className="hh-tick" /> : null}
            </button>
          ))}
        </div>
      )}
    </Pop>
  );
}

function LanguageMenu() {
  const [lang, setLang] = React.useState("en");
  React.useEffect(() => setLang(currentLanguage()), []);
  const cur = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
  return (
    <Pop
      id="hh-lang"
      label={t("hdr.language")}
      className="hh-lang"
      buttonClass="hh-lang-btn"
      icon={
        <>
          <Icon name="globe" size={20} />
          <span className="hh-lang-code notranslate">{cur.native}</span>
        </>
      }
    >
      {(close) => (
        <div className="hh-list hh-langs" role="listbox" aria-label={t("hdr.language")}>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={l.code === lang}
              className={`hh-opt notranslate ${l.code === lang ? "on" : ""}`}
              dir={l.dir || "ltr"}
              onClick={() => {
                setLang(l.code);
                setLanguage(l.code);
                close();
              }}
            >
              <span className="hh-glyph" style={{ background: `linear-gradient(135deg, ${l.grade[0]}, ${l.grade[1]})` }}>{l.glyph}</span>
              <span>
                <b>{l.native}</b>
                <small>{l.name}</small>
              </span>
              {l.code === lang ? <Icon name="check" size={16} className="hh-tick" /> : null}
            </button>
          ))}
        </div>
      )}
    </Pop>
  );
}

// tells an open Help centre to re-read the address after a client-side link changed only its query or hash
const helpNav = () => setTimeout(() => window.dispatchEvent(new Event("hub-help-nav")), 60);

// "?" in the header: the help for the page you are on, the Help centre and "raise a query", from every page.
function HelpMenu({ section, type }) {
  const tip = helpForSection(section, type);
  return (
    <Pop id="hh-help" label={t("hp.pageHelp")} className="hh-help" buttonClass="hh-help-btn" icon={<Icon name="help" size={21} />}>
      {(close) => (
        <div className="hh-list hh-helpmenu">
          <p className="hh-help-t"><span style={{ "--c1": tip.topic.c1, "--c2": tip.topic.c2 }}><Icon name={tip.topic.icon} size={16} /></span> {tip.topic.title}</p>
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
          <div className="hh-help-end">
            <Link className="h-btn h-btn-soft" href={`/member/help?topic=${tip.topic.id}`} onClick={() => { close(); helpNav(); }}>{t("hp.openCentre")}</Link>
            <Link className="h-btn h-btn-primary" href={`/member/help?ask=${tip.topic.id}`} onClick={() => { close(); helpNav(); }}>{t("hp.raise")}</Link>
          </div>
        </div>
      )}
    </Pop>
  );
}

function AvatarMenu({ member, type }) {
  const router = useRouter();
  const initials = `${member?.firstname?.[0] || ""}${member?.lastname?.[0] || ""}`.toUpperCase() || "M";
  return (
    <Pop
      id="hh-me"
      label={t("hdr.account")}
      className="hh-me"
      buttonClass="hh-avatar-btn"
      icon={
        <span className="hh-avatar">
          {member?.profilePicture ? <img src={member.profilePicture} alt="" /> : <span>{initials}</span>}
        </span>
      }
    >
      {(close) => (
        <div className="hh-list">
          <div className="hh-me-card">
            <span className="hh-avatar lg">
              {member?.profilePicture ? <img src={member.profilePicture} alt="" /> : <span>{initials}</span>}
            </span>
            <span>
              <b>{member?.fullname || member?.firstname}</b>
              <small className={`hh-type t-${type}`}>{t(`type.${type}Member`)}</small>
            </span>
          </div>
          <Link className="hh-opt" href="/member/myaccount" onClick={close}>
            <Icon name="account" size={18} /> <span><b>{t("nav.account")}</b></span>
          </Link>
          <Link className="hh-opt" href="/member/settings" onClick={close}>
            <Icon name="settings" size={18} /> <span><b>{t("nav.settings")}</b></span>
          </Link>
          <Link className="hh-opt" href="/member/help" onClick={close}>
            <Icon name="help" size={18} /> <span><b>{t("nav.helpCentre")}</b></span>
          </Link>
          <button
            type="button"
            className="hh-opt danger"
            onClick={() => {
              close();
              member?.Logout ? member.Logout() : router.replace("/");
            }}
          >
            <Icon name="logout" size={18} /> <span><b>{t("hdr.logout")}</b></span>
          </button>
        </div>
      )}
    </Pop>
  );
}

function Header({ member, type, prefs, onMenu, section }) {
  const points = usePoints();
  const q = qualityOf(member);
  const router = useRouter();
  const prev = React.useRef(null);
  const [bump, setBump] = React.useState(false);
  React.useEffect(() => {
    const v = points.data?.total;
    if (v == null) return undefined;
    if (prev.current != null && v > prev.current) {
      setBump(true);
      play("reward");
      const id = setTimeout(() => setBump(false), 1200);
      prev.current = v;
      return () => clearTimeout(id);
    }
    prev.current = v;
    return undefined;
  }, [points.data?.total]);

  return (
    <header className="hh" role="banner">
      <a href="#hub-main" className="hh-skip">{t("hdr.skip")}</a>
      <button type="button" className="hh-icon hh-burger" aria-label={t("nav.menu")} onClick={onMenu}>
        <Icon name="menu" size={22} />
      </button>
      <Link href="/member/dashboard" className="hh-logo" aria-label="MyFrequentRewards dashboard">
        <img src="/images/logo/mfr-logo.png" alt="MyFrequentRewards" className="hh-logo-img" width="150" height="40" />
        <span className={`hh-type-dot t-${type}`} aria-hidden="true" />
      </Link>
      <span className={`hh-type t-${type} hh-type-top`}>{t(`type.${type}`)}</span>

      <div className="hh-right">
        <button
          type="button"
          id="rw-pts"
          className={`hh-points ${bump ? "is-bump" : ""}`}
          onClick={() => {
            const machine = document.getElementById("rewards");
            if (machine) machine.scrollIntoView({ behavior: "smooth", block: "start" });
            else router.push("/member/rewards");
          }}
          aria-label={`${fmt(points.data?.total || 0)} ${t("c.points")}`}
        >
          <span className="hh-coin" aria-hidden="true">
            <Icon name="coin" size={18} />
          </span>
          <span className="hh-points-v">
            <small>{t("hdr.points")}</small>
            {points.isLoading ? <b className="h-skel-text">····</b> : <b><Counter value={points.data?.total || 0} /></b>}
          </span>
        </button>
        {q ? (
          <Link href="/member/quality" className="hh-quality" aria-label={`${t("hdr.quality")} ${q.score}${q.scale ? ` / ${q.scale}` : ""}`}>
            <svg viewBox="0 0 36 36" className="hh-qring" aria-hidden="true">
              <circle cx="18" cy="18" r="15" className="bg" />
              <circle cx="18" cy="18" r="15" className="fg" pathLength="100" style={{ strokeDasharray: `${q.pct ?? 0} 100` }} />
            </svg>
            <span>
              <small>{t("hdr.quality")}</small>
              <b>
                {q.score}
                {q.scale ? <em>/{q.scale}</em> : null}
              </b>
            </span>
          </Link>
        ) : null}
        <span className="hh-sep" aria-hidden="true" />
        <span className="hh-notif">
          <MemberNotification />
        </span>
        <HelpMenu section={section} type={type} />
        <LanguageMenu />
        <ThemeMenu prefs={prefs} />
        <button
          type="button"
          className={`hh-icon ${prefs.sound ? "" : "is-muted"}`}
          aria-pressed={prefs.sound}
          aria-label={prefs.sound ? t("hdr.soundOn") : t("hdr.soundOff")}
          title={prefs.sound ? t("hdr.soundOn") : t("hdr.soundOff")}
          onClick={() => {
            const next = !prefs.sound;
            setPrefs({ sound: next });
            if (next) setTimeout(() => play("tap"), 0);
          }}
        >
          <Icon name={prefs.sound ? "soundOn" : "soundOff"} size={20} />
        </button>
        <AvatarMenu member={member} type={type} />
      </div>
    </header>
  );
}

function SideNav({ pathname, open, onClose, type }) {
  return (
    <>
      <div className={`hn-scrim ${open ? "is-open" : ""}`} onClick={onClose} aria-hidden="true" />
      <nav className={`hn ${open ? "is-open" : ""}`} aria-label={t("nav.main")} id="hub-nav">
        <div className="hn-head">
          <span className={`hh-type t-${type}`}>{t(`type.${type}Member`)}</span>
          <button type="button" className="hh-icon hn-close" onClick={onClose} aria-label={t("c.cancel")}>
            <Icon name="close" size={20} />
          </button>
        </div>
        {NAV.map((g) => (
          <div className="hn-group" key={g.group}>
            <p className="hn-gt">{t(g.group)}</p>
            <ul>
              {g.items.map((it) => {
                const on = isOn(pathname, it);
                return (
                  <li key={it.key}>
                    <Link
                      href={it.href}
                      className={`hn-link s-${it.key} ${on ? "is-on" : ""}`}
                      aria-current={on ? "page" : undefined}
                      onClick={onClose}
                      title={t(it.label)}
                    >
                      <span className="hn-ic">
                        <Icon name={it.icon} size={21} />
                      </span>
                      <span className="hn-tx">{t(it.label)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}

function BottomNav({ pathname, onMore }) {
  return (
    <nav className="hb" aria-label={t("nav.main")}>
      {BOTTOM.map((k) => {
        const it = ALL.find((x) => x.key === k);
        const on = isOn(pathname, it);
        return (
          <Link key={k} href={it.href} className={`hb-link s-${k} ${on ? "is-on" : ""}`} aria-current={on ? "page" : undefined}>
            <Icon name={it.icon} size={22} />
            <span>{t(it.short || it.label)}</span>
          </Link>
        );
      })}
      <button type="button" className="hb-link" onClick={onMore} aria-controls="hub-nav">
        <Icon name="menu" size={22} />
        <span>{t("nav.more")}</span>
      </button>
    </nav>
  );
}

export default function HubShell({ children }) {
  const member = useMember();
  const pathname = usePathname();
  const prefs = usePrefs();
  const type = memberTypeOf(member);
  const [navOpen, setNavOpen] = React.useState(false);

  React.useEffect(() => {
    applyTheme();
    setStringsLanguage(currentLanguage());
  }, []);
  React.useEffect(() => setNavOpen(false), [pathname]);
  React.useEffect(() => {
    if (!navOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setNavOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navOpen]);

  const section = (ALL.find((x) => isOn(pathname, x)) || {}).key || "dashboard";
  const vars = paletteVars(prefs) || undefined;
  return (
    <div className="hub" data-type={type} data-sec={section} data-pal={prefs.palette} style={vars}>
      <Header member={member} type={type} prefs={prefs} section={section} onMenu={() => setNavOpen(true)} />
      <div className="hub-body">
        <SideNav pathname={pathname} open={navOpen} onClose={() => setNavOpen(false)} type={type} />
        <main id="hub-main" className="hub-main" tabIndex={-1}>
          {children}
        </main>
      </div>
      <BottomNav pathname={pathname} onMore={() => setNavOpen(true)} />
    </div>
  );
}

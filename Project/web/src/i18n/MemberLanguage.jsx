"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { DEFAULT_LANG, resolveLang } from "./languages";

const KEY = "mfr.lang"; // the name the public site uses for the cookie and the localStorage key (frontend-1: src/i18n/I18nProvider.jsx)
const engine = () => import("./engine");

const fromCookie = () => {
  const found = document.cookie.match(new RegExp(`(?:^|;\\s*)${KEY.replace(".", "\\.")}=([^;]+)`));
  return found ? decodeURIComponent(found[1]) : null;
};
const fromStorage = () => {
  try {
    return localStorage.getItem(KEY);
  } catch (e) {
    return null; // storage blocked
  }
};
// the cookie first, localStorage when there is none (a visitor who chose before the cookie existed)
const savedLanguage = () => resolveLang(fromCookie() || fromStorage()) || DEFAULT_LANG;

let engineUsed = false; // the engine only exists once a language other than English was applied

export default function MemberLanguage() {
  const pathname = usePathname();
  const isAdmin = typeof pathname === "string" && pathname.startsWith("/admin");

  useEffect(() => {
    let current = engineUsed ? null : DEFAULT_LANG; // null: unknown, so the first apply always runs
    const apply = () => {
      const code = isAdmin ? DEFAULT_LANG : savedLanguage();
      if (code === current) return;
      current = code;
      if (code === DEFAULT_LANG && !engineUsed) return; // nothing was translated: nothing to restore
      engineUsed = true;
      engine().then((m) => m.setPageLanguage(code)).catch((e) => console.log(e));
    };
    apply();
    window.addEventListener("focus", apply); // the language was changed in another tab
    return () => window.removeEventListener("focus", apply);
  }, [isAdmin]);

  return null;
}

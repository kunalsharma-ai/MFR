"use client";
// PWA (Nov 2026): adds the web app manifest, registers the member-area service worker (offline page + push) and keeps
// the browser's "install" prompt so Settings can offer an Install button. Renders nothing itself.
import React from "react";
import { t } from "../strings";
import Icon from "../icons.jsx";

let deferred = null;
const listeners = new Set();
export function PwaRegister() {
  React.useEffect(() => {
    if (!document.querySelector('link[rel="manifest"]')) {
      const l = document.createElement("link");
      l.rel = "manifest"; l.href = "/member/manifest.webmanifest";
      document.head.appendChild(l);
    }
    if ("serviceWorker" in navigator && window.isSecureContext) {
      navigator.serviceWorker.register("/member-sw.js", { scope: "/member/" }).catch(() => { /* not available: the site works as before */ });
    }
    const onPrompt = (e) => { e.preventDefault(); deferred = e; listeners.forEach((f) => f(true)); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);
  return null;
}

export function InstallApp() {
  const [can, setCan] = React.useState(Boolean(deferred));
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
    listeners.add(setCan);
    if (window.matchMedia?.("(display-mode: standalone)").matches) setDone(true);
    return () => listeners.delete(setCan);
  }, []);
  if (done) return <p className="h-sub"><Icon name="check" size={16} /> {t("pw.installed")}</p>;
  if (!can) return <p className="h-sub">{t("pw.how")}</p>;
  return (
    <button type="button" className="h-btn h-btn-primary" onClick={async () => { deferred.prompt(); const r = await deferred.userChoice; deferred = null; setCan(false); if (r?.outcome === "accepted") setDone(true); }}>
      <Icon name="plus" size={18} /> {t("pw.install")}
    </button>
  );
}

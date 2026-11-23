"use client";
// Member hub preferences: theme, colour palette, custom colour, sound and language.
//
// They are display preferences only, so they live in the browser (localStorage "mfr.hub.prefs"), like the
// portal's other display choices (day/night "mfr:dark", language "mfr.lang"). Nothing is written to the backend.
// The language uses the same cookie + localStorage key as the public site, so a choice made on either side is kept.

import { useSyncExternalStore } from "react";
import { setProfileDark } from "@/hooks/useProfileDark";
import { DEFAULT_LANG, resolveLang } from "@/i18n/languages";
import { setStringsLanguage } from "./strings";

const KEY = "mfr.hub.prefs";
const LANG_KEY = "mfr.lang";

export const THEMES = ["light", "dark", "night"];

// Each palette sets the tokens the whole hub reads (see hub.css). "mfr" keeps the member type's own colours.
export const PALETTES = {
  mfr: null,
  ocean: { primary: "#0A84C6", secondary: "#14B8A6", accent: "#38BDF8" },
  purple: { primary: "#7C3AED", secondary: "#DB2777", accent: "#A78BFA" },
  emerald: { primary: "#059669", secondary: "#0EA5A4", accent: "#FBBF24" },
  midnight: { primary: "#3B5BDB", secondary: "#1E2A78", accent: "#94A3FF" },
  sunset: { primary: "#F97316", secondary: "#E11D48", accent: "#FDBA74" },
};

const DEFAULTS = { theme: "light", palette: "mfr", custom: "#2F6BFF", sound: true, soundNotify: true };

let state = null;
const listeners = new Set();

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    const merged = { ...DEFAULTS, ...raw };
    if (!THEMES.includes(merged.theme)) merged.theme = "light";
    if (!(merged.palette in PALETTES) && merged.palette !== "custom") merged.palette = "mfr";
    return merged;
  } catch (e) {
    return { ...DEFAULTS };
  }
}
function ensure() {
  if (state) return state;
  state = typeof window === "undefined" ? { ...DEFAULTS } : read();
  return state;
}
function write() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    /* storage blocked: the choice lasts until reload */
  }
}

export function setPrefs(patch) {
  ensure();
  state = { ...state, ...patch };
  write();
  applyTheme();
  listeners.forEach((l) => l());
}

export function applyTheme() {
  if (typeof document === "undefined") return;
  const s = ensure();
  const root = document.documentElement;
  root.setAttribute("data-hub-theme", s.theme);
  // the approved profile studio has its own day/night look: keep it in step with the hub
  try {
    setProfileDark(s.theme !== "light");
  } catch (e) {
    /* profile store not ready */
  }
}

function subscribe(fn) {
  listeners.add(fn);
  const onStorage = (e) => {
    if (e.key === KEY) {
      state = read();
      applyTheme();
      listeners.forEach((l) => l());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}
const snap = () => ensure();
const serverSnap = () => DEFAULTS;

export function usePrefs() {
  return useSyncExternalStore(subscribe, snap, serverSnap);
}

// The CSS variables for the chosen palette (null = the member type's own colours from hub.css).
export function paletteVars(p) {
  if (p.palette === "custom") {
    const c = /^#[0-9a-f]{6}$/i.test(p.custom || "") ? p.custom : DEFAULTS.custom;
    return { "--primary": c, "--secondary": shade(c, -0.25), "--accent": shade(c, 0.35), "--primary-hover": shade(c, -0.12) };
  }
  const pal = PALETTES[p.palette];
  if (!pal) return null;
  return { "--primary": pal.primary, "--secondary": pal.secondary, "--accent": pal.accent, "--primary-hover": shade(pal.primary, -0.12) };
}

// lighten (amt > 0) or darken (amt < 0) a #rrggbb colour
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt)),
  );
  return `#${ch.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`;
}

/* ---------------- language ---------------- */
function cookieLang() {
  const m = document.cookie.match(/(?:^|;\s*)mfr\.lang=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}
export function currentLanguage() {
  if (typeof window === "undefined") return DEFAULT_LANG;
  let stored = null;
  try {
    stored = localStorage.getItem(LANG_KEY);
  } catch (e) {
    /* blocked */
  }
  return resolveLang(cookieLang() || stored) || DEFAULT_LANG;
}
export async function setLanguage(code) {
  const c = resolveLang(code) || DEFAULT_LANG;
  try {
    localStorage.setItem(LANG_KEY, c);
  } catch (e) {
    /* blocked */
  }
  document.cookie = `${LANG_KEY}=${encodeURIComponent(c)}; path=/; max-age=31536000; samesite=lax`;
  setStringsLanguage(c);
  listeners.forEach((l) => l());
  try {
    const m = await import("@/i18n/engine");
    await m.setPageLanguage(c, { interactive: true });
  } catch (e) {
    /* the page stays in English */
  }
}

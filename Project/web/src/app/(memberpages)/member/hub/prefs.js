"use client";
// Member hub preferences (v2, Nov 2026 ground-up redesign): mode, palette, accent, density, text size, contrast,
// motion, sound (master + three categories) and language.
//
// They are display preferences only, so they live in the browser (localStorage "mfr.hub.prefs"), like the portal's
// other display choices (day/night "mfr:dark", language "mfr.lang"). Nothing is written to the backend.
// Older saved values (palette "mfr"/"purple", theme "light|dark|night") are migrated on read.

import { useSyncExternalStore } from "react";
import { setProfileDark } from "@/hooks/useProfileDark";
import { DEFAULT_LANG, resolveLang, LANGUAGES } from "@/i18n/languages";
import { setStringsLanguage } from "./strings";

const KEY = "mfr.hub.prefs";
const LANG_KEY = "mfr.lang";

// "system" follows the device; "night" is the warm low-glare dark mode kept from v1.
export const MODES = ["light", "dark", "night", "system"];
export const THEMES = MODES; // v1 name, still imported by older modules

// Six designed palettes + the member type's own signature colours + a custom accent.
// Every palette defines light AND dark values, so dark mode is designed, not inverted.
export const PALETTES = {
  signature: null,
  aurora: { name: "Aurora", light: { primary: "#4F46E5", secondary: "#7C3AED", accent: "#06B6D4" }, dark: { primary: "#818CF8", secondary: "#A78BFA", accent: "#22D3EE" } },
  emerald: { name: "Emerald", light: { primary: "#047857", secondary: "#0D9488", accent: "#65A30D" }, dark: { primary: "#34D399", secondary: "#2DD4BF", accent: "#A3E635" } },
  sunset: { name: "Sunset", light: { primary: "#E2513A", secondary: "#9333EA", accent: "#F59E0B" }, dark: { primary: "#FB7A5F", secondary: "#C084FC", accent: "#FBBF24" } },
  ocean: { name: "Ocean", light: { primary: "#0369A1", secondary: "#0F2A5C", accent: "#14B8A6" }, dark: { primary: "#38BDF8", secondary: "#60A5FA", accent: "#2DD4BF" } },
  minimal: { name: "Minimal", light: { primary: "#1F2937", secondary: "#4B5563", accent: "#2563EB" }, dark: { primary: "#E5E7EB", secondary: "#9CA3AF", accent: "#60A5FA" } },
  midnight: { name: "Midnight", light: { primary: "#3730A3", secondary: "#0F172A", accent: "#0EA5E9" }, dark: { primary: "#7DD3FC", secondary: "#A5B4FC", accent: "#F0ABFC" }, forceDark: true },
};

export const DENSITIES = ["comfortable", "compact"];
export const TEXT_SIZES = [100, 112, 125];
export const CONTRASTS = ["standard", "high"];
export const MOTIONS = ["system", "reduced", "full"];

const DEFAULTS = {
  mode: "light",
  palette: "signature",
  custom: "#2F6BFF",
  density: "comfortable",
  text: 100,
  contrast: "standard",
  motion: "system",
  sound: true,
  soundNotify: true,
  soundUi: true,
  soundReward: true,
  focusAlways: false,
};

let state = null;
const listeners = new Set();

function migrate(raw) {
  const s = { ...DEFAULTS, ...raw };
  if (raw.theme && !raw.mode) s.mode = raw.theme; // v1
  delete s.theme;
  if (s.palette === "mfr") s.palette = "signature";
  if (s.palette === "purple") s.palette = "aurora";
  if (!MODES.includes(s.mode)) s.mode = "light";
  if (!(s.palette in PALETTES) && s.palette !== "custom") s.palette = "signature";
  if (!DENSITIES.includes(s.density)) s.density = "comfortable";
  if (!TEXT_SIZES.includes(Number(s.text))) s.text = 100;
  if (!CONTRASTS.includes(s.contrast)) s.contrast = "standard";
  if (!MOTIONS.includes(s.motion)) s.motion = "system";
  for (const k of ["sound", "soundNotify", "soundUi", "soundReward", "focusAlways"]) s[k] = Boolean(s[k]);
  return s;
}
function read() {
  try {
    return migrate(JSON.parse(localStorage.getItem(KEY) || "{}"));
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
    // keep v1's "theme" key too, so the sound module and older tabs read a valid value
    localStorage.setItem(KEY, JSON.stringify({ ...state, theme: resolvedMode(state) }));
  } catch (e) {
    /* storage blocked: the choice lasts until reload */
  }
}

const systemDark = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
const systemReduced = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The mode actually shown: light | dark | night.
export function resolvedMode(s = ensure()) {
  if (s.palette === "midnight" && s.mode === "light") return "dark";
  if (s.mode === "system") return systemDark() ? "dark" : "light";
  return s.mode;
}
export function motionReduced(s = ensure()) {
  return s.motion === "reduced" || (s.motion === "system" && systemReduced());
}

export function getPrefs() {
  return ensure();
}

export function setPrefs(patch) {
  ensure();
  if (patch.theme && !patch.mode) patch = { ...patch, mode: patch.theme }; // v1 callers
  state = migrate({ ...state, ...patch });
  write();
  applyTheme();
  listeners.forEach((l) => l());
}

export function applyTheme() {
  if (typeof document === "undefined") return;
  const s = ensure();
  const root = document.documentElement;
  const mode = resolvedMode(s);
  root.setAttribute("data-hub-theme", mode);
  root.setAttribute("data-hub-motion", motionReduced(s) ? "reduced" : "full");
  // the approved profile studio has its own day/night look: keep it in step with the hub
  try {
    setProfileDark(mode !== "light");
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
  const mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  const mr = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  const onSys = () => {
    applyTheme();
    state = { ...state }; // new snapshot so "system" subscribers re-render
    listeners.forEach((l) => l());
  };
  window.addEventListener("storage", onStorage);
  mq?.addEventListener?.("change", onSys);
  mr?.addEventListener?.("change", onSys);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
    mq?.removeEventListener?.("change", onSys);
    mr?.removeEventListener?.("change", onSys);
  };
}
const snap = () => ensure();
const serverSnap = () => DEFAULTS;

export function usePrefs() {
  return useSyncExternalStore(subscribe, snap, serverSnap);
}

// The CSS variables for the chosen palette (null = the member type's signature colours from the skin CSS).
export function paletteVars(p) {
  const dark = resolvedMode(p) !== "light";
  if (p.palette === "custom") {
    const c = /^#[0-9a-f]{6}$/i.test(p.custom || "") ? p.custom : DEFAULTS.custom;
    const base = dark ? shade(c, 0.28) : c;
    return { "--primary": base, "--secondary": shade(base, dark ? 0.2 : -0.3), "--accent": shade(base, dark ? 0.45 : 0.35), "--primary-hover": shade(base, dark ? 0.12 : -0.12), "--on-primary": onColor(base) };
  }
  const pal = PALETTES[p.palette];
  if (!pal) return null;
  const v = dark ? pal.dark : pal.light;
  return { "--primary": v.primary, "--secondary": v.secondary, "--accent": v.accent, "--primary-hover": shade(v.primary, dark ? 0.12 : -0.12), "--on-primary": onColor(v.primary) };
}

// lighten (amt > 0) or darken (amt < 0) a #rrggbb colour
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt)));
  return `#${ch.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`;
}
// white or near-black text, whichever has the better contrast on this colour (WCAG relative luminance)
export function onColor(hex) {
  const n = parseInt(hex.slice(1), 16);
  const L = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const lum = 0.2126 * L[0] + 0.7152 * L[1] + 0.0722 * L[2];
  return (1.05) / (lum + 0.05) >= (lum + 0.05) / 0.05 ? "#ffffff" : "#0b1020";
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
export const languageOf = (code) => LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
export const dirOf = (code) => languageOf(code).dir || "ltr";

let langNow = null;
export function locale() {
  if (langNow) return langNow;
  langNow = typeof window === "undefined" ? "en" : currentLanguage();
  return langNow;
}
export async function setLanguage(code) {
  const c = resolveLang(code) || DEFAULT_LANG;
  langNow = c;
  try {
    localStorage.setItem(LANG_KEY, c);
  } catch (e) {
    /* blocked */
  }
  document.cookie = `${LANG_KEY}=${encodeURIComponent(c)}; path=/; max-age=31536000; samesite=lax`;
  setStringsLanguage(c);
  state = { ...ensure() }; // new snapshot: localised numbers and dates re-render
  listeners.forEach((l) => l());
  try {
    const m = await import("@/i18n/engine");
    await m.setPageLanguage(c, { interactive: true });
  } catch (e) {
    /* the page stays in English */
  }
}

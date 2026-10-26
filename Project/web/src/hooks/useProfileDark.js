"use client";

import { useSyncExternalStore } from "react";

const KEY = "mfr:dark";
const listeners = new Set();
const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) === true; } catch (e) { return false; }
};
let dark = false;
let ready = false;
const sync = () => { if (!ready && typeof window !== "undefined") { dark = read(); ready = true; } };
const subscribe = (fn) => {
  listeners.add(fn);
  const onStorage = (e) => { if (e.key === KEY) { dark = read(); listeners.forEach((l) => l()); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(fn); window.removeEventListener("storage", onStorage); };
};
const getSnapshot = () => { sync(); return dark; };
export const setProfileDark = (value) => {
  dark = Boolean(value);
  ready = true;
  try { localStorage.setItem(KEY, JSON.stringify(dark)); } catch (e) { /* private mode: the choice lasts until reload */ }
  listeners.forEach((l) => l());
};
export default function useProfileDark() {
  const value = useSyncExternalStore(subscribe, getSnapshot, () => false);
  return [value, () => setProfileDark(!value)];
}

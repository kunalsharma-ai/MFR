"use client";
// v4.1 (App.jsx): a sound on every click - buttons, links, tabs, chips… each plays a note on the instrument of the member's
// language. Answer options play their own rising note from the question flow; sound.js keeps one click to one note.
// The hub's Sound setting (header speaker / Settings > Sound) mutes it, like every other sound here.
import { useEffect } from "react";
import { tap } from "./sound.js";

const SEL = 'button, a[href], [role=button], [role=tab], [role=option], [role=checkbox], [role=radio], [role=switch], summary, label, select, input[type=checkbox], input[type=radio]';
export const soundLang = () => { try { return (localStorage.getItem("mfr.lang") || "en").split("-")[0]; } catch { return "en"; } };

export default function useClickSounds() {
  useEffect(() => {
    const h = (e) => {
      const el = e.target.closest?.(SEL);
      if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return;
      tap(soundLang(), 0, el.matches('[role=tab], .seg button, .chip-lang, .lr-chip') ? "soft" : "press");
    };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);
}

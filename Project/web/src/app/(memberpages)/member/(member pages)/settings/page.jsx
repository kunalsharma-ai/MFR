"use client";
// Member hub redesign (Nov 2026): the screen lives in ../../hub/pages.jsx; this file only mounts it.
import { SettingsPage } from "../../hub/pages.jsx";

export default function page() {
  return <SettingsPage />;
}

"use client";
// Shown on every member page while an admin is signed in as this member ("Log in as member" in MADP). The admin
// sees it too, so nobody forgets whose account this is. Ending the session closes it on the server and signs out.
import React, { useEffect, useState } from "react";
import { api } from "@/util";

const clock = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function AdminSessionBanner({ session }) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(session.expiresAt) - Date.now()));
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, new Date(session.expiresAt) - Date.now())), 15000);
    return () => clearInterval(t);
  }, [session.expiresAt]);
  const end = async () => {
    setBusy(true);
    try { await api.post("/api/v1/me/admin-session/end", {}); } catch {}
    try { localStorage.removeItem("token"); } catch {}
    window.location.href = "/";
  };
  const mins = Math.ceil(left / 60000);
  return (
    <div role="status" aria-live="polite" style={{
      position: "sticky", top: 0, zIndex: 2000, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 16px",
      padding: "10px 16px", background: "#7a1f00", color: "#fff", fontSize: 14, lineHeight: 1.4,
    }}>
      <strong>An admin is signed in as this member.</strong>
      <span>
        {left > 0 ? `Ends at ${clock(session.expiresAt)} (${mins} min left).` : "This session has ended."} Passwords, payout
        details, redeeming and account deletion are turned off.
      </span>
      <button type="button" onClick={end} disabled={busy} style={{
        marginLeft: "auto", padding: "6px 14px", borderRadius: 6, border: "1px solid #fff", background: "transparent",
        color: "#fff", fontWeight: 600, cursor: "pointer",
      }}>
        {busy ? "Ending…" : "End admin session"}
      </button>
    </div>
  );
}

"use client";
// Teen turning 18 (Nov 2026): the move screen. Guardian consent ends at 18, so the member picks Consumer or Business
// Professional and accepts the adult terms and privacy notice in their own name. Until then the rest of the account
// is paused (the API answers adult_terms_required and util/api.js sends the member here).
import React from "react";
import Link from "next/link";
import { api } from "@/util";

const SEGMENTS = [
  { key: "b2c", title: "Consumer", text: "Surveys about everyday life, shopping, media and more." },
  { key: "b2b", title: "Business Professional", text: "Surveys about your work, industry and the tools you use." },
];
const fmt = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : "");

export default function AdultMove() {
  const [info, setInfo] = React.useState(null);
  const [segment, setSegment] = React.useState("");
  const [terms, setTerms] = React.useState(false);
  const [privacy, setPrivacy] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    api.get("/api/v1/teen/adult").then((r) => setInfo(r?.status === "success" ? r.data : { stage: null })).catch(() => setInfo({ stage: null }));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    if (!segment) return setMsg("Choose Consumer or Business Professional.");
    if (!terms || !privacy) return setMsg("Please accept the terms and the privacy notice.");
    setBusy(true);
    const r = await api.post("/api/v1/teen/adult", { segment, acceptTerms: true, acceptPrivacy: true }).catch(() => null);
    setBusy(false);
    if (r?.status === "success") { setDone(true); return; }
    setMsg(r?.message || "Something went wrong. Please try again.");
  }

  if (!info) return <div className="h-card" style={{ padding: 24 }}>Loading…</div>;
  if (done) {
    return (
      <div className="h-card" style={{ padding: 24, maxWidth: 640 }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Welcome to your adult account</h1>
        <p style={{ marginBottom: 16 }}>Your points, your level history and your answers came with you. Your parent or guardian's details have been removed.</p>
        <a className="h-btn h-btn-primary" href="/member/dashboard">Go to my dashboard</a>
      </div>
    );
  }
  if (info.stage !== "turning_adult") {
    return (
      <div className="h-card" style={{ padding: 24, maxWidth: 640 }}>
        <p>Nothing to do here.</p>
        <Link className="h-btn" href="/member/dashboard">Back to my dashboard</Link>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="h-card" style={{ padding: 24, maxWidth: 720, display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: 24 }}>Happy 18th! Let's move you to an adult account</h1>
      <p>Your parent or guardian's permission ended when you turned 18, so you need to agree to the adult terms in your own name. Surveys and rewards are paused until you do. If you haven't agreed by {fmt(info.deadline)}, the account will close and unspent points will lapse.</p>
      <fieldset style={{ display: "grid", gap: 10, border: 0, padding: 0 }}>
        <legend style={{ fontWeight: 600, marginBottom: 8 }}>Which panel fits you?</legend>
        {SEGMENTS.map((s) => (
          <label key={s.key} className="h-card" style={{ padding: 14, display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", outline: segment === s.key ? "2px solid currentColor" : "none" }}>
            <input type="radio" name="segment" value={s.key} checked={segment === s.key} onChange={() => setSegment(s.key)} />
            <span><b>{s.title}</b><br /><small>{s.text}</small></span>
          </label>
        ))}
      </fieldset>
      <label style={{ display: "flex", gap: 10 }}>
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
        <span>I have read and accept the <a href="/terms" target="_blank" rel="noreferrer">Terms and Conditions</a>.</span>
      </label>
      <label style={{ display: "flex", gap: 10 }}>
        <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
        <span>I have read the <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.</span>
      </label>
      <p><small>What happens: your points, level history and your own answers stay. The answers your parent or guardian gave about your home and their work, and their contact details, are deleted, and we let them know their consent has ended. You can check your e-mail, phone and payout details in My Account afterwards.</small></p>
      {msg ? <p role="alert" style={{ color: "#b42318" }}>{msg}</p> : null}
      <div><button type="submit" className="h-btn h-btn-primary" disabled={busy}>{busy ? "Saving…" : "Agree and move my account"}</button></div>
    </form>
  );
}

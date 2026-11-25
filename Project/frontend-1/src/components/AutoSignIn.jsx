import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon.jsx";
import { loginMember } from "../utils/auth.js";
import { flushPendingProfile } from "../utils/signupMemo.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DASHBOARD = "/member/dashboard";

// After the password is saved the member is logged in straight away with that password (the same
// POST /api/v1/user/login the login page uses) and sent to the dashboard. The member portal then shows
// the consent step for their member type, if it is still open. If the email is not known on this device
// (the link was opened elsewhere), it is asked once; if the login fails, the normal "Log in" button stays.
// nextLabel / busyLabel: what the button and the wait say. A new Consumer or Professional member goes to the member
// terms first (the portal sends them there), so the set-password page says "Continue to Terms", not "Open my dashboard".
export default function AutoSignIn({ mail, password, loginHref = "/login", nextLabel = "Open my dashboard", busyLabel = "Opening your dashboard…" }) {
  const [state, setState] = useState(mail ? "signing" : "ask"); // signing | ask | failed | demo
  const [email, setEmail] = useState(mail || "");
  const [msg, setMsg] = useState("");
  const started = useRef(false);

  async function run(address) {
    setState("signing");
    setMsg("");
    try {
      const res = await loginMember({ mail: address.trim().toLowerCase(), password });
      if (res.demo) { setState("demo"); return; }
      await Promise.race([flushPendingProfile(), new Promise((r) => setTimeout(r, 4000))]);
      window.location.href = DASHBOARD;
    } catch (ex) {
      setMsg(ex.message || "We couldn’t log you in automatically.");
      setState("failed");
    }
  }

  useEffect(() => {
    if (mail && password && !started.current) { started.current = true; run(mail); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "signing") {
    return (
      <div className="done-actions" role="status" aria-live="polite">
        <span className="btn btn-primary btn-lg" aria-busy="true">{busyLabel}</span>
      </div>
    );
  }
  if (state === "demo") {
    return <p className="tiny muted" role="status">Preview mode: login simulated, no real account was accessed.</p>;
  }
  if (state === "ask") {
    const ok = EMAIL_RE.test(email.trim());
    return (
      <form className="done-actions" onSubmit={(e) => { e.preventDefault(); if (ok) run(email); }} noValidate>
        <label className="tiny muted" htmlFor="auto-mail">Confirm the email you joined with to continue.</label>
        <input id="auto-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="sx-auto-mail" />
        <button type="submit" className="btn btn-primary btn-lg" disabled={!ok}>{nextLabel} <Icon name="arrow" size={18} /></button>
      </form>
    );
  }
  return (
    <div className="done-actions" role="alert">
      <p className="tiny muted">{msg} Please log in with your email and new password.</p>
      <Link to={loginHref} className="btn btn-primary btn-lg">Log in</Link>
    </div>
  );
}

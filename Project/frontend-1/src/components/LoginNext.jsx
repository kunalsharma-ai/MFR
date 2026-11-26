import { Link } from "react-router-dom";
import Icon from "./Icon.jsx";

// Shown once a new password is saved. The member is NOT logged in automatically any more: they go to the normal
// Log in page and sign in with their email, the new password and the security check (captcha), like every later
// visit. The email they joined with is handed over for this tab only (sessionStorage, never in the URL) so the
// Log in page can fill it in; the password is never passed on.
export const LOGIN_PREFILL_KEY = "mfr.login.prefill";

export function rememberLoginEmail(mail) {
  try {
    if (mail) sessionStorage.setItem(LOGIN_PREFILL_KEY, String(mail).trim().toLowerCase());
  } catch { /* storage blocked: the member types it */ }
}

export function takeLoginEmail() {
  try {
    const m = sessionStorage.getItem(LOGIN_PREFILL_KEY) || "";
    sessionStorage.removeItem(LOGIN_PREFILL_KEY);
    return m;
  } catch {
    return "";
  }
}

export default function LoginNext({ mail, type }) {
  const href = type && type !== "consumer" ? `/login?type=${type}` : "/login";
  return (
    <div className="done-actions">
      <Link to={href} className="btn btn-primary btn-lg" onClick={() => rememberLoginEmail(mail)}>
        Go to Log in <Icon name="arrow" size={18} />
      </Link>
    </div>
  );
}

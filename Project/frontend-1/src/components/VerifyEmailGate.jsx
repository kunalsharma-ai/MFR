import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import VerifyEmailModal from './VerifyEmailModal.jsx';
import { postJSON } from '../utils/api.js';
import { USER_API } from '../data/site.js';


const RESEND_WAIT = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Turns a raw server / network error into something a member can understand and act on.
// Technical texts (e.g. "Unauthorized [No Token Found]", Mongo / JS errors) are never shown as they are.
function resendErrorText(ex) {
  const raw = String((ex && ex.message) || '');
  const status = (ex && ex.status) || 0;
  if (/couldn.t reach the server/i.test(raw)) return raw; // already friendly (network down)
  if (status === 401 || status === 403 || /unauthori[sz]ed|no token|invalid token|forbidden/i.test(raw)) {
    return 'We couldn’t send the email right now. Please log in and try again, or contact support if this keeps happening.';
  }
  if (/cannot read prop|null|not found|no such user|does not exist/i.test(raw)) {
    return 'We couldn’t find an account for this email. Please check the address or sign up again.';
  }
  if (/too many|rate/i.test(raw)) return 'Too many requests. Please wait a minute and try again.';
  return 'We couldn’t send the email right now. Please try again in a few minutes.';
}

export default function VerifyEmailGate() {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  // Open whenever the URL carries a valid ?verifyemail=
  useEffect(() => {
    const raw = (new URLSearchParams(search).get('verifyemail') || '').trim();
    if (raw && raw.length <= 254 && EMAIL_RE.test(raw)) {
      setEmail(raw);
      setMessage('');
    }
  }, [search]);

  // Counts down the resend lock, one tick per second.
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const close = useCallback(() => {
    setEmail('');
    const q = new URLSearchParams(search);
    q.delete('verifyemail');
    const rest = q.toString();
    navigate(`${pathname}${rest ? `?${rest}` : ''}${hash || ''}`, { replace: true });
  }, [search, pathname, hash, navigate]);

  const resend = useCallback(async () => {
    if (busy || cooldown > 0 || !email) return;
    setBusy(true);
    setMessage('');
    try {
      await postJSON(`${USER_API}/resend`, { mail: email });
      setMessage('We’ve sent the email again.');
      setCooldown(RESEND_WAIT);
    } catch (ex) {
      setMessage(resendErrorText(ex));
    } finally {
      setBusy(false);
    }
  }, [busy, cooldown, email]);

  if (!email) return null;
  return <VerifyEmailModal email={email} cooldown={cooldown} busy={busy} message={message} onResend={resend} onClose={close} />;
}
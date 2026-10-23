// Anonymous per-tab session id (sent with OTP requests so codes are bound to this visit).
export function sessionId() {
  let s = null;
  try { s = sessionStorage.getItem('mfr:sid'); } catch { /* blocked storage */ }
  if (!s) { s = crypto.randomUUID?.() || Math.random().toString(36).slice(2); try { sessionStorage.setItem('mfr:sid', s); } catch { /* */ } }
  return s;
}

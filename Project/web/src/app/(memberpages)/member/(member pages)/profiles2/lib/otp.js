// One-time-code verification for email / phone.
// With CONFIG.apiBase the server sends real codes (see server/validation-server.mjs).
// Without it the app runs in DEMO mode: the code is generated locally and shown on screen,
// and the member is NOT marked verified on the server (there is none) - it is only a UI preview.
import { CONFIG } from '../config.js';
import { store } from './storage.js';

const RULES = { ttlMs: 10 * 60e3, maxAttempts: 5, cooldownMs: 45e3, maxSendsPerHour: 5 };
const local = {}; // demo state per target

const api = (path, body) =>
  fetch(CONFIG.apiBase.replace(/\/$/, '') + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) })
    .then(async (r) => ({ status: r.status, ...(await r.json().catch(() => ({}))) }));

export const demoMode = () => !CONFIG.apiBase;

export async function sendCode(channel, target, sessionId) {
  if (!demoMode()) return api('/api/otp/send', { channel, target, sessionId });
  const s = (local[target] ||= { sends: [] });
  const now = Date.now();
  s.sends = s.sends.filter((t) => now - t < 3600e3);
  if (s.last && now - s.last < RULES.cooldownMs) return { ok: false, error: 'cooldown', retryIn: Math.ceil((RULES.cooldownMs - (now - s.last)) / 1000) };
  if (s.sends.length >= RULES.maxSendsPerHour) return { ok: false, error: 'locked' };
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  s.code = String(arr[0] % 1e6).padStart(6, '0');
  s.exp = now + RULES.ttlMs; s.attempts = 0; s.last = now; s.sends.push(now);
  return { ok: true, demoCode: s.code, retryIn: RULES.cooldownMs / 1000, ttl: RULES.ttlMs / 1000 };
}

export async function checkCode(channel, target, code, sessionId) {
  if (!demoMode()) {
    const r = await api('/api/otp/verify', { channel, target, code, sessionId });
    if (r.verified) markVerified(channel, target, r.token);
    return r;
  }
  const s = local[target];
  if (!s || !s.code) return { verified: false, error: 'expired' };
  if (Date.now() > s.exp) { s.code = null; return { verified: false, error: 'expired' }; }
  if (s.attempts >= RULES.maxAttempts) return { verified: false, error: 'locked' };
  s.attempts++;
  if (String(code).trim() !== s.code) return { verified: false, error: 'wrong', left: RULES.maxAttempts - s.attempts };
  s.code = null; // one-time use
  markVerified(channel, target, 'demo');
  return { verified: true, demo: true };
}

export function markVerified(channel, target, token) {
  const v = store.get('mfr:verified', {});
  v[channel] = target; v[channel + 'At'] = new Date().toISOString(); v[channel + 'Token'] = token;
  store.set('mfr:verified', v);
}
export const isVerified = (channel, target) => store.get('mfr:verified', {})[channel] === target;

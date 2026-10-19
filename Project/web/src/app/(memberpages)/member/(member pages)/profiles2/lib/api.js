import { CONFIG } from '../config.js';

/** Sends a finished profile to your backend (if configured). Local saving already happened. */
export async function submitProfile(payload) {
  if (!CONFIG.profileEndpoint) return { ok: true, local: true };
  try {
    const r = await fetch(CONFIG.profileEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...CONFIG.profileHeaders },
      credentials: CONFIG.profileCredentials,
      body: JSON.stringify(CONFIG.memberId ? { memberId: CONFIG.memberId, ...payload } : payload),
      keepalive: true
    });
    return { ok: r.ok, status: r.status };
  } catch (e) {
    console.warn('[profile] submit failed - answers are still saved locally', e);
    return { ok: false };
  }
}

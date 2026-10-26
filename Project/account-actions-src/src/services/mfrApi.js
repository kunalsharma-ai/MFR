// MyFrequentRewards API client for this page: ONE endpoint, POST /api/v1/auth/delete
//
//   body:      { id, action, password }
//                id       the member id the page was opened with (?id=...); the server must still use the signed-in member
//                action   30 | 60 | 90 -> deactivate for that many days; -1 -> put on hold (no end date); "Delete" -> delete the account
//                password the member's password, typed in the Verify step; the server checks it
//   success:   { status: "success", data?: { requestId | id } }
//   failure:   { status: "error", message }   (a message about the password sends the member back to the Verify step)
//
// The page is served from the same origin as the site, so the member's session cookie goes with the request. The Verify step does not call
// the server on its own: it keeps the password in memory (never stored) until the request is sent, so the server sees one call and decides.
import { ACTIONS } from '../config/actions.js';
import { ApiError } from './httpApi.js';

export const DELETE_ENDPOINT = '/api/v1/auth/delete';

export function createMfrApi({ memberId = '' } = {}) {
  let password = '';

  async function send(body) {
    let res;
    try {
      res = await fetch(DELETE_ENDPOINT, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (e) {
      throw new ApiError('We could not reach the server. Check your connection and try again.');
    }
    let data = null;
    try { data = await res.json(); } catch { /* empty body */ }
    return { ok: res.ok && data?.status !== 'error', status: res.status, data };
  }

  return {
    mode: 'http',
    // there is no endpoint for the account status or an open request yet: the page always starts from an active account
    getAccountStatus: async () => ({ status: 'active' }),
    getCurrentRequest: async () => null,

    verifyPassword: async (typed) => { password = typed; return { ok: true, token: 'pending' }; },

    async createRequest(apiAction) {
      const action = Object.values(ACTIONS).find((a) => a.apiAction === apiAction)?.code;
      if (action === undefined) throw new ApiError('This action is not available.');
      const { ok, status, data } = await send({ id: memberId, action, password });
      if (!ok) {
        const message = data?.message || 'Something went wrong. Please try again.';
        // a wrong password: back to the Verify step with the server's message
        if (/password/i.test(message)) throw new ApiError(message, { status: 401, code: 'verification_expired' });
        throw new ApiError(message, { status, code: data?.error || 'server_error', data });
      }
      password = ''; // done: do not keep it
      const d = data?.data || {};
      return { id: d.requestId || d.id || '', action: apiAction, status: 'submitted', submittedAt: new Date().toISOString(), history: [] };
    },

    cancelRequest: async () => { throw new ApiError('A request cannot be cancelled from here.'); },
  };
}

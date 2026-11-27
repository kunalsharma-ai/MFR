// The teen sign-up client (src/teen/api.js) against fake server replies: issues #113 and #118.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { teenApi, TeenApiError, USER_API } from '../src/teen/api.js';

const reply = (status, json) => vi.fn(async () => ({ ok: status < 400, status, json: async () => json }));
afterEach(() => vi.unstubAllGlobals());

describe('teen sign-up request', () => {
  it('goes to PUT /api/v1/user with category "minor" (issue #113)', async () => {
    const fetch = reply(200, { status: 'success', data: { reference: 'TR-1' } });
    vi.stubGlobal('fetch', fetch);
    await expect(teenApi.register({ teen: { firstName: 'Maya' } })).resolves.toEqual({ reference: 'TR-1' });
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe(USER_API);
    expect(url).toMatch(/\/api\/v1\/user$/);
    expect(opts.method).toBe('PUT');
    expect(JSON.parse(opts.body).category).toBe('minor');
  });
  it('an API without the route ("Fallback route", even with status success) is "unavailable", not a fake success (#113)', async () => {
    vi.stubGlobal('fetch', reply(200, { status: 'success', message: 'Fallback route: PUT /api/v1/teen/register is not available', data: {} }));
    await expect(teenApi.ageCheck('2011-01-01')).rejects.toMatchObject({ code: 'unavailable' });
  });
  it('an old API build that saves the teen as an adult ("User validation failed") is "unavailable" (#118)', async () => {
    vi.stubGlobal('fetch', reply(400, { status: 'error', message: 'User validation failed: name.first: Firstname is required' }));
    await expect(teenApi.register({})).rejects.toMatchObject({ code: 'unavailable' });
  });
  it('field errors from the server come through with their code', async () => {
    vi.stubGlobal('fetch', reply(422, { status: 'error', code: 'validation', fields: { 'guardian.email': 'guardian_own_email' } }));
    const err = await teenApi.register({}).catch((e) => e);
    expect(err).toBeInstanceOf(TeenApiError);
    expect(err.code).toBe('validation');
    expect(err.fields).toEqual({ 'guardian.email': 'guardian_own_email' });
  });
  it('no network is "network"', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    await expect(teenApi.status('tok')).rejects.toMatchObject({ code: 'network' });
  });
  it('401 without a code means sign in again', async () => {
    vi.stubGlobal('fetch', reply(401, {}));
    await expect(teenApi.me()).rejects.toMatchObject({ code: 'signin', status: 401 });
  });
  it('tokens are URL-encoded in the path', async () => {
    const fetch = reply(200, { status: 'success', data: {} });
    vi.stubGlobal('fetch', fetch);
    await teenApi.guardian('a/b?c');
    expect(fetch.mock.calls[0][0]).toMatch(/\/guardian\/a%2Fb%3Fc$/);
  });
});

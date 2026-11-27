// The body that sign-up sends to PUT /api/v1/user (adult and teen builders).
import { describe, it, expect } from 'vitest';
import { buildRegisterPayload as adultPayload } from '../src/utils/registerPayload.js';
import { buildRegisterPayload as teenPayload } from '../src/utils/teenRegisterPayload.js';

const CATS = { consumer: 'b2c', professional: 'b2b' };
const form = (over = {}) => ({
  memberType: 'consumer', firstName: ' Asha ', middleName: ' K ', lastName: ' Rao ', gender: 'Female', dob: '1995-04-12',
  email: ' Asha@Example.COM ', phone: '98765 43210', country: 'IN', state: 'KA', city: 'Bengaluru', zip: '560001',
  notify: { email: true, whatsapp: true, sms: false }, marketing: false, agreeTerms: true, password: 'Secret1!', ...over,
});

describe.each([['adult', adultPayload], ['teen builder', teenPayload]])('%s payload', (_, build) => {
  it('lower-cases and trims the email into `mail`', () => expect(build(form(), { dial: '+91', categories: CATS }).mail).toBe('asha@example.com'));
  it('phone is dial code + digits, no plus sign', () => expect(build(form(), { dial: '+91', categories: CATS }).phone).toBe('919876543210'));
  it('never sends a password (it is set from the emailed link)', () => expect(build(form(), { dial: '+91', categories: CATS })).not.toHaveProperty('password'));
  it('country is the lower-case ISO code', () => expect(build(form(), { categories: CATS }).address[0].country).toBe('in'));
  it('middle name is sent only when typed (issue #90)', () => {
    expect(build(form(), { categories: CATS }).name).toEqual({ first: 'Asha', middle: 'K', last: 'Rao' });
    expect(build(form({ middleName: '  ' }), { categories: CATS }).name).not.toHaveProperty('middle');
  });
  it('notification identities: phone for WhatsApp/SMS, email otherwise', () => {
    const n = build(form(), { dial: '91', categories: CATS }).notification;
    expect(n).toEqual([
      { channel: 'email', category: [], identity: 'asha@example.com' },
      { channel: 'whatsapp', category: [], identity: '919876543210' },
    ]);
  });
  it('referredBy only when the visitor came from a referral link', () => {
    expect(build(form(), { categories: CATS })).not.toHaveProperty('referredBy');
    expect(build(form(), { categories: CATS, referredBy: 'abc123' }).referredBy).toBe('abc123');
  });
});

describe('adult payload', () => {
  it('category follows the member type', () => {
    expect(adultPayload(form(), { categories: CATS }).category).toBe('b2c');
    expect(adultPayload(form({ memberType: 'professional' }), { categories: CATS }).category).toBe('b2b');
  });
  it('marketing opt-in is true only when ticked', () => {
    expect(adultPayload(form(), { categories: CATS }).marketingOptIn).toBe(false);
    expect(adultPayload(form({ marketing: 'yes' }), { categories: CATS }).marketingOptIn).toBe(false);
    expect(adultPayload(form({ marketing: true }), { categories: CATS }).marketingOptIn).toBe(true);
  });
  it('records the terms box', () => expect(adultPayload(form(), { categories: CATS }).termsAccepted).toBe(true));
  it('leaves out the zip code when the member has none', () => expect(adultPayload(form({ noZip: true }), { categories: CATS }).address[0]).not.toHaveProperty('zipcode'));
});

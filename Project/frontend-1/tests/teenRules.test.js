// Teen sign-up rules on the website (src/teen/rules.js). The API has its own copy, tested in api/tests/teen.rules.test.mjs.
import { describe, it, expect } from 'vitest';
import * as R from '../src/teen/rules.js';

const NOW = new Date('2026-11-27T12:00:00Z');
const dobAge = (n) => `${2026 - n}-06-01`;
const WORLD = { IN: { name: 'India', states: { KA: { name: 'Karnataka' } }, zipFormat: '######' } };
const teen = (over = {}) => ({
  firstName: 'Maya', lastName: 'Shah', dob: dobAge(15), email: 'maya@example.com', gender: 'Female',
  location: { country: 'IN', stateCode: 'KA', city: 'Bengaluru', zip: '560001' }, ...over,
});
const guardian = (over = {}) => ({ relation: 'mother', firstName: 'Rina', lastName: 'Shah', dob: '1985-03-03', email: 'rina@example.com', ...over });

describe('age bands', () => {
  it('under 13 is blocked, 13-17 is teen, 18 is adult', () => {
    expect(R.classifyDob(dobAge(12), NOW)).toBe('blocked');
    expect(R.classifyDob(dobAge(13), NOW)).toBe('teen');
    expect(R.classifyDob(dobAge(17), NOW)).toBe('teen');
    expect(R.classifyDob('2008-01-01', NOW)).toBe('adult');
  });
  it('a future date is not a teen', () => expect(R.classifyDob('2027-01-01', NOW)).toBe('future'));
});

describe('teen details', () => {
  it('a complete teen has no errors', () => expect(R.validateTeen(teen(), { world: WORLD, now: NOW })).toEqual({}));
  it('maps age problems to their codes', () => {
    expect(R.validateTeen(teen({ dob: dobAge(12) }), { world: WORLD, now: NOW }).dob).toBe('under_13');
    expect(R.validateTeen(teen({ dob: '2000-01-01' }), { world: WORLD, now: NOW }).dob).toBe('adult');
  });
  it('gender is Male, Female or Other only (PR #96)', () => {
    expect(R.TEEN_GENDERS).toEqual(['Male', 'Female', 'Other']);
    expect(R.validateTeen(teen({ gender: 'Non-binary' }), { world: WORLD, now: NOW }).gender).toBe('gender');
  });
  it('state must belong to the country unless typed by hand', () => {
    expect(R.validateTeen(teen({ location: { country: 'IN', stateCode: 'XX', city: 'B', zip: '560001' } }), { world: WORLD, now: NOW }).state).toBe('state');
    expect(R.validateTeen(teen({ location: { country: 'IN', stateManual: true, state: 'New State', city: 'B', zip: '560001' } }), { world: WORLD, now: NOW }).state).toBeUndefined();
  });
  it('zip required where the country has postcodes', () => expect(R.validateTeen(teen({ location: { country: 'IN', stateCode: 'KA', city: 'B' } }), { world: WORLD, now: NOW }).zip).toBe('zip_required'));
});

describe('guardian details', () => {
  it('a complete guardian has no errors', () => expect(R.validateGuardian(guardian(), teen(), { now: NOW })).toEqual({}));
  it('guardian email may not be the teen email (any case)', () => expect(R.validateGuardian(guardian({ email: 'MAYA@example.com' }), teen(), { now: NOW }).email).toBe('guardian_own_email'));
  it('guardian must be 18+', () => expect(R.validateGuardian(guardian({ dob: dobAge(16) }), teen(), { now: NOW }).dob).toBe('guardian_adult'));
  it('legal guardian is asked for gender, mother/father imply it', () => {
    expect(R.validateGuardian(guardian({ relation: 'legal_guardian' }), teen(), { now: NOW }).gender).toBe('gender');
    expect(R.guardianGender({ relation: 'mother' })).toBe('Female');
    expect(R.guardianGender({ relation: 'father' })).toBe('Male');
  });
  it('relation must be one of the three', () => expect(R.validateGuardian(guardian({ relation: 'uncle' }), teen(), { now: NOW }).relation).toBe('relation'));
});

describe('status flow', () => {
  it('only allowed moves', () => {
    expect(R.canMove('pending_guardian_approval', 'guardian_approved')).toBe(true);
    expect(R.canMove('pending_guardian_approval', 'active')).toBe(false);
    expect(R.canMove('rejected', 'active')).toBe(false);
  });
  it('final states have no way out', () => {
    for (const s of ['rejected', 'cancelled']) expect(R.TRANSITIONS[s] || []).toEqual([]);
  });
});

describe('helpers', () => {
  it('masks the guardian email but keeps the domain', () => expect(R.maskEmail('kunal@example.com')).toBe('ku•••@example.com'));
  it('clean strips tags and control characters', () => expect(R.clean('<b>hi</b>\u0007')).toBe('bhi/b'));
});

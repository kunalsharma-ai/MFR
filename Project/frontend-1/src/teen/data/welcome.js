// The Teen welcome survey: a short first set of questions shown once, right after the first log in.
// Every question is taken word for word from the Teen Profile Survey (Global Teen Research Panel Questionnaire,
// teenProfiles.js) — nothing is invented. It asks only the basics that are NOT already known from:
//   • the teen's registration  → date of birth (D01 age), gender (D06), country (D02), state/region (D03)
//   • the parent's onboarding  → nothing that belongs to the teen's own profile
// Those known answers are written into the teen's profile at activation and shown as "already saved", never asked.
import { MINOR_PROFILES } from './teenProfiles.js';

// Registration answers that fill profile questions automatically (key in teenProfiles.js → where it comes from)
export const KNOWN_KEYS = {
  D01: 'registration.dob (age only)',
  D02: 'registration.country',
  D03: 'registration.state',
  D06: 'registration.gender',
};

// The welcome survey itself, in this order (all from the Basics, School & learning, Home & family and Devices profiles)
export const WELCOME_KEYS = ['D04', 'D05', 'D10', 'D08', 'D09', 'H01', 'T01'];

const ALL = new Map();
MINOR_PROFILES.forEach((p) => p.sections.forEach((s) => s.qs.forEach((q) => ALL.set(q.n, { ...q, profile: p.id, profileName: p.name, profileIcon: p.icon }))));
export const questionByKey = (k) => ALL.get(k);
export const WELCOME_QUESTIONS = WELCOME_KEYS.map((k) => ALL.get(k)).filter(Boolean);

// The teen's own confirmations on step 3 of the Teen registration.
//
// Where the wording comes from (nothing here is new legal language):
//   • `assent`        — Part C of the MyFrequentRewards teen agreement MINOR-2026.10 ("Your decision"), word for word,
//                       with its seven "If you join" points shown above the box (consent.js → ASSENT).
//   • `participation`, `accurate`, `terms`, `privacy`
//                     — the teen sign-up confirmations already live on the site (Teen sign-up, round 12).
// Each box is separate, starts unticked and is recorded with its own text, this version and the time.
// LEGAL REVIEW: the version string and every sentence below must be confirmed by counsel before go-live
// (see docs/teen-registration/LEGAL-REVIEW.md).
import { ASSENT, TERMS_VERSION } from './consent.js';

export const TEEN_CONSENT_VERSION = 'TEEN-REG-2026.11';

export const TEEN_CONSENT = {
  version: TEEN_CONSENT_VERSION,
  agreement: TERMS_VERSION,
  assentPoints: ASSENT,
  items: [
    {
      id: 'assent',
      required: true,
      icon: 'hand',
      title: 'My own decision',
      text: 'Yes, I understand the explanation and want to take part.',
      source: 'MINOR-2026.10 Part C',
    },
    {
      id: 'participation',
      required: true,
      icon: 'family',
      title: 'Parent or guardian first',
      text: 'I understand I can only take part in age-appropriate research after my parent or guardian gives permission, and that either of us can stop at any time.',
      source: 'Teen sign-up (site)',
    },
    {
      id: 'accurate',
      required: true,
      icon: 'check',
      title: 'True details',
      text: 'The details about me and my parent or guardian are true and accurate.',
      source: 'Teen sign-up (site)',
    },
    {
      id: 'terms',
      required: true,
      icon: 'doc',
      title: 'Terms',
      text: 'I have read and accept the Terms and Conditions.',
      links: [['/terms', 'Terms and Conditions'], ['/teen-terms', 'Teen research terms (MINOR-2026.10)']],
      source: 'Teen sign-up (site)',
    },
    {
      id: 'privacy',
      required: true,
      icon: 'lock',
      title: 'Privacy',
      text: 'I have read and accept the Privacy Policy.',
      links: [['/privacy', 'Privacy Policy'], ['/teen-terms#information-we-may-collect', 'Teen privacy information']],
      source: 'Teen sign-up (site)',
    },
  ],
};

export default TEEN_CONSENT;

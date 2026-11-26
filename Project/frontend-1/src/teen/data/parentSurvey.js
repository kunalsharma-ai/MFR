/**
 * STEP 1 of the parent onboarding page — "Module 1: Parent/Guardian Registration".
 *
 * Source: Global Teen Research Panel Questionnaire (Ages 13-17), Module 1.
 * Question keys (P01 … P12, HQ1/HQ2/HQ4) are kept exactly as the questionnaire
 * numbers them, so the data your backend receives lines up with the master
 * document without a translation table.
 *
 * v2.0 changes (all requested):
 *   · the name is three boxes — first (required), middle and last (optional) —
 *     stored as parent-first-name / parent-middle-name / parent-last-name, plus
 *     the joined `parent-name` the v1 backend already reads;
 *   · the age band P05 is now worked out from a date of birth picked on a
 *     calendar (`parent-dob`), so P05 is still sent, unchanged in format;
 *   · P07 "How would you prefer us to contact you?" takes several answers;
 *   · the mobile number has every country, with its flag, name and dial code;
 *   · marital status uses the same five values as the Member Profile Studio's
 *     `relationship` question, so both pages store identical values;
 *   · the optional health section asks for itself much more clearly.
 *
 * v2.1 (Nov 2026, master teen question bank): the parent also fills the parent-answered profile questions
 * (module 04 Household, module 05 Parent socio-economic) in two optional sections, "Your home" and "Work &
 * income", with the SAME keys and stored values as the teen bank (teenProfiles.js, `by: 'parent'`), so their
 * answers are copied into the teen's profile when the account is activated. P07 gains "Through my parent
 * dashboard"; P13–P15 (invitation approval, research methods, contact frequency) are new and optional.
 *
 * Option format: [label, stored value, emoji]. The emoji is unique within the
 * question and chosen for that answer (tests/data.test.mjs enforces both).
 */

import { MINOR_PROFILES } from './teenProfiles.js';

// a parent-answered teen profile question, worded for the parent but with the teen bank's key, options and values
const TEEN_Q = new Map();
MINOR_PROFILES.forEach((p) => p.sections.forEach((s) => s.qs.forEach((q) => TEEN_Q.set(q.n, q))));
function fromTeen(n, q, extra = {}) {
  const t = TEEN_Q.get(n);
  if (!t) throw new Error(`parentSurvey: ${n} is not in teenProfiles.js`);
  return {
    n, q, kind: t.kind || 'choice', req: false,
    ...(t.multi ? { multi: true } : {}),
    ...(t.o ? { o: t.o.map((o) => [...o]) } : {}),
    ...(t.exclusive ? { exclusive: [...t.exclusive] } : {}),
    ...(t.other ? { other: t.other } : {}),
    profile: true, // copied into the teen's profile on activation
    ...extra,
  };
}

export const PARENT_SURVEY = {
  id: 'parent__registration',
  owner: 'parent',
  name: 'Parent & guardian registration',
  blurb: 'About you, so we know who is giving permission.',
  icon: '🧑‍🍼',
  theme: 'trust',
  sections: [
    // ───────────────────────── who you are ─────────────────────────
    {
      name: 'About you',
      icon: '👤',
      qs: [
        {
          n: 'parent-first-name',
          kind: 'name',
          q: 'What is your name?',
          help: 'As it appears on the documents you would use to confirm you are the teenager’s parent or guardian. Only your first name is required.',
          fields: ['parent-first-name', 'parent-middle-name', 'parent-last-name'],
          joined: 'parent-name',
          req: true,
        },
        {
          n: 'parent-gender',
          q: 'How do you describe yourself?',
          kind: 'choice',
          req: true,
          // Male, Female, Other: the same three choices as every sign-up (Kunal, 26 Nov 2026)
          o: [['Male', 'Male', '👨'], ['Female', 'Female', '👩'], ['Other', 'Other', '🧑']],
        },
        {
          n: 'parent-dob',
          q: 'What is your date of birth?',
          help: 'Pick it on the calendar — tap the year to jump straight to it. We use it to confirm you are an adult.',
          kind: 'dob',
          segment: 'adult',
          derive: 'P05', // the questionnaire's age band, worked out for you
          req: true,
        },
        { n: 'P01', q: 'In which country do you live?', kind: 'country', req: true },
        { n: 'P02', q: 'Which state, province or region do you live in?', kind: 'region', from: 'P01', req: true },
      ],
    },

    // ──────────────────── relationship & authority ────────────────────
    {
      name: 'Your household',
      icon: '🏡',
      qs: [
        {
          n: 'P03',
          q: 'What is your relationship to the teenager?',
          kind: 'choice',
          req: true,
          o: [
            ['Mother', 'mother', '👩‍👧'],
            ['Father', 'father', '👨‍👦'],
            ['Legal guardian', 'guardian', '🛡️'],
            ['Foster guardian', 'foster', '🤝'],
            ['Other legally authorised caregiver', 'caregiver', '💙'],
          ],
          other: 'caregiver',
        },
        {
          n: 'parent-marital',
          q: 'What is your marital status?',
          kind: 'choice',
          req: true,
          // identical values to the Studio's `relationship` question
          o: [
            ['Single, never married', 'Single, never married', '🧍'],
            ['Married', 'Married', '💍'],
            ['Separated, divorced or widowed', 'Separated, divorced or widowed', '🕊️'],
            ['Domestic partnership / living with someone', 'Domestic partnership/living with someone', '🏠'],
            ['Prefer not to say', 'Prefer not to say', '🤐'],
          ],
        },
        {
          n: 'P04',
          q: 'Are you legally authorised to give permission for this teenager to take part?',
          help: 'Only a parent or a legally authorised guardian can give this permission.',
          kind: 'choice',
          req: true,
          gate: true, // 'no' stops the flow, 'unsure' sends the record for manual review
          o: [
            ['Yes, I am', 'yes', '✅'],
            ['No, I am not', 'no', '🚫'],
            ['I am not sure', 'unsure', '🤔'],
          ],
        },
        {
          n: 'P11',
          q: 'How many children aged 13–17 are you parenting?',
          kind: 'choice',
          req: true,
          o: [
            ['1', '1', '🧒'],
            ['2', '2', '👫'],
            ['3', '3', '👨‍👩‍👧'],
            ['4 or more', '4+', '👨‍👩‍👧‍👦'],
          ],
        },
      ],
    },

    // ───────────────────────── how we reach you ─────────────────────────
    {
      name: 'Staying in touch',
      icon: '📬',
      qs: [
        {
          n: 'P06',
          q: 'Which language would you like us to write to you in?',
          kind: 'language',
          req: true,
        },
        {
          n: 'P07',
          q: 'How would you prefer us to contact you?',
          help: 'Choose as many as suit you.',
          kind: 'choice',
          multi: true,
          req: true,
          o: [
            ['Email', 'email', '✉️'],
            ['SMS', 'sms', '💬'],
            ['Phone call', 'call', '📞'],
            ['WhatsApp, where lawful', 'whatsapp', '🟢'],
            ['Through my parent dashboard', 'dashboard', '🖥️'],
          ],
        },
        {
          n: 'P08',
          q: 'What is your email address?',
          help: 'Consent confirmations and anything that needs your approval go here.',
          kind: 'email',
          req: true,
        },
        {
          n: 'P09',
          q: 'What is your mobile number?',
          help: 'Pick your country first — its flag and dial code fill in for you.',
          kind: 'phone',
          req: false,
          // required as soon as SMS, a phone call or WhatsApp is one of the choices
          reqWhen: (a) => (Array.isArray(a.P07) ? a.P07 : [a.P07]).some((v) => ['sms', 'call', 'whatsapp'].includes(v)),
        },
        {
          n: 'P12',
          q: 'Would you like to receive panel administration messages?',
          help: 'Policy changes, consent renewals and account notices. Messages required by law are sent either way.',
          kind: 'choice',
          req: true,
          o: [
            ['Yes, keep me updated', 'yes', '🔔'],
            ['No, only what is required', 'no', '🔕'],
          ],
        },
        {
          n: 'P13',
          q: 'Would you like to approve every study invitation yourself?',
          kind: 'choice',
          req: false,
          o: [
            ['Yes, every one', 'every', '✋'],
            ['No, any study within the topics I agreed to', 'categories', '✅'],
          ],
        },
        {
          n: 'P14',
          q: 'Which kinds of research may your teen be invited to?',
          kind: 'choice',
          multi: true,
          req: false,
          o: [
            ['Surveys', 'surveys', '📝'],
            ['Interviews', 'interviews', '🎙️'],
            ['Focus groups', 'focus-groups', '👥'],
            ['Product testing', 'product-testing', '📦'],
            ['Research communities', 'research-communities', '🤝'],
            ['None of these', 'none', '🚫'],
          ],
          exclusive: ['none'],
        },
        {
          n: 'P15',
          q: 'How often may we contact you?',
          kind: 'choice',
          req: false,
          o: [
            ['Weekly', 'weekly', '🗓️'],
            ['Every two weeks', 'fortnightly', '📆'],
            ['Monthly', 'monthly', '📅'],
            ['Only when something needs me', 'relevant', '🔔'],
          ],
        },
      ],
    },

    // ───── optional: parent profiling (master bank modules 04 + 05), copied into the teen's profile ─────
    {
      name: 'Your home',
      icon: '🏠',
      optional: true,
      profile: 'minor__household',
      lead: 'Optional. These answers fill the “Home & family” part of your teen’s profile, so they are not asked again.',
      qs: [
        fromTeen('H02', 'How many people live in your home, counting yourself?'),
        fromTeen('H03', 'How many brothers and sisters does your teen have?'),
        fromTeen('H002', 'How many children under 18 live in your home?'),
        fromTeen('H003', 'Which age groups live in your home?'),
        fromTeen('H005', 'What kind of home do you live in?'),
        fromTeen('H006', 'Which pets live in your home?'),
        fromTeen('H007', 'What do you have at home?'),
        fromTeen('G006', 'Which language is spoken most at home?'),
      ],
    },
    {
      name: 'Work & income',
      icon: '💼',
      optional: true,
      profile: 'minor__family',
      lead: 'Optional, and every question has “Prefer not to answer”. Used only to group answers, never shown to a client with your name.',
      qs: [
        fromTeen('S001', 'What is your work situation?'),
        fromTeen('S002', 'What is your highest level of education?'),
        fromTeen('S003', 'What is your yearly household income?'),
        fromTeen('S004', 'How many adults in your home earn an income?'),
        fromTeen('S005', 'Which of these does your household have?'),
      ],
    },

    // ─────────────────── optional: teen health & caregiving ───────────────────
    {
      name: 'Your teen’s health',
      icon: '💚',
      optional: true,
      intro: {
        art: 'care',
        kicker: 'About your child’s health',
        title: 'Three questions that keep your child safe on the panel.',
        body:
          'These questions are about your teenager’s health, and they matter more than anything else on this page. '
          + 'They are the only way we can keep studies about medicines, food, allergies or conditions away from a child '
          + 'they could upset or harm. Parents who answer them get a safer, better-matched panel for their child. '
          + 'It takes under a minute.',
        reasons: [
          ['🛡️', 'Unsafe studies are blocked for your child',
            'A product test with an allergen, a diet study or a survey about a condition your child lives with can be '
            + 'stopped before it ever reaches them — but only if we know. Left blank, we cannot protect them from it.'],
          ['🩺', 'Health research that suits them, with more points',
            'Studies that need teenagers with a particular condition are rarer, longer and earn more points. With this '
            + 'section blank, your teen is never matched to one.'],
          ['🤲', 'Caregiver studies, rewarded to you',
            'If you look after your teen’s health, you become eligible for caregiver research answered by you and '
            + 'rewarded to you in points.'],
        ],
        assurance:
          'Stored apart from everything else, never shown to a client in a way that identifies your child, and every '
          + 'question has a “Prefer not to disclose” answer. You stay in control.',
        startLabel: 'Protect my child — answer now',
        skipLabel: 'Skip for now',
        // the second, gentler ask shown when Skip is pressed
        confirm: {
          title: 'Are you sure? This is the part that protects your child.',
          body:
            'Without these answers we cannot screen out studies that could be unsuitable for your teen’s health. '
            + 'It is three quick questions, and “Prefer not to disclose” is always an option.',
          stay: 'Answer the 3 questions',
          leave: 'Skip anyway',
        },
        skipNote: 'You can come back to this section at any time from your profile.',
      },
      qs: [
        {
          n: 'HQ1',
          q: 'Does your teen currently have a diagnosed or long-term health condition?',
          kind: 'choice',
          multi: true,
          req: false,
          o: [
            ['Asthma or other respiratory condition', 'respiratory', '🫁'],
            ['Diabetes', 'diabetes', '🩸'],
            ['Heart or cardiovascular condition', 'cardio', '❤️'],
            ['Epilepsy or seizure disorder', 'epilepsy', '⚡'],
            ['Allergy or chronic allergic condition', 'allergy', '🤧'],
            ['Skin condition, such as eczema or psoriasis', 'skin', '🧴'],
            ['Gastrointestinal or digestive condition', 'gastro', '🍽️'],
            ['Neurological condition', 'neuro', '🧠'],
            ['Physical disability or mobility-related condition', 'mobility', '♿'],
            ['Developmental condition', 'developmental', '🧩'],
            ['Mental or behavioural health condition', 'mental', '🫂'],
            ['Other diagnosed medical condition', 'other', '📋'],
            ['None of these', 'none', '💪'],
            ['Prefer not to disclose', 'na', '🤐'],
          ],
          other: 'other',
          exclusive: ['none', 'na'],
        },
        {
          n: 'HQ2',
          q: 'Are you currently a caregiver for your teen in relation to a health condition, disability or ongoing health need?',
          kind: 'choice',
          req: false,
          o: [
            ['Yes, I am the primary caregiver', 'primary', '🤲'],
            ['Yes, I share caregiving responsibilities', 'shared', '🤝'],
            ['No, I am not a caregiver', 'no', '🙂'],
            ['No, another person is primarily responsible', 'other-person', '👥'],
            ['Not applicable', 'na-applicable', '➖'],
            ['Prefer not to answer', 'na', '🤐'],
          ],
        },
        {
          n: 'HQ4',
          q: 'Do you regularly help your teen with any of the following?',
          kind: 'choice',
          multi: true,
          req: false,
          when: (a) => ['primary', 'shared'].includes(a.HQ2),
          o: [
            ['Managing medication or treatment', 'medication', '💊'],
            ['Attending medical appointments', 'appointments', '🏥'],
            ['Managing daily activities because of a health condition', 'daily', '🗓️'],
            ['Monitoring symptoms or health needs', 'monitoring', '📈'],
            ['Coordinating healthcare or support services', 'coordinating', '📞'],
            ['Providing emotional or behavioural support', 'emotional', '💙'],
            ['None of the above', 'none', '➖'],
            ['Prefer not to answer', 'na', '🤐'],
          ],
          exclusive: ['none', 'na'],
        },
      ],
    },
  ],
};

export default PARENT_SURVEY;

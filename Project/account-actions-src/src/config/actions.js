// Single source of truth for every account action, palette and support status.
// All user-facing text lives here (and in copy.js) so it can be translated in one place.

export const SLA_TEXT = 'Within 7 working days';
export const SLA_SENTENCE = 'Your request will be processed by the MyFrequentRewards Support Team within 7 working days.';

/**
 * Per-option palettes.
 * c1/c2/c3  accent colours        ink     text colour on the filled button
 * b1/b2     filled button gradient strong  accent text in the light theme (AA contrast on pastel)
 * d1/d2     dark-theme card ground l1/l2  light-theme card ground (never white)
 */
export const PALETTES = {
  d30:   { c1: '#FF8A00', c2: '#FFC233', c3: '#FF5E3A', b1: '#FF8A00', b2: '#FFC233', ink: '#2A1200', strong: '#B45309', d1: '#3A1704', d2: '#170B33', l1: '#FFF4E3', l2: '#FFE2C2' },
  d60:   { c1: '#14C9B5', c2: '#7CF5E4', c3: '#2F6BFF', b1: '#14C9B5', b2: '#7CF5E4', ink: '#032622', strong: '#0F766E', d1: '#04313A', d2: '#081A4D', l1: '#E3FBF7', l2: '#D6EEFF' },
  d90:   { c1: '#8B5CF6', c2: '#FF7E98', c3: '#C4B5FD', b1: '#7C3AED', b2: '#DB2777', ink: '#FFFFFF', strong: '#6D28D9', d1: '#24104F', d2: '#120A33', l1: '#F2ECFF', l2: '#FFE4EC' },
  hold:  { c1: '#38BDF8', c2: '#A5F3FC', c3: '#6366F1', b1: '#38BDF8', b2: '#A5F3FC', ink: '#04223A', strong: '#0369A1', d1: '#062A4A', d2: '#14114A', l1: '#E6F6FF', l2: '#E7E8FF' },
  del:   { c1: '#E11D48', c2: '#FF6B7A', c3: '#9F1239', b1: '#BE123C', b2: '#E11D48', ink: '#FFFFFF', strong: '#BE123C', d1: '#3D0716', d2: '#1A0820', l1: '#FFF0F2', l2: '#FFE0E6' },
  react: { c1: '#22C55E', c2: '#A3E635', c3: '#14C9B5', b1: '#22C55E', b2: '#A3E635', ink: '#052E16', strong: '#15803D', d1: '#06331C', d2: '#072A3A', l1: '#EAFCF1', l2: '#E0F8F4' },
};

/** Background "mood" colours (page colour grading) */
export const MOODS = {
  mfr:   ['#FF8A00', '#2F6BFF', '#FFC233'],
  d30:   ['#FF8A00', '#FF5E3A', '#FFC233'],
  d60:   ['#14C9B5', '#2F6BFF', '#7CF5E4'],
  d90:   ['#8B5CF6', '#FF5E7E', '#C4B5FD'],
  hold:  ['#38BDF8', '#6366F1', '#A5F3FC'],
  del:   ['#FF4D5E', '#9F1239', '#FF8A00'],
  react: ['#22C55E', '#14C9B5', '#A3E635'],
};

export const paletteVars = (k) => {
  const p = PALETTES[k];
  return {
    '--c1': p.c1, '--c2': p.c2, '--c3': p.c3, '--b1': p.b1, '--b2': p.b2, '--ink': p.ink,
    '--strong': p.strong, '--d1': p.d1, '--d2': p.d2, '--l1': p.l1, '--l2': p.l2,
  };
};

const TEMP_BULLETS = [
  'Your account will be deactivated.',
  'You will not be able to participate during the deactivation period.',
  'Your account will remain in our system.',
  'Your account can be reactivated according to the applicable reactivation process.',
  'Your request will be reviewed by our Support Team.',
];

const temp = (n, extra) => ({
  key: `d${n}`,
  apiAction: `deactivate_${n}`,
  code: n, // sent to POST /api/v1/auth/delete as `action`: the number of days
  label: `Deactivate for ${n} Days`,
  cta: `Deactivate for ${n} Days`,
  internal: `Temporary Deactivation — ${n}`,
  type: 'Temporary Deactivation',
  durationLabel: 'Duration',
  duration: `${n} Days`,
  title: `Deactivate Your Account for ${n} Days?`,
  bullets: TEMP_BULLETS,
  summary: `You have requested to temporarily deactivate your MyFrequentRewards account for ${n} days.`,
  ticketType: 'Account Deactivation',
  ticketRequest: `${n}-Day Temporary Deactivation`,
  emailType: `Temporary Deactivation (${n} days)`,
  completedEmail: {
    heading: 'Your MyFrequentRewards account has been temporarily deactivated.',
    rows: [['Deactivation period', `${n} days`], ['Status', 'Deactivated']],
  },
  result: { status: 'deactivated', days: n },
  chips: [['cal', `${n} days`], ['shield', 'Account stays in our system']],
  ...extra,
});

export const ACTIONS = {
  d30: temp(30, { tag: 'Short break', tagIcon: 'sun', desc: 'Take a short break from MyFrequentRewards. Your account will be temporarily deactivated for 30 days.' }),
  d60: temp(60, { tag: 'Longer break', tagIcon: 'hourglass', desc: 'Take a longer break. Your account will be temporarily deactivated for 60 days.' }),
  d90: temp(90, { tag: 'Season off', tagIcon: 'orbit', desc: 'Temporarily deactivate your account for 90 days.' }),
  hold: {
    key: 'hold', apiAction: 'hold', code: -1, // -1 = on hold, no end date
   
    label: 'Put My Account on Hold', cta: 'Put Account on Hold', tag: 'No end date', tagIcon: 'snow',
    desc: "Put your account on hold until you decide to return. You can request reactivation whenever you're ready.",
    internal: 'Indefinite Hold', type: 'Account Hold', durationLabel: 'Duration', duration: 'Until you request reactivation',
    title: 'Put Your Account on Hold?',
    bullets: [
      'Your account will be put on hold.',
      'You will not be able to participate while your account is on hold.',
      'Your account will remain in our system.',
      "You can request reactivation whenever you're ready.",
      'Your request will be reviewed by our Support Team.',
    ],
    summary: 'You have requested to put your MyFrequentRewards account on hold until you decide to return.',
    ticketType: 'Account Hold', ticketRequest: 'Indefinite Hold', emailType: 'Account Hold',
    completedEmail: {
      heading: 'Your MyFrequentRewards account has been put on hold.',
      rows: [['Hold period', 'Until you request reactivation'], ['Status', 'On hold']],
      note: "You can request reactivation whenever you're ready from My Account.",
    },
    result: { status: 'hold' },
    chips: [['pause', 'Until you return'], ['power', 'Reactivate any time'], ['shield', 'Account stays in our system']],
  },
  del: {
    key: 'del', apiAction: 'delete', code: 'Delete', // permanent deletion
    label: 'Permanently Delete My Account', cta: 'Delete My Account', tag: 'Permanent', tagIcon: 'alert',
    desc: 'Permanently delete your MyFrequentRewards account. This request cannot normally be reversed after it has been completed.',
    internal: 'Permanent Deletion Request', type: 'Permanent Account Deletion', durationLabel: 'Duration', duration: 'Permanent',
    title: 'Permanent Account Deletion',
    intro: 'You are requesting permanent deletion of your MyFrequentRewards account.',
    warnings: [
      'You may lose access to your account.',
      'Your account may no longer be recoverable after deletion is completed.',
      'Any applicable rewards/benefits may be affected according to the MyFrequentRewards terms.',
      'Certain information may need to be retained where required by law or for legitimate legal/security purposes.',
      'Your request will be processed by the MyFrequentRewards Support Team.',
    ],
    summary: 'You have requested permanent deletion of your MyFrequentRewards account.',
    ticketType: 'Account Deletion', ticketRequest: 'Permanent Deletion Request', emailType: 'Permanent Account Deletion',
    completedEmail: { heading: 'Your MyFrequentRewards account deletion request has been completed.', rows: [] },
    result: { status: 'deleted' },
    chips: [['alert', 'Extra warning step'], ['lock', 'Password required'], ['headset', 'Processed by Support']],
  },
  react: {
    key: 'react', apiAction: 'reactivate',
    label: 'Reactivate My Account', cta: 'Reactivate My Account', tag: 'Account on hold', tagIcon: 'pause',
    desc: 'Your MyFrequentRewards account is currently on hold. Would you like to reactivate it?',
    internal: 'Reactivation / Unhold', type: 'Reactivation', durationLabel: 'Current status', duration: 'On hold',
    confirmDurationLabel: 'Effective', confirmDuration: 'Once processed by Support',
    title: 'Reactivate Your Account?',
    bullets: [
      'Your account will be taken off hold and reactivated.',
      'You will be able to participate again once reactivation is complete.',
      'Your existing account details stay the same.',
      'Your request will be reviewed by our Support Team.',
    ],
    summary: 'You have requested to reactivate your MyFrequentRewards account.',
    ticketType: 'Account Reactivation', ticketRequest: 'Reactivation / Unhold', emailType: 'Account Reactivation',
    completedEmail: {
      heading: 'Your MyFrequentRewards account has been reactivated.',
      rows: [['Status', 'Active']],
      note: 'Welcome back. You can sign in and take surveys again.',
    },
    result: { status: 'active' },
    chips: [['lock', 'Password required'], ['headset', 'Processed by Support'], ['clock', 'Within 7 working days']],
  },
};

export const TEMP_KEYS = ['d30', 'd60', 'd90'];

/** Maps API action codes back to UI keys */
export const KEY_BY_API = Object.fromEntries(Object.values(ACTIONS).map((a) => [a.apiAction, a.key]));

export const STATUS = {
  submitted:         { label: 'Request Submitted', desc: 'You have submitted the request.', ticket: 'Pending Support Action', tone: 'amber' },
  under_review:      { label: 'Under Review', desc: 'Our Support Team is reviewing your request.', ticket: 'Under Review', tone: 'blue' },
  in_progress:       { label: 'Action in Progress', desc: 'Support has started processing your request.', ticket: 'Action in Progress', tone: 'violet' },
  completed:         { label: 'Completed', desc: 'The requested action has been completed.', ticket: 'Completed', tone: 'green' },
  unable_to_process: { label: 'Unable to Process', desc: 'Your request cannot be completed right now. Our Support Team will contact you.', ticket: 'Unable to Process', tone: 'red' },
  cancelled:         { label: 'Cancelled', desc: 'You cancelled this request before it was completed. No changes were made.', ticket: 'Cancelled', tone: 'grey' },
};
export const FLOW = ['submitted', 'under_review', 'in_progress', 'completed'];
export const TERMINAL = ['completed', 'unable_to_process', 'cancelled'];
export const CANCELLABLE = ['submitted', 'under_review'];

export const NEXT_STEPS = [
  'Your request has been received.',
  'Your account details will be reviewed by our Support Team.',
  'The requested action will be processed.',
  'The action will be completed within 7 working days.',
  'You will receive an email confirmation once the request has been completed.',
];

export const FLOW_RAIL = [
  { icon: 'sliders', hue: '#FFB020', title: 'Choose an action', sub: 'Break, hold or delete' },
  { icon: 'key', hue: '#14C9B5', title: 'Enter password', sub: 'Confirms it’s you' },
  { icon: 'check', hue: '#8B5CF6', title: 'Final confirmation', sub: 'Review and submit' },
  { icon: 'hash', hue: '#FF8A00', title: 'Request ID', sub: 'Generated instantly' },
  { icon: 'ticket', hue: '#38BDF8', title: 'Support ticket', sub: 'Sent to our team' },
  { icon: 'headset', hue: '#2F6BFF', title: 'Support review', sub: 'Details checked' },
  { icon: 'shield', hue: '#22C55E', title: 'Action completed', sub: 'Within 7 working days' },
  { icon: 'mail', hue: '#FF5E7E', title: 'Email confirmation', sub: 'Once it’s done' },
];

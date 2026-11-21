// Content for the Minor (teen) section: the two-step parent onboarding and the teen's profile "worlds".
// Source: Kunal's "minor profiles" and "parent onboarding" previews (v2.0.0). Art lives in /public/images/minor/.
// Paths are written out in full so the preview build can inline them.
import { MIN_SIGNUP_AGE } from './site.js';

export const MINOR_AGE = { min: MIN_SIGNUP_AGE, max: 17 };

// Thirteen profile worlds a teen fills in. Every finished world = 100 points.
export const TEEN_WORLDS = [
  { id: 'sunrise', name: 'Sunrise', t: 'The basics', d: 'Where you are and the language you want surveys in.', q: 8, m: 1, art: '/images/minor/art/sunrise.webp', c: '#FF9F1C', c2: '#FF3B8D' },
  { id: 'campus', name: 'Campus', t: 'School & learning', d: 'What you study, what you are into and how you like to learn.', q: 10, m: 1, art: '/images/minor/art/campus.webp', c: '#2F6BFF', c2: '#22D3EE' },
  { id: 'nest', name: 'Nest', t: 'Home & family', d: 'Who is at home with you and what you get a say in.', q: 8, m: 1, art: '/images/minor/art/nest.webp', c: '#F97316', c2: '#FACC15' },
  { id: 'circuit', name: 'Circuit', t: 'Devices & internet', d: 'What you use, where you get online and what you could answer on.', q: 8, m: 1, art: '/images/minor/art/circuit.webp', c: '#14C9B5', c2: '#2F6BFF' },
  { id: 'feed', name: 'Feed', t: 'Social & creating', d: 'Where you scroll, what you post and who you actually follow.', q: 7, m: 1, art: '/images/minor/art/feed.webp', c: '#FF3B8D', c2: '#8B5CF6' },
  { id: 'arcade', name: 'Arcade', t: 'Gaming & entertainment', d: 'What you play, what you watch and who you watch it with.', q: 14, m: 2, art: '/images/minor/art/arcade.webp', c: '#7C3AED', c2: '#22D3EE' },
  { id: 'boutique', name: 'Boutique', t: 'Shopping & brands', d: 'What you buy, who pays and how much say you get.', q: 7, m: 1, art: '/images/minor/art/boutique.webp', c: '#EC4899', c2: '#F59E0B' },
  { id: 'bistro', name: 'Bistro', t: 'Food & drink', d: 'What you eat, what you order and what makes you try new things.', q: 11, m: 1, art: '/images/minor/art/bistro.webp', c: '#F59E0B', c2: '#EF4444' },
  { id: 'runway', name: 'Runway', t: 'Fashion & style', d: 'What you wear, where you find it and who you take cues from.', q: 10, m: 1, art: '/images/minor/art/runway.webp', c: '#D946EF', c2: '#FB7185' },
  { id: 'arena', name: 'Arena', t: 'Sports & hobbies', d: 'What you do when you are not online.', q: 10, m: 1, art: '/images/minor/art/arena.webp', c: '#22C55E', c2: '#FACC15' },
  { id: 'future', name: 'Future', t: 'Tech & AI', d: 'The apps you keep open and the tech you find interesting.', q: 6, m: 1, art: '/images/minor/art/future.webp', c: '#6366F1', c2: '#22D3EE' },
  { id: 'lab', name: 'Lab', t: 'Taking part', d: 'What kind of research you are up for, and when it suits you.', q: 13, m: 2, art: '/images/minor/art/lab.webp', c: '#10B981', c2: '#3B82F6' },
  { id: 'atlas', name: 'Atlas', t: 'Topics & updates', d: 'Pick your subjects. Two taps and you are done.', q: 3, m: 1, art: '/images/minor/art/atlas.webp', c: '#0EA5E9', c2: '#A855F7' },
];

// The parent's own three worlds (answered by the parent; the teen can open and read them).
export const PARENT_WORLDS = [
  { id: 'hearth', name: 'Hearth', t: 'Parenting & household', d: 'Who you are, who is at home, and how decisions get made there.', q: 22, m: 3, art: '/images/minor/art/hearth.webp', c: '#F97316' },
  { id: 'treasury', name: 'Treasury', t: 'Rewards & payouts', d: 'Who receives what your teen earns, and how it reaches you.', q: 9, m: 1, art: '/images/minor/art/treasury.webp', c: '#16A34A' },
  { id: 'sentry', name: 'Sentry', t: 'Permissions & oversight', d: 'What you approve yourself, and what your teen may decide alone.', q: 12, m: 1, art: '/images/minor/art/sentry.webp', c: '#2F49D1' },
];

// Ranks shown on the teen's dashboard (Rookie → Legend), by worlds completed.
export const RANKS = [
  { id: 'rookie', t: 'Rookie', at: 0, e: '/images/minor/emoji/medal.webp' },
  { id: 'player', t: 'Player', at: 3, e: '/images/minor/emoji/game.webp' },
  { id: 'pro', t: 'Pro', at: 6, e: '/images/minor/emoji/star.webp' },
  { id: 'star', t: 'Star', at: 9, e: '/images/minor/emoji/trophy.webp' },
  { id: 'legend', t: 'Legend', at: 13, e: '/images/minor/emoji/crown.webp' },
];
export const POINTS_PER_WORLD = 100;
export const POINTS_PER_USD = 1000;

// The journey from "I want in" to the first reward.
export const JOURNEY = [
  { k: 'teen', ic: 'user', t: 'You ask to join', d: 'Sign up with your date of birth. We spot that you are under 18 and switch to the teen panel.', who: 'You', e: '/images/minor/emoji/wave.webp' },
  { k: 'invite', ic: 'mail', t: 'Your parent gets an invite', d: 'A parent or legal guardian receives a link by email or SMS. Nothing is switched on yet.', who: 'Parent', e: '/images/minor/emoji/mail.webp' },
  { k: 'about', ic: 'clipboard', t: 'About you, about home', d: '16 short questions across four parts: About you, Your household, Staying in touch and Your teen’s health.', who: 'Parent', e: '/images/minor/emoji/parenting.webp' },
  { k: 'consent', ic: 'shield', t: 'Two yeses', d: 'Your parent gives permission, then you give yours. A parent’s yes never overrides your no.', who: 'Both', e: '/images/minor/emoji/handshake.webp' },
  { k: 'record', ic: 'check', t: 'A copy for everyone', d: 'Both of you get the consent record: reference, date, version and every choice that was made.', who: 'Both', e: '/images/minor/emoji/verified.webp' },
  { k: 'worlds', ic: 'gift', t: 'Explore & earn', d: 'Open your 13 worlds, win 100 points each and start getting age-appropriate surveys.', who: 'You', e: '/images/minor/emoji/rocket.webp' },
];

// The four parts of the parent registration (16 questions, about five minutes).
export const PARENT_PARTS = [
  { ic: 'user', t: 'About you', n: 5, d: 'Name, relationship to the teen and confirmation that you can give permission.' },
  { ic: 'home', t: 'Your household', n: 4, d: 'Who lives at home, and how many children aged 0–12 and 13–17 you parent.' },
  { ic: 'mail', t: 'Staying in touch', n: 5, d: 'Your language, contact method and how invitations should reach your home.' },
  { ic: 'heart', t: 'Your teen’s health', n: 2, d: 'Keeps studies about medicines, food or conditions away from a teen they could upset.' },
];

// What a parent controls in the Sentry world.
export const PARENT_CONTROLS = [
  { ic: 'eye', t: 'Review invitations', d: 'See research invitations before your teen does, or let them decide alone.' },
  { ic: 'mail', t: 'Choose the channel', d: 'Email to you, an SMS you approved, or the panel portal only.' },
  { ic: 'calendar', t: 'Get summaries', d: 'A summary of what your teen took part in, after every study or less often.' },
  { ic: 'wallet', t: 'Receive the rewards', d: 'In most markets a reward earned by a member under 18 is paid to the parent or guardian.' },
  { ic: 'exit', t: 'Withdraw any time', d: 'Take back permission whenever you like. Stopping never brings a penalty.' },
];

// The teen panel's promises, grouped into chapters (condensed from the 19 terms in the onboarding).
export const PROMISE_CHAPTERS = [
  {
    id: 'join', t: 'Joining', ic: 'key', c: '#2F6BFF',
    items: [
      ['badge', 'Real age, real country', 'For teens under 18 who give their true age and country. The rules change when you turn 18.'],
      ['target', 'Research, not marketing', 'Age-appropriate questions to learn what people think. You never have to buy anything.'],
      ['key', 'An account of your own', 'You may not need your own email. Your account and your parent’s contact are kept separate.'],
    ],
  },
  {
    id: 'permission', t: 'Permission', ic: 'handshake', c: '#FF8A00',
    items: [
      ['family', 'Parent first', 'A parent or guardian gives permission first, and we verify it. It never covers every future study.'],
      ['hand', 'Then you decide', 'You get a clear explanation and decide for yourself. Saying no is always okay.'],
      ['exit', 'Stop any time', 'Nothing is compulsory. You can stop, and a parent can withdraw permission, with no penalty.'],
    ],
  },
  {
    id: 'safety', t: 'Safety', ic: 'shield', c: '#14C9B5',
    items: [
      ['bell', 'Calm invitations', 'Each invite says the topic, time, reward and any extra permission. No flood of messages.'],
      ['shield', 'Checked for your age', 'Every study is reviewed for teens. Skip any question or leave whenever you want.'],
      ['heart', 'Sensitive topics locked', 'Health, beliefs and similar topics need their own review and their own permission.'],
    ],
  },
  {
    id: 'data', t: 'Your info', ic: 'lock', c: '#8B5CF6',
    items: [
      ['folder', 'Only what is needed', 'Age band, country, answers and permission records. No school name or exact location.'],
      ['lock', 'Combined, not you', 'Clients see combined results, not you. Your answers are never sold or used for ads.'],
      ['mic', 'No surprise recordings', 'Audio, video, photos or quotes that show who you are always need a separate yes first.'],
    ],
  },
  {
    id: 'rewards', t: 'Rewards', ic: 'coins', c: '#FF3B8D',
    items: [
      ['coins', 'Rewards explained up front', 'Points or vouchers are shown before you start. A parent may receive the payout.'],
      ['refresh', 'Kept only as long as needed', 'Then deleted or anonymised. Ask us to correct or delete your info at any time.'],
      ['globe', 'Local law first', 'Where your country asks for more protection, we follow it, or we do not enrol.'],
    ],
  },
];

export const FAQ_MINOR = [
  { q: 'How does teen sign-up work, step by step?', a: 'Choose Teen on the sign-up page (the calendar only shows teen birth years), add your details, then your parent or guardian’s details, tick the consent boxes and type the security code. We email your parent or guardian an onboarding form; once they consent, you get an email to set your password.' },
  { q: 'Why can’t I log in straight away?', a: 'Teen accounts stay pending until a parent or guardian completes consent. Login is locked until then, so nobody under 18 can take part without permission.' },
  { q: 'Can teenagers join MyFrequentRewards?', a: `Yes. Teens aged ${MIN_SIGNUP_AGE} to 17 can join the teen panel once a parent or legal guardian gives permission and the teen agrees too. Sign up with your real date of birth and we switch you to the teen flow automatically.` },
  { q: 'What does my parent or guardian have to do?', a: 'They receive an invitation by email or SMS and answer 16 short questions in about five minutes: about themselves, the household, how to stay in touch and the teen’s health. Then they give permission, and the teen gives their own yes.' },
  { q: 'Who receives the rewards a teen earns?', a: 'In most markets a reward earned by a member under 18 is paid to the parent or guardian. The parent chooses this in the Treasury world, and every reward is explained before a survey starts.' },
  { q: 'What kind of surveys do teens get?', a: 'Age-appropriate research about school, gaming, food, fashion, sport, tech and the brands teens actually use. Every study is checked for teens, and sensitive topics need their own separate permission.' },
  { q: 'Can a parent see what a teen answers?', a: 'A parent can open the teen’s profile worlds and read them, and can ask for a summary of the studies the teen took part in. Individual survey answers are reported to clients only in combined, anonymous form.' },
  { q: 'Can we stop at any time?', a: 'Yes. Taking part is never compulsory. A teen can stop whenever they want, a parent can withdraw permission at any time, and stopping never brings a penalty.' },
];

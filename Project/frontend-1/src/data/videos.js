// Page videos (v3.0) — one entry per page. Drives two things:
//   1. the floating "Watch our videos" YouTube button on every page (components/video/VideoFab.jsx)
//   2. the "watch this page" band at the bottom of every page (sections/WatchBand.jsx)
// Every page has its OWN `template` (a different stage design) and colour pair, so no two pages look alike.
//
// VIDEO IDs — only these are confirmed (taken from the Frequent Research website):
//   WtviSqm8rEE  MyFrequentRewards intro ("Your opinions, rewarded.")
//   zMY_KjJ8j0s  Frequent Research — who we are     s9R4CB7NmhI  Frequent Research — mission & vision
//   VguDL80K6y4  Frequent Research — our journey     euWdgxLd0pk  Frequent Research — scan & connect
//   9WwyCMOozsQ  Turn2Opinion                         dYAhbVpQsXw  MyHealthOpinions
// Entries marked `placeholder: true` re-use the MyFrequentRewards intro until a page-specific video exists.
// To swap in a new video, paste its YouTube ID into `yt` and delete `placeholder`. Nothing else needs to change.
export const YT_CHANNEL = 'https://www.youtube.com/@MyFrequentRewards';
export const MFR_INTRO = 'WtviSqm8rEE';

const v = (id, path, o) => ({ id, path, match: 'exact', yt: MFR_INTRO, points: [], ...o });

export const PAGE_VIDEOS = [
  v('home', '/', {
    template: 'vault', c1: '#FF8A00', c2: '#FFC233',
    eyebrow: 'Start here', title: 'Your opinions,', em: 'rewarded.',
    lede: 'Two minutes on what MyFrequentRewards is, who it is for and how a simple opinion becomes a reward you can use.',
    points: ['Join free', 'Answer surveys', 'Claim rewards'],
    cta: { label: 'Join free', to: '/sign-up' },
  }),
  v('how', '/how-it-works', {
    template: 'metro', c1: '#2F6BFF', c2: '#14C9B5', placeholder: true,
    eyebrow: 'Ride the route', title: 'From sign-up', em: 'to reward.',
    lede: 'Every stop on the way: join, verify, build your profile, get matched, answer and claim.',
    points: ['Join', 'Profile', 'Match', 'Answer', 'Claim'],
    cta: { label: 'Start the route', to: '/sign-up' },
  }),
  v('rewards', '/rewards', {
    template: 'receipt', c1: '#12B76A', c2: '#FFC233', placeholder: true,
    eyebrow: 'Rewards, explained', title: 'Spend it', em: 'your way.',
    lede: 'PayPal, bank or wire transfer, vouchers and gift cards, plus UPI in India. See how a claim travels from balance to you.',
    points: ['PayPal', 'Bank & wire', 'Vouchers', 'Gift cards', 'UPI (India)'],
    cta: { label: 'Start earning', to: '/sign-up' },
  }),
  v('consumers', '/paid-surveys-for-consumers', {
    template: 'phone', c1: '#FF5E7E', c2: '#FF8A00', placeholder: true,
    eyebrow: 'For everyday people', title: 'Your day,', em: 'your say.',
    lede: 'Shopping, food, travel, gaming, streaming: surveys about the things you already use, on the phone in your hand.',
    points: ['Shopping', 'Food', 'Travel', 'Gaming', 'Streaming'],
    cta: { label: 'Join as a consumer', to: '/sign-up' },
  }),
  v('pros', '/paid-surveys-for-professionals', {
    template: 'boardroom', c1: '#2F6BFF', c2: '#8B5CF6', placeholder: true,
    eyebrow: 'For decision-makers', title: 'Your expertise,', em: 'on the record.',
    lede: 'B2B studies for leaders, managers and specialists: short, private and rewarded for the knowledge only you have.',
    points: ['CXOs & founders', 'IT & engineering', 'Healthcare', 'Finance & HR'],
    cta: { label: 'Join as a professional', to: '/sign-up' },
  }),
  v('who', '/who-can-join', {
    template: 'passport', c1: '#8B5CF6', c2: '#14C9B5', placeholder: true,
    eyebrow: 'Everyone is welcome', title: 'One community,', em: 'every walk of life.',
    lede: 'Students, parents, gamers, doctors, engineers and CEOs: see who takes part and where they join from.',
    points: ['Asia-Pacific', 'Europe', 'Americas', 'Middle East & Africa'],
    cta: { label: 'Check if you can join', to: '/who-can-join' },
  }),
  v('trust', '/trust-and-safety', {
    template: 'shield', c1: '#14C9B5', c2: '#2F6BFF', placeholder: true,
    eyebrow: 'Safe by design', title: 'Your data,', em: 'locked tight.',
    lede: 'How every member is verified, how answers are checked and how your personal details stay private.',
    points: ['Verified members', 'Quality checks', 'Private by default'],
    cta: { label: 'Read our privacy promise', to: '/privacy' },
  }),
  v('about', '/about-us', {
    template: 'reel', c1: '#FF8A00', c2: '#8B5CF6', yt: 'zMY_KjJ8j0s',
    eyebrow: 'Meet the people behind it', title: 'Who we are,', em: 'in our own words.',
    lede: 'The Frequent Research team that runs MyFrequentRewards: the places, the people and the way we work.',
    points: ['2015 · Frequent Research begins', '2017 · MyFrequentRewards launches', 'Today · ISO-certified research'],
    cta: { label: 'Read our story', to: '/about-us#ab-story' },
    more: [
      { yt: 'zMY_KjJ8j0s', label: 'Who we are' },
      { yt: 's9R4CB7NmhI', label: 'Mission & vision' },
      { yt: 'VguDL80K6y4', label: 'Our journey' },
      { yt: MFR_INTRO, label: 'MyFrequentRewards' },
    ],
  }),
  v('reviews', '/about-us/reviews', {
    template: 'stage', c1: '#FFC233', c2: '#FF5E7E', placeholder: true,
    eyebrow: 'In the spotlight', title: 'Real members,', em: 'real words.',
    lede: 'Hear what joining is like, then read what members from around the world say about it.',
    points: ['Honest reviews', 'Every country', 'No filtering'],
    cta: { label: 'Rate your experience', to: '/about-us/reviews' },
  }),
  v('faq', '/faq', {
    template: 'chat', c1: '#8B5CF6', c2: '#FF5E7E', placeholder: true,
    eyebrow: 'Quick answers', title: 'Questions?', em: 'Watch the answers.',
    lede: 'The things people ask most before joining, answered in plain words.',
    points: ['Is it free?', 'How do I get paid?', 'Is my data safe?'],
    cta: { label: 'Ask Live Help', chat: true },
  }),
  v('contact', '/contact-us', {
    template: 'onair', c1: '#FF5E7E', c2: '#FFC233', placeholder: true,
    eyebrow: 'We are on air', title: 'Real people,', em: 'ready to help.',
    lede: 'Live Help, WhatsApp, email and phone: meet the support desk and how fast each channel replies.',
    points: ['Live Help 24/7', 'WhatsApp', 'Email', 'Phone'],
    cta: { label: 'Chat with us', chat: true },
  }),
  v('blog', '/blog', {
    template: 'magazine', c1: '#0B1E5B', c2: '#FF8A00', placeholder: true, match: 'prefix',
    eyebrow: 'The MFR edition', title: 'Earning tips,', em: 'in motion.',
    lede: 'Short video guides to go with our blogs: smarter surveys, safer payouts and honest ways to earn online.',
    points: ['Survey tips', 'Payout guides', 'Safety advice'],
    cta: { label: 'Read the blogs', to: '/blog' },
  }),
  v('connect', '/scan-and-connect', {
    template: 'qr', c1: '#6D5BF7', c2: '#FF3B8D', yt: 'euWdgxLd0pk',
    eyebrow: 'Scan & connect', title: 'Scan once,', em: 'stay connected.',
    lede: 'Every channel of the Frequent Research family on one page. Point your camera, follow, and never miss a survey alert.',
    points: ['YouTube', 'Instagram', 'LinkedIn', 'Facebook', 'WhatsApp'],
    cta: { label: 'See every code', to: '/scan-and-connect#brand-mfr' },
    more: [
      { yt: 'euWdgxLd0pk', label: 'Scan & connect' },
      { yt: MFR_INTRO, label: 'MyFrequentRewards' },
      { yt: '9WwyCMOozsQ', label: 'Turn2Opinion' },
      { yt: 'dYAhbVpQsXw', label: 'MyHealthOpinions' },
    ],
  }),
  // Pages without an in-page showcase (sign-up, login, legal) still get the floating button with this entry.
  v('default', '*', {
    template: 'spotlight', c1: '#FF8A00', c2: '#2F6BFF',
    eyebrow: 'MyFrequentRewards', title: 'Your opinions,', em: 'rewarded.',
    lede: 'A worldwide survey community for consumers and business professionals.',
    points: ['Join the community', 'Answer surveys', 'Redeem your rewards'],
    cta: { label: 'Join free', to: '/sign-up' },
  }),
];

const clean = (p) => (String(p || '/').split(/[?#]/)[0].replace(/\/+$/, '') || '/').toLowerCase();

export function videoFor(pathname) {
  const p = clean(pathname);
  return (
    PAGE_VIDEOS.find((e) => e.path !== '*' && (clean(e.path) === p || (e.match === 'prefix' && p.startsWith(clean(e.path) + '/')))) ||
    PAGE_VIDEOS.find((e) => e.path === '*')
  );
}

export const videoById = (id) => PAGE_VIDEOS.find((e) => e.id === id);

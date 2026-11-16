

import { ALL_FAQS, FAQ_ABOUT, FAQ_CONSUMERS, FAQ_CONTACT, FAQ_HOW, FAQ_PROFESSIONALS, FAQ_QUALITY, FAQ_REWARDS, FAQ_WHO, HOME_FAQS } from './faqs.js';
import { LEGAL } from './legal.js';
import { PRIVACY_PROMISES, QUALITY_CHECKS, VERIFICATION_PROTOCOLS } from './quality.js';
import { BRAND, CONTACT, NOTIFY_CHANNELS, PAYOUTS, PAYOUT_LINE, SOCIALS } from './site.js';
import { STATS, SURVEY_CATEGORIES } from './community.js';
import { PRO_SURVEYS, CONSUMER_SURVEYS } from './surveys.js';
import { DEPARTMENTS, INDUSTRIES, JOB_TITLES, REGIONS } from './profiles.js';
import { BLOG_FAQS } from './blogs/faqindex.js';

export const SRC = {
  home: { path: '/', label: 'Home' },
  how: { path: '/how-it-works', label: 'How It Works' },
  rewards: { path: '/rewards', label: 'Rewards & Payouts' },
  consumers: { path: '/paid-surveys-for-consumers', label: 'For Consumers' },
  pros: { path: '/paid-surveys-for-professionals', label: 'For Professionals' },
  who: { path: '/paid-surveys-for-consumers#countries', label: 'Countries & profiles' },
  quality: { path: '/trust-and-safety', label: 'Quality & Data Security' },
  about: { path: '/about-us', label: 'About Us' },
  faq: { path: '/faq', label: 'FAQ' },
  contact: { path: '/contact-us', label: 'Contact Us' },
  blog: { path: '/blog', label: 'Blogs' },
  signup: { path: '/sign-up', label: 'Join free' },
  login: { path: '/login', label: 'Log in' },
  privacy: { path: '/privacy', label: 'Privacy Policy' },
  gdpr: { path: '/gdpr', label: 'GDPR Compliance' },
  cookies: { path: '/cookies', label: 'Cookies Policy' },
  terms: { path: '/terms', label: 'Terms of Use' },
  profiling: { path: '/profiling', label: 'Profiling & Quality Score' },
};

const money = `$${STATS.rewardsPaidUsd.toLocaleString('en-US')}+`;

// k = keywords/phrases that strongly signal this topic (matched on word boundaries)
export const CURATED = [
  // ── Joining ─────────────────────────────────────────────
  { q: 'How do I join MyFrequentRewards?', alt: ['how to register', 'create an account', 'sign up process', 'how can i become a member', 'enroll', 'registration'], k: ['sign up', 'signup', 'register', 'registration', 'join', 'enrol', 'enroll', 'create account', 'new account'], a: 'Joining is free and takes about two minutes: choose Consumer or Business professional, add your name, full date of birth, gender and country, then your email and mobile number, create a password and pass the CAPTCHA. Confirm the link in your email (double opt-in) and you can start taking surveys.', src: 'signup', more: 'how' },
  { q: 'Is it free to join?', alt: ['do i need to pay', 'any registration fee', 'joining charges', 'is there a cost', 'membership fee', 'deposit'], k: ['free', 'fee', 'fees', 'cost', 'charge', 'charges', 'pay to join', 'deposit', 'investment'], a: 'Yes — 100% free. There is no joining fee, no membership fee, no deposit and no claim fee, ever. If anyone asks you to pay to join or to "unlock" rewards in our name, it is not us — please report it to support.', src: 'faq' },
  { q: 'Who can join MyFrequentRewards?', alt: ['eligibility', 'am i eligible', 'requirements to join', 'can anyone join'], k: ['eligible', 'eligibility', 'who can join', 'requirements', 'qualify to join'], a: 'Everyday consumers and business professionals in supported countries can join — students, parents, homemakers, gamers, drivers, retirees, managers, engineers, doctors, founders and many more. Members must meet the minimum age for their country; under-18 rules are explained in our privacy policy.', src: 'who' },
  { q: 'What is the minimum age to join?', alt: ['how old do i need to be', 'age limit', 'can teenagers join', 'under 18'], k: ['age', 'minimum age', 'under 18', 'teen', 'teenager', 'minor', 'how old', 'years old'], a: 'Members must be at least 18 years old (or the legal age in their country). Users under 18 may be asked for a parent or guardian email for an acknowledgement during registration — the full rules are in the "Users under 18" section of our privacy policy.', src: 'privacy' },
  { q: 'Why do you ask for my full date of birth?', alt: ['why date of birth', 'dob required'], k: ['date of birth', 'dob', 'birthday', 'birth date'], a: 'Your full date of birth (DD/MM/YYYY) confirms eligibility and keeps every study age-appropriate. It is kept private and never shared with research clients.', src: 'how' },
  { q: 'What is the difference between a consumer and a business professional account?', alt: ['consumer or professional', 'which account type', 'member type'], k: ['consumer or professional', 'account type', 'member type', 'business professional'], a: 'Consumers answer everyday surveys about products, services, media and lifestyle. Business professionals also receive B2B studies about their role and industry, verified through checks such as a company email or public profile. Professionals can still receive consumer surveys too.', src: 'who' },
  { q: 'Can I have more than one account?', alt: ['multiple accounts', 'second account', 'two accounts', 'family account'], k: ['multiple accounts', 'two accounts', 'second account', 'another account', 'duplicate account'], a: 'No — it is one account per person. Duplicate accounts are detected (device fingerprinting, duplicate and GEO-IP checks) and removed, which can also cancel pending rewards.', src: 'rewards' },
  { q: 'I did not receive the verification email', alt: ['confirmation email not received', 'activation link', 'verify email not working'], k: ['verification email', 'confirmation email', 'activation', 'activate', 'verify email', 'double opt in', 'opt-in'], a: 'Check your spam, promotions and updates folders and search for "MyFrequentRewards". The link confirms your account (double opt-in). If it still has not arrived after a few minutes, contact support with the email address you registered — never share your password or OTP.', src: 'contact' },
  { q: 'Do I need to download an app?', alt: ['is there a mobile app', 'android app', 'iphone app', 'play store'], k: ['app', 'download', 'play store', 'app store', 'apk', 'install'], a: 'No download is needed. MyFrequentRewards works in any browser on phones, tablets, laptops and desktops, and invitations reach you through your dashboard, SMS, WhatsApp or email.', src: 'how' },
  { q: 'Can I take surveys on my phone?', alt: ['mobile surveys', 'tablet', 'which devices'], k: ['phone', 'mobile', 'tablet', 'device', 'devices', 'laptop', 'computer'], a: 'Yes — surveys work on phones, tablets, laptops and desktops. Some studies are device-specific (for app or website tests), and the invitation tells you if so.', src: 'how' },

  // ── Surveys ─────────────────────────────────────────────
  { q: 'How does MyFrequentRewards work?', alt: ['how it works', 'what are the steps', 'process', 'how do surveys work'], k: ['how it works', 'how does it work', 'steps', 'process'], a: 'Five steps: 1) Register free, 2) verify your email and phone, 3) complete your profile surveys, 4) receive matched survey invitations, 5) track your balance and claim your reward once you reach the threshold.', src: 'how' },
  { q: 'How much can I earn per survey?', alt: ['how much money', 'survey rates', 'reward per survey', 'how much do surveys pay', 'earning per survey', 'payment per survey'], k: ['how much', 'per survey', 'rates', 'rate', 'pay per', 'earning', 'earnings', 'income'], a: `Every invitation shows its exact reward and estimated time before you start. Typical consumer surveys are around $4–$7 for 10–18 minutes (for instance Shopping Habits ~$4 for 10 min, Travel Experience ~$7 for 18 min). Professional B2B studies are typically rewarded more. Earnings are not guaranteed and depend on the studies you qualify for.`, src: 'home' },
  { q: 'How many surveys will I get?', alt: ['how often will i get surveys', 'number of invitations', 'surveys per month'], k: ['how many surveys', 'how often', 'invitations', 'more surveys', 'not getting surveys', 'no surveys'], a: `It depends on your profile, survey availability, your frequency preferences and your qualification rate. There are typically ${STATS.monthlyAvailableSurveys}+ surveys available in a month. A complete, up-to-date profile increases your invitations.`, src: 'faq' },
  { q: 'Why was I screened out of a survey?', alt: ['disqualified', 'not qualified', 'survey ended early', 'terminated'], k: ['screened out', 'screen out', 'screenout', 'disqualified', 'disqualify', 'not qualified', 'terminated', 'kicked out'], a: 'Screen-outs happen when a study needs a different audience or its quota is already full. It is normal and not a penalty. Keeping your profile complete and answering honestly helps you match more often.', src: 'faq', more: 'blog:survey-profile-tips-to-qualify-more' },
  { q: 'Why does a survey say "Survey Closed"?', alt: ['quota full', 'survey closed'], k: ['survey closed', 'closed', 'quota', 'quota full'], a: 'Surveys close once the required number of participants is reached, so the quota has already been filled. Respond to invitations early and check your dashboard for new ones.', src: 'faq' },
  { q: 'What topics are the surveys about?', alt: ['survey categories', 'types of surveys', 'what kind of surveys'], k: ['topics', 'categories', 'category', 'types of surveys', 'kind of surveys'], a: `Consumer topics include ${CONSUMER_SURVEYS.map((s) => s.title).slice(0, 10).join(', ')} and more. Professional topics include ${PRO_SURVEYS.map((s) => s.title).slice(0, 8).join(', ')} and more.`, src: 'home' },
  { q: 'What are profile surveys?', alt: ['complete my profile', 'profiling'], k: ['profile survey', 'profile surveys', 'profile', 'profiling'], a: 'Profile surveys ask about your household, work, interests and devices. They are how we match you to studies — and some profile sections can add points to your balance. Update them whenever life changes.', src: 'how', more: 'profiling' },
  { q: 'What is the quality score?', alt: ['profiling score', 'respondent score', 'my score'], k: ['quality score', 'profiling score', 'score'], a: 'Our profiling score measures respondent quality on a 0–200 scale. Honest, attentive answers build your score; speeding, straight-lining or inconsistent answers lower it.', src: 'profiling' },
  { q: 'A survey is not loading', alt: ['survey error', 'survey stuck', 'link not working', 'page not opening'], k: ['not loading', 'error', 'stuck', 'not working', 'broken', 'blank page', 'not opening'], a: 'Wait a few minutes, clear your browser cache, or try another browser or device. Turn off any VPN. If it continues, email support with a screenshot of the error.', src: 'faq' },
  { q: 'Can I use a VPN or proxy?', alt: ['vpn allowed', 'proxy', 'tor browser'], k: ['vpn', 'proxy', 'tor', 'hide ip'], a: 'No. VPNs, proxies and TOR are blocked by our GEO-IP, proxy and TOR checks, and using them can lead to disqualification. Please connect from your real location.', src: 'quality' },
  { q: 'Why am I asked the same questions repeatedly?', alt: ['repeat questions', 'same questions again'], k: ['same questions', 'repeated', 'again and again', 'repeat'], a: 'Questions such as age, location and household are repeated to verify accuracy, confirm eligibility, maintain quality control and meet client targeting requirements.', src: 'faq' },
  { q: 'Can I share survey content or screenshots?', alt: ['screenshot survey', 'share questions'], k: ['screenshot', 'share survey', 'confidential', 'copy survey'], a: 'No — surveys may show unreleased products, adverts or concepts. You agree not to copy, screenshot or share survey content.', src: 'terms' },

  // ── Rewards & payouts ───────────────────────────────────
  { q: 'What rewards can I get?', alt: ['reward options', 'payout methods', 'how do i get paid', 'payment methods', 'redeem options'], k: ['rewards', 'reward', 'payout', 'payouts', 'payment method', 'payment methods', 'redeem', 'redemption', 'withdraw', 'withdrawal', 'get paid', 'cash out'], a: `Consumers and professionals can choose ${PAYOUT_LINE}. Availability of a reward type can vary by study and country.`, src: 'rewards' },
  { q: 'Is UPI available?', alt: ['upi payment', 'paytm upi', 'gpay', 'phonepe'], k: ['upi', 'gpay', 'google pay', 'phonepe', 'bhim'], a: 'Yes — UPI is available to members in India only. Members in India can choose UPI or any other reward type; members outside India can choose every reward type except UPI.', src: 'rewards' },
  { q: 'Can I get paid with PayPal?', alt: ['paypal payment'], k: ['paypal'], a: 'Yes — PayPal is available to members worldwide. Rewards are sent to the PayPal email you give when you claim.', src: 'rewards' },
  { q: 'Do you offer bank transfer or wire transfer?', alt: ['bank account payment', 'neft', 'imps', 'swift'], k: ['bank', 'bank transfer', 'wire', 'wire transfer', 'neft', 'imps', 'swift', 'account transfer'], a: 'Yes — Bank Transfer pays into your verified bank account, and Wire Transfer is a secure international transfer. Your details are used only to send your reward.', src: 'rewards' },
  { q: 'Do you give gift cards or vouchers?', alt: ['amazon gift card', 'shopping voucher', 'grocery voucher', 'e-gift'], k: ['gift card', 'gift cards', 'voucher', 'vouchers', 'amazon', 'shopping voucher', 'grocery', 'e-gift', 'egift'], a: 'Yes — Shopping Vouchers, Grocery Vouchers and Digital Gift Cards (instant e-gift codes for brands such as Amazon, sent to your inbox).', src: 'rewards' },
  { q: 'Do you give cash rewards?', alt: ['cash payment', 'real money'], k: ['cash', 'real money', 'cash reward', 'cash rewards'], a: `Yes — Cash Rewards are one of the reward types, alongside PayPal and bank or wire transfer. MyFrequentRewards members have been paid ${money} in rewards so far.`, src: 'rewards' },
  { q: 'What is the minimum amount to claim?', alt: ['claim threshold', 'minimum payout', 'minimum withdrawal'], k: ['minimum', 'threshold', 'minimum payout', 'minimum withdrawal', 'minimum amount'], a: 'A claim threshold applies and is shown in your dashboard. Balances below it simply carry forward — nothing is lost if you take a break.', src: 'rewards' },
  { q: 'How long does it take to receive my reward?', alt: ['when will i get paid', 'payment time', 'how many days', 'payout time'], k: ['how long', 'when will i get', 'when do i get', 'how many days', 'payment time', 'processing time'], a: 'After you claim, our team verifies your account and participation and then the accounts department processes it. This can take 2–3 weeks depending on queue volume and verification.', src: 'faq' },
  { q: 'My reward is pending or not received', alt: ['reward delayed', 'payment not received', 'missing reward', 'points not credited'], k: ['pending', 'not received', 'not credited', 'delay', 'delayed', 'late', 'missing'], a: 'Rewards can stay pending while quality checks confirm a completion with the research client. If a claim seems late, contact support with your registered email and the approximate claim date — never your password or OTP.', src: 'contact' },
  { q: 'Are there any fees on payouts?', alt: ['payout charges', 'withdrawal fee'], k: ['payout fee', 'withdrawal fee', 'processing fee', 'commission'], a: 'MyFrequentRewards charges no fees. Your payment provider’s own terms may apply.', src: 'rewards' },
  { q: 'How much has MyFrequentRewards paid?', alt: ['total rewards paid', 'how many members', 'statistics'], k: ['paid so far', 'total paid', 'members', 'how many members', 'stats', 'statistics'], a: `As of ${STATS.asOf}: ${money} rewards paid, ${STATS.surveysCompletedThisMonth.toLocaleString('en-US')} surveys completed this month, ${STATS.monthlyAvailableSurveys}+ surveys available monthly and ${STATS.membersRegistered.toLocaleString('en-US')} members registered.`, src: 'home' },

  // ── Professionals ───────────────────────────────────────
  { q: 'Do you have surveys for professionals?', alt: ['b2b surveys', 'business surveys', 'surveys for managers'], k: ['professional', 'professionals', 'b2b', 'business', 'manager', 'executive', 'decision maker', 'cxo'], a: 'Yes — business professionals receive B2B studies about their role, industry and the tools they use, from CXOs and managers to engineers, doctors and founders. Verified professional opinions are typically rewarded more.', src: 'pros' },
  { q: 'How are professionals verified?', alt: ['verification for professionals', 'linkedin verification', 'company email'], k: ['verify', 'verification', 'verified', 'linkedin', 'company email', 'work email'], a: 'Through company email validation, phone verification, public profile cross-referencing such as LinkedIn, external database checks and manual reviews. Verification confirms your credentials — it never exposes them to clients.', src: 'pros' },

  // ── Privacy & security ──────────────────────────────────
  { q: 'Is my personal data safe?', alt: ['do you sell my data', 'privacy', 'data protection', 'who sees my answers'], k: ['privacy', 'data', 'personal data', 'safe', 'secure', 'sell my data', 'share my data', 'confidential'], a: 'Yes. Your personal details are never sold or shared, answers reach clients only in anonymised or aggregated form, data is encrypted and access-controlled, and you can access, correct or delete your data at any time.', src: 'privacy', more: 'quality' },
  { q: 'Is MyFrequentRewards legit or a scam?', alt: ['is this real', 'is it genuine', 'trustworthy', 'fake'], k: ['legit', 'legitimate', 'scam', 'fraud', 'fake', 'genuine', 'real or fake', 'trust', 'trustworthy'], a: `Yes, it is genuine. MyFrequentRewards is operated by ${BRAND.legalName}, the company behind Frequent Research — certified to ${BRAND.iso.join(', ')}. It is free to join, publishes its policies, and has paid members ${money} in rewards.`, src: 'about' },
  { q: 'How do I report a scam using your name?', alt: ['fake message', 'someone asking money'], k: ['report scam', 'fake message', 'someone asked me to pay', 'phishing'], a: `We never ask for money, your password or your OTP. Forward any suspicious message to ${CONTACT.email} so we can investigate.`, src: 'contact' },
  { q: 'Will you ask for my password or OTP?', alt: ['share otp', 'otp'], k: ['otp', 'one time password', 'share password'], a: 'Never. Our team will never ask for your password or OTP — please do not share them with anyone, including people claiming to be us.', src: 'contact' },
  { q: 'What are my GDPR rights?', alt: ['data rights', 'right to be forgotten', 'eu members'], k: ['gdpr', 'data rights', 'right to be forgotten', 'erasure', 'eu'], a: 'You can access your data, correct it, erase it ("right to be forgotten"), restrict or object to processing and request portability. Write to support to use any of these rights.', src: 'gdpr' },
  { q: 'Do you use cookies?', alt: ['cookie policy', 'tracking'], k: ['cookie', 'cookies', 'tracking'], a: 'We use essential cookies to keep you signed in and secure, and optional analytics cookies only if you accept them. Change your choice any time from the Cookies Policy page.', src: 'cookies' },

  // ── Account ─────────────────────────────────────────────
  { q: 'I forgot my password', alt: ['reset password', 'cannot log in', 'login problem', 'locked out'], k: ['forgot password', 'reset password', 'password', 'cant login', 'cannot login', 'login', 'log in', 'locked', 'sign in'], a: 'Use "Forgot password?" on the login page to reset it. To change a password while signed in, go to Settings → Change Password. If you are still locked out, contact support with your registered email.', src: 'login' },
  { q: 'How do I change my email address?', alt: ['update email', 'change email'], k: ['change email', 'update email', 'new email', 'email address'], a: `For security, email changes are handled by support — write to ${CONTACT.email} from your registered email.`, src: 'faq' },
  { q: 'How do I update my profile?', alt: ['edit profile', 'change details'], k: ['update profile', 'edit profile', 'change details', 'change my details'], a: 'Most details can be updated in your profile settings. Core details such as date of birth and gender may be locked for data integrity — contact support if they need correcting.', src: 'faq' },
  { q: 'How do I delete my account?', alt: ['close account', 'unsubscribe', 'remove my account', 'deactivate'], k: ['delete account', 'delete my account', 'close account', 'deactivate', 'unsubscribe', 'remove account'], a: `Email ${CONTACT.email} and confirm the request in the email you receive within 24–48 hours. You can restore your account within 30 days; after that all data is permanently deleted.`, src: 'faq' },
  { q: 'How will I be notified about surveys?', alt: ['survey alerts', 'notifications', 'whatsapp alerts'], k: ['notify', 'notification', 'notifications', 'alerts', 'alert', 'sms', 'invitation'], a: `Choose any of: ${NOTIFY_CHANNELS.map((c) => `${c.name} (${c.line.replace(/\.$/, '').toLowerCase()})`).join('; ')}.`, src: 'how' },

  // ── Company & contact ───────────────────────────────────
  { q: 'Who runs MyFrequentRewards?', alt: ['company behind', 'owner', 'parent company'], k: ['who runs', 'owner', 'company', 'parent company', 'frequent research', 'who owns'], a: `MyFrequentRewards is the global consumer and business opinion community of ${BRAND.parent.name}, operated by ${BRAND.legalName}.`, src: 'about' },
  { q: 'Is Frequent Research ISO certified?', alt: ['certifications', 'iso'], k: ['iso', 'certified', 'certification', 'certifications', 'esomar'], a: `Yes — Frequent Research is certified to ${BRAND.iso.join(', ')}, and follows market research standards and codes such as ISO 20252.`, src: 'about' },
  { q: 'Where are you located?', alt: ['office address', 'head office'], k: ['address', 'office', 'located', 'location', 'where are you'], a: `Our office is in ${CONTACT.address.street}, ${CONTACT.address.city} – ${CONTACT.address.postalCode}, India. Members are worldwide.`, src: 'contact' },
  { q: 'How can I contact support?', alt: ['customer care', 'helpline', 'support number', 'email id', 'phone number'], k: ['contact', 'support', 'customer care', 'helpline', 'phone number', 'email id', 'call', 'whatsapp number'], a: `Email ${CONTACT.email} (please allow 24–72 business hours), call ${CONTACT.phone}, WhatsApp ${CONTACT.whatsappDisplay}, or keep chatting here — Live Help is open 24/7.`, src: 'contact', human: true },
  { q: 'Talk to a real person', alt: ['human agent', 'live agent', 'speak to someone'], k: ['human', 'agent', 'real person', 'representative', 'speak to', 'talk to'], a: 'Of course — our team is on WhatsApp and email. You can also leave your details here and we will get back to you.', src: 'contact', human: true, lead: true },
  { q: 'Are you on social media?', alt: ['instagram', 'facebook page', 'youtube channel', 'linkedin page'], k: ['social', 'instagram', 'facebook', 'youtube', 'linkedin', 'follow'], a: `Follow us: ${SOCIALS.map((s) => `${s.name} ${s.handle}`).join(' · ')}.`, src: 'home' },
  { q: 'Do you have blog guides?', alt: ['articles', 'guides', 'tips'], k: ['blog', 'blogs', 'guide', 'guides', 'articles', 'tips'], a: 'Yes — our blog has long-form guides on earning online without investment, paid surveys, payouts, safety and side income for students, homemakers, retirees and professionals.', src: 'blog' },
  { q: 'Is this a job or guaranteed income?', alt: ['full time income', 'salary', 'work from home job'], k: ['job', 'salary', 'guaranteed', 'full time', 'part time job', 'employment'], a: 'No — MyFrequentRewards is a market-research participation and rewards platform, not employment. Rewards depend on the surveys you qualify for and complete, so treat it as extra income rather than a salary.', src: 'faq' },
  { q: 'Can I refer friends?', alt: ['referral program', 'refer and earn'], k: ['refer', 'referral', 'invite friends'], a: 'Friends and family are welcome to join with their own account — one account per person. Referral bonuses are not described on our website; please contact support if you have a referral question.', src: 'contact', lead: true },
];

// Small talk — handled before search
export const SMALL_TALK = [
  { k: ['hi', 'hello', 'hey', 'hii', 'namaste', 'hola', 'good morning', 'good evening', 'good afternoon'], a: 'Hello! 👋 I can answer anything about joining, surveys, rewards, payouts, privacy or your account. What would you like to know?' },
  { k: ['thanks', 'thank you', 'thx', 'great', 'awesome', 'ok thanks', 'cool'], a: 'You’re welcome! 😊 Anything else I can help with?' },
  { k: ['bye', 'goodbye', 'see you'], a: 'Bye for now — Live Help is here 24/7 whenever you need it. 👋' },
  { k: ['are you a bot', 'are you human', 'who are you', 'are you real'], a: 'I’m MyFrequentRewards’ Live Help assistant — I answer instantly from our website’s FAQs and guides. For anything I can’t answer, I’ll pass your details to our support team.' },
];

// ── Auto-generated documents from the site's own data ───────────────────────
const strip = (t = '') => String(t).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim();
const clip = (t, n = 420) => (t.length > n ? `${t.slice(0, t.lastIndexOf(' ', n))}…` : t);

const PAGE_FAQS = [
  [HOME_FAQS, 'home'], [FAQ_HOW, 'how'], [FAQ_REWARDS, 'rewards'], [FAQ_CONSUMERS, 'consumers'], [FAQ_PROFESSIONALS, 'pros'],
  [FAQ_WHO, 'who'], [FAQ_QUALITY, 'quality'], [FAQ_ABOUT, 'about'], [FAQ_CONTACT, 'contact'], [ALL_FAQS, 'faq'],
];
const LEGAL_SRC = { '/privacy': 'privacy', '/gdpr': 'gdpr', '/cookies': 'cookies', '/terms': 'terms', '/profiling': 'profiling' };

export function buildDocs() {
  const docs = [];
  CURATED.forEach((d) => docs.push({ ...d, kind: 'curated' }));
  PAGE_FAQS.forEach(([list, src]) => list.forEach((f) => docs.push({ q: f.q, a: f.a, src, kind: 'faq' })));
  Object.values(LEGAL).forEach((doc) => {
    const src = LEGAL_SRC[doc.path];
    if (!src) return;
    (doc.sections || []).forEach((s) => {
      const text = strip([...(s.p || []), ...(s.list || [])].join(' '));
      if (text) docs.push({ q: s.h, a: clip(text), src, kind: 'policy' });
    });
  });
  QUALITY_CHECKS.forEach((c) => docs.push({ q: `What is ${c.name}?`, a: `${c.name}: ${c.line} It is one of the ${QUALITY_CHECKS.length} quality and security checks that protect members, data and rewards.`, src: 'quality', kind: 'data' }));
  VERIFICATION_PROTOCOLS.forEach((c) => docs.push({ q: `${c.name} for professionals`, a: `${c.name}: ${c.line}`, src: 'pros', kind: 'data' }));
  PRIVACY_PROMISES.forEach((c) => docs.push({ q: c.title, a: c.line, src: 'privacy', kind: 'data' }));
  PAYOUTS.forEach((p) => docs.push({ q: `${p.name} reward`, k: [p.short.toLowerCase()], a: `${p.name}: ${p.line}${p.only === 'IN' ? '' : ' Available to consumers and professionals.'}`, src: 'rewards', kind: 'data' }));
  [...SURVEY_CATEGORIES.map((s) => ({ ...s, seg: 'consumer' })), ...CONSUMER_SURVEYS, ...PRO_SURVEYS].forEach((s) =>
    docs.push({ q: `${s.title} survey`, a: `${s.title}: ${s.desc} ${s.reward ? `Typical reward around $${s.reward} for about ${s.mins} minutes.` : s.range ? `Typical reward ${s.range} for about ${s.mins} minutes.` : `Typically ${s.mins} minutes; professional studies are rewarded more — the exact reward is shown in the invitation.`}`, src: s.seg === 'pro' ? 'pros' : 'home', kind: 'data' }),
  );
  BLOG_FAQS.forEach((f) => docs.push({ q: f.q, a: clip(strip(f.a)), src: `blog:${f.slug}`, srcTitle: f.title, kind: 'blog' }));
  return docs;
}

// Entities for direct answers ("Can a CFO join?", "Is it available in Kenya?")
export const ENTITIES = {
  countries: REGIONS.flatMap((r) => r.countries.map((c) => ({ name: c, region: r.name }))),
  titles: JOB_TITLES.flatMap((t) => t.items.map((x) => ({ name: x, group: t.tier }))),
  industries: INDUSTRIES.flatMap((g) => g.items.map((x) => ({ name: x, group: g.group }))),
  departments: DEPARTMENTS.map((x) => ({ name: x })),
};

// Every FAQ shown on the site, in one place. Pages render them, JSON-LD is built from them,
// and the Live Help assistant answers from them (with a link back to the page as its source).
// Edit answers HERE — the page, its FAQ schema and the chat assistant all update together.

import { BRAND, CONTACT } from './site.js';

export const FAQ_ABOUT = [
  { q: 'Who runs MyFrequentRewards?', a: `MyFrequentRewards is operated by ${BRAND.legalName}, trading as MyFrequentRewards.` },
  { q: 'What is the relationship with Frequent Research?', a: 'MyFrequentRewards is the consumer and business opinion community of Frequent Research, an ISO-certified market research company.' },
  { q: 'Where are you based?', a: 'Our office is in Mangolpur Kalan, New Delhi, India, and our members are worldwide.' },
  { q: 'How can I contact the team?', a: 'Use 24/7 Live Help, WhatsApp, email or phone — all listed on our contact page.' },
  { q: 'Is MyFrequentRewards legitimate?', a: 'Yes — it is free to join, publishes its policies and is run by a registered research company.' },
];

export const FAQ_CONSUMERS = [
  { q: 'Who counts as a consumer member?', a: 'Any eligible adult — students, workers, parents, homemakers, retirees — sharing opinions about everyday products and services.' },
  { q: 'Can I earn money online from home with consumer surveys?', a: 'Yes, consumer surveys are completed online from any device, wherever you are.' },
  { q: 'What topics will I see?', a: 'Shopping, food and beverages, technology, travel, finance, automotive, beauty, pets, health, gaming and more.' },
  { q: 'Do I need any experience?', a: 'No — your everyday experience as a consumer is exactly what researchers need.' },
  { q: 'Is joining really free?', a: 'Yes, there is no investment or fee of any kind.' },
];

export const FAQ_CONTACT = [
  { q: 'What is the fastest way to reach support?', a: 'Live Help 24/7 gives instant answers, and WhatsApp connects you with our team.' },
  { q: 'What should I include in a reward query?', a: 'Your registered email and the approximate claim date — never your password or OTP.' },
  { q: 'Do you offer phone support?', a: `Yes, you can call ${CONTACT.phone} during business hours.` },
  { q: 'How do I report a scam using your name?', a: 'Forward the message to our support email so we can investigate.' },
  { q: 'Can I request my data or account deletion here?', a: 'Yes — choose “Privacy & data” as the topic and we will verify and process your request.' },
];

export const FAQ_PROFESSIONALS = [
  { q: 'Why are professional surveys rewarded more?', a: 'Specialist audiences are harder to reach, so B2B studies typically carry higher incentives than general consumer studies.' },
  { q: 'How do you verify professionals?', a: 'Through company email validation, phone verification, public profile cross-referencing such as LinkedIn, external database checks and manual reviews.' },
  { q: 'Will my employer or clients see my identity?', a: 'No — your identity is never shared; answers are reported anonymously or in aggregate.' },
  { q: 'Should I share confidential company information?', a: 'Never; surveys ask for your professional opinion, not confidential data.' },
  { q: 'Can business owners and freelancers join?', a: 'Yes — founders, owners, partners and independent consultants are welcome.' },
  { q: 'Do professionals also receive consumer surveys?', a: 'Yes, you can receive both business and consumer studies.' },
];

export const FAQ_REWARDS = [
  { q: 'How do I earn money online with MyFrequentRewards?', a: 'Complete eligible surveys and profile sections to build your balance, then claim it as PayPal, a bank or wire transfer, shopping, grocery or digital gift card vouchers — plus UPI for members in India.' },
  { q: 'Is there a minimum amount to claim?', a: 'Yes, a claim threshold applies and is shown in your dashboard; balances below it carry forward.' },
  { q: 'Which payout should I choose?', a: 'UPI suits members in India, PayPal suits most members, bank or wire transfer suits bank-first members, shopping, grocery and digital gift card vouchers suit everyday spending.' },
  { q: 'Why might a reward stay pending?', a: 'Rewards may stay pending while quality checks confirm a completion with the research client.' },
  { q: 'How do survey invitations reach me?', a: 'Through your Account Dashboard, SMS, WhatsApp or email — you choose.' },
  { q: 'Are there any fees?', a: 'MyFrequentRewards charges no fees; your payment provider’s own terms may apply.' },
];

export const FAQ_QUALITY = [
  { q: 'Why so many quality checks?', a: 'They protect honest members and research clients from bots, fraud and duplicate accounts, which keeps rewards flowing.' },
  { q: 'Do the checks collect extra personal data?', a: 'Checks use technical signals such as device, timezone and network to detect fraud, not to advertise to you.' },
  { q: 'Why was my VPN blocked?', a: 'GEO-IP, proxy and TOR detection require you to connect from your real location.' },
  { q: 'Who carries out manual reviews?', a: 'Our quality verification team reviews flagged accounts and validates professional credentials where applicable.' },
  { q: 'Is my data shared with anyone?', a: 'No, your personal details are never sold or shared with anyone else.' },
  { q: 'What extra checks apply to teen accounts?', a: 'Age is checked from the date of birth, a parent or guardian must use their own email and give consent before the account opens, login stays locked until then, and teens only receive age-appropriate studies.' },
];

export const FAQ_WHO = [
  { q: 'Which countries can join?', a: 'Members join from across Asia-Pacific, Europe, North America, South America, the Middle East and Africa; eligibility is confirmed at sign-up.' },
  { q: 'Do I need a particular job to join?', a: 'No — consumers of every background are welcome, and professionals also receive B2B studies about their work.' },
  { q: 'Is there a minimum age?', a: 'Adults 18+ join as consumers or professionals. Teens aged 13 to 17 can join the Teen Panel with a parent or guardian’s consent. Your date of birth decides which route you take.' },
  { q: 'Can I join if I am not working?', a: 'Absolutely — students, homemakers, retirees and job seekers are all valuable consumer voices.' },
  { q: 'Why do you ask about industry and department?', a: 'It lets us invite you to business studies that match your real expertise.' },
];

export const FAQ_HOW = [
  { q: 'How long does it take to join?', a: 'Most people register, verify and start their first profile survey within a few minutes.' },
  { q: 'Do I need to log in every day to find surveys?', a: 'No — invitations come to you by dashboard, SMS, WhatsApp or email, so you can simply respond when one arrives.' },
  { q: 'Why are profile surveys so important?', a: 'They tell us which studies fit you, so a complete and honest profile leads to more relevant invitations.' },
  { q: 'What happens if I do not qualify for a survey?', a: 'You are politely screened out, and new matching invitations will keep arriving.' },
  { q: 'How do I claim my rewards?', a: 'Open your dashboard, choose claim once you reach the threshold, pick a payout method and confirm.' },
  { q: 'Can I take part from any device?', a: 'Yes, surveys work on phones, tablets and computers with a modern browser.' },
];

export const HOME_FAQS = [
  { q: 'Is MyFrequentRewards free to join?', a: 'Yes. Joining, taking surveys and claiming rewards are completely free — we never ask for any payment.' },
  { q: 'How do I earn money online with MyFrequentRewards?', a: 'Sign up, verify your account, complete your profile and take the paid surveys you are matched with; rewards build up in your balance.' },
  { q: 'Who can join?', a: 'Everyday consumers and business professionals aged 18+ in a supported country, plus teens aged 13 to 17 through the Teen Panel once a parent or guardian consents.' },
  { q: 'How do I get paid?', a: 'Once you reach the claim threshold, choose PayPal, bank or wire transfer, shopping, grocery or digital gift card vouchers. UPI is also available to members in India.' },
  { q: 'How will I know about new surveys?', a: 'Choose alerts through your Account Dashboard, SMS, WhatsApp or email.' },
  { q: 'Is my personal information safe?', a: 'Yes — your personal details are never sold or shared, and answers reach clients only in anonymised form.' },
];

export const ALL_FAQS = [
  { cat: 'Getting started', q: 'How do I become a member?', a: 'Complete the short sign-up form, then click the verification link in the confirmation email we send you. Once verified, log in and start taking surveys — please use a valid email address.' },
  { cat: 'Getting started', q: 'Do I have to pay to join?', a: 'No. Registration is completely free and you will never be asked to pay any fee to join or take part in surveys.' },
  { cat: 'Getting started', q: 'What can I do as a member?', a: 'Take part in surveys on many topics, share your opinions with leading brands and research organisations, and earn reward points for successful participation.' },
  { cat: 'Getting started', q: 'Who can join?', a: 'Adults aged 18 or over (or the legal age in their country) join as consumers or professionals. Teens aged 13 to 17 join the Teen Panel, which opens only after a parent or legal guardian gives consent. Membership availability may vary by country.' },
  { cat: 'Teen Panel', q: 'Who can join the Teen Panel?', a: 'Teens aged 13 to 17 can join once a parent or legal guardian gives consent. Choose “Teen” on the sign-up page, or simply enter your real date of birth and we switch you to the teen route automatically.' },
  { cat: 'Teen Panel', q: 'What does my parent or guardian have to do?', a: 'You enter their name, email, phone and date of birth. We email them a Parent/Guardian Onboarding Form; they review it and give consent. Your account stays pending until they do.' },
  { cat: 'Teen Panel', q: 'Why can’t I log in yet?', a: 'Teen accounts open only after a parent or guardian has completed consent. Once they have, you receive an email to set your password, and then you can log in.' },
  { cat: 'Teen Panel', q: 'Who can be my parent or guardian on the form?', a: 'Your mother, your father or another adult who is legally responsible for you (a legal guardian). They must be 18 or older and use their own email address, not yours.' },
  { cat: 'Teen Panel', q: 'What kind of surveys do teens get?', a: 'Age-appropriate studies about gaming, music, snacks, style, apps, school, sport and tech. Every teen study is checked before it is sent, and sensitive topics are never sent to teens without separate permission.' },
  { cat: 'Teen Panel', q: 'How are teen rewards shown?', a: 'Each invitation shows the points and the time it takes before you start. How rewards are claimed for members under 18 is explained to the parent or guardian in the onboarding form.' },
  { cat: 'Teen Panel', q: 'Is a teen’s information kept private?', a: 'Yes. Personal details are never sold or shared, answers reach clients only in combined, anonymous form, and teens appear on our reviews pages by first name and last initial only.' },
  { cat: 'Teen Panel', q: 'Can a teen or parent stop at any time?', a: 'Yes. Taking part is never compulsory. A teen can skip or stop any survey, and a parent or guardian can withdraw consent at any time by writing to support.' },
  { cat: 'Teen Panel', q: 'What happens when I turn 18?', a: 'Your Teen Panel membership can move to a regular consumer membership, and from then on you manage your own account and consent.' },
  { cat: 'Account', q: 'How do I change my email address or password?', a: 'For security, email changes are handled by support at support@myfrequentrewards.com. To change your password, log in and go to Settings → Change Password.' },
  { cat: 'Account', q: 'Can I update my profile information?', a: 'Yes — most details can be updated in your profile settings, though core details such as date of birth, age and gender may be locked for data integrity. Keeping your profile updated increases your chances of qualifying.' },
  { cat: 'Account', q: 'How do I delete my account?', a: 'Email support@myfrequentrewards.com and confirm the request in the email you receive within 24–48 hours. You can restore your account within 30 days, after which all data is permanently deleted.' },
  { cat: 'Surveys', q: 'How do I receive surveys?', a: 'Surveys are matched to your profile and announced by email invitations, dashboard notifications and survey alerts. Log in, check the Available Surveys box and click “Take Survey”.' },
  { cat: 'Surveys', q: 'How many points will I earn per survey?', a: 'Points depend on survey length, complexity and sponsor requirements. The reward amount is always shown before you begin.' },
  { cat: 'Surveys', q: 'How many survey invitations will I get?', a: 'It depends on your demographic profile, survey availability, your frequency preferences and your qualification rate. A complete, up-to-date profile increases your invitations.' },
  { cat: 'Surveys', q: 'Why does it say “Survey Closed”?', a: 'Surveys close once the required number of participants is reached, so the quota has already been filled. Check your dashboard regularly for new opportunities.' },
  { cat: 'Surveys', q: 'Why am I asked the same questions repeatedly?', a: 'Questions such as age, location and household details are repeated to verify accuracy, confirm eligibility, maintain quality control and meet client targeting requirements.' },
  { cat: 'Surveys', q: 'A survey is not loading — what should I do?', a: 'Wait a few minutes, clear your browser cache or try another browser or device. If it continues, email support@myfrequentrewards.com with a screenshot of the error.' },
  { cat: 'Rewards', q: 'How do I redeem my rewards?', a: 'Once you reach the minimum redemption threshold, use the “Redeem Now” section in your dashboard. Reward types include PayPal, bank or wire transfer, shopping, grocery and digital gift card vouchers — plus UPI for members in India.' },
  { cat: 'Rewards', q: 'Which reward types can I choose?', a: 'Consumers and professionals can choose PayPal, bank transfer, wire transfer, shopping vouchers, grocery vouchers, or digital gift cards. UPI is available to members in India only. Availability of a reward type can vary by study and country.' },
  { cat: 'Rewards', q: 'How long does redemption take?', a: 'Our team verifies your account and participation, then the accounts department processes the request. This may take 2–3 weeks depending on queue volume and verification.' },
  { cat: 'Privacy & security', q: 'Is my personal information safe?', a: 'Your data is stored securely, personal information is not sold to third parties and survey responses are aggregated and anonymised. Your data is used only for research matching purposes.' },
  { cat: 'Privacy & security', q: 'Why do you need my demographic details?', a: 'Some surveys need specific groups, so accurate details help match you with relevant surveys and improve your qualification rate. All personal data is handled securely and confidentially.' },
  { cat: 'Privacy & security', q: 'What happens if I give inconsistent answers?', a: 'Inconsistent or false responses may lead to survey disqualification, account review, or suspension and termination. We encourage honest, thoughtful participation.' },
  { cat: 'Support', q: 'How can I contact support?', a: 'Email support@myfrequentrewards.com (please allow 24–72 business hours), chat with Live Help 24/7 or message us on WhatsApp at +91 81782 00573.' },
  { cat: 'Support', q: 'Will I ever have to buy anything?', a: 'Never. You will not be required to purchase products or services as a result of joining.' },
];


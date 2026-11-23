// Teen registration text. Every label, message and instruction of the Teen journey comes from here (never typed into
// a page), so a new language is one more pack, not a code change.
//   • en  — the source text
//   • hi  — hand-translated pack for the journey's key screens (falls back to English key by key)
//   • any other language — the site's own translator (Language button in the header) translates the English text
// Writing direction comes from the language list (Arabic, Urdu, Persian, Hebrew = right-to-left); the pages use
// logical CSS (inline-start/end) so they mirror cleanly. Dates are formatted with Intl for the chosen language.
import { useEffect, useState } from 'react';
import { currentLang } from '../i18n/translate.js';
import { BY_CODE } from '../i18n/languages.js';

export const EN = {
  // shared
  continue: 'Continue', back: 'Back', edit: 'Edit', optional: 'Optional', required: 'Required', close: 'Close', loading: 'Loading…',
  saving: 'Saving…', saved: 'Saved', search: 'Search', none_found: 'Nothing matches “{0}”.', type_own: 'Not in the list? Type it yourself',
  use_typed: 'Use “{0}”', pick_list: 'Pick from the list instead', or: 'or', step_of: 'Step {0} of {1}', ref: 'Reference',
  help: 'Need help?', support_line: 'Questions? Email support@myfrequentrewards.com', try_again: 'Try again',
  sound_on: 'Sound on', sound_off: 'Sound off', day: 'Day', night: 'Night',
  // field labels
  first_name: 'First name', middle_name: 'Middle name', last_name: 'Last name', dob: 'Date of birth', email: 'Email address',
  phone: 'Phone number', gender: 'Gender', country: 'Country', state: 'State / province / region', city: 'City / town',
  zip: 'ZIP / postal code', dd: 'Day', mm: 'Month', yyyy: 'Year', country_code: 'Country code',
  no_zip: 'My address has no postal code', self_describe: 'Describe it in your own words (optional)',
  g_Female: 'Female', g_Male: 'Male', 'g_Non-binary': 'Non-binary', 'g_Self-describe': 'Self-describe', 'g_Prefer not to say': 'Prefer not to say',
  // errors (codes from the shared rules / the API)
  e_first_name: 'Please enter a first name (letters in any language).', e_middle_name: 'Letters only, please.',
  e_last_name: 'Please enter a last name.', e_email: 'That email address doesn’t look right.', e_phone: 'That number doesn’t look right for the country chosen.',
  e_gender: 'Please choose one.', e_country: 'Please choose a country.', e_state: 'Choose a state or region, or type it yourself.',
  e_city: 'Choose a city or type it yourself.', e_zip: 'Letters and numbers only.', e_zip_required: 'Enter a postal code, or tick “no postal code”.',
  e_dob_invalid: 'Please enter a real date.', e_dob_future: 'That date is in the future.', e_under_13: 'The Teen Panel starts at 13.',
  e_adult: 'You’re 18 or older, so you’ll use the normal sign-up.', e_guardian_adult: 'A parent or guardian must be 18 or older.',
  e_guardian_own_email: 'Your parent or guardian needs their own email, not yours.', e_guardian_is_teen: 'That email belongs to a Teen account. Use your parent’s own email.',
  e_relation: 'Choose Mother, Father or Legal guardian.', e_consent_required: 'Please tick this box to continue.', e_required: 'Please answer this question.',
  e_email_taken: 'This email is already registered. Try logging in instead.', e_pending_exists: 'A Teen registration with this email is already waiting for a parent.',
  e_pw_short: 'At least 8 characters, please.', e_pw_mix: 'Mix letters and numbers.', e_pw_personal: 'Don’t use your name or email in your password.',
  e_pw_common: 'That one is too easy to guess.', e_pw_match: 'The two passwords don’t match.', e_pw_long: 'That’s too long.',
  e_unknown_option: 'Please pick one of the options.', e_one_answer: 'Please pick one answer.', e_exclusive: 'That answer can’t be combined with others.',
  e_server: 'Something went wrong on our side. Please try again in a moment.', e_network: 'We couldn’t reach the server. Check your connection and try again.',
  e_too_soon: 'We just sent that. Please wait a couple of minutes.', e_mail_failed: 'We couldn’t email your parent or guardian just now. Nothing was saved — please try again shortly.',
  e_link_invalid: 'This link isn’t valid. Please use the newest email we sent.', e_link_expired: 'This link has expired.', e_link_used: 'This link has already been used.',
  e_link_revoked: 'A newer link was sent. Please use the newest email.', e_already_done: 'This step is already complete.', e_already_declined: 'This request was declined.',
  e_bad_state: 'This step isn’t available right now.', e_fix_below: 'A few details need a look — they’re highlighted below.',

  // ---------- entry ----------
  en_kicker: 'Teen Panel · ages 13–17', en_title: 'Your opinions. Your rewards. Your parent’s OK.',
  en_lead: 'Join the MyFrequentRewards Teen Panel in four short steps. Your parent or guardian approves, then you create your password and you’re in.',
  en_start: 'Start my registration', en_have: 'Already approved?', en_login: 'Log in',
  en_need_h: 'Have these ready', en_need_1: 'Your name, date of birth and email', en_need_2: 'Where you live', en_need_3: 'Your parent or guardian’s name and email',
  en_time: 'About 3 minutes', en_steps_h: 'How it works',
  en_s1: 'You', en_s1d: 'Tell us about you', en_s2: 'Your adult', en_s2d: 'Mother, father or legal guardian',
  en_s3: 'Agree', en_s3d: 'Tick what you agree to', en_s4: 'Invite', en_s4d: 'We email your parent to say yes',
  en_age_h: 'First, when’s your birthday?', en_age_p: 'We use it to open the right registration for you.',
  route_teen_h: 'You’re in the right place!', route_teen_p: 'You’re {0}, so you join through the Teen Panel with your parent or guardian’s OK.',
  route_adult_h: 'You’re 18 or older', route_adult_p: 'The Teen Panel is for ages 13–17. You can join as a Consumer or Professional instead.',
  route_adult_btn: 'Go to the normal sign-up', route_block_h: 'Not quite yet!',
  route_block_p: 'The Teen Panel starts when you turn 13. We can’t create an account or keep any details before then — come back on your 13th birthday!',
  route_block_btn: 'Back to the home page', route_switched: 'We switched you to the Teen registration because you’re {0}.',

  // ---------- step 1 ----------
  s1_title: 'Let’s make your Teen pass', s1_lead: 'Your details stay private. Only you and our support team can see them.',
  s1_names: 'Your name', s1_birthday: 'Your birthday', s1_contact: 'How we reach you', s1_where: 'Where you live', s1_you: 'About you',
  s1_email_hint: 'This becomes your username. We’ll send your password link here.',
  s1_phone_hint: 'Only if you have one. We never call without asking.', s1_zip_hint: 'Format: {0}',
  pass_name: 'Your name here', pass_member: 'TEEN MEMBER', pass_status: 'Pending parent OK',

  // ---------- step 2 ----------
  s2_title: 'Who will say yes for you?', s2_lead: 'Pick one adult. We’ll send them a secure link to review your request.',
  s2_mother: 'Mother', s2_mother_d: 'My mum gives permission', s2_father: 'Father', s2_father_d: 'My dad gives permission',
  s2_guardian: 'Legal guardian', s2_guardian_d: 'Another adult legally responsible for me',
  s2_form_h: 'Their details', s2_email_hint: 'We email them a secure link to approve or decline. It must be their own inbox.',
  s2_env_to: 'To', s2_env_from: 'From', s2_env_sub: '{0} would like to join the Teen Panel', s2_change: 'Change',

  // ---------- step 3 ----------
  s3_title: 'Read it, then tick it', s3_lead: 'Each box is separate. Nothing is ticked for you.',
  s3_what_h: 'What the Teen Panel is', s3_what_p: 'Frequent Research asks people questions to understand what they think and feel about different products, services and experiences.',
  s3_if: 'If you join:', s3_flow_h: 'What happens next', s3_flow_1: 'We email your parent or guardian a secure link.',
  s3_flow_2: 'They choose YES or NO.', s3_flow_3: 'If YES, they fill in a short form and give consent.',
  s3_flow_4: 'You get an email to create your password.', s3_flow_5: 'You log in with your email as your username.',
  s3_use_h: 'How we use your details', s3_use_p: 'To check you can join, to reach your parent or guardian for permission, and to invite you to age-appropriate surveys — as explained in the privacy information.',
  s3_parent_note: 'Your tick is your own decision. It does not replace your parent or guardian’s permission — they give that separately.',
  s3_submit: 'Complete registration', s3_sending: 'Sending your invite…', s3_left: '{0} left to tick', s3_all: 'All set',

  // ---------- step 4 ----------
  s4_title: 'Invite sent!', s4_lead: 'Your registration is in. Your account switches on after your {0} says yes.',
  s4_sent_to: 'We emailed your {0} at', s4_status: 'Status', s4_status_v: 'Waiting for your parent or guardian',
  s4_next_h: 'What happens now', s4_n1: 'Your {0} opens our email and chooses YES or NO.', s4_n2: 'If YES, they fill in a short form and give their consent.',
  s4_n3: 'You get an email with a link to create your password.', s4_n4: 'Log in with {0} as your username.',
  s4_not_active: 'Your account is not active yet.', s4_resend: 'Resend the email to my parent', s4_resent: 'Sent again. Ask them to check spam too.',
  s4_tip: 'Tip: let them know it’s coming from MyFrequentRewards.', s4_home: 'Back to home',

  // ---------- status / renew ----------
  st_title: 'Your Teen registration', st_ref: 'Reference {0}',
  st_pending_guardian_approval: 'Waiting for your parent or guardian to say yes', st_guardian_approved: 'Your parent said YES — they’re filling in their form',
  st_pending_onboarding: 'Your parent is filling in their form', st_pending_consent: 'Your parent is giving consent',
  st_manual_review: 'Our team is checking a detail with your parent', st_pending_password: 'Done! Check your email to create your password',
  st_active: 'Your account is active — log in!', st_rejected: 'Your parent or guardian said no this time', st_expired: 'The invitation expired',
  st_cancelled: 'This registration was cancelled',
  rn_title: 'Need a new link?', rn_lead: 'Enter the email you registered with. If something is waiting, we’ll send a fresh link to the right person.',
  rn_btn: 'Send a new link', rn_done: 'If a registration is waiting, a new link is on its way. Check your inbox (and spam).',

  // ---------- guardian ----------
  gd_kicker: 'For parents and legal guardians', gd_title: '{0} would like to join the Teen Panel',
  gd_lead: 'You’ve been named as {0}’s {1}. Nothing happens unless you say yes.',
  gd_what_h: 'What the Teen Panel is', gd_what_p: 'MyFrequentRewards is the survey community of Frequent Research. Teens aged 13–17 share opinions in age-appropriate online surveys and earn reward points. No purchase is ever needed.',
  gd_safe_h: 'How your teen is protected', gd_safe_1: 'Only age-appropriate surveys', gd_safe_2: 'Your teen can skip questions or stop at any time',
  gd_safe_3: 'Sensitive topics and recordings always need separate permission', gd_safe_4: 'Details are never sold',
  gd_how_h: 'What we’ll ask of you', gd_how_1: 'Your decision', gd_how_2: 'A short form about you (about 3 minutes)', gd_how_3: 'Your consent selections',
  gd_q: 'Do you want to enroll {0} in the Teen Panel?', gd_yes: 'YES — I want to enroll my teen', gd_no: 'NO — I do not want to enroll my teen',
  gd_yes_sub: 'Continue to the short form and consent', gd_no_sub: 'Tell us why (optional) and we’ll close the request',
  gd_request: 'Request', gd_teen: 'Teen', gd_age: 'Age {0}', gd_you: 'You', gd_expires: 'This secure link works until {0}.',
  gd_confirm_yes_h: 'Confirm: enroll {0}?', gd_confirm_yes_p: 'Next you’ll fill in a short form and choose your consent options. Nothing is active until you finish.',
  gd_confirm_yes_btn: 'Yes, continue', gd_cancel: 'Go back',
  // onboarding
  ob_title: 'About you', ob_lead: 'So we know who is giving permission. We’ve filled in what {0} already told us — just check it.',
  ob_section: 'Section {0} of {1}', ob_review: 'Review your answers', ob_review_p: 'Check everything, then continue to consent.',
  ob_submit: 'Continue to consent', ob_saved_auto: 'Your answers save as you go.', ob_prefilled: 'From {0}’s registration',
  ob_health_skip: 'Skip for now', ob_health_start: 'Answer now', ob_stop_no_h: 'Only a parent or legal guardian can give permission',
  ob_stop_no_p: 'Thank you for telling us. We’ve stopped this registration and let {0} know. Nothing more is needed from you.',
  ob_stop_unsure_h: 'We’ll be in touch', ob_stop_unsure_p: 'Our support team will contact you to confirm who can give permission. The registration is paused until then.',
  ob_other: 'Please describe', ob_choose_many: 'Choose all that apply', ob_choose_one: 'Choose one',
  // consent
  cs_title: 'Teen research terms & parental consent', cs_lead: 'Read the summaries, open any section for the full text, then make your selections. Each box starts unticked.',
  cs_info_h: 'Important information for parents and legal guardians', cs_read: '{0} of {1} sections opened', cs_decl_h: 'Declaration',
  cs_sel_h: 'Your consent selections', cs_req: 'Required', cs_opt: 'Optional', cs_submit: 'Give permission', cs_confirm_h: 'Give permission for {0}?',
  cs_confirm_p: 'We’ll record your selections with version {0} and today’s date and time, then email {1} a link to create a password.',
  cs_confirm_btn: 'Yes, give permission', cs_missing: '{0} required box(es) still to tick', cs_full: 'Read the full section', cs_hide: 'Hide full text',
  cs_binding: 'The English text is the binding version.', cs_print: 'Print or save as PDF',
  // approved
  ap_title: 'Thank you, {0}!', ap_lead: 'Your part is complete. We’ve emailed {1} a secure link to create their password.',
  ap_user: 'Their username is their email: {0}', ap_record: 'Your consent record', ap_version: 'Version', ap_when: 'Given on',
  ap_change: 'You can change your mind at any time — email support@myfrequentrewards.com.', ap_next_h: 'What happens next',
  ap_n1: '{0} creates a password', ap_n2: 'Their account switches on', ap_n3: 'They go straight to their dashboard',
  // decline
  dc_title: 'We’re sorry to hear that', dc_lead: 'Before we close the request, would you tell us why? It’s optional — you don’t have to explain.',
  dc_r_not_now: 'I do not wish to enroll my Teen at this time.', dc_r_understand_more: 'I would like to understand the Teen Panel better before making a decision.',
  dc_r_privacy: 'I have concerns about privacy or the use of personal information.', dc_r_surveys: 'I have concerns about the surveys or activities.',
  dc_r_not_guardian: 'I am not the appropriate parent or legal guardian.', dc_r_not_recognised: 'I did not initiate or recognize this registration request.',
  dc_r_other: 'Other', dc_comment: 'Anything you’d like to add? (optional)', dc_submit: 'Confirm: do not enroll', dc_back: 'I chose this by mistake — go back',
  dc_confirm_h: 'Close {0}’s request?', dc_confirm_p: 'No account will be created, no password link will be sent and {0} will be told the registration can’t go ahead.',
  dc_done_h: 'Your decision is recorded', dc_done_p: 'We won’t create an account for {0}. We’ve sent you a confirmation email.',
  dc_done_unrec: 'If you didn’t recognise this request, thank you for telling us. We won’t contact you about it again.',

  // ---------- password ----------
  pw_title: 'Create your password', pw_lead: 'Your {0} said yes! One last thing, {1}.', pw_user: 'Your username', pw_new: 'New password', pw_again: 'Type it again',
  pw_rule_len: '8 or more characters', pw_rule_mix: 'Letters and numbers', pw_rule_personal: 'Not your name or email', pw_rule_match: 'Both match',
  pw_show: 'Show', pw_hide: 'Hide', pw_btn: 'Create password and switch on my account', pw_done_h: 'You’re in!', pw_done_p: 'Your Teen Panel account is active.',
  pw_login: 'Log in now', pw_expired_h: 'This link has expired', pw_expired_p: 'No problem — ask for a new one and we’ll email it to you.',

  // ---------- welcome & survey ----------
  wl_hi: 'Hi {0}!', wl_title: 'Welcome to the Teen Panel', wl_lead: 'A few quick questions so we can match you with surveys you’ll actually like. About a minute.',
  wl_known_h: 'Already saved from your registration', wl_known_p: 'We won’t ask these again.', wl_go: 'Let’s go', wl_later: 'Maybe later',
  wl_q: 'Question {0} of {1}', wl_review_h: 'Check your answers', wl_review_p: 'Tap any answer to change it.', wl_finish: 'Save and finish',
  wl_done_h: 'Profile started!', wl_done_p: 'Surveys that fit you will land in your dashboard. More profile topics are waiting whenever you like.',
  wl_profile: 'Open my profile', wl_dashboard: 'Go to my dashboard', wl_skip_q: 'Skip this one',

  // ---------- profile ----------
  pf_title: 'My profile', pf_lead: 'Everything you’ve told us in one place. Add more topics any time — each one helps us match better surveys.',
  pf_me: 'About me', pf_where: 'Where I live', pf_adult: 'My parent or guardian', pf_adult_p: 'Kept separately from your profile.',
  pf_consent: 'Consent', pf_consent_v: 'Given · version {0}', pf_locked: 'Set at registration', pf_locked_p: 'To change this, your parent or guardian needs to confirm it — email support@myfrequentrewards.com.',
  pf_topics: 'Profile topics', pf_done: '{0} of {1} answered', pf_open: 'Open', pf_save: 'Save topic', pf_member_since: 'Member since {0}',
  pf_signin: 'Please log in to see your profile.',

  // ---------- added with the page build ----------
  route_block_note: 'Nothing you typed has been saved.', route_fix_dob: 'I typed my birthday wrong',
  s1_age_ok: 'You’re {0} — perfect for the Teen Panel.', s1_age_hint: 'The Teen Panel is for ages 13–17.',
  s1_no_states: 'This country has no list of regions. Type yours if it has one.', s1_city_type: 'Type your city or town.',
  s1_zip_any: 'If your address has one.',
  s3_why_h: 'Why your parent or guardian is involved', s3_why_p: 'You’re under 18, so a parent or legal guardian has to give permission before you can take part. We email them, they choose yes or no, and nothing switches on until they’ve finished.',
  s3_flow_time: 'Your parent’s link works for 7 days. We send them a reminder if they haven’t opened it.',
  s3_version: 'These confirmations are saved with version {0}, the date and time, and your registration reference.',
  s3_stamp: 'Ready', s3_to: 'Next, we email your {0}.',
  tc_assent: 'My own decision', tc_participation: 'Parent or guardian first', tc_accurate: 'True details', tc_terms: 'Terms', tc_privacy: 'Privacy',
  link_terms: 'Terms and Conditions', link_privacy: 'Privacy Policy', link_teen_terms: 'Teen research terms', link_teen_privacy: 'Teen privacy information',
  s4_adult: 'parent or guardian', s4_username: 'Your username', s4_expires: 'Their link works until', s4_n0: 'You registered',
  s4_track: 'Track my registration', s4_gone: 'This registration is finished in this tab. Use the link in your email to check where it’s at.', s4_new: 'Register someone else',
  st_hi: 'Hi {0}, here’s where things are', st_need_pw: 'I need a new password link',
  st_step_1: 'Your {0} chooses YES or NO', st_step_2: 'They said YES', st_step_3: 'They fill in a short form and give consent', st_step_4: 'You create your password', st_step_5: 'Your account is active',
  st_end_rejected: 'Your parent or guardian decided not to go ahead this time. No account was created. If something changes, you can start a new registration.',
  st_end_cancelled: 'This registration was closed, so no account was created. You can start a new registration whenever you’re ready.',
  st_end_expired: 'Your parent or guardian didn’t answer in time. Ask for a new link below and we’ll email them again.',
  rn_note: 'For your safety we give the same answer whether or not an email is registered.', rn_start: 'Start a new Teen registration',
  gd_after_h: 'After you say yes', gd_after_p: '{0} gets an email with a link to create a password. The account becomes active only after that, and you can withdraw permission at any time.',
  gd_done_p: 'Thank you, there’s nothing more to do on this link. If you have a question, email support@myfrequentrewards.com.',
  ob_changed_mind: 'I’ve changed my mind — I don’t want to enroll my teen', ob_dob_hint: 'We use it only to confirm you’re an adult.',
  ob_gate_no: 'Thank you for telling us. When you continue, the registration stops, because only a parent or legal guardian can give permission.',
  ob_gate_unsure: 'No problem. When you continue, our support team will contact you to confirm who can give permission, and the registration pauses until then.',
  ob_health_skipped: 'Skipped. You can answer these later from your teen’s profile settings.', ob_submit_review: 'Submit my answers',
  cs_meta: 'Agreement {0} · effective {1}', cs_section: 'Section {0}', cs_open_all: 'Open all sections', cs_close_all: 'Close all sections',
  cs_ready: 'All required boxes ticked', cs_edit_form: 'Edit my answers',
  ap_n0: 'You gave permission', ap_user_l: 'Your teen’s username', ap_given: 'Given', ap_not_given: 'Not given',
  dc_reasons_h: 'Why not? (optional, choose any)', dc_confirm_btn: 'Yes, close the request',
  dc_unrec_note: 'Thank you. We’ll close this request and won’t contact you about it again.',
  dc_done_1: 'No account has been created', dc_done_2: '{0} has been told the registration can’t go ahead', dc_done_3: 'No password link will be sent',
  dc_done_change: 'If you change your mind later, your teen can start a new registration.',
  pw_already: 'Your password is already set. Log in with your email.', pw_safe: 'We will never ask for your password by email, SMS or WhatsApp.',
  wl_already: 'You’ve already answered your welcome questions. Add more any time in your profile.', wl_nothing: 'You’ve already told us the basics. Head to your profile to add more topics.',
  wl_k_age: 'Age', wl_time: '{0} quick questions', wl_tz_device: 'This device', wl_tz_country: 'Your country',
  pf_relation: 'Relationship', pf_complete: 'Complete', pf_how_change: 'How do I change these?',
  pf_change_steps: 'Email support@myfrequentrewards.com from your registered email and tell us what to change. We’ll confirm it with your parent or guardian at their email before anything is updated.',
  pf_welcome_again: 'See my welcome questions again', tm_toc: 'Chapters',
};

const HI = {
  continue: 'आगे बढ़ें', back: 'पीछे', edit: 'बदलें', optional: 'वैकल्पिक', required: 'ज़रूरी', close: 'बंद करें', loading: 'लोड हो रहा है…',
  saving: 'सेव हो रहा है…', saved: 'सेव हो गया', search: 'खोजें', type_own: 'सूची में नहीं है? ख़ुद लिखें', use_typed: '“{0}” इस्तेमाल करें',
  step_of: 'चरण {0} / {1}', ref: 'रेफ़रेंस', first_name: 'पहला नाम', middle_name: 'बीच का नाम', last_name: 'उपनाम', dob: 'जन्म तिथि',
  email: 'ईमेल पता', phone: 'फ़ोन नंबर', gender: 'लिंग', country: 'देश', state: 'राज्य / प्रांत', city: 'शहर / कस्बा', zip: 'पिन / पोस्टल कोड',
  dd: 'दिन', mm: 'महीना', yyyy: 'साल', g_Female: 'महिला', g_Male: 'पुरुष', 'g_Non-binary': 'नॉन-बाइनरी', 'g_Self-describe': 'अपने शब्दों में', 'g_Prefer not to say': 'नहीं बताना चाहते',
  en_kicker: 'टीन पैनल · 13–17 वर्ष', en_title: 'आपकी राय। आपके रिवॉर्ड। आपके अभिभावक की हाँ।',
  en_lead: 'चार छोटे चरणों में MyFrequentRewards टीन पैनल से जुड़ें। अभिभावक हाँ कहें, फिर आप पासवर्ड बनाएँ।',
  en_start: 'रजिस्ट्रेशन शुरू करें', en_age_h: 'पहले, आपका जन्मदिन कब है?', route_block_h: 'अभी नहीं!',
  route_block_p: 'टीन पैनल 13 साल की उम्र से शुरू होता है। उससे पहले हम कोई खाता नहीं बना सकते और कोई जानकारी नहीं रखते।',
  s1_title: 'आइए आपका टीन पास बनाएँ', s2_title: 'आपके लिए हाँ कौन कहेगा?', s2_mother: 'माँ', s2_father: 'पिता', s2_guardian: 'कानूनी अभिभावक',
  s3_title: 'पढ़ें, फिर टिक करें', s3_submit: 'रजिस्ट्रेशन पूरा करें', s4_title: 'निमंत्रण भेज दिया!',
  gd_yes: 'हाँ — मैं अपने किशोर को नामांकित करना चाहता/चाहती हूँ', gd_no: 'नहीं — मैं अपने किशोर को नामांकित नहीं करना चाहता/चाहती',
  ob_title: 'आपके बारे में', cs_submit: 'अनुमति दें', dc_title: 'हमें यह सुनकर खेद है', pw_title: 'अपना पासवर्ड बनाएँ', wl_title: 'टीन पैनल में स्वागत है', pf_title: 'मेरी प्रोफ़ाइल',
  e_required: 'कृपया इस प्रश्न का उत्तर दें।', e_consent_required: 'आगे बढ़ने के लिए कृपया यह बॉक्स टिक करें।', e_email: 'यह ईमेल पता सही नहीं लगता।',
};

const PACKS = { en: EN, hi: HI };

export function t(key, ...vars) {
  const lang = activeLang();
  const pack = PACKS[lang] || EN;
  let s = pack[key] ?? EN[key] ?? key;
  vars.forEach((v, i) => { s = s.split(`{${i}}`).join(v == null ? '' : String(v)); });
  return s;
}
export const err = (code) => (code ? t(`e_${code}`) : '');

let current = 'en';
export function activeLang() {
  if (typeof window === 'undefined') return 'en';
  try { current = currentLang() || 'en'; } catch { current = 'en'; }
  return current;
}
export const dirFor = (code) => (BY_CODE[code]?.dir === 'rtl' ? 'rtl' : 'ltr');

// Re-renders a Teen page when the visitor switches language (the site stores it in localStorage / a cookie).
export function useTeenLang() {
  const [lang, setLang] = useState('en');
  useEffect(() => {
    const read = () => setLang(activeLang());
    read();
    const id = setInterval(read, 1500);
    window.addEventListener('storage', read);
    return () => { clearInterval(id); window.removeEventListener('storage', read); };
  }, []);
  return { lang, dir: dirFor(lang) };
}

export function fmtDate(iso, lang = activeLang(), opts = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!iso) return '';
  const d = new Date(String(iso).length === 10 ? `${iso}T12:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return '';
  try { return new Intl.DateTimeFormat(lang, { ...opts, timeZone: String(iso).length === 10 ? 'UTC' : undefined }).format(d); } catch { return d.toDateString(); }
}
export function monthNames(lang = activeLang()) {
  try { return Array.from({ length: 12 }, (_, i) => new Intl.DateTimeFormat(lang, { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2020, i, 15)))); } catch { return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']; }
}

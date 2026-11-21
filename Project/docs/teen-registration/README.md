# Teen registration (ages 13–17)

How a teen joins MyFrequentRewards with a parent or legal guardian's permission, end to end.

| Doc | What it covers |
| --- | --- |
| [BACKEND.md](BACKEND.md) | API endpoints, statuses, secure links, data model, the member-API lock-down, jobs and settings |
| [EMAILS.md](EMAILS.md) | The 12 email templates, who gets each one and when |
| [LEGAL-REVIEW.md](LEGAL-REVIEW.md) | Points that need a decision from legal / compliance before launch |

## The journey

1. **One Sign up page for everyone** (`/sign-up`): Consumer, Business professional and Teen (13–17) are three types on
   the same card, with the same rail, fields, date picker, country picker and captcha. A 13–17 date of birth typed in the
   adult form switches the card to Teen in place; an 18+ date in the Teen form offers "Join as a Consumer"; under 13 is
   blocked.
2. **Teen steps on that card** (`/sign-up?type=teen`, 4 steps): About you → Stay in touch → Your parent (Mother / Father /
   Legal guardian, gender asked only for a legal guardian) → Agree (separate ticks, none pre-ticked, captcha) → "Invite
   sent" with the masked guardian email, a tracker and a resend button. The draft survives a refresh (sessionStorage) and a
   double click can't submit twice (idempotency key + server check).
3. **Two emails**: the teen gets "You're in the queue", the guardian gets the invite with bold **YES / NO** buttons.
4. **Parent page** (`/teen/parent`, the only teen-only page): reached only from the guardian's email link. NO = optional
   reasons, confirm, recorded, no account. YES = onboarding form (known answers pre-filled, autosave, review) → consent
   (full MINOR-2026.10 text, every box unticked) → teen gets a single-use password link.
5. **Password** (`/set-password?type=teen`, the same Set password page as adults): the account becomes active only when
   the password is set.
6. **Log in** (`/login?type=teen`, the same Log in page): first time, the same welcome-survey step adults get, with the
   teen questions (only what isn't known yet). The teen profile is the member dashboard's Profiles page (teen category).
7. **Status and new links**: the status email link opens the Sign up card's tracker (`/sign-up?type=teen&t=…`); a new
   link is requested on the same Forgot password page (`/forgot-password?type=teen`, same answer whether or not the
   address exists).
8. **Teen research terms** (`/teen-terms`): the same Legal page template as Terms and Privacy, filled from the consent
   source file.

## Pages (frontend-1)

| Route | File | Notes |
| --- | --- | --- |
| `/sign-up?type=teen` | `src/pages/SignUp.jsx` + `src/components/TeenSignup.jsx` | Teen type on the shared card |
| `/login?type=teen` | `src/pages/Login.jsx` + `src/components/WelcomeSurvey.jsx` (`TeenWelcome`) | shared page |
| `/set-password?type=teen` | `src/pages/SetPassword.jsx` (`TeenSetPassword`) | shared page |
| `/forgot-password?type=teen` | `src/pages/ForgotPassword.jsx` | shared page |
| `/teen-terms` | `src/pages/LegalPage.jsx` + `src/data/legal.js` (`LEGAL.teen`) | shared legal template |
| `/teen/parent` | `src/pages/TeenParent.jsx` | parent's email-link page, `noindex` |

Shared pieces live in `src/teen/` (`shell.jsx`, `link.js`, `ui.jsx`, `ConsentReader.jsx`, `ProfileQuestion.jsx`,
`teen.css`, `i18n.js`, `geo.js`, `api.js`). Teen colours on the shared pages come from `aud-min` in
`src/styles/v32-minor.css`.

**Demo mode** (`VITE_DEMO_MODE=true`, and the single-file preview) runs the whole journey in the browser with a fake
server and a "Preview mailbox" that shows the emails with working YES / NO and password links.

## Running the tests

```bash
# API: rules unit tests + full journey against a real MongoDB
cd api
node tests/teen.rules.test.mjs
MONGO_URL=mongodb://127.0.0.1:27017/mfr_teen_test node tests/teen.api.test.mjs

# Frontend
cd frontend-1
npm run build && npm run seo:check
npm run build:preview      # dist-preview/myfrequentrewards-preview.html
```

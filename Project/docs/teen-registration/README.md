# Teen registration (ages 13–17)

How a teen joins MyFrequentRewards with a parent or legal guardian's permission, end to end.

| Doc | What it covers |
| --- | --- |
| [BACKEND.md](BACKEND.md) | API endpoints, statuses, secure links, data model, the member-API lock-down, jobs and settings |
| [EMAILS.md](EMAILS.md) | The 12 email templates, who gets each one and when |
| [LEGAL-REVIEW.md](LEGAL-REVIEW.md) | Points that need a decision from legal / compliance before launch |

## The journey

1. **Age routing (every sign-up).** The date of birth decides the route on the server (`/api/v1/teen/age-check`, and the
   adult registration refuses anyone under 18). Under 13: a friendly stop, nothing stored. 13–17: the Teen registration.
   18+: the normal Consumer / Professional sign-up, unchanged. A teen DOB typed into the adult form moves the teen to
   `/sign-up?type=teen` and carries over what they already typed.
2. **Teen sign-up** (`/sign-up?type=teen`, 4 steps): the teen's details → Mother / Father / Legal guardian (gender asked
   only for a legal guardian) → separate consent ticks, none pre-ticked → "Invite sent" with the masked guardian email,
   the pending status and next steps. The draft survives a refresh (sessionStorage) and a double click can't submit twice
   (idempotency key + server check).
3. **Two emails**: the teen gets "You're in the queue", the guardian gets the invite with bold **YES / NO** buttons.
4. **NO** (`/teen/parent`): optional reasons and comment, a confirm step and a way back. Recorded; both notified; no account.
5. **YES** (`/teen/parent`): confirm → onboarding form (known answers pre-filled, conditional questions, autosave, review)
   → consent (full MINOR-2026.10 text, every box unticked, required ones enforced, confirm) → teen gets a single-use
   password link.
6. **Password** (`/teen/set-password`): the account becomes active only when the password is set.
7. **Teen login** (`/login?type=teen`) → first time: **welcome survey** (`/teen/welcome`, only what isn't known yet, one
   question per card, review) → **profile** (`/teen/profile`: teen and guardian kept separate, registration details locked,
   13 topics editable).
8. **Status and renewals**: `/teen/status` (tracker from the status link), `/teen/renew` (new link by email, same answer
   whether or not the address exists), expired links offer a renew button on every page.

## Pages (frontend-1)

| Route | File | Look |
| --- | --- | --- |
| `/sign-up?type=teen` | `src/pages/TeenRegister.jsx` | candy gradient, live "Teen pass" card |
| `/teen/parent` | `src/pages/TeenParent.jsx` | calm navy / white for parents |
| `/teen/set-password` | `src/pages/TeenSetPassword.jsx` | teal vault |
| `/teen/status`, `/teen/renew` | `src/pages/TeenStatus.jsx` | night-sky tracker |
| `/teen/terms` | `src/pages/TeenTerms.jsx` | reader |
| `/teen/welcome` | `src/pages/TeenWelcome.jsx` | arcade night |
| `/teen/profile` | `src/pages/TeenProfile.jsx` | bright world map |

Shared pieces live in `src/teen/` (`shell.jsx`, `ui.jsx`, `ConsentReader.jsx`, `ProfileQuestion.jsx`, `teen.css`,
`i18n.js`, `geo.js`, `api.js`). All teen pages are `noindex`, support day / night mode, RTL, reduced motion and sound
(off when the site's sound is off).

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

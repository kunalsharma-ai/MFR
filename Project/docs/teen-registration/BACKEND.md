# Teen registration: backend

Code: `api/app/teen/*` (rules, service, tokens, mail, content), routes in `api/app/routes/api/Teen.js`, models
`TeenRegistration`, `TeenGuardian`, `TeenConsent`, `TeenToken`.

## Endpoints: `/api/v1/teen`

| Who | Endpoint | Notes |
| --- | --- | --- |
| public | `POST /age-check` | returns `blocked` / `teen` / `adult` only; stores nothing |
| public | `POST /register` | steps 1–3 in one submit; idempotency key; refuses under 13 / 18+ / a used email |
| public | `GET /status/:token`, `POST /resend`, `POST /renew` | status link only; renew answers the same whether or not the email exists |
| guardian link | `GET /guardian/:token`, `POST …/decision`, `PUT …/onboarding`, `POST …/consent`, `POST …/renew` | the link is the only key; it works only for its own registration and only at the right stage |
| password link | `GET /password/:token`, `POST /password/:token` | single use |
| signed-in teen | `GET /me`, `PUT /me/answers` | JWT; registration fields are locked |
| job | `POST /jobs/sweep` | header `x-job-key: $TEEN_JOB_KEY`; reminders and expiry |

Every endpoint has a rate limit (see the header comment in `Teen.js`).

## Statuses (server-enforced)

`initial_registration → pending_guardian_approval → guardian_approved → pending_onboarding → pending_consent →
pending_password → active`, plus `rejected`, `expired`, `cancelled` and `manual_review`. The allowed moves are listed in
`TRANSITIONS` (`app/teen/rules.js`); anything else is refused, so no one can skip a stage by calling a later endpoint.
Each move is written to the registration's history with who made it and when.

## Secure links

- Random 32-byte tokens; only a SHA-256 hash is stored (`TeenToken`).
- Each token has one purpose (`guardian`, `password`, `status`), one registration, and an expiry (guardian 7 days,
  password 72 hours). The password link is single use. A new link revokes older ones of the same purpose (reminders
  are the exception, so a parent's open tab keeps working).
- In the browser, `?t=` is moved to sessionStorage and removed from the address bar at once, and the pages send
  `Referrer-Policy: no-referrer`.

## Records kept

- **Teen** (`User`, category `minor`): name, DOB, email (= username), optional phone, gender, location. Login is
  refused until the status is `active`.
- **Guardian** (`TeenGuardian`), separate from the teen: relation, name, email, optional phone, onboarding answers,
  decision, reasons and comment.
- **Consent** (`TeenConsent`), one row per tick: who, the statement text, version, value, time, IP / user agent and
  the registration reference. Teen assent at sign-up and guardian consent are stored separately.
- Every email sent is logged on the registration (template, recipient role, time, delivered).

## Member-API lock-down (`/api/v1/user`)

| Endpoint | Before | Now |
| --- | --- | --- |
| `GET /user` (list all) | public | admin only |
| `POST /user` (filter / search) | public | admin: full search (filter sanitised); member: only their own referrals, limited fields |
| `GET /user/:id` | public | the member themselves or an admin; `role` hidden from members |
| `PUT /user/:id` | public, any field | member: own record, only consent / preference fields; admin: all but password, teen status and guardian consent |
| `DELETE /user/:id`, `DELETE /user/terms` | public | admin only |
| `PUT /user` (register) | any field, returned the emailed code | whitelisted fields, 18+ only, returns only the new id |
| `POST /user/:id` (check code) | returned the record | says only valid / expired |
| `PATCH /user/:id` (resend) | public | rate limited, never returns the record, refuses teen accounts |
| `POST /user/autologin`, `/refresh`, `GET /summarize` | public | admin only |
| `POST /user/:user/profile-data` | public | self or admin |
| `POST /user/teen`, `/teen/resend`, `PUT /parent-consent/:id` | old teen flow | `410 Gone` with a pointer to the new flow |

Helpers: `app/utils/access.js` (`requireMember`, `requireAdmin`, `selfOrAdmin`, field whitelists). Admin roles:
administrator, admin, superadmin, root.

Frontend pages checked against the lock-down: the portal admin pages (panelists, support, redemptions, survey, apps)
already send the admin's bearer token; member consent / terms / referrals pages send the member's own token; the old
portal `/auth/parent-consent` page now only explains where the new flow is (it read the member record from the URL
before).

## Settings

| Variable | Use |
| --- | --- |
| `PUBLIC_SITE_URL` | base of links in emails (defaults to `https://<origin>`) |
| `TEEN_JOB_KEY` | protects `POST /jobs/sweep`; run it hourly (or `node app/jobs/teen-reminders.js`) |
| `TEEN_MAIL_OUTBOX` | dev / test only: write emails to a folder as JSON instead of sending |

The email-template service needs the `mailer/teen/` folder (category `teen`) available the same way as
`mailer/register/`.

## Known gaps

- `GET /api/v1/profile` and the `/api/v1/answers` summary were outside this change and should get the same review.
- Forgot-password still answers differently for unknown emails (account enumeration).
- ZIP / postal datasets are incomplete for some countries; manual entry is allowed everywhere.

# MyFrequentRewards emails: what sends what

All templates are the approved **v6** designs (Kunal, Nov 2026), except the Teen and engagement ones, which were built
earlier. Every email goes through the same two services as before: `email-template` renders
`mailer/<category>/<template>.liquid`, and `email` sends it. No new mail provider was added.

**Images.** The v6 templates load their images from `https://www.frequentresearch.com/mailer/v6/...` (the four
reminder emails) and `.../mailer/v7/...` (the 18 templates). Upload `mailer/assets/v6/` and `mailer/assets/v7/` to
those paths before switching anything on. Only the images the templates actually use are included (82 files, 1.9 MB).

## Template → trigger

| Template | Sent when | Sent by | Status |
|---|---|---|---|
| `register/respondent` | A Consumer or Professional registers (the "verify and set password" link) | `PUT /api/v1/user` | **live** (already sending) |
| `register/forgot-password` | The member asks for a reset link | `/api/v1/forgot-password` | **live** |
| `register/change-email` | The member asks to change their email (confirm on the old address) | `PATCH /api/v1/me/change-email` | **live** |
| `register/change-email-verify` | The new address has to be verified | `/api/v1/change-email` | **live** |
| `register/invite` | The member invites friends by email | `POST /api/v1/me/invite` | **live** |
| `support/ticket-created-user` | The member opens a support ticket | `POST /api/v1/support` | **live** |
| `support/ticket-created-team` | Same, to the support team | `POST /api/v1/support` | **live** |
| `support/ticket-updated-user` | Someone replies on the ticket | support reply route | **live**. The reply is now shown as plain text (HTML stripped, then escaped). Before, raw HTML from the reply went straight into the email. |
| `support/ticket-updated-team` | Same, to the support team | support reply route | **live**, same fix |
| `register/minor` | Legacy Teen parent email | `PATCH /api/v1/me/parent-details` (old route) | legacy: the Teen Panel now uses `teen/*` |
| `register/welcome` | The member sets their password (account active) | `PATCH /api/v1/user` → `engagement/transactional.js` | **new, off**: `emails.welcome` |
| `newuser/newuser` | A new registration, to the team | `PUT /api/v1/user` → `transactional.js` | **new, off**: `emails.newUser` (needs the team addresses in `emails.newUser.to`) |
| `survey/newsurvey` | A survey invitation was created for the member (auto-invite at sign-up, or a bulk invite from admin) | `controller/User.js`, `controller/Survey.js` → `transactional.js` | **new, off**: `emails.newSurvey`. Skipped if the member turned off "new survey" emails or reached their invites-per-week limit |
| `birthday/birthday` | The member's birthday, in their time zone | `app/jobs/lifecycle-emails.js` (09:00 UTC run) | **new, off**: `emails.birthday` |
| `lifecycle/case1-password` | Registered over 24 hours ago and the password was never set | `app/jobs/lifecycle-emails.js` (hourly) | **new, off**: `emails.lifecycle` |
| `lifecycle/case2-terms` | Password set, research terms not accepted | same | **new, off** |
| `lifecycle/case3-noprofiles` | Terms accepted, no profile complete | same | **new, off** (has an unsubscribe link) |
| `lifecycle/case4-partial` | Some profiles complete, some still open. This is the **every-2-days profile reminder** from Profile v4.1 | same | **new, off** (has an unsubscribe link). It shows the member's real figures: profiles done, points, rank and points to the next dollar, at the points the API really pays per profile (50 today) |
| `engagement/weekly-summary` | Weekly points recap | `app/jobs/weekly-summary.js` | **new, off**: `weeklySummary.enabled` |
| `engagement/expiry-reminder` | Points are about to expire | (Phase 2, only if expiry is ever switched on) | **new, off**: `expiry.enabled` |
| `teen/*` (12) | Teen Panel registration and guardian consent | `/api/v1/teen` | **live** (PR #15) |

### Templates with no trigger

- `register/reset-password`: an admin resets a member's password. The User model has `resetPassword()`, but no route
  calls it, so nothing sends this email.
- `register/parent-consent`, `register/minor-permitted-parent`, `register/minor-permitted-child`: the old minor-consent
  flow. The Teen Panel (PR #15) replaced it with `teen/*`, and the old routes now answer 410. These are kept so the
  template service still finds them, but nothing sends them.
- `project/newproject`: still empty (0 bytes), as it arrived. The designer asked for it to be sent again.

## Reminder rules (`lifecycle/*`)

These are the Profile v4.1 rules:

- at most one reminder every **48 hours**, and none while the member has done anything in the last 48 hours
- at most **15** in total
- stops when the member unsubscribes (cases 3 and 4 carry a one-click link; cases 1 and 2 are transactional)
- never sent to Teen Panel members
- the member's state is checked again at send time

Members' state is decided in this order: password → terms → profiles.

Turn them on with an `ENGAGEMENT_CONFIG` JSON file:

```json
{ "emails": { "lifecycle": { "enabled": true }, "welcome": true, "birthday": true, "newSurvey": true,
              "newUser": { "enabled": true, "to": ["team@example.com"] } },
  "weeklySummary": { "enabled": true } }
```

Try a run first with `node app/jobs/lifecycle-emails.js --dry-run`, which lists counts per case and sends nothing.

## Editing the v6 designs

The React sources stay with the designer's pack (`mfr-emails-v6`, `mfr-templates-v6`). After a rebuild:

- copy `dist/liquid/*` over the files here
- for `case3-noprofiles` and `case4-partial`, run `python3 lifecycle/make-case3-dynamic.py <new case3> lifecycle/case3-noprofiles.liquid`
  and `python3 lifecycle/make-case4-dynamic.py <new case4> lifecycle/case4-partial.liquid`. The designs bake in sample
  figures (37 profiles at 100 points each, 4 of 37, 400 points, Player). The scripts swap them for the member's own
  figures and for the points the API really pays per profile (50 today; Kunal chose to keep 50 for now). They stop
  if the design changed so much that a figure can't be found.
- in `support/ticket-updated-*`, keep the plain-text filter on `reply.message`

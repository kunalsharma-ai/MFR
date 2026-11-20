# Registration audit (20 Nov 2026): what the backend still needs

The frontend in `frontend-1/` was changed. The backend (`api/`) and the member portal (`web/`) were **not** touched.
This note lists the smallest backend changes the new frontend needs. Every change below keeps existing accounts working.

## 1. Last name optional (one line)

`api/app/model/User.js` → `name.last` has `required: [true, "Lastname is required"]`.
Remove `required` (keep `trim`). Until then, a sign-up with a blank last name gets "Lastname is required" from the server.

## 2. Middle name

There is nothing to do here. `name.middle` already exists in the model, and the form now sends it when it is filled in.

## 3. Teen Panel: pending registration and parent onboarding

The frontend posts to `POST /api/v1/user/teen` (override this with `VITE_TEEN_ENDPOINT`). The body uses the existing user model.

```jsonc
{
  "panel": "teen", "status": "parent_details_submitted", "category": "b2c",
  "name": { "first": "Aarav", "middle": "", "last": "" }, "gender": "Male", "dob": "2011-04-12",
  "mail": "teen@example.com", "timezone": "Asia/Kolkata", "address": [{ "tag": "home", "country": "in", "state": "Maharashtra" }],
  "parent": {
    "email": "parent@example.com", "name": { "first": "Meera", "middle": "", "last": "Sharma" },
    "relation": "mother | father | legal_guardian", "dob": "1984-09-05",
    "gender": "Female", "phone": "919876543210", "consent": null
  },
  "teenConsent": { "version": "teen-panel-v1", "at": "ISO date", "parentConsent": true, "participation": true,
                   "terms": true, "privacy": true, "accurate": true }
}
```

Round 12 (final): sign-up asks only for country (all 242, with flags) and state, no city and no teen phone. The order is
teen basics → parent details → consent → parent email (onboarding + consent) → set-password link → login →
**welcome questionnaire** → dashboard. The questionnaire is no longer part of sign-up: on the teen's first log in
the site shows "Tell us a little about you" and saves it with the existing session through

```text
PATCH /api/v1/me/answer
{ "teen_school": "Secondary / high school", "teen_interests": ["Gaming", "Music"],
  "teen_devices": ["Smartphone"], "teen_entertainment": ["Video platforms"] }
```

Backend need: accept these four `teen_*` keys on `/me/answer` (or map them to existing profile questions). "Skip for
now" saves nothing and the questionnaire opens again on the next log in. Done-state is kept per browser
(`localStorage`); a `teen_school` value on `/me` would let the site skip it on other devices too.

```text
Never email a password. The teen gets only the existing set-password link, after the parent has consented.
```

Smallest backend change, reusing the existing `parent` sub-document:

1. **Model.**
   - Add `legal_guardian` to the `parent.relation` enum.
   - Add `parent.dob`, `parent.phone`, `parent.gender` and `parent.consentAt` / `parent.consentVersion`.
   - Add a `registrationStatus` field (default `active`, so existing users are unaffected) with these values: `registration_started`, `parent_details_submitted`, `parent_verification_pending`, `onboarding_pending`, `consent_pending`, `consent_verified`, `activation_pending`, `active`.
2. **Route `PUT /api/v1/user/teen`** (or `POST`).
   - Check on the server that the DOB gives an age of 13–17.
   - Create the user with `registrationStatus: parent_verification_pending` and **no** password.
   - Create a one-time token with the existing `otpController.generate`, for the parent.
   - Send the "parent onboarding" email with the existing `getMailer` / `sendMail` (a new template). It links to the parent onboarding form.
   - Do **not** send the teen's password link yet.
3. **Route `POST /api/v1/user/teen/resend` `{ mail }`.** Re-send the parent email (rate-limited).
4. **Parent onboarding form and consent.** Once the parent has completed the form (16 questions plus consent):
   - set `parent.consent = true`, `parent.consentAt` and `registrationStatus = activation_pending`;
   - then send the teen the existing "register" email (set-password link).
5. **Login.** In `POST /api/v1/user/login`, refuse accounts whose `registrationStatus` is not `active` with the message "Your parent or guardian hasn't completed consent yet".

Until (2) exists, the teen's final step on the live site shows "This service is not available right now". The preview build simulates success.

## 4. CAPTCHA on the server

The built-in CAPTCHA is checked in the browser, and only when the button is pressed. For real server-side checks:

- set `VITE_TURNSTILE_SITE_KEY`, which switches every form to Cloudflare Turnstile;
- verify the `captchaToken` on `PUT /api/v1/user`, `/login` and `/teen` with Turnstile's `siteverify`;
- add rate limiting (for example, `express-rate-limit`) to those routes.

## 5. Terms and Privacy acceptance

The form now has two separate required checkboxes. The backend `terms: [String]` field is used by the portal for each category's terms after login. If you want the sign-up acceptance stored too, accept `acceptedTerms: { terms: version, privacy: version, at }` on `PUT /api/v1/user`.

## Feedback items that live outside frontend-1

| # | Issue | Where it lives |
|---|---|---|
| 1 | Professional sign-up: work-details dropdown empty | **Fixed in frontend-1** (`SetPassword.jsx`: the MUI 7 Autocomplete input ref was dropped) |
| 2 | A minor joins as a normal adult | **Fixed in frontend-1** (ages 13–17 are routed to the Teen Panel). The server-side age check still needs item 3 above. |
| 3–4 | Home & Pet profile: options missing | `web/` member portal profiles, or option data in the API |
| 5 | Reward points not updating | API (reward ledger) |
| 6 | Survey participation history empty | `web/` dashboard plus the API |
| 7 | Rewards history missing completed items | `web/` rewards page plus the API |
| 8 | Settings: old Terms section still showing | `web/src/app/(memberpages)/member/(member pages)/settings/page.jsx` |

# Member hub redesign (Nov 2026)

Frontend only. No database, schema, API, API contract, auth or stored-data change. The approved Profile Hero
animation (`profiles/ps/*`) and the Survey experience (`/member/surveys`, `/survey`) are untouched.

## What changed

### Member portal (`Project/web`)
- New shell for every member page (`member/hub/Shell.jsx`): logo, grouped nav (Earn / Progress / You),
  points (keeps `#rw-pts` for the coin animation), quality ring, notifications, language, theme
  (Light / Dark / Night), sound on/off, avatar menu. Drawer + bottom nav on phones.
- Themes and palettes on central tokens (`hub/hub.css`, `hub/prefs.js`): MFR Classic, Ocean, Purple, Emerald,
  Midnight, Sunset, Custom (colour picker). Saved on the device (`mfr.hub.prefs`). Dark/Night also switch the
  Profile studio's existing dark mode.
- All strings in `hub/strings.js` (`t(key)`), ready for translation; the existing DOM translator still runs.
- Three dashboards (`hub/dashboards.jsx`), picked by member category:
  - Consumer (b2c): rewards hub, payout ring, Activity → Progress → Points → Rewards → Recognition flow.
  - Professional (b2b): KPI strip, earning trend, participation breakdown, qualification status.
  - Teen (b2c-minor): levels from the real payout threshold, XP meter, "Parent approved", guardian consent card.
- Section pages: Rewards, Quality Score, Activity, Referrals, My Account, Settings (`hub/pages.jsx`, `hub/account.jsx`).
- Profile picture: preview, upload (existing `/api/v1/upload/image` + `PUT /me {profilePicture}`), replace, remove,
  loading / success / error.
- Every number comes from existing endpoints (`/me`, `/me/points`, `/me/statistics`, `/me/survey`, `/rewards`,
  `/profile`, `/me/invite`, `/user {referredBy}`). Achievements are derived from that data only.
- Empty, loading and error states everywhere; `prefers-reduced-motion` respected; no horizontal scroll at 390px.
- Teens whose parent/guardian consented (`parent.consent === true`) no longer get sent to the adult consent page
  (GAPS B1), in `Context/member.js`.
- Old dashboard and My Account kept as `legacy.jsx` (Surveys still imports `SurveyHistory`; Payment and Social
  contacts panels are reused as-is).

### Public site (`Project/frontend-1`)
- Welcome survey removed from the first login.
- Automatic login after the password is set (`components/AutoSignIn.jsx`): uses the same `POST /api/v1/user/login`
  as the login page, with the email remembered at sign-up (or asked once if the link is opened on another device).
  Teens: same, after the guardian has said YES and the teen sets a password, so guardian consent stays first.
- Consumer / Professional sign-up: Country → State/Province → City → ZIP (`components/SignupLocation.jsx`, same
  geo data as the Teen sign-up), sent in `address[0]` which the User model already stores.

## Needs a backend change (not built)
| Feature | Missing |
|---|---|
| Delete account | `POST /auth/delete` does not exist. The page now offers "Contact support" instead. |
| Social follow points | `/socials`, `/follow-social/verify` missing. Social +50 cards removed from Referrals. |
| Survey rating | `PUT /survey/response` missing. |
| Redeem / payout | No claim endpoint. Rewards shows progress to the threshold only. |
| Referral bonus | No referral reward exists. Page says so; nothing invented. |
| Quality score history | Not stored. Quality page shows an empty history state. |
| Quality score | Still computed in the browser (`creditQualityScore`); PR #16 caps the PUT. |
| Separate consent vs T&C | The approved legal text is one combined document per type. Splitting it needs legal wording. |

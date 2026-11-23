# Help centre: copy for Kunal to confirm

Every Help answer was written from how the member area works in the code. A few answers state a time or a policy.
Those were **not invented**: they are copied from the FAQ that is live today (`src/data/data.json`), and are marked
`review: true` in `content.js`. Please confirm or correct each one.

| FAQ id | What it says today | Source |
|---|---|---|
| `payout` | Reward options may include PayPal, gift cards, bank transfer and UPI, depending on country | live FAQ "How will I receive my rewards?" |
| `payout-time` | A payout can take 2–3 weeks | live FAQ "How long does reward processing take?" |
| `sp-time` | Allow 24–72 business hours for a reply | live FAQ "How do I contact customer support?" |
| `ma-close` | Close or delete = a request to support, confirmed with the member (the live FAQ also says 24–48 h confirmation, 30-day restore, then permanent delete; **left out** until you confirm) | My Account text + live FAQ |
| `ma-email` | The sign-in email can't be changed in the member area; support helps | live FAQ |
| `profile-edit` | Date of birth, age and gender may not be editable | live FAQ |
| `honest` | Inconsistent answers can lead to disqualification, review or suspension | live FAQ |

## Not answered (needs a decision, so no answer was written)

- Do screen-outs pay any points? (The Help says only that a screen-out ends the survey early and counts as a Quality factor.)
- What happens to a Teen account at 18?
- Can a guardian withdraw consent, and how? (The Help points the guardian to support.)
- Prize draw: no Help copy on purpose; the draw's rules link is set by the admin.

## Values the Help reads live (never typed into the copy)

- Payout milestone and conversion rate: from the points API (`usePoints`), hidden for Teens.
- Quality score: from the member record.
- Streak bonuses and daily poll points: from `GET /api/v1/engagement/config` (#18), shown only when that endpoint exists.
- Rewards catalogue entries (#20) appear when `GET /api/v1/engagement/rewards` answers; they say "opens soon" until its `open` flag is true.
- Daily poll, challenges and stories entries (#22) appear when `GET /api/v1/engagement/today` answers.
- Quality tier entries (#23) appear when `GET /api/v1/engagement/quality` answers; tier bands are never quoted (the page shows them).
- Referral entries (#23): live status when `GET /api/v1/engagement/referrals` answers; tier/bonus copy only when its `tiersOn` is true (never for Teens); leaderboard copy only when `leaderboard` is true. The copy states "only first surveys from 1 December 2026 count" (config `referrals`), so update it if that date changes.
- Teen entries (#25): levels/badges/seasons and the guardian activity link when `GET /api/v1/engagement/teen/progress` answers; creative tasks when `/teen/tasks` answers. Level names and season dates are not quoted (placeholders).
- Professional entries (#24): premium studies, expertise score, verified expert badge, statements/receipts and insight reports when `GET /api/v1/engagement/pro/expertise` answers. Score weights are not quoted.

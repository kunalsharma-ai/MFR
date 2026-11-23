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
- Teen rewards: what Teen points can be exchanged for (the engagement plan says every Teen redemption needs the guardian's YES; the Help will say so when that feature ships).

## Values the Help reads live (never typed into the copy)

- Payout milestone and conversion rate: from the points API (`usePoints`), hidden for Teens.
- Quality score: from the member record.
- Streak bonuses: from `GET /api/v1/engagement/config` (engagement phase 1), shown only when that endpoint exists.

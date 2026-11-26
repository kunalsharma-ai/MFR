# Security hardening (24 Nov 2026)

Kunal asked that no hacker or bot can break into the portal. This is what the panel backend (`api/`) now does, and
what has to be set when it is deployed. Tests: `tests/security.hardening.test.mjs` (16 tests; 14 failed before).

## Fixed

| Hole | Before | Now |
| --- | --- | --- |
| Question, category and option writes | anyone on the internet could create, change or delete them | admins only (`requireAdmin`); reading stays public |
| `/api/v1/project-dev` | the project router with no sign-in at all | admins only |
| `/api/v1/project`, `/api/v1/batch` | any signed-in member could create projects or schedule e-mails to any address from the brand's sender | admins only |
| Social sign-on | its signing key was written in the code, so anyone with the code could sign in as any member | key from `SOCIAL_JWT_SECRET`; off when unset; HS256 only, at most 15 minutes old |
| Emailed codes (set password, reset) | unlimited guesses; a bot changing its address could try all 900,000 codes and take over an account | 5 wrong guesses and the code is deleted; codes from `crypto.randomInt`; a member id must be an id, never a filter |
| Sign-in | per-address limit only | also 10 wrong passwords in 15 minutes lock that account for 15 minutes, whatever address is used; only text accepted |
| Forgot password | could flood someone's inbox | 10 a quarter hour per address, 3 e-mails an hour per mailbox |
| Change of e-mail | an expired code still changed the address; the code could be used again | expired codes refused, one use only, the new address must be free, a sign-in token is never a change link |
| Two brands at once | controllers are shared, so a request could pick up another brand's origin while it waited for the database | every member request runs in its own context (`utils/requestContext.js`) |
| Reads by id | `GET/PUT /user/:id` and other by-id lookups ignored the brand | by-id lookups inside a request are limited to the request's brand |
| Mongo operators from the browser | `$where`, `$expr`, `$function`, `$regex`, update operators and `__proto__` passed through | dropped from every body and query on `/api/v1` (`utils/security.js`); ordinary filters such as `$in` still work |
| Feasibility | public member count; filters could carry `$or` with any operator | member count admins only; question names and answers only |
| Tokens | algorithm not pinned; a bad token was echoed back in the error | HS256 only; nothing echoed |
| Headers | none | nosniff, frame DENY, HSTS, referrer and permissions policy, `no-store` and CSP `default-src 'none'` on API answers; `x-powered-by` off |
| Uploads | no size limit | 10 MB a file, 5 files |
| Signed admin API | a copied request could be sent again within 5 minutes | every request carries `x-madp-nonce` (in the signature) and is accepted once |

## To set at deploy

- `JWT_SECRET`: a long random value (the server logs a warning under 32 characters).
- `SOCIAL_JWT_SECRET`: only if social sign-on is used. The old key is public now (it was in the code), so the sign-on
  service must get a new one.
- `SIGNUP_FINGERPRINT_SECRET` (optional): the key for the one-way sign-up IP and device hashes used by the duplicate
  checks. Unset, a key derived from `JWT_SECRET` is used, so changing either later starts new hashes that won't match
  older sign-ups. Set it once, as a long random value, and keep it.
- The Sampledge push to `/project-dev` stops working without an admin token (Sampledge is not used any more).
- MADP must send `x-madp-nonce` (MADP's `PanelAdminClient` does from the matching MADP change).

## Still open

- A CAPTCHA (for example Cloudflare Turnstile) on sign-up, sign-in and forgot password would stop bots that solve the
  rate limits by going slowly. It needs a site key and a frontend change on all three portals.

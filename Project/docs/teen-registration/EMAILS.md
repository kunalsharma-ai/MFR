# Teen registration: emails

Templates: `mailer/teen/<name>.liquid`, sent by `api/app/teen/mail.js` through the existing email-template and
email services. Shared parts: `_head.liquid`, `_foot.liquid`, `_button.liquid`, `_yesno.liquid`. Guardian emails use
the calm navy look; teen emails use violet / pink. Every email has a preheader, one clear button, the registration
reference, support contacts, why the person got it, and links to the Privacy Policy, Teen research terms and Terms.

| Template | To | When | Button |
| --- | --- | --- | --- |
| `guardian-invite` | guardian | teen registers (and "resend") | **YES** / **NO** + review link |
| `teen-registered` | teen | teen registers | Track my registration |
| `guardian-approved` | guardian | guardian confirms YES | Continue where I left off |
| `guardian-declined` | guardian | guardian confirms NO | (none; how to undo) |
| `teen-declined` | teen | guardian says NO, or says they can't give permission | Back to the Teen Panel |
| `guardian-complete` | guardian | consent given | Read the Teen research terms (shows the consent record) |
| `teen-password` | teen | consent given | Create my password |
| `teen-active` | teen | password set | Log in |
| `teen-reminder` | teen | guardian hasn't answered (max 3) | Check my registration |
| `guardian-reminder` | guardian | a step is waiting (max 3, every 48 h) | YES / NO, or Continue |
| `link-renewed` | teen or guardian | a new link was requested | Create my password / Open the request |
| `link-expired` | teen | the registration expired | Get a new link |

Rendered previews of every template (and the variants) are in the PR description's delivery folder.

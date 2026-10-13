# MyFrequentRewards — Website

This is the public marketing website for **MyFrequentRewards**, the consumer and business opinion community of Frequent Research. Members earn rewards for sharing their opinions in paid online surveys.

- **Stack:** React 18 · React Router 7 · Vite 6. Plain CSS is used, with no UI or animation libraries.
- **SEO:** every route is **prerendered to static HTML** at build time, with per-page title, meta, canonical, Open Graph and JSON-LD. `sitemap.xml` and `robots.txt` are generated on each build.
- **Pages:** the site pages plus 32 blog posts, 51 prerendered routes in total (including /login, /signup and the 404 page).

---

## What's new in v1.7

- **Branded cursor, on every page** (`src/components/CustomCursor.jsx`, `src/styles/cursor.css`, mounted once in `Layout.jsx`):
  - An orange-to-pink gradient **dot sits exactly on the pointer**. It is moved directly in the `pointermove` handler, so it never lags.
  - A **spinning rainbow ring** follows on a fast spring. It catches up in about 8–9 frames, roughly 150 ms at 60 fps.
  - A short **comet trail** of five brand-colour sparks follows behind the ring.
  - **Over links, buttons, tabs, topic tiles and flags**, the ring grows into a soft glowing "magnet" and the dot shrinks.
  - **On click**, the ring squeezes and an orange ripple pops.
  - **In text fields**, the normal I-beam returns so typing is not affected.
  - When the pointer leaves the window, the cursor fades out.
  - **Visible on light and dark sections:** the dot has a white outline and a dark halo, and the ring has a white edge glow.
  - **Only for mouse or trackpad users.** Touch devices and `prefers-reduced-motion` users keep the system cursor, and the system cursor is hidden only after the component turns on (`html.has-cursor`).
  - **Performance:** one `requestAnimationFrame` loop that sleeps when the pointer stops, and only `transform` and `opacity` change. Measured frame time under 4× CPU throttle: 22.1 ms with the cursor and 21.9 ms without.

## What's new in v1.6

- **A brand-new animated hero scene on every inner page** (`src/components/HeroScenes.jsx`, `src/styles/scenes.css`). Each one is unique:
  - **About:** an origin stack — Frequent Research → MyFrequentRewards → You — linked by a travelling light beam, with floating proof chips.
  - **For Consumers:** a 3D phone whose survey-topic cards flip through, with reward coins popping out and a "Reward added" toast.
  - **For Professionals:** a tilted B2B study dashboard with growing bars, a drawing trend line, a "Credentials verified" stamp and orbiting role badges.
  - **Who Can Join:** a living globe circled by two orbits of member types.
  - **How It Works:** a coin travels a curved route and lights each of the five steps as it passes.
  - **Rewards:** a balance ring fills to "Ready", then the payout cards (UPI marked India) pop while coins drop.
  - **Trust & Safety:** a radar sweeps a scanning shield while integrity checks tick off one by one.
  - **FAQ:** a help-centre window where questions type themselves and get answered on a loop.
  - **Contact:** a pulsing headset hub with channels orbiting it, plus a live New Delhi (IST) clock.
  - **Blogs:** a tilted wall of real article covers drifting in three columns.
- **Living hero backgrounds:** soft colour fields drift behind every page hero.
- **Contact page redesigned:**
  - **Channel deck:** Live Help, WhatsApp, Email and Phone cards overlap the hero, each with a response-speed meter and an action button.
  - **Message studio:** clickable topic tiles fill in the form, a "You send → We review → We reply" flow shows what happens next, and an animated map card links to Google Maps.
  - **Form:** floating labels, a character meter, a CAPTCHA panel and a celebration on success.

## What's new in v1.5

- **Every page hero now opens with an animated motto, "Your Voice. Your Value. Your Rewards."** The words drop in, a spotlight travels from word to word, a coin flips and a light shine passes over (`src/components/Motto.jsx`). It appears on Home, How It Works, Blogs, Trust & Safety, Rewards, For Consumers, For Professionals, Who Can Join, About, FAQ and Contact.
- **Signal Globe:**
  - Glowing opinion signals arc from member countries to Frequent Research HQ in New Delhi.
  - Choosing a region spins the globe to face it, and hovering a flag pings that country.
  - Orbit rings with satellites, an atmosphere glow and an HQ beacon.
  - Countries now appear as a **flag deck** showing each country's own flag; the tiles flip in, and the flag flutters on hover.
- **Blog hub redesigned:**
  - A 3D carousel of article covers in the hero, plus guide, topic and average-read stats.
  - A scrolling "Trending" ticker, and an Editor's-pick feature with a slow zoom on the image.
  - A clickable **topic bar chart** that filters the posts.
  - Cards with a category colour strip, read time, image zoom and lift.
- **New illustrated covers for all 32 posts.**
  - Illustrated scenes are drawn per topic: phone, wallet (PayPal + "UPI · India"), shield, home desk, laptop, globe, clock, survey, coin growth and focus-group chat.
  - Each post gets its own variant and palette.
  - To regenerate them, run `node scripts/render-blog-covers.mjs` (needs Playwright + Chromium and Python Pillow).
- **The Team block has been removed** from every page.
- **Sign-up copy now says "Full date of birth (DD/MM/YYYY)".**

## What's new in v1.4.1

- **All menu tabs are always visible on screens 768px and wider.**
  - From 1301px the menu is one row.
  - From 768 to 1300px the header becomes two rows: the logo with Log in and Join free on top, and the full menu centred underneath, with a gliding light accent.
  - Below 768px (phones) the menu opens from the ☰ button, in the same order.
- **Pop sound** (`src/utils/sound.js`, synthesised with Web Audio, so there is no audio file):
  - A welcome pop plays once per visit, on the visitor's first tap, click or key press. Browsers block sound until the visitor interacts with the page.
  - A pop plays every time the chat opens, and a softer one for each reply.
  - A speaker button in the chat header mutes all of them, and the setting is remembered on that device.

## What's new in v1.4

- **Live Help chat redesigned:**
  - An animated gradient header with the brand monogram and a spinning ring, plus an "Online now" status.
  - A typewriter greeting and six colourful topic tiles.
  - A WhatsApp card and a gently scrolling row of popular questions.
  - Messages slide in with timestamps and 👍/👎 feedback, and the send button animates.
  - About 15 seconds into each visit, an "Ask us anything" teaser bubble and a red "1" badge invite visitors to ask.
  - The assistant no longer has a name.
- **Animated logos.**
  - **MyFrequentRewards (header and footer):**
    - The monogram rolls in and spins like a coin every few seconds, with an orbit ring and comet around it.
    - The star twinkles, and a light sweep crosses the wordmark.
    - It is built from the original artwork (`src/components/BrandLogo.jsx`).
  - **Frequent Research (About, Quality and the privacy vault):** a gentle 3D sway, a light sweep and glowing network nodes (`src/components/FrLogo.jsx`).
- **Main menu:**
  - Order is now Home · About Us · Earn ▾ · How It Works · Rewards · Trust & Safety · Blogs (Trending) · FAQ · Contact · Log in · Join free.
  - Items drop in on load, a gradient pill glides under whichever item you hover, and the Trending badge pulses.
  - Log in has an icon, and Join free has a hopping gift and an arrow nudge.
  - The mobile menu appears below 1300px.
- **Country-aware payouts:**
  - Reward notifications only ever show UPI for members in India. Members elsewhere see PayPal, Wire Transfer or Amazon Gift Card. Feed items that break this rule (UPI or a ₹ amount outside India) are never shown (`src/utils/payouts.js`).
  - The notifications now show a country flag and a payout-method chip.
  - Site copy, the FAQ and the chat answers say "UPI in India only".

## What's new in v1.3

- **32 long-form guides.** 12 new posts (`src/data/blogs/part4a–d.js`) of 1,600–1,850 words each, all passing `node scripts/check-blog-file.mjs <file>`. Each has 7–8 FAQs, 6–10 internal links, 1–3 external links and the new keyword clusters. They target honest takes on "quick / instant money" searches, survey sites, cash surveys, money-earning apps, online jobs without investment, side hustles, focus groups and the step-by-step survey journey.
- **Live reviews → testimonials.**
  - A review sent from "Rate your experience" (rating, text, first name, country, optional company) is saved by `POST /api/reviews`.
  - It is published automatically after spam checks (or held for moderation if it looks suspicious).
  - It appears in the home-page testimonials radio for every visitor within about 30 seconds, with name, flag, company and stars. The reviewer sees it instantly.
  - A reference zero-dependency Node server is included: `npm run serve` (see `server/README.md`).
- **Login redesigned ("Member Pass").**
  - Email + password + CAPTCHA, with show/hide password, "keep me logged in" and "forgot password".
  - Attempts are limited on the device (the server must enforce this too).
  - A 3D member card reacts as the visitor types and flips to "Welcome back" on success.
- **Sign-up now asks for the full date of birth.** A typed DD/MM/YYYY field plus a Year → Month → Day calendar. It rejects impossible dates (31/02), future dates and anyone under `VITE_MIN_SIGNUP_AGE`, and shows the visitor's age once a valid date is entered. The CAPTCHA was already part of sign-up.

## What's new in v1.2

- **Faster site.**
  - Every page is now its own small download, and a page's code is fetched as soon as a visitor hovers over or touches a link, so clicks feel instant.
  - Blog article text downloads only when a post is opened. The home page now loads about 290 KB of JavaScript instead of about 640 KB.
  - Animations in sections far off-screen pause automatically.
  - Effects that forced the browser to repaint every frame were replaced with GPU-friendly versions:
    - the header blur;
    - the large blurred colour blobs;
    - the animated gradient borders;
    - the 3D-tilting hero scene;
    - some width and position animations.
  - The globe draws at a capped frame rate with batched dots.
- **Reliable reveal animations.** A scroll fallback guarantees that no section can stay invisible after a fast scroll on a busy phone.
- **Home page:**
  - **Community ledger:** rolling odometers for rewards paid, surveys completed this month, surveys available monthly and members registered.
  - **Survey board:** a split-flap board with the six survey categories and their typical reward and time.
  - **Member voices:** a "world radio" tuner with 14 testimonials, each with its country flag, an FM dial, an animated waveform, and play/pause and keyboard controls.
- **"Rate your experience"** is now a tab on the **right** edge, with a gentle animation and an occasional "How are we doing?" bubble.
  - The popup still never opens on entry.
  - It opens at most twice per visit, at least 4 minutes apart; at most once a day after that; and at most 6 times in total.
  - It only opens at a quiet moment.

Edit the figures, categories and testimonials in `src/data/community.js`. Optionally serve the figures live with `VITE_STATS_URL`.

## What's new in v1.1

- **Fonts:** switched to Manrope (headings and numbers) and Inter (body, buttons, navigation).
- **Navigation:** Home tab added.
- **404 fix:**
  - Each route is prerendered.
  - The client re-renders the correct page when a host serves a fallback file.
  - Hash routing is used automatically on `file://`.
  - In-page `#anchors` scroll instead of routing.
  - Hosting configs are included: `public/.htaccess` (Apache/cPanel), `public/web.config` (IIS), `public/_redirects` (Netlify/Cloudflare) and `vercel.json`.
- **Sign-up:** a 4-step animated wizard.
  - Searchable country picker for all 242 countries and territories, with flags and dial codes.
  - Per-country phone-length rules.
  - Guardian email for under-18 sign-ups (only when `VITE_MIN_SIGNUP_AGE` < 18).
  - Password strength ring and CAPTCHA.
  - Every field validated before each step.
- **Rates & reviews:** a new "Reward Ticket" pop-up.
  - Never shown on entry; it appears only after engagement (≥45 s and ≥35% scroll, or exit-intent).
  - A left-edge "Rate your experience" seal opens it on demand.
- **Policies & FAQ:** rebuilt from the official policy text, with a cookie categories accordion and a quality-score gauge.
- **Blogs:** all 20 expanded to 1,500–1,650 words of article text each.
  - 8 FAQs per post, with extra Q&As moved into the article body.
  - Structured as H2 chapters with H3 topics.
  - Internal and external links throughout.
  - Supplied keywords woven in naturally.
- **Keywords:** a new home section, "People search. We answer.", plus enriched secondary keywords on every page.

## 1. Prerequisites

- Node.js **18.18+** (tested with Node 22) and npm 10+
- Optional: Python 3 with Pillow, only needed to regenerate blog cover art (`npm run covers`)

## 2. Install, develop, build, preview

```bash
npm install            # install exact versions from package-lock.json
cp .env.example .env.local   # fill in values (see §4)
npm run dev            # http://localhost:5173 (hot reload, client rendering)
npm run build          # client build + SSR build + prerender → dist/
npm run seo:check      # audits every page in dist/ (title/description length, H1, canonical, JSON-LD, alt, links, words)
npm run preview        # serves dist/ like production at http://localhost:4173
npm run build:preview  # single-file HTML preview → dist-preview/myfrequentrewards-preview.html
npm run qr             # regenerate social QR codes after changing a social URL
npm run covers         # regenerate abstract blog cover art (Python + Pillow)
```

`dist/` is generated output. **Never edit it by hand.** Change `src/` or `public/`, then rebuild.

## 3. Project structure

```
index.html                 HTML template (<!--app-head--> / <!--app-html--> are filled by prerender)
vite.config.js
scripts/
  prerender.mjs            SSG: renders every route → dist/**/index.html, writes sitemap.xml + robots.txt
  seo-check.mjs            post-build SEO audit
  serve.mjs                production-like static server for local preview (dir index + 404)
  build-preview.mjs        single-file HTML preview (hash routing, inlined assets, labelled preview data)
  generate-qr.mjs          social QR codes → public/images/qr/*.svg
  generate-blog-covers.py  blog cover art → public/images/blog/*.webp
public/
  images/brand|blog|qr     WebP logos, covers, QR codes
  data/reviews.json        APPROVED genuine reviews only
  favicon*, icon-*.png, apple-touch-icon.png, site.webmanifest, robots.txt, sitemap.xml
src/
  main.jsx                 client entry (hydrates prerendered HTML)
  entry-server.jsx         SSR entry used by prerender
  App.jsx / routes.js      routes (add a page in BOTH files)
  seo/Seo.jsx, schema.js   head manager + JSON-LD builders
  data/                    ALL editable content: site.js (contacts, socials, payouts), pages.js (SEO + FAQs),
                           profiles.js (countries/demographics/job titles/industries/departments), quality.js,
                           legal.js (policy pages), blogs/part1-3.js (20 posts), countries.js
  components/              Header, Footer, LiveChat, ReviewPopup, ActivityToasts, Captcha, PageHero, Common…
  sections/                distinct home/inner-page sections (HeroOrbit, GlobeReach, QualityRadar, PayoutFan…)
  pages/                   one file per page
  styles/                  global.css (tokens, chrome, forms), sections.css, pages.css
```

### Editing content

| To change… | Edit |
|---|---|
| Phone, WhatsApp, email, address, socials, payout methods | `src/data/site.js` (then run `npm run qr` if a social URL changed) |
| Page titles, meta descriptions, H1, keywords, FAQs | `src/data/pages.js` |
| Countries, job titles, industries, departments, interests | `src/data/profiles.js` (+ `geo.js` for globe points, `countries.js` for sign-up) |
| Blog posts | Base article in `src/data/blogs/part*.js`; long-form expansions in `extra-*.js` (merged in `index.js` into H2 chapters). The route, sitemap entry, read time and cover path are created automatically. Run `npm run covers` for new art |
| Legal policies | `src/data/legal.js` (update `LEGAL_UPDATED`) |
| Home community figures, survey categories, testimonials | `src/data/community.js` — keep them true and current; update `asOf` (or set `VITE_STATS_URL`). Testimonials also feed `public/data/reviews.json` for the review popup |
| Add a page | `src/router/pages.js` (route → page file) **and** `src/routes.js` (sitemap/prerender list) |
| Colours and fonts | CSS variables at the top of `src/styles/global.css` |

## 4. Environment variables (`.env.example`)

| Variable | Purpose | Required |
|---|---|---|
| `VITE_SITE_URL` | Canonical origin for canonicals, sitemap and OG | Yes |
| `VITE_API_BASE_URL` | Base URL of your backend API (blank = same origin) | Optional |
| `VITE_REGISTER_ENDPOINT` / `VITE_CONTACT_ENDPOINT` / `VITE_REVIEW_ENDPOINT` | Form POST endpoints | Yes (backend) |
| `VITE_MEMBER_PORTAL_URL` | Existing member login/dashboard URL | **Yes** |
| `VITE_ACTIVITY_FEED_URL` | Real, consented reward-activity JSON feed (toasts + "Rewards in motion") | Optional (hidden if empty) |
| `VITE_REVIEWS_FEED_URL` | Live published-reviews feed (default `/api/reviews`, falls back to `/data/reviews.json`) | Optional |
| `VITE_LOGIN_ENDPOINT` | JSON login endpoint (default `/api/login`) | Yes, or the next one |
| `VITE_LOGIN_FORM_ACTION` | Member-portal login URL for a classic form POST (overrides the JSON endpoint) | Alternative |
| `VITE_PASSWORD_RESET_URL` | "Forgot password?" link (default: contact page) | Recommended |
| `VITE_STATS_URL` | Live JSON for the home community ledger (falls back to `src/data/community.js`) | Optional |
| `VITE_TAWK_PROPERTY_ID` / `VITE_TAWK_WIDGET_ID` | Live-agent hand-off inside Live Help | Optional |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile CAPTCHA (secret key stays on the server) | Recommended |
| `VITE_MIN_SIGNUP_AGE` | Minimum age for the birth-year check (default 18) | Yes |
| `VITE_DEMO_MODE` | **Preview only.** Must be `false` in production | — |
| `VITE_ROUTER` | `browser` (production) or `hash` (preview file only) | — |

Everything prefixed with `VITE_` is **public** once built. Never put secrets in these variables.

## 5. Forms / API contract (reviews API included in `server/`; login, register and contact still need your backend)

The frontend POSTs JSON. The backend **must** repeat every validation and verify the CAPTCHA server-side.

- `POST /api/register` → `{ memberType, firstName, lastName, email, country, phone, dateOfBirth ("YYYY-MM-DD"), jobTitle?, industry?, companyEmail?, password, notify{dashboard,sms,whatsapp,email}, consents{terms,marketing}, captchaToken?, timezone, language }`. Respond `200 { ok:true }`, or `4xx { message, errors:{field:msg} }`. Hash the password; send double opt-in email and SMS/OTP.
- `POST /api/contact` → `{ name, email, topic, message, captchaToken? }`
- `POST /api/login` (or `VITE_LOGIN_ENDPOINT`) → `{ email, password, remember, captchaToken? }` → `200 { redirect? }` or `401 { message }`. Alternatively set `VITE_LOGIN_FORM_ACTION` to the member portal's login URL for a classic form POST. Verify the CAPTCHA, rate-limit attempts and never reveal whether an email exists.
- `POST /api/reviews` → `{ rating 1–5, text, firstName, country (ISO), countryName, company?, email, highlights[], page, consentPublish:true }` → `201 { id, status: "published" | "pending" }`. **Implemented in `server/index.mjs`.**
- `GET /api/reviews` → `[{ id, name, iso, country, company, rating, text, createdAt }]`, newest first, published only (never emails). **Implemented.**
- **Activity feed** (`GET VITE_ACTIVITY_FEED_URL`) — `method` must be one of `UPI` (India only), `PayPal`, `Wire Transfer`, `Amazon Gift Card`; items with UPI or ₹ outside India are dropped automatically: `[{ name:"Priya K.", place:"Pune, India", role:"HR Manager", segment:"business"|"consumer", amount:"₹450", method:"UPI", ago:"4 min ago" }]`. Only include real redemptions from members who consented to display. Use first name and last initial only.
- **Reviews feed fallback:** if `/api/reviews` isn't reachable (static hosting), the site falls back to `public/data/reviews.json` (the supplied testimonials).

## 6. Deployment

1. Set the production `.env` values (or the CI environment) and run `npm ci && npm run build`.
2. Upload the **contents of `dist/`** to the web root.
3. Configure the server so that `/path` serves `/path/index.html`, unknown URLs return `404.html` with a real **404 status**, and HTTPS is enforced.

**Apache (`.htaccess` in web root):**
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
RewriteCond %{HTTP_HOST} ^myfrequentrewards\.com$ [NC]
RewriteRule ^ https://www.myfrequentrewards.com%{REQUEST_URI} [L,R=301]
DirectorySlash Off
RewriteCond %{REQUEST_FILENAME}/index.html -f
RewriteRule ^(.*?)/?$ $1/index.html [L]
ErrorDocument 404 /404.html
<IfModule mod_headers.c>
  <FilesMatch "\.(js|css|webp|png|svg|ico)$">Header set Cache-Control "public, max-age=31536000, immutable"</FilesMatch>
  <FilesMatch "\.html$">Header set Cache-Control "no-cache"</FilesMatch>
</IfModule>
```

**Nginx:**
```nginx
location / { try_files $uri $uri/index.html =404; }
error_page 404 /404.html;
location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
```

**Shipped configs:** `public/.htaccess`, `public/web.config` and `public/_redirects` are copied into `dist/` automatically, and `vercel.json` sits at the project root. Upload `dist/` *including hidden files* (`.htaccess`).

**Netlify / Vercel / Cloudflare Pages:** set the build command to `npm run build` and the output directory to `dist`. These platforms serve `index.html` files in subfolders and `404.html` automatically.

**Domain / DNS / HTTPS:** point `www` (CNAME) and the apex (A/ALIAS) to the host, issue a TLS certificate (for example Let's Encrypt), and 301-redirect the apex to `www` (or the reverse; keep it consistent with `VITE_SITE_URL`).

**Rollback:** keep the previous `dist/` (or the previous Git tag). To roll back, re-upload it or redeploy the earlier commit with `npm ci && npm run build`.

## 7. Redirects from the current site

The legal URLs are unchanged (`/privacy`, `/gdpr`, `/cookies`, `/terms`, `/profiling`). If the old site had other indexed URLs (for example a panel book PDF or anchor-only sections), map them with 301s, for example `/panelbook` → `/who-can-join`. Check Google Search Console → Pages for the full list before launch.

## 8. Sitemap & robots

Both files are generated by `npm run build`, so don't edit them manually. Submit `https://www.myfrequentrewards.com/sitemap.xml` in Google Search Console. `/login` is `noindex` and disallowed.

## 9. Analytics & consent

Paste the approved GTM, GA4 or Meta Pixel snippet **once**, at the marker in `index.html`. Fire optional tags only after consent:
```js
window.addEventListener('mfr:consent', (e) => { if (e.detail.analytics) { /* load GA4 / Pixel */ } });
// returning visitors: JSON.parse(localStorage.getItem('mfr_cookie_choice'))?.analytics
```
Never send email addresses, phone numbers, passwords or answers to analytics. Suggested events: `sign_up_start`, `sign_up_complete` (after backend success), `cta_click`, `live_help_open`, `whatsapp_click`, `review_submit`.

## 10. Troubleshooting

- **`src/data/blogs/meta.js` is generated** by `scripts/blog-meta.mjs` before every `dev`, `build` and `build:preview`. Don't edit it by hand — edit the posts.
- **Performance check:** run `npm run build && npm run preview`, then Lighthouse (mobile) in Chrome DevTools. Keep new animations on `transform`/`opacity` only; avoid `filter: blur()` and `backdrop-filter` on moving elements.


| Symptom | Fix |
|---|---|
| Page refresh on `/how-it-works` shows the homepage or the 404 page | The server is not serving `how-it-works/index.html`. Check that `.htaccess` (or the equivalent config) was uploaded; see §6. The client also self-corrects by rendering the right page |
| Country flags show letters instead of flags | flagcdn.com is blocked by a firewall or CSP. Allow `https://flagcdn.com`, or self-host the flags |
| Forms show "Something went wrong" | Backend endpoint is missing or CORS is not configured. Check `VITE_API_BASE_URL` |
| Activity toasts never appear | `VITE_ACTIVITY_FEED_URL` is empty or returns invalid JSON (this is by design) |
| Fonts look different | Google Fonts are blocked. Self-host the fonts if required |
| `npm run seo:check` fails | A title or description length is outside 50–60 / 140–160, or a page has more than one H1. Edit `src/data/pages.js` or the blog data |

## 11. Legal review (before go-live)

The policy text in `src/data/legal.js` was rewritten for clarity from the current site. The legal owner must approve it, along with:
- the "we never share your personal details" statement;
- the minimum age;
- the claim threshold and payout rules;
- the cookie list.

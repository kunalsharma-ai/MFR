# account-actions (page: Delete or Deactivate My Account)

The full page of the account-actions package (mfr-account-actions v2) without its header, built for the member site.
It is served as a static page from `web/public/member/account-actions/` and shown inside My Account (an iframe of the same origin).

Why `/member/...`: the gateway sends only /member, /admin, /auth, /survey and /_next to the `web` app; any other path reaches the public site.

## Rebuild after a change in `src/`
```bash
cd account-actions-src
npm install
node scripts/build-host.mjs ../web/public/member/account-actions
```

## Where things are
- `src/main.host.jsx`        entry: reads ?id= &theme= &points= &usd= &sound=, loads the member (GET /api/v1/me), mounts the page without the header
- `src/services/mfrApi.js`   the ONE request: POST /api/v1/auth/delete  { id, action, password }
- `src/config/actions.js`    actions and their texts; `code` = what is sent as `action` (30 / 60 / 90 / -1 hold / "Delete")
- `src/AccountActionsPage.jsx`  the page (new props `showHeader`, `soundDefault`)

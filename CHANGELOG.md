# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Security

Full test-plan writeup in `docs/SECURITY.md`. Highlights:

- Fixed `app.set('trust-proxy', 1)` → `'trust proxy'` (hyphen vs. space) -
  the typo silently disabled trust-proxy entirely, meaning every client
  behind nginx shared one rate-limit bucket (nginx's own container IP).
- Added `User.role` and wired `authorize('admin')` onto every
  `/api/admin/*` route - they were commented "Admin only" but only
  required `authenticate`, and there was no `role` field to check in the
  first place. Any logged-in user could view/delete API logs.
- Pinned `algorithms: ['HS256']` on every `jwt.verify` call.
- Replaced OAuth-created accounts' `Math.random()` placeholder password
  with `crypto.randomBytes(32)`.
- Added `sameSite: "lax"` to the session cookie.
- Fixed a crash in the global error handler's own
  `SequelizeUniqueConstraintError` branch (undefined variable reference).
- `nodemailer` `7.0.13` → `^9.0.5` (high-severity SMTP injection advisory,
  directly relevant - it handles user-supplied email addresses).
- Added CSP/HSTS/Permissions-Policy to the nginx-served SPA (previously
  only the API had these, via Helmet).
- Pinned every GitHub Action in both workflows to a verified commit SHA.
- Added `infra/scripts/backup-db.sh` - no backup mechanism existed before.

### Fixed (found via the new E2E suite)

- **`GET /api/preferences/{sources,categories}` returned raw Sequelize
  model instances instead of name strings** - the Preferences page
  crashed for every single user (React error #31). Broken in production
  the entire time; three sessions of manual testing hadn't happened to
  exercise it as a freshly-registered real user. Found by the first real
  run of the new committed Playwright suite, fixed at the controller level.

### Added

- `docs/SECURITY.md` rewritten as a real, live-tested security test plan.
- Committed Playwright E2E suite (`client/e2e/`), wired into CI.
- Full refresh-token rotate/revoke/`jti`-collision regression tests.
- PropTypes on every component that takes props; `react/prop-types`
  re-enabled in ESLint.
- `scripts/make-admin.js`, `infra/scripts/backup-db.sh`.

### Changed

- `react-router-dom` v6 → v7 (verified no breaking API usage in this app).
- Server test suite now runs `--runInBand` - required, not optional:
  `server.js` binds a real port as a side effect of being `require()`d,
  and Jest's default parallel workers raced for it.

### Fixed (found via live Docker-stack verification)

- **The article-saving pipeline never actually worked** - `Article` and
  `ApiLog` were `undefined` everywhere due to a default-export/named-import
  mismatch (see below), so every real aggregation run threw. Verified live:
  triggered a real fetch, confirmed real GNews articles were fetched,
  sanitized, saved to MySQL, and rendered correctly in the browser.
- **GNews was reading the wrong environment variable** under three
  different spellings across three files; the token sent to GNews was
  always empty. Standardized on `GNEWSAPI_KEY`; removed the dead legacy
  `NEWSAPI_KEY`/`news.service.js` NewsAPI.org integration it was shadowing.
- **Change password was broken end-to-end, frontend and backend both** -
  the validator requires `confirmPassword`, which nothing ever sent.
  Verified live through the actual UI after the fix.
- **Rapid consecutive logins could crash** - refresh tokens had no unique
  claim beyond a second-precision timestamp, so two logins in the same
  second produced identical tokens and collided on a unique DB constraint.
  Fixed by adding a random `jti` to every issued token.
- `server.js` binds a real port as a side effect of being `require()`d;
  Jest's parallel workers raced for it. Test suite now runs `--runInBand`.
- MySQL's `TRUNCATE` doesn't cascade through foreign keys - test cleanup
  disables `FOREIGN_KEY_CHECKS` for the duration, the standard approach.
- `login`'s passport callback used a bare `throw` instead of `next(error)`,
  escaping Express's error handling from inside passport's own async flow.
- Several test files (`services.test.js`, `test-setup.js`, `auth.test.js`,
  `articles.test.js`, `admin.test.js`) were stale in various ways: wrong
  import paths, non-existent Jest APIs, wrong model field names, response
  shapes that never matched the real API, and a hardcoded test email that
  collided with another file's seed data. All rewritten to match reality.
- `sanitize-html`'s transitive `htmlparser2` dependency went ESM-only as of
  v10, breaking every Jest test. Pinned to `2.17.1` (exact).
- Aggregation cached empty/failed results for the full 15-minute TTL,
  blocking legitimate retries.
- `nginx.conf`'s bare `/api` (a real endpoint) 301-redirected instead of
  proxying directly.

**Server test suite: 44/44 passing (6/6 suites)** as of this pass - the
remaining 2 (in `services.test.js`) fail only because the Guardian/NYT API
keys in this environment are invalid third-party credentials, confirmed by
calling both APIs directly.

### Fixed (previous session)

- **Article aggregation never actually saved anything.** `aggregator.service.js`
  destructured `{ Article }` from a model file that only default-exports -
  `Article` was `undefined` everywhere it was used, so `saveArticlesToDatabase()`
  threw on every run. Same bug pattern hit `ApiLog` in `gnews.service.js`,
  `guardian.service.js`, and the cron job, masking real API errors behind
  `Cannot read properties of undefined`.
- **GNews integration was reading the wrong environment variable**
  (`GNEWS_API_KEY`, which doesn't exist) **instead of `GNEWSAPI_KEY`**
  (which does) - the token sent to GNews was always empty. A third, unrelated
  spelling (`GNEWSAPIKEY`) was used in the startup status banner. Standardized
  on `GNEWSAPI_KEY` everywhere; removed the dead legacy `NEWSAPI_KEY`/
  `news.service.js` NewsAPI.org integration it was shadowing (never wired
  into the aggregator).
- **The entire frontend/backend response contract was mismatched** - the
  backend wraps responses as `{ success, message, data, pagination }`; the
  frontend read flat fields that never existed (`response.data.articles`,
  `.article`, `.user`, `.token`, `.sources`, ...). In practice this meant
  login/register never stored a token, articles never rendered, search
  always failed, and preference dropdowns were always empty - regardless of
  whether the underlying API call succeeded. Fixed by normalizing the
  envelope in the frontend service layer.
- Search sent `keyword` as the query param; the backend reads `q`.
- `resetPassword` verified the reset token and issued new JWTs but never
  updated the password - the "forgot password" flow was a no-op.
- The Google OAuth callback route passed its controller as
  `passport.authenticate()`'s third argument (a verify-callback signature)
  instead of as a separate route middleware - it received the wrong
  arguments and could never have worked.
- `optionalAuth` middleware built a passport middleware but never invoked
  it - any route using it would hang. (Not live yet, so latent rather than
  observed - now fixed and wired to the public article endpoints.)
- `authorize()`'s role check was missing a `return` after sending a 403,
  falling through to `next()` and risking `ERR_HTTP_HEADERS_SENT`.
- `logout` and the refresh-token endpoint crashed with a 500 when called
  without a JSON request body (`req.body` is `undefined`, not `{}`, when no
  `Content-Type: application/json` is sent).
- `facebookCallback` was imported by the auth routes but never defined -
  hitting that callback would have failed outright.
- The password-reset email linked to a malformed URL
  (`/reset-password=<token>`, missing `?`) that couldn't be parsed as a
  route + query string.
- `/api/auth/forget-password` vs `/auth/forgot-password` - route, frontend
  call, and docs each disagreed. Standardized on `/forgot-password`.
- Rate limiter computed `windowMs` as ~16 seconds instead of 15 minutes
  (`15 + 60 * 1000` instead of `15 * 60 * 1000`).
- `tests/test-setup.js` could have dropped the dev database - it force-syncs
  the DB Sequelize is connected to, and `NODE_ENV` didn't change which
  database that was. Test runs now target a separate `${DB_NAME}_test` DB.
- `tests/test-setup.js`'s seed data used `firstName`/`lastName`/`role`
  fields that don't exist on the `User` model, and imported `bcryptjs`
  (never a dependency) instead of `bcrypt` (already used everywhere else).
- `tests/services.test.js` imported services by file names that no longer
  existed (renamed at some point without updating the test), and used
  `test.skipIf`, which isn't a Jest API.
- `sanitize-html`'s transitive `htmlparser2` dependency shipped ESM-only as
  of v10+, breaking every Jest test that imported `server.js` (which
  transitively requires it). Pinned to `2.17.1`, the last patch on the
  CommonJS-compatible `htmlparser2` v8.
- Aggregation results were cached for the full 15-minute TTL even when
  every source failed (an empty result), blocking legitimate retries.
- `nginx.conf`'s `/api` (no trailing slash) - a real, documented endpoint -
  301-redirected to `/api/` instead of proxying directly.

### Added

- Refresh-token revocation: hashed storage, rotation on refresh, revoked on
  logout/password-change/reset.
- `is_saved` on public article endpoints (via a new `optionalAuth`-gated
  bulk lookup, not per-article).
- `docker-compose.yml` stack (`infra/`) - mysql + server + client, named
  `newhub`.
- CI (`.github/workflows/ci.yml`) and CD (`cd.yml`) GitHub Actions workflows.
- Frontend test suite (Vitest + React Testing Library) - previously zero
  frontend tests.
- `docs/ARCHITECTURE.md` and `docs/SECURITY.md` (previously empty);
  `docs/API.md` consolidated from a duplicate with incorrect examples.
- Complete Tailwind-based frontend redesign with light/dark mode.

See `docs/TODO.md` for what's still open.

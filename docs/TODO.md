# TODO — Path to a 10/10

Status as of this pass: every item from "What's actually left" that was
*actually buildable* (not gated on an external account or a hosting
decision only you can make) is now done - structured security-event
logging, reset-token single-use tracking, and concurrent-session limits
(§0 below), plus both remaining `npm audit` findings (`sequelize`/`uuid`,
`passport`/`passport-oauth`), a real display bug in `ArticleDetail.jsx`,
and a documentation reconciliation pass across every README/`docs/` file.
**TypeScript migration is explicitly still not done** - out of scope for
this pass by request, unchanged from before.

Before this pass: the security test plan (`docs/SECURITY.md`) was done -
every item verified live, most fixed, a handful deliberately left as
reviewed/accepted tradeoffs rather than guessed at. The `react-router-dom`
v7 upgrade, PropTypes, and a real committed E2E suite (which itself found
and fixed a bug nothing else had) were all done too. **Server suite: 51/51
passing** (6/6 suites, `services.test.js` excluded for the reason below).
**E2E suite: 7/7 passing**, wired into CI.

**Caveat on this pass**: the local MySQL instance wasn't reachable with
this environment's `.env` credentials, so the new server-side work (§0)
was code-reviewed and covered with new Jest regression tests, but **not
run against a live database this session** - unlike the standard this repo
otherwise holds itself to (see `docs/SECURITY.md`'s intro). Run
`npm test` in `server/` once DB access is restored to confirm.

What's left is either genuinely external (an account/hosting decision only
you can make) or a deliberately-scoped-out larger effort, called out
explicitly rather than left silently undone.

## 0. This session

- **Fixed a real display bug**: `ArticleDetail.jsx` rendered `article.content`
  verbatim, including the raw `"...[+1234 chars]"` truncation marker that
  GNews (and NewsAPI-shaped feeds generally) append when the free tier
  doesn't return the full article body - it read as broken/cut-off text,
  not an intentional preview. Added `cleanArticleContent` (`utils/helpers.js`)
  to strip the marker and flag truncation, and the page now shows an
  explicit "this is a preview, read the rest at the source" notice instead
  of silently truncating mid-sentence.
- **Structured security-event logging** - `logger.logSecurityEvent(event,
  meta)` (`logger.utils.js`), wired into every auth failure branch that has
  an email or user id worth recording: failed login, refresh-token
  reuse/invalidity, reset-token reuse. Closes the gap `docs/SECURITY.md` §7
  flagged (could previously only see "a login failed from IP X," not
  "against which account").
- **Reset-token single-use tracking** - new `password_reset_tokens` table
  (mirrors `refresh_tokens`' hash-lookup pattern exactly), `persistResetToken`
  / `consumeResetToken` / `invalidateResetTokens` in `auth.middleware.js`. A
  reset link can now only be redeemed once, even within its still-valid 1h
  JWT window. Closes `docs/SECURITY.md` §2's other open item.
- **Concurrent-session limits** - `MAX_ACTIVE_SESSIONS` (default `5`,
  `.env`-configurable), enforced in `persistRefreshToken` via
  `enforceSessionLimit` - oldest session(s) revoked once a user is at the
  cap. Closes `docs/SECURITY.md` §2's remaining open item.
- **`npm audit`: 0 vulnerabilities, server and client both** (was 6 + 1).
  `sanitize-html` bumped to the patched `^2.17.7` - previously pinned to
  the vulnerable exact version because the fix's `htmlparser2` dependency
  went ESM-only and broke every Jest test; fixed properly via
  `server/__mocks__/sanitize-html.js` (a manual Jest mock) instead of
  staying pinned. `uuid` (via `sequelize`) and `passport` (via
  `passport-oauth`) both forced to patched versions via `package.json`
  `overrides` - see `docs/SECURITY.md` §8 for the full reasoning on why
  each override is safe.
- **Documentation reconciliation pass** - see §6 below.

**Priority legend** — `P0` correctness/security risk · `P1` should happen
before calling the category "done" · `P2` polish, no urgency.

---

## 1. Bugs found in a previous session (on top of the one before that)

Live security testing and a real, committed E2E suite (not manual spot
checks) surfaced bugs neither static review nor ad hoc browser testing had:

- **`app.set('trust-proxy', 1)` used a hyphen; Express's real setting key
  is `"trust proxy"` (a space).** The hyphenated form silently created an
  unused custom setting - `app.get('trust proxy')` returned `false` despite
  the line's clear intent. Verified live: every client behind nginx was
  bucketed under nginx's own container IP for rate-limiting purposes, so
  the 100-req/15-min limit was effectively shared across *all* users
  combined. Fixed.
- **`/api/admin/*` had no admin check at all** - routes were commented
  "Admin only" but only required `authenticate` (any logged-in user), and
  `User` had no `role` field whatsoever, so `authorize('admin')` could
  never have passed for anyone even if it had been wired up. Any
  registered user could view every API log and trigger log deletion.
  Added `User.role`, wired `authorize('admin')` onto every admin route,
  added `scripts/make-admin.js` as the (deliberately not an API endpoint)
  way to promote someone. Verified live: 403 → promote → 200 on the same
  already-issued token.
- **The global error handler crashed on its own error-handling path** -
  the `SequelizeUniqueConstraintError` branch referenced an undefined
  variable (`field`, when only `errors` had been assigned), so any raw
  unique-constraint violation that reached it threw a `ReferenceError`
  instead of returning a clean 409. Reproduced directly, fixed.
- **The E2E suite's first real run found a severe, previously-undetected
  bug**: `GET /api/preferences/sources` and `/categories` returned full
  Sequelize model instances, not name strings - the Preferences page
  crashed outright for every single user (React error #31, "objects are
  not valid as a React child"). This had been broken in the live app the
  entire time; nothing in three sessions of manual testing had happened to
  visit `/preferences` as a freshly-registered user with real data. Fixed
  at the controller level (`.map(s => s.name)`), re-verified via the same
  E2E test that caught it.
- **OAuth-created accounts got a `Math.random()`-based placeholder
  password** - not cryptographically secure, and short enough to be a
  realistic brute-force target against a leaked hash, meaning an attacker
  could potentially log in *as* an OAuth-only user via the local password
  strategy. Replaced with `crypto.randomBytes(32).toString('hex')`.
- **No `jwt.verify` call pinned `algorithms:`** - not exploitable today
  (everything's HS256), but a standing landmine. Fixed on all three sites.
- **Session cookie had no `sameSite`** - added `"lax"` (not `"strict"`,
  which would break the OAuth redirect flow this cookie exists for).
- **`nodemailer` had a high-severity SMTP command/header injection
  advisory**, directly relevant since `sendPasswordResetEmail` passes a
  user-supplied email into the `to` field. Bumped `7.0.13` → `^9.0.5`.
- **Zero GitHub Actions were pinned to a commit SHA** - a compromised
  upstream maintainer retagging `docker/login-action` or similar could
  have injected code running with this repo's `GITHUB_TOKEN`. Every
  `uses:` line in both workflows now pins the real, verified SHA (fetched
  live from the GitHub API, not guessed - caught and fixed one transcription
  slip in `upload-artifact`'s SHA this way).
- **No backup mechanism existed anywhere in the project.** Added
  `infra/scripts/backup-db.sh` - `mysqldump` via `docker exec`, gzip +
  integrity-checked, retention-pruned. Verified live against the real DB.
- Full reasoning for each (plus what was reviewed-and-deliberately-not-
  fixed, like reset-token single-use and concurrent session limits) is in
  `docs/SECURITY.md`.

## 2. Security — done

See `docs/SECURITY.md` in full - it's structured as the test plan, not
just a summary. As of this pass every item there is either fixed and
live-verified, or fixed-but-not-yet-live-verified (§0 above, both flagged
explicitly in the doc itself), or a deliberate out-of-scope call
(database at-rest encryption, TLS termination - both hosting decisions).

## 3. Testing — genuinely comprehensive now

- [x] Server suite: **51/51 passing as of the last live run**, 6/6 suites
      (up from 44 two sessions ago - added full refresh-token
      rotate/revoke/`jti`-collision regression coverage, an admin-RBAC
      test, and fixed a `--runInBand` requirement that was silently
      corrupting results under Jest's default parallel workers - see
      `CHANGELOG.md`). **This pass added 4 more** (reset-password happy
      path/reuse/unknown-token, concurrent-session-limit eviction) that
      have **not yet been run against a live DB** - see the caveat at the
      top of this file.
- [x] `services.test.js` (2 tests) still fails - confirmed, again, to be
      the Guardian/NYT API keys in this environment being invalid
      third-party credentials, not code. Not fixable without new keys.
- [x] **Real, committed Playwright E2E suite** - `client/e2e/`, `npm run
      test:e2e`. Register → browse/search (against a seeded article, not
      live external APIs, so it's not flaky) → save → preferences →
      personalized feed → profile → change password → logout → login with
      new password → 404. **7/7 passing**, and this is the suite that
      found the Preferences-page crash above - the value case for having
      one at all, not just claiming test coverage.
- [x] Wired into CI (`.github/workflows/ci.yml`'s new `e2e` job) - spins
      up a real ephemeral MySQL, real server, real `vite preview` build,
      runs Playwright against that, uploads the report as an artifact on
      failure.
- [x] Frontend unit suite: **21/21 passing**, re-verified this pass after
      the `ArticleDetail.jsx` content-truncation fix and the
      `react-refresh/only-export-components` lint fix (context/hook file
      split - see `CHANGELOG.md`).

## 4. Frontend — react-router v7 done, PropTypes done

- [x] **`react-router-dom` v6 → v7.18.2.** This app doesn't use any API
      that changed between them (no data routers, no removed v5 APIs) -
      confirmed via lint/unit tests/build, then live-verified `<Link>`
      navigation, `useSearchParams` (`ResetPassword.jsx`), and the
      catch-all 404 route all still work correctly. `npm audit`: 0
      vulnerabilities now, was 1 moderate.
- [x] **PropTypes added** to every component that actually takes props
      (`ArticleCard`, `ArticleList`, `SearchBar`, `PrivateRoute`,
      `PublicRoute`, `ErrorBoundary`, `AuthProvider`, `ThemeProvider`, the
      local `Chip` in `Preferences.jsx`) - the real prop surface in this
      app turned out to be small; most files are route-level pages that
      take none. Re-enabled `react/prop-types` in ESLint (was `'off'`) so
      a new component with props doesn't quietly skip this.
- [ ] `P2` Full TypeScript migration - not done, and now lower-priority
      than it was: PropTypes covers the actual risk surface, and a TS
      migration is a bigger, separate-session-sized effort for
      comparatively less marginal benefit at this app's size.

## 5. CI/CD — E2E added, deploy automation still open

- [x] `.github/workflows/ci.yml` now has three jobs: `server`, `client`,
      **`e2e`** (new). `cd.yml` unchanged from last session (builds/pushes
      to GHCR on `main`).
- [x] Every action in both workflows pinned to a verified commit SHA.
- [ ] `P1` Actual deployment automation (pulling the pushed image onto a
      host and restarting the stack) - still not built, still depends on
      a hosting decision that's yours to make (VPS/PaaS/k8s).
- [ ] `P1` TLS termination, secrets management beyond `env_file` - both
      still delegated by design; see `infra/README.md` and
      `docs/SECURITY.md`'s Encryption section.
- [ ] `P2` Uptime monitoring, error tracking (Sentry) - still need an
      external account this repo can't provision.

## 6. Documentation — reconciliation pass done this session

- [x] `docs/SECURITY.md` rewritten as a real security test plan (main
      deliverable of an earlier pass), not a policy summary; updated again
      this pass to reflect §0's fixes.
- [x] `CHANGELOG.md` updated with everything from this session.
- [x] Root `README.md`'s Tech Stack section - previously fact-checked;
      re-confirmed accurate this pass (Tailwind, dark mode, testing,
      infra, React Router v7 all still correctly listed).
- [x] **The deeper README reconciliation is done.** Found and fixed:
      `client/README.md` still said "React Router 6" (actual: v7.18.2,
      already correct in root `README.md`/`CHANGELOG.md` - this file was
      just missed in that earlier update). Found and fixed:
      `server/docs/guide_&_reference/services_setup_guide.md` referenced
      the frontend at `localhost:5173` (Vite's default) - this project's
      `vite.config.js` explicitly sets `port: 3000`, so `5173` was simply
      wrong. `server/docs/guide_&_reference/README.md` already
      self-flagged its sibling files as historical/not-individually-fact-
      checked dev notes rather than canonical docs - left that framing as-is
      rather than rewriting files whose own index already sets the right
      expectation.

---

## What's actually left, in order

1. Rotate the Guardian and NYT API keys if you want `services.test.js`
   fully green (2 tests) - confirmed working code path, just invalid
   third-party credentials in this environment.
2. Decide a deploy target so CD can go from "pushes an image" to "the
   image is running somewhere," and TLS/secrets-at-rest can be built for
   real instead of staying flagged.
3. Fix local DB access in this dev environment and run `npm test` in
   `server/` to live-verify this session's new work (reset-token
   single-use, concurrent-session limits) - see the caveat at the top of
   this file. Everything else that was buildable without an external
   account or a hosting decision is now done.
4. TypeScript migration, if PropTypes ever stops feeling sufficient -
   explicitly out of scope again this pass, by request.

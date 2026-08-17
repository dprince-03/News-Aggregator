# TODO — Path to a 10/10

Status as of this pass: the security test plan (`docs/SECURITY.md`) is done
- every item verified live, most fixed, a handful deliberately left as
  reviewed/accepted tradeoffs rather than guessed at. The
  `react-router-dom` v7 upgrade, PropTypes, and a real committed E2E suite
  (which itself found and fixed a bug nothing else had) are all done too.
  **Server suite: 51/51 passing** (6/6 suites, `services.test.js` excluded
  for the reason below). **E2E suite: 7/7 passing**, wired into CI.

What's left is either genuinely external (an account/hosting decision only
you can make) or a deliberately-scoped-out larger effort, called out
explicitly rather than left silently undone.

**Priority legend** — `P0` correctness/security risk · `P1` should happen
before calling the category "done" · `P2` polish, no urgency.

---

## 0. Bugs found this session (on top of the two previous sessions')

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

## 1. Security — done

See `docs/SECURITY.md` in full - it's structured as the test plan, not
just a summary. Two items remain genuinely open there:
`react-router-dom`/`sequelize`-`uuid` dependency upgrades (§1 below) and
structured security-event logging (a real gap, but a small feature in its
own right, not a one-line fix).

## 2. Testing — genuinely comprehensive now

- [x] Server suite: **51/51 passing**, 6/6 suites (up from 44 last
      session - added full refresh-token rotate/revoke/`jti`-collision
      regression coverage, an admin-RBAC test, and fixed a `--runInBand`
      requirement that was silently corrupting results under Jest's
      default parallel workers - see `CHANGELOG.md`).
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
- [x] Frontend unit suite: still 21/21 (Vitest + RTL), unaffected by the
      react-router v7 bump (verified).

## 3. Frontend — react-router v7 done, PropTypes done

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

## 4. CI/CD — E2E added, deploy automation still open

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

## 5. Documentation

- [x] `docs/SECURITY.md` rewritten as a real security test plan (this
      session's main deliverable), not a policy summary.
- [x] `CHANGELOG.md` updated with everything from this session.
- [x] Root `README.md`'s Tech Stack section was stale (no Tailwind, no
      dark mode, no testing, no infra, React Router listed as v6) -
      updated to match reality.
- [ ] `P2` The deeper README reconciliation (root/server/client overlap)
      and the `server/docs/guide_&_reference/` fact-check flagged last
      session are **still open** - genuinely deferred again given
      everything else in this pass, not silently dropped. Worth a
      dedicated pass on its own rather than a rushed one at the end of this.

---

## What's actually left, in order

1. Rotate the Guardian and NYT API keys if you want `services.test.js`
   fully green (2 tests) - confirmed working code path, just invalid
   third-party credentials in this environment.
2. Decide a deploy target so CD can go from "pushes an image" to "the
   image is running somewhere," and TLS/secrets-at-rest can be built for
   real instead of staying flagged.
3. Structured security-event logging (which email was targeted by a
   failed login, not just which IP) - a small feature, not a one-liner.
4. The `sequelize`/`uuid` dependency chain - only fix path available is a
   `sequelize` downgrade to `3.x`, not viable; needs a real upgrade plan.
5. Reset-token single-use tracking and concurrent-session limits - both
   reviewed and deliberately left as-is in `docs/SECURITY.md`, candidates
   if this app's threat model ever changes.
6. The deferred README/guide-folder reconciliation from §5 above.
7. TypeScript migration, if PropTypes ever stops feeling sufficient.

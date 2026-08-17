# News Aggregator — Security Test Plan

A checklist for a security review pass across the platform (Express API +
MySQL, the React SPA, and the `infra/` Docker/nginx stack). Not a static
report — every `[x]` below was verified live against the running `newhub`
Docker stack (`docker compose -f infra/docker/docker-compose.yml up`), not
just read in the source.

## 1. Authentication & authorization

- [x] ~~**Password hashing**~~ — **Verified.** `bcrypt.genSalt(10)` +
      `bcrypt.hash` in a `beforeCreate`/`beforeUpdate` hook
      (`user.models.js`), `bcrypt.compare` (timing-safe) for verification.
      Failed logins return the same generic "Invalid credentials" for both
      "no such user" and "wrong password" - doesn't leak account existence.
- [x] ~~**JWT algorithm confusion**~~ — **Fixed a real gap.** None of the
      three `jwt.verify` call sites (the Passport JWT strategy,
      `verifyRefreshToken`, `verifyResetToken`) pinned `algorithms:` -
      nothing stopped a token signed with a different algorithm from being
      accepted. All three tokens are HS256 in practice, so this wasn't
      exploitable *today*, but it's a standing landmine the moment anyone
      adds a second signing method without remembering every verify site.
      Added `{ algorithms: ['HS256'] }` to all three.
- [x] ~~**Auth bypass / privilege escalation**~~ — **Fixed a real, live
      gap: `/api/admin/*` had no admin check at all.** Every admin route
      was commented `@access Private (Admin only)` but only required
      `authenticate` (any logged-in user) - and the `User` model had no
      `role` field whatsoever, so an `authorize('admin')` check could never
      have passed for *anyone* even if one had been wired up. In practice,
      any registered user could view every API request log and trigger
      `DELETE /api/admin/api-logs/cleanup`. Added `User.role`
      (`'user' | 'admin'`, default `'user'`), wired `authorize('admin')`
      onto every `/api/admin/*` route, and added `scripts/make-admin.js`
      as the (deliberately-not-an-API-endpoint) way to promote someone -
      self-service role escalation shouldn't exist. **Verified live**:
      registered a real user, confirmed `403` on an admin route, promoted
      via the DB, confirmed the *same already-issued token* got `200`
      immediately (the JWT strategy re-fetches the user from the DB on
      every request, so role changes take effect without a new login).
- [x] ~~**OAuth-created account password strength**~~ — **Fixed a real
      gap.** Google/Facebook/Twitter-created users get a placeholder
      password (they never log in with it - only OAuth) using
      `Math.random().toString(36).slice(-8)`. `Math.random()` isn't
      cryptographically secure and an 8-char base36 output is small enough
      to be a realistic offline (or even online, given no protection
      beyond the standard rate limiter) brute-force target against a
      leaked hash - meaning an attacker could potentially log in *as* an
      OAuth-only user via the local password strategy. Replaced with
      `crypto.randomBytes(32).toString('hex')`.
- [x] ~~**IDOR**~~ — **Verified clean.** Every user-scoped read/write
      (`saveArticle`, `unsaveArticle`, `getSavedArticles`, preferences)
      derives the user id from `req.user.id` (set by the JWT strategy from
      the verified token), never from a client-supplied id/body field -
      there's no route that accepts "whose data" as a parameter at all.
- [x] ~~**Mass assignment**~~ — **Verified clean.** `register`/
      `updateProfile` explicitly destructure `{ name, email, password }` /
      `{ name, email }` before they ever reach Sequelize - nothing lets a
      caller set `role`, `google_id`, or another user's `id` through these
      endpoints. (`role` specifically checked after adding it above.)
- [x] ~~**Refresh token security**~~ — **Verified (built last session,
      re-verified here).** Stored hashed (SHA-256, never raw), rotated on
      every use, revoked on logout/password-change/reset. This session
      additionally fixed a collision bug where two logins in the same
      second could produce byte-identical tokens (added a random `jti`) -
      see `CHANGELOG.md`.

## 2. Session management

- [x] ~~**Session cookie flags**~~ — **Fixed a real gap.** `httpOnly` and
      `secure` (prod-gated) were already set; `sameSite` was never
      specified at all. Set to `"lax"` deliberately, not `"strict"` - this
      cookie's only job is carrying OAuth handshake state through the
      provider's redirect back to this app, a top-level cross-site GET
      that `"strict"` would silently drop the cookie on and break the
      whole OAuth flow.
- [x] ~~**Session fixation / CSRF**~~ — **Verified not applicable, not
      guessed at.** Every `passport.authenticate()` call across this app
      passes `{ session: false }` - no route authorizes a request off the
      session cookie, ever. CSRF exploits ambient cookie auth; there isn't
      any here to exploit. (Full reasoning in `docs/ARCHITECTURE.md`.)
- [x] ~~**Instant revocation**~~ — **Already correct from last session.**
      Logout revokes the presented refresh token; password change/reset
      revokes every refresh token for that user. A stolen refresh token
      stops working the moment the account holder changes their password
      or logs out, not just at natural expiry.
- [ ] **Concurrent session limits** — **Reviewed, left as a product
      decision.** No cap on simultaneous logins/refresh tokens per user,
      by design (no check against existing sessions at login time). Not a
      bug - a legitimate tradeoff someone building an admin console might
      want to reconsider, not something to decide unilaterally here.
- [ ] **Reset-token single-use** — **Reviewed, accepted tradeoff.** Reset
      tokens are stateless JWTs with a 1h expiry, not tracked in a
      denylist - an intercepted-but-unused token could reset the password
      more than once within that hour. Closing this needs a used-token
      table (the same pattern `refresh_tokens` already uses); not built
      this pass given the 1h window already bounds the exposure to "no
      worse than a single reset already grants." Candidate for the same
      hardening as refresh tokens if this app's threat model changes.

## 3. Input validation & injection

- [x] ~~**SQL injection**~~ — **Verified clean.** Grepped the entire
      codebase for `sequelize.query`/`literal(`: the only raw query
      anywhere is a hardcoded, parameter-free `SELECT 1 as test` health
      check (`db.config.js`). Every other query - including search
      (`Article.searchArticles`, user-supplied `q`) and filters
      (`author`, `startDate`/`endDate`) - goes through Sequelize's
      `Op.*` operators, which parameterize automatically.
- [x] ~~**Stored XSS via aggregated content**~~ — **Already fixed last
      session, re-verified here.** External article title/description/
      content is sanitized (`sanitize-html`, `allowedTags: []` - stripped
      to plain text entirely, not allowlisted) before it's ever stored.
      React doesn't use `dangerouslySetInnerHTML` anywhere in this
      codebase, so even unsanitized text couldn't execute - this is
      defense in depth on top of that, not the only layer.
- [x] ~~**Validation coverage**~~ — **Verified.** Unlike ad-hoc presence
      checks, this app already has `express-validator` schemas
      (`validator.middleware.js`) wired into every state-changing auth
      route (register/login/profile/password/reset) and the preferences
      update route. Public read endpoints (articles, sources, categories)
      take only pagination/filter params with safe defaults.
- [x] ~~**Path traversal / file access**~~ — **Not applicable.** No file
      upload or filesystem-path-from-user-input exists anywhere in this
      app (`multer` isn't used - confirmed by repo-wide search - despite
      `errorHandler.middleware.js` having dead `MulterError`-handling code
      for a feature that was never built).

## 4. API & application security

- [x] ~~**Rate limiting IP accuracy**~~ — **Fixed a real, live bug.**
      `app.set('trust-proxy', 1)` used a **hyphen** - Express's actual
      setting key is `"trust proxy"` (a space). The hyphenated form
      silently sets an unrecognized custom setting; `app.get('trust proxy')`
      returned `false` despite the line's clear intent. Verified live: with
      the bug, every client behind nginx would be bucketed under nginx's
      own container IP for rate-limiting purposes, meaning the 100-req/15-
      min limit was effectively shared by *all* users combined, not applied
      per-client. Fixed the key; reverified `app.get('trust proxy')`
      returns `1` and `RateLimit-*` headers behave correctly through nginx.
- [x] ~~**Rate limiting coverage**~~ — **Verified.** General limiter
      (100/15min) on all of `/api/*`; a separate, stricter limiter
      (20/15min) specifically on `/api/auth/*` - the endpoints credential
      stuffing/brute force actually target.
- [x] ~~**Security headers**~~ — **Fixed a real gap.** Helmet's CSP/HSTS/
      nosniff/frame-options already covered direct API responses, but the
      nginx vhost serving the actual React SPA (where a browser renders
      the page) only set 3 basic headers and no CSP at all. Added a full
      CSP (scoped to what this app actually needs: `img-src https:` for
      hotlinked article thumbnails from arbitrary publishers, `style-src`/
      `font-src` for Google Fonts, `script-src 'unsafe-inline'` for the
      one small, static, build-time dark-mode-no-flash script), HSTS, and
      Permissions-Policy. Verified live: zero CSP console violations on a
      real page load, all headers present via `curl -I`.
- [x] ~~**Error-handler robustness**~~ — **Fixed a real, reproduced bug.**
      The `SequelizeUniqueConstraintError` branch of the global error
      handler referenced an undefined variable (`field`, when it had only
      assigned `errors`) - any raw unique-constraint violation that
      reached it (e.g. a race between two concurrent OAuth callbacks
      creating the same new email) would crash with `ReferenceError:
      field is not defined` instead of returning a clean `409`.
      Reproduced directly (`User.create` twice with the same email,
      bypassing the app-level pre-check), fixed, reverified the same
      reproduction now returns a clean JSON `409`.
- [x] ~~**API documentation exposure**~~ — **Reviewed, left as-is
      deliberately.** `/api/docs` (Swagger UI) has no auth gate and isn't
      `NODE_ENV`-restricted. Unlike a typical closed-source SaaS, this is
      an open-source repo (public on GitHub) - the same route shapes
      Swagger documents are already visible to anyone reading the source.
      Gating it would add complexity for no real confidentiality gain here.

## 5. Encryption & data protection

- [x] ~~**Transport encryption**~~ — **Reviewed; delegated by design, not
      an oversight.** `infra/nginx/nginx.conf` is HTTP-only intentionally
      - the documented assumption (`infra/README.md`) is a TLS-terminating
      load balancer or reverse proxy in front of it in production. HSTS is
      still declared (both by Helmet and the new nginx headers above) so
      it takes effect the moment TLS is added, without a second deploy.
- [x] ~~**Secrets at rest in the repo**~~ — **Verified.** Real `.env`
      files are gitignored; only `.env.example` templates are committed.
      `server.js` refuses to boot with missing or placeholder-looking
      secrets (`validateSecrets.utils.js`), and refuses to boot in
      production with *weak* ones.
- [ ] **Database at-rest encryption** — **Out of scope for this repo.**
      Depends entirely on the host/VPS provider's disk encryption, not
      anything the application or `infra/` compose stack controls.

## 6. Error handling & resilience

- [x] ~~**Stack trace exposure**~~ — **Verified, no bug found.** The
      generic error-handler fallback only includes `stack`/`error` in the
      JSON response when `NODE_ENV === "development"`. Every
      Sequelize-specific branch above it returns a fixed, safe message
      regardless of environment.
- [x] ~~**Uncaught errors crashing the process**~~ — **Verified.** Every
      controller is wrapped in `asyncHandler`, so a rejected promise
      reaches the centralized handler instead of crashing the process -
      *with one exception found and fixed this pass*: `login`'s passport
      callback used a bare `throw` instead of `next(error)`. That callback
      runs inside Passport's own async flow, not inside the outer
      `asyncHandler`-wrapped function, so the throw escaped Express's
      error handling entirely instead of becoming a clean `401`. Fixed to
      `next(new AppError(...))`, and wrapped the success path in its own
      try/catch too.

## 7. Observability & incident response

- [x] ~~**Request logging**~~ — **Verified.** Every request (including
      failed auth attempts) is logged with IP, method, path, status code,
      and response time (Winston + optionally the `api_logs` DB table).
- [ ] **Structured security-event logging** — **Reviewed, real gap
      flagged, not built.** The request log above captures *that* a login
      failed and from where, but not *which* email was targeted (that's in
      the request body, never persisted) - so detecting "50 failed logins
      against one specific account" isn't currently queryable, only "50
      failed logins from one IP" is. Closing this properly means adding a
      dedicated audit-log table and call sites in the auth controllers,
      which is a small feature in its own right, not a one-line fix -
      flagged for `docs/TODO.md` rather than rushed here.
- [ ] **Error tracking (Sentry or similar)** — **Not wired up.** Errors
      are logged to Winston/console/DB but nothing pages anyone. Tracked
      in `docs/TODO.md` - needs an external account this repo can't
      provision on your behalf.
- [x] ~~**Backups**~~ — **Fixed - no backup mechanism existed at all.**
      Added `infra/scripts/backup-db.sh`: `mysqldump` via `docker exec`,
      gzip-compressed, integrity-checked (`gzip -t`), retention-pruned.
      **Verified live** against the real running database - produced a
      real, valid, multi-table gzip dump. Still needs an actual cron entry
      on wherever this is deployed (the script doesn't schedule itself),
      and a real restore should be rehearsed at least once, not just this
      local dry run.

## 8. Infrastructure & supply chain

- [x] ~~**Container port exposure**~~ — **Verified.** `newhub-server` (the
      API) publishes no port to the host at all - only reachable via
      nginx's internal Docker network proxy. `newhub-mysql`'s port is
      bound to `127.0.0.1` only (host-local tooling access, e.g. running
      the test suite against the stack - not exposed to the network).
      `newhub-client` is the only container that needs to be reachable
      externally, and is the only one publishing a port.
- [x] ~~**Secrets defaults**~~ — **Verified.** No hardcoded/fallback
      secret values in `infra/docker/docker-compose.yml` - `DB_USER`/
      `DB_PASSWORD`/`DB_ROOT_PASSWORD` use `${VAR:?error message}`
      (Compose's required-or-fail syntax), so the stack refuses to start
      with unset credentials instead of silently falling back to something
      guessable.
- [x] ~~**Dependency scanning**~~ — **Fixed the one high-severity, live-
      relevant finding; reviewed the rest.** `npm audit` (server, prod
      deps): 6 findings.
      - **Fixed: `nodemailer` (high) SMTP command/header injection** -
        directly relevant, since `sendPasswordResetEmail` passes a
        user-supplied `email` into the `to` field. Bumped `7.0.13` →
        `^9.0.5` (verified the module still loads and the transport/send
        API this codebase actually uses is unchanged).
      - **Reviewed, not fixed: `sanitize-html` (moderate) - doesn't apply
        to this codebase's usage.** The advisory is a `javascript:` URI
        bypass through attributes (`action`/`formaction`/`data`/`poster`/
        `background`) on *allowed* tags. This app calls it with
        `allowedTags: []`/`allowedAttributes: {}` - every tag is stripped
        entirely, so there's no surviving tag/attribute for the bypass to
        target. Deliberately pinned to the exact version `2.17.1` (not a
        range) for an unrelated reason: its `htmlparser2` dependency is
        the last CommonJS-compatible one before `htmlparser2` went
        ESM-only in v10, which breaks every Jest test that imports
        `server.js`. No version satisfies both "patches this CVE" and
        "keeps Jest working," so the version choice stands, with this
        exact reasoning recorded here rather than left implicit.
      - **Reviewed, not fixed: `sequelize`/`uuid` chain (moderate).** The
        only available fix path downgrades `sequelize` to `3.x` - not
        viable, that's the ORM this entire app is built on. Needs a
        dedicated upgrade path (`sequelize` is currently well past 6.x),
        not a blind `--force`.
      - **Reviewed, not fixed: `passport` chain via `passport-oauth`
        (moderate, session-regeneration on login/logout).** Since this app
        never uses session-based login (`{ session: false }` everywhere -
        see §2), the vulnerable code path (session fixation on a
        session-authenticated login) isn't reachable regardless.
      Client (`npm audit`, prod deps): 1 remaining finding,
      `react-router-dom` (moderate, open-redirect bypass) - needs a
      dedicated v6→v7 migration and regression pass, tracked in
      `docs/TODO.md`.
- [x] ~~**GitHub Actions supply-chain pinning**~~ — **Fixed.** Every
      `uses:` line in both workflows (`ci.yml`, `cd.yml`) used a mutable
      version tag (`@v4`, `@v3`, ...) - a compromised upstream maintainer
      retagging any of them could inject code that runs with this repo's
      `GITHUB_TOKEN` (which `cd.yml` uses to push container images).
      Resolved each to its real current commit SHA via the GitHub API and
      pinned every action to that SHA, with the human-readable version
      kept as a trailing comment.
- [x] ~~**CI dependency install hygiene**~~ — **Verified.** `ci.yml` uses
      `npm ci` (lockfile-exact, fails on drift), not `npm install`, for
      both `server/` and `client/`.

---

## Reporting a vulnerability

Please don't open a public GitHub issue for a security vulnerability.
Email the maintainer directly (see the repository owner's GitHub profile)
with a description, reproduction steps, and impact. Please allow time to
investigate and patch before any public disclosure.

## What's still open

Tracked with the rest of the roadmap in `docs/TODO.md`:
structured security-event logging, error tracking, the `react-router-dom`
v7 and `sequelize`/`uuid` dependency upgrades, reset-token single-use
tracking, and concurrent-session limits (the latter two are deliberate,
reviewed tradeoffs, not gaps someone forgot about).

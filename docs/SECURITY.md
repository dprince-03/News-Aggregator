# News Aggregator — Security Test Plan

A checklist for a security review pass across the platform (Express API +
MySQL, the React SPA, and the `infra/` Docker/nginx stack). Not a static
report — every `[x]` below was verified live against the running `newshub`
Docker stack (`docker compose -f infra/docker/docker-compose.yml up`), not
just read in the source, **with one noted exception**: the concurrent-
session-limit and reset-token-single-use items in §2 were added in a pass
where the local MySQL instance wasn't reachable with this environment's
`.env` credentials, so those two were code-reviewed and covered by new
regression tests rather than exercised against a real, running database.
Re-verify them live before treating this doc as fully current again.

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
- [x] ~~**Concurrent session limits**~~ — **Fixed.** Previously no cap
      existed on simultaneous logins/refresh tokens per user. Added
      `MAX_ACTIVE_SESSIONS` (default `5`, `.env`-configurable) -
      `enforceSessionLimit` runs on every token issuance
      (`auth.middleware.js`'s `persistRefreshToken`), revoking the
      oldest active session(s) for that user once they're at the cap
      before the new one is persisted. Regression test added
      (`tests/auth.test.js`) asserting that logging in
      `MAX_ACTIVE_SESSIONS + 1` times leaves exactly the cap's worth of
      active sessions, with the oldest evicted first and the newest still
      usable - **not live-verified against a running DB this pass** (see
      the note at the end of this section); reviewed carefully against
      the existing, already-live-verified `RefreshToken` rotation logic
      it extends.
- [x] ~~**Reset-token single-use**~~ — **Fixed.** Reset tokens were
      stateless JWTs with no denylist - an intercepted-but-unused token
      could reset the password more than once within its 1h window.
      Added a `password_reset_tokens` table (mirrors `refresh_tokens`'
      hash-lookup pattern): `persistResetToken` records a hash of every
      issued reset token on send, `consumeResetToken` atomically marks it
      used on first redemption (`UPDATE ... WHERE used_at IS NULL`, so a
      race between two concurrent redemption attempts can't double-spend
      it), and a reuse attempt is rejected with a clean 400 even though
      the JWT itself would still verify. A successful password change
      (via either reset-password or change-password) also invalidates any
      other outstanding, unused reset tokens for that user. Regression
      tests added (`tests/auth.test.js`) for the happy path, reuse
      rejection, and an unknown/never-issued token - **not live-verified
      against a running DB this pass** (see note below).

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
- [x] ~~**Structured security-event logging**~~ — **Fixed.** The request
      log previously captured *that* a login failed and from where, but
      not *which* email was targeted (that lived only in the request
      body, never persisted) - so "50 failed logins against one specific
      account" wasn't queryable, only "50 failed logins from one IP" was.
      Added `logger.logSecurityEvent(event, meta)` (`logger.utils.js`,
      warn-level, file-only per the existing logging architecture - see
      `server/docs/guide_&_reference/logging_comparison.md`) and wired it
      into every auth failure branch that has an email or user id to
      report: failed login (`login_failed` - email, IP, reason), refresh
      token reuse/invalidity (`refresh_token_invalid`/
      `refresh_token_reuse` - user id, IP), and reset-token reuse
      (`reset_token_reuse` - user id, IP).
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

- [x] ~~**Container port exposure**~~ — **Verified.** `newshub-server` (the
      API) publishes no port to the host at all - only reachable via
      nginx's internal Docker network proxy. `newshub-mysql`'s port is
      bound to `127.0.0.1` only (host-local tooling access, e.g. running
      the test suite against the stack - not exposed to the network).
      `newshub-client` is the only container that needs to be reachable
      externally, and is the only one publishing a port.
- [x] ~~**Secrets defaults**~~ — **Verified.** No hardcoded/fallback
      secret values in `infra/docker/docker-compose.yml` - `DB_USER`/
      `DB_PASSWORD`/`DB_ROOT_PASSWORD` use `${VAR:?error message}`
      (Compose's required-or-fail syntax), so the stack refuses to start
      with unset credentials instead of silently falling back to something
      guessable.
- [x] ~~**Dependency scanning**~~ — **Fixed. `npm audit`: 0 vulnerabilities,
      both server and client.** Was 6 findings (server) + 1 (client,
      `react-router-dom`, closed by the v6→v7 migration - see
      `CHANGELOG.md`).
      - **`nodemailer` (high) SMTP command/header injection** - directly
        relevant, since `sendPasswordResetEmail` passes a user-supplied
        `email` into the `to` field. Bumped `7.0.13` → `^9.0.5`.
      - **`sanitize-html` (moderate) `javascript:` URI bypass** - bumped
        `2.17.1` → `^2.17.7`. This app calls it with `allowedTags: []`/
        `allowedAttributes: {}` (every tag stripped, so the specific
        bypass - a `javascript:` URI surviving through an *allowed* tag's
        attribute - was never reachable here), but there was no longer a
        reason not to take the fix once its side effect was solved (next
        bullet). Previously pinned to the exact vulnerable version
        because the patched releases pull in `htmlparser2` v10+, which
        went ESM-only and broke every Jest test that transitively
        `require()`s it. Fixed properly instead of left pinned: added
        `server/__mocks__/sanitize-html.js`, a manual Jest mock (Node
        itself resolves the real ESM package fine via its native
        `require(esm)` support - this is purely a Jest module-system
        limitation) that reproduces the app's actual usage (strip all
        tags) without needing the real package - or a project-wide
        Babel/ESM setup - inside Jest.
      - **`sequelize`/`uuid` chain (moderate)** - `sequelize` itself
        still depends on the vulnerable `uuid@8.3.2` (confirmed even on
        its `7.0.0-alpha`/`-next` tags, not just stable `6.x` - there's no
        real upstream fix yet), and `npm audit`'s suggested "fix"
        downgrades `sequelize` to `3.x`, which isn't viable. Forced a
        patched `uuid@^11.1.1` via `package.json`'s `overrides` instead -
        low-risk since `sequelize` only calls the stable, unchanged
        `.v1`/`.v4` named exports (`lib/utils.js`), verified by requiring
        `passport.config.js` (which pulls in the full model/service graph
        transitively) after the override with no errors.
      - **`passport` chain via `passport-oauth`** (moderate,
        session-regeneration on login/logout) - not reachable regardless,
        since this app never uses session-based login (`{ session: false
        }` everywhere - see §2), but fixed anyway rather than left as a
        latent finding: a nested `package.json` override
        (`"passport-oauth": { "passport": "^0.7.0" }`) dedupes it onto the
        same patched `passport@0.7.0` already used at the top level -
        safe because `passport-oauth`'s own code only touches the
        long-stable `passport.Strategy` base class.
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

Tracked with the rest of the roadmap in `docs/TODO.md`: error tracking
(needs an external account this repo can't provision), database
at-rest encryption and TLS termination (both depend on a hosting
decision), and rotating the Guardian/NYT API keys used in this
environment. Structured security-event logging, reset-token single-use
tracking, and concurrent-session limits - previously listed here as
open - are now built; see §2 and §7 above.

# Architecture

## System overview

```
                    ┌─────────────────────┐
                    │   Browser (React)   │
                    └──────────┬───────────┘
                               │ HTTPS
                    ┌──────────▼───────────┐
                    │  nginx (infra/nginx) │  ← serves the built SPA,
                    │  reverse proxy       │    proxies /api/* below
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  Express API (server)│
                    │  Helmet · CORS ·      │
                    │  rate limiting ·      │
                    │  Passport (JWT/OAuth) │
                    └──┬────────────────┬──┘
                       │                │
             ┌─────────▼───┐   ┌────────▼─────────┐
             │    MySQL     │   │  External News    │
             │  (Sequelize) │   │  APIs (cached,     │
             │              │   │  sanitized on      │
             │              │   │  ingest)            │
             └──────────────┘   └────────────────────┘
```

In development, the React app runs on Vite's dev server and proxies `/api`
straight to the Express server (`client/vite.config.js`); in production,
nginx does that job instead (`infra/nginx/nginx.conf`) so the SPA and API
are served same-origin and no CORS configuration is needed at the edge.

## Backend layout (`server/src`)

MVC-ish layering, one direction of dependency (routes → controllers →
models):

- **`routes/`** — declares each endpoint's path, HTTP method, and which
  middleware (auth, validation) it runs behind. No business logic here.
- **`controllers/`** — one function per endpoint. Reads `req`, calls into
  models/services, shapes the JSON response. Every controller wraps its
  body in `asyncHandler` (`middleware/errorHandler.middleware.js`) so a
  thrown/rejected promise reaches the centralized error handler instead of
  crashing the process.
- **`models/`** — Sequelize model definitions plus small static query
  helpers (`Article.searchArticles`, `SavedArticle.getSavedArticleIds`,
  ...) so controllers don't build raw `where` clauses inline. Associations
  are wired centrally in `models/index.js`.
- **`middleware/`** — auth (JWT via Passport), request validation
  (`express-validator`), centralized error handling, API request logging,
  and per-route rate limiting.
- **`services/`** — talks to the three external news APIs (GNews, Guardian,
  NYT) and aggregates their results; see below.
- **`config/`** — environment-driven configuration objects (db, passport
  strategies, CORS, Helmet, session, Swagger) - kept here specifically so
  `server.js` stays a thin composition root instead of a 300-line file
  defining everything inline.
- **`jobs/`** — `node-cron` job that triggers article aggregation on a
  schedule when `ENABLE_CRON=true`.

## Request/response envelope

Every JSON response follows the same shape:

```json
{ "success": true, "message": "...", "data": <payload>, "pagination": {...} }
```

`data` is the payload (an object for single-resource endpoints, an array
for list endpoints); `pagination` is only present on list endpoints and is
computed once by `utils/helper.utils.js#formatPaginationResponse`
(`currentPage`, `totalPages`, `totalItems`, `itemsPerPage`, `hasNextPage`,
`hasPrevPage`). The frontend's service layer (`client/src/services/*.js`)
unwraps this envelope into the flatter shape the rest of the app consumes
(`articles`, `article`, `user`, `sources`, ...) in one place, so pages never
deal with the wire format directly.

## Authentication

JWT bearer tokens end-to-end - `express-session`/`passport.session()` are
wired up only because the OAuth strategies' handshake needs *somewhere* to
stash transient state, but no route ever authenticates a request off the
session cookie (every `passport.authenticate()` call passes
`{ session: false }`). That means CSRF - which exploits ambient
cookie-based auth - isn't a live risk for this API's endpoints; the actual
attack surface is the JWTs themselves, which is why:

- Access tokens (`JWT_SECRET`, short-lived, default `7d`) are sent as
  `Authorization: Bearer <token>` and never touch a cookie.
- Refresh tokens (`JWT_REFRESH_SECRET`, longer-lived, default `30d`) are
  stored **hashed** (SHA-256) in the `refresh_tokens` table
  (`models/refreshToken.models.js`) so a database read alone can't be used
  to mint new access tokens. `POST /api/auth/refresh-token` verifies the
  JWT signature *and* checks the hash is present and unrevoked, then
  rotates it (old one revoked, new one issued).
- Refresh tokens are revoked on logout (the specific token), on password
  change/reset (every token for that user, forcing re-auth everywhere), and
  naturally expire via `expires_at`.
- `GET /api/articles`, `/search`, `/filter`, and `/:id` run behind
  `optionalAuth` rather than `authenticate` - they're public, but attach
  `req.user` when a valid token is present so the response can include
  `is_saved` per article without requiring login.

## Article aggregation

`services/aggregator.service.js` fans out to whichever of GNews/Guardian/NYT
have API keys configured (`Promise.allSettled`, so one dead source doesn't
fail the whole fetch), de-duplicates by URL, strips any HTML the upstream
APIs send (`sanitize-html`, defense against a source injecting markup into
title/description/content), and bulk-inserts into the `articles` table
(`ignoreDuplicates: true` on the unique `url` column as a second
duplication guard). Results are cached in-process for 15 minutes
(`node-cache`) so retries or closely-spaced requests don't burn free-tier
API rate limits. A cron job can trigger this automatically
(`ENABLE_CRON=true`); it's also callable directly via the aggregator
service's `fetchByCategory`/`fetchAndSaveArticles` for manual/administrative use.

## Frontend layout (`client/src`)

- **`pages/`** — one component per route, each responsible for its own data
  fetching. List pages (`Home`, `Personalized`, `Saved`) share pagination
  state/logic via the `usePaginatedArticles` hook (`hooks/useArticles.js`)
  instead of each re-implementing fetch/page/loadMore/error handling.
- **`components/`** — reusable UI: article cards/lists, header/footer,
  search, theme toggle, OAuth buttons, the top-level error boundary.
- **`context/`** — `AuthContext` (session state, backed by `authService`)
  and `ThemeContext` (light/dark, persisted to `localStorage`, no-flash
  inline script in `index.html`).
- **`services/`** — one file per backend resource, each responsible for
  unwrapping that resource's response envelope into the shape pages expect.
  This is the seam between "what the API returns" and "what the UI reads" -
  keeping it in one place is what makes it possible to consume the same
  backend contract consistently across every page.
- **`utils/ui.js`** — shared Tailwind class fragments (`btn()`, `input`,
  `card`, `alert`, ...) so buttons/inputs/cards stay visually consistent
  without duplicating long class strings across ~15 files.

## Infrastructure (`infra/`)

Docker and nginx assets are consolidated under `infra/` rather than
scattered through the repo - see `infra/README.md` for the full layout and
how to run the stack. In short: `server.Dockerfile` (Node, multi-stage,
non-root) and `client.Dockerfile` (Vite build → `nginx:alpine`) are composed
in `docker-compose.yml` alongside a MySQL service; nginx serves the built
SPA and reverse-proxies `/api/*` to the server container.

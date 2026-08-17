# API Reference

Base URL: `http://localhost:5080/api` (dev) — behind nginx in production the
API is same-origin at `/api` (see `infra/nginx/nginx.conf`).

Interactive docs (Swagger UI): `/api/docs`. This document is the canonical,
hand-written reference — `server/docs/API_REFERENCE.md` used to duplicate
it with an outdated (never-matched-the-code) response shape; that file now
just points here.

- [Response envelope](#response-envelope)
- [Authentication](#authentication)
- [Authentication endpoints](#authentication-endpoints)
- [Article endpoints](#article-endpoints)
- [Preference endpoints](#preference-endpoints)
- [Admin endpoints](#admin-endpoints)
- [Error codes](#error-codes)
- [Rate limiting](#rate-limiting)
- [Quick testing with curl](#quick-testing-with-curl)

---

## Response envelope

Every response follows one shape. Documented once here rather than
repeated (and risking drifting from reality) on every endpoint below.

**Single-resource endpoints:**
```json
{ "success": true, "message": "...", "data": { /* the resource */ } }
```

**List endpoints** additionally include a `pagination` object, computed by
`formatPaginationResponse()` (`server/src/utils/helper.utils.js`):
```json
{
  "success": true,
  "message": "...",
  "data": [ /* array of resources */ ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 8,
    "totalItems": 150,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Error responses:**
```json
{ "success": false, "message": "What went wrong" }
```

The frontend's `client/src/services/*.js` unwraps this envelope into the
flatter, endpoint-specific shape pages consume (`articles`, `article`,
`user`, `sources`, ...) — see `docs/ARCHITECTURE.md`.

## Authentication

Protected endpoints require a JWT bearer token:

```
Authorization: Bearer <access-token>
```

- Access token: signed with `JWT_SECRET`, default lifetime `7d` (`JWT_EXPIRE`)
- Refresh token: signed with `JWT_REFRESH_SECRET`, default lifetime `30d`
  (`JWT_REFRESH_EXPIRE`), stored hashed server-side and revocable — see
  [`POST /api/auth/refresh-token`](#refresh-token) and
  `docs/ARCHITECTURE.md`'s Authentication section

---

## Authentication Endpoints

### Register

`POST /api/auth/register` — public

Request:
```json
{ "name": "Jordan Avery", "email": "jordan@example.com", "password": "SecurePass123" }
```

Response `201`:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": 1, "name": "Jordan Avery", "email": "jordan@example.com", "created_at": "..." },
    "token": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### Login

`POST /api/auth/login` — public

Request: `{ "email": "...", "password": "..." }`
Response `200`: same shape as Register's `data`.

### Logout

`POST /api/auth/logout` — auth required

Request: `{ "refreshToken": "eyJ..." }` (revokes that specific refresh
token; omit it and only the client-side session is cleared)
Response `200`: `{ "success": true, "message": "Logout successful" }`

### Refresh token

`POST /api/auth/refresh-token` — public (the refresh token *is* the credential)

Verifies the refresh token, checks it's stored and unrevoked, then
**rotates** it — the old one is revoked and a new one issued alongside a
new access token.

Request: `{ "refreshToken": "eyJ..." }`
Response `200`:
```json
{ "success": true, "message": "Token refreshed successfully", "data": { "token": "eyJ...", "refreshToken": "eyJ..." } }
```

### Get current user

`GET /api/auth/me` — auth required → `{ "data": { "user": {...} } }`

### Update profile

`PUT /api/auth/profile` — auth required
Request: `{ "name": "...", "email": "..." }` (both optional)
Response: `{ "data": { "user": {...} } }`

### Change password

`PUT /api/auth/change-password` — auth required. Revokes every refresh
token for the user (forces re-login on other devices/sessions).

Request: `{ "currentPassword": "...", "newPassword": "..." }`

### Forgot password

`POST /api/auth/forgot-password` — public
Request: `{ "email": "..." }`
Always responds `200` with a generic message regardless of whether the
email exists (doesn't leak account existence). In development, the
response also includes `resetToken` directly for convenience.

### Reset password

`POST /api/auth/reset-password` — public. Verifies the reset token,
updates the password, and revokes existing refresh tokens.

Request: `{ "token": "...", "newPassword": "..." }`
Response: new `{ token, refreshToken }` pair (auto-login after reset).

### OAuth (Google / Facebook / Twitter)

`GET /api/auth/{google,facebook,twitter}` starts the provider's OAuth flow.
`GET /api/auth/{provider}/callback` is the provider's redirect target; on
success it redirects the browser to
`${FRONTEND_URL}/auth/success?token=...&refreshToken=...`, which the
frontend's `AuthSuccess` page picks up. Only providers with credentials
configured in `.env` are registered (see `passport.config.js`).

---

## Article Endpoints

All list/detail endpoints run behind `optionalAuth` — public, but when a
valid access token is presented, each article's `is_saved` reflects that
user (computed in one bulk query, not per-article).

### Get all articles

`GET /api/articles?page=1&limit=20&source=&category=` — public

### Get article by ID

`GET /api/articles/:id` — public → `{ "data": { ...article, "is_saved": false } }`

### Search articles

`GET /api/articles/search?q=<keyword>&page=1&limit=20` — public.
Note the query param is **`q`**, not `keyword`.

### Filter articles

`GET /api/articles/filter?source=&category=&author=&startDate=&endDate=&page=1&limit=20` — public

### Personalized feed

`GET /api/articles/personalized?page=1&limit=20` — auth required. Falls
back to unfiltered articles if the user has no preferences saved yet.

### Saved articles

`GET /api/articles/saved?page=1&limit=20` — auth required. Each item is
the article merged with `saved_at`.

### Save / unsave article

`POST /api/articles/:id/save` — auth required → `201` (newly saved) or
`200` (already saved), body: `{ "data": { savedArticle } }`
`DELETE /api/articles/:id/save` — auth required → `404` if it wasn't saved

---

## Preference Endpoints

### Get / update preferences

`GET /api/preferences` — auth required → `{ "data": preference, "isNew": boolean }`
`PUT /api/preferences` — auth required
Request: `{ "preferred_sources": [...], "preferred_categories": [...], "preferred_authors": [...] }` (all optional)

### Available sources / categories

`GET /api/preferences/sources` — public → `{ "data": ["The Guardian", "NYT", ...] }`
`GET /api/preferences/categories` — public → `{ "data": ["technology", "business", ...] }`

---

## Admin Endpoints

All require authentication. (Role-based restriction via `authorize()` is
available in `middleware/auth.middleware.js` but not yet wired to these
routes — see `docs/TODO.md`.)

- `GET /api/admin/api-logs/stats?days=7` — usage statistics
- `GET /api/admin/api-logs?page=1&limit=50` — raw request logs
- `GET /api/admin/api-logs/source/:source` — logs for one external API source
- `DELETE /api/admin/api-logs/cleanup` — prune old logs, body: `{ "days": 90 }`

---

## Error Codes

| Status | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Missing/invalid/expired token |
| 403 | Authenticated but not permitted |
| 404 | Resource not found |
| 409 | Conflict (e.g. email already registered) |
| 429 | Rate limit exceeded |
| 500 | Server error |

## Rate Limiting

- General API: 100 requests / 15 minutes / IP
- `/api/auth/*` specifically: 20 requests / 15 minutes / IP (tighter, since
  these are the endpoints credential-stuffing/brute-force targets)

Standard `RateLimit-*` headers are included on every response
(`src/middleware/rateLimiters.middleware.js`).

## Quick Testing with curl

```bash
# Register
curl -X POST http://localhost:5080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get articles
curl "http://localhost:5080/api/articles?page=1&limit=10"

# Get profile (with token)
curl http://localhost:5080/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

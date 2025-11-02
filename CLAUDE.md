# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A RESTful API for a news aggregator service that fetches articles from various external news sources (NewsAPI, The Guardian, New York Times) and provides authenticated endpoints for a frontend application.

## Tech Stack

- **Runtime**: Node.js with Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: Passport.js with JWT + OAuth (Google, Facebook, Twitter)
- **Testing**: Jest + Supertest
- **External APIs**: NewsAPI, Guardian API, NYT API

## Development Commands

### Running the Application
```bash
npm run dev          # Development mode with nodemon (auto-reload)
npm start            # Production mode
```

### Secrets Management
The project uses a custom secrets utility for generating secure keys:
```bash
npm run secrets:generate  # First-time setup - generates JWT and session secrets
npm run secrets:validate  # Validate existing secrets in .env
npm run secrets:backup    # Create backup of current .env
npm run secrets:force     # Regenerate all secrets (creates backup first)
```

### Testing
```bash
npm test            # Run test suite (currently not configured)
```

### Database Setup
```bash
# Initialize the database schema
mysql -u root -p < src/database/news_aggregator.sql
```

The SQL file creates:
- Database with required tables (users, articles, preferences, saved_articles, etc.)
- Default categories (general, business, entertainment, health, science, sports, technology, politics, world)
- Common news sources

## Environment Configuration

Required environment variables (see `.env.example`):

**Core Settings**:
- `PORT`, `NODE_ENV`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

**Authentication**:
- `JWT_SECRET`, `JWT_EXPIRE`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRE`
- `SESSION_SECRET`

**OAuth Providers** (optional):
- Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- Facebook: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_CALLBACK_URL`
- Twitter: `TWITTER_CONSUMER_KEY`, `TWITTER_CONSUMER_SECRET`, `TWITTER_CALLBACK_URL`

**Email** (for password reset):
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`

**External News APIs**:
- `NEWSAPI_KEY`, `GUARDIAN_API_KEY`, `NYT_API_KEY`

## Architecture

### Directory Structure
```
src/
├── config/          # Configuration files (database, auth, passport strategies)
├── controllers/     # Request handlers (auth, article, preference)
├── middleware/      # Express middleware (auth, validation, error handling)
├── models/          # Sequelize models and associations
├── routes/          # API route definitions
├── services/        # External API integrations (NewsAPI, Guardian, NYT)
├── utils/           # Utility functions (secrets, email)
└── database/        # SQL schema files
```

### Database Models & Associations

**User Model** (`src/models/user.models.js`):
- Manages user accounts with email/password or OAuth (Google, Facebook, Twitter)
- Automatically hashes passwords using bcrypt hooks (beforeCreate, beforeUpdate)
- Custom methods: `comparePassword()`, `findByEmailWithPassword()`, `findBySocialId()`
- Overrides `toJSON()` to exclude password from API responses

**Model Associations**:
- User ↔ Preference (One-to-One): Each user has one preference profile
- User → SavedArticle (One-to-Many): Users can save multiple articles
- Article → SavedArticle (One-to-Many): Articles can be saved by multiple users

See `src/models/index.js` for complete association definitions.

### Authentication Flow

The project uses **two separate database configs** (note the discrepancy):
- `src/config/db.config.js` - Direct Sequelize config (used by models via `require('../config/db.config')`)
- `src/config/database.js` - Referenced by `src/models/index.js` but file doesn't exist in current structure

⚠️ **Important**: The models/index.js imports from `../config/database` which may cause issues. User model correctly imports from `../config/db.config`.

**Authentication Methods**:
1. **Local Auth**: Email/password with bcrypt hashing
2. **JWT Auth**: Bearer token for API requests (7d expiry)
3. **Refresh Tokens**: Long-lived tokens (30d) for obtaining new access tokens
4. **OAuth**: Google, Facebook, Twitter via Passport.js strategies

**Passport Strategies** (configured in `src/config/passport.config.js`):
- `jwt` - Validates JWT bearer tokens for protected routes
- `local` - Username/password authentication
- `google`, `facebook`, `twitter` - OAuth providers (conditionally loaded if credentials exist)

**Key Auth Middleware** (`src/middleware/auth.middleware.js`):
- `authenticate()` - Protects routes requiring valid JWT
- `optionalAuth()` - Attaches user if token present but doesn't require it
- `authorize(...roles)` - Role-based access control (roles not yet implemented in User model)
- Token generation helpers: `generateToken()`, `generateRefreshToken()`, `generateResetToken()`

### API Routes

**Base URL**: `/api`

**Health Check**:
- `GET /api/health` - Server status and uptime

**Authentication** (`/api/*` via `auth.routes.js`):
- `POST /api/register` - User registration
- `POST /api/login` - Email/password login
- `POST /api/logout` - Logout (requires auth)
- `GET /api/me` - Get current user profile (requires auth)
- `PUT /api/profile` - Update profile (requires auth)
- `PUT /api/change-password` - Change password (requires auth)
- `POST /api/forget-password` - Request password reset
- `POST /api/reset-password` - Reset password with token
- `POST /api/refresh-token` - Get new access token using refresh token

**OAuth Routes**:
- `GET /api/google` - Initiate Google OAuth
- `GET /api/google/callback` - Google OAuth callback
- `GET /api/facebook` - Initiate Facebook OAuth
- `GET /api/facebook/callback` - Facebook OAuth callback
- `GET /api/twitter` - Initiate Twitter OAuth
- `GET /api/twitter/callback` - Twitter OAuth callback

⚠️ **Note**: Article and Preference routes exist but are not yet registered in `server.js`.

### Security Features

**Middleware Stack** (applied in `server.js`):
1. **Helmet**: CSP headers and security best practices
2. **CORS**: Configurable allowed origins (defaults to localhost:5000, 5080)
3. **Rate Limiting**: 100 requests per 15 minutes per IP on `/api/*` routes
4. **Session**: Express sessions for OAuth flows
5. **Additional Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS

**Request Validation**:
- Express-validator middleware for input validation
- Validation functions in `src/middleware/validator.middleware.js`

**Error Handling**:
- Centralized error handler in `src/middleware/errorHandler.middleware.js`
- `notFound()` - 404 handler for undefined routes
- `errorHandler()` - Global error handler with stack traces in development

### Server Lifecycle

**Startup** (`start_server()` in `server.js`):
1. Tests database connection via `testConnection()`
2. Exits with error if database unavailable
3. Starts Express server on PORT (default 5080)

**Graceful Shutdown**:
- Handles SIGTERM, SIGINT signals
- Closes HTTP server and database connections
- Force exits after 10 second timeout
- Handles uncaught exceptions and unhandled promise rejections

### External News Services

Located in `src/services/`:
- `news_api.services.js` - NewsAPI integration
- `guardian.services.js` - The Guardian API
- `nyt.services.js` - New York Times API
- `aggregator.services.js` - Unified interface to fetch from all sources

⚠️ **Note**: Service files are currently incomplete (1 line each).

### Working with the Database

**Using Sequelize**:
- All models use snake_case for columns (`underscored: true` in db.config)
- Timestamps automatically handled: `created_at`, `updated_at`
- Connection pooling configured (max: 10, idle: 10s)
- Logging enabled in development mode only

**Common Patterns**:
```javascript
// Import models
const { User, Article, Preference } = require('../models');

// Associations are already defined in models/index.js
const user = await User.findByPk(userId, {
  include: [{ model: Preference, as: 'preference' }]
});
```

## Important Notes

1. **Database Config Discrepancy**: `models/index.js` references `../config/database` but the actual file is `db.config.js`. This needs attention.

2. **Incomplete Routes**: Preference and Article routes exist but aren't mounted in `server.js`. Only auth routes are active.

3. **OAuth Configuration**: OAuth strategies only load if credentials are provided in .env. Missing credentials won't cause errors, just skip that provider.

4. **Debug Middleware**: Lines 67-72 in `server.js` contain temporary debug logging that should be removed in production.

5. **Port Mismatch**: Default PORT is 5080, but OAuth callback URLs in `.env.example` reference port 3000. Ensure consistency.

6. **Password Validation**: User model enforces 8+ character passwords, but OAuth users get random 8-character passwords.

7. **Missing Tests**: Test infrastructure (Jest, Supertest) is installed but no tests are implemented yet.

8. **Service Implementations**: News API services are scaffolded but not implemented. The aggregator pattern in `aggregator.services.js` should be the main interface.

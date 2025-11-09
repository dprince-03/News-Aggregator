# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A RESTful API for a news aggregator service that fetches articles from various external news sources (NewsAPI, The Guardian, New York Times) and provides authenticated endpoints for a frontend application.

## Tech Stack

- **Runtime**: Node.js with Express.js 5.1.0
- **Database**: MySQL with Sequelize ORM 6.37.7
- **Authentication**: Passport.js with JWT + OAuth (Google, Facebook, Twitter)
- **Testing**: Jest 30.2.0 + Supertest 7.1.4
- **Logging**: Winston with daily log rotation
- **Security**: Helmet, CORS, express-rate-limit, bcrypt
- **External APIs**: NewsAPI, Guardian API, NYT API

## Development Commands

### Running the Application
```bash
npm run dev          # Development mode with nodemon (auto-reload)
npm start            # Production mode
```

### Secrets Management
The project uses a custom secrets utility (`src/utils/secrets.utils.js`) for generating secure keys:
```bash
npm run secrets:gen      # First-time setup - generates JWT and session secrets
npm run secrets:check    # Validate existing secrets in .env
npm run secrets:backup   # Create backup of current .env
npm run secrets:regen    # Regenerate all secrets (creates backup first)
npm run secrets:prod     # Generate secrets for production environment
```

**Important**: Server validates secrets on startup and warns about weak secrets (< 32 chars). In production, server will exit if secrets are weak.

### Testing
```bash
npm test            # Run test suite
```

Test files created in `/tests` directory:
- `auth.test.js` - Authentication endpoint tests
- `articles.test.js` - Article endpoint tests
- `preferences.test.js` - Preference endpoint tests

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

Multiple environment files supported (`.env.dev`, `.env.example`, `.env.prod`):

**Core Settings**:
- `PORT` - Server port (default: 5080)
- `NODE_ENV` - Environment mode (development/production)

**Database**:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

**Authentication** (minimum 32 characters recommended):
- `JWT_SECRET` - Access token secret (7d expiry)
- `JWT_REFRESH_SECRET` - Refresh token secret (30d expiry)
- `JWT_EXPIRE`, `JWT_REFRESH_EXPIRE` - Token expiry times
- `SESSION_SECRET` - Express session secret for OAuth

**OAuth Providers** (optional, conditionally loaded):
- Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- Facebook: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_CALLBACK_URL`
- Twitter: `TWITTER_CONSUMER_KEY`, `TWITTER_CONSUMER_SECRET`, `TWITTER_CALLBACK_URL`

**Email Configuration** (for password reset):
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`

**External News APIs**:
- `NEWSAPI_KEY` - API key from newsapi.org
- `GUARDIAN_API_KEY` - API key from theguardian.com
- `NYT_API_KEY` - API key from developer.nytimes.com

**Scheduled Jobs**:
- `ENABLE_CRON` - Enable/disable cron jobs for article fetching

**CORS Configuration**:
- `CORS_ORIGINS` - Comma-separated list of allowed origins (default: localhost:5000,5080)

## Architecture

### Directory Structure
```
src/
├── config/          # Configuration files (database, auth, passport strategies)
├── controllers/     # Request handlers (auth ✓, article ❌, preference ❌)
├── middleware/      # Express middleware (auth, validation, error handling)
├── models/          # Sequelize models and associations (all complete)
├── routes/          # API route definitions (auth ✓, article ❌, preference ❌)
├── services/        # External API integrations (all empty - not implemented)
├── jobs/            # Scheduled tasks (fetchArticles.jobs.js - empty)
├── utils/           # Utility functions (secrets ✓, logger ✓, helper ✓)
└── database/        # SQL schema files

tests/               # Test files (created but implementation status unknown)
├── auth.test.js
├── articles.test.js
└── preferences.test.js
```

**Legend**: ✓ = Implemented, ❌ = Not implemented (empty file)

### Database Models & Associations

All models fully implemented with Sequelize. Models use snake_case for columns (`underscored: true`).

**User Model** (`src/models/user.models.js`):
- Email/password or OAuth authentication (Google, Facebook, Twitter)
- Password hashing via bcrypt hooks (beforeCreate, beforeUpdate with 10 salt rounds)
- **Instance methods**:
  - `comparePassword(candidatePassword)` - Verify password with bcrypt
  - `toJSON()` - Overridden to exclude password from responses
- **Static methods**:
  - `findByEmailWithPassword(email)` - Fetch user with password for login
  - `findBySocialId(provider, socialId)` - Find user by OAuth provider ID

**Article Model** (`src/models/article.models.js`):
- Full article schema with title, content, author, source, category, URL
- Unique URL constraint to prevent duplicate articles
- **Static methods**:
  - `searchArticles(query, options)` - Full-text search with pagination
  - `filterArticles(filters)` - Filter by source, category, author, date range
  - `getPersonalizedArticles(userId)` - Fetch articles based on user preferences
  - `bulkCreateArticles(articles)` - Batch insert with duplicate URL detection

**Preference Model** (`src/models/preference.models.js`):
- User preferences stored as JSON arrays
- Fields: `preferred_sources`, `preferred_categories`, `preferred_authors`
- One-to-one relationship with User

**SavedArticle Model** (`src/models/savedArticle.models.js`):
- Junction table for user-article many-to-many relationship
- Unique constraint on (user_id, article_id) to prevent duplicates
- `saved_at` timestamp for chronological ordering

**Category Model** (`src/models/category.models.js`):
- Master data for article categories
- Fields: `name` (unique), `display_name`

**NewsSource Model** (`src/models/newsSource.models.js`):
- Registry of available news sources
- Fields: `name`, `display_name`, `website_url`, `api_source`, `is_active`

**ApiLog Model** (`src/models/apiLog.models.js`):
- Tracks external API request logs
- Fields: `api_source`, `endpoint`, `status_code`, `response_time_ms`
- **Static methods**:
  - `getStatistics()` - Aggregate API usage statistics

**Model Associations** (defined in `src/models/index.js`):
- User ↔ Preference (One-to-One via `user_id`)
- User → SavedArticle (One-to-Many via `user_id`)
- Article → SavedArticle (One-to-Many via `article_id`)

### Authentication Flow

**Database Configuration**: Single source of truth at `src/config/db.config.js` with Sequelize instance, connection pooling (max: 10), and helper functions (`testConnection`, `syncDatabase`, `closeConnection`).

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
- `authenticate()` - Protects routes requiring valid JWT bearer token
- `optionalAuth()` - Attaches user if token present but doesn't block request
- `authorize(...roles)` - Role-based access control (roles not yet implemented in User model)
- **Token generation**:
  - `generateToken(user)` - Access token (7d expiry)
  - `generateRefreshToken(user)` - Refresh token (30d expiry)
  - `generateResetToken(user)` - Password reset token (1h expiry)
- **Token verification**:
  - `verifyRefreshToken(token)` - Validates refresh tokens
  - `verifyResetToken(token)` - Validates password reset tokens

**Validator Middleware** (`src/middleware/validator.middleware.js`):
Comprehensive validation rules using express-validator:
- `registerValidation` - Email format, password strength (8+ chars), name length
- `loginValidation` - Email and password required
- `changePasswordValidation` - Current/new password verification
- `forgotPasswordValidation` - Email format validation
- `resetPasswordValidation` - Token, password, confirmation match
- `updateProfileValidation` - Name, email, profile picture URL
- `searchArticlesValidation` - Query params (q, page, limit)
- `filterArticlesValidation` - Source, category, author, date range
- `updatePreferenceValidation` - Arrays for sources, categories, authors
- `idParamValidation` - Integer ID parameter validation

**Error Handler** (`src/middleware/errorHandler.middleware.js`):
- `AppError` class - Custom error with statusCode and operational flag
- `errorHandler()` - Global error middleware with Sequelize error mapping
  - Handles validation errors, unique constraint violations, foreign key errors
  - JWT errors (expired, invalid, malformed tokens)
  - File upload errors (size, type)
  - Stack traces in development only
- `notFound()` - 404 handler for undefined routes
- `asyncHandler()` - Wrapper for async routes to catch promise rejections

### API Routes

**Base URL**: `/api`

**Root Endpoint**:
- `GET /api` - Returns list of available API endpoints

**Health Check**:
- `GET /api/health` - Server status, uptime, timestamp, environment

**Authentication Routes** (`/api/auth/*` - Fully Implemented ✓):
- `POST /api/auth/register` - User registration with email/password
- `POST /api/auth/login` - Email/password authentication
- `POST /api/auth/logout` - Logout (requires auth)
- `GET /api/auth/me` - Get current user profile (requires auth)
- `PUT /api/auth/profile` - Update user profile (requires auth)
- `PUT /api/auth/change-password` - Change password (requires auth)
- `POST /api/auth/forget-password` - Request password reset email
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/refresh-token` - Get new access token (not yet in routes)

**OAuth Routes** (Conditionally loaded):
- `GET /api/auth/google` - Initiate Google OAuth flow
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/facebook` - Initiate Facebook OAuth flow
- `GET /api/auth/facebook/callback` - Facebook OAuth callback
- `GET /api/auth/twitter` - Initiate Twitter OAuth flow
- `GET /api/auth/twitter/callback` - Twitter OAuth callback

**Article Routes** (`/api/articles/*` - Not Implemented ❌):
- Route file exists but is empty (0 lines)
- Controller file exists but is empty (0 lines)
- Routes not mounted in server.js

**Preference Routes** (`/api/preferences/*` - Not Implemented ❌):
- Route file exists but is empty (0 lines)
- Controller file exists but is empty (0 lines)
- Routes not mounted in server.js

### Security Features

**Middleware Stack** (applied in `server.js`):
1. **Helmet** - CSP headers with custom directives for scripts, styles, images, fonts
2. **CORS** - Configurable origins via `CORS_ORIGINS` env var (default: localhost:5000, 5080)
   - Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
   - Credentials enabled for cookie/session handling
3. **Rate Limiting** - 100 requests per 15 minutes per IP on all `/api/*` routes
   - Returns 429 with retry-after headers
4. **Express Session** - Secure session configuration for OAuth flows
   - HttpOnly cookies, secure flag in production
   - 24-hour session expiry
5. **Body Parser** - JSON and URL-encoded with 10mb limit
6. **Custom Security Headers**:
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block
   - Strict-Transport-Security: max-age=31536000; includeSubDomains

**Secret Validation on Startup**:
- Validates `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`
- Warns if secrets are less than 32 characters
- **Production mode**: Exits if weak secrets detected

**Request Validation**:
- Express-validator for all input validation
- See validator.middleware.js for comprehensive rules

**Password Security**:
- Bcrypt hashing with 10 salt rounds
- Minimum 8 characters enforced
- Password comparison via constant-time algorithm

**Error Handling**:
- Centralized error handler with production/development modes
- Sequelize error mapping (validation, unique constraints, foreign keys)
- JWT error handling (expired, invalid, malformed)
- Stack traces only in development

### Server Lifecycle

**Startup** (`start_server()` in `server.js`):
1. Validates secrets (JWT, refresh, session) - warns or exits on weak secrets
2. Tests database connection via `testConnection()`
3. Exits with error code 1 if database unavailable
4. Starts Express server on PORT (default: 5080)
5. Logs server URL and available endpoints

**Graceful Shutdown**:
- Handles SIGTERM, SIGINT signals
- Closes HTTP server first, then database connections
- Force exits after 10 second timeout
- Handles uncaught exceptions and unhandled promise rejections
- Logs shutdown progress

### Logging System

**Winston Logger** (`src/utils/logger.utils.js`):
- **Console transport**: Colorized output in development
- **File transports**:
  - `logs/error-%DATE%.log` - Error-level logs with 14-day retention
  - `logs/combined-%DATE%.log` - All logs with 14-day retention
  - `logs/access-%DATE%.log` - HTTP access logs
  - Daily rotation with max 20mb file size
- **Helper functions**:
  - `logRequest(req, res, options)` - HTTP request logging with response time
  - `logError(err, context)` - Enhanced error logging with context

**Morgan HTTP Logger**:
- Development format: `:method :url :status :response-time ms`
- Integrated with Winston for file persistence

### Utilities

**Secrets Management** (`src/utils/secrets.utils.js`):
- `generateSecret(length)` - Cryptographically secure random hex (default 32 bytes)
- `generateBase64Secret(length)` - Base64-encoded secrets
- `validateSecrets()` - Checks JWT_SECRET, JWT_REFRESH_SECRET, SESSION_SECRET
- `generateAllSecrets()` - Generates all required secrets
- `backupEnvFile()` - Creates timestamped .env backup
- **CLI commands**: generate, force, validate, backup, env [environment]

**Helper Utilities** (`src/utils/helper.utils.js`):
- `paginate(page, limit)` - Calculate offset/limit for pagination
- `formatPaginationResponse(data, page, limit, total)` - Format paginated responses
- `timeAgo(date)` - Human-readable time differences (⚠️ BUG: references `data` instead of `date`)
- `sanitizeSearchQuery(query)` - Remove HTML tags from search queries

### External News Services

Located in `src/services/` - **All Not Implemented** ❌:
- `news_api.services.js` - NewsAPI.org integration (0 lines)
- `guardian.services.js` - The Guardian API integration (0 lines)
- `nyt.services.js` - New York Times API integration (0 lines)
- `aggregator.services.js` - Unified interface to fetch from all sources (0 lines)

These services should implement:
- Article fetching from respective APIs
- Response normalization to common Article model format
- Rate limiting and error handling
- API key configuration from environment variables

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

## Known Bugs & Issues

### Critical Bugs in `src/controllers/auth.controllers.js`:

1. **Line ~113** - `updateProfile()`: Logic inverted
   ```javascript
   if (user) {  // Should be if (!user)
   ```

2. **Line ~118** - `updateProfile()`: Method name typo
   ```javascript
   findByOne()  // Should be findOne()
   ```

3. **Line ~152** - `changePassword()`: Missing user object
   ```javascript
   comparePassword(currentPassword)  // Should be user.comparePassword(currentPassword)
   ```

4. **Line ~176** - `forgotPassword()`: Logic error
   ```javascript
   if (user) {  // Should be if (!user)
   ```

5. **Lines ~56-57** - `login()`: Missing user parameter
   ```javascript
   generateToken()  // Should be generateToken(user)
   generateRefreshToken()  // Should be generateRefreshToken(user)
   ```

### Minor Issues:

6. **`src/routes/auth.routes.js:31`** - Typo in Google OAuth scope
   ```javascript
   scope: ['proflie', 'email']  // Should be 'profile'
   ```

7. **`src/routes/auth.routes.js:22`** - Inconsistent endpoint naming
   ```javascript
   '/forget-password'  // Should be '/forgot-password' to match controller
   ```

8. **`src/utils/helper.utils.js:40`** - Variable name typo
   ```javascript
   const diff = Date.now() - new Date(data);  // Should be 'date' not 'data'
   ```

9. **`src/middleware/errorHandler.middleware.js:29`** - Undefined variable reference
   ```javascript
   field: field  // 'field' is undefined, should use err.errors[0]?.path
   ```

## Implementation Status

### ✓ Fully Implemented:
- Authentication system (local + OAuth)
- User management (registration, login, profile, password change)
- All database models with associations
- Middleware (auth, validation, error handling)
- Security features (Helmet, CORS, rate limiting, secrets validation)
- Logging system (Winston + Morgan)
- Utilities (secrets, helper functions)

### ❌ Not Implemented:
- Article controllers and routes (empty files)
- Preference controllers and routes (empty files)
- All external API services (NewsAPI, Guardian, NYT, aggregator)
- Cron job for article fetching (`src/jobs/fetchArticles.jobs.js`)
- Email service for password reset
- Test implementations

### ⚠️ Partially Implemented:
- Auth routes (refresh token endpoint missing from routes but controller exists)
- Helper utilities (timeAgo function has a bug)

## Important Notes

1. **OAuth Configuration**: Passport strategies conditionally load based on environment variables. Missing OAuth credentials won't cause errors, the strategy simply won't be available.

2. **Debug Middleware**: `server.js` contains temporary debug logging (lines 67-72) that logs all request bodies and headers. **Remove before production deployment**.

3. **Port Configuration**: Default PORT is 5080. Ensure OAuth callback URLs in `.env` match the actual server port.

4. **Password Security**: User model enforces 8+ character passwords for local auth, but OAuth users are auto-created with random 8-character passwords meeting minimum requirements.

5. **Secret Validation**: Server performs startup validation of JWT and session secrets. In production, weak secrets (< 32 chars) will cause the server to exit.

6. **Routes Not Mounted**: Article and preference route files exist but are not imported or mounted in `server.js`. Only auth routes are currently active.

7. **Database Setup Required**: Run `mysql -u root -p < src/database/news_aggregator.sql` to create database schema before first run.

8. **Test Suite**: Test infrastructure installed (Jest, Supertest) with test files created in `/tests`, but test implementations need to be written.

9. **Scheduled Jobs**: Cron job file exists (`fetchArticles.jobs.js`) but is empty. When implemented, controlled by `ENABLE_CRON` environment variable.

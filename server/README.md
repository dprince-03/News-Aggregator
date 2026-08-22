# News Aggregator API - Backend

RESTful API for the News Aggregator application built with Node.js, Express, and MySQL.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Testing](#testing)
- [Deployment](#deployment)

## Features

- **User Authentication**
  - JWT-based authentication
  - OAuth support (Google, Facebook, Twitter)
  - Password reset via email
  - Secure password hashing with bcrypt

- **Article Management**
  - Fetch articles from multiple sources (GNews, Guardian, NYT)
  - Automated article aggregation with cron jobs
  - Search and filter capabilities
  - Pagination support

- **Personalization**
  - User preferences for sources, categories, and authors
  - Personalized news feed
  - Article bookmarking

- **Security & Performance**
  - Rate limiting
  - CORS configuration
  - Helmet security headers
  - Request validation
  - API logging and analytics

## Tech Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js 5
- **Database**: MySQL 8 with Sequelize ORM
- **Authentication**: JWT + Passport.js
- **Validation**: Express Validator
- **Logging**: Winston
- **Testing**: Jest + Supertest
- **Documentation**: Swagger/OpenAPI

## Getting Started

### Prerequisites

- Node.js 16 or higher
- MySQL 8.0+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create database:

```sql
CREATE DATABASE news_aggregator;
```

3. Configure environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Generate JWT secrets:

```bash
npm run secrets:gen
```

5. Start the server:

```bash
# Development
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5080`

## Configuration

### Environment Variables

Create a `.env` file in the server directory - `.env.example` is the
up-to-date template; the block below mirrors it:

```env
# Server
PORT=5080
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=news_aggregator
DB_USER=user
DB_PASSWORD=user_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars
JWT_REFRESH_EXPIRE=30d

# Session (OAuth handshake only - this app never uses session-based login)
SESSION_SECRET=your_session_secret_key_min_32_chars

# OAuth (each provider only registers if its credentials are set)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5080/api/auth/google/callback
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:5080/api/auth/facebook/callback
TWITTER_CONSUMER_KEY=your_twitter_consumer_key
TWITTER_CONSUMER_SECRET=your_twitter_consumer_secret
TWITTER_CALLBACK_URL=http://localhost:5080/api/auth/twitter/callback

# Email (optional - password reset emails)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password
EMAIL_FROM=noreply@newsaggregator.com

# External news APIs
GNEWSAPI_KEY=get_from_gnews.io
GUARDIAN_API_KEY=get_from_theguardian.com
NYT_API_KEY=get_from_developer.nytimes.com

ENABLE_CRON=true

# Logging
LOG_LEVEL=info
ENABLE_DB_LOGGING=true

# Session limits
MAX_ACTIVE_SESSIONS=5

# Frontend URL (used in OAuth redirects and reset-password email links)
FRONTEND_URL=http://localhost:3000
```

### Getting API Keys

**GNews** (Required - the primary article-fetching source; NewsAPI.org was
used in an earlier version of this project and has been fully replaced):
1. Sign up at https://gnews.io/
2. Get your free API key (100 requests/day)
3. Add to `GNEWSAPI_KEY`

**The Guardian** (Optional):
1. Register at https://open-platform.theguardian.com/
2. Get API key
3. Add to `GUARDIAN_API_KEY`

**New York Times** (Optional):
1. Sign up at https://developer.nytimes.com/
2. Get API key
3. Add to `NYT_API_KEY`

## API Documentation

### Interactive Documentation

Once the server is running, access the Swagger documentation at:

```
http://localhost:5080/api/docs
```

### Base URL

```
http://localhost:5080/api
```

The endpoint examples below cover the common cases; `docs/API.md` is the
canonical, kept-current reference for the full request/response envelope
and every endpoint (including forgot/reset-password).

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

#### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

### Article Endpoints

#### Get All Articles
```http
GET /api/articles?page=1&limit=20
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

#### Search Articles
```http
GET /api/articles/search?keyword=technology&page=1&limit=20
```

**Query Parameters:**
- `keyword` (required): Search term
- `page` (optional): Page number
- `limit` (optional): Items per page

#### Filter Articles
```http
GET /api/articles/filter?source=BBC&category=technology&page=1
```

**Query Parameters:**
- `source` (optional): News source name
- `category` (optional): Article category
- `author` (optional): Author name
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `page` (optional): Page number
- `limit` (optional): Items per page

#### Get Article by ID
```http
GET /api/articles/:id
```

#### Get Personalized Feed (Auth Required)
```http
GET /api/articles/personalized?page=1&limit=20
Authorization: Bearer <token>
```

#### Get Saved Articles (Auth Required)
```http
GET /api/articles/saved?page=1&limit=20
Authorization: Bearer <token>
```

#### Save Article (Auth Required)
```http
POST /api/articles/:id/save
Authorization: Bearer <token>
```

#### Unsave Article (Auth Required)
```http
DELETE /api/articles/:id/save
Authorization: Bearer <token>
```

### Preference Endpoints

#### Get User Preferences (Auth Required)
```http
GET /api/preferences
Authorization: Bearer <token>
```

#### Update Preferences (Auth Required)
```http
PUT /api/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "preferred_sources": ["BBC News", "CNN"],
  "preferred_categories": ["technology", "business"],
  "preferred_authors": ["John Smith", "Jane Doe"]
}
```

#### Get Available Sources
```http
GET /api/preferences/sources
```

#### Get Available Categories
```http
GET /api/preferences/categories
```

### Admin Endpoints (Auth Required)

#### Get API Logs
```http
GET /api/admin/api-logs?page=1&limit=50
Authorization: Bearer <token>
```

#### Get API Statistics
```http
GET /api/admin/api-logs/stats?days=7
Authorization: Bearer <token>
```

## Database Schema

> Tables are created by Sequelize's `sync()` (`src/models/*.models.js`),
> not hand-written migrations - the SQL below is a reference rendering of
> those model definitions, not a separate source of truth. If the two ever
> disagree, the model file is correct.

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  google_id VARCHAR(255) UNIQUE,
  facebook_id VARCHAR(255) UNIQUE,
  twitter_id VARCHAR(255) UNIQUE,
  profile_picture VARCHAR(512),
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```
`role` gates `/api/admin/*` (`authorize('admin')`); promote a user via
`npm run admin:promote`, not an API endpoint - see `docs/SECURITY.md` §1.

### Refresh Tokens Table
```sql
CREATE TABLE refresh_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL REFERENCES users(id),
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
Stores a SHA-256 hash of each issued refresh token, never the raw token.
Rotated on every use; revoked on logout, password change/reset, or once a
user exceeds `MAX_ACTIVE_SESSIONS` (default `5`) active sessions.

### Password Reset Tokens Table
```sql
CREATE TABLE password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL REFERENCES users(id),
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
Makes each password-reset link single-use: `used_at` is set the moment a
token is redeemed, so a second attempt with the same (still
JWT-signature-valid) token is rejected. See `docs/API.md`'s reset-password
endpoint and `docs/SECURITY.md` §2.

### Articles Table
```sql
CREATE TABLE articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  author VARCHAR(255),
  source_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  published_at DATETIME NOT NULL,
  url VARCHAR(512) UNIQUE,
  url_to_image VARCHAR(512),
  source_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_source (source_name),
  INDEX idx_category (category),
  INDEX idx_published (published_at)
);
```

### User Preferences Table
```sql
CREATE TABLE user_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  name VARCHAR(255),
  preferred_sources JSON,
  preferred_categories JSON,
  preferred_authors JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Saved Articles Table
```sql
CREATE TABLE saved_articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  article_id INT NOT NULL,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_article (user_id, article_id)
);
```

### Categories & News Sources Tables
```sql
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE news_sources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  website_url VARCHAR(512),
  api_source VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
Reference data surfaced by `GET /api/preferences/{categories,sources}` for
the Preferences page's pick-lists.

### API Logs Table
```sql
CREATE TABLE api_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  api_source VARCHAR(100) NOT NULL,
  endpoint VARCHAR(255),
  status_code INT,
  response_time_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
Populated for every external API call (GNews/Guardian/NYT) and, when
`ENABLE_DB_LOGGING=true`, every internal request too. Queried via
`/api/admin/api-logs*` (admin-only) or `npm run stats`. See
`server/docs/guide_&_reference/logging_comparison.md` for how this
relates to the separate Winston file logs.

## Authentication

### JWT Tokens

The API uses JWT (JSON Web Tokens) for authentication. After successful login, include the token in the Authorization header:

```http
Authorization: Bearer <your-token>
```

### Token Expiration

- Access Token: 7 days by default (`JWT_EXPIRE`)
- Refresh Token: 30 days by default (`JWT_REFRESH_EXPIRE`), rotated on
  every use, and capped at `MAX_ACTIVE_SESSIONS` (default `5`) concurrent
  sessions per user - the oldest is revoked once a new login exceeds it.
- Password Reset Token: 1 hour, single-use (see `password_reset_tokens`
  above and `docs/SECURITY.md` §2).

### Protected Routes

Routes requiring authentication return `401 Unauthorized` if:
- No token is provided
- Token is invalid or expired
- Token signature doesn't match

### OAuth Flow

1. Client redirects to `/api/auth/google` (or facebook/twitter)
2. User authorizes the application
3. OAuth provider redirects back to `/api/auth/google/callback`
4. Server creates/updates user and returns JWT token
5. Client stores token and uses for subsequent requests

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# Auth tests
npm run test:auth

# Article tests
npm run test:articles

# Preference tests
npm run test:preferences

# Admin tests
npm run test:admin
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

### Test Structure

```
tests/
├── auth.test.js          # Authentication tests
├── articles.test.js      # Article CRUD tests
├── preferences.test.js   # Preference tests
├── admin.test.js         # Admin endpoint tests
├── models.test.js        # Model validation tests
├── integration.test.js   # Integration tests
└── setup.js              # Test configuration
```

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── db.config.js          # Database configuration
│   │   └── passport.config.js    # Passport strategies
│   ├── controllers/
│   │   ├── auth.controllers.js   # Auth logic
│   │   ├── article.controllers.js
│   │   ├── preference.controllers.js
│   │   └── admin.controllers.js
│   ├── middleware/
│   │   ├── auth.middleware.js    # JWT verification
│   │   ├── validator.middleware.js
│   │   ├── errorHandler.middleware.js
│   │   └── rateLimiter.middleware.js
│   ├── models/
│   │   ├── user.models.js
│   │   ├── article.models.js
│   │   ├── preference.models.js
│   │   ├── savedArticle.models.js
│   │   ├── category.models.js
│   │   ├── newsSource.models.js
│   │   ├── apiLog.models.js
│   │   ├── refreshToken.models.js
│   │   └── passwordResetToken.models.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── article.routes.js
│   │   ├── preference.routes.js
│   │   └── admin.routes.js
│   ├── services/
│   │   ├── gnews.service.js      # GNews (primary source)
│   │   ├── guardian.service.js   # Guardian API
│   │   ├── nyt.service.js        # NYT API
│   │   └── aggregator.service.js # Combines/sanitizes/dedupes all three
│   ├── utils/
│   │   ├── logger.utils.js       # Winston logger
│   │   ├── secrets.utils.js      # Secret management
│   │   └── email.utils.js        # Email utilities
│   └── jobs/
│       └── fetchArticles.jobs.js # Cron jobs
├── tests/                         # Test files
├── logs/                          # Log files
├── docs/                          # Additional docs
├── server.js                      # Entry point
├── package.json
└── README.md                      # This file
```

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run secrets:gen` - Generate JWT secrets
- `npm run secrets:check` - Validate secrets
- `npm run stats` - View API statistics
- `npm run stats:7` - Last 7 days stats
- `npm run stats:30` - Last 30 days stats

## Logging

### Winston Logger

Application logs are saved to files in the `logs/` directory:

- `combined.log` - All logs
- `error.log` - Error logs only
- Logs rotate daily

### API Logs

API request logs are saved to the database in the `api_logs` table for analytics and monitoring.

View stats using:
```bash
npm run stats
```

## Cron Jobs

### Article Aggregation

Articles are automatically fetched from news APIs every hour:

```javascript
// Runs every hour
schedule.schedule('0 * * * *', async () => {
  await fetchAndStoreArticles();
});
```

Configure the schedule in `src/jobs/fetchArticles.jobs.js`.

## Error Handling

The API uses centralized error handling middleware. All errors return a consistent format:

```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error (development only)"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Default**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 requests per 15 minutes per IP

Configure in `.env`:
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets
- [ ] Configure MySQL with proper credentials
- [ ] Set up SSL/TLS
- [ ] Configure CORS for your domain
- [ ] Set up reverse proxy (Nginx/Apache)
- [ ] Enable database backups
- [ ] Set up monitoring and alerts
- [ ] Configure log rotation
- [ ] Use PM2 or similar process manager

### Using PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start server.js --name news-aggregator

# View logs
pm2 logs news-aggregator

# Restart application
pm2 restart news-aggregator

# Stop application
pm2 stop news-aggregator

# Set up auto-restart on reboot
pm2 startup
pm2 save
```

### Environment Variables in Production

Never commit `.env` files. Use environment variable management:

- **AWS**: Parameter Store or Secrets Manager
- **Heroku**: Config Vars
- **DigitalOcean**: App Platform Environment Variables
- **Docker**: docker-compose.yml or Kubernetes secrets

## Security Best Practices

- ✅ JWT tokens with expiration
- ✅ Password hashing with bcrypt
- ✅ SQL injection prevention (Sequelize ORM)
- ✅ XSS protection (Helmet)
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation
- ✅ Secure HTTP headers
- ✅ Environment variable validation

## Troubleshooting

### Database Connection Issues

```bash
# Test MySQL connection
mysql -u root -p -e "SELECT 1"

# Check if database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'news_aggregator'"
```

### Port Already in Use

```bash
# Find process using port 5080
lsof -ti:5080

# Kill the process
kill -9 $(lsof -ti:5080)
```

### Articles Not Fetching

1. Check API keys in `.env`
2. Verify API key validity
3. Check logs: `tail -f logs/combined.log`
4. Manually trigger: Restart server

## Contributing

1. Create a feature branch
2. Write tests for new features
3. Ensure all tests pass
4. Follow existing code style
5. Update documentation
6. Submit pull request

## License

NON

## Support

For issues and questions:
- GitHub Issues: https://github.com/dprince-03/News-Aggregator-API-/issues
- Email: support@newsaggregator.com

## Acknowledgments

- Express.js team
- Sequelize ORM
- Passport.js
- GNews, The Guardian, New York Times APIs

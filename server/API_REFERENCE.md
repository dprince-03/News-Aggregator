# Complete API Reference

Base URL: `http://localhost:5080/api`

## Table of Contents

- [Authentication Endpoints](#authentication-endpoints)
- [Article Endpoints](#article-endpoints)
- [Preference Endpoints](#preference-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [Response Formats](#response-formats)
- [Error Codes](#error-codes)

---

## Authentication Endpoints

### 1. Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJqb2huZG9lIiwiaWF0IjoxNjMzMDI0ODAwfQ.example",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "created_at": "2024-11-09T10:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Email already exists"
}
```

---

### 2. Login User

Authenticate and receive JWT token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJqb2huZG9lIiwiaWF0IjoxNjMzMDI0ODAwfQ.example",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "profile_picture": null,
    "created_at": "2024-11-09T10:30:00.000Z"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### 3. Logout User

Invalidate current session (requires authentication).

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 4. Get Current User Profile

Get authenticated user's profile (requires authentication).

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "profile_picture": "https://example.com/avatar.jpg",
    "created_at": "2024-11-09T10:30:00.000Z",
    "updated_at": "2024-11-09T12:30:00.000Z"
  }
}
```

---

### 5. Update User Profile

Update user profile information (requires authentication).

**Endpoint:** `PUT /api/auth/profile`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Updated Doe",
  "email": "john.updated@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "name": "John Updated Doe",
    "email": "john.updated@example.com",
    "profile_picture": null,
    "updated_at": "2024-11-09T14:30:00.000Z"
  }
}
```

---

### 6. Change Password

Change user password (requires authentication).

**Endpoint:** `PUT /api/auth/change-password`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewSecurePass456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

---

### 7. Forgot Password

Request password reset email.

**Endpoint:** `POST /api/auth/forget-password`

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

### 8. Reset Password

Reset password with token from email.

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewPassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

### 9. OAuth - Google Login

Redirect to Google OAuth.

**Endpoint:** `GET /api/auth/google`

Redirects to Google OAuth consent screen.

---

### 10. OAuth - Google Callback

Google OAuth callback (handled by backend).

**Endpoint:** `GET /api/auth/google/callback`

Redirects to frontend with token.

---

### 11. OAuth - Facebook Login

**Endpoint:** `GET /api/auth/facebook`

---

### 12. OAuth - Facebook Callback

**Endpoint:** `GET /api/auth/facebook/callback`

---

### 13. OAuth - Twitter Login

**Endpoint:** `GET /api/auth/twitter`

---

### 14. OAuth - Twitter Callback

**Endpoint:** `GET /api/auth/twitter/callback`

---

## Article Endpoints

### 15. Get All Articles

Retrieve paginated list of articles.

**Endpoint:** `GET /api/articles`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Example Request:**
```
GET /api/articles?page=1&limit=20
```

**Success Response (200):**
```json
{
  "success": true,
  "articles": [
    {
      "id": 1,
      "title": "Breaking: Major Tech Announcement",
      "description": "A major tech company announces groundbreaking innovation...",
      "content": "Full article content here...",
      "author": "Jane Smith",
      "source_name": "TechCrunch",
      "category": "technology",
      "published_at": "2024-11-09T10:00:00.000Z",
      "url": "https://techcrunch.com/article/123",
      "url_to_image": "https://cdn.example.com/image.jpg",
      "created_at": "2024-11-09T10:05:00.000Z"
    },
    {
      "id": 2,
      "title": "Global Market Update",
      "description": "Stock markets show positive trends...",
      "content": "Market analysis content...",
      "author": "John Analyst",
      "source_name": "Bloomberg",
      "category": "business",
      "published_at": "2024-11-09T09:30:00.000Z",
      "url": "https://bloomberg.com/article/456",
      "url_to_image": "https://cdn.example.com/market.jpg",
      "created_at": "2024-11-09T09:35:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### 16. Get Article by ID

Retrieve single article details.

**Endpoint:** `GET /api/articles/:id`

**Example Request:**
```
GET /api/articles/1
```

**Success Response (200):**
```json
{
  "success": true,
  "article": {
    "id": 1,
    "title": "Breaking: Major Tech Announcement",
    "description": "A major tech company announces groundbreaking innovation...",
    "content": "Full article content goes here. This is the complete text of the article with all details...",
    "author": "Jane Smith",
    "source_name": "TechCrunch",
    "source_id": "techcrunch",
    "category": "technology",
    "published_at": "2024-11-09T10:00:00.000Z",
    "url": "https://techcrunch.com/article/123",
    "url_to_image": "https://cdn.example.com/image.jpg",
    "created_at": "2024-11-09T10:05:00.000Z",
    "updated_at": "2024-11-09T10:05:00.000Z",
    "is_saved": false
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Article not found"
}
```

---

### 17. Search Articles

Search articles by keyword.

**Endpoint:** `GET /api/articles/search`

**Query Parameters:**
- `keyword` (required): Search term
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Example Request:**
```
GET /api/articles/search?keyword=technology&page=1&limit=10
```

**Success Response (200):**
```json
{
  "success": true,
  "articles": [
    {
      "id": 1,
      "title": "Breaking: Major Tech Announcement",
      "description": "A major tech company announces...",
      "author": "Jane Smith",
      "source_name": "TechCrunch",
      "category": "technology",
      "published_at": "2024-11-09T10:00:00.000Z",
      "url": "https://techcrunch.com/article/123",
      "url_to_image": "https://cdn.example.com/image.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  },
  "keyword": "technology"
}
```

---

### 18. Filter Articles

Filter articles by multiple criteria.

**Endpoint:** `GET /api/articles/filter`

**Query Parameters:**
- `source` (optional): Filter by source name
- `category` (optional): Filter by category
- `author` (optional): Filter by author
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Example Request:**
```
GET /api/articles/filter?source=TechCrunch&category=technology&startDate=2024-11-01&endDate=2024-11-09&page=1&limit=15
```

**Success Response (200):**
```json
{
  "success": true,
  "articles": [
    {
      "id": 1,
      "title": "Breaking: Major Tech Announcement",
      "description": "Article description...",
      "author": "Jane Smith",
      "source_name": "TechCrunch",
      "category": "technology",
      "published_at": "2024-11-09T10:00:00.000Z",
      "url": "https://techcrunch.com/article/123",
      "url_to_image": "https://cdn.example.com/image.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 15,
    "total": 12,
    "totalPages": 1
  },
  "filters": {
    "source": "TechCrunch",
    "category": "technology",
    "startDate": "2024-11-01",
    "endDate": "2024-11-09"
  }
}
```

---

### 19. Get Personalized Feed

Get articles based on user preferences (requires authentication).

**Endpoint:** `GET /api/articles/personalized`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Example Request:**
```
GET /api/articles/personalized?page=1&limit=20
```

**Success Response (200):**
```json
{
  "success": true,
  "articles": [
    {
      "id": 5,
      "title": "Tech Innovation News",
      "description": "Latest in tech...",
      "author": "Tech Writer",
      "source_name": "TechCrunch",
      "category": "technology",
      "published_at": "2024-11-09T11:00:00.000Z",
      "url": "https://example.com/article",
      "url_to_image": "https://cdn.example.com/tech.jpg",
      "is_saved": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### 20. Get Saved Articles

Retrieve user's bookmarked articles (requires authentication).

**Endpoint:** `GET /api/articles/saved`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Example Request:**
```
GET /api/articles/saved?page=1&limit=10
```

**Success Response (200):**
```json
{
  "success": true,
  "articles": [
    {
      "id": 1,
      "title": "Saved Article Title",
      "description": "Article description...",
      "author": "Author Name",
      "source_name": "Source",
      "category": "technology",
      "published_at": "2024-11-09T10:00:00.000Z",
      "url": "https://example.com/article",
      "url_to_image": "https://cdn.example.com/image.jpg",
      "saved_at": "2024-11-09T12:00:00.000Z",
      "is_saved": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 8,
    "totalPages": 1
  }
}
```

---

### 21. Save Article

Bookmark an article (requires authentication).

**Endpoint:** `POST /api/articles/:id/save`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Example Request:**
```
POST /api/articles/1/save
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Article saved successfully",
  "saved_article": {
    "id": 1,
    "user_id": 1,
    "article_id": 1,
    "saved_at": "2024-11-09T14:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Article already saved"
}
```

---

### 22. Unsave Article

Remove bookmark from article (requires authentication).

**Endpoint:** `DELETE /api/articles/:id/save`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Example Request:**
```
DELETE /api/articles/1/save
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Article unsaved successfully"
}
```

---

## Preference Endpoints

### 23. Get User Preferences

Retrieve user's news preferences (requires authentication).

**Endpoint:** `GET /api/preferences`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "preferences": {
    "id": 1,
    "user_id": 1,
    "name": "My News Preferences",
    "preferred_sources": [
      "TechCrunch",
      "BBC News",
      "CNN"
    ],
    "preferred_categories": [
      "technology",
      "business",
      "science"
    ],
    "preferred_authors": [
      "Jane Smith",
      "John Doe"
    ],
    "created_at": "2024-11-09T10:30:00.000Z",
    "updated_at": "2024-11-09T14:00:00.000Z"
  }
}
```

---

### 24. Update User Preferences

Update news preferences (requires authentication).

**Endpoint:** `PUT /api/preferences`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "preferred_sources": ["TechCrunch", "The Guardian", "New York Times"],
  "preferred_categories": ["technology", "science", "health"],
  "preferred_authors": ["Jane Smith", "John Analyst", "Tech Writer"]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "preferences": {
    "id": 1,
    "user_id": 1,
    "preferred_sources": ["TechCrunch", "The Guardian", "New York Times"],
    "preferred_categories": ["technology", "science", "health"],
    "preferred_authors": ["Jane Smith", "John Analyst", "Tech Writer"],
    "updated_at": "2024-11-09T15:00:00.000Z"
  }
}
```

---

### 25. Get Available Sources

Get list of all available news sources.

**Endpoint:** `GET /api/preferences/sources`

**Success Response (200):**
```json
{
  "success": true,
  "sources": [
    "BBC News",
    "CNN",
    "TechCrunch",
    "The Guardian",
    "New York Times",
    "Bloomberg",
    "Reuters",
    "Al Jazeera"
  ]
}
```

---

### 26. Get Available Categories

Get list of all available article categories.

**Endpoint:** `GET /api/preferences/categories`

**Success Response (200):**
```json
{
  "success": true,
  "categories": [
    "business",
    "entertainment",
    "general",
    "health",
    "science",
    "sports",
    "technology"
  ]
}
```

---

## Admin Endpoints

### 27. Get API Logs

Retrieve API request logs (requires authentication & admin role).

**Endpoint:** `GET /api/admin/api-logs`

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `source` (optional): Filter by API source

**Example Request:**
```
GET /api/admin/api-logs?page=1&limit=50
```

**Success Response (200):**
```json
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "api_name": "NewsAPI",
      "endpoint": "https://newsapi.org/v2/top-headlines",
      "method": "GET",
      "status_code": 200,
      "response_time_ms": 245,
      "articles_fetched": 20,
      "requested_at": "2024-11-09T10:00:00.000Z"
    },
    {
      "id": 2,
      "api_name": "Guardian",
      "endpoint": "https://content.guardianapis.com/search",
      "method": "GET",
      "status_code": 200,
      "response_time_ms": 310,
      "articles_fetched": 15,
      "requested_at": "2024-11-09T10:05:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

---

### 28. Get API Statistics

Get API usage statistics (requires authentication & admin role).

**Endpoint:** `GET /api/admin/api-logs/stats`

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 7)

**Example Request:**
```
GET /api/admin/api-logs/stats?days=30
```

**Success Response (200):**
```json
{
  "success": true,
  "statistics": {
    "period": "Last 30 days",
    "total_requests": 450,
    "successful_requests": 425,
    "failed_requests": 25,
    "success_rate": 94.44,
    "average_response_time_ms": 278,
    "total_articles_fetched": 8500,
    "by_source": {
      "NewsAPI": {
        "requests": 200,
        "articles_fetched": 4000,
        "average_response_time_ms": 250
      },
      "Guardian": {
        "requests": 150,
        "articles_fetched": 2250,
        "average_response_time_ms": 300
      },
      "NYT": {
        "requests": 100,
        "articles_fetched": 2250,
        "average_response_time_ms": 285
      }
    }
  }
}
```

---

### 29. Get Logs by Source

Get API logs filtered by specific source (requires authentication & admin role).

**Endpoint:** `GET /api/admin/api-logs/source/:source`

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Example Request:**
```
GET /api/admin/api-logs/source/NewsAPI
```

**Success Response (200):**
```json
{
  "success": true,
  "source": "NewsAPI",
  "logs": [
    {
      "id": 1,
      "api_name": "NewsAPI",
      "endpoint": "https://newsapi.org/v2/top-headlines",
      "status_code": 200,
      "response_time_ms": 245,
      "articles_fetched": 20,
      "requested_at": "2024-11-09T10:00:00.000Z"
    }
  ],
  "total": 45
}
```

---

### 30. Cleanup Old Logs

Delete old API logs (requires authentication & admin role).

**Endpoint:** `DELETE /api/admin/api-logs/cleanup`

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "days": 90
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Old logs cleaned up successfully",
  "deleted_count": 150
}
```

---

## Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "error": "Detailed error (only in development)"
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input/validation error |
| 401 | Unauthorized - Authentication required or failed |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

---

## Rate Limiting

All endpoints are rate-limited:

**Default Limits:**
- 100 requests per 15 minutes per IP address

**Auth Endpoints:**
- Login/Register: 5 requests per 15 minutes per IP

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699534800
```

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Expiration:**
- Access Token: 24 hours
- Refresh Token: 30 days

---

## Pagination

List endpoints return paginated results:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Complete Endpoint List

### Authentication (14 endpoints)
1. POST `/api/auth/register` - Register
2. POST `/api/auth/login` - Login
3. POST `/api/auth/logout` - Logout
4. GET `/api/auth/me` - Get profile
5. PUT `/api/auth/profile` - Update profile
6. PUT `/api/auth/change-password` - Change password
7. POST `/api/auth/forget-password` - Forgot password
8. POST `/api/auth/reset-password` - Reset password
9. GET `/api/auth/google` - Google OAuth
10. GET `/api/auth/google/callback` - Google callback
11. GET `/api/auth/facebook` - Facebook OAuth
12. GET `/api/auth/facebook/callback` - Facebook callback
13. GET `/api/auth/twitter` - Twitter OAuth
14. GET `/api/auth/twitter/callback` - Twitter callback

### Articles (8 endpoints)
15. GET `/api/articles` - Get all articles
16. GET `/api/articles/:id` - Get article by ID
17. GET `/api/articles/search` - Search articles
18. GET `/api/articles/filter` - Filter articles
19. GET `/api/articles/personalized` - Personalized feed
20. GET `/api/articles/saved` - Get saved articles
21. POST `/api/articles/:id/save` - Save article
22. DELETE `/api/articles/:id/save` - Unsave article

### Preferences (4 endpoints)
23. GET `/api/preferences` - Get preferences
24. PUT `/api/preferences` - Update preferences
25. GET `/api/preferences/sources` - Get sources
26. GET `/api/preferences/categories` - Get categories

### Admin (4 endpoints)
27. GET `/api/admin/api-logs` - Get API logs
28. GET `/api/admin/api-logs/stats` - Get statistics
29. GET `/api/admin/api-logs/source/:source` - Get logs by source
30. DELETE `/api/admin/api-logs/cleanup` - Cleanup logs

**Total: 30 API Endpoints**

---

## Quick Testing with cURL

### Register
```bash
curl -X POST http://localhost:5080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:5080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Get Articles
```bash
curl http://localhost:5080/api/articles?page=1&limit=10
```

### Get Profile (with token)
```bash
curl http://localhost:5080/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Postman Collection

Import this URL into Postman for ready-to-use API collection:
```
http://localhost:5080/api-docs/swagger.json
```

Or access interactive documentation at:
```
http://localhost:5080/api-docs
```

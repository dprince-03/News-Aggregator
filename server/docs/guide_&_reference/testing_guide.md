# Complete Testing Guide for News Aggregator API

## 📦 Test Files Created

1. ✅ **auth.test.js** - Authentication (register, login, profile, password)
2. ✅ **articles.test.js** - Articles (CRUD, search, filter, save)
3. ✅ **preferences.test.js** - User preferences
4. ✅ **admin.test.js** - Admin endpoints (logs, stats)
5. ✅ **models.test.js** - Database models
6. ✅ **services.test.js** - External API services
7. ✅ **integration.test.js** - Complete user journey

---

## 🚀 Quick Setup

### Step 1: Install Test Dependencies

```bash
npm install --save-dev jest supertest @types/jest cross-env
```

### Step 2: Update package.json

```json
{
  "scripts": {
    "test": "cross-env NODE_ENV=test jest --detectOpenHandles --forceExit",
    "test:watch": "cross-env NODE_ENV=test jest --watch",
    "test:coverage": "cross-env NODE_ENV=test jest --coverage",
    "test:auth": "cross-env NODE_ENV=test jest tests/auth.test.js",
    "test:articles": "cross-env NODE_ENV=test jest tests/articles.test.js",
    "test:preferences": "cross-env NODE_ENV=test jest tests/preferences.test.js",
    "test:admin": "cross-env NODE_ENV=test jest tests/admin.test.js",
    "test:models": "cross-env NODE_ENV=test jest tests/models.test.js",
    "test:integration": "cross-env NODE_ENV=test jest tests/integration.test.js"
  },
  "jest": {
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": ["/node_modules/"],
    "testTimeout": 30000,
    "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"]
  }
}
```

### Step 3: Create Test Database

```sql
CREATE DATABASE news_aggregator_test;
```

### Step 4: Create .env.test

```env
# Test Environment
NODE_ENV=test
PORT=5081

# Test Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=news_aggregator_test
DB_USER=root
DB_PASSWORD=your_password

# JWT Secrets (different from production)
JWT_SECRET=test_jwt_secret_minimum_32_characters_long
JWT_REFRESH_SECRET=test_refresh_secret_32_chars
SESSION_SECRET=test_session_secret_32_chars

# Disable features in tests
ENABLE_CRON=false
ENABLE_DB_LOGGING=false

# API Keys (optional - tests skip if not provided)
NEWSAPI_KEY=
GUARDIAN_API_KEY=
NYT_API_KEY=
```

### Step 5: Create Test Setup File

```bash
mkdir -p tests
touch tests/setup.js
```

Copy the setup code from the artifact above.

### Step 6: Run Database Migrations

```bash
# Run your SQL schema on test database
mysql -u root -p news_aggregator_test < news_aggregator.sql
```

---

## 🧪 Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm run test:auth          # Authentication tests
npm run test:articles      # Articles tests
npm run test:preferences   # Preferences tests
npm run test:admin         # Admin tests
npm run test:models        # Model tests
npm run test:integration   # Integration tests
```

### Run in Watch Mode (Development)
```bash
npm run test:watch
```

### Run with Coverage Report
```bash
npm run test:coverage
```

### View Coverage Report
```bash
# After running coverage
open coverage/lcov-report/index.html
# or
start coverage/lcov-report/index.html  # Windows
```

---

## 📊 Test Coverage

### What Each Test File Covers:

#### 1. **auth.test.js** (50+ tests)
- ✅ User registration
- ✅ Login/logout
- ✅ Get/update profile
- ✅ Change password
- ✅ Password reset
- ✅ Token validation
- ✅ Error handling

#### 2. **articles.test.js** (40+ tests)
- ✅ Get all articles
- ✅ Get single article
- ✅ Search articles
- ✅ Filter articles
- ✅ Save/unsave articles
- ✅ Get saved articles
- ✅ Personalized feed
- ✅ Pagination

#### 3. **preferences.test.js** (15+ tests)
- ✅ Get preferences
- ✅ Update preferences
- ✅ Get available sources
- ✅ Get available categories
- ✅ Validation

#### 4. **admin.test.js** (15+ tests)
- ✅ Get API statistics
- ✅ Get API logs
- ✅ Filter logs by source
- ✅ Cleanup old logs
- ✅ Authorization

#### 5. **models.test.js** (30+ tests)
- ✅ User model (create, hash password, validate)
- ✅ Article model (CRUD, search, filter)
- ✅ Preference model (create, update)
- ✅ SavedArticle model (save, unsave, get)
- ✅ Relationships

#### 6. **services.test.js** (10+ tests)
- ✅ NewsAPI service
- ✅ Guardian API service
- ✅ NYT API service
- ✅ Aggregator service
- ⚠️ Skips if API keys not configured

#### 7. **integration.test.js** (1 comprehensive test)
- ✅ Complete user journey
- ✅ All features end-to-end
- ✅ Real-world scenario

---

## 📝 Example Test Output

### Successful Run:
```
 PASS  tests/auth.test.js
  Authentication API Tests
    POST /api/auth/register
      ✓ Should register a new user successfully (245ms)
      ✓ Should fail with duplicate email (89ms)
      ✓ Should fail with invalid email (65ms)
      ✓ Should fail with weak password (72ms)
    POST /api/auth/login
      ✓ Should login successfully (156ms)
      ✓ Should fail with incorrect password (98ms)
      ✓ Should fail with non-existent user (87ms)
    GET /api/auth/me
      ✓ Should get user profile with valid token (45ms)
      ✓ Should fail without token (32ms)

 PASS  tests/articles.test.js (8.234s)
 PASS  tests/preferences.test.js (4.567s)
 PASS  tests/models.test.js (3.891s)

Test Suites: 7 passed, 7 total
Tests:       160 passed, 160 total
Snapshots:   0 total
Time:        25.432s
```

### With Coverage:
```
-----------------|---------|----------|---------|---------|-------------------
File             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines
-----------------|---------|----------|---------|---------|-------------------
All files        |   87.5  |   82.3   |   91.2  |   88.1  |
 controllers     |   92.1  |   85.6   |   95.3  |   93.2  |
  auth.js        |   94.5  |   88.2   |   96.7  |   95.1  | 45-48
  article.js     |   91.3  |   84.1   |   94.8  |   92.5  | 67-72,156
 models          |   88.7  |   81.5   |   89.3  |   89.9  |
  User.js        |   95.2  |   90.1   |   94.6  |   96.3  |
  Article.js     |   89.4  |   79.8   |   88.2  |   90.1  |
 services        |   78.4  |   72.1   |   81.5  |   79.6  |
  newsApi.js     |   82.1  |   75.3   |   85.7  |   83.4  | 89-95
-----------------|---------|----------|---------|---------|-------------------
```

---

## 🐛 Debugging Failed Tests

### Check Test Logs
```bash
npm test -- --verbose
```

### Run Single Test
```bash
npm test -- --testNamePattern="Should register a new user"
```

### Common Issues & Fixes

#### Issue 1: Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution:**
- Make sure MySQL is running
- Check database credentials in .env.test
- Create test database: `CREATE DATABASE news_aggregator_test;`

#### Issue 2: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5080
```
**Solution:**
- Stop other running instances
- Change PORT in .env.test
- Or run: `killall node` (Mac/Linux)

#### Issue 3: Tests Hanging
```
Jest did not exit one second after the test run completed
```
**Solution:**
- Add `--detectOpenHandles --forceExit` to jest command
- Make sure to close database connections in afterAll()

#### Issue 4: Unique Constraint Errors
```
Error: ER_DUP_ENTRY: Duplicate entry
```
**Solution:**
- Clean test data in beforeEach/afterEach
- Use unique emails/URLs with timestamps
- Run: `TRUNCATE TABLE users;` on test database

---

## 🎯 Best Practices

### 1. Isolate Tests
```javascript
// ❌ BAD - Tests affect each other
describe('Tests', () => {
    let sharedUser; // Don't share state
    
    test('Test 1', async () => {
        sharedUser = await User.create(...);
    });
    
    test('Test 2', async () => {
        // Uses sharedUser - depends on Test 1
    });
});

// ✅ GOOD - Tests are independent
describe('Tests', () => {
    let testUser;
    
    beforeEach(async () => {
        testUser = await User.create(...);
    });
    
    afterEach(async () => {
        await User.destroy({ where: { id: testUser.id } });
    });
});
```

### 2. Use Descriptive Test Names
```javascript
// ❌ BAD
test('login works', async () => { ... });

// ✅ GOOD
test('Should login successfully with valid credentials', async () => { ... });
```

### 3. Test Both Success and Failure
```javascript
describe('POST /api/auth/register', () => {
    test('Should register successfully', async () => { ... });
    test('Should fail with invalid email', async () => { ... });
    test('Should fail with weak password', async () => { ... });
    test('Should fail with duplicate email', async () => { ... });
});
```

### 4. Clean Up Test Data
```javascript
afterEach(async () => {
    // Clean up after each test
    await User.destroy({ where: { email: testEmail }, force: true });
});

afterAll(async () => {
    // Close connections
    await sequelize.close();
});
```

### 5. Use Environment Variables
```javascript
// Use .env.test for test configuration
const dbName = process.env.DB_NAME; // news_aggregator_test
```

---

## 📈 Continuous Integration (CI)

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: news_aggregator_test
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
        env:
          DB_HOST: 127.0.0.1
          DB_USER: root
          DB_PASSWORD: root
          DB_NAME: news_aggregator_test
          JWT_SECRET: test_secret_key
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## 🔍 Manual Testing with Postman

### Create Postman Collection

1. **Setup Environment Variables**
```json
{
  "baseUrl": "http://localhost:5080",
  "token": ""
}
```

2. **Register User**
```
POST {{baseUrl}}/api/auth/register
Body: { "email": "test@example.com", "password": "Test123!@#", "name": "Test User" }
```

3. **Login**
```
POST {{baseUrl}}/api/auth/login
Body: { "email": "test@example.com", "password": "Test123!@#" }
Tests: pm.environment.set("token", pm.response.json().data.token);
```

4. **Get Profile**
```
GET {{baseUrl}}/api/auth/me
Headers: Authorization: Bearer {{token}}
```

---

## 📊 Test Coverage Goals

| Component | Target | Current |
|-----------|--------|---------|
| Controllers | 90%+ | - |
| Models | 85%+ | - |
| Services | 75%+ | - |
| Routes | 90%+ | - |
| Middleware | 85%+ | - |
| Overall | 85%+ | - |

---

## 🎓 Summary

### Test Files:
- ✅ 7 test suites
- ✅ 160+ individual tests
- ✅ All major features covered
- ✅ Integration tests included

### To Run Tests:
```bash
# 1. Install dependencies
npm install --save-dev jest supertest cross-env

# 2. Create test database
CREATE DATABASE news_aggregator_test;

# 3. Configure .env.test

# 4. Run tests
npm test
```

### Next Steps:
1. Add more edge case tests
2. Test OAuth flows (if configured)
3. Add performance tests
4. Setup CI/CD pipeline
5. Monitor test coverage

**Happy Testing! 🧪✨**
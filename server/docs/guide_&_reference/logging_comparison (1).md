# Logging Systems - Complete Comparison & Setup

## 🎯 Understanding Your Two Logging Systems

### System 1: Winston (File Logging)
**Purpose**: Development, debugging, error tracking
**Storage**: Files in `logs/` directory
**Best For**: 
- Application errors
- Debug information  
- Request/response tracking
- Security events

### System 2: ApiLog Model (Database Logging)
**Purpose**: Analytics, monitoring, statistics
**Storage**: MySQL `api_logs` table
**Best For**:
- API performance metrics
- External API call tracking
- Usage statistics
- Dashboard/reporting

---

## 📊 Side-by-Side Comparison

| Feature | Winston Logger | ApiLog Model |
|---------|----------------|--------------|
| **Storage** | Files (`.log`) | MySQL Database |
| **Format** | JSON/Text | Structured rows |
| **Query** | File search | SQL queries |
| **Retention** | 14 days (auto-delete) | Unlimited |
| **Performance** | Very fast | Slightly slower |
| **Analytics** | Difficult | Easy (SQL) |
| **Cost** | Low (disk) | Higher (DB) |
| **Best For** | Debugging | Reporting |

---

## 🔄 How They Work Together

```
External API Request (e.g., NewsAPI)
           ↓
    ┌──────┴──────┐
    ↓             ↓
Winston        ApiLog
(file)         (database)
    ↓             ↓
logs/          api_logs
*.log          table
```

---

## 💾 What Gets Logged Where

### Winston File Logs:
```javascript
✅ Application errors
✅ Server startup/shutdown
✅ User authentication attempts
✅ Internal app events
✅ Debug messages
✅ Security events
✅ ALL HTTP requests (optional)
```

### Database Logs (ApiLog):
```javascript
✅ NewsAPI requests
✅ Guardian API requests  
✅ NYT API requests
✅ API response times
✅ API status codes
✅ Performance metrics
```

---

## 🚀 Complete Setup

### Step 1: Install Dependencies
```bash
npm install winston winston-daily-rotate-file
```

### Step 2: Update .env
```env
# Logging Configuration
LOG_LEVEL=info              # debug, info, warn, error
ENABLE_DB_LOGGING=true      # Enable database logging
```

### Step 3: Your Services Already Log to Database!

✅ **Already done in**:
- `src/services/news_api.services.js`
- `src/services/guardian.services.js`
- `src/services/nyt.services.js`

Each service calls:
```javascript
await ApiLog.logRequest({
    api_source: 'NewsAPI',
    endpoint: '/top-headlines',
    status_code: 200,
    response_time_ms: 245
});
```

### Step 4: Test It!

```bash
# Start server
npm run dev

# Make API call (triggers logging)
# Then check:

# 1. File logs
cat logs/combined-2024-01-15.log

# 2. Database logs
mysql> SELECT * FROM api_logs ORDER BY created_at DESC LIMIT 10;
```

---

## 📈 Viewing Database Logs

### Method 1: Direct SQL Query

```sql
-- View all logs
SELECT * FROM api_logs 
ORDER BY created_at DESC 
LIMIT 20;

-- Get statistics by source
SELECT 
    api_source,
    COUNT(*) as total_requests,
    AVG(response_time_ms) as avg_response_time,
    MAX(response_time_ms) as max_response_time
FROM api_logs
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY api_source;

-- Get failed requests
SELECT * FROM api_logs 
WHERE status_code >= 400
ORDER BY created_at DESC;
```

### Method 2: Using Sequelize (in code)

```javascript
const { ApiLog } = require('./models');

// Get last 7 days statistics
const stats = await ApiLog.getApiStats(7);
console.table(stats);

// Get logs by date range
const logs = await ApiLog.getLogsByDateRange(
    '2024-01-01',
    '2024-01-31',
    'NewsAPI' // Optional: filter by source
);

// Get recent logs
const recent = await ApiLog.findAll({
    limit: 20,
    order: [['created_at', 'DESC']]
});
```

### Method 3: Create Admin Dashboard (Optional)

Create endpoint to view logs:

```javascript
// src/routes/admin.routes.js
router.get('/api/admin/stats', async (req, res) => {
    const stats = await ApiLog.getApiStats(7);
    res.json({ success: true, data: stats });
});
```

---

## 📁 Log Files Location

After running your app:

```
logs/
├── .gitkeep                    ✅ Tracked by Git
├── combined-2024-01-15.log     ❌ Ignored (in .gitignore)
├── error-2024-01-15.log        ❌ Ignored
├── access-2024-01-15.log       ❌ Ignored
└── combined-2024-01-16.log     ❌ Ignored
```

---

## 🎯 Best Practices

### DO ✅

1. **Log External API Calls to Database**
   ```javascript
   // In news services
   await ApiLog.logRequest({...});
   ```

2. **Log App Events to Files**
   ```javascript
   logger.info('User logged in', { userId: 123 });
   logger.error('Database error', { error: err.message });
   ```

3. **Use Appropriate Log Levels**
   ```javascript
   logger.debug('Detailed info');  // Development only
   logger.info('General info');    // Production
   logger.warn('Warnings');        // Potential issues
   logger.error('Errors');         // Actual errors
   ```

4. **Query Database Logs for Analytics**
   ```javascript
   // Get performance metrics
   const stats = await ApiLog.getApiStats(30);
   ```

### DON'T ❌

1. **Don't Log Sensitive Data**
   ```javascript
   ❌ logger.info('Login', { password: '...' });
   ✅ logger.info('Login', { userId: 123 });
   ```

2. **Don't Log Every Database Query**
   ```javascript
   ❌ logger.info('SELECT * FROM users'); // Too verbose
   ```

3. **Don't Forget to Clean Old Logs**
   ```bash
   # File logs auto-delete after 14 days
   # Database logs need manual cleanup
   ```

---

## 🔍 Example Scenarios

### Scenario 1: Debugging an Error

**Use Winston File Logs:**
```bash
# View error logs
tail -f logs/error-2024-01-15.log

# Search for specific error
grep "Database connection" logs/combined-*.log
```

### Scenario 2: API Performance Report

**Use Database Logs:**
```javascript
const stats = await ApiLog.getApiStats(30);

// Output:
// NewsAPI: 1,234 requests, avg 245ms
// Guardian: 987 requests, avg 312ms
// NYT: 756 requests, avg 450ms
```

### Scenario 3: Finding Slow Requests

**Use Database:**
```sql
SELECT * FROM api_logs 
WHERE response_time_ms > 1000
ORDER BY response_time_ms DESC
LIMIT 10;
```

---

## 📊 Sample Database Output

```sql
mysql> SELECT * FROM api_logs ORDER BY created_at DESC LIMIT 5;

+----+-----------------+------------------+-------------+------------------+---------------------+
| id | api_source      | endpoint         | status_code | response_time_ms | created_at          |
+----+-----------------+------------------+-------------+------------------+---------------------+
|  1 | NewsAPI         | /top-headlines   |         200 |              245 | 2024-01-15 10:30:15 |
|  2 | The Guardian    | /search          |         200 |              312 | 2024-01-15 10:30:20 |
|  3 | New York Times  | /topstories      |         200 |              450 | 2024-01-15 10:30:25 |
|  4 | NewsAPI         | /everything      |         429 |              150 | 2024-01-15 10:35:10 |
|  5 | The Guardian    | /search          |         200 |              290 | 2024-01-15 10:40:05 |
+----+-----------------+------------------+-------------+------------------+---------------------+
```

---

## 🛠️ Maintenance

### Clean Old Database Logs

```javascript
// Create cleanup script: scripts/cleanup-db-logs.js
const { ApiLog } = require('../src/models');
const { Op } = require('sequelize');

const cleanupOldLogs = async (daysToKeep = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const deleted = await ApiLog.destroy({
        where: {
            created_at: {
                [Op.lt]: cutoffDate
            }
        }
    });
    
    console.log(`Deleted ${deleted} old log entries`);
};

cleanupOldLogs();
```

Add to package.json:
```json
{
  "scripts": {
    "logs:cleanup-db": "node scripts/cleanup-db-logs.js"
  }
}
```

---

## 🎓 Summary

### Winston (Files):
- ✅ **Fast** - No database overhead
- ✅ **Simple** - Just write to file
- ✅ **Auto-cleanup** - Rotates daily, deletes after 14 days
- ❌ **Hard to query** - Need to parse text files
- ❌ **No analytics** - Can't aggregate easily

### ApiLog (Database):
- ✅ **Easy queries** - Use SQL
- ✅ **Analytics ready** - Aggregate, filter, report
- ✅ **Structured data** - Consistent format
- ❌ **Slower** - Database write overhead
- ❌ **Manual cleanup** - Need to delete old records

### Use Both!
- **Files**: For debugging, errors, general logs
- **Database**: For API metrics, performance, analytics

---

## ✅ Verification Checklist

```bash
- [ ] Winston logger created (src/utils/logger.utils.js)
- [ ] logs/ directory exists with .gitkeep
- [ ] .gitignore ignores *.log files
- [ ] ENABLE_DB_LOGGING in .env
- [ ] ApiLog model exists
- [ ] api_logs table in database
- [ ] Services log to database
- [ ] Can view logs: SELECT * FROM api_logs;
- [ ] Log files being created in logs/
```

---

## 🎯 Quick Test

```javascript
// Test file: test-logging.js
const logger = require('./src/utils/logger.utils');
const { ApiLog } = require('./src/models');

const testLogging = async () => {
    // Test Winston (file)
    logger.info('Testing Winston logger');
    logger.error('Testing error log');
    
    // Test Database
    await ApiLog.logRequest({
        api_source: 'Test',
        endpoint: '/test',
        status_code: 200,
        response_time_ms: 100
    });
    
    // View database logs
    const logs = await ApiLog.findAll({ limit: 5 });
    console.log('Database logs:', logs);
    
    console.log('✅ Both logging systems working!');
};

testLogging();
```

Run:
```bash
node test-logging.js
```

Check:
1. **File**: `logs/combined-*.log` has new entries
2. **Database**: `SELECT * FROM api_logs` shows test entry

**Both working? You're all set! 🎉**
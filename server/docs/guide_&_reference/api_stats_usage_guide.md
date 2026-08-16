# Where & How to Use API Stats - Complete Guide

## 🎯 3 Ways to View API Statistics

---

## ✅ METHOD 1: Via API Endpoint (RECOMMENDED)

### Setup:
Already done! Just add to your server.js:

```javascript
// server.js
const adminRouter = require('./src/routes/admin.routes');
app.use('/api/admin', adminRouter);
```

### Usage:
```bash
# Start server
npm run dev

# Visit in browser or Postman:
http://localhost:5080/api/admin/api-logs/stats?days=7
```

### Response:
```json
{
  "success": true,
  "message": "API statistics retrieved successfully",
  "data": {
    "period": "Last 7 days",
    "summary": {
      "totalLogs": 234,
      "recentLogs": 156,
      "errorCount": 3,
      "successRate": "98.08%"
    },
    "bySource": [
      {
        "source": "NewsAPI",
        "requests": 87,
        "avgResponseTime": "245.50ms",
        "maxResponseTime": "890ms"
      },
      {
        "source": "The Guardian",
        "requests": 45,
        "avgResponseTime": "312.80ms",
        "maxResponseTime": "1200ms"
      },
      {
        "source": "New York Times",
        "requests": 24,
        "avgResponseTime": "450.20ms",
        "maxResponseTime": "1500ms"
      }
    ]
  }
}
```

### All Available Endpoints:

```bash
# Get statistics
GET /api/admin/api-logs/stats?days=7

# Get all logs (paginated)
GET /api/admin/api-logs?page=1&limit=50&source=NewsAPI

# Get logs by specific source
GET /api/admin/api-logs/source/NewsAPI?page=1&limit=20

# Cleanup old logs
DELETE /api/admin/api-logs/cleanup
Body: { "days": 30 }
```

**✅ BEST FOR**: Production use, dashboards, API consumers

---

## ✅ METHOD 2: CLI Script (For Quick Checks)

### Create Script:

```bash
# Create file
mkdir -p scripts
touch scripts/view-api-stats.js
```

```javascript
// scripts/view-api-stats.js
require('dotenv').config();
const { ApiLog, sequelize } = require('../src/models');

const viewApiStats = async () => {
    try {
        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Connected to database\n');
        
        // Get stats for last 7 days
        const stats = await ApiLog.getApiStats(7);
        
        if (stats.length === 0) {
            console.log('📊 No API logs found in the last 7 days');
            console.log('💡 Run your cron job or make some API calls first\n');
            process.exit(0);
        }
        
        console.log('📊 API Statistics (Last 7 Days):');
        console.log('═'.repeat(80));
        
        // Format for console.table
        const formatted = stats.map(stat => ({
            'API Source': stat.api_source,
            'Total Requests': parseInt(stat.request_count),
            'Avg Response': parseFloat(stat.avg_response_time).toFixed(2) + ' ms',
            'Max Response': parseInt(stat.max_response_time) + ' ms'
        }));
        
        console.table(formatted);
        
        // Calculate totals
        const totalRequests = stats.reduce((sum, stat) => sum + parseInt(stat.request_count), 0);
        const avgTime = stats.reduce((sum, stat) => sum + parseFloat(stat.avg_response_time), 0) / stats.length;
        
        console.log('\n📈 Summary:');
        console.log(`   Total Requests: ${totalRequests}`);
        console.log(`   Overall Avg Response Time: ${avgTime.toFixed(2)} ms`);
        console.log('');
        
        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

// Add command line arguments
const args = process.argv.slice(2);
const days = args[0] ? parseInt(args[0]) : 7;

viewApiStats();
```

### Add to package.json:

```json
{
  "scripts": {
    "stats": "node scripts/view-api-stats.js",
    "stats:7": "node scripts/view-api-stats.js 7",
    "stats:30": "node scripts/view-api-stats.js 30"
  }
}
```

### Usage:

```bash
# View last 7 days
npm run stats

# View last 30 days
npm run stats:30

# Or directly
node scripts/view-api-stats.js 14
```

### Output:
```
✅ Connected to database

📊 API Statistics (Last 7 Days):
════════════════════════════════════════════════════════════════════════════════
┌─────────┬─────────────────┬─────────────────┬──────────────┬──────────────┐
│ (index) │   API Source    │ Total Requests  │ Avg Response │ Max Response │
├─────────┼─────────────────┼─────────────────┼──────────────┼──────────────┤
│    0    │   'NewsAPI'     │       87        │ '245.50 ms'  │   '890 ms'   │
│    1    │ 'The Guardian'  │       45        │ '312.80 ms'  │  '1200 ms'   │
│    2    │'New York Times' │       24        │ '450.20 ms'  │  '1500 ms'   │
└─────────┴─────────────────┴─────────────────┴──────────────┴──────────────┘

📈 Summary:
   Total Requests: 156
   Overall Avg Response Time: 336.17 ms
```

**✅ BEST FOR**: Development, debugging, quick checks

---

## ✅ METHOD 3: In Cron Job (Automatic Logging)

### Update fetchArticles.jobs.js:

```javascript
// src/jobs/fetchArticles.jobs.js
const cron = require('node-cron');
const { fetchAndSaveArticles } = require('../services/aggregator.services');
const { ApiLog } = require('../models');

const startArticleFetchJob = () => {
    const schedule = '0 * * * *'; // Every hour
    
    console.log('📅 Starting article fetch cron job...');
    console.log(`   Schedule: Every hour`);
    
    const job = cron.schedule(schedule, async () => {
        console.log('\n' + '='.repeat(60));
        console.log(`🤖 [CRON] Fetching articles - ${new Date().toISOString()}`);
        console.log('='.repeat(60));
        
        try {
            const result = await fetchAndSaveArticles();
            
            if (result.success) {
                console.log(`✅ [CRON] Success: ${result.fetched} fetched, ${result.saved} saved`);
                
                // 🎯 Show stats after each fetch
                console.log('\n📊 API Usage (Today):');
                const todayStats = await ApiLog.getApiStats(1);
                
                if (todayStats.length > 0) {
                    todayStats.forEach(stat => {
                        const avgTime = parseFloat(stat.avg_response_time).toFixed(0);
                        console.log(`   ${stat.api_source.padEnd(20)} ${stat.request_count.padStart(4)} requests, avg ${avgTime.padStart(4)}ms`);
                    });
                } else {
                    console.log('   No API calls yet today');
                }
            } else {
                console.error(`❌ [CRON] Failed: ${result.error}`);
            }
        } catch (error) {
            console.error('❌ [CRON] Error:', error.message);
        }
        
        console.log('='.repeat(60) + '\n');
    });
    
    console.log('✅ Article fetch job started successfully\n');
    
    return job;
};

module.exports = {
    startArticleFetchJob,
};
```

### Output (in console every hour):

```
============================================================
🤖 [CRON] Fetching articles - 2024-01-15T14:00:00.000Z
============================================================
📰 Fetching articles from all sources...
✅ NewsAPI: 20 articles
✅ The Guardian: 20 articles
✅ NYT: 20 articles
📊 Total articles fetched: 60
✅ Saved 58 articles to database
✅ [CRON] Success: 60 fetched, 58 saved

📊 API Usage (Today):
   NewsAPI              12 requests, avg  245ms
   The Guardian          8 requests, avg  310ms
   New York Times        6 requests, avg  445ms
============================================================
```

**✅ BEST FOR**: Monitoring, automatic tracking

---

## 🎯 Which Method to Use When?

| Scenario | Best Method | Why |
|----------|-------------|-----|
| **Building a dashboard** | Method 1 (API) | Easy to integrate with frontend |
| **Quick check in terminal** | Method 2 (CLI) | Fast, no browser needed |
| **Monitoring cron jobs** | Method 3 (Auto) | See stats after each run |
| **Production monitoring** | Method 1 (API) | Can integrate with monitoring tools |
| **Debugging API issues** | Method 2 (CLI) | Quick access to detailed stats |

---

## 📋 Complete Setup Checklist

### 1. Update server.js:

```javascript
// Add this to your server.js
const adminRouter = require('./src/routes/admin.routes');
const articleRouter = require('./src/routes/article.routes');
const preferenceRouter = require('./src/routes/preference.routes');

// After existing routes
app.use('/api/admin', adminRouter);
app.use('/api/articles', articleRouter);
app.use('/api/preferences', preferenceRouter);
```

### 2. Create CLI script:

```bash
mkdir -p scripts
# Copy the script from Method 2 above
touch scripts/view-api-stats.js
```

### 3. Update package.json:

```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "stats": "node scripts/view-api-stats.js"
  }
}
```

### 4. Test each method:

```bash
# Method 1: API Endpoint
npm run dev
# Visit: http://localhost:5080/api/admin/api-logs/stats

# Method 2: CLI Script
npm run stats

# Method 3: Check cron job logs in console
```

---

## 🧪 Testing

### Generate Test Data:

```javascript
// scripts/generate-test-logs.js
require('dotenv').config();
const { ApiLog, sequelize } = require('../src/models');

const generateTestLogs = async () => {
    await sequelize.authenticate();
    
    const testLogs = [
        { api_source: 'NewsAPI', endpoint: '/top-headlines', status_code: 200, response_time_ms: 245 },
        { api_source: 'NewsAPI', endpoint: '/everything', status_code: 200, response_time_ms: 312 },
        { api_source: 'The Guardian', endpoint: '/search', status_code: 200, response_time_ms: 380 },
        { api_source: 'The Guardian', endpoint: '/search', status_code: 200, response_time_ms: 290 },
        { api_source: 'New York Times', endpoint: '/topstories', status_code: 200, response_time_ms: 450 },
        { api_source: 'NewsAPI', endpoint: '/top-headlines', status_code: 429, response_time_ms: 150 },
    ];
    
    await ApiLog.bulkCreate(testLogs);
    
    console.log('✅ Generated test logs');
    process.exit(0);
};

generateTestLogs();
```

Run:
```bash
node scripts/generate-test-logs.js
npm run stats
```

---

## 🎨 Frontend Integration Example

```javascript
// In your React/Vue/Angular app
const fetchApiStats = async () => {
    const response = await fetch('http://localhost:5080/api/admin/api-logs/stats?days=7', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    const data = await response.json();
    
    // Use data.data.bySource for charts
    // data.data.summary for metrics
};
```

---

## 💡 Pro Tips

1. **Use Method 1** for production monitoring and dashboards
2. **Use Method 2** during development for quick checks
3. **Use Method 3** to see stats after cron jobs run
4. **Combine all three** for comprehensive monitoring

---

## 🚀 Quick Start

```bash
# 1. Make sure you have the controllers
# (Already provided in the artifact above)

# 2. Update server.js to add routes
const adminRouter = require('./src/routes/admin.routes');
app.use('/api/admin', adminRouter);

# 3. Start server
npm run dev

# 4. Visit stats endpoint
curl http://localhost:5080/api/admin/api-logs/stats?days=7

# Or create CLI script and run
npm run stats
```

**Done! Pick the method that works best for you! 🎉**
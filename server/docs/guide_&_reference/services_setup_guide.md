# Services & Utils - Complete Setup Guide

## 📦 What Was Created

### Utils (src/utils/)
1. ✅ **emailServices.utils.js** - Send emails (password reset, welcome)
2. ✅ **helper.utils.js** - Utility functions (pagination, formatting, etc.)

### Services (src/services/)
3. ✅ **news_api.services.js** - NewsAPI integration
4. ✅ **guardian.services.js** - The Guardian API integration
5. ✅ **nyt.services.js** - New York Times API integration
6. ✅ **aggregator.services.js** - Combine all APIs

### Jobs (src/jobs/)
7. ✅ **fetchArticles.jobs.js** - Automated article fetching

---

## 🔧 Installation

### Install Additional Dependencies:

```bash
npm install nodemailer axios node-cron
```

---

## 📝 Environment Variables to Add

Add these to your `.env` file:

```env
# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@newsaggregator.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
APP_NAME=News Aggregator

# News API Keys (Get from respective websites)
NEWSAPI_KEY=your_newsapi_key_here
GUARDIAN_API_KEY=your_guardian_key_here
NYT_API_KEY=your_nyt_key_here

# Enable/Disable Cron Job
ENABLE_CRON=true
```

---

## 🔑 Getting API Keys

### 1. NewsAPI (FREE)
- Go to: https://newsapi.org/
- Click "Get API Key"
- **Free tier**: 100 requests/day

### 2. The Guardian (FREE)
- Go to: https://open-platform.theguardian.com/access/
- Register for an API key
- **Free tier**: 5,000 requests/day

### 3. New York Times (FREE)
- Go to: https://developer.nytimes.com/get-started
- Create account and get API key
- **Free tier**: 4,000 requests/day

---

## 📧 Email Setup (Gmail Example)

### Option 1: Gmail with App Password

1. Enable 2-Factor Authentication on Gmail
2. Generate App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password

3. Add to `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_char_app_password
```

### Option 2: Other Email Providers

**Outlook/Hotmail:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
```

**Yahoo:**
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
```

---

## 🚀 Usage Examples

### 1. Email Service

```javascript
const { sendPasswordResetEmail, sendWelcomeEmail } = require('./utils/emailServices.utils');

// Send password reset
await sendPasswordResetEmail('user@example.com', 'reset_token_here');

// Send welcome email
await sendWelcomeEmail('user@example.com', 'John Doe');
```

### 2. Helper Utils

```javascript
const { 
    paginate, 
    formatPaginationResponse,
    timeAgo,
    sanitizeSearchQuery 
} = require('./utils/helper.utils');

// Pagination
const { limit, offset, page } = paginate(1, 20);

// Format response
const response = formatPaginationResponse(articles, page, limit, totalCount);

// Time ago
const time = timeAgo('2024-01-01T12:00:00Z'); // "2 days ago"

// Sanitize search
const clean = sanitizeSearchQuery('<script>alert(1)</script>'); // "scriptalert1script"
```

### 3. News API Services

```javascript
const newsApiService = require('./services/news_api.services');

// Fetch top headlines
const headlines = await newsApiService.fetchTopHeadlines({
    category: 'technology',
    country: 'us',
    pageSize: 20
});

// Search articles
const results = await newsApiService.searchArticles('bitcoin', {
    from: '2024-01-01',
    to: '2024-01-31',
    pageSize: 20
});
```

### 4. Guardian Service

```javascript
const guardianService = require('./services/guardian.services');

// Fetch articles
const articles = await guardianService.fetchArticles({
    section: 'technology',
    pageSize: 20
});

// Get sections
const sections = await guardianService.getSections();
```

### 5. NYT Service

```javascript
const nytService = require('./services/nyt.services');

// Fetch top stories
const stories = await nytService.fetchTopStories('technology');

// Search articles
const results = await nytService.searchArticles('climate change', {
    begin_date: '20240101',
    end_date: '20240131'
});
```

### 6. Aggregator Service

```javascript
const aggregatorService = require('./services/aggregator.services');

// Fetch from all sources
const allArticles = await aggregatorService.fetchFromAllSources({
    category: 'technology',
    limit: 50
});

// Fetch and save to database
const result = await aggregatorService.fetchAndSaveArticles({
    category: 'business'
});
// Returns: { success: true, fetched: 150, saved: 145 }
```

### 7. Cron Job

```javascript
// In server.js
const { startArticleFetchJob, manualFetch } = require('./src/jobs/fetchArticles.jobs');

// Start automated fetching (every hour)
if (process.env.ENABLE_CRON === 'true') {
    startArticleFetchJob();
}

// Manually trigger fetch
const result = await manualFetch();
```

---

## 🔄 Enable Automated Article Fetching

### Update server.js:

```javascript
const { startArticleFetchJob } = require('./src/jobs/fetchArticles.jobs');

const start_server = async () => {
    try {
        // ... existing startup code
        
        // Start cron job after database connection
        if (process.env.ENABLE_CRON === 'true') {
            console.log('🤖 Starting automated article fetching...\n');
            startArticleFetchJob();
        }
        
        // ... rest of server code
    } catch (error) {
        // error handling
    }
};
```

### Set in .env:
```env
ENABLE_CRON=true
```

---

## 📊 API Logging

All API requests are automatically logged to the `api_logs` table:

```javascript
const { ApiLog } = require('./models');

// Get statistics
const stats = await ApiLog.getApiStats(7); // Last 7 days

// Get logs by date range
const logs = await ApiLog.getLogsByDateRange(
    '2024-01-01',
    '2024-01-31',
    'NewsAPI' // Optional: filter by source
);
```

---

## 🧪 Testing the Services

### Test Individual Services:

```bash
# Create test file: test-services.js
```

```javascript
require('dotenv').config();
const newsApiService = require('./src/services/news_api.services');
const guardianService = require('./src/services/guardian.services');
const nytService = require('./src/services/nyt.services');

const testServices = async () => {
    console.log('Testing NewsAPI...');
    const newsApiResult = await newsApiService.fetchTopHeadlines({ pageSize: 5 });
    console.log(`✅ NewsAPI: ${newsApiResult.articles.length} articles\n`);
    
    console.log('Testing Guardian...');
    const guardianResult = await guardianService.fetchArticles({ pageSize: 5 });
    console.log(`✅ Guardian: ${guardianResult.articles.length} articles\n`);
    
    console.log('Testing NYT...');
    const nytResult = await nytService.fetchTopStories();
    console.log(`✅ NYT: ${nytResult.articles.length} articles\n`);
};

testServices().catch(console.error);
```

Run:
```bash
node test-services.js
```

---

## 📋 Cron Schedule Options

Edit `src/jobs/fetchArticles.jobs.js` to change schedule:

```javascript
// Every hour
const schedule = '0 * * * *';

// Every 30 minutes
const schedule = '*/30 * * * *';

// Every day at midnight
const schedule = '0 0 * * *';

// Every day at 9 AM
const schedule = '0 9 * * *';

// Every Monday at 9 AM
const schedule = '0 9 * * 1';
```

---

## 🐛 Troubleshooting

### Problem: Email not sending

**Solution:**
1. Check Gmail App Password is correct
2. Enable "Less secure app access" (if needed)
3. Check EMAIL_USER and EMAIL_PASSWORD in .env
4. Run test:
```javascript
const { testEmailConfig } = require('./src/utils/emailServices.utils');
await testEmailConfig();
```

### Problem: API requests failing

**Solution:**
1. Verify API keys are correct in .env
2. Check API rate limits
3. Test individual services
4. Check internet connection

### Problem: Cron job not running

**Solution:**
1. Make sure ENABLE_CRON=true in .env
2. Check server logs for cron messages
3. Verify cron schedule syntax

---

## 📈 Performance Tips

### 1. Rate Limiting
```javascript
// Add delays between API calls
const { sleep } = require('./src/utils/helper.utils');
await sleep(1000); // Wait 1 second
```

### 2. Error Handling
```javascript
const { retry } = require('./src/utils/helper.utils');

// Retry failed requests
const result = await retry(async () => {
    return await someApiCall();
}, 3, 1000); // 3 retries, 1 second delay
```

### 3. Caching
Consider implementing Redis caching for frequently accessed articles.

---

## 🎯 Next Steps

1. ✅ **Add API keys to .env**
2. ✅ **Test each service individually**
3. ✅ **Enable cron job for automated fetching**
4. ✅ **Set up email service (optional)**
5. ✅ **Monitor API logs**

---

## 📚 Additional Resources

- NewsAPI Docs: https://newsapi.org/docs
- Guardian API Docs: https://open-platform.theguardian.com/documentation/
- NYT API Docs: https://developer.nytimes.com/docs
- Node-Cron: https://www.npmjs.com/package/node-cron
- Nodemailer: https://nodemailer.com/

---

## 💡 Pro Tips

1. **Start with one API first** - Get NewsAPI working before adding others
2. **Monitor rate limits** - Check API logs regularly
3. **Use cron wisely** - Don't fetch too frequently
4. **Handle errors gracefully** - APIs can fail, always have fallbacks
5. **Keep backups** - Store API keys securely

---

## 🔐 Security Reminders

- ✅ Never commit .env file
- ✅ Use app passwords, not actual passwords
- ✅ Rotate API keys periodically
- ✅ Monitor API usage
- ✅ Rate limit your endpoints
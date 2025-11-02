# Logs Directory & .gitkeep - Complete Guide

## 📁 What is .gitkeep?

**.gitkeep** is a convention used to keep empty directories in Git.

### Why Do We Need It?

Git **does not track empty directories**. If you have a `logs/` folder but no files in it, Git will ignore it completely.

```
❌ WITHOUT .gitkeep:
logs/           <- Git ignores this (empty directory)

✅ WITH .gitkeep:
logs/
  └── .gitkeep  <- Git tracks this file, keeping the directory
```

---

## 🎯 Purpose of logs/ Directory

The `logs/` directory stores application logs:

1. **Application Logs** - General app activity
2. **Error Logs** - Errors and exceptions
3. **Access Logs** - HTTP requests
4. **Debug Logs** - Development debugging
5. **Cron Logs** - Scheduled job outputs

---

## 🚀 Setup Instructions

### Step 1: Create logs/ Directory with .gitkeep

```bash
# In your project root
mkdir logs
touch logs/.gitkeep
```

Or manually:
```bash
cd news-aggregator-api
mkdir logs
echo "" > logs/.gitkeep
```

### Step 2: Create .gitkeep Content

```bash
# logs/.gitkeep
# This file keeps the logs directory in version control
# Actual log files are ignored via .gitignore
```

### Step 3: Update .gitignore

Add to your `.gitignore`:

```gitignore
# Logs
logs/*.log
logs/*.txt
logs/error-*
logs/access-*
logs/debug-*

# Keep the directory structure
!logs/.gitkeep

# Log files anywhere
*.log
*.log.*

# OS generated files
.DS_Store
Thumbs.db

# Environment files
.env
.env.local
.env.production
.env.backup.*

# Dependencies
node_modules/

# IDE files
.vscode/
.idea/
*.sublime-*

# Build files
dist/
build/
```

---

## 📝 Implementing Logging

### Install Winston (Logging Library)

```bash
npm install winston winston-daily-rotate-file
```

### Create Logger Utility

**File: src/utils/logger.utils.js**

```javascript
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format (for development)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += `\n${JSON.stringify(meta, null, 2)}`;
        }
        return msg;
    })
);

// Create transports
const transports = [
    // Console transport
    new winston.transports.Console({
        format: consoleFormat,
        level: process.env.LOG_LEVEL || 'info',
    }),

    // Error log file (rotates daily)
    new DailyRotateFile({
        filename: path.join('logs', 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '14d', // Keep for 14 days
        format: logFormat,
    }),

    // Combined log file (all levels)
    new DailyRotateFile({
        filename: path.join('logs', 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: logFormat,
    }),
];

// Create logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    exitOnError: false,
});

// Add request logging method
logger.logRequest = (req, res, responseTime) => {
    logger.info('HTTP Request', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
    });
};

// Add error logging method
logger.logError = (error, req = null) => {
    const errorLog = {
        message: error.message,
        stack: error.stack,
        ...(req && {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            body: req.body,
        }),
    };
    
    logger.error('Application Error', errorLog);
};

module.exports = logger;
```

---

## 🔧 Using the Logger

### 1. Basic Logging

```javascript
const logger = require('./utils/logger.utils');

// Info logs
logger.info('Server started successfully');
logger.info('User logged in', { userId: 123, email: 'user@example.com' });

// Warning logs
logger.warn('API rate limit approaching', { remaining: 10 });

// Error logs
logger.error('Database connection failed', { error: error.message });

// Debug logs (only in development)
logger.debug('Processing request', { data: someData });
```

### 2. HTTP Request Logging Middleware

```javascript
// server.js
const logger = require('./utils/logger.utils');

// Add request logging middleware
app.use((req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        logger.logRequest(req, res, responseTime);
    });
    
    next();
});
```

### 3. Error Logging

```javascript
// In error handler middleware
const logger = require('../utils/logger.utils');

const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.logError(err, req);
    
    // Send response
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message,
    });
};
```

### 4. Controller Logging

```javascript
const logger = require('../utils/logger.utils');

const createArticle = async (req, res) => {
    try {
        logger.info('Creating article', { 
            userId: req.user.id,
            title: req.body.title 
        });
        
        const article = await Article.create(req.body);
        
        logger.info('Article created successfully', { 
            articleId: article.id 
        });
        
        res.json({ success: true, data: article });
    } catch (error) {
        logger.error('Failed to create article', { 
            error: error.message,
            userId: req.user.id 
        });
        throw error;
    }
};
```

---

## 📊 Log File Structure

After implementation, your logs directory will look like:

```
logs/
├── .gitkeep                    (tracked by git)
├── combined-2024-01-15.log     (ignored by git)
├── combined-2024-01-16.log     (ignored by git)
├── error-2024-01-15.log        (ignored by git)
└── error-2024-01-16.log        (ignored by git)
```

---

## 🔍 Log Levels

```javascript
// In order of severity (least to most)
logger.debug('Detailed debug information');    // Level 5
logger.info('General information');             // Level 4
logger.warn('Warning messages');                // Level 3
logger.error('Error messages');                 // Level 2
logger.fatal('Critical errors');                // Level 1
```

Set log level in `.env`:
```env
LOG_LEVEL=info    # Production
LOG_LEVEL=debug   # Development
```

---

## 📋 Example Log Output

### Console (Development):
```
2024-01-15 10:30:45 [info]: Server started successfully
2024-01-15 10:30:50 [info]: HTTP Request {
  "method": "POST",
  "url": "/api/auth/login",
  "statusCode": 200,
  "responseTime": "145ms"
}
2024-01-15 10:31:00 [error]: Database connection failed {
  "error": "Connection timeout",
  "stack": "Error: Connection timeout\n    at ..."
}
```

### File (combined-2024-01-15.log):
```json
{
  "timestamp": "2024-01-15 10:30:45",
  "level": "info",
  "message": "Server started successfully"
}
{
  "timestamp": "2024-01-15 10:30:50",
  "level": "info",
  "message": "HTTP Request",
  "method": "POST",
  "url": "/api/auth/login",
  "statusCode": 200,
  "responseTime": "145ms"
}
```

---

## 🎯 Best Practices

### 1. ✅ DO:
- Log important events (auth, errors, API calls)
- Use appropriate log levels
- Include context (user ID, request ID)
- Rotate logs daily
- Keep logs for reasonable time (14-30 days)
- Never log sensitive data (passwords, tokens)

### 2. ❌ DON'T:
- Log on every function call (too verbose)
- Log passwords or API keys
- Log large payloads
- Keep logs forever (disk space)
- Log personally identifiable information (PII)

---

## 🧹 Log Cleanup Script

**File: scripts/cleanup-logs.js**

```javascript
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'logs');
const daysToKeep = 14;

const cleanupOldLogs = () => {
    const now = Date.now();
    const cutoffTime = now - (daysToKeep * 24 * 60 * 60 * 1000);

    fs.readdir(logsDir, (err, files) => {
        if (err) {
            console.error('Error reading logs directory:', err);
            return;
        }

        files.forEach(file => {
            if (file === '.gitkeep') return;

            const filePath = path.join(logsDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error(`Error checking file ${file}:`, err);
                    return;
                }

                if (stats.mtime.getTime() < cutoffTime) {
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error(`Error deleting ${file}:`, err);
                        } else {
                            console.log(`Deleted old log: ${file}`);
                        }
                    });
                }
            });
        });
    });
};

cleanupOldLogs();
```

Add to package.json:
```json
{
  "scripts": {
    "logs:clean": "node scripts/cleanup-logs.js"
  }
}
```

---

## 📦 Complete Setup Commands

```bash
# 1. Create logs directory
mkdir logs
echo "" > logs/.gitkeep

# 2. Install logging dependencies
npm install winston winston-daily-rotate-file

# 3. Create logger utility
# (Copy the code from above into src/utils/logger.utils.js)

# 4. Update .gitignore
# (Add log ignore patterns)

# 5. Test it
npm run dev
# Check logs/ directory for files
```

---

## 🔐 Security Considerations

### 1. Sanitize Logs
```javascript
const sanitizeForLog = (data) => {
    const sanitized = { ...data };
    
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.apiKey;
    delete sanitized.creditCard;
    
    return sanitized;
};

logger.info('User data', sanitizeForLog(userData));
```

### 2. Protect Log Files
```bash
# Set permissions (Linux/Mac)
chmod 640 logs/*.log  # Owner read/write, group read
```

---

## 🎓 Summary

| File/Directory | Purpose | Tracked by Git? |
|---------------|---------|-----------------|
| `logs/` | Directory for logs | Yes (because of .gitkeep) |
| `logs/.gitkeep` | Keeps directory in Git | Yes ✅ |
| `logs/*.log` | Actual log files | No ❌ (in .gitignore) |

**Key Points:**
- ✅ `.gitkeep` keeps the directory structure in Git
- ✅ Actual log files are ignored (in .gitignore)
- ✅ Use winston for robust logging
- ✅ Rotate logs daily
- ✅ Clean up old logs regularly
- ✅ Never log sensitive data

---

## 📚 Additional Resources

- Winston Docs: https://github.com/winstonjs/winston
- Log Rotation: https://github.com/winstonjs/winston-daily-rotate-file
- Best Practices: https://12factor.net/logs
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
        maxFiles: '14d',
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

    // Access log file (HTTP requests only)
    new DailyRotateFile({
        filename: path.join('logs', 'access-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'http',
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

// NEW: Enhanced request logging with database option
logger.logRequest = async (req, res, responseTime, saveToDb = true) => {
    const logData = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
    };

    // Log to file
    logger.http('HTTP Request', logData);

    // Optionally save to database
    if (saveToDb && process.env.ENABLE_DB_LOGGING === 'true') {
        try {
            const { ApiLog } = require('../models');
            await ApiLog.create({
                api_source: 'Internal API',
                endpoint: req.originalUrl,
                status_code: res.statusCode,
                response_time_ms: responseTime,
            });
        } catch (error) {
            // Don't let DB logging errors break the app
            logger.error('Failed to save request log to database', { error: error.message });
        }
    }
};

// Enhanced error logging
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






// ============================================
// SUMMARY: DUAL LOGGING SYSTEM
// ============================================
/*

┌─────────────────────────────────────────────────────────┐
│              YOUR LOGGING ARCHITECTURE                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. FILE LOGGING (Winston)                             │
│     Location: logs/*.log                               │
│     Purpose: Debug, errors, general app logs           │
│     Retention: 14 days (rotating)                      │
│                                                         │
│  2. DATABASE LOGGING (ApiLog Model)                     │
│     Location: MySQL api_logs table                     │
│     Purpose: API performance, statistics, analytics    │
│     Retention: Unlimited (manual cleanup)              │
│                                                         │
│  WHEN DOES EACH LOG?                                    │
│  ────────────────────────────────────────────────────  │
│  • External API calls → BOTH (file + database)         │
│  • Internal API requests → FILE only (optional DB)     │
│  • Application errors → FILE only                      │
│  • Debug messages → FILE only                          │
│  • Security events → FILE only                         │
│                                                         │
└─────────────────────────────────────────────────────────┘

*/
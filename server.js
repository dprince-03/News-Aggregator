require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const session = require('express-session');

const { testConnection, closeConnection } = require('./src/config/db.config');
const { notFound, errorHandler } = require('./src/middleware/errorHandler.middleware');
const { startArticleFetchJob } = require('./src/jobs/fetchArticles.jobs');
const logger = require('./src/utils/logger.utils');
const authRouter = require('./src/routes/auth.routes');
const adminRouter = require('./src/routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 5080

app.set('trust-proxy', 1); // trust first proxy if behind a proxy like Nginx

// ========================
// SECRET VALIDATION
// ========================
/**
 * Validate required environment secrets on startup
 * Prevents server from starting with missing/invalid secrets
*/
const validateEnvironmentSecrets = () => {
    console.log('-- Validating environment secrets... \n');
    
    const requiredSecrets = [
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'SESSION_SECRET'
    ];

    const missingSecrets = [];
    const weakSecrets =[];

    requiredSecrets.forEach(key => {
        const value = process.env[key];

        if (!value) {
            missingSecrets.push(key);
        } else if (value.length < 32 || value.includes('your_') || value.includes('change_this') || value.includes('placeholder')) {
            weakSecrets.push(key);
        }
    });

    if (missingSecrets.length > 0) {
        console.error('-- Missing required secrets:');
        missingSecrets.forEach(key => console.error(`   • ${key}`));
        console.error('\n-- To fix this, run:');
        console.error('   node src/utils/secrets.utils.js generate\n');
        process.exit(1);
    }

    if (weakSecrets.length > 0) {
        console.warn('--  Weak secrets detected (use production-grade secrets):');
        weakSecrets.forEach(key => console.warn(`   • ${key}`));
        console.warn('\n-- To regenerate, run:');
        console.warn('   node src/utils/secrets.utils.js force\n');
        
        if (process.env.NODE_ENV === 'production') {
            console.error('-- Cannot start in production with weak secrets!\n');
            process.exit(1);
        }
    }

    console.log('✅ All required secrets are valid\n');
};

// ========================
// MIDDLEWARES
// ========================
const corsConfig = {
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:5000', 'http://localhost:5080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200
};

const limiter = rateLimit({
    windowMs: 15 + 60 * 1000, // 15 minutes
    max: 100,
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
});

const helmetConfig = {
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			styleSrce: ["'self'", "https:", "'unsafe-inline'"],
			scriptSrc: ["'self'", "https:", "'unsafe-inline'"],
			imgSrc: ["'self'", "data:", "https:"],
			connectSrc: ["'self'", "https:"],
			fontSrc: ["'self'", "https:", "data:"],
			objectSrc: ["'none'"],
			upgradeInsecureRequests: [],
		},
	},
};

const sessionConfig = {
	secret: process.env.SESSION_SECRET || "your_session_secret",
	resave: false,
	saveUninitialized: false,
	cookie: {
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
		maxAge: 24 * 60 * 60 * 1000, // 24 hours
	},
};

//Temporary debug middleware
if (process.env.NODE_ENV !== "production") {
	app.use((req, res, next) => {
		console.log(`${req.method} ${req.path}`);
		console.log("Body:", req.body);
		console.log("Content-Type:", req.headers["content-type"]);
		next();
	});
} // remove later

app.use(helmet(helmetConfig));
app.use(cors(corsConfig));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(morgan('dev'));

// ====================
// request logging middleware
// ====================
app.use((req, res,next) => {
    const startTime = Date.now();

    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        logger.logRequest(req, res, responseTime);
    });

    next();
});

// ========================
// Security headers middleware
// ========================
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

// =======================
// ROUTES
// =======================
app.use('/api', limiter);

// Root endpoint
app.get('/api', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'News Aggregator API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                logout: 'POST /api/auth/logout',
                profile: 'GET /api/auth/me',
                updateProfile: 'PUT /api/auth/profile',
                changePassword: 'PUT /api/auth/change-password',
                forgotPassword: 'POST /api/auth/forgot-password',
                resetPassword: 'POST /api/auth/reset-password',
                refreshToken: 'POST /api/auth/refresh-token',
                google: 'GET /api/auth/google',
                facebook: 'GET /api/auth/facebook',
                twitter: 'GET /api/auth/twitter'
            }
        },
        documentation: '/api/docs'
    });
});

// health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'News Aggregator API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
    });
});

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
// app.use('/api')
// app.use('/api')

// ========================
// ERROR HANDLING
// ========================
app.use(notFound);
app.use(errorHandler);

// ========================
// SERVER SETUP
// ========================
const start_server = async () => {    
    try {
        console.log('');
        console.log('='.repeat(50));
        console.log("-- Starting News Aggregator API...");
        console.log('='.repeat(50));
        console.log('');

        // Start cron job 
        if (process.env.ENABLE_CRON ==='true') {
            startArticleFetchJob();
        }
        
        // Validate environment secrets
        validateEnvironmentSecrets();

        // Initialize database
        console.log('-- Connecting to database...\n');        
        const dbconnect = await testConnection();
        if (!dbconnect) {
            console.error("Failed to connect to database");
            console.error("Please check your database configuration in .env file");
            process.exit(1);
        }

        // Start HTTP Server 
        const server = app.listen(PORT, () => {
            console.log('');
            console.log('='.repeat(50));
            console.log(`Server is running on port ${PORT}`);
            console.log(`API URL: http://localhost:${PORT}/api`);
            console.log('='.repeat(50));
            console.log('');
            console.log('Server Information:');
            console.log(`   Base URL:        http://localhost:${PORT}`);
            console.log(`   API URL:         http://localhost:${PORT}/api`);
            console.log('');

            console.log('Tips:');
            console.log('   - Use Postman or curl to test the API');
            console.log('   - Visit http://localhost:' + PORT + '/api for endpoint list');
            console.log('');
            console.log('='.repeat(50));
            console.log('       Press CTRL+C to stop the server         ');
            console.log('='.repeat(50));
            console.log('');

        });

        // GRACEFUL SHUTDOWN
        const shutdown = async (signal) => {
            console.log('');
            console.log('='.repeat(50));
            console.log(`${signal} received. Shutting down gracefully...`);
            console.log('='.repeat(50));

            server.close(async () => {
                console.log('');
                console.log('HTTP server closed');
                
                // Close database connections
                console.log('Closing database connections...');
                await closeConnection();

                console.log('All connections closed');
                console.log('');
                console.log('Goodbye!');
                console.log('');
                process.exit(0);
            });

            // Force close after 10 seconds
            setTimeout(() => {
            console.error('');
            console.error('Forcing server shutdown after timeout...');
            console.error('');
            process.exit(1);
            }, 10000);
        };

        // Handle shutdown signals
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (err) => {
            console.error('');
            console.error('-- Uncaught Exception:', err);
            console.error('');
            shutdown('UNCAUGHT_EXCEPTION');
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('');
            console.error('-- Unhandled Rejection at:', promise);
            console.error('Reason:', reason);
            console.error('');
            shutdown('UNHANDLED_REJECTION');
        });
        
    } catch (error) {
        console.error('');
        console.error('='.repeat(60));
        console.error('-- Failed to start server');
        console.error('='.repeat(60));
        console.error('');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        console.error('');
        process.exit(1);
    }
};

start_server();

module.exports = app;
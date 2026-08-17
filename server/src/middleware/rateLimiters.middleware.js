const rateLimit = require('express-rate-limit');

// The test suite legitimately makes far more than 20 auth requests per run
// (login is called in nearly every beforeEach/test) - rate limiting is
// infrastructure being exercised incidentally, not the thing under test,
// so it's skipped in NODE_ENV=test the same way many apps do. Production
// and development both still enforce it normally.
const skip = () => process.env.NODE_ENV === 'test';

// General API limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    skip,
});

// Stricter limiter for auth endpoints - login/register/forgot-password are
// what credential-stuffing and brute-force attempts actually target, so
// they get a much tighter budget than general read traffic.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    skip,
});

module.exports = { apiLimiter, authLimiter };

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passport = require('passport');
const { Op } = require('sequelize');

const authConfig = require('../config/auth.config');

// Caps how many refresh tokens (devices/sessions) a user can have active at
// once - the oldest is revoked to make room for a new login past the limit.
const MAX_ACTIVE_SESSIONS = Number.parseInt(process.env.MAX_ACTIVE_SESSIONS, 10) || 5;

// Middleware to verify JWT token
const authenticate = (req, res, next) => {
    passport.authenticate(
        'jwt',
        { session: false },
        (err, user, info) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Authentication error',
                    error: err.message,
                });
            }

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - Invalid or expired token',
                });
            }

            req.user = user;
            next();
        },
    )(req, res, next);
};

// Attaches req.user when a valid token is present, but never blocks the
// request when it isn't - for routes that are public but auth-aware
// (e.g. article listings that include `is_saved` for logged-in users).
const optionalAuth = (req, res, next) => {
    passport.authenticate(
        'jwt',
        { session: false },
        (err, user) => {
            if (user) {
                req.user = user;
            }
            next();
        },
    )(req, res, next);
};

const generateToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
    };

    return jwt.sign(
        payload,
        authConfig.jwt.secret,
        {
            expiresIn: authConfig.jwt.expiresIn,
        },
    );
};

const generateRefreshToken = (user) => {
    const payload = {
        id: user.id,
        type: 'refresh',
        // A random jti guarantees two tokens issued for the same user in
        // the same second (iat has second precision) are never byte-
        // identical - without it, their SHA-256 hash collides against the
        // unique constraint on refresh_tokens.token_hash.
        jti: crypto.randomUUID(),
    };

    return jwt.sign(
        payload,
        authConfig.jwt.refreshSecret,
        {
            expiresIn: authConfig.jwt.refreshExpiresIn,
        },
    );
};

const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(
            token,
            authConfig.jwt.refreshSecret,
            { algorithms: ['HS256'] },
        );
    } catch (error) {
        throw new Error("Invalid refresh token");
    }
};

// Refresh tokens are stored hashed (never raw) so a DB read can't be used
// to impersonate a user - only a lookup match against a presented token proves possession.
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Revokes the oldest active sessions for a user once they're at/over the
// concurrent-session cap, so persisting a new token never leaves them with
// more than MAX_ACTIVE_SESSIONS live refresh tokens.
const enforceSessionLimit = async (userId) => {
    const { RefreshToken } = require('../models');

    const active = await RefreshToken.findAll({
        where: { user_id: userId, revoked_at: null, expires_at: { [Op.gt]: new Date() } },
        order: [['created_at', 'ASC']],
    });

    if (active.length < MAX_ACTIVE_SESSIONS) {
        return;
    }

    const excess = active.slice(0, active.length - MAX_ACTIVE_SESSIONS + 1);
    await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { id: excess.map((token) => token.id) } },
    );
};

// Persists a hash of a freshly-issued refresh token so it can later be
// looked up and revoked (logout, password change, rotation on refresh).
const persistRefreshToken = async (user, refreshToken) => {
    const { RefreshToken } = require('../models');
    const decoded = jwt.decode(refreshToken);

    await enforceSessionLimit(user.id);

    await RefreshToken.create({
        user_id: user.id,
        token_hash: hashToken(refreshToken),
        expires_at: new Date(decoded.exp * 1000),
    });
};

// Revokes a single refresh token (used on logout / refresh rotation).
const revokeRefreshToken = async (refreshToken) => {
    const { RefreshToken } = require('../models');

    await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { token_hash: hashToken(refreshToken), revoked_at: null } },
    );
};

// Revokes every active refresh token for a user (used on password change -
// forces re-authentication on every other device/session).
const revokeAllRefreshTokens = async (userId) => {
    const { RefreshToken } = require('../models');

    await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { user_id: userId, revoked_at: null } },
    );
};

const generateResetToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        type: 'reset',
    };

    return jwt.sign(
        payload,
        authConfig.jwt.secret,
        {
            expiresIn: "1h",
        },
    );
};

const verifyResetToken = (token) => {
    try {
        const decoded = jwt.verify(
            token,
            authConfig.jwt.secret,
            { algorithms: ['HS256'] },
        );

        if (decoded.type !== 'reset') {
            throw new Error("Invalid token type");
        }

        return decoded;
    } catch (error) {
        throw new Error("Invalid or expired reset token");
    };
};

// Persists a hash of a freshly-issued password-reset token so it can be
// looked up and marked used - the JWT itself stays valid (signature+expiry)
// for its full 1h window regardless, so this is what makes it single-use.
const persistResetToken = async (user, resetToken) => {
    const { PasswordResetToken } = require('../models');
    const decoded = jwt.decode(resetToken);

    await PasswordResetToken.create({
        user_id: user.id,
        token_hash: hashToken(resetToken),
        expires_at: new Date(decoded.exp * 1000),
    });
};

// Atomically marks a reset token as used. The `used_at: null` clause makes
// this a single UPDATE ... WHERE, so two concurrent requests racing on the
// same token can't both succeed - the second one affects zero rows.
// Returns false for a reused, unknown, or already-used token.
const consumeResetToken = async (resetToken) => {
    const { PasswordResetToken } = require('../models');

    const [affected] = await PasswordResetToken.update(
        { used_at: new Date() },
        { where: { token_hash: hashToken(resetToken), used_at: null } },
    );

    return affected > 0;
};

// Invalidates every outstanding, unused reset token for a user - called
// after a successful password change (whether via reset-password or
// change-password) so an older, still-unused reset email can't be replayed.
const invalidateResetTokens = async (userId) => {
    const { PasswordResetToken } = require('../models');

    await PasswordResetToken.update(
        { used_at: new Date() },
        { where: { user_id: userId, used_at: null } },
    );
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Forbidden - You do not have permission to access this resource',
            });
        }

        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden - You do not have permission to access this resource",
            });
        }

        next();
    };
};

module.exports = {
	authenticate,
	optionalAuth,
	generateToken,
	generateRefreshToken,
	verifyRefreshToken,
	hashToken,
	persistRefreshToken,
	revokeRefreshToken,
	revokeAllRefreshTokens,
	generateResetToken,
	verifyResetToken,
	persistResetToken,
	consumeResetToken,
	invalidateResetTokens,
	authorize,
};

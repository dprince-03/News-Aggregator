const passport = require('passport');

const User = require('../models/user.models');
const { asyncHandler, AppError } = require('../middleware/errorHandler.middleware');
const {
	generateToken,
	generateRefreshToken,
	verifyRefreshToken,
	persistRefreshToken,
	revokeRefreshToken,
	revokeAllRefreshTokens,
	generateResetToken,
	verifyResetToken,
	persistResetToken,
	consumeResetToken,
	invalidateResetTokens,
} = require('../middleware/auth.middleware');
const emailService = require("../utils/emailServices.utils");
const logger = require("../utils/logger.utils");

// ============================================
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ============================================
const registerUser = asyncHandler( async (req, res, next) => {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        throw new AppError('User with this email already exists', 409);
    }

    const user = await User.create({
        name,
        email,
        password,
    });

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    await persistRefreshToken(user, refreshToken);

    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: user.toJSON(),
            token,
            refreshToken,
        },
    });
});

// ============================================
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ============================================
const login = asyncHandler(async (req, res, next) => {
    passport.authenticate('local', { session: false }, async (err, user, info) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            logger.logSecurityEvent('login_failed', {
                email: req.body?.email,
                ip: req.ip,
                reason: info?.message,
            });

            // This callback runs inside passport's own async flow, not
            // inside the `login` function's call stack - asyncHandler can't
            // catch a throw here, so it would escape Express's error
            // handling entirely instead of becoming a clean 401 response.
            return next(new AppError(info?.message || "Invalid credentials", 401));
        }

        try {
            const token = generateToken(user);
            const refreshToken = generateRefreshToken(user);
            await persistRefreshToken(user, refreshToken);

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: user.toJSON(),
                    token,
                    refreshToken,
                },
            });
        } catch (error) {
            next(error);
        }
    })(req, res, next);
});

// ============================================
// @desc    Logout user - revokes the presented refresh token so it can no
//          longer be used to mint new access tokens.
// @route   POST /api/auth/logout
// @access  Private
// ============================================
const logout = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.body || {};

    if (refreshToken) {
        await revokeRefreshToken(refreshToken);
    }

    res.status(200).json({
        success: true,
		message: "Logout successful",
    });
});

// ============================================
// @desc    Exchange a valid, non-revoked refresh token for a new access
//          token. Rotates the refresh token (old one is revoked, a new one
//          issued) so a leaked refresh token has a limited window of use.
// @route   POST /api/auth/refresh-token
// @access  Public (requires a valid refresh token in the body)
// ============================================
const refreshTokenHandler = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.body || {};

    if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
    }

    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
        logger.logSecurityEvent('refresh_token_invalid', { ip: req.ip });
        throw new AppError('Invalid or expired refresh token', 401);
    }

    const { RefreshToken } = require('../models');
    const { hashToken } = require('../middleware/auth.middleware');

    const stored = await RefreshToken.findOne({
        where: { token_hash: hashToken(refreshToken), user_id: decoded.id },
    });

    if (!stored || stored.revoked_at || stored.expires_at < new Date()) {
        // A revoked-but-presented token is either a stale client retry or a
        // replay of a stolen/rotated-out token - worth a security event
        // either way, tagged with which user it targeted.
        logger.logSecurityEvent('refresh_token_reuse', { userId: decoded.id, ip: req.ip });
        throw new AppError('Refresh token has been revoked or is invalid', 401);
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    stored.revoked_at = new Date();
    await stored.save();

    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);
    await persistRefreshToken(user, newRefreshToken);

    res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
            token: newToken,
            refreshToken: newRefreshToken,
        },
    });
});

// ============================================
// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
// ============================================
const getProfile = asyncHandler(async (req, res, next) => {
    const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
    });

    if ( !user ) {
        throw new AppError("User not found", 404);
    }

    res.status(200).json({
        success: true,
        data: { user },
    });
});

// ============================================
// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
// ============================================
const updateProfile = asyncHandler(async (req, res, next) => {
    const { name, email } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            throw new AppError("Email already in use", 409);
        }
    }

    await user.update({
        name: name || user.name,
        email: email || user.email,
    });

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            user: user.toJSON(),
        },
    });
});

// ============================================
// @desc    Change password - revokes all of the user's refresh tokens so
//          every other logged-in session/device is forced to re-authenticate.
// @route   PUT /api/auth/change-password
// @access  Private
// ============================================
const changePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByEmailWithPassword(req.user.email);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
        throw new AppError("Current password is incorrect", 401);
    }

    await user.update({ password: newPassword });
    await revokeAllRefreshTokens(user.id);
    await invalidateResetTokens(user.id);

    res.status(200).json({
        success: true,
        message: 'Password changed successfully',
    });
});

// ============================================
// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
// ============================================
const forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ where: {email} });

    if (!user) {
        return res.json({
            success: true,
            message: 'If the email exists, a reset link has been sent',
        });
    }

    const resetToken = generateResetToken(user);
    await persistResetToken(user, resetToken);

    // send email with reset link here
    await emailService.sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({
        success: true,
        message: 'Password reset link sent to email',
        ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
});

// ============================================
// @desc    Reset password - verifies the reset token, actually updates the
//          user's password (previously a no-op that only minted new tokens
//          without ever writing the new password), and revokes existing
//          refresh tokens since the credential changed.
// @route   POST /api/auth/reset-password
// @access  Public
// ============================================
const resetPassword = asyncHandler(async (req, res, next) => {
    const { token, newPassword } = req.body;

    let decoded;
    try {
        decoded = verifyResetToken(token);
    } catch (error) {
        throw new AppError("Invalid or expired reset token", 400);
    };

    const consumed = await consumeResetToken(token);
    if (!consumed) {
        // The JWT itself still verifies (it's stateless and not yet
        // expired) but it's already been redeemed once - reject the reuse
        // rather than silently honoring it.
        logger.logSecurityEvent('reset_token_reuse', { userId: decoded.id, ip: req.ip });
        throw new AppError("This reset link has already been used", 400);
    }

    const user = await User.findByPk(decoded.id);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    await user.update({ password: newPassword });
    await revokeAllRefreshTokens(user.id);
    await invalidateResetTokens(user.id);

    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);
    await persistRefreshToken(user, newRefreshToken);

    res.status(200).json({
        success: true,
        message: 'Password reset successfully',
        data: {
            token: newToken,
            refreshToken: newRefreshToken,
        },
    });
});

// ============================================
// OAuth Callbacks
// ============================================

// Google OAuth Callback
const googleCallback = asyncHandler(async (req, res, next) => {
	const token = generateToken(req.user);
	const refreshToken = generateRefreshToken(req.user);
	await persistRefreshToken(req.user, refreshToken);

	// Redirect to frontend with token
	res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}&refreshToken=${refreshToken}`);
});

// Facebook OAuth Callback
const facebookCallback = asyncHandler(async (req, res, next) => {
	const token = generateToken(req.user);
	const refreshToken = generateRefreshToken(req.user);
	await persistRefreshToken(req.user, refreshToken);

	res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}&refreshToken=${refreshToken}`);
});

// Twitter OAuth Callback
const twitterCallback = asyncHandler(async (req, res, next) => {
	const token = generateToken(req.user);
	const refreshToken = generateRefreshToken(req.user);
	await persistRefreshToken(req.user, refreshToken);

	res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}&refreshToken=${refreshToken}`);
});


module.exports = {
	register: registerUser,
	login,
	logout,
	refreshToken: refreshTokenHandler,
	getProfile,
	updateProfile,
	changePassword,
	forgotPassword,
	resetPassword,
	googleCallback,
	facebookCallback,
	twitterCallback,
};

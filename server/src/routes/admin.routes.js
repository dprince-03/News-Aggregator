const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { getApiLogs, getApiStats, getApiLogsBySource, cleanupOldLogs } = require('../controllers/admin.controllers');

const adminRouter = express.Router();

// These were documented "Admin only" but only ever required `authenticate`
// (any logged-in user) - there was no `role` field on User at all, so
// `authorize('admin')` could never have passed for anyone. Any authenticated
// user could view every API log and request log deletion. Fixed by adding
// User.role and actually gating these routes on it - see docs/SECURITY.md.
adminRouter.use(authenticate, authorize('admin'));

/**
 * @route   GET /api/admin/api-logs/stats
 * @desc    Get API statistics
 * @access  Private (Admin only)
*/
adminRouter.get('/api-logs/stats', getApiStats);

/**
 * @route   GET /api/admin/api-logs/source/:source
 * @desc    Get logs by specific source
 * @access  Private (Admin only)
*/
adminRouter.get('/api-logs/source/:source', getApiLogsBySource);

/**
 * @route   GET /api/admin/api-logs
 * @desc    Get API request logs
 * @access  Private (Admin only)
*/
adminRouter.get('/api-logs', getApiLogs);

/**
 * @route   DELETE /api/admin/api-logs/cleanup
 * @desc    Delete old logs
 * @access  Private (Admin only)
*/
adminRouter.delete('/api-logs/cleanup', cleanupOldLogs);

module.exports = adminRouter;

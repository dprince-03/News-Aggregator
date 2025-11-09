const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { getApiLogs, getApiStats, getApiLogsBySource, cleanupOldLogs } = require('../controllers/admin.controller');

const adminRouter = express.Router();

/**
 * @route   GET /api/admin/api-logs/stats
 * @desc    Get API statistics
 * @access  Private (Admin only)
*/
adminRouter.get('/api-logs/stats', authenticate, getApiStats);

/**
 * @route   GET /api/admin/api-logs/source/:source
 * @desc    Get logs by specific source
 * @access  Private (Admin only)
*/
adminRouter.get('/api-logs/source/:source', authenticate, getApiLogsBySource);

/**
 * @route   GET /api/admin/api-logs
 * @desc    Get API request logs
 * @access  Private (Admin only)
*/
adminRouter.get('/api-logs', authenticate, getApiLogs);

/**
 * @route   DELETE /api/admin/api-logs/cleanup
 * @desc    Delete old logs
 * @access  Private (Admin only)
*/
adminRouter.delete('/api-logs/cleanup', authenticate, cleanupOldLogs);

module.exports = adminRouter;

const express = require('express');

const { authenticate } = require('../middleware/auth.middleware');
const { adminController, adminStatsController } = require('../controllers/admin.controllers');

const adminRouter = express.Router();

/**
 * @route   GET /api/admin/api-logs
 * @desc    Get API request logs
 * @access  Private (Admin only)
*/
adminRouter.get('/api-logs', authenticate, adminController);

/**
 * @route   GET /api/admin/api-logs/stats
 * @desc    Get API statistics
 * @access  Private (Admin only)
*/
adminRouter.get('/api-logs/stats', authenticate, adminStatsController);

module.exports = adminRouter;
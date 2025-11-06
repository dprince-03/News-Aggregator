const { ApiLog } = require('../models');
const { Op } = require('sequelize');
const { asyncHandler } = require('../middleware/errorHandler.middleware');
const { formatPaginationResponse, paginate } = require('../utils/helper.utils');

/**
 * @desc    Get API request logs
 * @route   GET /api/admin/api-logs
 * @access  Private (Admin only)
*/
const getApiLogs = asyncHandler(async (req, res) => {
    const { 
        source,      // Filter by API source (NewsAPI, Guardian, NYT)
        startDate,   // Filter by date range
        endDate,
        page = 1,
        limit = 50 
    } = req.query;
    
    const { limit: limitNum, offset } = paginate(page, limit);
    
    // Build where clause
    let whereClause = {};
    
    if (source) {
        whereClause.api_source = source;
    }
    
    if (startDate && endDate) {
        whereClause.created_at = {
            [Op.between]: [new Date(startDate), new Date(endDate)],
        };
    } else if (startDate) {
        whereClause.created_at = {
            [Op.gte]: new Date(startDate),
        };
    } else if (endDate) {
        whereClause.created_at = {
            [Op.lte]: new Date(endDate),
        };
    }
    
    // Get logs with pagination
    const { count, rows } = await ApiLog.findAndCountAll({
        where: whereClause,
        limit: limitNum,
        offset,
        order: [['created_at', 'DESC']],
    });
    
    // Format response with pagination
    const response = formatPaginationResponse(rows, page, limitNum, count);
    
    res.json({
        success: true,
        message: 'API logs retrieved successfully',
        ...response,
    });
});

/**
 * @desc    Get API statistics
 * @route   GET /api/admin/api-logs/stats
 * @access  Private (Admin only)
*/
const getApiStats = asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days) || 7;
    
    // Get statistics using the model method
    const stats = await ApiLog.getApiStats(days);
    
    // Also get total counts
    const totalLogs = await ApiLog.count();
    const recentLogs = await ApiLog.count({
        where: {
            created_at: {
                [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
            },
        },
    });
    
    // Get error count (status >= 400)
    const errorCount = await ApiLog.count({
        where: {
            status_code: {
                [Op.gte]: 400,
            },
            created_at: {
                [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
            },
        },
    });
    
    res.json({
        success: true,
        message: 'API statistics retrieved successfully',
        data: {
            period: `Last ${days} days`,
            summary: {
                totalLogs,
                recentLogs,
                errorCount,
                successRate: recentLogs > 0 
                    ? ((recentLogs - errorCount) / recentLogs * 100).toFixed(2) + '%'
                    : 'N/A',
            },
            bySource: stats.map(stat => ({
                source: stat.api_source,
                requests: parseInt(stat.request_count),
                avgResponseTime: parseFloat(stat.avg_response_time).toFixed(2) + 'ms',
                maxResponseTime: parseInt(stat.max_response_time) + 'ms',
            })),
        },
    });
});

/**
 * @desc    Get API logs by source
 * @route   GET /api/admin/api-logs/source/:source
 * @access  Private (Admin only)
*/
const getApiLogsBySource = asyncHandler(async (req, res) => {
    const { source } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const { limit: limitNum, offset } = paginate(page, limit);
    
    const { count, rows } = await ApiLog.findAndCountAll({
        where: { api_source: source },
        limit: limitNum,
        offset,
        order: [['created_at', 'DESC']],
    });
    
    const response = formatPaginationResponse(rows, page, limitNum, count);
    
    res.json({
        success: true,
        message: `Logs for ${source} retrieved successfully`,
        ...response,
    });
});

/**
 * @desc    Clear old API logs
 * @route   DELETE /api/admin/api-logs/cleanup
 * @access  Private (Admin only)
*/
const cleanupOldLogs = asyncHandler(async (req, res) => {
    const { days = 30 } = req.body;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const deleted = await ApiLog.destroy({
        where: {
            created_at: {
                [Op.lt]: cutoffDate,
            },
        },
    });
    
    res.json({
        success: true,
        message: `Deleted ${deleted} log entries older than ${days} days`,
        data: {
            deletedCount: deleted,
            cutoffDate,
        },
    });
});

module.exports = {
    getApiLogs,
    getApiStats,
    getApiLogsBySource,
    cleanupOldLogs,
};
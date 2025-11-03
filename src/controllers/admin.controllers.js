const { ApiLog } = require("../models/apiLog.models");

const adminStatsController = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const stats = await ApiLog.getApiStats(days);
        
        res.json({
            success: true,
            data: {
                period: `Last ${days} days`,
                statistics: stats,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    };
};

const adminController = async (req, res) => {
    try {
        const { 
            source, 
            startDate, 
            endDate, 
            page = 1, 
            limit = 50 
        } = req.query;
        
        const offset = (page - 1) * limit;
        
        let whereClause = {};
        
        if (source) {
            whereClause.api_source = source;
        }
        
        if (startDate && endDate) {
            whereClause.created_at = {
                [Op.between]: [startDate, endDate],
            };
        }
        
        const { count, rows } = await ApiLog.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset,
            order: [['created_at', 'DESC']],
        });
        
        res.json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    };
};

module.exports = {
    adminController,
    adminStatsController,
};
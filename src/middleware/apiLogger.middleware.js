/**
 * Middleware to log API requests to database
 * This is specifically for tracking external API calls (NewsAPI, Guardian, NYT)
*/
const apiLoggerMiddleware = (apiSource) => {
    return async (req, res, next) => {
        const startTime = Date.now();

        // Capture original res.json to intercept response
        const originalJson = res.json.bind(res);

        res.json = function(body) {
            const responseTime = Date.now() - startTime;

            // Save to database asynchronously (don't block response)
            (async () => {
                try {
                    const { ApiLog } = require('../models');
                    await ApiLog.logRequest({
                        api_source: apiSource,
                        endpoint: req.originalUrl,
                        status_code: res.statusCode,
                        response_time_ms: responseTime,
                    });
                } catch (error) {
                    console.error('Failed to log API request to database:', error);
                }
            })();

            // Send the response
            return originalJson(body);
        };

        next();
    };
};

module.exports = apiLoggerMiddleware;
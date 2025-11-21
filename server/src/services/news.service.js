const axios = require('axios');
const { ApiLog } = require('../models/apiLog.models');
const logger = require('../utils/logger.utils'); // File logging

const NEWS_API_KEY = process.env.NEWSAPI_KEY;
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

/**
 * Fetch top headlines from NewsAPI
 * Logs to both FILE and DATABASE
 */
const fetchTopHeadlines = async (options = {}) => {
    const { category, country = 'us', pageSize = 20, page = 1 } = options;
    
    const startTime = Date.now();
    const endpoint = '/top-headlines';
    
    try {
        const params = {
            apiKey: NEWS_API_KEY,
            country,
            pageSize,
            page,
        };
        
        if (category) {
            params.category = category;
        }
        
        // Make API request
        const response = await axios.get(`${NEWS_API_BASE_URL}${endpoint}`, { params });
        
        const responseTime = Date.now() - startTime;
        
        // Log to FILE (via Winston)
        logger.info('NewsAPI Request', {
            endpoint,
            statusCode: response.status,
            responseTime: `${responseTime}ms`,
            articlesCount: response.data.articles.length,
        });
        
        // Log to DATABASE (via ApiLog model)
        await ApiLog.logRequest({
            api_source: 'NewsAPI',
            endpoint,
            status_code: response.status,
            response_time_ms: responseTime,
        });
        
        return {
            success: true,
            articles: transformNewsApiArticles(response.data.articles),
            total: response.data.totalResults,
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        const statusCode = error.response?.status || 500;
        
        // Log ERROR to FILE
        logger.error('NewsAPI Request Failed', {
            endpoint,
            error: error.message,
            statusCode,
            responseTime: `${responseTime}ms`,
        });
        
        // Log ERROR to DATABASE
        await ApiLog.logRequest({
            api_source: 'NewsAPI',
            endpoint,
            status_code: statusCode,
            response_time_ms: responseTime,
        });
        
        throw new Error(`NewsAPI error: ${error.message}`);
    }
};
/**
 * Search articles from NewsAPI
*/
const searchArticles = async (query, options = {}) => {
    const { from, to, sortBy = 'publishedAt', pageSize = 20, page = 1 } = options;

    const startTime = Date.now();

    try {
        const params = {
            apiKey: NEWS_API_KEY,
            q: query,
            sortBy,
            pageSize,
            page,
        };
        
        if (from) params.from = from;
        if (to) params.to = to;
        
        const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, { params });
        
        const responseTime = Date.now() - startTime;
        
        await ApiLog.logRequest({
            api_source: 'NewsAPI',
            endpoint: '/everything',
            status_code: response.status,
            response_time_ms: responseTime,
        });
        
        return {
            success: true,
            articles: transformNewsApiArticles(response.data.articles),
            total: response.data.totalResults,
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        await ApiLog.logRequest({
            api_source: 'NewsAPI',
            endpoint: '/everything',
            status_code: error.response?.status || 500,
            response_time_ms: responseTime,
        });
        
        console.error('NewsAPI Search Error:', error.message);
        throw new Error(`NewsAPI search error: ${error.message}`);
    };
};

/**
 * Transform NewsAPI articles to our format
*/
const transformNewsApiArticles = (articles) => {
	return articles.map((article) => ({
		title: article.title,
		description: article.description,
		content: article.content,
		author: article.author,
		source_name: article.source?.name || "NewsAPI",
		category: null, // NewsAPI doesn't provide category in response
		published_at: article.publishedAt,
		url: article.url,
		url_to_image: article.urlToImage,
		source_id: `newsapi_${article.url}`,
	}));
};

module.exports = {
	fetchTopHeadlines,
	searchArticles,
};
const axios = require('axios');
const { ApiLog } = require('../models/apiLog.models');
const logger = require("../utils/logger.utils");

const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY;
const GUARDIAN_BASE_URL = 'https://content.guardianapis.com';

/**
 * Fetch articles from The Guardian
*/
const fetchArticles = async (options = {}) => {
    const { 
        section, 
        query, 
        pageSize = 20, 
        page = 1,
        orderBy = 'newest'
    } = options;
    
    const startTime = Date.now();
    const endpoint = '/search';
    
    try {
        const params = {
            'api-key': GUARDIAN_API_KEY,
            'show-fields': 'headline,byline,body,thumbnail,short-url',
            'page-size': pageSize,
            page,
            'order-by': orderBy,
        };
        
        if (section) params.section = section;
        if (query) params.q = query;
        
        const response = await axios.get(`${GUARDIAN_BASE_URL}${endpoint}`, { params });
        
        const responseTime = Date.now() - startTime;
        
        // Log to FILE
        logger.info('Guardian API Request', {
            endpoint,
            statusCode: response.status,
            responseTime: `${responseTime}ms`,
            articlesCount: response.data.response.results.length,
        });
        
        // Log to DATABASE
        await ApiLog.logRequest({
            api_source: 'The Guardian',
            endpoint,
            status_code: response.status,
            response_time_ms: responseTime,
        });
        
        return {
            success: true,
            articles: transformGuardianArticles(response.data.response.results),
            total: response.data.response.total,
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        const statusCode = error.response?.status || 500;
        
        logger.error('Guardian API Request Failed', {
            endpoint,
            error: error.message,
            statusCode,
        });
        
        await ApiLog.logRequest({
            api_source: 'The Guardian',
            endpoint,
            status_code: statusCode,
            response_time_ms: responseTime,
        });
        
        throw new Error(`Guardian API error: ${error.message}`);
    };
};

/**
 * Transform Guardian articles to our format
*/
const transformGuardianArticles = (articles) => {
    return articles.map(article => ({
        title: article.fields?.headline || article.webTitle,
        description: article.fields?.body ? article.fields.body.substring(0, 200) : null,
        content: article.fields?.body,
        author: article.fields?.byline,
        source_name: 'The Guardian',
        category: article.sectionName,
        published_at: article.webPublicationDate,
        url: article.webUrl,
        url_to_image: article.fields?.thumbnail,
        source_id: `guardian_${article.id}`,
    }));
};

/**
 * Get Guardian sections/categories
*/
const getSections = async () => {
    try {
        const response = await axios.get(`${GUARDIAN_BASE_URL}/sections`, {
            params: { 'api-key': GUARDIAN_API_KEY },
        });
        
        return response.data.response.results.map(section => ({
            id: section.id,
            name: section.webTitle,
        }));
    } catch (error) {
        console.error('Guardian Sections Error:', error.message);
        return [];
    }
};

module.exports = {
    fetchArticles,
    getSections,
};
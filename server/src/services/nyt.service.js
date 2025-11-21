const axios = require('axios');
const { ApiLog } = require('../models');
const logger = require('../utils/logger.utils');

const NYT_API_KEY = process.env.NYT_API_KEY;
const NYT_BASE_URL = 'https://api.nytimes.com/svc';

/**
 * Fetch top stories from NYT
*/
const fetchTopStories = async (section = 'home') => {
    const startTime = Date.now();
    const endpoint = `/topstories/v2/${section}.json`;
    
    try {
        const response = await axios.get(
            `${NYT_BASE_URL}/topstories/v2/${section}.json`,
            { params: { 'api-key': NYT_API_KEY } }
        );
        
        const responseTime = Date.now() - startTime;
        
        // Log to FILE
        logger.info('NYT API Request', {
            endpoint,
            statusCode: response.status,
            responseTime: `${responseTime}ms`,
            articlesCount: response.data.results.length,
        });
        
        // Log to DATABASE
        await ApiLog.logRequest({
            api_source: 'New York Times',
            endpoint,
            status_code: response.status,
            response_time_ms: responseTime,
        });
        
        return {
            success: true,
            articles: transformNYTArticles(response.data.results),
            total: response.data.num_results,
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        const statusCode = error.response?.status || 500;
        
        logger.error('NYT API Request Failed', {
            endpoint,
            error: error.message,
            statusCode,
        });
        
        await ApiLog.logRequest({
            api_source: 'New York Times',
            endpoint,
            status_code: statusCode,
            response_time_ms: responseTime,
        });
        
        throw new Error(`NYT API error: ${error.message}`);
    };
};

/**
 * Search NYT articles
*/
const searchArticles = async (query, options = {}) => {
    const { begin_date, end_date, page = 0 } = options;
    
    const startTime = Date.now();
    
    try {
        const params = {
            'api-key': NYT_API_KEY,
            q: query,
            page,
        };
        
        if (begin_date) params.begin_date = begin_date;
        if (end_date) params.end_date = end_date;
        
        const response = await axios.get(
            `${NYT_BASE_URL}/search/v2/articlesearch.json`,
            { params }
        );
        
        const responseTime = Date.now() - startTime;
        
        await ApiLog.logRequest({
            api_source: 'New York Times',
            endpoint: '/articlesearch',
            status_code: response.status,
            response_time_ms: responseTime,
        });
        
        return {
            success: true,
            articles: transformNYTSearchArticles(response.data.response.docs),
            total: response.data.response.meta.hits,
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        await ApiLog.logRequest({
            api_source: 'New York Times',
            endpoint: '/articlesearch',
            status_code: error.response?.status || 500,
            response_time_ms: responseTime,
        });
        
        console.error('NYT Search Error:', error.message);
        throw new Error(`NYT search error: ${error.message}`);
    };
};

/**
 * Transform NYT articles to our format
*/
const transformNYTArticles = (articles) => {
    return articles.map(article => ({
        title: article.title,
        description: article.abstract,
        content: article.abstract,
        author: article.byline,
        source_name: 'New York Times',
        category: article.section,
        published_at: article.published_date,
        url: article.url,
        url_to_image: article.multimedia?.[0]?.url ? `https://www.nytimes.com/${article.multimedia[0].url}` : null,
        source_id: `nyt_${article.uri}`,
    }));
};

/**
 * Transform NYT search articles to our format
*/
const transformNYTSearchArticles = (articles) => {
    return articles.map(article => ({
        title: article.headline?.main,
        description: article.abstract,
        content: article.lead_paragraph,
        author: article.byline?.original,
        source_name: 'New York Times',
        category: article.section_name,
        published_at: article.pub_date,
        url: article.web_url,
        url_to_image: article.multimedia?.[0] ? `https://www.nytimes.com/${article.multimedia[0].url}` : null,
        source_id: `nyt_${article._id}`,
    }));
};

module.exports = {
    fetchTopStories,
    searchArticles,
};
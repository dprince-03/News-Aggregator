const axios = require('axios');
const { ApiLog } = require('../models/apiLog.models');
const logger = require('../utils/logger.utils');

const GNEEWS_API_KEY = process.env.GNEWS_API_KEY;
const GNEWS_API_BASE_URL = 'https://gnews.io/api/v4';

/**
 * Fetch top headlines from GNews API
 * Logs to both File and Database
*/

const fetchTopHeadlines = async (options = {}) => {
    const {
        category = 'general',
        country = 'us', 
        lang = 'en',
        max = 10,
        page = 1 
    } = options;

    const startTime = Date.now();
    const endpoint = '/top-headlines';

    try {
        const params = {
            token: GNEEWS_API_KEY,
            category,
            country,
            lang,
            max,
        };

        // Add category only if it's provided
        if (category && category !== 'general') {
            params.category = category;
        }

        // Make API request
        const response = await axios.get(`${GNEWS_API_BASE_URL}${endpoint}`, { params, timeout: 10000 });

        const responseTime = Date.now() - startTime;

        // Log to FILE (via Winston)
        logger.info('GNews API Request', {
            endpoint,
            statusCode: response.status,
            responseTime: `${responseTime}ms`,
            articlesCount: response.data.articles?.length || 0,
            category,
            country,
        });

        // Log to DATABASE (via ApiLog model)
        await ApiLog.logRequest({
            api_source: 'GNews',
            endpoint,
            status_code: response.status,
            response_time_ms: responseTime,
        });

        return {
            success: true,
            articles: transformGNewsArticles(response.data.articles || []),
            total: response.data.totalArticles || 0,
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        const statusCode = error.response?.status || 500;

        // Log ERROR to FILE
        logger.error('GNews API Request Failed', {
            endpoint,
            error: error.message,
            statusCode,
            responseTime: `${responseTime}ms`,
            category,
            country,
        });

        // Log ERROR to DATABASE
        await ApiLog.logRequest({
            api_source: 'GNews',
            endpoint,
            status_code: statusCode,
            response_time_ms: responseTime,
            error_message: error.message,
        });

        throw new Error(`GNews API error: ${error.message}`);        
    };
};

/**
 * Search articles from GNews API
 * 
 * @param {Object} options - Search options
 * @param {string} options.query - Search query
*/
const searchArticles = async (query, options = {}) => {
    const {
        ang = 'en',
        country = 'us',
        max = 10,
        from,  // Format: 2024-01-15T00:00:00Z
        to,    // Format: 2024-01-15T23:59:59Z
        sortby = 'publishedAt',  // publishedAt or relevance
        nullable
    } = options;

    const startTime = Date.now();
    const endpoint = '/search';

    try {
        const params = {
            token: GNEWS_API_KEY,
            q: query,
            lang,
            country,
            max,
            sortby,
        };

        // Add optional date parameters
        if (from) params.from = from;
        if (to) params.to = to;
        if (nullable) params.nullable = nullable;

        const response = await axios.get(`${GNEWS_API_BASE_URL}${endpoint}`, { params, timeout: 10000 });

        const responseTime = Date.now() - startTime;

        // Log to FILE (via Winston)
        logger.info('GNews Search Request', {
            endpoint,
            query,
            statusCode: response.status,
            responseTime: `${responseTime}ms`,
            articlesCount: response.data.articles?.length || 0,
        });

        // Log to DATABASE (via ApiLog model)
        await ApiLog.logRequest({
            api_source: 'GNews',
            endpoint,
            status_code: response.status,
            response_time_ms: responseTime,
        });

        return {
            success: true,
            articles: transformGNewsArticles(response.data.articles || []),
            total: response.data.totalArticles || 0,
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        const statusCode = error.response?.status || 500;

        // Log ERROR to FILE
        logger.error('GNews Search Request Failed', {
            endpoint,
            query,
            error: error.message,
            statusCode,
            responseTime: `${responseTime}ms`,
        });

        // Log ERROR to DATABASE
        await ApiLog.logRequest({
            api_source: 'GNews',
            endpoint,
            status_code: statusCode,
            response_time_ms: responseTime,
            error_message: error.message,
        });

        throw new Error(`GNews API error: ${error.message}`);
    };
};

/**
 * Transform GNews articles to standard format
*/
const transformGNewsArticles = (articles) => {
    return articles.map((article) => ({
        title: article.title || 'No Title',
        description: article.description || '',
        content: article.content || '',
        author: article.source?.name || 'Unknown', // doesn't provide author
        source_name: article.source?.name || 'GNews',
        category: null, // GNews doesn't return category in article data
        published_at: article.publishedAt || new Date().toISOString(),
        url: article.url || '',
        url_to_image: article.image || null,
        source_id: `gnews_${Buffer.from(article.url || '').toString('base64').substring(0, 50)}`,
    }));
};

/**
 * Get available categories for GNews
 * GNews supports these categories:
*/
const getAvailableCategories = () => {
    return [
        'general',
        'world',
        'nation',
        'business',
        'technology',
        'entertainment',
        'sports',
        'science',
        'health',
    ];
};

/**
 * Get available languages for GNews
*/
const getAvailableLanguages = () => {
    return [
        { code: 'ar', name: 'Arabic' },
        { code: 'zh', name: 'Chinese' },
        { code: 'nl', name: 'Dutch' },
        { code: 'en', name: 'English' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'el', name: 'Greek' },
        { code: 'he', name: 'Hebrew' },
        { code: 'hi', name: 'Hindi' },
        { code: 'it', name: 'Italian' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ml', name: 'Malayalam' },
        { code: 'mr', name: 'Marathi' },
        { code: 'no', name: 'Norwegian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'ro', name: 'Romanian' },
        { code: 'ru', name: 'Russian' },
        { code: 'es', name: 'Spanish' },
        { code: 'sv', name: 'Swedish' },
        { code: 'ta', name: 'Tamil' },
        { code: 'te', name: 'Telugu' },
        { code: 'uk', name: 'Ukrainian' },
    ];
};

/**
 * Get available countries for GNews
*/
const getAvailableCountries = () => {
    return [
        { code: 'au', name: 'Australia' },
        { code: 'br', name: 'Brazil' },
        { code: 'ca', name: 'Canada' },
        { code: 'cn', name: 'China' },
        { code: 'eg', name: 'Egypt' },
        { code: 'fr', name: 'France' },
        { code: 'de', name: 'Germany' },
        { code: 'gr', name: 'Greece' },
        { code: 'hk', name: 'Hong Kong' },
        { code: 'in', name: 'India' },
        { code: 'ie', name: 'Ireland' },
        { code: 'il', name: 'Israel' },
        { code: 'it', name: 'Italy' },
        { code: 'jp', name: 'Japan' },
        { code: 'nl', name: 'Netherlands' },
        { code: 'no', name: 'Norway' },
        { code: 'pk', name: 'Pakistan' },
        { code: 'pe', name: 'Peru' },
        { code: 'ph', name: 'Philippines' },
        { code: 'pt', name: 'Portugal' },
        { code: 'ro', name: 'Romania' },
        { code: 'ru', name: 'Russian Federation' },
        { code: 'sg', name: 'Singapore' },
        { code: 'es', name: 'Spain' },
        { code: 'se', name: 'Sweden' },
        { code: 'ch', name: 'Switzerland' },
        { code: 'tw', name: 'Taiwan' },
        { code: 'ua', name: 'Ukraine' },
        { code: 'gb', name: 'United Kingdom' },
        { code: 'us', name: 'United States' },
    ];
};

module.exports = {
    fetchTopHeadlines,
    searchArticles,
    getAvailableCategories,
    getAvailableLanguages,
    getAvailableCountries,
};







// feature reference documentation
// ============================================
// API ENDPOINTS COMPARISON
// ============================================
/*
GNews API Endpoints:
1. Top Headlines
   GET https://gnews.io/api/v4/top-headlines
   Parameters:
   - token (required): API key
   - category: general, world, nation, business, technology, entertainment, sports, science, health
   - lang: language code (en, es, fr, etc.)
   - country: country code (us, gb, au, etc.)
   - max: number of articles (1-10 for free tier)
   - nullable: image, content (optional fields to exclude)

2. Search
   GET https://gnews.io/api/v4/search
   Parameters:
   - token (required): API key
   - q (required): search query
   - lang: language code
   - country: country code
   - max: number of articles
   - from: start date (ISO 8601)
   - to: end date (ISO 8601)
   - sortby: publishedAt or relevance
   - nullable: image, content

Response Format:
{
  "totalArticles": 10000,
  "articles": [
    {
      "title": "Article title",
      "description": "Article description",
      "content": "Article content",
      "url": "https://example.com/article",
      "image": "https://example.com/image.jpg",
      "publishedAt": "2024-01-15T10:30:00Z",
      "source": {
        "name": "Example News",
        "url": "https://example.com"
      }
    }
  ]
}

Rate Limits (Free Tier):
- 100 requests per day
- Up to 10 articles per request
- No credit card required
- Upgrade available for more requests
*/
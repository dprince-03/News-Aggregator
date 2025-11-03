const newsApiService = require('./news_api.services');
const guardianService = require('./guardian.services');
const nytService = require('./nyt.services');
const { Article } = require('../models/article.models');
const { removeDuplicates } = require('../utils/helper.utils');

/**
 * Fetch articles from all sources
 */
const fetchFromAllSources = async (options = {}) => {
    const { category, limit = 50 } = options;
    
    console.log(' Fetching articles from all sources...');
    
    const results = await Promise.allSettled([
        newsApiService.fetchTopHeadlines({ category, pageSize: limit }),
        guardianService.fetchArticles({ section: category, pageSize: limit }),
        nytService.fetchTopStories(category || 'home'),
    ]);
    
    const allArticles = [];
    
    results.forEach((result, index) => {
        const sources = ['NewsAPI', 'The Guardian', 'NYT'];
        if (result.status === 'fulfilled') {
            console.log(` ${sources[index]}: ${result.value.articles.length} articles`);
            allArticles.push(...result.value.articles);
        } else {
            console.error(` ${sources[index]}: ${result.reason.message}`);
        }
    });
    
    // Remove duplicates based on URL
    const uniqueArticles = removeDuplicates(allArticles, 'url');
    
    console.log(` Total articles fetched: ${uniqueArticles.length}`);
    
    return uniqueArticles;
};

/**
 * Save articles to database
 */
const saveArticlesToDatabase = async (articles) => {
    try {
        const result = await Article.bulkCreateArticles(articles);
        console.log(` Saved ${result.length} articles to database`);
        return result;
    } catch (error) {
        console.error(' Error saving articles:', error.message);
        throw error;
    }
};

/**
 * Fetch and save articles
 */
const fetchAndSaveArticles = async (options = {}) => {
    try {
        const articles = await fetchFromAllSources(options);
        const saved = await saveArticlesToDatabase(articles);
        
        return {
            success: true,
            fetched: articles.length,
            saved: saved.length,
            message: `Successfully fetched and saved articles`,
        };
    } catch (error) {
        console.error('Error in aggregation:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

module.exports = {
    fetchFromAllSources,
    saveArticlesToDatabase,
    fetchAndSaveArticles,
};
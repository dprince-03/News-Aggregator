const gnewsService = require('./gnews.service');
const newsApiService = require('./news_api.services');
const guardianService = require('./guardian.service');
const nytService = require('./nyt.service');
const { Article } = require('../models/article.models');
const { removeDuplicates } = require('../utils/helper.utils');
const logger = require('../utils/logger.utils');

/**
 * Fetch articles from all sources
*/
const fetchFromAllSources = async (options = {}) => {
    const { category, limit = 10 } = options;
    
    console.log(' Fetching articles from all sources...');
    logger.info('Starting article aggregation', { category, limit });

    // Prepare requests for all sources
    const requests = [];
    const sourceNames = [];
    
    // 1. GNews API (formerly NewsAPI)
    if (process.env.NEWSAPI_KEY) {
        requests.push(
            gnewsService.fetchTopHeadlines({ 
                category: category || 'general',
                country: 'us',
                lang: 'en',
                max: Math.min(limit, 10) // free tier max 10
            })
        );
        sourceNames.push('GNews');
    }
    
    // 2. The Guardian
    if (process.env.GUARDIAN_API_KEY) {
        requests.push(
            guardianService.fetchArticles({ 
                section: category, 
                pageSize: limit 
            })
        );
        sourceNames.push('The Guardian');
    }
    
    // 3. New York Times
    if (process.env.NYT_API_KEY) {
        requests.push(
            nytService.fetchTopStories(category || 'home')
        );
        sourceNames.push('New York Times');
    }
    
    // Check if any APIs are configured
    if (requests.length === 0) {
        console.error('No news API keys configured!');
        logger.error('No news APIs configured');
        throw new Error('No news API keys configured. Please add at least one API key to .env');
    }
    
    // Fetch from all sources concurrently
    const results = await Promise.allSettled(requests);
    
    const allArticles = [];
    const fetchStats = {
        successful: 0,
        failed: 0,
        total: 0,
    };
    
    // Process results
    results.forEach((result, index) => {
        const sourceName = sourceNames[index];
        
        if (result.status === 'fulfilled') {
            const articleCount = result.value.articles?.length || 0;
            console.log(`   ${sourceName}: ${articleCount} articles`);
            logger.info(`${sourceName} fetch successful`, { count: articleCount });
            
            allArticles.push(...(result.value.articles || []));
            fetchStats.successful++;
            fetchStats.total += articleCount;
        } else {
            console.error(`   ${sourceName}: ${result.reason.message}`);
            logger.error(`${sourceName} fetch failed`, { 
                error: result.reason.message 
            });
            fetchStats.failed++;
        }
    });
        
    // const results = await Promise.allSettled([
    //     newsApiService.fetchTopHeadlines({ category, pageSize: limit }),
    //     guardianService.fetchArticles({ section: category, pageSize: limit }),
    //     nytService.fetchTopStories(category || 'home'),
    // ]);
    
    // const allArticles = [];
    
    // results.forEach((result, index) => {
    //     const sources = ['NewsAPI', 'The Guardian', 'NYT'];
    //     if (result.status === 'fulfilled') {
    //         console.log(` ${sources[index]}: ${result.value.articles.length} articles`);
    //         allArticles.push(...result.value.articles);
    //     } else {
    //         console.error(` ${sources[index]}: ${result.reason.message}`);
    //     }
    // });
    
    // Remove duplicates based on URL
    const uniqueArticles = removeDuplicates(allArticles, 'url');
    
   console.log(`\n Aggregation Summary:`);
    console.log(`   Total fetched: ${allArticles.length}`);
    console.log(`   Unique articles: ${uniqueArticles.length}`);
    console.log(`   Duplicates removed: ${allArticles.length - uniqueArticles.length}`);
    console.log(`   Sources successful: ${fetchStats.successful}/${sourceNames.length}`);
    
    logger.info('Article aggregation completed', {
        totalFetched: allArticles.length,
        uniqueArticles: uniqueArticles.length,
        duplicatesRemoved: allArticles.length - uniqueArticles.length,
        sourcesSuccessful: fetchStats.successful,
        sourcesTotal: sourceNames.length,
    });
    
    return uniqueArticles;
};

/**
 * Save articles to database
*/
const saveArticlesToDatabase = async (articles) => {
    if (!articles || articles.length === 0) {
        console.log('  No articles to save');
        return [];
    }
    
    try {
        console.log(`\n Saving ${articles.length} articles to database...`);
        logger.info('Saving articles to database', { count: articles.length });
        
        const result = await Article.bulkCreate(articles, {
            ignoreDuplicates: true, // Skip articles with duplicate URLs
            validate: true,
            returning: true, // Return inserted records
        });
        
        const savedCount = result.length;
        const skippedCount = articles.length - savedCount;
        
        console.log(`  Saved: ${savedCount}`);
        if (skippedCount > 0) {
            console.log(`  Skipped (duplicates): ${skippedCount}`);
        }
        
        logger.info('Articles saved to database', { 
            saved: savedCount, 
            skipped: skippedCount 
        });
        
        return result;
    } catch (error) {
        console.error('Error saving articles:', error.message);
        logger.error('Failed to save articles', { 
            error: error.message, 
            stack: error.stack 
        });
        throw error;
    };
};

/**
 * Fetch and save articles
 * Main aggregation function
 */
const fetchAndSaveArticles = async (options = {}) => {
    const startTime = Date.now();
    
    try {
        console.log('\n' + '='.repeat(60));
        console.log(' Starting Article Aggregation');
        console.log('='.repeat(60) + '\n');
        
        // Fetch articles from all sources
        const articles = await fetchFromAllSources(options);
        
        // Save to database
        const saved = await saveArticlesToDatabase(articles);
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\n' + '='.repeat(60));
        console.log(' Aggregation Completed Successfully');
        console.log('='.repeat(60));
        console.log(`   Duration: ${duration}s`);
        console.log(`   Fetched: ${articles.length}`);
        console.log(`   Saved: ${saved.length}`);
        console.log('='.repeat(60) + '\n');
        
        logger.info('Article aggregation completed successfully', {
            duration: `${duration}s`,
            fetched: articles.length,
            saved: saved.length,
        });
        
        return {
            success: true,
            fetched: articles.length,
            saved: saved.length,
            duration: `${duration}s`,
            message: 'Successfully fetched and saved articles',
        };
    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.error('\n' + '='.repeat(60));
        console.error(' Aggregation Failed');
        console.error('='.repeat(60));
        console.error(`   Error: ${error.message}`);
        console.error(`   Duration: ${duration}s`);
        console.error('='.repeat(60) + '\n');
        
        logger.error('Article aggregation failed', {
            error: error.message,
            stack: error.stack,
            duration: `${duration}s`,
        });
        
        return {
            success: false,
            error: error.message,
            duration: `${duration}s`,
        };
    }
};

/**
 * Fetch articles by category from all sources
 * Helper function for specific categories
 */
const fetchByCategory = async (category) => {
    // Map common categories to GNews categories
    const categoryMap = {
        technology: 'technology',
        tech: 'technology',
        business: 'business',
        sports: 'sports',
        entertainment: 'entertainment',
        health: 'health',
        science: 'science',
        general: 'general',
        world: 'world',
        nation: 'nation',
    };
    
    const gnewsCategory = categoryMap[category?.toLowerCase()] || 'general';
    
    return await fetchAndSaveArticles({ category: gnewsCategory });
};

/**
 * Get aggregation statistics
 * Returns stats about recent aggregations
 */
const getAggregationStats = async () => {
    try {
        const { ApiLog } = require('../models');
        
        // Get stats from last 24 hours
        const stats = await ApiLog.getApiStats(1);
        
        // Get total articles in database
        const totalArticles = await Article.count();
        
        // Get articles by source
        const articlesBySource = await Article.findAll({
            attributes: [
                'source_name',
                [Article.sequelize.fn('COUNT', Article.sequelize.col('id')), 'count'],
            ],
            group: ['source_name'],
            raw: true,
        });
        
        return {
            success: true,
            totalArticles,
            articlesBySource,
            apiStats: stats,
        };
    } catch (error) {
        logger.error('Failed to get aggregation stats', { error: error.message });
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Test all API connections
 * Useful for debugging and setup verification
 */
const testAllApis = async () => {
    console.log('\n Testing All News APIs...\n');
    
    const results = {
        gnews: { status: 'not_configured', error: null },
        guardian: { status: 'not_configured', error: null },
        nyt: { status: 'not_configured', error: null },
    };
    
    // Test GNews
    if (process.env.NEWSAPI_KEY) {
        try {
            await gnewsService.fetchTopHeadlines({ max: 1 });
            results.gnews.status = 'working';
            console.log(' GNews API: Working');
        } catch (error) {
            results.gnews.status = 'error';
            results.gnews.error = error.message;
            console.log(' GNews API: Failed -', error.message);
        }
    } else {
        console.log(' GNews API: Not configured');
    }
    
    // Test Guardian
    if (process.env.GUARDIAN_API_KEY) {
        try {
            await guardianService.fetchArticles({ pageSize: 1 });
            results.guardian.status = 'working';
            console.log(' Guardian API: Working');
        } catch (error) {
            results.guardian.status = 'error';
            results.guardian.error = error.message;
            console.log(' Guardian API: Failed -', error.message);
        }
    } else {
        console.log(' Guardian API: Not configured');
    }
    
    // Test NYT
    if (process.env.NYT_API_KEY) {
        try {
            await nytService.fetchTopStories('home');
            results.nyt.status = 'working';
            console.log('NYT API: Working');
        } catch (error) {
            results.nyt.status = 'error';
            results.nyt.error = error.message;
            console.log('NYT API: Failed -', error.message);
        }
    } else {
        console.log('NYT API: Not configured');
    }
    
    console.log('');
    return results;
};

module.exports = {
    fetchFromAllSources,
    saveArticlesToDatabase,
    fetchAndSaveArticles,
    fetchByCategory,
    getAggregationStats,
    testAllApis,
};
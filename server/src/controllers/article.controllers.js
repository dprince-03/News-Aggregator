const { Article, SavedArticle } = require('../models');
const { Op } = require('sequelize');
const { asyncHandler } = require('../middleware/errorHandler.middleware');
const { formatPaginationResponse, paginate, sanitizeSearchQuery } = require('../utils/helper.utils');

/**
 * @desc    Get all articles
 * @route   GET /api/articles
 * @access  Public
*/
const getAllArticles = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, source, category } = req.query;
    
    const { limit: limitNum, offset } = paginate(page, limit);
    
    // Build filter
    let whereClause = {};
    if (source) whereClause.source_name = source;
    if (category) whereClause.category = category;
    
    const { count, rows } = await Article.findAndCountAll({
        where: whereClause,
        limit: limitNum,
        offset,
        order: [['published_at', 'DESC']],
    });
    
    const response = formatPaginationResponse(rows, page, limitNum, count);
    
    res.json({
        success: true,
        message: 'Articles retrieved successfully',
        ...response,
    });
});

/**
 * @desc    Get single article
 * @route   GET /api/articles/:id
 * @access  Public
*/
const getArticleById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const article = await Article.findByPk(id);
    
    if (!article) {
        return res.status(404).json({
            success: false,
            message: 'Article not found',
        });
    }
    
    res.json({
        success: true,
        data: article,
    });
});

/**
 * @desc    Search articles
 * @route   GET /api/articles/search
 * @access  Public
*/
const searchArticles = asyncHandler(async (req, res) => {
    const { q: query, page = 1, limit = 20 } = req.query;
    
    if (!query) {
        return res.status(400).json({
            success: false,
            message: 'Search query is required',
        });
    }
    
    const sanitizedQuery = sanitizeSearchQuery(query);
    const { limit: limitNum, offset } = paginate(page, limit);
    
    const { count, rows } = await Article.searchArticles(sanitizedQuery, {
        limit: limitNum,
        offset,
    });
    
    const response = formatPaginationResponse(rows, page, limitNum, count);
    
    res.json({
        success: true,
        message: 'Search results retrieved successfully',
        query: sanitizedQuery,
        ...response,
    });
});

/**
 * @desc    Filter articles
 * @route   GET /api/articles/filter
 * @access  Public
*/
const filterArticles = asyncHandler(async (req, res) => {
    const { 
        source, 
        category, 
        author, 
        startDate, 
        endDate,
        page = 1,
        limit = 20 
    } = req.query;
    
    const filters = {
        source,
        category,
        author,
        startDate,
        endDate,
    };
    
    const { limit: limitNum, offset } = paginate(page, limit);
    
    const { count, rows } = await Article.filterArticles(filters, {
        limit: limitNum,
        offset,
    });
    
    const response = formatPaginationResponse(rows, page, limitNum, count);
    
    res.json({
        success: true,
        message: 'Filtered articles retrieved successfully',
        filters,
        ...response,
    });
});

/**
 * @desc    Get personalized articles feed
 * @route   GET /api/articles/personalized
 * @access  Private
*/
const getPersonalizedFeed = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    
    // Get user preferences
    const { Preference } = require('../models');
    let preferences = await Preference.findOne({
        where: { user_id: userId },
    });
    
    // If no preferences, return all articles
    if (!preferences) {
        preferences = {
            preferred_sources: [],
            preferred_categories: [],
            preferred_authors: [],
        };
    }
    
    const { limit: limitNum, offset } = paginate(page, limit);
    
    const { count, rows } = await Article.getPersonalizedArticles(preferences, {
        limit: limitNum,
        offset,
    });
    
    const response = formatPaginationResponse(rows, page, limitNum, count);
    
    res.json({
        success: true,
        message: 'Personalized feed retrieved successfully',
        ...response,
    });
});

/**
 * @desc    Save article (bookmark)
 * @route   POST /api/articles/:id/save
 * @access  Private
*/
const saveArticle = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if article exists
    const article = await Article.findByPk(id);
    if (!article) {
        return res.status(404).json({
            success: false,
            message: 'Article not found',
        });
    }
    
    // Save article
    const { savedArticle, created } = await SavedArticle.saveArticleForUser(userId, id);
    
    res.status(created ? 201 : 200).json({
        success: true,
        message: created ? 'Article saved successfully' : 'Article already saved',
        data: savedArticle,
    });
});

/**
 * @desc    Unsave article (remove bookmark)
 * @route   DELETE /api/articles/:id/save
 * @access  Private
*/
const unsaveArticle = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    const deleted = await SavedArticle.unsaveArticleForUser(userId, id);
    
    if (deleted === 0) {
        return res.status(404).json({
            success: false,
            message: 'Article not found in saved articles',
        });
    }
    
    res.json({
        success: true,
        message: 'Article removed from saved articles',
    });
});

/**
 * @desc    Get saved articles
 * @route   GET /api/articles/saved
 * @access  Private
*/
const getSavedArticles = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    
    const { limit: limitNum, offset } = paginate(page, limit);
    
    const { count, rows } = await SavedArticle.findAndCountAll({
        where: { user_id: userId },
        include: [{
            model: Article,
            as: 'article',
        }],
        limit: limitNum,
        offset,
        order: [['saved_at', 'DESC']],
    });
    
    // Extract articles from saved articles
    const articles = rows.map(saved => ({
        ...saved.article.toJSON(),
        saved_at: saved.saved_at,
    }));
    
    const response = formatPaginationResponse(articles, page, limitNum, count);
    
    res.json({
        success: true,
        message: 'Saved articles retrieved successfully',
        ...response,
    });
});

module.exports = {
    getAllArticles,
    getArticleById,
    searchArticles,
    filterArticles,
    getPersonalizedFeed,
    saveArticle,
    unsaveArticle,
    getSavedArticles,
};
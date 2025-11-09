const express = require('express');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { getAllArticles, getArticleById, searchArticles, filterArticles, getPersonalizedFeed, saveArticle, unsaveArticle, getSavedArticles } = require('../controllers/article.controllers');

const articleRouter = express.Router();

/**
 * @route   GET /api/articles
 * @desc    Get all articles
 * @access  Public
*/
articleRouter.get('/', getAllArticles);

/**
 * @route   GET /api/articles/search
 * @desc    Search articles
 * @access  Public
*/
articleRouter.get('/search', searchArticles);

/**
 * @route   GET /api/articles/filter
 * @desc    Filter articles
 * @access  Public
*/
articleRouter.get('/filter', filterArticles);

/**
 * @route   GET /api/articles/personalized
 * @desc    Get personalized feed
 * @access  Private
*/
articleRouter.get('/personalized', authenticate, getPersonalizedFeed);

/**
 * @route   GET /api/articles/saved
 * @desc    Get saved articles
 * @access  Private
*/
articleRouter.get('/saved', authenticate, getSavedArticles);

/**
 * @route   GET /api/articles/:id
 * @desc    Get single article
 * @access  Public
*/
articleRouter.get('/:id', getArticleById);

/**
 * @route   POST /api/articles/:id/save
 * @desc    Save article (bookmark)
 * @access  Private
*/
articleRouter.post('/:id/save', authenticate, saveArticle);

/**
 * @route   DELETE /api/articles/:id/save
 * @desc    Unsave article
 * @access  Private
*/
articleRouter.delete('/:id/save', authenticate, unsaveArticle);

module.exports = articleRouter;
const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { getPreferences, updatePreferences, getAvailableSources, getAvailableCategories } = require('../controllers/preference.controller');
const { updatePreferenceValidation } = require('../middleware/validator.middleware');

const preferenceRouter = express.Router();

/**
 * @route   GET /api/preferences
 * @desc    Get user preferences
 * @access  Private
*/
preferenceRouter.get('/', authenticate, getPreferences);

/**
 * @route   PUT /api/preferences
 * @desc    Update user preferences
 * @access  Private
*/
preferenceRouter.put('/', authenticate, updatePreferenceValidation, updatePreferences);

/**
 * @route   GET /api/preferences/sources
 * @desc    Get available news sources
 * @access  Public
*/
preferenceRouter.get('/sources', getAvailableSources);

/**
 * @route   GET /api/preferences/categories
 * @desc    Get available categories
 * @access  Public
*/
preferenceRouter.get('/categories', getAvailableCategories);

module.exports = preferenceRouter;
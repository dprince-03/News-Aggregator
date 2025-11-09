const { Preference, NewsSource, Category } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler.middleware');

/**
 * @desc    Get user preferences
 * @route   GET /api/preferences
 * @access  Private
*/
const getPreferences = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const { preference, created } = await Preference.getOrCreateForUser(userId);
    
    res.json({
        success: true,
        message: 'Preferences retrieved successfully',
        data: preference,
        isNew: created,
    });
});

/**
 * @desc    Update user preferences
 * @route   PUT /api/preferences
 * @access  Private
*/
const updatePreferences = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { preferred_sources, preferred_categories, preferred_authors } = req.body;
    
    const updates = {};
    if (preferred_sources !== undefined) updates.preferred_sources = preferred_sources;
    if (preferred_categories !== undefined) updates.preferred_categories = preferred_categories;
    if (preferred_authors !== undefined) updates.preferred_authors = preferred_authors;
    
    const preference = await Preference.updateForUser(userId, updates);
    
    res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: preference,
    });
});

/**
 * @desc    Get available news sources
 * @route   GET /api/preferences/sources
 * @access  Public
*/
const getAvailableSources = asyncHandler(async (req, res) => {
    const sources = await NewsSource.getActiveSources();
    
    res.json({
        success: true,
        message: 'Available sources retrieved successfully',
        data: sources,
    });
});

/**
 * @desc    Get available categories
 * @route   GET /api/preferences/categories
 * @access  Public
*/
const getAvailableCategories = asyncHandler(async (req, res) => {
    const categories = await Category.getAll();
    
    res.json({
        success: true,
        message: 'Available categories retrieved successfully',
        data: categories,
    });
});

module.exports = {
    getPreferences,
    updatePreferences,
    getAvailableSources,
    getAvailableCategories,
};
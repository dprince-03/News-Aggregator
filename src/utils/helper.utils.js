/**
 * Pagination helper
*/
const paginate = (page = 1, limit = 20) => {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    const offset = (pageNum - 1) * limitNum;

    return {
        limit: limitNum,
        offset,
        page: pageNum,
    };
};

/**
 * Format pagination response
*/
const formatPaginationResponse = (data, page, limit, total) => {
    const totalPages = Math.ceil(total / limit);

    return {
        data,
        pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
};

/**
 * Calculate time ago
*/
const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1, 
    };

    for (const [unit, secondInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    };

    return 'just now';
};

/**
 * Sanitize string for search
*/
const sanitizeSearchQuery = (query) => {
    if (!query) {
        return '';
    }
    return query.trim().replace(/[<>]/g, '');
};

/**
 * Generate random string
*/
const generateRandomString = (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));        
    };
    return result;
};

/**
 * Validate URL
*/
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    };
};

/**
 * Extract domain from URL
*/
const extractDomain = (url) => {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        return null;
    };
};

/**
 * Remove duplicates from array
*/
const removeDuplicates = (array, key = null) => {
    if (!key) {
        return [...new Set(array)];
    }

    const seen = new Set();
    return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) {
            return false;
        }
        seen.add(value);
        return true;
    });
};

/**
 * Sleep/delay function
*/
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry async function
*/
const retry = async (fn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            await sleep(delay * (i + 1)); // Exponential backoff
        }
    }
};

/**
 * Format error for API response
*/
const formatError = (error) => {
    return {
        success: false,
        message: error.message || 'An error occurred',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    };
};

/**
 * Calculate reading time
*/
const calculateReadingTime = (text) => {
    if (!text) return 0;
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
};

module.exports = {
    paginate,
    formatPaginationResponse,
    formatDate,
    timeAgo,
    sanitizeSearchQuery,
    generateRandomString,
    isValidUrl,
    extractDomain,
    removeDuplicates,
    sleep,
    retry,
    formatError,
    calculateReadingTime,
};
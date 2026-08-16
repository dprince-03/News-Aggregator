require('dotenv').config();

/**
 * Centralized API Keys Configuration
 * All external API keys are managed here
*/
const apiKeys = {
    // GNews API Configuration
    gnewsApi: {
        key: process.env.GNEWSAPIKEY || '',
        baseUrl: 'https://gnews.io/api/v4',
        rateLimit: {
            requests: 100,
            period: 'day',
        },
        enabled: !!process.env.GNEWSAPIKEY,
    },

    // NewsAPI Configuration
    newsApi: {
        key: process.env.NEWSAPI_KEY || '',
        baseUrl: 'https://newsapi.org/v2',
        rateLimit: {
            requests: 100,
            period: 'day', // 100 requests per day (free tier)
        },
        enabled: !!process.env.NEWSAPI_KEY,
    },

    // The Guardian API Configuration
    guardian: {
        key: process.env.GUARDIAN_API_KEY || '',
        baseUrl: 'https://content.guardianapis.com',
        rateLimit: {
            requests: 5000,
            period: 'day', // 5000 requests per day (free tier)
        },
        enabled: !!process.env.GUARDIAN_API_KEY,
    },

    // New York Times API Configuration
    nyt: {
        key: process.env.NYT_API_KEY || '',
        baseUrl: 'https://api.nytimes.com/svc',
        rateLimit: {
            requests: 4000,
            period: 'day', // 4000 requests per day (free tier)
        },
        enabled: !!process.env.NYT_API_KEY,
    },

    // Email Service Configuration
    email: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER || '',
            pass: process.env.EMAIL_PASSWORD || '',
        },
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER || '',
        enabled: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
    },
};

/**
 * Validate API Keys
 * Checks if required API keys are present
*/
const validateApiKeys = () => {
    const warnings = [];
    const errors = [];

    // Check GNewsAPI
    if (!apiKeys.gnewsApi.enabled) {
        warnings.push('GNewsAPI key not configured - GNewsAPI features will be disabled');
    }

    // Check NewsAPI
    if (!apiKeys.newsApi.enabled) {
        warnings.push('NewsAPI key not configured - NewsAPI features will be disabled');
    }

    // Check Guardian
    if (!apiKeys.guardian.enabled) {
        warnings.push('Guardian API key not configured - Guardian features will be disabled');
    }

    // Check NYT
    if (!apiKeys.nyt.enabled) {
        warnings.push('NYT API key not configured - NYT features will be disabled');
    }

    // Check if at least one news API is enabled
    const hasAnyNewsApi = apiKeys.gnewsApi.enabled || apiKeys.newsApi.enabled || apiKeys.guardian.enabled || apiKeys.nyt.enabled;

    if (!hasAnyNewsApi) {
        errors.push('No news API keys configured - Application requires at least one news source');
    }

    // Email warnings (optional)
    if (!apiKeys.email.enabled) {
        warnings.push('Email service not configured - Password reset emails will not work');
    }

    return { warnings, errors, valid: errors.length === 0 };
};

/**
 * Get enabled news sources
*/
const getEnabledSources = () => {
    const sources = [];

    if (apiKeys.gnewsApi.enabled) sources.push('GNewsAPI');
    if (apiKeys.newsApi.enabled) sources.push('NewsAPI');
    if (apiKeys.guardian.enabled) sources.push('The Guardian');
    if (apiKeys.nyt.enabled) sources.push('New York Times');

    return sources;
};

/**
 * Check if specific API is enabled
*/
const isApiEnabled = (apiName) => {
    const apiMap = {
        gnewsapi: apiKeys.gnewsApi.enabled,
        newsapi: apiKeys.newsApi.enabled,
        guardian: apiKeys.guardian.enabled,
        nyt: apiKeys.nyt.enabled,
        email: apiKeys.email.enabled,
    };

    return apiMap[apiName.toLowerCase()] || false;
};

/**
 * Get API configuration by name
*/
const getApiConfig = (apiName) => {
    const apiMap = {
        newsapi: apiKeys.newsApi,
        guardian: apiKeys.guardian,
        nyt: apiKeys.nyt,
        email: apiKeys.email,
    };

    return apiMap[apiName.toLowerCase()] || null;
};

/**
 * Display API Keys Status (for startup)
*/
const displayApiKeysStatus = () => {
    console.log(' API Keys Configuration:');
    console.log('─'.repeat(60));
    
    const sources = [
        { name: 'GNewsAPI', enabled: apiKeys.gnewsApi.enabled },
        { name: 'NewsAPI', enabled: apiKeys.newsApi.enabled },
        { name: 'The Guardian', enabled: apiKeys.guardian.enabled },
        { name: 'New York Times', enabled: apiKeys.nyt.enabled },
        { name: 'Email Service', enabled: apiKeys.email.enabled },
    ];

    sources.forEach(source => {
        const status = source.enabled ? 'ok' : 'bad';
        const statusText = source.enabled ? 'Enabled' : 'Disabled';
        console.log(`   ${status} ${source.name.padEnd(20)} ${statusText}`);
    });

    console.log('─'.repeat(60));
    console.log('');
};

module.exports = {
    apiKeys,
    validateApiKeys,
    getEnabledSources,
    isApiEnabled,
    getApiConfig,
    displayApiKeysStatus,
};
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

/**
 * Swagger/OpenAPI Configuration
*/
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'News Aggregator API',
            version: '1.0.0',
            description: 'RESTful API for aggregating news from multiple sources',
            contact: {
                name: 'API Support',
                email: 'support@newsaggregator.com',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 5080}/api`,
                description: 'Development server',
            },
            {
                url: 'https://api.newsaggregator.com/api',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter JWT token',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        email: { type: 'string', format: 'email', example: 'user@example.com' },
                        name: { type: 'string', example: 'John Doe' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                    },
                },
                Article: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        title: { type: 'string', example: 'Breaking News Title' },
                        description: { type: 'string', example: 'Article description...' },
                        content: { type: 'string', example: 'Full article content...' },
                        author: { type: 'string', example: 'John Smith' },
                        source_name: { type: 'string', example: 'NewsAPI' },
                        category: { type: 'string', example: 'technology' },
                        published_at: { type: 'string', format: 'date-time' },
                        url: { type: 'string', format: 'uri', example: 'https://example.com/article' },
                        url_to_image: { type: 'string', format: 'uri', example: 'https://example.com/image.jpg' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                    },
                },
                Preference: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        user_id: { type: 'integer', example: 1 },
                        preferred_sources: {
                            type: 'array',
                            items: { type: 'string' },
                            example: ['NewsAPI', 'The Guardian'],
                        },
                        preferred_categories: {
                            type: 'array',
                            items: { type: 'string' },
                            example: ['technology', 'business'],
                        },
                        preferred_authors: {
                            type: 'array',
                            items: { type: 'string' },
                            example: ['John Smith', 'Jane Doe'],
                        },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Error message' },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: { type: 'string' },
                                    message: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                PaginationMeta: {
                    type: 'object',
                    properties: {
                        currentPage: { type: 'integer', example: 1 },
                        totalPages: { type: 'integer', example: 10 },
                        totalItems: { type: 'integer', example: 200 },
                        itemsPerPage: { type: 'integer', example: 20 },
                        hasNextPage: { type: 'boolean', example: true },
                        hasPrevPage: { type: 'boolean', example: false },
                    },
                },
            },
            responses: {
                UnauthorizedError: {
                    description: 'Access token is missing or invalid',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                        },
                    },
                },
                NotFoundError: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                        },
                    },
                },
                ValidationError: {
                    description: 'Validation error',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                        },
                    },
                },
            },
        },
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication and authorization endpoints',
            },
            {
                name: 'Articles',
                description: 'News articles management',
            },
            {
                name: 'Preferences',
                description: 'User preferences and personalization',
            },
            {
                name: 'Saved Articles',
                description: 'User saved articles (bookmarks)',
            },
        ],
    },
    apis: ['./src/routes/*.js'], // Path to API routes
};

/**
 * Generate Swagger specification
*/
const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Swagger UI custom options
*/
const swaggerUiOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'News Aggregator API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        syntaxHighlight: {
            activate: true,
            theme: 'monokai',
        },
    },
};

/**
 * Setup Swagger documentation
*/
const setupSwagger = (app) => {
    // Serve Swagger JSON
    app.get('/api/docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    // Serve Swagger UI
    app.use('/api/docs', swaggerUi.serve,swaggerUi.setup(swaggerSpec, swaggerUiOptions));

    console.log(' Swagger documentation available at:');
    console.log(`   http://localhost:${process.env.PORT || 5080}/api/docs`);
    console.log('');
};

module.exports = {
    swaggerSpec,
    swaggerUiOptions,
    setupSwagger,
};
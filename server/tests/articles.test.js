const request = require('supertest');
const app = require('../server');
const { User, Article, SavedArticle } = require('../src/models');

describe('Articles API Tests', () => {
    let authToken;
    let testArticle;
    let testUser;

    // Setup test data
    beforeAll(async () => {
        // Create test user
        const userResponse = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'articletest@example.com',
                password: 'Test123!@#',
                name: 'Article Test User',
            });

        authToken = userResponse.body.data.token;
        testUser = userResponse.body.data.user;

        // Create test articles
        testArticle = await Article.create({
            title: 'Test Article',
            description: 'Test description',
            content: 'Test content',
            author: 'Test Author',
            source_name: 'Test Source',
            category: 'technology',
            published_at: new Date(),
            url: 'https://example.com/test-article',
        });

        // Create more test articles
        await Article.bulkCreate([
            {
                title: 'Bitcoin Price Surge',
                description: 'Bitcoin reaches new heights',
                content: 'Full content here',
                author: 'Crypto Writer',
                source_name: 'NewsAPI',
                category: 'business',
                published_at: new Date(),
                url: 'https://example.com/bitcoin',
            },
            {
                title: 'AI Revolution',
                description: 'AI is changing everything',
                content: 'AI content here',
                author: 'Tech Writer',
                source_name: 'The Guardian',
                category: 'technology',
                published_at: new Date(),
                url: 'https://example.com/ai-revolution',
            },
        ]);
    });

    // Cleanup
    afterAll(async () => {
        await SavedArticle.destroy({ where: { user_id: testUser.id }, force: true });
        await Article.destroy({ where: {}, force: true });
        await User.destroy({ where: { email: 'articletest@example.com' }, force: true });
    });

    // ==========================================
    // GET ALL ARTICLES TESTS
    // ==========================================
    describe('GET /api/articles', () => {
        test('Should get all articles with pagination', async () => {
            const response = await request(app)
                .get('/api/articles?page=1&limit=10')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.pagination).toHaveProperty('currentPage');
            expect(response.body.pagination).toHaveProperty('totalPages');
            expect(response.body.pagination).toHaveProperty('totalItems');
        });

        test('Should filter articles by source', async () => {
            const response = await request(app)
                .get('/api/articles?source=NewsAPI')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            response.body.data.forEach(article => {
                expect(article.source_name).toBe('NewsAPI');
            });
        });

        test('Should filter articles by category', async () => {
            const response = await request(app)
                .get('/api/articles?category=technology')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            response.body.data.forEach(article => {
                expect(article.category).toBe('technology');
            });
        });
    });

    // ==========================================
    // GET SINGLE ARTICLE TESTS
    // ==========================================
    describe('GET /api/articles/:id', () => {
        test('Should get single article by ID', async () => {
            const response = await request(app)
                .get(`/api/articles/${testArticle.id}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(testArticle.id);
            expect(response.body.data.title).toBe(testArticle.title);
        });

        test('Should return 404 for non-existent article', async () => {
            const response = await request(app)
                .get('/api/articles/99999')
                .expect('Content-Type', /json/)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('not found');
        });

        test('Should return 400 for invalid ID', async () => {
            const response = await request(app)
                .get('/api/articles/invalid-id')
                .expect(400);
        });
    });

    // ==========================================
    // SEARCH ARTICLES TESTS
    // ==========================================
    describe('GET /api/articles/search', () => {
        test('Should search articles by keyword', async () => {
            const response = await request(app)
                .get('/api/articles/search?q=bitcoin')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.query).toBe('bitcoin');
            expect(response.body.data).toBeInstanceOf(Array);
        });

        test('Should return empty array for no matches', async () => {
            const response = await request(app)
                .get('/api/articles/search?q=nonexistentkeyword12345')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(0);
        });

        test('Should fail without search query', async () => {
            const response = await request(app)
                .get('/api/articles/search')
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    // ==========================================
    // FILTER ARTICLES TESTS
    // ==========================================
    describe('GET /api/articles/filter', () => {
        test('Should filter by multiple criteria', async () => {
            const response = await request(app)
                .get('/api/articles/filter?source=NewsAPI&category=business')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.filters).toHaveProperty('source');
            expect(response.body.filters).toHaveProperty('category');
        });

        test('Should filter by date range', async () => {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            const endDate = new Date();

            const response = await request(app)
                .get(`/api/articles/filter?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    // ==========================================
    // SAVE ARTICLE TESTS
    // ==========================================
    describe('POST /api/articles/:id/save', () => {
        test('Should save article successfully', async () => {
            const response = await request(app)
                .post(`/api/articles/${testArticle.id}/save`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect('Content-Type', /json/)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('saved successfully');
        });

        test('Should return 200 if already saved', async () => {
            const response = await request(app)
                .post(`/api/articles/${testArticle.id}/save`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('already saved');
        });

        test('Should fail without authentication', async () => {
            const response = await request(app)
                .post(`/api/articles/${testArticle.id}/save`)
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('Should fail for non-existent article', async () => {
            const response = await request(app)
                .post('/api/articles/99999/save')
                .set('Authorization', `Bearer ${authToken}`)
                .expect('Content-Type', /json/)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    // ==========================================
    // GET SAVED ARTICLES TESTS
    // ==========================================
    describe('GET /api/articles/saved', () => {
        test('Should get saved articles', async () => {
            const response = await request(app)
                .get('/api/articles/saved')
                .set('Authorization', `Bearer ${authToken}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        test('Should fail without authentication', async () => {
            const response = await request(app)
                .get('/api/articles/saved')
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    // ==========================================
    // UNSAVE ARTICLE TESTS
    // ==========================================
    describe('DELETE /api/articles/:id/save', () => {
        test('Should unsave article successfully', async () => {
            const response = await request(app)
                .delete(`/api/articles/${testArticle.id}/save`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('removed');
        });

        test('Should fail for non-saved article', async () => {
            const response = await request(app)
                .delete(`/api/articles/${testArticle.id}/save`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect('Content-Type', /json/)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    // ==========================================
    // PERSONALIZED FEED TESTS
    // ==========================================
    describe('GET /api/articles/personalized', () => {
        test('Should get personalized feed', async () => {
            const response = await request(app)
                .get('/api/articles/personalized')
                .set('Authorization', `Bearer ${authToken}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        test('Should fail without authentication', async () => {
            const response = await request(app)
                .get('/api/articles/personalized')
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});
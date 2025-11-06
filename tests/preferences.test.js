const request = require('supertest');
const app = require('../server');
const { User, Preference } = require('../src/models');

describe('Preferences API Tests', () => {
    let authToken;
    let testUser;

    // Setup
    beforeAll(async () => {
        // Create test user
        const userResponse = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'preftest@example.com',
                password: 'Test123!@#',
                name: 'Preference Test User',
            });

        authToken = userResponse.body.data.token;
        testUser = userResponse.body.data.user;
    });

    // Cleanup
    afterAll(async () => {
        await Preference.destroy({ where: { user_id: testUser.id }, force: true });
        await User.destroy({ where: { email: 'preftest@example.com' }, force: true });
    });

    // ==========================================
    // GET PREFERENCES TESTS
    // ==========================================
    describe('GET /api/preferences', () => {
        test('Should get user preferences (creates if not exists)', async () => {
            const response = await request(app)
                .get('/api/preferences')
                .set('Authorization', `Bearer ${authToken}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('preferred_sources');
            expect(response.body.data).toHaveProperty('preferred_categories');
            expect(response.body.data).toHaveProperty('preferred_authors');
        });

        test('Should fail without authentication', async () => {
            const response = await request(app)
                .get('/api/preferences')
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    // ==========================================
    // UPDATE PREFERENCES TESTS
    // ==========================================
    describe('PUT /api/preferences', () => {
        test('Should update preferences successfully', async () => {
            const preferences = {
                preferred_sources: ['NewsAPI', 'The Guardian'],
                preferred_categories: ['technology', 'business'],
                preferred_authors: ['John Doe', 'Jane Smith'],
            };

            const response = await request(app)
                .put('/api/preferences')
                .set('Authorization', `Bearer ${authToken}`)
                .send(preferences)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.preferred_sources).toEqual(preferences.preferred_sources);
            expect(response.body.data.preferred_categories).toEqual(preferences.preferred_categories);
            expect(response.body.data.preferred_authors).toEqual(preferences.preferred_authors);
        });

        test('Should update partial preferences', async () => {
            const response = await request(app)
                .put('/api/preferences')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    preferred_sources: ['NewsAPI'],
                })
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.preferred_sources).toEqual(['NewsAPI']);
        });

        test('Should fail with invalid data type', async () => {
            const response = await request(app)
                .put('/api/preferences')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    preferred_sources: 'not-an-array',
                })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('Should fail without authentication', async () => {
            const response = await request(app)
                .put('/api/preferences')
                .send({
                    preferred_sources: ['NewsAPI'],
                })
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    // ==========================================
    // GET AVAILABLE SOURCES TESTS
    // ==========================================
    describe('GET /api/preferences/sources', () => {
        test('Should get available news sources', async () => {
            const response = await request(app)
                .get('/api/preferences/sources')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });
    });

    // ==========================================
    // GET AVAILABLE CATEGORIES TESTS
    // ==========================================
    describe('GET /api/preferences/categories', () => {
        test('Should get available categories', async () => {
            const response = await request(app)
                .get('/api/preferences/categories')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });
    });
});
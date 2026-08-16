const request = require('supertest');
const app = require('../server');
const { User, ApiLog } = require('../src/models');

describe('Admin API Tests', () => {
    let authToken;
    let testUser;

    // Setup
    beforeAll(async () => {
        // Create test user
        const userResponse = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'admin@example.com',
                password: 'Admin123!@#',
                name: 'Admin User',
            });

        authToken = userResponse.body.data.token;
        testUser = userResponse.body.data.user;

        // Create test logs
        await ApiLog.bulkCreate([
            {
                api_source: 'NewsAPI',
                endpoint: '/top-headlines',
                status_code: 200,
                response_time_ms: 245,
            },
            {
                api_source: 'The Guardian',
                endpoint: '/search',
                status_code: 200,
                response_time_ms: 312,
            },
            {
                api_source: 'New York Times',
                endpoint: '/topstories',
                status_code: 200,
                response_time_ms: 450,
            },
        ]);
    });

    // Cleanup
    afterAll(async () => {
        await ApiLog.destroy({ where: {}, force: true });
        await User.destroy({ where: { email: 'admin@example.com' }, force: true });
    });

    // ==========================================
    // GET API STATS TESTS
    // ==========================================
    describe('GET /api/admin/api-logs/stats', () => {
        test('Should get API statistics', async () => {
            const response = await request(app)
                .get('/api/admin/api-logs/stats?days=7')
                .set('Authorization', `Bearer ${authToken}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('period');
            expect(response.body.data).toHaveProperty('summary');
            expect(response.body.data).toHaveProperty('bySource');
            expect(response.body.data.bySource).toBeInstanceOf(Array);
        });

        test('Should fail without authentication', async () => {
            const response = await request(app)
                .get('/api/admin/api-logs/stats')
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    // ==========================================
    // GET API LOGS TESTS
    // ==========================================
    describe('GET /api/admin/api-logs', () => {
        test('Should get API logs with pagination', async () => {
            const response = await request(app)
                .get('/api/admin/api-logs?page=1&limit=10')
                .set('Authorization', `Bearer ${authToken}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.pagination).toBeDefined();
        });

        test('Should filter logs by source', async () => {
            const response = await request(app)
                .get('/api/admin/api-logs?source=NewsAPI')
                .set('Authorization', `Bearer ${authToken}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            response.body.data.forEach(log => {
                expect(log.api_source).toBe('NewsAPI');
            });
        });
    });

    // ==========================================
    // GET LOGS BY SOURCE TESTS
    // ==========================================
    describe('GET /api/admin/api-logs/source/:source', () => {
        test('Should get logs for specific source', async () => {
            const response = await request(app)
                .get('/api/admin/api-logs/source/NewsAPI')
                .set('Authorization', `Bearer ${authToken}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('NewsAPI');
        });
    });

    // ==========================================
    // CLEANUP OLD LOGS TESTS
    // ==========================================
    describe('DELETE /api/admin/api-logs/cleanup', () => {
        test('Should cleanup old logs', async () => {
            const response = await request(app)
                .delete('/api/admin/api-logs/cleanup')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ days: 30 })
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('Deleted');
        });
    });
});
const request = require('supertest');
const app = require('../server');
const { User } = require('../src/models');

describe('Authentication API Tests', () => {
    let authToken;
    let testUser;

    // Test user data
    const validUser = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
    };

    // Cleanup before tests
    beforeAll(async () => {
        // Delete test user if exists
        await User.destroy({ where: { email: validUser.email }, force: true });
    });

    // Cleanup after tests
    afterAll(async () => {
        // Delete test user
        await User.destroy({ where: { email: validUser.email }, force: true });
    });

    // ==========================================
    // REGISTRATION TESTS
    // ==========================================
    describe('POST /api/auth/register', () => {
        test('Should register a new user successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(validUser)
                .expect('Content-Type', /json/)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('registered successfully');
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.user.email).toBe(validUser.email);
            expect(response.body.data.user).not.toHaveProperty('password');

            // Save token for later tests
            authToken = response.body.data.token;
            testUser = response.body.data.user;
        });

        test('Should fail with duplicate email', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(validUser)
                .expect('Content-Type', /json/)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already exists');
        });

        test('Should fail with invalid email', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'Test123!@#',
                    name: 'Test User',
                })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('Should fail with weak password', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'newuser@example.com',
                    password: '123', // Too short
                    name: 'Test User',
                })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('Should fail with missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test2@example.com',
                    // Missing password
                })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    // ==========================================
    // LOGIN TESTS
    // ==========================================
    describe('POST /api/auth/login', () => {
        test('Should login successfully with correct credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: validUser.email,
                    password: validUser.password,
                })
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data.user.email).toBe(validUser.email);
        });

        test('Should fail with incorrect password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: validUser.email,
                    password: 'WrongPassword123',
                })
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('Should fail with non-existent user', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'Test123!@#',
                })
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('Should fail with missing credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: validUser.email,
                    // Missing password
                })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    // ==========================================
    // GET PROFILE TESTS
    // ==========================================
    describe('GET /api/auth/me', () => {
        test('Should get user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(validUser.email);
            expect(response.body.data.user).not.toHaveProperty('password');
        });

        test('Should fail without token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('Should fail with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid_token')
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    // ==========================================
    // UPDATE PROFILE TESTS
    // ==========================================
    describe('PUT /api/auth/profile', () => {
        test('Should update profile successfully', async () => {
            const updates = {
                name: 'Updated Name',
            };

            const response = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updates)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.name).toBe(updates.name);
        });

        test('Should fail to update with invalid email', async () => {
            const response = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    email: 'invalid-email',
                })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('Should fail without authentication', async () => {
            const response = await request(app)
                .put('/api/auth/profile')
                .send({ name: 'New Name' })
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    // ==========================================
    // CHANGE PASSWORD TESTS
    // ==========================================
    describe('PUT /api/auth/change-password', () => {
        test('Should change password successfully', async () => {
            const response = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    currentPassword: validUser.password,
                    newPassword: 'NewPass123!@#',
                    confirmPassword: 'NewPass123!@#',
                })
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('changed successfully');

            // Update password for future tests
            validUser.password = 'NewPass123!@#';
        });

        test('Should fail with incorrect current password', async () => {
            const response = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    currentPassword: 'WrongPassword',
                    newPassword: 'NewPass123!@#',
                    confirmPassword: 'NewPass123!@#',
                })
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('Should fail when passwords do not match', async () => {
            const response = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    currentPassword: validUser.password,
                    newPassword: 'NewPass123!@#',
                    confirmPassword: 'DifferentPass123!@#',
                })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    // ==========================================
    // LOGOUT TESTS
    // ==========================================
    describe('POST /api/auth/logout', () => {
        test('Should logout successfully', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${authToken}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        test('Should fail without token', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});
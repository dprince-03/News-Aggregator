const request = require('supertest');
const app = require('../server'); // Assuming your express app is exported from server.js
const setupTestDB = require('./test-setup');
const { User, RefreshToken } = require('../src/models');
const { generateResetToken, persistResetToken } = require('../src/middleware/auth.middleware');

describe('Auth Endpoints', () => {
  setupTestDB();
  let token;

  beforeEach(async () => {
    // Log in the test user to get a token for authenticated routes
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password123!' });
    token = res.body.data?.token;
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'Password123!',
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message', 'User registered successfully');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should fail to register a user with an existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        });
      expect(res.statusCode).toEqual(409);
      expect(res.body).toHaveProperty('message', 'User with this email already exists');
    });

    it('should fail with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test' });
      expect(res.statusCode).toEqual(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in an existing user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should fail with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user profile with a valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.user).toHaveProperty('email', 'test@example.com');
    });

    it('should fail without an authentication token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile successfully', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.user).toHaveProperty('name', 'Updated Name');

      const user = await User.findOne({ where: { email: 'test@example.com' } });
      expect(user.name).toBe('Updated Name');
    });
  });

  describe('PUT /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Password changed successfully');

      // Verify new password works
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'NewPassword123!' });
      expect(loginRes.statusCode).toEqual(200);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('issues a new token pair and rotates (revokes) the old refresh token', async () => {
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' });
      const originalRefreshToken = login.body.data.refreshToken;

      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: originalRefreshToken });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.refreshToken).not.toEqual(originalRefreshToken);

      // Rotation: the original refresh token must be rejected on reuse
      const reuse = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: originalRefreshToken });
      expect(reuse.statusCode).toEqual(401);
    });

    it('rejects a refresh token that was already revoked via logout', async () => {
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' });
      const { token, refreshToken } = login.body.data;

      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({ refreshToken });

      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });
      expect(res.statusCode).toEqual(401);
    });

    it('rejects a missing refresh token with 400, not a 500', async () => {
      const res = await request(app).post('/api/auth/refresh-token').send({});
      expect(res.statusCode).toEqual(400);
    });

    it('rejects a malformed/garbage refresh token with 401, not a crash', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'not-a-real-jwt' });
      expect(res.statusCode).toEqual(401);
    });

    it('issues distinct refresh tokens for rapid consecutive logins (jti collision fix)', async () => {
      // Regression test for a real bug: two logins in the same second
      // produced byte-identical refresh tokens (no unique claim beyond a
      // second-precision iat), colliding on token_hash's unique DB
      // constraint on the second insert. See CHANGELOG.md.
      const [first, second, third] = await Promise.all([
        request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'Password123!' }),
        request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'Password123!' }),
        request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'Password123!' }),
      ]);

      [first, second, third].forEach((res) => expect(res.statusCode).toEqual(200));

      const tokens = [first, second, third].map((res) => res.body.data.refreshToken);
      expect(new Set(tokens).size).toBe(3);
    });
  });

  describe('POST /api/auth/change-password (refresh token revocation)', () => {
    it('revokes every refresh token for the user, not just the one used to authenticate', async () => {
      const loginA = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' });
      const loginB = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' });

      await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${loginA.body.data.token}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'AnotherPassword456!',
          confirmPassword: 'AnotherPassword456!',
        })
        .expect(200);

      // loginB's refresh token was issued before the password change and
      // never used directly in the change-password request - it should
      // still be revoked, because changing a password should sign out
      // every session, not just the one that made the request.
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: loginB.body.data.refreshToken });
      expect(res.statusCode).toEqual(401);

      const user = await User.findOne({ where: { email: 'test@example.com' } });
      const remaining = await RefreshToken.count({ where: { user_id: user.id, revoked_at: null } });
      expect(remaining).toBe(0);
    });
  });

  describe('POST /api/auth/reset-password (single-use enforcement)', () => {
    it('resets the password successfully with a freshly-issued token', async () => {
      const user = await User.findOne({ where: { email: 'test@example.com' } });
      const resetToken = generateResetToken(user);
      await persistResetToken(user, resetToken);

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'ResetPassword123!',
          confirmPassword: 'ResetPassword123!',
        });
      expect(res.statusCode).toEqual(200);

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'ResetPassword123!' });
      expect(loginRes.statusCode).toEqual(200);
    });

    it('rejects reusing an already-consumed reset token, even though the JWT itself is still valid', async () => {
      const user = await User.findOne({ where: { email: 'test@example.com' } });
      const resetToken = generateResetToken(user);
      await persistResetToken(user, resetToken);

      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'ResetPassword123!',
          confirmPassword: 'ResetPassword123!',
        })
        .expect(200);

      const reuse = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'AnotherPassword456!',
          confirmPassword: 'AnotherPassword456!',
        });
      expect(reuse.statusCode).toEqual(400);
      expect(reuse.body.message).toMatch(/already been used/i);
    });

    it('rejects an unknown/never-issued reset token', async () => {
      const user = await User.findOne({ where: { email: 'test@example.com' } });
      const resetToken = generateResetToken(user);
      // Never persisted, so consumeResetToken finds no matching row.

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'ResetPassword123!',
          confirmPassword: 'ResetPassword123!',
        });
      expect(res.statusCode).toEqual(400);
    });
  });

  describe('Concurrent session limit', () => {
    it('caps active refresh tokens per user, revoking the oldest past the limit', async () => {
      // MAX_ACTIVE_SESSIONS defaults to 5 when unset.
      const maxSessions = Number.parseInt(process.env.MAX_ACTIVE_SESSIONS, 10) || 5;
      const logins = [];
      for (let i = 0; i < maxSessions + 1; i += 1) {
        // Sequential, not parallel: enforceSessionLimit reads-then-writes,
        // so concurrent logins could race past the cap.
        // eslint-disable-next-line no-await-in-loop
        const res = await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'Password123!' });
        logins.push(res.body.data.refreshToken);
      }

      const user = await User.findOne({ where: { email: 'test@example.com' } });
      const active = await RefreshToken.count({ where: { user_id: user.id, revoked_at: null } });
      expect(active).toBe(maxSessions);

      // The very first login's refresh token should have been the one
      // revoked to make room, since sessions are evicted oldest-first.
      const oldest = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: logins[0] });
      expect(oldest.statusCode).toEqual(401);

      // The most recent login's refresh token must still be usable.
      const newest = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: logins[logins.length - 1] });
      expect(newest.statusCode).toEqual(200);
    });
  });
});

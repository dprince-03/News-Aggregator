const request = require('supertest');
const app = require('../server');
const { User, Article, Preference } = require('../src/models');

describe('Integration Tests - Complete User Flow', () => {
    let authToken;
    let userId;
    let articleId;

    test('Complete user journey', async () => {
        // Step 1: Register
        console.log('\n🔸 Step 1: Register user');
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'integration@example.com',
                password: 'Test123!@#',
                name: 'Integration Test User',
            })
            .expect(201);

        expect(registerResponse.body.success).toBe(true);
        authToken = registerResponse.body.data.token;
        userId = registerResponse.body.data.user.id;
        console.log('✅ User registered successfully');

        // Step 2: Get profile
        console.log('\n🔸 Step 2: Get user profile');
        const profileResponse = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(profileResponse.body.data.user.email).toBe('integration@example.com');
        console.log('✅ Profile retrieved');

        // Step 3: Set preferences
        console.log('\n🔸 Step 3: Set user preferences');
        const prefResponse = await request(app)
            .put('/api/preferences')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                preferred_sources: ['NewsAPI', 'The Guardian'],
                preferred_categories: ['technology', 'business'],
            })
            .expect(200);

        expect(prefResponse.body.data.preferred_sources).toContain('NewsAPI');
        console.log('✅ Preferences set');

        // Step 4: Get articles
        console.log('\n🔸 Step 4: Browse articles');
        const articlesResponse = await request(app)
            .get('/api/articles?page=1&limit=5')
            .expect(200);

        expect(articlesResponse.body.data).toBeInstanceOf(Array);
        if (articlesResponse.body.data.length > 0) {
            articleId = articlesResponse.body.data[0].id;
        }
        console.log(`✅ Found ${articlesResponse.body.data.length} articles`);

        // Step 5: Search articles
        console.log('\n🔸 Step 5: Search articles');
        const searchResponse = await request(app)
            .get('/api/articles/search?q=tech')
            .expect(200);

        expect(searchResponse.body.success).toBe(true);
        console.log('✅ Search completed');

        // Step 6: Save article (if available)
        if (articleId) {
            console.log('\n🔸 Step 6: Save article');
            const saveResponse = await request(app)
                .post(`/api/articles/${articleId}/save`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(201);

            expect(saveResponse.body.success).toBe(true);
            console.log('✅ Article saved');

            // Step 7: Get saved articles
            console.log('\n🔸 Step 7: Get saved articles');
            const savedResponse = await request(app)
                .get('/api/articles/saved')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(savedResponse.body.data.length).toBeGreaterThan(0);
            console.log('✅ Saved articles retrieved');
        }

        // Step 8: Get personalized feed
        console.log('\n🔸 Step 8: Get personalized feed');
        const feedResponse = await request(app)
            .get('/api/articles/personalized')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(feedResponse.body.success).toBe(true);
        console.log('✅ Personalized feed loaded');

        // Step 9: Update profile
        console.log('\n🔸 Step 9: Update profile');
        const updateResponse = await request(app)
            .put('/api/auth/profile')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name: 'Updated Name' })
            .expect(200);

        expect(updateResponse.body.data.user.name).toBe('Updated Name');
        console.log('✅ Profile updated');

        // Step 10: Change password
        console.log('\n🔸 Step 10: Change password');
        const passwordResponse = await request(app)
            .put('/api/auth/change-password')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                currentPassword: 'Test123!@#',
                newPassword: 'NewPass123!@#',
                confirmPassword: 'NewPass123!@#',
            })
            .expect(200);

        expect(passwordResponse.body.success).toBe(true);
        console.log('✅ Password changed');

        // Step 11: Logout
        console.log('\n🔸 Step 11: Logout');
        const logoutResponse = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(logoutResponse.body.success).toBe(true);
        console.log('✅ User logged out');

        console.log('\n🎉 Complete user journey successful!\n');

        // Cleanup
        await User.destroy({ where: { email: 'integration@example.com' }, force: true });
    }, 60000);
});
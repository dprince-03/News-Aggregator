const { User, Article, Preference, SavedArticle } = require('../src/models');

describe('Database Models Tests', () => {
    // ==========================================
    // USER MODEL TESTS
    // ==========================================
    describe('User Model', () => {
        let testUser;

        afterEach(async () => {
            if (testUser) {
                await User.destroy({ where: { id: testUser.id }, force: true });
            }
        });

        test('Should create user with hashed password', async () => {
            testUser = await User.create({
                email: 'modeltest@example.com',
                password: 'Password123',
                name: 'Model Test',
            });

            expect(testUser.email).toBe('modeltest@example.com');
            expect(testUser.password).not.toBe('Password123'); // Should be hashed
            expect(testUser.password.length).toBeGreaterThan(20);
        });

        test('Should compare passwords correctly', async () => {
            testUser = await User.create({
                email: 'pwdtest@example.com',
                password: 'Password123',
                name: 'Test',
            });

            const isValid = await testUser.comparePassword('Password123');
            const isInvalid = await testUser.comparePassword('WrongPassword');

            expect(isValid).toBe(true);
            expect(isInvalid).toBe(false);
        });

        test('Should not include password in JSON', async () => {
            testUser = await User.create({
                email: 'jsontest@example.com',
                password: 'Password123',
                name: 'Test',
            });

            const json = testUser.toJSON();
            expect(json).not.toHaveProperty('password');
            expect(json).toHaveProperty('email');
        });

        test('Should fail with duplicate email', async () => {
            await User.create({
                email: 'duplicate@example.com',
                password: 'Password123',
                name: 'Test',
            });

            await expect(
                User.create({
                    email: 'duplicate@example.com',
                    password: 'Password123',
                    name: 'Test',
                })
            ).rejects.toThrow();

            // Cleanup
            await User.destroy({ where: { email: 'duplicate@example.com' }, force: true });
        });
    });

    // ==========================================
    // ARTICLE MODEL TESTS
    // ==========================================
    describe('Article Model', () => {
        let testArticle;

        afterEach(async () => {
            if (testArticle) {
                await Article.destroy({ where: { id: testArticle.id }, force: true });
            }
        });

        test('Should create article successfully', async () => {
            testArticle = await Article.create({
                title: 'Test Article',
                description: 'Test description',
                content: 'Test content',
                author: 'Test Author',
                source_name: 'Test Source',
                category: 'technology',
                published_at: new Date(),
                url: 'https://example.com/test-unique-url-' + Date.now(),
            });

            expect(testArticle.title).toBe('Test Article');
            expect(testArticle.source_name).toBe('Test Source');
        });

        test('Should search articles by keyword', async () => {
            testArticle = await Article.create({
                title: 'Bitcoin Price Analysis',
                description: 'Bitcoin market trends',
                content: 'Bitcoin content',
                author: 'Crypto Expert',
                source_name: 'CryptoNews',
                published_at: new Date(),
                url: 'https://example.com/bitcoin-' + Date.now(),
            });

            const results = await Article.searchArticles('bitcoin', { limit: 10 });

            expect(results.count).toBeGreaterThan(0);
            expect(results.rows[0].title).toContain('Bitcoin');
        });

        test('Should filter articles', async () => {
            testArticle = await Article.create({
                title: 'Tech Article',
                source_name: 'TechSource',
                category: 'technology',
                published_at: new Date(),
                url: 'https://example.com/tech-' + Date.now(),
            });

            const results = await Article.filterArticles(
                { source: 'TechSource', category: 'technology' },
                { limit: 10 }
            );

            expect(results.count).toBeGreaterThan(0);
        });
    });

    // ==========================================
    // PREFERENCE MODEL TESTS
    // ==========================================
    describe('Preference Model', () => {
        let testUser;
        let testPreference;

        beforeEach(async () => {
            testUser = await User.create({
                email: 'prefmodel@example.com',
                password: 'Password123',
                name: 'Pref Test',
            });
        });

        afterEach(async () => {
            if (testPreference) {
                await Preference.destroy({ where: { id: testPreference.id }, force: true });
            }
            if (testUser) {
                await User.destroy({ where: { id: testUser.id }, force: true });
            }
        });

        test('Should create preferences for user', async () => {
            const { preference, created } = await Preference.getOrCreateForUser(testUser.id);

            expect(created).toBe(true);
            expect(preference.user_id).toBe(testUser.id);
            expect(preference.preferred_sources).toEqual([]);

            testPreference = preference;
        });

        test('Should update preferences for user', async () => {
            testPreference = await Preference.updateForUser(testUser.id, {
                preferred_sources: ['NewsAPI', 'Guardian'],
                preferred_categories: ['tech', 'business'],
            });

            expect(testPreference.preferred_sources).toEqual(['NewsAPI', 'Guardian']);
            expect(testPreference.preferred_categories).toEqual(['tech', 'business']);
        });
    });

    // ==========================================
    // SAVED ARTICLE MODEL TESTS
    // ==========================================
    describe('SavedArticle Model', () => {
        let testUser;
        let testArticle;

        beforeEach(async () => {
            testUser = await User.create({
                email: 'savedtest@example.com',
                password: 'Password123',
                name: 'Saved Test',
            });

            testArticle = await Article.create({
                title: 'Saved Article Test',
                source_name: 'Test Source',
                published_at: new Date(),
                url: 'https://example.com/saved-' + Date.now(),
            });
        });

        afterEach(async () => {
            await SavedArticle.destroy({ where: { user_id: testUser.id }, force: true });
            await Article.destroy({ where: { id: testArticle.id }, force: true });
            await User.destroy({ where: { id: testUser.id }, force: true });
        });

        test('Should save article for user', async () => {
            const { savedArticle, created } = await SavedArticle.saveArticleForUser(
                testUser.id,
                testArticle.id
            );

            expect(created).toBe(true);
            expect(savedArticle.user_id).toBe(testUser.id);
            expect(savedArticle.article_id).toBe(testArticle.id);
        });

        test('Should not create duplicate saved article', async () => {
            await SavedArticle.saveArticleForUser(testUser.id, testArticle.id);

            const { created } = await SavedArticle.saveArticleForUser(testUser.id, testArticle.id);

            expect(created).toBe(false);
        });

        test('Should unsave article for user', async () => {
            await SavedArticle.saveArticleForUser(testUser.id, testArticle.id);

            const deleted = await SavedArticle.unsaveArticleForUser(testUser.id, testArticle.id);

            expect(deleted).toBe(1);
        });

        test('Should get saved articles for user', async () => {
            await SavedArticle.saveArticleForUser(testUser.id, testArticle.id);

            const { count, rows } = await SavedArticle.getSavedArticlesForUser(testUser.id, {
                limit: 10,
            });

            expect(count).toBe(1);
            expect(rows[0].article_id).toBe(testArticle.id);
        });
    });
});
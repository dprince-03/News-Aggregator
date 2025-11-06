const newsApiService = require('../src/services/news_api.services');
const guardianService = require('../src/services/guardian.services');
const nytService = require('../src/services/nyt.services');
const aggregatorService = require('../src/services/aggregator.services');

describe('External API Services Tests', () => {
    // Skip if API keys not configured
    const hasNewsApiKey = !!process.env.NEWSAPI_KEY;
    const hasGuardianKey = !!process.env.GUARDIAN_API_KEY;
    const hasNytKey = !!process.env.NYT_API_KEY;

    // ==========================================
    // NEWS API SERVICE TESTS
    // ==========================================
    describe('NewsAPI Service', () => {
        test.skipIf(!hasNewsApiKey)('Should fetch top headlines', async () => {
            const result = await newsApiService.fetchTopHeadlines({
                pageSize: 5,
            });

            expect(result.success).toBe(true);
            expect(result.articles).toBeInstanceOf(Array);
            expect(result.articles.length).toBeGreaterThan(0);
            expect(result.articles[0]).toHaveProperty('title');
        }, 10000);
    });

    // ==========================================
    // NYT SERVICE TESTS
    // ==========================================
    describe('NYT Service', () => {
        test.skipIf(!hasNytKey)('Should fetch top stories', async () => {
            const result = await nytService.fetchTopStories('home');

            expect(result.success).toBe(true);
            expect(result.articles).toBeInstanceOf(Array);
            expect(result.articles.length).toBeGreaterThan(0);
            expect(result.articles[0]).toHaveProperty('title');
        }, 10000);
    });

    // ==========================================
    // AGGREGATOR SERVICE TESTS
    // ==========================================
    describe('Aggregator Service', () => {
        test.skipIf(!hasNewsApiKey && !hasGuardianKey && !hasNytKey)(
            'Should aggregate from all sources',
            async () => {
                const articles = await aggregatorService.fetchFromAllSources({
                    limit: 10,
                });

                expect(articles).toBeInstanceOf(Array);
                expect(articles.length).toBeGreaterThan(0);
            },
            30000
        );
    });
});
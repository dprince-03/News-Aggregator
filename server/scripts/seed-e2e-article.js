#!/usr/bin/env node
/**
 * Inserts one deterministic article so the client's E2E suite
 * (client/e2e/critical-path.spec.js) has something real to search for and
 * save, without depending on live external news APIs (which are flaky/
 * rate-limited/occasionally-invalid-keyed in CI - see docs/TODO.md).
 *
 * Idempotent: findOrCreate keyed on the fixed URL below.
 */
require('dotenv').config();
const { Article, sequelize } = require('../src/models');

const E2E_ARTICLE = {
    title: 'E2E Test Article: Something Newsworthy Happened',
    description: 'A description used only by the client E2E suite to verify search/save flows.',
    content: 'Full body content for the E2E test article.',
    author: 'E2E Test Author',
    source_name: 'E2E Test Source',
    category: 'technology',
    published_at: new Date(),
    url: 'https://example.com/e2e-test-article',
    url_to_image: null,
};

(async () => {
    try {
        const [article] = await Article.findOrCreate({
            where: { url: E2E_ARTICLE.url },
            defaults: E2E_ARTICLE,
        });
        console.log(`E2E seed article ready (id: ${article.id}).`);
        process.exit(0);
    } catch (error) {
        console.error('Failed to seed E2E article:', error.message);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
})();

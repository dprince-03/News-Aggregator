#!/usr/bin/env node
/**
 * Inserts one deterministic article, plus the Category/NewsSource rows it
 * references, so the client's E2E suite (client/e2e/critical-path.spec.js)
 * has something real to search/save/pick-a-preference-chip for, without
 * depending on live external news APIs (which are flaky/rate-limited/
 * occasionally-invalid-keyed in CI - see docs/TODO.md).
 *
 * The article alone isn't enough: inserting it directly (instead of going
 * through aggregator.service.js's normal save pipeline) skips whatever
 * would otherwise upsert matching Category/NewsSource rows, leaving the
 * Preferences page's source/category pick-lists empty in a fresh DB -
 * the E2E "preferences can be updated" test needs a real chip to click.
 *
 * Idempotent: findOrCreate keyed on each row's natural unique key.
 */
require('dotenv').config();
const { Article, Category, NewsSource, sequelize } = require('../src/models');

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
        await Category.findOrCreate({
            where: { name: E2E_ARTICLE.category },
            defaults: { name: E2E_ARTICLE.category, display_name: 'Technology' },
        });

        await NewsSource.findOrCreate({
            where: { name: E2E_ARTICLE.source_name },
            defaults: { name: E2E_ARTICLE.source_name, display_name: E2E_ARTICLE.source_name, is_active: true },
        });

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

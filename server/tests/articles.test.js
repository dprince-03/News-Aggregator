const request = require('supertest');
const app = require('../server');
const setupTestDB = require('./test-setup');
const { Article, SavedArticle } = require('../src/models');

describe('Article Endpoints', () => {
  setupTestDB();
  let token;
  let article;

  beforeEach(async () => {
    // Login user
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password123!' });
    token = res.body.accessToken;

    // Seed an article
    article = await Article.create({
      title: 'Test Article',
      content: 'This is a test article.',
      url: 'http://example.com/article',
      sourceName: 'Example News',
      publishedAt: new Date(),
    });
  });

  describe('GET /api/articles', () => {
    it('should get all articles (paginated)', async () => {
      const res = await request(app).get('/api/articles?page=1&limit=10');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Test Article');
    });
  });

  describe('GET /api/articles/:id', () => {
    it('should get a single article by ID', async () => {
      const res = await request(app).get(`/api/articles/${article.id}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('title', 'Test Article');
    });

    it('should return 404 for a non-existent article', async () => {
      const res = await request(app).get('/api/articles/9999');
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('POST /api/articles/:id/save', () => {
    it('should allow an authenticated user to save an article', async () => {
      const res = await request(app)
        .post(`/api/articles/${article.id}/save`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message', 'Article saved successfully');

      const saved = await SavedArticle.findOne({ where: { ArticleId: article.id } });
      expect(saved).not.toBeNull();
    });

    it('should not allow saving an article twice', async () => {
      await request(app)
        .post(`/api/articles/${article.id}/save`)
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .post(`/api/articles/${article.id}/save`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(409);
    });
  });

  describe('GET /api/articles/saved', () => {
    it('should get all saved articles for the authenticated user', async () => {
      await request(app)
        .post(`/api/articles/${article.id}/save`)
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .get('/api/articles/saved')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].article.title).toBe('Test Article');
    });
  });

  describe('DELETE /api/articles/:id/save', () => {
    it('should allow an authenticated user to unsave an article', async () => {
      await request(app)
        .post(`/api/articles/${article.id}/save`)
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .delete(`/api/articles/${article.id}/save`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Article unsaved successfully');

      const saved = await SavedArticle.findOne({ where: { ArticleId: article.id } });
      expect(saved).toBeNull();
    });
  });
});
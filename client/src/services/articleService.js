import api from '../utils/api';

// Article list endpoints return { success, message, data: [...], pagination }.
// Normalize to { articles, pagination, ... } so pages don't need to know the
// wire format, and `pagination` (already computed server-side) replaces the
// old `articles.length === 20` guess at whether another page exists.
const toArticleList = (body) => {
  const { data, ...rest } = body;
  return { ...rest, articles: data || [] };
};

const articleService = {
  // Get all articles with pagination
  async getArticles(page = 1, limit = 20) {
    const response = await api.get('/articles', {
      params: { page, limit }
    });
    return toArticleList(response.data);
  },

  // Get single article by ID
  async getArticleById(id) {
    const response = await api.get(`/articles/${id}`);
    return { ...response.data, article: response.data.data };
  },

  // Search articles
  async searchArticles(keyword, page = 1, limit = 20) {
    const response = await api.get('/articles/search', {
      params: { q: keyword, page, limit }
    });
    return toArticleList(response.data);
  },

  // Filter articles
  async filterArticles(filters, page = 1, limit = 20) {
    const response = await api.get('/articles/filter', {
      params: { ...filters, page, limit }
    });
    return toArticleList(response.data);
  },

  // Get personalized feed
  async getPersonalizedFeed(page = 1, limit = 20) {
    const response = await api.get('/articles/personalized', {
      params: { page, limit }
    });
    return toArticleList(response.data);
  },

  // Get saved articles
  async getSavedArticles(page = 1, limit = 20) {
    const response = await api.get('/articles/saved', {
      params: { page, limit }
    });
    return toArticleList(response.data);
  },

  // Save/bookmark article
  async saveArticle(articleId) {
    const response = await api.post(`/articles/${articleId}/save`);
    return response.data;
  },

  // Unsave/unbookmark article
  async unsaveArticle(articleId) {
    const response = await api.delete(`/articles/${articleId}/save`);
    return response.data;
  }
};

export default articleService;

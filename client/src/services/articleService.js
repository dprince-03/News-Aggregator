import api from '../utils/api';

const articleService = {
  // Get all articles with pagination
  async getArticles(page = 1, limit = 20) {
    const response = await api.get('/articles', {
      params: { page, limit }
    });
    return response.data;
  },

  // Get single article by ID
  async getArticleById(id) {
    const response = await api.get(`/articles/${id}`);
    return response.data;
  },

  // Search articles
  async searchArticles(keyword, page = 1, limit = 20) {
    const response = await api.get('/articles/search', {
      params: { keyword, page, limit }
    });
    return response.data;
  },

  // Filter articles
  async filterArticles(filters, page = 1, limit = 20) {
    const response = await api.get('/articles/filter', {
      params: { ...filters, page, limit }
    });
    return response.data;
  },

  // Get personalized feed
  async getPersonalizedFeed(page = 1, limit = 20) {
    const response = await api.get('/articles/personalized', {
      params: { page, limit }
    });
    return response.data;
  },

  // Get saved articles
  async getSavedArticles(page = 1, limit = 20) {
    const response = await api.get('/articles/saved', {
      params: { page, limit }
    });
    return response.data;
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

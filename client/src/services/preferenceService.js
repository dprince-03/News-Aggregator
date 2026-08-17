import api from '../utils/api';

const preferenceService = {
  // Get user preferences
  async getPreferences() {
    const response = await api.get('/preferences');
    return { ...response.data, preferences: response.data.data };
  },

  // Update user preferences
  async updatePreferences(preferences) {
    const response = await api.put('/preferences', preferences);
    return { ...response.data, preferences: response.data.data };
  },

  // Get available news sources
  async getAvailableSources() {
    const response = await api.get('/preferences/sources');
    return { ...response.data, sources: response.data.data };
  },

  // Get available categories
  async getAvailableCategories() {
    const response = await api.get('/preferences/categories');
    return { ...response.data, categories: response.data.data };
  }
};

export default preferenceService;

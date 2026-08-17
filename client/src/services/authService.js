import api from '../utils/api';

// The backend wraps payloads as { success, message, data: {...} } - unwrap
// `data` into the top-level shape the rest of the app expects (data.user,
// data.token, ...) in one place instead of at every call site.
const unwrap = (response) => ({ ...response.data, ...response.data.data });

const authService = {
  // Register new user
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    const data = unwrap(response);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  // Login user
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    const data = unwrap(response);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  // Logout user
  async logout() {
    try {
      await api.post('/auth/logout', { refreshToken: localStorage.getItem('refreshToken') });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  // Exchange the stored refresh token for a new access token
  async refreshAccessToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post('/auth/refresh-token', { refreshToken });
    const data = unwrap(response);
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data;
  },

  // Complete an OAuth redirect (Google/Facebook/Twitter): the backend
  // issues tokens and sends the browser to /auth/success?token=...&refreshToken=...
  // - store them, then fetch the profile they belong to.
  async completeOAuthLogin(token, refreshToken) {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    const data = await this.getProfile();
    return data;
  },

  // Get current user profile
  async getProfile() {
    const response = await api.get('/auth/me');
    const data = unwrap(response);
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  // Update user profile
  async updateProfile(userData) {
    const response = await api.put('/auth/profile', userData);
    const data = unwrap(response);
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  // Change password
  async changePassword(passwordData) {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  },

  // Forgot password
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  async resetPassword(resetData) {
    const response = await api.post('/auth/reset-password', resetData);
    return unwrap(response);
  },

  // Get current user from localStorage
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get token from localStorage
  getToken() {
    return localStorage.getItem('token');
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  }
};

export default authService;

import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const clearSessionAndRedirect = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      // On a 401, try one silent refresh-token exchange before giving up -
      // avoids logging the user out just because the access token expired
      // mid-session. Skipped for the auth endpoints themselves so a bad
      // login/refresh-token attempt doesn't recurse.
      const isAuthRoute = originalRequest?.url?.includes('/auth/');
      if (error.response.status === 401 && !originalRequest._retry && !isAuthRoute) {
        originalRequest._retry = true;
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
          try {
            const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('refreshToken', data.data.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${data.data.token}`;
            return api(originalRequest);
          } catch (refreshError) {
            clearSessionAndRedirect();
            return Promise.reject(refreshError);
          }
        }

        clearSessionAndRedirect();
      }

      // Extract error message
      const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
      error.message = message;
    } else if (error.request) {
      error.message = 'Network error. Please check your connection.';
    }

    return Promise.reject(error);
  }
);

export default api;

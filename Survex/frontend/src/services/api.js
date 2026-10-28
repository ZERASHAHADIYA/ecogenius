import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  googleLogin: (token) => api.post('/auth/google-login', { token }),
  getCurrentUser: () => api.get('/auth/me'),
  verifyToken: (token) => api.post('/auth/verify-token', { token })
};

// Challenge APIs
export const challenges = {
  getAll: (params) => api.get('/challenges', { params }),
  getById: (id) => api.get(`/challenges/${id}`),
  create: (data) => api.post('/challenges', data),
  update: (id, data) => api.put(`/challenges/${id}`, data),
  delete: (id) => api.delete(`/challenges/${id}`),
  join: (id) => api.post(`/challenges/${id}/join`),
  getStats: () => api.get('/challenges/stats')
};

// Submission APIs
export const submissions = {
  create: (formData) => api.post('/submissions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getPending: () => api.get('/submissions/pending'),
  verify: (id, data) => api.post(`/submissions/${id}/verify`, data),
  getByStudent: (studentId, status) => api.get(`/submissions/student/${studentId}`, { params: { status } }),
  getByChallenge: (challengeId, status) => api.get(`/submissions/challenge/${challengeId}`, { params: { status } }),
  getStats: () => api.get('/submissions/stats')
};

// Feed APIs
export const feed = {
  getPosts: (params) => api.get('/feed', { params }),
  getPost: (id) => api.get(`/feed/${id}`),
  create: (formData) => api.post('/feed', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  like: (id) => api.post(`/feed/${id}/like`),
  comment: (id, text) => api.post(`/feed/${id}/comment`, { text }),
  share: (id) => api.post(`/feed/${id}/share`),
  delete: (id) => api.delete(`/feed/${id}`)
};

// Leaderboard APIs
export const leaderboard = {
  getGlobal: (limit) => api.get('/leaderboard/global', { params: { limit } }),
  getDepartment: (department, limit) => api.get(`/leaderboard/department/${department}`, { params: { limit } }),
  getWeekly: (limit) => api.get('/leaderboard/weekly', { params: { limit } }),
  getDepartments: () => api.get('/leaderboard/departments'),
  getUserRank: (userId) => api.get(`/leaderboard/rank/${userId}`)
};

// Reward APIs
export const rewards = {
  getAll: (activeOnly) => api.get('/rewards', { params: { active_only: activeOnly } }),
  getAvailable: () => api.get('/rewards/available'),
  getById: (id) => api.get(`/rewards/${id}`),
  create: (data) => api.post('/rewards', data),
  update: (id, data) => api.put(`/rewards/${id}`, data),
  claim: (id) => api.post(`/rewards/${id}/claim`),
  getMyClaims: () => api.get('/rewards/my-claims'),
  getStats: () => api.get('/rewards/stats')
};

// User APIs
export const users = {
  getById: (id) => api.get(`/users/${id}`),
  updateProfile: (formData) => api.put('/users/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  follow: (id) => api.post(`/users/${id}/follow`),
  unfollow: (id) => api.post(`/users/${id}/unfollow`),
  search: (query) => api.get('/users/search', { params: { q: query } })
};

// Analytics APIs
export const analytics = {
  getOverview: () => api.get('/analytics/overview'),
  getParticipation: () => api.get('/analytics/participation'),
  getImpact: () => api.get('/analytics/impact'),
  exportData: (type) => api.get('/analytics/export', { params: { type } })
};

export default api;

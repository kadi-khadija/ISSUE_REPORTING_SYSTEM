import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  checkAuth: () => api.get('/auth/check'),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
};

export const issuesAPI = {
  getAll: (params) => api.get('/issues', { params }),
  getMy: (params) => api.get('/issues/my', { params }),
  getById: (id) => api.get(`/issues/${id}`),
  create: (formData) => api.post('/issues', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/issues/${id}`, data),
  delete: (id) => api.delete(`/issues/${id}`),
  getCategories: () => api.get('/issues/categories'),
  getStatuses: () => api.get('/issues/statuses'),
  getPriorities: () => api.get('/issues/priorities'),
};

export const adminAPI = {
  getAllIssues: (params) => api.get('/admin/issues', { params }),
  updateIssueStatus: (id, data) => api.put(`/admin/issues/${id}/status`, data),
  updateIssuePriority: (id, data) => api.put(`/admin/issues/${id}/priority`, data),
  updateAdminNotes: (id, data) => api.put(`/admin/issues/${id}/notes`, data),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getStats: () => api.get('/admin/stats'),
};

export default api;

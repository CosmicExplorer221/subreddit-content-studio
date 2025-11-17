import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Reddit API
export const redditAPI = {
  testConnection: () => apiClient.get('/reddit/test'),
  fetchPosts: (subreddit, params) => apiClient.get(`/reddit/posts/${subreddit}`, { params }),
  fetchMultiplePosts: (data) => apiClient.post('/reddit/posts/batch', data),
  fetchComments: (postId, limit = 15) => apiClient.get(`/reddit/comments/${postId}`, { params: { limit } }),
};

// Gemini API
export const geminiAPI = {
  testConnection: () => apiClient.get('/gemini/test'),
  generate: (data) => apiClient.post('/gemini/generate', data),
  generateBatch: (data) => apiClient.post('/gemini/generate/batch', data),
};

// Notion API
export const notionAPI = {
  testConnection: () => apiClient.get('/notion/test'),
  createPage: (data) => apiClient.post('/notion/create', data),
  createBatch: (data) => apiClient.post('/notion/create/batch', data),
  checkDuplicate: (sourceUrl) => apiClient.post('/notion/check-duplicate', { sourceUrl }),
};

// Categories API
export const categoriesAPI = {
  getAll: () => apiClient.get('/categories'),
  getOne: (id) => apiClient.get(`/categories/${id}`),
  create: (data) => apiClient.post('/categories', data),
  update: (id, data) => apiClient.put(`/categories/${id}`, data),
  delete: (id) => apiClient.delete(`/categories/${id}`),
};

// Styles API
export const stylesAPI = {
  getAll: () => apiClient.get('/styles'),
  getOne: (id) => apiClient.get(`/styles/${id}`),
  getByCategory: (categoryId) => apiClient.get(`/styles/category/${categoryId}`),
  create: (data) => apiClient.post('/styles', data),
  update: (id, data) => apiClient.put(`/styles/${id}`, data),
  delete: (id) => apiClient.delete(`/styles/${id}`),
};

// Posts API
export const postsAPI = {
  getAll: (params) => apiClient.get('/posts', { params }),
  getOne: (id) => apiClient.get(`/posts/${id}`),
  save: (data) => apiClient.post('/posts/save', data),
  saveComments: (postId, comments) => apiClient.post(`/posts/${postId}/comments`, { comments }),
  markProcessed: (id, processed) => apiClient.patch(`/posts/${id}/processed`, { processed }),
  saveGenerated: (postId, data) => apiClient.post(`/posts/${postId}/generated`, data),
  getGenerated: (postId) => apiClient.get(`/posts/${postId}/generated`),
};

// Downloads API
export const downloadsAPI = {
  downloadSingle: (data) => apiClient.post('/downloads/single', data),
  downloadBatch: (data) => apiClient.post('/downloads/batch', data),
  getStatus: () => apiClient.get('/downloads/status'),
  getForPost: (postId) => apiClient.get(`/downloads/post/${postId}`),
};

// Settings API
export const settingsAPI = {
  getAll: () => apiClient.get('/settings'),
  update: (data) => apiClient.put('/settings', data),
  testConnections: () => apiClient.get('/settings/test-connections'),
};

export default apiClient;

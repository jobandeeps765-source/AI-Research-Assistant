import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

export const researchAPI = {
  create: (topic) => api.post('/research/create', { topic }),
  getHistory: (search) => api.get('/research/history', { params: search ? { search } : {} }),
  delete: (id) => api.delete(`/research/${id}`),
  toggleFavorite: (id) => api.post(`/research/favorite/${id}`),
  followUp: (topic, report, question) => api.post('/research/followup', { topic, report, question }),
};

export const pdfAPI = {
  analyze: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/pdf/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000,
    });
  },
};

export default api;

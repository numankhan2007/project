import axios from 'axios';

const VITE_API_URL = import.meta.env.VITE_API_URL;

if (!VITE_API_URL && import.meta.env.PROD) {
  console.error("CRITICAL: VITE_API_URL is missing in production environment! Defaulting to localhost.");
}

let API_BASE_URL = VITE_API_URL || 'http://localhost:8000/api';
if (API_BASE_URL && !API_BASE_URL.endsWith('/api')) {
  API_BASE_URL = API_BASE_URL.replace(/\/$/, '') + '/api';
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('unimart_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('unimart_token');
      localStorage.removeItem('unimart_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

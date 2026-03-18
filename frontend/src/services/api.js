import axios from 'axios';

const VITE_API_URL = import.meta.env.VITE_API_URL;

if (!VITE_API_URL && import.meta.env.PROD) {
  console.error(
    "CRITICAL: VITE_API_URL is missing in production environment! " +
    "Set it in your .env file. Defaulting to localhost."
  );
}

let API_BASE_URL = VITE_API_URL || 'http://localhost:8000/api';
if (API_BASE_URL) {
  API_BASE_URL = API_BASE_URL.replace(/\/+$/, '');
  if (!API_BASE_URL.endsWith('/api')) {
    API_BASE_URL += '/api';
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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

// Response interceptor - handle auth errors and network errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network error (no response from server)
    if (!error.response) {
      console.error('[API] Network error — backend unreachable:', error.message);
      const networkError = new Error(
        'Server Error: Unable to connect to the backend. Please check your internet connection or try again later.'
      );
      networkError.isNetworkError = true;
      return Promise.reject(networkError);
    }

    // Auth error — clear tokens and redirect
    if (error.response.status === 401) {
      localStorage.removeItem('unimart_token');
      localStorage.removeItem('unimart_user');
      // Only redirect if not already on auth pages
      if (!['/login', '/register'].includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Check if the backend is reachable. Returns true/false.
 * Useful for showing connection status in the UI.
 */
export async function checkBackendHealth() {
  try {
    const res = await api.get('/health', { timeout: 5000 });
    return res.data?.status === 'healthy';
  } catch {
    return false;
  }
}

export default api;

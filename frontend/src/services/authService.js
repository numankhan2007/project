import api from './api';

const authService = {
  login: async (studentId, password) => {
    // In production: return api.post('/auth/login', { studentId, password });
    return { data: { token: 'mock_token', user: { studentId, username: 'user' } } };
  },

  register: async (data) => {
    // In production: return api.post('/auth/register', data);
    return { data: { token: 'mock_token', user: data } };
  },

  getProfile: async () => {
    // In production: return api.get('/auth/profile');
    return { data: JSON.parse(localStorage.getItem('unimart_user')) };
  },

  updateProfile: async (data) => {
    // In production: return api.put('/auth/profile', data);
    return { data };
  },
};

export default authService;

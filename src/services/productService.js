import api from './api';

const productService = {
  getAll: async (filters = {}) => {
    // In production: return api.get('/products', { params: filters });
    return { data: [] };
  },

  getById: async (id) => {
    // In production: return api.get(`/products/${id}`);
    return { data: null };
  },

  create: async (productData) => {
    // In production: return api.post('/products', productData);
    return { data: { id: Date.now(), ...productData } };
  },

  update: async (id, data) => {
    // In production: return api.put(`/products/${id}`, data);
    return { data };
  },

  delete: async (id) => {
    // In production: return api.delete(`/products/${id}`);
    return { data: { success: true } };
  },

  search: async (query) => {
    // In production: return api.get('/products/search', { params: { q: query } });
    return { data: [] };
  },
};

export default productService;

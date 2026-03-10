import api from './api';

const orderService = {
  create: async (orderData) => {
    // In production: return api.post('/orders', orderData);
    return { data: { id: Date.now(), ...orderData } };
  },

  getByBuyer: async () => {
    // In production: return api.get('/orders/buyer');
    return { data: [] };
  },

  getBySeller: async () => {
    // In production: return api.get('/orders/seller');
    return { data: [] };
  },

  updateStatus: async (id, status) => {
    // In production: return api.put(`/orders/${id}/status`, { status });
    return { data: { id, status } };
  },

  getById: async (id) => {
    // In production: return api.get(`/orders/${id}`);
    return { data: null };
  },
};

export default orderService;

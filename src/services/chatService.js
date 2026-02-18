import api from './api';

const chatService = {
  getMessages: async (orderId) => {
    // In production: return api.get(`/chat/${orderId}`);
    return { data: [] };
  },

  sendMessage: async (orderId, message) => {
    // In production: return api.post(`/chat/${orderId}`, { message });
    return { data: { id: Date.now(), orderId, ...message } };
  },
};

export default chatService;

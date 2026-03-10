import api from './api';

const otpService = {
  generate: async (orderId) => {
    // In production: return api.post(`/otp/generate`, { orderId });
    return { data: { otp: Math.floor(100000 + Math.random() * 900000).toString() } };
  },

  verify: async (orderId, otp) => {
    // In production: return api.post(`/otp/verify`, { orderId, otp });
    return { data: { verified: true } };
  },

  sendViaEmail: async (orderId, email) => {
    // In production: return api.post(`/otp/send-email`, { orderId, email });
    return { data: { sent: true } };
  },

  sendViaPhone: async (orderId, phone) => {
    // In production: return api.post(`/otp/send-phone`, { orderId, phone });
    return { data: { sent: true } };
  },
};

export default otpService;

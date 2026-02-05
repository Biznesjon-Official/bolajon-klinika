import api from './api';

const notificationService = {
  // Foydalanuvchi xabarlarini olish
  getMyNotifications: async (status = null, limit = 50) => {
    const params = { limit };
    if (status) params.status = status;
    const response = await api.get('/notifications/my', { params });
    return response.data;
  },

  // Xabarni o'qilgan deb belgilash
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Barcha xabarlarni o'qilgan deb belgilash
  markAllAsRead: async () => {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  },

  // Xabarni tasdiqlash
  acknowledgeNotification: async (notificationId, response) => {
    const result = await api.post(`/notifications/${notificationId}/acknowledge`, { response });
    return result.data;
  },

  // Xabar shablonlarini olish
  getTemplates: async (channel = null, type = null) => {
    const params = {};
    if (channel) params.channel = channel;
    if (type) params.type = type;
    const response = await api.get('/notifications/templates', { params });
    return response.data;
  },

  // Foydalanuvchi sozlamalari
  getSettings: async () => {
    const response = await api.get('/notifications/settings');
    return response.data;
  },

  // Sozlamalarni yangilash
  updateSettings: async (settings) => {
    const response = await api.put('/notifications/settings', settings);
    return response.data;
  },

  // Statistika (Admin)
  getStats: async () => {
    const response = await api.get('/notifications/stats');
    return response.data;
  },

  // Xabar tarixi (Admin)
  getHistory: async (filters = {}) => {
    const response = await api.get('/notifications/history', { params: filters });
    return response.data;
  }
};

export default notificationService;

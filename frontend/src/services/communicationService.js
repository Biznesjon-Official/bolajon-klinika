import api from './api';

const communicationService = {
  // Xabar yuborish (umumiy)
  sendMessage: async (data) => {
    const response = await api.post('/communications/telegram/send', data);
    return response.data;
  },

  // SMS yuborish
  sendSMS: async (data) => {
    const response = await api.post('/communications/sms/send', data);
    return response.data;
  },

  // Telegram yuborish
  sendTelegram: async (data) => {
    const response = await api.post('/communications/telegram/send', data);
    return response.data;
  },

  // Xabarlar tarixi
  getLogs: async (params = {}) => {
    const response = await api.get('/communications/logs', { params });
    return response.data;
  },

  // Statistika
  getStats: async () => {
    const response = await api.get('/communications/stats');
    return response.data;
  },

  // Oxirgi 3 ta xabarni o'chirish
  deleteLastThree: async () => {
    const response = await api.delete('/communications/delete-last-3');
    return response.data;
  }
};

export default communicationService;

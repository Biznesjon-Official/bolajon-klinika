import api from './api';

const nurseService = {
  // Statistika
  getStats: async () => {
    console.log('📡 nurseService.getStats() called');
    console.log('   URL: /nurse/stats');
    try {
      const response = await api.get('/nurse/stats');
      console.log('✅ getStats response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getStats error:', error);
      console.error('   Error response:', error.response?.data);
      throw error;
    }
  },

  // Muolajalar
  getTreatments: async (params = {}) => {
    console.log('📡 nurseService.getTreatments() called');
    console.log('   URL: /nurse/treatments');
    console.log('   Params:', params);
    try {
      const response = await api.get('/nurse/treatments', { params });
      console.log('✅ getTreatments response:', response.data);
      console.log('   Data length:', response.data?.data?.length);
      return response.data;
    } catch (error) {
      console.error('❌ getTreatments error:', error);
      console.error('   Error response:', error.response?.data);
      throw error;
    }
  },

  completeTreatment: async (id, data) => {
    const response = await api.post(`/nurse/treatments/${id}/complete`, data);
    return response.data;
  },

  // Bemorlar
  getPatients: async (params = {}) => {
    const response = await api.get('/nurse/patients', { params });
    return response.data;
  },

  // Chaqiruvlar
  getCalls: async () => {
    const response = await api.get('/nurse/calls');
    return response.data;
  },

  acceptCall: async (id) => {
    const response = await api.post(`/nurse/calls/${id}/accept`);
    return response.data;
  },

  // Dori shkafi
  getMedicineCabinets: async (params = {}) => {
    const response = await api.get('/nurse/medicine-cabinets', { params });
    return response.data;
  },

  // Tarix
  getHistory: async (params = {}) => {
    const response = await api.get('/nurse/history', { params });
    return response.data;
  }
};

export default nurseService;

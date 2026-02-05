import api from './api';

const nurseService = {
  // Statistika
  getStats: async () => {
    const response = await api.get('/nurse/stats');
    return response.data;
  },

  // Muolajalar
  getTreatments: async (params = {}) => {
    const response = await api.get('/nurse/treatments', { params });
    return response.data;
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

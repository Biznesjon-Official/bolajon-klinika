import api from './api';

export const wardService = {
  // O'rinlar ro'yxati
  getBeds: async (params = {}) => {
    try {
      const response = await api.get('/api/v1/inpatient/beds', { params });
      return response.data;
    } catch (error) {
      console.error('Get beds error:', error);
      throw error;
    }
  },

  // O'rinlar xaritasi
  getBedMap: async () => {
    try {
      const response = await api.get('/api/v1/inpatient/bed-map');
      return response.data;
    } catch (error) {
      console.error('Get bed map error:', error);
      throw error;
    }
  },

  // O'rin holati
  updateBedStatus: async (bedId, status) => {
    try {
      const response = await api.put(`/api/v1/inpatient/beds/${bedId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Update bed status error:', error);
      throw error;
    }
  },

  // Bemorni yotqizish
  admitPatient: async (data) => {
    try {
      const response = await api.post('/api/v1/inpatient/admissions', data);
      return response.data;
    } catch (error) {
      console.error('Admit patient error:', error);
      throw error;
    }
  },

  // Bemorni chiqarish
  dischargePatient: async (admissionId) => {
    try {
      const response = await api.put(`/api/v1/inpatient/admissions/${admissionId}/discharge`);
      return response.data;
    } catch (error) {
      console.error('Discharge patient error:', error);
      throw error;
    }
  },

  // Yotgan bemorlar
  getAdmissions: async (params = {}) => {
    try {
      const response = await api.get('/api/v1/inpatient/admissions', { params });
      return response.data;
    } catch (error) {
      console.error('Get admissions error:', error);
      throw error;
    }
  },

  // Statsionar statistikasi
  getStats: async () => {
    try {
      const response = await api.get('/api/v1/inpatient/stats');
      return response.data;
    } catch (error) {
      console.error('Get inpatient stats error:', error);
      throw error;
    }
  }
};

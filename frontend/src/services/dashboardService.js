import api from './api';

export const dashboardService = {
  // Dashboard statistikasi
  getStats: async () => {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw error;
    }
  },

  // Bugungi navbat
  getTodayQueue: async () => {
    try {
      const response = await api.get('/queue', {
        params: {
          date: new Date().toISOString().split('T')[0],
          limit: 10
        }
      });
      return response.data;
    } catch (error) {
      console.error('Today queue error:', error);
      throw error;
    }
  },

  // Ogohlantirishlar
  getAlerts: async () => {
    try {
      const response = await api.get('/dashboard/alerts');
      return response.data;
    } catch (error) {
      console.error('Alerts error:', error);
      throw error;
    }
  },

  // Bemorlar statistikasi
  getPatientsStats: async () => {
    try {
      const response = await api.get('/patients/stats');
      return response.data;
    } catch (error) {
      console.error('Patients stats error:', error);
      throw error;
    }
  },

  // To'lovlar statistikasi
  getPaymentsStats: async () => {
    try {
      const response = await api.get('/billing/stats');
      return response.data;
    } catch (error) {
      console.error('Payments stats error:', error);
      throw error;
    }
  },

  // Statsionar statistikasi
  getBedsStats: async () => {
    try {
      const response = await api.get('/inpatient/beds/stats');
      return response.data;
    } catch (error) {
      console.error('Beds stats error:', error);
      throw error;
    }
  }
};

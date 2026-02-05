import api from './api';

const reportsService = {
  getFinancialReport: async (fromDate = null, toDate = null) => {
    const params = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    const response = await api.get('/reports/financial', { params });
    return response.data;
  },

  getDebtorsReport: async () => {
    const response = await api.get('/reports/debtors');
    return response.data;
  },

  getPatientsReport: async (fromDate = null, toDate = null) => {
    const params = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    const response = await api.get('/reports/patients', { params });
    return response.data;
  },

  getServicesReport: async (fromDate = null, toDate = null) => {
    const params = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    const response = await api.get('/reports/services', { params });
    return response.data;
  },

  getInpatientReport: async () => {
    const response = await api.get('/reports/inpatient');
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  }
};

export default reportsService;

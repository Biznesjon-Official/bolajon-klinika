import api from './api';

const billingService = {
  // Get billing statistics
  getStats: async () => {
    const response = await api.get('/billing/stats');
    return response.data;
  },

  // Get all services
  getServices: async (params = {}) => {
    const response = await api.get('/services', { params });
    return response.data;
  },

  // Get service categories
  getServiceCategories: async () => {
    const response = await api.get('/billing/services/categories');
    return response.data;
  },

  // Create new invoice
  createInvoice: async (invoiceData) => {
    const response = await api.post('/billing/invoices', invoiceData);
    return response.data;
  },

  // Get all invoices
  getInvoices: async (params = {}) => {
    const response = await api.get('/billing/invoices', { params });
    return response.data;
  },

  // Get invoice by ID
  getInvoiceById: async (id) => {
    const response = await api.get(`/billing/invoices/${id}`);
    return response.data;
  },

  // Add payment to invoice
  addPayment: async (invoiceId, paymentData) => {
    const response = await api.post(`/billing/invoices/${invoiceId}/payment`, paymentData);
    return response.data;
  },

  // Get transactions
  getTransactions: async (params = {}) => {
    const response = await api.get('/billing/transactions', { params });
    return response.data;
  },

  // Cancel invoice
  cancelInvoice: async (invoiceId) => {
    const response = await api.put(`/billing/invoices/${invoiceId}/cancel`);
    return response.data;
  }
};

export default billingService;

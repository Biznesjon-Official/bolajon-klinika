import api from './api';

export const servicesService = {
  // Get all services
  getServices: async (params = {}) => {
    try {
      const response = await api.get('/billing/services', { params });
      return response.data;
    } catch (error) {
      console.error('Get services error:', error);
      throw error;
    }
  },

  // Get service by ID
  getServiceById: async (id) => {
    try {
      const response = await api.get(`/billing/services/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get service error:', error);
      throw error;
    }
  },

  // Create service
  createService: async (data) => {
    try {
      const response = await api.post('/billing/services', data);
      return response.data;
    } catch (error) {
      console.error('Create service error:', error);
      throw error;
    }
  },

  // Update service
  updateService: async (id, data) => {
    try {
      const response = await api.put(`/billing/services/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update service error:', error);
      throw error;
    }
  },

  // Delete service
  deleteService: async (id) => {
    try {
      const response = await api.delete(`/billing/services/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete service error:', error);
      throw error;
    }
  },

  // Get service categories
  getCategories: async () => {
    try {
      const response = await api.get('/billing/services/categories');
      return response.data;
    } catch (error) {
      console.error('Get categories error:', error);
      throw error;
    }
  },

  // Procedure categories (bo'limlar)
  getProcedureCategories: async () => {
    const res = await api.get('/procedure-categories');
    return res.data;
  },
  createProcedureCategory: async (data) => {
    const res = await api.post('/procedure-categories', data);
    return res.data;
  },
  updateProcedureCategory: async (id, data) => {
    const res = await api.put(`/procedure-categories/${id}`, data);
    return res.data;
  },
  deleteProcedureCategory: async (id) => {
    const res = await api.delete(`/procedure-categories/${id}`);
    return res.data;
  },
  getProceduresByCategory: async (categoryId) => {
    const res = await api.get(`/procedure-categories/${categoryId}/procedures`);
    return res.data;
  }
};

export default servicesService;

import api from './api';

const labPharmacyService = {
  // Get all reagents
  getReagents: async (params = {}) => {
    const response = await api.get('/lab-pharmacy/reagents', { params });
    return response.data;
  },
  
  // Get single reagent
  getReagent: async (id) => {
    const response = await api.get(`/lab-pharmacy/reagents/${id}`);
    return response.data;
  },
  
  // Create reagent
  createReagent: async (data) => {
    const response = await api.post('/lab-pharmacy/reagents', data);
    return response.data;
  },
  
  // Update reagent
  updateReagent: async (id, data) => {
    const response = await api.put(`/lab-pharmacy/reagents/${id}`, data);
    return response.data;
  },
  
  // Delete reagent
  deleteReagent: async (id) => {
    const response = await api.delete(`/lab-pharmacy/reagents/${id}`);
    return response.data;
  },
  
  // Get statistics
  getStats: async () => {
    const response = await api.get('/lab-pharmacy/stats');
    return response.data;
  },

  // Suppliers
  getSuppliers: async () => {
    const response = await api.get('/lab-pharmacy/suppliers');
    return response.data;
  },
  
  createSupplier: async (data) => {
    const response = await api.post('/lab-pharmacy/suppliers', data);
    return response.data;
  },
  
  // Requests
  getRequests: async (params = {}) => {
    const response = await api.get('/lab-pharmacy/requests', { params });
    return response.data;
  },
  
  createRequest: async (data) => {
    const response = await api.post('/lab-pharmacy/requests', data);
    return response.data;
  },
  
  updateRequestStatus: async (id, status) => {
    const response = await api.put(`/lab-pharmacy/requests/${id}/status`, { status });
    return response.data;
  }
};

export default labPharmacyService;

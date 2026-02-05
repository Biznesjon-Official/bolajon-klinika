import api from './api';

export const staffService = {
  // Get all staff
  getStaff: async (params = {}) => {
    try {
      const response = await api.get('/staff', { params });
      return response.data;
    } catch (error) {
      console.error('Get staff error:', error);
      throw error;
    }
  },

  // Get doctors only
  getDoctors: async () => {
    try {
      const response = await api.get('/staff/doctors');
      return response.data;
    } catch (error) {
      console.error('Get doctors error:', error);
      throw error;
    }
  },

  // Get staff by ID
  getStaffById: async (id) => {
    try {
      const response = await api.get(`/staff/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get staff error:', error);
      throw error;
    }
  },

  // Create staff
  createStaff: async (data) => {
    try {
      const response = await api.post('/staff', data);
      return response.data;
    } catch (error) {
      console.error('Create staff error:', error);
      throw error;
    }
  },

  // Update staff
  updateStaff: async (id, data) => {
    try {
      const response = await api.put(`/staff/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update staff error:', error);
      throw error;
    }
  },

  // Delete staff
  deleteStaff: async (id) => {
    try {
      const response = await api.delete(`/staff/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete staff error:', error);
      throw error;
    }
  },

  // Get roles
  getRoles: async () => {
    try {
      const response = await api.get('/staff/roles/list');
      return response.data;
    } catch (error) {
      console.error('Get roles error:', error);
      throw error;
    }
  }
};

export default staffService;

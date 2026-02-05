import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const publicApi = axios.create({
  baseURL: `${API_URL}/public`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const publicService = {
  // Get doctors list
  getDoctors: async () => {
    const response = await publicApi.get('/doctors');
    return response.data;
  },

  // Get services list
  getServices: async () => {
    const response = await publicApi.get('/services');
    return response.data;
  },

  // Create appointment
  createAppointment: async (appointmentData) => {
    const response = await publicApi.post('/appointments', appointmentData);
    return response.data;
  },

  // Get lab results
  getLabResults: async (orderNumber) => {
    const response = await publicApi.get(`/lab-results/${orderNumber}`);
    return response.data;
  },

  // Get public settings
  getSettings: async () => {
    const response = await publicApi.get('/settings');
    return response.data;
  },
};

export default publicService;

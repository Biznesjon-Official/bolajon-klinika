import api from './api';

const patientPortalService = {
  // Dashboard
  getDashboard: async () => {
    const response = await api.get('/patient-portal/dashboard');
    return response.data;
  },

  // Profile
  getProfile: async () => {
    const response = await api.get('/patient-portal/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/patient-portal/profile', data);
    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.put('/patient-portal/password', data);
    return response.data;
  },

  // Appointments
  getAppointments: async () => {
    const response = await api.get('/patient-portal/appointments');
    return response.data;
  },

  // Lab Results
  getLabResults: async () => {
    const response = await api.get('/patient-portal/lab-results');
    return response.data;
  },

  // Prescriptions
  getPrescriptions: async () => {
    const response = await api.get('/patient-portal/prescriptions');
    return response.data;
  },

  // Queue
  getCurrentQueue: async () => {
    const response = await api.get('/patient-portal/queue');
    return response.data;
  },

  // Notifications
  getNotifications: async (limit = 20) => {
    const response = await api.get(`/patient-portal/notifications?limit=${limit}`);
    return response.data;
  },

  markNotificationAsRead: async (id) => {
    const response = await api.put(`/patient-portal/notifications/${id}/read`);
    return response.data;
  }
};

export default patientPortalService;

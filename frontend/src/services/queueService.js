import api from './api';

export const queueService = {
  // Navbat ro'yxati
  getQueue: async (params = {}) => {
    try {
      const response = await api.get('/queue', { params });
      return response.data;
    } catch (error) {
      console.error('Get queue error:', error);
      throw error;
    }
  },

  // Navbatga qo'shish
  addToQueue: async (data) => {
    try {
      const response = await api.post('/queue', data);
      return response.data;
    } catch (error) {
      console.error('Add to queue error:', error);
      throw error;
    }
  },

  // Bemorni chaqirish
  callPatient: async (id) => {
    try {
      const response = await api.put(`/queue/${id}/call`);
      return response.data;
    } catch (error) {
      console.error('Call patient error:', error);
      throw error;
    }
  },

  // Qabulni boshlash
  startAppointment: async (id) => {
    try {
      const response = await api.put(`/queue/${id}/start`);
      return response.data;
    } catch (error) {
      console.error('Start appointment error:', error);
      throw error;
    }
  },

  // Qabulni yakunlash
  completeAppointment: async (id) => {
    try {
      const response = await api.put(`/queue/${id}/complete`);
      return response.data;
    } catch (error) {
      console.error('Complete appointment error:', error);
      throw error;
    }
  },

  // Qabulni bekor qilish
  cancelAppointment: async (id, reason) => {
    try {
      const response = await api.put(`/queue/${id}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error('Cancel appointment error:', error);
      throw error;
    }
  },

  // Shifokor statusini yangilash
  updateDoctorStatus: async (doctorId, status) => {
    try {
      const response = await api.put('/queue/doctor-status', {
        doctor_id: doctorId,
        status
      });
      return response.data;
    } catch (error) {
      console.error('Update doctor status error:', error);
      throw error;
    }
  },

  // Navbat statistikasi
  getQueueStats: async () => {
    try {
      const response = await api.get('/queue/stats');
      return response.data;
    } catch (error) {
      console.error('Get queue stats error:', error);
      throw error;
    }
  },

  // Displey uchun navbat
  getDisplayQueue: async () => {
    try {
      const response = await api.get('/queue/display');
      return response.data;
    } catch (error) {
      console.error('Get display queue error:', error);
      throw error;
    }
  },

  // Shifokorlar ro'yxati
  getDoctors: async () => {
    try {
      const response = await api.get('/queue/doctors');
      return response.data;
    } catch (error) {
      console.error('Get doctors error:', error);
      throw error;
    }
  }
};

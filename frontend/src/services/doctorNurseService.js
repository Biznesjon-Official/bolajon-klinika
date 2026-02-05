import api from './api';

const doctorNurseService = {
  // Faol hamshiralar ro'yxati
  getActiveNurses: async () => {
    const response = await api.get('/doctor-nurse/nurses/active');
    return response.data;
  },

  // Hamshiraga topshiriq yuborish
  assignTask: async (data) => {
    const response = await api.post('/doctor-nurse/assign-task', data);
    return response.data;
  },

  // Bemorni hamshiraga biriktirish
  assignPatient: async (data) => {
    const response = await api.post('/doctor-nurse/assign-patient', data);
    return response.data;
  },

  // Hamshiraning yuklanganligini tekshirish
  getNurseWorkload: async (nurseId) => {
    const response = await api.get(`/doctor-nurse/nurses/${nurseId}/workload`);
    return response.data;
  },

  // Bemorning hamshirasini olish
  getPatientNurse: async (patientId) => {
    const response = await api.get(`/doctor-nurse/patients/${patientId}/nurse`);
    return response.data;
  },

  // Muolajani yakunlash
  completeTask: async (taskId, data = {}) => {
    const response = await api.post(`/nurse/treatments/${taskId}/complete`, data);
    return response.data;
  }
};

export default doctorNurseService;

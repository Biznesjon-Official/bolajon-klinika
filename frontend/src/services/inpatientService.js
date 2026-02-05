import api from './api';

const inpatientService = {
  getStats: async () => {
    const response = await api.get('/inpatient-complete/stats');
    return response.data;
  },

  getVisualMap: async (floor = null) => {
    const response = await api.get('/inpatient-visual/visual-map', { 
      params: floor ? { floor } : {} 
    });
    return response.data;
  },

  getTreatmentSchedule: async (params = {}) => {
    const response = await api.get('/inpatient-visual/treatment-schedule', { params });
    return response.data;
  },

  completeTreatment: async (treatmentId, notes) => {
    const response = await api.post(`/inpatient-visual/treatment-schedule/${treatmentId}/complete`, { notes });
    return response.data;
  },

  getPendingCalls: async () => {
    const response = await api.get('/inpatient-visual/patient-calls/pending');
    return response.data;
  },

  respondToCall: async (callId, notes) => {
    const response = await api.post(`/inpatient-visual/patient-calls/${callId}/respond`, { notes });
    return response.data;
  },

  getMedicineCabinets: async (floor = null) => {
    const response = await api.get('/inpatient-visual/medicine-cabinets', {
      params: floor ? { floor } : {}
    });
    return response.data;
  },

  createAdmission: async (admissionData) => {
    const response = await api.post('/inpatient-complete/admissions', admissionData);
    return response.data;
  },

  dischargePatient: async (admissionId, dischargeData) => {
    const response = await api.post(`/inpatient-complete/admissions/${admissionId}/discharge`, dischargeData);
    return response.data;
  },

  // Xona boshqaruvi
  createRoom: async (roomData) => {
    const response = await api.post('/inpatient-visual/rooms', roomData);
    return response.data;
  },

  getRooms: async (floor = null) => {
    const response = await api.get('/inpatient-visual/rooms', {
      params: floor ? { floor } : {}
    });
    return response.data;
  },

  updateRoom: async (roomId, roomData) => {
    const response = await api.put(`/inpatient-visual/rooms/${roomId}`, roomData);
    return response.data;
  },

  deleteRoom: async (roomId) => {
    const response = await api.delete(`/inpatient-visual/rooms/${roomId}`);
    return response.data;
  },

  updateBedStatus: async (bedId, status, patientId) => {
    const response = await api.put(`/inpatient-visual/beds/${bedId}/status`, { 
      status,
      patient_id: patientId 
    });
    return response.data;
  },

  // QR Code cheklar
  generateQRTicket: async (admissionId) => {
    const response = await api.post(`/inpatient-complete/admissions/${admissionId}/generate-qr`);
    return response.data;
  },

  getQRTicket: async (admissionId) => {
    const response = await api.get(`/inpatient-complete/admissions/${admissionId}/qr-ticket`);
    return response.data;
  },

  // Orbit chek urilishi
  scanBedCheckin: async (ticketNumber, bedId, action) => {
    const response = await api.post('/inpatient-complete/bed-checkin', {
      ticket_number: ticketNumber,
      bed_id: bedId,
      action // 'checkin' or 'checkout'
    });
    return response.data;
  },

  getBedCheckinLogs: async (params = {}) => {
    const response = await api.get('/inpatient-complete/bed-checkin-logs', { params });
    return response.data;
  },

  // Bemor signal chaqiruvlari
  createPatientCall: async (callData) => {
    const response = await api.post('/inpatient-complete/patient-calls-enhanced', callData);
    return response.data;
  },

  // Shifokor xabarlari
  getDoctorNotifications: async (params = {}) => {
    const response = await api.get('/inpatient-complete/doctor-notifications', { params });
    return response.data;
  },

  markNotificationAsRead: async (notificationId) => {
    const response = await api.put(`/inpatient-complete/doctor-notifications/${notificationId}/read`);
    return response.data;
  },

  getUnreadNotificationsCount: async () => {
    const response = await api.get('/inpatient-complete/doctor-notifications/unread/count');
    return response.data;
  },

  // Bemor shikoyatlari
  createComplaint: async (complaintData) => {
    const response = await api.post('/inpatient-complete/patient-complaints', complaintData);
    return response.data;
  },

  getComplaints: async (params = {}) => {
    const response = await api.get('/inpatient-complete/patient-complaints', { params });
    return response.data;
  },

  acknowledgeComplaint: async (complaintId) => {
    const response = await api.put(`/inpatient-complete/patient-complaints/${complaintId}/acknowledge`);
    return response.data;
  },

  resolveComplaint: async (complaintId, resolutionNotes) => {
    const response = await api.put(`/inpatient-complete/patient-complaints/${complaintId}/resolve`, {
      resolution_notes: resolutionNotes
    });
    return response.data;
  }
};

export default inpatientService;

import api from './api';

const ambulatorInpatientService = {
  // Xonalar
  getRooms: async (floor = null) => {
    const params = floor ? { floor } : {};
    const response = await api.get('/ambulator-inpatient/rooms', { params });
    return response.data;
  },

  createRoom: async (roomData) => {
    const response = await api.post('/ambulator-inpatient/rooms', roomData);
    return response.data;
  },

  updateRoom: async (id, roomData) => {
    const response = await api.put(`/ambulator-inpatient/rooms/${id}`, roomData);
    return response.data;
  },

  deleteRoom: async (id) => {
    const response = await api.delete(`/ambulator-inpatient/rooms/${id}`);
    return response.data;
  },

  // Vizual xarita
  getVisualMap: async (floor = null) => {
    const params = floor ? { floor } : {};
    const response = await api.get('/ambulator-inpatient/visual-map', { params });
    return response.data;
  },

  // Yotqizish
  createAdmission: async (admissionData) => {
    const response = await api.post('/ambulator-inpatient/admissions', admissionData);
    return response.data;
  },

  dischargePatient: async (admissionId, dischargeData) => {
    const response = await api.post(`/ambulator-inpatient/admissions/${admissionId}/discharge`, dischargeData);
    return response.data;
  },

  getBillingSummary: async (admissionId) => {
    const response = await api.get(`/ambulator-inpatient/admissions/${admissionId}/billing-summary`);
    return response.data;
  },

  // To'lovlar
  addPayment: async (paymentData) => {
    const response = await api.post('/ambulator-inpatient/payments', paymentData);
    return response.data;
  },

  // Koyka statusini o'zgartirish
  updateBedStatus: async (bedId, status, patientId = null) => {
    const response = await api.put(`/ambulator-inpatient/beds/${bedId}/status`, { status, patient_id: patientId });
    return response.data;
  },

  // Statistika
  getStats: async () => {
    const response = await api.get('/ambulator-inpatient/stats');
    return response.data;
  },

  // Avtomatik chiqarish
  autoDischarge: async () => {
    const response = await api.post('/ambulator-inpatient/auto-discharge');
    return response.data;
  },

  // Muolajalar
  getTreatmentSchedule: async (params = {}) => {
    const response = await api.get('/ambulator-inpatient/treatments', { params });
    return response.data;
  },

  // Chaqiruvlar
  getPendingCalls: async () => {
    const response = await api.get('/ambulator-inpatient/calls');
    return response.data;
  },

  // Dori shkaflari
  getMedicineCabinets: async (floor = null) => {
    const params = floor ? { floor } : {};
    const response = await api.get('/ambulator-inpatient/medicine-cabinets', { params });
    return response.data;
  },

  // Shikoyatlar (optional - might not be implemented)
  getComplaints: async () => {
    try {
      const response = await api.get('/ambulator-inpatient/complaints');
      return response.data;
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  acknowledgeComplaint: async (complaintId) => {
    const response = await api.post(`/ambulator-inpatient/complaints/${complaintId}/acknowledge`);
    return response.data;
  },

  resolveComplaint: async (complaintId, notes) => {
    const response = await api.post(`/ambulator-inpatient/complaints/${complaintId}/resolve`, { notes });
    return response.data;
  },

  // Procedure tracking
  getProceduresByInvoice: async (invoiceNumber) => {
    const response = await api.get(`/ambulator/procedures/by-invoice/${invoiceNumber}`);
    return response.data;
  },

  startProcedure: async (id) => {
    const response = await api.patch(`/ambulator/procedures/${id}/start`);
    return response.data;
  },

  completeProcedure: async (id) => {
    const response = await api.patch(`/ambulator/procedures/${id}/complete`);
    return response.data;
  },

  getInvoiceByNumber: async (invoiceNumber) => {
    const response = await api.get(`/billing/invoices/by-number/${invoiceNumber}`);
    return response.data;
  }
};

export default ambulatorInpatientService;

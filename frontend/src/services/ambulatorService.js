import api from './api';

const ambulatorService = {
  // Xonalar
  getRooms: async () => {
    const response = await api.get('/ambulator/rooms');
    return response.data;
  },

  // QR cheklar
  generateQR: async (queueId) => {
    const response = await api.post('/ambulator/generate-qr', { queue_id: queueId });
    return response.data;
  },

  getQRTicket: async (queueId) => {
    const response = await api.get(`/ambulator/qr-ticket/${queueId}`);
    return response.data;
  },

  // Check-in/out
  checkin: async (ticketNumber, roomId, action) => {
    const response = await api.post('/ambulator/checkin', {
      ticket_number: ticketNumber,
      room_id: roomId,
      action
    });
    return response.data;
  },

  // Bemor signallari
  createPatientCall: async (queueId, roomId, callType, priority) => {
    const response = await api.post('/ambulator/patient-call', {
      queue_id: queueId,
      room_id: roomId,
      call_type: callType,
      priority
    });
    return response.data;
  },

  getPatientCalls: async (status) => {
    const response = await api.get('/ambulator/patient-calls', {
      params: status ? { status } : {}
    });
    return response.data;
  },

  respondToCall: async (callId, notes) => {
    const response = await api.put(`/ambulator/patient-call/${callId}/respond`, { notes });
    return response.data;
  },

  // Shifokor xabarlari
  getDoctorNotifications: async (isRead) => {
    const response = await api.get('/ambulator/doctor-notifications', {
      params: isRead !== undefined ? { is_read: isRead } : {}
    });
    return response.data;
  },

  markNotificationAsRead: async (notificationId) => {
    const response = await api.put(`/ambulator/doctor-notification/${notificationId}/read`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/ambulator/doctor-notifications/unread/count');
    return response.data;
  },

  // Shikoyatlar
  createComplaint: async (queueId, roomId, complaintType, complaintText, priority) => {
    const response = await api.post('/ambulator/complaints', {
      queue_id: queueId,
      room_id: roomId,
      complaint_type: complaintType,
      complaint_text: complaintText,
      priority
    });
    return response.data;
  },

  getComplaints: async (status) => {
    const response = await api.get('/ambulator/complaints', {
      params: status ? { status } : {}
    });
    return response.data;
  },

  acknowledgeComplaint: async (complaintId) => {
    const response = await api.put(`/ambulator/complaint/${complaintId}/acknowledge`);
    return response.data;
  },

  resolveComplaint: async (complaintId, resolutionNotes) => {
    const response = await api.put(`/ambulator/complaint/${complaintId}/resolve`, {
      resolution_notes: resolutionNotes
    });
    return response.data;
  }
};

export default ambulatorService;

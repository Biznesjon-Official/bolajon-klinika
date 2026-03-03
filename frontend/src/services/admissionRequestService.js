import api from './api'

const admissionRequestService = {
  create: (data) => api.post('/admission-requests', data),
  getAll: (params) => api.get('/admission-requests', { params }),
  approve: (id, data) => api.put(`/admission-requests/${id}/approve`, data),
  reject: (id, reason) => api.put(`/admission-requests/${id}/reject`, { reason })
}

export default admissionRequestService

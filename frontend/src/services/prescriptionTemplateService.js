import api from './api'

const prescriptionTemplateService = {
  getAll: () => api.get('/prescription-templates'),
  create: (data) => api.post('/prescription-templates', data),
  update: (id, data) => api.put(`/prescription-templates/${id}`, data),
  delete: (id) => api.delete(`/prescription-templates/${id}`)
}

export default prescriptionTemplateService

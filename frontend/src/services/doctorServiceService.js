import api from './api'

const doctorServiceService = {
  // Get all doctor-service mappings
  getAll: async (params = {}) => {
    const response = await api.get('/doctor-services', { params })
    return response.data
  },

  // Get services for specific doctor
  getDoctorServices: async (doctorId) => {
    const response = await api.get(`/doctor-services/doctor/${doctorId}`)
    return response.data
  },

  // Get doctors list (for dropdown)
  getDoctorsList: async () => {
    const response = await api.get('/doctor-services/doctors-list')
    return response.data
  },

  // Get services list (for dropdown)
  getServicesList: async () => {
    const response = await api.get('/doctor-services/services-list')
    return response.data
  },

  // Create doctor-service mapping
  create: async (data) => {
    const response = await api.post('/doctor-services', data)
    return response.data
  },

  // Update doctor-service
  update: async (id, data) => {
    const response = await api.put(`/doctor-services/${id}`, data)
    return response.data
  },

  // Delete doctor-service
  delete: async (id) => {
    const response = await api.delete(`/doctor-services/${id}`)
    return response.data
  }
}

export default doctorServiceService

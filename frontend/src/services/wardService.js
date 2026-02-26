import api from './api'

export const wardService = {
  getBeds: async (params = {}) => {
    const response = await api.get('/inpatient/beds', { params })
    return response.data
  },

  getBedMap: async () => {
    const response = await api.get('/inpatient/bed-map')
    return response.data
  },

  updateBedStatus: async (bedId, status) => {
    const response = await api.put(`/inpatient/beds/${bedId}/status`, { status })
    return response.data
  },

  admitPatient: async (data) => {
    const response = await api.post('/inpatient/admissions', data)
    return response.data
  },

  dischargePatient: async (admissionId) => {
    const response = await api.put(`/inpatient/admissions/${admissionId}/discharge`)
    return response.data
  },

  getAdmissions: async (params = {}) => {
    const response = await api.get('/inpatient/admissions', { params })
    return response.data
  },

  getStats: async () => {
    const response = await api.get('/inpatient/stats')
    return response.data
  }
}

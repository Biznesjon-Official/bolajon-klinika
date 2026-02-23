import api from './api'

const nurseService = {
  getStats: async () => {
    const response = await api.get('/nurse/stats')
    return response.data
  },

  getTreatments: async (params = {}) => {
    const response = await api.get('/nurse/treatments', { params })
    return response.data
  },

  startTreatment: async (id) => {
    const response = await api.post(`/nurse/treatments/${id}/start`)
    return response.data
  },

  completeTreatment: async (id, data) => {
    const response = await api.post(`/nurse/treatments/${id}/complete`, data)
    return response.data
  },

  getPatients: async (params = {}) => {
    const response = await api.get('/nurse/patients', { params })
    return response.data
  },

  getCalls: async () => {
    const response = await api.get('/nurse/calls')
    return response.data
  },

  acceptCall: async (id) => {
    const response = await api.post(`/nurse/calls/${id}/accept`)
    return response.data
  },

  getMedicineCabinets: async (params = {}) => {
    const response = await api.get('/nurse/medicine-cabinets', { params })
    return response.data
  },

  getHistory: async (params = {}) => {
    const response = await api.get('/nurse/history', { params })
    return response.data
  }
}

export default nurseService

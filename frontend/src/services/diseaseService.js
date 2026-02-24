import api from './api'

const diseaseService = {
  getAll: async (params = {}) => {
    const response = await api.get('/diseases', { params })
    return response.data
  },

  getCategories: async () => {
    const response = await api.get('/diseases/categories')
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`/diseases/${id}`)
    return response.data
  },

  create: async (data) => {
    const response = await api.post('/diseases', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await api.put(`/diseases/${id}`, data)
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(`/diseases/${id}`)
    return response.data
  }
}

export default diseaseService

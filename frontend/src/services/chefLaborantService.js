import api from './api'

export const chefLaborantService = {
  getDashboard: async () => {
    const response = await api.get('/chef-laborant/dashboard')
    return response.data
  },

  getLaborantPerformance: async () => {
    const response = await api.get('/chef-laborant/laborant-performance')
    return response.data
  },

  getAllOrders: async (params = {}) => {
    const response = await api.get('/chef-laborant/all-orders', { params })
    return response.data
  }
}

export default chefLaborantService

import api from './api';

export const laboratoryService = {
  // ============================================
  // TAHLILLAR KATALOGI
  // ============================================
  
  // Barcha tahlillarni olish
  getTests: async (params = {}) => {
    const response = await api.get('/laboratory/tests', { params });
    return response.data;
  },
  
  // Bitta tahlilni olish
  getTestById: async (id) => {
    const response = await api.get(`/laboratory/tests/${id}`);
    return response.data;
  },
  
  // Tahlil qo'shish
  createTest: async (data) => {
    const response = await api.post('/laboratory/tests', data);
    return response.data;
  },
  
  // Tahlilni yangilash
  updateTest: async (id, data) => {
    const response = await api.put(`/laboratory/tests/${id}`, data);
    return response.data;
  },
  
  // Tahlilni o'chirish
  deleteTest: async (id) => {
    const response = await api.delete(`/laboratory/tests/${id}`);
    return response.data;
  },
  
  // ============================================
  // BUYURTMALAR
  // ============================================
  
  // Buyurtmalarni olish
  getOrders: async (params = {}) => {
    const response = await api.get('/laboratory/orders', { params });
    return response.data;
  },
  
  // Buyurtma yaratish
  createOrder: async (data) => {
    const response = await api.post('/laboratory/orders', data);
    return response.data;
  },
  
  // Buyurtma statusini yangilash
  updateOrderStatus: async (id, status) => {
    const response = await api.put(`/laboratory/orders/${id}/status`, { status });
    return response.data;
  },
  
  // ============================================
  // NATIJALAR
  // ============================================
  
  // Natijani ko'rish
  getResult: async (orderId) => {
    const response = await api.get(`/laboratory/orders/${orderId}/result`);
    return response.data;
  },
  
  // Buyurtma natijasini olish (to'liq ma'lumot bilan)
  getOrderResult: async (orderId) => {
    const response = await api.get(`/laboratory/orders/${orderId}/result`);
    return response.data;
  },
  
  // ============================================
  // STATISTIKA
  // ============================================
  
  getStats: async (params = {}) => {
    const response = await api.get('/laboratory/stats', { params });
    return response.data;
  },

  // Laborant uchun statistika
  getLaborantStats: async () => {
    const response = await api.get('/laboratory/laborant/stats');
    return response.data;
  },

  // ============================================
  // LABORANT FUNKSIYALARI
  // ============================================

  // QR-kodni skanerlash
  scanQR: async (qrCode) => {
    const response = await api.post('/laboratory/scan-qr', { qr_code: qrCode });
    return response.data;
  },

  // Natijalarni kiritish (laborant)
  submitResults: async (orderId, results) => {
    const response = await api.post(`/laboratory/orders/${orderId}/results`, results);
    return response.data;
  },

  // Tarix - Yakunlangan tahlillar
  getCompletedTests: async () => {
    const response = await api.get('/laboratory/laborant/history');
    return response.data;
  },

  // ============================================
  // BEMOR TARIXI VA TREND
  // ============================================

  getPatientHistory: async (patientId) => {
    const response = await api.get(`/laboratory/patient/${patientId}/history`)
    return response.data
  },

  getPatientTrend: async (patientId, parameter) => {
    const response = await api.get(`/laboratory/patient/${patientId}/trend`, { params: { parameter } })
    return response.data
  },

  // ============================================
  // TAT VA KATEGORIYALAR
  // ============================================

  getTatStats: async (period = '7d') => {
    const response = await api.get('/laboratory/stats/tat', { params: { period } })
    return response.data
  },

  getCategories: async () => {
    const response = await api.get('/laboratory/categories')
    return response.data
  },

  createCategory: async (data) => {
    const response = await api.post('/laboratory/categories', data)
    return response.data
  },

  updateCategory: async (id, data) => {
    const response = await api.put(`/laboratory/categories/${id}`, data)
    return response.data
  },

  deleteCategory: async (id) => {
    const response = await api.delete(`/laboratory/categories/${id}`)
    return response.data
  },

  // Buyurtmani tasdiqlash (approve)
  approveOrder: async (id) => {
    const response = await api.put(`/laboratory/orders/${id}/status`, { status: 'approved' })
    return response.data
  }
};

export default laboratoryService;

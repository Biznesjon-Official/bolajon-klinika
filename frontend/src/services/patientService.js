import api from './api';

export const patientService = {
  // Bemorlar ro'yxati
  getPatients: async (params = {}) => {
    try {
      const response = await api.get('/patients', { params });
      return response.data;
    } catch (error) {
      console.error('Get patients error:', error);
      throw error;
    }
  },

  // Bemor qidirish
  searchPatients: async (query) => {
    try {
      const response = await api.get('/patients/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Search patients error:', error);
      throw error;
    }
  },

  // Bemor ma'lumotlari
  getPatient: async (id) => {
    try {
      const response = await api.get(`/patients/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get patient error:', error);
      throw error;
    }
  },

  // Yangi bemor qo'shish
  createPatient: async (data) => {
    try {
      const response = await api.post('/patients', data);
      return response.data;
    } catch (error) {
      console.error('Create patient error:', error);
      throw error;
    }
  },

  // Bemorni yangilash
  updatePatient: async (id, data) => {
    try {
      const response = await api.put(`/patients/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update patient error:', error);
      throw error;
    }
  },

  // Bemorni o'chirish
  deletePatient: async (id) => {
    try {
      const response = await api.delete(`/patients/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete patient error:', error);
      throw error;
    }
  },

  // Bemor qarz holati
  getDebtStatus: async (id) => {
    try {
      const response = await api.get(`/patients/${id}/debt-status`);
      return response.data;
    } catch (error) {
      console.error('Get debt status error:', error);
      throw error;
    }
  },

  // Bemor kasallik tarixi
  getMedicalHistory: async (id) => {
    try {
      const response = await api.get(`/patients/${id}/medical-history`);
      return response.data;
    } catch (error) {
      console.error('Get medical history error:', error);
      throw error;
    }
  },

  // Tibbiy yozuv qo'shish
  addMedicalRecord: async (id, data) => {
    try {
      const response = await api.post(`/patients/${id}/medical-records`, data);
      return response.data;
    } catch (error) {
      console.error('Add medical record error:', error);
      throw error;
    }
  },

  // QR kod olish
  getQRCode: async (id) => {
    try {
      const response = await api.get(`/patients/${id}/qr-code`);
      return response.data;
    } catch (error) {
      console.error('Get QR code error:', error);
      throw error;
    }
  },

  // Bemor moliyaviy xulosasi
  getFinancialSummary: async (id) => {
    try {
      const response = await api.get(`/patients/${id}/financial-summary`);
      return response.data;
    } catch (error) {
      console.error('Get financial summary error:', error);
      throw error;
    }
  },

  // Barcha bemorlar (Cashier uchun)
  getAllPatients: async () => {
    try {
      const response = await api.get('/patients');
      // API response.data ichida data array bor
      // Backend API _id ni id ga map qiladi
      return response;
    } catch (error) {
      console.error('Get all patients error:', error);
      throw error;
    }
  },

  // ============================================
  // OPTIMIZED METHODS
  // ============================================
  
  /**
   * 1️⃣ Pagination bilan bemorlar ro'yxati
   * 5️⃣ Faqat kerakli fieldlar
   */
  getAll: async ({ page = 1, limit = 20, search = '', status = 'all' } = {}) => {
    try {
      const response = await api.get('/patients', {
        params: {
          page,
          limit,
          search,
          status: status !== 'all' ? status : undefined,
          // Faqat kerakli fieldlar
          fields: 'id,patient_number,first_name,last_name,phone,date_of_birth,gender,status'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get all patients error:', error);
      throw error;
    }
  },
  
  /**
   * 4️⃣ Cursor-based pagination
   */
  getAllCursor: async ({ cursor = null, limit = 20, search = '' } = {}) => {
    try {
      const response = await api.get('/patients/cursor', {
        params: {
          cursor,
          limit,
          search
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get patients cursor error:', error);
      throw error;
    }
  },
  
  /**
   * 7️⃣ Optimized search - full text search
   */
  searchOptimized: async (query, limit = 20) => {
    try {
      const response = await api.get('/patients/search-optimized', {
        params: { q: query, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Optimized search error:', error);
      throw error;
    }
  },
  
  /**
   * 1️⃣4️⃣ Batch request - bir nechta bemorni bir vaqtda olish
   */
  getBatch: async (ids = []) => {
    try {
      const response = await api.post('/patients/batch', { ids });
      return response.data;
    } catch (error) {
      console.error('Batch get patients error:', error);
      throw error;
    }
  }
};

export default patientService;

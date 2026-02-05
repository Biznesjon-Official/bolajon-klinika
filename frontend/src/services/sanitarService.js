import api from './api';

const sanitarService = {
    // Dashboard statistikasi
    getDashboard: async () => {
        const response = await api.get('/sanitar/dashboard');
        return response.data;
    },

    // Xonalar ro'yxati
    getRooms: async (filters = {}) => {
        const response = await api.get('/sanitar/rooms', { params: filters });
        return response.data;
    },

    // Xonani tozalashni boshlash
    startRoomCleaning: async (roomId) => {
        const response = await api.post(`/sanitar/rooms/${roomId}/start`);
        return response.data;
    },

    // Xonani tozalashni yakunlash
    completeRoomCleaning: async (roomId, notes = '') => {
        const response = await api.post(`/sanitar/rooms/${roomId}/complete`, { notes });
        return response.data;
    },

    // Tozalash tarixi
    getHistory: async (limit = 50, offset = 0) => {
        const response = await api.get(`/sanitar/history?limit=${limit}&offset=${offset}`);
        return response.data;
    }
};

export default sanitarService;

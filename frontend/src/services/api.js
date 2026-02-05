import axios from 'axios';
import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token yangilash uchun flag
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor - token qo'shish
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - xatolarni boshqarish va token yangilash
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Agar 401 xato bo'lsa va token yangilanmagan bo'lsa
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Agar token yangilanayotgan bo'lsa, navbatga qo'shamiz
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Token yangilash
        const newToken = await authService.refreshToken();
        
        // Yangi token bilan so'rovni qayta yuborish
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Token yangilash muvaffaqiyatsiz
        console.error('Token refresh failed:', refreshError);
        
        // User'ni tekshirish - bemor yoki admin?
        const userStr = localStorage.getItem('user');
        let redirectPath = '/login';
        
        try {
          const user = JSON.parse(userStr);
          // Hamma /login ga yo'naltiriladi
        } catch (e) {
          console.error('Error parsing user:', e);
        }
        
        // Logout
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = redirectPath;
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Boshqa xatolar uchun
    if (error.response?.status === 403) {
      console.error('Ruxsat yo\'q:', error.response.data.message);
    }

    return Promise.reject(error);
  }
);

export default api;

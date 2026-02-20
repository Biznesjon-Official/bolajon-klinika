import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

class AuthService {
  login = async (username, password, isPatient = false) => {
    try {
      console.log('=== AUTH SERVICE LOGIN V2 ===');
      console.log('Username:', username);
      console.log('isPatient RAW:', isPatient);
      console.log('isPatient type:', typeof isPatient);
      console.log('isPatient === true:', isPatient === true);
      console.log('isPatient === false:', isPatient === false);
      
      // Determine endpoint based on isPatient flag
      const endpoint = isPatient === true ? '/auth/patient-login' : '/auth/login';
      const url = `${API_URL}${endpoint}`;
      
      console.log('Selected endpoint:', endpoint);
      console.log('Full URL:', url);
      
      const response = await axios.post(url, {
        username,
        password
      });

      console.log('Response:', response.data);

      if (response.data.success) {
        // Store tokens
        if (response.data.accessToken) {
          localStorage.setItem('token', response.data.accessToken);
        }
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        // Store user data
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        return {
          success: true,
          user: response.data.user,
          requires2FA: response.data.requires2FA || false
        };
      }

      return response.data;
    } catch (error) {
      console.error('Auth service error:', error);
      throw error;
    }
  };

  logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const token = localStorage.getItem('token');

      if (token) {
        await axios.post(
          `${API_URL}/auth/logout`,
          { refreshToken },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  };

  refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken
      });

      if (response.data.success && response.data.accessToken) {
        localStorage.setItem('token', response.data.accessToken);
        return response.data.accessToken;
      }

      throw new Error('Token refresh failed');
    } catch (error) {
      this.logout();
      throw error;
    }
  };

  getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  };

  getToken = () => {
    return localStorage.getItem('token');
  };

  isAuthenticated = () => {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  };
}

export default new AuthService();

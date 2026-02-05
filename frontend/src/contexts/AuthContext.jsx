import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    const token = authService.getToken();
    
    console.log('=== AUTH CONTEXT INIT ===');
    console.log('Token:', token ? 'exists' : 'missing');
    console.log('User:', currentUser ? currentUser.username || currentUser.patient_number : 'missing');
    
    if (currentUser && token) {
      setUser(currentUser);
    }
    // MUAMMO TUZATILDI: logout() chaqirmaslik
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;

    const checkTokenExpiry = () => {
      const token = authService.getToken();
      if (!token) {
        logout();
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = payload.exp * 1000;
        const currentTime = Date.now();
        const timeUntilExpiry = expiryTime - currentTime;

        if (timeUntilExpiry < 2 * 60 * 1000 && timeUntilExpiry > 0) {
          authService.refreshToken().catch(() => {
            logout();
          });
        }
      } catch (error) {
        console.error('Token check error:', error);
      }
    };

    checkTokenExpiry();
    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (username, password, isPatient = false) => {
    console.log('=== AUTH CONTEXT LOGIN ===');
    console.log('username:', username);
    console.log('password:', password ? '***' : 'empty');
    console.log('isPatient param:', isPatient);
    console.log('isPatient type:', typeof isPatient);
    console.log('isPatient === true:', isPatient === true);
    console.log('isPatient === false:', isPatient === false);
    console.log('isPatient === undefined:', isPatient === undefined);
    
    // Force to boolean - if explicitly true, use true, otherwise false
    const isPatientBool = isPatient === true;
    console.log('Final isPatientBool:', isPatientBool);
    
    const result = await authService.login(username, password, isPatientBool);
    
    if (result.success && !result.requires2FA) {
      setUser(result.user);
    }
    return result;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

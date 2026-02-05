import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowPatient = false }) => {
  const { isAuthenticated, loading } = useAuth();

  // LocalStorage'dan to'g'ridan-to'g'ri tekshirish
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    console.error('Error parsing user from localStorage:', e);
  }

  const hasValidAuth = !!(token && user);

  if (loading && !hasValidAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // Agar localStorage'da token va user bo'lsa, ruxsat berish
  if (hasValidAuth) {
    return children;
  }

  // Agar AuthContext'da authenticated bo'lsa
  if (isAuthenticated) {
    return children;
  }

  // Aks holda login sahifasiga yo'naltirish
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleBasedRedirect = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    // Support both nested role object and direct role_name field
    const roleName = user.role?.name || user.role_name;
    const currentPath = location.pathname;

    // Agar dashboard'da bo'lsa va Doctor bo'lsa, /doctor ga yo'naltirish
    if (currentPath === '/dashboard' && (roleName === 'Doctor' || roleName === 'Shifokor')) {
      navigate('/doctor', { replace: true });
    }
    
    // Agar boshqa role'lar uchun ham kerak bo'lsa
    if (currentPath === '/dashboard') {
      if (roleName === 'Reception' || roleName === 'Qabulxona') {
        navigate('/queue', { replace: true });
      } else if (roleName === 'Cashier' || roleName === 'Kassa') {
        navigate('/cashier', { replace: true });
      } else if (roleName === 'Nurse' || roleName === 'Hamshira') {
        navigate('/nurse', { replace: true });
      } else if (roleName === 'Lab' || roleName === 'Laborant') {
        navigate('/lab', { replace: true });
      } else if (roleName === 'Tozalovchi' || roleName === 'Cleaner') {
        navigate('/sanitar', { replace: true });
      }
    }
  }, [user, location.pathname, navigate]);

  return children;
};

export default RoleBasedRedirect;

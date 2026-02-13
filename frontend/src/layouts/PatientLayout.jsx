import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const PatientLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar
  const [user, setUser] = useState(null);

  // LocalStorage'dan user'ni olish
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      // Agar token yoki user bo'lmasa, login sahifasiga yo'naltirish
      navigate('/login', { replace: true });
      return;
    }
    
    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    toast.success('Tizimdan chiqdingiz');
    navigate('/login');
  };

  // Agar user yuklanmagan bo'lsa, loading ko'rsatish
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { path: '/patient/dashboard', icon: 'dashboard', label: 'Bosh sahifa' },
    { path: '/patient/profile', icon: 'person', label: 'Shaxsiy ma\'lumotlar' },
    { path: '/patient/appointments', icon: 'calendar_month', label: 'Qabullar tarixi' },
    { path: '/patient/prescriptions', icon: 'medication', label: 'Retseptlar' },
    { path: '/patient/queue', icon: 'schedule', label: 'Navbat' },
    { path: '/patient/notifications', icon: 'notifications', label: 'Bildirishnomalar' },
    { path: '/patient/settings', icon: 'settings', label: 'Sozlamalar' }
  ];

  // Telegram bot deep link
  const handleTelegramBot = () => {
    const botUsername = 'klinika_01_bot'; // Bot username
    const patientNumber = user?.patient_number; // Use patient_number instead of UUID
    const deepLink = `https://t.me/${botUsername}?start=${patientNumber}`;
    window.open(deepLink, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile Menu Button + Logo */}
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors -ml-2"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>

              {/* Logo */}
              <div className="size-10 flex-shrink-0">
                <img 
                  src="/image.jpg?v=20250204"
                  alt="Klinika Logo" 
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-black text-gray-900 dark:text-white">
                  Bemor Paneli
                </h1>
              </div>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {user?.full_name || user?.first_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.patient_number}
                  </p>
                </div>
                <div className="size-9 sm:size-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">logout</span>
                      Chiqish
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Sidebar */}
          <aside className={`
            fixed lg:static inset-y-0 left-0 z-50
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            w-64 lg:w-64 flex-shrink-0 transition-transform duration-300
          `}>
            <nav className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2 lg:sticky lg:top-24 h-[calc(100vh-6rem)] lg:h-auto overflow-y-auto">
              {/* Mobile Close Button */}
              <div className="lg:hidden flex justify-end mb-2">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)} // Close sidebar on mobile
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span className="font-semibold">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Telegram Bot Button */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleTelegramBot}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                  </svg>
                  <span className="font-semibold">Telegram Bot</span>
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-2 text-center">
                  Xabarnomalar uchun botga ulaning
                </p>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 w-full lg:w-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default PatientLayout;

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Barcha ekranlar uchun default yopiq
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    // 1. Bosh sahifa (faqat Admin va Manager uchun)
    { name: t('nav.dashboard'), icon: 'dashboard', path: '/dashboard', roles: ['Admin', 'Administrator', 'Manager', 'Menejer'] },
    
    // 2. Qabulxona - Bemorlar qabul qilish
    { name: t('nav.patients'), icon: 'groups', path: '/patients', roles: ['Admin', 'Administrator', 'Shifokor', 'Doctor', 'Qabulxona', 'Reception', 'receptionist'] },
    { name: t('nav.queue'), icon: 'format_list_numbered', path: '/queue', roles: ['Admin', 'Administrator', 'Qabulxona', 'Reception', 'receptionist', 'Shifokor', 'Doctor'] },
    
    // 3. Kassa - To'lovlar
    { name: t('nav.cashier'), icon: 'payments', path: '/cashier', roles: ['Admin', 'Administrator', 'Kassa', 'Cashier', 'Qabulxona', 'Reception', 'receptionist'] },
    
    // 4. Shifokor paneli
    { name: t('nav.doctorPanel'), icon: 'medical_services', path: '/doctor', roles: ['Shifokor', 'Doctor'] },
    
    // 4.5. Bosh shifokor paneli
    { name: 'Bosh shifokor paneli', icon: 'medical_information', path: '/chief-doctor', roles: ['chief_doctor'] },
    
    // 4.6. Navbatdagi shifokorlar (Admin uchun)
    { name: 'Navbatdagi shifokorlar', icon: 'event_available', path: '/on-duty-doctors', roles: ['Admin', 'Administrator'] },
    
    // 5. Xonalar - Muolaja
    { name: t('nav.ambulatorRoom'), icon: 'meeting_room', path: '/ambulator', roles: ['Admin', 'Administrator', 'Qabulxona', 'Reception', 'receptionist', 'Shifokor', 'Doctor', 'Hamshira', 'Nurse'] },
    { name: 'Statsionar', icon: 'bed', path: '/inpatient', roles: ['Admin', 'Administrator', 'Shifokor', 'Doctor', 'Hamshira', 'Nurse', 'Qabulxona', 'Reception', 'receptionist'] },
    
    // 6. Hamshira paneli
    { name: 'Hamshira Paneli', icon: 'medical_services', path: '/nurse', roles: ['Hamshira', 'Nurse'] },
    
    // 7. Dorixona
    { name: 'Dorixona', icon: 'medication', path: '/pharmacy', roles: ['Admin', 'Administrator', 'Hamshira', 'Nurse', 'Dorixona', 'Pharmacy', 'Qabulxona', 'Reception', 'receptionist'] },
    
    // 8. Laboratoriya
    { name: 'Laborant Dashboard', icon: 'science', path: '/lab', roles: ['Laborant', 'Lab'] },
    { name: 'Laboratoriya', icon: 'biotech', path: '/laboratory', roles: ['Admin', 'Administrator', 'Laborant', 'Lab', 'Shifokor', 'Doctor', 'Qabulxona', 'Reception', 'receptionist'] },
    
    // 9. Tozalovchi
    { name: 'Tozalovchi Paneli', icon: 'cleaning_services', path: '/sanitar', roles: ['Tozalovchi', 'Cleaner'] },
    
    // 10. Massajchi
    { name: 'Massajchi Paneli', icon: 'spa', path: '/masseur', roles: ['Massajchi', 'Masseur', 'masseur'] },
    
    // 11. Logoped
    { name: 'Logoped Paneli', icon: 'record_voice_over', path: '/speech-therapist', roles: ['Logoped', 'SpeechTherapist', 'speech_therapist'] },
    
    // 12. Xodimlar
    { name: t('nav.staff'), icon: 'badge', path: '/staff', roles: ['Admin', 'Administrator'] },
    
    // 13. Vazifalar
    { name: 'Vazifalar', icon: 'task_alt', path: '/tasks', roles: ['Admin', 'Administrator'] },
    { name: 'Mening Vazifalarim', icon: 'task_alt', path: '/my-tasks', roles: ['Shifokor', 'Doctor', 'Hamshira', 'Nurse', 'Laborant', 'Lab', 'Tozalovchi', 'Cleaner', 'Dorixona', 'Pharmacy', 'Qabulxona', 'Reception', 'receptionist', 'Kassa', 'Cashier', 'Massajchi', 'Masseur', 'masseur', 'Logoped', 'SpeechTherapist', 'speech_therapist', 'chief_doctor'] },
    
    // 14. Aloqa
    { name: t('nav.communications'), icon: 'chat', path: '/communications', roles: ['Admin', 'Administrator', 'Shifokor', 'Doctor', 'Hamshira', 'Nurse', 'Qabulxona', 'Reception'] },
    
    // 13. Hisobotlar
    { name: t('nav.reports'), icon: 'bar_chart', path: '/reports', roles: ['Admin', 'Administrator', 'Manager', 'Menejer'] },
    { name: 'Kasir Hisobotlari', icon: 'receipt_long', path: '/cashier-reports', roles: ['Admin', 'Administrator'] },
    
    // 14. Xarajatlar
    { name: 'Xarajatlar', icon: 'receipt_long', path: '/expenses', roles: ['Admin', 'Administrator'] },
    
    // 15. Maoshlar (oxirida)
    { name: 'Maoshlar', icon: 'payments', path: '/payroll', roles: ['Admin', 'Administrator'] },
    { name: 'Mening Maoshim', icon: 'account_balance_wallet', path: '/my-salary', roles: ['Shifokor', 'Doctor', 'Hamshira', 'Nurse', 'Laborant', 'Lab', 'Tozalovchi', 'Cleaner', 'Massajchi', 'Masseur', 'masseur', 'Logoped', 'SpeechTherapist', 'speech_therapist', 'Dorixona', 'Pharmacy', 'pharmacist', 'chief_doctor', 'Qabulxona', 'Reception', 'receptionist'] },
    
    // Bemor paneli yashirilgan (hozircha ko'rinmaydigan)
    // { name: 'Bemor Paneli', icon: 'person', path: '/patient-portal', roles: ['Patient', 'Bemor'] },
  ];

  // Role'ga qarab menu filtrlash
  // Support both nested role object and direct role_name field
  const userRole = user?.role?.name || user?.role_name;
  
  // Case-insensitive role matching
  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true;
    
    const userRoleLower = userRole?.toLowerCase();
    return item.roles.some(role => role.toLowerCase() === userRoleLower);
  });

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen overflow-hidden sm:block bg-gray-50 dark:bg-gray-900">
      {/* Mobile Overlay - Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden sm:block animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
          aria-hidden sm:block="true"
        ></div>
      )}

      {/* Sidebar - Fully Responsive */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64 lg:w-20 lg:hover:w-64
          bg-white dark:bg-gray-900 
          border-r border-gray-200 dark:border-gray-800 
          flex flex-col 
          transition-all duration-300 ease-in-out
          shadow-xl lg:shadow-none
        `}
        onMouseEnter={() => window.innerWidth >= 1024 && setSidebarOpen(true)}
        onMouseLeave={() => window.innerWidth >= 1024 && setSidebarOpen(false)}
      >
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 sm:p-6 flex items-center justify-between gap-2 sm:gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full"
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="size-10 flex-shrink-0">
              <img 
                src="/image.jpg?v=20250204"
                alt="Klinika Logo" 
                className="w-full h-full object-cover rounded-lg sm:rounded-lg sm:rounded-xl"
              />
            </div>
            <div className={`${sidebarOpen ? 'block' : 'hidden sm:block'} flex-1 min-w-0`}>
              <h1 className="text-sm sm:text-base font-bold leading-none truncate">Klinika CRM</h1>
              <p className="text-xs text-gray-500 mt-1 truncate">{userRole || 'Panel'}</p>
            </div>
          </div>
          {/* Toggle icon */}
          <span className={`material-symbols-outlined text-gray-400 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
            {sidebarOpen ? 'chevron_left' : 'chevron_right'}
          </span>
        </button>

        <nav className="flex-1 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5.5 rounded-lg sm:rounded-lg sm:rounded-xl transition-colors ${
                isActive(item.path)
                  ? 'bg-green-50 dark:bg-green-900/20 text-primary border-r-3 border-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {sidebarOpen && <span className="text-sm sm:text-sm sm:text-base font-medium whitespace-nowrap">{item.name}</span>}
            </Link>
          ))}

          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
            <Link
              to="/settings"
              className={`flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5.5 rounded-lg sm:rounded-lg sm:rounded-xl transition-colors ${
                isActive('/settings')
                  ? 'bg-green-50 dark:bg-green-900/20 text-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="material-symbols-outlined">settings</span>
              {sidebarOpen && <span className="text-sm sm:text-sm sm:text-base font-medium whitespace-nowrap">{t('nav.settings')}</span>}
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden sm:block">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 sm:px-4 sm:px-6 lg:px-8">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden sm:block p-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors -ml-2"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          <div className="flex-1 max-w-lg sm:max-w-xl ml-4 lg:ml-0">
            <div className="relative group hidden sm:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                search
              </span>
              <input
                type="text"
                placeholder={t('common.search') + " bemorlar, qabullar..."}
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2 sm:gap-3 sm:gap-3 sm:gap-4">
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-1 right-1 size-2 bg-red-500 rounded-full"></span>
              </button>

              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowNotifications(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                    <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-bold text-gray-900 dark:text-white">Bildirishnomalar</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {/* Sample notifications */}
                      <div className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700">
                        <div className="flex gap-2 sm:gap-3">
                          <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-base sm:text-lg">person_add</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm sm:text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Yangi bemor qo'shildi</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Ahmet Yılmaz ro'yxatdan o'tdi</p>
                            <p className="text-xs text-gray-500 mt-1">5 daqiqa oldin</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700">
                        <div className="flex gap-2 sm:gap-3">
                          <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-base sm:text-lg">payments</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm sm:text-sm sm:text-base font-semibold text-gray-900 dark:text-white">To'lov qabul qilindi</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">150,000 so'm to'lov amalga oshirildi</p>
                            <p className="text-xs text-gray-500 mt-1">15 daqiqa oldin</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                        <div className="flex gap-2 sm:gap-3">
                          <div className="size-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-base sm:text-lg">schedule</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm sm:text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Navbat eslatmasi</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">3 ta bemor navbatda kutmoqda</p>
                            <p className="text-xs text-gray-500 mt-1">30 daqiqa oldin</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                      <button className="w-full text-center text-sm sm:text-sm sm:text-base text-primary hover:underline font-semibold">
                        Barchasini ko'rish
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Settings */}
            <button 
              onClick={() => navigate('/settings')}
              className="hidden sm:block p-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 sm:gap-2 sm:gap-3 sm:gap-2 sm:gap-3 sm:pl-4 sm:border-l border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm sm:text-sm sm:text-base font-semibold">{user?.full_name || user?.username || 'Foydalanuvchi'}</p>
                  <p className="text-xs text-gray-500">{userRole || 'Foydalanuvchi'}</p>
                </div>
                <div className="size-9 sm:size-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm sm:text-sm sm:text-base">
                  {(user?.full_name || user?.username || 'U').substring(0, 2).toUpperCase()}
                </div>
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowUserMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 sm:gap-2 sm:gap-3 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 text-sm sm:text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span className="material-symbols-outlined text-sm sm:text-base">settings</span>
                      Sozlamalar
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 sm:gap-2 sm:gap-3 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 text-sm sm:text-sm sm:text-base text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <span className="material-symbols-outlined text-sm sm:text-base">logout</span>
                      Chiqish
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

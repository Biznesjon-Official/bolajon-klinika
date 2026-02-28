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
    // ── Admin ──────────────────────────────────────────────
    { name: t('nav.dashboard'), icon: 'dashboard', path: '/dashboard', roles: ['admin', 'Admin', 'Administrator'] },
    { name: t('nav.patients'), icon: 'groups', path: '/patients', roles: ['admin', 'Admin', 'Administrator', 'Qabulxona', 'Reception', 'receptionist', 'chief_doctor'] },
    { name: t('nav.staff'), icon: 'badge', path: '/staff', roles: ['admin', 'Admin', 'Administrator'] },
    { name: t('nav.attendance'), icon: 'schedule', path: '/attendance', roles: ['admin', 'Admin', 'Administrator', 'chief_doctor'] },
    { name: 'Navbatdagi shifokorlar', icon: 'event_available', path: '/on-duty-doctors', roles: ['admin', 'Admin', 'Administrator'] },
    { name: 'Doktor xizmatlari', icon: 'medical_services', path: '/doctor-services', roles: ['admin', 'Admin', 'Administrator', 'chief_doctor'] },
    { name: 'Muolajalar', icon: 'vaccines', path: '/procedures', roles: ['admin', 'Admin', 'Administrator'] },
    { name: 'Lab reaktivlar', icon: 'science', path: '/lab-pharmacy', roles: ['admin', 'Admin', 'Administrator', 'chief_doctor', 'chef_laborant'] },
    { name: 'Dori shkafi', icon: 'medication', path: '/nurse/medicine', roles: ['admin', 'Admin', 'Administrator', 'Hamshira', 'Nurse', 'nurse'] },
    { name: t('nav.ambulatorRoom'), icon: 'meeting_room', path: '/ambulator', roles: ['admin', 'Admin', 'Administrator', 'Shifokor', 'Doctor', 'doctor', 'Hamshira', 'Nurse', 'nurse'] },
    { name: 'Statsionar', icon: 'bed', path: '/inpatient', roles: ['admin', 'Admin', 'Administrator', 'Shifokor', 'Doctor', 'doctor', 'Hamshira', 'Nurse', 'nurse'] },
    { name: 'Vazifalar', icon: 'task_alt', path: '/tasks', roles: ['admin', 'Admin', 'Administrator'] },

    // ── Qabulxona ──────────────────────────────────────────
    { name: t('nav.queue'), icon: 'format_list_numbered', path: '/queue', roles: ['Qabulxona', 'Reception', 'receptionist', 'Shifokor', 'Doctor', 'doctor'] },
    { name: t('nav.cashier'), icon: 'payments', path: '/cashier', roles: ['Qabulxona', 'Reception', 'receptionist'] },

    // ── Shifokor ───────────────────────────────────────────
    { name: t('nav.doctorPanel'), icon: 'medical_services', path: '/doctor', roles: ['Shifokor', 'Doctor', 'doctor'] },
    { name: 'Laboratoriya', icon: 'biotech', path: '/laboratory', roles: ['Shifokor', 'Doctor', 'doctor', 'chief_doctor'] },
    { name: 'Mening Vazifalarim', icon: 'task_alt', path: '/my-tasks', roles: ['Shifokor', 'Doctor', 'doctor', 'Qabulxona', 'Reception', 'receptionist', 'sanitar', 'masseur', 'speech_therapist'] },
    { name: 'Mening Maoshim', icon: 'account_balance_wallet', path: '/my-salary', roles: ['Shifokor', 'Doctor', 'doctor', 'sanitar', 'masseur', 'speech_therapist', 'Qabulxona', 'Reception', 'receptionist'] },
    { name: t('nav.communications'), icon: 'chat', path: '/communications', roles: ['Shifokor', 'Doctor', 'doctor', 'Qabulxona', 'Reception', 'receptionist'] },

    // ── Bosh shifokor ──────────────────────────────────────
    { name: 'Bosh shifokor', icon: 'medical_information', path: '/chief-doctor', roles: ['chief_doctor'] },
    { name: 'Xodimlar faoliyati', icon: 'groups', path: '/chief-doctor/staff', roles: ['chief_doctor'] },
    { name: 'Navbatdagi shifokorlar', icon: 'event_available', path: '/chief-doctor/on-duty', roles: ['chief_doctor'] },
    { name: 'Kasalliklar', icon: 'medical_information', path: '/chief-doctor/diseases', roles: ['chief_doctor'] },
    { name: 'Mening profilim', icon: 'person', path: '/chief-doctor/profile', roles: ['chief_doctor'] },

    // ── Hamshira ───────────────────────────────────────────
    { name: 'Hamshira Dashboard', icon: 'dashboard', path: '/nurse', roles: ['Hamshira', 'Nurse', 'nurse'] },
    { name: 'Chaqiruvlar', icon: 'notifications', path: '/nurse/calls', roles: ['Hamshira', 'Nurse', 'nurse'] },
    { name: 'Boshqa', icon: 'more_horiz', path: '/nurse/more', roles: ['Hamshira', 'Nurse', 'nurse'] },

    // ── Laborant ───────────────────────────────────────────
    { name: 'Lab Dashboard', icon: 'science', path: '/lab', roles: ['Laborant', 'Lab', 'laborant'] },
    { name: 'Buyurtmalar', icon: 'assignment', path: '/lab/orders', roles: ['Laborant', 'Lab', 'laborant'] },
    { name: 'Namuna olish', icon: 'colorize', path: '/lab/samples', roles: ['Laborant', 'Lab', 'laborant'] },
    { name: 'Mening profilim', icon: 'person', path: '/lab/profile', roles: ['Laborant', 'Lab', 'laborant'] },

    // ── Bosh laborant ──────────────────────────────────────
    { name: 'Bosh Laborant', icon: 'biotech', path: '/chef-laborant', roles: ['chef_laborant'] },
    { name: 'Barcha buyurtmalar', icon: 'assignment', path: '/chef-laborant/orders', roles: ['chef_laborant'] },
    { name: 'Laborantlar ishlashi', icon: 'analytics', path: '/chef-laborant/performance', roles: ['chef_laborant'] },
    { name: 'Testlar katalogi', icon: 'science', path: '/laboratory', roles: ['chef_laborant'] },
    { name: 'Mening profilim', icon: 'person', path: '/chef-laborant/profile', roles: ['chef_laborant'] },

    // ── Boshqa rollar ──────────────────────────────────────
    { name: 'Tozalovchi Paneli', icon: 'cleaning_services', path: '/sanitar', roles: ['Tozalovchi', 'Cleaner', 'sanitar'] },
    { name: 'Massajchi Paneli', icon: 'spa', path: '/masseur', roles: ['Massajchi', 'Masseur', 'masseur'] },
    { name: 'Logoped Paneli', icon: 'record_voice_over', path: '/speech-therapist', roles: ['Logoped', 'SpeechTherapist', 'speech_therapist'] },
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

  const isActive = (path) => {
    if (path === '/nurse') return location.pathname === '/nurse'
    if (path === '/lab') return location.pathname === '/lab'
    if (path === '/chief-doctor') return location.pathname === '/chief-doctor'
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64 lg:w-20
          ${sidebarOpen ? 'lg:w-64' : 'lg:w-20'}
          bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 
          flex flex-col transition-all duration-300 flex-shrink-0
        `}
        onMouseEnter={() => !sidebarOpen && window.innerWidth >= 1024 && setSidebarOpen(true)}
        onMouseLeave={() => sidebarOpen && window.innerWidth >= 1024 && setSidebarOpen(false)}
      >
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-6 flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="size-10 flex-shrink-0">
              <img 
                src="/image.jpg?v=20250204"
                alt="Klinika Logo" 
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className={`${sidebarOpen ? 'block' : 'hidden'} flex-1 min-w-0`}>
              <h1 className="text-base font-bold leading-none truncate">Klinika CRM</h1>
              <p className="text-xs text-gray-500 mt-1 truncate">{userRole || 'Panel'}</p>
            </div>
          </div>
          {/* Toggle icon */}
          <span className={`material-symbols-outlined text-gray-400 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
            {sidebarOpen ? 'chevron_left' : 'chevron_right'}
          </span>
        </button>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-green-50 dark:bg-green-900/20 text-primary border-r-3 border-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>}
            </Link>
          ))}

          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
            <Link
              to="/settings"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive('/settings')
                  ? 'bg-green-50 dark:bg-green-900/20 text-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="material-symbols-outlined">settings</span>
              {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap">{t('nav.settings')}</span>}
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 sm:px-8">
          {/* Mobile Menu Button - left side */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors -ml-2"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          {/* Spacer to push everything to the right */}
          <div className="flex-1"></div>

          {/* Right side - all elements pushed to the far right */}
          <div className="flex items-center gap-2 sm:gap-4">
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
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-bold text-gray-900 dark:text-white">Bildirishnomalar</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {/* Sample notifications */}
                      <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700">
                        <div className="flex gap-3">
                          <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-lg">person_add</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Yangi bemor qo'shildi</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Ahmet Yılmaz ro'yxatdan o'tdi</p>
                            <p className="text-xs text-gray-500 mt-1">5 daqiqa oldin</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700">
                        <div className="flex gap-3">
                          <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-lg">payments</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">To'lov qabul qilindi</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">150,000 so'm to'lov amalga oshirildi</p>
                            <p className="text-xs text-gray-500 mt-1">15 daqiqa oldin</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                        <div className="flex gap-3">
                          <div className="size-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-lg">schedule</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Navbat eslatmasi</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">3 ta bemor navbatda kutmoqda</p>
                            <p className="text-xs text-gray-500 mt-1">30 daqiqa oldin</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                      <button className="w-full text-center text-sm text-primary hover:underline font-semibold">
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
                className="flex items-center gap-2 sm:gap-3 sm:pl-4 sm:border-l border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold">{user?.full_name || user?.username || 'Foydalanuvchi'}</p>
                  <p className="text-xs text-gray-500">{userRole || 'Foydalanuvchi'}</p>
                </div>
                <div className="size-9 sm:size-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
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
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span className="material-symbols-outlined text-base">settings</span>
                      Sozlamalar
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <span className="material-symbols-outlined text-base">logout</span>
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

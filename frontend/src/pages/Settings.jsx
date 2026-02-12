import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import toast, { Toaster } from 'react-hot-toast';
import api from '../services/api';

const Settings = () => {
  const { user } = useAuth();
  const { i18n, t } = useTranslation();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Account settings (Login va Parol)
  const [accountSettings, setAccountSettings] = useState({
    currentPassword: '',
    newUsername: user?.username || '',
    newPassword: '',
    confirmPassword: ''
  });

  // Appearance settings (Til va Mavzu)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'auto');
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'uz');

  // System settings
  const [systemSettings, setSystemSettings] = useState({
    clinicName: 'Klinika CRM',
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
    appointmentDuration: 30,
    autoBackup: true,
    emailNotifications: true
  });

  // Auto theme based on time
  const getAutoTheme = () => {
    const hour = new Date().getHours();
    // 7:00 - 19:00 = light, 19:00 - 7:00 = dark
    const isDark = hour < 7 || hour >= 19;
    return isDark ? 'dark' : 'light';
  };

  const applyTheme = (themeToApply) => {
    if (themeToApply === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    // Apply theme
    let appliedTheme = theme;
    let interval;
    
    if (theme === 'auto') {
      appliedTheme = getAutoTheme();
      applyTheme(appliedTheme);
      
      // Check every minute for auto theme
      interval = setInterval(() => {
        const newTheme = getAutoTheme();
        applyTheme(newTheme);
      }, 60000); // Check every minute
    } else {
      // Manual theme selection
      applyTheme(theme);
    }
    
    localStorage.setItem('theme', theme);
    
    // Cleanup interval
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [theme]);

  useEffect(() => {
    // Apply language immediately
    const currentLang = i18n.language;
    if (language !== currentLang) {
      i18n.changeLanguage(language);
      localStorage.setItem('language', language);
      
      // Update HTML lang attribute
      document.documentElement.lang = language;
      
      // Show success message and reload to apply changes
      const langName = language === 'uz' ? t('settings.uzbek') : language === 'ru' ? t('settings.russian') : t('settings.english');
      toast.success(`${t('settings.languageChanged')}: ${langName}. ${t('settings.pageReloading')}`);
      
      // Reload page after a short delay to apply language changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, [language, i18n]);

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    
    if (!accountSettings.currentPassword) {
      toast.error(t('settings.enterCurrentPassword'));
      return;
    }

    if (!accountSettings.newUsername) {
      toast.error(t('settings.enterNewUsername'));
      return;
    }

    if (accountSettings.newPassword && accountSettings.newPassword !== accountSettings.confirmPassword) {
      toast.error(t('settings.passwordMismatch'));
      return;
    }

    if (accountSettings.newPassword && accountSettings.newPassword.length < 6) {
      toast.error(t('settings.passwordTooShort'));
      return;
    }

    setLoading(true);
    
    try {
      // Update username and password
      const response = await api.put('/auth/update-credentials', {
        currentPassword: accountSettings.currentPassword,
        newUsername: accountSettings.newUsername,
        newPassword: accountSettings.newPassword || undefined
      });

      if (response.data.success) {
        toast.success(t('settings.updateSuccess'));
        setShowEditModal(false);
        setAccountSettings({
          currentPassword: '',
          newUsername: user?.username || '',
          newPassword: '',
          confirmPassword: ''
        });
        // Optionally reload user data
        window.location.reload();
      }
    } catch (error) {
      console.error('Update account error:', error);
      toast.error(error.response?.data?.message || t('settings.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    // This function is no longer needed, merged with handleUpdateAccount
  };

  const handleSaveSystem = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Save system settings to localStorage or API
      localStorage.setItem('systemSettings', JSON.stringify(systemSettings));
      toast.success(t('settings.systemSettingsSaved'));
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'account', label: t('settings.account'), icon: 'person' },
    { id: 'appearance', label: t('settings.appearance'), icon: 'palette' },
    { id: 'system', label: t('settings.system'), icon: 'settings' }
  ];

  return (
    <div className="p-3 sm:p-4 sm:p-4 sm:p-6 lg:p-4 sm:p-6 lg:p-8 space-y-3 sm:space-y-4 sm:space-y-4 sm:space-y-6">
      <Toaster position="top-right" />
      
      <div>
        <h1 className="text-2xl sm:text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{t('settings.title')}</h1>
        <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
          {t('settings.subtitle')}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 sm:gap-4 sm:gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-3 sm:p-4">
          <nav className="flex lg:flex-col gap-2 sm:gap-2 sm:gap-3 lg:space-y-1 overflow-x-auto lg:overflow-x-visible">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 sm:gap-2 sm:gap-3 sm:gap-2 sm:gap-3 px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 sm:py-2 sm:py-3 rounded-lg sm:rounded-lg sm:rounded-xl transition-colors whitespace-nowrap text-sm sm:text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="material-symbols-outlined text-base sm:text-base sm:text-lg flex-shrink-0">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 sm:p-4 sm:p-6 overflow-hidden sm:block">
          {/* Account Settings */}
          {activeTab === 'account' && (
            <div>
              <h2 className="text-xl sm:text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">{t('settings.accountSettings')}</h2>
              
              {/* User Info Display */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-lg sm:rounded-xl overflow-hidden sm:block">
                  <div className="flex items-center gap-2 sm:gap-3 sm:gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="size-12 sm:size-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg sm:text-xl sm:text-2xl flex-shrink-0">
                      {(user?.full_name || user?.username || 'A').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('settings.user')}</p>
                      <p className="font-bold text-gray-900 dark:text-white text-base sm:text-base sm:text-lg break-words">{user?.username}</p>
                      <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">{user?.role_name || t('settings.administrator')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="w-full sm:w-auto px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl font-semibold hover:opacity-90 flex items-center justify-center gap-2 sm:gap-2 sm:gap-3 text-sm sm:text-sm sm:text-base"
                  >
                    <span className="material-symbols-outlined text-base sm:text-base sm:text-lg flex-shrink-0">edit</span>
                    <span>{t('settings.edit')}</span>
                  </button>
                </div>

                <div className="p-3 sm:p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-lg sm:rounded-xl border border-green-200 dark:border-green-800 overflow-hidden sm:block">
                  <div className="flex items-start gap-2 sm:gap-2 sm:gap-3 sm:gap-2 sm:gap-3">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400 flex-shrink-0">info</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-green-900 dark:text-green-100 text-sm sm:text-sm sm:text-base">{t('settings.security')}</p>
                      <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-green-700 dark:text-green-300 mt-1 break-words">
                        {t('settings.securityInfo')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Account Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-3 sm:p-4 sm:p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
                  <h2 className="text-lg sm:text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words flex-1 min-w-0 pr-2">{t('settings.changeLoginPassword')}</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <form onSubmit={handleUpdateAccount} className="p-3 sm:p-4 sm:p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('settings.currentPassword')} *
                    </label>
                    <input
                      type="password"
                      value={accountSettings.currentPassword}
                      onChange={(e) => setAccountSettings({ ...accountSettings, currentPassword: e.target.value })}
                      className="w-full px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 sm:py-2 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base"
                      placeholder={t('settings.currentPasswordPlaceholder')}
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('settings.currentPasswordRequired')}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="block text-xs sm:text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('settings.newUsername')} *
                    </label>
                    <input
                      type="text"
                      value={accountSettings.newUsername}
                      onChange={(e) => setAccountSettings({ ...accountSettings, newUsername: e.target.value })}
                      className="w-full px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 sm:py-2 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base"
                      placeholder={t('settings.newUsernamePlaceholder')}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('settings.newPassword')}
                    </label>
                    <input
                      type="password"
                      value={accountSettings.newPassword}
                      onChange={(e) => setAccountSettings({ ...accountSettings, newPassword: e.target.value })}
                      className="w-full px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 sm:py-2 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base"
                      placeholder={t('settings.newPasswordPlaceholder')}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('settings.newPasswordInfo')}
                    </p>
                  </div>

                  {accountSettings.newPassword && (
                    <div>
                      <label className="block text-xs sm:text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t('settings.confirmPassword')} *
                      </label>
                      <input
                        type="password"
                        value={accountSettings.confirmPassword}
                        onChange={(e) => setAccountSettings({ ...accountSettings, confirmPassword: e.target.value })}
                        className="w-full px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 sm:py-2 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-sm sm:text-base"
                        placeholder={t('settings.confirmPasswordPlaceholder')}
                        required
                      />
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="w-full sm:flex-1 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 sm:py-2 sm:py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl font-semibold hover:opacity-90 text-sm sm:text-sm sm:text-base"
                    >
                      {t('settings.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:flex-1 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 sm:py-2 sm:py-3 bg-primary text-white rounded-lg sm:rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 text-sm sm:text-sm sm:text-base"
                    >
                      {loading ? t('settings.saving') : t('settings.save')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div>
              <h2 className="text-xl sm:text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">{t('settings.appearanceSettings')}</h2>
              
              <div className="space-y-3 sm:space-y-4 sm:space-y-4 sm:space-y-6">
                {/* Theme */}
                <div>
                  <label className="block text-xs sm:text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    {t('settings.theme')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 sm:gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`p-3 sm:p-4 sm:p-4 sm:p-6 rounded-lg sm:rounded-lg sm:rounded-xl border-2 transition-all ${
                        theme === 'light'
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-3xl sm:text-3xl sm:text-4xl mb-2 text-yellow-500">light_mode</span>
                      <p className="font-semibold text-sm sm:text-sm sm:text-base text-gray-900 dark:text-white">{t('settings.themeLight')}</p>
                      <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{t('settings.themeLightDesc')}</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`p-3 sm:p-4 sm:p-4 sm:p-6 rounded-lg sm:rounded-lg sm:rounded-xl border-2 transition-all ${
                        theme === 'dark'
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-3xl sm:text-3xl sm:text-4xl mb-2 text-green-500">dark_mode</span>
                      <p className="font-semibold text-sm sm:text-sm sm:text-base text-gray-900 dark:text-white">{t('settings.themeDark')}</p>
                      <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{t('settings.themeDarkDesc')}</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme('auto')}
                      className={`p-3 sm:p-4 sm:p-4 sm:p-6 rounded-lg sm:rounded-lg sm:rounded-xl border-2 transition-all ${
                        theme === 'auto'
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-3xl sm:text-3xl sm:text-4xl mb-2 text-purple-500">brightness_auto</span>
                      <p className="font-semibold text-sm sm:text-sm sm:text-base text-gray-900 dark:text-white">{t('settings.themeAuto')}</p>
                      <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{t('settings.themeAutoDesc')}</p>
                    </button>
                  </div>
                  {theme && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-lg sm:rounded-xl border border-green-200 dark:border-green-800">
                      <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-green-700 dark:text-green-300 flex items-center gap-2 sm:gap-2 sm:gap-3">
                        <span className="material-symbols-outlined text-base sm:text-base sm:text-lg flex-shrink-0">check_circle</span>
                        <span className="break-words">
                          {theme === 'auto' 
                            ? t('settings.themeAutoInfo')
                            : t('settings.themeSaved')
                          }
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Language */}
                <div>
                  <label className="block text-xs sm:text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    {t('settings.language')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 sm:gap-3 sm:gap-4">
                    {[
                      { value: 'uz', label: t('settings.uzbek'), flag: '🇺🇿' },
                      { value: 'ru', label: t('settings.russian'), flag: '🇷🇺' },
                      { value: 'en', label: t('settings.english'), flag: '🇬🇧' }
                    ].map((lang) => (
                      <button
                        key={lang.value}
                        type="button"
                        onClick={() => setLanguage(lang.value)}
                        className={`p-3 sm:p-3 sm:p-4 rounded-lg sm:rounded-lg sm:rounded-xl border-2 transition-all ${
                          language === lang.value
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                        }`}
                      >
                        <span className="text-2xl sm:text-2xl sm:text-3xl mb-2 block">{lang.flag}</span>
                        <p className="font-semibold text-sm sm:text-sm sm:text-base text-gray-900 dark:text-white">{lang.label}</p>
                      </button>
                    ))}
                  </div>
                  {language && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-lg sm:rounded-xl border border-green-200 dark:border-green-800">
                      <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-green-700 dark:text-green-300 flex items-center gap-2 sm:gap-2 sm:gap-3">
                        <span className="material-symbols-outlined text-base sm:text-base sm:text-lg flex-shrink-0">check_circle</span>
                        <span>{t('settings.languageSaved')}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* System Settings */}
          {activeTab === 'system' && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('settings.systemSettings')}</h2>
              
              <form onSubmit={handleSaveSystem} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('settings.clinicName')}
                  </label>
                  <input
                    type="text"
                    value={systemSettings.clinicName}
                    onChange={(e) => setSystemSettings({ ...systemSettings, clinicName: e.target.value })}
                    className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('settings.workingHoursStart')}
                    </label>
                    <input
                      type="time"
                      value={systemSettings.workingHoursStart}
                      onChange={(e) => setSystemSettings({ ...systemSettings, workingHoursStart: e.target.value })}
                      className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('settings.workingHoursEnd')}
                    </label>
                    <input
                      type="time"
                      value={systemSettings.workingHoursEnd}
                      onChange={(e) => setSystemSettings({ ...systemSettings, workingHoursEnd: e.target.value })}
                      className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('settings.appointmentDuration')}
                  </label>
                  <input
                    type="number"
                    value={systemSettings.appointmentDuration}
                    onChange={(e) => setSystemSettings({ ...systemSettings, appointmentDuration: parseInt(e.target.value) })}
                    className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    min="15"
                    step="15"
                  />
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-lg sm:rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{t('settings.autoBackup')}</p>
                      <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('settings.autoBackupDesc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.autoBackup}
                        onChange={(e) => setSystemSettings({ ...systemSettings, autoBackup: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-lg sm:rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{t('settings.emailNotifications')}</p>
                      <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('settings.emailNotificationsDesc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.emailNotifications}
                        onChange={(e) => setSystemSettings({ ...systemSettings, emailNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? t('settings.saving') : t('settings.save')}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

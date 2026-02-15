import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const TelegramSetup = () => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const showConfirm = (message, onConfirm, options = {}) => {
    setConfirmModal({ 
      isOpen: true, 
      title: options.title || 'Tasdiqlash',
      message, 
      onConfirm,
      type: options.type || 'warning',
      confirmText: options.confirmText || 'Tasdiqlash',
      cancelText: options.cancelText || 'Bekor qilish'
    });
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/v1/telegram-setup/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStatus(response.data.data);
      }
    } catch (error) {
      console.error('Status check error:', error);
      toast.error('Status tekshirishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    showConfirm(
      'Database migratsiyasini bajarishni xohlaysizmi?',
      async () => {
        try {
          setMigrating(true);
          const token = localStorage.getItem('token');
          const response = await axios.post('http://localhost:5000/api/v1/telegram-setup/migrate', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.success) {
            toast.success('Migratsiya muvaffaqiyatli bajarildi!');
            checkStatus();
          }
        } catch (error) {
          console.error('Migration error:', error);
          toast.error('Migratsiya xatoligi: ' + (error.response?.data?.message || error.message));
        } finally {
          setMigrating(false);
        }
      },
      {
        title: 'Migratsiyani tasdiqlash',
        type: 'warning',
        confirmText: 'Bajarish',
        cancelText: 'Bekor qilish'
      }
    );
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-2xl sm:max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Telegram Bot O'rnatish</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Telegram bot integratsiyasini sozlash va tekshirish
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">Status</h2>
        
        <div className="space-y-3 sm:space-y-4">
          {/* Migration Status */}
          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className={`material-symbols-outlined text-2xl sm:text-3xl ${status?.migrationComplete ? 'text-green-500' : 'text-yellow-500'}`}>
                {status?.migrationComplete ? 'check_circle' : 'warning'}
              </span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Database Migratsiyasi</p>
                <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {status?.migrationComplete ? 'Bajarilgan' : 'Bajarilmagan'}
                </p>
              </div>
            </div>
            {!status?.migrationComplete && (
              <button
                onClick={runMigration}
                disabled={migrating}
                className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl text-sm sm:text-sm sm:text-base font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {migrating ? 'Bajarilmoqda...' : 'Bajarish'}
              </button>
            )}
          </div>

          {/* Columns Status */}
          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className={`material-symbols-outlined text-2xl sm:text-3xl ${status?.hasColumns ? 'text-green-500' : 'text-red-500'}`}>
                {status?.hasColumns ? 'check_circle' : 'cancel'}
              </span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Telegram Ustunlari</p>
                <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {status?.hasColumns ? `${status.columns?.length || 0} ta ustun` : 'Yo\'q'}
                </p>
              </div>
            </div>
          </div>

          {/* Table Status */}
          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className={`material-symbols-outlined text-2xl sm:text-3xl ${status?.hasTable ? 'text-green-500' : 'text-red-500'}`}>
                {status?.hasTable ? 'check_circle' : 'cancel'}
              </span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Telegram Notifications Jadvali</p>
                <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {status?.hasTable ? 'Mavjud' : 'Yo\'q'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {status?.migrationComplete && (
        <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-green-100 dark:border-green-800">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="size-12 bg-green-500 rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center text-white">
                <span className="material-symbols-outlined">people</span>
              </div>
              <div>
                <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Botga ulangan bemorlar</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{status.connectedPatients}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-green-100 dark:border-green-800">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="size-12 bg-green-500 rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center text-white">
                <span className="material-symbols-outlined">notifications</span>
              </div>
              <div>
                <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Yuborilgan xabarnomalar</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{status.sentNotifications}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg sm:rounded-xl p-4 sm:p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 sm:gap-2 sm:gap-3">
          <span className="material-symbols-outlined">info</span>
          Keyingi Qadamlar
        </h3>
        <ol className="space-y-2 sm:space-y-2 sm:space-y-3 text-sm sm:text-sm sm:text-base text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2 sm:gap-2 sm:gap-3">
            <span className="font-bold">1.</span>
            <span>Database migratsiyasini bajaring (yuqoridagi tugma)</span>
          </li>
          <li className="flex items-start gap-2 sm:gap-2 sm:gap-3">
            <span className="font-bold">2.</span>
            <span>Bot papkasiga o'ting: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">cd bot</code></span>
          </li>
          <li className="flex items-start gap-2 sm:gap-2 sm:gap-3">
            <span className="font-bold">3.</span>
            <span>Botni ishga tushiring: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">npm start</code></span>
          </li>
          <li className="flex items-start gap-2 sm:gap-2 sm:gap-3">
            <span className="font-bold">4.</span>
            <span>Bemor panelidan "Telegram Bot" tugmasini bosing</span>
          </li>
          <li className="flex items-start gap-2 sm:gap-2 sm:gap-3">
            <span className="font-bold">5.</span>
            <span>Telegram'da botga /start yuboring</span>
          </li>
        </ol>
      </div>

      {/* Refresh Button */}
      <button
        onClick={checkStatus}
        className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg sm:rounded-lg sm:rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 flex items-center justify-center gap-2 sm:gap-2 sm:gap-3"
      >
        <span className="material-symbols-outlined">refresh</span>
        Statusni Yangilash
      </button>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
      />
    </div>
  );
};

export default TelegramSetup;


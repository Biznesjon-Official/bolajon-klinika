import { useState, useEffect } from 'react';
import api from '../services/api';

const CashierSimple = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load services
      const servicesRes = await api.get('/billing/services');
      setServices(servicesRes.data.data || []);

      // Load stats
      const statsRes = await api.get('/billing/stats');
      setStats(statsRes.data.data || {});
    } catch (error) {
      console.error('Xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <p>Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Kassa</h1>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4">
            <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Bugungi tushum</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.todayRevenue?.toLocaleString() || 0} so'm</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4">
            <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Oylik tushum</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.monthRevenue?.toLocaleString() || 0} so'm</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4">
            <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Kutilayotgan to'lovlar</p>
            <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.pendingInvoices || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4">
            <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Jami qarz</p>
            <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.totalDebt?.toLocaleString() || 0} so'm</p>
          </div>
        </div>
      )}

      {/* Services */}
      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-6">Xizmatlar</h2>
        <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl"
            >
              <p className="font-semibold text-gray-900 dark:text-white">{service.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{service.category}</p>
              <p className="text-primary font-bold mt-2">{parseFloat(service.price).toLocaleString()} so'm</p>
            </div>
          ))}
        </div>
        {services.length === 0 && (
          <p className="text-center text-gray-500 py-4 sm:py-6 lg:py-8">Xizmatlar topilmadi</p>
        )}
      </div>
    </div>
  );
};

export default CashierSimple;

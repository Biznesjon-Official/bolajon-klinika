import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/dashboard/StatCard';
import StatusBadge from '../components/dashboard/StatusBadge';
import { dashboardService } from '../services/dashboardService';

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingPayments: 0,
    availableBeds: 0,
    totalBeds: 0
  });
  const [todayQueue, setTodayQueue] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);

  // Ma'lumotlarni yuklash
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('=== DASHBOARD LOAD DEBUG ===');
      console.log('Calling dashboard APIs...');
      console.log('Token:', localStorage.getItem('token') ? 'exists' : 'missing');
      console.log('User:', localStorage.getItem('user'));

      // Parallel ravishda barcha ma'lumotlarni yuklash
      const [statsData, queueResponse, alertsData] = await Promise.all([
        dashboardService.getStats().catch(err => {
          console.error('Stats error:', err);
          console.error('Stats error response:', err.response?.data);
          console.error('Stats error status:', err.response?.status);
          return null;
        }),
        dashboardService.getTodayQueue().catch(err => {
          console.error('Queue error:', err);
          console.error('Queue error response:', err.response?.data);
          console.error('Queue error status:', err.response?.status);
          return { success: false, data: [] };
        }),
        dashboardService.getAlerts().catch(err => {
          console.error('Alerts error:', err);
          console.error('Alerts error response:', err.response?.data);
          console.error('Alerts error status:', err.response?.status);
          return [];
        })
      ]);

      console.log('Stats data received:', statsData);
      console.log('Queue response received:', queueResponse);
      console.log('Alerts data received:', alertsData);

      if (statsData) {
        console.log('Setting stats:', statsData);
        setStats(statsData);
      } else {
        console.warn('No stats data received!');
        setError('Statistika ma\'lumotlarini yuklashda xatolik');
      }
      
      // Queue response { success: true, data: [...] } formatida
      const queueData = queueResponse?.success ? queueResponse.data : (Array.isArray(queueResponse) ? queueResponse : []);
      console.log('Setting queue data:', queueData);
      setTodayQueue(queueData);
      
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      
      console.log('=== DASHBOARD LOAD COMPLETE ===');
    } catch (err) {
      console.error('Dashboard load error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError('Ma\'lumotlarni yuklashda xatolik yuz berdi: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'waiting': { status: 'info', text: t('status.waiting') },
      'in-progress': { status: 'warning', text: t('status.inProgress') },
      'completed': { status: 'success', text: t('status.completed') },
      'cancelled': { status: 'error', text: t('status.cancelled') }
    };
    return statusMap[status] || statusMap.waiting;
  };

  const getAlertIcon = (type) => {
    const icons = {
      error: 'error',
      warning: 'warning',
      info: 'info',
      success: 'check_circle'
    };
    return icons[type] || 'info';
  };

  const getAlertColor = (type) => {
    const colors = {
      error: 'text-red-600',
      warning: 'text-orange-600',
      info: 'text-green-600',
      success: 'text-green-600'
    };
    return colors[type] || 'text-green-600';
  };

  const getAlertBg = (type) => {
    const backgrounds = {
      error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      warning: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
      info: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    };
    return backgrounds[type] || backgrounds.info;
  };

  if (loading && !stats.totalPatients) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 break-words">
            {t('dashboard.welcome')}, Dr. Admin
            <span className="block sm:inline sm:ml-2 text-xs sm:text-sm mt-1 sm:mt-0">
              {new Date().toLocaleDateString('uz-UZ', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button 
            onClick={loadDashboardData}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            disabled={loading}
          >
            <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span className="hidden sm:inline">Yangilash</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 text-xl sm:text-2xl flex-shrink-0">error</span>
            <p className="text-sm sm:text-base text-red-600 font-semibold break-words">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          title="Jami xodimlar"
          value={stats.totalStaff?.toLocaleString() || '0'}
          icon="badge"
          subtitle="Barcha faol xodimlar"
          color="primary"
        />
        <StatCard
          title="Jami maosh"
          value={`${((stats.totalSalary || 0) / 1000000).toFixed(1)}M`}
          icon="payments"
          subtitle={`${(stats.totalSalary || 0).toLocaleString()} so'm`}
          color="success"
        />
        <StatCard
          title="Bonuslar soni"
          value={stats.bonusesCount?.toString() || '0'}
          icon="star"
          subtitle={`${((stats.totalBonuses || 0) / 1000).toFixed(0)}K so'm`}
          color="warning"
        />
        <StatCard
          title="Jarimalar soni"
          value={stats.penaltiesCount?.toString() || '0'}
          icon="warning"
          subtitle={`${((stats.totalPenalties || 0) / 1000).toFixed(0)}K so'm`}
          color="error"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Today's Queue */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{t('dashboard.todayQueue')}</h2>
            <button 
              onClick={() => navigate('/queue')}
              className="text-primary text-sm font-semibold hover:underline self-start sm:self-auto"
            >
              {t('dashboard.viewAll')}
            </button>
          </div>
          
          {todayQueue.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <span className="material-symbols-outlined text-5xl sm:text-6xl text-gray-300 dark:text-gray-700 mb-3 sm:mb-4">
                event_available
              </span>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Bugun navbat yo'q</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {todayQueue.slice(0, 5).map((patient) => (
                <div 
                  key={patient.id} 
                  onClick={() => navigate(`/patients/${patient.patientId || patient.patient_id}`)}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="size-10 sm:size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm sm:text-base flex-shrink-0">
                      {patient.queueNumber || patient.patientName?.split(' ').map(n => n[0]).join('') || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">{patient.patientName || 'Noma\'lum'}</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                        {patient.patientNumber || patient.patientId || 'ID yo\'q'} • {patient.doctorName || 'Shifokor belgilanmagan'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {patient.appointmentTime || new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <StatusBadge 
                      status={getStatusBadge(patient.status).status}
                      text={getStatusBadge(patient.status).text}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts Panel */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">{t('dashboard.alerts')}</h2>
          
          {alerts.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <span className="material-symbols-outlined text-5xl sm:text-6xl text-gray-300 dark:text-gray-700 mb-3 sm:mb-4">
                notifications_off
              </span>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Ogohlantirishlar yo'q</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {alerts.slice(0, 5).map((alert, index) => (
                <div key={index} className={`p-3 sm:p-4 rounded-lg border ${getAlertBg(alert.type)}`}>
                  <div className="flex gap-2 sm:gap-3">
                    <span className={`material-symbols-outlined text-xl sm:text-2xl flex-shrink-0 ${getAlertColor(alert.type)}`}>
                      {getAlertIcon(alert.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white break-words">{alert.message}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {alert.time || new Date().toLocaleTimeString('uz-UZ')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: 'person_add', label: t('dashboard.registerPatient'), color: 'bg-green-500', path: '/patients' },
          { icon: 'event_available', label: t('dashboard.bookAppointment'), color: 'bg-green-500', path: '/queue' },
          { icon: 'receipt_long', label: t('dashboard.processPayment'), color: 'bg-orange-500', path: '/cashier' },
          { icon: 'biotech', label: t('dashboard.labRequest'), color: 'bg-purple-500', path: '/laboratory' },
        ].map((action, index) => (
          <button 
            key={index} 
            onClick={() => navigate(action.path)}
            className="p-4 sm:p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all group"
          >
            <div className={`size-10 sm:size-12 ${action.color} rounded-lg flex items-center justify-center text-white mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined text-xl sm:text-2xl">{action.icon}</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white break-words">{action.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

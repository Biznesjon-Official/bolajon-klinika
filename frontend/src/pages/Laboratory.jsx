import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import laboratoryService from '../services/laboratoryService';
import patientService from '../services/patientService';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import LabPharmacy from './LabPharmacy';
import OrdersList from '../components/laboratory/OrdersList';
import TestsCatalog from '../components/laboratory/TestsCatalog';
import NewOrderModal from '../components/laboratory/NewOrderModal';
import ResultModal from '../components/laboratory/ResultModal';

export default function Laboratory() {
  console.log('=== LABORATORY COMPONENT LOADED ===');
  console.log('Version: 2.0 - with PDF support');
  
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders'); // orders, tests, results, pharmacy
  const [loading, setLoading] = useState(false);
  
  // Orders
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Tests
  const [tests, setTests] = useState([]);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('today');
  
  // Modals
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Form data
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    loadData();
  }, [activeTab, filterStatus, filterDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'orders') {
        await loadOrders();
        await loadStats();
      } else if (activeTab === 'tests') {
        await loadTests();
      }
    } catch (error) {
      toast.error('Xatolik: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    const params = {};
    
    if (filterStatus !== 'all') {
      params.status = filterStatus;
    }
    
    if (filterDate === 'today') {
      params.date_from = new Date().toISOString().split('T')[0];
    } else if (filterDate === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      params.date_from = weekAgo.toISOString().split('T')[0];
    }
    
    const response = await laboratoryService.getOrders(params);
    setOrders(response.data);
  };

  const loadStats = async () => {
    const params = {};
    
    if (filterDate === 'today') {
      params.date_from = new Date().toISOString().split('T')[0];
    } else if (filterDate === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      params.date_from = weekAgo.toISOString().split('T')[0];
    } else if (filterDate === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      params.date_from = monthAgo.toISOString().split('T')[0];
    }
    // 'all' uchun parametr yuborilmaydi
    
    const response = await laboratoryService.getStats(params);
    setStats(response.data);
  };

  const loadTests = async () => {
    const response = await laboratoryService.getTests({ is_active: true });
    setTests(response.data);
  };

  const loadPatientsAndDoctors = async () => {
    try {
      const [patientsRes, staffRes] = await Promise.all([
        patientService.getPatients(),
        api.get('/staff')
      ]);
      setPatients(patientsRes.data);
      
      // Faqat laborantlarni filtrlash
      const allStaff = staffRes.data.data || staffRes.data;
      const laborants = allStaff.filter(staff => 
        staff.role_name === 'laborant' || 
        staff.role_name === 'Laborant' ||
        (staff.role && (staff.role.name === 'laborant' || staff.role.name === 'Laborant'))
      );
      
      setDoctors(laborants);
    } catch (error) {
      toast.error('Xodimlarni yuklashda xatolik');
    }
  };

  const handleNewOrder = async () => {
    await loadPatientsAndDoctors();
    await loadTests();
    setShowNewOrderModal(true);
  };

  const handleEnterResult = async (order) => {
    console.log('=== HANDLE ENTER RESULT ===');
    console.log('Order:', order);
    console.log('Patient ID:', order.patient_id);
    
    // Avval to'lovni tekshirish
    if (order.patient_id) {
      console.log('Checking payment status for patient:', order.patient_id);
      
      try {
        const response = await api.get(`/billing/invoices/patient/${order.patient_id}/unpaid`);
        
        console.log('Payment check response:', response.data);
        
        if (response.data.success && response.data.data && response.data.data.length > 0) {
          // To'lanmagan hisob-fakturalar bor
          const totalUnpaid = response.data.data.reduce((sum, inv) => sum + (inv.total_amount - inv.paid_amount), 0);
          
          console.log('❌ UNPAID INVOICES FOUND:', totalUnpaid);
          
          toast.error(
            `⚠️ DIQQAT: Bemorning ${totalUnpaid.toLocaleString()} so'm to'lanmagan qarzi bor! Iltimos, avval to'lovni amalga oshiring.`,
            { duration: 5000 }
          );
          return; // To'xtatamiz
        } else {
          console.log('✅ No unpaid invoices');
        }
      } catch (invoiceError) {
        console.error('❌ Invoice check error:', invoiceError);
        toast.error('To\'lov holatini tekshirishda xatolik yuz berdi');
        return; // Xatolik bo'lsa ham to'xtatamiz
      }
    } else {
      console.log('⚠️ No patient_id in order');
    }
    
    console.log('✅ Opening result modal');
    setSelectedOrder(order);
    setShowResultModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
      sample_taken: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
      in_progress: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
      ready: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
      approved: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
      cancelled: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
    };
    return colors[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: t('lab.pending'),
      sample_taken: t('lab.sampleTaken'),
      in_progress: t('lab.inProgress'),
      ready: t('lab.ready'),
      approved: t('lab.approved'),
      cancelled: t('lab.cancelled')
    };
    return texts[status] || status;
  };

  const isAdmin = user?.role?.name === 'admin' || user?.role?.name === 'Administrator' || user?.role_name === 'admin' || user?.role_name === 'Administrator';
  const isLaborant = user?.role?.name === 'laborant' || user?.role?.name === 'Laborant' || user?.role?.name === 'Lab' || user?.role_name === 'laborant' || user?.role_name === 'Laborant' || user?.role_name === 'Lab';
  const isDoctor = user?.role?.name === 'doctor' || user?.role?.name === 'Shifokor' || user?.role?.name === 'Doctor' || user?.role_name === 'doctor' || user?.role_name === 'Shifokor' || user?.role_name === 'Doctor';
  const isReception = user?.role?.name === 'reception' || 
                      user?.role?.name === 'Reception' || 
                      user?.role?.name === 'receptionist' || 
                      user?.role?.name === 'Receptionist' || 
                      user?.role?.name === 'Qabulxona' || 
                      user?.role_name === 'reception' || 
                      user?.role_name === 'Reception' || 
                      user?.role_name === 'receptionist' || 
                      user?.role_name === 'Receptionist' || 
                      user?.role_name === 'Qabulxona';

  // Debug
  console.log('=== LABORATORY PAGE ===');
  console.log('User:', user);
  console.log('User role:', user?.role);
  console.log('User role_name:', user?.role_name);
  console.log('isAdmin:', isAdmin);
  console.log('isLaborant:', isLaborant);
  console.log('isDoctor:', isDoctor);
  console.log('isReception:', isReception);

  return (
    <div className="p-3 sm:p-4 sm:p-4 sm:p-6 lg:p-8 space-y-3 sm:space-y-4 sm:space-y-4 sm:space-y-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 sm:gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-2xl sm:text-3xl font-black text-gray-900 dark:text-white break-words">{t('lab.pageTitle')}</h1>
          <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            {t('lab.pageSubtitle')}
          </p>
        </div>
        
        {(isAdmin || isDoctor || isReception) && (
          <button
            onClick={handleNewOrder}
            className="w-full sm:w-auto px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl font-semibold hover:opacity-90 flex items-center justify-center gap-2 sm:gap-2 sm:gap-3"
          >
            <span className="material-symbols-outlined">add</span>
            <span>{t('lab.newOrder')}</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (isAdmin || isLaborant) && (
        <>
          {/* Admin uchun kengaytirilgan statistika */}
          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 sm:gap-3 sm:gap-4 mb-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg sm:rounded-xl p-5 border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <span className="material-symbols-outlined text-2xl sm:text-3xl text-blue-600">payments</span>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Bugungi tushum</p>
                    <p className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400">
                      {(stats.today_revenue || 0).toLocaleString()} so'm
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg sm:rounded-xl p-5 border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <span className="material-symbols-outlined text-2xl sm:text-3xl text-green-600">group</span>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Bugungi bemorlar</p>
                    <p className="text-xl sm:text-2xl font-black text-green-700 dark:text-green-400">
                      {stats.today_patients || 0} ta
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg sm:rounded-xl p-5 border-2 border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <span className="material-symbols-outlined text-2xl sm:text-3xl text-purple-600">check_circle</span>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Bugun tayyor</p>
                    <p className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-400">
                      {stats.completed_today || 0} ta
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Reaktiv statistikasi (faqat admin) */}
          {isAdmin && stats.reagent_stats && (
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-5 border border-gray-200 dark:border-gray-700 mb-4">
              <h3 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2 sm:gap-2 sm:gap-3">
                <span className="material-symbols-outlined text-purple-600">science</span>
                Lab Reaktivlar Statistikasi
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-lg sm:rounded-xl">
                  <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{stats.reagent_stats.total}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Jami</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-lg sm:rounded-xl">
                  <p className="text-xl sm:text-2xl font-black text-green-700 dark:text-green-400">{stats.reagent_stats.active}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Yaroqli</p>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg sm:rounded-lg sm:rounded-xl">
                  <p className="text-xl sm:text-2xl font-black text-red-700 dark:text-red-400">{stats.reagent_stats.expired}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Yaroqsiz</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg sm:rounded-lg sm:rounded-xl">
                  <p className="text-xl sm:text-2xl font-black text-yellow-700 dark:text-yellow-400">{stats.reagent_stats.low_stock}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Kam qolgan</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-lg sm:rounded-xl">
                  <p className="text-xl sm:text-2xl font-black text-gray-700 dark:text-gray-400">{stats.reagent_stats.depleted}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Tugagan</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Buyurtmalar statistikasi */}
          <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 sm:gap-3 sm:gap-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4 sm:p-5 border-l-4 border-yellow-500">
              <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('lab.pending')}</p>
              <p className="text-2xl sm:text-2xl sm:text-3xl font-black text-yellow-700 dark:text-yellow-400">{stats.pending_orders || 0}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4 sm:p-5 border-l-4 border-purple-500">
              <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('lab.inProgress')}</p>
              <p className="text-2xl sm:text-2xl sm:text-3xl font-black text-purple-700 dark:text-purple-400">{stats.in_progress_orders || 0}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4 sm:p-5 border-l-4 border-green-500">
              <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Jami buyurtmalar</p>
              <p className="text-2xl sm:text-2xl sm:text-3xl font-black text-green-700 dark:text-green-400">{stats.total_orders || 0}</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4 sm:p-5 border-l-4 border-orange-500">
              <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Bugun tayyor</p>
              <p className="text-2xl sm:text-2xl sm:text-3xl font-black text-orange-700 dark:text-orange-400">{stats.completed_today || 0}</p>
            </div>
          </div>
        </>
      )}

      {/* Tabs */}
      <div className="flex gap-2 sm:gap-2 sm:gap-3 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'orders'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {t('lab.orders')}
        </button>
        {(isAdmin || isLaborant) && (
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'tests'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('lab.testsCatalog')}
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => setActiveTab('pharmacy')}
            className={`px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 font-semibold transition-colors whitespace-nowrap flex items-center gap-2 sm:gap-2 sm:gap-3 ${
              activeTab === 'pharmacy'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base sm:text-lg">science</span>
            Lab Dorixonasi
          </button>
        )}
      </div>

      {/* Filters */}
      {activeTab === 'orders' && (
        <div className="flex flex-col sm:flex-col sm:flex-row gap-2 sm:gap-3 sm:gap-3 sm:gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:flex-1 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-lg sm:rounded-xl text-sm sm:text-sm sm:text-base"
          >
            <option value="all">{t('lab.allStatuses')}</option>
            <option value="pending">{t('lab.pending')}</option>
            <option value="sample_taken">{t('lab.sampleTaken')}</option>
            <option value="in_progress">{t('lab.inProgress')}</option>
            <option value="ready">{t('lab.ready')}</option>
            <option value="approved">{t('lab.approved')}</option>
          </select>
          
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full sm:flex-1 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-lg sm:rounded-xl text-sm sm:text-sm sm:text-base"
          >
            <option value="today">{t('lab.today')}</option>
            <option value="week">{t('lab.lastWeek')}</option>
            <option value="month">{t('lab.lastMonth')}</option>
            <option value="all">{t('lab.all')}</option>
          </select>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : activeTab === 'orders' ? (
        <OrdersList 
          orders={orders} 
          onEnterResult={handleEnterResult}
          onRefresh={loadData}
          isAdmin={isAdmin}
          isLaborant={isLaborant}
          isDoctor={isDoctor}
          isReception={isReception}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
          t={t}
        />
      ) : activeTab === 'tests' ? (
        <TestsCatalog tests={tests} onRefresh={loadData} t={t} />
      ) : activeTab === 'pharmacy' && isAdmin ? (
        <LabPharmacy />
      ) : null}

      {/* Modals */}
      {showNewOrderModal && (
        <NewOrderModal
          isOpen={showNewOrderModal}
          onClose={() => setShowNewOrderModal(false)}
          patients={patients}
          doctors={doctors}
          tests={tests}
          onSuccess={loadData}
          t={t}
        />
      )}

      {showResultModal && selectedOrder && (
        <ResultModal
          isOpen={showResultModal}
          onClose={() => {
            setShowResultModal(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
          onSuccess={loadData}
          t={t}
        />
      )}
    </div>
  );
}



import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import laboratoryService from '../services/laboratoryService';
import patientService from '../services/patientService';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

export default function Laboratory() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders'); // orders, tests, results
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

  const handleEnterResult = (order) => {
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

  const isAdmin = user?.role?.name === 'admin' || user?.role?.name === 'Administrator';
  const isLaborant = user?.role?.name === 'laborant' || user?.role?.name === 'Laborant';
  const isDoctor = user?.role?.name === 'doctor' || user?.role?.name === 'Shifokor';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white break-words">{t('lab.pageTitle')}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            {t('lab.pageSubtitle')}
          </p>
        </div>
        
        {(isAdmin || isLaborant) && (
          <button
            onClick={handleNewOrder}
            className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            <span>{t('lab.newOrder')}</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (isAdmin || isLaborant) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 sm:p-5 border-l-4 border-yellow-500">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('lab.pending')}</p>
            <p className="text-2xl sm:text-3xl font-black text-yellow-700 dark:text-yellow-400">{stats.pending}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 sm:p-5 border-l-4 border-purple-500">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('lab.inProgress')}</p>
            <p className="text-2xl sm:text-3xl font-black text-purple-700 dark:text-purple-400">{stats.in_progress}</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 sm:p-5 border-l-4 border-orange-500">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('lab.ready')}</p>
            <p className="text-2xl sm:text-3xl font-black text-orange-700 dark:text-orange-400">{stats.ready}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 sm:p-5 border-l-4 border-green-500">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('lab.approved')}</p>
            <p className="text-2xl sm:text-3xl font-black text-green-700 dark:text-green-400">{stats.approved}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'orders'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {t('lab.orders')}
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'tests'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('lab.testsCatalog')}
          </button>
        )}
      </div>

      {/* Filters */}
      {activeTab === 'orders' && (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-sm sm:text-base"
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
            className="w-full sm:flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-sm sm:text-base"
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
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
          t={t}
        />
      ) : activeTab === 'tests' ? (
        <TestsCatalog tests={tests} onRefresh={loadData} t={t} />
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

// OrdersList component
function OrdersList({ orders, onEnterResult, onRefresh, isAdmin, isLaborant, isDoctor, getStatusColor, getStatusText, t }) {
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await laboratoryService.updateOrderStatus(orderId, newStatus);
      toast.success(t('lab.statusUpdated'));
      onRefresh();
    } catch (error) {
      toast.error(t('lab.error'));
    }
  };

  const handleApprove = async (resultId) => {
    try {
      await laboratoryService.approveResult(resultId);
      toast.success(t('lab.resultApproved'));
      onRefresh();
    } catch (error) {
      toast.error(t('lab.error'));
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-8 sm:p-12 text-center border border-gray-200 dark:border-gray-800">
        <span className="material-symbols-outlined text-5xl sm:text-6xl text-gray-300 dark:text-gray-700 mb-4">science</span>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">{t('lab.noOrders')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('lab.orderNumber')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('lab.patient')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('lab.test')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('lab.doctor')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('lab.date')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('lab.status')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('lab.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">{order.order_number}</td>
                <td className="px-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{order.patient_name}</p>
                    <p className="text-gray-500 dark:text-gray-400">{order.patient_number}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{order.test_name}</td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{order.doctor_name}</td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {new Date(order.order_date).toLocaleDateString('uz-UZ')}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    {isLaborant && order.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'in_progress')}
                        className="px-3 py-1 bg-green-500 text-white rounded text-xs font-semibold hover:bg-green-600 whitespace-nowrap"
                      >
                        Namuna olindi
                      </button>
                    )}
                    {isLaborant && order.status === 'in_progress' && !order.result_id && (
                      <button
                        onClick={() => onEnterResult(order)}
                        className="px-3 py-1 bg-purple-500 text-white rounded text-xs font-semibold hover:bg-purple-600 whitespace-nowrap"
                      >
                        {t('lab.enterResult')}
                      </button>
                    )}
                    {order.result_id && (order.approved_at || isAdmin || isLaborant) && (
                      <button
                        onClick={() => window.open(`/laboratory/result/${order.id}`, '_blank')}
                        className="px-3 py-1 bg-gray-500 text-white rounded text-xs font-semibold hover:bg-gray-600 whitespace-nowrap"
                      >
                        {t('lab.view')}
                      </button>
                    )}
                    {isAdmin && order.status === 'ready' && order.result_id && !order.approved_at && (
                      <button
                        onClick={() => handleApprove(order.result_id)}
                        className="px-3 py-1 bg-green-500 text-white rounded text-xs font-semibold hover:bg-green-600 whitespace-nowrap"
                      >
                        Tasdiqlash
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden p-3 sm:p-4 space-y-3">
        {orders.map((order) => (
          <div 
            key={order.id} 
            className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Order Number & Status */}
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="material-symbols-outlined text-primary flex-shrink-0">science</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white truncate">{order.order_number}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>

            {/* Order Details */}
            <div className="space-y-2 mb-3">
              {/* Patient */}
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-lg flex-shrink-0">person</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('lab.patient')}</p>
                  <p className="font-semibold text-gray-900 dark:text-white break-words">{order.patient_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{order.patient_number}</p>
                </div>
              </div>

              {/* Test */}
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-lg flex-shrink-0">biotech</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('lab.test')}</p>
                  <p className="text-sm text-gray-900 dark:text-white break-words">{order.test_name}</p>
                </div>
              </div>

              {/* Doctor */}
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-lg flex-shrink-0">medical_services</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('lab.doctor')}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{order.doctor_name}</p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-lg flex-shrink-0">calendar_today</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('lab.date')}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {new Date(order.order_date).toLocaleDateString('uz-UZ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              {isLaborant && order.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange(order.id, 'in_progress')}
                  className="w-full px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600"
                >
                  Namuna olindi
                </button>
              )}
              {isLaborant && order.status === 'in_progress' && !order.result_id && (
                <button
                  onClick={() => onEnterResult(order)}
                  className="w-full px-3 py-2 bg-purple-500 text-white rounded-lg text-sm font-semibold hover:bg-purple-600"
                >
                  {t('lab.enterResult')}
                </button>
              )}
              {order.result_id && (order.approved_at || isAdmin || isLaborant) && (
                <button
                  onClick={() => window.open(`/laboratory/result/${order.id}`, '_blank')}
                  className="w-full px-3 py-2 bg-gray-500 text-white rounded-lg text-sm font-semibold hover:bg-gray-600"
                >
                  {t('lab.view')}
                </button>
              )}
              {isAdmin && order.status === 'ready' && order.result_id && !order.approved_at && (
                <button
                  onClick={() => handleApprove(order.result_id)}
                  className="w-full px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600"
                >
                  Tasdiqlash
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// TestsCatalog component (minimal)
function TestsCatalog({ tests, onRefresh, t }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 overflow-hidden">
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">{t('lab.catalogTitle')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {tests.map((test) => (
          <div key={test.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 overflow-hidden">
            <h4 className="font-bold text-gray-900 dark:text-white break-words">{test.test_name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{test.test_code}</p>
            <p className="text-lg font-semibold text-primary mt-2">
              {test.price.toLocaleString()} {t('lab.price')}
            </p>
            {test.normal_value_min && test.normal_value_max && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                {t('lab.normalRange')}: {test.normal_value_min} - {test.normal_value_max} {test.unit}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// NewOrderModal component
function NewOrderModal({ isOpen, onClose, patients, doctors, tests, onSuccess, t }) {
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    test_id: '',
    priority: 'normal',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.patient_id || !formData.test_id) {
      toast.error(t('lab.fillRequired'));
      return;
    }

    try {
      setLoading(true);
      const response = await laboratoryService.createOrder(formData);
      if (response.success) {
        toast.success(`${t('lab.orderCreated')} - Hisob-faktura: ${response.data.invoice_number}`);
      } else {
        toast.success(t('lab.orderCreated'));
      }
      onClose();
      onSuccess();
    } catch (error) {
      toast.error(t('lab.error') + ': ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-white dark:bg-gray-900 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{t('lab.newOrderTitle')}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Bemor */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('lab.patient')} <span className="text-red-500">{t('lab.required')}</span>
            </label>
            <select
              required
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
            >
              <option value="">{t('lab.selectPatient')}</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name} - {patient.patient_number}
                </option>
              ))}
            </select>
          </div>

          {/* Shifokor */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('lab.doctor')}
            </label>
            <select
              value={formData.doctor_id}
              onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
            >
              <option value="">{t('lab.selectDoctor')}</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                </option>
              ))}
            </select>
          </div>

          {/* Tahlil */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('lab.test')} <span className="text-red-500">{t('lab.required')}</span>
            </label>
            <select
              required
              value={formData.test_id}
              onChange={(e) => setFormData({ ...formData, test_id: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
            >
              <option value="">{t('lab.selectTest')}</option>
              {tests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.name} - {test.price?.toLocaleString() || 0} so'm
                </option>
              ))}
            </select>
          </div>

          {/* Muhimlik */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('lab.priority')}
            </label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: 'normal' })}
                className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-semibold transition-all text-sm sm:text-base ${
                  formData.priority === 'normal'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                {t('lab.normalPriority')}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: 'urgent' })}
                className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-semibold transition-all text-sm sm:text-base ${
                  formData.priority === 'urgent'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                {t('lab.urgent')}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: 'stat' })}
                className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-semibold transition-all text-sm sm:text-base ${
                  formData.priority === 'stat'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                {t('lab.stat')}
              </button>
            </div>
          </div>

          {/* Izoh */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('lab.notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm sm:text-base"
              placeholder={t('lab.notesPlaceholder')}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 text-sm sm:text-base"
            >
              {t('lab.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? t('lab.loading') : t('lab.createOrder')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ResultModal component
function ResultModal({ isOpen, onClose, order, onSuccess, t }) {
  const [formData, setFormData] = useState({
    order_id: order?.id || '',
    result_value: '',
    result_text: '',
    unit: order?.test_unit || '',
    technician_notes: '',
    file_path: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.result_value && !formData.result_text) {
      toast.error(t('lab.enterResultValue'));
      return;
    }

    try {
      setLoading(true);
      await laboratoryService.createResult(formData);
      toast.success(t('lab.resultEntered'));
      onClose();
      onSuccess();
    } catch (error) {
      toast.error(t('lab.error') + ': ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-white dark:bg-gray-900 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{t('lab.enterResultTitle')}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Buyurtma ma'lumotlari */}
          <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 overflow-hidden">
            <p className="font-semibold text-gray-900 dark:text-white break-words">{order?.patient_name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{order?.test_name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{t('lab.orderInfo')}: {order?.order_number}</p>
          </div>

          {/* Sonli natija */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('lab.numericResult')}
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="number"
                step="0.0001"
                value={formData.result_value}
                onChange={(e) => setFormData({ ...formData, result_value: e.target.value })}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                placeholder={t('lab.value')}
              />
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full sm:w-32 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                placeholder={t('lab.unit')}
              />
            </div>
          </div>

          {/* Matnli natija */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('lab.textResult')}
            </label>
            <textarea
              value={formData.result_text}
              onChange={(e) => setFormData({ ...formData, result_text: e.target.value })}
              rows="4"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm sm:text-base"
              placeholder={t('lab.detailedResult')}
            />
          </div>

          {/* Laborant izohi */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('lab.technicianNotes')}
            </label>
            <textarea
              value={formData.technician_notes}
              onChange={(e) => setFormData({ ...formData, technician_notes: e.target.value })}
              rows="2"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm sm:text-base"
              placeholder={t('lab.notesPlaceholder')}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 text-sm sm:text-base"
            >
              {t('lab.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? t('lab.loading') : t('lab.saveResult')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

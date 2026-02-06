import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import laboratoryService from '../services/laboratoryService';
import toast, { Toaster } from 'react-hot-toast';

export default function LaborantPanel() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    today_pending: 0,
    not_ready: 0,
    overdue: 0,
    recent_results: 0
  });
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultForm, setResultForm] = useState({
    test_results: [],
    notes: ''
  });
  const [tableRows, setTableRows] = useState([
    ['', ''],
    ['', ''],
    ['', ''],
    ['', '']
  ]);
  const [filters, setFilters] = useState({
    date: '',
    test_type: '',
    status: 'all',
    patient_search: ''
  });

  // History state
  const [history, setHistory] = useState([]);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 30 soniyada yangilanadi
    return () => clearInterval(interval);
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'dashboard' || activeTab === 'orders' || activeTab === 'sample') {
        const [statsData, ordersData] = await Promise.all([
          laboratoryService.getLaborantStats(),
          laboratoryService.getOrders({ status: 'all' })
        ]);

        if (statsData.success) setStats(statsData.data);
        if (ordersData.success) setOrders(ordersData.data);
      }
      
      if (activeTab === 'history') {
        const historyData = await laboratoryService.getCompletedTests();
        if (historyData.success) setHistory(historyData.data);
      }
    } catch (error) {
      console.error('Load data error:', error);
      toast.error('Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = async (qrCode) => {
    if (!qrCode || !qrCode.trim()) {
      toast.error('QR kodni kiriting');
      return;
    }
    
    try {
      const response = await laboratoryService.scanQR(qrCode.trim());
      if (response.success) {
        toast.success('QR-kod muvaffaqiyatli skanerlandi');
        setSelectedOrder(response.data);
        loadData();
      }
    } catch (error) {
      console.error('QR scan error:', error);
      toast.error(error.response?.data?.message || 'QR-kod topilmadi');
    }
  };

  const handleCollectSample = async (orderId) => {
    try {
      const response = await laboratoryService.updateOrderStatus(orderId, 'sample_collected');
      if (response.success) {
        toast.success('Namuna olindi');
        loadData();
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi');
    }
  };

  const handleOpenResultModal = (order) => {
    setSelectedOrder(order);
    // Reset table to 4x2
    setTableRows([
      ['', ''],
      ['', ''],
      ['', ''],
      ['', '']
    ]);
    setResultForm({ test_results: [], notes: '' });
    setShowResultModal(true);
  };

  const addTableRow = () => {
    setTableRows([...tableRows, ['', '']]);
  };

  const removeTableRow = (index) => {
    if (tableRows.length > 1) {
      const newRows = tableRows.filter((_, i) => i !== index);
      setTableRows(newRows);
    }
  };

  const updateTableCell = (rowIndex, colIndex, value) => {
    const newRows = [...tableRows];
    newRows[rowIndex][colIndex] = value;
    setTableRows(newRows);
  };

  const handleSubmitResults = async () => {
    try {
      // Convert table to text format
      const tableText = tableRows
        .filter(row => row[0] || row[1]) // Only include non-empty rows
        .map(row => `${row[0]}\t${row[1]}`)
        .join('\n');
      
      const response = await laboratoryService.submitResults(selectedOrder.id, {
        test_results: [{
          parameter_name: 'Natija',
          value: tableText,
          unit: '',
          normal_range: '',
          is_normal: null
        }],
        notes: resultForm.notes
      });
      
      if (response.success) {
        toast.success('Natijalar muvaffaqiyatli kiritildi');
        setShowResultModal(false);
        setSelectedOrder(null);
        loadData();
      }
    } catch (error) {
      toast.error('Natijalarni kiritishda xatolik');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filters.status !== 'all' && order.status !== filters.status) return false;
    if (filters.test_type && order.test_type !== filters.test_type) return false;
    if (filters.date && !order.created_at.startsWith(filters.date)) return false;
    if (filters.patient_search) {
      const search = filters.patient_search.toLowerCase();
      const patientName = `${order.patient_first_name} ${order.patient_last_name}`.toLowerCase();
      if (!patientName.includes(search) && !order.patient_number.toLowerCase().includes(search)) {
        return false;
      }
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-5xl">science</span>
          <div>
            <h1 className="text-3xl font-black">LABORANT PANELI</h1>
            <p className="text-lg opacity-90">Xush kelibsiz, {user?.first_name || 'Laborant'}</p>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl p-6 text-white">
            <span className="material-symbols-outlined text-3xl mb-2">pending_actions</span>
            <p className="text-4xl font-black">{stats.today_pending}</p>
            <p className="text-sm opacity-90">Bugungi kutilayotgan</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <span className="material-symbols-outlined text-3xl mb-2">hourglass_empty</span>
            <p className="text-4xl font-black">{stats.not_ready}</p>
            <p className="text-sm opacity-90">Tayyorlanmagan</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
            <span className="material-symbols-outlined text-3xl mb-2">warning</span>
            <p className="text-4xl font-black">{stats.overdue}</p>
            <p className="text-sm opacity-90">Kechikkan</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <span className="material-symbols-outlined text-3xl mb-2">check_circle</span>
            <p className="text-4xl font-black">{stats.recent_results}</p>
            <p className="text-sm opacity-90">Oxirgi natijalar</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2 px-4 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
              { id: 'orders', label: 'Buyurtmalar', icon: 'assignment' },
              { id: 'sample', label: 'Namuna olish', icon: 'colorize' },
              { id: 'history', label: 'Tarix', icon: 'history' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                  className="px-4 py-2 border rounded-lg"
                  placeholder="Sana"
                />
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="all">Barcha statuslar</option>
                  <option value="pending">Kutilmoqda</option>
                  <option value="sample_collected">Namuna olingan</option>
                  <option value="in_progress">Jarayonda</option>
                  <option value="completed">Tayyor</option>
                </select>
                <input
                  type="text"
                  value={filters.patient_search}
                  onChange={(e) => setFilters({ ...filters, patient_search: e.target.value })}
                  className="px-4 py-2 border rounded-lg"
                  placeholder="Bemor qidirish..."
                />
              </div>

              {/* Orders List */}
              <div className="space-y-3">
                {filteredOrders.map(order => (
                  <div
                    key={order.id}
                    className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="material-symbols-outlined text-2xl text-primary">
                            person
                          </span>
                          <div>
                            <p className="font-bold text-lg">
                              {order.patient_first_name} {order.patient_last_name}
                            </p>
                            <p className="text-sm text-gray-600">{order.patient_number}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p><span className="font-semibold">Tahlil:</span> {order.test_name}</p>
                          <p><span className="font-semibold">Sana:</span> {new Date(order.created_at).toLocaleString('uz-UZ')}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'sample_collected' ? 'bg-green-100 text-green-800' :
                          order.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {order.status === 'pending' ? '🟡 Kutilmoqda' :
                           order.status === 'sample_collected' ? '🔵 Namuna olingan' :
                           order.status === 'in_progress' ? '🟣 Jarayonda' :
                           '🟢 Tayyor'}
                        </span>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleCollectSample(order.id)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                          >
                            Namuna olish
                          </button>
                        )}
                        {order.status === 'sample_collected' && (
                          <button
                            onClick={() => handleOpenResultModal(order)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                          >
                            Natija kiritish
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sample Collection Tab */}
          {activeTab === 'sample' && (
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-3xl text-green-600">colorize</span>
                  <div>
                    <h3 className="text-xl font-bold">Namuna olish</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">QR-kodni skanerlang yoki quyidagi ro'yxatdan tanlang</p>
                  </div>
                </div>
                <div className="max-w-md">
                  <input
                    type="text"
                    placeholder="QR-kod yoki buyurtma raqami (LAB000001)"
                    className="w-full px-4 py-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleScanQR(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>

              {/* Pending Orders for Sample Collection */}
              <div>
                <h4 className="text-lg font-bold mb-4">Namuna olish kutilayotgan buyurtmalar</h4>
                {orders.filter(o => o.status === 'pending').length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">check_circle</span>
                    <p className="text-gray-600 dark:text-gray-400">Barcha namunalar olingan</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.filter(o => o.status === 'pending').map(order => (
                      <div
                        key={order.id}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="size-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-2xl">
                                  person
                                </span>
                              </div>
                              <div>
                                <p className="font-bold text-lg">
                                  {order.patient_first_name} {order.patient_last_name}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{order.patient_number}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm ml-15">
                              <p><span className="font-semibold">Buyurtma:</span> {order.order_number}</p>
                              <p><span className="font-semibold">Tahlil:</span> {order.test_name}</p>
                              <p><span className="font-semibold">Namuna:</span> {order.sample_type || 'Qon'}</p>
                              <p><span className="font-semibold">Sana:</span> {new Date(order.created_at).toLocaleString('uz-UZ')}</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                              🟡 Kutilmoqda
                            </span>
                            <button
                              onClick={() => handleCollectSample(order.id)}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-semibold flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-lg">colorize</span>
                              Namuna olish
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Tahlillar Tarixi</h3>
              
              {!selectedPatientHistory ? (
                // Bemorlar ro'yxati
                <div>
                  {history.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">history</span>
                      <p className="text-gray-600 dark:text-gray-400">Hali tahlillar yo'q</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {history.map(item => (
                        <div
                          key={item.patient_id}
                          onClick={() => setSelectedPatientHistory(item)}
                          className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="size-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-2xl">person</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-base truncate">{item.patient_name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{item.patient_number}</p>
                            </div>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-semibold">Tahlillar:</span> {item.total_tests}</p>
                            <p><span className="font-semibold">Oxirgi:</span> {new Date(item.last_test_date).toLocaleDateString('uz-UZ')}</p>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {item.completed_by_name || 'Laborant'}
                            </span>
                            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Bemor tahlillari tafsiloti
                <div>
                  <button
                    onClick={() => setSelectedPatientHistory(null)}
                    className="mb-4 flex items-center gap-2 text-primary hover:text-primary/80 font-semibold"
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Orqaga
                  </button>
                  
                  <div className="bg-gradient-to-r from-purple-500 to-green-600 rounded-xl p-6 text-white mb-6">
                    <div className="flex items-center gap-4">
                      <div className="size-16 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl">person</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedPatientHistory.patient_name}</h2>
                        <p className="text-sm opacity-90">{selectedPatientHistory.patient_number}</p>
                        <p className="text-sm opacity-90">Jami tahlillar: {selectedPatientHistory.total_tests}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedPatientHistory.tests?.map((test, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold">{test.test_name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(test.completed_at).toLocaleString('uz-UZ', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-sm font-semibold">
                            ✓ Tayyor
                          </span>
                        </div>

                        {/* Test Results */}
                        {test.results && test.results.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Natijalar:</h4>
                            {test.results.map((result, rIndex) => (
                              <div key={rIndex} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="font-semibold">{result.parameter_name}</p>
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    result.is_normal 
                                      ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                                      : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                  }`}>
                                    {result.is_normal ? '✓ Normal' : '⚠ Normal emas'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-600 dark:text-gray-400">Qiymat</p>
                                    <p className="font-bold text-lg">{result.value} {result.unit}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600 dark:text-gray-400">Normal diapazon</p>
                                    <p className="font-semibold">{result.normal_range || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600 dark:text-gray-400">Status</p>
                                    <p className={`font-semibold ${
                                      result.is_normal ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {result.is_normal ? 'Normal' : 'Norma emas'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Notes */}
                        {test.notes && (
                          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Izohlar:</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{test.notes}</p>
                          </div>
                        )}

                        {/* Laborant info */}
                        <div className="mt-4 pt-4 border-t dark:border-gray-700 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="material-symbols-outlined text-lg">person</span>
                          <span>Laborant: {test.completed_by_name || 'Noma\'lum'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Result Modal */}
      {showResultModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Natija kiritish</h3>
                <button
                  onClick={() => setShowResultModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="mb-4 p-4 bg-green-50 rounded-lg">
                <p className="font-semibold">{selectedOrder.patient_first_name} {selectedOrder.patient_last_name}</p>
                <p className="text-sm text-gray-600">{selectedOrder.test_name}</p>
              </div>

              <div className="space-y-4">
                {/* Natija - Jadval */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold">Natija *</label>
                    <button
                      type="button"
                      onClick={addTableRow}
                      className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 flex items-center gap-1"
                    >
                      <span className="text-lg">+</span>
                      Qator qo'shish
                    </button>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <tbody>
                        {tableRows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-b last:border-b-0">
                            <td className="p-0 w-1/2 border-r">
                              <input
                                type="text"
                                value={row[0]}
                                onChange={(e) => updateTableCell(rowIndex, 0, e.target.value)}
                                className="w-full px-3 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Parametr"
                              />
                            </td>
                            <td className="p-0 w-1/2 relative">
                              <input
                                type="text"
                                value={row[1]}
                                onChange={(e) => updateTableCell(rowIndex, 1, e.target.value)}
                                className="w-full px-3 py-2 pr-10 border-0 focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Qiymat"
                              />
                              {tableRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeTableRow(rowIndex)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700"
                                >
                                  <span className="text-lg">−</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Izohlar */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Izohlar</label>
                  <textarea
                    value={resultForm.notes}
                    onChange={(e) => setResultForm({ ...resultForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                    placeholder="Qo'shimcha izohlar..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowResultModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSubmitResults}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Natijani yuborish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

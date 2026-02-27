import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import laboratoryService from '../services/laboratoryService';
import patientService from '../services/patientService';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import NewOrderModal from '../components/laboratory/NewOrderModal';

export default function ReceptionPanel() {
  const { user } = useAuth();
  const [stats] = useState({
    todayPatients: 0,
    waitingQueue: 0,
    completedToday: 0,
    totalRevenue: 0
  });

  // Lab order modal state
  const [showLabOrderModal, setShowLabOrderModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [tests, setTests] = useState([]);

  const handleNewLabOrder = async () => {
    try {
      // Load patients, doctors and tests
      const [patientsRes, staffRes, testsRes] = await Promise.all([
        patientService.getPatients(),
        api.get('/staff'),
        laboratoryService.getTests({ is_active: true })
      ]);
      
      setPatients(patientsRes.data);
      
      // Filter laborants
      const allStaff = staffRes.data.data || staffRes.data;
      const laborants = allStaff.filter(staff => 
        staff.role_name === 'laborant' || 
        staff.role_name === 'Laborant' ||
        (staff.role && (staff.role.name === 'laborant' || staff.role.name === 'Laborant'))
      );
      setDoctors(laborants);
      
      setTests(testsRes.data);
      setShowLabOrderModal(true);
    } catch (error) {
      toast.error('Ma\'lumotlarni yuklashda xatolik');
    }
  };

  const handleLabOrderSuccess = () => {
    toast.success('Laboratoriya buyurtmasi muvaffaqiyatli yaratildi!');
    setShowLabOrderModal(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <Toaster position="top-right" />
      
      {/* SUCCESS BANNER */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl">
        <div className="flex items-center gap-3 sm:gap-4 mb-4">
          <span className="material-symbols-outlined text-6xl">check_circle</span>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black flex items-center gap-2 sm:gap-3">
              <span className="material-symbols-outlined text-5xl">desk</span>
              QABULXONA PANELI
            </h1>
            <p className="text-lg sm:text-xl mt-2">Xush kelibsiz, {user?.full_name || user?.username}!</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600 text-xl sm:text-2xl">groups</span>
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats.todayPatients}</span>
          </div>
          <h3 className="text-sm sm:text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">Bugungi bemorlar</h3>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-yellow-600 text-xl sm:text-2xl">schedule</span>
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats.waitingQueue}</span>
          </div>
          <h3 className="text-sm sm:text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">Navbatda</h3>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600 text-xl sm:text-2xl">check_circle</span>
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats.completedToday}</span>
          </div>
          <h3 className="text-sm sm:text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">Yakunlangan</h3>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-600 text-xl sm:text-2xl">payments</span>
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats.totalRevenue.toLocaleString()}</span>
          </div>
          <h3 className="text-sm sm:text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">Bugungi tushum (so'm)</h3>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900 dark:text-white">Tez harakatlar</h2>
        <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          <a
            href="/patients"
            className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg sm:rounded-xl hover:shadow-lg transition-all border-2 border-blue-200 dark:border-blue-800"
          >
            <span className="material-symbols-outlined text-5xl text-blue-600">groups</span>
            <span className="font-semibold text-gray-900 dark:text-white">Bemorlar</span>
          </a>

          <a
            href="/queue"
            className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg sm:rounded-xl hover:shadow-lg transition-all border-2 border-yellow-200 dark:border-yellow-800"
          >
            <span className="material-symbols-outlined text-5xl text-yellow-600">format_list_numbered</span>
            <span className="font-semibold text-gray-900 dark:text-white">Navbat</span>
          </a>

          <a
            href="/cashier"
            className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg sm:rounded-xl hover:shadow-lg transition-all border-2 border-green-200 dark:border-green-800"
          >
            <span className="material-symbols-outlined text-5xl text-green-600">payments</span>
            <span className="font-semibold text-gray-900 dark:text-white">Kassa</span>
          </a>

          <a
            href="/laboratory"
            className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg sm:rounded-xl hover:shadow-lg transition-all border-2 border-purple-200 dark:border-purple-800"
          >
            <span className="material-symbols-outlined text-5xl text-purple-600">biotech</span>
            <span className="font-semibold text-gray-900 dark:text-white">Laboratoriya</span>
          </a>

          <button
            onClick={handleNewLabOrder}
            className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg sm:rounded-xl hover:shadow-lg transition-all border-2 border-indigo-200 dark:border-indigo-800"
          >
            <span className="material-symbols-outlined text-5xl text-indigo-600">add_circle</span>
            <span className="font-semibold text-gray-900 dark:text-white">Lab Buyurtma</span>
          </button>

          <a
            href="/my-tasks"
            className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg sm:rounded-xl hover:shadow-lg transition-all border-2 border-orange-200 dark:border-orange-800"
          >
            <span className="material-symbols-outlined text-5xl text-orange-600">task</span>
            <span className="font-semibold text-gray-900 dark:text-white">Mening Vazifalarim</span>
          </a>

          <a
            href="/my-salary"
            className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-lg sm:rounded-xl hover:shadow-lg transition-all border-2 border-teal-200 dark:border-teal-800"
          >
            <span className="material-symbols-outlined text-5xl text-teal-600">account_balance_wallet</span>
            <span className="font-semibold text-gray-900 dark:text-white">Mening Maoshim</span>
          </a>
        </div>
      </div>

      {/* Lab Order Modal */}
      {showLabOrderModal && (
        <NewOrderModal
          isOpen={showLabOrderModal}
          onClose={() => setShowLabOrderModal(false)}
          patients={patients}
          doctors={doctors}
          tests={tests}
          onSuccess={handleLabOrderSuccess}
        />
      )}
    </div>
  );
}


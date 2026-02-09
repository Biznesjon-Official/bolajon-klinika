import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import laboratoryService from '../services/laboratoryService';
import patientService from '../services/patientService';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

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
    <div className="p-8 space-y-6">
      <Toaster position="top-right" />
      
      {/* SUCCESS BANNER */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <span className="material-symbols-outlined text-6xl">check_circle</span>
          <div>
            <h1 className="text-4xl font-black flex items-center gap-3">
              <span className="material-symbols-outlined text-5xl">desk</span>
              QABULXONA PANELI
            </h1>
            <p className="text-xl mt-2">Xush kelibsiz, {user?.full_name || user?.username}!</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600 text-2xl">groups</span>
            </div>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.todayPatients}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Bugungi bemorlar</h3>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-yellow-600 text-2xl">schedule</span>
            </div>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.waitingQueue}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Navbatda</h3>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
            </div>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completedToday}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Yakunlangan</h3>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-600 text-2xl">payments</span>
            </div>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalRevenue.toLocaleString()}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Bugungi tushum (so'm)</h3>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Tez harakatlar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/patients"
            className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl hover:shadow-lg transition-all border-2 border-blue-200 dark:border-blue-800"
          >
            <span className="material-symbols-outlined text-5xl text-blue-600">groups</span>
            <span className="font-semibold text-gray-900 dark:text-white">Bemorlar</span>
          </a>

          <a
            href="/queue"
            className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl hover:shadow-lg transition-all border-2 border-yellow-200 dark:border-yellow-800"
          >
            <span className="material-symbols-outlined text-5xl text-yellow-600">format_list_numbered</span>
            <span className="font-semibold text-gray-900 dark:text-white">Navbat</span>
          </a>

          <a
            href="/cashier"
            className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl hover:shadow-lg transition-all border-2 border-green-200 dark:border-green-800"
          >
            <span className="material-symbols-outlined text-5xl text-green-600">payments</span>
            <span className="font-semibold text-gray-900 dark:text-white">Kassa</span>
          </a>

          <a
            href="/laboratory"
            className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl hover:shadow-lg transition-all border-2 border-purple-200 dark:border-purple-800"
          >
            <span className="material-symbols-outlined text-5xl text-purple-600">biotech</span>
            <span className="font-semibold text-gray-900 dark:text-white">Laboratoriya</span>
          </a>

          <button
            onClick={handleNewLabOrder}
            className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl hover:shadow-lg transition-all border-2 border-indigo-200 dark:border-indigo-800"
          >
            <span className="material-symbols-outlined text-5xl text-indigo-600">add_circle</span>
            <span className="font-semibold text-gray-900 dark:text-white">Lab Buyurtma</span>
          </button>

          <a
            href="/my-tasks"
            className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl hover:shadow-lg transition-all border-2 border-orange-200 dark:border-orange-800"
          >
            <span className="material-symbols-outlined text-5xl text-orange-600">task</span>
            <span className="font-semibold text-gray-900 dark:text-white">Mening Vazifalarim</span>
          </a>

          <a
            href="/my-salary"
            className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-xl hover:shadow-lg transition-all border-2 border-teal-200 dark:border-teal-800"
          >
            <span className="material-symbols-outlined text-5xl text-teal-600">account_balance_wallet</span>
            <span className="font-semibold text-gray-900 dark:text-white">Mening Maoshim</span>
          </a>
        </div>
      </div>

      {/* Lab Order Modal */}
      {showLabOrderModal && (
        <LabOrderModal
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

// Lab Order Modal Component
function LabOrderModal({ isOpen, onClose, patients, doctors, tests, onSuccess }) {
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
      toast.error('Bemor va tahlilni tanlang');
      return;
    }

    try {
      setLoading(true);
      const response = await laboratoryService.createOrder(formData);
      if (response.success) {
        toast.success(`Buyurtma yaratildi - Hisob-faktura: ${response.data.invoice_number}`);
      } else {
        toast.success('Buyurtma muvaffaqiyatli yaratildi!');
      }
      onSuccess();
    } catch (error) {
      toast.error('Xatolik: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-white dark:bg-gray-900 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-600">biotech</span>
              Laboratoriya Buyurtmasi
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Bemor */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Bemor <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Bemorni tanlang</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name} - {patient.patient_number}
                </option>
              ))}
            </select>
          </div>

          {/* Laborant */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Laborant
            </label>
            <select
              value={formData.doctor_id}
              onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Laborantni tanlang</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                </option>
              ))}
            </select>
          </div>

          {/* Tahlil */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Tahlil <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.test_id}
              onChange={(e) => setFormData({ ...formData, test_id: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Tahlilni tanlang</option>
              {tests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.name} - {test.price?.toLocaleString() || 0} so'm
                </option>
              ))}
            </select>
          </div>

          {/* Muhimlik */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Muhimlik darajasi
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: 'normal' })}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                  formData.priority === 'normal'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                Oddiy
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: 'urgent' })}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                  formData.priority === 'urgent'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                Shoshilinch
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: 'stat' })}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                  formData.priority === 'stat'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                Juda shoshilinch
              </button>
            </div>
          </div>

          {/* Izoh */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Izoh
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Qo'shimcha ma'lumot..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Yuklanmoqda...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">add</span>
                  Buyurtma berish
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

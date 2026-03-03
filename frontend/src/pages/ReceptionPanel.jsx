import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import laboratoryService from '../services/laboratoryService';
import patientService from '../services/patientService';
import { prescriptionService } from '../services/prescriptionService';
import ambulatorInpatientService from '../services/ambulatorInpatientService';
import inpatientRoomService from '../services/inpatientRoomService';
import api from '../services/api';
import admissionRequestService from '../services/admissionRequestService';
import toast, { Toaster } from 'react-hot-toast';
import NewOrderModal from '../components/laboratory/NewOrderModal';

export default function ReceptionPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [urgentPending, setUrgentPending] = useState([]);
  const [urgentLoading, setUrgentLoading] = useState(false);

  const loadUrgentPending = async () => {
    try {
      setUrgentLoading(true)
      const res = await prescriptionService.getUrgentPending()
      if (res.success) setUrgentPending(res.data || [])
    } catch {
      // silently fail
    } finally {
      setUrgentLoading(false)
    }
  }

  // Admission requests (doctor so'rovlari)
  const [admissionRequests, setAdmissionRequests] = useState([]);
  const [admissionRequestsLoading, setAdmissionRequestsLoading] = useState(false);
  const [admitFromRequest, setAdmitFromRequest] = useState(null); // pre-filled request

  const loadAdmissionRequests = async () => {
    try {
      setAdmissionRequestsLoading(true);
      const res = await admissionRequestService.getAll({ status: 'pending' });
      if (res.success) setAdmissionRequests(res.data || []);
    } catch {
      // silent
    } finally {
      setAdmissionRequestsLoading(false);
    }
  };

  const handleRejectAdmissionRequest = async (id) => {
    if (!confirm('So\'rovni rad etmoqchimisiz?')) return;
    try {
      await admissionRequestService.reject(id, '');
      toast.success('Rad etildi');
      loadAdmissionRequests();
    } catch {
      toast.error('Xatolik');
    }
  };

  const handleOpenAdmitFromRequest = async (req) => {
    setAdmitFromRequest(req);
    const type = req.admission_type === 'inpatient' ? 'inpatient' : 'ambulator';
    setAdmitType(type);
    setAdmitSelectedPatient(req.patient_id);
    setAdmitPatientSearch('');
    setAdmitPatientResults([]);
    setAdmitSelectedBed(null);
    setAdmitRooms([]);
    setShowAdmitModal(true);
    try {
      const res = type === 'ambulator'
        ? await ambulatorInpatientService.getRooms()
        : await inpatientRoomService.getRooms();
      if (res.success) setAdmitRooms(res.data);
    } catch {
      toast.error('Xonalar yuklanmadi');
    }
  };

  useEffect(() => {
    loadUrgentPending();
    loadAdmissionRequests();
    const interval = setInterval(() => {
      loadUrgentPending();
      loadAdmissionRequests();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const [stats] = useState({
    todayPatients: 0,
    waitingQueue: 0,
    completedToday: 0,
    totalRevenue: 0
  });

  // Admit modal state
  const [showAdmitModal, setShowAdmitModal] = useState(false)
  const [admitType, setAdmitType] = useState('ambulator')
  const [admitRooms, setAdmitRooms] = useState([])
  const [admitSelectedBed, setAdmitSelectedBed] = useState(null)
  const [admitPatientSearch, setAdmitPatientSearch] = useState('')
  const [admitPatientResults, setAdmitPatientResults] = useState([])
  const [admitSelectedPatient, setAdmitSelectedPatient] = useState(null)
  const [admitSubmitting, setAdmitSubmitting] = useState(false)

  const handleOpenAdmitModal = async (type) => {
    setAdmitType(type)
    setAdmitSelectedBed(null)
    setAdmitSelectedPatient(null)
    setAdmitPatientSearch('')
    setAdmitPatientResults([])
    setAdmitRooms([])
    setShowAdmitModal(true)
    try {
      const res = type === 'ambulator'
        ? await ambulatorInpatientService.getRooms()
        : await inpatientRoomService.getRooms()
      if (res.success) setAdmitRooms(res.data)
    } catch {
      toast.error('Xonalar yuklanmadi')
    }
  }

  const handleAdmitPatientSearch = async (val) => {
    setAdmitPatientSearch(val)
    setAdmitSelectedPatient(null)
    if (val.length < 2) { setAdmitPatientResults([]); return }
    try {
      const res = await patientService.getPatients({ search: val, limit: 5 })
      setAdmitPatientResults(res.data || [])
    } catch {
      setAdmitPatientResults([])
    }
  }

  const handleSubmitAdmit = async () => {
    if (!admitSelectedPatient) return toast.error('Bemor tanlang');
    if (!admitSelectedBed) return toast.error('Koyka tanlang');
    try {
      setAdmitSubmitting(true);
      // If opened from admission request — use approve endpoint
      if (admitFromRequest) {
        const res = await admissionRequestService.approve(admitFromRequest._id, {
          room_id: admitSelectedBed.room_id,
          bed_number: admitSelectedBed.bed_number
        });
        if (res.success) {
          toast.success(`${admitSelectedPatient.first_name} ${admitSelectedPatient.last_name} yotqizildi`);
          setShowAdmitModal(false);
          setAdmitFromRequest(null);
          loadAdmissionRequests();
        }
      } else {
        const res = await ambulatorInpatientService.createAdmission({
          patient_id: admitSelectedPatient._id,
          room_id: admitSelectedBed.room_id,
          bed_number: admitSelectedBed.bed_number
        });
        if (res.success) {
          toast.success(`${admitSelectedPatient.first_name} ${admitSelectedPatient.last_name} ${admitType === 'ambulator' ? 'ambulatorga' : 'statsionarga'} yotqizildi`);
          setShowAdmitModal(false);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setAdmitSubmitting(false);
    }
  };

  // Lab order modal state
  const [showLabOrderModal, setShowLabOrderModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [tests, setTests] = useState([]);

  const handleNewLabOrder = async () => {
    try {
      const [patientsRes, testsRes] = await Promise.all([
        patientService.getPatients(),
        laboratoryService.getTests({ is_active: true })
      ]);
      setPatients(patientsRes.data);
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

      {/* Muolaja kutayotganlar */}
      {urgentPending.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-red-200 dark:border-red-800">
          <div className="p-4 sm:p-6 border-b border-red-100 dark:border-red-900/30">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <span className="material-symbols-outlined">emergency</span>
                Muolaja kutayotganlar
                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full text-sm font-bold">{urgentPending.length}</span>
              </h2>
              <button onClick={loadUrgentPending} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <span className={`material-symbols-outlined ${urgentLoading ? 'animate-spin' : ''}`}>refresh</span>
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-6 grid gap-3 sm:gap-4">
            {urgentPending.map(rx => (
              <div key={rx._id} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {rx.patient_id?.first_name} {rx.patient_id?.last_name}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                        {rx.patient_id?.patient_number}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Doktor: {rx.doctor_id?.first_name} {rx.doctor_id?.last_name}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      <span className="font-semibold">Tashxis:</span> {rx.diagnosis}
                    </p>
                    {rx.medications?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {rx.medications.slice(0, 3).map((med, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300">
                            {med.medication_name} {med.dosage && `(${med.dosage})`}
                          </span>
                        ))}
                        {rx.medications.length > 3 && (
                          <span className="text-xs text-gray-500">+{rx.medications.length - 3}</span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(rx.issued_date).toLocaleString('uz-UZ')}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/patients/${rx.patient_id?._id}?prescription_id=${rx._id}`)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 flex items-center gap-2 whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined" style={{fontSize:'18px'}}>queue</span>
                    Navbatga qo'shish
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statsionar so'rovlari (doctor dan) */}
      {(admissionRequests.length > 0 || admissionRequestsLoading) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-teal-200 dark:border-teal-800">
          <div className="p-4 sm:p-5 border-b border-teal-100 dark:border-teal-900/30">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-teal-700 dark:text-teal-400 flex items-center gap-2">
                <span className="material-symbols-outlined">bed</span>
                Statsionar so'rovlari
                <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-full text-sm font-bold">{admissionRequests.length}</span>
              </h2>
              <button onClick={loadAdmissionRequests} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <span className={`material-symbols-outlined ${admissionRequestsLoading ? 'animate-spin' : ''}`}>refresh</span>
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-5 grid gap-3">
            {admissionRequests.map(req => {
              const patient = req.patient_id;
              const doctor = req.doctor_id;
              return (
                <div key={req._id} className="bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {patient?.first_name} {patient?.last_name}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                          {patient?.patient_number}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                          req.admission_type === 'inpatient'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                        }`}>
                          {req.admission_type === 'inpatient' ? 'Statsionar' : 'Ambulator'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Shifokor: {doctor?.first_name} {doctor?.last_name}
                      </p>
                      {req.diagnosis && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                          <span className="font-semibold">Tashxis:</span> {req.diagnosis}
                        </p>
                      )}
                      {req.reason && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 italic">{req.reason}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(req.created_at).toLocaleString('uz-UZ')}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleRejectAdmissionRequest(req._id)}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-200 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                        Rad
                      </button>
                      <button
                        onClick={() => handleOpenAdmitFromRequest(req)}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">bed</span>
                        Yotqizish
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
            href="/reception-cashier"
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

          <button
            onClick={() => handleOpenAdmitModal('ambulator')}
            className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-lg sm:rounded-xl hover:shadow-lg transition-all border-2 border-teal-200 dark:border-teal-800"
          >
            <span className="material-symbols-outlined text-5xl text-teal-600">bed</span>
            <span className="font-semibold text-gray-900 dark:text-white">Ambulatorga yotqizish</span>
          </button>

          <button
            onClick={() => handleOpenAdmitModal('inpatient')}
            className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg sm:rounded-xl hover:shadow-lg transition-all border-2 border-blue-200 dark:border-blue-800"
          >
            <span className="material-symbols-outlined text-5xl text-blue-600">local_hospital</span>
            <span className="font-semibold text-gray-900 dark:text-white">Statsionarga yotqizish</span>
          </button>
        </div>
      </div>

      {/* Yotqizish Modal */}
      {showAdmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-black text-blue-600">
                {admitType === 'ambulator' ? 'Ambulatorga yotqizish' : 'Statsionarga yotqizish'}
              </h2>
              <button onClick={() => { setShowAdmitModal(false); setAdmitFromRequest(null) }} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Patient search */}
              <div className="relative">
                <label className="block text-sm font-semibold mb-1">Bemor *</label>
                <input
                  type="text"
                  value={admitSelectedPatient ? `${admitSelectedPatient.first_name} ${admitSelectedPatient.last_name}` : admitPatientSearch}
                  onChange={(e) => handleAdmitPatientSearch(e.target.value)}
                  placeholder="Ism yoki raqam..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {admitPatientResults.length > 0 && !admitSelectedPatient && (
                  <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg mt-1">
                    {admitPatientResults.map(p => (
                      <button
                        key={p._id}
                        onClick={() => { setAdmitSelectedPatient(p); setAdmitPatientResults([]) }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                      >
                        <span className="font-semibold">{p.first_name} {p.last_name}</span>
                        <span className="ml-2 text-gray-400 text-xs">{p.patient_number}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Rooms & beds */}
              {admitRooms.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Yuklanmoqda...</p>
              ) : (
                <div className="space-y-3">
                  {admitRooms.map(room => (
                    <div key={room.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                      <p className="font-semibold text-sm mb-2">
                        Xona {room.room_number}
                        {room.room_name ? ` — ${room.room_name}` : ''}
                        <span className="ml-2 text-xs text-gray-400">({room.available_beds}/{room.total_beds} bo'sh)</span>
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {room.beds?.map(bed => (
                          <button
                            key={bed.id}
                            disabled={bed.bed_status !== 'available'}
                            onClick={() => setAdmitSelectedBed({ room_id: room.id, bed_number: bed.bed_number })}
                            className={`py-2 rounded-lg text-xs font-semibold border-2 transition-colors ${
                              admitSelectedBed?.room_id === room.id && admitSelectedBed?.bed_number === bed.bed_number
                                ? 'bg-blue-500 border-blue-500 text-white'
                                : bed.bed_status !== 'available'
                                ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                            }`}
                          >
                            {bed.bed_number}{bed.bed_status !== 'available' ? ' ✕' : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={() => { setShowAdmitModal(false); setAdmitFromRequest(null) }} className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm">
                  Bekor qilish
                </button>
                <button
                  onClick={handleSubmitAdmit}
                  disabled={admitSubmitting || !admitSelectedBed || !admitSelectedPatient}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {admitSubmitting ? 'Yuklanmoqda...' : 'Yotqizish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lab Order Modal */}
      {showLabOrderModal && (
        <NewOrderModal
          isOpen={showLabOrderModal}
          onClose={() => setShowLabOrderModal(false)}
          patients={patients}
          tests={tests}
          onSuccess={handleLabOrderSuccess}
          t={(key) => key.split('.').pop()}
        />
      )}
    </div>
  );
}


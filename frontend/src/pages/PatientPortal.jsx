import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import patientPortalService from '../services/patientPortalService';
import toast, { Toaster } from 'react-hot-toast';

export default function PatientPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [queue, setQueue] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // URL'ga qarab activeTab'ni o'rnatish
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/profile')) setActiveTab('profile');
    else if (path.includes('/appointments')) setActiveTab('appointments');
    else if (path.includes('/prescriptions')) setActiveTab('prescriptions');
    else if (path.includes('/lab-results')) setActiveTab('lab-results');
    else if (path.includes('/queue')) setActiveTab('queue');
    else if (path.includes('/notifications')) setActiveTab('notifications');
    else setActiveTab('dashboard');
  }, [location.pathname]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'dashboard') {
        const data = await patientPortalService.getDashboard();
        setDashboardData(data.data);
      } else if (activeTab === 'profile') {
        const data = await patientPortalService.getProfile();
        setProfile(data.data);
      } else if (activeTab === 'appointments') {
        const data = await patientPortalService.getAppointments();
        setAppointments(data.data);
      } else if (activeTab === 'prescriptions') {
        const data = await patientPortalService.getPrescriptions();
        setPrescriptions(data.data);
      } else if (activeTab === 'lab-results') {
        const data = await patientPortalService.getLabResults();
        setLabResults(data.data);
      } else if (activeTab === 'queue') {
        const data = await patientPortalService.getCurrentQueue();
        setQueue(data.data);
      } else if (activeTab === 'notifications') {
        const data = await patientPortalService.getNotifications();
        setNotifications(data.data);
      }
    } catch (error) {
      toast.error('Xatolik: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Bosh sahifa', icon: 'home' },
    { id: 'profile', label: 'Shaxsiy ma\'lumotlar', icon: 'person' },
    { id: 'appointments', label: 'Qabul tarixi', icon: 'calendar_month' },
    { id: 'prescriptions', label: 'Retseptlar', icon: 'medication' },
    { id: 'lab-results', label: 'Tahlillar', icon: 'science' },
    { id: 'queue', label: 'Navbat', icon: 'schedule' },
    { id: 'notifications', label: 'Bildirishnomalar', icon: 'notifications' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden sm:block">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 lg:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 sm:py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-2 sm:gap-3 sm:gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center text-white flex-shrink-0">
                <span className="material-symbols-outlined text-xl sm:text-xl sm:text-2xl">person</span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                  Xush kelibsiz, {user?.first_name}!
                </h1>
                <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-500 dark:text-gray-400">Bemor paneli</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/patient/settings')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 lg:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-3 sm:py-4 sm:py-4 sm:py-6 lg:py-8">
        {activeTab === 'dashboard' && <DashboardTab data={dashboardData} />}
        {activeTab === 'profile' && <ProfileTab data={profile} onUpdate={loadData} />}
        {activeTab === 'appointments' && <AppointmentsTab data={appointments} />}
        {activeTab === 'prescriptions' && <PrescriptionsTab data={prescriptions} />}
        {activeTab === 'lab-results' && <LabResultsTab data={labResults} />}
        {activeTab === 'queue' && <QueueTab data={queue} />}
        {activeTab === 'notifications' && <NotificationsTab data={notifications} onUpdate={loadData} />}
      </div>
    </div>
  );
}

// Dashboard Tab
function DashboardTab({ data }) {
  if (!data) return null;

  const getStatusText = (status) => {
    if (!status) return 'Noma\'lum';
    const statusUpper = status.toUpperCase();
    if (statusUpper === 'WAITING') return 'Kutilmoqda';
    if (statusUpper === 'CALLED') return 'Chaqirildi';
    if (statusUpper === 'IN_PROGRESS') return 'Qabulda';
    if (statusUpper === 'COMPLETED') return 'Yakunlandi';
    return status;
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    const statusUpper = status.toUpperCase();
    if (statusUpper === 'WAITING') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    if (statusUpper === 'CALLED') return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (statusUpper === 'IN_PROGRESS') return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (statusUpper === 'COMPLETED') return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="space-y-3 sm:space-y-4 sm:space-y-4 sm:space-y-6 w-full overflow-x-hidden sm:block">
      <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 sm:gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 sm:p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3 sm:gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/20 rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-xl sm:text-xl sm:text-2xl">calendar_month</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Keyingi qabul</p>
              <p className="text-lg sm:text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                {data.next_appointment ? 'Navbatda' : 'Yo\'q'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 sm:p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3 sm:gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/20 rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-xl sm:text-xl sm:text-2xl">medication</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Retseptlar</p>
              <p className="text-lg sm:text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{data.prescriptions_count}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 sm:p-4 sm:p-6 border border-gray-200 dark:border-gray-700 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 sm:gap-3 sm:gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-xl sm:text-xl sm:text-2xl">notifications</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Bildirishnomalar</p>
              <p className="text-lg sm:text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{data.unread_notifications}</p>
            </div>
          </div>
        </div>
      </div>

      {data.next_appointment && (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-bold mb-4 text-gray-900 dark:text-white">Hozirgi navbat</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Navbat raqami</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">{data.next_appointment.queue_number}</p>
            </div>
            <div>
              <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Status</p>
              <span className={`px-3 py-1 rounded-full text-sm sm:text-sm sm:text-base font-semibold ${getStatusColor(data.next_appointment.status)}`}>
                {getStatusText(data.next_appointment.status)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Profile Tab
function ProfileTab({ data, onUpdate }) {
  if (!data) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-base sm:text-lg font-bold mb-6 text-gray-900 dark:text-white">Shaxsiy ma'lumotlar</h3>
      <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Bemor raqami</label>
          <p className="text-gray-900 dark:text-white">{data.patient_number}</p>
        </div>
        <div>
          <label className="block text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">F.I.O</label>
          <p className="text-gray-900 dark:text-white">{data.first_name} {data.last_name} {data.middle_name}</p>
        </div>
        <div>
          <label className="block text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Telefon</label>
          <p className="text-gray-900 dark:text-white">{data.phone}</p>
        </div>
        <div>
          <label className="block text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Tug'ilgan sana</label>
          <p className="text-gray-900 dark:text-white">{data.birth_date ? new Date(data.birth_date).toLocaleDateString('uz-UZ') : 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Jins</label>
          <p className="text-gray-900 dark:text-white">{data.gender === 'male' ? 'Erkak' : data.gender === 'female' ? 'Ayol' : 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Qon guruhi</label>
          <p className="text-gray-900 dark:text-white">{data.blood_type || 'N/A'}</p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Manzil</label>
          <p className="text-gray-900 dark:text-white">{data.address || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}

// Appointments Tab
function AppointmentsTab({ data }) {
  const getStatusText = (status) => {
    if (!status) return 'Noma\'lum';
    const statusUpper = status.toUpperCase();
    if (statusUpper === 'WAITING') return 'Kutilmoqda';
    if (statusUpper === 'CALLED') return 'Chaqirildi';
    if (statusUpper === 'IN_PROGRESS') return 'Qabulda';
    if (statusUpper === 'COMPLETED') return 'Yakunlandi';
    if (statusUpper === 'CANCELLED') return 'Bekor qilindi';
    return status;
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    const statusUpper = status.toUpperCase();
    if (statusUpper === 'WAITING') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    if (statusUpper === 'CALLED') return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (statusUpper === 'IN_PROGRESS') return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (statusUpper === 'COMPLETED') return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (statusUpper === 'CANCELLED') return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Qabul tarixi</h3>
      {data.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
          <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">calendar_month</span>
          <p className="text-gray-500 dark:text-gray-400">Qabul tarixi yo'q</p>
        </div>
      ) : (
        data.map(appointment => (
          <div key={appointment.id} className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Navbat raqami</p>
                <p className="text-lg sm:text-xl font-bold text-primary">{appointment.queue_number}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm sm:text-sm sm:text-base font-semibold ${getStatusColor(appointment.status)}`}>
                {getStatusText(appointment.status)}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-sm sm:text-base">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Shifokor</p>
                <p className="font-semibold text-gray-900 dark:text-white">{appointment.doctor_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Xizmat</p>
                <p className="font-semibold text-gray-900 dark:text-white">{appointment.service_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Sana</p>
                <p className="font-semibold text-gray-900 dark:text-white">{new Date(appointment.created_at).toLocaleDateString('uz-UZ')}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Shikoyat</p>
                <p className="font-semibold text-gray-900 dark:text-white">{appointment.complaint || 'N/A'}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Prescriptions Tab
function PrescriptionsTab({ data }) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Retseptlar</h3>
      {data.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
          <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">medication</span>
          <p className="text-gray-500 dark:text-gray-400">Retseptlar yo'q</p>
        </div>
      ) : (
        data.map(prescription => (
          <div key={prescription.id} className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 sm:p-4 sm:p-6 space-y-3 sm:space-y-4 border border-gray-200 dark:border-gray-700 overflow-hidden sm:block">
            {/* Header - Shifokor va Sana */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-xl sm:text-2xl">person</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Shifokor</p>
                  <p className="font-bold text-gray-900 dark:text-white break-words">{prescription.doctor_name || 'N/A'}</p>
                </div>
              </div>
              <div className="text-left sm:text-right flex-shrink-0">
                <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Sana</p>
                <p className="text-sm sm:text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  {new Date(prescription.created_at).toLocaleDateString('uz-UZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            
            {/* Tashxis */}
            {prescription.diagnosis && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-100 dark:border-green-800 overflow-hidden sm:block">
                <div className="flex items-start gap-2 sm:gap-2 sm:gap-3">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0">medical_information</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-sm sm:text-base font-semibold text-green-900 dark:text-green-300 mb-1">Tashxis:</p>
                    <p className="text-green-800 dark:text-green-200 break-words">{prescription.diagnosis}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Dorilar ro'yxati */}
            {prescription.medications && prescription.medications.length > 0 && (
              <div>
                <div className="flex items-center gap-2 sm:gap-2 sm:gap-3 mb-3">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400">medication</span>
                  <p className="font-semibold text-gray-900 dark:text-white">Dorilar ro'yxati:</p>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {prescription.medications.map((med, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-3 sm:p-4 border border-gray-200 dark:border-gray-600 overflow-hidden sm:block">
                      <div className="mb-2">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white text-base sm:text-base sm:text-lg mb-1 break-words">
                            {index + 1}. {med.medication_name}
                          </p>
                          
                          {/* Shoshilinch retseptda faqat dori nomi */}
                          {prescription.prescription_type === 'URGENT' ? (
                            <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 italic mt-2 break-words">
                              Shoshilinch retsept - batafsil ma'lumotlar shifokor tomonidan og'zaki beriladi
                            </p>
                          ) : (
                            /* Oddiy retseptda to'liq ma'lumotlar */
                            <div className="grid grid-cols-1 gap-2 sm:gap-2 sm:gap-3 text-sm sm:text-sm sm:text-base mt-2">
                              {med.dosage && (
                                <div className="flex items-start gap-2 sm:gap-2 sm:gap-3">
                                  <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-sm sm:text-base flex-shrink-0 mt-0.5">science</span>
                                  <div className="min-w-0 flex-1">
                                    <span className="text-gray-600 dark:text-gray-400">Dozasi: </span>
                                    <span className="font-semibold text-gray-900 dark:text-white break-words">{med.dosage}</span>
                                  </div>
                                </div>
                              )}
                              {med.frequency && (
                                <div className="flex items-start gap-2 sm:gap-2 sm:gap-3">
                                  <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-sm sm:text-base flex-shrink-0 mt-0.5">schedule</span>
                                  <div className="min-w-0 flex-1">
                                    <span className="text-gray-600 dark:text-gray-400">Qabul qilish: </span>
                                    <span className="font-semibold text-gray-900 dark:text-white break-words">{med.frequency}</span>
                                  </div>
                                </div>
                              )}
                              {med.duration_days && (
                                <div className="flex items-start gap-2 sm:gap-2 sm:gap-3">
                                  <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-sm sm:text-base flex-shrink-0 mt-0.5">calendar_today</span>
                                  <div className="min-w-0 flex-1">
                                    <span className="text-gray-600 dark:text-gray-400">Davomiyligi: </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{med.duration_days} kun</span>
                                  </div>
                                </div>
                              )}
                              {med.is_urgent && (
                                <div className="flex items-center gap-2 sm:gap-2 sm:gap-3">
                                  <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-sm sm:text-base flex-shrink-0">priority_high</span>
                                  <span className="font-semibold text-red-600 dark:text-red-400">Shoshilinch</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {med.instructions && prescription.prescription_type === 'REGULAR' && (
                        <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                          <div className="flex items-start gap-2 sm:gap-2 sm:gap-3">
                            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-sm sm:text-base mt-0.5 flex-shrink-0">info</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Ko'rsatmalar:</p>
                              <p className="text-sm sm:text-sm sm:text-base text-gray-700 dark:text-gray-300 break-words">{med.instructions}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Retsept turi va Status */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              {prescription.prescription_type && (
                <div className="flex items-center gap-2 sm:gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 whitespace-nowrap">Retsept turi:</span>
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    prescription.prescription_type === 'URGENT' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                      : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  }`}>
                    {prescription.prescription_type === 'URGENT' ? 'Shoshilinch' : 'Oddiy'}
                  </span>
                </div>
              )}
              
              {prescription.status && (
                <div className="flex items-center gap-2 sm:gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 whitespace-nowrap">Status:</span>
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    prescription.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                    prescription.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    {prescription.status === 'ACTIVE' ? 'Faol' :
                     prescription.status === 'completed' ? 'Bajarildi' :
                     prescription.status}
                  </span>
                </div>
              )}
              
              {prescription.queue_number && (
                <div className="flex items-center gap-2 sm:gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 whitespace-nowrap">Navbat:</span>
                  <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">#{prescription.queue_number}</span>
                </div>
              )}
            </div>
            
            {/* Qo'shimcha izohlar */}
            {prescription.notes && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4 border border-yellow-200 dark:border-yellow-800 overflow-hidden sm:block">
                <div className="flex items-start gap-2 sm:gap-2 sm:gap-3">
                  <span className="material-symbols-outlined text-yellow-700 dark:text-yellow-400 text-sm sm:text-base mt-0.5 flex-shrink-0">note</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-sm sm:text-base font-semibold text-yellow-900 dark:text-yellow-300 mb-1">Shifokor izohi:</p>
                    <p className="text-sm sm:text-sm sm:text-base text-yellow-800 dark:text-yellow-200 whitespace-pre-wrap break-words">{prescription.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// Queue Tab
function QueueTab({ data }) {
  const getStatusText = (status) => {
    if (!status) return 'Noma\'lum';
    const statusUpper = status.toUpperCase();
    if (statusUpper === 'WAITING') return 'Kutilmoqda';
    if (statusUpper === 'CALLED') return 'Chaqirildi!';
    if (statusUpper === 'IN_PROGRESS') return 'Chaqirildi!';
    if (statusUpper === 'COMPLETED') return 'Qabul yakunlandi';
    return status;
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    const statusUpper = status.toUpperCase();
    if (statusUpper === 'WAITING') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    if (statusUpper === 'CALLED') return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (statusUpper === 'IN_PROGRESS') return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (statusUpper === 'COMPLETED') return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div>
      <h3 className="text-base sm:text-lg font-bold mb-4 text-gray-900 dark:text-white">Hozirgi navbat</h3>
      {!data ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
          <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">schedule</span>
          <p className="text-gray-500 dark:text-gray-400">Hozirda navbatda emassiz</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          {/* Navbat raqami va status */}
          <div className="text-center mb-6">
            <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2">Sizning navbat raqamingiz</p>
            <p className="text-6xl font-bold text-primary mb-4">{data.queue_number}</p>
            <span className={`px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 rounded-full text-sm sm:text-sm sm:text-base font-semibold ${getStatusColor(data.status)}`}>
              {getStatusText(data.status)}
            </span>
          </div>

          {/* Ma'lumotlar */}
          <div className="space-y-3 sm:space-y-4">
            {/* Shifokor */}
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400">person</span>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Shifokor</p>
                  <p className="font-bold text-gray-900 dark:text-white">{data.doctor_name || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Oldingizda */}
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">groups</span>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Oldingizda</p>
                  <p className="font-bold text-gray-900 dark:text-white">{data.position || 0} bemor</p>
                </div>
              </div>
            </div>

            {/* Xizmat */}
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400">medical_services</span>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Xizmat</p>
                  <p className="font-bold text-gray-900 dark:text-white">{data.service_name || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Qo'shimcha ma'lumot */}
          {data.complaint && (
            <div className="mt-4 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-lg sm:rounded-xl border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-600 dark:text-green-400 mb-1">Shikoyat</p>
              <p className="text-sm sm:text-sm sm:text-base text-green-900 dark:text-green-200">{data.complaint}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Lab Results Tab
function LabResultsTab({ data }) {
  const getInterpretationColor = (interpretation) => {
    if (!interpretation) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    const interp = interpretation.toLowerCase();
    if (interp === 'normal') return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (interp === 'high') return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    if (interp === 'low') return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (interp === 'critical') return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const getInterpretationText = (interpretation) => {
    if (!interpretation) return 'N/A';
    const interp = interpretation.toLowerCase();
    if (interp === 'normal') return 'Normal';
    if (interp === 'high') return 'Yuqori';
    if (interp === 'low') return 'Past';
    if (interp === 'critical') return 'Kritik';
    return interpretation;
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Tahlil natijalari</h3>
      {data.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
          <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">science</span>
          <p className="text-gray-500 dark:text-gray-400">Tahlil natijalari yo'q</p>
        </div>
      ) : (
        data.map(result => (
          <div key={result.result_id} className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 sm:p-4 sm:p-6 space-y-3 sm:space-y-4 border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-xl sm:text-2xl">science</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg break-words">{result.test_name}</h4>
                  <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Kod: {result.test_code}</p>
                  {result.test_description && (
                    <p className="text-sm sm:text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">{result.test_description}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-2 sm:gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getInterpretationColor(result.interpretation)}`}>
                  {getInterpretationText(result.interpretation)}
                </span>
                {result.is_normal !== null && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    result.is_normal 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {result.is_normal ? '✓ Normal' : '⚠ Normaldan tashqari'}
                  </span>
                )}
              </div>
            </div>

            {/* Natija */}
            <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {result.result_value && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-100 dark:border-green-800">
                  <div className="flex items-center gap-2 sm:gap-2 sm:gap-3 mb-2">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">analytics</span>
                    <p className="text-sm sm:text-sm sm:text-base font-semibold text-green-900 dark:text-green-300">Natija:</p>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-green-800 dark:text-green-200">
                    {result.result_value} {result.result_unit || result.test_unit || ''}
                  </p>
                </div>
              )}

              {(result.normal_value_min || result.normal_value_max) && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-100 dark:border-green-800">
                  <div className="flex items-center gap-2 sm:gap-2 sm:gap-3 mb-2">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                    <p className="text-sm sm:text-sm sm:text-base font-semibold text-green-900 dark:text-green-300">Normal qiymat:</p>
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-green-800 dark:text-green-200">
                    {result.normal_value_min || '?'} - {result.normal_value_max || '?'} {result.test_unit || ''}
                  </p>
                </div>
              )}
            </div>

            {/* Matnli natija */}
            {result.result_text && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-start gap-2 sm:gap-2 sm:gap-3">
                  <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0">description</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">Batafsil natija:</p>
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap break-words">{result.result_text}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Laborant izohi */}
            {result.technician_notes && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2 sm:gap-2 sm:gap-3">
                  <span className="material-symbols-outlined text-yellow-700 dark:text-yellow-400 mt-0.5 flex-shrink-0">note</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-sm sm:text-base font-semibold text-yellow-900 dark:text-yellow-300 mb-1">Laborant izohi:</p>
                    <p className="text-sm sm:text-sm sm:text-base text-yellow-800 dark:text-yellow-200 whitespace-pre-wrap break-words">{result.technician_notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Ma'lumotlar */}
            <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm sm:text-sm sm:text-base">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Buyurtma raqami:</p>
                <p className="font-semibold text-gray-900 dark:text-white">{result.order_number}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Shifokor:</p>
                <p className="font-semibold text-gray-900 dark:text-white">{result.doctor_name}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Laborant:</p>
                <p className="font-semibold text-gray-900 dark:text-white">{result.technician_name}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Buyurtma sanasi:</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {new Date(result.order_date).toLocaleDateString('uz-UZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Natija kiritilgan:</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {new Date(result.entered_at).toLocaleDateString('uz-UZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              {result.approved_at && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Tasdiqlangan:</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {new Date(result.approved_at).toLocaleDateString('uz-UZ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Fayl */}
            {result.file_path && (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <a
                  href={result.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 sm:gap-2 sm:gap-3 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined">download</span>
                  Faylni yuklab olish
                </a>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// Notifications Tab
function NotificationsTab({ data, onUpdate }) {
  const [filter, setFilter] = useState('all'); // 'all', 'admin', 'doctor'

  const handleMarkAsRead = async (id) => {
    try {
      await patientPortalService.markNotificationAsRead(id);
      toast.success('Bildirishnoma o\'qildi');
      onUpdate();
    } catch (error) {
      toast.error('Xatolik yuz berdi');
    }
  };

  // Xabarlarni admin va shifokor bo'yicha guruhlash
  const adminMessages = data.filter(n => n.sender_role === 'Administrator');
  const doctorMessages = data.filter(n => n.sender_role === 'Shifokor');
  const systemMessages = data.filter(n => !n.sender_role || (n.sender_role !== 'Administrator' && n.sender_role !== 'Shifokor'));

  // Filter bo'yicha xabarlarni tanlash
  const getFilteredMessages = () => {
    if (filter === 'admin') return adminMessages;
    if (filter === 'doctor') return doctorMessages;
    return [...adminMessages, ...doctorMessages, ...systemMessages];
  };

  const filteredMessages = getFilteredMessages();

  const renderMessage = (notification) => {
    const isAdmin = notification.sender_role === 'Administrator';
    const isDoctor = notification.sender_role === 'Shifokor';
    
    return (
      <div 
        key={notification.id} 
        className={`rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 sm:p-5 transition-all hover:shadow-md border overflow-hidden sm:block ${
          isAdmin ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' :
          isDoctor ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' :
          'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        } ${notification.status !== 'read' ? 'border-l-4 border-l-primary' : ''}`}
      >
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            {/* Yuboruvchi */}
            <div className="flex items-center gap-2 sm:gap-2 sm:gap-3 mb-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                isAdmin ? 'bg-red-100 dark:bg-red-900/20' :
                isDoctor ? 'bg-green-100 dark:bg-green-900/20' :
                'bg-gray-100 dark:bg-gray-700'
              }`}>
                <span className={`material-symbols-outlined text-lg sm:text-xl ${
                  isAdmin ? 'text-red-600 dark:text-red-400' :
                  isDoctor ? 'text-green-600 dark:text-green-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {isAdmin ? 'admin_panel_settings' :
                   isDoctor ? 'medical_services' :
                   'notifications'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold truncate ${
                  isAdmin ? 'text-red-900 dark:text-red-300' :
                  isDoctor ? 'text-gray-900 dark:text-white' :
                  'text-gray-900 dark:text-white'
                }`}>
                  {notification.sender_name || 'Tizim'}
                </p>
                <p className={`text-xs ${
                  isAdmin ? 'text-red-600 dark:text-red-400' :
                  isDoctor ? 'text-gray-500 dark:text-gray-400' :
                  'text-gray-500 dark:text-gray-400'
                }`}>
                  {isAdmin ? 'Administrator' :
                   isDoctor ? 'Shifokor' :
                   'Tizim xabari'}
                </p>
              </div>
            </div>

            {/* Xabar matni */}
            {notification.subject && (
              <p className={`font-bold mb-1 break-words ${
                isAdmin ? 'text-red-900 dark:text-red-300' :
                isDoctor ? 'text-gray-900 dark:text-white' :
                'text-gray-900 dark:text-white'
              }`}>
                {notification.subject}
              </p>
            )}
            <p className={`mb-3 whitespace-pre-wrap break-words ${
              isAdmin ? 'text-red-800 dark:text-red-200' :
              isDoctor ? 'text-gray-700 dark:text-gray-300' :
              'text-gray-700 dark:text-gray-300'
            }`}>
              {notification.content}
            </p>
            
            {/* Vaqt va kanal */}
            <div className={`flex flex-wrap items-center gap-2 sm:gap-2 sm:gap-3 sm:gap-3 sm:gap-4 text-xs ${
              isAdmin ? 'text-red-600 dark:text-red-400' :
              isDoctor ? 'text-gray-500 dark:text-gray-400' :
              'text-gray-500 dark:text-gray-400'
            }`}>
              <div className="flex items-center gap-1 whitespace-nowrap">
                <span className="material-symbols-outlined text-sm sm:text-sm sm:text-base flex-shrink-0">schedule</span>
                <span className="hidden sm:inline">
                  {new Date(notification.created_at).toLocaleString('uz-UZ', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <span className="sm:hidden sm:block">
                  {new Date(notification.created_at).toLocaleString('uz-UZ', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {notification.channel && (
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className="material-symbols-outlined text-sm sm:text-sm sm:text-base flex-shrink-0">
                    {notification.channel === 'sms' ? 'sms' : 
                     notification.channel === 'telegram' ? 'send' : 'mail'}
                  </span>
                  {notification.channel.toUpperCase()}
                </div>
              )}
              {notification.priority === 'high' && (
                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full font-semibold whitespace-nowrap">
                  Muhim
                </span>
              )}
            </div>
          </div>
          
          {/* O'qilgan belgisi */}
          {notification.status !== 'read' && (
            <button
              onClick={() => handleMarkAsRead(notification.id)}
              className="p-2 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg sm:rounded-lg sm:rounded-xl transition-colors flex-shrink-0"
              title="O'qilgan deb belgilash"
            >
              <span className="material-symbols-outlined">done</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 sm:space-y-4 sm:space-y-4 sm:space-y-6">
      {/* Header va Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Bildirishnomalar</h3>
        
        {/* Filter tugmalari */}
        <div className="flex flex-wrap gap-2 sm:gap-2 sm:gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 rounded-lg sm:rounded-lg sm:rounded-xl text-xs sm:text-sm sm:text-sm sm:text-base font-semibold transition-all whitespace-nowrap ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Barchasi ({data.length})
          </button>
          <button
            onClick={() => setFilter('admin')}
            className={`px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 rounded-lg sm:rounded-lg sm:rounded-xl text-xs sm:text-sm sm:text-sm sm:text-base font-semibold transition-all whitespace-nowrap ${
              filter === 'admin'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
            }`}
          >
            Admin ({adminMessages.length})
          </button>
          <button
            onClick={() => setFilter('doctor')}
            className={`px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 rounded-lg sm:rounded-lg sm:rounded-xl text-xs sm:text-sm sm:text-sm sm:text-base font-semibold transition-all whitespace-nowrap ${
              filter === 'doctor'
                ? 'bg-green-600 text-white'
                : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
            }`}
          >
            Shifokor ({doctorMessages.length})
          </button>
        </div>
      </div>
      
      {/* Xabarlar ro'yxati */}
      {data.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
          <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">notifications</span>
          <p className="text-gray-500 dark:text-gray-400">Bildirishnomalar yo'q</p>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
          <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">filter_list_off</span>
          <p className="text-gray-500 dark:text-gray-400">Bu kategoriyada xabar yo'q</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {filteredMessages.map(renderMessage)}
        </div>
      )}
    </div>
  );
}

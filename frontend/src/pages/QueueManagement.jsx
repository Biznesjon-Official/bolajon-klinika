import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { queueService } from '../services/queueService';
import { patientService } from '../services/patientService';
import doctorNurseService from '../services/doctorNurseService';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import PatientQRModal from '../components/PatientQRModal';
import PrescriptionModal from '../components/PrescriptionModal';
import { laboratoryService } from '../services/laboratoryService';
import toast, { Toaster } from 'react-hot-toast';

const QueueManagement = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isDoctor = ['doctor', 'chief_doctor'].includes(user?.role_name || user?.role?.name);

  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({
    waiting: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    total: 0
  });
  
  // Add to Queue Modal (Admin/Reception only)
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [queueType, setQueueType] = useState('NORMAL');
  const [notes, setNotes] = useState('');
  
  // Prescription Modal (Doctor only)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionPatient, setPrescriptionPatient] = useState(null);
  
  // Track patients with prescriptions
  const [patientsWithPrescriptions, setPatientsWithPrescriptions] = useState(new Set());
  
  // Nurse assignment (Doctor only)
  const [showNurseModal, setShowNurseModal] = useState(false);
  const [nurses, setNurses] = useState([]);
  const [nurseTaskData, setNurseTaskData] = useState({
    medication_name: '',
    dosage: ''
  });
  const [nursePatient, setNursePatient] = useState(null);
  
  // Lab order (Doctor only)
  const [showLabOrderModal, setShowLabOrderModal] = useState(false);
  const [labTests, setLabTests] = useState([]);
  const [selectedLabTest, setSelectedLabTest] = useState('');
  const [labOrderPriority, setLabOrderPriority] = useState('normal');
  const [labOrderNotes, setLabOrderNotes] = useState('');
  const [labOrderPatient, setLabOrderPatient] = useState(null);

  // Filter (Admin/Reception only)
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDoctor, setFilterDoctor] = useState('all');
  const [patientFilter, setPatientFilter] = useState('all'); // all, inpatient, outpatient, not_admitted

  // Alert and Confirm modals
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null, showCancel: false, confirmText: 'OK', cancelText: 'Bekor qilish' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'warning', confirmText: '', cancelText: '' });
  
  // Complete appointment modal - separate state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeQueueId, setCompleteQueueId] = useState(null);

  // QR Code modal
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedPatientForQR, setSelectedPatientForQR] = useState(null);

  // Helper functions for alerts
  const showAlert = (message, type = 'info', title = '', onConfirm = null, showCancel = false, confirmText = 'OK', cancelText = 'Bekor qilish') => {
    setAlertModal({ isOpen: true, title, message, type, onConfirm, showCancel, confirmText, cancelText });
  };

  const showConfirm = (message, onConfirm, title = t('queue.confirm'), type = 'warning', confirmText = t('queue.confirm'), cancelText = t('queue.cancel')) => {
    const newState = {
      isOpen: true, 
      title, 
      message, 
      onConfirm, 
      type,
      confirmText,
      cancelText
    };
    
    setConfirmModal(newState);
  };

  const handleOpenLabOrder = async (item) => {
    setLabOrderPatient({ id: item.patient_id, name: item.patientName });
    setShowLabOrderModal(true);
    try {
      const res = await laboratoryService.getTests();
      setLabTests(res.data || []);
    } catch {
      setLabTests([]);
    }
  };

  const handleCreateLabOrder = async () => {
    if (!selectedLabTest) return showAlert('Tahlilni tanlang', 'error');
    try {
      await laboratoryService.createOrder({
        patient_id: labOrderPatient.id,
        test_id: selectedLabTest,
        priority: labOrderPriority,
        notes: labOrderNotes
      });
      toast.success('Tahlil buyurtma yaratildi');
      setShowLabOrderModal(false);
      setSelectedLabTest('');
      setLabOrderNotes('');
      setLabOrderPriority('normal');
    } catch (err) {
      showAlert(err.response?.data?.message || 'Xatolik', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const [queueData, doctorsData, statsData, patientsData] = await Promise.all([
        queueService.getQueue({ date: today }),
        queueService.getDoctors(),
        queueService.getQueueStats(),
        patientService.getPatients({ limit: 1000 }) // Barcha bemorlarni olish uchun katta limit
      ]);
      
      // Agar shifokor bo'lsa, faqat o'zining navbatini ko'rsatish
      if (queueData.success) {
        let filteredQueue = queueData.data;
        
        if (isDoctor && user?.staffProfile?.id) {
          filteredQueue = queueData.data.filter(q => {
            return q.doctor_id === user.staffProfile.id;
          });
        }
        
        setQueue(filteredQueue);
      }
      
      if (doctorsData.success && doctorsData.data) {
        setDoctors(doctorsData.data);
      } else {
        setDoctors([]);
      }
      
      if (statsData.success) {
        setStats(statsData.data);
      }
      
      if (patientsData.success) {
        setPatients(patientsData.data || []);
      } else {
        setPatients([]);
      }
    } catch (error) {
      // Set empty arrays on error
      setDoctors([]);
      setPatients([]);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToQueue = async (e) => {
    e.preventDefault();
    
    if (!selectedPatient || !selectedDoctor) {
      showAlert(t('queue.selectPatientAndDoctor'), 'warning', t('common.warning'));
      return;
    }

    try {
      const response = await queueService.addToQueue({
        patient_id: selectedPatient,
        doctor_id: selectedDoctor,
        queue_type: queueType,
        notes
      });

      if (response.success) {
        showAlert(t('queue.patientAddedToQueue'), 'success', t('common.success'));
        setShowAddModal(false);
        resetForm();
        loadData();
      }
    } catch (error) {
      showAlert(t('queue.errorOccurred'), 'error', t('common.error'));
    }
  };

  const resetForm = () => {
    setSelectedPatient('');
    setSelectedDoctor('');
    setQueueType('NORMAL');
    setNotes('');
  };

  const handleCallPatient = async (queueId) => {
    try {
      // Avval bemorning to'lov holatini tekshirish
      const queueItem = queue.find(q => q.id === queueId);
      if (!queueItem) {
        showAlert('Bemor topilmadi', 'error', t('common.error'));
        return;
      }

      // To'lov holatini tekshirish
      try {
        const invoiceResponse = await api.get(`/billing/invoices/patient/${queueItem.patient_id}/unpaid`);

        if (invoiceResponse.data.success && invoiceResponse.data.data && invoiceResponse.data.data.length > 0) {
          // To'lanmagan hisob-fakturalar bor
          const totalUnpaid = invoiceResponse.data.data.reduce((sum, inv) => sum + (inv.total_amount - inv.paid_amount), 0);

          // Ogohlantirish ko'rsatamiz - OK bosilsa chaqiriladi, Bekor qilish bosilsa yo'q
          showAlert(
            `⚠️ DIQQAT: Bemorning ${totalUnpaid.toLocaleString()} so'm to'lanmagan qarzi bor!\n\nBaribir chaqirasizmi?`,
            'warning',
            'To\'lov kerak',
            async () => {
              // OK bosilsa - bemorni chaqiramiz
              try {
                const response = await queueService.callPatient(queueId);
                if (response.success) {
                  // Avtomatik IN_PROGRESS ga o'tkazish
                  try {
                    await queueService.startAppointment(queueId);
                    showAlert('Bemor qabulga olindi', 'success', t('common.success'));
                  } catch (startError) {
                    showAlert(t('queue.patientCalled'), 'success', t('common.success'));
                  }
                  loadData(); // Navbatni yangilash
                }
              } catch (error) {
                showAlert(t('queue.errorOccurred'), 'error', t('common.error'));
              }
            },
            true, // showCancel = true
            'Ha, chaqirish', // confirmText
            'Bekor qilish' // cancelText
          );
          return;
        }
      } catch (invoiceError) {
        // Xatolik bo'lsa ham davom etamiz
      }

      // Agar to'lov tekshiruvi o'tgan bo'lsa, bemorni chaqiramiz
      const response = await queueService.callPatient(queueId);
      if (response.success) {
        // Avtomatik IN_PROGRESS ga o'tkazish
        try {
          await queueService.startAppointment(queueId);
          showAlert('Bemor qabulga olindi', 'success', t('common.success'));
        } catch (startError) {
          showAlert(t('queue.patientCalled'), 'success', t('common.success'));
        }
        loadData();
      }
    } catch (error) {
      showAlert(t('queue.errorOccurred'), 'error', t('common.error'));
    }
  };

  const handleCompleteAppointment = async (queueId) => {
    // Open complete modal
    setCompleteQueueId(queueId);
    setShowCompleteModal(true);
  };
  
  const confirmCompleteAppointment = async () => {
    if (!completeQueueId) return;
    
    try {
      const response = await queueService.completeAppointment(completeQueueId);
      
      if (response.success) {
        showAlert(t('queue.appointmentCompleted'), 'success', t('common.success'));
        setPatientsWithPrescriptions(prev => {
          const newSet = new Set(prev);
          newSet.delete(completeQueueId);
          return newSet;
        });
        setShowCompleteModal(false);
        setCompleteQueueId(null);
        loadData();
      } else {
        showAlert(response.message || t('queue.errorOccurred'), 'error', t('common.error'));
      }
    } catch (error) {
      showAlert(error.response?.data?.message || t('queue.errorOccurred'), 'error', t('common.error'));
    }
  };

  const handleCancelAppointment = async (queueId) => {
    showConfirm(
      t('queue.confirmCancelAppointment') || 'Navbatni bekor qilishni tasdiqlaysizmi?',
      async () => {
        try {
          // Sabab so'ramasdan to'g'ridan-to'g'ri o'chirish
          const response = await queueService.cancelAppointment(queueId, 'Bekor qilindi');
          if (response.success) {
            showAlert(t('queue.appointmentCancelled') || 'Navbat bekor qilindi', 'success', t('common.success'));
            loadData();
          }
        } catch (error) {
          showAlert(t('queue.errorOccurred') || 'Xatolik yuz berdi', 'error', t('common.error'));
        }
      },
      t('queue.cancelQueue') || 'Navbatni bekor qilish',
      'danger',
      t('queue.cancelAppointment') || 'Bekor qilish',
      t('queue.close') || 'Yopish'
    );
  };

  const handleStartConsultation = (patient) => {
    // Set patient and open modal - PrescriptionModal handles its own state
    setPrescriptionPatient(patient);
    setShowPrescriptionModal(true);
  };

  // Hamshiraga topshiriq yuborish
  const handleOpenNurseModal = async (patient) => {
    try {
      setNursePatient(patient);
      const response = await doctorNurseService.getActiveNurses();
      if (response.success) {
        setNurses(response.data);
        setShowNurseModal(true);
      }
    } catch (error) {
      toast.error('Hamshiralarni yuklashda xatolik');
    }
  };

  const handleAssignToNurse = async () => {
    if (!selectedNurse) {
      toast.error('Iltimos, hamshirani tanlang');
      return;
    }

    if (!nurseTaskData.medication_name || !nurseTaskData.dosage) {
      toast.error('Iltimos, dori va dozasini kiriting');
      return;
    }

    try {
      const taskData = {
        patient_id: nursePatient.patient_id,
        admission_id: nursePatient.admission_id || null,
        nurse_id: selectedNurse,
        task_type: 'emergency',
        medication_name: nurseTaskData.medication_name,
        dosage: nurseTaskData.dosage,
        route: 'oral',
        frequency: 'Shoshilinch',
        priority: 'EMERGENCY',
        instructions: 'Shifokor tomonidan shoshilinch tayinlangan',
        scheduled_time: new Date().toISOString()
      };

      const response = await doctorNurseService.assignTask(taskData);
      
      if (response.success) {
        toast.success('Shoshilinch topshiriq hamshiraga yuborildi!');
        setShowNurseModal(false);
        setSelectedNurse(null);
        setNurseTaskData({
          medication_name: '',
          dosage: ''
        });
        setNursePatient(null);
      }
    } catch (error) {
      toast.error('Topshiriq yuborishda xatolik');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'WAITING': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
      'CALLED': 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      'IN_PROGRESS': 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
      'COMPLETED': 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      'CANCELLED': 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
    };
    return colors[status] || colors.WAITING;
  };

  const getStatusText = (status) => {
    const texts = {
      'WAITING': t('queue.waitingStatus'),
      'CALLED': t('queue.calledStatus'),
      'IN_PROGRESS': t('queue.inProgressStatus'),
      'COMPLETED': t('queue.completedStatus'),
      'CANCELLED': t('queue.cancelledStatus')
    };
    return texts[status] || status;
  };

  const filteredQueue = isDoctor ? queue : queue.filter(item => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (filterDoctor !== 'all' && item.doctor_id !== filterDoctor) return false;
    return true;
  });

  const formatTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && queue.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // SHIFOKOR UCHUN SODDA KO'RINISH
  if (isDoctor) {
    return (
      <>
        <div className="p-3 sm:p-4 sm:p-6 lg:p-8 space-y-3 sm:space-y-4 sm:space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div>
            <h1 className="text-2xl sm:text-2xl font-black text-gray-900 dark:text-white">{t('queue.myQueue')}</h1>
            <p className="text-sm sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('queue.todayPatients')}: {queue.length} {t('queue.patientsCount')}
            </p>
          </div>
          <button
            onClick={loadData}
            className="w-full sm:w-auto px-4 sm:px-4 lg:px-8 py-2 sm:py-2 bg-primary text-white rounded-lg sm:rounded-lg text-sm sm:text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2 sm:gap-2"
          >
            <span className="material-symbols-outlined text-sm sm:text-base">refresh</span>
            {t('queue.refresh')}
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 sm:gap-3">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-yellow-100 dark:border-yellow-800">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="size-10 sm:size-12 bg-yellow-500 rounded-lg sm:rounded-lg flex items-center justify-center text-white flex-shrink-0">
                <span className="material-symbols-outlined text-xl sm:text-xl">schedule</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('queue.waitingPatients')}</p>
                <p className="text-xl sm:text-xl font-bold text-gray-900 dark:text-white">
                  {queue.filter(q => q.status === 'WAITING').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-100 dark:border-purple-800">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="size-10 sm:size-12 bg-purple-500 rounded-lg sm:rounded-lg flex items-center justify-center text-white flex-shrink-0">
                <span className="material-symbols-outlined text-xl sm:text-xl">medical_services</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('queue.inConsultation')}</p>
                <p className="text-xl sm:text-xl font-bold text-gray-900 dark:text-white">
                  {queue.filter(q => q.status === 'IN_PROGRESS').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-100 dark:border-green-800 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="size-10 sm:size-12 bg-green-500 rounded-lg sm:rounded-lg flex items-center justify-center text-white flex-shrink-0">
                <span className="material-symbols-outlined text-xl sm:text-xl">check_circle</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('queue.completedToday')}</p>
                <p className="text-xl sm:text-xl font-bold text-gray-900 dark:text-white">
                  {queue.filter(q => q.status === 'COMPLETED').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Filter Buttons for Doctor */}
        <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4">
          <h3 className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">Bemorlarni filtrlash</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPatientFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                patientFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Barchasi ({queue.length})
            </button>
            <button
              onClick={() => setPatientFilter('inpatient')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                patientFilter === 'inpatient'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Statsionardagi ({queue.filter(p => p.admission_id).length})
            </button>
            <button
              onClick={() => setPatientFilter('outpatient')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                patientFilter === 'outpatient'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Ambulatordagi ({queue.filter(p => !p.admission_id && p.status !== 'COMPLETED').length})
            </button>
            <button
              onClick={() => setPatientFilter('not_admitted')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                patientFilter === 'not_admitted'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Yotqizilmagan ({queue.filter(p => !p.admission_id).length})
            </button>
          </div>
        </div>

        {/* Queue List */}
        <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden sm:block">
          {(() => {
            // Filter patients for doctor
            let filteredPatients = queue;
            
            if (patientFilter === 'inpatient') {
              filteredPatients = queue.filter(p => p.admission_id);
            } else if (patientFilter === 'outpatient') {
              filteredPatients = queue.filter(p => !p.admission_id && p.status !== 'COMPLETED');
            } else if (patientFilter === 'not_admitted') {
              filteredPatients = queue.filter(p => !p.admission_id);
            }
            
            if (filteredPatients.length === 0) {
              return (
                <div className="p-12 text-center">
                  <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700 mb-4">
                    person_off
                  </span>
                  <p className="text-gray-500 dark:text-gray-400">
                    {patientFilter === 'all' ? t('queue.noQueue') :
                     patientFilter === 'inpatient' ? 'Statsionardagi bemorlar yo\'q' :
                     patientFilter === 'outpatient' ? 'Ambulatordagi bemorlar yo\'q' :
                     'Yotqizilmagan bemorlar yo\'q'}
                  </p>
                </div>
              );
            }
            
            return (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPatients.map((patient) => (
                <div key={patient.id} onClick={() => navigate(`/patients/${patient.patient_id}`)} className="p-3 sm:p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <div className="flex flex-col sm:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
                    <div className="flex items-start gap-2 sm:gap-3 sm:gap-3 min-w-0 flex-1">
                      <div className="size-12 sm:size-16 bg-primary/10 text-primary rounded-lg sm:rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xl sm:text-xl font-black">{patient.queueNumber}</span>
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 dark:text-white text-base sm:text-lg break-words">
                            {patient.patientName}
                          </p>
                          {patient.admission_id && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded text-xs font-semibold whitespace-nowrap">
                              Statsionar
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">
                          {patient.patientNumber} • {patient.patientPhone}
                        </p>
                        {patient.notes && (
                          <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">
                            <span className="font-semibold">{t('queue.notes')}:</span> {patient.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 sm:gap-2 lg:gap-3 sm:gap-4">
                      <div className="flex items-center gap-2 sm:gap-2 flex-wrap">
                        <span className={`px-3 sm:px-4 lg:px-8 py-2 sm:py-2 rounded-lg sm:rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap ${getStatusColor(patient.status)}`}>
                          {getStatusText(patient.status)}
                        </span>
                        
                        {patient.queueType === 'EMERGENCY' && (
                          <span className="px-2 sm:px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold whitespace-nowrap">
                            {t('queue.emergency')}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                        {patient.status === 'WAITING' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCallPatient(patient.id) }}
                            className="px-3 sm:px-4 lg:px-8 py-2 sm:py-2 bg-green-500 text-white rounded-lg sm:rounded-lg text-sm sm:text-sm font-semibold hover:bg-green-600 flex items-center justify-center gap-2 sm:gap-2"
                          >
                            <span className="material-symbols-outlined text-sm sm:text-base">call</span>
                            {t('queue.call')}
                          </button>
                        )}
                        
                        {patient.status === 'IN_PROGRESS' && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStartConsultation(patient) }}
                              className="px-3 sm:px-4 lg:px-8 py-2 sm:py-2 bg-purple-500 text-white rounded-lg sm:rounded-lg text-sm sm:text-sm font-semibold hover:bg-purple-600 flex items-center justify-center gap-2 sm:gap-2"
                            >
                              <span className="material-symbols-outlined text-sm sm:text-base">medication</span>
                              {t('queue.writePrescription')}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCompleteAppointment(patient.id) }}
                              className="px-3 sm:px-4 lg:px-8 py-2 sm:py-2 bg-green-500 text-white rounded-lg sm:rounded-lg text-sm sm:text-sm font-semibold hover:bg-green-600 flex items-center justify-center gap-2 sm:gap-2"
                            >
                              <span className="material-symbols-outlined text-sm sm:text-base">check_circle</span>
                              {t('queue.completeAppointment')}
                            </button>
                          </>
                        )}
                        
                        {/* QR Code button - always visible */}
                        <button
                          onClick={(e) => { e.stopPropagation();
                            setSelectedPatientForQR({
                              id: patient.patient_id,
                              patient_number: patient.patientNumber,
                              first_name: patient.patientName?.split(' ')[0] || '',
                              last_name: patient.patientName?.split(' ').slice(1).join(' ') || '',
                              full_name: patient.patientName,
                              phone: patient.patientPhone,
                              qr_code: patient.qr_code || patient.patient_id
                            });
                            setShowQRModal(true);
                          }}
                          className="px-3 sm:px-4 lg:px-8 py-2 sm:py-2 bg-gray-500 text-white rounded-lg sm:rounded-lg text-sm sm:text-sm font-semibold hover:bg-gray-600 flex items-center justify-center gap-2 sm:gap-2"
                          title="QR Kod"
                        >
                          <span className="material-symbols-outlined text-sm sm:text-base">qr_code</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            );
          })()}
        </div>
      </div>

      {/* Alert Modal */}
        <AlertModal
          isOpen={alertModal.isOpen}
          onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
          title={alertModal.title}
          message={alertModal.message}
          type={alertModal.type}
          onConfirm={alertModal.onConfirm}
          showCancel={alertModal.showCancel}
          confirmText={alertModal.confirmText}
          cancelText={alertModal.cancelText}
        />

        {/* Complete Appointment Modal - FOR DOCTOR */}
        <ConfirmModal
          isOpen={showCompleteModal}
          onClose={() => {
            setShowCompleteModal(false);
            setCompleteQueueId(null);
          }}
          onConfirm={confirmCompleteAppointment}
          title={t('queue.completeTitle')}
          message={t('queue.confirmComplete')}
          type="info"
          confirmText={t('queue.confirm')}
          cancelText={t('queue.cancel')}
        />

        {/* Prescription Modal - Using separate component */}
        <PrescriptionModal
          isOpen={showPrescriptionModal}
          onClose={() => {
            setShowPrescriptionModal(false);
            setPrescriptionPatient(null);
          }}
          patient={prescriptionPatient}
          onSuccess={(response) => {
            setPatientsWithPrescriptions(prev => new Set([...prev, prescriptionPatient.id]));
            loadData();
          }}
          user={user}
        />
      </>
    );
  }

  // ADMIN/RECEPTION UCHUN TO'LIQ KO'RINISH
  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Navbat boshqaruvi</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Bugungi navbat: {stats.total} ta bemor
          </p>
        </div>
        {!isDoctor && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 sm:px-4 lg:px-8 py-2 sm:py-2 bg-primary text-white rounded-lg sm:rounded-lg text-sm sm:text-sm font-semibold hover:opacity-90 flex items-center gap-2 sm:gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            {t('queue.addToQueue')}
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg sm:rounded-lg p-3 sm:p-4 border-l-4 border-yellow-500">
          <p className="text-sm sm:text-sm text-gray-600 dark:text-gray-400">Kutmoqda</p>
          <p className="text-2xl sm:text-3xl font-black text-yellow-700 dark:text-yellow-400">{stats.waiting}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg sm:rounded-lg p-3 sm:p-4 border-l-4 border-purple-500">
          <p className="text-sm sm:text-sm text-gray-600 dark:text-gray-400">Qabulda</p>
          <p className="text-2xl sm:text-3xl font-black text-purple-700 dark:text-purple-400">{stats.in_progress}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-lg p-3 sm:p-4 border-l-4 border-green-500">
          <p className="text-sm sm:text-sm text-gray-600 dark:text-gray-400">Yakunlandi</p>
          <p className="text-2xl sm:text-3xl font-black text-green-700 dark:text-green-400">{stats.completed}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg sm:rounded-lg p-3 sm:p-4 border-l-4 border-red-500">
          <p className="text-sm sm:text-sm text-gray-600 dark:text-gray-400">Bekor qilindi</p>
          <p className="text-2xl sm:text-3xl font-black text-red-700 dark:text-red-400">{stats.cancelled}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-lg p-3 sm:p-4 border-l-4 border-green-500">
          <p className="text-sm sm:text-sm text-gray-600 dark:text-gray-400">Jami</p>
          <p className="text-2xl sm:text-3xl font-black text-green-700 dark:text-green-400">{stats.total}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4">
        <div className="flex gap-3 sm:gap-4">
          <div className="flex-1">
            <label className="block text-sm sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 sm:px-4 lg:px-8 py-2 sm:py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-lg"
            >
              <option value="all">{t('queue.allStatuses')}</option>
              <option value="WAITING">{t('queue.waitingStatus')}</option>
              <option value="IN_PROGRESS">{t('queue.inProgressStatus')}</option>
              <option value="COMPLETED">{t('queue.completedStatus')}</option>
              <option value="CANCELLED">{t('queue.cancelledStatus')}</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Shifokor
            </label>
            <select
              value={filterDoctor}
              onChange={(e) => setFilterDoctor(e.target.value)}
              className="w-full px-4 sm:px-4 lg:px-8 py-2 sm:py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-lg"
            >
              <option value="all">{t('queue.allDoctors')}</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.first_name} {doctor.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800">
        {filteredQueue.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700 mb-4">
              event_available
            </span>
            <p className="text-gray-500 dark:text-gray-400">Navbat bo'sh</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredQueue.map((item) => (
              <div key={item.id} className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="size-16 bg-primary/10 text-primary rounded-lg sm:rounded-lg flex items-center justify-center">
                      <span className="text-xl sm:text-2xl font-black">{item.queueNumber}</span>
                    </div>
                    
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {item.patientName}
                      </p>
                      <p className="text-sm sm:text-sm text-gray-600 dark:text-gray-400">
                        {item.patientNumber} • {item.patientPhone}
                      </p>
                      <p className="text-sm sm:text-sm text-gray-500">
                        Dr. {item.doctorName}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-right">
                      <p className="text-sm sm:text-sm text-gray-500">Vaqt</p>
                      <p className="font-semibold">{formatTime(item.appointmentTime)}</p>
                    </div>
                    
                    <span className={`px-4 sm:px-4 lg:px-8 py-2 sm:py-2 rounded-lg sm:rounded-lg text-sm sm:text-sm font-semibold ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                    
                    {item.queueType === 'EMERGENCY' && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-full text-xs font-semibold">
                        {t('queue.emergency')}
                      </span>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 sm:gap-2">
                      {item.status === 'WAITING' && (
                        <>
                          {isDoctor && (
                            <button
                              onClick={() => handleCallPatient(item.id)}
                              className="px-3 py-2 sm:py-2 bg-green-500 text-white rounded-lg sm:rounded-lg text-sm sm:text-sm font-semibold hover:bg-green-600 flex items-center gap-1"
                              title="Bemorni chaqirish"
                            >
                              <span className="material-symbols-outlined text-base sm:text-lg">call</span>
                              Chaqirish
                            </button>
                          )}
                          {!isDoctor && (
                            <button
                              onClick={() => handleCancelAppointment(item.id)}
                              className="px-3 py-2 sm:py-2 bg-red-500 text-white rounded-lg sm:rounded-lg text-sm sm:text-sm font-semibold hover:bg-red-600"
                              title="Bekor qilish"
                            >
                              <span className="material-symbols-outlined text-base sm:text-lg">close</span>
                            </button>
                          )}
                        </>
                      )}
                      
                      {isDoctor && (item.status === 'CALLED' || item.status === 'IN_PROGRESS') && (
                        <>
                          <button
                            onClick={() => handleStartConsultation(item)}
                            className="px-3 py-2 sm:py-2 bg-purple-500 text-white rounded-lg sm:rounded-lg text-sm sm:text-sm font-semibold hover:bg-purple-600 flex items-center gap-1"
                            title={t('queue.writePrescription')}
                          >
                            <span className="material-symbols-outlined text-base sm:text-lg">medication</span>
                            {t('queue.writePrescription')}
                          </button>
                          <button
                            onClick={() => handleCompleteAppointment(item.id)}
                            className="px-3 py-2 sm:py-2 bg-green-500 text-white rounded-lg sm:rounded-lg text-sm sm:text-sm font-semibold hover:bg-green-600 flex items-center gap-1"
                            title={t('queue.completeTitle')}
                          >
                            <span className="material-symbols-outlined text-base sm:text-lg">check_circle</span>
                            {t('queue.completeAppointment')}
                          </button>
                        </>
                      )}
                      
                      {/* Lab order button - Doctor only */}
                      {isDoctor && (item.status === 'CALLED' || item.status === 'IN_PROGRESS') && (
                        <button
                          onClick={() => handleOpenLabOrder(item)}
                          className="px-3 py-2 sm:py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600 flex items-center gap-1"
                          title="Tahlil buyurtma"
                        >
                          <span className="material-symbols-outlined text-base sm:text-lg">biotech</span>
                          Tahlil
                        </button>
                      )}

                      {/* QR Code button - always visible */}
                      <button
                        onClick={() => {
                          setSelectedPatientForQR({
                            id: item.patient_id,
                            patient_number: item.patientNumber,
                            first_name: item.patientName?.split(' ')[0] || '',
                            last_name: item.patientName?.split(' ').slice(1).join(' ') || '',
                            full_name: item.patientName,
                            phone: item.patientPhone,
                            qr_code: item.qr_code || item.patient_id
                          });
                          setShowQRModal(true);
                        }}
                        className="px-3 py-2 sm:py-2 bg-gray-500 text-white rounded-lg sm:rounded-lg text-sm sm:text-sm font-semibold hover:bg-gray-600 flex items-center gap-1"
                        title="QR Kod"
                      >
                        <span className="material-symbols-outlined text-base sm:text-lg">qr_code</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>



      {/* Add to Queue Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }}>
        <form onSubmit={handleAddToQueue} className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{t('queue.addToQueue')}</h2>
          
          {/* Patient Selection */}
          <div>
            <label className="block text-sm sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Bemorni tanlang <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full px-4 sm:px-4 lg:px-8 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Bemorni tanlang</option>
              {patients
                .filter(patient => {
                  const hasActiveQueue = queue.some(q => 
                    q.patient_id === patient.id && 
                    (q.status === 'WAITING' || q.status === 'CALLED' || q.status === 'IN_PROGRESS')
                  );
                  return !hasActiveQueue;
                })
                .map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name} - {patient.patient_number} - {patient.phone}
                  </option>
                ))
              }
            </select>
          </div>

          {/* Doctor Selection */}
          <div>
            <label className="block text-sm sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Shifokorni tanlang <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full px-4 sm:px-4 lg:px-8 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Shifokorni tanlang</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                  {doctor.waiting_count > 0 ? ` (${doctor.waiting_count} kutmoqda)` : ' (Bo\'sh)'}
                </option>
              ))}
            </select>
          </div>

          {/* Queue Type */}
          <div>
            <label className="block text-sm sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Navbat turi
            </label>
            <div className="flex gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setQueueType('NORMAL')}
                className={`flex-1 px-4 sm:px-4 lg:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all ${
                  queueType === 'NORMAL'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                Oddiy
              </button>
              <button
                type="button"
                onClick={() => setQueueType('URGENT')}
                className={`flex-1 px-4 sm:px-4 lg:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all ${
                  queueType === 'URGENT'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                Shoshilinch
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('queue.notes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="2"
              className="w-full px-4 sm:px-4 lg:px-8 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder={t('queue.notesPlaceholder')}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 sm:gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setShowAddModal(false); resetForm(); }}
              className="flex-1 px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg sm:rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {t('queue.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-primary text-white rounded-lg sm:rounded-xl font-semibold hover:opacity-90"
            >
              {t('queue.addToQueueButton')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onConfirm={alertModal.onConfirm}
        showCancel={alertModal.showCancel}
        confirmText={alertModal.confirmText}
        cancelText={alertModal.cancelText}
      />

      {/* Confirm Modal - Main confirmation dialog */}
      <ConfirmModal
        key="main-confirm-modal"
        isOpen={confirmModal.isOpen}
        onClose={() => {
          setConfirmModal({ ...confirmModal, isOpen: false });
        }}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
      />

      {/* Complete Appointment Modal - FOR ADMIN */}
      <ConfirmModal
        isOpen={showCompleteModal}
        onClose={() => {
          setShowCompleteModal(false);
          setCompleteQueueId(null);
        }}
        onConfirm={confirmCompleteAppointment}
        title={t('queue.completeTitle')}
        message={t('queue.confirmComplete')}
        type="info"
        confirmText={t('queue.confirm')}
        cancelText={t('queue.cancel')}
      />

      {/* Hamshiraga biriktirish modali - FOR DOCTOR */}
      {isDoctor && (
        <Modal
          isOpen={showNurseModal}
          onClose={() => {
            setShowNurseModal(false);
            setSelectedNurse(null);
            setNurseTaskData({ medication_name: '', dosage: '' });
            setNursePatient(null);
          }}
          title="🏥 Muolajaga yuborish"
          size="md"
        >
          <div className="space-y-3 sm:space-y-4">
            {/* Bemor ma'lumotlari */}
            {nursePatient && (
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="material-symbols-outlined text-green-600 text-2xl sm:text-3xl">person</span>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {nursePatient.patientName || `${nursePatient.first_name} ${nursePatient.last_name}`}
                    </p>
                    <p className="text-sm sm:text-sm text-gray-600 dark:text-gray-400">
                      {nursePatient.patientNumber || nursePatient.patient_number}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Hamshirani tanlash */}
            <div>
              <label className="block text-sm sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Hamshirani tanlang *
              </label>
              <select
                value={selectedNurse || ''}
                onChange={(e) => setSelectedNurse(e.target.value)}
                className="w-full px-4 sm:px-4 lg:px-8 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Hamshirani tanlang</option>
                {nurses.map((nurse) => (
                  <option key={nurse.id} value={nurse.id}>
                    {nurse.full_name} - {nurse.specialization || 'Hamshira'}
                  </option>
                ))}
              </select>
            </div>

            {/* Dori nomi */}
            <div>
              <label className="block text-sm sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Dori nomi *
              </label>
              <input
                type="text"
                value={nurseTaskData.medication_name}
                onChange={(e) => setNurseTaskData({ ...nurseTaskData, medication_name: e.target.value })}
                className="w-full px-4 sm:px-4 lg:px-8 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Dori nomini kiriting"
                required
              />
            </div>

            {/* Doza */}
            <div>
              <label className="block text-sm sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Doza *
              </label>
              <input
                type="text"
                value={nurseTaskData.dosage}
                onChange={(e) => setNurseTaskData({ ...nurseTaskData, dosage: e.target.value })}
                className="w-full px-4 sm:px-4 lg:px-8 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Masalan: 500mg"
                required
              />
            </div>

            {/* Tugmalar */}
            <div className="flex gap-2 sm:gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowNurseModal(false);
                  setSelectedNurse(null);
                  setNurseTaskData({ medication_name: '', dosage: '' });
                  setNursePatient(null);
                }}
                className="flex-1 px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg sm:rounded-xl text-sm sm:text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleAssignToNurse}
                className="flex-1 px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg sm:rounded-xl text-sm sm:text-sm font-semibold hover:from-orange-600 hover:to-red-600 flex items-center justify-center gap-2 sm:gap-2"
              >
                <span className="material-symbols-outlined">send</span>
                Yuborish
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast notifications */}
      <Toaster position="top-right" />

      {/* QR Code Modal */}
      {showQRModal && selectedPatientForQR && (
        <PatientQRModal
          patient={selectedPatientForQR}
          onClose={() => {
            setShowQRModal(false);
            setSelectedPatientForQR(null);
          }}
        />
      )}

      {/* Lab Order Modal */}
      <Modal isOpen={showLabOrderModal} onClose={() => setShowLabOrderModal(false)} size="md">
        <div className="p-6">
          <h3 className="text-lg font-bold mb-1 dark:text-white">Tahlil buyurtma qilish</h3>
          {labOrderPatient && (
            <p className="text-sm text-gray-500 mb-4">{labOrderPatient.name}</p>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Tahlil turi</label>
              <select
                value={selectedLabTest}
                onChange={(e) => setSelectedLabTest(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Tanlang...</option>
                {labTests.map(test => (
                  <option key={test._id} value={test._id}>
                    {test.name} {test.price ? `— ${test.price?.toLocaleString()} so'm` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Muhimlik</label>
              <select
                value={labOrderPriority}
                onChange={(e) => setLabOrderPriority(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="normal">Oddiy</option>
                <option value="urgent">Shoshilinch</option>
                <option value="stat">STAT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Izoh</label>
              <textarea
                value={labOrderNotes}
                onChange={(e) => setLabOrderNotes(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={2}
                placeholder="Qo'shimcha izoh..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowLabOrderModal(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleCreateLabOrder}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:opacity-90"
            >
              Buyurtma berish
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default QueueManagement;






import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { patientService } from '../services/patientService';
import { prescriptionService } from '../services/prescriptionService';
import treatmentService from '../services/treatmentService';
import { queueService } from '../services/queueService';
import billingService from '../services/billingService';
import ambulatorInpatientService from '../services/ambulatorInpatientService';
import inpatientRoomService from '../services/inpatientRoomService';
import Modal from '../components/Modal';
import AlertModal from '../components/AlertModal';
import PatientQRModal from '../components/PatientQRModal';
import DateInput from '../components/DateInput';
import api from '../services/api';
import PrescriptionModal from '../components/PrescriptionModal';
import doctorNurseService from '../services/doctorNurseService';
import { laboratoryService } from '../services/laboratoryService';

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isDoctor = ['doctor', 'chief_doctor'].includes(user?.role?.name);
  const isReceptionist = ['receptionist', 'admin', 'super admin'].includes(user?.role?.name);

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [labResults, setLabResults] = useState([]); // labOrders -> labResults
  const [admissions, setAdmissions] = useState([]);
  const [assignedSpecialists, setAssignedSpecialists] = useState([]);
  const [treatmentSchedule, setTreatmentSchedule] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showQRModal, setShowQRModal] = useState(false);

  // Queue & Billing states
  const [queueData, setQueueData] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showAddQueueModal, setShowAddQueueModal] = useState(false);
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [queueForm, setQueueForm] = useState({ doctor_id: '', queue_type: 'NORMAL', notes: '' });
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [invoiceDoctor, setInvoiceDoctor] = useState('');
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'cash', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [showAddLabModal, setShowAddLabModal] = useState(false);
  const [recordForm, setRecordForm] = useState({
    diagnosis_text: '',
    treatment_plan: '',
    notes: ''
  });

  // Admission states
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [admissionDepartment, setAdmissionDepartment] = useState('ambulator');
  const [admissionRooms, setAdmissionRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedBed, setSelectedBed] = useState('');
  const [admissionForm, setAdmissionForm] = useState({ diagnosis: '', notes: '' });
  const [admissionLoading, setAdmissionLoading] = useState(false);

  // Alert modal
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // Doctor action modals
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showNurseModal, setShowNurseModal] = useState(false);
  const [showLabOrderModal, setShowLabOrderModal] = useState(false);
  const [nurses, setNurses] = useState([]);
  const [selectedNurse, setSelectedNurse] = useState('');
  const [nurseTaskData, setNurseTaskData] = useState({
    task_type: 'medication_administration',
    medication_name: '', dosage: '', route: 'oral', frequency: '', priority: 'normal', instructions: ''
  });
  const [labTests, setLabTests] = useState([]);
  const [selectedLabTest, setSelectedLabTest] = useState('');
  const [labOrderPriority, setLabOrderPriority] = useState('normal');
  const [labOrderNotes, setLabOrderNotes] = useState('');

  const showAlert = (message, type = 'info', title = '') => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  const loadAdmissionRooms = async (dept) => {
    try {
      const res = dept === 'ambulator'
        ? await ambulatorInpatientService.getRooms()
        : await inpatientRoomService.getRooms()
      setAdmissionRooms(res.data || [])
      setSelectedRoom('')
      setSelectedBed('')
    } catch {
      setAdmissionRooms([])
    }
  }

  const handleOpenAdmissionModal = () => {
    setShowAdmissionModal(true)
    setAdmissionDepartment('ambulator')
    setAdmissionForm({ diagnosis: '', notes: '' })
    setSelectedRoom('')
    setSelectedBed('')
    loadAdmissionRooms('ambulator')
  }

  const handleCreateAdmission = async () => {
    if (!selectedRoom || !selectedBed) {
      showAlert('Xona va koykani tanlang', 'error')
      return
    }
    try {
      setAdmissionLoading(true)
      await ambulatorInpatientService.createAdmission({
        patient_id: id,
        room_id: selectedRoom,
        bed_number: Number(selectedBed),
        diagnosis: admissionForm.diagnosis,
        notes: admissionForm.notes
      })
      showAlert('Bemor muvaffaqiyatli yotqizildi', 'success')
      setShowAdmissionModal(false)
      loadPatientData()
    } catch (err) {
      showAlert(err.response?.data?.message || 'Xatolik yuz berdi', 'error')
    } finally {
      setAdmissionLoading(false)
    }
  }

  useEffect(() => {
    loadPatientData();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'treatments') {
      loadTreatmentSchedule();
    } else if (activeTab === 'specialists') {
      loadAssignedSpecialists();
    } else if (activeTab === 'queue' && isReceptionist) {
      loadQueueData();
      loadDoctors();
    } else if (activeTab === 'cashier' && isReceptionist) {
      loadDoctors();
      loadServices();
    }
  }, [activeTab, selectedDate, id]);

  const loadTreatmentSchedule = async () => {
    try {
      const response = await treatmentService.getPatientDailySchedule(id, selectedDate);
      if (response.success) {
        setTreatmentSchedule(response.data);
      }
    } catch (error) {
      console.error('Load treatment schedule error:', error);
    }
  };

  const loadAssignedSpecialists = async () => {
    try {
      const response = await api.get(`/appointments/patient/${id}`)
      if (response.data.success) {
        setAssignedSpecialists(response.data.data || [])
      }
    } catch (error) {
      console.error('Load specialists error:', error);
    }
  };

  const loadPatientData = async () => {
    try {
      setLoading(true);
      
      const response = await patientService.getPatient(id);
      
      if (response.success && response.data) {
        setPatient(response.data.patient);
        setMedicalRecords(response.data.medicalRecords || []);
        setInvoices(response.data.allInvoices || response.data.invoices || []); // Barcha invoicelarni yuklash
        setLabResults(response.data.labResults || []); // labOrders -> labResults
        setAdmissions(response.data.admissions || []);
      } else {
        console.error('Invalid response:', response);
        showAlert('Bemor ma\'lumotlari topilmadi', 'error', 'Xatolik');
      }
      
      // Load prescriptions
      try {
        const prescResponse = await prescriptionService.getPatientPrescriptions(id);
        if (prescResponse.success) {
          setPrescriptions(prescResponse.data || []);
        }
      } catch (error) {
        console.error('Load prescriptions error:', error);
        console.error('Error response:', error.response?.data);
      }
    } catch (error) {
      console.error('Load patient error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      showAlert(`Xatolik: ${error.response?.data?.error || error.message}`, 'error', 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicalRecord = async (e) => {
    e.preventDefault();
    try {
      await patientService.addMedicalRecord(id, recordForm);
      showAlert('Tibbiy yozuv qo\'shildi', 'success');
      setShowAddRecordModal(false);
      setRecordForm({ diagnosis_text: '', treatment_plan: '', notes: '' });
      loadPatientData();
    } catch (error) {
      showAlert(error.response?.data?.message || 'Xatolik yuz berdi', 'error');
    }
  };

  // Doctor: Hamshiraga topshiriq
  const handleOpenNurseModal = async () => {
    setShowNurseModal(true);
    try {
      const res = await doctorNurseService.getActiveNurses();
      setNurses(res.data || []);
    } catch {
      setNurses([]);
    }
  };

  const handleAssignToNurse = async () => {
    if (!selectedNurse) return showAlert('Hamshirani tanlang', 'error');
    try {
      await doctorNurseService.assignTask({
        patient_id: id, nurse_id: selectedNurse, ...nurseTaskData
      });
      showAlert('Topshiriq yuborildi', 'success');
      setShowNurseModal(false);
      setSelectedNurse('');
      setNurseTaskData({ task_type: 'medication_administration', medication_name: '', dosage: '', route: 'oral', frequency: '', priority: 'normal', instructions: '' });
      loadPatientData();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Xatolik', 'error');
    }
  };

  // Doctor: Lab buyurtma
  const handleOpenLabOrderModal = async () => {
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
        patient_id: id, test_id: selectedLabTest,
        priority: labOrderPriority, notes: labOrderNotes
      });
      showAlert('Tahlil buyurtma yaratildi', 'success');
      setShowLabOrderModal(false);
      setSelectedLabTest('');
      setLabOrderNotes('');
      setLabOrderPriority('normal');
      loadPatientData();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Xatolik', 'error');
    }
  };

  // Queue & Billing functions
  const loadQueueData = async () => {
    try {
      const response = await queueService.getQueue({ patient_id: id });
      if (response.success) {
        setQueueData(response.data || []);
      }
    } catch (error) {
      console.error('Load queue error:', error);
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await queueService.getDoctors();
      if (response.success) {
        setDoctors(response.data || []);
      }
    } catch (error) {
      console.error('Load doctors error:', error);
    }
  };

  const loadServices = async () => {
    try {
      const response = await billingService.getServices();
      if (response.success) {
        setServices(response.data || []);
      }
    } catch (error) {
      console.error('Load services error:', error);
    }
  };

  const handleAddToQueue = async (e) => {
    e.preventDefault();
    if (!queueForm.doctor_id) return;
    try {
      setSubmitting(true);
      const response = await queueService.addToQueue({
        patient_id: id,
        doctor_id: queueForm.doctor_id,
        queue_type: queueForm.queue_type,
        notes: queueForm.notes
      });
      if (response.success) {
        showAlert('Bemor navbatga qo\'shildi', 'success', 'Muvaffaqiyatli');
        setShowAddQueueModal(false);
        setQueueForm({ doctor_id: '', queue_type: 'NORMAL', notes: '' });
        loadQueueData();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || 'Xatolik yuz berdi', 'error', 'Xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelQueue = async (queueId) => {
    try {
      const response = await queueService.cancelAppointment(queueId, 'Bekor qilindi');
      if (response.success) {
        showAlert('Navbat bekor qilindi', 'success', 'Muvaffaqiyatli');
        loadQueueData();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || 'Xatolik', 'error', 'Xatolik');
    }
  };

  const groupServicesByCategory = () => {
    const grouped = {};
    services.forEach(service => {
      const category = service.category || 'Boshqa';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(service);
    });
    return grouped;
  };

  const addServiceToInvoice = (service) => {
    const serviceId = service._id || service.id;
    if (!serviceId) return;
    const existing = invoiceItems.find(item => item.service_id === serviceId);
    if (existing) {
      setInvoiceItems(invoiceItems.map(item =>
        item.service_id === serviceId ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setInvoiceItems([...invoiceItems, {
        service_id: serviceId,
        description: service.name,
        quantity: 1,
        unit_price: parseFloat(service.price) || 0,
        discount_percentage: 0
      }]);
    }
  };

  const removeServiceFromInvoice = (serviceId) => {
    setInvoiceItems(invoiceItems.filter(item => item.service_id !== serviceId));
  };

  const getInvoiceTotal = () => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    return subtotal - (subtotal * invoiceDiscount / 100);
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (invoiceItems.length === 0) {
      showAlert('Kamida 1 ta xizmat tanlang', 'warning', 'Ogohlantirish');
      return;
    }
    try {
      setSubmitting(true);
      const response = await billingService.createInvoice({
        patient_id: id,
        doctor_id: invoiceDoctor || undefined,
        items: invoiceItems,
        discount_amount: invoiceItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) * invoiceDiscount / 100,
        notes: ''
      });
      if (response.success) {
        showAlert('Faktura yaratildi', 'success', 'Muvaffaqiyatli');
        setShowNewInvoiceModal(false);
        setInvoiceItems([]);
        setInvoiceDoctor('');
        setInvoiceDiscount(0);
        loadPatientData();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || 'Xatolik', 'error', 'Xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setPaymentForm({
      amount: ((invoice.total_amount || 0) - (invoice.paid_amount || 0)).toString(),
      method: 'cash',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedInvoiceForPayment || !paymentForm.amount) return;
    try {
      setSubmitting(true);
      const response = await billingService.addPayment(selectedInvoiceForPayment.id, {
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.method,
        notes: paymentForm.notes
      });
      if (response.success) {
        showAlert('To\'lov qabul qilindi', 'success', 'Muvaffaqiyatli');
        setShowPaymentModal(false);
        setSelectedInvoiceForPayment(null);
        loadPatientData();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || 'Xatolik', 'error', 'Xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return '-';
    return phone.replace(/(\+998)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center">
        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">person_off</span>
        <p className="text-gray-500">Bemor topilmadi</p>
        <button
          onClick={() => navigate('/patients')}
          className="mt-4 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl"
        >
          Orqaga
        </button>
      </div>
    );
  }

  const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();

  return (
    <div className="p-3 sm:p-4 sm:p-4 sm:p-6 lg:p-8 space-y-3 sm:space-y-4 sm:space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <button
          onClick={() => navigate('/patients')}
          className="flex items-center gap-2 sm:gap-2 sm:gap-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white self-start"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Orqaga
        </button>
        <div className="flex flex-wrap gap-2 sm:gap-2 sm:gap-3">
          <button
            onClick={() => setShowQRModal(true)}
            className="flex-1 sm:flex-none px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl text-sm sm:text-sm sm:text-base font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 sm:gap-2 sm:gap-3"
          >
            <span className="material-symbols-outlined">qr_code</span>
            <span className="hidden sm:inline">QR Kod</span>
          </button>
          {isReceptionist && (
            <>
              <button
                onClick={() => { setShowAddQueueModal(true); loadDoctors(); }}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:opacity-90 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">queue</span>
                <span className="hidden sm:inline">Navbatga qo'shish</span>
              </button>
              <button
                onClick={() => setActiveTab('cashier')}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:opacity-90 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">point_of_sale</span>
                <span className="hidden sm:inline">To'lov qilish</span>
              </button>
              <button
                onClick={handleOpenAdmissionModal}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:opacity-90 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">hotel</span>
                <span className="hidden sm:inline">Yotqizish</span>
              </button>
            </>
          )}
          {isDoctor && (
            <>
              <button
                onClick={() => setShowPrescriptionModal(true)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:opacity-90 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">edit_note</span>
                <span className="hidden sm:inline">Retsept yozish</span>
              </button>
              <button
                onClick={() => setShowAddRecordModal(true)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-teal-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:opacity-90 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">diagnosis</span>
                <span className="hidden sm:inline">Tashxis</span>
              </button>
              <button
                onClick={handleOpenNurseModal}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-orange-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:opacity-90 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">medical_services</span>
                <span className="hidden sm:inline">Hamshiraga topshiriq</span>
              </button>
              <button
                onClick={handleOpenLabOrderModal}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:opacity-90 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">biotech</span>
                <span className="hidden sm:inline">Tahlil buyurtma</span>
              </button>
            </>
          )}
          {!isDoctor && (
            <button
              onClick={() => navigate(`/patients/${id}/edit`)}
              className="flex-1 sm:flex-none px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-primary text-white rounded-lg sm:rounded-lg sm:rounded-xl text-sm sm:text-sm sm:text-base font-semibold hover:opacity-90 flex items-center justify-center gap-2 sm:gap-2 sm:gap-3"
            >
              <span className="material-symbols-outlined">edit</span>
              <span className="hidden sm:inline">Tahrirlash</span>
            </button>
          )}
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 sm:p-4 sm:p-6">
        <div className="flex flex-col sm:flex-col sm:flex-row items-start gap-3 sm:gap-4 sm:gap-4 sm:gap-6">
          {patient.photo_url ? (
            <img
              src={patient.photo_url}
              alt={fullName}
              className="size-20 sm:size-24 rounded-full object-cover flex-shrink-0 mx-auto sm:mx-0"
            />
          ) : (
            <div className="size-20 sm:size-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl sm:text-2xl sm:text-3xl font-bold flex-shrink-0 mx-auto sm:mx-0">
              {patient.first_name?.[0]}{patient.last_name?.[0]}
            </div>
          )}
          
          <div className="flex-1 w-full min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-4">
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <h1 className="text-xl sm:text-xl sm:text-2xl font-black text-gray-900 dark:text-white break-words">{fullName}</h1>
                <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                  ID: {patient.patient_number}
                </p>
              </div>
              <div className={`px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 rounded-lg sm:rounded-lg sm:rounded-xl font-semibold text-sm sm:text-sm sm:text-base whitespace-nowrap flex-shrink-0 mx-auto sm:mx-0 ${
                patient.is_blocked 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              }`}>
                {patient.is_blocked ? 'Bloklangan' : 'Faol'}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 sm:gap-3 sm:gap-4">
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-500 dark:text-gray-400">Telefon</p>
                <p className="font-semibold text-sm sm:text-sm sm:text-base text-gray-900 dark:text-white break-words">{formatPhone(patient.phone)}</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-500 dark:text-gray-400">Tug'ilgan sana</p>
                <p className="font-semibold text-sm sm:text-sm sm:text-base text-gray-900 dark:text-white">{formatDate(patient.birth_date)}</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-500 dark:text-gray-400">Jinsi</p>
                <p className="font-semibold text-sm sm:text-sm sm:text-base text-gray-900 dark:text-white">
                  {patient.gender === 'Male' ? 'Erkak' : 'Ayol'}
                </p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-500 dark:text-gray-400">
                  {(() => {
                    // Balansni invoice'lardan hisoblash
                    const totalDebt = invoices.reduce((sum, inv) => {
                      const debt = (inv.total_amount || 0) - (inv.paid_amount || 0);
                      return sum + debt;
                    }, 0);
                    return totalDebt > 0 ? 'Qarz' : 'Balans';
                  })()}
                </p>
                <p className={`font-bold text-sm sm:text-sm sm:text-base ${
                  (() => {
                    const totalDebt = invoices.reduce((sum, inv) => {
                      const debt = (inv.total_amount || 0) - (inv.paid_amount || 0);
                      return sum + debt;
                    }, 0);
                    return totalDebt > 0 ? 'text-red-600' : 'text-green-600';
                  })()
                }`}>
                  {(() => {
                    const totalDebt = invoices.reduce((sum, inv) => {
                      const debt = (inv.total_amount || 0) - (inv.paid_amount || 0);
                      return sum + debt;
                    }, 0);
                    if (totalDebt === 0) return '0 so\'m';
                    return `${totalDebt > 0 ? '-' : '+'}${Math.abs(totalDebt).toLocaleString()} so'm`;
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <div className="flex gap-2 sm:gap-2 sm:gap-3 sm:gap-3 sm:gap-4 px-3 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 min-w-max">
            {[
              { id: 'overview', label: 'Umumiy', icon: 'dashboard' },
              { id: 'treatments', label: 'Muolaja jadvali', icon: 'schedule' },
              { id: 'prescriptions', label: 'Retseptlar', icon: 'medication' },
              { id: 'specialists', label: 'Mutaxasislar', icon: 'medical_information' },
              { id: 'lab', label: 'Tahlillar', icon: 'biotech' },
              { id: 'billing', label: 'Moliya', icon: 'payments' },
              { id: 'admissions', label: 'Yotqizish', icon: 'bed' },
              ...(isReceptionist ? [
                { id: 'queue', label: 'Navbat', icon: 'queue' },
                { id: 'cashier', label: 'Kassa', icon: 'point_of_sale' }
              ] : [])
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 sm:gap-2 sm:gap-3 px-3 sm:px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 sm:py-3 sm:py-4 border-b-2 transition-colors whitespace-nowrap text-sm sm:text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-base sm:text-base sm:text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 sm:p-4 sm:p-4 sm:p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Bemor faoliyati tarixi</h3>
              
              {(() => {
                // Barcha faoliyatlarni birlashtirib, vaqt bo'yicha tartiblash
                const activities = [];
                
                // Invoices
                invoices.forEach(inv => {
                  activities.push({
                    type: 'invoice',
                    date: new Date(inv.created_at),
                    data: inv
                  });
                });
                
                // Admissions
                admissions.forEach(adm => {
                  activities.push({
                    type: 'admission',
                    date: new Date(adm.admission_date),
                    data: adm
                  });
                  if (adm.discharge_date) {
                    activities.push({
                      type: 'discharge',
                      date: new Date(adm.discharge_date),
                      data: adm
                    });
                  }
                });
                
                // Prescriptions
                prescriptions.forEach(presc => {
                  activities.push({
                    type: 'prescription',
                    date: new Date(presc.created_at),
                    data: presc
                  });
                });
                
                // Lab Results
                labResults.forEach(lab => {
                  activities.push({
                    type: 'lab',
                    date: new Date(lab.createdAt || lab.created_at),
                    data: lab
                  });
                });
                
                // Vaqt bo'yicha tartiblash (yangi birinchi)
                activities.sort((a, b) => b.date - a.date);
                
                if (activities.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700 mb-4">
                        history
                      </span>
                      <p className="text-gray-500 dark:text-gray-400">Faoliyat tarixi yo'q</p>
                    </div>
                  );
                }
                
                return (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                    
                    <div className="space-y-4">
                      {activities.map((activity, index) => (
                        <div key={index} className="relative pl-14">
                          {/* Timeline dot */}
                          <div className={`absolute left-4 top-2 w-4 h-4 rounded-full border-4 ${
                            activity.type === 'invoice' ? 'bg-green-500 border-green-200' :
                            activity.type === 'admission' ? 'bg-blue-500 border-blue-200' :
                            activity.type === 'discharge' ? 'bg-purple-500 border-purple-200' :
                            activity.type === 'prescription' ? 'bg-orange-500 border-orange-200' :
                            'bg-pink-500 border-pink-200'
                          }`}></div>
                          
                          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`material-symbols-outlined ${
                                  activity.type === 'invoice' ? 'text-green-600' :
                                  activity.type === 'admission' ? 'text-blue-600' :
                                  activity.type === 'discharge' ? 'text-purple-600' :
                                  activity.type === 'prescription' ? 'text-orange-600' :
                                  'text-pink-600'
                                }`}>
                                  {activity.type === 'invoice' ? 'receipt' :
                                   activity.type === 'admission' ? 'login' :
                                   activity.type === 'discharge' ? 'logout' :
                                   activity.type === 'prescription' ? 'medication' :
                                   'biotech'}
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {activity.type === 'invoice' ? 'To\'lov' :
                                   activity.type === 'admission' ? 'Yotqizildi' :
                                   activity.type === 'discharge' ? 'Chiqarildi' :
                                   activity.type === 'prescription' ? 'Retsept' :
                                   'Tahlil'}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {activity.date.toLocaleString('uz-UZ', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            
                            {/* Activity details */}
                            {activity.type === 'invoice' && (
                              <div className="text-sm">
                                <p className="text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">Summa:</span> {activity.data.total_amount.toLocaleString()} so'm
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">To'langan:</span> {activity.data.paid_amount.toLocaleString()} so'm
                                </p>
                                {activity.data.services && activity.data.services.length > 0 && (
                                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    {activity.data.services.map(s => s.service_name).join(', ')}
                                  </p>
                                )}
                                {activity.data.items && activity.data.items.length > 0 && (
                                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    {activity.data.items.map(i => i.description).join(', ')}
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {activity.type === 'admission' && (
                              <div className="text-sm">
                                <p className="text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">Xona:</span> {activity.data.room_number}, Ko'rpa: {activity.data.bed_number}
                                </p>
                                {activity.data.diagnosis && (
                                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    <span className="font-medium">Tashxis:</span> {activity.data.diagnosis}
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {activity.type === 'discharge' && (
                              <div className="text-sm">
                                <p className="text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">Xona:</span> {activity.data.room_number}, Ko'rpa: {activity.data.bed_number}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">
                                  Yotish muddati: {Math.ceil((new Date(activity.data.discharge_date) - new Date(activity.data.admission_date)) / (1000 * 60 * 60 * 24))} kun
                                </p>
                              </div>
                            )}
                            
                            {activity.type === 'prescription' && (
                              <div className="text-sm">
                                <p className="text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">Shifokor:</span> Dr. {activity.data.doctor_first_name} {activity.data.doctor_last_name}
                                </p>
                                {activity.data.diagnosis && (
                                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    <span className="font-medium">Tashxis:</span> {activity.data.diagnosis}
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {activity.type === 'lab' && (
                              <div className="text-sm">
                                <p className="text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">Tahlil:</span> {activity.data.test_name}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">
                                  <span className="font-medium">Holat:</span> {
                                    activity.data.status === 'completed' ? 'Tayyor' :
                                    activity.data.status === 'pending' ? 'Kutilmoqda' :
                                    'Jarayonda'
                                  }
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Treatment Schedule Tab */}
          {activeTab === 'treatments' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-sm sm:text-base">Kunlik muolaja jadvali</h3>
                <DateInput
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 sm:py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl text-sm sm:text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {!treatmentSchedule ? (
                <div className="text-center py-12">
                  <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Yuklanmoqda...</p>
                </div>
              ) : treatmentSchedule.schedule.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700 mb-4">
                    event_busy
                  </span>
                  <p className="text-gray-500 dark:text-gray-400">Bu kun uchun muolajalar yo'q</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-2 sm:gap-3">
                      <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">info</span>
                      <p className="text-sm sm:text-sm sm:text-base text-blue-800 dark:text-blue-300">
                        Jami: <span className="font-bold">{treatmentSchedule.total_treatments}</span> ta muolaja
                      </p>
                    </div>
                  </div>

                  {treatmentSchedule.schedule.map((timeSlot, index) => (
                    <div key={index} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl overflow-hidden sm:block">
                      <div className="bg-gradient-to-r from-primary to-primary/80 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
                        <div className="flex items-center gap-2 sm:gap-2 sm:gap-3 text-white">
                          <span className="material-symbols-outlined">schedule</span>
                          <span className="font-bold text-base sm:text-lg">{timeSlot.time}</span>
                        </div>
                      </div>
                      
                      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                        {timeSlot.treatments.map((treatment) => (
                          <div key={treatment.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-2 sm:gap-3 mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-base sm:text-base sm:text-lg text-gray-900 dark:text-white break-words">
                                  {treatment.medication_name}
                                </p>
                                <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 break-words">
                                  Dozasi: {treatment.dosage}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
                                treatment.status === 'completed' 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                  : treatment.status === 'missed'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                  : treatment.status === 'cancelled'
                                  ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                              }`}>
                                {treatment.status === 'completed' ? 'Bajarildi' :
                                 treatment.status === 'missed' ? 'O\'tkazildi' :
                                 treatment.status === 'cancelled' ? 'Bekor qilindi' : 'Kutilmoqda'}
                              </span>
                            </div>
                            
                            {treatment.instructions && (
                              <div className="mt-2 text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Ko'rsatma:</span> {treatment.instructions}
                              </div>
                            )}
                            
                            {treatment.nurse && (
                              <div className="mt-2 flex items-center gap-2 sm:gap-2 sm:gap-3 text-sm sm:text-sm sm:text-base">
                                <span className="material-symbols-outlined text-primary text-sm sm:text-base">person</span>
                                <span className="text-gray-700 dark:text-gray-300">
                                  Hamshira: <span className="font-semibold">{treatment.nurse.first_name} {treatment.nurse.last_name}</span>
                                </span>
                                {treatment.nurse.phone && (
                                  <span className="text-gray-500 dark:text-gray-400">
                                    ({formatPhone(treatment.nurse.phone)})
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {treatment.completed_at && (
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Bajarilgan vaqt: {formatDate(treatment.completed_at)}
                              </div>
                            )}
                            
                            {treatment.notes && (
                              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm sm:text-sm sm:text-base text-blue-800 dark:text-blue-300">
                                <span className="font-medium">Izoh:</span> {treatment.notes}
                              </div>
                            )}
                            
                            {treatment.prescription && (
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Retsept: {treatment.prescription.prescription_number}
                                {treatment.prescription.diagnosis && ` - ${treatment.prescription.diagnosis}`}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-sm sm:text-base">Retseptlar</h3>
              </div>

              {prescriptions.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700 mb-4">
                    medication
                  </span>
                  <p className="text-gray-500 dark:text-gray-400">Retseptlar yo'q</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {prescriptions.map((prescription) => (
                    <div key={prescription.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-3 sm:p-4 overflow-hidden sm:block">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-2 sm:gap-3 sm:gap-2 sm:gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm sm:text-sm sm:text-base text-gray-900 dark:text-white break-words">
                            Dr. {prescription.doctor_first_name} {prescription.doctor_last_name}
                          </p>
                          <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-500">
                            {formatDate(prescription.created_at)}
                          </p>
                        </div>
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
                          prescription.prescription_type === 'URGENT' 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        }`}>
                          {prescription.prescription_type === 'URGENT' ? 'Shoshilinch' : 'Oddiy'}
                        </span>
                      </div>
                      
                      <div className="space-y-2 sm:space-y-3">
                        <div>
                          <p className="text-xs sm:text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">Tashxis:</p>
                          <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 break-words">{prescription.diagnosis}</p>
                        </div>
                        
                        {prescription.medications && prescription.medications.length > 0 && (
                          <div>
                            <p className="text-xs sm:text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Dorilar:</p>
                            <div className="space-y-2 sm:space-y-2 sm:space-y-3">
                              {prescription.medications.map((med, index) => (
                                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl p-2 sm:p-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-sm sm:text-sm sm:text-base text-gray-900 dark:text-white break-words">
                                        {med.medication_name}
                                        {med.is_urgent && (
                                          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded text-xs">
                                            Shoshilinch
                                          </span>
                                        )}
                                      </p>
                                      
                                      {/* Shoshilinch retseptda faqat dori nomi */}
                                      {prescription.prescription_type === 'URGENT' ? (
                                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 italic break-words">
                                          Shoshilinch retsept - batafsil ma'lumotlar shifokor tomonidan og'zaki beriladi
                                        </p>
                                      ) : (
                                        /* Oddiy retseptda to'liq ma'lumotlar */
                                        <div className="mt-1 text-xs sm:text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 space-y-1">
                                          {med.dosage && (
                                            <p className="break-words"><span className="font-medium">Dozasi:</span> {med.dosage}</p>
                                          )}
                                          {med.frequency && (
                                            <p className="break-words"><span className="font-medium">Qabul qilish:</span> {med.frequency}</p>
                                          )}
                                          {med.duration_days && (
                                            <p><span className="font-medium">Davomiyligi:</span> {med.duration_days} kun</p>
                                          )}
                                          {med.instructions && (
                                            <p className="break-words"><span className="font-medium">Ko'rsatma:</span> {med.instructions}</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {prescription.notes && (
                          <div>
                            <p className="text-xs sm:text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">Qo'shimcha izohlar:</p>
                            <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 break-words">{prescription.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mutaxasislar Tab */}
          {activeTab === 'specialists' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg sm:text-lg sm:text-xl font-bold">Biriktirilgan mutaxasislar</h3>
              </div>

              {assignedSpecialists.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-xl">
                  <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">person_off</span>
                  <p className="text-gray-500 dark:text-gray-400">Hali mutaxasis biriktirilmagan</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {assignedSpecialists.map((specialist) => (
                    <div key={specialist.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl p-3 sm:p-4 sm:p-4 sm:p-6 hover:shadow-lg transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 sm:gap-3 mb-3">
                            <div className="size-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl sm:text-2xl">person</span>
                            </div>
                            <div>
                              <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{specialist.doctor_name}</h4>
                              <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">{specialist.specialist_type_label || specialist.specialist_type}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-4">
                            <div className="flex items-center gap-2 sm:gap-2 sm:gap-3 text-sm sm:text-sm sm:text-base">
                              <span className="material-symbols-outlined text-gray-400">schedule</span>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">Kelish vaqti</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {new Date(specialist.appointment_time).toLocaleString('uz-UZ')}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 sm:gap-2 sm:gap-3 text-sm sm:text-sm sm:text-base">
                              <span className="material-symbols-outlined text-gray-400">payments</span>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">Narx</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {specialist.price?.toLocaleString()} so'm
                                </p>
                              </div>
                            </div>
                            
                            {specialist.notes && (
                              <div className="sm:col-span-2 flex items-start gap-2 sm:gap-2 sm:gap-3 text-sm sm:text-sm sm:text-base">
                                <span className="material-symbols-outlined text-gray-400">notes</span>
                                <div>
                                  <p className="text-gray-500 dark:text-gray-400 text-xs">Izoh</p>
                                  <p className="text-gray-700 dark:text-gray-300">{specialist.notes}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex sm:flex-col items-center gap-2 sm:gap-2 sm:gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            specialist.status === 'completed' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : specialist.status === 'cancelled'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {specialist.status === 'completed' ? 'Bajarildi' : 
                             specialist.status === 'cancelled' ? 'Bekor qilindi' : 
                             'Rejalashtirilgan'}
                          </span>
                          
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(specialist.created_at).toLocaleDateString('uz-UZ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lab Orders Tab */}
          {activeTab === 'lab' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-sm sm:text-base">Tahlil natijalari</h3>
              </div>

              {labResults.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700 mb-4">
                    biotech
                  </span>
                  <p className="text-gray-500 dark:text-gray-400">Tahlil natijalari yo'q</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {labResults.map((result) => (
                    <div key={result.result_id} className="bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-3 sm:p-4 border border-gray-200 dark:border-gray-700 overflow-hidden sm:block">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-2 sm:gap-3 mb-2">
                            <p className="font-semibold text-sm sm:text-sm sm:text-base text-gray-900 dark:text-white break-words">
                              {result.test_name}
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                              result.is_normal === true ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                              result.is_normal === false ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                              'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                            }`}>
                              {result.is_normal === true ? 'Normal' :
                               result.is_normal === false ? 'Normaldan tashqari' :
                               'Baholash kerak'}
                            </span>
                            {result.status === 'approved' && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 rounded-full text-xs font-semibold whitespace-nowrap">
                                Tasdiqlangan
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-1 text-xs sm:text-sm sm:text-sm sm:text-base">
                            {result.test_code && (
                              <p className="text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Kod:</span> {result.test_code}
                              </p>
                            )}
                            {result.result_value && (
                              <p className="text-gray-900 dark:text-white font-semibold">
                                <span className="font-medium text-gray-600 dark:text-gray-400">Natija:</span> {result.result_value} {result.unit}
                                {result.normal_value_min && result.normal_value_max && (
                                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                                    (Normal: {result.normal_value_min} - {result.normal_value_max} {result.unit})
                                  </span>
                                )}
                              </p>
                            )}
                            {result.result_text && (
                              <p className="text-gray-700 dark:text-gray-300 break-words">
                                <span className="font-medium text-gray-600 dark:text-gray-400">Izoh:</span> {result.result_text}
                              </p>
                            )}
                            {result.technician_first_name && (
                              <p className="text-gray-600 dark:text-gray-400 break-words">
                                <span className="font-medium">Laborant:</span> {result.technician_first_name} {result.technician_last_name}
                              </p>
                            )}
                            <p className="text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Sana:</span> {formatDate(result.result_date)}
                            </p>
                            {result.approved_at && result.approved_by_first_name && (
                              <p className="text-gray-600 dark:text-gray-400 break-words">
                                <span className="font-medium">Tasdiqlagan:</span> {result.approved_by_first_name} {result.approved_by_last_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-sm sm:text-base">Moliyaviy ma'lumotlar</h3>
                <div className="text-left sm:text-right">
                  <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-500 dark:text-gray-400">
                    {(() => {
                      const totalDebt = invoices.reduce((sum, inv) => {
                        const debt = (inv.total_amount || 0) - (inv.paid_amount || 0);
                        return sum + debt;
                      }, 0);
                      return totalDebt > 0 ? 'Joriy qarz' : 'Joriy balans';
                    })()}
                  </p>
                  <p className={`text-xl sm:text-xl sm:text-2xl font-bold ${
                    (() => {
                      const totalDebt = invoices.reduce((sum, inv) => {
                        const debt = (inv.total_amount || 0) - (inv.paid_amount || 0);
                        return sum + debt;
                      }, 0);
                      return totalDebt > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white';
                    })()
                  }`}>
                    {(() => {
                      const totalDebt = invoices.reduce((sum, inv) => {
                        const debt = (inv.total_amount || 0) - (inv.paid_amount || 0);
                        return sum + debt;
                      }, 0);
                      if (totalDebt === 0) return '0 so\'m';
                      return `${totalDebt > 0 ? '-' : '+'}${Math.abs(totalDebt).toLocaleString()} so'm`;
                    })()}
                  </p>
                </div>
              </div>
              
              {invoices.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700 mb-4">
                    receipt_long
                  </span>
                  <p className="text-gray-500 dark:text-gray-400">Hisob-fakturalar yo'q</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {invoices.map((invoice) => {
                    // Xizmat nomlarini olish
                    const getServiceNames = () => {
                      const names = [];
                      
                      // Services array'dan
                      if (invoice.services && Array.isArray(invoice.services) && invoice.services.length > 0) {
                        names.push(...invoice.services.map(s => s.service_name || s.description).filter(Boolean));
                      }
                      
                      // Items array'dan
                      if (invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0) {
                        names.push(...invoice.items.map(i => i.description || i.service_name).filter(Boolean));
                      }
                      
                      // Metadata'dan (mutaxasis uchun)
                      if (invoice.metadata && invoice.metadata.specialist_type) {
                        names.push(`${invoice.metadata.specialist_type} - ${invoice.metadata.doctor_name || 'Mutaxasis'}`);
                      }
                      
                      // Notes'dan
                      if (names.length === 0 && invoice.notes) {
                        return invoice.notes;
                      }
                      
                      // Agar hech narsa topilmasa, umumiy tavsif
                      if (names.length === 0) {
                        // Invoice raqamidan xizmat turini aniqlashga harakat qilish
                        if (invoice.total_amount === 200000) {
                          return 'Koyka to\'lovi';
                        } else if (invoice.total_amount === 400000) {
                          return 'Konsultatsiya';
                        } else if (invoice.total_amount === 90000) {
                          return 'Tahlil';
                        }
                        return 'Tibbiy xizmat';
                      }
                      
                      return names.join(', ');
                    };
                    
                    return (
                      <div key={invoice.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-start gap-2 sm:gap-2 sm:gap-3 mb-2">
                              <p className="font-semibold text-gray-900 dark:text-white break-words flex-1">
                                {getServiceNames()}
                              </p>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
                                invoice.payment_status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                invoice.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                              }`}>
                                {invoice.payment_status === 'paid' ? 'To\'langan' :
                                 invoice.payment_status === 'partial' ? 'Qisman' :
                                 'To\'lanmagan'}
                              </span>
                            </div>
                            
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Sana: {formatDate(invoice.created_at)}
                            </p>
                          </div>
                          
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-base sm:text-lg text-gray-900 dark:text-white whitespace-nowrap">
                              {(invoice.total_amount || 0).toLocaleString()} so'm
                            </p>
                            {invoice.paid_amount > 0 && invoice.payment_status !== 'paid' && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                To'langan: {(invoice.paid_amount || 0).toLocaleString()} so'm
                              </p>
                            )}
                            {invoice.payment_status !== 'paid' && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">
                                Qarz: {((invoice.total_amount || 0) - (invoice.paid_amount || 0)).toLocaleString()} so'm
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Admissions Tab */}
          {activeTab === 'admissions' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white">Yotqizish tarixi</h3>
                <span className="text-sm sm:text-sm sm:text-base text-gray-500 dark:text-gray-400">
                  Jami: {admissions.length}
                </span>
              </div>
              
              {admissions.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700 mb-4">
                    bed
                  </span>
                  <p className="text-gray-500 dark:text-gray-400">Yotqizish tarixi yo'q</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {admissions.map((admission) => (
                    <div key={admission.id} className={`rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 ${
                      admission.display_status === 'ACTIVE' 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-700' 
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 sm:gap-2 sm:gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              admission.display_status === 'ACTIVE' 
                                ? 'bg-green-600 text-white' 
                                : admission.display_status === 'DISCHARGED'
                                ? 'bg-gray-500 text-white'
                                : 'bg-green-500 text-white'
                            }`}>
                              {admission.display_status === 'ACTIVE' ? '🛏️ Hozir yotmoqda' :
                               admission.display_status === 'DISCHARGED' ? 'Chiqarilgan' :
                               admission.display_status}
                            </span>
                            {admission.admission_type === 'EMERGENCY' && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-full text-xs font-semibold">
                                Shoshilinch
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-2 sm:space-y-2 sm:space-y-3">
                            <div className="flex items-center gap-2 sm:gap-2 sm:gap-3">
                              <span className="material-symbols-outlined text-primary text-lg sm:text-xl">bed</span>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  Xona {admission.room_number}, Ko'yka {admission.bed_number}
                                </p>
                                {admission.room_name && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {admission.room_name}
                                  </p>
                                )}
                                {admission.floor_number && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {admission.floor_number}-qavat
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm sm:text-sm sm:text-base">
                              <div>
                                <p className="text-gray-500 dark:text-gray-400">Yotqizilgan sana:</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {formatDate(admission.admission_date)}
                                </p>
                              </div>
                              {admission.discharge_date && (
                                <div>
                                  <p className="text-gray-500 dark:text-gray-400">Chiqarilgan sana:</p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {formatDate(admission.discharge_date)}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {admission.diagnosis && (
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Tashxis:</p>
                                <p className="text-sm sm:text-sm sm:text-base text-gray-900 dark:text-white">{admission.diagnosis}</p>
                              </div>
                            )}
                            
                            {admission.admission_reason && (
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Yotqizish sababi:</p>
                                <p className="text-sm sm:text-sm sm:text-base text-gray-900 dark:text-white">{admission.admission_reason}</p>
                              </div>
                            )}
                            
                            {admission.doctor_first_name && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Davolovchi shifokor:</p>
                                <p className="text-sm sm:text-sm sm:text-base text-gray-900 dark:text-white">
                                  Dr. {admission.doctor_first_name} {admission.doctor_last_name}
                                </p>
                              </div>
                            )}
                            
                            {admission.nurse_first_name && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Biriktirilgan hamshira:</p>
                                <div className="flex items-center gap-2 sm:gap-2 sm:gap-3">
                                  <span className="material-symbols-outlined text-blue-500 text-base sm:text-lg">medical_services</span>
                                  <div>
                                    <p className="text-sm sm:text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                                      {admission.nurse_first_name} {admission.nurse_last_name}
                                    </p>
                                    {admission.nurse_phone && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatPhone(admission.nurse_phone)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {admission.notes && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Izoh:</p>
                                <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">{admission.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {admission.display_status === 'ACTIVE' && (
                          <div className="ml-4">
                            <div className="size-16 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                              <span className="material-symbols-outlined text-white text-2xl sm:text-3xl">bed</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Queue Tab */}
          {activeTab === 'queue' && isReceptionist && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <h3 className="font-bold text-gray-900 dark:text-white">Navbat</h3>
                <button
                  onClick={() => { setShowAddQueueModal(true); loadDoctors(); }}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">add</span>
                  Navbatga qo'shish
                </button>
              </div>

              {/* Bugungi navbat */}
              {(() => {
                const today = new Date().toISOString().split('T')[0];
                const todayQueue = queueData.filter(q => q.created_at?.startsWith(today));
                const historyQueue = queueData.filter(q => !q.created_at?.startsWith(today)).slice(0, 10);

                return (
                  <>
                    {todayQueue.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Bugungi navbat</h4>
                        <div className="space-y-2">
                          {todayQueue.map(q => (
                            <div key={q.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border ${
                              q.status === 'WAITING' ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800' :
                              q.status === 'IN_PROGRESS' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' :
                              q.status === 'COMPLETED' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' :
                              'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                            }`}>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-lg text-gray-900 dark:text-white">#{q.queue_number}</span>
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                    Dr. {q.doctor_first_name} {q.doctor_last_name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(q.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  q.status === 'WAITING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                  q.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                                  q.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                  'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                }`}>
                                  {q.status === 'WAITING' ? 'Kutmoqda' :
                                   q.status === 'IN_PROGRESS' ? 'Qabulda' :
                                   q.status === 'COMPLETED' ? 'Yakunlandi' :
                                   'Bekor qilingan'}
                                </span>
                                {q.queue_type === 'URGENT' && (
                                  <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-full text-xs font-semibold">Shoshilinch</span>
                                )}
                              </div>
                              {q.status === 'WAITING' && (
                                <button
                                  onClick={() => handleCancelQueue(q.id)}
                                  className="mt-2 sm:mt-0 px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm font-semibold hover:bg-red-200"
                                >
                                  Bekor qilish
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {todayQueue.length === 0 && (
                      <div className="text-center py-8">
                        <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-700 mb-3">queue</span>
                        <p className="text-gray-500 dark:text-gray-400">Bugun navbat yo'q</p>
                      </div>
                    )}

                    {historyQueue.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 mt-4">Navbat tarixi</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                                <th className="pb-2 font-semibold">#</th>
                                <th className="pb-2 font-semibold">Shifokor</th>
                                <th className="pb-2 font-semibold">Holat</th>
                                <th className="pb-2 font-semibold">Sana</th>
                              </tr>
                            </thead>
                            <tbody>
                              {historyQueue.map(q => (
                                <tr key={q.id} className="border-b dark:border-gray-700">
                                  <td className="py-2 font-semibold text-gray-900 dark:text-white">{q.queue_number}</td>
                                  <td className="py-2 text-gray-700 dark:text-gray-300">Dr. {q.doctor_first_name} {q.doctor_last_name}</td>
                                  <td className="py-2">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                      q.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                      'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                    }`}>
                                      {q.status === 'COMPLETED' ? 'Yakunlandi' : 'Bekor qilingan'}
                                    </span>
                                  </td>
                                  <td className="py-2 text-gray-500 dark:text-gray-400">{formatDate(q.created_at)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Cashier Tab */}
          {activeTab === 'cashier' && isReceptionist && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Kassa</h3>
                  {(() => {
                    const totalDebt = invoices.reduce((sum, inv) => sum + ((inv.total_amount || 0) - (inv.paid_amount || 0)), 0);
                    return totalDebt > 0 ? (
                      <p className="text-red-600 font-bold text-lg">Qarz: {totalDebt.toLocaleString()} so'm</p>
                    ) : (
                      <p className="text-green-600 font-semibold">Qarz yo'q</p>
                    );
                  })()}
                </div>
                <button
                  onClick={() => { setShowNewInvoiceModal(true); loadServices(); loadDoctors(); }}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">add</span>
                  Yangi faktura
                </button>
              </div>

              {/* To'lanmagan fakturalar */}
              {(() => {
                const unpaid = invoices.filter(inv => inv.payment_status !== 'paid');
                const paid = invoices.filter(inv => inv.payment_status === 'paid');

                return (
                  <>
                    {unpaid.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">To'lanmagan fakturalar ({unpaid.length})</h4>
                        <div className="space-y-2">
                          {unpaid.map(invoice => {
                            const debt = (invoice.total_amount || 0) - (invoice.paid_amount || 0);
                            const serviceNames = invoice.services?.map(s => s.service_name).join(', ') ||
                                                 invoice.items?.map(i => i.description).join(', ') ||
                                                 'Tibbiy xizmat';
                            return (
                              <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{invoice.invoice_number}</p>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                      invoice.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                      {invoice.payment_status === 'partial' ? 'Qisman' : 'To\'lanmagan'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{serviceNames}</p>
                                  <div className="flex gap-3 text-xs mt-1">
                                    <span className="text-gray-500">Summa: {(invoice.total_amount || 0).toLocaleString()}</span>
                                    {invoice.paid_amount > 0 && <span className="text-green-600">To'langan: {(invoice.paid_amount || 0).toLocaleString()}</span>}
                                    <span className="text-red-600 font-bold">Qarz: {debt.toLocaleString()}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => openPaymentModal(invoice)}
                                  className="mt-2 sm:mt-0 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:opacity-90 flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-base">payments</span>
                                  To'lov
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {unpaid.length === 0 && (
                      <div className="text-center py-6 bg-green-50 dark:bg-green-900/10 rounded-lg">
                        <span className="material-symbols-outlined text-4xl text-green-500 mb-2">check_circle</span>
                        <p className="text-green-700 dark:text-green-400 font-semibold">Barcha fakturalar to'langan</p>
                      </div>
                    )}

                    {paid.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 mt-4">To'langan fakturalar ({paid.length})</h4>
                        <div className="space-y-2">
                          {paid.slice(0, 10).map(invoice => {
                            const serviceNames = invoice.services?.map(s => s.service_name).join(', ') ||
                                                 invoice.items?.map(i => i.description).join(', ') ||
                                                 'Tibbiy xizmat';
                            return (
                              <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{invoice.invoice_number}</p>
                                  <p className="text-xs text-gray-500 truncate">{serviceNames}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-gray-900 dark:text-white">{(invoice.total_amount || 0).toLocaleString()} so'm</p>
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-full text-xs font-semibold">To'langan</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && patient && (
        <PatientQRModal
          patient={patient}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {/* Add Medical Record Modal */}
      <Modal isOpen={showAddRecordModal} onClose={() => setShowAddRecordModal(false)}>
        <form onSubmit={handleAddMedicalRecord} className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Yangi tibbiy yozuv</h2>
          
          <div>
            <label className="block text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Tashxis <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={recordForm.diagnosis_text}
              onChange={(e) => setRecordForm({ ...recordForm, diagnosis_text: e.target.value })}
              rows="3"
              className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Tashxisni kiriting..."
            />
          </div>

          <div>
            <label className="block text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Davolash rejasi
            </label>
            <textarea
              value={recordForm.treatment_plan}
              onChange={(e) => setRecordForm({ ...recordForm, treatment_plan: e.target.value })}
              rows="3"
              className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Davolash rejasini kiriting..."
            />
          </div>

          <div>
            <label className="block text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Qo'shimcha izohlar
            </label>
            <textarea
              value={recordForm.notes}
              onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
              rows="2"
              className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Izohlar..."
            />
          </div>

          <div className="flex gap-2 sm:gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddRecordModal(false)}
              className="flex-1 px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg sm:rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="flex-1 px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-primary text-white rounded-lg sm:rounded-xl font-semibold hover:opacity-90"
            >
              Saqlash
            </button>
          </div>
        </form>
      </Modal>

      {/* Add to Queue Modal */}
      <Modal isOpen={showAddQueueModal} onClose={() => setShowAddQueueModal(false)}>
        <form onSubmit={handleAddToQueue} className="space-y-4">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Navbatga qo'shish</h2>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Shifokorni tanlang <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={queueForm.doctor_id}
              onChange={(e) => setQueueForm({ ...queueForm, doctor_id: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Shifokorni tanlang</option>
              {doctors.map(doc => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.first_name} {doc.last_name} - {doc.specialization}
                  {doc.waiting_count > 0 ? ` (${doc.waiting_count} kutmoqda)` : ' (Bo\'sh)'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Navbat turi</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setQueueForm({ ...queueForm, queue_type: 'NORMAL' })}
                className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                  queueForm.queue_type === 'NORMAL' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                Oddiy
              </button>
              <button
                type="button"
                onClick={() => setQueueForm({ ...queueForm, queue_type: 'URGENT' })}
                className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                  queueForm.queue_type === 'URGENT' ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                Shoshilinch
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Izoh</label>
            <textarea
              value={queueForm.notes}
              onChange={(e) => setQueueForm({ ...queueForm, notes: e.target.value })}
              rows="2"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Qo'shimcha izoh..."
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowAddQueueModal(false)}
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-200">
              Bekor qilish
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50">
              {submitting ? 'Yuklanmoqda...' : 'Qo\'shish'}
            </button>
          </div>
        </form>
      </Modal>

      {/* New Invoice Modal */}
      <Modal isOpen={showNewInvoiceModal} onClose={() => setShowNewInvoiceModal(false)}>
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Yangi faktura</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Shifokor (ixtiyoriy)</label>
            <select
              value={invoiceDoctor}
              onChange={(e) => setInvoiceDoctor(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Tanlang...</option>
              {doctors.map(doc => (
                <option key={doc.id} value={doc.id}>Dr. {doc.first_name} {doc.last_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Xizmatlar</label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {Object.entries(groupServicesByCategory()).map(([category, categoryServices]) => (
                <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button type="button"
                    onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                    className="w-full p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
                  >
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{categoryServices.length}</span>
                      <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-base">
                        {expandedCategories[category] ? 'expand_less' : 'expand_more'}
                      </span>
                    </div>
                  </button>
                  {expandedCategories[category] && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 bg-white dark:bg-gray-900">
                      {categoryServices.map(service => (
                        <button type="button" key={service._id || service.id}
                          onClick={() => addServiceToInvoice(service)}
                          className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <p className="font-semibold text-gray-900 dark:text-white text-xs">{service.name}</p>
                          <p className="text-primary font-bold text-sm mt-0.5">{(service.price || 0).toLocaleString()} so'm</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {invoiceItems.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tanlangan xizmatlar</label>
              <div className="space-y-1.5">
                {invoiceItems.map(item => (
                  <div key={item.service_id} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.description}</p>
                      <p className="text-xs text-gray-500">{item.quantity} x {item.unit_price.toLocaleString()} so'm</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{(item.unit_price * item.quantity).toLocaleString()}</span>
                      <button type="button" onClick={() => removeServiceFromInvoice(item.service_id)}
                        className="text-red-500 hover:text-red-700">
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Chegirma (%)</label>
            <input type="number" min="0" max="100" value={invoiceDiscount}
              onChange={(e) => setInvoiceDiscount(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {invoiceItems.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-right">
              <p className="text-2xl font-black text-primary">{getInvoiceTotal().toLocaleString()} so'm</p>
              {invoiceDiscount > 0 && <p className="text-xs text-gray-500">Chegirma: {invoiceDiscount}%</p>}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => { setShowNewInvoiceModal(false); setInvoiceItems([]); setInvoiceDiscount(0); }}
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-200">
              Bekor qilish
            </button>
            <button type="submit" disabled={submitting || invoiceItems.length === 0}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50">
              {submitting ? 'Yuklanmoqda...' : 'Faktura yaratish'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">To'lov qilish</h2>
          {selectedInvoiceForPayment && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-500">Faktura: <span className="font-semibold text-gray-900 dark:text-white">{selectedInvoiceForPayment.invoice_number}</span></p>
              <p className="text-sm text-gray-500">Qarz: <span className="font-bold text-red-600">{((selectedInvoiceForPayment.total_amount || 0) - (selectedInvoiceForPayment.paid_amount || 0)).toLocaleString()} so'm</span></p>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">To'lov summasi</label>
            <input type="number" value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Summa kiriting"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">To'lov usuli</label>
            <div className="flex gap-2">
              {[
                { value: 'cash', label: 'Naqd', icon: 'payments' },
                { value: 'card', label: 'Karta', icon: 'credit_card' },
                { value: 'transfer', label: "O'tkazma", icon: 'swap_horiz' }
              ].map(method => (
                <button key={method.value} type="button"
                  onClick={() => setPaymentForm({ ...paymentForm, method: method.value })}
                  className={`flex-1 px-3 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1 text-sm ${
                    paymentForm.method === method.value ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{method.icon}</span>
                  {method.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Izoh</label>
            <textarea value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              rows="2"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Izoh..."
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowPaymentModal(false)}
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-200">
              Bekor qilish
            </button>
            <button type="button" onClick={handleProcessPayment} disabled={submitting || !paymentForm.amount}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50">
              {submitting ? 'Yuklanmoqda...' : 'To\'lov qilish'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Admission Modal */}
      <Modal isOpen={showAdmissionModal} onClose={() => setShowAdmissionModal(false)} size="md">
        <div className="space-y-4">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Yotqizish</h2>

          {/* Department toggle */}
          <div className="flex gap-2">
            {[{ key: 'ambulator', label: 'Ambulatoriya' }, { key: 'inpatient', label: 'Statsionar' }].map(d => (
              <button
                key={d.key}
                onClick={() => { setAdmissionDepartment(d.key); loadAdmissionRooms(d.key) }}
                className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                  admissionDepartment === d.key
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Room select */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Xona</label>
            <select
              value={selectedRoom}
              onChange={(e) => { setSelectedRoom(e.target.value); setSelectedBed('') }}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Xona tanlang</option>
              {admissionRooms.map(room => {
                const roomId = room._id || room.id
                const availableBeds = (room.beds || []).filter(b => (b.status || b.bed_status) === 'available').length
                return (
                  <option key={roomId} value={roomId} disabled={availableBeds === 0}>
                    {room.room_number} - {room.room_type} ({availableBeds} bo'sh joy)
                  </option>
                )
              })}
            </select>
          </div>

          {/* Bed select */}
          {selectedRoom && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Koyka</label>
              <select
                value={selectedBed}
                onChange={(e) => setSelectedBed(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Koyka tanlang</option>
                {(admissionRooms.find(r => (r._id || r.id) === selectedRoom)?.beds || [])
                  .filter(b => (b.status || b.bed_status) === 'available')
                  .map(bed => (
                    <option key={bed._id || bed.id || bed.bed_number} value={bed.bed_number}>
                      Koyka #{bed.bed_number}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Diagnosis */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tashxis</label>
            <textarea
              value={admissionForm.diagnosis}
              onChange={(e) => setAdmissionForm({ ...admissionForm, diagnosis: e.target.value })}
              rows="2"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Tashxis..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Izoh</label>
            <textarea
              value={admissionForm.notes}
              onChange={(e) => setAdmissionForm({ ...admissionForm, notes: e.target.value })}
              rows="2"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Izoh..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAdmissionModal(false)}
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-200"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleCreateAdmission}
              disabled={admissionLoading || !selectedRoom || !selectedBed}
              className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {admissionLoading ? 'Yuklanmoqda...' : 'Yotqizish'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Prescription Modal */}
      {patient && (
        <PrescriptionModal
          isOpen={showPrescriptionModal}
          onClose={() => setShowPrescriptionModal(false)}
          patient={patient}
          onSuccess={() => { setShowPrescriptionModal(false); loadPatientData(); }}
          user={user}
        />
      )}

      {/* Nurse Task Modal */}
      <Modal isOpen={showNurseModal} onClose={() => setShowNurseModal(false)} size="md">
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4 dark:text-white">Hamshiraga topshiriq</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Hamshira</label>
              <select
                value={selectedNurse}
                onChange={(e) => setSelectedNurse(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Tanlang...</option>
                {nurses.map(n => (
                  <option key={n._id} value={n._id}>
                    {n.first_name} {n.last_name} {n.workload !== undefined ? `(${n.workload} ta vazifa)` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Topshiriq turi</label>
              <select
                value={nurseTaskData.task_type}
                onChange={(e) => setNurseTaskData({ ...nurseTaskData, task_type: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="medication_administration">Dori berish</option>
                <option value="patient_care">Bemor parvarishi</option>
                <option value="vital_signs">Vital belgilar</option>
                <option value="specimen_collection">Namuna olish</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Dori nomi</label>
                <input
                  type="text"
                  value={nurseTaskData.medication_name}
                  onChange={(e) => setNurseTaskData({ ...nurseTaskData, medication_name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Dori nomi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Dozasi</label>
                <input
                  type="text"
                  value={nurseTaskData.dosage}
                  onChange={(e) => setNurseTaskData({ ...nurseTaskData, dosage: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Masalan: 500mg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Yo'l</label>
                <select
                  value={nurseTaskData.route}
                  onChange={(e) => setNurseTaskData({ ...nurseTaskData, route: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="oral">Og'iz orqali</option>
                  <option value="iv">Vena ichiga (IV)</option>
                  <option value="im">Mushak ichiga (IM)</option>
                  <option value="sc">Teri ostiga (SC)</option>
                  <option value="topical">Tashqi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Muhimlik</label>
                <select
                  value={nurseTaskData.priority}
                  onChange={(e) => setNurseTaskData({ ...nurseTaskData, priority: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="normal">Oddiy</option>
                  <option value="urgent">Shoshilinch</option>
                  <option value="stat">STAT</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Ko'rsatmalar</label>
              <textarea
                value={nurseTaskData.instructions}
                onChange={(e) => setNurseTaskData({ ...nurseTaskData, instructions: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={2}
                placeholder="Qo'shimcha ko'rsatmalar..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowNurseModal(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleAssignToNurse}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:opacity-90"
            >
              Topshiriq yuborish
            </button>
          </div>
        </div>
      </Modal>

      {/* Lab Order Modal */}
      <Modal isOpen={showLabOrderModal} onClose={() => setShowLabOrderModal(false)} size="md">
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4 dark:text-white">Tahlil buyurtma qilish</h3>
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
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:opacity-90"
            >
              Buyurtma berish
            </button>
          </div>
        </div>
      </Modal>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
};

export default PatientProfile;


import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import ambulatorInpatientService from '../services/ambulatorInpatientService';
import patientService from '../services/patientService';
import toast, { Toaster } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import Modal from '../components/Modal';

export default function AmbulatorInpatient() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Role checking - hamshira faqat ko'radi
  const userRole = user?.role?.name || user?.role_name;
  const isNurse = userRole?.toLowerCase() === 'hamshira' || userRole?.toLowerCase() === 'nurse';
  const isReadOnly = isNurse; // Hamshira faqat ko'radi
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('map');
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [visualMap, setVisualMap] = useState({ floors: {}, total_beds: 0 });
  const [stats, setStats] = useState({});
  const [rooms, setRooms] = useState([]);
  
  // Xona modali
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomForm, setRoomForm] = useState({
    room_number: '',
    floor_number: 1,
    room_type: 'standard',
    hourly_rate: 50000,
    bed_count: 2
  });
  
  // Bemor yotqizish modali
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [admissionForm, setAdmissionForm] = useState({
    patient_id: '',
    admission_type: 'observation',
    admission_reason: '',
    admission_notes: ''
  });
  
  // To'lov modali
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_method: 'cash',
    payment_notes: ''
  });
  
  // Tasdiqlash modali
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: null 
  });

  const showConfirm = (message, onConfirm, options = {}) => {
    setConfirmModal({ 
      isOpen: true, 
      title: options.title || t('queue.confirm'),
      message, 
      onConfirm,
      type: options.type || 'warning',
      confirmText: options.confirmText || t('queue.confirm'),
      cancelText: options.cancelText || t('queue.cancel')
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadFloorData();
    }
  }, [selectedFloor]);

  const loadFloorData = async () => {
    try {
      const [mapData, roomsData] = await Promise.all([
        ambulatorInpatientService.getVisualMap(selectedFloor),
        ambulatorInpatientService.getRooms(selectedFloor)
      ]);
      
      if (mapData.success) setVisualMap(mapData.data);
      if (roomsData.success) setRooms(roomsData.data);
    } catch (error) {
      console.error('Load floor data error:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [mapData, statsData, roomsData, patientsData] = await Promise.all([
        ambulatorInpatientService.getVisualMap(selectedFloor),
        ambulatorInpatientService.getStats(),
        ambulatorInpatientService.getRooms(selectedFloor),
        patientService.getPatients()
      ]);
      
      if (mapData.success) setVisualMap(mapData.data);
      if (statsData.success) setStats(statsData.data);
      if (roomsData.success) setRooms(roomsData.data);
      if (patientsData.success) setPatients(patientsData.data);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Xatolik: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Avtomatik chiqarish (1 soat o'tganlarni)
  const handleAutoDischarge = async () => {
    try {
      const response = await ambulatorInpatientService.autoDischarge();
      if (response.success) {
        toast.success('Avtomatik chiqarish bajarildi');
        loadData();
      }
    } catch (error) {
      toast.error('Xatolik: ' + (error.response?.data?.message || error.message));
    }
  };

  // Xona yaratish/tahrirlash
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    
    try {
      if (editingRoom) {
        const result = await ambulatorInpatientService.updateRoom(editingRoom.id, roomForm);
        if (result.success) {
          toast.success('Xona yangilandi!');
          setShowRoomModal(false);
          setEditingRoom(null);
          resetRoomForm();
          loadData();
        }
      } else {
        const result = await ambulatorInpatientService.createRoom({
          ...roomForm,
          floor_number: selectedFloor
        });
        if (result.success) {
          toast.success('Xona yaratildi!');
          setShowRoomModal(false);
          resetRoomForm();
          loadData();
        }
      }
    } catch (error) {
      toast.error('Xatolik: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetRoomForm = () => {
    setRoomForm({
      room_number: '',
      floor_number: selectedFloor,
      room_type: 'standard',
      hourly_rate: 50000,
      bed_count: 2
    });
  };

  // Xonani o'chirish
  const handleDeleteRoom = (roomId) => {
    showConfirm(
      'Xonani o\'chirishni tasdiqlaysizmi? Barcha koykalar ham o\'chiriladi.',
      async () => {
        try {
          const result = await ambulatorInpatientService.deleteRoom(roomId);
          if (result.success) {
            toast.success('Xona o\'chirildi!');
            loadData();
          }
        } catch (error) {
          toast.error('Xatolik: ' + (error.response?.data?.message || error.message));
        }
      },
      { type: 'danger', title: 'Xonani o\'chirish' }
    );
  };

  // Bemor yotqizish
  const handleAdmitPatient = async (e) => {
    e.preventDefault();
    
    if (!admissionForm.patient_id) {
      toast.error('Bemorni tanlang');
      return;
    }
    
    try {
      const result = await ambulatorInpatientService.createAdmission({
        ...admissionForm,
        bed_id: selectedBed.id
      });
      
      if (result.success) {
        toast.success('Bemor yotqizildi! 1 soatdan keyin avtomatik chiqariladi.');
        setShowAdmissionModal(false);
        resetAdmissionForm();
        loadData();
      }
    } catch (error) {
      toast.error('Xatolik: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetAdmissionForm = () => {
    setAdmissionForm({
      patient_id: '',
      admission_type: 'observation',
      admission_reason: '',
      admission_notes: ''
    });
    setPatientSearch('');
    setFilteredPatients([]);
  };

  // Bemorni chiqarish
  const handleDischargePatient = (bed) => {
    showConfirm(
      'Bemorni chiqarishni tasdiqlaysizmi?',
      async () => {
        try {
          const result = await ambulatorInpatientService.dischargePatient(bed.admission_id, {
            discharge_type: 'normal',
            discharge_notes: ''
          });
          
          if (result.success) {
            toast.success('Bemor chiqarildi!');
            loadData();
          }
        } catch (error) {
          toast.error('Xatolik: ' + (error.response?.data?.message || error.message));
        }
      },
      { type: 'warning', title: 'Bemorni chiqarish' }
    );
  };

  // To'lov qo'shish
  const handleAddPayment = async (e) => {
    e.preventDefault();
    
    try {
      const result = await ambulatorInpatientService.addPayment({
        ...paymentForm,
        admission_id: selectedAdmission.id
      });
      
      if (result.success) {
        toast.success('To\'lov qo\'shildi! Endi bepul.');
        setShowPaymentModal(false);
        resetPaymentForm();
        loadData();
      }
    } catch (error) {
      toast.error('Xatolik: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      amount: 0,
      payment_method: 'cash',
      payment_notes: ''
    });
  };

  // Koyka statusini o'zgartirish
  const handleChangeBedStatus = async (bedId, newStatus) => {
    try {
      const result = await ambulatorInpatientService.updateBedStatus(bedId, newStatus);
      if (result.success) {
        toast.success('Status yangilandi!');
        loadData();
      }
    } catch (error) {
      toast.error('Xatolik: ' + (error.response?.data?.message || error.message));
    }
  };

  // Bemor qidirish
  useEffect(() => {
    if (patientSearch.trim()) {
      const filtered = patients.filter(p => 
        p.first_name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.last_name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.patient_number?.includes(patientSearch) ||
        p.phone?.includes(patientSearch)
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients([]);
    }
  }, [patientSearch, patients]);

  // Koyka statusiga qarab rang
  const getBedStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 dark:bg-green-900/20 border-green-500',
      occupied: 'bg-red-100 dark:bg-red-900/20 border-red-500',
      cleaning: 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-500',
      maintenance: 'bg-gray-100 dark:bg-gray-900/20 border-gray-500'
    };
    return colors[status] || colors.available;
  };

  // Koyka status matni
  const getBedStatusText = (status) => {
    const texts = {
      available: 'Bo\'sh',
      occupied: 'Band',
      cleaning: 'Tozalanmoqda',
      maintenance: 'Ta\'mirlash'
    };
    return texts[status] || status;
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

  // Hamshira uchun faqat ko'rish rejimi
  if (isReadOnly) {
    return (
      <div className="p-3 sm:p-4 sm:p-4 sm:p-6 lg:p-4 sm:p-6 lg:p-8">
        <Toaster position="top-right" />
        
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="material-symbols-outlined text-5xl">meeting_room</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black">AMBULATORXONA</h1>
              <p className="text-base sm:text-lg opacity-90">Faqat ko'rish rejimi</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-xl sm:text-2xl">info</span>
            <p className="text-yellow-800 dark:text-yellow-200">
              Siz faqat ma'lumotlarni ko'rishingiz mumkin. Tahrirlash va boshqarish uchun admin yoki shifokor huquqi kerak.
            </p>
          </div>
        </div>

        {/* Xonalar ro'yxati - faqat ko'rish */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
          <h3 className="text-xl sm:text-2xl font-bold mb-4">Xonalar: {rooms.length} ta</h3>
          
          {rooms.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">meeting_room</span>
              <p className="text-gray-500">Xonalar yo'q</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {rooms.map(room => (
                <div key={room.id} className="border dark:border-gray-700 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-base sm:text-lg">Xona {room.room_number}</h4>
                      <p className="text-sm sm:text-sm sm:text-base text-gray-500">{room.floor_number}-qavat</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      room.status === 'active' ? 'bg-green-100 text-green-700' :
                      room.status === 'occupied' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {room.status === 'active' ? 'Bo\'sh' : room.status === 'occupied' ? 'Band' : room.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 sm:space-y-2 sm:space-y-3">
                    <p className="text-sm sm:text-sm sm:text-base"><span className="font-semibold">Koykalar:</span> {room.available_beds} / {room.total_beds} bo'sh</p>
                    
                    {room.beds && room.beds.length > 0 && (
                      <div className="mt-3 space-y-2 sm:space-y-2 sm:space-y-3">
                        {room.beds.map(bed => (
                          <div key={bed.id} className={`p-2 rounded-lg sm:rounded-lg sm:rounded-xl border-2 ${getBedStatusColor(bed.bed_status)}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm sm:text-sm sm:text-base">Ko'rpa {bed.bed_number}</span>
                              <span className="text-xs">{getBedStatusText(bed.bed_status)}</span>
                            </div>
                            {bed.bed_status === 'occupied' && bed.first_name && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                👤 {bed.first_name} {bed.last_name}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin va boshqalar uchun to'liq funksional interfeys
  return null;
}

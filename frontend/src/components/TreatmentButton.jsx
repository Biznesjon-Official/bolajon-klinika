import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import doctorNurseService from '../services/doctorNurseService';

export default function TreatmentButton({ patientId, patientName, roomNumber, bedNumber, onTreatmentComplete }) {
  const [showModal, setShowModal] = useState(false);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [completingTreatment, setCompletingTreatment] = useState(null);
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [hasTreatments, setHasTreatments] = useState(false);
  const [checkingTreatments, setCheckingTreatments] = useState(true);

  // Komponent yuklanganda muolajalar borligini tekshirish
  useEffect(() => {
    checkForTreatments();
  }, [patientId, roomNumber, bedNumber]);

  const checkForTreatments = async () => {
    try {
      setCheckingTreatments(true);
      
      // Hamshiraga biriktirilgan barcha muolajalarni olish
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/nurse/treatments`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        // Faqat shu xona va koykadagi muolajalarni filtrlab olish
        const filteredTreatments = data.data.filter(t => {
          const roomInfo = t.admission_info?.room_info;
          if (!roomInfo) return false;
          
          // Xona va koyka raqamlarini solishtirish
          const matchesRoom = roomInfo.room_number == roomNumber;
          const matchesBed = roomInfo.bed_number == bedNumber;
          
          return matchesRoom && matchesBed;
        });
        
        console.log('Filtered treatments for room', roomNumber, 'bed', bedNumber, ':', filteredTreatments.length);
        
        if (filteredTreatments.length > 0) {
          setHasTreatments(true);
        } else {
          setHasTreatments(false);
        }
      } else {
        setHasTreatments(false);
      }
    } catch (error) {
      console.error('Check treatments error:', error);
      setHasTreatments(false);
    } finally {
      setCheckingTreatments(false);
    }
  };

  const loadTreatments = async () => {
    try {
      setLoading(true);
      setShowModal(true);
      
      // Hamshiraga biriktirilgan barcha muolajalarni olish
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/nurse/treatments`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        // Faqat shu xona va koykadagi muolajalarni filtrlab olish
        const filteredTreatments = data.data.filter(t => {
          const roomInfo = t.admission_info?.room_info;
          if (!roomInfo) return false;
          
          const matchesRoom = roomInfo.room_number == roomNumber;
          const matchesBed = roomInfo.bed_number == bedNumber;
          
          return matchesRoom && matchesBed;
        });
        
        setTreatments(filteredTreatments || []);
      } else {
        toast.error('Muolajalarni yuklashda xatolik');
      }
    } catch (error) {
      console.error('Load treatments error:', error);
      toast.error('Muolajalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTreatment = async (treatmentId) => {
    try {
      const response = await doctorNurseService.completeTask(treatmentId, {
        notes: treatmentNotes
      });
      
      if (response.success) {
        toast.success('Muolaja yakunlandi!');
        setCompletingTreatment(null);
        setTreatmentNotes('');
        
        // Muolajalarni qayta yuklash
        await loadTreatments();
        
        // Muolajalar borligini qayta tekshirish
        await checkForTreatments();
        
        // Agar callback berilgan bo'lsa, chaqirish (koykani yangilash uchun)
        if (onTreatmentComplete) {
          onTreatmentComplete();
        }
      } else {
        toast.error('Xatolik: ' + (response.message || response.error));
      }
    } catch (error) {
      console.error('Complete treatment error:', error);
      toast.error('Xatolik yuz berdi: ' + (error.response?.data?.error || error.message));
    }
  };

  // Agar muolajalar yo'q bo'lsa, hech narsa ko'rsatmaslik
  if (checkingTreatments) {
    return null; // Yuklanmoqda
  }

  if (!hasTreatments) {
    return null; // Muolajalar yo'q
  }

  return (
    <>
      <button
        onClick={loadTreatments}
        className="mt-2 w-full px-3 py-1.5 bg-blue-500 text-white rounded-lg sm:rounded-lg sm:rounded-xl hover:bg-blue-600 text-xs font-semibold flex items-center justify-center gap-1"
      >
        <span className="material-symbols-outlined text-sm sm:text-sm sm:text-base">medication</span>
        Muolajani qilish
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-xl sm:max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold">{patientName} - Muolajalar</h3>
                <p className="text-sm sm:text-sm sm:text-base text-gray-500">Xona {roomNumber}, Ko'rpa {bedNumber}</p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setCompletingTreatment(null);
                  setTreatmentNotes('');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-4 sm:py-6 lg:py-8">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Yuklanmoqda...</p>
              </div>
            ) : treatments.length === 0 ? (
              <div className="text-center py-4 sm:py-6 lg:py-8">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">medication</span>
                <p className="text-gray-600 dark:text-gray-400">Bu koykada muolajalar yo'q</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {treatments.map(treatment => (
                  <div key={treatment.id} className="border dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4">
                    {completingTreatment === treatment.id ? (
                      // Muolajani yakunlash formi
                      <div className="space-y-2 sm:space-y-3">
                        <h4 className="font-bold">Muolajani yakunlash</h4>
                        <div>
                          <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Izoh (ixtiyoriy)</label>
                          <textarea
                            value={treatmentNotes}
                            onChange={(e) => setTreatmentNotes(e.target.value)}
                            className="w-full px-3 py-2 sm:py-2.5 border dark:border-gray-700 dark:bg-gray-900 rounded-lg sm:rounded-lg sm:rounded-xl text-sm sm:text-sm sm:text-base"
                            rows="3"
                            placeholder="Izoh yozing..."
                          />
                        </div>
                        <div className="flex gap-2 sm:gap-2 sm:gap-3">
                          <button
                            onClick={() => {
                              setCompletingTreatment(null);
                              setTreatmentNotes('');
                            }}
                            className="flex-1 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-gray-200 dark:bg-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 text-sm sm:text-sm sm:text-base"
                          >
                            Bekor qilish
                          </button>
                          <button
                            onClick={() => handleCompleteTreatment(treatment.id)}
                            className="flex-1 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-green-500 text-white rounded-lg sm:rounded-lg sm:rounded-xl hover:bg-green-600 text-sm sm:text-sm sm:text-base"
                          >
                            ✓ Tasdiqlash
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Muolaja ma'lumotlari
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 sm:gap-2 sm:gap-3 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                treatment.prescription_type === 'URGENT' 
                                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                                  : treatment.prescription_type === 'CHRONIC'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                              }`}>
                                {treatment.prescription_type === 'URGENT' ? '🚨 Shoshilinch' : 
                                 treatment.prescription_type === 'CHRONIC' ? '📅 Surunkali' : 
                                 '📋 Oddiy'}
                              </span>
                            </div>
                            <p className="font-semibold">{treatment.medication_name}</p>
                            <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Doza: {treatment.dosage}</p>
                            
                            {treatment.frequency_per_day && (
                              <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg sm:rounded-lg sm:rounded-xl">
                                <p className="text-xs">
                                  📅 Kuniga {treatment.frequency_per_day} marta
                                  {treatment.duration_days && `, ${treatment.duration_days} kun`}
                                </p>
                                {treatment.schedule_times && treatment.schedule_times.length > 0 && (
                                  <p className="text-xs mt-1">
                                    🕐 {treatment.schedule_times.join(', ')}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            treatment.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            treatment.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {treatment.status === 'pending' ? 'Kutilmoqda' : 
                             treatment.status === 'completed' ? 'Bajarildi' : 
                             treatment.status}
                          </span>
                        </div>
                        
                        {treatment.status === 'pending' && (
                          <button
                            onClick={() => setCompletingTreatment(treatment.id)}
                            className="mt-3 w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-green-500 text-white rounded-lg sm:rounded-lg sm:rounded-xl hover:bg-green-600 font-semibold text-sm sm:text-sm sm:text-base"
                          >
                            ✓ Muolajani yakunlash
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

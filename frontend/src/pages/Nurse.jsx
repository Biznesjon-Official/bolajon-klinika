import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import nurseService from '../services/nurseService';
import Modal from '../components/Modal';

const Nurse = () => {
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending_treatments: 0,
    overdue_treatments: 0,
    total_patients: 0
  });
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [patientFilter, setPatientFilter] = useState('all'); // all, inpatient, outpatient, not_admitted
  const [searchQuery, setSearchQuery] = useState(''); // For prescription location search

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('=== NURSE PANEL: LOADING DATA ===');
      console.log('Status Filter:', statusFilter);
      
      const [treatmentsRes, statsRes] = await Promise.all([
        nurseService.getTreatments({ status: statusFilter }),
        nurseService.getStats()
      ]);

      console.log('=== NURSE TREATMENTS RESPONSE ===');
      console.log('Treatments Response:', treatmentsRes);
      console.log('Treatments Success:', treatmentsRes.success);
      console.log('Treatments Data Length:', treatmentsRes.data?.length);
      console.log('Treatments Data:', treatmentsRes.data);
      
      console.log('=== NURSE STATS RESPONSE ===');
      console.log('Stats Response:', statsRes);
      console.log('Stats Success:', statsRes.success);
      console.log('Stats Data:', statsRes.data);
      
      if (treatmentsRes.data && treatmentsRes.data.length > 0) {
        console.log('First Treatment:', treatmentsRes.data[0]);
        console.log('  - medication_name:', treatmentsRes.data[0].medication_name);
        console.log('  - dosage:', treatmentsRes.data[0].dosage);
        console.log('  - prescription_id:', treatmentsRes.data[0].prescription_id);
      } else {
        console.log('⚠️  NO TREATMENTS FOUND');
      }

      if (treatmentsRes.success) {
        console.log('✅ Setting treatments state with', treatmentsRes.data?.length, 'items');
        setTreatments(treatmentsRes.data || []);
        console.log('✅ Treatments state updated');
      } else {
        console.log('⚠️  Treatments response not successful');
        setTreatments([]);
      }
      if (statsRes.success) {
        console.log('✅ Setting stats state:', statsRes.data);
        setStats(statsRes.data || {
          pending_treatments: 0,
          overdue_treatments: 0,
          total_patients: 0
        });
        console.log('✅ Stats state updated');
      } else {
        console.log('⚠️  Stats response not successful');
        setStats({
          pending_treatments: 0,
          overdue_treatments: 0,
          total_patients: 0
        });
      }
    } catch (error) {
      console.error('=== LOAD DATA ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      toast.error('Ma\'lumotlarni yuklashda xatolik: ' + (error.message || 'Noma\'lum xatolik'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCompleteModal = (treatment) => {
    setSelectedTreatment(treatment);
    setCompletionNotes('');
    setShowCompleteModal(true);
  };

  const handleCompleteTreatment = async () => {
    if (!selectedTreatment) return;

    try {
      const response = await nurseService.completeTreatment(selectedTreatment.id, {
        notes: completionNotes,
        used_medicines: []
      });

      if (response.success) {
        toast.success('Muolaja yakunlandi');
        setShowCompleteModal(false);
        setSelectedTreatment(null);
        setCompletionNotes('');
        loadData();
      }
    } catch (error) {
      console.error('Complete treatment error:', error);
      toast.error('Muolajani yakunlashda xatolik');
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
    };
    const labels = {
      pending: 'Kutilmoqda',
      in_progress: 'Jarayonda',
      completed: 'Yakunlandi'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badges[status] || badges.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    console.log('🔄 Nurse panel is loading...');
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Yuklanmoqda...</div>
        </div>
      </div>
    );
  }

  console.log('🎨 RENDERING NURSE PANEL');
  console.log('   Treatments count:', treatments.length);
  console.log('   Stats:', stats);
  console.log('   Status filter:', statusFilter);
  console.log('   Loading:', loading);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Hamshira Paneli</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Kutilayotgan</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending_treatments}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Kechikkan</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdue_treatments}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Bemorlar</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_patients}</div>
        </div>
      </div>

      {/* Search for Prescription Location */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">🔍 Retsept joyini topish</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Bemor ismi, retsept raqami yoki xona raqamini kiriting..."
            className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-primary text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Tozalash
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Status Filter */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Holat bo'yicha</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Barchasi
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                statusFilter === 'pending'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Kutilmoqda
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                statusFilter === 'completed'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Yakunlangan
            </button>
          </div>
        </div>

        {/* Patient Filter */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Bemorlar bo'yicha</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPatientFilter('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                patientFilter === 'all'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Barchasi ({treatments.length})
            </button>
            <button
              onClick={() => setPatientFilter('inpatient')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                patientFilter === 'inpatient'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Statsionardagi ({treatments.filter(t => t.admission_id || t.admission_info?.is_admitted).length})
            </button>
            <button
              onClick={() => setPatientFilter('outpatient')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                patientFilter === 'outpatient'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Ambulatordagi ({treatments.filter(t => !(t.admission_id || t.admission_info?.is_admitted)).length})
            </button>
            <button
              onClick={() => setPatientFilter('not_admitted')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                patientFilter === 'not_admitted'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Yotqizilmagan ({treatments.filter(t => !(t.admission_id || t.admission_info?.is_admitted)).length})
            </button>
          </div>
        </div>
      </div>

      {/* Treatments List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-6">Muolajalar</h2>
        
        {(() => {
          console.log('🎨 Rendering treatments list, count:', treatments.length);
          console.log('Patient filter:', patientFilter);
          console.log('Search query:', searchQuery);
          
          // Filter treatments by patient type
          let filteredTreatments = treatments;
          
          // Apply patient type filter
          if (patientFilter === 'inpatient') {
            filteredTreatments = treatments.filter(t => {
              const hasAdmission = t.admission_id || t.admission_info?.is_admitted;
              console.log(`Treatment ${t.id}: admission_id=${t.admission_id}, is_admitted=${t.admission_info?.is_admitted}, hasAdmission=${hasAdmission}`);
              return hasAdmission;
            });
          } else if (patientFilter === 'outpatient') {
            filteredTreatments = treatments.filter(t => {
              const hasAdmission = t.admission_id || t.admission_info?.is_admitted;
              return !hasAdmission;
            });
          } else if (patientFilter === 'not_admitted') {
            filteredTreatments = treatments.filter(t => {
              const hasAdmission = t.admission_id || t.admission_info?.is_admitted;
              return !hasAdmission;
            });
          }
          
          // Apply search filter
          if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filteredTreatments = filteredTreatments.filter(t => {
              const patientName = (t.patient_name || '').toLowerCase();
              const prescriptionNumber = (t.prescription_id?.prescription_number || '').toLowerCase();
              const roomNumber = (t.admission_info?.room_info?.room_number || '').toString().toLowerCase();
              const roomName = (t.admission_info?.room_info?.room_name || '').toLowerCase();
              
              return patientName.includes(query) || 
                     prescriptionNumber.includes(query) || 
                     roomNumber.includes(query) ||
                     roomName.includes(query);
            });
          }
          
          console.log('✅ Filtered treatments:', filteredTreatments.length);
          
          if (filteredTreatments.length === 0) {
            console.log('⚠️  Showing "no treatments" message');
            return (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? `"${searchQuery}" bo'yicha natija topilmadi` :
                 patientFilter === 'all' ? 'Muolajalar topilmadi' :
                 patientFilter === 'inpatient' ? 'Statsionardagi bemorlar uchun muolajalar topilmadi' :
                 patientFilter === 'outpatient' ? 'Ambulatordagi bemorlar uchun muolajalar topilmadi' :
                 'Yotqizilmagan bemorlar uchun muolajalar topilmadi'}
              </div>
            );
          }
          
          return (
            <div className="space-y-3 sm:space-y-4">
              {filteredTreatments.map((treatment) => {
                // Highlight search matches
                const isHighlighted = searchQuery && searchQuery.trim() && (
                  (treatment.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (treatment.prescription_id?.prescription_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (treatment.admission_info?.room_info?.room_number || '').toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (treatment.admission_info?.room_info?.room_name || '').toLowerCase().includes(searchQuery.toLowerCase())
                );
                
                return (
              <div 
                key={treatment.id} 
                className={`p-3 sm:p-4 rounded-xl border transition-all ${
                  isHighlighted 
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-600 shadow-lg' 
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                        {treatment.patient_name}
                      </p>
                      {(treatment.admission_id || treatment.admission_info?.is_admitted) && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded text-xs font-semibold whitespace-nowrap">
                          Statsionar
                        </span>
                      )}
                      {getStatusBadge(treatment.status)}
                    </div>
                    
                    {/* Xona ma'lumoti */}
                    {treatment.admission_info?.room_info && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        📍 Xona: {treatment.admission_info.room_info.room_number} - {treatment.admission_info.room_info.room_name}
                        {treatment.admission_info.room_info.bed_number && ` • Ko'rpa: ${treatment.admission_info.room_info.bed_number}`}
                      </p>
                    )}
                    
                    {/* Dori ma'lumoti */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 mb-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        💊 {treatment.medication_name || treatment.medicine_name || 
                             (treatment.prescription_id?.medications?.[0]?.medication_name) || 
                             'Dori nomi ko\'rsatilmagan'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Doza: {treatment.dosage || treatment.medicine_dosage || 
                               (treatment.prescription_id?.medications?.[0]?.dosage) || 
                               'Doza ko\'rsatilmagan'}
                      </p>
                      {(treatment.instructions || treatment.prescription_id?.medications?.[0]?.instructions) && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          📝 {treatment.instructions || treatment.prescription_id?.medications?.[0]?.instructions}
                        </p>
                      )}
                    </div>

                    {/* Retsept ma'lumoti */}
                    {treatment.prescription_id && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-2">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                          📋 Retsept: {treatment.prescription_id.prescription_number}
                        </p>
                        {treatment.prescription_id.doctor_id && (
                          <p className="text-sm text-blue-700 dark:text-blue-400">
                            👨‍⚕️ Shifokor: Dr. {treatment.prescription_id.doctor_id.first_name} {treatment.prescription_id.doctor_id.last_name}
                            {treatment.prescription_id.doctor_id.specialization && ` (${treatment.prescription_id.doctor_id.specialization})`}
                          </p>
                        )}
                        {treatment.prescription_id.diagnosis && (
                          <p className="text-sm text-blue-700 dark:text-blue-400">
                            🩺 Tashxis: {treatment.prescription_id.diagnosis}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Jadval ma'lumoti (TreatmentSchedule uchun) */}
                    {treatment.source === 'schedule' && treatment.total_doses > 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📊 Jadval: {treatment.completed_doses}/{treatment.total_doses} marta
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      🕐 {formatTime(treatment.scheduled_time)}
                    </span>
                    {treatment.status === 'pending' && (
                      <button
                        onClick={() => handleOpenCompleteModal(treatment)}
                        className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-all"
                      >
                        Yakunlash
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        );
      })()}
      </div>

      {/* Complete Modal */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => {
          setShowCompleteModal(false);
          setSelectedTreatment(null);
          setCompletionNotes('');
        }}
        title="Muolajani yakunlash"
      >
        <div className="space-y-4">
          {selectedTreatment && (
            <>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedTreatment.patient_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  💊 {selectedTreatment.medication_name || selectedTreatment.medicine_name || 
                       (selectedTreatment.prescription_id?.medications?.[0]?.medication_name) || 
                       'Dori nomi ko\'rsatilmagan'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Doza: {selectedTreatment.dosage || selectedTreatment.medicine_dosage || 
                         (selectedTreatment.prescription_id?.medications?.[0]?.dosage) || 
                         'Doza ko\'rsatilmagan'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Izoh (ixtiyoriy)
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-primary"
                  rows="3"
                  placeholder="Muolaja haqida qo'shimcha ma'lumot..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCompleteTreatment}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
                >
                  Yakunlash
                </button>
                <button
                  onClick={() => {
                    setShowCompleteModal(false);
                    setSelectedTreatment(null);
                    setCompletionNotes('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Bekor qilish
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Nurse;


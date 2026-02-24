import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { prescriptionService } from '../services/prescriptionService';
import doctorNurseService from '../services/doctorNurseService';
import diseaseService from '../services/diseaseService';
import Modal from './Modal';

const PrescriptionModal = ({ 
  isOpen, 
  onClose, 
  patient, 
  onSuccess,
  user 
}) => {
  const { t } = useTranslation();
  const isDoctor = ['doctor', 'chief_doctor'].includes(user?.role_name || user?.role?.name);
  
  // Form state
  const [complaint, setComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescriptionType, setPrescriptionType] = useState('REGULAR');
  const [medications, setMedications] = useState([]);
  const [diagnosisSuggestions, setDiagnosisSuggestions] = useState([]);
  const [medSuggestions, setMedSuggestions] = useState([]);

  // Disease selection
  const [allDiseases, setAllDiseases] = useState([]);
  const [diseaseSearch, setDiseaseSearch] = useState('');
  const [showDiseaseDropdown, setShowDiseaseDropdown] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([]);
  const [selectedRecommendations, setSelectedRecommendations] = useState([]);

  // Secondary disease
  const [secondaryDiseaseSearch, setSecondaryDiseaseSearch] = useState('');
  const [showSecondaryDropdown, setShowSecondaryDropdown] = useState(false);
  const [selectedSecondaryDisease, setSelectedSecondaryDisease] = useState(null);
  const [selectedSecondaryDiagnoses, setSelectedSecondaryDiagnoses] = useState([]);
  const [selectedSecondaryRecommendations, setSelectedSecondaryRecommendations] = useState([]);

  // Custom recommendations by doctor
  const [customRecommendation, setCustomRecommendation] = useState('');
  const [customRecommendations, setCustomRecommendations] = useState([]);

  // Nurses list (for reference only, not for selection)
  const [nurses, setNurses] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadNurses();
      loadDiseases();
      resetForm();
      const savedDiagnoses = JSON.parse(localStorage.getItem('prescription_diagnoses') || '[]');
      const savedMeds = JSON.parse(localStorage.getItem('prescription_medications') || '[]');
      setDiagnosisSuggestions(savedDiagnoses);
      setMedSuggestions(savedMeds);
    }
  }, [isOpen]);

  const loadDiseases = async () => {
    try {
      const response = await diseaseService.getAll();
      if (response.success) setAllDiseases(response.data);
    } catch (error) { /* silent */ }
  };

  const loadNurses = async () => {
    try {
      const response = await doctorNurseService.getActiveNurses();
      if (response.success) {
        setNurses(response.data);
      }
    } catch (error) {
      // silent
    }
  };

  const resetForm = () => {
    setComplaint('');
    setDiagnosis('');
    setPrescriptionType('REGULAR');
    setMedications([]);
    setDiseaseSearch('');
    setSelectedDisease(null);
    setSelectedDiagnoses([]);
    setSelectedRecommendations([]);
    setSecondaryDiseaseSearch('');
    setSelectedSecondaryDisease(null);
    setSelectedSecondaryDiagnoses([]);
    setSelectedSecondaryRecommendations([]);
    setCustomRecommendation('');
    setCustomRecommendations([]);
  };

  const handleAddCustomRecommendation = () => {
    if (!customRecommendation.trim()) return;
    setCustomRecommendations(prev => [...prev, customRecommendation.trim()]);
    setCustomRecommendation('');
  };

  const handleSelectDisease = (disease, isSecondary = false) => {
    if (isSecondary) {
      setSelectedSecondaryDisease(disease);
      setSecondaryDiseaseSearch(disease.name);
      setShowSecondaryDropdown(false);
      setSelectedSecondaryDiagnoses(disease.diagnoses?.filter(d => d.is_default).map(d => d.text) || []);
      setSelectedSecondaryRecommendations(disease.recommendations?.filter(r => r.is_default).map(r => r.text) || []);
    } else {
      setSelectedDisease(disease);
      setDiseaseSearch(disease.name);
      setShowDiseaseDropdown(false);
      setSelectedDiagnoses(disease.diagnoses?.filter(d => d.is_default).map(d => d.text) || []);
      setSelectedRecommendations(disease.recommendations?.filter(r => r.is_default).map(r => r.text) || []);
    }
  };

  const toggleDiagnosisCheck = (text, isSecondary = false) => {
    if (isSecondary) {
      setSelectedSecondaryDiagnoses(prev => prev.includes(text) ? prev.filter(d => d !== text) : [...prev, text]);
    } else {
      setSelectedDiagnoses(prev => prev.includes(text) ? prev.filter(d => d !== text) : [...prev, text]);
    }
  };

  const toggleRecommendationCheck = (text, isSecondary = false) => {
    if (isSecondary) {
      setSelectedSecondaryRecommendations(prev => prev.includes(text) ? prev.filter(r => r !== text) : [...prev, text]);
    } else {
      setSelectedRecommendations(prev => prev.includes(text) ? prev.filter(r => r !== text) : [...prev, text]);
    }
  };

  const filteredDiseases = allDiseases.filter(d => d.name.toLowerCase().includes(diseaseSearch.toLowerCase()));
  const filteredSecondaryDiseases = allDiseases.filter(d => d.can_be_secondary && d.name.toLowerCase().includes(secondaryDiseaseSearch.toLowerCase()));

  // Save diagnosis/medication to localStorage for future autocomplete
  const saveSuggestion = (key, value) => {
    if (!value?.trim()) return;
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    if (!stored.includes(value.trim())) {
      const updated = [value.trim(), ...stored].slice(0, 50);
      localStorage.setItem(key, JSON.stringify(updated));
    }
  };

  const addMedication = () => {
    if (prescriptionType === 'URGENT') {
      setMedications([...medications, {
        medication_name: '',
        per_dose_amount: '',
        frequency: 'Shoshilinch',
        duration_days: 1,
        instructions: 'Shoshilinch'
      }]);
    } else {
      setMedications([...medications, {
        medication_name: '',
        per_dose_amount: '',
        frequency: '',
        frequency_per_day: 2,
        schedule_times: ['09:00', '21:00'],
        duration_days: 3,
        instructions: ''
      }]);
    }
  };

  const updateMedication = (index, field, value) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e, shouldPrint = false) => {
    e.preventDefault();
    
    if (!diagnosis && !selectedDisease && medications.length === 0) {
      alert('Kasallik tanlang yoki tashxis kiriting va dori qo\'shing');
      return;
    }
    if (medications.length === 0) {
      alert(t('queue.enterDiagnosisAndMedication'));
      return;
    }

    try {
      // Save diagnosis and medication names for autocomplete
      saveSuggestion('prescription_diagnoses', diagnosis);
      medications.forEach(med => saveSuggestion('prescription_medications', med.medication_name));

      // Build full diagnosis text from disease selections
      const allDiagTexts = [...selectedDiagnoses, ...selectedSecondaryDiagnoses];
      const allRecTexts = [...selectedRecommendations, ...selectedSecondaryRecommendations, ...customRecommendations];
      const fullDiagnosis = [
        diagnosis,
        selectedDisease ? `Kasallik: ${selectedDisease.name}` : '',
        selectedSecondaryDisease ? `Yondosh: ${selectedSecondaryDisease.name}` : '',
        allDiagTexts.length > 0 ? `Tashxislar: ${allDiagTexts.join('; ')}` : ''
      ].filter(Boolean).join('. ');

      const prescriptionData = {
        patient_id: patient.patient_id || patient._id || patient.id,
        queue_id: patient.id,
        diagnosis: fullDiagnosis,
        complaint: complaint || undefined,
        disease_name: selectedDisease?.name || undefined,
        secondary_disease_name: selectedSecondaryDisease?.name || undefined,
        selected_diagnoses: allDiagTexts.length > 0 ? allDiagTexts : undefined,
        recommendations: allRecTexts.length > 0 ? allRecTexts : undefined,
        prescription_type: prescriptionType,
        medications,
        nurse_id: null
      };
      
      const patientData = {
        first_name: patient.first_name || patient.patientName?.split(' ')[0],
        last_name: patient.last_name || patient.patientName?.split(' ').slice(1).join(' '),
        patient_number: patient.patient_number || patient.patientNumber,
        phone: patient.phone || patient.patientPhone
      };
      
      const response = await prescriptionService.createPrescription(prescriptionData);

      if (response.success) {
        // Backend automatically creates TreatmentSchedule for all medications
        // No need to create Task separately - it would cause duplicates
        
        // Print if requested
        if (shouldPrint) {
          setTimeout(() => {
            prescriptionService.printPrescriptionReceipt(
              {
                ...prescriptionData,
                prescription_number: response.data?.prescription_number,
                doctor_name: user?.full_name || user?.username
              },
              patientData
            );
          }, 300);
        }

        onSuccess(response);
        onClose();
      }
    } catch (error) {
      // prescription error
      alert(t('queue.errorOccurred') + ': ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title={t('queue.writePrescription')}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Patient Info */}
        {patient && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 sm:p-4 border border-green-100 dark:border-green-800 overflow-hidden">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="material-symbols-outlined text-green-600 text-2xl sm:text-3xl flex-shrink-0">person</span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white break-words">
                  {patient.patientName || `${patient.first_name} ${patient.last_name}`}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">
                  {patient.patientNumber || patient.patient_number} • {patient.patientPhone || patient.phone}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Shikoyat */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            <span className="material-symbols-outlined text-sm align-middle mr-1">record_voice_over</span>
            Shikoyat
          </label>
          <input
            type="text"
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            placeholder="Bemor nimadan shikoyat qilmoqda..."
          />
        </div>

        {/* Tashxis */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            <span className="material-symbols-outlined text-sm align-middle mr-1">diagnosis</span>
            Tashxis
          </label>
          <input
            type="text"
            list="diagnosis-suggestions"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            placeholder="Tashxis yozing..."
          />
          <datalist id="diagnosis-suggestions">
            {diagnosisSuggestions.map((d, i) => (
              <option key={i} value={d} />
            ))}
          </datalist>
        </div>

        {/* Kasallik va Yondosh kasallik — 2 ustun */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Asosiy kasallik */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              <span className="material-symbols-outlined text-sm align-middle mr-1">coronavirus</span>
              Kasallik
            </label>
            <div className="relative">
              <input
                type="text"
                value={diseaseSearch}
                onChange={(e) => { setDiseaseSearch(e.target.value); setShowDiseaseDropdown(true); if (!e.target.value) { setSelectedDisease(null); setSelectedRecommendations([]) } }}
                onFocus={() => setShowDiseaseDropdown(true)}
                onBlur={() => setTimeout(() => setShowDiseaseDropdown(false), 200)}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all ${selectedDisease ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
                placeholder="Qidirish..."
              />
              {selectedDisease && (
                <button type="button" onClick={() => { setSelectedDisease(null); setDiseaseSearch(''); setSelectedRecommendations([]) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
            {showDiseaseDropdown && diseaseSearch && !selectedDisease && filteredDiseases.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                {filteredDiseases.map(d => (
                  <button key={d._id} type="button" onClick={() => handleSelectDisease(d)}
                    className="w-full text-left px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors">
                    <span className="font-semibold text-gray-900 dark:text-white">{d.name}</span>
                    {d.category && <span className="ml-2 text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded">{d.category}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Yondosh kasallik */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              <span className="material-symbols-outlined text-sm align-middle mr-1">add_circle</span>
              Yondosh kasallik <span className="text-xs text-gray-400 font-normal">(ixtiyoriy)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={secondaryDiseaseSearch}
                onChange={(e) => { setSecondaryDiseaseSearch(e.target.value); setShowSecondaryDropdown(true); if (!e.target.value) { setSelectedSecondaryDisease(null); setSelectedSecondaryRecommendations([]) } }}
                onFocus={() => setShowSecondaryDropdown(true)}
                onBlur={() => setTimeout(() => setShowSecondaryDropdown(false), 200)}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all ${selectedSecondaryDisease ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
                placeholder="Qidirish..."
              />
              {selectedSecondaryDisease && (
                <button type="button" onClick={() => { setSelectedSecondaryDisease(null); setSecondaryDiseaseSearch(''); setSelectedSecondaryRecommendations([]) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
            {showSecondaryDropdown && secondaryDiseaseSearch && !selectedSecondaryDisease && filteredSecondaryDiseases.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                {filteredSecondaryDiseases.map(d => (
                  <button key={d._id} type="button" onClick={() => handleSelectDisease(d, true)}
                    className="w-full text-left px-3 py-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors">
                    <span className="font-semibold text-gray-900 dark:text-white">{d.name}</span>
                    {d.category && <span className="ml-2 text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded">{d.category}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Maslahatlar bo'limi */}
        {(selectedDisease || selectedSecondaryDisease || selectedRecommendations.length > 0 || selectedSecondaryRecommendations.length > 0) && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-amber-600">tips_and_updates</span>
              <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">Maslahatlar</h4>
            </div>

            {/* Asosiy kasallik maslahatlar */}
            {selectedDisease?.recommendations?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">{selectedDisease.name}:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {selectedDisease.recommendations.map((r, i) => (
                    <label key={`p-${i}`} className={`flex items-start gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all text-sm ${
                      selectedRecommendations.includes(r.text)
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200'
                        : 'bg-white/60 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
                    }`}>
                      <input type="checkbox" checked={selectedRecommendations.includes(r.text)} onChange={() => toggleRecommendationCheck(r.text)}
                        className="w-4 h-4 accent-amber-500 rounded mt-0.5 flex-shrink-0" />
                      <span className="leading-snug">{r.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Yondosh kasallik maslahatlar */}
            {selectedSecondaryDisease?.recommendations?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-2">{selectedSecondaryDisease.name} (yondosh):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {selectedSecondaryDisease.recommendations.map((r, i) => (
                    <label key={`s-${i}`} className={`flex items-start gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all text-sm ${
                      selectedSecondaryRecommendations.includes(r.text)
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200'
                        : 'bg-white/60 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
                    }`}>
                      <input type="checkbox" checked={selectedSecondaryRecommendations.includes(r.text)} onChange={() => toggleRecommendationCheck(r.text, true)}
                        className="w-4 h-4 accent-purple-500 rounded mt-0.5 flex-shrink-0" />
                      <span className="leading-snug">{r.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Doktor qo'shimcha maslahat qo'shishi */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={customRecommendation}
                onChange={(e) => setCustomRecommendation(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomRecommendation() } }}
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Qo'shimcha maslahat yozing..."
              />
              <button type="button" onClick={handleAddCustomRecommendation}
                className="px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>

            {/* Qo'shimcha qo'shilgan maslahatlar */}
            {customRecommendations.length > 0 && (
              <div className="mt-2 space-y-1">
                {customRecommendations.map((r, i) => (
                  <div key={`c-${i}`} className="flex items-center justify-between px-2.5 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
                    <span className="text-green-800 dark:text-green-300">{r}</span>
                    <button type="button" onClick={() => setCustomRecommendations(prev => prev.filter((_, idx) => idx !== i))}
                      className="p-0.5 text-gray-400 hover:text-red-500">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* Prescription Type */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {t('common.prescriptionType')}
          </label>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setPrescriptionType('REGULAR')}
              className={`px-2 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                prescriptionType === 'REGULAR'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {t('common.regular')}
            </button>
            <button
              type="button"
              onClick={() => setPrescriptionType('URGENT')}
              className={`px-2 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                prescriptionType === 'URGENT'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {t('common.urgent')}
            </button>
          </div>
        </div>

        {/* Medications */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
            <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('common.medications')} <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={addMedication}
              className="w-full sm:w-auto px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-green-600 flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-base">add</span>
              {t('common.addMedication')}
            </button>
          </div>

          {medications.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 sm:p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
              <span className="material-symbols-outlined text-3xl sm:text-4xl text-gray-400 mb-2">medication</span>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">{t('common.noMedications')}</p>
              <button
                type="button"
                onClick={addMedication}
                className="mt-3 px-4 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm font-semibold hover:opacity-90"
              >
                {t('common.addFirstMedication')}
              </button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {medications.map((med, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{t('common.medications')} #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-600"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {/* Dori nomi - autocomplete */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Dori nomi
                      </label>
                      <input
                        type="text"
                        list={`med-suggestions-${index}`}
                        required
                        value={med.medication_name}
                        onChange={(e) => updateMedication(index, 'medication_name', e.target.value)}
                        placeholder="Dori nomini kiriting..."
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-xs sm:text-sm"
                      />
                      <datalist id={`med-suggestions-${index}`}>
                        {medSuggestions.map((m, i) => (
                          <option key={i} value={m} />
                        ))}
                      </datalist>
                    </div>
                    {/* Har nahalada qanchadan */}
                    <div className={prescriptionType === 'URGENT' ? 'sm:col-span-2' : 'sm:col-span-2'}>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Har nahalada qanchadan
                      </label>
                      <input
                        type="text"
                        required
                        value={med.per_dose_amount}
                        onChange={(e) => updateMedication(index, 'per_dose_amount', e.target.value)}
                        placeholder="Masalan: 1 tabletka, 5 ml, 2 kapsula"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm"
                      />
                    </div>
                    
                    {/* Regular prescription fields */}
                    {prescriptionType !== 'URGENT' && (
                      <>
                        {/* Frequency per day */}
                        <div className="sm:col-span-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-2 border-blue-200 dark:border-blue-700">
                          <label className="block text-sm font-bold mb-2 text-blue-900 dark:text-blue-100">
                            📊 Kuniga necha marta qabul qilish kerak? *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={med.frequency_per_day || ''}
                            onChange={(e) => {
                              const count = parseInt(e.target.value) || 0;
                              updateMedication(index, 'frequency_per_day', count);
                              if (count > 0) {
                                const times = [];
                                const interval = Math.floor(24 / count);
                                for (let i = 0; i < count; i++) {
                                  const hour = (8 + i * interval) % 24;
                                  times.push(`${String(hour).padStart(2, '0')}:00`);
                                }
                                updateMedication(index, 'schedule_times', times);
                              } else {
                                updateMedication(index, 'schedule_times', []);
                              }
                            }}
                            className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg text-base sm:text-lg font-bold"
                            placeholder="Masalan: 3"
                          />
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            💡 Vaqtlar avtomatik yaratiladi, keyin o'zgartirishingiz mumkin
                          </p>
                        </div>
                        
                        {/* Schedule times */}
                        {med.frequency_per_day > 0 && (
                          <div className="sm:col-span-2 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border-2 border-purple-200 dark:border-purple-700">
                            <label className="block text-sm font-bold mb-3 text-purple-900 dark:text-purple-100">
                              🕐 Qabul qilish vaqtlari
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {Array.from({ length: med.frequency_per_day }).map((_, timeIndex) => (
                                <div key={timeIndex} className="flex flex-col gap-1">
                                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                    {timeIndex + 1}-marta:
                                  </span>
                                  <input
                                    type="text"
                                    pattern="[0-2][0-9]:[0-5][0-9]"
                                    placeholder="HH:MM"
                                    maxLength="5"
                                    value={med.schedule_times?.[timeIndex] || ''}
                                    onChange={(e) => {
                                      let value = e.target.value.replace(/[^0-9:]/g, '');
                                      
                                      // Avtomatik : qo'shish
                                      if (value.length === 2 && !value.includes(':')) {
                                        value = value + ':';
                                      }
                                      
                                      // Format tekshirish
                                      if (value.length === 5) {
                                        const [hours, minutes] = value.split(':');
                                        const h = parseInt(hours);
                                        const m = parseInt(minutes);
                                        
                                        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
                                          const newTimes = [...(med.schedule_times || [])];
                                          newTimes[timeIndex] = value;
                                          updateMedication(index, 'schedule_times', newTimes);
                                        }
                                      } else if (value.length < 5) {
                                        const newTimes = [...(med.schedule_times || [])];
                                        newTimes[timeIndex] = value;
                                        updateMedication(index, 'schedule_times', newTimes);
                                      }
                                    }}
                                    onBlur={(e) => {
                                      // Format to'g'rilash
                                      const value = e.target.value;
                                      if (value.length === 5) {
                                        const [hours, minutes] = value.split(':');
                                        const h = parseInt(hours);
                                        const m = parseInt(minutes);
                                        
                                        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
                                          const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                                          const newTimes = [...(med.schedule_times || [])];
                                          newTimes[timeIndex] = formatted;
                                          updateMedication(index, 'schedule_times', newTimes);
                                        }
                                      }
                                    }}
                                    className="w-full px-2 sm:px-3 py-2 border-2 border-purple-300 rounded-lg font-bold text-sm sm:text-base text-center focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  />
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
                              ⏰ Har bir vaqtda dori qabul qilish kerak
                            </p>
                          </div>
                        )}
                        
                        {/* Duration */}
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            📅 Davomiyligi (kunlar)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={med.duration_days || ''}
                            onChange={(e) => updateMedication(index, 'duration_days', e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="Masalan: 7"
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Necha kun davomida qabul qilish kerak
                          </p>
                        </div>
                        
                        {/* Instructions */}
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            📝 Qo'shimcha ko'rsatmalar
                          </label>
                          <textarea
                            value={med.instructions}
                            onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                            placeholder="Qo'shimcha ko'rsatmalar..."
                            rows="2"
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm resize-none"
                          />
                        </div>
                        
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Urgent nurse assignment */}
        {prescriptionType === 'URGENT' && isDoctor && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 sm:p-6 rounded-xl border-2 border-orange-300 dark:border-orange-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-2xl sm:text-3xl text-orange-600">emergency</span>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Muolajaga yuborish</h3>
            </div>
            
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 italic bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              💡 Shoshilinch retsept saqlangandan keyin barcha hamshiralarga ko'rinadi
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">save</span>
            {t('common.saveOnly')}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">print</span>
            {t('common.saveAndPrint')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PrescriptionModal;


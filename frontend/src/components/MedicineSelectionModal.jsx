import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function MedicineSelectionModal({ isOpen, onClose, onConfirm, admissionType }) {
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([{ medicine_id: '', name: '', quantity: 1, unit: '', available: 0, unit_price: 0 }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMedicines();
      // Reset to one empty medicine input when modal opens
      setSelectedMedicines([{ medicine_id: '', name: '', quantity: 1, unit: '', available: 0, unit_price: 0 }]);
    }
  }, [isOpen]);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      
      // Determine floor based on admission type
      const floor = admissionType === 'inpatient' ? 3 : 2;
      
      console.log('=== LOADING MEDICINES ===');
      console.log('Admission type:', admissionType);
      console.log('Floor:', floor);
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1'}/nurse/medicines?floor=${floor}&admission_type=${admissionType || 'outpatient'}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      const data = await response.json();
      console.log('Medicines response:', data);
      
      if (data.success) {
        console.log(`✅ Loaded ${data.data.length} medicines from floor ${floor}`);
        if (data.data.length > 0) {
          console.log('Sample medicine:', data.data[0]);
        }
        setMedicines(data.data || []);
      } else {
        console.error('❌ Failed to load medicines:', data.message);
        toast.error('Dorilarni yuklashda xatolik: ' + (data.message || 'Noma\'lum xatolik'));
      }
    } catch (error) {
      console.error('Load medicines error:', error);
      toast.error('Dorilarni yuklashda xatolik: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicineRow = () => {
    setSelectedMedicines([...selectedMedicines, { 
      medicine_id: '', 
      name: '', 
      quantity: 1, 
      unit: '', 
      available: 0, 
      unit_price: 0 
    }]);
  };

  const handleRemoveMedicineRow = (index) => {
    if (selectedMedicines.length === 1) {
      toast.error('Kamida bitta dori input bo\'lishi kerak');
      return;
    }
    setSelectedMedicines(selectedMedicines.filter((_, i) => i !== index));
  };

  const handleMedicineSelect = (index, medicineId) => {
    const medicine = medicines.find(m => m._id === medicineId);
    if (!medicine) return;

    // Check if medicine already selected in another row
    const alreadySelected = selectedMedicines.some((m, i) => i !== index && m.medicine_id === medicineId);
    if (alreadySelected) {
      toast.error('Bu dori allaqachon tanlangan');
      return;
    }

    const updated = [...selectedMedicines];
    updated[index] = {
      medicine_id: medicine._id,
      name: medicine.name,
      quantity: 1,
      unit: medicine.unit,
      available: medicine.quantity,
      unit_price: medicine.unit_price
    };
    setSelectedMedicines(updated);
  };

  const handleQuantityChange = (index, quantity) => {
    const numQuantity = parseInt(quantity) || 1;
    const updated = [...selectedMedicines];
    updated[index].quantity = numQuantity;
    setSelectedMedicines(updated);
  };

  const handleConfirm = () => {
    // Filter out empty selections
    const validMedicines = selectedMedicines.filter(m => m.medicine_id && m.medicine_id !== '');
    
    if (validMedicines.length === 0) {
      toast.error('Kamida bitta dori tanlang yoki "Foydalanmadim" tugmasini bosing');
      return;
    }

    // Validate quantities
    for (const med of validMedicines) {
      if (med.quantity > med.available) {
        toast.error(`${med.name} uchun yetarli dori yo'q! Mavjud: ${med.available} ${med.unit}`);
        return;
      }
    }

    onConfirm(validMedicines);
    setSelectedMedicines([{ medicine_id: '', name: '', quantity: 1, unit: '', available: 0, unit_price: 0 }]);
    onClose();
  };

  const handleNoMedicines = () => {
    onConfirm([]);
    setSelectedMedicines([{ medicine_id: '', name: '', quantity: 1, unit: '', available: 0, unit_price: 0 }]);
    onClose();
  };

  const getTotalAmount = () => {
    return selectedMedicines
      .filter(m => m.medicine_id)
      .reduce((sum, m) => sum + (m.quantity * m.unit_price), 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slideUp" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-100 dark:border-gray-700">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-3xl text-blue-600">medication</span>
              Qaysi dorilardan foydalandingiz?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Muolajada ishlatilgan dorilarni tanlang va miqdorini kiriting
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-gray-500">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar mb-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Dorilar yuklanmoqda...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedMedicines.map((selectedMed, index) => (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-4 animate-slideDown">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      {/* Dori tanlash */}
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                          💊 Dori nomi
                        </label>
                        <select
                          value={selectedMed.medicine_id}
                          onChange={(e) => handleMedicineSelect(index, e.target.value)}
                          className="w-full px-4 py-3 border-2 border-blue-300 dark:border-blue-600 dark:bg-gray-900 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium"
                        >
                          <option value="">Dori tanlang...</option>
                          {medicines.length === 0 ? (
                            <option value="" disabled>Dorilar yuklanmoqda yoki mavjud emas...</option>
                          ) : (
                            medicines.map(medicine => (
                              <option key={medicine._id} value={medicine._id}>
                                {medicine.name} 
                                {medicine.generic_name && ` (${medicine.generic_name})`}
                                {' - '}
                                Mavjud: {medicine.quantity} {medicine.unit}
                                {' - '}
                                {medicine.unit_price?.toLocaleString()} so'm
                              </option>
                            ))
                          )}
                        </select>
                        {medicines.length === 0 && !loading && (
                          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">info</span>
                            2-qavatdagi dorixonada dorilar mavjud emas yoki yuklanmadi
                          </p>
                        )}
                      </div>

                      {/* Miqdor va ma'lumotlar */}
                      {selectedMed.medicine_id && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Miqdor */}
                          <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                              📦 Miqdori
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(index, Math.max(1, selectedMed.quantity - 1))}
                                className="w-10 h-10 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center"
                              >
                                <span className="material-symbols-outlined text-blue-600">remove</span>
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={selectedMed.available}
                                value={selectedMed.quantity}
                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                className="flex-1 px-4 py-2 border-2 border-blue-300 dark:border-blue-600 dark:bg-gray-900 rounded-xl text-center font-bold text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(index, Math.min(selectedMed.available, selectedMed.quantity + 1))}
                                className="w-10 h-10 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center"
                              >
                                <span className="material-symbols-outlined text-blue-600">add</span>
                              </button>
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[60px]">
                                {selectedMed.unit}
                              </span>
                            </div>
                            {selectedMed.quantity > selectedMed.available && (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">warning</span>
                                Yetarli dori yo'q! Mavjud: {selectedMed.available} {selectedMed.unit}
                              </p>
                            )}
                          </div>

                          {/* Ma'lumotlar */}
                          <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Mavjud:</span>
                              <span className="font-semibold text-green-600">{selectedMed.available} {selectedMed.unit}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Narx:</span>
                              <span className="font-semibold">{selectedMed.unit_price?.toLocaleString()} so'm</span>
                            </div>
                            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                              <span className="text-gray-600 dark:text-gray-400">Jami:</span>
                              <span className="font-bold text-blue-600">{(selectedMed.quantity * selectedMed.unit_price).toLocaleString()} so'm</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* O'chirish tugmasi */}
                    {selectedMedicines.length > 1 && (
                      <button
                        onClick={() => handleRemoveMedicineRow(index)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Dori qo'shish tugmasi */}
              <button
                onClick={handleAddMedicineRow}
                className="w-full px-4 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl hover:from-green-600 hover:to-emerald-700 font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-2xl">add_circle</span>
                Dori qo'shish
              </button>
            </div>
          )}
        </div>

        {/* Footer with total and actions */}
        <div className="border-t-2 border-gray-100 dark:border-gray-700 pt-4">
          {/* Total amount */}
          {selectedMedicines.some(m => m.medicine_id) && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Jami summa:</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {selectedMedicines.filter(m => m.medicine_id).length} ta dori tanlandi
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">{getTotalAmount().toLocaleString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">so'm</p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleNoMedicines}
              className="flex-1 px-6 py-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">block</span>
              Foydalanmadim
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedMedicines.some(m => m.medicine_id)}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">check_circle</span>
              Tasdiqlash
              {selectedMedicines.filter(m => m.medicine_id).length > 0 && (
                <span className="px-2 py-1 bg-white/20 rounded-full text-sm">
                  {selectedMedicines.filter(m => m.medicine_id).length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

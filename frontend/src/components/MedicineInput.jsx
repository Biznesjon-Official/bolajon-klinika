import { useState, useEffect } from 'react';

export default function MedicineInput({ value, onChange, availableMedicines, floor = 2 }) {
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Debug: availableMedicines ni ko'rish
  console.log('MedicineInput - availableMedicines:', availableMedicines);
  console.log('MedicineInput - floor:', floor);

  // Filter medicines by floor (2-qavat) - agar floor field bo'lmasa, barcha dorilarni ko'rsatish
  const floorMedicines = availableMedicines.filter(m => {
    const hasStock = (m.total_stock || m.quantity || 0) > 0;
    // Agar floor field bo'lsa, faqat o'sha qavatdagi dorilarni ko'rsatish
    if (m.floor !== undefined && m.floor !== null) {
      return m.floor === floor && hasStock;
    }
    // Agar floor field bo'lmasa, barcha dorilarni ko'rsatish
    return hasStock;
  });
  
  console.log('MedicineInput - floorMedicines:', floorMedicines);
  
  // Filter by search term
  const filteredMedicines = floorMedicines.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.generic_name && m.generic_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    if (value && value.medication_name) {
      const medicine = availableMedicines.find(m => m.name === value.medication_name);
      setSelectedMedicine(medicine);
      setQuantity(value.quantity || 1);
      setSearchTerm(value.medication_name);
    }
  }, [value, availableMedicines]);

  const handleSelectMedicine = (medicine) => {
    setSelectedMedicine(medicine);
    setSearchTerm(medicine.name);
    setShowDropdown(false);
    onChange({
      medication_name: medicine.name,
      medicine_id: medicine.id || medicine._id,
      quantity: quantity,
      unit: medicine.unit,
      available_stock: medicine.total_stock || medicine.quantity || 0,
      unit_price: medicine.unit_price || 0
    });
  };

  const handleQuantityChange = (newQuantity) => {
    const qty = parseInt(newQuantity) || 1;
    setQuantity(qty);
    if (selectedMedicine) {
      onChange({
        medication_name: selectedMedicine.name,
        medicine_id: selectedMedicine.id || selectedMedicine._id,
        quantity: qty,
        unit: selectedMedicine.unit,
        available_stock: selectedMedicine.total_stock || selectedMedicine.quantity || 0,
        unit_price: selectedMedicine.unit_price || 0
      });
    }
  };

  return (
    <div className="space-y-2">
      {/* Medicine Selection */}
      <div className="relative">
        <label className="block text-sm font-semibold mb-1">
          💊 Dori nomi (2-qavat dorixonasi)
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Dori qidirish..."
          className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:bg-gray-800"
        />
        
        {/* Dropdown */}
        {showDropdown && filteredMedicines.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredMedicines.map((medicine) => (
              <div
                key={medicine.id}
                onClick={() => handleSelectMedicine(medicine)}
                className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{medicine.name}</p>
                    {medicine.generic_name && (
                      <p className="text-xs text-gray-500">({medicine.generic_name})</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-green-600 font-semibold">
                      {medicine.total_stock || medicine.quantity || 0} {medicine.unit}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(medicine.unit_price || 0).toLocaleString()} so'm
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {showDropdown && filteredMedicines.length === 0 && searchTerm && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3 text-center">
            <p className="text-sm text-gray-500">Dori topilmadi</p>
          </div>
        )}
      </div>

      {/* Selected Medicine Info */}
      {selectedMedicine && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-2 border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-bold text-sm">{selectedMedicine.name}</p>
              {selectedMedicine.generic_name && (
                <p className="text-xs text-gray-600">({selectedMedicine.generic_name})</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedMedicine(null);
                setSearchTerm('');
                onChange(null);
              }}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Mavjud:</p>
              <p className="font-semibold text-green-600">{selectedMedicine.total_stock || selectedMedicine.quantity || 0} {selectedMedicine.unit}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Narx:</p>
              <p className="font-semibold">{(selectedMedicine.unit_price || 0).toLocaleString()} so'm</p>
            </div>
          </div>
        </div>
      )}

      {/* Quantity Input */}
      {selectedMedicine && (
        <div>
          <label className="block text-sm font-semibold mb-1">
            📦 Miqdori
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <input
              type="number"
              min="1"
              max={selectedMedicine.total_stock || selectedMedicine.quantity || 999}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-center font-bold dark:bg-gray-800"
            />
            <button
              type="button"
              onClick={() => handleQuantityChange(Math.min(selectedMedicine.total_stock || selectedMedicine.quantity || 999, quantity + 1))}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
            <span className="text-sm font-semibold">{selectedMedicine.unit}</span>
          </div>
          {quantity > (selectedMedicine.total_stock || selectedMedicine.quantity || 0) && (
            <p className="text-xs text-red-600 mt-1">
              ⚠️ Dorixonada yetarli dori yo'q! Mavjud: {selectedMedicine.total_stock || selectedMedicine.quantity || 0} {selectedMedicine.unit}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Jami: {(quantity * (selectedMedicine.unit_price || 0)).toLocaleString()} so'm
          </p>
        </div>
      )}
    </div>
  );
}

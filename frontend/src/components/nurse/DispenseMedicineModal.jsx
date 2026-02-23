import { useState } from 'react'
import Modal from '../Modal'

const DispenseMedicineModal = ({ isOpen, onClose, medicine, patients, onDispense }) => {
  const [data, setData] = useState({ patient_id: '', quantity: 1, notes: '' })

  const handleSubmit = () => {
    if (!data.patient_id) return
    if (!data.quantity || data.quantity < 1) return
    onDispense(medicine, data)
    setData({ patient_id: '', quantity: 1, notes: '' })
  }

  const handleClose = () => {
    setData({ patient_id: '', quantity: 1, notes: '' })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Dori berish" size="sm">
      <div className="space-y-4">
        {medicine && (
          <>
            {/* Medicine info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="size-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600">medication</span>
                </div>
                <div>
                  <p className="font-bold">{medicine.name}</p>
                  <p className="text-sm text-gray-600 capitalize">{medicine.category}</p>
                  <p className="text-sm text-gray-600">Mavjud: {medicine.quantity} dona</p>
                </div>
              </div>
            </div>

            {/* Patient select */}
            <div>
              <label className="block text-sm font-semibold mb-2">Bemor *</label>
              <select
                value={data.patient_id}
                onChange={(e) => setData({ ...data, patient_id: e.target.value })}
                className="w-full px-3 py-2 border dark:border-gray-700 dark:bg-gray-900 rounded-lg"
              >
                <option value="">Bemorni tanlang...</option>
                {patients.map(p => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.first_name} {p.last_name} - {p.patient_number}{p.room_number ? ` (Xona: ${p.room_number})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold mb-2">Miqdor *</label>
              <input
                type="number"
                min="1"
                max={medicine.quantity}
                value={data.quantity}
                onChange={(e) => setData({ ...data, quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border dark:border-gray-700 dark:bg-gray-900 rounded-lg"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold mb-2">Izoh (ixtiyoriy)</label>
              <textarea
                value={data.notes}
                onChange={(e) => setData({ ...data, notes: e.target.value })}
                className="w-full px-3 py-2 border dark:border-gray-700 dark:bg-gray-900 rounded-lg"
                rows="3"
                placeholder="Izoh yozing..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={!data.patient_id || data.quantity < 1}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
              >
                Berish
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Bekor qilish
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export default DispenseMedicineModal

import { useState } from 'react'
import Modal from '../Modal'

const CompleteTreatmentModal = ({ isOpen, onClose, treatment, onComplete }) => {
  const [notes, setNotes] = useState('')

  const handleSubmit = () => {
    onComplete(treatment.id, notes)
    setNotes('')
  }

  const handleClose = () => {
    setNotes('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Muolajani bajarish" size="sm">
      <div className="space-y-4">
        {treatment && (
          <>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="font-semibold text-gray-900 dark:text-white mb-1">{treatment.patient_name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                💊 {treatment.medication_name || treatment.medicine_name || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Doza: {treatment.dosage || treatment.medicine_dosage || 'N/A'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Izoh (ixtiyoriy)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border dark:border-gray-700 dark:bg-gray-900 rounded-lg text-sm"
                rows="3"
                placeholder="Izoh yozing..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
              >
                Tasdiqlash
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300"
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

export default CompleteTreatmentModal

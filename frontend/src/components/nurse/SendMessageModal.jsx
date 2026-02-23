import { useState } from 'react'
import Modal from '../Modal'

const SendMessageModal = ({ isOpen, onClose, patient, onSend }) => {
  const [message, setMessage] = useState('')

  const handleSubmit = () => {
    if (!message.trim()) return
    onSend(patient, message)
    setMessage('')
  }

  const handleClose = () => {
    setMessage('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bemorga xabar yuborish" size="sm">
      <div className="space-y-4">
        {patient && (
          <>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="size-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600">person</span>
                </div>
                <div>
                  <p className="font-bold">{patient.patient_name || `${patient.first_name} ${patient.last_name}`}</p>
                  <p className="text-sm text-gray-600">{patient.patient_number}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Xabar matni *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-900"
                rows="5"
                placeholder="Xabar matnini kiriting..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={!message.trim()}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">send</span>
                Yuborish
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

export default SendMessageModal

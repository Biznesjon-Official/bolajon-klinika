import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import DateInput from '../components/DateInput'

export default function ChiefDoctorOnDuty() {
  const [loading, setLoading] = useState(true)
  const [onDutySchedule, setOnDutySchedule] = useState([])
  const [availableDoctors, setAvailableDoctors] = useState([])
  const [showAddDutyModal, setShowAddDutyModal] = useState(false)
  const [dutyForm, setDutyForm] = useState({
    doctor_id: '',
    shift_date: new Date().toISOString().split('T')[0],
    shift_type: 'morning',
    start_time: '09:00',
    end_time: '18:00',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [scheduleRes, doctorsRes] = await Promise.all([
        api.get('/chief-doctor/on-duty-schedule'),
        api.get('/chief-doctor/available-doctors')
      ])
      if (scheduleRes.data.success) {
        setOnDutySchedule(scheduleRes.data.data)
      }
      if (doctorsRes.data.success) {
        setAvailableDoctors(doctorsRes.data.data)
      }
    } catch (error) {
      toast.error('Ma\'lumotlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDutyDoctor = async () => {
    try {
      if (!dutyForm.doctor_id) {
        toast.error('Shifokorni tanlang')
        return
      }
      const response = await api.post('/chief-doctor/on-duty-schedule', dutyForm)
      if (response.data.success) {
        toast.success('Navbatdagi shifokor biriktirildi')
        setShowAddDutyModal(false)
        setDutyForm({
          doctor_id: '',
          shift_date: new Date().toISOString().split('T')[0],
          shift_type: 'morning',
          start_time: '09:00',
          end_time: '18:00',
          notes: ''
        })
        loadData()
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Xatolik yuz berdi')
    }
  }

  const handleDeleteDutyDoctor = async (id) => {
    if (!confirm('Navbatdagi shifokorni o\'chirmoqchimisiz?')) return
    try {
      const response = await api.delete(`/chief-doctor/on-duty-schedule/${id}`)
      if (response.data.success) {
        toast.success('O\'chirildi')
        loadData()
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    }
  }

  return (
    <div className="p-3 sm:p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="material-symbols-outlined text-5xl">event_available</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">NAVBATDAGI SHIFOKORLAR</h1>
            <p className="text-base sm:text-lg opacity-90">Navbatchilik jadvali</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddDutyModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 flex items-center gap-2 font-semibold"
        >
          <span className="material-symbols-outlined">add</span>
          Shifokor biriktirish
        </button>
      </div>

      {/* Schedule list */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : onDutySchedule.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">event_available</span>
          <p className="text-gray-600">Navbatdagi shifokorlar yo'q</p>
        </div>
      ) : (
        <div className="space-y-3">
          {onDutySchedule.map(duty => (
            <div key={duty._id} className="bg-white dark:bg-gray-800 border rounded-xl p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-14 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">person</span>
                  </div>
                  <div>
                    <p className="font-bold text-base sm:text-lg">{duty.doctor_id?.first_name} {duty.doctor_id?.last_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{duty.doctor_id?.specialization}</p>
                    <p className="text-sm text-gray-500">{duty.doctor_id?.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{new Date(duty.shift_date).toLocaleDateString('uz-UZ')}</p>
                  <p className="text-sm text-gray-600">{duty.start_time} - {duty.end_time}</p>
                  <p className="text-xs text-gray-500 capitalize">{duty.shift_type}</p>
                </div>
                <button
                  onClick={() => handleDeleteDutyDoctor(duty._id)}
                  className="px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
              {duty.notes && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl">
                  {duty.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Duty Doctor Modal */}
      {showAddDutyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-bold mb-4">Navbatdagi shifokor biriktirish</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Shifokor *</label>
                <select
                  value={dutyForm.doctor_id}
                  onChange={(e) => setDutyForm({ ...dutyForm, doctor_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl dark:bg-gray-900 dark:border-gray-700"
                  required
                >
                  <option value="">Shifokorni tanlang...</option>
                  {availableDoctors.map(doctor => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Sana *</label>
                <DateInput
                  value={dutyForm.shift_date}
                  onChange={(e) => setDutyForm({ ...dutyForm, shift_date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl dark:bg-gray-900 dark:border-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Smena turi *</label>
                <select
                  value={dutyForm.shift_type}
                  onChange={(e) => setDutyForm({ ...dutyForm, shift_type: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="morning">Ertalabki</option>
                  <option value="evening">Kechki</option>
                  <option value="night">Tungi</option>
                  <option value="full_day">Kun bo'yi</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Boshlanish *</label>
                  <input
                    type="time"
                    value={dutyForm.start_time}
                    onChange={(e) => setDutyForm({ ...dutyForm, start_time: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-900 dark:border-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Tugash *</label>
                  <input
                    type="time"
                    value={dutyForm.end_time}
                    onChange={(e) => setDutyForm({ ...dutyForm, end_time: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-900 dark:border-gray-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Izoh</label>
                <textarea
                  value={dutyForm.notes}
                  onChange={(e) => setDutyForm({ ...dutyForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl dark:bg-gray-900 dark:border-gray-700"
                  rows="3"
                  placeholder="Izoh yozing..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddDutyModal(false)}
                  className="flex-1 px-4 py-3 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleAddDutyDoctor}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90"
                >
                  Biriktirish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

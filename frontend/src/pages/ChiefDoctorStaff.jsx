import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import DateInput from '../components/DateInput'

export default function ChiefDoctorStaff() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [staffActivity, setStaffActivity] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedRole, setSelectedRole] = useState('all')

  useEffect(() => {
    loadData()
  }, [selectedDate, selectedRole])

  const loadData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/chief-doctor/staff-activity', {
        params: { date: selectedDate, role: selectedRole }
      })
      if (response.data.success) {
        setStaffActivity(response.data.data)
      }
    } catch (error) {
      console.error('Load data error:', error)
      toast.error('Ma\'lumotlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      present: 'bg-green-100 text-green-700',
      absent: 'bg-red-100 text-red-700',
      late: 'bg-yellow-100 text-yellow-700',
      on_leave: 'bg-blue-100 text-blue-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getStatusText = (status) => {
    const texts = {
      present: 'Ishda',
      absent: 'Yo\'q',
      late: 'Kechikdi',
      on_leave: 'Ta\'tilda'
    }
    return texts[status] || status
  }

  const getRoleText = (role) => {
    const roles = {
      admin: 'Administrator',
      doctor: 'Shifokor',
      nurse: 'Hamshira',
      laborant: 'Laborant',
      sanitar: 'Tozalovchi',
      receptionist: 'Qabulxona',
      masseur: 'Massajchi',
      speech_therapist: 'Logoped',
      chief_doctor: 'Bosh shifokor'
    }
    return roles[role] || role
  }

  return (
    <div className="p-3 sm:p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="material-symbols-outlined text-5xl">groups</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">XODIMLAR FAOLIYATI</h1>
            <p className="text-base sm:text-lg opacity-90">Kunlik monitoring va nazorat</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Sana</label>
            <DateInput
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Lavozim</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
            >
              <option value="all">Barchasi</option>
              <option value="doctor">Shifokor</option>
              <option value="nurse">Hamshira</option>
              <option value="laborant">Laborant</option>
              <option value="receptionist">Qabulxona</option>
              <option value="sanitar">Tozalovchi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff list */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : staffActivity.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">groups</span>
          <p className="text-gray-600">Xodimlar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {staffActivity.map(staff => (
            <div key={staff._id} className="bg-white dark:bg-gray-800 border rounded-xl p-3 sm:p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">person</span>
                  </div>
                  <div>
                    <p className="font-bold">{staff.first_name} {staff.last_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{getRoleText(staff.role)}</p>
                  </div>
                </div>
                {staff.attendance && (
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(staff.attendance.status)}`}>
                    {getStatusText(staff.attendance.status)}
                  </span>
                )}
              </div>
              
              {staff.attendance && (
                <div className="text-sm space-y-1 mb-3">
                  {staff.attendance.check_in && (
                    <p><span className="font-semibold">Keldi:</span> {new Date(staff.attendance.check_in).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</p>
                  )}
                  {staff.attendance.check_out && (
                    <p><span className="font-semibold">Ketdi:</span> {new Date(staff.attendance.check_out).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</p>
                  )}
                </div>
              )}
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
                <p className="text-sm font-semibold mb-1">Vazifalar</p>
                <div className="flex gap-4 text-sm">
                  <span>Jami: {staff.tasks.total}</span>
                  <span className="text-green-600">Bajarildi: {staff.tasks.completed}</span>
                  <span className="text-yellow-600">Kutilmoqda: {staff.tasks.pending}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

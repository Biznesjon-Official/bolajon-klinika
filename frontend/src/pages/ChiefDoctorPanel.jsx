import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function ChiefDoctorPanel() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    staff: { total: 0, present: 0, absent: 0, on_leave: 0 },
    patients: { total: 0, new_today: 0 },
    finance: { today_revenue: 0 },
    tasks: { pending: 0, completed_today: 0 },
    on_duty_doctors: []
  })

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const response = await api.get('/chief-doctor/dashboard')
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      toast.error('Ma\'lumotlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  const quickLinks = [
    { name: 'Xodimlar faoliyati', icon: 'groups', path: '/chief-doctor/staff', color: 'from-blue-500 to-cyan-500' },
    { name: 'Navbatdagi shifokorlar', icon: 'event_available', path: '/chief-doctor/on-duty', color: 'from-green-500 to-emerald-500' },
    { name: 'Kasalliklar bazasi', icon: 'medical_information', path: '/chief-doctor/diseases', color: 'from-amber-500 to-orange-500' },
    { name: 'Mening profilim', icon: 'person', path: '/chief-doctor/profile', color: 'from-purple-500 to-pink-500' }
  ]

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-5xl">medical_information</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">BOSH SHIFOKOR PANELI</h1>
            <p className="text-lg opacity-90">Xush kelibsiz, {user?.first_name || 'Bosh shifokor'}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <span className="material-symbols-outlined text-3xl mb-2">groups</span>
          <p className="text-4xl font-black">{stats.staff.total}</p>
          <p className="opacity-90">Jami xodimlar</p>
          <div className="mt-3 text-xs">
            <p>Ishda: {stats.staff.present} | Yo'q: {stats.staff.absent}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <span className="material-symbols-outlined text-3xl mb-2">person</span>
          <p className="text-4xl font-black">{stats.patients.total}</p>
          <p className="opacity-90">Jami bemorlar</p>
          <div className="mt-3 text-xs">
            <p>Bugun yangi: {stats.patients.new_today}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <span className="material-symbols-outlined text-3xl mb-2">task_alt</span>
          <p className="text-4xl font-black">{stats.tasks.pending}</p>
          <p className="opacity-90">Bajarilmagan vazifalar</p>
          <div className="mt-3 text-xs">
            <p>Bugun bajarildi: {stats.tasks.completed_today}</p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {quickLinks.map(link => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className={`bg-gradient-to-br ${link.color} rounded-xl p-4 sm:p-6 text-white text-left hover:shadow-lg transition-shadow`}
          >
            <span className="material-symbols-outlined text-3xl mb-2">{link.icon}</span>
            <p className="font-bold text-sm sm:text-base">{link.name}</p>
          </button>
        ))}
      </div>

      {/* On-duty doctors today */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border p-6">
        <h3 className="text-xl font-bold mb-4">Bugungi navbatdagi shifokorlar</h3>
        {stats.on_duty_doctors.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">Bugun navbatdagi shifokorlar yo'q</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.on_duty_doctors.map(duty => (
              <div key={duty._id} className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="size-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">person</span>
                  </div>
                  <div>
                    <p className="font-bold">{duty.doctor_id?.first_name} {duty.doctor_id?.last_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{duty.doctor_id?.specialization}</p>
                    <p className="text-xs text-gray-500">{duty.start_time} - {duty.end_time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

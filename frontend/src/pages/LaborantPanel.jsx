import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import laboratoryService from '../services/laboratoryService'
import TestsCatalog from '../components/laboratory/TestsCatalog'
import toast, { Toaster } from 'react-hot-toast'

export default function LaborantPanel() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    today_pending: 0,
    not_ready: 0,
    overdue: 0,
    recent_results: 0
  })
  const [tests, setTests] = useState([])
  const [tatStats, setTatStats] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsData, testsData, tatData] = await Promise.all([
        laboratoryService.getLaborantStats(),
        laboratoryService.getTests(),
        laboratoryService.getTatStats('7d').catch(() => ({ success: false }))
      ])

      if (statsData.success) setStats(statsData.data)
      if (testsData.success) setTests(testsData.data)
      if (tatData.success) setTatStats(tatData.data || [])
    } catch (error) {
      console.error('Load data error:', error)
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

  return (
    <div className="p-3 sm:p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-green-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="material-symbols-outlined text-5xl">science</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">LABORANT PANELI</h1>
            <p className="text-base sm:text-lg opacity-90">Xush kelibsiz, {user?.first_name || 'Laborant'}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
          <span className="material-symbols-outlined text-2xl sm:text-3xl mb-2">pending_actions</span>
          <p className="text-3xl sm:text-4xl font-black">{stats.today_pending}</p>
          <p className="text-sm sm:text-base opacity-90">Bugungi kutilayotgan</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
          <span className="material-symbols-outlined text-2xl sm:text-3xl mb-2">hourglass_empty</span>
          <p className="text-3xl sm:text-4xl font-black">{stats.not_ready}</p>
          <p className="text-sm sm:text-base opacity-90">Tayyorlanmagan</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
          <span className="material-symbols-outlined text-2xl sm:text-3xl mb-2">warning</span>
          <p className="text-3xl sm:text-4xl font-black">{stats.overdue}</p>
          <p className="text-sm sm:text-base opacity-90">Kechikkan</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
          <span className="material-symbols-outlined text-2xl sm:text-3xl mb-2">check_circle</span>
          <p className="text-3xl sm:text-4xl font-black">{stats.recent_results}</p>
          <p className="text-sm sm:text-base opacity-90">Oxirgi natijalar</p>
        </div>
      </div>

      {/* TAT Stats */}
      {tatStats.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-2xl text-primary">timer</span>
            <h2 className="text-lg font-bold">TAT statistikasi (7 kun)</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tatStats.map((t, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border">
                <p className="font-semibold text-sm truncate">{t._id}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                  <span>O'rtacha: <strong className="text-primary">{Math.round(t.avg_tat)} daq</strong></span>
                  <span>Min: {Math.round(t.min_tat)}</span>
                  <span>Max: {Math.round(t.max_tat)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{t.count} ta tahlil</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <a
          href="/lab/orders"
          className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border-2 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow flex items-center gap-4"
        >
          <div className="size-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">assignment</span>
          </div>
          <div>
            <p className="font-bold text-lg">Buyurtmalar</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Natija kiritish va boshqarish</p>
          </div>
        </a>

        <a
          href="/lab/samples"
          className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border-2 border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow flex items-center gap-4"
        >
          <div className="size-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">colorize</span>
          </div>
          <div>
            <p className="font-bold text-lg">Namuna olish</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">QR skanerlash va namuna yig'ish</p>
          </div>
        </a>

        <a
          href="/lab/profile"
          className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border-2 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow flex items-center gap-4"
        >
          <div className="size-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-2xl">person</span>
          </div>
          <div>
            <p className="font-bold text-lg">Mening profilim</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Tarix, maosh, vazifalar</p>
          </div>
        </a>
      </div>

      {/* Tests Catalog */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-2xl text-primary">biotech</span>
            <h2 className="text-xl sm:text-2xl font-bold">Tahlillar katalogi</h2>
          </div>
          <TestsCatalog tests={tests} onRefresh={loadData} />
        </div>
      </div>
    </div>
  )
}

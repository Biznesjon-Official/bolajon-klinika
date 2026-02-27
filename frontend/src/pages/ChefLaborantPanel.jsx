import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import chefLaborantService from '../services/chefLaborantService'

export default function ChefLaborantPanel() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const res = await chefLaborantService.getDashboard()
      if (res.success) setStats(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const statCards = [
    { label: 'Kutilayotgan', value: stats?.stats?.total_pending || 0, icon: 'pending_actions', color: 'bg-yellow-500', path: '/chef-laborant/orders?status=pending' },
    { label: 'Bugun bajarilgan', value: stats?.stats?.today_completed || 0, icon: 'check_circle', color: 'bg-green-500', path: '/chef-laborant/orders?status=completed' },
    { label: 'Kechikkan (24s+)', value: stats?.stats?.today_overdue || 0, icon: 'schedule', color: 'bg-red-500', path: '/chef-laborant/orders?status=pending' },
    { label: 'Bugungi buyurtmalar', value: stats?.stats?.today_orders || 0, icon: 'assignment', color: 'bg-blue-500', path: '/chef-laborant/orders' },
    { label: 'Faol testlar', value: stats?.stats?.total_tests || 0, icon: 'science', color: 'bg-purple-500', path: '/laboratory' },
    { label: 'Laborantlar', value: stats?.stats?.total_laborants || 0, icon: 'groups', color: 'bg-indigo-500', path: '/chef-laborant/performance' }
  ]

  const statusDist = stats?.status_distribution || []
  const statusLabels = {
    pending: { label: 'Kutilayotgan', color: 'bg-yellow-100 text-yellow-800' },
    sample_collected: { label: 'Namuna olingan', color: 'bg-blue-100 text-blue-800' },
    in_progress: { label: 'Jarayonda', color: 'bg-orange-100 text-orange-800' },
    completed: { label: 'Tayyor', color: 'bg-green-100 text-green-800' },
    approved: { label: 'Tasdiqlangan', color: 'bg-emerald-100 text-emerald-800' },
    cancelled: { label: 'Bekor', color: 'bg-red-100 text-red-800' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Bosh Laborant Paneli</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Laboratoriya bo'limi umumiy nazorat</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <Link key={i} to={card.path} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center mb-3`}>
              <span className="material-symbols-outlined text-white">{card.icon}</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{card.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* TAT + Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TAT */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-500">timer</span>
            TAT (Oxirgi 7 kun)
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-2xl font-black text-blue-600">{Math.round(stats?.tat?.avg_tat || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">O'rtacha (daq)</p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-black text-green-600">{Math.round(stats?.tat?.min_tat || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">Minimum</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-black text-red-600">{Math.round(stats?.tat?.max_tat || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">Maksimum</p>
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-500">donut_small</span>
            Status taqsimoti
          </h3>
          <div className="space-y-2">
            {statusDist.map((s) => {
              const info = statusLabels[s._id] || { label: s._id, color: 'bg-gray-100 text-gray-800' }
              return (
                <div key={s._id} className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${info.color}`}>
                    {info.label}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{s.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/chef-laborant/orders" className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-2xl">assignment</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">Barcha buyurtmalar</p>
            <p className="text-xs text-gray-500">Filterlash, tasdiqlash</p>
          </div>
        </Link>
        <Link to="/chef-laborant/performance" className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-2xl">analytics</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">Laborantlar ishlashi</p>
            <p className="text-xs text-gray-500">Performance, TAT</p>
          </div>
        </Link>
        <Link to="/laboratory" className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-2xl">science</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">Testlar katalogi</p>
            <p className="text-xs text-gray-500">Tahlil turlari boshqaruvi</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

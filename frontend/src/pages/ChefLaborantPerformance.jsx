import { useState, useEffect } from 'react'
import chefLaborantService from '../services/chefLaborantService'

export default function ChefLaborantPerformance() {
  const [laborants, setLaborants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPerformance()
  }, [])

  const loadPerformance = async () => {
    try {
      const res = await chefLaborantService.getLaborantPerformance()
      if (res.success) setLaborants(res.data)
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

  // Totals
  const totalCompleted = laborants.reduce((s, l) => s + l.total_completed, 0)
  const totalTodayCompleted = laborants.reduce((s, l) => s + l.today_completed, 0)
  const totalPending = laborants.reduce((s, l) => s + l.pending, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Laborantlar ishlashi</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Har bir laborantning performance ko'rsatkichlari</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-3xl font-black text-indigo-600">{laborants.length}</p>
          <p className="text-xs text-gray-500 mt-1">Faol laborantlar</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-3xl font-black text-green-600">{totalTodayCompleted}</p>
          <p className="text-xs text-gray-500 mt-1">Bugun bajarilgan</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-3xl font-black text-blue-600">{totalCompleted}</p>
          <p className="text-xs text-gray-500 mt-1">Jami bajarilgan</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-3xl font-black text-yellow-600">{totalPending}</p>
          <p className="text-xs text-gray-500 mt-1">Kutilayotgan</p>
        </div>
      </div>

      {/* Laborants Table */}
      {laborants.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <span className="material-symbols-outlined text-5xl mb-3">groups</span>
          <p className="font-semibold">Faol laborantlar topilmadi</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Laborant</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Bugun</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Jami bajarilgan</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Kutilayotgan</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">O'rtacha TAT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {laborants.map(lab => (
                <tr key={lab._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-indigo-600">person</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{lab.name}</p>
                        <p className="text-xs text-gray-500">{lab.phone || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-lg font-bold text-green-600">{lab.today_completed}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-lg font-bold text-blue-600">{lab.total_completed}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-lg font-bold ${lab.pending > 5 ? 'text-red-600' : 'text-yellow-600'}`}>
                      {lab.pending}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                      lab.avg_tat > 120 ? 'bg-red-100 text-red-800' : lab.avg_tat > 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {lab.avg_tat} daq
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

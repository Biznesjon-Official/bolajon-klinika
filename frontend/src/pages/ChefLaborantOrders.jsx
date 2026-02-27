import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import chefLaborantService from '../services/chefLaborantService'
import laboratoryService from '../services/laboratoryService'

const STATUS_OPTIONS = [
  { value: '', label: 'Barchasi' },
  { value: 'pending', label: 'Kutilayotgan' },
  { value: 'sample_collected', label: 'Namuna olingan' },
  { value: 'in_progress', label: 'Jarayonda' },
  { value: 'completed', label: 'Tayyor' },
  { value: 'approved', label: 'Tasdiqlangan' },
  { value: 'cancelled', label: 'Bekor' }
]

const STATUS_BADGES = {
  pending: 'bg-yellow-100 text-yellow-800',
  sample_collected: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  approved: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800'
}

export default function ChefLaborantOrders() {
  const [searchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    page: 1
  })

  useEffect(() => {
    loadOrders()
  }, [filters])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const params = { page: filters.page, limit: 20 }
      if (filters.status) params.status = filters.status
      const res = await chefLaborantService.getAllOrders(params)
      if (res.success) {
        setOrders(res.data)
        setPagination(res.pagination)
      }
    } catch (err) {
      toast.error('Buyurtmalarni yuklashda xato')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (orderId) => {
    try {
      await laboratoryService.approveOrder(orderId)
      toast.success('Natija tasdiqlandi')
      loadOrders()
    } catch (err) {
      toast.error('Tasdiqlashda xato')
    }
  }

  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('uz-UZ', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Barcha buyurtmalar</h1>
        <span className="text-sm text-gray-500">Jami: {pagination.total || 0}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilters({ ...filters, status: opt.value, page: 1 })}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              filters.status === opt.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <span className="material-symbols-outlined text-5xl mb-3">inbox</span>
          <p className="font-semibold">Buyurtmalar topilmadi</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Buyurtma</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Bemor</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Test</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Sana</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Bajaruvchi</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {orders.map(order => (
                <tr key={order.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${order.critical_alert ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">{order.order_number}</span>
                    {order.critical_alert && (
                      <span className="ml-2 text-red-500" title="Kritik qiymat">
                        <span className="material-symbols-outlined text-sm">warning</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.patient_name}</p>
                    <p className="text-xs text-gray-500">{order.patient_number}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900 dark:text-white">{order.test_name}</p>
                    {order.category && <p className="text-xs text-gray-500">{order.category}</p>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_BADGES[order.status] || 'bg-gray-100 text-gray-800'}`}>
                      {STATUS_OPTIONS.find(o => o.value === order.status)?.label || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    <p>{formatDate(order.created_at)}</p>
                    {order.completed_at && <p className="text-green-600">Tayyor: {formatDate(order.completed_at)}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {order.completed_by || '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {order.status === 'completed' && (
                      <button
                        onClick={() => handleApprove(order.id)}
                        className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600"
                      >
                        Tasdiqlash
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page <= 1}
                className="px-3 py-1 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 disabled:opacity-50"
              >
                Oldingi
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= pagination.pages}
                className="px-3 py-1 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 disabled:opacity-50"
              >
                Keyingi
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

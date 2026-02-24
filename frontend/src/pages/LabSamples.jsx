import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import laboratoryService from '../services/laboratoryService'
import toast, { Toaster } from 'react-hot-toast'

export default function LabSamples() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const ordersData = await laboratoryService.getOrders({ status: 'all' })
      if (ordersData.success) setOrders(ordersData.data)
    } catch (error) {
      toast.error("Ma'lumotlarni yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }

  const handleScanQR = async (qrCode) => {
    if (!qrCode || !qrCode.trim()) {
      toast.error('QR kodni kiriting')
      return
    }
    try {
      const response = await laboratoryService.scanQR(qrCode.trim())
      if (response.success) {
        toast.success('QR-kod muvaffaqiyatli skanerlandi')
        setSelectedOrder(response.data)
        loadData()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'QR-kod topilmadi')
    }
  }

  const handleCollectSample = async (orderId) => {
    try {
      const response = await laboratoryService.updateOrderStatus(orderId, 'sample_collected')
      if (response.success) {
        toast.success('Namuna olindi')
        await loadData()
        navigate('/lab/orders')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi')
    }
  }

  const pendingOrders = orders.filter(o => o.status === 'pending')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-black tracking-wide">NAMUNA OLISH</h1>
        <p className="text-green-100 mt-1 text-sm sm:text-base">
          Xush kelibsiz, {user?.first_name} {user?.last_name}
        </p>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* QR Scanning section */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <span className="material-symbols-outlined text-2xl sm:text-3xl text-green-600">colorize</span>
            <div>
              <h3 className="text-lg sm:text-xl font-bold">Namuna olish</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                QR-kodni skanerlang yoki quyidagi ro'yxatdan tanlang
              </p>
            </div>
          </div>
          <div className="max-w-sm sm:max-w-md">
            <input
              type="text"
              placeholder="QR-kod yoki buyurtma raqami (LAB000001)"
              className="w-full px-4 sm:px-6 py-2 sm:py-3 border rounded-lg sm:rounded-xl dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleScanQR(e.target.value)
                  e.target.value = ''
                }
              }}
            />
          </div>
        </div>

        {/* Pending orders list */}
        <div>
          <h4 className="text-base sm:text-lg font-bold mb-4">
            Namuna olish kutilayotgan buyurtmalar
          </h4>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Yuklanmoqda...</div>
          ) : pendingOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-xl">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">check_circle</span>
              <p className="text-gray-600 dark:text-gray-400">Barcha namunalar olingan</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {pendingOrders.map(order => (
                <div
                  key={order.id}
                  className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <div className="size-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-xl sm:text-2xl">
                            person
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-base sm:text-lg">
                            {order.patient_first_name} {order.patient_last_name}
                          </p>
                          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                            {order.patient_number}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm sm:text-base ml-15">
                        <p><span className="font-semibold">Buyurtma:</span> {order.order_number}</p>
                        <p><span className="font-semibold">Tahlil:</span> {order.test_name}</p>
                        <p><span className="font-semibold">Namuna:</span> {order.sample_type || 'Qon'}</p>
                        <p><span className="font-semibold">Sana:</span> {new Date(order.created_at).toLocaleString('uz-UZ')}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                        🟡 Kutilmoqda
                      </span>
                      <button
                        onClick={() => handleCollectSample(order.id)}
                        className="px-4 sm:px-6 py-2 sm:py-2.5 bg-green-500 text-white rounded-lg sm:rounded-xl hover:bg-green-600 text-sm sm:text-base font-semibold flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base sm:text-lg">colorize</span>
                        Namuna olish
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

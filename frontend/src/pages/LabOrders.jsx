import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import laboratoryService from '../services/laboratoryService'
import labReagentService from '../services/labReagentService'
import toast, { Toaster } from 'react-hot-toast'
import DateInput from '../components/DateInput'

export default function LabOrders() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultForm, setResultForm] = useState({ test_results: [], notes: '' })
  const [testParams, setTestParams] = useState([])
  const [loadingTestParams, setLoadingTestParams] = useState(false)
  const [tableRows, setTableRows] = useState([['', ''], ['', ''], ['', ''], ['', '']])

  const [filters, setFilters] = useState({
    date: '',
    test_type: '',
    status: 'all',
    patient_search: ''
  })

  // Reagent state
  const [reagents, setReagents] = useState([])
  const [selectedReagent, setSelectedReagent] = useState(null)

  useEffect(() => {
    loadData()
    loadReagents()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const ordersData = await laboratoryService.getOrders({ status: 'all' })
      if (ordersData.success) setOrders(ordersData.data)
    } catch (error) {
      toast.error('Ma\'lumotlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const loadReagents = async () => {
    try {
      const response = await labReagentService.getReagents({ status: 'active' })
      if (response.success) {
        setReagents(response.data.filter(r => r.status === 'active' && r.remaining_tests > 0))
      }
    } catch (error) {
      // silent
    }
  }

  const handleCollectSample = async (orderId) => {
    try {
      const response = await laboratoryService.updateOrderStatus(orderId, 'sample_collected')
      if (response.success) {
        toast.success('Namuna olindi')
        await loadData()
        const order = orders.find(o => o.id === orderId)
        if (order) handleOpenResultModal(order)
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    }
  }

  const handleOpenResultModal = (order) => {
    setSelectedOrder(order)
    setSelectedReagent(null)
    setTableRows([['', ''], ['', ''], ['', ''], ['', '']])
    setResultForm({ test_results: [], notes: '' })
    setShowResultModal(true)
    loadTestParameters(order)
  }

  const loadTestParameters = async (order) => {
    if (!order?.test_id) {
      setTestParams([])
      return
    }
    try {
      setLoadingTestParams(true)
      const response = await laboratoryService.getTestById(order.test_id)
      if (response.success && response.data?.test_parameters?.length) {
        setTestParams(response.data.test_parameters.map(p => ({
          name: p.name || p.parameter,
          value: '',
          unit: p.unit || '',
          normalRange: p.normal_range || p.normalRange || '',
          critical_low: p.critical_low || '',
          critical_high: p.critical_high || ''
        })))
      } else {
        setTestParams([])
      }
    } catch (error) {
      setTestParams([])
    } finally {
      setLoadingTestParams(false)
    }
  }

  const addTableRow = () => setTableRows([...tableRows, ['', '']])

  const removeTableRow = (index) => {
    if (tableRows.length > 1) setTableRows(tableRows.filter((_, i) => i !== index))
  }

  const updateTableCell = (rowIndex, colIndex, value) => {
    const newRows = [...tableRows]
    newRows[rowIndex][colIndex] = value
    setTableRows(newRows)
  }

  // Check if value is critical
  const isCriticalValue = (param) => {
    if (!param.value || (!param.critical_low && !param.critical_high)) return null
    const numVal = parseFloat(param.value.replace(',', '.'))
    if (isNaN(numVal)) return null
    if (param.critical_low && numVal < parseFloat(param.critical_low.replace(',', '.'))) return 'low'
    if (param.critical_high && numVal > parseFloat(param.critical_high.replace(',', '.'))) return 'high'
    return null
  }

  const handleSubmitResults = async () => {
    try {
      if (!selectedReagent) {
        toast.error('Iltimos, reaktiv tanlang')
        return
      }

      let test_results

      if (testParams.length > 0) {
        const hasValues = testParams.some(p => p.value.trim() !== '')
        if (!hasValues) {
          toast.error('Kamida bitta parametr qiymatini kiriting')
          return
        }
        test_results = testParams
          .filter(p => p.value.trim() !== '')
          .map(p => ({
            parameter_name: p.name,
            value: p.value,
            unit: p.unit,
            normal_range: p.normalRange,
            is_normal: isCriticalValue(p) === null
          }))
      } else {
        // Fallback: free-form table
        const tableText = tableRows
          .filter(row => row[0] || row[1])
          .map(row => `${row[0]}\t${row[1]}`)
          .join('\n')

        if (!tableText.trim()) {
          toast.error('Natijani kiriting')
          return
        }

        test_results = [{
          parameter_name: 'Natija',
          value: tableText,
          unit: '',
          normal_range: '',
          is_normal: null
        }]
      }

      const response = await laboratoryService.submitResults(selectedOrder.id, {
        test_results,
        notes: resultForm.notes,
        reagent_id: selectedReagent._id,
        patient_id: selectedOrder.patient_id
      })

      if (response.success) {
        toast.success('Natijalar muvaffaqiyatli kiritildi')
        setShowResultModal(false)
        setSelectedOrder(null)
        setSelectedReagent(null)
        loadData()
        loadReagents()
      }
    } catch (error) {
      toast.error('Natijalarni kiritishda xatolik')
    }
  }

  const handleApproveOrder = async (orderId) => {
    try {
      const response = await laboratoryService.approveOrder(orderId)
      if (response.success) {
        toast.success('Natija tasdiqlandi')
        loadData()
      }
    } catch (error) {
      toast.error('Tasdiqlashda xatolik')
    }
  }

  const getStatusBadge = (order) => {
    const map = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: '🟡', label: 'Kutilmoqda' },
      sample_collected: { color: 'bg-blue-100 text-blue-800', icon: '🔵', label: 'Namuna olingan' },
      in_progress: { color: 'bg-purple-100 text-purple-800', icon: '🟣', label: 'Jarayonda' },
      completed: { color: 'bg-green-100 text-green-800', icon: '🟢', label: 'Tayyor' },
      approved: { color: 'bg-emerald-100 text-emerald-800', icon: '✅', label: 'Tasdiqlangan' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: '🔴', label: 'Bekor qilingan' }
    }
    const s = map[order.status] || map.pending
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.color}`}>
        {s.icon} {s.label}
      </span>
    )
  }

  const filteredOrders = orders.filter(order => {
    if (filters.status !== 'all' && order.status !== filters.status) return false
    if (filters.test_type && order.test_type !== filters.test_type) return false
    if (filters.date && !order.created_at?.startsWith(filters.date)) return false
    if (filters.patient_search) {
      const search = filters.patient_search.toLowerCase()
      const patientName = `${order.patient_first_name} ${order.patient_last_name}`.toLowerCase()
      if (!patientName.includes(search) && !order.patient_number?.toLowerCase().includes(search)) return false
    }
    return true
  })

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
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="material-symbols-outlined text-5xl">assignment</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">LABORATORIYA BUYURTMALARI</h1>
            <p className="text-base sm:text-lg opacity-90">Barcha buyurtmalar ro'yxati</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <DateInput
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="px-4 py-2 sm:py-2.5 border rounded-lg sm:rounded-xl"
            placeholder="Sana"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 sm:py-2.5 border rounded-lg sm:rounded-xl"
          >
            <option value="all">Barcha statuslar</option>
            <option value="pending">Kutilmoqda</option>
            <option value="sample_collected">Namuna olingan</option>
            <option value="in_progress">Jarayonda</option>
            <option value="completed">Tayyor</option>
            <option value="approved">Tasdiqlangan</option>
          </select>
          <input
            type="text"
            value={filters.patient_search}
            onChange={(e) => setFilters({ ...filters, patient_search: e.target.value })}
            className="px-4 py-2 sm:py-2.5 border rounded-lg sm:rounded-xl"
            placeholder="Bemor qidirish..."
          />
        </div>

        {/* Orders List */}
        <div className="space-y-2 sm:space-y-3">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className={`bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-shadow ${order.critical_alert ? 'border-2 border-red-500 ring-2 ring-red-200' : ''}`}
            >
              {/* Critical Alert Banner */}
              {order.critical_alert && (
                <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/30 border border-red-300 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-600 text-xl">warning</span>
                  <span className="text-sm font-bold text-red-700 dark:text-red-400">KRITIK QIYMAT ANIQLANGAN</span>
                  {order.critical_values?.map((cv, i) => (
                    <span key={i} className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                      {cv.parameter_name}: {cv.value} ({cv.critical_type === 'high' ? '↑' : '↓'})
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <span className="material-symbols-outlined text-xl sm:text-2xl text-primary">person</span>
                    <div>
                      <p className="font-bold text-base sm:text-lg">
                        {order.patient_first_name} {order.patient_last_name}
                      </p>
                      <p className="text-sm text-gray-600">{order.patient_number}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <p><span className="font-semibold">Tahlil:</span> {order.test_name}</p>
                    <p><span className="font-semibold">Sana:</span> {new Date(order.created_at).toLocaleString('uz-UZ')}</p>
                    {order.tat_minutes && (
                      <p><span className="font-semibold">TAT:</span> {order.tat_minutes} daqiqa</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {getStatusBadge(order)}

                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleCollectSample(order.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                    >
                      Namuna olish
                    </button>
                  )}
                  {order.status === 'sample_collected' && (
                    <button
                      onClick={() => handleOpenResultModal(order)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                    >
                      Natija kiritish
                    </button>
                  )}
                  {order.status === 'completed' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveOrder(order.id)}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Tasdiqlash
                      </button>
                      <button
                        onClick={() => window.open(`/laboratory/result/${order.id}`, '_blank')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                        PDF
                      </button>
                      <button
                        onClick={() => handleOpenResultModal(order)}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Tahrirlash
                      </button>
                    </div>
                  )}
                  {order.status === 'approved' && (
                    <button
                      onClick={() => window.open(`/laboratory/result/${order.id}`, '_blank')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                      PDF
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <span className="material-symbols-outlined text-5xl mb-3 block">science</span>
              <p className="text-lg font-semibold">Buyurtmalar topilmadi</p>
            </div>
          )}
        </div>
      </div>

      {/* Result Modal */}
      {showResultModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-bold">Natija kiritish</h3>
                <button onClick={() => setShowResultModal(false)} className="text-gray-500 hover:text-gray-700">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="mb-4 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="font-semibold">{selectedOrder.patient_first_name} {selectedOrder.patient_last_name}</p>
                <p className="text-sm text-gray-600">{selectedOrder.test_name}</p>
              </div>

              <div className="space-y-4">
                {/* Reaktiv tanlash */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Qaysi reaktivdan foydalandingiz? <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedReagent?._id || ''}
                    onChange={(e) => setSelectedReagent(reagents.find(r => r._id === e.target.value))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Reaktiv tanlang...</option>
                    {reagents.map(reagent => (
                      <option key={reagent._id} value={reagent._id}>
                        {reagent.name} - {reagent.remaining_tests} ta qolgan ({new Intl.NumberFormat('uz-UZ').format(reagent.price_per_test)} so'm)
                      </option>
                    ))}
                  </select>
                  {selectedReagent && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Reaktiv:</span> {selectedReagent.name}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Narx:</span> {new Intl.NumberFormat('uz-UZ').format(selectedReagent.price_per_test)} so'm
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Bu narx bemorga qarz sifatida yoziladi
                      </p>
                    </div>
                  )}
                </div>

                {/* Dynamic test parameters */}
                {loadingTestParams ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2 text-sm text-gray-500">Parametrlar yuklanmoqda...</span>
                  </div>
                ) : testParams.length > 0 ? (
                  <div>
                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600">description</span>
                        <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold">
                          {testParams.length} ta parametr
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border-2 border-gray-300 dark:border-gray-700">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <th className="border border-gray-300 dark:border-gray-700 px-3 py-3 text-center text-sm font-bold" style={{ width: '50px' }}>№</th>
                            <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-left text-sm font-bold">TAHLIL NOMI</th>
                            <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-center text-sm font-bold" style={{ width: '180px' }}>NATIJA</th>
                            <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-center text-sm font-bold text-blue-600">ME'YOR</th>
                            <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-center text-sm font-bold text-blue-600" style={{ width: '120px' }}>O'LCHOV BIRLIGI</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testParams.map((param, index) => {
                            const critical = isCriticalValue(param)
                            return (
                              <tr key={index} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${critical ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                                <td className="border border-gray-300 dark:border-gray-700 px-3 py-3 text-center text-sm font-semibold">{index + 1}.</td>
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-left text-sm font-bold uppercase whitespace-pre-line">{param.name}</td>
                                <td className="border border-gray-300 dark:border-gray-700 px-2 py-2">
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={param.value}
                                      onChange={(e) => {
                                        const newParams = [...testParams]
                                        newParams[index].value = e.target.value
                                        setTestParams(newParams)
                                      }}
                                      className={`w-full px-3 py-2.5 border rounded text-center text-sm focus:outline-none focus:ring-2 ${
                                        critical
                                          ? 'border-red-500 bg-red-50 text-red-700 focus:ring-red-500'
                                          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                                      }`}
                                      placeholder="Qiymat"
                                    />
                                    {critical && (
                                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500" title={critical === 'high' ? 'YUQORI' : 'PAST'}>
                                        <span className="material-symbols-outlined text-base">warning</span>
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-center text-sm text-blue-600 font-semibold whitespace-pre-line">{param.normalRange}</td>
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-center text-sm text-blue-600 font-semibold">{param.unit}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Fallback: free-form table */
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold">Natija *</label>
                      <button
                        type="button"
                        onClick={addTableRow}
                        className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 flex items-center gap-1"
                      >
                        <span className="text-lg">+</span> Qator qo'shish
                      </button>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <tbody>
                          {tableRows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b last:border-b-0">
                              <td className="p-0 w-1/2 border-r">
                                <input
                                  type="text"
                                  value={row[0]}
                                  onChange={(e) => updateTableCell(rowIndex, 0, e.target.value)}
                                  className="w-full px-3 py-2.5 border-0 focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="Parametr"
                                />
                              </td>
                              <td className="p-0 w-1/2 relative">
                                <input
                                  type="text"
                                  value={row[1]}
                                  onChange={(e) => updateTableCell(rowIndex, 1, e.target.value)}
                                  className="w-full px-3 py-2.5 pr-10 border-0 focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="Qiymat"
                                />
                                {tableRows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeTableRow(rowIndex)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700"
                                  >
                                    <span className="text-lg">−</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Izohlar */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Izohlar</label>
                  <textarea
                    value={resultForm.notes}
                    onChange={(e) => setResultForm({ ...resultForm, notes: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl"
                    rows="3"
                    placeholder="Qo'shimcha izohlar..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowResultModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSubmitResults}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600"
                >
                  Natijani yuborish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

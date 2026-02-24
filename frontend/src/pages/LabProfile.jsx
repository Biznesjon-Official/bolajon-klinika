/**
 * LAB PROFILE PAGE
 * Laborant profili - 3 ta tab: Tarix, Maosh, Vazifalar
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import laboratoryService from '../services/laboratoryService'
import staffSalaryService from '../services/staffSalaryService'
import taskService from '../services/taskService'
import attendanceService from '../services/attendanceService'
import api from '../services/api'
import toast, { Toaster } from 'react-hot-toast'
import Modal from '../components/Modal'

export default function LabProfile() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('history')
  const [loading, setLoading] = useState(true)

  // History state
  const [history, setHistory] = useState([])
  const [selectedPatientHistory, setSelectedPatientHistory] = useState(null)

  // Salary state
  const [salaryData, setSalaryData] = useState(null)
  const [bonusesData, setBonusesData] = useState(null)
  const [commissionsData, setCommissionsData] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Salary sub-tabs
  const [salaryTab, setSalaryTab] = useState('overview')

  // Tasks state
  const [tasks, setTasks] = useState([])
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [workSchedule, setWorkSchedule] = useState(null)
  const [checkingIn, setCheckingIn] = useState(false)

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory()
    } else if (activeTab === 'salary') {
      loadSalary()
    } else if (activeTab === 'tasks') {
      loadTasks()
      loadTodayAttendance()
      loadWorkSchedule()
    }
  }, [activeTab])

  useEffect(() => {
    if (salaryTab === 'commissions') {
      loadCommissions()
    }
  }, [salaryTab, selectedMonth, selectedYear])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const historyData = await laboratoryService.getCompletedTests()
      if (historyData.success) setHistory(historyData.data)
    } catch (error) {
      console.error('Load history error:', error)
      toast.error('Tarixni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const loadSalary = async () => {
    try {
      setLoading(true)
      const [salaryResponse, bonusesResponse] = await Promise.all([
        staffSalaryService.getMySalary(),
        staffSalaryService.getMyBonuses()
      ])

      if (salaryResponse.success) {
        setSalaryData(salaryResponse.data)
      }
      if (bonusesResponse.success) {
        setBonusesData(bonusesResponse.data)
      }
    } catch (error) {
      console.error('Load salary error:', error)
      toast.error('Ma\'lumotlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const loadCommissions = async () => {
    try {
      const response = await staffSalaryService.getMyCommissions(selectedMonth, selectedYear)
      if (response.success) {
        setCommissionsData(response.data)
      }
    } catch (error) {
      console.error('Load commissions error:', error)
      toast.error('Komissiyalarni yuklashda xatolik')
    }
  }

  const loadTasks = async () => {
    try {
      setLoading(true)
      const response = await taskService.getMyTasks()
      if (response.success) {
        setTasks(response.data)
      }
    } catch (error) {
      console.error('Load tasks error:', error)
      toast.error('Vazifalarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const loadTodayAttendance = async () => {
    try {
      const response = await attendanceService.getTodayAttendance()
      if (response.success) {
        setTodayAttendance(response.data)
      }
    } catch (error) {
      console.error('Load attendance error:', error)
    }
  }

  const loadWorkSchedule = async () => {
    try {
      const response = await api.get('/payroll/my-work-schedule')
      if (response.data.success) {
        setWorkSchedule(response.data.data)
      }
    } catch (error) {
      console.error('Load work schedule error:', error)
    }
  }

  const handleCheckIn = async () => {
    if (!confirm('Ishga kelganingizni tasdiqlaysizmi?')) return

    setCheckingIn(true)
    try {
      const response = await attendanceService.checkIn()

      if (response.success) {
        if (response.data.isLate) {
          toast.error(response.message, { duration: 8000 })
        } else {
          toast.success(response.message)
        }
        loadTodayAttendance()
      }
    } catch (error) {
      console.error('Check in error:', error)
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi')
    } finally {
      setCheckingIn(false)
    }
  }

  const handleCheckOut = async () => {
    if (!confirm('Ishdan ketayotganingizni tasdiqlaysizmi?')) return

    setCheckingIn(true)
    try {
      const response = await attendanceService.checkOut()

      if (response.success) {
        if (response.data.isEarly) {
          toast.error(response.message, { duration: 8000 })
        } else {
          toast.success(response.message)
        }
        loadTodayAttendance()
      }
    } catch (error) {
      console.error('Check out error:', error)
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi')
    } finally {
      setCheckingIn(false)
    }
  }

  const handleStartTask = async (taskId) => {
    try {
      const response = await taskService.startTask(taskId)

      if (response.success) {
        toast.success('Vazifa boshlandi')
        loadTasks()
      }
    } catch (error) {
      console.error('Start task error:', error)
      toast.error('Vazifani boshlashda xatolik')
    }
  }

  const handleCompleteTask = async () => {
    try {
      const response = await taskService.completeTask(selectedTask.id, completionNotes)

      if (response.success) {
        toast.success('Vazifa tugatildi. Admin tasdiqini kutmoqda.')
        setShowCompleteModal(false)
        setSelectedTask(null)
        setCompletionNotes('')
        loadTasks()
      }
    } catch (error) {
      console.error('Complete task error:', error)
      toast.error('Vazifani tugatishda xatolik')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('uz-UZ').format(amount || 0) + ' so\'m'
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMonthName = (month) => {
    const months = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ]
    return months[month - 1]
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Yangi', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      in_progress: { text: 'Bajarilmoqda', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      completed: { text: 'Tugatilgan', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
      verified: { text: 'Tasdiqlangan', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' }
    }
    return badges[status] || badges.pending
  }

  const getPriorityBadge = (priority) => {
    const badges = {
      low: { text: 'Past', class: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
      medium: { text: 'O\'rta', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      high: { text: 'Yuqori', class: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
      urgent: { text: 'Shoshilinch', class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
    }
    return badges[priority] || badges.medium
  }

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'all') return true
    return task.status === filterStatus
  })

  const taskStats = {
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    verified: tasks.filter(t => t.status === 'verified').length
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
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-white/20 p-3 rounded-lg sm:rounded-xl">
            <span className="material-symbols-outlined text-3xl sm:text-4xl">person</span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-black">MENING PROFILIM</h1>
            <p className="text-purple-100 mt-1">
              {user?.first_name || 'Laborant'} {user?.last_name || ''}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
        {[
          { id: 'history', label: 'Tarix', icon: 'history' },
          { id: 'salary', label: 'Maosh', icon: 'account_balance_wallet' },
          { id: 'tasks', label: 'Vazifalar', icon: 'task_alt' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== HISTORY TAB ==================== */}
      {activeTab === 'history' && (
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-lg sm:text-xl font-bold">Tahlillar Tarixi</h3>

          {!selectedPatientHistory ? (
            // Patient list
            <div>
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">history</span>
                  <p className="text-gray-600 dark:text-gray-400">Hali tahlillar yo'q</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {history.map(item => (
                    <div
                      key={item.patient_id}
                      onClick={() => setSelectedPatientHistory(item)}
                      className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg sm:rounded-xl p-3 sm:p-4 cursor-pointer hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 mb-3">
                        <div className="size-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-xl sm:text-2xl">person</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm sm:text-base truncate">{item.patient_name}</p>
                          <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">{item.patient_number}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm sm:text-sm sm:text-base">
                        <p><span className="font-semibold">Tahlillar:</span> {item.total_tests}</p>
                        <p><span className="font-semibold">Oxirgi:</span> {new Date(item.last_test_date).toLocaleDateString('uz-UZ')}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {item.completed_by_name || 'Laborant'}
                        </span>
                        <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Patient test details
            <div>
              <button
                onClick={() => setSelectedPatientHistory(null)}
                className="mb-4 flex items-center gap-2 sm:gap-2 sm:gap-3 text-primary hover:text-primary/80 font-semibold"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Orqaga
              </button>

              <div className="bg-gradient-to-r from-purple-500 to-green-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white mb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="size-16 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl sm:text-4xl">person</span>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">{selectedPatientHistory.patient_name}</h2>
                    <p className="text-sm sm:text-sm sm:text-base opacity-90">{selectedPatientHistory.patient_number}</p>
                    <p className="text-sm sm:text-sm sm:text-base opacity-90">Jami tahlillar: {selectedPatientHistory.total_tests}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {selectedPatientHistory.tests?.map((test, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border dark:border-gray-700 p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold">{test.test_name}</h3>
                        <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">
                          {new Date(test.completed_at).toLocaleString('uz-UZ', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-sm sm:text-sm sm:text-base font-semibold">
                        ✓ Tayyor
                      </span>
                    </div>

                    {/* Test Results */}
                    {test.results && test.results.length > 0 && (
                      <div className="space-y-2 sm:space-y-3">
                        <h4 className="font-semibold text-sm sm:text-sm sm:text-base text-gray-700 dark:text-gray-300">Natijalar:</h4>
                        {test.results.map((result, rIndex) => (
                          <div key={rIndex} className="bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-semibold">{result.parameter_name}</p>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                result.is_normal
                                  ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                  : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                              }`}>
                                {result.is_normal ? '✓ Normal' : '⚠ Normal emas'}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm sm:text-sm sm:text-base">
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Qiymat</p>
                                <p className="font-bold text-base sm:text-lg">{result.value} {result.unit}</p>
                              </div>
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Normal diapazon</p>
                                <p className="font-semibold">{result.normal_range || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Status</p>
                                <p className={`font-semibold ${
                                  result.is_normal ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {result.is_normal ? 'Normal' : 'Norma emas'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    {test.notes && (
                      <div className="mt-4 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-lg sm:rounded-xl">
                        <p className="text-sm sm:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">Izohlar:</p>
                        <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">{test.notes}</p>
                      </div>
                    )}

                    {/* Laborant info */}
                    <div className="mt-4 pt-4 border-t dark:border-gray-700 flex items-center gap-2 sm:gap-2 sm:gap-3 text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      <span className="material-symbols-outlined text-base sm:text-lg">person</span>
                      <span>Laborant: {test.completed_by_name || 'Noma\'lum'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== SALARY TAB ==================== */}
      {activeTab === 'salary' && (
        <div className="space-y-3 sm:space-y-4 sm:space-y-6">
          {!salaryData ? (
            <div className="p-4 sm:p-6 lg:p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">Maosh ma'lumotlari topilmadi</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {/* Base Salary */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3">
                    <div className="size-12 bg-white/20 rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl sm:text-2xl">payments</span>
                    </div>
                    <div>
                      <p className="text-sm sm:text-sm sm:text-base opacity-90">Asosiy Maosh</p>
                      <p className="text-xl sm:text-2xl font-black">{formatCurrency(salaryData.currentSalary.baseSalary)}</p>
                    </div>
                  </div>
                  <div className="text-xs opacity-75 mt-2">
                    {salaryData.currentSalary.effectiveFrom &&
                      `${formatDate(salaryData.currentSalary.effectiveFrom)} dan`
                    }
                  </div>
                </div>

                {/* This Month */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3">
                    <div className="size-12 bg-white/20 rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl sm:text-2xl">calendar_month</span>
                    </div>
                    <div>
                      <p className="text-sm sm:text-sm sm:text-base opacity-90">Shu Oy</p>
                      <p className="text-xl sm:text-2xl font-black">{formatCurrency(salaryData.thisMonth.total)}</p>
                    </div>
                  </div>
                  <div className="text-xs opacity-75 mt-2">
                    {getMonthName(new Date().getMonth() + 1)} {new Date().getFullYear()}
                  </div>
                </div>

                {/* Average Salary */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3">
                    <div className="size-12 bg-white/20 rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl sm:text-2xl">trending_up</span>
                    </div>
                    <div>
                      <p className="text-sm sm:text-sm sm:text-base opacity-90">O'rtacha Maosh</p>
                      <p className="text-xl sm:text-2xl font-black">{formatCurrency(salaryData.statistics.averageSalary)}</p>
                    </div>
                  </div>
                  <div className="text-xs opacity-75 mt-2">
                    {salaryData.statistics.monthsWorked} oylik o'rtacha
                  </div>
                </div>

                {/* Total Earned */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3">
                    <div className="size-12 bg-white/20 rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl sm:text-2xl">account_balance_wallet</span>
                    </div>
                    <div>
                      <p className="text-sm sm:text-sm sm:text-base opacity-90">Jami Olgan</p>
                      <p className="text-xl sm:text-2xl font-black">{formatCurrency(salaryData.statistics.totalEarned)}</p>
                    </div>
                  </div>
                  <div className="text-xs opacity-75 mt-2">
                    {salaryData.statistics.lastPayment &&
                      `Oxirgi: ${formatDate(salaryData.statistics.lastPayment.payment_date)}`
                    }
                  </div>
                </div>
              </div>

              {/* Next Payment Info */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 rounded-lg sm:rounded-xl p-4 sm:p-6 border-2 border-green-200 dark:border-green-800">
                <div className="flex flex-col sm:flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="size-16 bg-green-500 rounded-lg sm:rounded-xl flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-2xl sm:text-3xl">event</span>
                    </div>
                    <div>
                      <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 font-semibold">Keyingi To'lov</p>
                      <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{formatDate(salaryData.nextPayment.date)}</p>
                      <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                        Taxminiy: {formatCurrency(salaryData.nextPayment.estimatedAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-green-500 text-white rounded-lg sm:rounded-lg sm:rounded-xl font-semibold">
                    {salaryData.nextPayment.status === 'paid' ? '✓ To\'langan' : '⏳ Kutilmoqda'}
                  </div>
                </div>
              </div>

              {/* Salary Sub-Tabs */}
              <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl shadow-sm">
                <div className="border-b border-gray-200 dark:border-gray-800">
                  <div className="flex gap-2 sm:gap-2 sm:gap-3 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-hide">
                    {[
                      { id: 'overview', label: 'Umumiy', icon: 'dashboard' },
                      { id: 'history', label: 'Tarix', icon: 'history' },
                      { id: 'bonuses', label: 'Bonuslar', icon: 'star' },
                      { id: 'commissions', label: 'Komissiyalar', icon: 'percent' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setSalaryTab(tab.id)}
                        className={`flex items-center gap-2 sm:gap-2 sm:gap-3 px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                          salaryTab === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg sm:text-xl">{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  {/* Overview Tab */}
                  {salaryTab === 'overview' && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-lg sm:text-xl font-bold">Shu Oylik Tafsilotlar</h3>

                      <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Asosiy Maosh</span>
                            <span className="font-bold text-base sm:text-lg">{formatCurrency(salaryData.thisMonth.baseSalary)}</span>
                          </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Komissiyalar</span>
                            <span className="font-bold text-base sm:text-lg text-green-600 dark:text-green-400">
                              +{formatCurrency(salaryData.thisMonth.commissions)}
                            </span>
                          </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Bonuslar</span>
                            <span className="font-bold text-base sm:text-lg text-green-600 dark:text-green-400">
                              +{formatCurrency(salaryData.thisMonth.bonuses)}
                            </span>
                          </div>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Jarima</span>
                            <span className="font-bold text-base sm:text-lg text-red-600 dark:text-red-400">
                              -{formatCurrency(salaryData.thisMonth.penalties)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm sm:text-sm sm:text-base opacity-90">JAMI</p>
                            <p className="text-2xl sm:text-3xl font-black">{formatCurrency(salaryData.thisMonth.total)}</p>
                          </div>
                          <span className="material-symbols-outlined text-5xl opacity-50">account_balance</span>
                        </div>
                      </div>

                      {/* Work Statistics */}
                      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg sm:rounded-xl p-4 sm:p-6">
                        <h4 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2 sm:gap-2 sm:gap-3">
                          <span className="material-symbols-outlined">bar_chart</span>
                          Ish Statistikasi
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                          <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-lg sm:rounded-xl">
                            <p className="text-2xl sm:text-3xl font-black text-green-600 dark:text-green-400">
                              {salaryData.statistics.monthsWorked}
                            </p>
                            <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Ish Oylari</p>
                          </div>
                          <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-lg sm:rounded-xl">
                            <p className="text-2xl sm:text-3xl font-black text-green-600 dark:text-green-400">
                              {salaryData.history.filter(h => h.payment_status === 'paid').length}
                            </p>
                            <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">To'langan</p>
                          </div>
                          <div className="text-center p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg sm:rounded-lg sm:rounded-xl">
                            <p className="text-2xl sm:text-3xl font-black text-yellow-600 dark:text-yellow-400">
                              {salaryData.history.filter(h => h.payment_status === 'pending').length}
                            </p>
                            <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Kutilmoqda</p>
                          </div>
                          <div className="text-center p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg sm:rounded-lg sm:rounded-xl">
                            <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                              {Math.round((salaryData.statistics.totalEarned / (salaryData.statistics.monthsWorked || 1)) / 1000)}K
                            </p>
                            <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">O'rtacha/Oy</p>
                          </div>
                        </div>
                      </div>

                      {/* Salary Growth Chart */}
                      {salaryData.history.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg sm:rounded-xl p-4 sm:p-6">
                          <h4 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2 sm:gap-2 sm:gap-3">
                            <span className="material-symbols-outlined">show_chart</span>
                            Maosh O'sishi (Oxirgi 6 Oy)
                          </h4>
                          <div className="space-y-2 sm:space-y-3">
                            {salaryData.history.slice(0, 6).reverse().map((record, index) => {
                              const maxSalary = Math.max(...salaryData.history.slice(0, 6).map(r => parseFloat(r.total_salary)))
                              const percentage = (parseFloat(record.total_salary) / maxSalary) * 100
                              return (
                                <div key={index}>
                                  <div className="flex items-center justify-between text-sm sm:text-sm sm:text-base mb-1">
                                    <span className="font-semibold">{getMonthName(record.month)} {record.year}</span>
                                    <span className="font-bold text-primary">{formatCurrency(record.total_salary)}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden sm:block">
                                    <div
                                      className="bg-gradient-to-r from-green-500 to-teal-500 h-full rounded-full transition-all duration-500"
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* History Tab */}
                  {salaryTab === 'history' && (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg sm:text-xl font-bold">Maosh Tarixi</h3>
                        <div className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">
                          Jami: {salaryData.history.length} oy
                        </div>
                      </div>

                      {salaryData.history.length === 0 ? (
                        <div className="text-center py-12">
                          <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700">history</span>
                          <p className="text-gray-500 dark:text-gray-400 mt-4">Tarix mavjud emas</p>
                        </div>
                      ) : (
                        <div className="space-y-2 sm:space-y-3">
                          {salaryData.history.map((record, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-shadow">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <div className={`size-12 rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center ${
                                    record.payment_status === 'paid'
                                      ? 'bg-green-100 dark:bg-green-900/30'
                                      : 'bg-yellow-100 dark:bg-yellow-900/30'
                                  }`}>
                                    <span className={`material-symbols-outlined ${
                                      record.payment_status === 'paid'
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-yellow-600 dark:text-yellow-400'
                                    }`}>
                                      {record.payment_status === 'paid' ? 'check_circle' : 'schedule'}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-bold text-base sm:text-lg">{getMonthName(record.month)} {record.year}</p>
                                    <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                      {record.payment_status === 'paid' ? '✓ To\'langan' : '⏳ Kutilmoqda'}
                                      {record.payment_date && ` • ${formatDate(record.payment_date)}`}
                                    </p>
                                    {record.payment_method && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {record.payment_method === 'bank_transfer' ? '🏦 Bank o\'tkazmasi' :
                                         record.payment_method === 'cash' ? '💵 Naqd' :
                                         record.payment_method === 'card' ? '💳 Karta' : record.payment_method}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl sm:text-2xl font-black text-primary">{formatCurrency(record.total_salary)}</p>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                                    <p>Asosiy: {formatCurrency(record.base_salary)}</p>
                                    {parseFloat(record.service_commissions || 0) > 0 && (
                                      <p className="text-green-600 dark:text-green-400">
                                        +Komissiya: {formatCurrency(record.service_commissions)}
                                      </p>
                                    )}
                                    {parseFloat(record.other_bonuses || 0) > 0 && (
                                      <p className="text-green-600 dark:text-green-400">
                                        +Bonus: {formatCurrency(record.other_bonuses)}
                                      </p>
                                    )}
                                    {parseFloat(record.penalties || 0) > 0 && (
                                      <p className="text-red-600 dark:text-red-400">
                                        -Jarima: {formatCurrency(record.penalties)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bonuses Tab */}
                  {salaryTab === 'bonuses' && bonusesData && (
                    <div className="space-y-4 sm:space-y-6">
                      {/* Bonuses */}
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold mb-4">Bonuslar</h3>
                        {bonusesData.bonuses.length === 0 ? (
                          <p className="text-center py-4 sm:py-6 lg:py-8 text-gray-500 dark:text-gray-400">Bonuslar yo'q</p>
                        ) : (
                          <div className="space-y-2 sm:space-y-2 sm:space-y-3">
                            {bonusesData.bonuses.map(bonus => (
                              <div key={bonus.id} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-semibold">{bonus.bonus_type}</p>
                                    <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{bonus.reason}</p>
                                    <p className="text-xs text-gray-500 mt-1">{formatDate(bonus.bonus_date)}</p>
                                  </div>
                                  <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                                    +{formatCurrency(bonus.amount)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Penalties - Pending */}
                      {bonusesData.penalties.filter(p => p.status === 'pending').length > 0 && (
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 sm:gap-2 sm:gap-3">
                            <span>Tasdiqlash Kutilmoqda</span>
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-sm sm:text-sm sm:text-base rounded-full">
                              {bonusesData.penalties.filter(p => p.status === 'pending').length}
                            </span>
                          </h3>
                          <div className="space-y-2 sm:space-y-2 sm:space-y-3">
                            {bonusesData.penalties
                              .filter(p => p.status === 'pending')
                              .map(penalty => (
                                <div key={penalty.id} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 sm:gap-2 sm:gap-3 mb-1">
                                        <p className="font-semibold">{penalty.penalty_type}</p>
                                        <span className="px-2 py-0.5 bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 text-xs rounded-full font-semibold">
                                          ⏳ Kutilmoqda
                                        </span>
                                      </div>
                                      <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{penalty.reason}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {formatDate(penalty.penalty_date)} • {getMonthName(penalty.month)} {penalty.year}
                                      </p>
                                    </div>
                                    <p className="text-lg sm:text-xl font-bold text-yellow-600 dark:text-yellow-400">
                                      -{formatCurrency(penalty.amount)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Penalties - Approved */}
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 sm:gap-2 sm:gap-3">
                          <span>Tasdiqlangan Jarimalar</span>
                          {bonusesData.penalties.filter(p => p.status === 'approved').length > 0 && (
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm sm:text-sm sm:text-base rounded-full">
                              {bonusesData.penalties.filter(p => p.status === 'approved').length}
                            </span>
                          )}
                        </h3>
                        {bonusesData.penalties.filter(p => p.status === 'approved').length === 0 ? (
                          <p className="text-center py-4 sm:py-6 lg:py-8 text-gray-500 dark:text-gray-400">Tasdiqlangan jarimalar yo'q</p>
                        ) : (
                          <div className="space-y-2 sm:space-y-2 sm:space-y-3">
                            {bonusesData.penalties
                              .filter(p => p.status === 'approved')
                              .map(penalty => (
                                <div key={penalty.id} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 sm:gap-2 sm:gap-3 mb-1">
                                        <p className="font-semibold">{penalty.penalty_type}</p>
                                        <span className="px-2 py-0.5 bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300 text-xs rounded-full font-semibold">
                                          ✓ Tasdiqlangan
                                        </span>
                                      </div>
                                      <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{penalty.reason}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {formatDate(penalty.penalty_date)} • {getMonthName(penalty.month)} {penalty.year}
                                      </p>
                                    </div>
                                    <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
                                      -{formatCurrency(penalty.amount)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Commissions Tab */}
                  {salaryTab === 'commissions' && (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex flex-col sm:flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <h3 className="text-lg sm:text-xl font-bold">Komissiyalar</h3>
                        <div className="flex gap-2 sm:gap-2 sm:gap-3">
                          <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="px-3 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-800 dark:border-gray-700"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <option key={month} value={month}>{getMonthName(month)}</option>
                            ))}
                          </select>
                          <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="px-3 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-800 dark:border-gray-700"
                          >
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {commissionsData && (
                        <>
                          <div className="bg-gradient-to-r from-purple-500 to-green-500 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm sm:text-sm sm:text-base opacity-90">Jami Komissiya</p>
                                <p className="text-2xl sm:text-3xl font-black">{formatCurrency(commissionsData.total)}</p>
                                <p className="text-sm sm:text-sm sm:text-base opacity-75 mt-1">{commissionsData.count} ta xizmat</p>
                              </div>
                              <span className="material-symbols-outlined text-5xl opacity-50">percent</span>
                            </div>
                          </div>

                          {commissionsData.records.length === 0 ? (
                            <p className="text-center py-12 text-gray-500 dark:text-gray-400">Komissiyalar yo'q</p>
                          ) : (
                            <div className="space-y-2 sm:space-y-2 sm:space-y-3">
                              {commissionsData.records.map(record => (
                                <div key={record.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl p-3 sm:p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="font-semibold">{record.service_name}</p>
                                      <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                                        Xizmat summasi: {formatCurrency(record.service_amount)}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">{formatDate(record.service_date)}</p>
                                    </div>
                                    <p className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400">
                                      {formatCurrency(record.commission_earned)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ==================== TASKS TAB ==================== */}
      {activeTab === 'tasks' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-yellow-200 dark:border-yellow-800">
              <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Yangi</p>
              <p className="text-xl sm:text-2xl font-black text-yellow-600 dark:text-yellow-400">{taskStats.pending}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-green-200 dark:border-green-800">
              <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Bajarilmoqda</p>
              <p className="text-xl sm:text-2xl font-black text-green-600 dark:text-green-400">{taskStats.in_progress}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-purple-200 dark:border-purple-800">
              <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Tasdiqlash</p>
              <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">{taskStats.completed}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-green-200 dark:border-green-800">
              <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400">Tasdiqlangan</p>
              <p className="text-xl sm:text-2xl font-black text-green-600 dark:text-green-400">{taskStats.verified}</p>
            </div>
          </div>

          {/* Attendance Card */}
          {workSchedule && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="bg-blue-500 p-3 rounded-lg sm:rounded-xl">
                    <span className="material-symbols-outlined text-white text-2xl sm:text-3xl">schedule</span>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">Ish vaqti</h3>
                    <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-300">
                      {workSchedule.work_start_time} - {workSchedule.work_end_time}
                    </p>
                  </div>
                </div>

                {!todayAttendance?.check_in ? (
                  <button
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                    className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold flex items-center gap-2 sm:gap-2 sm:gap-3 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">login</span>
                    {checkingIn ? 'Yuklanmoqda...' : 'Men keldim'}
                  </button>
                ) : !todayAttendance?.check_out ? (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-green-100 dark:bg-green-900/30 px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl border-2 border-green-300 dark:border-green-700">
                      <p className="text-sm sm:text-sm sm:text-base font-bold text-green-700 dark:text-green-300">
                        ✓ Kelish: {new Date(todayAttendance.check_in).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button
                      onClick={handleCheckOut}
                      disabled={checkingIn}
                      className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg sm:rounded-xl hover:from-red-700 hover:to-rose-700 font-bold flex items-center gap-2 sm:gap-2 sm:gap-3 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined">logout</span>
                      {checkingIn ? 'Yuklanmoqda...' : 'Men ketdim'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-blue-100 dark:bg-blue-900/30 px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl border-2 border-blue-300 dark:border-blue-700">
                    <p className="text-sm sm:text-sm sm:text-base font-bold text-blue-700 dark:text-blue-300">
                      ✓ Kelish: {new Date(todayAttendance.check_in).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      {' • '}
                      Ketish: {new Date(todayAttendance.check_out).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Haftada</p>
                  <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                    {workSchedule.work_days_per_week} kun
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Oylik</p>
                  <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                    {workSchedule.work_hours_per_month} soat
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-2 sm:gap-3">
            {[
              { value: 'all', label: 'Barchasi' },
              { value: 'pending', label: 'Yangi' },
              { value: 'in_progress', label: 'Bajarilmoqda' },
              { value: 'completed', label: 'Tugatilgan' },
              { value: 'verified', label: 'Tasdiqlangan' }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value)}
                className={`px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 rounded-lg sm:rounded-lg sm:rounded-xl font-semibold transition-colors ${
                  filterStatus === filter.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Tasks List */}
          <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl shadow-sm">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg sm:rounded-lg sm:rounded-xl">
                  <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">task_alt</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold">Vazifalar</h2>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700">
                    task_alt
                  </span>
                  <p className="text-gray-500 dark:text-gray-400 mt-4">Vazifalar yo'q</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {filteredTasks.map(task => {
                    const statusBadge = getStatusBadge(task.status)
                    const priorityBadge = getPriorityBadge(task.priority)

                    return (
                      <div
                        key={task.id}
                        className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl p-5 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col lg:flex-col sm:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-2 sm:gap-3 mb-2">
                              <div className="size-10 bg-primary/10 rounded-lg sm:rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-primary">task</span>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white">{task.title}</h3>
                                <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                                  {task.description}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-2 sm:gap-3 mt-2">
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${statusBadge.class}`}>
                                    {statusBadge.text}
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${priorityBadge.class}`}>
                                    {priorityBadge.text}
                                  </span>
                                </div>
                                <div className="space-y-1 mt-2 text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                  {task.location_details && (
                                    <div className="flex items-center gap-2 sm:gap-2 sm:gap-3">
                                      <span className="material-symbols-outlined text-sm sm:text-sm sm:text-base">location_on</span>
                                      <span>{task.location_details}</span>
                                    </div>
                                  )}
                                  {task.due_date && (
                                    <div className="flex items-center gap-2 sm:gap-2 sm:gap-3">
                                      <span className="material-symbols-outlined text-sm sm:text-sm sm:text-base">schedule</span>
                                      <span>Muddat: {formatDateTime(task.due_date)}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 sm:gap-2 sm:gap-3">
                                    <span className="material-symbols-outlined text-sm sm:text-sm sm:text-base">person</span>
                                    <span>Berdi: {task.creator_name}</span>
                                  </div>
                                </div>
                                {task.completion_notes && (
                                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm sm:text-sm sm:text-base">
                                    <p className="font-semibold text-green-900 dark:text-green-300">Sizning izohingiz:</p>
                                    <p className="text-green-800 dark:text-green-400">{task.completion_notes}</p>
                                  </div>
                                )}
                                {task.verification_notes && (
                                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm sm:text-sm sm:text-base">
                                    <p className="font-semibold text-blue-900 dark:text-blue-300">Admin izohi:</p>
                                    <p className="text-blue-800 dark:text-blue-400">{task.verification_notes}</p>
                                  </div>
                                )}
                                {task.rejection_reason && (
                                  <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-sm sm:text-sm sm:text-base">
                                    <p className="font-semibold text-orange-900 dark:text-orange-300">Qaytarilish sababi:</p>
                                    <p className="text-orange-800 dark:text-orange-400">{task.rejection_reason}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 sm:gap-2 sm:gap-3">
                            {task.status === 'pending' && (
                              <button
                                onClick={() => handleStartTask(task.id)}
                                className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-green-500 text-white rounded-lg sm:rounded-lg sm:rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center gap-2 sm:gap-2 sm:gap-3"
                              >
                                <span className="material-symbols-outlined text-sm sm:text-sm sm:text-base">play_arrow</span>
                                Boshlash
                              </button>
                            )}

                            {['pending', 'in_progress'].includes(task.status) && (
                              <button
                                onClick={() => {
                                  setSelectedTask(task)
                                  setShowCompleteModal(true)
                                }}
                                className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-green-500 text-white rounded-lg sm:rounded-lg sm:rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center gap-2 sm:gap-2 sm:gap-3"
                              >
                                <span className="material-symbols-outlined text-sm sm:text-sm sm:text-base">check_circle</span>
                                Tugatish
                              </button>
                            )}

                            {task.status === 'completed' && (
                              <div className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-lg sm:rounded-lg sm:rounded-xl font-semibold flex items-center gap-2 sm:gap-2 sm:gap-3">
                                <span className="material-symbols-outlined text-sm sm:text-sm sm:text-base">hourglass_empty</span>
                                Admin tasdiqini kutmoqda
                              </div>
                            )}

                            {task.status === 'verified' && (
                              <div className="px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg sm:rounded-lg sm:rounded-xl font-semibold flex items-center gap-2 sm:gap-2 sm:gap-3">
                                <span className="material-symbols-outlined text-sm sm:text-sm sm:text-base">verified</span>
                                Tasdiqlangan
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Complete Task Modal */}
          {showCompleteModal && selectedTask && (
            <Modal
              isOpen={showCompleteModal}
              onClose={() => {
                setShowCompleteModal(false)
                setSelectedTask(null)
                setCompletionNotes('')
              }}
              title="Vazifani Tugatish"
            >
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg sm:rounded-lg sm:rounded-xl">
                  <p className="font-semibold text-base sm:text-lg">{selectedTask.title}</p>
                  <p className="text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{selectedTask.description}</p>
                </div>

                <div>
                  <label className="block text-sm sm:text-sm sm:text-base font-semibold mb-2">Izoh (ixtiyoriy)</label>
                  <textarea
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    className="w-full px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border rounded-lg sm:rounded-lg sm:rounded-xl dark:bg-gray-800 dark:border-gray-700"
                    rows="4"
                    placeholder="Vazifa haqida izoh yozing..."
                  />
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={handleCompleteTask}
                    className="flex-1 px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-green-500 text-white rounded-lg sm:rounded-lg sm:rounded-xl font-semibold hover:bg-green-600"
                  >
                    Tugatish
                  </button>
                  <button
                    onClick={() => {
                      setShowCompleteModal(false)
                      setSelectedTask(null)
                      setCompletionNotes('')
                    }}
                    className="px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gray-200 dark:bg-gray-700 rounded-lg sm:rounded-lg sm:rounded-xl font-semibold"
                  >
                    Bekor qilish
                  </button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}
    </div>
  )
}

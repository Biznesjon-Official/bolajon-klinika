import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import taskService from '../services/taskService'
import attendanceService from '../services/attendanceService'
import staffSalaryService from '../services/staffSalaryService'
import api from '../services/api'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'

export default function ChiefDoctorProfile() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('tasks')

  // ===== TASKS STATE =====
  const [tasksLoading, setTasksLoading] = useState(true)
  const [tasks, setTasks] = useState([])
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [onDutyShifts, setOnDutyShifts] = useState([])
  const [shiftsLoading, setShiftsLoading] = useState(false)
  const isDoctor = ['doctor', 'chief_doctor'].includes(user?.role_name || user?.role)
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [workSchedule, setWorkSchedule] = useState(null)
  const [checkingIn, setCheckingIn] = useState(false)

  // ===== SALARY STATE =====
  const [salaryLoading, setSalaryLoading] = useState(false)
  const [salaryData, setSalaryData] = useState(null)
  const [bonusesData, setBonusesData] = useState(null)
  const [commissionsData, setCommissionsData] = useState(null)
  const [salaryTab, setSalaryTab] = useState('overview')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // ===== LOAD DATA =====
  useEffect(() => {
    loadTasks()
    loadTodayAttendance()
    loadWorkSchedule()
    if (isDoctor) loadOnDutyShifts()
  }, [isDoctor])

  useEffect(() => {
    if (activeTab === 'salary' && !salaryData) loadSalaryData()
  }, [activeTab])

  useEffect(() => {
    if (salaryTab === 'commissions') loadCommissions()
  }, [salaryTab, selectedMonth, selectedYear])

  // ===== TASKS FUNCTIONS =====
  const loadTasks = async () => {
    try {
      setTasksLoading(true)
      const response = await taskService.getMyTasks()
      if (response.success) setTasks(response.data)
    } catch (error) {
      toast.error('Vazifalarni yuklashda xatolik')
    } finally {
      setTasksLoading(false)
    }
  }

  const loadOnDutyShifts = async () => {
    try {
      setShiftsLoading(true)
      const response = await api.get('/chief-doctor/my-shifts')
      if (response.data.success) setOnDutyShifts(response.data.data)
    } catch (error) {
      if (error.response?.status !== 403) toast.error('Smenalarni yuklashda xatolik')
    } finally {
      setShiftsLoading(false)
    }
  }

  const loadTodayAttendance = async () => {
    try {
      const response = await attendanceService.getTodayAttendance()
      if (response.success) setTodayAttendance(response.data)
    } catch (error) {}
  }

  const loadWorkSchedule = async () => {
    try {
      const response = await api.get('/payroll/my-work-schedule')
      if (response.data.success) setWorkSchedule(response.data.data)
    } catch (error) {}
  }

  const handleCheckIn = async () => {
    if (!confirm('Ishga kelganingizni tasdiqlaysizmi?')) return
    setCheckingIn(true)
    try {
      const response = await attendanceService.checkIn()
      if (response.success) {
        response.data.isLate ? toast.error(response.message, { duration: 8000 }) : toast.success(response.message)
        loadTodayAttendance()
      }
    } catch (error) {
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
        response.data.isEarly ? toast.error(response.message, { duration: 8000 }) : toast.success(response.message)
        loadTodayAttendance()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi')
    } finally {
      setCheckingIn(false)
    }
  }

  const handleStartTask = async (taskId) => {
    try {
      const response = await taskService.startTask(taskId)
      if (response.success) { toast.success('Vazifa boshlandi'); loadTasks() }
    } catch (error) {
      toast.error('Vazifani boshlashda xatolik')
    }
  }

  const handleCompleteTask = async () => {
    try {
      const response = await taskService.completeTask(selectedTask.id, completionNotes)
      if (response.success) {
        toast.success('Vazifa tugatildi')
        setShowCompleteModal(false)
        setSelectedTask(null)
        setCompletionNotes('')
        loadTasks()
      }
    } catch (error) {
      toast.error('Vazifani tugatishda xatolik')
    }
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

  const formatTaskDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const filteredTasks = tasks.filter(t => filterStatus === 'all' || t.status === filterStatus)
  const taskStats = {
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    verified: tasks.filter(t => t.status === 'verified').length
  }

  // ===== SALARY FUNCTIONS =====
  const loadSalaryData = async () => {
    try {
      setSalaryLoading(true)
      const [salaryRes, bonusesRes] = await Promise.all([
        staffSalaryService.getMySalary(),
        staffSalaryService.getMyBonuses()
      ])
      if (salaryRes.success) setSalaryData(salaryRes.data)
      if (bonusesRes.success) setBonusesData(bonusesRes.data)
    } catch (error) {
      toast.error('Maosh ma\'lumotlarini yuklashda xatolik')
    } finally {
      setSalaryLoading(false)
    }
  }

  const loadCommissions = async () => {
    try {
      const response = await staffSalaryService.getMyCommissions(selectedMonth, selectedYear)
      if (response.success) setCommissionsData(response.data)
    } catch (error) {
      toast.error('Komissiyalarni yuklashda xatolik')
    }
  }

  const formatCurrency = (amount) => new Intl.NumberFormat('uz-UZ').format(amount || 0) + ' so\'m'
  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  const getMonthName = (month) => {
    const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
    return months[month - 1]
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-5xl">person</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">MENING PROFILIM</h1>
            <p className="text-lg opacity-90">{user?.first_name} {user?.last_name}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-3 px-6 overflow-x-auto scrollbar-hide">
            {[
              { id: 'tasks', label: 'Vazifalar', icon: 'task_alt' },
              { id: 'salary', label: 'Maosh', icon: 'account_balance_wallet' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* ===== TASKS TAB ===== */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              {/* Task Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 border-2 border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Yangi</p>
                  <p className="text-2xl font-black text-yellow-600">{taskStats.pending}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border-2 border-green-200 dark:border-green-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bajarilmoqda</p>
                  <p className="text-2xl font-black text-green-600">{taskStats.in_progress}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border-2 border-purple-200 dark:border-purple-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tasdiqlash</p>
                  <p className="text-2xl font-black text-purple-600">{taskStats.completed}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border-2 border-green-200 dark:border-green-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tasdiqlangan</p>
                  <p className="text-2xl font-black text-green-600">{taskStats.verified}</p>
                </div>
              </div>

              {/* Attendance Card */}
              {workSchedule && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 sm:p-6 border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500 p-3 rounded-xl">
                        <span className="material-symbols-outlined text-white text-2xl">schedule</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white">Ish vaqti</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{workSchedule.work_start_time} - {workSchedule.work_end_time}</p>
                      </div>
                    </div>
                    {!todayAttendance?.check_in ? (
                      <button onClick={handleCheckIn} disabled={checkingIn}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold flex items-center gap-2 shadow-lg disabled:opacity-50">
                        <span className="material-symbols-outlined">login</span>
                        {checkingIn ? 'Yuklanmoqda...' : 'Men keldim'}
                      </button>
                    ) : !todayAttendance?.check_out ? (
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-xl border-2 border-green-300">
                          <p className="text-sm font-bold text-green-700 dark:text-green-300">
                            Kelish: {new Date(todayAttendance.check_in).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <button onClick={handleCheckOut} disabled={checkingIn}
                          className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg disabled:opacity-50">
                          <span className="material-symbols-outlined">logout</span>
                          {checkingIn ? 'Yuklanmoqda...' : 'Men ketdim'}
                        </button>
                      </div>
                    ) : (
                      <div className="bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-xl border-2 border-blue-300">
                        <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                          Kelish: {new Date(todayAttendance.check_in).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                          {' • '}
                          Ketish: {new Date(todayAttendance.check_out).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
                      <p className="text-xs text-gray-500">Haftada</p>
                      <p className="text-lg font-black">{workSchedule.work_days_per_week} kun</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
                      <p className="text-xs text-gray-500">Oylik</p>
                      <p className="text-lg font-black">{workSchedule.work_hours_per_month} soat</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Filter */}
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'Barchasi' },
                  { value: 'pending', label: 'Yangi' },
                  { value: 'in_progress', label: 'Bajarilmoqda' },
                  { value: 'completed', label: 'Tugatilgan' },
                  { value: 'verified', label: 'Tasdiqlangan' }
                ].map(f => (
                  <button key={f.value} onClick={() => setFilterStatus(f.value)}
                    className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
                      filterStatus === f.value ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* On-Duty Shifts */}
              {isDoctor && onDutyShifts.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
                      <span className="material-symbols-outlined text-blue-600">event_available</span>
                    </div>
                    <h2 className="text-xl font-bold">Navbatdagi smenalarim</h2>
                  </div>
                  <div className="space-y-3">
                    {onDutyShifts.map(shift => (
                      <div key={shift._id} className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="size-14 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-blue-600 text-2xl">event_available</span>
                            </div>
                            <div>
                              <p className="font-bold text-lg">{new Date(shift.shift_date).toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                              <p className="text-sm text-gray-600">{shift.start_time} - {shift.end_time}</p>
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                                shift.shift_type === 'morning' ? 'bg-yellow-100 text-yellow-700' :
                                shift.shift_type === 'evening' ? 'bg-orange-100 text-orange-700' :
                                shift.shift_type === 'night' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {shift.shift_type === 'morning' ? 'Ertalabki' : shift.shift_type === 'evening' ? 'Kechki' : shift.shift_type === 'night' ? 'Tungi' : 'Kun bo\'yi'}
                              </span>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            shift.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                            shift.status === 'active' ? 'bg-green-100 text-green-700' :
                            shift.status === 'completed' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {shift.status === 'scheduled' ? 'Rejalashtirilgan' : shift.status === 'active' ? 'Faol' : shift.status === 'completed' ? 'Tugatilgan' : 'Bekor qilingan'}
                          </span>
                        </div>
                        {shift.notes && (
                          <div className="mt-3 bg-white dark:bg-gray-800 p-3 rounded-xl">
                            <p className="text-sm text-gray-600"><span className="font-semibold">Izoh:</span> {shift.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks List */}
              {tasksLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-gray-300">task_alt</span>
                  <p className="text-gray-500 mt-4">Vazifalar yo'q</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map(task => {
                    const sb = getStatusBadge(task.status)
                    const pb = getPriorityBadge(task.priority)
                    return (
                      <div key={task.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-shadow">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3 mb-2">
                              <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-primary">task</span>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-lg">{task.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${sb.class}`}>{sb.text}</span>
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${pb.class}`}>{pb.text}</span>
                                </div>
                                <div className="space-y-1 mt-2 text-sm text-gray-600 dark:text-gray-300">
                                  {task.location_details && (
                                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">location_on</span><span>{task.location_details}</span></div>
                                  )}
                                  {task.due_date && (
                                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">schedule</span><span>Muddat: {formatTaskDate(task.due_date)}</span></div>
                                  )}
                                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">person</span><span>Berdi: {task.creator_name}</span></div>
                                </div>
                                {task.completion_notes && (
                                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                                    <p className="font-semibold text-green-900 dark:text-green-300">Sizning izohingiz:</p>
                                    <p className="text-green-800 dark:text-green-400">{task.completion_notes}</p>
                                  </div>
                                )}
                                {task.verification_notes && (
                                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                                    <p className="font-semibold text-blue-900 dark:text-blue-300">Admin izohi:</p>
                                    <p className="text-blue-800 dark:text-blue-400">{task.verification_notes}</p>
                                  </div>
                                )}
                                {task.rejection_reason && (
                                  <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-sm">
                                    <p className="font-semibold text-orange-900 dark:text-orange-300">Qaytarilish sababi:</p>
                                    <p className="text-orange-800 dark:text-orange-400">{task.rejection_reason}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {task.status === 'pending' && (
                              <button onClick={() => handleStartTask(task.id)} className="px-4 py-2 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">play_arrow</span>Boshlash
                              </button>
                            )}
                            {['pending', 'in_progress'].includes(task.status) && (
                              <button onClick={() => { setSelectedTask(task); setShowCompleteModal(true) }} className="px-4 py-2 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">check_circle</span>Tugatish
                              </button>
                            )}
                            {task.status === 'completed' && (
                              <div className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-xl font-semibold flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">hourglass_empty</span>Kutmoqda
                              </div>
                            )}
                            {task.status === 'verified' && (
                              <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-xl font-semibold flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">verified</span>Tasdiqlangan
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
          )}

          {/* ===== SALARY TAB ===== */}
          {activeTab === 'salary' && (
            <div className="space-y-6">
              {salaryLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : !salaryData ? (
                <p className="text-center py-12 text-gray-500">Maosh ma'lumotlari topilmadi</p>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="size-10 bg-white/20 rounded-xl flex items-center justify-center">
                          <span className="material-symbols-outlined">payments</span>
                        </div>
                        <div>
                          <p className="text-sm opacity-90">Asosiy Maosh</p>
                          <p className="text-xl font-black">{formatCurrency(salaryData.currentSalary.baseSalary)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="size-10 bg-white/20 rounded-xl flex items-center justify-center">
                          <span className="material-symbols-outlined">calendar_month</span>
                        </div>
                        <div>
                          <p className="text-sm opacity-90">Shu Oy</p>
                          <p className="text-xl font-black">{formatCurrency(salaryData.thisMonth.total)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="size-10 bg-white/20 rounded-xl flex items-center justify-center">
                          <span className="material-symbols-outlined">trending_up</span>
                        </div>
                        <div>
                          <p className="text-sm opacity-90">O'rtacha</p>
                          <p className="text-xl font-black">{formatCurrency(salaryData.statistics.averageSalary)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="size-10 bg-white/20 rounded-xl flex items-center justify-center">
                          <span className="material-symbols-outlined">account_balance_wallet</span>
                        </div>
                        <div>
                          <p className="text-sm opacity-90">Jami Olgan</p>
                          <p className="text-xl font-black">{formatCurrency(salaryData.statistics.totalEarned)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Next Payment */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="size-14 bg-green-500 rounded-xl flex items-center justify-center text-white">
                          <span className="material-symbols-outlined text-2xl">event</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-semibold">Keyingi To'lov</p>
                          <p className="text-xl font-black">{formatDate(salaryData.nextPayment.date)}</p>
                          <p className="text-sm text-gray-600 mt-1">Taxminiy: {formatCurrency(salaryData.nextPayment.estimatedAmount)}</p>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-green-500 text-white rounded-xl font-semibold">
                        {salaryData.nextPayment.status === 'paid' ? 'To\'langan' : 'Kutilmoqda'}
                      </div>
                    </div>
                  </div>

                  {/* Salary Sub-tabs */}
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                      {[
                        { id: 'overview', label: 'Umumiy', icon: 'dashboard' },
                        { id: 'history', label: 'Tarix', icon: 'history' },
                        { id: 'bonuses', label: 'Bonuslar', icon: 'star' },
                        { id: 'commissions', label: 'Komissiyalar', icon: 'percent' }
                      ].map(tab => (
                        <button key={tab.id} onClick={() => setSalaryTab(tab.id)}
                          className={`flex items-center gap-2 px-4 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                            salaryTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-600 dark:text-gray-400'
                          }`}>
                          <span className="material-symbols-outlined text-lg">{tab.icon}</span>{tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Overview */}
                  {salaryTab === 'overview' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold">Shu Oylik Tafsilotlar</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Asosiy Maosh</span>
                            <span className="font-bold">{formatCurrency(salaryData.thisMonth.baseSalary)}</span>
                          </div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Komissiyalar</span>
                            <span className="font-bold text-green-600">+{formatCurrency(salaryData.thisMonth.commissions)}</span>
                          </div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Bonuslar</span>
                            <span className="font-bold text-green-600">+{formatCurrency(salaryData.thisMonth.bonuses)}</span>
                          </div>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Jarima</span>
                            <span className="font-bold text-red-600">-{formatCurrency(salaryData.thisMonth.penalties)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-4 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm opacity-90">JAMI</p>
                            <p className="text-3xl font-black">{formatCurrency(salaryData.thisMonth.total)}</p>
                          </div>
                          <span className="material-symbols-outlined text-5xl opacity-50">account_balance</span>
                        </div>
                      </div>

                      {/* Salary Growth */}
                      {salaryData.history.length > 0 && (
                        <div>
                          <h4 className="text-base font-bold mb-3">Maosh O'sishi (Oxirgi 6 Oy)</h4>
                          <div className="space-y-2">
                            {salaryData.history.slice(0, 6).reverse().map((record, i) => {
                              const maxSalary = Math.max(...salaryData.history.slice(0, 6).map(r => parseFloat(r.total_salary)))
                              const pct = (parseFloat(record.total_salary) / maxSalary) * 100
                              return (
                                <div key={i}>
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="font-semibold">{getMonthName(record.month)} {record.year}</span>
                                    <span className="font-bold text-primary">{formatCurrency(record.total_salary)}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                    <div className="bg-gradient-to-r from-green-500 to-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* History */}
                  {salaryTab === 'history' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold">Maosh Tarixi</h3>
                        <span className="text-sm text-gray-600">Jami: {salaryData.history.length} oy</span>
                      </div>
                      {salaryData.history.length === 0 ? (
                        <p className="text-center py-12 text-gray-500">Tarix mavjud emas</p>
                      ) : (
                        <div className="space-y-2">
                          {salaryData.history.map((record, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className={`size-12 rounded-xl flex items-center justify-center ${record.payment_status === 'paid' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                                    <span className={`material-symbols-outlined ${record.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                                      {record.payment_status === 'paid' ? 'check_circle' : 'schedule'}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-bold text-lg">{getMonthName(record.month)} {record.year}</p>
                                    <p className="text-sm text-gray-600">
                                      {record.payment_status === 'paid' ? 'To\'langan' : 'Kutilmoqda'}
                                      {record.payment_date && ` • ${formatDate(record.payment_date)}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-black text-primary">{formatCurrency(record.total_salary)}</p>
                                  <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                    <p>Asosiy: {formatCurrency(record.base_salary)}</p>
                                    {parseFloat(record.service_commissions || 0) > 0 && <p className="text-green-600">+Komissiya: {formatCurrency(record.service_commissions)}</p>}
                                    {parseFloat(record.other_bonuses || 0) > 0 && <p className="text-green-600">+Bonus: {formatCurrency(record.other_bonuses)}</p>}
                                    {parseFloat(record.penalties || 0) > 0 && <p className="text-red-600">-Jarima: {formatCurrency(record.penalties)}</p>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bonuses */}
                  {salaryTab === 'bonuses' && bonusesData && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold mb-3">Bonuslar</h3>
                        {bonusesData.bonuses.length === 0 ? (
                          <p className="text-center py-8 text-gray-500">Bonuslar yo'q</p>
                        ) : (
                          <div className="space-y-2">
                            {bonusesData.bonuses.map(bonus => (
                              <div key={bonus.id} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-semibold">{bonus.bonus_type}</p>
                                    <p className="text-sm text-gray-600 mt-1">{bonus.reason}</p>
                                    <p className="text-xs text-gray-500 mt-1">{formatDate(bonus.bonus_date)}</p>
                                  </div>
                                  <p className="text-lg font-bold text-green-600">+{formatCurrency(bonus.amount)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Penalties */}
                      {bonusesData.penalties.filter(p => p.status === 'pending').length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold mb-3">Tasdiqlash Kutilmoqda</h3>
                          <div className="space-y-2">
                            {bonusesData.penalties.filter(p => p.status === 'pending').map(penalty => (
                              <div key={penalty.id} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-xl p-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-semibold">{penalty.penalty_type}</p>
                                      <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs rounded-full font-semibold">Kutilmoqda</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{penalty.reason}</p>
                                    <p className="text-xs text-gray-500 mt-1">{formatDate(penalty.penalty_date)}</p>
                                  </div>
                                  <p className="text-lg font-bold text-yellow-600">-{formatCurrency(penalty.amount)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h3 className="text-lg font-bold mb-3">Tasdiqlangan Jarimalar</h3>
                        {bonusesData.penalties.filter(p => p.status === 'approved').length === 0 ? (
                          <p className="text-center py-8 text-gray-500">Jarimalar yo'q</p>
                        ) : (
                          <div className="space-y-2">
                            {bonusesData.penalties.filter(p => p.status === 'approved').map(penalty => (
                              <div key={penalty.id} className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-semibold">{penalty.penalty_type}</p>
                                    <p className="text-sm text-gray-600 mt-1">{penalty.reason}</p>
                                    <p className="text-xs text-gray-500 mt-1">{formatDate(penalty.penalty_date)}</p>
                                  </div>
                                  <p className="text-lg font-bold text-red-600">-{formatCurrency(penalty.amount)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Commissions */}
                  {salaryTab === 'commissions' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold">Komissiyalar</h3>
                        <div className="flex gap-2">
                          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                              <option key={m} value={m}>{getMonthName(m)}</option>
                            ))}
                          </select>
                          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700">
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {commissionsData && (
                        <>
                          <div className="bg-gradient-to-r from-purple-500 to-green-500 rounded-xl p-4 text-white">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm opacity-90">Jami Komissiya</p>
                                <p className="text-2xl font-black">{formatCurrency(commissionsData.total)}</p>
                                <p className="text-sm opacity-75 mt-1">{commissionsData.count} ta xizmat</p>
                              </div>
                              <span className="material-symbols-outlined text-5xl opacity-50">percent</span>
                            </div>
                          </div>
                          {commissionsData.records.length === 0 ? (
                            <p className="text-center py-12 text-gray-500">Komissiyalar yo'q</p>
                          ) : (
                            <div className="space-y-2">
                              {commissionsData.records.map(record => (
                                <div key={record.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="font-semibold">{record.service_name}</p>
                                      <p className="text-sm text-gray-600 mt-1">Xizmat: {formatCurrency(record.service_amount)}</p>
                                      <p className="text-xs text-gray-500 mt-1">{formatDate(record.service_date)}</p>
                                    </div>
                                    <p className="text-lg font-bold text-purple-600">{formatCurrency(record.commission_earned)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Complete Task Modal */}
      {showCompleteModal && selectedTask && (
        <Modal isOpen={showCompleteModal} onClose={() => { setShowCompleteModal(false); setSelectedTask(null); setCompletionNotes('') }} title="Vazifani Tugatish">
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
              <p className="font-semibold text-lg">{selectedTask.title}</p>
              <p className="text-sm text-gray-600 mt-1">{selectedTask.description}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Izoh (ixtiyoriy)</label>
              <textarea value={completionNotes} onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700" rows="4" placeholder="Vazifa haqida izoh yozing..." />
            </div>
            <div className="flex gap-3">
              <button onClick={handleCompleteTask} className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600">Tugatish</button>
              <button onClick={() => { setShowCompleteModal(false); setSelectedTask(null); setCompletionNotes('') }}
                className="px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-semibold">Bekor qilish</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

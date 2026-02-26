/**
 * ATTENDANCE MANAGEMENT PAGE
 * Admin tomonidan xodimlar davomatini nazorat qilish
 */

import { useState, useEffect } from 'react'
import attendanceService from '../services/attendanceService'
import toast from 'react-hot-toast'

const ROLE_LABELS = {
  admin: 'Admin',
  doctor: 'Shifokor',
  chief_doctor: 'Bosh shifokor',
  nurse: 'Hamshira',
  receptionist: 'Qabulxona',
  laborant: 'Laborant',
  sanitar: 'Tozalovchi',
  masseur: 'Massajchi',
  speech_therapist: 'Logoped',
  manager: 'Menejer'
}

const STATUS_CONFIG = {
  present: { label: 'Keldi', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  late: { label: 'Kechikdi', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  absent: { label: 'Kelmadi', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  half_day: { label: 'Yarim kun', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' }
}

const formatTime = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

const formatDuration = (minutes) => {
  if (!minutes) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h} soat ${m} daq`
}

export default function AttendanceManagement() {
  const [activeTab, setActiveTab] = useState('today')
  const [loading, setLoading] = useState(true)

  // Today tab
  const [todayData, setTodayData] = useState([])
  const [todaySummary, setTodaySummary] = useState({ total: 0, present: 0, late: 0, absent: 0 })
  const [todayFilter, setTodayFilter] = useState('all') // all, present, late, absent

  // History tab
  const [historyData, setHistoryData] = useState([])
  const [historyPagination, setHistoryPagination] = useState({ page: 1, limit: 50, total: 0 })
  const [historyFilters, setHistoryFilters] = useState({
    start_date: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    status: ''
  })

  // Stats tab
  const [statsData, setStatsData] = useState(null)
  const [statsMonth, setStatsMonth] = useState(new Date().getMonth() + 1)
  const [statsYear, setStatsYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (activeTab === 'today') loadToday()
    else if (activeTab === 'history') loadHistory()
    else if (activeTab === 'stats') loadStats()
  }, [activeTab])

  const loadToday = async () => {
    try {
      setLoading(true)
      const res = await attendanceService.getAllTodayAttendance()
      if (res.success) {
        setTodayData(res.data)
        setTodaySummary(res.summary)
      }
    } catch {
      toast.error('Davomat ma\'lumotlarini yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async (page = 1) => {
    try {
      setLoading(true)
      const params = { ...historyFilters, page, limit: 50 }
      if (!params.status) delete params.status
      const res = await attendanceService.getAllHistory(params)
      if (res.success) {
        setHistoryData(res.data)
        setHistoryPagination(res.pagination)
      }
    } catch {
      toast.error('Tarixni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      setLoading(true)
      const res = await attendanceService.getStats({ month: statsMonth, year: statsYear })
      if (res.success) {
        setStatsData(res.data)
      }
    } catch {
      toast.error('Statistikani yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  // Filter today data
  const filteredTodayData = todayFilter === 'all'
    ? todayData
    : todayData.filter(d => d.status === todayFilter)

  const tabs = [
    { id: 'today', label: 'Bugungi davomat', icon: 'today' },
    { id: 'history', label: 'Tarix', icon: 'history' },
    { id: 'stats', label: 'Statistika', icon: 'bar_chart' }
  ]

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="material-icons text-blue-600">schedule</span>
          Davomat Nazorati
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Xodimlar keldi/ketdi holati</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="material-icons text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'today' && (
        <TodayTab
          data={filteredTodayData}
          summary={todaySummary}
          loading={loading}
          filter={todayFilter}
          setFilter={setTodayFilter}
          onRefresh={loadToday}
        />
      )}

      {activeTab === 'history' && (
        <HistoryTab
          data={historyData}
          pagination={historyPagination}
          loading={loading}
          filters={historyFilters}
          setFilters={setHistoryFilters}
          onSearch={() => loadHistory(1)}
          onPageChange={loadHistory}
        />
      )}

      {activeTab === 'stats' && (
        <StatsTab
          data={statsData}
          loading={loading}
          month={statsMonth}
          year={statsYear}
          setMonth={setStatsMonth}
          setYear={setStatsYear}
          onSearch={loadStats}
        />
      )}
    </div>
  )
}

// ==================== TODAY TAB ====================
function TodayTab({ data, summary, loading, filter, setFilter, onRefresh }) {
  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          label="Jami xodimlar"
          value={summary.total}
          icon="groups"
          color="blue"
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        <SummaryCard
          label="Keldi"
          value={summary.present}
          icon="check_circle"
          color="green"
          active={filter === 'present'}
          onClick={() => setFilter('present')}
        />
        <SummaryCard
          label="Kechikdi"
          value={summary.late}
          icon="schedule"
          color="yellow"
          active={filter === 'late'}
          onClick={() => setFilter('late')}
        />
        <SummaryCard
          label="Kelmadi"
          value={summary.absent}
          icon="cancel"
          color="red"
          active={filter === 'absent'}
          onClick={() => setFilter('absent')}
        />
      </div>

      {/* Refresh */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
        >
          <span className="material-icons text-sm">refresh</span>
          Yangilash
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">#</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Xodim</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Lavozim</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Keldi</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Ketdi</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Davomiylik</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      Ma'lumot topilmadi
                    </td>
                  </tr>
                ) : (
                  data.map((item, idx) => (
                    <tr key={item.staff_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {item.first_name} {item.last_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {ROLE_LABELS[item.role] || item.role}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono">
                        {formatTime(item.check_in)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono">
                        {formatTime(item.check_out)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {formatDuration(item.work_duration)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== HISTORY TAB ====================
function HistoryTab({ data, pagination, loading, filters, setFilters, onSearch, onPageChange }) {
  return (
    <div>
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Boshlanish</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={e => setFilters({ ...filters, start_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tugash</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={e => setFilters({ ...filters, end_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Holat</label>
            <select
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Barchasi</option>
              <option value="present">Keldi</option>
              <option value="late">Kechikdi</option>
            </select>
          </div>
          <button
            onClick={onSearch}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            <span className="material-icons text-sm">search</span>
            Qidirish
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">#</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Xodim</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Lavozim</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Sana</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Keldi</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Ketdi</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Davomiylik</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      Ma'lumot topilmadi
                    </td>
                  </tr>
                ) : (
                  data.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                      <td className="px-4 py-3 text-gray-500">
                        {(pagination.page - 1) * pagination.limit + idx + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {item.first_name} {item.last_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {ROLE_LABELS[item.role] || item.role}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono">
                        {formatDate(item.check_in)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono">
                        {formatTime(item.check_in)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono">
                        {formatTime(item.check_out)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {formatDuration(item.work_duration)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Jami: {pagination.total} ta yozuv
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Oldingi
                </button>
                <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
                  {pagination.page} / {Math.ceil(pagination.total / pagination.limit)}
                </span>
                <button
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Keyingi
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ==================== STATS TAB ====================
function StatsTab({ data, loading, month, year, setMonth, setYear, onSearch }) {
  const months = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
  ]

  return (
    <div>
      {/* Month/Year selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Oy</label>
            <select
              value={month}
              onChange={e => setMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {months.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Yil</label>
            <select
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            onClick={onSearch}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            <span className="material-icons text-sm">search</span>
            Ko'rsatish
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : !data ? (
        <div className="text-center py-12 text-gray-400">Oy va yilni tanlang</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <SummaryCard label="Ish kunlari" value={data.working_days} icon="calendar_month" color="blue" />
            <SummaryCard label="Jami kelishlar" value={data.summary.total_present} icon="check_circle" color="green" />
            <SummaryCard label="Jami kechikishlar" value={data.summary.total_late} icon="schedule" color="yellow" />
            <SummaryCard label="Jami kelmadi" value={data.summary.total_absent} icon="cancel" color="red" />
          </div>

          {/* Staff table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">#</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Xodim</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Lavozim</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-300">Keldi</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-300">Kechikdi</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-300">Kelmadi</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-300">Ish soati</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-300">Davomat %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {data.staff.map((item, idx) => {
                    const attendanceRate = data.working_days > 0
                      ? Math.round(((item.present_days + item.late_days) / data.working_days) * 100)
                      : 0

                    return (
                      <tr key={item.staff_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                        <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {item.first_name} {item.last_name}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {ROLE_LABELS[item.role] || item.role}
                        </td>
                        <td className="px-4 py-3 text-center text-green-600 dark:text-green-400 font-semibold">
                          {item.present_days}
                        </td>
                        <td className="px-4 py-3 text-center text-yellow-600 dark:text-yellow-400 font-semibold">
                          {item.late_days}
                        </td>
                        <td className="px-4 py-3 text-center text-red-600 dark:text-red-400 font-semibold">
                          {item.absent_days}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                          {formatDuration(item.total_work_minutes)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                            attendanceRate >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            attendanceRate >= 70 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {attendanceRate}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ==================== SHARED COMPONENTS ====================

function SummaryCard({ label, value, icon, color, active, onClick }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 transition ${colors[color]} ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      } ${active ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="material-icons text-2xl">{icon}</span>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-sm mt-1 opacity-80">{label}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.absent
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

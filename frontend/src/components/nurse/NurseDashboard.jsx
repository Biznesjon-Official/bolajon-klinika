import { useMemo } from 'react'

const NurseDashboard = ({ stats, treatments, onStartTreatment, onCompleteTreatment, getStatusColor, getStatusText, ambulatorProcs = [], ambulatorLoading, onStartAmbulatorProc, onCompleteAmbulatorProc }) => {
  // Group treatments by time
  const grouped = useMemo(() => {
    const now = new Date()
    const inProgress = []
    const overdue = []
    const upcoming = []
    const later = []
    const completed = []

    treatments.forEach(t => {
      if (t.status === 'completed') { completed.push(t); return }
      if (t.status === 'in_progress') { inProgress.push(t); return }

      const scheduledTime = new Date(t.scheduled_time)
      const diffMin = (scheduledTime - now) / 60000

      if (diffMin < -30) overdue.push(t)
      else if (diffMin <= 60) upcoming.push(t)
      else later.push(t)
    })

    return { inProgress, overdue, upcoming, later, completed }
  }, [treatments])

  const renderTreatmentCard = (treatment) => {
    const isOverdue = new Date(treatment.scheduled_time) < new Date() && treatment.status === 'pending'
    const scheduledTime = new Date(treatment.scheduled_time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })

    return (
      <div key={treatment.id} className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
        treatment.status === 'in_progress'
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
          : isOverdue
          ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        {/* Header: patient + time */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="font-bold text-gray-900 dark:text-white truncate">{treatment.patient_name}</p>
              {treatment.prescription_type && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                  treatment.prescription_type === 'URGENT'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : treatment.prescription_type === 'CHRONIC'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {treatment.prescription_type === 'URGENT' ? 'Shoshilinch' :
                   treatment.prescription_type === 'CHRONIC' ? 'Surunkali' : 'Oddiy'}
                </span>
              )}
            </div>
            {/* Medication + dosage */}
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">{treatment.medication_name}</span> — {treatment.dosage}
            </p>
          </div>
          <div className="text-right ml-3 shrink-0">
            <p className={`text-lg font-black ${isOverdue ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
              {scheduledTime}
            </p>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(treatment.status)}`}>
              {getStatusText(treatment.status)}
            </span>
          </div>
        </div>

        {/* Room info */}
        {treatment.admission_info?.is_admitted && treatment.admission_info.room_info ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">
              {treatment.admission_info.admission_type === 'inpatient' ? 'bed' : 'meeting_room'}
            </span>
            {treatment.admission_info.admission_type === 'inpatient'
              ? `Statsionar — Xona ${treatment.admission_info.room_info.room_number}, Ko'rpa ${treatment.admission_info.room_info.bed_number || 'N/A'}`
              : `Ambulator — Xona ${treatment.admission_info.room_info.room_number}`}
          </p>
        ) : (
          <p className="text-xs text-red-400 mb-2">Hali yotqizilmagan</p>
        )}

        {/* Schedule details */}
        <div className="flex flex-wrap gap-2 mb-2">
          {treatment.frequency_per_day && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs">
              <span className="material-symbols-outlined text-sm">schedule</span>
              Kuniga {treatment.frequency_per_day}x
            </span>
          )}
          {treatment.duration_days && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs">
              <span className="material-symbols-outlined text-sm">date_range</span>
              {treatment.duration_days} kun
            </span>
          )}
          {treatment.schedule_times && treatment.schedule_times.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-semibold">
              <span className="material-symbols-outlined text-sm">alarm</span>
              {treatment.schedule_times.join(', ')}
            </span>
          )}
          {treatment.total_doses > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-semibold">
              {treatment.completed_doses || 0}/{treatment.total_doses} doza
            </span>
          )}
        </div>

        {/* Instructions */}
        {treatment.instructions && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2 mb-2">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              <span className="font-bold">Ko'rsatma:</span> {treatment.instructions}
            </p>
          </div>
        )}

        {/* Action buttons */}
        {treatment.status === 'pending' && (
          <button
            onClick={() => onStartTreatment(treatment)}
            className="w-full mt-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-bold flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">play_arrow</span>
            Boshladim
          </button>
        )}
        {treatment.status === 'in_progress' && (
          <button
            onClick={() => onCompleteTreatment(treatment)}
            className="w-full mt-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-bold flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">check_circle</span>
            Yakunlash
          </button>
        )}
      </div>
    )
  }

  const renderSection = (title, icon, items, color, emptyText) => {
    if (items.length === 0) return null
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 ${color} rounded-full`}>
            <span className="material-symbols-outlined text-lg">{icon}</span>
            <span className="text-sm font-bold">{title}</span>
            <span className="px-2 py-0.5 bg-black/10 dark:bg-white/10 rounded-full text-xs font-bold">{items.length}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(t => renderTreatmentCard(t))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 sm:p-6 text-white">
          <span className="material-symbols-outlined text-2xl sm:text-3xl mb-2">schedule</span>
          <p className="text-2xl sm:text-4xl font-black">{stats.pending_treatments}</p>
          <p className="text-xs sm:text-sm opacity-90">Bajarilishi kerak</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 sm:p-6 text-white">
          <span className="material-symbols-outlined text-2xl sm:text-3xl mb-2">warning</span>
          <p className="text-2xl sm:text-4xl font-black">{stats.overdue_treatments}</p>
          <p className="text-xs sm:text-sm opacity-90">Kechikkan</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 sm:p-6 text-white">
          <span className="material-symbols-outlined text-2xl sm:text-3xl mb-2">bed</span>
          <p className="text-2xl sm:text-4xl font-black">{stats.total_patients}</p>
          <p className="text-xs sm:text-sm opacity-90">Yotgan bemorlar</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white">
          <span className="material-symbols-outlined text-2xl sm:text-3xl mb-2">notifications_active</span>
          <p className="text-2xl sm:text-4xl font-black">{stats.active_calls}</p>
          <p className="text-xs sm:text-sm opacity-90">Faol chaqiruvlar</p>
        </div>
      </div>

      {/* Ambulatory procedures */}
      <div className="space-y-3">
        <h3 className="text-lg sm:text-xl font-bold">Ambulator muolajalar</h3>
        {ambulatorLoading ? (
          <p className="text-sm text-gray-500">Yuklanmoqda...</p>
        ) : ambulatorProcs.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
            <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 block mb-2">medical_services</span>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Kutilayotgan ambulator muolajalar yo'q</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ambulatorProcs.map(proc => (
              <div key={proc.id || proc._id} className={`p-4 rounded-xl border-2 ${
                proc.status === 'in_progress'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{proc.patient_name}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">{proc.service_name}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold shrink-0 ml-2 ${getStatusColor(proc.status)}`}>
                    {getStatusText(proc.status)}
                  </span>
                </div>
                {(proc.room_number || proc.bed_number) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span className="material-symbols-outlined text-sm align-middle mr-1">meeting_room</span>
                    {proc.room_number ? `Xona ${proc.room_number}` : ''}{proc.bed_number ? ` · Ko'yka #${proc.bed_number}` : ''}
                  </p>
                )}
                {proc.invoice_number && (
                  <p className="text-xs text-gray-400 mb-2">Hisob: {proc.invoice_number}</p>
                )}
                <div className="flex gap-2">
                  {proc.status === 'pending' && (
                    <button
                      onClick={() => onStartAmbulatorProc(proc.id || proc._id)}
                      className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">play_arrow</span>
                      Boshlash
                    </button>
                  )}
                  {proc.status === 'in_progress' && (
                    <button
                      onClick={() => onCompleteAmbulatorProc(proc.id || proc._id)}
                      className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Yakunlash
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Treatments by time groups */}
      <div className="space-y-6">
        <h3 className="text-lg sm:text-xl font-bold">Bugungi muolajalar</h3>

        {treatments.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4 block">medication</span>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Bugun muolajalar yo'q</p>
          </div>
        ) : (
          <div className="space-y-6">
            {renderSection('Jarayonda', 'play_circle', grouped.inProgress, 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400')}
            {renderSection('Kechikkan!', 'warning', grouped.overdue, 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400')}
            {renderSection('Yaqin 1 soatda', 'schedule', grouped.upcoming, 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400')}
            {renderSection('Keyinroq', 'event', grouped.later, 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')}
            {renderSection('Bajarildi', 'check_circle', grouped.completed, 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400')}
          </div>
        )}
      </div>
    </div>
  )
}

export default NurseDashboard

const NurseDashboard = ({ stats, treatments, onStartTreatment, onCompleteTreatment, getStatusColor, getStatusText }) => {
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

      {/* Today's treatments */}
      <div>
        <h3 className="text-lg sm:text-xl font-bold mb-3">Bugungi muolajalar</h3>
        {treatments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Muolajalar yo'q</p>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {treatments.slice(0, 5).map(treatment => (
              <div key={treatment.id} className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{treatment.patient_name}</p>
                      {treatment.prescription_type && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          treatment.prescription_type === 'URGENT'
                            ? 'bg-orange-100 text-orange-700'
                            : treatment.prescription_type === 'CHRONIC'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {treatment.prescription_type === 'URGENT' ? '🚨' :
                           treatment.prescription_type === 'CHRONIC' ? '📅' : '📋'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{treatment.medication_name} - {treatment.dosage}</p>

                    {treatment.admission_info?.is_admitted && treatment.admission_info.room_info ? (
                      <p className="text-xs text-gray-500 mt-1">
                        {treatment.admission_info.admission_type === 'inpatient'
                          ? `🏥 Stasionar - Xona ${treatment.admission_info.room_info.room_number || 'N/A'}, Ko'rpa ${treatment.admission_info.room_info.bed_number || 'N/A'}`
                          : `🚪 Ambulator - Xona ${treatment.admission_info.room_info.room_number || 'N/A'}`}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">❌ Hali yotqizilmagan</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {new Date(treatment.scheduled_time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(treatment.status)}`}>
                      {getStatusText(treatment.status)}
                    </span>
                  </div>
                </div>
                {(treatment.status === 'pending' || treatment.status === 'PENDING') && (
                  <button
                    onClick={() => onStartTreatment(treatment)}
                    className="mt-2 px-4 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs font-semibold"
                  >
                    ▶ Boshladim
                  </button>
                )}
                {(treatment.status === 'in_progress' || treatment.status === 'IN_PROGRESS') && (
                  <button
                    onClick={() => onCompleteTreatment(treatment)}
                    className="mt-2 px-4 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs font-semibold"
                  >
                    ✓ Yakunlash
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default NurseDashboard

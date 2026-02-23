import { useState, useMemo } from 'react'

const NurseTreatments = ({ treatments, filters, onFilterChange, onStartTreatment, onCompleteTreatment, getStatusColor, getStatusText }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [patientFilter, setPatientFilter] = useState('all')

  const filteredTreatments = useMemo(() => {
    let result = treatments

    // Patient type filter
    if (patientFilter === 'inpatient') {
      result = result.filter(t => t.admission_info?.is_admitted && t.admission_info?.admission_type === 'inpatient')
    } else if (patientFilter === 'outpatient') {
      result = result.filter(t => t.admission_info?.is_admitted && t.admission_info?.admission_type === 'outpatient')
    } else if (patientFilter === 'not_admitted') {
      result = result.filter(t => !t.admission_info?.is_admitted)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(t => {
        const patientName = (t.patient_name || '').toLowerCase()
        const prescriptionNumber = (t.prescription_id?.prescription_number || '').toLowerCase()
        const roomNumber = (t.admission_info?.room_info?.room_number || '').toString().toLowerCase()
        const roomName = (t.admission_info?.room_info?.room_name || '').toLowerCase()
        return patientName.includes(query) || prescriptionNumber.includes(query) ||
               roomNumber.includes(query) || roomName.includes(query)
      })
    }

    return result
  }, [treatments, patientFilter, searchQuery])

  const counts = useMemo(() => ({
    all: treatments.length,
    inpatient: treatments.filter(t => t.admission_info?.is_admitted && t.admission_info?.admission_type === 'inpatient').length,
    outpatient: treatments.filter(t => t.admission_info?.is_admitted && t.admission_info?.admission_type === 'outpatient').length,
    not_admitted: treatments.filter(t => !t.admission_info?.is_admitted).length
  }), [treatments])

  const patientFilters = [
    { id: 'all', label: 'Barchasi' },
    { id: 'inpatient', label: 'Statsionar' },
    { id: 'outpatient', label: 'Ambulator' },
    { id: 'not_admitted', label: 'Yotqizilmagan' }
  ]

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={filters.floor}
          onChange={(e) => onFilterChange({ ...filters, floor: e.target.value })}
          className="w-full sm:w-auto px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">Barcha qavatlar</option>
          <option value="1">1-qavat</option>
          <option value="2">2-qavat</option>
          <option value="3">3-qavat</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
          className="w-full sm:w-auto px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">Barcha statuslar</option>
          <option value="pending">Kutilmoqda</option>
          <option value="completed">Bajarildi</option>
        </select>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Bemor ismi, retsept raqami yoki xona raqami..."
          className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-primary text-sm dark:bg-gray-800"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300"
          >
            Tozalash
          </button>
        )}
      </div>

      {/* Patient type filters */}
      <div className="flex flex-wrap gap-2">
        {patientFilters.map(f => (
          <button
            key={f.id}
            onClick={() => setPatientFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              patientFilter === f.id
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            {f.label} ({counts[f.id]})
          </button>
        ))}
      </div>

      {/* Treatment List */}
      {filteredTreatments.length === 0 ? (
        <p className="text-center py-12 text-gray-500">
          {searchQuery ? `"${searchQuery}" bo'yicha natija topilmadi` : 'Muolajalar topilmadi'}
        </p>
      ) : (
        <div className="space-y-3">
          {filteredTreatments.map(treatment => {
            const isHighlighted = searchQuery.trim() && (
              (treatment.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
              (treatment.prescription_id?.prescription_number || '').toLowerCase().includes(searchQuery.toLowerCase())
            )

            return (
              <div
                key={treatment.id}
                className={`p-3 sm:p-4 rounded-xl border transition-all ${
                  isHighlighted
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 shadow-lg'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Patient name + badges */}
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-bold text-base sm:text-lg truncate">{treatment.patient_name}</p>
                      {treatment.prescription_type && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          treatment.prescription_type === 'URGENT'
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                            : treatment.prescription_type === 'CHRONIC'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}>
                          {treatment.prescription_type === 'URGENT' ? '🚨 Shoshilinch' :
                           treatment.prescription_type === 'CHRONIC' ? '📅 Surunkali' : '📋 Oddiy'}
                        </span>
                      )}
                    </div>

                    {/* Room info */}
                    {treatment.admission_info?.is_admitted && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span className="material-symbols-outlined text-sm">hotel</span>
                        {treatment.admission_info.admission_type === 'inpatient' ? (
                          <span>
                            🏥 Stasionar - {treatment.admission_info.room_info?.room_name || 'Xona'} {treatment.admission_info.room_info?.room_number || 'N/A'},
                            Ko'rpa {treatment.admission_info.room_info?.bed_number || 'N/A'}
                            {treatment.admission_info.room_info?.floor && ` (${treatment.admission_info.room_info.floor}-qavat)`}
                          </span>
                        ) : (
                          <span>
                            🚪 Ambulator - Xona {treatment.admission_info.room_info?.room_number || 'N/A'}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Medication */}
                    <p className="text-xs sm:text-sm">
                      <span className="font-semibold">Dori:</span>{' '}
                      {treatment.medication_name || treatment.medicine_name || 'N/A'}
                    </p>
                    {treatment.dosage && (
                      <p className="text-xs sm:text-sm">
                        <span className="font-semibold">Doza:</span> {treatment.dosage}
                      </p>
                    )}

                    {/* Prescription info */}
                    {treatment.prescription_id && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 mt-2">
                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                          📋 Retsept: {treatment.prescription_id.prescription_number}
                        </p>
                        {treatment.prescription_id.doctor_id && (
                          <p className="text-xs text-blue-700 dark:text-blue-400">
                            👨‍⚕️ Dr. {treatment.prescription_id.doctor_id.first_name} {treatment.prescription_id.doctor_id.last_name}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Schedule info */}
                    {treatment.frequency_per_day && (
                      <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                        <p className="text-xs sm:text-sm">
                          <span className="font-semibold">📅 Jadval:</span> Kuniga {treatment.frequency_per_day} marta
                          {treatment.duration_days && `, ${treatment.duration_days} kun`}
                        </p>
                        {treatment.schedule_times?.length > 0 && (
                          <p className="text-xs mt-1">
                            <span className="font-semibold">🕐 Vaqtlar:</span> {treatment.schedule_times.join(', ')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Dose progress */}
                    {treatment.source === 'schedule' && treatment.total_doses > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        📊 {treatment.completed_doses}/{treatment.total_doses} marta
                      </p>
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                      🕐 {treatment.scheduled_time
                        ? new Date(treatment.scheduled_time).toLocaleString('uz-UZ', {
                            month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                          })
                        : 'N/A'}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end gap-2">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap ${getStatusColor(treatment.status)}`}>
                      {getStatusText(treatment.status)}
                    </span>
                    {(treatment.status === 'pending' || treatment.status === 'PENDING') && (
                      <button
                        onClick={() => onStartTreatment(treatment)}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold text-xs sm:text-sm whitespace-nowrap"
                      >
                        ▶ Boshladim
                      </button>
                    )}
                    {(treatment.status === 'in_progress' || treatment.status === 'IN_PROGRESS') && (
                      <button
                        onClick={() => onCompleteTreatment(treatment)}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold text-xs sm:text-sm whitespace-nowrap"
                      >
                        ✓ Yakunlash
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default NurseTreatments

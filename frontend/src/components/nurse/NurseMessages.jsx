const NurseMessages = ({ patients, onSendMessage }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg sm:text-xl font-bold">Bemorlarga xabar yuborish</h3>
      {patients.length === 0 ? (
        <p className="text-center py-12 text-gray-500">Sizga biriktirilgan bemorlar yo'q</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {patients.map(patient => (
            <div key={patient.patient_id || patient.id || patient._id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600">person</span>
                </div>
                <div>
                  <p className="font-bold">{patient.patient_name || `${patient.first_name} ${patient.last_name}`}</p>
                  <p className="text-sm text-gray-600">{patient.patient_number}</p>
                </div>
              </div>
              <div className="space-y-1 text-sm mb-3">
                <p><span className="font-semibold">Xona:</span> {patient.room_number || 'N/A'}</p>
                <p><span className="font-semibold">Ko'rpa:</span> {patient.bed_number || 'N/A'}</p>
                <p><span className="font-semibold">Tashxis:</span> {patient.diagnosis || 'N/A'}</p>
              </div>
              <button
                onClick={() => onSendMessage(patient)}
                className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">mail</span>
                Xabar yuborish
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default NurseMessages

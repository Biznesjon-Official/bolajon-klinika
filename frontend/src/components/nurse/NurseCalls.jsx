const NurseCalls = ({ calls, onAcceptCall }) => {
  if (calls.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">notifications_off</span>
        <p className="text-gray-500">Faol chaqiruvlar yo'q</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {calls.map(call => (
        <div key={call.id} className="bg-red-50 border-2 border-red-200 rounded-xl p-3 sm:p-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-base sm:text-lg">{call.patient_name}</p>
            <p className="text-gray-600">Xona {call.room_number}, Ko'rpa {call.bed_number}</p>
            <p className="text-sm text-gray-500">{new Date(call.created_at).toLocaleString('uz-UZ')}</p>
          </div>
          <button
            onClick={() => onAcceptCall(call.id)}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600"
          >
            Qabul qilish
          </button>
        </div>
      ))}
    </div>
  )
}

export default NurseCalls

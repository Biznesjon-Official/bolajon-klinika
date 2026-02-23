import { useState } from 'react'

const NurseHistory = ({ history }) => {
  const [selectedItem, setSelectedItem] = useState(null)

  if (selectedItem) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedItem(null)}
          className="flex items-center gap-2 text-primary hover:text-primary/80 font-semibold"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Orqaga
        </button>

        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 sm:p-6 text-white">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="size-16 bg-white/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">person</span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">{selectedItem.patient_name}</h2>
              <p className="text-sm opacity-90">
                Yakunlangan: {new Date(selectedItem.completed_at).toLocaleString('uz-UZ')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold mb-4">Muolaja tafsilotlari</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <span className="material-symbols-outlined text-green-600 text-xl">medication</span>
              <div>
                <p className="font-semibold">{selectedItem.medicine_name || 'Davolash'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedItem.dosage || 'Standart doza'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <span className="material-symbols-outlined text-green-600 text-xl">person</span>
              <div>
                <p className="font-semibold">Bajargan hamshira</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedItem.completed_by_name || 'Hamshira'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <span className="material-symbols-outlined text-purple-600 text-xl">event</span>
              <div>
                <p className="font-semibold">Yakunlangan vaqt</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(selectedItem.completed_at).toLocaleString('uz-UZ', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg sm:text-xl font-bold">Muolaja tarixi</h3>
      {history.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">history</span>
          <p className="text-gray-500">Hali muolaja qilingan bemorlar yo'q</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {history.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-3 sm:p-4 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="size-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-xl">check_circle</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm sm:text-base truncate">{item.patient_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(item.completed_at).toLocaleDateString('uz-UZ')}
                  </p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p className="truncate"><span className="font-semibold">Dori:</span> {item.medicine_name || 'N/A'}</p>
                <p><span className="font-semibold">Doza:</span> {item.dosage || 'N/A'}</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">{item.completed_by_name || 'Hamshira'}</span>
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default NurseHistory

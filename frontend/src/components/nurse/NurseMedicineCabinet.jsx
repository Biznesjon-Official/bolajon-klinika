const NurseMedicineCabinet = ({ medicines, onDispense }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg sm:text-xl font-bold">Dori shkafi</h3>
      {medicines.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">medical_services</span>
          <p className="text-gray-500">Dorilar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {medicines.map(medicine => (
            <div key={medicine._id || medicine.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-3 sm:p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-bold text-base sm:text-lg">{medicine.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{medicine.category}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  medicine.quantity > (medicine.reorder_level || 10)
                    ? 'bg-green-100 text-green-700'
                    : medicine.quantity > 0
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {medicine.quantity} dona
                </span>
              </div>

              <div className="space-y-1 text-sm mb-3">
                <p><span className="font-semibold">Narxi:</span> {medicine.unit_price?.toLocaleString()} so'm</p>
                {medicine.expiry_date && (
                  <p><span className="font-semibold">Yaroqlilik:</span> {new Date(medicine.expiry_date).toLocaleDateString('uz-UZ')}</p>
                )}
              </div>

              {medicine.quantity > 0 && (
                <button
                  onClick={() => onDispense(medicine)}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">remove_circle</span>
                  Bemorga berish
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default NurseMedicineCabinet

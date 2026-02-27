export default function CriticalAlertBanner({ criticalValues = [] }) {
  if (!criticalValues?.length) return null

  return (
    <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-400 rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-red-600 text-2xl">emergency</span>
        <h4 className="text-lg font-black text-red-700 dark:text-red-400">KRITIK QIYMATLAR</h4>
      </div>
      <div className="space-y-2">
        {criticalValues.map((cv, i) => (
          <div key={i} className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg p-3">
            <span className={`material-symbols-outlined text-xl ${cv.critical_type === 'high' ? 'text-red-600' : 'text-blue-600'}`}>
              {cv.critical_type === 'high' ? 'arrow_upward' : 'arrow_downward'}
            </span>
            <div>
              <p className="font-bold text-sm">{cv.parameter_name}</p>
              <p className="text-xs text-gray-600">
                Qiymat: <span className="font-bold text-red-600">{cv.value}</span>
                {' — '}
                {cv.critical_type === 'high' ? 'YUQORI' : 'PAST'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

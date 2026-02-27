const STEPS = [
  { key: 'created', label: 'Buyurtma', icon: 'assignment', status: 'pending' },
  { key: 'sample', label: 'Namuna', icon: 'colorize', status: 'sample_collected' },
  { key: 'analysis', label: 'Tahlil', icon: 'science', status: 'in_progress' },
  { key: 'completed', label: 'Tayyor', icon: 'check_circle', status: 'completed' },
  { key: 'approved', label: 'Tasdiqlandi', icon: 'verified', status: 'approved' }
]

const STATUS_ORDER = ['pending', 'sample_collected', 'in_progress', 'completed', 'approved']

export default function OrderTimeline({ order }) {
  if (!order) return null

  const currentIndex = STATUS_ORDER.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'

  const getTime = (step) => {
    switch (step.key) {
      case 'created': return order.createdAt || order.created_at
      case 'sample': return order.sample_collected_at
      case 'analysis': return order.analysis_started_at
      case 'completed': return order.completed_at
      case 'approved': return order.approved_at
      default: return null
    }
  }

  const formatTime = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return `${d.toLocaleDateString('uz-UZ')} ${d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`
  }

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <span className="material-symbols-outlined text-red-500">cancel</span>
        <span className="text-sm font-semibold text-red-600">Bekor qilingan</span>
      </div>
    )
  }

  return (
    <div className="py-2">
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const stepIndex = STATUS_ORDER.indexOf(step.status)
          const isDone = stepIndex <= currentIndex
          const isCurrent = stepIndex === currentIndex
          const time = getTime(step)

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative">
              {/* Connector line */}
              {i > 0 && (
                <div className={`absolute top-5 right-1/2 w-full h-0.5 -z-10 ${
                  stepIndex <= currentIndex ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`} />
              )}

              {/* Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                isCurrent
                  ? 'bg-blue-500 text-white ring-4 ring-blue-200'
                  : isDone
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>
                <span className="material-symbols-outlined text-lg">{step.icon}</span>
              </div>

              {/* Label */}
              <p className={`text-xs mt-1 font-semibold ${isCurrent ? 'text-blue-600' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                {step.label}
              </p>

              {/* Time */}
              {time && (
                <p className="text-[10px] text-gray-500 mt-0.5">{formatTime(time)}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* TAT */}
      {order.tat_minutes && (
        <div className="mt-3 text-center">
          <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-semibold">
            TAT: {order.tat_minutes} daqiqa
          </span>
        </div>
      )}
    </div>
  )
}

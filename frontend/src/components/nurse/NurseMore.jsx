import { useState, lazy, Suspense } from 'react'
import NurseHistory from './NurseHistory'
import NurseMessages from './NurseMessages'

const MyTasks = lazy(() => import('../../pages/MyTasks'))
const Communications = lazy(() => import('../../pages/Communications'))
const MySalary = lazy(() => import('../../pages/MySalary'))

const TABS = [
  { id: 'history', label: 'Tarix', icon: 'history' },
  { id: 'messages', label: 'Xabarlar', icon: 'mail' },
  { id: 'tasks', label: 'Vazifalarim', icon: 'task_alt' },
  { id: 'communications', label: 'Aloqa', icon: 'chat' },
  { id: 'salary', label: 'Maoshim', icon: 'account_balance_wallet' }
]

const Loader = () => (
  <div className="flex justify-center py-12">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
)

const NurseMore = ({ history, patients, onSendMessage }) => {
  const [activeTab, setActiveTab] = useState('history')

  const renderContent = () => {
    switch (activeTab) {
      case 'history':
        return <NurseHistory history={history} />
      case 'messages':
        return <NurseMessages patients={patients} onSendMessage={onSendMessage} />
      case 'tasks':
        return <Suspense fallback={<Loader />}><MyTasks /></Suspense>
      case 'communications':
        return <Suspense fallback={<Loader />}><Communications /></Suspense>
      case 'salary':
        return <Suspense fallback={<Loader />}><MySalary /></Suspense>
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span className="material-symbols-outlined text-base sm:text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  )
}

export default NurseMore

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import useNurseData from '../hooks/useNurseData'
import nurseService from '../services/nurseService'
import communicationService from '../services/communicationService'
import pharmacyService from '../services/pharmacyService'
import toast from 'react-hot-toast'

// Tab components
import NurseDashboard from '../components/nurse/NurseDashboard'
import NurseTreatments from '../components/nurse/NurseTreatments'
import NurseMedicineCabinet from '../components/nurse/NurseMedicineCabinet'
import NurseCalls from '../components/nurse/NurseCalls'
import NurseMessages from '../components/nurse/NurseMessages'
import NurseHistory from '../components/nurse/NurseHistory'

// Modals
import CompleteTreatmentModal from '../components/nurse/CompleteTreatmentModal'
import DispenseMedicineModal from '../components/nurse/DispenseMedicineModal'
import SendMessageModal from '../components/nurse/SendMessageModal'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'treatments', label: 'Muolajalar', icon: 'medication' },
  { id: 'medicine-cabinet', label: 'Dori shkafi', icon: 'medical_services' },
  { id: 'calls', label: 'Chaqiruvlar', icon: 'notifications' },
  { id: 'messages', label: 'Xabarlar', icon: 'mail' },
  { id: 'history', label: 'Tarix', icon: 'history' }
]

export default function NursePanel() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [filters, setFilters] = useState({ floor: '', status: 'all' })

  // Data
  const { stats, treatments, patients, calls, history, medicines, loading, refresh, loadInpatients } = useNurseData(activeTab, filters)

  // Modal state
  const [completeTreatment, setCompleteTreatment] = useState(null)
  const [dispenseMedicine, setDispenseMedicine] = useState(null)
  const [messagePatient, setMessagePatient] = useState(null)
  const [inpatients, setInpatients] = useState([])

  // Load inpatients for dispense modal
  useEffect(() => {
    loadInpatients().then(setInpatients)
  }, [loadInpatients])

  // Handlers
  const handleStartTreatment = async (treatment) => {
    try {
      const response = await nurseService.startTreatment(treatment._id || treatment.id)
      if (response.success) {
        toast.success('Muolaja boshlandi')
        refresh()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi')
    }
  }

  const handleCompleteTreatment = async (treatmentId, notes) => {
    try {
      const response = await nurseService.completeTreatment(treatmentId, { notes })
      if (response.success) {
        toast.success('Muolaja yakunlandi')
        setCompleteTreatment(null)
        refresh()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi')
    }
  }

  const handleAcceptCall = async (callId) => {
    try {
      const response = await nurseService.acceptCall(callId)
      if (response.success) {
        toast.success('Chaqiruv qabul qilindi')
        refresh()
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    }
  }

  const handleDispenseMedicine = async (medicine, data) => {
    try {
      if (data.quantity > medicine.quantity) {
        toast.error('Dori yetarli emas')
        return
      }
      const response = await pharmacyService.dispenseMedicine(medicine._id || medicine.id, data)
      if (response.success) {
        toast.success('Dori muvaffaqiyatli berildi!')
        setDispenseMedicine(null)
        refresh()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi')
    }
  }

  const handleSendMessage = async (patient, message) => {
    try {
      const response = await communicationService.sendMessage({
        patient_id: patient.patient_id || patient.id || patient._id,
        message,
        metadata: {
          room_number: patient.room_number,
          bed_number: patient.bed_number,
          diagnosis: patient.diagnosis
        }
      })
      if (response.success) {
        toast.success('Xabar yuborildi!')
        setMessagePatient(null)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xabar yuborishda xatolik')
    }
  }

  // Status helpers
  const getStatusColor = (status) => {
    const colors = { pending: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' }
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-700'
  }

  const getStatusText = (status) => {
    const texts = { pending: 'Kutilmoqda', completed: 'Bajarildi', cancelled: 'Bekor qilindi' }
    return texts[status?.toLowerCase()] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  // Render active tab
  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <NurseDashboard stats={stats} treatments={treatments} onStartTreatment={handleStartTreatment} onCompleteTreatment={setCompleteTreatment} getStatusColor={getStatusColor} getStatusText={getStatusText} />
      case 'treatments':
        return <NurseTreatments treatments={treatments} filters={filters} onFilterChange={setFilters} onStartTreatment={handleStartTreatment} onCompleteTreatment={setCompleteTreatment} getStatusColor={getStatusColor} getStatusText={getStatusText} />
      case 'medicine-cabinet':
        return <NurseMedicineCabinet medicines={medicines} onDispense={setDispenseMedicine} />
      case 'calls':
        return <NurseCalls calls={calls} onAcceptCall={handleAcceptCall} />
      case 'messages':
        return <NurseMessages patients={patients} onSendMessage={setMessagePatient} />
      case 'history':
        return <NurseHistory history={history} />
      default:
        return null
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="material-symbols-outlined text-4xl sm:text-5xl">medical_services</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">HAMSHIRA PANELI</h1>
            <p className="text-sm sm:text-lg opacity-90">Xush kelibsiz, {user?.first_name || 'Hamshira'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-1 sm:gap-2 px-2 sm:px-4 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 font-semibold border-b-2 transition-colors whitespace-nowrap text-xs sm:text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-base sm:text-xl">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {renderTab()}
        </div>
      </div>

      {/* Modals */}
      <CompleteTreatmentModal
        isOpen={!!completeTreatment}
        onClose={() => setCompleteTreatment(null)}
        treatment={completeTreatment}
        onComplete={handleCompleteTreatment}
      />

      <DispenseMedicineModal
        isOpen={!!dispenseMedicine}
        onClose={() => setDispenseMedicine(null)}
        medicine={dispenseMedicine}
        patients={inpatients}
        onDispense={handleDispenseMedicine}
      />

      <SendMessageModal
        isOpen={!!messagePatient}
        onClose={() => setMessagePatient(null)}
        patient={messagePatient}
        onSend={handleSendMessage}
      />
    </div>
  )
}

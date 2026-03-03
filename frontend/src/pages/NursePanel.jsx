import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import useNurseData from '../hooks/useNurseData'
import nurseService from '../services/nurseService'
import communicationService from '../services/communicationService'
import pharmacyService from '../services/pharmacyService'
import ambulatorInpatientService from '../services/ambulatorInpatientService'
import toast from 'react-hot-toast'

// Page components
import NurseDashboard from '../components/nurse/NurseDashboard'
import NurseMedicineCabinet from '../components/nurse/NurseMedicineCabinet'
import NurseCalls from '../components/nurse/NurseCalls'
import NurseMore from '../components/nurse/NurseMore'

// Modals
import CompleteTreatmentModal from '../components/nurse/CompleteTreatmentModal'
import DispenseMedicineModal from '../components/nurse/DispenseMedicineModal'
import SendMessageModal from '../components/nurse/SendMessageModal'

export default function NursePanel() {
  const { user } = useAuth()
  const location = useLocation()

  // Determine active page from URL
  const activeTab = useMemo(() => {
    if (location.pathname === '/nurse/medicine') return 'medicine-cabinet'
    if (location.pathname === '/nurse/calls') return 'calls'
    if (location.pathname === '/nurse/more') return 'more'
    return 'dashboard'
  }, [location.pathname])

  const [filters, setFilters] = useState({ floor: '', status: 'all' })

  // Data
  const { stats, treatments, patients, calls, history, medicines, loading, refresh, loadInpatients } = useNurseData(activeTab, filters)

  // Modal state
  const [completeTreatment, setCompleteTreatment] = useState(null)
  const [dispenseMedicine, setDispenseMedicine] = useState(null)
  const [messagePatient, setMessagePatient] = useState(null)
  const [inpatients, setInpatients] = useState([])
  const [ambulatorProcs, setAmbulatorProcs] = useState([])
  const [ambulatorLoading, setAmbulatorLoading] = useState(false)
  const [qrFilter, setQrFilter] = useState(null)

  // Load inpatients for dispense modal
  useEffect(() => {
    loadInpatients().then(setInpatients)
  }, [loadInpatients])

  // Load ambulatory procedures
  const loadAmbulatorProcs = async () => {
    setAmbulatorLoading(true)
    try {
      const res = await ambulatorInpatientService.getAmbulatorProcedures('pending,in_progress')
      if (res.success) setAmbulatorProcs(res.data || [])
    } catch {
      // ignore
    } finally {
      setAmbulatorLoading(false)
    }
  }

  useEffect(() => {
    loadAmbulatorProcs()
  }, [])

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

  const handleStartAmbulatorProc = async (id) => {
    try {
      const res = await ambulatorInpatientService.startProcedure(id)
      if (res.success) { toast.success('Muolaja boshlandi'); loadAmbulatorProcs() }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xatolik')
    }
  }

  const handleCompleteAmbulatorProc = async (id) => {
    try {
      const res = await ambulatorInpatientService.completeProcedure(id)
      if (res.success) { toast.success('Muolaja yakunlandi'); loadAmbulatorProcs() }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xatolik')
    }
  }

  // Status helpers
  const getStatusColor = (status) => {
    const colors = { pending: 'bg-yellow-100 text-yellow-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' }
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-700'
  }

  const getStatusText = (status) => {
    const texts = { pending: 'Kutilmoqda', in_progress: 'Jarayonda', completed: 'Bajarildi', cancelled: 'Bekor qilindi' }
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

  // Render active page
  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': {
        const filteredProcs = qrFilter
          ? ambulatorProcs.filter(p => p.patient_number === qrFilter)
          : ambulatorProcs
        return <NurseDashboard stats={stats} treatments={treatments} onStartTreatment={handleStartTreatment} onCompleteTreatment={setCompleteTreatment} getStatusColor={getStatusColor} getStatusText={getStatusText} ambulatorProcs={filteredProcs} ambulatorLoading={ambulatorLoading} onStartAmbulatorProc={handleStartAmbulatorProc} onCompleteAmbulatorProc={handleCompleteAmbulatorProc} qrFilter={qrFilter} onSetQrFilter={(val) => setQrFilter(val ? val.split('|')[0].trim() : null)} />
      }
      case 'medicine-cabinet':
        return <NurseMedicineCabinet medicines={medicines} onDispense={setDispenseMedicine} onRefresh={refresh} />
      case 'calls':
        return <NurseCalls calls={calls} onAcceptCall={handleAcceptCall} />
      case 'more':
        return <NurseMore history={history} patients={patients} onSendMessage={setMessagePatient} />
      default:
        return null
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {renderTab()}

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

import { useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import nurseService from '../services/nurseService'
import api from '../services/api'

export default function useNurseData(activeTab, filters) {
  const [stats, setStats] = useState({ pending_treatments: 0, overdue_treatments: 0, total_patients: 0, active_calls: 0 })
  const [treatments, setTreatments] = useState([])
  const [patients, setPatients] = useState([])
  const [calls, setCalls] = useState([])
  const [history, setHistory] = useState([])
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const isFirstLoad = useRef(true)

  const loadData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true)

      // Always load stats
      const statsData = await nurseService.getStats()
      if (statsData.success) setStats(statsData.data)

      // Tab-specific data
      if (activeTab === 'dashboard' || activeTab === 'treatments') {
        const treatmentsData = await nurseService.getTreatments({
          status: filters.status,
          floor: filters.floor
        })
        if (treatmentsData.success) setTreatments(treatmentsData.data)
      }

      if (activeTab === 'calls') {
        const callsData = await nurseService.getCalls()
        if (callsData.success) setCalls(callsData.data)
      }

      if (activeTab === 'history') {
        const historyData = await nurseService.getHistory()
        if (historyData.success) setHistory(historyData.data)
      }

      if (activeTab === 'medicine-cabinet') {
        const medicinesData = await nurseService.getMedicineCabinets({ floor: filters.floor })
        if (medicinesData.success) setMedicines(medicinesData.data)
      }

      if (activeTab === 'messages') {
        const patientsData = await nurseService.getPatients({ floor: filters.floor })
        if (patientsData.success) setPatients(patientsData.data)
      }
    } catch (error) {
      if (showLoading) toast.error('Ma\'lumotlarni yuklashda xatolik')
    } finally {
      if (showLoading || isFirstLoad.current) {
        setLoading(false)
        isFirstLoad.current = false
      }
    }
  }, [activeTab, filters.status, filters.floor])

  // Load inpatient patients for dispense modal
  const loadInpatients = useCallback(async () => {
    try {
      const response = await api.get('/ambulator-inpatient/admissions')
      if (response.data.success) {
        return response.data.data.map(a => ({
          _id: a.patient_id,
          id: a.patient_id,
          first_name: a.first_name,
          last_name: a.last_name,
          patient_number: a.patient_number,
          room_number: a.room_number,
          admission_id: a.id
        }))
      }
    } catch { /* ignore */ }
    return []
  }, [])

  // Initial load + auto refresh
  useEffect(() => {
    loadData(true)
    const interval = setInterval(() => loadData(false), 30000)
    return () => clearInterval(interval)
  }, [loadData])

  // Socket.io real-time events
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001'
    const socket = io(apiUrl.replace('/api/v1', ''))

    socket.on('nurse-call', (data) => {
      toast(`${data.patientName} chaqiryapti! Xona: ${data.roomNumber}`, { duration: 10000, icon: '🚨' })
      loadData(false)
    })

    socket.on('treatment-notification', (data) => {
      toast(`Muolaja vaqti! ${data.patientName} - ${data.medicationName}`, { duration: 10000, icon: '💊' })
      loadData(false)
    })

    socket.on('new-admission', (data) => {
      toast(`Yangi bemor yotqizildi!\n${data.patientName}\nXona: ${data.roomNumber}`, { duration: 15000, icon: '🛏️' })
      loadData(false)
    })

    socket.on('treatment-claimed', () => {
      loadData(false)
    })

    return () => socket.disconnect()
  }, [])

  return {
    stats, treatments, patients, calls, history, medicines,
    loading, refresh: () => loadData(true), loadInpatients
  }
}

import express from 'express'
import mongoose from 'mongoose'
import { authenticate } from '../middleware/auth.js'
import Task from '../models/Task.js'
import TreatmentSchedule from '../models/TreatmentSchedule.js'
import Patient from '../models/Patient.js'
import Admission from '../models/Admission.js'
import Medicine from '../models/Medicine.js'
import PharmacyTransaction from '../models/PharmacyTransaction.js'
import Invoice from '../models/Invoice.js'
import BillingItem from '../models/BillingItem.js'
import Service from '../models/Service.js'
import PatientNurse from '../models/PatientNurse.js'

const router = express.Router()

// Helper: Get assigned patient IDs for nurse (fallback: all if no assignments)
const getAssignedPatientIds = async (nurseId) => {
  const assignments = await PatientNurse.find({
    nurse_id: nurseId,
    status: 'active'
  }).select('patient_id').lean()

  if (assignments.length > 0) {
    return assignments.map(a => a.patient_id)
  }
  // Fallback: return null (no filtering)
  return null
}

// Helper: Get room info from admission
const getRoomInfo = async (admission) => {
  if (!admission) return { is_admitted: false, admission_type: null, room_info: null }

  const admissionInfo = {
    is_admitted: true,
    admission_type: admission.admission_type || 'inpatient',
    room_info: null
  }

  try {
    if (admission.admission_type === 'inpatient') {
      if (admission.bed_id) {
        const Bed = mongoose.model('Bed')
        const bed = await Bed.findById(admission.bed_id).populate('room_id').lean()
        if (bed?.room_id) {
          admissionInfo.room_info = {
            room_number: bed.room_id.room_number,
            room_name: bed.room_id.name || bed.room_id.room_name,
            bed_number: bed.bed_number,
            floor: bed.room_id.floor
          }
        }
      } else if (admission.room_id) {
        const AmbulatorRoom = mongoose.model('AmbulatorRoom')
        const room = await AmbulatorRoom.findById(admission.room_id).lean()
        if (room) {
          admissionInfo.room_info = {
            room_number: room.room_number,
            room_name: room.name || room.room_name,
            bed_number: admission.bed_number || 'N/A',
            floor: room.floor
          }
        }
      }
    } else if (admission.admission_type === 'outpatient' && admission.room_id) {
      const AmbulatorRoom = mongoose.model('AmbulatorRoom')
      const room = await AmbulatorRoom.findById(admission.room_id).lean()
      admissionInfo.room_info = {
        room_name: room?.room_name || 'Ambulator xona',
        room_number: room?.room_number || 'N/A',
        bed_number: admission.bed_number || null
      }
    }
  } catch (error) {
    // Room info optional, skip on error
  }

  return admissionInfo
}

// Helper: Transform treatment item (Task or TreatmentSchedule)
const transformTreatment = async (item, source) => {
  let medicationName = item.medication_name || (source === 'task' ? item.title : null)
  let dosage = item.dosage

  if ((!medicationName || medicationName === 'vazifa') && item.prescription_id?.medications?.length > 0) {
    const firstMed = item.prescription_id.medications[0]
    medicationName = firstMed.medication_name
    dosage = firstMed.dosage
  }

  let prescriptionType = source === 'task' && item.task_type === 'emergency' ? 'URGENT' : 'REGULAR'
  if (item.prescription_id?.prescription_type) {
    prescriptionType = item.prescription_id.prescription_type
  }

  const admissionInfo = await getRoomInfo(item.admission_id)

  const transformed = {
    ...item,
    id: item._id.toString(),
    patient_name: item.patient_id ? `${item.patient_id.first_name} ${item.patient_id.last_name}` : 'N/A',
    medicine_name: medicationName || 'N/A',
    medicine_dosage: dosage || 'N/A',
    medication_name: medicationName,
    dosage: dosage,
    prescription_type: prescriptionType,
    prescription_id: item.prescription_id ? {
      _id: item.prescription_id._id,
      prescription_number: item.prescription_id.prescription_number,
      diagnosis: item.prescription_id.diagnosis,
      doctor_id: item.prescription_id.doctor_id,
      medications: item.prescription_id.medications
    } : null,
    admission_info: admissionInfo,
    source,
    completed_at: item.completed_at,
    completion_notes: item.completion_notes || item.notes
  }

  if (source === 'schedule') {
    transformed.total_doses = item.total_doses || 0
    transformed.completed_doses = item.completed_doses || 0
    transformed.dose_history = item.dose_history || []
  }

  return transformed
}

// Populate options for treatments query
const treatmentPopulate = (query) => {
  return query
    .populate('patient_id', 'first_name last_name patient_number')
    .populate('nurse_id', 'first_name last_name')
    .populate({
      path: 'prescription_id',
      select: 'prescription_number diagnosis prescription_type medications doctor_id',
      populate: {
        path: 'doctor_id',
        select: 'first_name last_name specialization'
      }
    })
    .populate({
      path: 'admission_id',
      select: 'admission_type room_id bed_id',
      populate: [
        { path: 'room_id', select: 'room_number room_name' },
        { path: 'bed_id', select: 'bed_number' }
      ]
    })
}

/**
 * Get available medicines
 * GET /api/v1/nurse/medicines
 */
router.get('/medicines', authenticate, async (req, res) => {
  try {
    const { floor, admission_type } = req.query

    const query = { quantity: { $gt: 0 } }

    let targetFloor
    if (floor) {
      targetFloor = parseInt(floor)
    } else if (admission_type === 'inpatient') {
      targetFloor = 3
    } else {
      targetFloor = 2
    }
    query.floor = targetFloor

    const medicines = await Medicine.find(query)
      .select('name generic_name unit quantity unit_price floor category')
      .sort({ name: 1 })
      .lean()

    res.json({ success: true, data: medicines })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Dorilarni olishda xatolik', error: error.message })
  }
})

/**
 * Get nurse statistics
 * GET /api/v1/nurse/stats
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const nurseId = req.user._id || req.user.id

    // Get assigned patients (null = no filter)
    const assignedPatientIds = await getAssignedPatientIds(nurseId)
    const patientFilter = assignedPatientIds ? { patient_id: { $in: assignedPatientIds } } : {}

    const [pendingTasks, pendingSchedules, overdueTasks, overdueSchedules, activePatients] = await Promise.all([
      Task.countDocuments({ status: 'pending', ...patientFilter }),
      TreatmentSchedule.countDocuments({ status: 'pending', ...patientFilter }),
      Task.countDocuments({ status: 'pending', scheduled_time: { $lt: new Date() }, ...patientFilter }),
      TreatmentSchedule.countDocuments({ status: 'pending', scheduled_time: { $lt: new Date() }, ...patientFilter }),
      Task.distinct('patient_id', { status: { $in: ['pending', 'in_progress'] }, ...patientFilter })
    ])

    res.json({
      success: true,
      data: {
        pending_treatments: pendingTasks + pendingSchedules,
        overdue_treatments: overdueTasks + overdueSchedules,
        total_patients: activePatients.length,
        active_calls: 0
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Statistikani olishda xatolik', error: error.message })
  }
})

/**
 * Get nurse treatments/tasks
 * GET /api/v1/nurse/treatments
 */
router.get('/treatments', authenticate, async (req, res) => {
  try {
    const nurseId = req.user._id || req.user.id
    const { status, floor, limit = 100, skip = 0 } = req.query

    // Filter: pending = all nurses see, in_progress/completed = only assigned nurse
    const query = {}
    if (status === 'in_progress') {
      query.nurse_id = nurseId
      query.status = 'in_progress'
    } else if (status === 'completed') {
      query.nurse_id = nurseId
      query.status = 'completed'
    } else if (status && status !== 'all') {
      query.status = status
    } else {
      // Default: pending (all) + in_progress (mine)
      query.$or = [
        { status: 'pending' },
        { status: 'in_progress', nurse_id: nurseId }
      ]
    }

    const selectFields = 'title medication_name dosage scheduled_time status task_type patient_id nurse_id admission_id prescription_id total_doses completed_doses frequency_per_day duration_days schedule_times'

    const [tasks, treatmentSchedules] = await Promise.all([
      treatmentPopulate(Task.find(query).select(selectFields))
        .sort({ scheduled_time: 1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .lean(),
      treatmentPopulate(TreatmentSchedule.find(query).select(selectFields))
        .sort({ scheduled_time: 1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .lean()
    ])

    // Transform
    const transformedTasks = await Promise.all(tasks.map(t => transformTreatment(t, 'task')))
    const transformedSchedules = await Promise.all(treatmentSchedules.map(s => transformTreatment(s, 'schedule')))

    // Combine, filter valid, sort
    const allTreatments = [...transformedTasks, ...transformedSchedules]
      .filter(t => t.patient_name && t.patient_name !== 'N/A')
      .sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time))

    res.json({ success: true, data: allTreatments })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Muolajalarni olishda xatolik', error: error.message })
  }
})

/**
 * Start treatment (claim by nurse)
 * POST /api/v1/nurse/treatments/:id/start
 */
router.post('/treatments/:id/start', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const nurseId = req.user._id || req.user.id

    // Try Task first, then TreatmentSchedule
    let treatment = await Task.findById(id)
    let isTreatmentSchedule = false
    if (!treatment) {
      treatment = await TreatmentSchedule.findById(id)
      isTreatmentSchedule = true
    }

    if (!treatment) {
      return res.status(404).json({ success: false, message: 'Muolaja topilmadi' })
    }

    if (treatment.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Bu muolaja allaqachon olingan' })
    }

    treatment.status = 'in_progress'
    treatment.nurse_id = nurseId
    treatment.started_at = new Date()
    await treatment.save()

    // Notify other nurses that this treatment is claimed
    if (global.io) {
      global.io.emit('treatment-claimed', { id, nurse_id: nurseId })
    }

    res.json({ success: true, data: treatment, message: 'Muolaja boshlandi' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Muolajani boshlashda xatolik', error: error.message })
  }
})

/**
 * Complete treatment
 * POST /api/v1/nurse/treatments/:id/complete
 */
router.post('/treatments/:id/complete', authenticate, async (req, res) => {
  try {
    const { notes, used_medicines } = req.body
    const nurseId = req.user._id || req.user.id

    // Try Task first, then TreatmentSchedule
    let task = await Task.findById(req.params.id)
      .populate('patient_id', 'first_name last_name patient_number')
      .populate('nurse_id', 'first_name last_name')

    let treatmentSchedule = null
    let isTask = true

    if (!task) {
      treatmentSchedule = await TreatmentSchedule.findById(req.params.id)
        .populate('patient_id', 'first_name last_name patient_number')
        .populate('nurse_id', 'first_name last_name')

      if (!treatmentSchedule) {
        return res.status(404).json({ success: false, message: 'Topshiriq topilmadi' })
      }
      isTask = false
    }

    const treatment = isTask ? task : treatmentSchedule

    // Update treatment status
    if (!isTask && treatmentSchedule) {
      treatmentSchedule.completed_doses += 1
      treatmentSchedule.dose_history.push({
        completed_at: new Date(),
        completed_by: nurseId,
        notes: notes,
        used_medicines: used_medicines || []
      })

      if (treatmentSchedule.completed_doses >= treatmentSchedule.total_doses) {
        treatmentSchedule.status = 'completed'
        treatmentSchedule.completed_at = new Date()
      }
      await treatmentSchedule.save()
    } else {
      treatment.status = 'completed'
      treatment.completed_at = new Date()
      treatment.completion_notes = notes
      await treatment.save()
    }

    // Process used medicines
    if (used_medicines && used_medicines.length > 0) {
      let totalAmount = 0
      const processedMedicines = []

      for (const usedMed of used_medicines) {
        const medicine = await Medicine.findById(usedMed.medicine_id)
        if (!medicine) continue

        if (medicine.quantity < usedMed.quantity) {
          return res.status(400).json({
            success: false,
            message: `Dorixonada yetarli ${medicine.name} yo'q. Mavjud: ${medicine.quantity} ${medicine.unit}, Kerak: ${usedMed.quantity} ${usedMed.unit}`
          })
        }

        medicine.quantity -= usedMed.quantity
        if (medicine.quantity === 0) medicine.status = 'out_of_stock'
        await medicine.save()

        const amount = usedMed.quantity * (usedMed.unit_price || medicine.unit_price || 0)
        totalAmount += amount

        await PharmacyTransaction.create({
          medicine_id: medicine._id,
          medicine_name: medicine.name,
          transaction_type: 'out',
          quantity: usedMed.quantity,
          unit_price: usedMed.unit_price || medicine.unit_price || 0,
          total_amount: amount,
          patient_id: treatment.patient_id?._id || treatment.patient_id,
          staff_id: nurseId,
          task_id: treatment._id,
          notes: `Hamshira tomonidan berildi: ${notes || 'Muolaja yakunlandi'}`,
          floor: medicine.floor || 2
        })

        processedMedicines.push({
          medicine_id: medicine._id,
          name: medicine.name,
          quantity: usedMed.quantity,
          unit: medicine.unit,
          unit_price: usedMed.unit_price || medicine.unit_price || 0,
          total_amount: amount
        })
      }

      // Create invoice only for INPATIENT (statsionar) — ambulator is free
      const activeAdmission = await Admission.findOne({
        patient_id: treatment.patient_id?._id || treatment.patient_id,
        status: 'active'
      })
      const isInpatient = !activeAdmission || activeAdmission.admission_type === 'inpatient'

      if (processedMedicines.length > 0 && totalAmount > 0 && isInpatient) {
        const invoiceCount = await Invoice.countDocuments()
        const invoiceNumber = `INV${new Date().getFullYear()}${String(invoiceCount + 1).padStart(6, '0')}`

        const invoice = await Invoice.create({
          patient_id: treatment.patient_id?._id || treatment.patient_id,
          invoice_number: invoiceNumber,
          total_amount: totalAmount,
          paid_amount: 0,
          discount_amount: 0,
          payment_status: 'pending',
          notes: `Hamshira muolajasi - ${processedMedicines.length} ta dori`,
          created_by: nurseId
        })

        for (const med of processedMedicines) {
          let service = await Service.findOne({
            name: { $regex: new RegExp(`^${med.name}$`, 'i') },
            category: 'medication'
          })

          if (!service) {
            service = await Service.create({
              name: med.name,
              category: 'medication',
              price: med.unit_price,
              description: `Dori: ${med.name}`,
              status: 'active'
            })
          }

          await BillingItem.create({
            billing_id: invoice._id,
            service_id: service._id,
            service_name: med.name,
            quantity: med.quantity,
            unit_price: med.unit_price,
            total_price: med.total_amount
          })
        }
      }
    }

    // Auto-discharge for ambulatory patients
    if (treatment.patient_id) {
      const patientId = treatment.patient_id._id || treatment.patient_id

      const activeAdmission = await Admission.findOne({
        patient_id: patientId,
        status: 'active'
      })

      if (activeAdmission && activeAdmission.admission_type === 'outpatient') {
        const [pendingTasks, pendingSchedules] = await Promise.all([
          Task.countDocuments({ patient_id: patientId, status: 'pending' }),
          TreatmentSchedule.countDocuments({ patient_id: patientId, status: 'pending' })
        ])

        if (pendingTasks + pendingSchedules === 0) {
          const dischargeDate = new Date()
          const admissionDate = new Date(activeAdmission.admission_date)
          const hoursDiff = (dischargeDate - admissionDate) / (1000 * 60 * 60)

          let totalDays = 0
          if (hoursDiff < 12) totalDays = 0
          else if (hoursDiff <= 24) totalDays = 1
          else totalDays = 1 + Math.ceil((hoursDiff - 24) / 24)

          activeAdmission.status = 'discharged'
          activeAdmission.discharge_date = dischargeDate
          activeAdmission.total_days = totalDays
          activeAdmission.discharge_notes = 'Avtomatik chiqarildi - barcha muolajalar yakunlandi'
          await activeAdmission.save()

          // Release bed
          if (activeAdmission.bed_id) {
            const Bed = mongoose.model('Bed')
            const bed = await Bed.findById(activeAdmission.bed_id)
            if (bed) {
              bed.status = 'available'
              bed.current_patient_id = null
              bed.current_admission_id = null
              bed.released_at = dischargeDate
              await bed.save()
            }
          }

          // Update room
          if (activeAdmission.room_id) {
            const AmbulatorRoom = mongoose.model('AmbulatorRoom')
            const room = await AmbulatorRoom.findById(activeAdmission.room_id)
            if (room) {
              const Bed = mongoose.model('Bed')
              const allBeds = await Bed.find({ room_id: room._id })
              const anyAvailable = allBeds.some(b => b.status === 'available')
              if (anyAvailable) {
                room.status = 'available'
                room.current_patient_id = null
                await room.save()
              }
            }
          }
        }
      }
    }

    res.json({
      success: true,
      data: treatment,
      message: used_medicines?.length > 0
        ? 'Muolaja yakunlandi, dorilar dorixonadan ayirildi va kassaga qarz qo\'shildi'
        : 'Muolaja yakunlandi'
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Muolajani yakunlashda xatolik', error: error.message })
  }
})

/**
 * Get nurse patients
 * GET /api/v1/nurse/patients
 */
router.get('/patients', authenticate, async (req, res) => {
  try {
    const nurseId = req.user._id || req.user.id

    // Get assigned patients
    const assignedPatientIds = await getAssignedPatientIds(nurseId)
    const patientFilter = assignedPatientIds ? { patient_id: { $in: assignedPatientIds } } : {}

    const [taskPatientIds, schedulePatientIds] = await Promise.all([
      Task.distinct('patient_id', { status: { $in: ['pending', 'in_progress'] }, ...patientFilter }),
      TreatmentSchedule.distinct('patient_id', { status: { $in: ['pending', 'in_progress'] }, ...patientFilter })
    ])

    const allPatientIds = [...new Set([...taskPatientIds, ...schedulePatientIds])]

    const patients = await Patient.find({ _id: { $in: allPatientIds } })
      .select('first_name last_name patient_number phone')
      .lean()

    const transformedPatients = patients.map(patient => ({
      ...patient,
      id: patient._id.toString(),
      patient_name: `${patient.first_name} ${patient.last_name}`
    }))

    res.json({ success: true, data: transformedPatients })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Bemorlarni olishda xatolik', error: error.message })
  }
})

/**
 * Get calls (placeholder)
 * GET /api/v1/nurse/calls
 */
router.get('/calls', authenticate, async (req, res) => {
  try {
    res.json({ success: true, data: [] })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Chaqiruvlarni olishda xatolik', error: error.message })
  }
})

/**
 * Get treatment history
 * GET /api/v1/nurse/history
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const nurseId = req.user._id || req.user.id

    // Get assigned patients
    const assignedPatientIds = await getAssignedPatientIds(nurseId)
    const patientFilter = assignedPatientIds ? { patient_id: { $in: assignedPatientIds } } : {}

    const [taskHistory, scheduleHistory] = await Promise.all([
      Task.find({ status: 'completed', ...patientFilter })
        .populate('patient_id', 'first_name last_name patient_number')
        .populate('nurse_id', 'first_name last_name')
        .sort({ completed_at: -1 })
        .limit(50)
        .lean(),
      TreatmentSchedule.find({ status: 'completed', ...patientFilter })
        .populate('patient_id', 'first_name last_name patient_number')
        .populate('nurse_id', 'first_name last_name')
        .sort({ completed_at: -1 })
        .limit(50)
        .lean()
    ])

    const transformedTasks = taskHistory.map(task => ({
      ...task,
      id: task._id.toString(),
      patient_name: task.patient_id ? `${task.patient_id.first_name} ${task.patient_id.last_name}` : 'N/A',
      medicine_name: task.medication_name || 'N/A',
      medication_name: task.medication_name,
      dosage: task.dosage || 'N/A',
      source: 'task',
      completed_by_name: task.nurse_id ? `${task.nurse_id.first_name} ${task.nurse_id.last_name}` : 'N/A'
    }))

    const transformedSchedules = scheduleHistory.map(schedule => ({
      ...schedule,
      id: schedule._id.toString(),
      patient_name: schedule.patient_id ? `${schedule.patient_id.first_name} ${schedule.patient_id.last_name}` : 'N/A',
      medicine_name: schedule.medication_name || 'N/A',
      medication_name: schedule.medication_name,
      dosage: schedule.dosage || 'N/A',
      source: 'schedule',
      completed_by_name: schedule.nurse_id ? `${schedule.nurse_id.first_name} ${schedule.nurse_id.last_name}` : 'N/A'
    }))

    const allHistory = [...transformedTasks, ...transformedSchedules]
      .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
      .slice(0, 50)

    res.json({ success: true, data: allHistory })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Tarixni olishda xatolik', error: error.message })
  }
})

/**
 * Get medicine cabinets
 * GET /api/v1/nurse/medicine-cabinets
 */
router.get('/medicine-cabinets', authenticate, async (req, res) => {
  try {
    const { floor } = req.query
    const filter = { status: { $ne: 'discontinued' } }
    if (floor) filter.floor = Number(floor)

    const medicines = await Medicine.find(filter)
      .select('name generic_name unit quantity unit_price floor shelf_location category status')
      .sort({ name: 1 })
      .lean()

    res.json({ success: true, data: medicines })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Dori shkaflari olishda xatolik', error: error.message })
  }
})

export default router

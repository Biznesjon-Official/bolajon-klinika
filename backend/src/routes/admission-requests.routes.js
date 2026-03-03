import express from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import AdmissionRequest from '../models/AdmissionRequest.js'
import Admission from '../models/Admission.js'
import Bed from '../models/Bed.js'
import AmbulatorRoom from '../models/AmbulatorRoom.js'

const router = express.Router()

// POST / — Doctor creates admission request
router.post('/', authenticate, authorize('doctor', 'chief_doctor'), async (req, res, next) => {
  try {
    const { patient_id, admission_type, diagnosis, reason } = req.body
    if (!patient_id || !admission_type) {
      return res.status(400).json({ success: false, message: 'Bemor va yo\'nalish turi majburiy' })
    }

    // Check if patient already has active admission
    const existing = await Admission.findOne({ patient_id, status: 'active' })
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bu bemor allaqachon yotqizilgan' })
    }

    // Check if patient already has pending request
    const pendingReq = await AdmissionRequest.findOne({ patient_id, status: 'pending' })
    if (pendingReq) {
      return res.status(400).json({ success: false, message: 'Bu bemor uchun kutilayotgan so\'rov mavjud' })
    }

    const request = await AdmissionRequest.create({
      patient_id,
      doctor_id: req.user._id,
      admission_type,
      diagnosis,
      reason
    })

    // Notify receptionists via socket
    if (global.io) {
      const Patient = (await import('../models/Patient.js')).default
      const patient = await Patient.findById(patient_id).select('first_name last_name patient_number').lean()
      global.io.emit('new_admission_request', {
        requestId: request._id.toString(),
        patient: patient ? `${patient.first_name} ${patient.last_name}` : '',
        patient_number: patient?.patient_number || '',
        admission_type,
        diagnosis,
        doctor_name: `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim(),
        timestamp: new Date()
      })
    }

    const populated = await AdmissionRequest.findById(request._id)
      .populate('patient_id', 'first_name last_name patient_number birth_date')
      .populate('doctor_id', 'first_name last_name')

    res.status(201).json({ success: true, data: populated })
  } catch (err) {
    next(err)
  }
})

// GET / — List requests (receptionist/admin sees pending; doctor sees own)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const role = (req.user.role_name || req.user.role || '').toLowerCase()
    const { status } = req.query

    const filter = {}
    if (['doctor', 'chief_doctor'].includes(role)) {
      filter.doctor_id = req.user._id
    }
    if (status) filter.status = status
    else if (['doctor', 'chief_doctor'].includes(role)) {
      // doctors see all their requests
    } else {
      filter.status = 'pending'
    }

    const requests = await AdmissionRequest.find(filter)
      .populate('patient_id', 'first_name last_name patient_number birth_date phone')
      .populate('doctor_id', 'first_name last_name specialty')
      .populate('approved_by', 'first_name last_name')
      .sort({ created_at: -1 })

    res.json({ success: true, data: requests })
  } catch (err) {
    next(err)
  }
})

// PUT /:id/approve — Reception approves and creates actual admission
router.put('/:id/approve', authenticate, authorize('receptionist', 'admin', 'chief_doctor'), async (req, res, next) => {
  try {
    const request = await AdmissionRequest.findById(req.params.id)
      .populate('patient_id', 'first_name last_name patient_number')

    if (!request) return res.status(404).json({ success: false, message: 'So\'rov topilmadi' })
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'So\'rov allaqachon ko\'rib chiqilgan' })
    }

    const { room_id, bed_number, notes } = req.body
    if (!room_id || bed_number === undefined || bed_number === null) {
      return res.status(400).json({ success: false, message: 'Xona va koyka raqami majburiy' })
    }

    // Check existing active admission
    const existingAdmission = await Admission.findOne({ patient_id: request.patient_id, status: 'active' })
    if (existingAdmission) {
      return res.status(400).json({ success: false, message: 'Bu bemor allaqachon yotqizilgan' })
    }

    const room = await AmbulatorRoom.findById(room_id)
    if (!room) return res.status(404).json({ success: false, message: 'Xona topilmadi' })

    let bed = await Bed.findOne({ room_id, bed_number })
    if (!bed) {
      bed = new Bed({ room_id, bed_number, daily_price: 200000, status: 'available' })
      await bed.save()
    }
    if (bed.status === 'occupied') {
      return res.status(400).json({ success: false, message: 'Bu koyka band' })
    }

    // Create admission
    const admission = await Admission.create({
      patient_id: request.patient_id._id || request.patient_id,
      room_id,
      bed_number,
      bed_id: bed._id,
      bed_daily_price: bed.daily_price || 200000,
      admission_type: room.department === 'ambulator' ? 'outpatient' : 'inpatient',
      diagnosis: request.diagnosis || '',
      notes: notes || '',
      admitted_by: req.user._id,
      admission_date: new Date(),
      status: 'active'
    })

    // Update bed
    bed.status = 'occupied'
    bed.current_patient_id = request.patient_id._id || request.patient_id
    bed.current_admission_id = admission._id
    bed.occupied_at = new Date()
    await bed.save()

    // Update room if all beds occupied
    const allBeds = await Bed.find({ room_id })
    if (allBeds.every(b => b.status === 'occupied')) {
      room.status = 'occupied'
      await room.save()
    }

    // Update TreatmentSchedule and Tasks
    try {
      const TreatmentSchedule = (await import('../models/TreatmentSchedule.js')).default
      const Task = (await import('../models/Task.js')).default
      const pid = request.patient_id._id || request.patient_id
      await TreatmentSchedule.updateMany(
        { patient_id: pid, status: 'pending', admission_id: null },
        { $set: { admission_id: admission._id } }
      )
      await Task.updateMany(
        { patient_id: pid, status: 'pending', admission_id: null },
        { $set: { admission_id: admission._id } }
      )
    } catch {}

    // Update request status
    request.status = 'approved'
    request.approved_by = req.user._id
    request.approved_at = new Date()
    request.admission_id = admission._id
    await request.save()

    // Notify doctor via socket
    if (global.io) {
      const patientName = request.patient_id?.first_name
        ? `${request.patient_id.first_name} ${request.patient_id.last_name}`
        : ''
      global.io.emit('admission_request_approved', {
        requestId: request._id.toString(),
        doctor_id: request.doctor_id.toString(),
        patient: patientName,
        room_number: room.room_number,
        bed_number,
        timestamp: new Date()
      })
      global.io.emit('new-admission', {
        admissionId: admission._id.toString(),
        patientId: admission.patient_id.toString(),
        patientName,
        roomNumber: room.room_number,
        bedNumber: bed_number,
        floor: room.floor || 0,
        diagnosis: request.diagnosis || '',
        timestamp: new Date()
      })
    }

    res.json({
      success: true,
      message: 'Bemor muvaffaqiyatli yotqizildi',
      data: { request, admission }
    })
  } catch (err) {
    next(err)
  }
})

// PUT /:id/reject — Reject request
router.put('/:id/reject', authenticate, authorize('receptionist', 'admin', 'chief_doctor', 'doctor'), async (req, res, next) => {
  try {
    const request = await AdmissionRequest.findById(req.params.id)
    if (!request) return res.status(404).json({ success: false, message: 'So\'rov topilmadi' })
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'So\'rov allaqachon ko\'rib chiqilgan' })
    }

    const role = (req.user.role_name || req.user.role || '').toLowerCase()
    // Doctor can only reject own request
    if (['doctor', 'chief_doctor'].includes(role) &&
        request.doctor_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Ruxsat yo\'q' })
    }

    request.status = 'rejected'
    request.rejected_by = req.user._id
    request.rejected_at = new Date()
    request.rejection_reason = req.body.reason || ''
    await request.save()

    if (global.io) {
      global.io.emit('admission_request_rejected', {
        requestId: request._id.toString(),
        doctor_id: request.doctor_id.toString(),
        reason: req.body.reason || ''
      })
    }

    res.json({ success: true, message: 'So\'rov rad etildi' })
  } catch (err) {
    next(err)
  }
})

export default router

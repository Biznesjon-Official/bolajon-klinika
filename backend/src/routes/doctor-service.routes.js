import express from 'express'
import DoctorService from '../models/DoctorService.js'
import Staff from '../models/Staff.js'
import Service from '../models/Service.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = express.Router()

/**
 * Get all doctor-service mappings
 * GET /api/v1/doctor-services
 */
router.get('/', authenticate, authorize('admin', 'chief_doctor'), async (req, res) => {
  try {
    const { doctor_id, is_active } = req.query

    const filter = {}
    if (doctor_id) filter.doctor_id = doctor_id
    if (is_active !== undefined) filter.is_active = is_active === 'true'

    const doctorServices = await DoctorService.find(filter)
      .populate('doctor_id', 'first_name last_name specialization role')
      .populate('service_id', 'name category price')
      .populate('created_by', 'first_name last_name')
      .sort({ created_at: -1 })

    res.json({ success: true, data: doctorServices })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Xatolik yuz berdi', error: error.message })
  }
})

/**
 * Get services for specific doctor
 * GET /api/v1/doctor-services/doctor/:doctorId
 */
router.get('/doctor/:doctorId', authenticate, async (req, res) => {
  try {
    const { doctorId } = req.params

    const doctorServices = await DoctorService.find({ doctor_id: doctorId, is_active: true })
      .populate('service_id', 'name category price code')
      .sort({ created_at: -1 })

    res.json({ success: true, data: doctorServices })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Xatolik yuz berdi', error: error.message })
  }
})

/**
 * Get all doctors with their services (for management page)
 * GET /api/v1/doctor-services/doctors-list
 */
router.get('/doctors-list', authenticate, authorize('admin', 'chief_doctor'), async (req, res) => {
  try {
    const doctors = await Staff.find({ role: 'doctor', status: 'active' })
      .select('first_name last_name specialization')
      .sort({ first_name: 1 })

    res.json({ success: true, data: doctors })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Xatolik yuz berdi', error: error.message })
  }
})

/**
 * Get all available services (for dropdown)
 * GET /api/v1/doctor-services/services-list
 */
router.get('/services-list', authenticate, authorize('admin', 'chief_doctor'), async (req, res) => {
  try {
    const services = await Service.find({ is_active: true })
      .select('name category price code')
      .sort({ category: 1, name: 1 })

    res.json({ success: true, data: services })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Xatolik yuz berdi', error: error.message })
  }
})

/**
 * Create doctor-service mapping
 * POST /api/v1/doctor-services
 */
router.post('/', authenticate, authorize('admin', 'chief_doctor'), async (req, res) => {
  try {
    const { doctor_id, service_id, custom_price, revisit_rules } = req.body

    if (!doctor_id || !service_id || custom_price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Doktor, xizmat va narx majburiy'
      })
    }

    // Check doctor exists
    const doctor = await Staff.findOne({ _id: doctor_id, role: 'doctor' })
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doktor topilmadi' })
    }

    // Check service exists
    const service = await Service.findById(service_id)
    if (!service) {
      return res.status(404).json({ success: false, message: 'Xizmat topilmadi' })
    }

    // Check duplicate
    const existing = await DoctorService.findOne({ doctor_id, service_id })
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Bu doktorga ushbu xizmat allaqachon biriktirilgan'
      })
    }

    const doctorService = new DoctorService({
      doctor_id,
      service_id,
      custom_price: parseFloat(custom_price),
      revisit_rules: revisit_rules || undefined,
      created_by: req.user.id
    })

    await doctorService.save()

    const populated = await DoctorService.findById(doctorService._id)
      .populate('doctor_id', 'first_name last_name specialization')
      .populate('service_id', 'name category price')

    res.status(201).json({
      success: true,
      message: 'Xizmat doktorga biriktirildi',
      data: populated
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu doktorga ushbu xizmat allaqachon biriktirilgan'
      })
    }
    res.status(500).json({ success: false, message: 'Xatolik yuz berdi', error: error.message })
  }
})

/**
 * Update doctor-service
 * PUT /api/v1/doctor-services/:id
 */
router.put('/:id', authenticate, authorize('admin', 'chief_doctor'), async (req, res) => {
  try {
    const { id } = req.params
    const { custom_price, revisit_rules, is_active } = req.body

    const doctorService = await DoctorService.findById(id)
    if (!doctorService) {
      return res.status(404).json({ success: false, message: 'Topilmadi' })
    }

    if (custom_price !== undefined) doctorService.custom_price = parseFloat(custom_price)
    if (revisit_rules !== undefined) doctorService.revisit_rules = revisit_rules
    if (is_active !== undefined) doctorService.is_active = is_active

    await doctorService.save()

    const populated = await DoctorService.findById(id)
      .populate('doctor_id', 'first_name last_name specialization')
      .populate('service_id', 'name category price')

    res.json({
      success: true,
      message: 'Yangilandi',
      data: populated
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Xatolik yuz berdi', error: error.message })
  }
})

/**
 * Delete doctor-service
 * DELETE /api/v1/doctor-services/:id
 */
router.delete('/:id', authenticate, authorize('admin', 'chief_doctor'), async (req, res) => {
  try {
    const { id } = req.params

    const doctorService = await DoctorService.findById(id)
    if (!doctorService) {
      return res.status(404).json({ success: false, message: 'Topilmadi' })
    }

    await doctorService.deleteOne()

    res.json({ success: true, message: 'Xizmat olib tashlandi' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Xatolik yuz berdi', error: error.message })
  }
})

export default router

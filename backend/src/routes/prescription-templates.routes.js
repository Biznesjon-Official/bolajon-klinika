import express from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import PrescriptionTemplate from '../models/PrescriptionTemplate.js'

const router = express.Router()

// GET all active templates
router.get('/', authenticate, authorize('doctor', 'chief_doctor', 'admin'), async (req, res, next) => {
  try {
    const templates = await PrescriptionTemplate.find({ is_active: true })
      .populate('created_by', 'first_name last_name')
      .sort({ title: 1 })
    res.json({ success: true, data: templates })
  } catch (err) {
    next(err)
  }
})

// POST create template
router.post('/', authenticate, authorize('chief_doctor', 'admin'), async (req, res, next) => {
  try {
    const { title, diagnosis, medications, recommendations, notes } = req.body
    const template = await PrescriptionTemplate.create({
      title,
      diagnosis,
      medications,
      recommendations,
      notes,
      created_by: req.user._id
    })
    res.json({ success: true, data: template })
  } catch (err) {
    next(err)
  }
})

// PUT update template
router.put('/:id', authenticate, authorize('chief_doctor', 'admin'), async (req, res, next) => {
  try {
    const { title, diagnosis, medications, recommendations, notes } = req.body
    const template = await PrescriptionTemplate.findByIdAndUpdate(
      req.params.id,
      { title, diagnosis, medications, recommendations, notes },
      { new: true }
    )
    if (!template) return res.status(404).json({ success: false, message: 'Shablon topilmadi' })
    res.json({ success: true, data: template })
  } catch (err) {
    next(err)
  }
})

// DELETE soft delete
router.delete('/:id', authenticate, authorize('chief_doctor', 'admin'), async (req, res, next) => {
  try {
    const template = await PrescriptionTemplate.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true }
    )
    if (!template) return res.status(404).json({ success: false, message: 'Shablon topilmadi' })
    res.json({ success: true, message: "Shablon o'chirildi" })
  } catch (err) {
    next(err)
  }
})

export default router

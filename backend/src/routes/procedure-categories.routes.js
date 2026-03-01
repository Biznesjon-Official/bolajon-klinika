import express from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import ProcedureCategory from '../models/ProcedureCategory.js'
import Service from '../models/Service.js'

const router = express.Router()

// GET all categories
router.get('/', authenticate, async (req, res, next) => {
  try {
    const categories = await ProcedureCategory.find().sort({ name: 1 }).lean()
    res.json({ success: true, data: categories })
  } catch (error) {
    next(error)
  }
})

// POST create category
router.post('/', authenticate, authorize('admin', 'receptionist'), async (req, res, next) => {
  try {
    const { name, description, procedure_type } = req.body
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Nom majburiy' })

    const exists = await ProcedureCategory.findOne({ name: name.trim() })
    if (exists) return res.status(400).json({ success: false, message: 'Bu nom allaqachon mavjud' })

    const category = await ProcedureCategory.create({ name: name.trim(), description: description?.trim() || '', ...(procedure_type ? { procedure_type } : {}) })
    res.status(201).json({ success: true, data: category })
  } catch (error) {
    next(error)
  }
})

// PUT update category
router.put('/:id', authenticate, authorize('admin', 'receptionist'), async (req, res, next) => {
  try {
    const { name, description, procedure_type, is_active } = req.body
    const category = await ProcedureCategory.findById(req.params.id)
    if (!category) return res.status(404).json({ success: false, message: 'Bo\'lim topilmadi' })

    if (name) category.name = name.trim()
    if (description !== undefined) category.description = description.trim()
    if (procedure_type) category.procedure_type = procedure_type
    if (is_active !== undefined) category.is_active = is_active
    await category.save()

    res.json({ success: true, data: category })
  } catch (error) {
    next(error)
  }
})

// DELETE category
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const count = await Service.countDocuments({ procedure_category_id: req.params.id })
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Bu bo'limda ${count} ta muolaja bor. Avval ularni o'chiring.`
      })
    }
    await ProcedureCategory.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Bo\'lim o\'chirildi' })
  } catch (error) {
    next(error)
  }
})

// GET procedures by category
router.get('/:id/procedures', authenticate, async (req, res, next) => {
  try {
    const services = await Service.find({
      procedure_category_id: req.params.id,
      category: 'Muolaja'
    }).sort({ name: 1 }).lean()
    res.json({ success: true, data: services })
  } catch (error) {
    next(error)
  }
})

export default router

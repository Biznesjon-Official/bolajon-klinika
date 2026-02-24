import express from 'express'
import Disease from '../models/Disease.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// GET /diseases - barcha kasalliklar (doktor + chief_doctor)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search, category } = req.query
    const filter = { is_active: true }
    if (search) filter.name = { $regex: search, $options: 'i' }
    if (category) filter.category = category

    const diseases = await Disease.find(filter).sort({ name: 1 })
    res.json({ success: true, data: diseases })
  } catch (error) {
    next(error)
  }
})

// GET /diseases/categories - kategoriyalar
router.get('/categories', authenticate, async (req, res, next) => {
  try {
    const categories = await Disease.distinct('category', { is_active: true, category: { $ne: '' } })
    res.json({ success: true, data: categories })
  } catch (error) {
    next(error)
  }
})

// GET /diseases/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const disease = await Disease.findById(req.params.id)
    if (!disease) return res.status(404).json({ success: false, message: 'Kasallik topilmadi' })
    res.json({ success: true, data: disease })
  } catch (error) {
    next(error)
  }
})

// POST /diseases - yangi kasallik (chief_doctor)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, category, diagnoses, recommendations, can_be_secondary } = req.body
    if (!name) return res.status(400).json({ success: false, message: 'Kasallik nomi kiritilishi shart' })

    const disease = await Disease.create({
      name,
      category: category || '',
      diagnoses: diagnoses || [],
      recommendations: recommendations || [],
      can_be_secondary: can_be_secondary !== false,
      created_by: req.user._id || req.user.id
    })

    res.status(201).json({ success: true, data: disease, message: 'Kasallik qo\'shildi' })
  } catch (error) {
    next(error)
  }
})

// PUT /diseases/:id - yangilash
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { name, category, diagnoses, recommendations, can_be_secondary } = req.body
    const disease = await Disease.findByIdAndUpdate(
      req.params.id,
      { name, category, diagnoses, recommendations, can_be_secondary },
      { new: true }
    )
    if (!disease) return res.status(404).json({ success: false, message: 'Kasallik topilmadi' })
    res.json({ success: true, data: disease, message: 'Kasallik yangilandi' })
  } catch (error) {
    next(error)
  }
})

// DELETE /diseases/:id - o'chirish (soft)
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const disease = await Disease.findByIdAndUpdate(req.params.id, { is_active: false }, { new: true })
    if (!disease) return res.status(404).json({ success: false, message: 'Kasallik topilmadi' })
    res.json({ success: true, message: 'Kasallik o\'chirildi' })
  } catch (error) {
    next(error)
  }
})

export default router

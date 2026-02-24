import mongoose from 'mongoose'

const diseaseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    default: ''
  },
  // Tashxislar ro'yxati (checkbox uchun)
  diagnoses: [{
    text: { type: String, required: true },
    is_default: { type: Boolean, default: false }
  }],
  // Maslahatlar ro'yxati
  recommendations: [{
    text: { type: String, required: true },
    is_default: { type: Boolean, default: false }
  }],
  // Yondosh kasallik sifatida ham ishlatilishi mumkin
  can_be_secondary: {
    type: Boolean,
    default: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

diseaseSchema.index({ name: 'text', category: 'text' })
diseaseSchema.index({ is_active: 1 })

const Disease = mongoose.model('Disease', diseaseSchema)
export default Disease

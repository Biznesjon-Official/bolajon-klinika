import mongoose from 'mongoose'

const procedureCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true, default: '' },
  is_active: { type: Boolean, default: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

procedureCategorySchema.index({ name: 1 })

const ProcedureCategory = mongoose.model('ProcedureCategory', procedureCategorySchema)
export default ProcedureCategory

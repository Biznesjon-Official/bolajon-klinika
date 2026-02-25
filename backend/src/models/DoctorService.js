import mongoose from 'mongoose'

const revisitRuleSchema = new mongoose.Schema({
  min_days: { type: Number, required: true },
  max_days: { type: Number, required: true },
  discount_percent: { type: Number, required: true, min: 0, max: 100 }
}, { _id: false })

const doctorServiceSchema = new mongoose.Schema({
  doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  service_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  custom_price: {
    type: Number,
    required: true,
    min: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  revisit_rules: {
    type: [revisitRuleSchema],
    default: [
      { min_days: 0, max_days: 3, discount_percent: 100 },
      { min_days: 4, max_days: 7, discount_percent: 50 }
    ]
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

doctorServiceSchema.index({ doctor_id: 1, service_id: 1 }, { unique: true })
doctorServiceSchema.index({ doctor_id: 1, is_active: 1 })

const DoctorService = mongoose.model('DoctorService', doctorServiceSchema)

export default DoctorService

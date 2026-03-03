import mongoose from 'mongoose'

const prescriptionTemplateSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  diagnosis: { type: String },
  medications: [{
    medication_name: { type: String, required: true },
    dosage: { type: String },
    per_dose_amount: { type: String },
    frequency: { type: String },
    frequency_per_day: { type: Number },
    schedule_times: [{ type: String }],
    duration_days: { type: Number },
    instructions: { type: String },
    is_urgent: { type: Boolean, default: false }
  }],
  recommendations: [{ type: String }],
  notes: { type: String },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  is_active: { type: Boolean, default: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

prescriptionTemplateSchema.index({ title: 1 })
prescriptionTemplateSchema.index({ is_active: 1 })

export default mongoose.model('PrescriptionTemplate', prescriptionTemplateSchema)

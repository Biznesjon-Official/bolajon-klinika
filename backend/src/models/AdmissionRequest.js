import mongoose from 'mongoose'

const admissionRequestSchema = new mongoose.Schema({
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  admission_type: { type: String, enum: ['inpatient', 'ambulator'], required: true },
  diagnosis: { type: String },
  reason: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  approved_at: { type: Date },
  rejected_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  rejected_at: { type: Date },
  rejection_reason: { type: String },
  admission_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

admissionRequestSchema.index({ status: 1, created_at: -1 })
admissionRequestSchema.index({ patient_id: 1 })
admissionRequestSchema.index({ doctor_id: 1 })

export default mongoose.model('AdmissionRequest', admissionRequestSchema)

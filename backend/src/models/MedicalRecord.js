import mongoose from 'mongoose'

const medicalRecordSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  diagnosis_text: {
    type: String,
    required: true,
    trim: true
  },
  treatment_plan: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

medicalRecordSchema.index({ patient_id: 1, created_at: -1 })
medicalRecordSchema.index({ doctor_id: 1 })

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema, 'medical_records')

export default MedicalRecord

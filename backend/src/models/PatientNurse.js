import mongoose from 'mongoose';

const patientNurseSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  nurse_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  admission_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission',
    required: true
  },
  assigned_at: {
    type: Date,
    default: Date.now
  },
  unassigned_at: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'transferred'],
    default: 'active'
  },
  notes: {
    type: String
  },
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
patientNurseSchema.index({ patient_id: 1, status: 1 });
patientNurseSchema.index({ nurse_id: 1, status: 1 });
patientNurseSchema.index({ admission_id: 1 });

const PatientNurse = mongoose.model('PatientNurse', patientNurseSchema, 'patient_nurses');

export default PatientNurse;

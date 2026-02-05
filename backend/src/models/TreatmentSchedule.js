import mongoose from 'mongoose';

const treatmentScheduleSchema = new mongoose.Schema({
  prescription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription',
    required: true
  },
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  admission_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission'
  },
  nurse_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  medication_name: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  // Jadval ma'lumotlari
  frequency_per_day: {
    type: Number
  },
  schedule_times: [{
    type: String
  }],
  duration_days: {
    type: Number
  },
  scheduled_time: {
    type: Date,
    required: true
  },
  scheduled_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'missed', 'cancelled'],
    default: 'pending'
  },
  // Completion tracking
  total_doses: {
    type: Number,
    default: 0 // frequency_per_day * duration_days
  },
  completed_doses: {
    type: Number,
    default: 0
  },
  dose_history: [{
    completed_at: Date,
    completed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    },
    notes: String,
    used_medicines: [{
      medicine_id: mongoose.Schema.Types.ObjectId,
      name: String,
      quantity: Number,
      unit: String,
      unit_price: Number
    }]
  }],
  completed_at: {
    type: Date
  },
  completed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  completion_notes: {
    type: String
  },
  notes: {
    type: String
  },
  instructions: {
    type: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
treatmentScheduleSchema.index({ patient_id: 1, scheduled_date: 1 });
treatmentScheduleSchema.index({ nurse_id: 1, scheduled_date: 1, status: 1 });
treatmentScheduleSchema.index({ prescription_id: 1 });
treatmentScheduleSchema.index({ admission_id: 1 });
treatmentScheduleSchema.index({ scheduled_time: 1, status: 1 });

const TreatmentSchedule = mongoose.model('TreatmentSchedule', treatmentScheduleSchema, 'treatment_schedules');

export default TreatmentSchedule;

import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  prescription_number: {
    type: String,
    unique: true
  },
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
  nurse_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  queue_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Queue'
  },
  diagnosis: {
    type: String,
    required: true
  },
  prescription_type: {
    type: String,
    enum: ['REGULAR', 'URGENT', 'CHRONIC'],
    default: 'REGULAR'
  },
  medications: [{
    medication_name: {
      type: String,
      required: true
    },
    dosage: {
      type: String
    },
    per_dose_amount: {
      type: String
    },
    frequency: {
      type: String
    },
    frequency_per_day: {
      type: Number
    },
    schedule_times: [{
      type: String
    }],
    duration_days: {
      type: Number
    },
    instructions: {
      type: String
    },
    is_urgent: {
      type: Boolean,
      default: false
    }
  }],
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  issued_date: {
    type: Date,
    default: Date.now
  },
  expiry_date: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Auto-generate prescription number
prescriptionSchema.pre('save', async function() {
  if (!this.prescription_number) {
    const count = await mongoose.model('Prescription').countDocuments();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    this.prescription_number = `RX${year}${month}${String(count + 1).padStart(5, '0')}`;
  }
});

// Indexes
prescriptionSchema.index({ patient_id: 1 });
prescriptionSchema.index({ doctor_id: 1 });
prescriptionSchema.index({ prescription_number: 1 });
prescriptionSchema.index({ issued_date: -1 });

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;

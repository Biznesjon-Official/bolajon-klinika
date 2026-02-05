import mongoose from 'mongoose';

const admissionSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  room_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AmbulatorRoom',
    required: true
  },
  bed_number: {
    type: Number,
    required: true
  },
  bed_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bed'
  },
  admission_type: {
    type: String,
    enum: ['inpatient', 'outpatient'],
    default: 'inpatient'
  },
  admission_date: {
    type: Date,
    default: Date.now
  },
  discharge_date: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'discharged', 'transferred'],
    default: 'active'
  },
  diagnosis: {
    type: String
  },
  notes: {
    type: String
  },
  admitted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  // Koyka to'lovlari
  bed_daily_price: {
    type: Number,
    default: 0
  },
  total_days: {
    type: Number,
    default: 0
  },
  total_bed_charges: {
    type: Number,
    default: 0
  },
  bed_charges_invoice_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
admissionSchema.index({ patient_id: 1, status: 1 });
admissionSchema.index({ room_id: 1, status: 1 });
admissionSchema.index({ admission_date: -1 });

const Admission = mongoose.model('Admission', admissionSchema, 'admissions');

export default Admission;

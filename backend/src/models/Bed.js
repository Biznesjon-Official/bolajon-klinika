import mongoose from 'mongoose';

const bedSchema = new mongoose.Schema({
  room_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AmbulatorRoom',
    required: true
  },
  bed_number: {
    type: Number,
    required: true
  },
  daily_price: {
    type: Number,
    default: 0,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'cleaning', 'maintenance'],
    default: 'available'
  },
  current_patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  current_admission_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission'
  },
  occupied_at: {
    type: Date
  },
  released_at: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound unique index
bedSchema.index({ room_id: 1, bed_number: 1 }, { unique: true });
bedSchema.index({ status: 1 });
bedSchema.index({ current_patient_id: 1 });

const Bed = mongoose.model('Bed', bedSchema, 'beds');

export default Bed;

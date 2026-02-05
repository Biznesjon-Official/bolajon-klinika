import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema({
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
  queue_number: {
    type: Number,
    required: true
  },
  queue_type: {
    type: String,
    enum: ['NORMAL', 'URGENT', 'APPOINTMENT'],
    default: 'NORMAL'
  },
  status: {
    type: String,
    enum: ['WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'WAITING'
  },
  called_at: {
    type: Date
  },
  completed_at: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index'lar
queueSchema.index({ doctor_id: 1, createdAt: -1 });
queueSchema.index({ patient_id: 1 });
queueSchema.index({ status: 1 });
queueSchema.index({ createdAt: -1 });

const Queue = mongoose.model('Queue', queueSchema);

export default Queue;

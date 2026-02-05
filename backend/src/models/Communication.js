import mongoose from 'mongoose';

const communicationSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  recipient_name: {
    type: String
  },
  recipient_phone: {
    type: String
  },
  channel: {
    type: String,
    enum: ['sms', 'telegram', 'web', 'email'],
    default: 'sms'
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'read'],
    default: 'pending'
  },
  template_id: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  sent_at: {
    type: Date
  },
  delivered_at: {
    type: Date
  },
  read_at: {
    type: Date
  },
  error_message: {
    type: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
communicationSchema.index({ patient_id: 1 });
communicationSchema.index({ status: 1 });
communicationSchema.index({ channel: 1 });
communicationSchema.index({ created_at: -1 });

const Communication = mongoose.model('Communication', communicationSchema, 'communications');

export default Communication;
